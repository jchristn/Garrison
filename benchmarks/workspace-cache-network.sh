#!/usr/bin/env bash
# Bounded production-cache probe over disposable real loopback TCP/TLS, never the user's deployment.
# Arguments: output JSON, data files, bytes/file, rounds, response delay ms, per-connection target MiB/s (0 unlimited).
set -euo pipefail
cd "$(dirname "$0")/.."
for executable in dotnet python3 git openssl curl; do command -v "$executable" >/dev/null || { echo "$executable is required" >&2; exit 1; }; done
mkdir -p benchmarks/.run
probe_root="$(mktemp -d "$PWD/benchmarks/.run/network-cache-build.XXXXXX")"
trap 'rm -rf "$probe_root"' EXIT
python3 - "$PWD" "$probe_root" <<'PY'
from pathlib import Path
import sys
from xml.sax.saxutils import escape
repo, temporary = map(Path, sys.argv[1:])
files = ['WorkspaceCacheNetworkProbe.cs', 'CacheNetworkReady.cs', 'CacheNetworkStats.cs']
compile_items = ''.join('<Compile Include="' + escape(str(repo / 'benchmarks/probes' / file)) + '"/>' for file in files)
(temporary / 'Probe.csproj').write_text('<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><Nullable>enable</Nullable><ImplicitUsings>disable</ImplicitUsings><TreatWarningsAsErrors>true</TreatWarningsAsErrors></PropertyGroup><ItemGroup>' + compile_items + '<ProjectReference Include="' + escape(str(repo / 'src/Garrison.Worker/Garrison.Worker.csproj')) + '"/></ItemGroup></Project>')
PY
dotnet build "$probe_root/Probe.csproj" --artifacts-path "$probe_root/artifacts" -v minimal
dotnet "$probe_root/artifacts/bin/Probe/debug/Probe.dll" \
  "${1:-benchmarks/.run/workspace-cache-network.json}" "${2:-512}" "${3:-8192}" "${4:-3}" "${5:-25}" "${6:-16}" \
  "$PWD/benchmarks/probes/cache-network-server.py"
