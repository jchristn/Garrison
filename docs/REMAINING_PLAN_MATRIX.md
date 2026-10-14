# Remaining Plan Scope Matrix

Updated 2026-10-14 under D-042/D-043 and D-049. The user selected all remaining P6/P7 work now, P11.18-20, and P12.8-13/P12.17. Other unfinished P11/P12 work and all unfinished P14/P15 work are deferred. Completed implementations remain. Daily quotas and cost estimation stay implemented, with quota enforcement explicitly opt-in and off by default.

D-049 (2026-10-14) brought P11.14, P12.29, P12.38, and P14.15 back into active scope. There are 0 active phase tasks, 1 conditional P10 task (P10.25, not evidenced: P14.15 never filled the slots; P10.24 completed 2026-10-14), and 55 deferred phase tasks. P6.17/P6.19/P7.5/P11.14/P11.18/P11.19/P11.20/P12.8/P12.9/P12.10/P12.11/P12.12/P12.13/P12.17/P12.29/P12.38/P14.15 are complete. G-8 is done (SyslogLogging 2.4.1). G-12 is done (new Codex deployments use `builtin/codex-app-server`). G-29 is done (D-050: containerized workers and run pods default Codex to `danger-full-access`; the container is the sandbox). Under D-050, I-06 (manifest references resolved once per apply), I-08 (warnings for clamped values), and the empty-input rejection (400 `InputRequired`) are done; P10.24 is in progress separately. I-01, I-05, and cancellation latency were completed 2026-10-13.

Image publication (P7.5) is complete for amd64 and arm64. SDK publication (P6.20) is skipped at user request. The repository remains private unless the user explicitly changes its visibility.

| ID | Remaining capability | Scope | Dependency or decision |
|---|---|---|---|
| P6.20 | Publish SDK packages | Deferred | Skipped at user request (D-043) |
| P10.24 | Tune demonstrated control-plane bottlenecks | Complete | 2026-10-14: 25 to 50 runs/s sustained, wakeups 17.8 to 1.0 per run, auth statements 75 to 4 per run |
| P10.25 | Schedule by CPU/memory capacity | Conditional, not evidenced | P14.15 never filled the slots (56 of 320 at most), so slot sizing is not the limit yet |
| P11.14 | Trusted/untrusted deployment policy | Complete | D-049; schema 23. Existing deployments stay Trusted; Untrusted runs queue (`NoIsolatingWorker`) until an isolating worker is available; tenant `requireUntrustedDeployments` rejects Trusted deployments with a field code |
| P11.15 | Per-deployment network egress allowlists | Deferred | CIDR/port NetworkPolicy rules |
| P11.17 | Isolation attack tests in CI | Deferred | Depends on trust policy and egress controls |
| P12.2 | Workspace snapshots and cross-node resume | Deferred | Needs artifact storage and harness continuation |
| P12.4 | Execute remote A2A/MCP agents | Deferred | Registration health checks and expiry |
| P12.5 | Cron and signed webhook triggers | Deferred | New invocation entry points |
| P12.8 | Filesystem/S3 artifact stores and browser | Complete | Deployed and validated; explicit globs only. |
| P12.9 | Multi-agent pipelines with review gates | Complete | D-048; schema 21; REST, MCP, SDKs, dashboard; not yet validated live |
| P12.10 | Management MCP tools | Complete | Shared REST mutation path; credential/tenant/protection/versioning checks and live Docker CRUD/manifest roundtrip validated |
| P12.11 | Clutch-backed lease provider | Complete | Opt-in; real-service expiry/disconnect/outage checks pass on both databases; default Docker deployment healthy |
| P12.12 | Test stdio MCP servers from workers | Complete | Deployed; selected-worker API/UI/SDK diagnostics validated |
| P12.13 | Direct provider API execution | Complete | Opt-in compatible adapter; streaming, approved delegation, repair/resume, usage and real endpoint validated. Other adapters/stdio tools outside initial mode |
| P12.14 | Completion/failure webhook notifications | Deferred | Operator integrations |
| P12.15 | Dashboard coverage for retained Phase 12 features | Deferred | Only for features the user retains |
| P12.16 | SDK coverage for retained Phase 12 features | Deferred | Only for features the user retains |
| P12.17 | API docs/Postman for retained Phase 12 features | Complete | Pipelines added 2026-10-13 (docs/PIPELINES.md, Postman folder) |
| P12.18 | Tests for retained Phase 12 features | Deferred | Only for features the user retains |
| P12.19 | NotDory memory integration example | Deferred | Documentation/example integration |
| P12.20 | Conductor integration example | Deferred | Documentation/example integration |
| P12.21 | Marketplace manifest bundle import/export | Deferred | Packaging and sharing configuration |
| P12.22 | Schema-generated Invoke input forms | Deferred | UI convenience for structured agent inputs |
| P12.23 | Compare runs across deployments | Deferred | Evaluation UI |
| P12.24 | Traffic splitting experiments | Deferred | Outcome metrics by deployment |
| P12.25 | Kubernetes/vault secret providers | Deferred | Alternative secret storage backends |
| P12.26 | Dashboard OIDC login | Deferred | Separate authentication design required |
| P12.27 | Markdown/JSON transcript export | Deferred | Useful for debugging and sharing existing runs |
| P12.28 | Prompt A/B evaluation hooks | Deferred | Experimentation feature |
| P12.29 | Explicit retry/effect policy | Complete (D-049) | Schema 24: existing RetryOnNodeLoss values carry over (true AtLeastOnce, false AtMostOnce); new deployments default to AtMostOnce; Journaled behaves as AtMostOnce until P12.33 |
| P12.31 | Epoch-fenced tool and credential gateway | Deferred | Garrison tools/brokered credentials only |
| P12.32 | Effect intent journal | Deferred | Depends on the gateway; records uncertain external effects |
| P12.33 | Journal-aware recovery | Deferred | Depends on effect policy and journal |
| P12.34 | Effect-safety chaos tests | Deferred | Depends on effect policies and journal |
| P12.36 | Tenant fair-share scheduling and queue bounds | Deferred | QoSKit; most useful for shared multi-tenant workloads |
| P12.38 | Prevent parent/child slot deadlocks | Complete | D-049 bounded slot lending: wait handshake, worker child reserve and waiter cap, deployment limit excludes waiting ancestors, typed `DelegationCapacityExhausted`; schema 22 |
| P12.39 | Durable suspension and cross-node continuation | Deferred | Needs snapshots, artifacts, capabilities, effect safety |
| P12.40 | Pin and test harness session formats | Deferred | Protects conversation resume across CLI upgrades |
| P12.41 | Declarative output/parser mappings | Deferred | Onboard harnesses without changing C# |
| P12.42 | Harness parse-preview endpoint and UI | Deferred | Makes harness configuration easier to debug |
| P12.43 | Re-run with pinned deployment/template versions | Deferred | Needs deployment version history |
| P12.44 | Compare compiled execution specs | Deferred | Depends on recorded/reconstructed configuration |
| P12.45 | Canary promotion/rollback recommendations | Deferred | Depends on traffic experiments; operator approves changes |
| P12.46 | Git/workspace caching | Deferred | Performance optimization; snapshot cache needs artifacts |
| P14.15 | Load the control plane to failure | Complete | 2026-10-14: ceiling about 25 to 28 runs/s with 320 slots; thundering-herd claim races are the limit (see `docs/SCALING.md`) |
| P15.1 | Security review | Deferred | Secrets, tokens, SSRF, paths, command arguments |
| P15.2 | Versioned master-key rotation | Deferred | Production key lifecycle |
| P15.3 | Credential and run-token expiry policies | Deferred | Bound credential lifetimes |
| P15.4 | Dependency/image vulnerability scans | Deferred | CI hardening |
| P15.5 | Signed images and SBOMs | Deferred | Supply-chain release artifacts |
| P15.6 | Upgrade-path tests across releases | Deferred | Protect deployed installations |
| P15.7 | Full simulated user session and report | Deferred | Proves initial setup and core workflows |
| P15.8 | User review and verification of findings | Deferred | Human review after P15.7 |
| P15.9 | Documentation completeness review | Deferred | Scope follows retained features |
| P15.10 | Meet measured performance targets | Deferred | Depends on Phase 14 targets and results |
| P15.11 | Accessibility audit | Deferred | Dashboard usability |
| P15.12 | Native German/Japanese localization review | Deferred | Requires native reviewers |
| P15.13 | API stability review and 1.0 freeze | Deferred | Required before claiming API stability |
| P15.14 | SDK stability review | Deferred | Required before claiming SDK stability |
| P15.15 | Publish Helm chart repository | Deferred | Public distribution |
| P15.16 | Release automation | Deferred | Tags, images, packages, changelog |
| P15.17 | Support/versioning policy | Deferred | Define compatibility and support expectations |
| P15.18 | License and third-party notices | Deferred | Distribution housekeeping |
| P15.19 | Change product version to 1.0 | Deferred | Requires explicit user approval |
| P15.20 | Launch README, screenshots, registry page | Deferred | Public launch materials |
| P15.21 | Attach chaos/scale evidence to releases | Deferred | Depends on P12.34 and P14.15; revise if those are cut |

## Separate follow-ups

| Tracking | Remaining work | Scope |
|---|---|---|
| G-8 | Console probe opt-out | Done 2026-10-14: SyslogLogging 2.4.1 `DetectConsole` |
| G-12 | Codex app-server default after compatibility checks | Done 2026-10-14: soak passed 17/20, the 3 failures are G-29 |
| G-29 | Codex shell commands blocked by bubblewrap in containerized workers | Done 2026-10-14 (D-050): `executor.containerized` selects `danger-full-access` in containers, `workspace-write` on hosts; an explicit `sandbox` wins. Real-Codex check in Docker pending an image rebuild |
| Empty input | Invoke with no body or empty input started a run | Done 2026-10-14 (D-050): 400 `ValidationFailed` with field code `InputRequired` on `input` for REST invoke, run create, deployment test, conversation turns, MCP, A2A, and pipeline start |
| I-06 | Manifest apply reloads the same references per document | Done 2026-10-14: one reference cache per apply; harness profile reads per apply no longer grow with documents (12 deployments: 84/168/252 to 7/7/7 statements for dry run/apply/re-apply) |
| I-08 | Silent clamping | Done 2026-10-14: `warnings` (`ValueClamped`) on REST and MCP create/update responses and on manifest apply items; storage still clamps; typed in all four SDKs and shown in the dashboard |
| I-05 | Request history writes for node protocol traffic | Done 2026-10-13: off by default, `RequestHistory.CaptureNodeProtocol` |
| I-01 | Synchronous invocation connection handling | Done 2026-10-13: completion-only wakeups, `Scheduling.InvocationWaitPollMs` fallback |
| Cancellation | Cancellation latency under load | Done 2026-10-13 at in-process scale: 40 to 85 ms with two workers churning event-heavy runs (`cancel-*/latency-under-load`); overload-level measurement belongs to P14.15 |
| Approval soak | Permission waits beyond one hour | Deferred with P12 advanced work |
| Conversation cleanup | Delete worker directories on conversation deletion | Deferred with P12 conversation work |
| Conversation retention | Retention end-to-end verification | Deferred with P12 conversation work |
| Conversation affinity | Affinity expiry end-to-end verification | Deferred with P12 conversation work |
| Windows scripts | Windows benchmark/release script verification | Deferred with P14/P15 |

## Scope notes

Deferral does not undo completed conversations, approvals, quotas, prices, or existing isolation controls. Retained features still require appropriate tests, SDK updates, and usable configuration surfaces; the deferred umbrella tasks do not remove implementation quality requirements. No product version or repository visibility change is implicit in publication authorization.
