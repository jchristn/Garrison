#!/usr/bin/env bash
# Waits for Postgres (when present), the server, workers, dashboard, and the bootstrap Job.
source "$(dirname "$0")/common.sh"
need kubectl
wait_for_rollout
