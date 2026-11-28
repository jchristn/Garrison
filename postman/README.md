# Inference provider fixtures

Run the local simulation without recording shared workspace history:

```sh
postman simulation run postman/simulations/inference-providers.sim.yaml --port 19590 --no-history
```

The provider route is `http://127.0.0.1:19590/provider`. Use it as the provider process endpoint with model `fixture-model`, explicit authentication `None`, and protocol `Ollama` or `OpenAiCompatible`. The real process should emit `fixture answer` and token usage. The generated mock serves native `/api/chat` NDJSON and compatibility `/v1/chat/completions` SSE. Send the synthetic fixture header `x-mock-response-code: 401` or `429` to exercise failure responses.

The contract, generated mock, simulation, and context are versioned together. To regenerate the mock:

```sh
postman mock generate postman/contracts/inference-providers.openapi.json -n inference-providers -o postman/mocks/inference-providers --port 19590
```

`ProviderApiSuite` adds real local HTTP and MCP checks beyond this small simulation. See [provider configuration](../docs/PROVIDER_API.md) for the public Garrison endpoint contract. The main REST collection remains in `assets/postman/`.

## Main collection

`assets/postman/Garrison.postman_collection.json` exercises every REST route plus MCP and A2A, including the 0.3.0 folders for keepers (Mandates), escalations, freezes and the kill switch, memory, reports, messages, organizations, change rules, eval sets and runs, shadow trials, canary releases, the board, and performance. Every path and method in the live OpenAPI document (`GET /openapi.json`) has at least one request. Each request's description ends with its route, the permission it needs, what it answers on success, and the errors to expect, and its tests check the status and the fields that matter.

A few routes are reached the way a client reaches them. The artifact, asset, and file download tickets (`/v1.0/artifact-download/{id}`, `/v1.0/asset-download/{assetId}`, `/v1.0/file-download/{fileSpaceId}`) are opened from the URLs that the download-link calls and the lease spec return. The worker-only node routes (tool probes, artifact uploads, and file write-back) run in the Node Protocol folder while the pretend Postman node holds its lease. The app gateway's file stream stays open until the client leaves, so the collection checks its 404 for an unknown conversation instead of reading it.

`Garrison.postman_environment.json` sets `baseUrl`, `mcpUrl`, `tenantId`, `email`, `password`, `adminApiKey`, `accessKey`, `secretKey`, `nodeAccessKey`, and `nodeSecretKey` for a development server on `http://127.0.0.1:8700`. Everything else is a collection variable with a description saying which request sets it and which requests use it. Most start empty and are filled during the run. A few have defaults you can override with `--env-var`: `providerApiSmokeEnabled` and the `providerApi...` values for the opt-in provider smoke folder, the `inference...` values for the inference examples, the built-in template and profile identifiers, and the made-up `missing...Id` values the 404 checks use.

Start a server and a worker with `garrison-fake-harness` on its PATH, with agent memory on (`GARRISON_AGENT_MEMORY_ENABLE=true`) so the Memory folder runs every check, then:

```sh
npx --yes newman run assets/postman/Garrison.postman_collection.json -e assets/postman/Garrison.postman_environment.json \
  --env-var baseUrl=http://127.0.0.1:8700 --env-var mcpUrl=http://127.0.0.1:8701/mcp
```

To run one folder, add `--folder "<name>"`. Later folders read identifiers that earlier ones capture (Deployments needs Harness Profiles, Artifact Stores, and Agents, and the Node Protocol folder needs those plus Auth, Agent Assets, and Runs), so pass the folders it depends on as well, in collection order.

The Inference endpoint examples folder uses `inferenceSecretId` when you set it to a saved BearerToken secret, and otherwise creates a throwaway one; it never sends a model request. Cleanup deletes what the collection created. The last folder restarts the server, so a server started by hand stays stopped afterwards; leave that folder out against a shared server. See [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for the containerized Newman command.

