# Inference provider fixtures

Run the local simulation without recording shared workspace history:

```sh
postman simulation run postman/simulations/inference-providers.sim.yaml --port 19590 --no-history
```

The provider route is `http://localhost:19590/provider`. Use it as the provider process endpoint with model `fixture-model`, explicit authentication `None`, and protocol `Ollama` or `OpenAiCompatible`. The real process should emit `fixture answer` and token usage. The generated mock serves native `/api/chat` NDJSON and compatibility `/v1/chat/completions` SSE. Send the synthetic fixture header `x-mock-response-code: 401` or `429` to exercise failure responses.

The contract, generated mock, simulation, and context are versioned together. To regenerate the mock:

```sh
postman mock generate postman/contracts/inference-providers.openapi.json -n inference-providers -o postman/mocks/inference-providers --port 19590
```

`ProviderApiSuite` adds real local HTTP and MCP checks beyond this small simulation. See [provider configuration](../docs/PROVIDER_API.md) for the public Garrison endpoint contract. The main REST collection remains in `assets/postman/`.
