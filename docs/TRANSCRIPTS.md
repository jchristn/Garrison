# Transcripts

A transcript is a readable record of a run, or of every turn of a conversation, that you can download and share: what the caller asked, what the agent said, which tools it called with what arguments and results, which approvals it asked for and who decided them, how it ended, and what it cost. Garrison writes it as Markdown for people or as a typed JSON document for tools.

## Getting one

```bash
# A run, as Markdown
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/runs/run_.../transcript" \
  -H "Authorization: Bearer $TOKEN" -o run.md

# A conversation, every turn, as JSON, with thinking
curl -s "http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/cnv_.../transcript?format=json&includeThinking=true" \
  -H "Authorization: Bearer $TOKEN" -o conversation.json
```

| Query parameter | Default | Meaning |
|---|---|---|
| `format` | from `Accept` | `markdown` or `json`. Without it, an `Accept` header that contains `application/json` gives JSON and anything else gives Markdown. Any other value is a 400 with field code `InvalidFormat` |
| `includeThinking` | `false` | Include the harness's thinking events |

A run transcript needs Read on Run, and a conversation transcript needs Read on Conversation. A run or conversation in another tenant answers 404, the same as one that does not exist.

The response is an attachment (`Content-Disposition: attachment; filename="<id>-transcript.md"` or `.json`) with `Cache-Control: private, no-store`. The header `X-Garrison-Transcript-Truncated` is `true` when a cap cut the transcript.

The dashboard has an **Export** menu (Markdown or JSON) on the run detail page and on the conversation page. Over MCP, `garrison_get_run_transcript` and `garrison_get_conversation_transcript` return the same content (see `MCP_API.md`), and each SDK has a method for both.

## What is in it

Each turn (one per run; a run transcript has one) has:

- the run's agent, deployment, kind, status, outcome, caller, and served model;
- the input and its content type;
- created, started, and completed times;
- entries in event order: assistant text, tool calls (tool name, call identifier, and arguments), tool results (success flag and result), warnings, errors, lifecycle events, and thinking when asked for;
- the approvals the run asked for, with the tool, the summary and redacted input preview, the decision, who or what decided it, and the reason;
- the result text or the error message;
- usage: input, output, cached, and reasoning tokens, tool calls, cost (and whether it was estimated), and duration.

The transcript also carries usage totals over its turns.

In the JSON format, a tool call whose arguments are JSON carries them as the object `toolInput`, and a tool result that is a JSON object or array carries it as `toolOutput`; those entries have no `text`. Anything else, including tool text cut at `Transcripts.ToolTextMaxChars`, stays in `text`. An approval carries its redacted input as the object `input` when it is a JSON object, and as the string `inputPreview` otherwise.

Left out on purpose: standard output and standard error, progress events, raw harness output, and the separate usage and result events (their content is already on the turn). Use `GET .../runs/{id}/events` when you need every event.

Events that retention already removed (`Runs.EventRetentionDays`) cannot appear. The turn's `omittedEvents` counts them, and the Markdown says so.

## Secrets

Before anything is written, every piece of text goes through the same redactor that approval previews use: the literal values of the secrets the run's deployment binds (including the tokens inside a Codex login), then common credential shapes such as bearer tokens, OpenAI and Anthropic keys, GitHub and Slack tokens, AWS access key IDs, private key blocks, and values assigned to names like `password`, `token`, or `api_key`. Each match becomes `[REDACTED]`. Harness output was already scrubbed of bound secret values by the worker; the redactor also covers the caller's input and anything stored before.

## Size limits

| Cluster setting | Default | Range | Effect |
|---|---|---|---|
| `Transcripts.MaxBytes` | 4194304 (4 MiB) | 65536 to 67108864 | When the transcript reaches this size, later entries are left out, `truncated` is true, and `truncationNote` says where it stopped |
| `Transcripts.ToolTextMaxChars` | 2000 | 100 to 100000 | Tool call arguments and tool results longer than this are cut, and the entry's `textTruncated` is true |
| `Transcripts.MaxTurns` | 200 | 1 to 1000 | A conversation transcript includes at most this many turns, oldest first, and says how many it left out |

The transcript is built page by page from the event store and never holds more than the cap.

## Markdown

The Markdown starts with a heading and a short summary (agent, status, outcome, model, times, tokens, and cost), then one section per turn: the input, the activity in order (assistant text as paragraphs, thinking as a quote, tool calls and results in code fences, approvals, warnings, and errors), the result, and the turn's usage. Code fences are made longer than any run of backticks in the text, so content never breaks out of them.

## JSON

The JSON document (`"schema": "garrison.transcript/v1"`) is described field by field in `REST_API.md` under `GET /v1.0/api/tenants/{tenantId}/runs/{id}/transcript`. In short:

```json
{
  "schema": "garrison.transcript/v1",
  "kind": "Conversation",
  "tenantId": "default", "conversationId": "cnv_...", "agentName": "helper",
  "generatedUtc": "2026-10-14T12:00:00Z", "includesThinking": false,
  "truncated": false, "turnCount": 2,
  "usage": { "inputTokens": 2400, "outputTokens": 610, "cachedTokens": 0, "reasoningTokens": 0, "toolCallCount": 1, "costUsd": 0.021, "costEstimated": false },
  "turns": [
    { "turn": 1, "runId": "run_...", "status": "Succeeded", "input": "...", "entries": [], "approvals": [], "result": "...", "usage": {}, "omittedEvents": 0, "truncated": false }
  ]
}
```

Null fields are left out, and enums are strings.
