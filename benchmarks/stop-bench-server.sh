#!/usr/bin/env bash
# Stops the local benchmark stack started by start-bench-server.sh. Logs and the database stay in benchmarks/.run/local
# until the next start.
source "$(dirname "$0")/common.sh"
[ -f "${LOCAL_DIR}/pids" ] || { log "no local stack is running"; exit 0; }
while read -r pid; do kill "${pid}" 2>/dev/null || true; done < "${LOCAL_DIR}/pids"
sleep 2
while read -r pid; do kill -9 "${pid}" 2>/dev/null || true; done < "${LOCAL_DIR}/pids"
rm -f "${LOCAL_DIR}/pids"
log "local stack stopped"
