# Optional provider API execution

`builtin/provider-api` calls an operator-selected OpenAI-compatible or native Ollama endpoint through PolyPrompt. Choose it on a deployment when you want API execution without a provider's CLI. Existing Claude Code, Codex, Mux, and Gemini deployments keep their current behavior. The bundled process uses the normal worker executor, workspace isolation, run guards, timeouts, cancellation, artifact collection, and completion reporting.

## Configure a deployment

Use the dashboard or the existing deployment API:

- Set `harnessProfileId` to `hrn_builtin_provider_api` and select a model supported by your endpoint.
- Set `inferenceEndpoint.protocol` to `OpenAiCompatible` or `Ollama`, and `baseUrl` to the service URL. Native Ollama uses `/api/chat`; compatibility mode uses `/v1/chat/completions`. Ollama URLs may end in `/api`; OpenAI-compatible URLs may end in `/v1`.
- Choose `authenticationType` explicitly. Authentication belongs to the endpoint configuration, independently of protocol and secret kind. Ollama Cloud uses `BearerToken`; a local unauthenticated Ollama server uses `None`.
- Store each authentication value in a tenant secret and reference its `secretId` in `credentials`. The dashboard can create these encrypted secrets inline. No credential values belong in URLs, deployment parameters, manifests, or endpoint responses.
- Bind the normal System and Task prompt templates. Structured-output instructions and repairs use Garrison's existing templates and validator.

### Endpoint contract

Architect create/update requests and responses, deployment create/update/read, MCP architect tools, SDK models, and manifest deployment specs share this object:

```json
{
  "protocol": "Ollama",
  "baseUrl": "https://ollama.com",
  "authenticationType": "BearerToken",
  "credentials": [{ "name": "", "location": "Header", "secretId": "sec_ollama_cloud" }]
}
```

Keep the model in the existing `model` field. Select `hrn_builtin_provider_api` as the harness profile. This works for architects as well as ordinary agent deployments. The dashboard exposes the same endpoint editor in Architects, setup, Agent wizard, and deployment configuration.

| Authentication type | Credential entries |
| --- | --- |
| `None` | Empty array; sends no authentication, including when legacy credentials exist. |
| `BearerToken` | One secret; sends `Authorization: Bearer <value>`. Name is unused. |
| `ApiKey` | One named secret; `location` selects `Header` or `QueryString`. |
| `Headers` | One to 32 named secrets; each name is an HTTP header. A custom `Authorization` value is supported. |
| `QueryString` | One to 32 named secrets; names and values are URL encoded. |
| `Basic` | Two secrets named `username` and `password`; sends HTTP Basic authentication. |

All secret references must be active and tenant local, and execution enforces the caller's `SecretUse` permissions. Referenced secrets cannot be deleted. Use string secrets such as `BearerToken` and `GenericEnv`; the scheme is selected explicitly rather than inferred from secret kind. API errors identify invalid endpoint fields and secret references. Names must be unique; transport headers, embedded URL credentials, query strings in the base URL, and fragments are rejected. HTTP redirects are disabled so authentication is not forwarded to another origin. Use HTTPS for remote services.

Schema migration 44 persists endpoint and credential rows separately. Compiled private configuration contains environment-variable references; the worker receives resolved secret values through its protected environment and scrubber. Manifest export substitutes secret names for IDs and import resolves them in the destination tenant.

For existing deployments, `provider`, `baseUrl`, `allowAnonymous`, and the `credential` secret binding remain supported. Newly saved dashboard configurations use `inferenceEndpoint`. Explicit authentication takes precedence over the legacy binding. Omitting `inferenceEndpoint` on an architect update preserves it while the profile remains ProviderApi; switching to a CLI profile clears it. To remove authentication, set `authenticationType: None` with an empty credential array.

The worker advertises `ProviderApi` after a local version probe that makes no model request. Updated worker images include the binary. Pools with explicit harness lists must include `provider-api`, or add a probe for `garrison-provider-api --version`. Source deployments can publish `src/Garrison.ProviderHarness` and add a launcher to their worker PATH.

Optional parameters include `maxTokens` (8192), `maxRetries` (2), `timeoutMs` (1800000), `maxSessionBytes` (8388608), and `maxToolResultChars` (65536). The existing deployment `maxTurns` bounds model requests. MCP discovery defaults to 30 seconds, 50 pages, 1000 tools, and 8 MiB messages; parameters `mcpDiscoveryTimeoutMs`, `maxMcpPages`, `maxMcpTools`, and `maxMcpMessageBytes` adjust those limits.

## Tools, approvals, and conversations

The built-in provider mode supports HTTP MCP tools. Required unsupported stdio servers fail initialization; optional unavailable servers are skipped with a warning. It has no built-in shell, file-editing, or web-search tools. Configure appropriate MCP tools for those operations, or delegate to a CLI agent.

Tool arguments are validated against the advertised schema before execution. With deployment approvals enabled, every tool call goes through Garrison's permission-prompt hook. Rules use canonical names such as `mcp__garrison__garrison_invoke_agent`. The model cannot call the approval hook itself. Denials become tool errors, and the decision appears in the existing approval history. Run tokens retain their existing tenant, originating-principal, delegation, and lease fences.

Conversation messages persist in the isolated worker HOME as private files. Resume and structured-output repairs reuse that history; node-loss fallback uses Garrison's existing transcript prompt. Changing the endpoint or model while resuming a session is rejected. Workspace retention governs local session cleanup.

## Failures and accounting

The loop streams text, reasoning, tool calls/results, and token usage. Its native Ollama adapter follows the [Ollama chat API](https://docs.ollama.com/api/chat) and [streaming contract](https://docs.ollama.com/api/streaming). Ollama Cloud bearer authentication follows the [Ollama authentication documentation](https://docs.ollama.com/api/authentication). Its compatible adapter follows the [Chat Completions streaming contract](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events). It retries 429/5xx responses before consuming a stream, never an interrupted stream or an executed tool. Missing/rejected credentials become `NotCredentialed`; incomplete output and exhausted turn limits fail the run.

Cost estimation uses existing operator-configured rates. Daily quota enforcement remains optional and disabled unless explicitly enabled. No additional budgeting is introduced. Authentication is optional when the configured service permits it; CLI sign-in files do not supply HTTP credentials. Provider-native search is not implemented by this harness.

Run `dotnet run --project src/Test.Automated -f net10.0 -- --suites provider-api` for fixture-backed execution, streaming/history, failure, compilation, and real Garrison MCP approval checks. Tests use temporary endpoints and spend no provider tokens.

Local validation also exercised an approved delegation from the Docker provider process to `smoke-echo`, then a real model call using the already configured Mux-compatible endpoint and encrypted API secret. Temporary test agents/deployments/runs were removed. Provider-specific features outside the compatible Chat Completions contract have not been validated.
