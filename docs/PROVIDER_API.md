# Optional provider API execution

`builtin/provider-api` calls an operator-selected OpenAI-compatible endpoint through PolyPrompt. Choose it on a deployment when you want API execution without a provider's CLI. Existing Claude Code, Codex, Mux, and Gemini deployments keep their current behavior. The bundled process uses the normal worker executor, workspace isolation, run guards, timeouts, cancellation, artifact collection, and completion reporting.

## Configure a deployment

Use the dashboard or the existing deployment API:

- Set `harnessProfileId` to `hrn_builtin_provider_api` and select a model supported by your endpoint.
- Add deployment parameter `baseUrl`, for example `https://api.openai.com` or your compatible service's base URL. There is no default endpoint or model.
- Store an API credential as an `OpenAiApiKey` secret and bind it to the deployment. The built-in profile resolves it into `GARRISON_PROVIDER_API_KEY`; the key never appears in the command line or provider configuration file.
- For an endpoint that explicitly needs no credential, set parameter `allowAnonymous` to the string `true`. The default is `false`.
- Bind the normal System and Task prompt templates. Structured-output instructions and repairs use Garrison's existing templates and validator.

The worker advertises `ProviderApi` after a local version probe that makes no model request. Updated worker images include the binary. Pools with explicit harness lists must include `provider-api`, or add a probe for `garrison-provider-api --version`. Source deployments can publish `src/Garrison.ProviderHarness` and add a launcher to their worker PATH.

Optional parameters include `maxTokens` (8192), `maxRetries` (2), `timeoutMs` (1800000), `maxSessionBytes` (8388608), and `maxToolResultChars` (65536). The existing deployment `maxTurns` bounds model requests. MCP discovery defaults to 30 seconds, 50 pages, 1000 tools, and 8 MiB messages; parameters `mcpDiscoveryTimeoutMs`, `maxMcpPages`, `maxMcpTools`, and `maxMcpMessageBytes` adjust those limits.

## Tools, approvals, and conversations

The built-in provider mode supports HTTP MCP tools. Required unsupported stdio servers fail initialization; optional unavailable servers are skipped with a warning. It has no built-in shell, file-editing, or web-search tools. Configure appropriate MCP tools for those operations, or delegate to a CLI agent.

Tool arguments are validated against the advertised schema before execution. With deployment approvals enabled, every tool call goes through Garrison's permission-prompt hook. Rules use canonical names such as `mcp__garrison__garrison_invoke_agent`. The model cannot call the approval hook itself. Denials become tool errors, and the decision appears in the existing approval history. Run tokens retain their existing tenant, originating-principal, delegation, and lease fences.

Conversation messages persist in the isolated worker HOME as private files. Resume and structured-output repairs reuse that history; node-loss fallback uses Garrison's existing transcript prompt. Changing the endpoint or model while resuming a session is rejected. Workspace retention governs local session cleanup.

## Failures and accounting

The loop streams text, reasoning, tool calls/results, and token usage. Its compatible adapter follows the [Chat Completions streaming contract](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events). It retries 429/5xx responses before consuming a stream, never an interrupted stream or an executed tool. Missing/rejected credentials become `NotCredentialed`; incomplete output and exhausted turn limits fail the run.

Cost estimation uses existing operator-configured rates. Daily quota enforcement remains optional and disabled unless explicitly enabled. No additional budgeting is introduced. API execution requires provider API credentials; CLI sign-in files do not supply them. Other provider adapters and provider-native search are not implemented by this harness.

Run `dotnet run --project src/Test.Automated -f net10.0 -- --suites provider-api` for fixture-backed execution, streaming/history, failure, compilation, and real Garrison MCP approval checks. Tests use temporary endpoints and spend no provider tokens.

Local validation also exercised an approved delegation from the Docker provider process to `smoke-echo`, then a real model call using the already configured Mux-compatible endpoint and encrypted API secret. Temporary test agents/deployments/runs were removed. Provider-specific features outside the compatible Chat Completions contract have not been validated.
