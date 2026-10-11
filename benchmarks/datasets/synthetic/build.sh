#!/usr/bin/env bash
# Rebuilds benchmarks/datasets/synthetic-fleet.json from benchmarks/datasets/synthetic/sources.json with the
# harness's seeded generator (Garrison.Benchmark generate --kind synthetic). The output is committed; rebuilding changes its
# SHA-256, so reports before and after are no longer the same dataset. Extra arguments are passed to generate.
source "$(dirname "$0")/../../common.sh"
build_harness
harness generate --kind synthetic "$@"
