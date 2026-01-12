#!/bin/bash
set -e

# Ralph Once - Interactive single iteration for human-in-the-loop mode
# Usage: ./plans/ralph-once.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo ""
echo "=============================================="
echo "Ralph Once - Interactive Mode"
echo "=============================================="
echo ""

claude "$SCRIPT_DIR/prd.json" "$SCRIPT_DIR/progress.txt" -p "
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
"
