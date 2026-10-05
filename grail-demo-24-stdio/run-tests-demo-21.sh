#!/usr/bin/env bash

RUNS=${1:-20}
OUTDIR="test-runs-$(date +%Y%m%d-%H%M%S)"
SUMMARY="$OUTDIR/summary.txt"
SELECTIONS="$OUTDIR/selections.txt"

mkdir -p "$OUTDIR"
: > "$SUMMARY"
: > "$SELECTIONS"

echo "Running Demo 21 $RUNS times"
echo "Saving traces to: $OUTDIR"
echo

SUCCESS=0
FAILED=0

for i in $(seq 1 "$RUNS"); do
  printf -v RUN "%03d" "$i"
  FILE="$OUTDIR/run-$RUN.txt"

  echo "Run $RUN..."

  node run.js > "$FILE" 2>&1

  if grep -q "Affordance succeeded: onboardCustomer" "$FILE"; then
    STATUS="SUCCESS"
    SUCCESS=$((SUCCESS + 1))
  else
    STATUS="FAILED"
    FAILED=$((FAILED + 1))
  fi

  echo "  $STATUS"

  # Record affordances that actually executed successfully.
  # Exclude the single onboardCustomer goal affordance from alternative counts.
  SELECTED=$(grep "Affordance succeeded:" "$FILE" \
    | sed 's/.*Affordance succeeded: //' \
    | grep -v '^onboardCustomer$' || true)

  {
    echo "Run $RUN: $STATUS"
    if [ -n "$SELECTED" ]; then
      echo "$SELECTED" | sed 's/^/  /'
    fi
    echo
  } >> "$SELECTIONS"

  if [ -n "$SELECTED" ]; then
    echo "$SELECTED" >> "$SUMMARY"
  fi
done

echo
echo "Results"
echo "-------"
echo "SUCCESS: $SUCCESS"
echo "FAILED:  $FAILED"

echo
echo "Affordance selections"
echo "---------------------"

if [ -s "$SUMMARY" ]; then
  sort "$SUMMARY" | uniq -c | sort -k2
else
  echo "No supporting affordances recorded."
fi

NODE_COUNT=$(grep -c 'Node$' "$SUMMARY" 2>/dev/null || true)
HTTP_COUNT=$(grep -c 'Http$' "$SUMMARY" 2>/dev/null || true)
TOTAL_BINDING=$((NODE_COUNT + HTTP_COUNT))

echo
echo "Binding selections"
echo "------------------"
echo "Node: $NODE_COUNT"
echo "HTTP: $HTTP_COUNT"
echo "Total alternative selections: $TOTAL_BINDING"

echo
echo "Complete."
echo "Traces:     $OUTDIR"
echo "Selections: $SELECTIONS"
