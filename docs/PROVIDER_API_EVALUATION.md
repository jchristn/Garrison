# Provider API execution evaluation

Recommendation: defer a second execution engine until a concrete provider-only deployment needs it. The initial goal is to get agents running reliably. Garrison's CLI harnesses, process/Kubernetes execution, credentials, delegation, and local Docker deployment already serve that goal.

## What the reference implementation adds

Reviewed on 2026-10-13: the local Aegon `ProviderApiHarness`, `ProviderClientFactory`, `ProviderSpec`, MCP bridge, and provider rewrite helpers. Aegon references PolyPrompt 2.8.0. Its adapter owns an agent loop: streaming model calls, conversation messages, tool dispatch, retries, usage normalization, and structured-output repair. Provider-specific helpers handle schema and web-search differences. The MCP bridge uses stateless HTTP.

Aegon's provider configuration supplies endpoint and API-key-variable settings. Its API-key contract does not consume the CLI auth/session files used by Garrison's current harnesses. Some enumerated providers remain unsupported in the reference factory. Copying the adapter would therefore require decisions about credentials and supported providers as well as integration work.

## What Garrison would need

A compatible implementation needs typed provider configuration in compilation, capability reporting, streaming events and usage, a tool loop that retains delegation and approval behavior, conversation history, cancellation, structured-output repair through prompt templates, and SDK/dashboard configuration. Workspace operations would depend on the supplied tools. Existing isolation and artifact collection must continue working in process, cold Kubernetes, and warm Kubernetes execution.

Cost reporting can reuse the existing estimation path and operator-configured rates. Daily quotas remain optional and apply only when enforcement is enabled. No additional financial budgeting is needed for this mode.

## Decision and implementation

The useful trigger is a deployment that must run a named provider using endpoint credentials without installing its CLI. If that is an immediate requirement, start with one provider and prove streaming, one MCP tool round trip, cancellation, usage, and a conversation before widening support.

The evaluation is complete. The user selected optional implementation under P12.13 after reviewing the recommendation. Implement the provider path while retaining the existing CLI paths and optional quota enforcement. The initial OpenAI-compatible mode now uses a bundled process with PolyPrompt 2.8.0. Streaming/usage, HTTP MCP approval/delegation, schema repair and conversation resume are validated. It is deployed to local Docker and has succeeded against the existing configured Mux endpoint. See [provider API configuration](PROVIDER_API.md). Other provider adapters and stdio tools remain outside the initial mode.
