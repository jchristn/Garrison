// Run and conversation transcript export (P12.27). The server renders the transcript (Markdown or a typed JSON
// document) with secrets redacted; the dashboard only asks for it and saves it as a file.

/** Transcript formats the server accepts, in menu order. */
export const TRANSCRIPT_FORMATS = ['markdown', 'json'];

/** Query parameters for a transcript request. */
export function transcriptQuery(format = 'markdown', includeThinking = false) {
  const f = String(format || 'markdown').toLowerCase();
  if (!TRANSCRIPT_FORMATS.includes(f)) throw new Error(`Unknown transcript format: ${format}`);
  return { format: f, includeThinking: includeThinking ? 'true' : undefined };
}

/** File name the server also proposes: <id>-transcript.md or <id>-transcript.json. */
export function transcriptFileName(id, format = 'markdown') {
  return `${id}-transcript.${String(format).toLowerCase() === 'json' ? 'json' : 'md'}`;
}

/** Media type for the saved file. */
export function transcriptMediaType(format = 'markdown') {
  return String(format).toLowerCase() === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8';
}
