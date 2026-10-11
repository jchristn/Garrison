#!/usr/bin/env bash
# Builds the harness (Release) and runs one Garrison.Benchmark command. Measuring commands (ingest, routing, e2e,
# load, resilience) are pointed at the stack chosen by BENCH_STACK (k3d by default, or local) unless you pass --url.
#
#   benchmarks/bench.sh validate
#   benchmarks/bench.sh e2e --label try1
#   BENCH_STACK=local benchmarks/bench.sh routing
#   benchmarks/bench.sh compare --baseline benchmarks/results/a.json --candidate benchmarks/results/b.json
source "$(dirname "$0")/common.sh"
build_harness
command="${1:-help}"
[ $# -gt 0 ] && shift
case "${command}" in
  ingest|routing|e2e|load|resilience)
    case " $* " in
      *" --url "*) harness "${command}" "$@" ;;
      *) run_measure "${command}" "$@" ;;
    esac ;;
  *) harness "${command}" "$@" ;;
esac
