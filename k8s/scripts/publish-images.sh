#!/usr/bin/env bash
# P7.5: build both supported architectures. --push publishes; default exports reviewable OCI archives.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="$(sed -n 's/.*<Version>\([^<]*\)<\/Version>.*/\1/p' "$ROOT/src/Directory.Build.props" | head -1)"
TAG="v${VERSION}"
NAMESPACE="${GARRISON_IMAGE_NAMESPACE:-jchristn77}"
BUILDER="${GARRISON_IMAGE_BUILDER:-garrison-publish}"
PLATFORMS="${GARRISON_IMAGE_PLATFORMS:-linux/amd64,linux/arm64}"
OUTPUT="${GARRISON_IMAGE_OUTPUT:-$ROOT/artifacts/images/$TAG}"
MODE=oci
IMAGES=(server worker dashboard)
while [ "$#" -gt 0 ]; do
  case "$1" in
    --push) MODE=push ;;
    --image) shift; IMAGES=("${1:?--image requires server, worker, or dashboard}") ;;
    --help) echo 'publish-images.sh [--push] [--image server|worker|dashboard]'; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done
if [ "$MODE" = push ] && [ -n "$(git -C "$ROOT" status --porcelain --untracked-files=no)" ]; then
  echo 'Commit tracked changes before publishing versioned images.' >&2; exit 1
fi
REVISION="$(git -C "$ROOT" rev-parse HEAD)"
docker buildx inspect "$BUILDER" >/dev/null 2>&1 || docker buildx create --name "$BUILDER" --driver docker-container >/dev/null
docker buildx inspect "$BUILDER" --bootstrap >/dev/null
mkdir -p "$OUTPUT"
for image in "${IMAGES[@]}"; do
  case "$image" in
    server) FILE="$ROOT/src/Garrison.Server/Dockerfile"; CONTEXT="$ROOT" ;;
    worker) FILE="$ROOT/src/Garrison.Worker/Dockerfile"; CONTEXT="$ROOT" ;;
    dashboard) FILE="$ROOT/dashboard/Dockerfile"; CONTEXT="$ROOT" ;;
    *) echo "Unknown image: $image" >&2; exit 2 ;;
  esac
  OPTIONS=(--output "type=oci,dest=$OUTPUT/garrison-$image.oci.tar")
  if [ "$MODE" = push ]; then OPTIONS=(--push); fi
  docker buildx build --builder "$BUILDER" --platform "$PLATFORMS" --file "$FILE" \
    --tag "$NAMESPACE/garrison-$image:$TAG" --label "org.opencontainers.image.revision=$REVISION" \
    --metadata-file "$OUTPUT/garrison-$image.metadata.json" "${OPTIONS[@]}" "$CONTEXT"
  if [ "$MODE" = push ]; then docker buildx imagetools inspect "$NAMESPACE/garrison-$image:$TAG"; fi
done
