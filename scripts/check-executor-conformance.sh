#!/usr/bin/env bash
# P11.19: native Process/Job behavior gates plus an ephemeral real K3S check. No provider credentials are used.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-conformance-XXXXXX")"
CLUSTER="garrison-conformance-$$"
cleanup() {
  docker rm -f "$CLUSTER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
# A caller may supply a current locally built image. Default does not rebuild or pull the large worker image.
IMAGE="${GARRISON_CONFORMANCE_IMAGE:-jchristn77/garrison-worker:v0.2.0}"
docker image inspect "$IMAGE" >/dev/null
dotnet run --project src/Test.Automated -f net10.0 -- --suites executor-conformance
dotnet run --project src/Test.Automated -f net10.0 --no-build -- --executor-conformance-manifests "$WORK"
if [ "$IMAGE" != jchristn77/garrison-worker:v0.2.0 ]; then
  python3 - "$WORK" "$IMAGE" <<'PY'
import json,sys
from pathlib import Path
for path in Path(sys.argv[1]).glob('job-*.json'):
    value=json.loads(path.read_text()); value['spec']['template']['spec']['containers'][0]['image']=sys.argv[2]
    path.write_text(json.dumps(value))
PY
fi
docker run -d --rm --name "$CLUSTER" --privileged rancher/k3s:v1.31.4-k3s1 server --disable traefik --disable servicelb >/dev/null
ready=0
for _ in $(seq 1 60); do
  if docker exec "$CLUSTER" kubectl wait --for=condition=Ready nodes --all --timeout=1s >/dev/null 2>&1; then ready=1; break; fi
  sleep 2
done
[ "$ready" = 1 ] || { echo 'Temporary K3S node did not become Ready.' >&2; exit 1; }
docker save "$IMAGE" | docker exec -i "$CLUSTER" ctr images import - >/dev/null
kubectl_in_cluster() { docker exec -i "$CLUSTER" kubectl "$@"; }
kubectl_in_cluster create namespace garrison-conformance >/dev/null
kubectl_in_cluster -n garrison-conformance create serviceaccount garrison-run >/dev/null
for i in 0 1; do
  kubectl_in_cluster apply -f - < "$WORK/secret-$i.json" >/dev/null
  kubectl_in_cluster apply -f - < "$WORK/job-$i.json" >/dev/null
done
kubectl_in_cluster -n garrison-conformance wait --for=condition=Complete jobs --all --timeout=180s
for i in 0 1; do
  JOB="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["metadata"]["name"])' "$WORK/job-$i.json")"
  kubectl_in_cluster -n garrison-conformance logs "job/$JOB" > "$WORK/log-$i.txt"
done
kubectl_in_cluster -n garrison-conformance get pods -o json > "$WORK/pods.json"
python3 - "$WORK" <<'PY'
import json,sys
from pathlib import Path
root=Path(sys.argv[1]); pods=json.loads((root/'pods.json').read_text())['items']
assert len(pods)==2 and len({p['metadata']['uid'] for p in pods})==2, 'Runs must have separate pods'
for i in range(2):
    spec=json.loads((root/f'secret-{i}.json').read_text())['stringData']['spec.json']
    nonce=json.loads(spec)['nonce']; prefix=f'@@garrison:{nonce}:'
    lines=[json.loads(line.split(' ',1)[1]) for line in (root/f'log-{i}.txt').read_text().splitlines() if line.startswith(prefix)]
    complete=[line['complete'] for line in lines if line['type']=='Complete']
    assert len(complete)==1 and complete[0]['status']=='Succeeded', 'One successful completion required'
    result=complete[0].get('resultText','')
    assert 'CONFORMANCE_ISOLATED' in result and 'CONFORMANCE_COMPLETE' in result, 'Isolation checks must execute'
print('PASS: separate cold-started run pods, independent work/home, UID 10001, no service-account token, read-only root, and successful run-one protocol completion')
PY
