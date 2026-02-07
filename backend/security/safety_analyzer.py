import subprocess
import json
import os

def run_safety_analysis(repo_path):
    """
    Runs Safety dependency vulnerability analysis on the specified repository path.
    Looks for requirements.txt or similar files.
    Parses the JSON output and returns a list of security issues.
    """
    
    issues = []
    
    # List of common Python dependency files
    dependency_files = [
        "requirements.txt",
        "Pipfile.lock",
        "pyproject.toml", # poetry.lock for poetry projects, but pyproject.toml is common
        "Pipfile"
    ]

    found_dep_file = None
    for dep_file in dependency_files:
        full_path = os.path.join(repo_path, dep_file)
        if os.path.exists(full_path):
            found_dep_file = full_path
            break

    if not found_dep_file:
        print(f"No supported dependency file found in {repo_path} for Safety analysis.")
        return []

    print(f"Running Safety on {found_dep_file}...")
    try:
        # Run Safety and capture JSON output
        # --full-report: get all details
        # --json: output as json
        # -r: specify requirements file
        command = ["safety", "check", "--full-report", "--json", "-r", found_dep_file]
        result = subprocess.run(command, capture_output=True, text=True, check=False) # check=False because safety exits with 1 if vulnerabilities found
        
        # Safety might return non-zero exit code even for successful runs with vulnerabilities
        # So we need to check stderr for actual errors and stdout for json output
        if result.stderr and "Error" in result.stderr:
            print(f"Error running Safety: {result.stderr}")
            return []

        # Parse the JSON output
        safety_output = json.loads(result.stdout)
        
        for vuln in safety_output:
            # Safety output structure example:
            # [{"vulnerability_id": "pyup.io-2020-5690", "package_name": "django", ...}]
            issue = {
                "severity": "HIGH", # Safety doesn't give severity, defaulting to HIGH for now
                "title": f"Insecure Dependency: {vuln.get('package_name', 'N/A')} ({vuln.get('vulnerability_id', 'N/A')})",
                "location": found_dep_file,
                "description": (f"Vulnerability in {vuln.get('package_name', 'N/A')} version {vuln.get('installed_version', 'N/A')}. "
                                f"Affected versions: {vuln.get('vulnerable_versions', 'N/A')}. "
                                f"Recommended fix: {vuln.get('fixed_version', 'N/A')}. "
                                f"CVE: {vuln.get('cve', 'N/A')}. "
                                f"Advisory: {vuln.get('advisory', 'N/A')}"),
                "code": "" # Not directly applicable here
            }
            issues.append(issue)
            
        return issues

    except subprocess.CalledProcessError as e:
        print(f"Error running Safety: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding Safety JSON output: {e}")
        print(f"Safety Raw Output: {result.stdout}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []

if __name__ == "__main__":
    # Example usage (replace with a real repo path for testing)
    # This will run safety on the current directory if requirements.txt exists
    # For testing, ensure your current directory has a requirements.txt with some known vulnerabilities
    test_repo_path = os.getcwd() 
    print(f"Running Safety on: {test_repo_path}")
    security_issues = run_safety_analysis(test_repo_path)
    if security_issues:
        for issue in security_issues:
            print(f"  Severity: {issue['severity']}, Title: {issue['title']}, Location: {issue['location']}")
    else:
        print("  No insecure dependencies found by Safety.")
