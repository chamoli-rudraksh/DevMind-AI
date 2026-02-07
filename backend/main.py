from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from ingest import clone_and_scan
import os
from dotenv import load_dotenv
import json
import warnings
import sys

# Ensure we can import from the security folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from security.bandit_analyzer import run_bandit_analysis
from security.detect_secrets_analyzer import run_detect_secrets_analysis
from security.safety_analyzer import run_safety_analysis

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

# --- HELPER: Generate Markdown Report ---
def generate_security_report_markdown(issues):
    """
    Generates markdown content for SECURITY_REPORT.md based on the list of issues.
    """
    if not issues:
        return ""

    report_content = "# Security Report\n\n"
    report_content += "This report summarizes the security findings for the analyzed repository.\n\n"

    # Group issues by severity
    critical_issues = [i for i in issues if i.get('severity') == 'CRITICAL']
    high_issues = [i for i in issues if i.get('severity') == 'HIGH']
    medium_issues = [i for i in issues if i.get('severity') == 'MEDIUM']
    low_issues = [i for i in issues if i.get('severity') == 'LOW']
    
    # Catch-all for tools that use different severity names
    known_severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    other_issues = [i for i in issues if i.get('severity') not in known_severities]

    def add_section(issue_list, title):
        nonlocal report_content
        if issue_list:
            report_content += f"## {title} Issues\n\n"
            for issue in issue_list:
                report_content += f"### {issue.get('title', 'N/A')}\n"
                report_content += f"- **Severity:** {issue.get('severity', 'N/A')}\n"
                report_content += f"- **Location:** {issue.get('location', 'N/A')}\n"
                report_content += f"- **Description:** {issue.get('description', 'N/A')}\n\n"

    add_section(critical_issues, "CRITICAL")
    add_section(high_issues, "HIGH")
    add_section(medium_issues, "MEDIUM")
    add_section(low_issues, "LOW")
    add_section(other_issues, "OTHER")

    return report_content

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
    ensure_context(request.url)
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
    
    # 1. Run Bandit (Python Static Analysis)
    bandit_issues = []
    if CURRENT_REPO_PATH and os.path.exists(CURRENT_REPO_PATH):
        try:
            print(f"Running Bandit on {CURRENT_REPO_PATH}...")
            bandit_raw = run_bandit_analysis(CURRENT_REPO_PATH)
            for issue in bandit_raw:
                bandit_issues.append({
                    "severity": issue.get('severity', 'MEDIUM'),
                    "title": f"Bandit: {issue.get('title', 'Issue')}",
                    "location": issue.get('location', 'Unknown'),
                    "description": f"{issue.get('description', '')} (Confidence: {issue.get('confidence', 'Unknown')})"
                })
        except Exception as e:
            print(f"⚠️ Bandit failed: {e}")

    # 2. Run Detect-Secrets
    secrets_issues = []
    if CURRENT_REPO_PATH and os.path.exists(CURRENT_REPO_PATH):
        try:
            print(f"Running Detect-Secrets on {CURRENT_REPO_PATH}...")
            secrets_raw = run_detect_secrets_analysis(CURRENT_REPO_PATH)
            for issue in secrets_raw:
                secrets_issues.append({
                    "severity": "CRITICAL",
                    "title": f"Secret: {issue.get('title', 'Exposure')}",
                    "location": issue.get('location', 'Unknown'),
                    "description": issue.get('description', 'Potential hardcoded secret found.')
                })
        except Exception as e:
            print(f"⚠️ Detect-Secrets failed: {e}")

    # 3. Run Safety (Dependency Check)
    safety_issues = []
    if CURRENT_REPO_PATH and os.path.exists(CURRENT_REPO_PATH):
        try:
            print(f"Running Safety on {CURRENT_REPO_PATH}...")
            safety_raw = run_safety_analysis(CURRENT_REPO_PATH)
            for issue in safety_raw:
                safety_issues.append({
                    "severity": "HIGH",
                    "title": f"Safety: {issue.get('title', 'Vulnerable Dependency')}",
                    "location": issue.get('location', 'requirements.txt'),
                    "description": issue.get('description', '')
                })
        except Exception as e:
            print(f"⚠️ Safety failed: {e}")

    # 4. Run Gemini AI Analysis
    print("🤖 Asking AI...")
    prompt = f"""
    You are a Senior Security Engineer. Analyze the codebase below for security vulnerabilities.
    Focus on logic errors, missing authorizations, and bad practices that static tools might miss.
    
    CODEBASE CONTEXT:
    {context[:100000]}
    
    Return ONLY a JSON object with a key "issues" containing a list. 
    Each item must have: "severity" (CRITICAL, HIGH, MEDIUM, LOW), "title", "location", and "description".
    """

    ai_issues = []
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt
        )
        # Robust JSON cleaning
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        if json_str:
            ai_data = json.loads(json_str)
            ai_issues = ai_data.get("issues", [])
    except Exception as e:
        print(f"⚠️ AI Analysis failed: {e}")

    # 5. Combine & Report
    all_issues = bandit_issues + secrets_issues + safety_issues + ai_issues
    
    if all_issues and CURRENT_REPO_PATH:
        try:
            report_md = generate_security_report_markdown(all_issues)
            report_path = os.path.join(CURRENT_REPO_PATH, "SECURITY_REPORT.md")
            with open(report_path, "w", encoding="utf-8") as f:
                f.write(report_md)
            print(f"✅ Generated SECURITY_REPORT.md at {report_path}")
        except Exception as e:
            print(f"Error saving report: {e}")

    return {"issues": all_issues}

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