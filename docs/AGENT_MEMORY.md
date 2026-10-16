# Replaceable agent memory

Agent memory is optional persistent text keyed by tenant, agent and memory key. It is independent of harness session checkpoints: different runs of the same agent can recall a value. Other agents and tenants cannot read it through a hosted run token. Recalled content is untrusted data, never an instruction or a place to store credentials.

`Garrison.Core.Memory.IAgentMemoryStore` defines asynchronous read, write and delete operations with cancellation. `FilesystemAgentMemoryStore` is the first implementation, a simple persistent key/value store requiring no external service. Protocol handlers resolve the interface through `ServerContext`; a module can register another implementation before configuration initialization or replace it explicitly. Callers and tool schemas do not depend on NotDory, an embedding model, a particular database, or a filesystem path.

## Enable

From `docker/`, run `docker compose -f compose.yaml -f compose.agent-memory.yaml up -d --build`. This enables memory in the server with the existing persistent `/app/data` volume. It adds no service or public port. In Kubernetes, set the same environment variables and mount an operator-owned persistent volume at `GARRISON_AGENT_MEMORY_ROOT`. Multiple control-plane replicas must share a filesystem supporting atomic replacement, or use a shared-store implementation of the interface. Do not use separate per-pod local volumes when cross-replica persistence is required.

Bootstrap settings are `AgentMemory.Enabled` (false), `RootDirectory` (`data/agent-memory`) and `MaxValueBytes` (65536 UTF-8 bytes, range 1 to 1048576). Environment overrides are `GARRISON_AGENT_MEMORY_ENABLE`, `GARRISON_AGENT_MEMORY_ROOT` and `GARRISON_AGENT_MEMORY_MAX_VALUE_BYTES`. Enabling memory includes the Garrison MCP endpoint in compiled hosted Process harness configurations independently of delegation.

## Tools

- `garrison_memory_read`: `key`, and `agent` for user/developer calls. Returns `key`, `found` and `value` (null when absent).
- `garrison_memory_write`: `key`, `value`, and `agent` for user/developer calls. Atomically replaces one value.
- `garrison_memory_delete`: `key`, and `agent` for user/developer calls. Missing keys are successful no-ops.

Hosted run calls derive the agent from the authenticated active run; an explicit different agent is rejected. User/developer calls require Agent.Execute permission on the requested agent. Tenant selection follows the normal MCP authentication rules. Run-token mutations pass through the epoch-fenced effect journal. Memory mutations create an audit record containing the operation and agent identity, without memory keys or text. Memory text, keys and filesystem paths are not telemetry dimensions. Writes and deletes do not offer compare-and-set or merge: concurrent writes use last atomic replacement wins.

The filesystem implementation hashes tenant, agent and key separately, bounds UTF-8 values, refuses links within the memory tree and creates owner-only files on Unix. The root and its ancestors must be operator-owned and inaccessible to untrusted processes. Back up the volume separately. Agent/tenant deletion does not currently erase memory automatically; operators must apply their own retention/deletion policy to the backing store. This provider intentionally has no semantic search or enumeration.

## Replacing the provider

Implement `IAgentMemoryStore`, preserve tenant/agent isolation and byte bounds, and register it with `context.Register<IAgentMemoryStore>(implementation)`. Include persistence, concurrent write, cancellation and isolation contract tests. Keep authorization in the protocol layer and storage-specific behavior in the implementation. The built-in implementation is installed only when enabled and no implementation was already registered.

External memory servers can also be bound directly using Garrison's existing generic MCP resource interface. [NotDory](NOTDORY.md) remains one optional example, not a required backend or a commitment to that product. Such direct external MCP calls are outside Garrison's mediated memory/effect gateway; replacing the built-in provider with an adapter would retain the stable Garrison tools and their authorization boundary.
