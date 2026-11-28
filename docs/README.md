# Garrison documentation

Garrison is a runtime for headless agent harnesses with an agent studio on top of it: one platform to build, test, deploy, run, operate, and observe agentic applications. The runtime turns Claude Code, Codex, Gemini CLI, Mux, opencode, pi, provider APIs, or any CLI into tenant-scoped agents that workers pull and run, invoked over REST, MCP, or A2A. The studio (Garrison Agent Studio, new in 0.2.0) is where those agents get designed into apps, reviewed as drafts, tried in a playground, approved, and promoted from `dev` to `prod`. Version 0.3.0 lets agents work without being asked: keepers with standing jobs, organizations with a chain of command and budgets, executives that propose changes below themselves, and a board of people at the top.

Start with the workflow you need, then use the configuration and protocol references for exact contracts. These documents describe the source checkout of `v0.3.0`.

## Start and integrate

| Goal | Read |
| --- | --- |
| Understand the platform and its execution model | [Platform overview](../README.md), [comparison with other layers](../README.md#how-garrison-compares), [architecture](ARCHITECTURE.md) |
| Run the supplied stack | [Docker Compose](DOCKER.md), [Kubernetes](KUBERNETES.md), [source development](DEVELOPMENT.md) |
| Create, invoke and delegate between agents | [Quick start](QUICKSTART.md), [harness profiles](HARNESSES.md), [prompt templates](PROMPTS.md) |
| Call Garrison from your application | [REST](../REST_API.md), [MCP](../MCP_API.md), [A2A](../A2A_API.md), [WebSocket updates](../WEBSOCKETS_API.md), [SDKs](../README.md#sdks) |
| Move reproducible agent configuration between tenants | [Manifests and bundles](MANIFESTS.md), [management MCP](MANAGEMENT_MCP.md) |

## Build and ship agentic apps

| Goal | Read |
| --- | --- |
| Design agents and apps in drafts, review the diff, try them in the playground, and apply after approval | [Agent Studio](STUDIO.md) |
| Have the agent architect build drafts with you, keep reusable architects, and choose or write their prompts | [The agent architect](ARCHITECT.md), [architects](ARCHITECT.md#architects), [architect prompts](PROMPTS.md#architect-prompts) |
| Put a group of agents behind one entry agent, its own chat UI, branding, and sign-in | [Agentic apps](APPS.md), [app chat UI](APP_UI.md) |
| Version agents and move them through dev, staging, and prod, with rollback | [Revisions, environments, and promotion](REVISIONS.md) |
| Score agents against eval sets, gate promotions on a passing score, shadow a candidate on real inputs, and roll out with a canary | [Evaluations, shadow trials, and canary releases](EVALS.md) |
| Give agents skills, reference files, and document templates | [Agent assets](ASSETS.md) |
| Share files across the turns and agents of a conversation | [Conversation file spaces](FILE_SPACES.md) |
| Let orchestrators find agents, MCP tools, and host tools, and choose where a capability comes from | [Capability catalog](CAPABILITIES.md) |
| Start several agents at once and gather their results | [Fan-out and gather](FAN_OUT.md) |
| Apply a finished example app | [Example agentic apps](../examples/agentic-apps/README.md) |

## Build agent workflows

| Goal | Read |
| --- | --- |
| Chain stages with human review | [Pipelines](PIPELINES.md) |
| Schedule work and react to external events | [Cron/webhook triggers](TRIGGERS.md), [signed notifications](NOTIFICATIONS.md) |
| Retain deliverables and inspect conversations | [Artifacts](ARTIFACTS.md), [transcript exports](TRANSCRIPTS.md) |
| Release slots during supported approval/child waits | [Durable continuation and workspace caches](CONTINUATION.md) |
| Recall information across runs | [Agent memory](AGENT_MEMORY.md), [optional external NotDory example](NOTDORY.md) |
| Invoke work hosted elsewhere | [Remote A2A/MCP agents](REMOTE_AGENTS.md) |
| Execute through a compatible model API | [Provider API harness](PROVIDER_API.md) |

## Run autonomous agents and organizations

These are the 0.3.0 guides. Read them roughly in order: a keeper is the unit everything else builds on, the organization gives keepers a shape, and the brakes are what you reach for when one of them does something you did not expect. [How autonomy fits the runtime](ARCHITECTURE.md#autonomy-on-top-of-the-runtime) explains the moving parts underneath, and step 10 of the [quick start](QUICKSTART.md#10-run-an-autonomous-organization) builds a small organization on the fake harness with no model credentials.

| Goal | Read |
| --- | --- |
| Give an agent a standing job it checks on by itself, on a schedule that backs off while nothing happens | [Keepers](KEEPERS.md) |
| Let an agent ask a person, a role, or another agent for a decision, with or without waiting | [Escalations](ESCALATIONS.md) |
| Let agents message each other, wake each other for urgent work, and stop loops | [Messaging](MESSAGING.md) |
| Have agents report status, metrics, issues, and decisions to the agents and people above them | [Reports](REPORTS.md) |
| Follow a request from the caller through every agent, message, and record it reached, and back | [Activity trails](TRAILS.md) |
| Share memory between the agents of an app or an organization unit, with provenance on every entry | [Agent memory](AGENT_MEMORY.md#who-may-use-which-scope) |
| Arrange agents into an organization with leads, reporting and peer lines, shared unit memory, budgets, and performance rollups | [Organizations](ORGANIZATIONS.md) |
| Let a unit lead propose changes to the units below it, and pre-authorize routine ones with change rules | [Executives](EXECUTIVES.md), [executive drafts in the studio](STUDIO.md#executives) |
| Test a changed agent before it carries traffic: eval sets, gates on promotions and change rules, shadow trials, canary releases | [Evaluations](EVALS.md) |
| Sit on an organization's board: read its health in one call, give the CEO direction, get briefs, and talk to the CEO | [The board](BOARD.md) |
| Stop an agent, deployment, keeper, app, unit, or organization, cap spending, cancel a unit's work, or stop every keeper at once | [Brakes](BRAKES.md) |
| Run evals on a schedule | [Scheduled checks](TRIGGERS.md#scheduled-checks) |
| Version an organization and roll it back along with its agents | [Organization records](REVISIONS.md#organization-records) |
| Watch keepers, messages, evals, and canaries in Grafana | [Telemetry](TELEMETRY.md) |
| Understand the threats autonomy adds and how each is handled | [Security: executive authority](SECURITY.md#executive-authority) |
| Apply a complete example: one keeper, or a whole site-reliability organization | [`examples/autonomous/gerbil/`](../examples/autonomous/gerbil/), [`examples/autonomous/site-reliability-org/`](../examples/autonomous/site-reliability-org/) |

## Operate and secure

| Goal | Read |
| --- | --- |
| Configure servers, workers and execution limits | [Configuration reference](CONFIGURATION.md) |
| Control tenancy, permissions, secrets and isolation | [Security](SECURITY.md), [key rotation](KEY_ROTATION.md), [credential broker](CREDENTIAL_BROKER.md) |
| Choose safe retry and recovery behavior | [Effect-safety guarantees and boundaries](effect-safety.md) |
| Manage placement, queue bounds and tenant fairness | [Tenant scheduling](TENANT_SCHEDULING.md), [scale-out and capacity](SCALING.md) |
| Diagnose latency and work performed | [Telemetry, metrics and traces](TELEMETRY.md), [benchmarking](../BENCHMARKING.md) |
| Preserve data and recover an installation | [Backup and restore](BACKUP.md) |
| Use an optional external distributed lease service | [Clutch lease provider](CLUTCH_LEASES.md) |

## Status, validation and contributing

Garrison is alpha: a 0.x version means the REST API, MCP tools, schema, settings, and SDKs can still change. Durable suspension, memory and daily quota enforcement have explicit enablement requirements; retry policies do not make arbitrary shell or third-party effects exactly-once. Protocol and feature guides state their supported boundaries.

- [Active plan: autonomous agents for 0.3.0](../AUTONOMOUS_AGENTS_PLAN.md).
- [Current completed, deferred and conditional scope](REMAINING_PLAN_MATRIX.md).
- [Latest recovery, continuation and cache acceptance](testing/D063_VALIDATION.md).
- [Application telemetry, diagnostics and performance evidence](testing/D062_VALIDATION.md).
- [Documentation accuracy review](testing/documentation-readiness-review.md).
- [Build plan and decisions](../archive/GARRISON_PLAN.md), [CI coverage](CI.md), [security review](SECURITY_REVIEW.md).
- [Licensing and dependency notices](../THIRD_PARTY_NOTICES.md), [changelog](../CHANGELOG.md).

Fresh-user acceptance, API/SDK stability review and release work remain deferred. Larger capacity acceptance is also deferred. Local acceptance results describe the measured fixture and topology; they are not universal throughput, latency or compliance claims.
