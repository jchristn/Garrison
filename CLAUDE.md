# CLAUDE.md

Guidance for agents working in this repository. The completed build plans are archived: `archive/GARRISON_PLAN.md` (the original plan and decision log, D- entries) and `archive/AGENT_DESIGN_DEPLOY_PLAN.md` (the 0.2.0 Agent Studio plan, AD entries). Read them for the reasoning behind a design and cite their IDs, but they are no longer annotated; record changes in `CHANGELOG.md`.

The active plan is `AUTONOMOUS_AGENTS_PLAN.md` (the 0.3.0 autonomous agents release, tasks `AA<phase>.<n>` and decisions `AA-<nnn>`). Work happens on `feature/autonomous-agents`, never directly on `main`. Annotate each task's checkbox as it lands, following section 1.1 of that plan.

## What Garrison is

A multi-tenant control plane that runs headless agent harnesses (Claude Code, Codex, Mux, Gemini CLI, opencode, pi, or any CLI described by a harness profile) on pull-based worker nodes, exposed over REST, MCP, and A2A, deployed to Kubernetes.

## Layout

| Path | Contents |
|---|---|
| `src/Garrison.Core` | Models, enums, settings models, data layer (Sqlite, Postgresql), security primitives, template renderer, invocation compiler, services. Autonomy rules that need no server live here too: `Organizations/` (executive draft validation, change classes, change rule matching, org context), `Evaluation/` (scorers, judge parsing, canary step decisions, shadow sampling), `Keepers/`, `Messaging/`, `Reports/`, `Memory/`, `Escalations/`. |
| `src/Garrison.Harnesses` | Output parsers, MCP config writers, process runner, harness probes. |
| `src/Garrison.Server` | Control plane ("Command"): Watson 7 host, routes, auth, scheduler, node protocol, MCP (Voltaic), A2A gateway. `Runtime/` holds the autonomy services: `KeeperScheduler`, `MessageService`, `ReportService`, `EscalationService`, `ChainOfCommand` (the org resolver), `ExecutiveAuthority`, `ChangeRuleService`, `EvalRunner`, `ShadowTrialService`, `CanaryService`, `FreezeService`, `OrgBudgetGuard`, `BoardService`. |
| `src/Garrison.Worker` | Worker node ("Post"): registration, heartbeat, lease loop, process executor. |
| `src/Garrison.FakeHarness` | Deterministic harness used by tests and smoke tests. |
| `src/Test.*` | Touchstone suites and runners. |
| `dashboard/` | React 19 + Vite 6 operator console. |
| `app-ui/` | React 19 + Vite 6 end-user chat UI for agentic apps, served by the dashboard image at `/apps/{slug}/`. |
| `sdk/{csharp,python,js,go}` | SDKs, each with a README and a test harness. |
| `docker/` | Docker Compose stack (`compose.yaml`), `update.{sh,bat}`, `factory/reset.{sh,bat}`. |
| `k8s/` | Kustomize base, components, overlays (minikube, k3s, production), Helm chart, scripts. |
| `docs/` | Architecture, configuration, harnesses, prompts, manifests, Kubernetes, security, scaling, telemetry, i18n, and the autonomy guides (keepers, escalations, brakes, memory, reports, messaging, organizations, executives, evals, board). `docs/README.md` is the index. |
| `examples/` | Manifests, the agentic app examples, and the autonomy examples under `examples/autonomous/` (`gerbil`, `site-reliability-org`). |

## Build and test

```bash
dotnet build src/Garrison.sln
dotnet run --project src/Test.Automated -f net10.0              # Touchstone suites (Sqlite by default)
GARRISON_TEST_PROVIDERS=sqlite,postgresql dotnet run --project src/Test.Automated -f net10.0
dotnet test src/Test.Xunit -f net10.0
dotnet test src/Test.Nunit -f net10.0
cd dashboard && npm install && npm run lint && npm run build && npm test
cd app-ui && npm install && npm run lint && npm run build && npm test
scripts/run-sdk-harnesses.sh
scripts/check-em-dash.sh
scripts/check-version.sh
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

### Autonomy rules

Agents in 0.3.0 start work, write to each other, and change configuration without a person in the loop. These rules keep that safe, and any change to keepers, messaging, reports, memory, escalations, organizations, executives, evals, or brakes must keep them. `docs/ARCHITECTURE.md` ("Autonomy on top of the runtime") and `docs/SECURITY.md` ("Executive authority") explain the mechanics.

- **No self-modification (AA-022).** No agent path may change the agent's own agent record, deployments, mandates, or unit, anything above it in the chart, a secret or credential reference, any `managementAccess`, or a budget upward. This is permanent, not a deferred feature. Executive drafts are checked by `ExecutiveDraftValidator` (`Garrison.Core/Organizations`) at diff, at request-apply, and again just before apply; a kind or field an executive may newly touch must be added there, and no change rule or human approval may lift a hard limit. Change rules are written only by people (AA-023): rule routes answer 403 `RulesArePeopleOnly` to run tokens and the rule-writing tools are hidden from runs. Run tokens never hold the Freeze permissions and are refused on the mandate publish route.
- **Agent-written data is untrusted (AA-025).** Memory, reports, messages, escalation answers, briefs, and keeper tick summaries reach a prompt only through their `PromptTemplate` (`memory-recall`, `report-digest`, `inbox-delivery`, `escalation-answered`, `keeper-tick`), framed as data with provenance, never interpolated into instructions. Keep the random begin and end markers the renderers use. Audit records and logs name such a record, never its text.
- **Run-token mutations go through the effect journal (AA-026).** A run changes state only through a Garrison MCP tool whose operation is not `Read`, so `GarrisonMcpServer` checks the session and lease epoch and records the call as `Authorized`, `Dispatched`, and `Completed` before and after it runs (`EffectClassificationRules.RequiresJournal`). Do not add a REST route or side channel that lets a run token mutate around the gateway. Make a replay from the same run return the first result, the way messages, reports, and escalations derive a key from the run and the content.
- **Shadow and eval runs cannot act (AA-027, AA-074).** A new tool that writes, sends, files, remembers, or drafts must be refused by `ShadowRunPolicy` for runs of kind `Shadow` and `Eval`.
- **One run path (AA-013).** Keeper ticks, message wakes, eval cases, and shadow copies are runs of their own `RunKindEnum`. Start them through `RunService`, which applies freezes and unit budgets at admission, and never through a parallel execution path. Scheduled work (keeper wakes, eval drivers, canary steps) runs on the leader's maintenance pass and claims what it starts with a compare-and-set, so several replicas start it once.
- **One chain of command.** Organization questions (manager, chain, subtree, lines) go through `ChainOfCommand`, which reads only published revisions of live organizations. Do not compute reporting lines from the working tree.

### Writing

- Never use em-dashes anywhere: code, comments, docs, Postman, commit messages. Restructure the sentence.
- Documentation is reviewed for human voice (`WRITING_DOCUMENTS.md`).

### Versioning

- The product version is `0.3.0`, defined once in `src/Directory.Build.props` and mirrored in the dashboard, SDK manifests, Helm chart, and image tags (`v0.3.0`). Versions and tags use `vX.Y.Z` with no `-alpha` suffix; a 0.x version means alpha. `scripts/check-version.sh` fails when a mirror drifts.
- Never change a version number unless the user explicitly asks for that change.

### Git

- Do not commit or push unless the user asks.
