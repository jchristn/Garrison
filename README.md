<p align="center">
  <img src="assets/logo.png" alt="Garrison" width="160" height="160" />
</p>

# Garrison

> **Alpha (v0.1.0-alpha).** The REST API, MCP tools, A2A surface, database schema, settings, manifests, and SDKs can all change without notice. Do not run it against data you cannot afford to lose.

Garrison runs agent harnesses for you. Claude Code, Codex, Mux, Gemini CLI, or any command-line agent you can describe is stationed on a fleet of worker nodes, and Garrison dispatches it on demand: from REST, from any MCP client, from another A2A agent, or from one of your own agents that needs help. You decide what each agent is, which harness runs it, what every prompt says, which MCP servers and credentials it gets, and where it is allowed to run. Garrison does the rest, and it does it across as many control-plane and worker replicas as you care to run.

The control plane never reaches out to a worker. Workers pull work by lease, run the harness headless in its own workspace, stream normalized events back, and report a result. That one rule is what lets the two halves scale independently: more control-plane replicas buy you API and scheduling capacity, more workers buy you execution capacity, and neither has to know how many of the other exist.

## What it does

- **Headless harnesses, fully configurable.** A harness profile is data: the executable, an ordered list of argument templates with conditions, environment variables, files to materialize, how the prompt and system prompt are delivered, which MCP configuration format the harness reads, and which parser turns its output into events. Built-in profiles for Claude Code, Codex, Mux, and Gemini CLI ship ready to use and can be cloned and edited without a release.
- **Every prompt is a template.** System prompts, task wrappers, the instructions that teach an agent how to delegate, MCP tool descriptions, A2A skill descriptions, and the harness configuration files themselves are versioned prompt templates with a live preview. Every run records the exact template versions it was compiled with.
- **Deployments bind it together.** An agent has one or more deployments. Each binds a harness profile, prompt templates, MCP servers, secrets, a workspace, placement rules, limits, and per-run parameters callers may override. Weights split traffic across deployments, so a Claude Code variant and a Mux variant of the same agent can run side by side.
- **Three ways in.** REST with server-sent events, an MCP server any MCP client can attach to, and an A2A gateway with one agent card per agent. All three use the same tenants, credentials, and RBAC.
- **Agents that call agents.** Each run receives a short-lived run token in its MCP configuration. With it, an agent can list and invoke the agents its deployment allows, within depth and recursion limits, and never with more permission than the person who started the chain.
- **Multi-tenant from the first request.** Tenants, users, credentials, roles, permissions, scoped role assignments, effective-permission inspection, audit records, and request history, following the same authentication model as the rest of this family of projects.
- **Built to scale out.** Pull-based leasing with an atomic compare-and-set claim and a fencing epoch on every run, leader-elected maintenance through a database lease, events streamed from the database so any replica can serve any client, and Kubernetes assets for minikube, K3S, and production clusters.

## How a run works

```
 REST / MCP / A2A           Command (control plane, N replicas)              Post (worker, M replicas)
 ----------------           -----------------------------------              -------------------------
 invoke agent  ---------->  authenticate, authorize Execute on Agent
                            pick a deployment (weights), validate overrides
                            persist run as Queued                 <--------- lease (long poll)
                            claim with compare-and-set, epoch + 1
                            mint run token, compile ExecutionSpec ---------> prepare workspace, HOME, files
                                                                             MCP pre-flight
                                                                             launch harness, parse stdout
                            append events (fenced by epoch)       <--------- events in batches
                            finalize, revoke run token            <--------- complete
 result or SSE stream  <--  
```

The control plane compiles each run into a fully resolved execution spec: command line, environment, files, stdin, parser, timeouts, and the MCP servers to check before launch. The worker never reads the database and never renders a template. If a worker dies, its lease expires, the leader requeues or fails the run, and a stale worker that comes back is fenced out by its old epoch.

## Repository layout

| Path | Contents |
|---|---|
| `src/Garrison.Core` | Models, data layer (Sqlite and Postgresql), security, template renderer, invocation compiler |
| `src/Garrison.Harnesses` | Process runner, output parsers, MCP pre-flight, harness probes |
| `src/Garrison.Server` | Control plane: REST, A2A, WebSocket, MCP (Voltaic), scheduler, node protocol |
| `src/Garrison.Worker` | Worker node: registration, heartbeat, lease loop, process executor |
| `src/Garrison.FakeHarness` | Deterministic harness for tests and smoke tests |
| `src/Test.*` | Touchstone suites with console, xUnit, and NUnit runners |
| `dashboard/` | React operator console |
| `sdk/` | C#, Python, JavaScript/TypeScript, and Go SDKs |
| `k8s/` | Kustomize base, components, overlays, Helm chart, scripts |
| `docs/` | Architecture, configuration, harnesses, prompts, manifests, Kubernetes, security |

## Getting started

### On a laptop (Sqlite, no cluster)

You need the .NET 10 SDK. Harness CLIs are optional; the fake harness is enough to see the whole loop work.

```bash
dotnet build src/Garrison.sln

# Terminal 1: control plane on 127.0.0.1:8700 (REST) and :8701 (MCP)
cd src/Garrison.Server && dotnet run -f net10.0

# Terminal 2: one worker
cd src/Garrison.Worker && dotnet run -f net10.0
```

On first start the server seeds a `Default` tenant (`default`), the administrator `admin@garrison` with password `password`, an administrator credential `access_garrison_default` / `secret_garrison_default_change_me`, and the worker credential the worker uses by default. Every one of these comes from settings or environment variables; change them before anything leaves your laptop.

Get a token and look around:

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garrison","password":"password"}'

curl -s http://127.0.0.1:8700/v1.0/api/nodes -H "x-api-key: garrisonadmin"
curl -s http://127.0.0.1:8700/v1.0/api/harness-profiles/builtin -H "x-api-key: garrisonadmin"
```

Create an agent on the fake harness and invoke it. The fake harness has to be on the worker's `PATH`; the worker image already includes it, and locally you can point a small wrapper at `src/Garrison.FakeHarness`.

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/agents \
  -H "x-api-key: garrisonadmin" -H "Content-Type: application/json" \
  -d '{"name":"echo","description":"Echoes its input"}'
# use the returned agent id, and the id of builtin/fake from the built-in profile list
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/deployments \
  -H "x-api-key: garrisonadmin" -H "Content-Type: application/json" \
  -d '{"agentId":"<agent id>","name":"echo-default","harnessProfileId":"<builtin/fake id>"}'
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/agents/<agent id>/invoke \
  -H "x-api-key: garrisonadmin" -H "Content-Type: application/json" \
  -d '{"input":"Hello, Garrison","wait":true}'
```

The dashboard lives in `dashboard/`: `npm install && npm run dev`, then open the printed URL and sign in with the administrator account.

### On Kubernetes

The `k8s/` directory holds a Kustomize base with overlays for minikube, K3S, and production clusters, a Helm chart that mirrors it, and scripts that generate secrets, deploy, update, smoke-test, and factory-reset. The default topology is one control-plane replica, two worker replicas, the dashboard, and an in-cluster PostgreSQL.

```bash
k8s/scripts/generate-secrets.sh           # random keys; optional harness credentials from your environment
k8s/scripts/deploy-minikube.sh            # or deploy-k3s.sh
k8s/scripts/smoke-test.sh                 # invokes a fake-harness agent and checks it succeeds
k8s/scripts/port-forward.sh               # server, MCP, and dashboard on 127.0.0.1
```

`docs/KUBERNETES.md` walks through minikube, K3S on a host or in Docker, the production overlay, Helm, scaling, and upgrades.

## Harnesses

| Built-in profile | Harness | Credentials it understands | Notes |
|---|---|---|---|
| `builtin/claude-code` | Claude Code (`claude -p --output-format stream-json`) | `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` | Prompt on stdin, system prompt from a file, strict MCP configuration |
| `builtin/codex` | Codex (`codex exec --json`) | `OPENAI_API_KEY`, `CODEX_API_KEY`, Codex `auth.json` | Ignores user config and project instructions; MCP servers passed as `-c` overrides |
| `builtin/mux` | Mux (`mux --print --output-format jsonl`) | Any endpoint Mux supports, key from a secret | Endpoint, model, and adapter from deployment parameters |
| `builtin/gemini-cli` | Gemini CLI (`gemini -o stream-json`) | `GEMINI_API_KEY` | Optional in the worker image |
| `builtin/generic-jsonl` | Any CLI that prints JSON lines | Whatever you map | Field paths for text, final result, and success are configurable |
| `builtin/fake` | `garrison-fake-harness` | None | Deterministic; used by tests and the cluster smoke test |

Subscription tokens such as `CLAUDE_CODE_OAUTH_TOKEN` and a Codex `auth.json` are supported because they are convenient for personal clusters. Using a personal subscription to serve other people may break the provider's terms. Use API keys for anything shared.

`docs/HARNESSES.md` covers each profile's command line, how to add a new CLI without writing code, and the quirks Garrison works around (harnesses that exit 0 after failing, MCP servers that fail authentication silently, and models that are quietly substituted).

## Protocols

| Surface | Where | Reference |
|---|---|---|
| REST and server-sent events | `http://<server>:8700/v1.0/...`, OpenAPI at `/openapi.json` | `REST_API.md` |
| WebSocket live updates | `ws://<server>:8700/v1.0/ws` | `WEBSOCKETS_API.md` |
| MCP (streamable HTTP) | `http://<server>:8701/mcp` | `MCP_API.md` |
| A2A (JSON-RPC, SSE) | `http://<server>:8700/v1.0/a2a/{tenantId}/{agentName}` | `A2A_API.md` |

Authentication is the same everywhere: a bearer session token from `POST /v1.0/token`, credential headers (`x-access-key` and `x-secret-key`), AWS-style signed requests, the administrator API key (`x-api-key`) for platform administration, and run tokens for agents delegating to agents.

## SDKs

| Language | Path | Package |
|---|---|---|
| C# | `sdk/csharp` | `Garrison.Sdk` |
| Python | `sdk/python` | `garrison_sdk` |
| JavaScript and TypeScript | `sdk/js` | `@garrison/sdk` |
| Go | `sdk/go` | `github.com/jchristn/Garrison/sdk/go` |

Each SDK has a README and a test harness. `scripts/run-sdk-harnesses.sh` starts a local server and worker and runs all four.

## Testing

```bash
dotnet run --project src/Test.Automated -f net10.0                       # Sqlite
GARRISON_TEST_PROVIDERS=sqlite,postgresql dotnet run --project src/Test.Automated -f net10.0
dotnet test src/Test.Xunit -f net10.0
dotnet test src/Test.Nunit -f net10.0
```

The Postgresql suites expect a server at `127.0.0.1:55432` (user `postgres`, password `garrison`), which you can start with `docker run -d -p 127.0.0.1:55432:5432 -e POSTGRES_PASSWORD=garrison -e POSTGRES_DB=garrison postgres:17`. The end-to-end suites start an in-process control plane and workers on free loopback ports and run real REST, MCP, and A2A traffic through the fake harness.

## Status and roadmap

`GARRISON_PLAN.md` is the build plan and progress tracker. The MVP milestone is one control node, two worker nodes, working Claude Code, Codex, and Mux agents, the dashboard, the SDKs, tests, Postman, and documentation. After that come control-plane high availability, a pod-per-run executor for stronger isolation, conversations and permission approvals, remote agents, budgets, and benchmarks.

## License

MIT. See `LICENSE.md`.
