# Capability catalog

The capability catalog lists what an orchestrating agent can use, in one shape, whatever it is:

| Kind | What it is | Where the entry comes from |
|---|---|---|
| `Agent` | Another Garrison agent | The agent's latest published revision |
| `McpTool` | A tool of an MCP server registered in the tenant | The server's `tools/list` |
| `HarnessBuiltIn` | A program the harness can run on its host, such as pandoc or LibreOffice | Tool probes on harness profiles, checked by workers |

Each entry (a capability descriptor, `cap_` identifier) carries a summary, input and output JSON Schemas, tags, cost and latency hints, and the node labels a run needs when its agent uses it. Agents read the catalog through MCP tools; people read and edit it over REST and in the dashboard.

## Derived and manual entries

Garrison keeps derived entries in step with their source. You cannot edit or delete them (409 `CapabilityDerived`); change the source instead.

- **Agents.** Each active agent with a published revision has one entry, named after the agent. The summary is the revision's description plus the agent's skills, and the schemas are the revision's. Publishing a revision updates the entry. Drafts never show, and an agent that is deleted or deactivated loses its entry.
- **MCP tools.** Each tool of each active MCP server has an entry named `server/tool`, with the server's description and input schema for the tool. Garrison lists HTTP servers again once their list is older than `Capabilities.McpRefreshSeconds` (default one hour). Stdio servers are listed only when someone asks (`POST .../capabilities/refresh`), because listing starts the server's command on a worker host with stdio diagnostics turned on (`GARRISON_WORKER_MCP_TESTS_ENABLED`). When listing fails, the entries keep their last good content and record the error in `refreshWarning`. A tool the server no longer lists loses its entry.
- **Harness built-ins.** Each tool probe of a harness profile has an entry named after the tool. Probes on built-in profiles give entries every tenant shares (`tenantId` null); probes on a tenant's profiles give entries in that tenant.

Manual entries cover anything Garrison cannot derive, for example a conversion service that agents reach through a skill. They take any kind, and their names are unique among a tenant's manual entries (409 `NameConflict`). Schemas must be valid JSON Schema (400 `InvalidJsonSchema`).

## Tool probes and placement

A harness profile lists the tools its harness can use when the host has them:

```json
"toolProbes": [
  { "name": "pandoc", "executable": "pandoc", "arguments": ["--version"], "description": "Converts documents between formats." },
  { "name": "libreoffice", "executable": "soffice", "arguments": ["--version"] }
]
```

The built-in Claude Code, Codex, Codex app server, Gemini CLI, and Mux profiles probe `pandoc`, `libreoffice` (`soffice`), and `python3`.

Before it registers, a worker fetches every probe from the control plane, one per tool name. It runs each probe and reports the tools that exit successfully as node labels `garrison.io/tool-{name}=true`. Heartbeats carry a hash of the probe list. When a profile changes it, the worker runs the new probes and registers again only if the tools it found changed.

Probes run on the worker host outside any run, so they are restricted:

- The executable is a bare file name found on the `PATH`, with no directory part.
- There is at most one argument, and it must be `--version`, `-version`, `-v`, `-V`, `version`, `--help`, or `-h`.
- A probe can report a tool. It cannot do anything else.

A worker re-checks every probe against these rules before running it. An operator who wants no probes on a host sets `ToolProbesEnabled` to false (`GARRISON_WORKER_TOOL_PROBES_ENABLED=false`) and can still set `garrison.io/tool-*` labels by hand.

When two profiles define the same tool name differently, workers probe the first definition: built-in profiles come first, then tenant profiles by creation time. The later profile's entry says so in `refreshWarning`.

An agent revision names the capabilities it uses in `capabilities`. For every `HarnessBuiltIn` entry it names, and every probed tool name, the run's requirements gain that entry's labels, so the run goes only to a worker that reported the tool. While no Ready worker reports it, the run stays queued with `blockedReason` `NoToolWorker`, and the explanation names the missing tools:

```bash
curl -s -X POST "$B/agents/report-writer/revisions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"description": "Writes reports and converts them to DOCX.", "capabilities": ["pandoc"]}'
curl -s -X POST "$B/agents/report-writer/revisions/2/publish" -H "Authorization: Bearer $TOKEN"
```

On KubernetesJob workers, probes run in the worker container, not in the run pod image. Label those workers by hand (`garrison.io/tool-pandoc=true` in the worker's labels) when the run image has tools the worker image lacks.

## Cost and latency hints

For Agent entries, the leader's maintenance loop summarizes finished runs (Succeeded or Failed) of the last `Capabilities.HintWindowDays` days:

| Field | Meaning |
|---|---|
| `status` | `Known`, or `Unknown` when fewer than `Capabilities.HintMinimumSamples` runs finished in the window |
| `sampleSize` | Runs summarized (at most `Capabilities.HintMaxSamples`, the most recent) |
| `medianDurationMs`, `p90DurationMs` | Start to completion, nearest rank |
| `meanCostUsd` | Mean over runs that recorded a cost; null when none did |
| `windowDays`, `computedUtc` | The window and when the hints were computed |

While the status is `Unknown`, every value is null. A hint is never reported as zero for lack of data. MCP tools and built-ins have `Unknown` hints.

## Using the catalog from a run

When delegation is enabled, the system prompt includes the protected fragment `builtin/garrison-catalog-instructions`, and the run gets two MCP tools:

| Tool | Arguments | Result |
|---|---|---|
| `garrison_list_capabilities` | optional `kind`, `tag`, `search` | `capabilities`, `totalRecords` |
| `garrison_describe_capability` | `capability` (identifier or name) | One descriptor |

A run token sees only what that run may use:

- Agents its agent may delegate to (the allow list, or every agent for `Any`, without itself unless recursion is allowed).
- Tools of MCP servers bound to its deployment.
- Built-ins its harness profile probes.
- Manual entries that name no source.

`garrison_list_agents` also returns each agent's `hints`. Users and credentials need Read on `Capability` and see the whole tenant catalog.

## REST

All paths are under `/v1.0/api/tenants/{tenantId}`:

| Method and path | Permission | Result |
|---|---|---|
| `GET /capabilities?kind=&tag=&search=` | Read on `Capability` | `EnumerationResult<CapabilityDescriptor>` |
| `GET /capabilities/{idOrName}` | Read on `Capability` | `CapabilityDescriptor` |
| `POST /capabilities` | Create on `Capability` | Manual descriptor, 201 |
| `PUT /capabilities/{id}` | Update on `Capability` | Manual descriptor, 200 |
| `DELETE /capabilities/{id}` | Delete on `Capability` | 204 |
| `POST /capabilities/refresh?mcpServerId=` | Execute on `Capability` | `CapabilityRefreshResult` |

A refresh lists stdio servers too, and lists a server only when the caller may use the secrets its templates name. A server the caller may not use reports an error in the result instead. See [REST_API.md](../REST_API.md).

## In the dashboard

Agents > Capabilities lists the catalog with each entry's kind, origin, source, hints, and tags, and filters it by kind, origin, tag, and text. The source links to the agent, the MCP server and tool, or the harness profile and the node label a run needs. Unknown hints show as Unknown. Derived entries open read-only and their Edit and Delete stay disabled, with a tooltip saying where to change the source. Manual entries are created and edited there, and Refresh shows what a refresh changed, server by server. Harness profiles have a Tool probes editor, and the Revisions tab of an agent shows each revision's capabilities and edits the draft's.

## Settings

| Setting | Default | Range | Environment |
|---|---|---|---|
| `Capabilities.SweepSeconds` | 300 | 30 to 86400 | `GARRISON_CAPABILITIES_SWEEP_SECONDS` |
| `Capabilities.McpRefreshSeconds` | 3600 | 60 to 604800 | `GARRISON_CAPABILITIES_MCP_REFRESH_SECONDS` |
| `Capabilities.McpTimeoutMs` | 15000 | 1000 to 120000 | `GARRISON_CAPABILITIES_MCP_TIMEOUT_MS` |
| `Capabilities.HintWindowDays` | 14 | 1 to 365 | `GARRISON_CAPABILITIES_HINT_WINDOW_DAYS` |
| `Capabilities.HintMinimumSamples` | 5 | 1 to 1000 | `GARRISON_CAPABILITIES_HINT_MINIMUM_SAMPLES` |
| `Capabilities.HintMaxSamples` | 1000 | 10 to 100000 | `GARRISON_CAPABILITIES_HINT_MAX_SAMPLES` |
