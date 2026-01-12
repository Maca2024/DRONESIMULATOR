#!/bin/bash
set -e

# Ralph Loop - Autonomous coding agent loop for Drone Simulator
# Usage: ./plans/ralph.sh <max_iterations>
# Example: ./plans/ralph.sh 10

if [ -z "$1" ]; then
    echo "Usage: $0 <max_iterations>"
    echo "Example: $0 10"
    exit 1
fi

MAX_ITERATIONS=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    echo ""
    echo "=============================================="
    echo "Ralph Loop - Iteration $i of $MAX_ITERATIONS"
    echo "=============================================="
    echo ""

    OUTPUT=$(claude --print "$SCRIPT_DIR/prd.json" "$SCRIPT_DIR/progress.txt" --dangerously-skip-permissions -p "
You are working on the Aetherwing Drone Simulator project.

IMPORTANT FILES:
- prd.json: Contains user stories with 'passes' flag indicating completion status
- progress.txt: Append your learnings and notes here for context across iterations

STEPS TO FOLLOW:
1. Find the highest priority feature to work on (one that has passes: false). Choose based on priority and dependencies, not necessarily the first in the list.
2. Implement the feature, ensuring:
   - TypeScript types check via: npm run typecheck
   - Tests pass via: npm run test
   - Linting passes via: npm run lint
3. Update the PRD by setting passes: true for completed items
4. APPEND your progress notes to progress.txt (don't overwrite - add to the end)
   - Use this to leave notes for the next iteration
5. Make a git commit with a descriptive message for the feature

CRITICAL RULES:
- Only work on ONE feature per iteration
- Keep changes small and focused
- Run the feedback loops (typecheck, test, lint) before committing
- If all PRD items have passes: true, output: RALPH_COMPLETE

If while implementing the feature you notice ALL PRD items are complete (all have passes: true), output exactly: RALPH_COMPLETE
")

    echo "$OUTPUT"

    if echo "$OUTPUT" | grep -q "RALPH_COMPLETE"; then
        echo ""
        echo "=============================================="
        echo "Ralph Loop COMPLETE after $i iterations!"
        echo "=============================================="
        exit 0
    fi
done

echo ""
echo "=============================================="
echo "Ralph Loop reached max iterations ($MAX_ITERATIONS)"
echo "=============================================="
