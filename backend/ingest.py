import os
import shutil
import git
import time
import glob
import stat

# ✅ FIX: Store data OUTSIDE the backend folder so Uvicorn doesn't restart
# This points to: DevMind-AI/workspace_data
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../workspace_data"))

def handle_remove_readonly(func, path, exc):
    """Helper to force delete read-only files on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def cleanup_old_repos():
    """Delete old repos inside the workspace_data folder."""
    if os.path.exists(BASE_DIR):
        # We glob the full path now
        search_path = os.path.join(BASE_DIR, "repo_*")
        for folder in glob.glob(search_path):
            try:
                shutil.rmtree(folder, onerror=handle_remove_readonly)
                print(f"🧹 Deleted old: {folder}")
            except Exception:
                pass

def clone_and_scan(repo_url):
    cleanup_old_repos()

    # 1. Ensure parent workspace exists
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    # 2. Clone into workspace_data/repo_TIMESTAMP
    timestamp = int(time.time())
    repo_path = os.path.join(BASE_DIR, f"repo_{timestamp}")
    
    print(f"⬇️  Cloning into: {repo_path}...")
    
    try:
        git.Repo.clone_from(repo_url, repo_path)
    except git.Exc.GitCommandError as e:
        return f"Git Clone Error: {e}", None

    # 3. SCAN FILES
    code_content = ""
    allowed_extensions = {
        '.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.h', '.c', 
        '.html', '.css', '.md', '.json', '.txt', '.toml', '.yml', '.yaml', 
        '.xml', '.gradle', '.properties'
    }
    
    file_count = 0
    for root, _, files in os.walk(repo_path):
        if '.git' in root: continue
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in allowed_extensions or file in ['Dockerfile', 'Makefile']:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if len(content) > 20000: content = content[:20000] + "\n...[TRUNCATED]"
                        
                        code_content += f"\n\n--- FILE: {file} ---\n"
                        code_content += content
                        file_count += 1
                except Exception:
                    pass

    print(f"✅ Scanned {file_count} files.")
    return code_content, repo_path