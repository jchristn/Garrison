#!/usr/bin/env bash
# Builds and pushes the multi-arch jchristn77/garrison-dashboard image (operator console plus the app UI at /apps/) with
# Docker Build Cloud, then pulls it back locally. The build context is the repository root.
# Usage: ./build-dashboard.sh <tag>   (for example v0.2.0)
set -euo pipefail
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: $0 <tag>" >&2
  exit 2
fi
TAG="$1"
IMAGE_NAME="jchristn77/garrison-dashboard"
DOCKERFILE_PATH="dashboard/Dockerfile"
BUILD_CONTEXT="."
BUILDER="${BUILDER:-cloud-jchristn77-jchristn77}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64/v8}"
cd "$(dirname "$0")"
docker buildx build --builder "${BUILDER}" --platform "${PLATFORMS}" \
  -f "${DOCKERFILE_PATH}" -t "${IMAGE_NAME}:${TAG}" -t "${IMAGE_NAME}:latest" --push "${BUILD_CONTEXT}"
docker pull "${IMAGE_NAME}:${TAG}"
docker pull "${IMAGE_NAME}:latest"
echo "built and pushed ${IMAGE_NAME}:${TAG}"
