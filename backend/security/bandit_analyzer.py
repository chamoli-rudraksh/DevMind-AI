import subprocess
import json
import os

def run_bandit_analysis(repo_path):
    """
    Runs Bandit static analysis on the specified repository path.
    Parses the JSON output and returns a list of security issues.
    """
    
    if not os.path.isdir(repo_path):
        return []

    try:
        # FIX: Removed '-n' which was causing the crash
        command = ["bandit", "-r", repo_path, "-f", "json", "-q"]
        
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        
        # Bandit exits with 1 if issues are found, so we don't strictly check return code
        if not result.stdout.strip():
            return []

        bandit_output = json.loads(result.stdout)
        
        issues = []
        for result in bandit_output.get("results", []):
            issue = {
                "severity": result.get("issue_severity", "MEDIUM"),
                "confidence": result.get("issue_confidence", "MEDIUM"),
                "title": result.get("test_name", "Bandit Issue"),
                "description": result.get("issue_text", ""),
                "location": f"{result.get('filename', '')}:{result.get('line_number', '')}",
                "code": result.get("code", "")
            }
            issues.append(issue)
            
        return issues

    except Exception as e:
        print(f"Error running Bandit: {e}")
        return []