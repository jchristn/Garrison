#!/usr/bin/env bash
# Fails when tracked C# files use `var`, partial types or methods, or tuples. See CLAUDE.md "C# code style".
# The checks are pattern based: comments and string literals that mention these words are skipped, so a hit is
# almost always real.
set -euo pipefail
cd "$(dirname "$0")/.."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FILES=$(git ls-files --cached --others --exclude-standard -- '*.cs')
else
  FILES=$(find . -type f -name '*.cs' -not -path '*/bin/*' -not -path '*/obj/*')
fi
[ -n "${FILES}" ] || { echo "no C# files"; exit 0; }
COMMENT='^[^:]+:[0-9]+:[[:space:]]*(//|\*)'
FOUND=0
check() {
  local label="$1" pattern="$2" hits
  hits=$(echo "${FILES}" | tr '\n' '\0' | xargs -0 grep -nE "${pattern}" 2>/dev/null | grep -vE "${COMMENT}" | grep -vE '"[^"]*('"$3"')[^"]*"' || true)
  if [ -n "${hits}" ]; then
    echo "${label}:"
    echo "${hits}"
    FOUND=1
  fi
}
check "var" '(^|[^A-Za-z0-9_@.])var[[:space:]]+[A-Za-z_(]' 'var'
check "partial" '(^|[[:space:]])partial[[:space:]]+(class|struct|record|interface|void|[A-Za-z_<>?]+[[:space:]]+[A-Za-z_]+[[:space:]]*\()' 'partial'
check "tuple" '\bTuple\b|ValueTuple|\.Item[0-9]\b|<\([A-Za-z_][A-Za-z0-9_<>?]*([[:space:]]+[A-Za-z_]+)?[[:space:]]*,|^[[:space:]]*(public|private|internal|protected|static|async|[[:space:]])*(Task<)?\([A-Za-z_<>?]+([[:space:]]+[A-Za-z_]+)?[[:space:]]*,[^)]*\)>?[[:space:]]+[A-Za-z_]+[[:space:]]*\(|foreach[[:space:]]*\([[:space:]]*\(|^[[:space:]]*\([[:space:]]*[A-Za-z_]+[[:space:]]*,[[:space:]]*[A-Za-z_]+[[:space:]]*\)[[:space:]]*=[^=>]' 'Tuple|Item'
if [ "${FOUND}" -ne 0 ]; then
  echo "C# style violations found (no var, no partial types, no tuples)" >&2
  exit 1
fi
echo "no var, partial, or tuple usage found"
