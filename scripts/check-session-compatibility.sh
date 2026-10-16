#!/usr/bin/env bash
set -euo pipefail
# Test existing recordings against the candidate worker image. Never regenerate in CI.
repository_root="$(cd "$(dirname "$0")/.." && pwd)"
worker_image="${1:-garrison-session-compatibility:local}"
harnesses=(claude codex codex-app-server mux provider-api)
if [[ "${GARRISON_SESSION_GEMINI:-false}" == "true" ]]; then harnesses+=(gemini); fi
for harness in "${harnesses[@]}"; do
  docker run --rm --network none --user 0 --entrypoint node \
    -v "$repository_root/scripts/session-compatibility:/gate:ro" \
    -v "$repository_root/src/Garrison.Core/Seed/HarnessProfiles:/profiles:ro" \
    -v "$repository_root/src/Test.Shared/Fixtures/Sessions:/fixtures:ro" \
    "$worker_image" /gate/driver.mjs "--harness=$harness"
done
