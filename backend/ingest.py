import os
import shutil
import git
import time
import glob
import stat


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../workspace_data"))

ALLOWED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".cpp", ".h", ".c",
    ".html", ".css", ".scss", ".sass", ".less",
    ".md", ".json", ".txt", ".toml", ".yml", ".yaml",
    ".xml", ".gradle", ".properties", ".go", ".rs", ".rb",
    ".sh", ".bash", ".zsh", ".fish", ".env.example",
    ".sql", ".graphql", ".proto", ".tf", ".hcl", ".vue", ".svelte",
}

IGNORE_DIRS = {
    ".git", "node_modules", "__pycache__", "dist", "build", "venv",
    ".idea", ".vscode", ".mypy_cache", ".pytest_cache", "coverage",
    ".next", ".nuxt", "target", "out", "bin", "obj", ".gradle",
    "vendor", ".bundle", "eggs", ".eggs",
}

SPECIAL_FILES = {"Dockerfile", "Makefile", "Jenkinsfile", "Procfile", ".env.example"}


def handle_remove_readonly(func, path, exc):
    """Helper to force delete read-only files on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def cleanup_old_repos():
    """Delete old repos inside the workspace_data folder."""
    if os.path.exists(BASE_DIR):
        search_path = os.path.join(BASE_DIR, "repo_*")
        for folder in glob.glob(search_path):
            try:
                shutil.rmtree(folder, onerror=handle_remove_readonly)
                print(f"🧹 Deleted old: {folder}")
            except Exception:
                pass


def scan_directory(repo_path: str) -> tuple[str, int]:
    """Scan a directory and return (code_content, file_count)."""
    code_content = ""
    file_count = 0

    for root, dirs, files in os.walk(repo_path):
        # Filter out ignored directories in-place
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ALLOWED_EXTENSIONS or file in SPECIAL_FILES:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, repo_path)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if len(content) > 15000:
                            content = content[:15000] + "\n...[TRUNCATED]"

                        code_content += f"\n\n--- FILE: {relative_path} ---\n"
                        code_content += content
                        file_count += 1
                except Exception:
                    pass

    return code_content, file_count


def clone_and_scan(repo_url: str) -> tuple[str, str | None]:
    """Clone a GitHub repo or scan a local path, then return (code_content, repo_path)."""

    # Handle local directory paths
    if repo_url.startswith("/") or repo_url.startswith("~") or repo_url.startswith("./"):
        local_path = os.path.expanduser(repo_url)
        if os.path.isdir(local_path):
            print(f"📂 Scanning local directory: {local_path}")
            code_content, file_count = scan_directory(local_path)
            print(f"✅ Scanned {file_count} files from local path.")
            return code_content, local_path
        else:
            return "Error: Local path not found.", None

    # Handle GitHub URLs
    cleanup_old_repos()

    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    timestamp = int(time.time())
    repo_path = os.path.join(BASE_DIR, f"repo_{timestamp}")

    print(f"⬇️  Cloning into: {repo_path}...")

    try:
        git.Repo.clone_from(repo_url, repo_path, depth=50)  # shallow clone for speed
    except Exception as e:
        return f"Git Clone Error: {e}", None

    code_content, file_count = scan_directory(repo_path)
    print(f"✅ Scanned {file_count} files.")
    return code_content, repo_path