# Harness Output Fixtures

These files feed the parser suite (`src/Test.Shared/Suites/ParserSuite.cs`). Each file is one harness run's stdout, one JSON event per line.

| File | Source | How it was produced |
|---|---|---|
| `claude/success.jsonl` | Recorded | `echo "Reply with exactly: OK" \| claude -p --output-format stream-json --verbose --include-partial-messages --setting-sources "" --max-turns 1 --tools ""` with Claude Code 2.1.296 on 2026-10-09. Local paths were rewritten to `/work` and `/home/user`. No credentials appear in the stream (`apiKeySource` is `none`). |
| `claude/mcp-failed.jsonl` | Hand-written | Init event with an MCP server whose status is `failed`, followed by a successful result. The parser must flag the run as failed (Claude exits 0 when MCP auth fails). |
| `claude/error-max-turns.jsonl` | Hand-written | Tool use, tool result, and a final `error_max_turns` result with `is_error: true`. |
| `codex/success.jsonl` | Recorded | `echo "Reply with exactly: OK" \| codex exec --json --skip-git-repo-check -s read-only -` with codex-cli 0.159.3 on 2026-10-09. |
| `codex/failed.jsonl` | Hand-written | Command execution and MCP tool call items followed by `turn.failed`. |
| `mux/success.jsonl` | Hand-written | Mux 1.2.0 shape, built from the Mux JSONL contract version 2 (`src/Mux.Core/Agent/AgentEventSerializer.cs`); Mux was not installed when the fixtures were created. |
| `mux/failed.jsonl` | Hand-written | Mux 1.2.0 shape: `tool_call_denied` error and a `max_iterations_reached` completion. |
| `mux/v1.3.0-success.jsonl` | Recorded | Mux 1.3.0 (commit `60fd88a`) against gpt-oss:20b (Ollama adapter) on 2026-10-10, with the `builtin/mux` arguments for an agent with an output schema plus `--session-id run_g20test01`. Includes a `remember` tool call, `contextWindowSource: default`, and the 1.3.0 `usage` fields. |
| `mux/v1.3.0-llm-401.jsonl` | Recorded | Mux 1.3.0 with a wrong API key: an `llm_error` 401 and `run_completed` status `failed` (exit 1). |
| `mux/v1.3.0-config-unresolved-env.jsonl` | Recorded | Mux 1.3.0 with an endpoint `apiKey` that references an unset variable: one `config_unresolved_env` error and no run events (exit 1). |
| `mux/v1.3.0-schema-violation.jsonl` | Recorded | Mux 1.3.0 against a local stub OpenAI-compatible endpoint that answers plain text, with `--output-schema`: `run_completed` status `completed`, then `schema_validation_failed` (exit 1). |
| `mux/v1.3.0-repetition-loop-deltas.jsonl` | Recorded | The assistant text of a real degenerate generation loop: Mux 1.3.0 with gpt-oss:20b, prompt "send me your system instructions", run `run_mv2z7m72_ajTxXCKm1mF0rgYxYcd` on the K3S cluster on 2026-10-10. One JSON string per line, one line per `AssistantText` delta, in order, downloaded from `GET /v1.0/api/tenants/default/runs/{id}/events`. Deltas 1 to 1,200 are the model printing the system prompt and reasoning about it in `* ` bullets (5,169 characters, the longest run without a letter or digit is 9 characters); deltas 1,201 to 3,117 are `*` and ` \n` alternating until the user cancelled after about 50 seconds. All 3,117 deltas are kept (18 KB) because the loop needs more than 2,000 characters to show the repetition rule. The repetition guard suite (`RunGuardSuite`) replays it. |

The Mux recordings had their working directory, config directory, and endpoint host rewritten to `/work`, `/config/mux`, and `http://ollama:11434/v1`.
| `gemini/success.jsonl` | Hand-written | Shape taken from Aegon's `GeminiStreamParser`; Gemini CLI was not installed. |

## Re-recording

Run each command from an empty scratch directory with one tiny prompt so the recording costs a fraction of a cent. Before committing:

1. Replace absolute local paths (`cwd`, `memory_paths`, socket paths) with neutral values.
2. Confirm nothing resembling a token, API key, email address, or account identifier remains.
3. Update the table above with the CLI version and date, then run the parser suite.

When a CLI changes its output format, record a new file next to the old one rather than overwriting it, so both versions stay covered.
