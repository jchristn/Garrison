#!/usr/bin/env bash
# Stops the scale stack started by scale-up.sh: the server and worker processes, then the PostgreSQL container and its
# volume (SCALE_KEEP_DB=1 keeps the volume). Logs stay in benchmarks/.run/scale until the next start; reports in
# benchmarks/results are kept.
source "$(dirname "$0")/common.sh"
if [ -f "${SCALE_DIR}/pids" ]; then
  while read -r pid; do kill "${pid}" 2>/dev/null || true; done < "${SCALE_DIR}/pids"
  sleep 3
  while read -r pid; do kill -9 "${pid}" 2>/dev/null || true; done < "${SCALE_DIR}/pids"
  rm -f "${SCALE_DIR}/pids"
  log "scale servers and workers stopped"
else
  log "no scale processes recorded"
fi
# Fake harness processes started by the workers exit with their worker; catch any that outlived it.
pkill -f "${FAKE_DLL}" 2>/dev/null || true
if command -v docker >/dev/null 2>&1; then
  docker rm -f "${SCALE_PG_CONTAINER}" >/dev/null 2>&1 && log "removed container ${SCALE_PG_CONTAINER}" || true
  if [ "${SCALE_KEEP_DB:-0}" != "1" ]; then
    docker volume rm "${SCALE_PG_VOLUME}" >/dev/null 2>&1 && log "removed volume ${SCALE_PG_VOLUME}" || true
  fi
fi
