/**
 * Error type shared by the management client and the app gateway client. It has no other dependencies, so the
 * gateway entry point (@garrison/sdk/gateway) can use it without pulling in the management client.
 */

/** A non-2xx answer from the Garrison API. statusCode is the HTTP status; body is the raw response text. */
export class GarrisonError extends Error {
  readonly statusCode: number;
  readonly body: string;
  readonly error?: Record<string, any>;

  constructor(statusCode: number, body: string) {
    let parsed: Record<string, any> | undefined;
    try { parsed = body ? JSON.parse(body) : undefined; } catch { parsed = undefined; }
    if (parsed !== undefined && (typeof parsed !== "object" || parsed === null)) parsed = undefined;
    super(`Garrison API returned ${statusCode}` + (parsed ? ` ${parsed.code ?? ""}: ${parsed.message ?? ""}` : body ? `: ${body.slice(0, 300)}` : ""));
    this.name = "GarrisonError";
    this.statusCode = statusCode;
    this.body = body;
    this.error = parsed;
  }

  get code(): string | undefined { return this.error?.code; }
  /** Field-level validation details keyed by field path, when the server returned them. */
  get fields(): Record<string, string> | undefined { return this.error?.fields; }
  /** Machine codes of validation errors keyed by field path (for example url: DestinationBlocked). */
  get fieldCodes(): Record<string, string> | undefined { return this.error?.fieldCodes; }
  /** Per-setting validation errors keyed by setting path (settings routes, HTTP 400). */
  get errors(): Record<string, string> | undefined { return this.error?.errors; }
}
