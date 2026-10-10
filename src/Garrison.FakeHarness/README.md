# garrison-fake-harness

A deterministic stand-in for Claude Code, Codex, and Mux. It reads the prompt from stdin and answers `Echo: ` followed by the first 200 characters of the prompt, emitting the same event stream shape as the real CLI so the worker's parsers, outcome classification, and event shipping can be exercised without spending tokens.

```
garrison-fake-harness --version
garrison-fake-harness --format claude|codex|mux|plain [--scenario file] [--delay-ms N] [--fail]
                      [--exit-code N] [--hang] [--large-output N] [--mcp-call url,token,tool,argsjson]
                      [--output-last-message file] [--stderr text] [--tool-calls N] [--think-ms N]
```

| Option | Effect |
|---|---|
| `--format` | Output shape: Claude stream-json, Codex JSONL, Mux JSONL (contract version 2), or plain text. Default `plain`. |
| `--scenario file` | Use the file's contents as the answer instead of the echo. |
| `--delay-ms N` | Sleep between streamed text chunks. |
| `--fail` | Report failure in the final event and exit 1 (unless `--exit-code` is given). |
| `--exit-code N` | Exit with this code. |
| `--hang` | Emit the first event, then sleep until killed. Used for timeout and cancellation tests. |
| `--large-output N` | Emit N filler lines first. Used for the stdout limit test. |
| `--mcp-call url,token,tool,argsjson` | Call an MCP tool (bearer token) and append its result to the answer. Used for delegation tests. |
| `--output-last-message file` | Also write the answer to a file, like `mux --output-last-message`. |
| `--stderr text` | Write text to stderr before exiting. |
| `--tool-calls N` | Emit N fake tool calls (`fake_tool`, each with a successful result) before the answer. Used to test tool call counting. |
| `--think-ms N` | Pause between the thinking event and the first answer chunk. Default 20, so every run has a measurable time to first token and streaming time. |

In the Claude, Codex, and Mux formats the answer is preceded by one thinking event (a `thinking_delta`, a `reasoning` item, or `assistant_thinking`), and the final usage reports 2 reasoning tokens (`output_tokens_details.thinking_tokens` for Claude, `reasoning_output_tokens` for Codex). Plain format has no thinking event.

Unknown arguments are ignored, so a harness profile can pass extra flags.

## How it is invoked

The assembly is framework-dependent (`garrison-fake-harness.dll`). There are two supported ways to run it:

- **Worker image:** the image publishes the project to `/opt/garrison/fake/` and installs `garrison-fake-harness.sh` as `/usr/local/bin/garrison-fake-harness`, so the `builtin/fake` harness profile uses the executable `garrison-fake-harness` with arguments `--format claude` and the prompt on stdin, parsed with `ClaudeStreamJson`.
- **Tests:** the test projects reference this project, so `garrison-fake-harness.dll` is copied next to the runner. Tests run it as `dotnet <AppContext.BaseDirectory>/garrison-fake-harness.dll --format ...`.
