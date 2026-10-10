# CLAUDE.md

Guidance for agents working in this repository. Read `GARRISON_PLAN.md` first: it is the build plan, the decision log, and the progress tracker. Annotate tasks there as you complete them (format in section 1 of the plan).

## What Garrison is

A multi-tenant control plane that runs headless agent harnesses (Claude Code, Codex, Mux, Gemini CLI, or any CLI described by a harness profile) on pull-based worker nodes, exposed over REST, MCP, and A2A, deployed to Kubernetes.

## Layout

| Path | Contents |
|---|---|
| `src/Garrison.Core` | Models, enums, settings models, data layer (Sqlite, Postgresql), security primitives, template renderer, invocation compiler, services. |
| `src/Garrison.Harnesses` | Output parsers, MCP config writers, process runner, harness probes. |
| `src/Garrison.Server` | Control plane ("Command"): Watson 7 host, routes, auth, scheduler, node protocol, MCP (Voltaic), A2A gateway. |
| `src/Garrison.Worker` | Worker node ("Post"): registration, heartbeat, lease loop, process executor. |
| `src/Garrison.FakeHarness` | Deterministic harness used by tests and smoke tests. |
| `src/Test.*` | Touchstone suites and runners. |
| `dashboard/` | React 19 + Vite 6 operator console. |
| `sdk/{csharp,python,js,go}` | SDKs, each with a README and a test harness. |
| `docker/` | Docker Compose stack (`compose.yaml`), `update.{sh,bat}`, `factory/reset.{sh,bat}`. |
| `k8s/` | Kustomize base, components, overlays (minikube, k3s, production), Helm chart, scripts. |
| `docs/` | Architecture, configuration, harnesses, prompts, manifests, Kubernetes, security, scaling, telemetry, i18n. |

## Build and test

```bash
dotnet build src/Garrison.sln
dotnet run --project src/Test.Automated -f net10.0              # Touchstone suites (Sqlite by default)
GARRISON_TEST_PROVIDERS=sqlite,postgresql dotnet run --project src/Test.Automated -f net10.0
dotnet test src/Test.Xunit -f net10.0
dotnet test src/Test.Nunit -f net10.0
cd dashboard && npm install && npm run lint && npm run build && npm test
scripts/run-sdk-harnesses.sh
scripts/check-em-dash.sh
```

Local development: run `Garrison.Server` (Sqlite, port 8700, MCP 8701) and one or more `Garrison.Worker` processes (each with a distinct `GARRISON_WORKER_NODE_NAME` and `GARRISON_WORKER_HEALTH_PORT`).

## Non-negotiable rules

These come from `~/Code/Agents/requirements` and apply to every change.

### C# code style (follow strictly)

- The namespace declaration is at the top, and `using` statements are INSIDE the namespace block.
- Microsoft and standard system library usings first, alphabetical, then other usings, alphabetical.
- All public members, constructors, and public methods have XML documentation. Private members and private methods have none.
- Public members use explicit getters and setters with backing variables when the value requires range or null validation.
- Private member variables are `_PascalCase` (`_FooBar`, never `_fooBar`).
- No tuples unless absolutely, absolutely necessary.
- Async calls use `.ConfigureAwait(false)` where appropriate.
- Every async method accepts a `CancellationToken`, unless the class owns a `CancellationToken` or `CancellationTokenSource` member.
- Async methods check for cancellation at appropriate places.
- Do not assume members exist on classes that are opaque to you. Ask.
- Never use `var`. Use the actual type.
- Manually prepared SQL strings are intentional. Keep them.
- Keep READMEs accurate when you change behavior.
- Compile and leave zero errors and zero warnings.
- Exactly one class or one enum per file. No nested classes or enums.
- A method returning `IEnumerable` gets an async variant with a `CancellationToken`.
- No constants for things a developer may want to configure: use a public member with a private backing field and a sensible default.
- Document defaults, minimums, maximums, and what values mean.
- Use specific exception types with meaningful, contextual messages; document them with `/// <exception>`; use exception filters where appropriate.
- Implement `IDisposable`/`IAsyncDisposable` with the full pattern (`protected virtual void Dispose(bool disposing)`, call `base.Dispose`).
- Classic `using (...) { }` statements, not using declarations.
- Nullable reference types enabled; validate inputs with guard clauses; document nullability and thread safety.
- Prefer `Interlocked` for simple atomics and `ReaderWriterLockSlim` for read-heavy locks.
- Prefer LINQ where readable; `.Any()` over `.Count() > 0`; `.FirstOrDefault()` with null checks.
- Regions (`Public-Members`, `Private-Members`, `Constructors-and-Factories`, `Public-Methods`, `Private-Methods`) are used in files over 500 lines and are welcome elsewhere.
- No `Console.WriteLine` in library code.
- No partial classes.
- No `JsonElement`/`JsonNode` DOM navigation for fixed contracts: define a typed class.

### Architecture rules

- Watson 7 (`Watson` package) is the only HTTP stack. Routes are registered by per-feature registrar classes on `server.Routes.{PreAuthentication|PostAuthentication}.{Static|Parameter}`.
- Management API under `/v1.0/api/...`; tokens at `/v1.0/token`; tenant resources under `/v1.0/api/tenants/{tenantId}/...`.
- Every tenant-owned query filters by tenant ID from the `RequestContext`. Cross-tenant reads return 404.
- Every route and MCP tool has an entry in the operation scope map (resource type and operation).
- IDs are PrettyId K-sortable strings with the prefixes in `Constants.cs`.
- Structured persistence: columns and child tables, never whole-object JSON blobs. The only unmanaged JSON columns are listed in plan section 7.5.
- Every prompt and every piece of text sent to a harness comes from a `PromptTemplate`. No hard-coded prompt text in the run path.
- Workers never touch the database. The control plane compiles an `ExecutionSpec` and ships it with the lease.
- Loopback is always `127.0.0.1`, never `localhost`.

### Writing

- Never use em-dashes anywhere: code, comments, docs, Postman, commit messages. Restructure the sentence.
- Documentation is reviewed for human voice (`WRITING_DOCUMENTS.md`).

### Versioning

- The product version is `0.1.0-alpha`, defined once in `src/Directory.Build.props` and mirrored in the dashboard, SDK manifests, and Helm chart.
- Never change a version number unless the user explicitly asks for that change.

### Git

- Do not commit or push unless the user asks.
