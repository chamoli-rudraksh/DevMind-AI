from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from ingest import clone_and_scan
import os
from dotenv import load_dotenv
import json
import warnings

warnings.filterwarnings("ignore")
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found.")

client = genai.Client(api_key=api_key)

# --- GLOBAL STATE ---
CURRENT_CODE_CONTEXT = ""
CURRENT_REPO_URL = ""
CURRENT_REPO_PATH = ""  # New: Tracks the active folder path

def ensure_context(url):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL, CURRENT_REPO_PATH
    
    if url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
        print(f"🔄 Switching context to: {url}")
        
        # Calling the updated ingest function
        code, path = clone_and_scan(url)
        
        if path is None: # Clone failed
            print("❌ Clone failed!")
            CURRENT_CODE_CONTEXT = "Error: Repository could not be cloned."
            CURRENT_REPO_PATH = "" 
        else:
            CURRENT_CODE_CONTEXT = code
            CURRENT_REPO_PATH = path # Save the new unique path
            CURRENT_REPO_URL = url
            
    return CURRENT_CODE_CONTEXT

# --- MODELS ---
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
    # Ensure we have the latest path
    ensure_context(request.url)
    
    # Use the ACTIVE path, not "temp_repo"
    repo_path = CURRENT_REPO_PATH
    
    if not repo_path or not os.path.exists(repo_path):
        return {"structure": [{"name": "Error: Repo not found", "type": "file"}]}
    
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

    tree = build_tree(repo_path)
    return {"structure": tree.get("children", [])}

@app.post("/api/analyze-security")
async def analyze_security(request: SecurityRequest):
    context = ensure_context(request.repo_url)
    if "Error:" in context[:100]: return {"issues": []}

    print("🛡️  Running Security Analysis...")
    prompt = f"""
    You are a Senior Security Engineer. Analyze the codebase below for security vulnerabilities.
    Focus on: Hardcoded secrets, SQL injection, XSS, dangerous dependencies.
    
    CODEBASE CONTEXT:
    {context[:100000]}
    
    Return ONLY a JSON object with a key "issues" containing a list. 
    Each item must have: "severity" (CRITICAL, HIGH, MEDIUM, LOW), "title", "location", and "description".
    """

    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt
        )
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(json_str)
    except Exception as e:
        print(f"Error: {e}")
        return {"issues": []}

@app.post("/overview")
async def get_repo_overview(request: OverviewRequest):
    context = ensure_context(request.url)
    
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
            model='gemini-flash-latest',
            contents=prompt
        )
        return json.loads(response.text.replace('```json', '').replace('```', '').strip())
    except Exception:
        return {"description": "Analysis Failed.", "tech_stack": [], "key_features": [], "stats": {}}

@app.post("/chat")
async def chat_with_repo(request: ChatRequest):
    context = ensure_context(request.repo_url)
    print(f"💬 Chatting...")
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=f"Answer: {request.message}. Code: {context[:50000]}"
        )
        return {"response": response.text}
    except Exception:
        return {"response": "Error processing chat."}

@app.post("/generate")
async def generate_docs(request: RepoRequest):
    context = ensure_context(request.url)
    print(f"📝 Generating {request.doc_type}...")
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=f"Generate {request.doc_type}. Context: {context[:50000]}"
        )
        return {"markdown": response.text}
    except Exception as e:
        return {"markdown": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)