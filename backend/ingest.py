import os
import git
import shutil

IGNORE = {'.git', 'node_modules', 'dist', '__pycache__', '.env', 'package-lock.json'}

class RepoRequest(BaseModel):
    url: str
    doc_type: str = "README.md"  # New field to know which button was clicked

@app.post("/generate")
async def generate_documentation(request: RepoRequest):
    # ... (cloning logic stays the same) ...
    
    # Update prompt based on button clicked
    if request.doc_type == "CONTRIBUTING.md":
        focus = "how to contribute, pull request guidelines, and code of conduct"
    elif request.doc_type == "ARCHITECTURE.md":
        focus = "high-level architecture, directory structure, and data flow"
    else:
        focus = "installation, usage, and features"

    prompt = f"""
    You are an AI Documentation Engineer. 
    Analyze the codebase and generate a {request.doc_type}.
    Focus strictly on: {focus}.
    
    CODEBASE CONTEXT:
    {context}
    """
def clone_and_scan(repo_url):
    local_path = "temp_repo"
    
    if os.path.exists(local_path):
        shutil.rmtree(local_path)
        
    try:
        git.Repo.clone_from(repo_url, local_path)
    except Exception as e:
        return f"Error cloning repo: {str(e)}"

    code_summary = ""
    for root, dirs, files in os.walk(local_path):
        dirs[:] = [d for d in dirs if d not in IGNORE]
        
        for file in files:
            if file.endswith(('.png', '.jpg', '.exe')): continue
            
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if len(content) < 15000:
                        rel_path = os.path.relpath(file_path, local_path)
                        code_summary += f"\n--- FILE: {rel_path} ---\n{content}\n"
            except:
                continue
                
    return code_summary