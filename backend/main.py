from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from ingest import clone_and_scan
import os
from dotenv import load_dotenv
import json
import warnings

# Suppress minor warnings
warnings.filterwarnings("ignore")

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

# Initialize the Client
client = genai.Client(api_key=api_key)

# --- 2. IN-MEMORY STATE (No Database) ---
# We keep the code in RAM only while the server is running.
# If you restart the server, it clears.
CURRENT_CODE_CONTEXT = ""
CURRENT_REPO_URL = ""

def ensure_context(url):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL
    # Only clone if it's a new URL or we haven't cloned yet
    if url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
        print(f"📂 Cloning and Scanning: {url}")
        CURRENT_CODE_CONTEXT = clone_and_scan(url)
        CURRENT_REPO_URL = url
    return CURRENT_CODE_CONTEXT

# --- 3. REQUEST MODELS ---
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

# --- 4. ROUTES ---

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
    # 1. Get Code
    context = ensure_context(request.repo_url)

    # 2. Ask Gemini
    print("🛡️  Running Security Analysis...")
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
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        
        # Clean response
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(json_str)

    except Exception as e:
        print(f"Security Scan Error: {e}")
        return {"issues": []}

@app.post("/overview")
async def get_repo_overview(request: OverviewRequest):
    # 1. Get Code
    context = ensure_context(request.url)

    # 2. Ask Gemini
    print("📊 Generating Overview...")
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
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception:
        return {
            "description": "Analysis Failed. Try again.",
            "tech_stack": [],
            "key_features": [],
            "stats": {"files": "?", "complexity": "?"}
        }

@app.post("/chat")
async def chat_with_repo(request: ChatRequest):
    context = ensure_context(request.repo_url)
    print(f"💬 Chatting: {request.message[:20]}...")
    
    prompt = f"Answer: {request.message}. Code: {context[:50000]}"
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return {"response": response.text}
    except Exception:
        return {"response": "System Overload. Please wait."}

@app.post("/generate")
async def generate_docs(request: RepoRequest):
    context = ensure_context(request.url)
    print(f"📝 Generating {request.doc_type}...")
    
    prompt = f"Generate {request.doc_type}. Context: {context[:50000]}"
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return {"markdown": response.text}
    except Exception as e:
        return {"markdown": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)