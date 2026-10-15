# garrison-fake-harness

A deterministic stand-in for Claude Code, Codex, and Mux. It reads the prompt from stdin and answers `Echo: ` followed by the first 200 characters of the prompt, emitting the same event stream shape as the real CLI so the worker's parsers, outcome classification, and event shipping can be exercised without spending tokens.

```
garrison-fake-harness --version
garrison-fake-harness --format claude|codex|codex-app-server|mux|plain [--scenario file] [--delay-ms N] [--fail]
                      [--exit-code N] [--hang] [--large-output N] [--mcp-call url,token,tool,argsjson]
                      [--output-last-message file] [--stderr text] [--tool-calls N] [--think-ms N]
                      [--answer text] [--resume-answer text] [--resume sessionId] [--structured-output]
                      [--ignore-sigterm] [--loop-text text] [--spawn-child pidfile] [--tool-sleep-ms N]
                      [--request-approval] [--approval-command text] [--request-file-approval path]
                      [--permission-prompt-tool mcp__server__tool] [--mcp-config file] [--permission-request Tool=inputJson]
                      [--events-per-second N] [--duration-ms N]
                      [--probe "kind target [argument]"] [--probe-prompt] [--probe-timeout-ms N]
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
| `--approval-command text` | The command named in the `--request-approval` request. Default `rm -rf build`. The fake sends an `item/started` command item first, like Codex, and appends `command approval: accept` or `decline` to the answer. |
| `--request-file-approval path` | In `codex-app-server` format, also send an `item/started` file change item for `path` and an `item/fileChange/requestApproval` request for it, print the decision to stderr, and append `file approval: accept` or `decline` to the answer. |
| `--permission-prompt-tool name` | Claude Code's flag (`mcp__<server>__<tool>`). In Claude format, each `--permission-request` is asked through that tool on the server of that name in `--mcp-config`, with `tool_name`, `input`, and `tool_use_id`, the way Claude Code does. Without it every request is denied, like Claude Code in print mode. |
| `--mcp-config file` | Claude Code's flag: the MCP configuration file, read for the permission prompt tool's URL and headers. |
| `--permission-request Tool=inputJson` | Repeatable. In Claude format, emit a `tool_use` for the tool with that input, ask for permission, emit the `tool_result` (the denial message as an error when denied), and append `permission <Tool>: allow` or `deny` to the answer. Used by the approval tests. |
| `--events-per-second N` | With `--duration-ms`, stream round(N x duration / 1000) assistant text deltas (`event 000001`, `event 000002`, ...; at least one) before the answer, each at its scheduled offset from the start of the stream so the rate does not drift. 0 to 10,000; default 0. Used by the control plane load test (`benchmarks/scale.sh`). |
| `--duration-ms N` | How long the paced stream lasts, in milliseconds (0 to 3,600,000; default 0, no stream). Without `--events-per-second` the harness only waits this long, which gives a run a fixed duration. The event count and content are deterministic; only the timing follows the clock. |
| `--probe "kind target [argument]"` | Repeatable. Run an isolation probe (P11.17) and report it; see "Isolation probes" below. |
| `--probe-prompt` | Also run every prompt line that starts with `probe ` as a probe, after the `--probe` ones, so a script can pick the probes per run through the run input. |
| `--probe-timeout-ms N` | Timeout of each `connect` and `http` probe, 100 to 60,000; default 3,000. |
| `--think-ms N` | Pause between the thinking event and the first answer chunk. Default 20, so every run has a measurable time to first token and streaming time. |

In the Claude, Codex, and Mux formats the answer is preceded by one thinking event (a `thinking_delta`, a `reasoning` item, or `assistant_thinking`), and the final usage reports 2 reasoning tokens (`output_tokens_details.thinking_tokens` for Claude, `reasoning_output_tokens` for Codex). Plain format has no thinking event.

In `codex-app-server` format the fake reads JSON-RPC requests from stdin and answers `initialize`, `account/login/start`, `thread/start`, `thread/resume` (an unknown thread gets an error response, like a missing rollout), and `turn/start` the way Codex 0.159.3 does. A turn sends `turn/started`, the `--tool-calls` command items, a reasoning item with one summary delta, the answer as one `item/agentMessage/delta` per word (`--delay-ms` apart), `thread/tokenUsage/updated`, and `turn/completed` (status `failed` with `--fail`; never with `--hang`). Threads are recorded under `$HOME/.garrison-fake/sessions` like the other formats. It exits when stdin closes. To make the worker's behavior checkable it prints `fake app-server: api key login`, `fake app-server: approval policy ...`, and `fake app-server: output schema received` to stderr.

## Isolation probes

With `--probe` or `--probe-prompt`, the harness tries each probe once, in order, emits each result as an `isolation_probe` tool call as it finishes, and answers with one line per probe instead of the echo:

```
PROBE|kind|target|OUTCOME|detail
```

`OUTCOME` is `ALLOWED` (the attempt worked), `BLOCKED` (missing, denied, unreachable, timed out, or not 2xx), `DONE` (an action finished), or `ERROR` (the probe did not parse, or the action failed). A `|` or line break inside a field becomes `/` or a space, and the detail is cut at 300 characters. Details name paths, sizes, variable names, and errors; they never include file contents, variable values, or tokens.

| Probe | What it tries |
|---|---|
| `read path` | Read a file. `*` and `?` in any path segment match every entry there (up to 200 matches); `ALLOWED` names the first one read and its size. |
| `list directory` | List a directory; `ALLOWED` gives the entry count and the first ten names. |
| `env NAME` | Whether the harness's own environment has the variable. A trailing `*` matches a prefix (`env GARRISON_*`). |
| `proc-env NAME` | Whether any readable `/proc/<pid>/environ` has the variable (Linux), for example the worker's secret key in a Process run. |
| `connect host:port` | Open a TCP connection (`[v6]:port` for IPv6 addresses). |
| `http url` | GET the URL without a proxy, accepting any TLS certificate, with the Kubernetes service account token as a bearer token when `/var/run/secrets/kubernetes.io/serviceaccount/token` is readable. 2xx is `ALLOWED`. |
| `marker name text` | Write `text` to a file called `name` in the working directory (the run's workspace). The name must be a plain file name; `..` and path separators are refused. This is the only probe that writes. |
| `hold ms` | Wait, up to 600,000 ms, so another run can probe while this one is alive. The worker's no-progress guard (300 s by default) stops longer holds. |

`k8s/tests/isolation-test.sh` uses these to attack an `Untrusted` deployment on k3d (`docs/SECURITY.md`, "Isolation red-team test").

Unknown arguments are ignored, so a harness profile can pass extra flags.

## How it is invoked

The assembly is framework-dependent (`garrison-fake-harness.dll`). There are two supported ways to run it:

- **Worker image:** the image publishes the project to `/opt/garrison/fake/` and installs `garrison-fake-harness.sh` as `/usr/local/bin/garrison-fake-harness`, so the `builtin/fake` harness profile uses the executable `garrison-fake-harness` with arguments `--format claude` and the prompt on stdin, parsed with `ClaudeStreamJson`.
- **Tests:** the test projects reference this project, so `garrison-fake-harness.dll` is copied next to the runner. Tests run it as `dotnet <AppContext.BaseDirectory>/garrison-fake-harness.dll --format ...`.
