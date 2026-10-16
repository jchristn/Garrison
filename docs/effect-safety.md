# Effect safety and recovery

Garrison fences its own run credentials and hosted MCP tool calls by lease epoch. A token stops working when its lease expires, its run ends, its session is revoked, or another attempt holds the run. MCP calls re-read the persisted session for each dispatch, including calls on an already connected session. This protects a replacement attempt from calls made by a partitioned worker.

Fencing cannot recall an external request that was already sent. The gateway therefore persists an effect intent before dispatch and records its outcome afterwards. Migration 29 adds structured `effect_operations` and `effect_checkpoints` tables to SQLite and PostgreSQL.

## Journal states

| State | Meaning | Automatic prompt replay |
| --- | --- | --- |
| Authorized | Intent exists; no destination dispatch was authorized yet | Possible with a trusted known-coverage checkpoint |
| Dispatched | The destination may have received the request | Refused |
| Completed | The destination returned and a result reference was persisted | Refused without resumable execution state |
| Unknown | A dispatched call failed or its outcome cannot be established | Refused |

A process killed after the dispatch marker commits can leave `Dispatched`. This has the same recovery safety as `Unknown`; a second write is not required to establish uncertainty. Completing an already dispatched operation may be recorded after lease expiry because recording its outcome does not dispatch another effect. A completed record cannot return to an executable state.

The gateway journals hosted run calls with mutating/execute operation scopes and agent tools. Read tools still receive an epoch check. Hosted MCP tools publish readOnlyHint, destructiveHint and idempotentHint annotations. Missing or contradictory hints remain effectful, destructive hints win, and idempotent mutations still receive an intent. The parser-aware classification helper treats shell/direct network operations and unstructured harness output as UnknownCoverage regardless of optimistic hints. It does not intercept arbitrary harness effects or establish whole-session coverage; raw CLI recovery remains conservative. Arguments are stored as SHA-256 digests; raw arguments, result bodies, and secrets are excluded. Agent invocation destinations receive the gateway operation ID as their idempotency key when the caller did not supply one. Explicit caller idempotency keys keep their existing semantics.

Authorized operators can inspect metadata with `GET /v1.0/api/tenants/{tenantId}/runs/{id}/operations`. This uses the run read permission and returns 404 when the run ID does not belong to the requested tenant. Deleting or retaining away a run also removes its journal and checkpoint records.

## Recovery rules

`AtMostOnce` never restarts a run after its harness started and its worker was lost. `AtLeastOnce` accepts another attempt while attempts remain, including the possibility that an external mutation happens again.

`Journaled` restarts when a trusted executor recorded gateway-only coverage and no operation has progressed beyond `Authorized`, or when an accepted durable session checkpoint covers completed operations in the same current lease epoch. Any `Dispatched` or `Unknown` operation blocks recovery. An older checkpoint cannot cover shell or network effects made by a subsequent resumed attempt. An empty journal alone proves nothing about shell commands or direct network calls. No public endpoint or deployment assertion can turn unknown coverage into known coverage.

The current CLI harnesses can execute shell commands and contact arbitrary destinations, so their coverage remains unknown and a lost running attempt fails with `NodeLost`. Completed effects require an accepted durable session checkpoint in that same attempt; replaying the original prompt is not a substitute. A caller must never mark those attempts gateway-only just because no journal rows were observed.

Durable suspension stops execution before snapshotting resumable state and rejects unresolved dispatched operations. It requires a current approval/child wait, a compatible Process session and an accepted internal archive. A resumed snapshot restores that session rather than replaying the original prompt. See [continuation](CONTINUATION.md).

## Credential scope

Garrison-issued run credentials are short-lived, session-backed credentials. Their epoch, lease-expiry, revocation, and completion checks are enforced by Garrison. This gives them immediate fencing even if session cleanup has not run yet.

A static API key or git token copied into a process remains valid at its external provider until that provider revokes it. Garrison cannot revoke such a copy through its own epoch check. The implemented optional `LeaseBroker` path uses an operator-configured HTTP issuer/revoker, bounded expiry and persisted revocation obligations. It fails closed while older credential obligations remain live, but external revocation is provider-dependent and can be eventual with expiry as fallback. Configure the adapter and explicit secret aliases as described in [credential broker](CREDENTIAL_BROKER.md); this does not convert legacy static secrets into fenced credentials. Third-party MCP servers are not proxied and do not receive Garrison's gateway guarantees.

## Verification

Run `scripts/test-effect-safety.sh`. Set `GARRISON_TEST_PROVIDERS=sqlite,postgresql` to exercise both databases; PostgreSQL connection settings use the normal test variables.

The journal suite uses an HTTP mutation sink that records operation IDs and attempt IDs. It injects failure boundaries before dispatch, after dispatch, and after committed completion, exercises the actual lease reaper under each policy, and verifies stale epoch, expired-token, tenant isolation, and unknown-coverage behavior. The sink records duplicates rather than deduplicating them, so it can detect an incorrect retry decision.

Local acceptance includes the D062 12-case external-effect matrix, 20 both-provider network/policy cases, and D063 six multi-control-plane cases. D063 tests all policies with leader loss plus a worker partition, and with all three control-plane endpoints unavailable past lease expiry before fresh service runtimes recover. Independent non-deduplicating HTTP receipts prove one effect for unproven AtMostOnce/Journaled attempts and correctly tagged attempts 1 and 2 for permitted AtLeastOnce replay. Healing the stale worker cannot alter the terminal state or produce another effect. See [D063 recovery evidence](testing/D063_RECOVERY.md) for reproduction and topology scope. Local execution satisfies P12.34; scheduled/manual CI is an optional rerun mechanism, not a completion gate.

Gateway instrumentation separates authorization, lease validation and journal stages from awaited tool dispatch, with bounded operator/run mode labels. The full paired child-admission diagnostic additionally includes transport and child admission. No fixed five-millisecond acceptance budget is imposed: the earlier plan example was provisional, and `gateway.py --max-overhead-ms N` enables an explicitly selected diagnostic budget. See [current measured evidence](testing/D062_SCALE_RECOVERY.md#final-isolated-gateway-measurement); historical reports retain their original measurements and interpretation at that time.
