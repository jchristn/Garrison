# Optional external memory example: NotDory

NotDory is a replaceable example, not a required Garrison dependency. For the provider-neutral interface and built-in persistent key/value implementation, see [agent memory](AGENT_MEMORY.md).

[NotDory](https://notdory.ai) provides persistent agent-managed memory over MCP. The optional layer here uses its filesystem provider and SQLite metadata, so no embedding model, RecallDB, or separate database is required. Garrison still works without it. The integration was checked against the local NotDory source at `~/Code/NotDory`; images are pinned to that project's `v0.1.0` release.

## Docker Compose

Set separate random values for `NOTDORY_ADMIN_PASSWORD`, `NOTDORY_ACCESS_KEY`, and `NOTDORY_SECRET_KEY` in the ignored `docker/.env`. Treat an access key as a capability: NotDory MCP authenticates with the access key alone. Never reuse the Garrison administrator or worker credentials.

From `docker/`, run:

```bash
docker compose -f compose.yaml -f compose.notdory.yaml --profile memory up -d
```

The two memory services have no host-published ports. They join the Compose network, and their data lives in the separate `notdory-data` named volume. Stop the optional services without deleting that volume to retain memory. To build from the adjacent local repository instead of pulling, build its `docker/server/Dockerfile` and `docker/mcp/Dockerfile` with the NotDory repository as context and the image tags in `compose.notdory.yaml`.

## Kubernetes

Create a `notdory-auth` Secret in the Garrison namespace with keys `admin-password`, `access-key`, and `secret-key`, containing separate generated values. Use `kubectl apply -k k8s/overlays/notdory` for the supplied in-cluster PostgreSQL overlay, or add `k8s/components/notdory` to the `components` list of your own overlay alongside the Garrison base. The component creates a one-replica StatefulSet with a 1Gi persistent volume, an MCP Deployment, internal Services, and ingress policies. It disables service-account tokens and runs without root privileges.

The optional egress policy allows default-policy Garrison run pods to reach the MCP Service. Run pods with explicit deployment `egressRules` remain excluded; configure those deployments' permitted memory destination deliberately. Memory requests from Process workers use the workers' existing egress permissions. No public ingress is created. For administration, port-forward the NotDory REST Service temporarily instead of making it public.

## Give a deployment memory

1. Create a NotDory tenant and a restricted credential for the intended team through NotDory's API. Use its bootstrap credential only for initial setup, not as every agent's shared memory identity.
2. Create a filesystem scope with `scope_create`, `storeProvider: Filesystem`, and a server-side `targetPath` under `/app/data/memory/<team>`. The default `session_start` path may select RecallDB; explicitly create the filesystem scope first and use its scope identifier. Filesystem scopes provide keyword search rather than semantic search.
3. Store that team's NotDory access key as a Garrison `GenericEnv` secret named `notdory-access`. Apply `examples/notdory.yaml`, then add these resource bindings to the deployment:

```yaml
resources:
  secrets:
    - {alias: notdory, secret: notdory-access}
  mcpServers:
    - {alias: memory, server: notdory}
```

The MCP server's header template resolves the `notdory` secret alias. Creating a deployment with this binding requires `Execute` on that Secret. In Kubernetes the MCP URL is also `http://notdory-mcp:8720/mcp` within the namespace.

4. In the deployment's configurable system prompt, tell the agent which scope to use and when to recall or save memory. Call `whoami`, enumerate the allowed scopes, save a small memory with `memory_upsert`, then retrieve it with `memory_search` in a second run. A memory written by one agent should be retrievable by another agent only when both have access to that scope.

Memory changes happen at NotDory, outside Garrison's mediated effect journal. Do not assume Garrison can roll them back or revoke a copied static NotDory capability through its own lease fencing. Use scoped credentials and the recovery policy appropriate for external effects. Back up the NotDory volume separately from the Garrison database.

## Integration check

With the optional services healthy, run `python3 scripts/check-notdory.py --env-file docker/.env`. It authenticates over MCP from the Garrison server container, checks the required tools, creates a synthetic filesystem scope, writes and retrieves memory in two separate MCP sessions, and removes the synthetic scope. The output contains no access key. Override `--container` and `--mcp-url` for another Compose layout; `--keep-fixture` retains the scope for inspection.

The D-060 isolated Compose check also restarted the REST container and verified that a previously written memory remained searchable from a new MCP session. Each synthetic scope uses its own filesystem target path so cleanup cannot remove another fixture. The Kubernetes optional overlay renders successfully with `kubectl kustomize k8s/overlays/notdory`; a live Kubernetes memory deployment remains a separate deployment check.
