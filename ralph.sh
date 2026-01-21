#!/bin/zsh
setopt ERR_EXIT PIPE_FAIL NO_UNSET

# Config
MAX_ITERS="42"
STOP_TOKEN="RALPH_WIGGUM_COMPLETED_ALL_TASKS"
PROJECT_DIR="/home/lvp/study/espanjapeli"
TODO_FILE="docs/v5-todo-phase2.json"
INSTRUCTIONS_FILE="ai-control/instructions.md"

cd "$PROJECT_DIR"

# Ensure log directory exists
mkdir -p .log

echo "🐷 Ralph 3.0 Starting..."
echo "📋 Todo: $TODO_FILE"
echo ""

# Main loop
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

Project root: ${PROJECT_DIR}

Read these files first:
1. ${INSTRUCTIONS_FILE} - coding standards and commands
2. ${TODO_FILE} - task list with subtasks

Find the first subtask without status 'completed' and implement it.

STRICT RULES - DO NOT DEVIATE:
- Do ONLY what the subtask describes. Nothing more.
- Do NOT refactor, improve, or touch code outside subtask scope.
- Do NOT add features, tests, or files not specified in subtask.
- Run tests specified in task's testing array.
- When subtask is done:
  - Add \"status\": \"completed\" to that subtask in ${TODO_FILE}
  - APPEND to ${PROJECT_DIR}/progress.txt (absolute path, do not create elsewhere)
  - If all subtasks in current task complete, do git commit
  - Exit session immediately
- ONLY when ALL subtasks are completed, print exactly: ${STOP_TOKEN}

Progress.txt format (append only):
HH:MM - Started Subtask X.Y: title
HH:MM - Created §filename
HH:MM - Updated §filename
HH:MM - Tests pass §test_filename
HH:MM - Subtask X.Y complete
[2-3 line summary]

Begin." \
    | tee ".log/ralph-loop-${i}.ndjson"

  echo ""

  # Extract result line for stop condition check
  RESULT_LINE=$(grep '"type":"result"' ".log/ralph-loop-${i}.ndjson" 2>/dev/null || echo "")

  # Stop condition: check for STOP_TOKEN in the RESULT LINE ONLY
  if [[ -n "$RESULT_LINE" ]] && echo "$RESULT_LINE" | grep -q "$STOP_TOKEN"; then
    echo ""
    echo "✅ Stop token received. All tasks complete."
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
