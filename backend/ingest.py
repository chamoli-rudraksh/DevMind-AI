import os
import shutil
import git
import time

def clone_and_scan(repo_url):
    repo_path = "temp_repo"
    
    # 1. CLEANUP: Delete existing folder if it exists
    if os.path.exists(repo_path):
        print(f"🧹 Cleaning up old repo at {repo_path}...")
        # Windows sometimes locks files; we try a few times
        for _ in range(3):
            try:
                shutil.rmtree(repo_path)
                break
            except PermissionError:
                print("   ⚠️ File locked, waiting 1s...")
                time.sleep(1)
        
        # If still exists after retries, we can't proceed safely
        if os.path.exists(repo_path):
            return "Error: Could not delete old temp_repo. Please delete it manually."

    # 2. CLONE: Download fresh copy
    print(f"⬇️ Cloning {repo_url}...")
    try:
        git.Repo.clone_from(repo_url, repo_path)
    except git.Exc.GitCommandError as e:
        return f"Git Clone Error: {e}"

    # 3. SCAN: Read files
    code_content = ""
    allowed_extensions = {'.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.h', '.c', '.html', '.css', '.md', '.json'}
    
    for root, _, files in os.walk(repo_path):
        if '.git' in root: continue # Skip .git folder
        
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in allowed_extensions:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_content += f"\n\n--- FILE: {file} ---\n"
                        code_content += f.read()
                except Exception:
                    pass

    return code_content