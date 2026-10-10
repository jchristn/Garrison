#!/usr/bin/env bash
# Builds and pushes all three Garrison images. Usage: ./build-all.sh <tag>
set -euo pipefail
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: $0 <tag>" >&2
  exit 2
fi
cd "$(dirname "$0")"
./build-server.sh "$1"
./build-worker.sh "$1"
./build-dashboard.sh "$1"
