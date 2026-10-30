// The API returns JSON documents it does not define (JSON Schemas, structured output, tool arguments, harness events,
// notification payloads) as JSON values. Forms edit them as text; these helpers convert at that boundary.

/** A JSON value as indented text for an editor or a code block; '' for null or undefined. A string is returned as is. */
export function jsonToText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

/** Text from an editor as the JSON value to send; null for blank text. Throws SyntaxError for text that is not JSON. */
export function textToJson(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;
  return JSON.parse(s);
}

/** A tool event's JSON (toolInput or toolOutput) as text, falling back to its text; '' when there is neither. */
export function toolEventText(event, key) {
  if (!event) return '';
  if (event[key] !== null && event[key] !== undefined) return jsonToText(event[key]);
  return event.text || '';
}
