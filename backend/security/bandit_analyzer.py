import subprocess
import json
import os

def run_bandit_analysis(repo_path):
    """
    Runs Bandit static analysis on the specified repository path.
    Parses the JSON output and returns a list of security issues.
    """
    
    # Ensure the path exists
    if not os.path.isdir(repo_path):
        return []

    try:
        # Run Bandit and capture JSON output
        # -r: recursive
        # -f json: output format json
        # -n: disable --non-recursive (useful when running on a single file)
        # -q: quiet (only print errors, not progress)
        command = ["bandit", "-r", repo_path, "-f", "json", "-n", "-q"]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        
        # Parse the JSON output
        bandit_output = json.loads(result.stdout)
        
        issues = []
        for result in bandit_output.get("results", []):
            issue = {
                "severity": result["issue_severity"],
                "confidence": result["issue_confidence"],
                "title": result["test_name"],
                "description": result["issue_text"],
                "location": f"{result['filename']}:{result['line_number']}",
                "code": result.get("code", "")
            }
            issues.append(issue)
            
        return issues

    except subprocess.CalledProcessError as e:
        print(f"Error running Bandit: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding Bandit JSON output: {e}")
        print(f"Bandit Raw Output: {result.stdout}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []

if __name__ == "__main__":
    # Example usage (replace with a real repo path for testing)
    # This will run bandit on the current directory for testing purposes.
    # In a real scenario, repo_path would be the cloned repository.
    test_repo_path = os.getcwd() 
    print(f"Running Bandit on: {test_repo_path}")
    security_issues = run_bandit_analysis(test_repo_path)
    if security_issues:
        for issue in security_issues:
            print(f"  Severity: {issue['severity']}, Title: {issue['title']}, Location: {issue['location']}")
    else:
        print("  No security issues found by Bandit.")
