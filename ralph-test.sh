#!/bin/zsh
setopt ERR_EXIT PIPE_FAIL NO_UNSET

# Ralph 2.0 Test Script - Simple Loop Test with Git Integration
# Usage: ./ralph2-test.sh

# Config
MAX_ITERS=3
STOP_TOKEN="<promise>COMPLETE</promise>"
PROJECT_DIR="/home/lvp/study/espanjapeli"
BRANCH="ralph-wiggum-1"

cd "$PROJECT_DIR"



echo "🧪 Ralph 2.0 Test Starting..."
echo "Project: $PROJECT_DIR"
echo "Branch: $BRANCH"
echo ""

# 3) Main loop
for i in {1..$MAX_ITERS}; do
  echo "=== Test Iteration $i/$MAX_ITERS ==="
  echo ""

  # Run cursor-agent in headless mode with structured output
  cursor-agent -p --force \
    --output-format stream-json \
    "Tell me a short poem (4 lines max) about coding.
     When done, print exactly: ${STOP_TOKEN}" \
    | tee ".ralph-test-iter-${i}.ndjson"

  echo ""


  # 5) Stop condition: check for STOP_TOKEN in result
  if grep -q "\"type\":\"result\"" ".ralph-test-iter-${i}.ndjson" && \
     grep -q "$STOP_TOKEN" ".ralph-test-iter-${i}.ndjson"; then
    echo ""
    echo "✅ Stop token received. Test complete."
    break
  fi

  if [[ $i -eq $MAX_ITERS ]]; then
    echo ""
    echo "⚠️  Max iterations reached"
  fi

  echo ""
done

echo ""
echo "🏁 Ralph 2.0 Test complete"
echo "📊 Total iterations: $i"
echo "🌿 Branch: $BRANCH"
