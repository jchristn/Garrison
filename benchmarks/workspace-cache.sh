#!/usr/bin/env bash
# Measure production WorkspacePreparer/WorkspaceSnapshot without changing the black-box benchmark harness.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p benchmarks/.run
probe_root="$(mktemp -d "$PWD/benchmarks/.run/cache-build.XXXXXX")"
trap 'rm -rf "$probe_root"' EXIT
python3 - "$PWD" "$probe_root" <<'PY'
from pathlib import Path
import sys
from xml.sax.saxutils import escape
repo, temporary = map(Path, sys.argv[1:])
(temporary / 'Probe.csproj').write_text('<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><Nullable>enable</Nullable><ImplicitUsings>disable</ImplicitUsings><TreatWarningsAsErrors>true</TreatWarningsAsErrors></PropertyGroup><ItemGroup><Compile Include="' + escape(str(repo / 'benchmarks/probes/WorkspaceCacheProbe.cs')) + '"/><ProjectReference Include="' + escape(str(repo / 'src/Garrison.Worker/Garrison.Worker.csproj')) + '"/></ItemGroup></Project>')
PY
dotnet run --project "$probe_root/Probe.csproj" --artifacts-path "$probe_root/artifacts" -- "${1:-benchmarks/.run/workspace-cache.json}" "${2:-10000}" "${3:-8192}"
