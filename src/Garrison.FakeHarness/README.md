# garrison-fake-harness

A deterministic stand-in for Claude Code, Codex, and Mux. It reads the prompt from stdin and answers `Echo: ` followed by the first 200 characters of the prompt, emitting the same event stream shape as the real CLI so the worker's parsers, outcome classification, and event shipping can be exercised without spending tokens.

```
garrison-fake-harness --version
garrison-fake-harness --format claude|codex|codex-app-server|mux|plain [--scenario file] [--delay-ms N] [--fail]
                      [--exit-code N] [--hang] [--large-output N] [--mcp-call url,token,tool,argsjson]
                      [--output-last-message file] [--stderr text] [--tool-calls N] [--think-ms N]
                      [--answer text] [--resume-answer text] [--resume sessionId] [--structured-output]
                      [--ignore-sigterm] [--loop-text text] [--spawn-child pidfile] [--tool-sleep-ms N]
                      [--request-approval]
```

| Option | Effect |
|---|---|
| `--format` | Output shape: Claude stream-json, Codex JSONL, Mux JSONL (contract version 2), or plain text. Default `plain`. `codex-app-server` serves the Codex app-server JSON-RPC protocol instead (see below). |
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
| `--answer text` | Answer with this text instead of the echo (after `--scenario`, which it overrides). Used to emit valid or invalid JSON for structured output tests. |
| `--resume-answer text` | The answer to give when a session is resumed with `--resume`. Defaults to `--answer`. Used to fix (or not fix) the output on a structured output repair. |
| `--resume sessionId` | Resume a session. Each run records its session as `$HOME/.garrison-fake/sessions/<id>.txt`; resuming reports the same session ID. An unknown session prints `No conversation found with session ID: <id>` to stderr and exits 1, so a resume only works in the same home directory, like a real CLI. |
| `--structured-output` | In Claude format, also report the answer as `structured_output` in the result event when it parses as JSON, the way Claude Code does with `--json-schema`. |
| `--ignore-sigterm` | Swallow SIGTERM so only SIGKILL stops the process. Used to prove the worker kills a harness that ignores the graceful stop. |
| `--loop-text text` | After the thinking event and the answer, stream `text` as assistant text deltas forever (`\n`, `\r`, and `\t` are expanded), like a model stuck repeating `* \n`. `--delay-ms` sets the pause between deltas (default 1 ms). Used to test the repetition guard end to end. |
| `--spawn-child pidfile` | Start a child process (`sleep 600`) that inherits stdout and write its process ID to `pidfile`. Used to check that stopping a harness also stops its children. Unix only. |
| `--tool-sleep-ms N` | Pause N milliseconds between each fake tool call and its result (with `--tool-calls`). Used to check that a long tool execution does not count as no progress. |
| `--request-approval` | In `codex-app-server` format, send an `item/commandExecution/requestApproval` request before answering, print the client's decision to stderr (`fake app-server: approval answered ...`), and report the command as declined unless it was accepted. |
| `--think-ms N` | Pause between the thinking event and the first answer chunk. Default 20, so every run has a measurable time to first token and streaming time. |

In the Claude, Codex, and Mux formats the answer is preceded by one thinking event (a `thinking_delta`, a `reasoning` item, or `assistant_thinking`), and the final usage reports 2 reasoning tokens (`output_tokens_details.thinking_tokens` for Claude, `reasoning_output_tokens` for Codex). Plain format has no thinking event.

In `codex-app-server` format the fake reads JSON-RPC requests from stdin and answers `initialize`, `account/login/start`, `thread/start`, `thread/resume` (an unknown thread gets an error response, like a missing rollout), and `turn/start` the way Codex 0.159.3 does. A turn sends `turn/started`, the `--tool-calls` command items, a reasoning item with one summary delta, the answer as one `item/agentMessage/delta` per word (`--delay-ms` apart), `thread/tokenUsage/updated`, and `turn/completed` (status `failed` with `--fail`; never with `--hang`). Threads are recorded under `$HOME/.garrison-fake/sessions` like the other formats. It exits when stdin closes. To make the worker's behavior checkable it prints `fake app-server: api key login`, `fake app-server: approval policy ...`, and `fake app-server: output schema received` to stderr.

Unknown arguments are ignored, so a harness profile can pass extra flags.

## How it is invoked

The assembly is framework-dependent (`garrison-fake-harness.dll`). There are two supported ways to run it:

- **Worker image:** the image publishes the project to `/opt/garrison/fake/` and installs `garrison-fake-harness.sh` as `/usr/local/bin/garrison-fake-harness`, so the `builtin/fake` harness profile uses the executable `garrison-fake-harness` with arguments `--format claude` and the prompt on stdin, parsed with `ClaudeStreamJson`.
- **Tests:** the test projects reference this project, so `garrison-fake-harness.dll` is copied next to the runner. Tests run it as `dotnet <AppContext.BaseDirectory>/garrison-fake-harness.dll --format ...`.
