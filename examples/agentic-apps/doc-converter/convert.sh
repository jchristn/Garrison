# Converter script run by the pandoc-converter harness profile (see doc-converter.yaml). Arguments, in order:
# source path, target path, reference document path (may be empty), base font size (may be empty). Paths are relative to
# the run's working directory; the conversation file space is mounted at files/.
set -eu
src="$1"; out="$2"; ref="${3:-}"; size="${4:-}"
warnings=""
if [ ! -f "$src" ]; then
  printf '{"resultPath":"","warnings":["Source %s does not exist."]}\n' "$src"
  exit 2
fi
mkdir -p "$(dirname "$out")"
if [ -n "$size" ] && [ -z "$ref" ]; then
  warnings="\"baseFontSize needs a reference document with that size; it was ignored.\""
fi
case "$out" in
  *.pdf)
    tmp="${out%.pdf}.docx"
    if [ -n "$ref" ]; then pandoc "$src" -o "$tmp" --reference-doc="$ref"; else pandoc "$src" -o "$tmp"; fi
    soffice --headless --convert-to pdf --outdir "$(dirname "$out")" "$tmp" > /dev/null
    rm -f "$tmp"
    ;;
  *)
    if [ -n "$ref" ]; then pandoc "$src" -o "$out" --reference-doc="$ref"; else pandoc "$src" -o "$out"; fi
    ;;
esac
printf '{"resultPath":"%s","warnings":[%s]}\n' "$out" "$warnings"
