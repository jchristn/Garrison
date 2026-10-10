# Quick start: a few agents that work together

This walk-through takes a running Garrison and gives it four agents on four different harnesses, one of which is allowed to hand work to the others. You will create half of them from a manifest and one in the dashboard, call each of them over REST, MCP, and A2A, watch a run stream, find a delegated run in the run tree, and read the numbers on the Analytics page. At the end, one script checks all of it and prints PASS or FAIL.

| Agent | Harness | Created from | Needs |
|---|---|---|---|
| `planner` | Claude Code | `examples/multi-agent.yaml` | `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` |
| `coder` | Codex | `examples/multi-agent.yaml` | a Codex `auth.json` or `OPENAI_API_KEY` |
| `echo` | fake harness | `examples/multi-agent.yaml` | nothing |
| `researcher` | Mux | the dashboard | an OpenAI-compatible or Ollama endpoint |

`planner` may call `coder`, `echo`, and `researcher`. `echo` costs nothing and answers in milliseconds, which makes it the right first target for checking that delegation works before you spend tokens on it. Any agent whose credentials you do not have can be skipped; the rest still work.

Budget about fifteen minutes once the stack is up. Most of that is reading.

## Before you start

You need a running stack and its URLs:

| Runtime | How to start it | REST and A2A | MCP | Dashboard |
|---|---|---|---|---|
| Docker Compose | `docs/DOCKER.md` | http://127.0.0.1:8700 | http://127.0.0.1:8701/mcp | http://127.0.0.1:8080 |
| Kubernetes | `docs/KUBERNETES.md`, then `k8s/scripts/port-forward.sh` | http://127.0.0.1:8700 | http://127.0.0.1:8701/mcp | http://127.0.0.1:8080 |

If you moved the ports (in `docker/.env`, or with `REST_PORT` and friends on `port-forward.sh`), use yours everywhere below. The commands also need `curl` and `jq`.

Everything below runs from the repository root. Set the URLs once, and sign in to get a session token:

```bash
export GARRISON_URL=http://127.0.0.1:8700
export GARRISON_MCP_URL=http://127.0.0.1:8701/mcp
API=$GARRISON_URL/v1.0/api/tenants/default

TOKEN=$(curl -s -X POST $GARRISON_URL/v1.0/token -H "Content-Type: application/json" \
  -d '{"email":"admin@garrison","password":"password","tenantId":"default"}' | jq -r .token)
echo ${TOKEN:0:12}
```

If that prints `null`, the password is not `password`: on Kubernetes it is whatever `GARRISON_ADMIN_PASSWORD` was when you ran `generate-secrets.sh`. A session token lasts eight hours. Sign in to the dashboard with the same email and password, tenant `default`.

On Docker and Kubernetes the bootstrap already created three sample agents (`claude-helper`, `codex-coder`, `mux-helper`) from whatever credentials you gave it. They are fine to keep. This guide builds its own set so that you see every step.

## 1. Store the credentials

Garrison never hands a harness a key from the worker's environment. A credential is a secret record in the tenant, encrypted with the master key, and a deployment binds it under an alias such as `anthropic`. The harness profile decides what the alias becomes: the Claude Code profile turns a `ClaudeCodeOAuthToken` secret into `CLAUDE_CODE_OAUTH_TOKEN`, a `CodexAuthJson` secret becomes `$HOME/.codex/auth.json` inside the run, and so on (`docs/HARNESSES.md` has the full list).

The manifest in the next step refers to two secrets by name, `claude-credential` and `codex-credential`. Create them with values first.

**In the dashboard:** Configuration, then the Secrets tab, then **Add secret**. Name `claude-credential`, Kind **Claude Code OAuth token** (or **Anthropic API key**), paste the value, Save. Then `codex-credential` with Kind **Codex auth.json**, pasting the whole file, or Kind **OpenAI API key**.

**With curl,** reading the values from your shell so they never land in your history or a file:

```bash
# Claude Code: a subscription token from `claude setup-token`, or use kind AnthropicApiKey with $ANTHROPIC_API_KEY
jq -n --arg v "$CLAUDE_CODE_OAUTH_TOKEN" '{name:"claude-credential",kind:"ClaudeCodeOAuthToken",value:$v}' |
  curl -s -X POST $API/secrets -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @- | jq -r .id

# Codex: the auth.json from `codex login`, or use kind OpenAiApiKey with $OPENAI_API_KEY
jq -n --rawfile v ~/.codex/auth.json '{name:"codex-credential",kind:"CodexAuthJson",value:$v}' |
  curl -s -X POST $API/secrets -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @- | jq -r .id
```

If you use an API key instead of a subscription, change the matching `kind` in `examples/multi-agent.yaml` too. To replace a value later, use the secret's **Set value** action in the dashboard, or `PUT $API/secrets/<id>/value` with `{"value":"..."}`.

Subscription credentials are convenient on your own machine. Serving other people from a personal subscription may break the provider's terms, so use API keys for anything shared.

## 2. Apply the manifest

`examples/multi-agent.yaml` declares the two secrets (names and kinds only, so the values you just stored are left alone), three agents, and one deployment for each. An agent is the name callers use; a deployment says how it runs: which harness profile, which model, which secrets under which aliases, and limits such as `maxTurns` and `timeoutSeconds`. Delegation is a property of the agent:

```yaml
kind: Agent
metadata:
  name: planner
spec:
  exposure: { a2a: true, mcpTool: true }
  delegation:
    allow: [coder, echo, researcher]
    maxDepth: 1
```

Check it with a dry run, then apply:

```bash
curl -s -X POST "$API/manifests/apply?dryRun=true" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/yaml" --data-binary @examples/multi-agent.yaml | jq -c '.items[] | [.kind, .name, .result]'

curl -s -X POST "$API/manifests/apply" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/yaml" --data-binary @examples/multi-agent.yaml | jq -c '.items[] | [.kind, .name, .result]'
```

The secrets report `Unchanged` and everything else `Created`. Applying again reports `Unchanged` across the board.

The dashboard does the same thing under Configuration, Manifests tab: **Upload file**, pick `examples/multi-agent.yaml`, press **Dry run**, read the table, then **Apply**.

## 3. Add an agent in the dashboard

The fourth agent runs on Mux, which talks to any OpenAI-compatible or Ollama endpoint, including one on your own network. You need the endpoint's base URL, a model name, an adapter type (`openai-compatible` or `ollama`), and an API key if the endpoint wants one. If you have none of that, skip to step 4 and leave `researcher` out of the commands.

1. **Configuration**, Secrets tab, **Add secret**: name `mux-credential`, Kind **OpenAI API key**, the endpoint's key as the value (anything, such as `none`, if it has no key).
2. **Agents**, **Add agent**: name `researcher`, display name `Researcher`, a one-line description. Under Exposure, keep **Expose over A2A** and tick **Expose as its own MCP tool**. Leave Delegation at `None`. Save.
3. **Agents**, Deployments tab, **Add deployment**. The form has six steps:
   - Basics: name `researcher-mux`, Agent `researcher`.
   - Harness: Harness profile `builtin/mux`, Model your model name (for example `gpt-oss:20b`), Maximum turns `8`. Under Parameters, **Add item** twice: `baseUrl` with the endpoint URL and `adapterType` with `ollama` or `openai-compatible`. If you know the model's context window, add a third item, `contextWindow` (for example `131072`); otherwise Mux assumes 32,768 tokens and each run carries a warning saying so.
   - Prompts: keep the defaults.
   - Resources: under Resource bindings, **Add item**, Kind `Secret`, Alias `mux`, Resource "Secret: mux-credential".
   - Overrides: nothing.
   - Placement and limits: Timeout (seconds) `300`. Save.

The deployment's row menu has **Compile preview**, which shows the exact command line, files, and environment a run would get, with secrets masked. It is the quickest way to check a parameter before spending a run on it.

The same agent with curl, if you prefer:

```bash
SEC=$(jq -n --arg v "${MUX_API_KEY:-none}" '{name:"mux-credential",kind:"OpenAiApiKey",value:$v}' |
  curl -s -X POST $API/secrets -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @- | jq -r .id)
AGT=$(curl -s -X POST $API/agents -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"researcher","displayName":"Researcher","description":"Answers questions with a local model","exposeA2A":true,"exposeMcpTool":true}' | jq -r .id)
jq -n --arg a "$AGT" --arg s "$SEC" --arg u "$MUX_BASE_URL" --arg m "$MUX_MODEL" --arg t "${MUX_ADAPTER_TYPE:-openai-compatible}" \
  '{agentId:$a,name:"researcher-mux",harnessProfileId:"hrn_builtin_mux",model:$m,maxTurns:8,timeoutSeconds:300,
    parameters:[{name:"baseUrl",value:$u},{name:"adapterType",value:$t}],
    resourceBindings:[{kind:"Secret",alias:"mux",resourceId:$s}]}' |
  curl -s -X POST $API/deployments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @- | jq -r .id
```

## 4. Call each agent three ways

**REST.** `invoke` accepts the agent's name. With `wait` it holds the request until the run finishes or `waitSeconds` (default 60) passes; a run still going comes back with HTTP 202 and `"status":"Running"`, and you follow it by ID.

```bash
for a in planner coder echo researcher; do
  curl -s -X POST $API/agents/$a/invoke -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"input":"Reply with one short sentence that includes the word READY.","wait":true,"waitSeconds":180}' |
    jq -c '{agent: .agentName, status, servedModel, resultText}'
done
```

**MCP.** Any MCP client works; Claude Code, for example, is `claude mcp add --transport http garrison $GARRISON_MCP_URL --header "Authorization: Bearer $TOKEN"`. With curl it takes an `initialize` to get a session, then a tool call:

```bash
SID=$(curl -s -D - -o /dev/null -X POST $GARRISON_MCP_URL -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}' |
  awk 'tolower($1)=="mcp-session-id:" {print $2}' | tr -d '\r')

curl -s -X POST $GARRISON_MCP_URL -H "Authorization: Bearer $TOKEN" -H "MCP-Session-Id: $SID" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"garrison_invoke_agent","arguments":{"agent":"coder","input":"Reply with READY."}}}' |
  jq -r '.result.content[0].text | fromjson | {status, result}'
```

**A2A.** Every agent with A2A exposure has a public card and a JSON-RPC endpoint:

```bash
curl -s $GARRISON_URL/v1.0/a2a/default/planner/.well-known/agent-card.json | jq '{name, skills: [.skills[].name]}'

MSG_ID="qs-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)"
curl -s -X POST $GARRISON_URL/v1.0/a2a/default/planner -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"SendMessage","params":{"message":{"role":"ROLE_USER","messageId":"'"$MSG_ID"'","parts":[{"text":"Reply with READY."}]}}}' |
  jq '{state: .result.task.status.state, text: .result.task.artifacts[0].parts[0].text}'
```

Run the `MSG_ID=` line again before every `SendMessage`. Garrison treats `messageId` as an idempotency key: sending the same identifier with the same text returns the task it already ran, and sending it with different text is rejected with a conflict error. `uuidgen` (macOS and most Linux distributions) gives a fresh value each time in bash and zsh alike; avoid `$RANDOM` inside a pipeline, because zsh evaluates it in a subshell and repeats the same number.

In the dashboard, **Invoke** does the same: pick the agent, type a message, press **Send**.

## 5. Watch a run stream

The dashboard's Invoke page shows the run in two tabs. **Preview** streams the answer as the harness produces it, formatted as Markdown (tables, lists, code blocks, and links, with any HTML sanitized), with the model's reasoning in a collapsed block, tool calls as small chips, and the elapsed time, time to first token, and tokens per second. **Response** shows the final result once the run ends: the result text (formatted, or raw with one click), structured output, outcome, errors, and telemetry. Claude Code and Mux stream token by token; Codex prints each message only when it is complete, so Preview waits and then shows its answer in one piece. The Run detail page formats the result the same way.

From a terminal, start a run without waiting and attach to its server-sent events. The stream ends with a `run.completed` event that carries the finished run.

```bash
RUN=$(curl -s -X POST $API/agents/planner/invoke -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"input":"Count from one to ten, one number per line.","wait":false}' | jq -r .id)
curl -s -N $API/runs/$RUN/events/stream -H "Authorization: Bearer $TOKEN"
```

## 6. Delegate, and find it in the run tree

Ask `planner` to use another agent. A run of an agent that may delegate gets Garrison's own MCP server in its configuration, authenticated with a short-lived run token that can only reach the agents on its allow list. Start with `echo`, which proves the plumbing for free, then try `coder`:

```bash
PARENT=$(curl -s -X POST $API/agents/planner/invoke -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"input":"Use the garrison_invoke_agent tool to ask the coder agent for a one-line Python function that reverses a string. Reply with its answer.","wait":true,"waitSeconds":180}' |
  jq -r .id)
curl -s $API/runs/$PARENT/children -H "Authorization: Bearer $TOKEN" | jq -c '.objects[] | {agentName, depth, callChain, status}'
```

The child run has `depth` 1 and `callChain` `planner,coder`. In the dashboard, open **Runs**, click the planner run, and look at the **Child runs** tab; each child links back with **Parent run**. If there is no child, the model answered on its own instead of calling the tool. Say "use the garrison_invoke_agent tool" plainly, as above.

## 7. Telemetry and analytics

Every run records how long it queued, how long the harness took to produce its first output, how long it streamed, tokens, cost, tool calls, and the model that actually served it:

```bash
curl -s $API/runs/$PARENT -H "Authorization: Bearer $TOKEN" |
  jq '{servedModel, queueMs, timeToFirstTokenMs, streamingMs, executionMs, totalMs, inputTokens, outputTokens, costUsd, toolCallCount}'

curl -s -G $API/analytics/runs -H "Authorization: Bearer $TOKEN" --data-urlencode groupBy=agent |
  jq '{runs: .totals.runs, succeeded: .totals.succeeded, agents: [.series[].label]}'
```

In the dashboard, the run detail page shows the same fields in its Telemetry panel, with a bar that splits the run into queue, startup, streaming, and tail. **Analytics** charts them over time; set Group by to Agent or Harness to compare `planner` on Claude Code with `coder` on Codex. `docs/TELEMETRY.md` explains each measurement.

## 8. Check everything with one command

`examples/validate.sh` does all of the above and prints one line per check:

```bash
examples/validate.sh                                             # planner, coder, echo on the default URLs
examples/validate.sh --agents "planner coder echo researcher"    # include the Mux agent
examples/validate.sh --url http://127.0.0.1:9700 --mcp-url http://127.0.0.1:9701/mcp   # moved ports
examples/validate.sh --agents echo --skip-delegation             # no model credentials at all
```

On Windows, `examples\validate.bat` runs the same checks through PowerShell and takes the same options (`-Url`, `-McpUrl`, `-Agents`, and so on). Both read `GARRISON_URL`, `GARRISON_MCP_URL`, `GARRISON_TENANT`, `GARRISON_EMAIL`, and `GARRISON_PASSWORD` when no option is given, and exit with code 1 if anything failed.

It checks the server and sign-in, that workers are `Ready`, that each agent has an active deployment, a REST invoke, an MCP `garrison_list_agents` and `garrison_invoke_agent`, an A2A agent card and `SendMessage` for every agent, a run's SSE stream through to `run.completed`, a delegation from `planner` to `echo` (change it with `--delegate coder`) and the child run under it, the telemetry fields on a run, and the analytics endpoint. The tail of a passing run looks like this:

```text
PASS  SSE event stream (echo: 8 events, final status Succeeded)
PASS  delegating run planner
      run run_mv2gnoaj_cHH1gKVjHZ3zMthYEyb status Succeeded model claude-sonnet-5-5 ttft 4744ms exec 4779ms result: Echo returned this text: Echo: The agent "planner" is asking you for help as par
PASS  run tree: planner -> echo
      child run_mv2gnqyl_sDkusSAiqjnseOUnkv4 depth 1 chain planner,echo status Succeeded
PASS  run telemetry fields
      queue 2ms ttft 1897ms streaming 623ms exec 2547ms total 2572ms tokens in 1252 out 22 cost 0.007001 model claude-sonnet-5-5
PASS  analytics endpoint (53 runs in the last 24 hours; agents: planner echo coder researcher)

25 passed, 0 failed
```

That count is for the three default agents. The script runs ten checks once and five for every agent (deployment, REST invoke, MCP invoke, A2A card, A2A `SendMessage`), so `--agents "planner coder echo researcher"` gives 30, `--skip-delegation` removes two, and `--agents echo --skip-delegation` gives 13.

## When something fails

| Symptom | Likely cause |
|---|---|
| The run stays `Queued` | No `Ready` worker has that harness, and the run waits until one appears. Fleet in the dashboard, or `GET /v1.0/api/nodes`, lists what each worker found at startup; on Docker, `docker compose logs garrison-worker-1 \| grep harness` shows why a harness is unavailable. Cancel the run from the dashboard or with `POST $API/runs/<id>/cancel`. |
| `Failed` within a second or two, with an authentication message in Stderr | The secret is missing, empty, or the wrong kind for the harness. Fix the value with **Set value** and invoke again. |
| `"status":"Running"` from a `wait` invoke | The run took longer than `waitSeconds` (default 60). Follow it with `GET $API/runs/<id>` or the dashboard. |
| A delegating run succeeds but has no child | The model chose not to call the tool. Ask for it by name, and check the agent's allow list. |
| Mux runs time out | The endpoint is unreachable from the worker container, or slow to load the model. Try the URL from inside a worker: `docker exec garrison-worker-1 curl -s <baseUrl>`. |
| `401` everywhere | The session token expired (eight hours). Sign in again. |

## Cleaning up

The manifest never deletes anything. Remove the quick start records from the dashboard (each row's action menu), or with `DELETE $API/agents/<id>`, `DELETE $API/deployments/<id>`, and `DELETE $API/secrets/<id>`. For a completely fresh start, `docker/factory/reset.sh` or `k8s/scripts/factory-reset.sh` deletes all data.

`docs/MANIFESTS.md` covers every manifest kind, `docs/HARNESSES.md` the harness profiles and their parameters, and `docs/PROMPTS.md` how to replace the prompts these agents run with.
