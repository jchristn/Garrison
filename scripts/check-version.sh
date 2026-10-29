#!/usr/bin/env bash
# Fails when a file that mirrors the Garrison version disagrees with src/Directory.Build.props,
# or when it carries an -alpha Garrison version. Mirrors are listed in scripts/version-mirrors.txt.
# Versions and tags are v0.x.y with no -alpha suffix; a 0.x version means alpha.
set -euo pipefail
cd "$(dirname "$0")/.."
TOKEN='[0-9]+\.[0-9]+\.[0-9]+[0-9A-Za-z.-]*'
VERSION=$(grep -o -E '<Version>[^<]+</Version>' src/Directory.Build.props | head -n 1 | sed -E 's#</?Version>##g')
if [ -z "${VERSION}" ]; then
  echo "no <Version> found in src/Directory.Build.props" >&2
  exit 1
fi
FOUND=0
case "${VERSION}" in
  *-alpha*)
    echo "src/Directory.Build.props: version ${VERSION} carries -alpha; a 0.x version already means alpha"
    FOUND=1
    ;;
esac
FILES=""
while IFS='|' read -r file pattern; do
  case "${file}" in
    ''|'#'*) continue ;;
  esac
  if [ ! -f "${file}" ]; then
    echo "${file}: listed in scripts/version-mirrors.txt but missing"
    FOUND=1
    continue
  fi
  FILES="${FILES}${file}"$'\n'
  regex="${pattern//@V@/${TOKEN}}"
  matches=$(grep -n -o -E "${regex}" "${file}" || true)
  if [ -z "${matches}" ]; then
    echo "${file}: no line matches '${pattern}' (mirror moved or removed; update scripts/version-mirrors.txt)"
    FOUND=1
    continue
  fi
  while IFS= read -r match; do
    line="${match%%:*}"
    found=$(printf '%s\n' "${match#*:}" | grep -o -E "${TOKEN}" | tail -n 1)
    if [ "${found}" != "${VERSION}" ]; then
      echo "${file}:${line}: version ${found} does not match ${VERSION}"
      FOUND=1
    fi
  done <<< "${matches}"
done < scripts/version-mirrors.txt
while IFS= read -r file; do
  [ -n "${file}" ] || continue
  if grep -n -E '[0-9]+\.[0-9]+\.[0-9]+-alpha' "${file}" >/dev/null 2>&1; then
    grep -n -E '[0-9]+\.[0-9]+\.[0-9]+-alpha' "${file}" | sed "s#^#${file}:#"
    FOUND=1
  fi
done <<< "$(printf '%s' "${FILES}" | sort -u)"
if [ "${FOUND}" -ne 0 ]; then
  echo "version mirrors disagree with src/Directory.Build.props (${VERSION}); fix the lines above" >&2
  exit 1
fi
echo "all version mirrors report ${VERSION}"
