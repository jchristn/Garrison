# Garrison documentation

Garrison turns configurable agent harnesses into tenant-scoped services, invoked over REST, MCP or A2A and executed by workers you operate. Start with the workflow you need, then use the configuration and protocol references for exact contracts. This documentation describes the current source checkout; published images may predate these capabilities.

## Start and integrate

| Goal | Read |
| --- | --- |
| Understand the platform and its execution model | [Platform overview](../README.md), [comparison with other layers](../README.md#how-garrison-compares), [architecture](ARCHITECTURE.md) |
| Run the supplied stack | [Docker Compose](DOCKER.md), [Kubernetes](KUBERNETES.md), [source development](DEVELOPMENT.md) |
| Create, invoke and delegate between agents | [Quick start](QUICKSTART.md), [harness profiles](HARNESSES.md), [prompt templates](PROMPTS.md) |
| Call Garrison from your application | [REST](../REST_API.md), [MCP](../MCP_API.md), [A2A](../A2A_API.md), [WebSocket updates](../WEBSOCKETS_API.md), [SDKs](../README.md#sdks) |
| Move reproducible agent configuration between tenants | [Manifests and bundles](MANIFESTS.md), [management MCP](MANAGEMENT_MCP.md) |
| Version agents and move them through dev, staging, and prod | [Revisions, environments, and promotion](REVISIONS.md) |
| Give agents skills, reference files, and document templates | [Agent assets](ASSETS.md) |
| Share files across the turns and agents of a conversation | [Conversation file spaces](FILE_SPACES.md) |
| Let orchestrators find agents, MCP tools, and host tools | [Capability catalog](CAPABILITIES.md) |
| Put a group of agents behind their own chat UI | [Agentic apps](APPS.md), [app chat UI](APP_UI.md) |
| Design agents and apps in drafts, review the diff, and apply after approval | [Agent Studio](STUDIO.md) |

## Build agent workflows

| Goal | Read |
| --- | --- |
| Chain stages with human review | [Pipelines](PIPELINES.md) |
| Schedule work and react to external events | [Cron/webhook triggers](TRIGGERS.md), [signed notifications](NOTIFICATIONS.md) |
| Retain deliverables and inspect conversations | [Artifacts](ARTIFACTS.md), [transcript exports](TRANSCRIPTS.md) |
| Release slots during supported approval/child waits | [Durable continuation and workspace caches](CONTINUATION.md) |
| Recall information across runs | [Replaceable agent memory](AGENT_MEMORY.md), [optional external NotDory example](NOTDORY.md) |
| Invoke work hosted elsewhere | [Remote A2A/MCP agents](REMOTE_AGENTS.md) |
| Execute through a compatible model API | [Provider API harness](PROVIDER_API.md) |

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

Garrison remains alpha. Durable suspension, memory and daily quota enforcement have explicit enablement requirements; retry policies do not make arbitrary shell or third-party effects exactly-once. Protocol and feature guides state their supported boundaries.

- [Current completed, deferred and conditional scope](REMAINING_PLAN_MATRIX.md).
- [Latest recovery, continuation and cache acceptance](testing/D063_VALIDATION.md).
- [Application telemetry, diagnostics and performance evidence](testing/D062_VALIDATION.md).
- [Documentation accuracy review](testing/documentation-readiness-review.md).
- [Build plan and decisions](../GARRISON_PLAN.md), [CI coverage](CI.md), [security review](SECURITY_REVIEW.md).
- [Licensing and dependency notices](../THIRD_PARTY_NOTICES.md), [changelog](../CHANGELOG.md).

Fresh-user acceptance, API/SDK stability review and release work remain deferred. Larger capacity acceptance is also deferred. Local acceptance results describe the measured fixture and topology; they are not universal throughput, latency or compliance claims.
