# Harnesses

A harness is the command-line agent that does the actual work: Claude Code, Codex, Mux, Gemini CLI, or anything else that can take a prompt and print what it is doing. Garrison never links against a harness. It describes each one as data in a **harness profile**, compiles that profile together with an agent and a deployment into an `ExecutionSpec`, and hands the spec to a worker, which runs it.

This page covers what a profile contains, how a deployment changes it, how the worker runs it, the built-in profiles, and how to add a new CLI without writing code.

## From profile to process

```text
harness profile  +  deployment (model, parameters, overrides, prompts, MCP servers, secrets, workspace)
                 +  agent (name, description, output schema, delegation rules)
                 +  run (input, parameters, caller)
        |
        v   control plane: render every template, resolve secrets, mint a run token
  ExecutionSpec  (executable, argv, environment, files, stdin, parser, timeouts, MCP checks, values to scrub)
        |
        v   worker: create work/, home/, config/ directories, write files, check MCP servers, launch
  harness process  -->  stdout parsed into normalized events  -->  result, usage, outcome
```

Everything that varies by harness is in the profile, and everything is a template, so a new flag, a new environment variable, or a new config file format is a profile edit rather than a release. The worker never renders a template or reads the database; by the time a spec reaches it, every value is final except three directory placeholders.

## Built-in profiles

| Profile | Executable | Prompt | System prompt | MCP configuration | Parser | Result from |
|---|---|---|---|---|---|---|
| `builtin/claude-code` | `claude` | stdin | `--system-prompt-file` | `--mcp-config` JSON file with `--strict-mcp-config` | `ClaudeStreamJson` | final event |
| `builtin/codex` | `codex` | stdin | `-c model_instructions_file=...` | one `--config=mcp_servers.<name>...` override per setting | `CodexJsonl` | final event |
| `builtin/mux` | `mux` | stdin | `--system-prompt` file | `--mcp-config` JSON file with `--strict-mcp-config` | `MuxJsonl` | `--output-last-message` file |
| `builtin/gemini-cli` | `gemini` | stdin | `GEMINI_SYSTEM_MD` file | `settings.json` in an isolated `GEMINI_CLI_HOME` | `GeminiStreamJson` | final event |
| `builtin/generic-jsonl` | from the `executable` parameter | stdin | prepended to the prompt | none | `GenericJsonl` | final event |
| `builtin/fake` | `garrison-fake-harness` | stdin | file | none | `ClaudeStreamJson` | final event |

Built-in profiles cannot be edited. Clone one (`POST .../harness-profiles/{id}/clone`) and change the copy, or leave the profile alone and adjust it per deployment with overrides and parameters.

### Claude Code

```text
claude -p --output-format stream-json --verbose [--include-partial-messages] --setting-sources "" --disable-slash-commands
       --permission-mode <permissionMode, default acceptEdits>
       [--system-prompt-file $GARRISON_CONFIG_DIR/system-prompt.md]
       [--model <model>] [--fallback-model <fallbackModel>] [--effort <effort>]
       --max-turns <maxTurns, default 20> [--max-budget-usd <maxBudgetUsd>]
       [--mcp-config $GARRISON_CONFIG_DIR/mcp.json] --strict-mcp-config
       --allowedTools <allowedTools, default Bash,Read,Edit,Write,Glob,Grep,WebFetch,WebSearch,mcp__garrison>
       [--json-schema <agent output schema>] [--resume <session>]
```

`--setting-sources ""` and `--strict-mcp-config` keep the harness from picking up user settings or MCP servers that happen to exist on the worker. Credentials come from a secret of kind `AnthropicApiKey` (as `ANTHROPIC_API_KEY`) or `ClaudeCodeOAuthToken` (as `CLAUDE_CODE_OAUTH_TOKEN`). Deployment parameters: `permissionMode`, `allowedTools`, `anthropicBaseUrl`, `mcpToolTimeoutMs` (default 600000), and `disablePartialMessages`.

`--include-partial-messages` makes Claude Code print text as it is generated, so runs stream token by token in Invoke and over SSE. Each chunk becomes an `AssistantText` event. Set `disablePartialMessages` to `true` on a deployment to drop the flag, which reduces the number of stored events; text then arrives one message at a time.

### Codex

```text
codex exec --json --skip-git-repo-check --ignore-user-config
      -s <sandbox, default workspace-write> -C $GARRISON_WORKSPACE_DIR [-m <model>]
      -c project_doc_max_bytes=0 [-c model_reasoning_effort=<effort>]
      [-c model_instructions_file="$GARRISON_CONFIG_DIR/system-prompt.md"]
      --config=mcp_servers.<name>.url=... (and headers, required, tool_timeout_sec, approval mode, command, args, env)
      [--output-schema $GARRISON_CONFIG_DIR/output-schema.json] [resume <session>] -
```

`--ignore-user-config` and `project_doc_max_bytes=0` stop Codex from reading the worker's own configuration or an `AGENTS.md` in the workspace. MCP bearer tokens are never written into arguments: each header is passed by environment variable name (`env_http_headers`), and the worker sets those variables. Credentials come from a secret of kind `OpenAiApiKey` (as both `CODEX_API_KEY` and `OPENAI_API_KEY`) or `CodexAuthJson`, which is written to `$HOME/.codex/auth.json` with mode 600. Deployment parameters: `sandbox` and `openaiBaseUrl`.

Codex output does not stream: `codex exec --json` prints each agent message only when it is complete, so a short answer arrives in one piece at the end of the run. Streaming needs Codex's experimental `app-server` protocol, which is planned (P12.2a in `GARRISON_PLAN.md`).

### Mux

```text
mux --print --config-dir $GARRISON_CONFIG_DIR/mux -e garrison --output-format jsonl
    [--yolo] [--approval-policy <approvalPolicy>] --sandbox <sandbox, default workspace-write>
    -w $GARRISON_WORKSPACE_DIR [-m <model>] [--context-window <contextWindow>]
    --max-turns <maxTurns, default 20>
    [--system-prompt $GARRISON_CONFIG_DIR/system-prompt.md]
    [--mcp-config $GARRISON_CONFIG_DIR/mux-mcp.json --strict-mcp-config]
    [--output-schema $GARRISON_CONFIG_DIR/output-schema.json]
    --output-last-message $GARRISON_CONFIG_DIR/last-message.txt
    [--no-session-persistence (only when the agent has no output schema)]
    [--session-id <run id> (agents with an output schema, first execution only)] [--resume <session>]
```

The worker image bundles Mux 1.3.0, built from source at commit `60fd88a` (the `MUX_REF` and `MUX_VERSION` build arguments). The parser also reads Mux 1.2.0 output, so a worker with an older `mux` on its `PATH` still works, minus the 1.3.0 extras below.

Mux talks to whatever model endpoint you point it at. The profile writes a private config directory with three files rendered from prompt templates: `endpoints.json` (`builtin/mux-endpoints`, one endpoint named `garrison` built from the deployment parameters `adapterType` (default `openai-compatible`), `baseUrl` (default `https://api.openai.com/v1`), `timeoutMs`, and `maxTokens`, plus the deployment model), `settings.json`, and `subagents.json`. The API key comes from a secret of kind `OpenAiApiKey`, exposed as `GARRISON_MUX_API_KEY` and referenced from `endpoints.json`, so it never appears in a file.

`settings.json` (`builtin/mux-settings`) turns off the Mux features that only make sense for a person at a terminal, because each one adds tools, prompt text, or side effects to a headless run:

| Setting | Value | Why |
|---|---|---|
| `memoryEnabled` | `false` | Mux's persistent memory adds the `remember`, `recall`, and `forget` tools and a `## Memory` section to the system prompt. Garrison runs are independent, so the tools only distract the model (a gpt-oss run asked for its instructions printed that section back and then looped). |
| `skillsEnabled`, `projectSkillsEnabled` | `false` | No user skills or skills checked into the workspace repository are listed in the system prompt or offered as tools. |
| `taskPlanningEnabled` | `false` | No `plan_tasks` and `update_task` tools. |
| `fileMentionMaxBytes` | `0` | An `@path` in the prompt is not expanded into an attached file, so text such as an email address in a caller's input cannot pull workspace files into the prompt. |
| `setupCompleted` | `true` | The first-run setup wizard is never offered. |

Project instruction files (`AGENTS.md`, `CLAUDE.md`, `MUX.md` in the workspace) stay on, as they do for Claude Code and Codex. Clone the template to change any of this.

Deployment parameters:

| Parameter | Default | Meaning |
|---|---|---|
| `baseUrl` | `https://api.openai.com/v1` | The model endpoint's base URL. |
| `adapterType` | `openai-compatible` | `openai-compatible`, `openai`, `ollama`, or `vllm`. Mux applies the adapter's own tool-call settings. |
| `timeoutMs` | `600000` | Per-request timeout in milliseconds. |
| `contextWindow` | unset | The model's context window in tokens, passed as `--context-window` (Mux 1.3.0 or later). Mux accepts 1024 to 1048576. Unset, Mux uses its built-in 32,768, which leaves about 19,700 tokens for input; Garrison then adds a `Warning` event to the run saying so. Set it to what the endpoint really serves (for example `131072` for gpt-oss on Ollama with a matching `num_ctx`). |
| `maxTokens` | unset | The most tokens one response may generate, written as the endpoint's `maxTokens`. Mux clamps it to 1024 to 131072 and uses 8192 when it is unset. It is also reserved out of the context window. |
| `approvalPolicy` | unset (`--yolo`) | `auto` or `deny` instead of approving every tool call. |
| `sandbox` | `workspace-write` | `none`, `read-only`, or `workspace-write`. |

Both numbers are whole numbers written into the command line or `endpoints.json` as they are, so a value that is not a number makes the run fail. Docker Compose and the Kubernetes bootstrap set them on the sample `mux-helper` from `MUX_CONTEXT_WINDOW` and `MUX_MAX_TOKENS` when those are set (`docs/DOCKER.md`).

What Garrison reads from the Mux JSONL stream:

- `run_completed.status`: `completed` and `completed_with_errors` are success, as long as Mux also exits 0. `failed` (Mux 1.3.0: the model never answered, for example after a 401 or a dropped stream), `max_iterations_reached`, and `budget_exceeded` fail the run, and the message of the last `error` event becomes the run's error.
- Credential failures: a model request that failed with 401, and the 1.3.0 error `config_unresolved_env` (the endpoint references an environment variable that is not set, usually because no `OpenAiApiKey` secret is bound), end the run as `NotCredentialed`.
- `usage`: `inputTokens`, `outputTokens`, and from 1.3.0 `cachedTokens`, `reasoningTokens`, and `costUsd` (only when Mux has a price for the model).
- `run_started.contextWindowSource` (1.3.0): `default` produces the warning described above.
- `run_started.mcp.enabled` (1.3.0, falling back to the deprecated `mcp.supported`): when the run requires MCP servers and Mux reports MCP as not enabled, the run fails.
- `sessionId`: Mux print mode keeps no session unless asked, so for agents with an output schema the profile passes `--session-id <run id>`; that is the session a structured output repair resumes.
- Mux checks `--output-schema` itself and exits 1 with `schema_validation_failed` when the answer does not match. Garrison treats that as an answer to validate, not as a harness failure, so the usual repair (below) can still run in the same session.

### Gemini CLI

```text
gemini -p "" -o stream-json --skip-trust --approval-mode <approvalMode, default yolo>
       [-m <model>] [--allowed-mcp-server-names <names>] [--resume <session>]
```

Settings, including MCP servers, are written to an isolated `GEMINI_CLI_HOME` from `builtin/gemini-settings`, and the system prompt is passed as the file named by `GEMINI_SYSTEM_MD`. The key comes from a secret of kind `GeminiApiKey`. Gemini CLI is not in the worker image unless it is built with `INCLUDE_GEMINI=true`.

### Generic JSON lines and the fake harness

`builtin/generic-jsonl` is a starting point for any CLI that reads a prompt on stdin and prints one JSON object per line. Set the `executable` parameter (and `argument1`, `argument2` if it needs them) on the deployment, or clone the profile and set the four field paths described under Parsers below. A secret of kind `GenericEnv` becomes `API_KEY`.

`builtin/fake` runs `garrison-fake-harness`, which echoes the prompt in Claude Code's stream-json format without spending tokens. Its deployment parameters are `format` (`claude`, `codex`, `mux`, or `plain`), `delayMs`, `scenario`, `exitCode`, `answer` (text to answer with instead of the echo), `resumeAnswer` (the answer when a session is resumed), and `structuredOutput` (`true` also reports the answer as Claude Code's `structured_output` when it is JSON). It supports resume: each session is kept under `$HOME/.garrison-fake/sessions`, so a resume only works in the same run home, like a real CLI. Tests and the cluster smoke test use it.

## Profile fields

| Field | Meaning |
|---|---|
| `harnessType` | `ClaudeCode`, `Codex`, `Mux`, `GeminiCli`, or `Generic`. Workers advertise which types they can run, and runs are only leased to workers that have the type. |
| `executable` | Executable name or path. A template, so it can come from a parameter. |
| `arguments` | Ordered argument templates (below). |
| `environment` | Environment variable templates. `isSecret` marks values to scrub from output. |
| `files` | Files to write before launch (below). |
| `promptDelivery` | `Stdin`, `Argument` (the prompt, or `promptArgumentTemplate`, is appended as the last argument), or `File` (written to the config directory as `promptArgumentTemplate`, default `prompt.md`). |
| `systemPromptDelivery` | `File` (written to `systemPromptTarget` in the config directory), `Argument` (`systemPromptTarget` is the flag), `Environment` (`systemPromptTarget` is the variable), `PrependToPrompt`, or `None` (the profile handles it with its own arguments or files). |
| `mcpConfigFormat`, `mcpConfigFileName` | Which MCP configuration dialect the harness reads and where. Informational for the built-in formats, which are produced by the profile's own files and arguments. |
| `outputParser` | `ClaudeStreamJson`, `CodexJsonl`, `MuxJsonl`, `GeminiStreamJson`, `GenericJsonl`, or `PlainText`. |
| `resultSource` | `ParserFinalEvent`, `LastMessageFile` (read `resultFileName` from the config directory), or `Stdout`. |
| `successPolicy` | `FinalEvent` (the parser saw a successful final event), `ExitCode` (the exit code is in `successExitCodes`), or `FinalEventAndExitCode`. `PlainText` always uses `ExitCode`. |
| `genericTextField`, `genericFinalField`, `genericSuccessField`, `genericSuccessValue` | Dotted JSON paths for `GenericJsonl`: assistant text, the final result, and the field and value that mean success. |
| `defaultTimeoutSeconds` | Deadline when the deployment does not set one (5 to 86400, default 1800). |
| `killGraceSeconds` | Time between asking the process to stop and killing its process tree (0 to 60, default 5). |
| `maxOutputBytes` | Stdout limit; the run fails with `OutputLimitExceeded` beyond it (default 64 MiB). |
| `stderrTailBytes` | How much stderr to keep for diagnosis (default 8000). |
| `isolateHome` | Give each run its own `HOME` (and `USERPROFILE`, and `CODEX_HOME` for Codex). On by default for every built-in. |
| `supportsResume` | Whether the harness can resume a session by ID. Required for the structured output repair (see [Structured output validation and repair](#structured-output-validation-and-repair)); the profile's arguments must use `run.resumeSessionId`. On for `builtin/claude-code`, `builtin/codex`, `builtin/mux`, `builtin/gemini-cli`, and `builtin/fake`. |
| `successExitCodes`, `probeArguments` | Exit codes that count as success, and the arguments used to check the harness is installed (`--version`). |
| `credentialEnvironmentAllowlist` | The only environment variables allowed to reference a secret. When the list is not empty, an environment template (from the profile or a deployment override) that references a secret under any other name fails compilation with `SecretNotAllowed`. |

### Arguments

Each argument template renders to exactly one argv entry, so values with spaces never need quoting and never split.

| Field | Meaning |
|---|---|
| `template` | The value. An empty template produces an empty argument (Claude Code's `--setting-sources ""`). |
| `condition` | Optional. The argument is skipped when the condition renders empty or `false`. Flags and their values are separate arguments with the same condition. |
| `repeatOver` | Optional list variable, such as `resources.httpMcpServers`. The argument is emitted once per element, with the element available as `this`. |

### Files

| Field | Meaning |
|---|---|
| `baseDirectory` | `Config` (private to the run, deleted afterwards), `Workspace` (the harness's working directory), or `Home` (the run's `HOME`). |
| `pathTemplate` | Relative path. Absolute paths and `..` are rejected. |
| `contentTemplate` | Content. Usually includes a `ConfigFile` prompt template, as in `{{> builtin/claude-code-mcp-config}}`. |
| `condition`, `mode`, `isSecret` | Skip when empty; octal file mode such as `600`; scrub the content from output. |

### Directory placeholders

The control plane does not know where the worker will put a run, so templates refer to the run's directories with placeholders that the worker replaces in the executable, arguments, environment values, file paths, and file contents:

| Placeholder | Directory |
|---|---|
| `$GARRISON_WORKSPACE_DIR` | `<WorkRoot>/<runId>/work`, the harness's working directory |
| `$GARRISON_CONFIG_DIR` | `<WorkRoot>/<runId>/config`, for prompts and configuration files |
| `$GARRISON_HOME_DIR` | `<WorkRoot>/<runId>/home`, the isolated `HOME` |

The same values are available to templates as `run.workspaceDir`, `run.configDir`, and `run.homeDir`.

## Template variables

Every string in a profile is rendered with the Garrison template language (see `docs/PROMPTS.md` for syntax). These are the variables available when compiling a run:

| Variable | Contents |
|---|---|
| `tenant` | `id`, `name` |
| `agent` | `id`, `name`, `displayName`, `description`, `version`, `outputSchema`, `inputSchema` (compact JSON), `tags`, `skills`, `delegation` (`mode`, `maxDepth`, `allowRecursion`, `allowList`) |
| `deployment` | `id`, `name`, `model`, `fallbackModel`, `effort`, `maxTurns`, `maxBudgetUsd`, `timeoutSeconds`, `version`, `parameters` (deployment parameters merged with allowed run overrides) |
| `run` | `id`, `kind`, `depth`, `attempt`, `parentRunId`, `rootRunId`, `deadlineUtc`, `callChain`, `resumeSessionId` (the session to resume during a structured output repair, otherwise empty), and the directory placeholders |
| `repair` | During a structured output repair: `error`, `schema`, `previousOutput`, `attempt`, `sessionId`. Empty otherwise. See `docs/PROMPTS.md` |
| `input` | `message`, `contentType`, `parameters` (map), `parameterList` (list of `name` and `value`) |
| `caller` | `type`, `id`, `name`, `agentName` (the delegating agent, when there is one) |
| `prompts` | `system` and `task`, the rendered prompts |
| `resources` | `mcpServers`, `httpMcpServers`, `stdioMcpServers` (each with `name`, `transport`, `endpoint`, `url`, `path`, `command`, `args`, `required`, `requiredTools`, `toolTimeoutSeconds`, `toolTimeoutMs`, `headers`, `env`, `bearerEnvName`, `bearerEnvRef`), `hasMcpServers`, `mcpServerNames`, `workspace` |
| `secret` | Bound secrets by alias (`secret.anthropic`), and the first bound secret of each kind (`secret.kind.AnthropicApiKey`) |
| `garrison` | `mcpUrl`, `apiUrl`, `version`, `mcpServerName`, `delegationEnabled` |
| `harness` | `type`, `profile`, `model`, `nativeSchema` (whether the harness enforces output schemas itself) |
| `now` | Compile time (UTC) |

The model can be overridden per run when the deployment allows it, which is why profiles use `deployment.model` rather than reading the deployment record.

## Secrets and credentials

Secrets are stored encrypted and bound to a deployment with an alias. A profile reaches them through `{{secret.<alias>}}` or, for profiles that should work with any deployment, `{{secret.kind.<Kind>}}`. Secret kinds: `AnthropicApiKey`, `ClaudeCodeOAuthToken`, `OpenAiApiKey`, `CodexAuthJson`, `GeminiApiKey`, `GenericEnv`, `GenericFile`, `BearerToken`, `BasicAuth`, `GitCredential`.

Every decrypted value is added to the run's scrub list. The worker replaces scrubbed values in events, results, and the stderr tail before anything leaves the node. An environment variable whose value renders empty is not set, so a profile can list both `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN` and only the bound one appears.

The worker starts each harness with an empty environment plus a short allowlist (`PATH`, `LANG`, proxy and certificate settings, and a few others; see `docs/CONFIGURATION.md`). Keys sitting in the worker's own environment do not leak into harnesses.

Subscription credentials (`ClaudeCodeOAuthToken`, `CodexAuthJson`) work, but using a personal subscription to serve other people may break the provider's terms. Use API keys for anything shared.

## Deployments

A deployment binds one agent to one profile and adjusts it without touching the profile:

| Deployment field | Effect |
|---|---|
| `model`, `fallbackModel`, `effort`, `maxTurns`, `maxBudgetUsd` | Exposed as `deployment.*`; the built-in profiles turn them into flags |
| `timeoutSeconds` | Run deadline, ahead of the profile's default and the cluster's `Runs.DefaultTimeoutSeconds`, capped by `Runtime.MaxRunSeconds` |
| `repetitionGuard`, `maxAssistantChars`, `noProgressSeconds` | Run guard limits (see "Run guards"); null uses the cluster defaults |
| `parameters` | Named values available as `deployment.parameters.<name>`. Every knob in the built-in profiles is one of these |
| `allowedRunOverrides` | Which parameters (and the fields `model`, `effort`, `maxTurns`, and `timeoutSeconds`) a caller may set per run, each validated as `Any`, `Enum` (comma-separated values), `Regex`, or `IntegerRange` (`min,max`) |
| `argumentOverrides` | `Append`, `Prepend`, `Remove` (matching a profile argument template exactly), or `Replace` (same match, new template) |
| `environmentOverrides`, `fileOverrides` | Add variables and files, or replace ones with the same name or path |
| `promptBindings` | Which template fills each prompt role (`System`, `Task`, `DelegatedTask`), optionally pinned to a version |
| `resourceBindings` | MCP servers and secrets, each with an alias |
| `workspaceTemplateId` | Empty directory, a git clone, or seeded files, and whether to keep the workspace afterwards |
| `nodeSelector`, `nodePoolId` | Labels and pool a worker must have |
| `maxConcurrentRuns`, `maxAttempts`, `retryOnNodeLoss`, `weight` | Concurrency, retries, and traffic split among an agent's deployments |
| `executor`, `podResources` | Run as a worker subprocess (`Process`) or in a pod per run (`KubernetesJob`) with these requests and limits; see `docs/KUBERNETES.md`, "Pod-per-run executor" |

New deployments get the default prompt bindings (`builtin/default-system`, `builtin/default-task`, `builtin/delegated-task`) for any role you do not bind. `POST .../deployments/{id}/compile-preview` shows the exact `ExecutionSpec` a run would get, with secrets masked, and is the quickest way to check an override.

## On the worker

For each run the worker:

1. Creates `<WorkRoot>/<runId>/` with `work/`, `home/`, and `config/`, and prepares the workspace (git clone or seeded files).
2. Replaces the directory placeholders and writes every file in the spec with its mode.
3. Runs MCP pre-flight: each HTTP MCP server marked required, or with required tools, must answer `initialize` and `tools/list` within `McpPreflightTimeoutMs` and offer the required tools. If not, the run fails with `McpPreflightFailed` before the harness starts.
4. Launches the process with the allowlisted environment plus the spec's variables, writes stdin, and parses stdout line by line into events, flushing them to the control plane in batches.
5. Applies the run guards (below), the deadline, and cancellation. Stopping sends SIGTERM to the harness and every process it started (listed before the signal, so the Node or Rust children of Claude Code and Codex are not orphaned when the parent exits first), waits up to `killGraceSeconds`, then sends SIGKILL to whatever is still alive. A cancel reaches the worker through its cancellation watch, a long poll the control plane answers the moment the run is cancelled, so a harness that exits on SIGTERM is gone well under a second after the cancel request.
6. Decides the outcome, reads the result, scrubs secrets, reports completion, and deletes `config/` and `home/` (and the workspace too, unless the workspace template keeps it). When the spec has `retainForRepair` set, the directories stay until the control plane has answered the completion report, because the answer may be a structured output repair that resumes the session in them.

Workers probe for `claude`, `codex`, `mux`, `gemini`, and `garrison-fake-harness` at startup and every `ProbeIntervalSeconds`. Each one found adds the label `garrison.io/harness-<label>=true` (`claude`, `codex`, `mux`, `gemini`, `fake`) and its harness type to the node's capabilities.

### Run guards

The worker stops a run on its own when the harness is clearly not doing useful work. The guards apply to every harness, because they read the normalized events rather than any one CLI's output.

| Guard | Deployment field (cluster default) | Trips when | Outcome |
|---|---|---|---|
| Repetition | `repetitionGuard` (`Runtime.RepetitionGuard`, on) | The last 2,000 characters of assistant text are one unit of 1 to 64 characters repeated at least 30 times, or the last 1,000 characters contain no letter or digit. | `RepetitionDetected` |
| Assistant text size | `maxAssistantChars` (`Runtime.MaxAssistantChars`, 200,000; 0 is unlimited) | The run's assistant text passes the limit. | `OutputLimitExceeded` |
| No progress | `noProgressSeconds` (`Runtime.NoProgressSeconds`, 300; 0 is off) | No progress for that long while no tool call is open. | `NoProgress` |

**What counts as progress.** An `AssistantText`, `Thinking`, `ToolCall`, or `ToolResult` event. A tool call is open from its `ToolCall` event until a `ToolResult` with the same tool call ID (or, when either has no ID, the oldest open call), or until the model writes text or thinks again, which also closes calls whose harness never reports a result (Codex `web_search`). While any call is open the no-progress clock is paused, so a long build, test run, or delegated agent never trips it; the run's deadline still applies. Lifecycle, usage, warning, error, stdout, and stderr events are not progress, so a harness that only prints retries or heartbeats is not making progress. The clock starts when the process starts.

**Repetition.** The detector keeps the last 64 characters and one counter per unit length from 1 to 64; for each new character it checks whether the character matches the one a unit earlier. The window is periodic when the counter for some unit length covers the whole window. It also counts consecutive characters with no letter or digit. Both checks are incremental, so the cost per character is fixed (about a million characters in 0.4 seconds) and memory does not grow with the output. The window covers assistant text written since the last tool call or tool result, so an agent that writes the same short sentence between many tool calls is not a loop. Markdown is safe: tables, rules, lists, and code never run 1,000 characters without a letter or digit, and a repeated paragraph is a unit far longer than 64 characters. Thinking text is not checked.

On the recorded gpt-oss:20b loop (`src/Test.Shared/Fixtures/mux/v1.3.0-repetition-loop-deltas.jsonl`: Mux printed its system prompt, reasoned about it in `* ` bullets, then wrote `* \n` for 1,917 deltas until a person cancelled it about 50 seconds in), the guard trips 999 characters into the loop, about 11 seconds after it starts, and never during the 5,169 characters of legitimate text before it.

**When a guard trips** the worker emits one `Warning` event with code `RunGuardTriggered` and the reason, stops the harness as described above, keeps the output so far as the run's result text, and reports the run `Failed` with the guard's outcome and the reason as `errorMessage`.

**Bounding every run.** The deadline is the deployment's `timeoutSeconds` (or a per-run `timeoutSeconds` parameter when the deployment allows it in `allowedRunOverrides`), else the profile's default, and it is always capped by the cluster setting `Runtime.MaxRunSeconds` (default 3,600). The leader's deadline enforcer also times out any run that started longer ago than the cap plus the deadline grace, whatever deadline it was compiled with.

### Outcomes

| Outcome | Meaning |
|---|---|
| `Succeeded` | The success policy was met |
| `HarnessFailed` | The harness reported failure, exited badly, or never produced a final result |
| `NotInstalled` | The executable was not found |
| `NotCredentialed` | Stderr matched a known authentication failure (`invalid api key`, `not logged in`, `401 unauthorized`, and similar), or the harness reported one in its output stream (Mux: a 401 from the model, or `config_unresolved_env`) |
| `McpPreflightFailed` | A required MCP server or tool was missing |
| `OutputLimitExceeded` | Stdout passed `maxOutputBytes`, or the assistant text passed `maxAssistantChars` (run guard) |
| `RepetitionDetected` | The repetition guard stopped a degenerate generation loop |
| `NoProgress` | The no-progress guard stopped a harness that went quiet with no tool call open |
| `PodFailed` | A `KubernetesJob` run's pod failed outside the harness: unschedulable past the pending timeout, image pull failure, invalid configuration, OOMKilled, or no completion reported |
| `TimedOut`, `Cancelled` | Deadline reached or cancelled |
| `NodeLost`, `StaleLease` | The worker disappeared or lost its lease |
| `SchemaValidationFailed` | The output did not validate against the agent's output schema, after the one repair attempt or immediately when no repair was possible (decided by the control plane, see below) |
| `CompileFailed`, `WorkspaceFailed`, `InternalError` | Failures before or around the harness |
| `Rejected` | The run was never started: its tenant, agent, or deployment was deactivated or deleted while it was queued (status `Rejected`) |

### Structured output validation and repair

When the agent has an output schema, the control plane validates the output of a successful execution against it as soon as the worker reports completion. The document validated is the structured output the parser found (Claude Code's `structured_output`) or, when there is none, the final result text parsed as JSON. Claude Code, Codex, and Mux also receive the schema natively (`--json-schema`, `--output-schema`), but Garrison does not rely on that.

If validation fails, Garrison makes at most one repair attempt, and only when all of these hold:

- the deployment's harness profile has `supportsResume` set and its arguments pass `run.resumeSessionId` to the harness;
- the harness reported a session ID for the run;
- the run was not cancelled, and the worker supports in-lease repairs (every current worker does).

The repair runs inside the same lease, on the same worker, in the same `work/`, `home/`, and `config/` directories, because every built-in harness keeps its sessions under the run's home or config directory. The control plane answers the completion report with a second `ExecutionSpec` compiled with `run.resumeSessionId` set and the `Repair` prompt as the task prompt (`docs/PROMPTS.md`); the worker skips workspace preparation, rewrites the files, launches the harness again, and reports completion with `repairAttempt` 1. How each built-in resumes:

| Profile | Resume arguments |
|---|---|
| `builtin/claude-code` | `--resume <session_id>` |
| `builtin/codex` | `codex exec ... resume <thread_id> -` (the `exec resume` subcommand, prompt still on stdin) |
| `builtin/mux` | `--resume <sessionId>`; the original execution passes `--session-id <run id>` so Mux persists the session, which it does only for agents with an output schema |
| `builtin/gemini-cli` | `--resume <session_id>` |
| `builtin/fake` | `--resume <session>` |

A profile without `supportsResume` (for example a clone with it turned off, or `builtin/generic-jsonl`) gets no repair: an invalid output fails the run at once with `SchemaValidationFailed`, and the error message says that the profile does not support resume. A cloned profile that sets `supportsResume` must also add resume arguments conditioned on `{{run.resumeSessionId}}`, or the repair prompt would start a fresh session without the original context.

#### Verified with real CLIs

Resume and native output schemas were checked on 2026-10-10 against the real CLIs, run with the exact arguments the built-in profiles compile to (MCP servers left out). Each check stored a code word in the first turn under an output schema, resumed the session with the profile's resume arguments, and asked for the word back; a fresh session without the resume arguments answered "unknown". A second resume used a schema with a field the prompt never mentioned, to confirm the schema still applies on a resumed turn. Every answer was schema-valid JSON.

| Harness | Version | Resume | Output schema |
|---|---|---|---|
| Claude Code | 2.1.296 (`--model haiku`) | `--resume <session_id>` remembered the word | `--json-schema`: valid `structured_output` on the first and the resumed turn |
| Codex | codex-cli 0.159.3 | `exec ... resume <thread_id> -` remembered the word, with `--output-schema` still given before `resume` | `--output-schema`: valid final message on the first and the resumed turn |
| Mux | 1.3.0 (commit `60fd88a`), gpt-oss:20b on Ollama | `--resume <sessionId>` remembered the word once the first execution ran with `--session-id`; without it Mux reported an empty `sessionId` and kept nothing, so the profile now passes `--session-id <run id>` | `--output-schema`: valid `--output-last-message` file on the first and the resumed turn; a non-matching answer (forced with a stub endpoint) exits 1 with `schema_validation_failed` and keeps the session |
| Gemini CLI | not installed on the verification machine | not verified | not verified |

### Quirks Garrison handles

- **Exit code 0 after a failure.** Several harnesses exit 0 when the model call failed. The built-in profiles use the `FinalEvent` success policy, so success means the harness said so in its final event.
- **MCP servers that fail quietly.** A harness may start even though an MCP server rejected its credentials. MCP pre-flight catches this before launch, and the Claude Code parser also checks the `mcp_servers` status in the init event for servers the run requires.
- **Model substitution.** A harness may serve a different model from the one requested. Parsers record the model the harness reports, and the run stores it as `servedModel`, so you can compare it with the deployment's model.
- **Leftover configuration.** User settings, project instruction files, and global MCP servers on the worker are ignored by the flags each built-in passes, and each run gets its own `HOME`.

## Adding a new CLI

1. Check the CLI can run headless: a prompt on stdin, as an argument, or in a file, and output you can parse (JSON lines are best; plain text works with `PlainText`).
2. Create a profile with `harnessType` `Generic`, the executable, arguments, and the `GenericJsonl` field paths, or clone `builtin/generic-jsonl`.
3. Install the CLI on workers and add a probe for it (`HarnessType` `Generic`, its executable, a label) to the worker's `Probes` setting. Runs are leased only to nodes that report the profile's harness type as available, and a `Generic` capability can come from any generic probe, including the fake harness, so add a node selector on the new label (`garrison.io/harness-<label>=true`) to keep the runs off workers without the CLI.
4. Create a secret and bind it to the deployment; reference it from an environment template.
5. Use `compile-preview` to inspect the spec, then invoke the agent and watch the events.

The same steps apply as a manifest; see `docs/MANIFESTS.md`.
