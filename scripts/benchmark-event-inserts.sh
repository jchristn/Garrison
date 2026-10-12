#!/usr/bin/env bash
# Compare event insert throughput with a baseline revision, using the same microbenchmark harness in both trees.
# Usage: GARRISON_TEST_PROVIDERS=sqlite,postgresql scripts/benchmark-event-inserts.sh [baseline-ref] [output-dir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASELINE="${1:-f947551}"
OUTPUT="${2:-$ROOT/benchmarks/results/$(date +%Y%m%d-%H%M%S)-event-inserts}"
EVENTS="${GARRISON_EVENT_BENCH_EVENTS:-3000}"
ROUNDS="${GARRISON_EVENT_BENCH_ROUNDS:-5}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-event-bench-XXXXXX")"
# Resolve macOS /var and /tmp aliases before MSBuild sees project paths.
WORK="$(cd "$WORK" && pwd -P)"
cleanup() {
  git -C "$ROOT" worktree remove --force "$WORK/baseline" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
mkdir -p "$OUTPUT"
git -C "$ROOT" worktree add --detach "$WORK/baseline" "$BASELINE" >/dev/null
cp "$ROOT/src/Test.Automated/Program.cs" "$WORK/baseline/src/Test.Automated/Program.cs"
cp "$ROOT/src/Test.Shared/Infrastructure/RunEventInsertBenchmark.cs" "$WORK/baseline/src/Test.Shared/Infrastructure/RunEventInsertBenchmark.cs"
{
  printf 'baseline=%s\n' "$(git -C "$ROOT" rev-parse "$BASELINE")"
  printf 'candidate=%s (plus working tree changes)\n' "$(git -C "$ROOT" rev-parse HEAD)"
  printf 'providers=%s\neventsPerRound=%s\nrounds=%s\n' "${GARRISON_TEST_PROVIDERS:-sqlite}" "$EVENTS" "$ROUNDS"
  printf 'dotnet=%s\n' "$(dotnet --version)"
  uname -sm
} > "$OUTPUT/provenance.txt"
dotnet build "$WORK/baseline/src/Garrison.sln" -v quiet > "$OUTPUT/before-build.log" 2>&1
dotnet run --project "$WORK/baseline/src/Test.Automated" -f net10.0 --no-build -- --event-insert-benchmark \
  --benchmark-events "$EVENTS" --benchmark-rounds "$ROUNDS" > "$OUTPUT/before.csv"
dotnet build "$ROOT/src/Garrison.sln" -v quiet > "$OUTPUT/after-build.log" 2>&1
dotnet run --project "$ROOT/src/Test.Automated" -f net10.0 --no-build -- --event-insert-benchmark \
  --benchmark-events "$EVENTS" --benchmark-rounds "$ROUNDS" > "$OUTPUT/after.csv"
printf 'Event insert comparison written to %s\n' "$OUTPUT"
