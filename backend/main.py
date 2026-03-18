from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
import requests
from ingest import clone_and_scan
import os
import git
import subprocess
from dotenv import load_dotenv
import json
import warnings
import re
from datetime import datetime
from collections import Counter, defaultdict
from threading import Lock

from security.bandit_analyzer import run_bandit_analysis
from security.detect_secrets_analyzer import run_detect_secrets_analysis
from security.safety_analyzer import run_safety_analysis

warnings.filterwarnings("ignore")
load_dotenv()

# Add venv/bin to PATH to ensure subprocess calls find bandit, detect-secrets etc.
venv_bin = os.path.join(os.path.dirname(__file__), "venv", "bin")
if os.path.exists(venv_bin):
    os.environ["PATH"] = venv_bin + os.pathsep + os.environ.get("PATH", "")

app = FastAPI(title="DevMind AI API", version="1.0.0")

# CORS - configurable via environment variable
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL STATE ---
CURRENT_CODE_CONTEXT = ""
CURRENT_REPO_URL = ""
CURRENT_REPO_PATH = ""
CONTEXT_LOCK = Lock()
AI_LOCK = Lock()
ANALYSIS_CACHE = {}


def is_valid_github_url(url: str) -> bool:
    return bool(re.match(r"^https?://github\.com/[\w\-\.]+/[\w\-\.]+", url))


def is_local_path(url: str) -> bool:
    return url.startswith("/") or url.startswith("./") or url.startswith("~")


def ensure_context(url: str):
    global CURRENT_CODE_CONTEXT, CURRENT_REPO_URL, CURRENT_REPO_PATH

    with CONTEXT_LOCK:
        if url != CURRENT_REPO_URL or not CURRENT_CODE_CONTEXT:
            # check again in case another thread just finished it
            if url == CURRENT_REPO_URL and CURRENT_CODE_CONTEXT:
                 return CURRENT_CODE_CONTEXT
                 
            print(f"🔄 Switching context to: {url}")
            code, path = clone_and_scan(url)
    
            if path is None:
                print("❌ Clone failed!")
                CURRENT_CODE_CONTEXT = "Error: Repository could not be cloned."
                CURRENT_REPO_PATH = ""
            else:
                CURRENT_CODE_CONTEXT = code
                CURRENT_REPO_PATH = path
                CURRENT_REPO_URL = url
    
    return CURRENT_CODE_CONTEXT


def ai_generate(prompt: str, is_json: bool = False):
    """Helper to call Ollama via local REST API with sequential locking."""
    with AI_LOCK:
        try:
            payload = {
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False
            }
            if is_json:
                payload["format"] = "json"
    
            response = requests.post(
                "http://localhost:11434/api/generate",
                json=payload,
                timeout=180
            )
            response.raise_for_status()
            return response.json().get("response")
        except Exception as e:
            print(f"Ollama error: {e}")
            return None


# --- MODELS ---
class OverviewRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        return v.strip()


class SecurityRequest(BaseModel):
    repo_url: str

    @field_validator("repo_url")
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        return v.strip()


class RepoRequest(BaseModel):
    url: str
    doc_type: str = "README.md"

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        return v.strip()


class ChatRequest(BaseModel):
    message: str
    repo_url: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class QualityRequest(BaseModel):
    repo_url: str


class TestGenRequest(BaseModel):
    repo_url: str
    framework: str = "auto"


class GitInsightsRequest(BaseModel):
    repo_url: str


# --- ROUTES ---


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "ai_enabled": True,
        "version": "1.0.0",
    }


@app.post("/structure")
def get_project_structure(request: OverviewRequest):
    ensure_context(request.url)
    repo_path = CURRENT_REPO_PATH

    if not repo_path or not os.path.exists(repo_path):
        return {"structure": [{"name": "Error: Repo not found", "type": "file"}]}

    ignore_dirs = {
        ".git",
        "node_modules",
        "__pycache__",
        "dist",
        "build",
        "venv",
        ".idea",
        ".vscode",
        ".mypy_cache",
        ".pytest_cache",
        "coverage",
        ".next",
    }

    def build_tree(path):
        name = os.path.basename(path)
        item = {"name": name, "type": "file"}

        if os.path.isdir(path):
            item["type"] = "folder"
            item["children"] = []
            try:
                for entry in sorted(
                    os.scandir(path), key=lambda e: (not e.is_dir(), e.name.lower())
                ):
                    if entry.name in ignore_dirs:
                        continue
                    item["children"].append(build_tree(entry.path))
            except PermissionError:
                pass
        return item

    tree = build_tree(repo_path)
    return {"structure": tree.get("children", [])}


@app.post("/api/analyze-security")
def analyze_security(request: SecurityRequest):
    context = ensure_context(request.repo_url)
    if "Error:" in context[:100]:
        return {"issues": []}

    cache_key = f"security_{request.repo_url}"
    if cache_key in ANALYSIS_CACHE:
        print("🛡️  Returning Cached Security Analysis...")
        return ANALYSIS_CACHE[cache_key]

    print("🛡️  Running Security Analysis...")

    bandit_issues = []
    if CURRENT_REPO_PATH and os.path.exists(CURRENT_REPO_PATH):
        bandit_issues_raw = run_bandit_analysis(CURRENT_REPO_PATH)
        for issue in bandit_issues_raw:
            bandit_issues.append(
                {
                    "severity": issue["severity"],
                    "title": f"Bandit: {issue['title']}",
                    "location": issue["location"],
                    "description": f"{issue['description']} (Confidence: {issue['confidence']})",
                }
            )

    secrets_issues = []
    if CURRENT_REPO_PATH and os.path.exists(CURRENT_REPO_PATH):
        secrets_issues_raw = run_detect_secrets_analysis(CURRENT_REPO_PATH)
        for issue in secrets_issues_raw:
            secrets_issues.append(
                {
                    "severity": issue["severity"],
                    "title": f"Secret: {issue['title']}",
                    "location": issue["location"],
                    "description": issue["description"],
                }
            )

    safety_issues = []
    if CURRENT_REPO_PATH and os.path.exists(CURRENT_REPO_PATH):
        safety_issues_raw = run_safety_analysis(CURRENT_REPO_PATH)
        for issue in safety_issues_raw:
            safety_issues.append(
                {
                    "severity": issue["severity"],
                    "title": f"Safety: {issue['title']}",
                    "location": issue["location"],
                    "description": issue["description"],
                }
            )

    ai_issues = []
    prompt = f"""
    You are a Senior Security Engineer. Analyze the codebase below for security vulnerabilities.
    Focus on: Hardcoded secrets, SQL injection, XSS, CSRF, insecure deserialization, dangerous dependencies.

    CODEBASE CONTEXT:
    {context[:5000]}

    Return ONLY a JSON object with a key "issues" containing a list.
    Each item must have: "severity" (CRITICAL, HIGH, MEDIUM, LOW), "title", "location", and "description".
    Return at most 10 AI-detected issues. If none found, return {{"issues": []}}.
    """
    raw = ai_generate(prompt, is_json=True)
    if raw:
        try:
            json_str = raw.replace("```json", "").replace("```", "").strip()
            ai_issues = json.loads(json_str).get("issues", [])
        except Exception:
            pass

    all_issues = bandit_issues + secrets_issues + safety_issues + ai_issues

    if all_issues and CURRENT_REPO_PATH:
        report_markdown = generate_security_report_markdown(all_issues)
        report_path = os.path.join(CURRENT_REPO_PATH, "SECURITY_REPORT.md")
        try:
            with open(report_path, "w") as f:
                f.write(report_markdown)
        except IOError:
            pass

    result = {"issues": all_issues}
    ANALYSIS_CACHE[cache_key] = result
    return result


@app.post("/overview-fast")
def get_fast_overview(request: OverviewRequest):
    """Return instant file stats without calling AI. Responds in <100ms."""
    context = ensure_context(request.url)
    repo_path = CURRENT_REPO_PATH

    if not repo_path or not os.path.exists(repo_path):
        return {"total_files": 0, "total_lines": 0, "languages": {}, "complexity": "Unknown"}

    ignore_dirs = {".git", "node_modules", "__pycache__", "dist", "build", "venv",
                   ".idea", ".vscode", ".mypy_cache", ".pytest_cache", "coverage", ".next"}

    lang_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
        ".jsx": "JavaScript", ".java": "Java", ".cpp": "C++", ".c": "C", ".h": "C/C++",
        ".go": "Go", ".rs": "Rust", ".rb": "Ruby", ".html": "HTML", ".css": "CSS",
        ".scss": "SCSS", ".json": "JSON", ".md": "Markdown", ".yml": "YAML",
        ".yaml": "YAML", ".sql": "SQL", ".sh": "Shell", ".vue": "Vue",
        ".svelte": "Svelte", ".xml": "XML", ".toml": "TOML", ".graphql": "GraphQL",
    }

    total_files = 0
    total_lines = 0
    languages = Counter()

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in lang_map:
                total_files += 1
                lang = lang_map[ext]
                try:
                    fp = os.path.join(root, f)
                    with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                        lines = sum(1 for _ in fh)
                        total_lines += lines
                        languages[lang] += lines
                except Exception:
                    pass

    complexity = "Low" if total_lines < 5000 else "Medium" if total_lines < 20000 else "High"

    # Top languages by line count
    top_langs = dict(languages.most_common(8))

    return {
        "total_files": total_files,
        "total_lines": total_lines,
        "languages": top_langs,
        "complexity": complexity,
    }


@app.post("/overview")
def get_repo_overview(request: OverviewRequest):
    context = ensure_context(request.url)

    cache_key = f"overview_{request.url}"
    if cache_key in ANALYSIS_CACHE:
        print("📊 Returning Cached Overview...")
        return ANALYSIS_CACHE[cache_key]

    print("📊 Generating Overview...")
    prompt = f"""Analyze this codebase. Return JSON:
{{
    "description": "2-3 sentence summary",
    "tech_stack": ["tech1", "tech2"],
    "key_features": ["feature1", "feature2"]
}}
Codebase:
{context[:3000]}
Return ONLY valid JSON."""

    raw = ai_generate(prompt, is_json=True)
    if raw:
        try:
            result = json.loads(raw.replace("```json", "").replace("```", "").strip())
            ANALYSIS_CACHE[cache_key] = result
            return result
        except Exception:
            pass
    return {
        "description": "Analysis failed. Please check if your local Ollama is running.",
        "tech_stack": [],
        "key_features": [],
    }


@app.post("/chat")
def chat_with_repo(request: ChatRequest):
    context = ensure_context(request.repo_url)
    print(f"💬 Chatting: {request.message[:50]}...")

    prompt = f"""You are an expert code assistant that has fully analyzed a codebase.
Answer the user's question based on the codebase context below.
Be specific, concise, and use markdown formatting with code blocks where helpful.

User question: {request.message}

Codebase context:
{context[:5000]}"""

    raw = ai_generate(prompt)
    return {"response": raw or "I couldn't generate a response. Please check your local Ollama instance."}


@app.post("/generate")
def generate_docs(request: RepoRequest):
    context = ensure_context(request.url)
    print(f"📝 Generating {request.doc_type}...")

    doc_prompts = {
        "README.md": "Generate a professional, comprehensive README.md with badges, installation, usage examples, and contributing guide.",
        "CONTRIBUTING.md": "Generate a detailed CONTRIBUTING.md with setup instructions, PR process, coding standards, and commit message format.",
        "ARCHITECTURE.md": "Generate a technical ARCHITECTURE.md documenting system design, component interactions, data flow, and technical decisions.",
        "API.md": "Generate a comprehensive API.md documenting all endpoints, request/response schemas, authentication, and usage examples.",
    }

    instruction = doc_prompts.get(request.doc_type, f"Generate {request.doc_type}")
    prompt = f"""{instruction}
Output only the markdown content, no additional commentary.

Codebase context:
{context[:5000]}"""

    raw = ai_generate(prompt)
    return {"markdown": raw or f"# {request.doc_type}\n\nGeneration failed."}


@app.post("/api/analyze-quality")
def analyze_code_quality(request: QualityRequest):
    """Analyze code quality metrics using AI."""
    context = ensure_context(request.repo_url)
    if "Error:" in context[:100]:
        return {"error": "Could not load repository"}

    cache_key = f"quality_{request.repo_url}"
    if cache_key in ANALYSIS_CACHE:
        print("🔍 Returning Cached Code Quality...")
        return ANALYSIS_CACHE[cache_key]

    print("🔍 Analyzing Code Quality...")

    prompt = f"""You are a senior software engineer reviewing code quality.
Analyze this codebase and return a JSON object with the following structure:
{{
    "overall_score": <number 0-100>,
    "grade": "<A/B/C/D/F>",
    "summary": "<2-3 sentence summary>",
    "metrics": {{
        "maintainability": {{ "score": <0-100>, "label": "<Excellent/Good/Fair/Poor>", "notes": "<brief note>" }},
        "complexity": {{ "score": <0-100>, "label": "<Low/Medium/High/Very High>", "notes": "<brief note>" }},
        "test_coverage_estimate": {{ "score": <0-100>, "label": "<Excellent/Good/Fair/None>", "notes": "<brief note>" }},
        "documentation": {{ "score": <0-100>, "label": "<Excellent/Good/Fair/Poor>", "notes": "<brief note>" }},
        "code_duplication": {{ "score": <0-100>, "label": "<Low/Medium/High>", "notes": "<brief note>" }},
        "security_posture": {{ "score": <0-100>, "label": "<Strong/Moderate/Weak>", "notes": "<brief note>" }}
    }},
    "top_issues": ["<issue 1>", "<issue 2>", "<issue 3>"],
    "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}}

Codebase:
{context[:5000]}

Return ONLY valid JSON."""

    raw = ai_generate(prompt, is_json=True)
    if raw:
        try:
            result = json.loads(raw.replace("```json", "").replace("```", "").strip())
            ANALYSIS_CACHE[cache_key] = result
            return result
        except Exception:
            pass
    return {"error": "Quality analysis failed"}


@app.post("/api/generate-tests")
def generate_tests(request: TestGenRequest):
    """Generate unit tests for the analyzed codebase."""
    context = ensure_context(request.repo_url)
    if "Error:" in context[:100]:
        return {"error": "Could not load repository"}

    print(f"🧪 Generating Tests (framework: {request.framework})...")

    framework_hint = ""
    if request.framework != "auto":
        framework_hint = f"Use the {request.framework} testing framework."
    else:
        framework_hint = "Auto-detect the appropriate testing framework based on the language/stack."

    prompt = f"""You are an expert test engineer. Generate comprehensive unit tests for this codebase.
{framework_hint}

Rules:
- Generate tests for the most important functions and classes
- Include edge cases and error cases
- Use proper test structure (describe/it blocks or test functions)
- Add comments explaining what each test does
- Make tests realistic and runnable

Return a JSON object:
{{
    "framework": "<detected framework name>",
    "language": "<primary language>",
    "files": [
        {{
            "filename": "<test filename>",
            "description": "<what this test file covers>",
            "code": "<full test code>"
        }}
    ],
    "setup_instructions": "<brief setup instructions to run these tests>"
}}

Codebase:
{context[:5000]}

Return ONLY valid JSON."""

    raw = ai_generate(prompt, is_json=True)
    if raw:
        try:
            return json.loads(raw.replace("```json", "").replace("```", "").strip())
        except Exception:
            pass
    return {"error": "Test generation failed"}


@app.post("/api/git-insights")
def get_git_insights(request: GitInsightsRequest):
    """Analyze git history for insights."""
    context = ensure_context(request.repo_url)
    repo_path = CURRENT_REPO_PATH

    if not repo_path or not os.path.exists(repo_path):
        return {"error": "Repository not found"}

    cache_key = f"git_insights_{request.repo_url}"
    if cache_key in ANALYSIS_CACHE:
        print("📈 Returning Cached Git Insights...")
        return ANALYSIS_CACHE[cache_key]

    print("📈 Analyzing Git History...")

    insights = {
        "total_commits": 0,
        "contributors": [],
        "recent_commits": [],
        "most_changed_files": [],
        "commit_frequency": [],
        "first_commit": None,
        "last_commit": None,
    }

    try:
        repo = git.Repo(repo_path)

        # Basic stats
        commits = list(repo.iter_commits(max_count=200))
        insights["total_commits"] = len(commits)

        # Recent commits
        for commit in commits[:10]:
            insights["recent_commits"].append(
                {
                    "hash": commit.hexsha[:7],
                    "message": commit.message.strip()[:100],
                    "author": commit.author.name,
                    "date": commit.committed_datetime.isoformat(),
                    "files_changed": len(commit.stats.files),
                }
            )

        # Contributors
        from collections import Counter

        author_counts = Counter(c.author.name for c in commits)
        insights["contributors"] = [
            {"name": name, "commits": count}
            for name, count in author_counts.most_common(10)
        ]

        # First and last commit
        if commits:
            insights["last_commit"] = commits[0].committed_datetime.isoformat()
            insights["first_commit"] = commits[-1].committed_datetime.isoformat()

        # Most changed files
        file_changes = Counter()
        for commit in commits:
            for f in commit.stats.files:
                file_changes[f] += 1
        insights["most_changed_files"] = [
            {"file": f, "changes": c} for f, c in file_changes.most_common(10)
        ]

        # Commit frequency by month
        from collections import defaultdict

        monthly = defaultdict(int)
        for commit in commits:
            month_key = commit.committed_datetime.strftime("%Y-%m")
            monthly[month_key] += 1
        insights["commit_frequency"] = [
            {"month": k, "commits": v}
            for k, v in sorted(monthly.items())[-12:]
        ]

    except Exception as e:
        print(f"Git analysis error: {e}")
        # Try AI-based fallback from code context
        prompt = f"""Based on this codebase, estimate git statistics and return a JSON:
{{
    "total_commits": <estimated>,
    "contributors": [{{"name": "...", "commits": ...}}],
    "recent_commits": [],
    "most_changed_files": [],
    "commit_frequency": [],
    "note": "Estimated from codebase analysis"
}}
Context: {context[:5000]}
Return ONLY valid JSON."""
        raw = ai_generate(prompt, is_json=True)
        if raw:
            try:
                result = json.loads(raw.replace("```json", "").replace("```", "").strip())
                ANALYSIS_CACHE[cache_key] = result
                return result
            except Exception:
                pass

    ANALYSIS_CACHE[cache_key] = insights
    return insights


# --- HELPERS ---
def generate_security_report_markdown(issues):
    if not issues:
        return ""

    report_content = "# Security Report\n\n"
    report_content += f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
    report_content += "This report summarizes the security findings for the analyzed repository.\n\n"

    severity_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    for severity in severity_order:
        severity_issues = [i for i in issues if i.get("severity", "").upper() == severity]
        if severity_issues:
            report_content += f"## {severity} Issues ({len(severity_issues)})\n\n"
            for issue in severity_issues:
                report_content += f"### {issue.get('title', 'N/A')}\n"
                report_content += f"- **Severity:** {issue.get('severity', 'N/A')}\n"
                report_content += f"- **Location:** `{issue.get('location', 'N/A')}`\n"
                report_content += f"- **Description:** {issue.get('description', 'N/A')}\n\n"

    return report_content


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)