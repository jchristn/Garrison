# Remaining Plan Scope Matrix

Updated 2026-10-13 under D-042/D-043. The user selected all remaining P6/P7 work now, P11.18-20, and P12.8-13/P12.17. Other unfinished P11/P12 work and all unfinished P14/P15 work are deferred. Completed implementations remain. Daily quotas and cost estimation stay implemented, with quota enforcement explicitly opt-in and off by default.

There are 8 active phase tasks, 2 conditional P10 tasks, and 58 deferred phase tasks. P6.17/P6.19/P7.5/P11.18/P11.19 are complete. Eight selected implementation tasks remain, plus the 2 conditional P10 tasks and 4 active core follow-ups.

Image publication (P7.5) is complete for amd64 and arm64. SDK publication (P6.20) is skipped at user request. The repository remains private unless the user explicitly changes its visibility.

| ID | Remaining capability | Scope | Dependency or decision |
|---|---|---|---|
| P6.20 | Publish SDK packages | Deferred | Skipped at user request (D-043) |
| P10.24 | Tune demonstrated control-plane bottlenecks | Conditional | Waiting on deferred P14.15 measurements |
| P10.25 | Schedule by CPU/memory capacity | Conditional | Waiting on deferred P14.15 measurements |
| P11.14 | Trusted/untrusted deployment policy | Deferred | Enforce container isolation for untrusted runs |
| P11.15 | Per-deployment network egress allowlists | Deferred | CIDR/port NetworkPolicy rules |
| P11.17 | Isolation attack tests in CI | Deferred | Depends on trust policy and egress controls |
| P11.20 | Prestarted warm run pods | Active | Enabled by default for Kubernetes execution (D-045); operator-configurable counts; preserve conformance |
| P12.2 | Workspace snapshots and cross-node resume | Deferred | Needs artifact storage and harness continuation |
| P12.4 | Execute remote A2A/MCP agents | Deferred | Registration health checks and expiry |
| P12.5 | Cron and signed webhook triggers | Deferred | New invocation entry points |
| P12.8 | Filesystem/S3 artifact stores and browser | Active | Needed for portable workspace snapshots |
| P12.9 | Multi-agent pipelines with review gates | Active | Adds orchestration beyond individual runs |
| P12.10 | Management MCP tools | Active | Allows agents to modify configuration |
| P12.11 | Clutch-backed lease provider | Active | Alternative to existing database leases |
| P12.12 | Test stdio MCP servers from workers | Active | Completes diagnostics for an existing integration |
| P12.13 | Direct provider API execution | Active | Evaluate demand before adding another execution mode |
| P12.14 | Completion/failure webhook notifications | Deferred | Operator integrations |
| P12.15 | Dashboard coverage for retained Phase 12 features | Deferred | Only for features the user retains |
| P12.16 | SDK coverage for retained Phase 12 features | Deferred | Only for features the user retains |
| P12.17 | API docs/Postman for retained Phase 12 features | Active | Docs/Postman for retained P12.8-13 features |
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
| P12.29 | Explicit retry/effect policy | Deferred | Replaces RetryOnNodeLoss; migration compatibility |
| P12.31 | Epoch-fenced tool and credential gateway | Deferred | Garrison tools/brokered credentials only |
| P12.32 | Effect intent journal | Deferred | Depends on the gateway; records uncertain external effects |
| P12.33 | Journal-aware recovery | Deferred | Depends on effect policy and journal |
| P12.34 | Effect-safety chaos tests | Deferred | Depends on effect policies and journal |
| P12.36 | Tenant fair-share scheduling and queue bounds | Deferred | QoSKit; most useful for shared multi-tenant workloads |
| P12.38 | Prevent parent/child slot deadlocks | Deferred | Runtime capacity reserve; no financial budgeting |
| P12.39 | Durable suspension and cross-node continuation | Deferred | Needs snapshots, artifacts, capabilities, effect safety |
| P12.40 | Pin and test harness session formats | Deferred | Protects conversation resume across CLI upgrades |
| P12.41 | Declarative output/parser mappings | Deferred | Onboard harnesses without changing C# |
| P12.42 | Harness parse-preview endpoint and UI | Deferred | Makes harness configuration easier to debug |
| P12.43 | Re-run with pinned deployment/template versions | Deferred | Needs deployment version history |
| P12.44 | Compare compiled execution specs | Deferred | Depends on recorded/reconstructed configuration |
| P12.45 | Canary promotion/rollback recommendations | Deferred | Depends on traffic experiments; operator approves changes |
| P12.46 | Git/workspace caching | Deferred | Performance optimization; snapshot cache needs artifacts |
| P14.15 | Load the control plane to failure | Deferred | Large hardware tiers; prerequisite for tuning claims |
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
| G-8 | Console probe opt-out | Active |
| G-12 | Codex app-server default after compatibility checks | Active |
| I-01 | Synchronous invocation connection handling | Active |
| Cancellation | Cancellation latency under load | Active |
| Approval soak | Permission waits beyond one hour | Deferred with P12 advanced work |
| Conversation cleanup | Delete worker directories on conversation deletion | Deferred with P12 conversation work |
| Conversation retention | Retention end-to-end verification | Deferred with P12 conversation work |
| Conversation affinity | Affinity expiry end-to-end verification | Deferred with P12 conversation work |
| Windows scripts | Windows benchmark/release script verification | Deferred with P14/P15 |

## Scope notes

Deferral does not undo completed conversations, approvals, quotas, prices, or existing isolation controls. Retained features still require appropriate tests, SDK updates, and usable configuration surfaces; the deferred umbrella tasks do not remove implementation quality requirements. No product version or repository visibility change is implicit in publication authorization.
