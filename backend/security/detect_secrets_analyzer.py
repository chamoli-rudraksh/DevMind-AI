import subprocess
import json
import os

def run_detect_secrets_analysis(repo_path):
    """
    Runs detect-secrets analysis on the specified repository path.
    Parses the JSON output and returns a list of security issues.
    """
    
    # Ensure the path exists
    if not os.path.isdir(repo_path):
        return []

    try:
        # Run detect-secrets and capture JSON output
        # --all-files: Scan all files, not just changed ones
        # --json: Output in JSON format
        # --force-print: Print even if no secrets found (to ensure JSON output)
        command = ["detect-secrets", "--all-files", "--json", "--force-print", repo_path]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        
        # Parse the JSON output
        secrets_output = json.loads(result.stdout)
        
        issues = []
        # detect-secrets output structure might vary, so adapt this
        # based on actual output. Assuming 'results' contains file paths,
        # and each file path contains a list of 'secrets'.
        for filename, file_secrets in secrets_output.get("results", {}).items():
            for secret in file_secrets:
                issue = {
                    "severity": "CRITICAL", # detect-secrets doesn't have severity, default to CRITICAL for now
                    "title": f"Secret Found: {secret.get('type', 'Unknown Type')}",
                    "location": f"{filename}:{secret.get('line_number', 'N/A')}",
                    "description": f"Potential secret exposed. Type: {secret.get('type', 'N/A')}, Hash: {secret.get('hashed_secret', 'N/A')}",
                    "code": secret.get('secret_content', '') # May not always be available or desired
                }
                issues.append(issue)
            
        return issues

    except subprocess.CalledProcessError as e:
        print(f"Error running detect-secrets: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding detect-secrets JSON output: {e}")
        print(f"detect-secrets Raw Output: {result.stdout}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []

if __name__ == "__main__":
    # Example usage (replace with a real repo path for testing)
    test_repo_path = os.getcwd() 
    print(f"Running detect-secrets on: {test_repo_path}")
    security_issues = run_detect_secrets_analysis(test_repo_path)
    if security_issues:
        for issue in security_issues:
            print(f"  Severity: {issue['severity']}, Title: {issue['title']}, Location: {issue['location']}")
    else:
        print("  No secrets found by detect-secrets.")
