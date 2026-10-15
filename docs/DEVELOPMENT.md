# Development

This page is for people changing Garrison itself: building it, running it on a laptop, running the tests, and the conventions a change has to follow. `CLAUDE.md` at the repository root has the full rule list, and `GARRISON_PLAN.md` is the build plan and progress tracker; annotate tasks there as you finish them.

## Prerequisites

| Tool | Used for |
|---|---|
| .NET 10 SDK (the libraries also target .NET 8) | Server, worker, harness library, tests, C# SDK |
| Node.js 22 | Dashboard, JavaScript SDK, Claude Code and Codex if you want real harnesses |
| Python 3.10 or later, Go 1.22 or later | Python and Go SDKs |
| Docker | PostgreSQL for tests, Newman, images |
| kubectl and minikube or K3S | Kubernetes work (see `docs/KUBERNETES.md`) |

## Building

```bash
dotnet build src/Garrison.sln
```

The build must finish with zero errors and zero warnings; product projects treat warnings as errors and generate XML documentation.

## Running locally

Run the server and at least one worker in separate terminals. Sqlite is the default, so nothing else is needed.

```bash
# Terminal 1: REST on 127.0.0.1:8700, MCP on 8701, development mode (public default keys allowed)
cd src/Garrison.Server && GARRISON_ALLOW_INSECURE_DEFAULTS=true dotnet run -f net10.0

# Terminal 2: a worker
cd src/Garrison.Worker && dotnet run -f net10.0
```

`GARRISON_ALLOW_INSECURE_DEFAULTS=true` (`Security.AllowInsecureDefaults`) is the explicit development mode. Without it, the server refuses to start while the master key, signing key, administrator API key, administrator password, or the seeded default or node secret key is empty or still its public built-in default, and the log names each one (SR-08). In development mode it starts and logs a warning instead. Never set it on anything another person can reach; set real values instead (`docs/SECURITY.md`).

The server writes `garrison.json` and `data/garrison.db` in its working directory on first start and seeds the default tenant, the `admin@garrison` user (password `password` in development mode), the administrator credential (`access_garrison_default`, `secret_garrison_default_change_me`), and the worker credential that a worker uses by default. The administrator API key is `garrisonadmin`. Delete the database file to start over.

The throwaway servers that `scripts/run-sdk-harnesses.sh`, `dashboard/tests/contract/run.mjs`, `k8s/tests/local-dry-run.sh`, and the benchmarks start set development mode themselves, and Touchstone's in-process servers set `Security.AllowInsecureDefaults` in code.

To run more than one worker on one machine, give each a distinct name and health port:

```bash
GARRISON_WORKER_NODE_NAME=worker-1 GARRISON_WORKER_HEALTH_PORT=8711 dotnet run -f net10.0
```

To run on other ports, set `GARRISON_REST_PORT`, `GARRISON_MCP_PORT`, and `GARRISON_MCP_PUBLIC_URL` on the server and `GARRISON_WORKER_SERVER_URL` on the worker.

### The fake harness locally

`builtin/fake` runs `garrison-fake-harness`, which must be on the worker's `PATH`. Build the fake harness and put a two-line wrapper somewhere on your path:

```bash
dotnet build src/Garrison.FakeHarness -f net10.0
mkdir -p ~/bin
cat > ~/bin/garrison-fake-harness <<'EOF'
#!/bin/sh
exec dotnet "$HOME/path/to/Garrison/src/Garrison.FakeHarness/bin/Debug/net10.0/garrison-fake-harness.dll" "$@"
EOF
chmod +x ~/bin/garrison-fake-harness
```

Restart the worker afterwards so its probe finds the harness. Then create an agent and a deployment on `builtin/fake` (or apply the example in `docs/MANIFESTS.md`) and invoke it.

### Real harnesses locally

Install `claude`, `codex`, or `mux` on the worker machine, create a secret with the right kind, bind it to a deployment, and invoke. The worker only passes allowlisted environment variables to harnesses, so a key exported in your shell does not reach them; it has to be a Garrison secret.

### Dashboard

```bash
cd dashboard
npm install
npm run dev          # proxies /v1.0 to http://127.0.0.1:8700, or GARRISON_API_URL
```

## Tests

The server, worker, and library tests are Touchstone suites in `src/Test.Shared`, run by three runners:

```bash
dotnet run --project src/Test.Automated -f net10.0     # console runner, Sqlite
dotnet test src/Test.Xunit -f net10.0
dotnet test src/Test.Nunit -f net10.0
```

| Suite | Covers |
|---|---|
| `DatabaseContractSuite` | Every data-layer method on each provider |
| `IdentitySuite` | Authentication schemes, tokens, RBAC, audit, over HTTP and in process |
| `ConfigurationSuite` | Harness profiles, templates, agents, deployments, manifests |
| `TemplateSuite` | The template language |
| `CompilerSuite` | Compiled specs for every built-in profile, compared with golden files in `src/Test.Shared/Golden` |
| `ParserSuite` | Output parsers against recorded and hand-written harness output in `src/Test.Shared/Fixtures` |
| `WorkerSuite` | The process executor, environment isolation, scrubbing, timeouts, cancellation |
| `RuntimeSuite` | Scheduling, leasing, fencing, maintenance, an in-process cluster with workers |
| `ProtocolSuite` | MCP and A2A end to end through the fake harness |

| Variable | Effect |
|---|---|
| `GARRISON_TEST_PROVIDERS` | `sqlite` (default), or `sqlite,postgresql` |
| `GARRISON_TEST_PG_HOST`, `_PORT`, `_DATABASE`, `_USERNAME`, `_PASSWORD` | PostgreSQL for tests; defaults `127.0.0.1`, `55432`, `garrison`, `postgres`, `garrison` |
| `GARRISON_TEST_LOGS` | `true` to show server logs during tests |
| `GARRISON_UPDATE_GOLDEN` | `true` to rewrite the compiler golden files; review the diff before committing |

Start PostgreSQL for tests with:

```bash
docker run -d --name garrison-pg -p 127.0.0.1:55432:5432 \
  -e POSTGRES_PASSWORD=garrison -e POSTGRES_DB=garrison postgres:17
GARRISON_TEST_PROVIDERS=sqlite,postgresql dotnet run --project src/Test.Automated -f net10.0
```

`scripts/benchmark-event-inserts.sh f947551` compares direct event insertion with a baseline revision; set `GARRISON_TEST_PROVIDERS=sqlite,postgresql` to measure both. See `docs/SCALING.md` for workload, results, and parameter limits.

`src/Test.Shared/Fixtures/RECORDING.md` explains how the harness output fixtures were captured and how to re-record them cheaply.

Other checks:

```bash
cd dashboard && npm run lint && npm run build && npm test     # and npm run test:e2e for Playwright
scripts/run-sdk-harnesses.sh                                  # builds, starts a server and worker on 18700, runs all four SDK harnesses
scripts/check-em-dash.sh                                      # fails on any em-dash in the repository
```

### Postman and Newman

`assets/postman/Garrison.postman_collection.json` exercises every REST route plus MCP and A2A, and `Garrison.postman_environment.json` points it at `http://127.0.0.1:8700`. With a server and a worker that has the fake harness running:

```bash
docker run --rm -v "$PWD/assets/postman:/etc/newman" postman/newman:latest run \
  Garrison.postman_collection.json -e Garrison.postman_environment.json \
  --env-var baseUrl=http://host.docker.internal:8700 --env-var mcpUrl=http://host.docker.internal:8701/mcp
```

The collection creates its own resources with unique names and deletes them at the end.

## Conventions

The rules in `CLAUDE.md` are not optional. The ones that most often catch a first change:

- One class or enum per file, `using` statements inside the namespace, no `var`, no tuples, `_PascalCase` private fields, XML documentation on every public member, `.ConfigureAwait(false)` and a `CancellationToken` on async methods.
- SQL is written by hand, and records are stored as columns and child tables, not JSON.
- Every route goes through a registrar (`Anonymous`, `Authenticated`, or `Scoped` with a resource type and operation), which also records it in the operation scope map and OpenAPI.
- Every tenant-owned query filters by the tenant from the request context.
- Text sent to a harness comes from a prompt template, never from a string literal in the run path.
- Workers never touch the database.
- Loopback is `127.0.0.1`, never `localhost`.
- No em-dashes anywhere, including comments, docs, and commit messages.
- Do not change version numbers (`0.1.0-alpha` in `src/Directory.Build.props` and its mirrors) unless asked.

### Adding a route

1. Add the handler to the feature's registrar in `src/Garrison.Server/Routes` and register it with `Scoped` (or `Authenticated` with checks in the handler).
2. Use typed request and response classes; they feed OpenAPI.
3. Add tests in the matching suite, an entry in `REST_API.md`, a request in the Postman collection, and the method in each SDK.

### Adding a table or column

Migrations live with the data layer in `src/Garrison.Core/Database` and run at startup when `Database.ManageSchema` is true. Add a new migration rather than editing an old one, implement it for both Sqlite and PostgreSQL, and extend `DatabaseContractSuite`.

### Adding a harness

Most new CLIs need only a harness profile (see `docs/HARNESSES.md`). A new output format needs a parser in `src/Garrison.Harnesses/Parsers` registered in `ParserFactory`, fixtures in `src/Test.Shared/Fixtures`, and parser tests. A new built-in profile is a JSON file in `src/Garrison.Core/Seed/HarnessProfiles` plus golden files.

## Images

```bash
./build-server.sh v0.1.0-alpha     # and build-worker.sh, build-dashboard.sh, or build-all.sh
```

The scripts build multi-architecture images with Docker Build Cloud and push them to Docker Hub as `jchristn77/garrison-*`. For a local image, use the `docker build` line at the top of each Dockerfile.
