# Prompts

Every piece of text Garrison sends to a harness comes from a prompt template: the system prompt, the wrapper around the caller's message, the task a delegated agent receives, the instructions that teach an agent to delegate, the output schema instructions, and the configuration files harnesses read (MCP configuration, Mux endpoints, Gemini settings). None of it is hard-coded in the run path, so you can change what an agent is told without a release.

## Templates

A prompt template has a name (unique in the tenant), a kind, content, and a version history.

| Kind | Used for |
|---|---|
| `System` | The system prompt, bound to a deployment's `System` role |
| `Task` | The prompt the harness receives for the run, bound to the `Task` or `DelegatedTask` role |
| `Fragment` | Text included from other templates |
| `ToolDescription` | MCP tool and A2A skill descriptions |
| `ConfigFile` | Harness configuration files written by harness profiles |
| `Other` | Anything else |

The kind describes intent. It does not limit where a template can be bound or included.

Every content change creates a new version. `GET .../prompt-templates/{id}/versions` lists them, `POST .../restore/{version}` makes an old version current again (as a new version), and a deployment can pin a binding to a specific version so later edits do not affect it. Each run records the template names and versions it was compiled with, in `templateVersions`, so you can always tell which wording produced a result.

## Built-in templates

Built-ins have no tenant, are visible to every tenant, and cannot be edited or deleted. To change one, clone it (`POST .../prompt-templates/{id}/clone` with a new name) and bind the clone. `POST .../prompt-templates/{id}/reset` restores a clone to the shipped content of the built-in it came from.

| Template | Kind | Purpose |
|---|---|---|
| `builtin/default-system` | System | Default system prompt. Names the agent, adds its description, and includes the delegation and schema fragments when they apply |
| `builtin/default-task` | Task | The caller's message, followed by run parameters when there are any |
| `builtin/delegated-task` | Task | Used instead of the task template when another agent is the caller |
| `builtin/garrison-tools-instructions` | Fragment | How to use the Garrison MCP tools to delegate, the allowlist, and the depth limit |
| `builtin/structured-output-instructions` | Fragment | Output schema instructions for harnesses that cannot enforce a schema themselves |
| `builtin/structured-output-repair` | Task | Repair prompt for output that fails schema validation. Seeded for a later release; no run uses it yet |
| `builtin/mcp-tool-description` | ToolDescription | Description of an agent offered as its own MCP tool |
| `builtin/a2a-skill-description` | ToolDescription | Description of an agent's A2A skill |
| `builtin/mcp-tool-garrison_*` | ToolDescription | Descriptions of the eight Garrison MCP tools (see `MCP_API.md`) |
| `builtin/claude-code-mcp-config` | ConfigFile | Claude Code `--mcp-config` file |
| `builtin/mux-mcp-config`, `builtin/mux-endpoints`, `builtin/mux-settings`, `builtin/mux-subagents` | ConfigFile | Mux configuration directory |
| `builtin/gemini-settings` | ConfigFile | Gemini CLI `settings.json` with MCP servers |

This is the whole default system prompt:

```text
You are {{agent.displayName | default: agent.name}}, an agent operated by Garrison.
{{#if agent.description}}

{{agent.description}}
{{/if}}

Work only inside your current working directory. When you are done, reply with your final answer.
{{#if garrison.delegationEnabled}}

{{> builtin/garrison-tools-instructions}}
{{/if}}
{{#if agent.outputSchema}}
{{#unless harness.nativeSchema}}

{{> builtin/structured-output-instructions}}
{{/unless}}
{{/if}}
```

## Binding prompts to deployments

A deployment's `promptBindings` map roles to templates:

| Role | Rendered as | When it is missing |
|---|---|---|
| `System` | `prompts.system`, delivered as the profile's `systemPromptDelivery` says | Bound to `builtin/default-system` when the deployment is created |
| `Task` | `prompts.task`, delivered as the profile's `promptDelivery` says | Bound to `builtin/default-task` |
| `DelegatedTask` | `prompts.task` for runs started by another agent | Bound to `builtin/delegated-task` |

If a deployment ends up with no `Task` binding at all, the caller's message is sent as is.

```json
{
  "promptBindings": [
    { "role": "System", "templateId": "tpl_mv1q2abc_reviewerSystem", "pinnedVersion": 3 },
    { "role": "Task", "templateId": "tpl_mv1q2abd_reviewerTask" }
  ]
}
```

Configuration file templates are bound differently: harness profiles include them in file contents with `{{> name}}`. To change Claude Code's MCP configuration, clone `builtin/claude-code-mcp-config`, clone the profile, and point the profile's file at your template.

## Template language

The language is small on purpose. It has variables, filters, conditionals, loops, includes, comments, and raw blocks, and nothing that can call out of the renderer.

| Syntax | Meaning |
|---|---|
| `{{agent.name}}` | Insert a value. Missing values render as empty text |
| `{{agent.name \| upper}}` | Apply a filter; filters chain left to right |
| `{{#if path}}...{{else}}...{{/if}}` | Conditional |
| `{{#unless path}}...{{/unless}}` | Negated conditional |
| `{{#each path}}...{{/each}}` | Loop over a list. Inside, `this` is the element and `@index`, `@first`, `@last` describe the position |
| `{{> name}}` | Include another template by name. The tenant's template wins over a built-in of the same name |
| `{{! comment}}` | Removed from the output |
| `{{{{raw}}}}...{{{{/raw}}}}` | Output the contents literally, braces and all |

A block tag (`{{#if}}`, `{{else}}`, `{{/each}}`, and so on) alone on a line removes that whole line, so templates can be laid out readably without leaving blank lines behind.

A value is false when it is missing, `false`, an empty or whitespace-only string, the string `false`, zero, an empty list, or an empty map. Everything else is true.

| Filter | Effect |
|---|---|
| `default: "text"` or `default: other.path` | Use the argument when the value is missing, an empty string, or an empty list |
| `upper`, `lower`, `trim` | Case and whitespace |
| `json` | JSON encoding, including quotes for strings. Use it whenever a value goes into a JSON file |
| `toml` | TOML encoding, for Codex `--config` values |
| `indent: 4` | Indent every line after the first by that many spaces (default 2) |
| `truncate: 200` | Keep at most that many characters (default 200) |
| `join: ", "` | Join a list (default `, `) |

Output is not HTML-escaped. Includes nest up to 8 deep and rendered output is limited to 8 MiB. An unknown filter, an unclosed block, or an include that does not exist fails the render with the line and column. For runs, that failure surfaces as the run outcome `CompileFailed` or a 400 `TemplateRenderFailed` when a preview is requested.

### Variables

The variables available when a run is compiled (`tenant`, `agent`, `deployment`, `run`, `input`, `caller`, `prompts`, `resources`, `secret`, `garrison`, `harness`, `now`) are listed in `docs/HARNESSES.md`. Prompt templates use these most:

| Variable | Contents |
|---|---|
| `input.message` | The caller's message |
| `input.parameters.<name>`, `input.parameterList` | Run parameters as a map and as a list of `name` and `value` |
| `agent.name`, `agent.displayName`, `agent.description`, `agent.outputSchema` | The agent |
| `agent.delegation.allowList`, `agent.delegation.maxDepth` | Delegation rules |
| `deployment.parameters.<name>` | Deployment parameters, after allowed run overrides |
| `caller.agentName`, `run.depth`, `run.callChain` | Who is asking, in a delegation chain |
| `garrison.delegationEnabled`, `garrison.mcpServerName` | Whether this run can delegate, and the MCP server name to tell it about |
| `harness.type`, `harness.nativeSchema` | Which harness will run the prompt |

Secrets are available as `secret.*`, but only to templates rendered into the execution spec. Previews never see secret values.

## Previewing

Render a stored template, or any content, before you bind it:

```bash
curl -s -X POST http://127.0.0.1:8700/v1.0/api/tenants/default/prompt-templates/render \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "content": "Hello {{agent.name | upper}}.{{#if input.parameterList}} Params: {{#each input.parameterList}}{{this.name}}={{this.value}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}",
    "context": { "agent": { "name": "reviewer" }, "input": { "parameterList": [ { "name": "lang", "value": "go" }, { "name": "depth", "value": "2" } ] } }
  }'
```

```json
{"rendered":"Hello REVIEWER. Params: lang=go, depth=2","success":true,"variables":["agent.name","input.parameterList"],"includes":[],"errors":[]}
```

`context` is merged over a built-in sample context, so you only supply what you want to change. Pass `deploymentId` instead to render against a real deployment's context (secrets excluded). A failed render still answers 200, with `success: false` and the problems in `errors`:

```json
{"rendered":"","success":false,"variables":[],"includes":[],"errors":["template 'ad hoc' at line 1, column 36: Unknown filter 'shout'. Supported: default, upper, lower, trim, json, toml, indent, truncate, join."]}
```

The dashboard's template editor calls the same endpoint as you type. To see every prompt and file a deployment would produce, together, use `POST .../deployments/{id}/compile-preview`.

## Known gaps

- The Garrison MCP tool descriptions (`builtin/mcp-tool-garrison_*`) are read at startup by their built-in names, and tenant templates cannot use `builtin/` names, so these descriptions cannot be changed yet.
- The A2A gateway's agent card substitutes only `{{agent.name}}` and `{{agent.description}}` in the agent's skill description template, instead of rendering it with the full language. `GET .../agents/{id}/card` renders it fully.
- `builtin/structured-output-repair` and `builtin/mcp-tool-description` are seeded, but no run or endpoint uses them yet: output repair and agents offered as their own MCP tools (`exposeMcpTool`) are planned.
