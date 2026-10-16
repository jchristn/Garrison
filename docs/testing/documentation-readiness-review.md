# Documentation readiness review

## Current source reconciliation, 2026-10-16

Reviewed the platform entry points and user guides against the current source and D-063 scope. README and registry-draft positioning now lead with managed agent services, reusable specialists, shared tenant governance and reviewed workflows. Implemented features are described as available in the checkout; alpha status, unpublished SDKs and potentially older published images remain explicit. A new [documentation index](../README.md) organizes setup, integration, workflows and operations by user goal.

Source checks covered Compose/update/bootstrap scripts, Kubernetes assets, harness/profile and execution contracts, remote dispatch, continuation/archive handling, effect policies, memory registration, placement/wait-budget behavior, scoped SQL attribution and workflow triggers. Corrected stale future-tense suspension/remote/journal claims, malformed provider tables, universal scaling implications and outdated observability/setup instructions. Added the enabled memory tools to the MCP discovery table.

Backup guidance now includes versioned key rings, external artifact/checkpoint objects, optional memory and retained worker/conversation state. It documents implemented re-encryption and the external-effect limits of database rollback. CI guidance now describes the actual dedicated PR/manual/scheduled workflows rather than claiming every workflow is push-only smoke. Historical evaluation and measurement reports retain dated evidence and link to current contracts.

Validation for this pass: checked 54 top-level/user-guide/SDK README files and 339 local references, with no missing targets or unmatched heading anchors. Eight fenced README/registry Bash examples pass syntax checks (not execution). Punctuation and git diff checks passed. This documentation-only review does not claim a new runtime, browser, paid-model, deployment or capacity test. D-063 implementation evidence remains in [D063 validation](D063_VALIDATION.md). Fresh-user P15.7/P15.8 acceptance and release/API/SDK stability work remain deferred. No feature, product version or publication changed.

The README comparison was subsequently checked against official Kubernetes, Google AX, Agent Substrate, kagent, E2B and LangGraph documentation on 2026-10-16. It separates AX orchestration from Substrate sandboxing, acknowledges overlapping capabilities, distinguishes harness checkpoints from RAM snapshots, and states which executor integrations are actually shipped. Linked upstream sources are included beside the comparison rows; no competitive benchmark or security-equivalence claim is made.

## Historical review, 2026-10-15

Reviewed 2026-10-15 for P15.9. The recent feature areas have user guides and API coverage; the remaining release risk is proving the instructions on a fresh installation. This review checked documentation against source contracts and corrected concrete inconsistencies. It does not establish 1.0 readiness or complete the P15.7 simulated user session.

## Coverage and evidence

| Area | Documentation reviewed | Implementation evidence inspected |
|---|---|---|
| Pipelines and reviews | `docs/PIPELINES.md`, `REST_API.md`, `MCP_API.md` | `PipelineService`, `InvocationCompiler`, and `PipelineSuite`; stored caller input, rendered handoffs, compile failures, and management tool availability |
| Cron and webhook triggers | `docs/TRIGGERS.md`, manifest and MCP references | `TriggerService.StartTargetAsync` and fire exception handling; rendered input schema validation and run-as authorization |
| Notifications | `docs/NOTIFICATIONS.md`, MCP reference | `NotificationEventEnum`, `McpToolCatalog`, and `GarrisonMcpServer`; seven subscribable events, Test action, and management actions |
| Manifest bundles | `docs/MANIFESTS.md`, MCP export contract | Dependency/requirements and secret omission instructions checked for consistency across the guides; `ManifestBundleSuite` identified for execution |
| Input forms | `docs/MANIFESTS.md`, REST input schema reference | `dashboard/src/utils/schemaForm.js`, `SchemaInputForm.jsx`, and `InvokeView.jsx`; supported controls, JSON fallback, mode switching, and server errors |
| Transcripts | `docs/TRANSCRIPTS.md`, REST transcript reference | `TranscriptService`; redaction of input/result/errors/approvals, shared byte budget, and oldest-first conversation turn cap |
| Security and startup | `docs/SECURITY.md`, `docs/CONFIGURATION.md`, `docs/HARNESSES.md`, quick start and development guides | Current security review/task annotations and documented settings agree on refusal of default keys, Secret.Execute, diagnostic worker opt-in, and request body caps |

README entries provide discovery for these features. The dedicated guides explain permissions, limits, and failure behavior rather than leaving those details only in the API reference. Existing feature suites were identified as verification targets; their presence alone is not recorded here as a passing test result.

## Corrections made

Pipeline instructions now use the configured administrator password instead of assuming the development password. They also explain P12.47: the receiving agent's schema validates the rendered task before the system prompt, while stored caller input remains unchanged. A JSON handoff template is needed for an object schema. Invalid handoffs produce a `CompileFailed` run and immediately end the pipeline with `StageStartFailed`, bypassing retry and continue-on-failure settings. Revisions validate again; repair prompts do not.

The REST and trigger guides now distinguish agent-trigger admission failures from pipeline compilation failures. Manifest documentation describes the form's supported controls and JSON fallback. The MCP reference no longer claims trigger firing, secret rotation, and notification testing are available only through REST and the dashboard. Notification prose now correctly distinguishes the seven subscription events from the additional Test value.

## Remaining evidence and release limits

A fresh-instance walkthrough must still exercise setup with generated credentials, schema forms and errors, pipeline review/revision, signed webhook deduplication, notification verification/retry, bundle transfer with missing-secret requirements, and transcript download/redaction. Replaying the curl examples and running the current Postman collection against that instance would provide evidence this source review cannot. Record that as P15.7, then review findings under P15.8.

The scope did not include a field-by-field OpenAPI freeze, all SDK method contracts, screen reader or keyboard testing, native-language review, support-policy decisions, image publication, or performance acceptance. Those remain separate plan tasks. Existing deployment and token behavior still needs the deferred key-rotation and expiry work before a production credential lifecycle can be called complete.

Validation for this review: a local Markdown target check found no missing files among 49 links in 13 reviewed documents. URL reachability and heading anchors were not checked. `git diff --check` passed at review time. No server, worker, model provider, or browser session was launched by this review task, and no versions were changed.
