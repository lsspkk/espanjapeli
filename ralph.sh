#!/bin/zsh
setopt ERR_EXIT PIPE_FAIL NO_UNSET


# Config
MAX_ITERS="10"
STOP_TOKEN="<promise>COMPLETE</promise>"
PROJECT_DIR="/home/lvp/study/espanjapeli"

cd "$PROJECT_DIR"


echo "🐷 Ralph 2.0 Starting..."
echo ""

# 3) Main loop
for i in {1..$MAX_ITERS}; do
  echo ""
  echo "════════════════════════════════════════"
  echo "🔄 LOOP $i of $MAX_ITERS"
  echo "════════════════════════════════════════"
  echo ""

  # Run cursor-agent in headless mode with structured output
  cursor-agent -p --force \
    --model sonnet-4.5 \
    --output-format stream-json \
    "# Espanjapeli Development Task

First read some info files from ai-context folder
1. Read PRINCIPLES.md and follow its guidelines
2. Read ROADMAP.md for project goals
3. Read codebase.md to understand codebase 
4. Read todo.json for available tasks
   Pick the first available subtask with status 'not-started'

Rules:
- ONLY WORK ON A SINGLE SUBTASK AT A TIME
- Update todo.json status to 'in-progress' before starting
- Task is NOT complete until tests pass (check testRequired field)
- Append progress log into file in project root called progress.txt with timestamps after each agent action, as described below
- ONLY when ALL tasks AND subtasks are 'completed', print exactly: ${STOP_TOKEN}
- Check todo.json: if ANY task/subtask has status 'not-started', do NOT output stop token
- When subtask is done
  - mark subtask 'completed' in todo.json
  - append to process.txt the log line, 
    and a short (about 10 lines) summary of changes made
  - if all subtasks of tasks are now complete, do git commit
  - stop working: exit this agent session

Example of log line formats that you use in progress.txt file:

HH:MM - Started Task X.Y 
HH:MM - Task X.Y complete
HH:MM - Started Subtask X.Y 
HH:MM - Subtask X.Y complete
HH:MM - Created §filenames
HH:MM - Updated §filenames
HH:MM - Tests pass §test_filename
HH:MM - Tests fail §test_filename
HH:MM - Installed package_name
HH:MM - [Loop N] Subtask X.Y complete

IMPORTANT: After completing ONE subtask, if more work remains, 
end your response WITHOUT the stop token. 
The loop will continue.

Work incrementally. Small, safe edits. Begin." \
    | tee ".ralph-loop-${i}.ndjson"

  echo ""

  # Debug: extract result line for stop condition check
  RESULT_LINE=$(grep '"type":"result"' ".ralph-loop-${i}.ndjson" 2>/dev/null || echo "")

  # Stop condition: check for STOP_TOKEN in the RESULT LINE ONLY (not whole file)
  if [[ -n "$RESULT_LINE" ]] && echo "$RESULT_LINE" | grep -q "$STOP_TOKEN"; then
    echo ""
    echo "✅ Stop token received in agent result. Loop complete."
    break
  fi

  if [[ $i -eq $MAX_ITERS ]]; then
    echo ""
    echo "⚠️  Max loops reached"
  fi
  
  echo ""
  echo "🔄 Continuing to next loop..."

  echo ""
done

echo ""
echo "🏁 Ralph 3.0 complete"
echo "📊 Total loops: $i"
echo "🌿 Branch: $BRANCH"
