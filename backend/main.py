from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from ingest import clone_and_scan
import os
from dotenv import load_dotenv
import json
import sqlite3
import time
import subprocess

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. CONFIGURATION ---
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found. Check your .env file!")

genai.configure(api_key=api_key)

# Startup Check
print("\n🔍 CHECKING AVAILABLE MODELS...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"   ✅ {m.name}")
except:
    pass

# Use the standard free model
model = genai.GenerativeModel('gemini-flash-lite-latest')

# --- 2. SMART PERSISTENT CACHE ---
DB_FILE = "api_cache.db"

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS responses (
                cache_key TEXT PRIMARY KEY,
                data TEXT,
                timestamp REAL
            )
        """)

def get_latest_commit_hash(repo_url):
    """
    Pings the remote git server to get the latest Commit Hash.
    This allows us to invalidate the cache if the repo has changed.
    """
    try:
        # git ls-remote returns the hash of the HEAD commit without downloading
        result = subprocess.check_output(
            ["git", "ls-remote", repo_url, "HEAD"], 
            stderr=subprocess.STDOUT,
            timeout=5
        ).decode().split()[0]
        return result
    except Exception as e:
        print(f"⚠️ Could not get git hash (Offline?): {e}")
        return "latest" # Fallback if offline

def get_smart_cache_key(prefix, repo_url):
    """Generates a key that changes automatically when the repo updates."""
    commit_hash = get_latest_commit_hash(repo_url)
    return f"{prefix}_{repo_url}_{commit_hash}"

def get_cached_response(key: str):
    try:
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.execute("SELECT data FROM responses WHERE cache_key = ?", (key,))
            row = cursor.fetchone()
            if row:
                print(f"⚡ Smart Cache Hit: {key}")
                return json.loads(row[0])
    except Exception:
        pass
    return None

def save_to_cache(key: str, data: dict):
    try:
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO responses (cache_key, data, timestamp) VALUES (?, ?, ?)",
                (key, json.dumps(data), time.time())
            )
    except Exception:
        pass

init_db()

# --- Helper State ---
CURRENT_CODE_CONTEXT = ""
CURRENT_REPO_URL = ""

def ensure_context(url):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL
    if url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
        print(f"📂 Cloning: {url}")
        CURRENT_CODE_CONTEXT = clone_and_scan(url)
        CURRENT_REPO_URL = url
    return CURRENT_CODE_CONTEXT

# --- Request Models ---
class OverviewRequest(BaseModel):
    url: str

class SecurityRequest(BaseModel):
    repo_url: str

class RepoRequest(BaseModel):
    url: str
    doc_type: str = "README.md"

class ChatRequest(BaseModel):
    message: str
    repo_url: str

# --- ROUTES ---

@app.post("/structure")
async def get_project_structure(request: OverviewRequest):
    """Returns the file tree (Local only, no AI)."""
    ensure_context(request.url)
    
    ignore_dirs = {'.git', 'node_modules', '__pycache__', 'dist', 'build', 'venv', '.idea', '.vscode'}
    
    def build_tree(path):
        name = os.path.basename(path)
        item = {"name": name, "type": "file"}
        
        if os.path.isdir(path):
            item["type"] = "folder"
            item["children"] = []
            try:
                for entry in sorted(os.scandir(path), key=lambda e: (not e.is_dir(), e.name.lower())):
                    if entry.name in ignore_dirs: continue
                    item["children"].append(build_tree(entry.path))
            except PermissionError: pass
        return item

    repo_path = "temp_repo"
    if not os.path.exists(repo_path):
        return {"error": "Repo not found"}
        
    tree = build_tree(repo_path)
    return {"structure": tree.get("children", [])}

@app.post("/api/analyze-security")
async def analyze_security(request: SecurityRequest):
    # SMART CACHE: Uses Commit Hash
    cache_key = get_smart_cache_key("security", request.repo_url)
    
    cached = get_cached_response(cache_key)
    if cached: return cached

    context = ensure_context(request.repo_url)

    prompt = f"""
    You are a Senior Security Engineer. Analyze the codebase below for security vulnerabilities.
    Focus on: Hardcoded secrets, SQL injection, XSS, dangerous dependencies.
    
    CODEBASE CONTEXT:
    {context[:100000]}
    
    Return ONLY a JSON object with a key "issues" containing a list. 
    Each item must have: "severity" (CRITICAL, HIGH, MEDIUM, LOW), "title", "location", and "description".
    Do not use Markdown.
    """

    try:
        response = model.generate_content(prompt)
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(json_str)
        save_to_cache(cache_key, data)
        return data

    except Exception as e:
        print(f"Security Scan Error: {e}")
        return {"issues": []}

@app.post("/overview")
async def get_repo_overview(request: OverviewRequest):
    # SMART CACHE: Uses Commit Hash
    cache_key = get_smart_cache_key("overview", request.url)
    
    cached = get_cached_response(cache_key)
    if cached: return cached

    context = ensure_context(request.url)

    prompt = f"""
    You are a Senior Tech Lead. Analyze the codebase below and return a Strict JSON summary.
    Required JSON Structure:
    {{
        "description": "Summary",
        "tech_stack": ["List"],
        "key_features": ["List"],
        "stats": {{ "files": "count", "complexity": "Low/Medium/High" }}
    }}
    Context: {context[:100000]}
    """
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_text)
        save_to_cache(cache_key, data)
        return data
    except Exception:
        return {
            "description": "Analysis Failed (Busy). Try again.",
            "tech_stack": [],
            "key_features": [],
            "stats": {"files": "?", "complexity": "?"}
        }

@app.post("/chat")
async def chat_with_repo(request: ChatRequest):
    context = ensure_context(request.repo_url)
    prompt = f"Answer: {request.message}. Code: {context[:50000]}"
    try:
        response = model.generate_content(prompt)
        return {"response": response.text}
    except Exception:
        return {"response": "System Overload (Rate Limit). Please wait 30s."}

@app.post("/generate")
async def generate_docs(request: RepoRequest):
    context = ensure_context(request.url)
    prompt = f"Generate {request.doc_type}. Context: {context[:50000]}"
    try:
        response = model.generate_content(prompt)
        return {"markdown": response.text}
    except Exception as e:
        return {"markdown": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)