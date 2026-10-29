#!/usr/bin/env bash
# Isolation red-team test (plan P11.17). On a throwaway k3d cluster with the KubernetesJob executor and egress
# allowlists enabled, a run of an Untrusted deployment tries to read another run's work directory, read the worker's
# credentials and service account token, call the Kubernetes API, and reach hosts outside its allowlist. Every attack
# must fail and both positive controls (the allowlisted target and the Garrison MCP port) must succeed. The same probes
# then run in two Trusted deployments without an allowlist (a run pod, and a Process run on the worker) and are only
# reported, to show what the isolated path takes away.
#
#   k8s/tests/isolation-test.sh                    # build images from this checkout, test, delete the cluster
#   BUILD=0 IMAGE_TAG=v0.2.0 k8s/tests/isolation-test.sh    # use existing jchristn77/garrison-* images
#   KEEP_CLUSTER=1 k8s/tests/isolation-test.sh     # keep the cluster for inspection (delete with cluster-down.sh)
#
# How the probes work: the fake harness in the worker image has a probe mode (--probe-prompt). The test applies a
# harness profile, isolation-probe, that runs it that way, and each run's input lists probes, one per line
# ("probe read <path>", "probe connect <host:port>", ...). Each result comes back as a line
# PROBE|kind|target|ALLOWED or BLOCKED|detail in the run's resultText. Run A writes a marker into its own workspace
# and holds; run B (same deployment) probes while A is alive, then A is cancelled.
#
# The cluster never disturbs other Docker workloads: its own name (garrison-isolation), API port (6562), and NodePort
# mapping (127.0.0.1:18872), its own kubeconfig under k8s/tests/.work/isolation, a memory cap (NODE_MEMORY, 4g), and
# no change to your default kubeconfig. It never touches the Docker Compose stack or containers named garrison-*.
# It refuses to start when a cluster with its name already exists, unless REUSE_CLUSTER=1 (then it is never deleted),
# and only deletes the cluster it created.
#
# Environment: CLUSTER_NAME (garrison-isolation), API_PORT (6562), HTTP_PORT (18872), BUILD (1), IMAGE_TAG
# (isolation-local when BUILD=1), KEEP_CLUSTER (0), REUSE_CLUSTER (0), REMOVE_IMAGES (0; 1 removes the images this run
# built), PROBE_TIMEOUT_MS (3000), RESULTS_DIR (k8s/tests/results). Results: $RESULTS_DIR/isolation-<time>/ holds
# results.txt (the table), results.csv, each run's JSON, and diagnostics when the test fails.
# Exit code: 0 when every attack failed and every positive control succeeded on the Untrusted deployment, else 1.

TEST_DIR_SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CLUSTER_NAME="${CLUSTER_NAME:-garrison-isolation}"
export API_PORT="${API_PORT:-6562}"
export HTTP_PORT="${HTTP_PORT:-18872}"
export WORK_DIR="${WORK_DIR:-${TEST_DIR_SELF}/.work/isolation}"
export BUILD="${BUILD:-1}"
if [ "${BUILD}" = "1" ] && [ -z "${IMAGE_TAG:-}" ]; then export IMAGE_TAG="isolation-local"; fi
if [ -n "${IMAGE_TAG:-}" ]; then export IMAGE_TAG; fi
export IMAGES="garrison-server garrison-worker"
export OVERLAY_DIR="${TEST_DIR_SELF}/isolation"
export SERVERS=1 WORKERS=1 WORKER_CONCURRENCY=4
source "${TEST_DIR_SELF}/common.sh"
log() { printf '[isolation-test %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
need k3d
need docker
need kubectl
need curl
need python3

PROBE_TIMEOUT_MS="${PROBE_TIMEOUT_MS:-3000}"
TENANT_PATH="/v1.0/api/tenants/default"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${RESULTS_DIR}/isolation-${STAMP}"
mkdir -p "${OUT}" "${WORK_DIR}"
CREATED_CLUSTER=0
OVERALL=1

cleanup() {
  local code=$?
  if [ "${OVERALL}" != "0" ] && [ -f "${KUBECONFIG_FILE}" ]; then
    log "collecting diagnostics into ${OUT}/diagnostics"
    collect_diagnostics "${OUT}/diagnostics" || true
    kcn get networkpolicies -o yaml > "${OUT}/diagnostics/networkpolicies.yaml" 2>&1 || true
    kcn get jobs,pods -l app.kubernetes.io/name=garrison-run -o wide > "${OUT}/diagnostics/run-pods.txt" 2>&1 || true
  fi
  if [ "${CREATED_CLUSTER}" = "1" ] && [ "${KEEP_CLUSTER:-0}" != "1" ]; then
    log "deleting k3d cluster ${CLUSTER_NAME}"
    "${TEST_DIR}/cluster-down.sh" >/dev/null 2>&1 || log "could not delete ${CLUSTER_NAME}; run k8s/tests/cluster-down.sh with CLUSTER_NAME=${CLUSTER_NAME}"
  elif [ "${CREATED_CLUSTER}" = "1" ]; then
    log "kept cluster ${CLUSTER_NAME}: kubectl --kubeconfig ${KUBECONFIG_FILE} -n ${NAMESPACE} get pods"
  fi
  if [ "${REMOVE_IMAGES:-0}" = "1" ] && [ "${BUILD}" = "1" ]; then
    for image in ${IMAGES}; do docker image rm "jchristn77/${image}:${IMAGE_TAG}" >/dev/null 2>&1 || true; done
  fi
  exit "${code}"
}
trap cleanup EXIT

# ---------------------------------------------------------------------------------------------------------------------
# Cluster and install

if k3d cluster list "${CLUSTER_NAME}" >/dev/null 2>&1; then
  [ "${REUSE_CLUSTER:-0}" = "1" ] || fail "a k3d cluster named ${CLUSTER_NAME} already exists and this test did not create it; delete it yourself, set CLUSTER_NAME, or set REUSE_CLUSTER=1 to test on it without deleting it"
  log "reusing existing cluster ${CLUSTER_NAME} (REUSE_CLUSTER=1; it will not be deleted)"
else
  CREATED_CLUSTER=1
fi
"${TEST_DIR}/cluster-up.sh"
IMAGE_TAG="$(cat "${WORK_DIR}/image-tag")"
"${TEST_DIR}/deploy.sh"
kcn rollout status deployment/isolation-target --timeout=300s
kcn rollout status deployment/isolation-decoy --timeout=300s

KEY="$(admin_key)"
api() {
  local method="$1" path="$2" body="${3:-}" type="${4:-application/json}"
  if [ -n "${body}" ]; then
    curl -sS -X "${method}" -H "x-api-key: ${KEY}" -H "Content-Type: ${type}" --data-binary "${body}" "${BASE_URL}${path}"
  else
    curl -sS -X "${method}" -H "x-api-key: ${KEY}" "${BASE_URL}${path}"
  fi
}
json_field() { python3 -c 'import json,sys; d=json.load(sys.stdin); v=d.get(sys.argv[1]); print("" if v is None else v)' "$1"; }

TARGET_IP="$(kcn get pods -l app.kubernetes.io/name=isolation-target -o jsonpath='{.items[0].status.podIP}')"
DECOY_IP="$(kcn get pods -l app.kubernetes.io/name=isolation-decoy -o jsonpath='{.items[0].status.podIP}')"
WORKER_POD="$(worker_pods | head -n 1)"
WORKER_IP="$(kcn get pod "${WORKER_POD}" -o jsonpath='{.status.podIP}')"
NODE_IP="$(kc get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
[ -n "${TARGET_IP}" ] && [ -n "${DECOY_IP}" ] && [ -n "${WORKER_IP}" ] && [ -n "${NODE_IP}" ] || fail "could not read the target, decoy, worker, or node IP"
log "target ${TARGET_IP}, decoy ${DECOY_IP}, worker ${WORKER_POD} ${WORKER_IP}, node ${NODE_IP}"

log "waiting for the worker to report egress control (canary, NetworkPolicy RBAC, and policy audit)"
egress=0
for i in $(seq 1 90); do
  nodes="$(api GET "/v1.0/api/nodes?maxResults=100" 2>/dev/null || true)"
  case "${nodes}" in *'"egressControl":true'*) egress=1; break ;; esac
  sleep 2
done
[ "${egress}" = "1" ] || fail "no worker reports egressControl; Untrusted allowlisted runs would only queue (see the worker log)"

# ---------------------------------------------------------------------------------------------------------------------
# Configuration: one probe harness profile, three agents, three deployments

MANIFEST="$(cat <<YAML
apiVersion: garrison/v1
kind: HarnessProfile
metadata:
  name: isolation-probe
  description: Fake harness in probe mode for the isolation red-team test (k8s/tests/isolation-test.sh)
spec:
  harnessType: Generic
  executable: garrison-fake-harness
  promptDelivery: Stdin
  systemPromptDelivery: None
  outputParser: ClaudeStreamJson
  resultSource: ParserFinalEvent
  successPolicy: FinalEvent
  defaultTimeoutSeconds: 300
  killGraceSeconds: 2
  isolateHome: true
  arguments:
    - template: --format
    - template: claude
    - template: --probe-prompt
    - template: --probe-timeout-ms
    - template: "${PROBE_TIMEOUT_MS}"
  successExitCodes: [0]
  probeArguments: [--version]
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: iso-untrusted
spec:
  displayName: Isolation probe (Untrusted, allowlist)
  exposure: { a2a: false, mcpTool: false }
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: iso-trusted-pod
spec:
  displayName: Isolation probe (Trusted run pod, no allowlist)
  exposure: { a2a: false, mcpTool: false }
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: iso-trusted-process
spec:
  displayName: Isolation probe (Trusted Process run)
  exposure: { a2a: false, mcpTool: false }
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: iso-untrusted
spec:
  agent: iso-untrusted
  harnessProfile: isolation-probe
  executor: KubernetesJob
  trustLevel: Untrusted
  timeoutSeconds: 300
  maxAttempts: 1
  egressRules:
    - cidr: ${TARGET_IP}/32
      port: 8080
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: iso-trusted-pod
spec:
  agent: iso-trusted-pod
  harnessProfile: isolation-probe
  executor: KubernetesJob
  trustLevel: Trusted
  timeoutSeconds: 300
  maxAttempts: 1
---
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: iso-trusted-process
spec:
  agent: iso-trusted-process
  harnessProfile: isolation-probe
  executor: Process
  trustLevel: Trusted
  timeoutSeconds: 300
  maxAttempts: 1
YAML
)"
apply="$(api POST "${TENANT_PATH}/manifests/apply" "${MANIFEST}" application/yaml)"
echo "${apply}" > "${OUT}/manifest-apply.json"
python3 -c 'import json,sys; d=json.load(sys.stdin); bad=[i for i in d.get("items",[]) if i.get("result")=="Failed"]; sys.exit(1 if bad or "items" not in d else 0)' <<<"${apply}" \
  || fail "manifest apply failed: ${apply}"
log "applied the isolation-probe profile and the iso-untrusted, iso-trusted-pod, and iso-trusted-process deployments"

# ---------------------------------------------------------------------------------------------------------------------
# Probes: id|expectation on Untrusted|probe (the probe line without "probe ")
#   BLOCKED: an attack, must fail; ALLOWED: a positive control, must succeed; INFO: reported only.

probe_table() {
  local a="$1"
  cat <<EOF
cross-run-pod-path|BLOCKED|read /garrison/runs/${a}/work/isolation-marker.txt
cross-run-pod-glob|BLOCKED|read /garrison/runs/*/work/isolation-marker.txt
cross-run-worker-path|BLOCKED|read /workspaces/${a}/work/isolation-marker.txt
cross-run-worker-glob|BLOCKED|read /workspaces/*/work/*
worker-settings-file|BLOCKED|read /etc/garrison/garrison-worker.json
worker-secret-env|BLOCKED|env GARRISON_WORKER_SECRET_KEY
worker-access-env|BLOCKED|env GARRISON_WORKER_ACCESS_KEY
worker-secret-any-process|BLOCKED|proc-env GARRISON_WORKER_SECRET_KEY
sa-token-file|BLOCKED|read /var/run/secrets/kubernetes.io/serviceaccount/token
k8s-api-list-secrets|BLOCKED|http https://kubernetes.default.svc/api/v1/namespaces/${NAMESPACE}/secrets
k8s-api-list-pods|BLOCKED|http https://kubernetes.default.svc/api/v1/namespaces/${NAMESPACE}/pods
k8s-api-node-6443|BLOCKED|connect ${NODE_IP}:6443
control-plane-rest|BLOCKED|connect garrison-server:8700
database|BLOCKED|connect garrison-postgres:5432
worker-health-port|BLOCKED|connect ${WORKER_IP}:8710
internet-443|BLOCKED|connect 1.1.1.1:443
internet-80|BLOCKED|connect 1.1.1.1:80
external-dns-tcp|BLOCKED|connect 8.8.8.8:53
in-cluster-decoy|BLOCKED|connect ${DECOY_IP}:8080
allowlisted-ip-other-port|BLOCKED|connect ${TARGET_IP}:8081
allowlisted-target|ALLOWED|connect ${TARGET_IP}:8080
allowlisted-target-http|ALLOWED|http http://${TARGET_IP}:8080/
garrison-mcp-port|ALLOWED|connect garrison-server:8701
harness-garrison-env|INFO|env GARRISON_*
EOF
}

start_run() {
  local agent="$1" input="$2" body
  body="$(python3 -c 'import json,sys; print(json.dumps({"agentName": sys.argv[1], "input": sys.argv[2], "wait": False}))' "${agent}" "${input}")"
  api POST "${TENANT_PATH}/runs" "${body}" | json_field id
}
run_json() { api GET "${TENANT_PATH}/runs/$1"; }
run_status() { run_json "$1" | json_field status; }

# wait_status <runId> <seconds> <status...>: waits until the run reaches one of the statuses or any terminal one.
wait_status() {
  local id="$1" seconds="$2"; shift 2
  local status="" deadline=$((SECONDS + seconds))
  while [ "${SECONDS}" -lt "${deadline}" ]; do
    status="$(run_status "${id}")"
    for want in "$@" Succeeded Failed Cancelled TimedOut Rejected; do [ "${status}" = "${want}" ] && { echo "${status}"; return 0; }; done
    sleep 1
  done
  echo "${status:-unknown}"
  return 1
}

# The marker run A wrote, read from where A runs (its pod, or the worker for Process runs). Empty when not found.
read_marker() {
  local id="$1" executor="$2" pod
  if [ "${executor}" = "Process" ]; then
    kcn exec "${WORKER_POD}" -c worker -- sh -c "cat /workspaces/${id}/work/isolation-marker.txt" 2>/dev/null || true
    return 0
  fi
  pod="$(kcn get pods -l app.kubernetes.io/name=garrison-run -o json \
    | python3 -c 'import json,sys; rid=sys.argv[1]; print(next((p["metadata"]["name"] for p in json.load(sys.stdin)["items"] if (p["metadata"].get("annotations") or {}).get("garrison.io/run-id")==rid and p["status"].get("phase")=="Running"), ""))' "${id}")"
  [ -n "${pod}" ] || return 0
  kcn exec "${pod}" -- sh -c "cat /garrison/runs/${id}/work/isolation-marker.txt" 2>/dev/null || true
}

# scenario <name> <agent> <executor>: runs A (marker and hold) and B (probes), writes ${OUT}/<name>.results with one
# line per probe: id|expectation|kind|target|outcome|detail. Returns 1 when the scenario could not produce results.
scenario() {
  local name="$1" agent="$2" executor="$3" a b status marker nonce input
  nonce="isolation-marker-$(date +%s)-${RANDOM}"
  log "== ${name}: run A writes a marker and holds"
  a="$(start_run "${agent}" "$(printf 'Isolation run A (%s).\nprobe marker isolation-marker.txt %s\nprobe hold 240000\n' "${name}" "${nonce}")")"
  [ -n "${a}" ] || { log "${name}: could not start run A"; return 1; }
  echo "${a}" > "${OUT}/${name}-run-a.id"
  status="$(wait_status "${a}" 240 Running)" || true
  [ "${status}" = "Running" ] || { log "${name}: run A is ${status}, not Running"; run_json "${a}" > "${OUT}/${name}-run-a.json"; return 1; }
  marker=""
  for i in $(seq 1 60); do
    marker="$(read_marker "${a}" "${executor}")"
    [ -n "${marker}" ] && break
    sleep 2
  done
  if [ "$(printf '%s' "${marker}" | tr -d '\r\n')" = "${nonce}" ]; then
    log "${name}: run A ${a} wrote its marker"
    echo "confirmed" > "${OUT}/${name}-marker.txt"
  else
    log "${name}: run A's marker was not found where A runs"
    echo "missing" > "${OUT}/${name}-marker.txt"
  fi

  log "${name}: run B probes while A is alive"
  probe_table "${a}" > "${OUT}/${name}.probes"
  input="Isolation run B (${name}). Probes follow, one per line."$'\n'
  while IFS='|' read -r pid expect probe; do input+="probe ${probe}"$'\n'; done < "${OUT}/${name}.probes"
  b="$(start_run "${agent}" "${input}")"
  [ -n "${b}" ] || { log "${name}: could not start run B"; return 1; }
  echo "${b}" > "${OUT}/${name}-run-b.id"
  status="$(wait_status "${b}" 300)" || true
  run_json "${b}" > "${OUT}/${name}-run-b.json"
  api POST "${TENANT_PATH}/runs/${a}/cancel" '{}' >/dev/null 2>&1 || true
  wait_status "${a}" 120 >/dev/null || true
  run_json "${a}" > "${OUT}/${name}-run-a.json"
  [ "${status}" = "Succeeded" ] || { log "${name}: run B ended ${status}: $(json_field errorMessage < "${OUT}/${name}-run-b.json")"; return 1; }

  python3 - "${OUT}/${name}-run-b.json" "${OUT}/${name}.results" "${OUT}/${name}.probes" <<'PY' || return 1
import json, sys
run = json.load(open(sys.argv[1]))
lines = [l for l in (run.get("resultText") or "").splitlines() if l.startswith("PROBE|")]
table = [l.rstrip("\n").split("|", 2) for l in open(sys.argv[3]) if l.strip()]
if len(lines) != len(table):
    print("expected %d probe results, got %d" % (len(table), len(lines)), file=sys.stderr)
    sys.exit(1)
with open(sys.argv[2], "w") as out:
    for (pid, expect, probe), line in zip(table, lines):
        _, kind, target, outcome, detail = (line.split("|", 4) + [""] * 5)[:5]
        if probe.split(" ", 1)[0] != kind:
            print("result %s does not match probe %s" % (line, probe), file=sys.stderr)
            sys.exit(1)
        out.write("|".join([pid, expect, kind, target, outcome, detail]) + "\n")
PY
  log "${name}: $(wc -l < "${OUT}/${name}.results" | tr -d ' ') probe results"
}

# ---------------------------------------------------------------------------------------------------------------------
# Run the scenarios

untrusted_ok=1
scenario untrusted iso-untrusted KubernetesJob || untrusted_ok=0
scenario trusted-pod iso-trusted-pod KubernetesJob || log "trusted-pod contrast produced no results (reported only)"
scenario trusted-process iso-trusted-process Process || log "trusted-process contrast produced no results (reported only)"

# ---------------------------------------------------------------------------------------------------------------------
# Report

set +e
python3 - "${OUT}" "${untrusted_ok}" <<'PY' | tee "${OUT}/results.txt"
import os, sys
out, untrusted_ok = sys.argv[1], sys.argv[2] == "1"
def load(name):
    path = os.path.join(out, name + ".results")
    if not os.path.exists(path):
        return {}
    rows = {}
    for line in open(path):
        pid, expect, kind, target, outcome, detail = (line.rstrip("\n").split("|", 5) + [""] * 6)[:6]
        rows[pid] = (expect, kind + " " + target, outcome, detail)
    return rows
u, tp, pr = load("untrusted"), load("trusted-pod"), load("trusted-process")
order = list(u.keys()) or list(tp.keys()) or list(pr.keys())
marker = {}
for name in ("untrusted", "trusted-pod", "trusted-process"):
    path = os.path.join(out, name + "-marker.txt")
    marker[name] = open(path).read().strip() if os.path.exists(path) else "not run"
failures = []
rows = []
for pid in order:
    expect, probe, outcome, detail = u.get(pid, ("?", "?", "MISSING", ""))
    if expect == "INFO":
        verdict = "info"
    elif outcome == expect:
        verdict = "PASS"
    else:
        verdict = "FAIL"
        failures.append("%s: expected %s, got %s (%s)" % (pid, expect, outcome, detail))
    rows.append((pid, expect, outcome, tp.get(pid, ("", "", "-", ""))[2], pr.get(pid, ("", "", "-", ""))[2], verdict, probe))
if not untrusted_ok or not u:
    failures.append("the Untrusted scenario produced no results")
if marker["untrusted"] != "confirmed":
    failures.append("run A's marker was not confirmed in its run pod, so the cross-run probes prove nothing")
header = ("Probe", "Untrusted expects", "Untrusted", "Trusted pod", "Trusted process", "Verdict", "Attempt")
widths = [max(len(str(r[i])) for r in rows + [header]) for i in range(6)]
fmt = "  ".join("%%-%ds" % w for w in widths) + "  %s"
print("Isolation red-team results (P11.17)")
print("Run A marker: untrusted %s, trusted-pod %s, trusted-process %s" % (marker["untrusted"], marker["trusted-pod"], marker["trusted-process"]))
print(fmt % header)
print(fmt % (tuple("-" * w for w in widths) + ("-------",)))
for r in rows:
    print(fmt % r)
print()
for name, data in (("Untrusted", u), ("Trusted pod", tp), ("Trusted process", pr)):
    for pid, (expect, probe, outcome, detail) in data.items():
        if outcome == "ALLOWED" or (name == "Untrusted" and outcome != expect and expect != "INFO"):
            print("  %-16s %-26s %-8s %s" % (name, pid, outcome, detail))
print()
internet = tp.get("internet-443", ("", "", "", ""))[2]
if internet and internet != "ALLOWED":
    print("Note: the Trusted pod could not reach 1.1.1.1:443 either, so this machine may have no internet access and the internet probes did not test the allowlist.")
with open(os.path.join(out, "results.csv"), "w") as csv:
    csv.write("probe,untrusted_expects,untrusted,trusted_pod,trusted_process,verdict\n")
    for r in rows:
        csv.write(",".join(r[:6]) + "\n")
if failures:
    print("FAIL: %d problem(s)" % len(failures))
    for f in failures:
        print("  " + f)
    sys.exit(1)
print("PASS: every attack from the Untrusted deployment failed and every positive control succeeded")
PY
OVERALL="${PIPESTATUS[0]}"
log "results in ${OUT}"
exit "${OVERALL}"
