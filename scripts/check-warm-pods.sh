#!/usr/bin/env bash
# P11.20: isolated real K3S attach, shared-stock, isolation, cancellation, and startup comparison.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-warm-XXXXXX")"
chmod 700 "$WORK"
CLUSTER="garrison-warm-conformance-$$"
cleanup() {
  docker rm -f "$CLUSTER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
IMAGE="${GARRISON_CONFORMANCE_IMAGE:-garrison-worker:warm-test}"
docker image inspect "$IMAGE" >/dev/null
dotnet build src/Test.Automated -f net10.0 -warnaserror >/dev/null
docker run -d --rm --name "$CLUSTER" --privileged -p 127.0.0.1::6443 rancher/k3s:v1.31.4-k3s1 server --disable traefik --disable servicelb >/dev/null
ready=0
for _ in $(seq 1 60); do
  if docker exec "$CLUSTER" kubectl wait --for=condition=Ready nodes --all --timeout=1s >/dev/null 2>&1; then ready=1; break; fi
  sleep 2
done
[ "$ready" = 1 ] || { echo 'Temporary K3S node did not become Ready.' >&2; exit 1; }
docker save "$IMAGE" | docker exec -i "$CLUSTER" ctr images import - >/dev/null
docker exec "$CLUSTER" kubectl create namespace garrison-conformance >/dev/null
docker exec "$CLUSTER" kubectl -n garrison-conformance create serviceaccount garrison-run >/dev/null
PORT="$(docker port "$CLUSTER" 6443/tcp | cut -d: -f2)"
docker exec "$CLUSTER" cat /etc/rancher/k3s/k3s.yaml > "$WORK/kubeconfig"
chmod 600 "$WORK/kubeconfig"
python3 - "$WORK/kubeconfig" "$PORT" <<'PY'
from pathlib import Path
import sys
path=Path(sys.argv[1]); path.write_text(path.read_text().replace('https://127.0.0.1:6443','https://127.0.0.1:'+sys.argv[2]))
PY
GARRISON_CONFORMANCE_KUBECONFIG="$WORK/kubeconfig" GARRISON_CONFORMANCE_IMAGE="$IMAGE" 
export GARRISON_CONFORMANCE_KUBECONFIG GARRISON_CONFORMANCE_IMAGE
dotnet run --project src/Test.Automated -f net10.0 --no-build -- --warm-conformance
