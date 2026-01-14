#!/usr/bin/env python3
"""
PUSH HELPER SCRIPT
==================
This script automates the git push workflow with pre-push validation and deployment monitoring.

Workflow:
1. Runs all Svelte tests (npm test)
2. Verifies production build works (npm run build)  
3. Pushes changes to remote
4. Calculates average deployment time from recent GitHub Actions runs
5. Polls GitHub Actions every 30 seconds until deployment completes
6. Reports final status and deployment URL

Requirements:
- gh CLI installed and authenticated
- npm installed
- Run from repository root

Usage: 
  ./push.py              - Full push workflow with validation and monitoring
  ./push.py --status     - Check status of last deployment only
  ./push.py --progress   - Show current task progress from progress.txt
"""

import subprocess
import sys
import json
import time
from datetime import datetime, timezone
from pathlib import Path


def run(cmd: list[str], cwd: str = ".", check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"❌ Command failed: {' '.join(cmd)}")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
    return result


def run_tests() -> bool:
    print("\n📋 Running tests...")
    result = run(["npm", "test", "--", "--run"], cwd="svelte", check=False)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        return False
    print("✅ All tests passed")
    return True


def run_build() -> bool:
    print("\n🔨 Building production bundle...")
    result = run(["npm", "run", "build"], cwd="svelte", check=False)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        return False
    print("✅ Build successful")
    return True


def git_push() -> bool:
    print("\n📤 Pushing to remote...")
    result = run(["git", "push"], check=False)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)
        return False
    print("✅ Push successful")
    return True


def get_average_deploy_time() -> float:
    print("\n⏱️  Calculating average deployment time...")
    result = run([
        "gh", "run", "list", 
        "--limit", "10",
        "--json", "createdAt,updatedAt,conclusion"
    ], check=False)
    
    if result.returncode != 0:
        return 120.0
    
    runs = json.loads(result.stdout)
    durations = []
    
    for r in runs:
        if r.get("conclusion") != "success":
            continue
        created = datetime.fromisoformat(r["createdAt"].replace("Z", "+00:00"))
        updated = datetime.fromisoformat(r["updatedAt"].replace("Z", "+00:00"))
        duration = (updated - created).total_seconds()
        durations.append(duration)
    
    if not durations:
        return 120.0
    
    avg = sum(durations) / len(durations)
    print(f"   Average: {avg:.0f}s from {len(durations)} recent runs")
    return avg


def get_latest_run() -> dict | None:
    result = run([
        "gh", "run", "list",
        "--limit", "1", 
        "--json", "databaseId,status,conclusion,createdAt,updatedAt,url"
    ], check=False)
    
    if result.returncode != 0:
        return None
    
    runs = json.loads(result.stdout)
    return runs[0] if runs else None


def format_duration(seconds: float) -> str:
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    if mins > 0:
        return f"{mins}m {secs}s"
    return f"{secs}s"


def monitor_deployment(expected_duration: float):
    print("\n🔄 Monitoring deployment...")
    print(f"   Expected duration: ~{format_duration(expected_duration)}")
    print("   Polling every 30 seconds...\n")
    
    start_time = time.time()
    initial_run = get_latest_run()
    initial_id = initial_run["databaseId"] if initial_run else None
    
    time.sleep(5)
    
    while True:
        run_info = get_latest_run()
        if not run_info:
            print("   ⚠️  Could not fetch run info")
            time.sleep(30)
            continue
        
        elapsed = time.time() - start_time
        status = run_info.get("status", "unknown")
        conclusion = run_info.get("conclusion", "")
        run_id = run_info.get("databaseId")
        
        if run_id == initial_id and status == "completed":
            print(f"   ⏳ Waiting for new run to start... ({format_duration(elapsed)})")
            time.sleep(10)
            continue
        
        if status == "completed":
            if conclusion == "success":
                print(f"\n✅ Deployment completed in {format_duration(elapsed)}")
                print(f"   URL: {run_info.get('url', 'N/A')}")
                print("\n🎉 GitHub Pages should be updated shortly!")
                return True
            else:
                print(f"\n❌ Deployment failed: {conclusion}")
                print(f"   URL: {run_info.get('url', 'N/A')}")
                return False
        
        status_emoji = "🟡" if status == "in_progress" else "⏳"
        print(f"   {status_emoji} Status: {status} | Elapsed: {format_duration(elapsed)}")
        
        time.sleep(30)


def check_status_only():
    print("=" * 50)
    print("📊 DEPLOYMENT STATUS")
    print("=" * 50)
    
    run_info = get_latest_run()
    if not run_info:
        print("\n❌ Could not fetch deployment info")
        sys.exit(1)
    
    status = run_info.get("status", "unknown")
    conclusion = run_info.get("conclusion", "")
    url = run_info.get("url", "N/A")
    created = run_info.get("createdAt", "")
    updated = run_info.get("updatedAt", "")
    
    if created:
        created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        print(f"\n   Started: {created_dt.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    
    if status == "completed":
        if updated:
            updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
            duration = (updated_dt - created_dt).total_seconds()
            print(f"   Finished: {updated_dt.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print(f"   Duration: {format_duration(duration)}")
        
        if conclusion == "success":
            print(f"\n✅ Status: Deployment completed successfully")
            print(f"   URL: {url}")
            print("\n🎉 GitHub Pages is up to date!")
        else:
            print(f"\n❌ Status: Deployment failed ({conclusion})")
            print(f"   URL: {url}")
            sys.exit(1)
    else:
        print(f"\n🟡 Status: {status}")
        print(f"   URL: {url}")
        if updated:
            updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
            elapsed = (datetime.now(timezone.utc) - created_dt).total_seconds()
            print(f"   Elapsed: {format_duration(elapsed)}")
        print("\n⏳ Deployment still in progress...")


def check_progress():
    """Display current task progress from progress.txt (Ralph Wiggum Protocol)"""
    print("=" * 50)
    print("📋 TASK PROGRESS STATUS")
    print("=" * 50)
    
    progress_file = Path("progress.txt")
    if not progress_file.exists():
        print("\n⚠️  No progress.txt found")
        print("   Start a Ralph Wiggum Protocol session to create one.")
        print("   See: ai-control/prompts/ralph-wiggum-protocol.md")
        sys.exit(0)
    
    content = progress_file.read_text()
    
    # Extract key information
    lines = content.split('\n')
    current_task = None
    status = None
    date = None
    completed = []
    in_progress = []
    next_actions = []
    
    in_completed_section = False
    in_progress_section = False
    in_next_section = False
    
    for line in lines:
        if line.startswith("PROGRESS LOG -"):
            current_task = line.split("PROGRESS LOG -")[1].strip()
        elif line.startswith("Date:"):
            date = line.split("Date:")[1].strip()
        elif line.startswith("Status:"):
            status = line.split("Status:")[1].strip()
        elif line.startswith("COMPLETED:"):
            in_completed_section = True
            in_progress_section = False
            in_next_section = False
        elif line.startswith("IN PROGRESS:"):
            in_completed_section = False
            in_progress_section = True
            in_next_section = False
        elif line.startswith("NEXT SESSION:"):
            in_completed_section = False
            in_progress_section = False
            in_next_section = True
        elif line.startswith("FILES") or line.startswith("BLOCKED") or line.startswith("DECISIONS"):
            in_completed_section = False
            in_progress_section = False
            in_next_section = False
        elif in_completed_section and line.strip().startswith("✓"):
            completed.append(line.strip())
        elif in_progress_section and line.strip().startswith("○"):
            in_progress.append(line.strip())
        elif in_next_section and line.strip().startswith("→"):
            next_actions.append(line.strip())
    
    # Display summary
    if current_task:
        print(f"\n📌 Current Task: {current_task}")
    if date:
        print(f"📅 Last Updated: {date}")
    if status:
        status_emoji = "🟢" if status == "COMPLETED" else "🟡" if status == "IN_PROGRESS" else "🔴"
        print(f"{status_emoji} Status: {status}")
    
    if completed:
        print(f"\n✅ Completed This Session ({len(completed)}):")
        for item in completed[:5]:  # Show max 5
            print(f"   {item}")
        if len(completed) > 5:
            print(f"   ... and {len(completed) - 5} more")
    
    if in_progress:
        print(f"\n🔄 In Progress ({len(in_progress)}):")
        for item in in_progress:
            print(f"   {item}")
    
    if next_actions:
        print(f"\n→ Next Actions ({len(next_actions)}):")
        for item in next_actions[:3]:  # Show max 3
            print(f"   {item}")
    
    print("\n" + "=" * 50)
    print("💡 Tip: Update progress.txt after each work session")
    print("   Protocol: ai-control/prompts/ralph-wiggum-protocol.md")
    print("=" * 50)


def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg in ["--status", "-s", "status"]:
            check_status_only()
            return
        elif arg in ["--progress", "-p", "progress"]:
            check_progress()
            return
    
    print("=" * 50)
    print("🚀 PUSH HELPER")
    print("=" * 50)
    
    result = run(["git", "status", "--porcelain"], check=False)
    if not result.stdout.strip():
        print("\n⚠️  No changes to push")
        sys.exit(0)
    
    result = run(["git", "log", "origin/main..HEAD", "--oneline"], check=False)
    if not result.stdout.strip():
        print("\n⚠️  No commits ahead of origin/main")
        sys.exit(0)
    
    if not run_tests():
        print("\n❌ Tests failed. Fix issues before pushing.")
        sys.exit(1)
    
    if not run_build():
        print("\n❌ Build failed. Fix issues before pushing.")
        sys.exit(1)
    
    avg_time = get_average_deploy_time()
    
    if not git_push():
        print("\n❌ Push failed.")
        sys.exit(1)
    
    monitor_deployment(avg_time)
    
    print("\n" + "=" * 50)
    print("✅ Done!")
    print("=" * 50)


if __name__ == "__main__":
    main()
