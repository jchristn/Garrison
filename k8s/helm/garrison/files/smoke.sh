#!/bin/sh
# Applies the smoke agent, invokes it with wait=true, and exits 0 only when the run succeeded.
set -u
API="${GARRISON_API_URL:-http://garrison-server:8700}"
TENANT="${GARRISON_TENANT_ID:-default}"
KEY="${GARRISON_ADMIN_API_KEY:?GARRISON_ADMIN_API_KEY is required}"
BASE="${API}/v1.0/api/tenants/${TENANT}"

echo "[smoke] waiting for ${API}"
until curl -fsS -o /dev/null "${API}/v1.0/api/health"; do sleep 3; done

code=$(curl -sS -o /tmp/apply.out -w '%{http_code}' -X POST "${BASE}/manifests/apply" \
  -H "x-api-key: ${KEY}" -H "Content-Type: application/yaml" --data-binary @/smoke/smoke.yaml)
echo "[smoke] apply HTTP ${code}: $(cat /tmp/apply.out)"
[ "${code}" = "200" ] || [ "${code}" = "201" ] || exit 1

id=$(curl -fsS "${BASE}/agents?search=smoke-echo" -H "x-api-key: ${KEY}" | sed -n 's/.*"id":"\(agt_[^"]*\)".*/\1/p' | head -n 1)
[ -n "${id}" ] || { echo "[smoke] agent smoke-echo not found"; exit 1; }

curl -sS -o /tmp/run.out -X POST "${BASE}/agents/${id}/invoke?wait=true&waitSeconds=90" \
  -H "x-api-key: ${KEY}" -H "Content-Type: application/json" \
  --data '{"input":"Garrison smoke test"}'
echo "[smoke] run: $(cat /tmp/run.out)"
if grep -q '"status":"Succeeded"' /tmp/run.out; then
  echo "[smoke] PASS"
  exit 0
fi
echo "[smoke] FAIL"
exit 1
