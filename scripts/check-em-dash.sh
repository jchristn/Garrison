#!/usr/bin/env bash
# Fails when any tracked text file contains an em-dash (U+2014). See WRITING_DOCUMENTS.md.
set -euo pipefail
cd "$(dirname "$0")/.."
PATTERN=$'\xe2\x80\x94'
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FILES=$(git ls-files --cached --others --exclude-standard)
else
  FILES=$(find . -type f -not -path './.git/*' -not -path '*/node_modules/*' -not -path '*/bin/*' -not -path '*/obj/*')
fi
FOUND=0
while IFS= read -r file; do
  [ -f "${file}" ] || continue
  case "${file}" in
    *.png|*.jpg|*.jpeg|*.ico|*.gif|*.woff|*.woff2|*.ttf|*.db|*.zip|*.tar|*.gz) continue ;;
  esac
  if grep -n -F "${PATTERN}" "${file}" >/dev/null 2>&1; then
    grep -n -F "${PATTERN}" "${file}" | sed "s#^#${file}:#"
    FOUND=1
  fi
done <<< "${FILES}"
if [ "${FOUND}" -ne 0 ]; then
  echo "em-dash characters found; rewrite those sentences" >&2
  exit 1
fi
echo "no em-dashes found"
