#!/bin/zsh
setopt ERR_EXIT PIPE_FAIL NO_UNSET

# Ralph 2.0 - Improved AI Agent Loop with Git Integration
# Usage: ./ralph2.sh [task_id]

# Config
BRANCH="ralph-wiggum-1"
MAX_ITERS="10"
STOP_TOKEN="<promise>COMPLETE</promise>"
PROJECT_DIR="/home/lvp/study/espanjapeli"

cd "$PROJECT_DIR"

# Optional task ID as argument
TASK_ID=${1:-""}

echo "🐷 Ralph 2.0 Starting..."
echo "Project: $PROJECT_DIR"
echo "Branch: $BRANCH"
if [[ -n "$TASK_ID" ]]; then
    echo "Task: $TASK_ID"
fi
echo ""

# 3) Main loop
for i in {1..$MAX_ITERS}; do
  echo "=== Iteration $i/$MAX_ITERS ==="
  echo ""

  # Run cursor-agent in headless mode with structured output
  cursor-agent -p --force \
    --output-format stream-json \
    "# Espanjapeli Development Task

Follow the Ralph Wiggum Protocol:
1. Read ai-control/PRINCIPLES.md for coding standards
2. Read ai-control/ROADMAP.md for project context
3. Read ai-control/todo.json for available tasks

$(if [[ -n "$TASK_ID" ]]; then echo "Focus on task $TASK_ID"; else echo "Pick the first available subtask with status 'not-started'"; fi)

Rules:
- ONLY WORK ON A SINGLE SUBTASK AT A TIME
- Update todo.json status to 'in-progress' before starting
- Task is NOT complete until tests pass (check testRequired field)
- Append progress log to progress.txt with timestamps
- Mark subtask 'completed' in todo.json when done
- Make git commit after completing a subtask
- When subtask is complete, print exactly: ${STOP_TOKEN}

Allowed log line formats for progress.txt:

HH:MM - Started Task X.Y 
HH:MM - Task X.Y complete
HH:MM - Started Subtask X.Y 
HH:MM - Subtask X.Y complete
HH:MM - Created §filenames
HH:MM - Updated §filenames
HH:MM - Tests pass §test_filename
HH:MM - Tests fail §test_filename
HH:MM - Installed package_name

Work incrementally. Small, safe edits. Begin." \
    | tee ".ralph-iter-${i}.ndjson"

  echo ""

  # 4) Commit any changes the agent made
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -m "Ralph iteration $i"
    echo "📝 Changes committed"
  else
    echo "ℹ️  No changes to commit"
  fi

  # 5) Stop condition: check for STOP_TOKEN in result
  if grep -q "\"type\":\"result\"" ".ralph-iter-${i}.ndjson" && \
     grep -q "$STOP_TOKEN" ".ralph-iter-${i}.ndjson"; then
    echo ""
    echo "✅ Stop token received. Loop complete."
    break
  fi

  if [[ $i -eq $MAX_ITERS ]]; then
    echo ""
    echo "⚠️  Max iterations reached"
  fi

  echo ""
done

echo ""
echo "🏁 Ralph 2.0 complete"
echo "📊 Total iterations: $i"
echo "🌿 Branch: $BRANCH"
