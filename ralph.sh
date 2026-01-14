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
  echo ""
  echo "════════════════════════════════════════"
  echo "🔄 ITERATION $i of $MAX_ITERS"
  echo "════════════════════════════════════════"
  echo ""

  # Run cursor-agent in headless mode with structured output
  cursor-agent -p --force \
    --model sonnet-4.5 \
    --output-format stream-json \
    "# Espanjapeli Development Task

Follow the Ralph Wiggum Protocol:
1. Read ai-control/PRINCIPLES.md for coding standards
2. Read ai-control/ROADMAP.md for project context
3. Read ai-control/todo.json for available tasks

$(if [[ -n "$TASK_ID" ]]; then echo "Focus on task $TASK_ID"; else echo "Pick the first available subtask with status 'not-started'"; fi)

ITERATION: $i of $MAX_ITERS

Rules:
- ONLY WORK ON A SINGLE SUBTASK AT A TIME
- Update todo.json status to 'in-progress' before starting
- Task is NOT complete until tests pass (check testRequired field)
- Append progress log into file progress.txt with timestamps after each agent action, as described below
- Mark subtask 'completed' in todo.json when done
- When task and all subtasks of it are complete, do git commit
- Check todo.json: if ANY task/subtask has status 'not-started', do NOT output stop token
- ONLY when ALL tasks AND subtasks are 'completed', print exactly: ${STOP_TOKEN}

Actions, and log line formats for progress.txt file:

HH:MM - Started Task X.Y 
HH:MM - Task X.Y complete
HH:MM - Started Subtask X.Y 
HH:MM - Subtask X.Y complete
HH:MM - Created §filenames
HH:MM - Updated §filenames
HH:MM - Tests pass §test_filename
HH:MM - Tests fail §test_filename
HH:MM - Installed package_name
HH:MM - [Iteration N] Subtask X.Y complete

IMPORTANT: After completing ONE subtask, if more work remains, end your response WITHOUT the stop token. The loop will continue.

Work incrementally. Small, safe edits. Begin." \
    | tee ".ralph-iter-${i}.ndjson"

  echo ""

  # Debug: extract result line for stop condition check
  RESULT_LINE=$(grep '"type":"result"' ".ralph-iter-${i}.ndjson" 2>/dev/null || echo "")
  
  echo ""
  echo "────────────────────────────────────────"
  echo "🔍 DEBUG: Checking stop condition..."
  if [[ -n "$RESULT_LINE" ]]; then
    echo "   Result line found: ${#RESULT_LINE} chars"
    if echo "$RESULT_LINE" | grep -q "$STOP_TOKEN"; then
      echo "   ✓ Stop token FOUND in result"
    else
      echo "   ✗ Stop token NOT in result → continuing loop"
    fi
  else
    echo "   ⚠ No result line found"
  fi
  echo "────────────────────────────────────────"

  # Stop condition: check for STOP_TOKEN in the RESULT LINE ONLY (not whole file)
  if [[ -n "$RESULT_LINE" ]] && echo "$RESULT_LINE" | grep -q "$STOP_TOKEN"; then
    echo ""
    echo "✅ Stop token received in agent result. Loop complete."
    break
  fi

  if [[ $i -eq $MAX_ITERS ]]; then
    echo ""
    echo "⚠️  Max iterations reached"
  fi
  
  echo ""
  echo "🔄 Continuing to next iteration..."

  echo ""
done

echo ""
echo "🏁 Ralph 2.0 complete"
echo "📊 Total iterations: $i"
echo "🌿 Branch: $BRANCH"
