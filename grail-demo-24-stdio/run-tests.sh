#!/usr/bin/env bash

RUNS=${1:-20}
OUTDIR="test-runs-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$OUTDIR"

echo "Running Demo 18 $RUNS times"
echo "Saving traces to: $OUTDIR"
echo

for i in $(seq 1 "$RUNS"); do
  printf -v RUN "%03d" "$i"
  FILE="$OUTDIR/run-$RUN.txt"

  echo "Run $RUN..."

  node run.js > "$FILE" 2>&1

  if grep -q "Affordance succeeded: onboardCustomer" "$FILE"; then
    echo "  SUCCESS"
  else
    echo "  FAILED"
  fi
done

echo
echo "Complete."
echo "Traces: $OUTDIR"
