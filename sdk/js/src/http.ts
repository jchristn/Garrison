/** Small HTTP helpers shared by the management client and the app gateway client. Not part of the public API. */

/** Encode one path segment; rejects an empty identifier. */
export function seg(value: string): string {
  if (!value) throw new Error("identifier is required");
  return encodeURIComponent(value);
}

/** Build a query string (without the leading ?) from an object, skipping undefined, null, and empty values. */
export function queryString(params?: Record<string, any>): string {
  if (!params) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    const text = value instanceof Date ? value.toISOString() : typeof value === "boolean" ? (value ? "true" : "false") : String(value);
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`);
  }
  return parts.join("&");
}

/** One parsed server-sent event. */
export interface ServerSentEvent { event: string; id?: string; data: string; }

/** Parse a server-sent event stream into events until the body ends. */
export async function* readServerSentEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<ServerSentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event: string | undefined;
  let id: string | undefined;
  let data: string[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf("\n")) >= 0) {
        let line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line === "") {
          if (data.length > 0 || event) yield { event: event ?? "message", id, data: data.join("\n") };
          event = undefined; id = undefined; data = [];
          continue;
        }
        if (line.startsWith(":")) continue;
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        let fieldValue = colon < 0 ? "" : line.slice(colon + 1);
        if (fieldValue.startsWith(" ")) fieldValue = fieldValue.slice(1);
        if (field === "event") event = fieldValue;
        else if (field === "id") id = fieldValue;
        else if (field === "data") data.push(fieldValue);
      }
    }
    if (data.length > 0) yield { event: event ?? "message", id, data: data.join("\n") };
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
