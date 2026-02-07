import subprocess
import json
import os

def run_detect_secrets_analysis(repo_path):
    """
    Runs detect-secrets analysis on the specified repository path.
    Parses the JSON output and returns a list of security issues.
    """
    
    if not os.path.isdir(repo_path):
        return []

    try:
        # FIX: Added 'scan' command. Removed incompatible flags like --force-print/--json for 'scan'
        # 'detect-secrets scan' outputs JSON by default.
        command = ["detect-secrets", "scan", repo_path, "--all-files"]
        
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        
        if not result.stdout.strip():
            return []

        secrets_output = json.loads(result.stdout)
        
        issues = []
        # The structure is {"results": { "filename": [ { ...secret... } ] }}
        for filename, file_secrets in secrets_output.get("results", {}).items():
            for secret in file_secrets:
                issue = {
                    "severity": "CRITICAL",
                    "title": f"Secret Found: {secret.get('type', 'Unknown')}",
                    "location": f"{filename}:{secret.get('line_number', '?')}",
                    "description": f"Potential hardcoded secret. Type: {secret.get('type', 'N/A')}",
                }
                issues.append(issue)
            
        return issues

    except Exception as e:
        print(f"Error running detect-secrets: {e}")
        return []