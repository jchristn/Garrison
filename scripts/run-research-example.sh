#!/usr/bin/env bash
# Runs the research overview example (examples/agentic-apps/research-overview) end to end on the fake harness: the
# examples Touchstone suite applies the doc-converter and research bundles, starts an anonymous app session, and checks
# that the conversation fans out, writes report.md, and produces report.pdf in the file space.
#
# Options:
#   --postgresql       also run against Postgresql (GARRISON_TEST_PG_PORT and friends as for the other suites)
#   --real-tools IMAGE also convert a sample report with the real pandoc and LibreOffice inside IMAGE, a worker image
#                      built with --build-arg INCLUDE_DOC_TOOLS=true
# Exits non-zero when any step fails.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROVIDERS="sqlite"
IMAGE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --postgresql) PROVIDERS="sqlite,postgresql"; shift ;;
    --real-tools) IMAGE="$2"; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done

cd "$ROOT"
dotnet build src/Garrison.sln -v quiet -nologo
SUITES="examples-sqlite"
[ "$PROVIDERS" = "sqlite,postgresql" ] && SUITES="examples-sqlite,examples-postgresql"
GARRISON_TEST_PROVIDERS="$PROVIDERS" dotnet run --project src/Test.Automated -f net10.0 --no-build -- --suites "$SUITES"

if [ -n "$IMAGE" ]; then
  WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-research-XXXXXX")"
  trap 'rm -rf "$WORK"' EXIT
  cp examples/agentic-apps/doc-converter/convert.sh examples/agentic-apps/doc-converter/reference.docx "$WORK/"
  printf '# Research overview: decision models\n\nDecision models turn evidence into choices.\n' > "$WORK/report.md"
  docker run --rm --user 0 -v "$WORK":/work -w /work --entrypoint sh "$IMAGE" -c \
    'sh convert.sh report.md out/report.pdf reference.docx "" && test -s out/report.pdf && head -c 5 out/report.pdf | grep -q "%PDF" && echo "real tools: report.pdf converted"'
fi
