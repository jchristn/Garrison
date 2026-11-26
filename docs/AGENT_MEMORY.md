# Agent memory

Agent memory is persistent text that agents keep between runs. Each entry lives in a scope:

| Scope | `scopeId` | Who reads and writes it |
|---|---|---|
| `Agent` | The agent's identifier | The agent's own runs. This is private memory, as in 0.2 |
| `App` | The agentic app's identifier | Runs of every agent that is a member of the app |
| `OrgUnit` | The org unit's identifier | Runs of the unit's lead and members. Units above read it, and see [Who may use which scope](#who-may-use-which-scope) |
| `Organization` | The organization's identifier | Runs of every agent in the organization read it; only the CEO writes it |

Memory is independent of harness session checkpoints: a later run of the same agent, or another member of the same app or unit, can read what an earlier run saved. Other agents and other tenants cannot. Recalled text is untrusted data, never an instruction, and never a place to store credentials.

## Enable

From `docker/`, run `docker compose -f compose.yaml -f compose.agent-memory.yaml up -d --build`. This turns memory on in the server with the existing persistent `/app/data` volume and adds no service or public port. In Kubernetes, set the same environment variables and mount an operator-owned persistent volume at `GARRISON_AGENT_MEMORY_ROOT`. Several control-plane replicas must share a filesystem that supports atomic rename, or use a shared-store provider (see [Replacing the provider](#replacing-the-provider)). Separate local volumes per pod lose memory between replicas.

| Setting | Default | Range | Meaning |
|---|---|---|---|
| `AgentMemory.Enabled` | `false` | | Turns memory on. Environment `GARRISON_AGENT_MEMORY_ENABLE` |
| `AgentMemory.RootDirectory` | `data/agent-memory` | | Where the built-in store keeps text. Environment `GARRISON_AGENT_MEMORY_ROOT` |
| `AgentMemory.MaxValueBytes` | `65536` | 1 to 1048576 | Most UTF-8 bytes the store accepts for one entry. Environment `GARRISON_AGENT_MEMORY_MAX_VALUE_BYTES` |
| `Memory.Scoped.Enabled` (cluster) | `true` | | Whether the shared scopes may be used. Off leaves only the `Agent` scope |
| `Memory.Scoped.MaxValueBytes` (cluster) | `65536` | 1 to 1048576 | Most UTF-8 bytes in one entry; the smaller of this and `AgentMemory.MaxValueBytes` applies |
| `Memory.Scoped.MaxEntriesPerScope` (cluster) | `10000` | 10 to 1000000 | Most entries in one scope. A new key in a full scope is refused with `MemoryScopeFull`; replacing a key is always allowed |

Every run already carries the Garrison MCP endpoint (see [ESCALATIONS.md](ESCALATIONS.md)). Turning memory on makes that endpoint required, so the worker checks it before the harness starts.

## Entries and provenance

The database keeps each entry's metadata, and the memory store keeps its text. An entry has:

- `id` (`mem_...`), `scopeKind`, `scopeId`, and `key` (1 to 256 characters, unique within the scope);
- an optional `category` (at most 128 characters) and up to 20 lowercase `tags`;
- `bytes`, the `sha256` of the text, and `version`, which is 1 after the first write and one more after each later write;
- who wrote the current version: `writerAgentId` and `writerRunId` for a run, `writerPrincipalType`, `writerPrincipalId`, and `writerName` for anyone;
- `lastUpdateUtc`, `lastReadUtc` (recorded in batches, so it can lag by about 30 seconds), and an optional `expiresUtc`.

A write with `expectedVersion` is compare-and-set: it succeeds only while the entry is at that version (0 means the key must not exist yet) and otherwise answers `MemoryVersionConflict` without changing anything. A write without `expectedVersion` replaces whatever is there.

Garrison stores the new text under a new handle first, then points the entry at it, then deletes the old text. Readers see either the old version or the new one, never part of a write. If the server stops between those steps, the entry keeps its previous version and the new text is left unreferenced; the leader's sweep removes unreferenced text once it is 10 minutes old. The same sweep deletes expired entries.

## Tools

Runs and people use the same MCP tools. `scope` is `Agent` (the default), `App`, `OrgUnit`, or `Organization`; `scopeId` names the agent, app, unit, or organization by identifier or name. A run may leave `scopeId` out for its own agent, for its app when its agent belongs to exactly one, and for its own unit or organization when its agent holds a position in exactly one live organization. People must pass `scopeId` for the `OrgUnit` and `Organization` scopes.

| Tool | Arguments | Returns |
|---|---|---|
| `garrison_memory_read` | `key` | `found`, `value`, `version`, and `entry` (metadata and provenance) |
| `garrison_memory_write` | `key`, `value`; optional `category`, `tags`, `ttlSeconds` (1 to 31536000, 0 clears an expiry), `expectedVersion` | `version` and `entry`. A write without `category` or `tags` keeps the entry's current ones |
| `garrison_memory_delete` | `key`; optional `expectedVersion` | `found`. An absent key is a successful no-op |
| `garrison_memory_list` | optional `category`, `tag`, `keyPrefix`, `query` (keys, categories, tags), `skip`, `maxResults` (1 to 100) | Entries without text, ordered by key, and `totalCount` |
| `garrison_memory_search` | `query`; optional `maxResults` | Matching entries without text and where each matched: `key`, `category`, `tag`, or `content` |

People calling the tools pass `agent` (or `scope: "Agent"` with `scopeId`) for an Agent scope. Search reads the text of at most 200 entries in the scope; key, category, and tag matches have no such limit.

Run-token writes and deletes pass through the epoch-fenced effect journal, so a run that lost its lease cannot change memory. Every write and delete is audited with the entry identifier and scope, never the key or the text. Keys, text, and paths are never telemetry labels; the `garrison.memory.operations` counter carries only the scope kind, the operation, and the outcome.

## Who may use which scope

A run reads and writes its own agent's `Agent` scope and the `App` scopes of the apps its agent is a member of. Asking for another agent's scope or another app's scope answers `Forbidden`.

In a live [organization](ORGANIZATIONS.md#memory), a run also reads and writes its own unit's `OrgUnit` scope and reads the unit scopes above it, up to the root. A run whose agent leads its unit also reads the unit scopes of its subtree. Every member reads the `Organization` scope, and only the lead of the root unit (the CEO) writes it. Nobody writes upward or into another unit, and an agent with no position in the organization gets `Forbidden`. Only the live revision counts: an agent that moves to another unit keeps the old unit's scope until the revision that moves it is published. With `Memory.Scoped.Enabled` off, the `App`, `OrgUnit`, and `Organization` scopes all answer `ScopedMemoryDisabled`.

People need the Memory permission for the operation:

| Action | Permission | Built-in roles |
|---|---|---|
| List scopes and entries, read text | Read on Memory | Viewer, Auditor, AgentOperator, AgentDeveloper, Editor, TenantAdmin |
| Write over MCP | Update on Memory | AgentDeveloper, Editor, TenantAdmin |
| Delete | Delete on Memory | AgentDeveloper, Editor, TenantAdmin |

Over MCP, an `Agent` scope also needs Execute on that agent, as in 0.2. The REST routes need only the Memory permission, so a Viewer can browse memory in the dashboard without being able to run the agent.

## Browsing memory

| Route | What it does |
|---|---|
| `GET /v1.0/api/tenants/{tenantId}/memory/scopes` | Scopes that hold entries, with counts, bytes, the latest write, and the agent's or app's name |
| `GET /v1.0/api/tenants/{tenantId}/memory/entries` | Entries without text. Filters: `scopeKind`, `scopeId`, `category`, `tag`, `search`, `writer` (agent identifier), `keyPrefix`, `maxResults`, `skip` |
| `GET /v1.0/api/tenants/{tenantId}/memory/entries/{id}` | One entry's metadata |
| `GET /v1.0/api/tenants/{tenantId}/memory/entries/{id}/content` | The entry's text with its metadata |
| `DELETE /v1.0/api/tenants/{tenantId}/memory/entries/{id}` | Deletes the entry and its text; `expectedVersion` makes it conditional |

See [REST_API.md](../REST_API.md#memory) for the models. The dashboard shows the same under Autonomy > Memory.

## Recall into keeper ticks

A keeper tick's input carries its agent's own `Agent` entries tagged `recall`, at most 20 of them and 16 KiB of text, in key order. They are rendered through `builtin/memory-recall` (a tenant `Fragment` template named `memory-recall` replaces it). Each entry sits between a begin line and an end line that carry a marker chosen at random for every render, along with the scope, key, version, writer, and time, so text inside an entry cannot close its block or pass as instructions. This template is the only way Garrison puts memory text into a prompt; the tools return it as data.

To make a note stick, a keeper writes it with `tags: ["recall"]`. Everything else stays in memory until the keeper reads it.

## Curating shared memory

Shared scopes collect duplicates and stale notes. `builtin/memory-curator-system` is a system prompt for a curator keeper: list the scope, read entries that say the same thing, write one merged entry with `expectedVersion: 0` (or the version it read), delete the duplicates with their `expectedVersion`, and give stale entries a `ttlSeconds`. `lastReadUtc` and `lastUpdateUtc` in the listing show what nobody has touched lately. Clone the template to change it, and bind it as the curator deployment's system prompt. The curator's agent must be a member of the app whose scope it curates.

## Memory from before 0.3.0

0.2 stored only a hash of each key. When the leader first sweeps a tenant, every file under the memory root becomes an `Agent` entry with `legacy: true` and the key `legacy:` followed by the hash, pointing at the file where it is; no file moves. The first read or write with the real key gives the entry that key, and the first write replaces the old file. A file written the old way later is picked up on its first read. `IAgentMemoryStore` keeps working: the server's default implementation reads and writes the `Agent` scope, so code written against it sees what the tools write.

## Deletion and retention

Deleting an agent deletes its `Agent` scope, metadata and text, including files from before 0.3.0. Deleting an app deletes its `App` scope. Deleting an organization deletes the `OrgUnit` scope of every unit that ever appeared in it and its `Organization` scope. Deleting a tenant deletes its rows with the rest of the tenant and removes its directory under the memory root. Entries with `ttlSeconds` are deleted by the leader's sweep once they expire. See [BACKUP.md](BACKUP.md) for backing up the text, which lives outside the database.

## Replacing the provider

The text store is `Garrison.Core.Memory.IScopedMemoryStore`. It writes, reads, and deletes text by tenant, scope, key, and content handle, deletes a whole scope or tenant, and removes text no entry points at. Garrison chooses a new handle for every write, so a provider never overwrites text in place. Register an implementation with `context.Register<IScopedMemoryStore>(implementation)` before configuration runs; the built-in `FilesystemScopedMemoryStore` is installed only when memory is on and nothing else was registered. An implementation must keep tenants and scopes apart, publish each write atomically, honor cancellation, and be thread-safe. `ScopedMemorySuite` has contract cases for persistence, concurrent writes, cancellation, isolation, and link refusal to copy.

The built-in store hashes tenant, scope, and handle into the path (`root/H(tenant)/scopes/Kind/H(scope)/handle.txt`), bounds UTF-8 size, refuses links inside the tree, and creates owner-only files on Unix. The root and its parents must be operator-owned and out of reach of untrusted processes. It has no semantic search; a provider may add one behind its own tools.

External memory servers can also be bound directly through Garrison's generic MCP resources. [NotDory](NOTDORY.md) is one optional example, not a required backend. Calls made straight to an external MCP server bypass Garrison's memory policy and effect journal; a provider behind `IScopedMemoryStore` keeps the Garrison tools and their authorization.
