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

`assets/postman/Garrison.postman_collection.json` exercises every REST route plus MCP and A2A, including the 0.3.0 folders for keepers (Mandates), escalations, freezes and the kill switch, memory, reports, messages, organizations, change rules, eval sets and runs, shadow trials, canary releases, the board, and performance. `Garrison.postman_environment.json` sets `baseUrl`, `mcpUrl`, `tenantId`, `email`, `password`, `adminApiKey`, `accessKey`, `secretKey`, `nodeAccessKey`, and `nodeSecretKey` for a development server on `http://127.0.0.1:8700`. Identifiers created during a run are collection variables.

Start a server and a worker with `garrison-fake-harness` on its PATH, with agent memory on (`GARRISON_AGENT_MEMORY_ENABLE=true`) so the Memory folder runs every check, then:

```sh
npx --yes newman run assets/postman/Garrison.postman_collection.json -e assets/postman/Garrison.postman_environment.json \
  --env-var baseUrl=http://127.0.0.1:8700 --env-var mcpUrl=http://127.0.0.1:8701/mcp
```

The Inference endpoint examples folder uses `inferenceSecretId` when you set it to a saved BearerToken secret, and otherwise creates a throwaway one; it never sends a model request. Cleanup deletes what the collection created. The last folder restarts the server, so a server started by hand stays stopped afterwards; leave that folder out against a shared server. See [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for the containerized Newman command.

