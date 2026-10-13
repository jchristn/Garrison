#!/usr/bin/env bash
# Build reviewable packages without publishing or changing versions.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*<Version>\([^<]*\)<\/Version>.*/\1/p' "$ROOT/src/Directory.Build.props" | head -1)"
OUTPUT="${GARRISON_PACKAGE_OUTPUT:-$ROOT/artifacts/packages/v$VERSION}"
PYTHON="${GARRISON_PACKAGE_PYTHON:-python3}"
mkdir -p "$OUTPUT"
dotnet pack "$ROOT/sdk/csharp/Garrison.Sdk/Garrison.Sdk.csproj" -c Release -o "$OUTPUT"
npm --prefix "$ROOT/sdk/js" run build
(cd "$ROOT/sdk/js" && npm pack --pack-destination "$OUTPUT")
"$PYTHON" -m build "$ROOT/sdk/python" --outdir "$OUTPUT"
"$PYTHON" -m twine check "$OUTPUT"/*.whl "$OUTPUT"/*.tar.gz
python3 - "$OUTPUT" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1]);files=[]
for path in sorted(root.iterdir()):
    if path.suffix not in ('.nupkg','.snupkg','.whl','.gz','.tgz'):continue
    files.append({'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(root/'manifest.json').write_text(json.dumps(files,indent=2)+'\n')
print('Package manifest:',root/'manifest.json')
PY
