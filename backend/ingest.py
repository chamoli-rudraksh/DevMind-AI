import os
import git
import shutil

# Files/Dirs to ignore
IGNORE = {'.git', 'node_modules', 'dist', '__pycache__', '.env', 'package-lock.json', 'yarn.lock'}

def clone_and_scan(repo_url):
    local_path = "temp_repo"
    
    # 1. Clean previous runs
    if os.path.exists(local_path):
        shutil.rmtree(local_path, ignore_errors=True)
        
    # 2. Clone Repository
    try:
        git.Repo.clone_from(repo_url, local_path)
    except Exception as e:
        return f"Error cloning repo: {str(e)}"

    # 3. Read Files
    code_summary = ""
    for root, dirs, files in os.walk(local_path):
        # Filter ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE]
        
        for file in files:
            if file.endswith(('.png', '.jpg', '.jpeg', '.exe', '.bin', '.gz')): 
                continue 
            
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Limit file size to avoid token overflow (approx 500 lines)
                    if len(content) < 20000:
                        rel_path = os.path.relpath(file_path, local_path)
                        code_summary += f"\n--- FILE: {rel_path} ---\n{content}\n"
            except:
                continue 
                
    return code_summary