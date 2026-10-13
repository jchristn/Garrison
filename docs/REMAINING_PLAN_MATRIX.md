# Remaining Plan Decision Matrix

Updated 2026-10-12. These are the 73 remaining phase checklist items in `GARRISON_PLAN.md`, plus separately tracked gaps and follow-ups. Daily quotas and cost estimation are retained; quota enforcement is explicitly opt-in and defaults off. Delegation-tree budgeting and its quota-hop integration are removed.

Suggestions are for the initial goal of getting the core system running reliably. They are recommendations, not scope changes: **Keep** = prioritize the core experience; **Later** = defer advanced functionality; **Optional** = candidate to cut; **Release** = retain only for the release milestone you intend. No additional item has been removed.

| ID | Remaining capability | Suggestion | Dependency or decision |
|---|---|---|---|
| P6.17 | Use SDK internally for worker protocol | Optional | Internal cleanup; no user capability |
| P6.19 | Interactive SDK consoles | Optional | Developer convenience |
| P6.20 | Publish SDK packages | Release | First publication needs approval |
| P7.5 | Publish multi-architecture container images | Release | First publication needs approval |
| P10.24 | Tune demonstrated control-plane bottlenecks | Later | Depends on P14.15 measurements |
| P10.25 | Schedule by CPU/memory capacity | Later | Placement accounting; depends on P14.15 |
| P11.14 | Trusted/untrusted deployment policy | Keep | Enforce container isolation for untrusted runs |
| P11.15 | Per-deployment network egress allowlists | Keep | CIDR/port NetworkPolicy rules |
| P11.17 | Isolation attack tests in CI | Keep | Depends on trust policy and egress controls |
| P11.18 | Executor capability negotiation | Later | Generalizes current Process/KubernetesJob selection |
| P11.19 | Executor conformance tests | Later | Depends on declared capabilities; snapshot checks need P12.2 |
| P11.20 | Prestarted warm run pods | Later | Performance optimization; must pass isolation tests |
| P12.2 | Workspace snapshots and cross-node resume | Later | Needs artifact storage and harness continuation |
| P12.4 | Execute remote A2A/MCP agents | Later | Registration health checks and expiry |
| P12.5 | Cron and signed webhook triggers | Later | New invocation entry points |
| P12.8 | Filesystem/S3 artifact stores and browser | Later | Needed for portable workspace snapshots |
| P12.9 | Multi-agent pipelines with review gates | Later | Adds orchestration beyond individual runs |
| P12.10 | Management MCP tools | Optional | Allows agents to modify configuration |
| P12.11 | Clutch-backed lease provider | Optional | Alternative to existing database leases |
| P12.12 | Test stdio MCP servers from workers | Keep | Completes diagnostics for an existing integration |
| P12.13 | Direct provider API execution | Optional | Evaluate demand before adding another execution mode |
| P12.14 | Completion/failure webhook notifications | Later | Operator integrations |
| P12.15 | Dashboard coverage for retained Phase 12 features | Keep | Only for features the user retains |
| P12.16 | SDK coverage for retained Phase 12 features | Keep | Only for features the user retains |
| P12.17 | API docs/Postman for retained Phase 12 features | Keep | Only for features the user retains |
| P12.18 | Tests for retained Phase 12 features | Keep | Only for features the user retains |
| P12.19 | NotDory memory integration example | Optional | Documentation/example integration |
| P12.20 | Conductor integration example | Optional | Documentation/example integration |
| P12.21 | Marketplace manifest bundle import/export | Optional | Packaging and sharing configuration |
| P12.22 | Schema-generated Invoke input forms | Later | UI convenience for structured agent inputs |
| P12.23 | Compare runs across deployments | Later | Evaluation UI |
| P12.24 | Traffic splitting experiments | Later | Outcome metrics by deployment |
| P12.25 | Kubernetes/vault secret providers | Later | Alternative secret storage backends |
| P12.26 | Dashboard OIDC login | Later | Separate authentication design required |
| P12.27 | Markdown/JSON transcript export | Keep | Useful for debugging and sharing existing runs |
| P12.28 | Prompt A/B evaluation hooks | Later | Experimentation feature |
| P12.29 | Explicit retry/effect policy | Later | Replaces RetryOnNodeLoss; migration compatibility |
| P12.31 | Epoch-fenced tool and credential gateway | Later | Garrison tools/brokered credentials only |
| P12.32 | Effect intent journal | Later | Depends on the gateway; records uncertain external effects |
| P12.33 | Journal-aware recovery | Later | Depends on effect policy and journal |
| P12.34 | Effect-safety chaos tests | Later | Depends on effect policies and journal |
| P12.36 | Tenant fair-share scheduling and queue bounds | Later | QoSKit; most useful for shared multi-tenant workloads |
| P12.38 | Prevent parent/child slot deadlocks | Keep | Runtime capacity reserve; no financial budgeting |
| P12.39 | Durable suspension and cross-node continuation | Later | Needs snapshots, artifacts, capabilities, effect safety |
| P12.40 | Pin and test harness session formats | Keep | Protects conversation resume across CLI upgrades |
| P12.41 | Declarative output/parser mappings | Later | Onboard harnesses without changing C# |
| P12.42 | Harness parse-preview endpoint and UI | Keep | Makes harness configuration easier to debug |
| P12.43 | Re-run with pinned deployment/template versions | Later | Needs deployment version history |
| P12.44 | Compare compiled execution specs | Later | Depends on recorded/reconstructed configuration |
| P12.45 | Canary promotion/rollback recommendations | Later | Depends on traffic experiments; operator approves changes |
| P12.46 | Git/workspace caching | Later | Performance optimization; snapshot cache needs artifacts |
| P14.15 | Load the control plane to failure | Later | Large hardware tiers; prerequisite for tuning claims |
| P15.1 | Security review | Keep | Secrets, tokens, SSRF, paths, command arguments |
| P15.2 | Versioned master-key rotation | Later | Production key lifecycle |
| P15.3 | Credential and run-token expiry policies | Keep | Bound credential lifetimes |
| P15.4 | Dependency/image vulnerability scans | Keep | CI hardening |
| P15.5 | Signed images and SBOMs | Release | Supply-chain release artifacts |
| P15.6 | Upgrade-path tests across releases | Keep | Protect deployed installations |
| P15.7 | Full simulated user session and report | Keep | Proves initial setup and core workflows |
| P15.8 | User review and verification of findings | Keep | Human review after P15.7 |
| P15.9 | Documentation completeness review | Keep | Scope follows retained features |
| P15.10 | Meet measured performance targets | Later | Depends on Phase 14 targets and results |
| P15.11 | Accessibility audit | Keep | Dashboard usability |
| P15.12 | Native German/Japanese localization review | Release | Requires native reviewers |
| P15.13 | API stability review and 1.0 freeze | Release | Required before claiming API stability |
| P15.14 | SDK stability review | Release | Required before claiming SDK stability |
| P15.15 | Publish Helm chart repository | Release | Public distribution |
| P15.16 | Release automation | Release | Tags, images, packages, changelog |
| P15.17 | Support/versioning policy | Release | Define compatibility and support expectations |
| P15.18 | License and third-party notices | Keep | Distribution housekeeping |
| P15.19 | Change product version to 1.0 | Release | Requires explicit user approval |
| P15.20 | Launch README, screenshots, registry page | Release | Public launch materials |
| P15.21 | Attach chaos/scale evidence to releases | Release | Depends on P12.34 and P14.15; revise if those are cut |

## Separately tracked gaps and follow-ups

These are not included in the 73 phase-task count. Some verification overlaps with phase tasks.

| Tracking | Remaining work | Suggestion | Dependency or decision |
|---|---|---|---|
| G-8 | Opt out of the SyslogLogging console probe | Keep | Upstream library option and Garrison integration |
| G-12 | Make Codex app-server streaming the default | Keep | Soak MCP, schema, thread resume, and sandbox support first |
| Approval soak | Verify permission waits longer than one hour | Keep | Long-running MCP idle/session test; current approval timeout caps at one hour |
| I-01 | Avoid holding synchronous invoke connections unnecessarily | Keep | Review bounded waits and async polling path |
| Cancellation | Verify cancellation latency under load | Keep | Reliability verification |
| Conversation cleanup | Delete worker conversation directories when a conversation is deleted | Keep | Server/worker lifecycle coordination |
| Conversation retention | Verify conversation retention end to end | Keep | Retention and session fallback coverage |
| Conversation affinity | Verify affinity wait expiry end to end | Keep | Multi-node resume/fallback coverage |
| Windows scripts | Verify benchmark and telemetry .bat scripts on Windows | Release | Windows host needed; currently unverified |

## Count reconciliation

| Area | Remaining phase items |
|---|---:|
| Deferred SDK/image work | 4 |
| Scale and isolation (M2) | 8 |
| Orchestration and benchmark (M3) | 40 |
| Hardening and release (M4) | 21 |
| Total | 73 |

P12.15 through P12.18 are umbrella coverage tasks: their scope shrinks when feature rows are cut. Dependencies such as P12.39 and P15.21 also need revision if their prerequisite rows are removed.
