#!/usr/bin/env bash
# Rebuilds benchmarks/datasets/garrison-live.json from benchmarks/datasets/live/sources.json with the
# harness's seeded generator (Garrison.Benchmark generate --kind live). The output is committed; rebuilding changes its
# SHA-256, so reports before and after are no longer the same dataset. Extra arguments are passed to generate.
source "$(dirname "$0")/../../common.sh"
build_harness
harness generate --kind live "$@"
