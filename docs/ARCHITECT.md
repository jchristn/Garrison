# The agent architect

The agent architect is the part of the studio you talk to. You describe the app you want ("a lead agent that answers people, a researcher it can fan out to, and a writer that produces a Word document"), and the architect writes it into a studio draft: agents, deployments, prompt templates, assets, the app and its edges. It can change the draft as often as you like. It cannot make the draft live. Applying a draft always takes a person's approval ([STUDIO.md](STUDIO.md#applying-a-draft)).

The architect is an ordinary Garrison agent, not a special service. It runs on a harness and model you pick, its runs show up in the run list like any other, and what it may touch is decided by the same RBAC as everything else. Two things make it an architect: its deployment carries `managementAccess: Drafts`, which lets its runs work on drafts, and its system prompt is one of the architect prompts described below.

## The built-in architect

Every tenant gets a protected agent named `agent-architect`. Garrison seeds it at startup and whenever a tenant is created, under the startup lock, so several replicas starting together still leave exactly one. Its published revision pins the skill asset `agent-architect-skills`, which teaches it how to write manifests, how Garrison names and relates things, and how to choose where a capability comes from. The agent cannot be edited or deleted. You change its behavior by giving its deployment a different prompt, not by editing the agent.

It has no deployment until you create an architect. Pick the harness and model you want the architect to think with; a capable coding harness such as Claude Code is the natural choice. The next section shows how.

## Architects

An architect is a deployment of `agent-architect` with `managementAccess: Drafts`, a harness profile, a model, a credential secret, and an architect prompt. Its ID is the deployment ID (`dep_...`). Architects belong to the tenant and are reusable: any studio draft can use any architect, and nothing ties one to a particular draft. Keep one per harness or prompt you like to work with. In the dashboard they are on Agents > Architects (list, create, edit, delete, choose the prompt), and the Architect tab of a draft only picks which architect to talk to. The agent wizard (Agents > Agents > Agent wizard) sets one up for you: it keeps one architect per harness profile, named `architect-<profile>`, on `builtin/agent-architect-guided`, and updates its model and credential to what you chose in the wizard.

```bash
API=http://127.0.0.1:8700/v1.0/api/tenants/default
DEP=$(curl -s -X POST "$API/studio/architects" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"architect","harnessProfileId":"hrn_builtin_claude_code","credentialSecretId":"anthropic-api-key","architectPromptTemplateId":"builtin/agent-architect-guided"}' | jq -r .id)
curl -s "$API/studio/architects?search=arch&activeOnly=true" -H "Authorization: Bearer $TOKEN"
curl -s -X PUT "$API/studio/architects/$DEP" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"architect","harnessProfileId":"hrn_builtin_claude_code","model":"claude-opus-4-1","active":true}'
curl -s -X DELETE "$API/studio/architects/$DEP" -H "Authorization: Bearer $TOKEN"
```

| Method and path | Permission | Result |
|---|---|---|
| `GET /studio/architects` | Read on `Deployment` | `EnumerationResult<Architect>`. Query: `maxResults` (1 to 1000, default 25), `skip`, `ordering`, `search` (part of a name), `activeOnly` |
| `POST /studio/architects` | Create on `Deployment` | `Architect`, 201 |
| `GET /studio/architects/{deploymentId}` | Read on `Deployment` | `Architect`, 200 |
| `PUT /studio/architects/{deploymentId}` | Update on `Deployment` | `Architect`, 200 |
| `DELETE /studio/architects/{deploymentId}` | Delete on `Deployment` | 204 |

`{deploymentId}` takes the deployment ID or its name. A deployment that exists but is not an architect answers 404, the same as one that does not exist.

The request body, `ArchitectRequest`, is the same for create and update:

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Required. Unique among the tenant's deployments |
| `description` | string? | Optional |
| `harnessProfileId` | string | Required. Harness profile ID, such as `hrn_builtin_claude_code` |
| `model` | string? | Null for the harness profile's default model |
| `active` | bool | Whether the architect accepts new turns. Default true |
| `credentialSecretId` | string? | A secret ID or name the harness signs in with, bound to the deployment under the alias `credential`: an `AnthropicApiKey` or `ClaudeCodeOAuthToken` for Claude Code, an `OpenAiApiKey` or `CodexAuthJson` for Codex, a `GeminiApiKey` for Gemini CLI. On create, null binds none; on update, null keeps the current one and an empty string removes it |
| `architectPromptTemplateId` | string? | A `System` template ID or name. On create, null binds `builtin/agent-architect`; on update, null keeps the current prompt |
| `architectPromptVersion` | int? | Version to pin, minimum 1, or null to follow the template's current version. Give it together with `architectPromptTemplateId` |

An update changes only these fields. The deployment's other settings (limits, executor, egress rules, and so on) stay as they are, and you edit them through the ordinary deployment routes. A prompt change takes effect on the architect's next turn ([the next-turn rule](#the-next-turn-rule)).

The response, `Architect`, has `id`, `tenantId`, `name`, `description`, `agentId`, `agentName` (null when the agent cannot be read), `harnessProfileId`, `model`, `active`, `credentialSecretId`, `credentialSecretName`, and `credentialSecretKind` (the bound credential, or null; the secret bound as `credential`, else the first bound secret), `architectPromptTemplateId`, `architectPromptName`, `architectPromptVersion` (the pin, or null), `architectPromptCurrentVersion`, `configVersion`, `isProtected`, `createdUtc`, and `lastUpdateUtc`.

The list includes every deployment with `managementAccess: Drafts` and every deployment of the built-in `agent-architect`, so an architect created through `POST /deployments` or a manifest shows up as well.

Errors:

- 400 `ValidationFailed` when `name` or `harnessProfileId` is missing, or `architectPromptVersion` comes without `architectPromptTemplateId`.
- 400 `InvalidArchitectPrompt` when the template is not a `System` template the tenant can read.
- 400 `InvalidCredentialSecret` when the credential secret does not exist in the tenant or is inactive.
- 409 `NameConflict` when another deployment has the name.
- 409 `ArchitectAgentMissing` on create when the tenant has no built-in `agent-architect`. Restarting the server seeds it.
- 409 `Protected` on update or delete when the deployment is protected, and on delete 409 `ReferencedByTrigger`, `ReferencedByNotificationEndpoint`, or `ReferencedByPipeline` when something still names it.

Deleting an architect removes its deployment. Drafts are kept; only their conversations with that architect end.

**Credentials.** A harness gets its API key or token only from a secret bound to its deployment; keys in the worker's own environment never reach it. An architect without a credential on a harness that needs one fails every turn with outcome `NotCredentialed` (Claude Code prints "Not logged in · Please run /login"). The dashboard suggests a secret whose kind fits the chosen harness profile when you create an architect, warns when there is none, and the studio chat shows a notice with links to the architect and to Secrets when the architect has no credential or a turn fails with `NotCredentialed`.

The MCP tools `garrison_studio_list_architects` (`search`, `activeOnly`, `maxResults` 1 to 100, `skip`), `garrison_studio_get_architect`, `garrison_studio_create_architect`, `garrison_studio_update_architect`, and `garrison_studio_delete_architect` do the same for users and credentials ([MCP_API.md](../MCP_API.md#studio-drafts)). The update tool is partial: fields you leave out keep their values. The delete tool returns `{"id": "dep_...", "deleted": true}`.

You can still create an architect as a plain deployment of `agent-architect` with `POST /deployments`, which accepts `architectPromptTemplateId` and `architectPromptVersion` on create. A deployment of `agent-architect` always gets `managementAccess: Drafts`, and without a prompt it binds `builtin/agent-architect`.

Talk to an architect in a conversation like any other agent. It works on the drafts of the person talking to it, with that person's permissions and no more.

## What it does in a draft

The architect's instructions cover two kinds of work, and both built-in prompts include both:

- **Design** (`builtin/agent-architect-design`): agents, their descriptions and schemas, system prompts, assets, the app's members and edges, and where each capability comes from.
- **Runtime** (`builtin/agent-architect-runtime`): deployment fields such as harness, model, effort, maximum turns, budget, timeouts, environment, node pool, artifact globs, approval rules, quotas, and triggers.

Everything it does goes through the studio MCP tools: `garrison_studio_create_draft`, `garrison_studio_put_item`, `garrison_studio_graph_operation`, `garrison_studio_diff`, `garrison_studio_validate`, `garrison_studio_request_apply`, `garrison_studio_playground_invoke`, and the read tools ([MCP_API.md](../MCP_API.md#studio-drafts)). Each change names the draft version it read, so when you and the architect edit the same draft at once, one of you gets `DraftVersionConflict` and rereads instead of silently overwriting the other.

When a design needs something like document conversion, the architect reads the capability catalog and picks one of three sources: another Garrison agent (an edge in the app), an external MCP server's tool (a binding on a deployment), or a tool installed on the worker host (a `capabilities` entry on the agent). [CAPABILITIES.md](CAPABILITIES.md#choosing-a-source) explains the trade-offs it weighs.

## Architect prompts

Garrison ships two architect prompts, both protected `System` templates:

| Template | For |
|---|---|
| `builtin/agent-architect` | The default. The full studio: design and runtime settings, at the pace of someone who knows what they want |
| `builtin/agent-architect-guided` | First-time builders. Asks one question at a time and explains each step before it takes it |

Both are built from the fragments `builtin/agent-architect-design` and `builtin/agent-architect-runtime`, which are protected as well.

Protected means you cannot update or delete them (409 `BuiltInImmutable`), but you can reset them. Reset on a built-in re-applies the text that shipped with this release: when the stored text already matches, nothing changes and the answer is 200; when it has drifted, for example after an upgrade changed the shipped text, a new version is added.

### Cloning and editing

To write your own architect prompt, clone a built-in and edit the clone. Built-in templates have fixed identifiers (`tpl_builtin_agent_architect`, `tpl_builtin_agent_architect_guided`):

```bash
CLONE=$(curl -s -X POST "$API/prompt-templates/tpl_builtin_agent_architect/clone" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"architect-house-style"}' | jq -r .id)
```

Where an architect prompt is selected (`architectPromptTemplateId`), a template name such as `builtin/agent-architect-guided` works as well as an identifier.

The clone belongs to your tenant, starts at version 1, and remembers which built-in it came from (`builtInKey`). Its name, description, and body are yours to change, and every save is a new version with the usual history, restore, and render preview ([PROMPTS.md](PROMPTS.md)). Reset on a clone brings back the shipped text of its built-in as a new version, which is the quickest way out of an experiment that went wrong. A clone can include the design and runtime fragments as the built-ins do, or replace them with your own text.

`GET $API/studio/architect-prompts` lists what you can choose from, in this order: the built-ins, then your tenant's clones of them, then any other `System` template in the tenant. The answer is an `EnumerationResult<ArchitectPromptEntry>` (`success`, `maxResults`, `skip`, `totalRecords`, `recordsRemaining`, `endOfResults`, `timestampUtc`, `objects`). It takes `maxResults` (1 to 1000, default 25), `skip`, and `search` (part of the template name); the order stays fixed, so `ordering` has no effect. Each entry in `objects` has `id`, `name`, `description`, `isBuiltIn`, `builtInKey`, `currentVersion`, `isDefault`, and `deployments`, the architect deployments that use it right now. Templates of other tenants never appear. Listing needs Read on `PromptTemplate`.

### Selecting a prompt

An architect's prompt choice lives on its deployment, as the deployment's `System` prompt binding. The agent's revision does not change, which is why a protected agent can still be steered per tenant.

```bash
DEP=<architect deployment id>
curl -s "$API/studio/architects/$DEP/prompt" -H "Authorization: Bearer $TOKEN"
curl -s -X PUT "$API/studio/architects/$DEP/prompt" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"architectPromptTemplateId\":\"$CLONE\"}"
```

Both return an `ArchitectPromptSelection`: `deploymentId`, `architectPromptTemplateId`, `architectPromptName`, `architectPromptVersion` (the pin, or null), and `currentVersion`. Reading needs Read on `Deployment`, and changing needs Update on it. The MCP tools `garrison_studio_list_architect_prompts` (`search`, `maxResults` 1 to 100, `skip`), `garrison_studio_get_architect_prompt`, and `garrison_studio_set_architect_prompt` do the same. `PUT /studio/architects/{deploymentId}` with `architectPromptTemplateId` changes the prompt too.

Only architect deployments take an architect prompt: deployments of `agent-architect`, or of any agent whose deployment has `managementAccess: Drafts`. Anything else answers 400 `NotAnArchitectDeployment`. The template must be a `System` template your tenant can read, or the answer is 400 `InvalidArchitectPrompt`.

### The next-turn rule

With no pinned version, each architect turn renders the selected template's current version. Save a new version of your clone and the very next turn uses it, with no new revision and no redeploy. Switching to a different template works the same way. A turn that is already running keeps the prompt it started with, so a change never lands halfway through a reply.

Set `architectPromptVersion` when you want the opposite: a pinned version keeps its text until you change the pin, however many versions the template gains in the meantime. Pin when you need a reproducible architect, for example while comparing two models on the same prompt; leave it unpinned while you are still writing the prompt.

Every run records the templates and versions it rendered in `templateVersions`, so an odd architect reply can always be traced to the exact prompt text that produced it.

### Deleting a prompt that is in use

Deleting a template that any deployment binds, pinned or not, is refused with 409 `PromptTemplateInUse`, and the message lists the deployments. Garrison does not fall back to another prompt behind your back. Switch those architects to another prompt first, then delete.

### Who may change the prompt

People and credentials, with the permissions above. Runs never can: the architect tools, the architect prompt tools and the prompt template tools (`garrison_clone_prompt_template`, `garrison_update_prompt_template`, `garrison_reset_prompt_template`, `garrison_render_prompt_template`) are hidden from every run token and refused if called, including the architect's own runs. The architect can propose changes to your agents, but it cannot rewrite its own instructions.

## The Drafts grant

`managementAccess: Drafts` is what lets a run touch the studio at all. A run token from such a deployment may create, read, and edit drafts, try them in the playground (which writes agent draft revisions, never published ones), request their apply, and read design configuration. Every call is also checked against the person who started the run, so a person without design permissions gets an architect that cannot design. It sees only that person's drafts, and it can never apply a draft, decide an approval, delete a live resource, or read a secret value. The grant ends when the run ends.

[STUDIO.md](STUDIO.md#delegated-management) and [SECURITY.md](SECURITY.md#delegated-management) have the full rules.

## Testing an architect without a model

The fake harness can play an architect. It reads the Garrison MCP server from its configuration and makes the MCP calls you list, in order, so a scripted architect turn can drive the same studio tools a real model would. Garrison's own test suite does exactly this (`studio-<provider>.architect-script`): a scripted turn edits a deployment's model, timeout, and approval rule, binds an agent edge, an MCP server, and a host tool, and the test checks the diff contains exactly those changes.

A small version you can run on any stack with the fake harness. First a harness profile that turns deployment parameters `step1` and `step2` into MCP calls, and an agent to deploy with it:

```yaml
apiVersion: garrison/v1
kind: HarnessProfile
metadata:
  name: architect-script
spec:
  harnessType: Generic
  executable: garrison-fake-harness
  promptDelivery: Stdin
  mcpConfigFormat: ClaudeJson
  mcpConfigFileName: mcp.json
  outputParser: ClaudeStreamJson
  resultSource: ParserFinalEvent
  defaultTimeoutSeconds: 300
  files:
    - baseDirectory: Config
      pathTemplate: mcp.json
      contentTemplate: "{{> builtin/claude-code-mcp-config}}"
      isSecret: true
      condition: "{{resources.hasMcpServers}}"
      mode: "600"
  arguments:
    - template: --format
    - template: claude
    - template: --mcp-config
      condition: "{{resources.hasMcpServers}}"
    - template: $GARRISON_CONFIG_DIR/mcp.json
      condition: "{{resources.hasMcpServers}}"
    - template: --mcp-invoke
      condition: "{{deployment.parameters.step1}}"
    - template: "{{deployment.parameters.step1}}"
      condition: "{{deployment.parameters.step1}}"
    - template: --mcp-invoke
      condition: "{{deployment.parameters.step2}}"
    - template: "{{deployment.parameters.step2}}"
      condition: "{{deployment.parameters.step2}}"
---
apiVersion: garrison/v1
kind: Agent
metadata:
  name: scripted-architect
  description: Plays the architect from a fixed script
```

Apply it with `POST $API/manifests/apply`. The script needs a draft to work on, so create one, then deploy the scripted architect with the draft's identifier in its steps. Step 1 puts an agent in the draft at version 1, and step 2 puts its `dev` deployment at version 2:

```bash
DRAFT=$(curl -s -X POST $API/studio/drafts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Scripted"}' | jq -r .id)
cat > scripted-architect.yaml <<EOF
apiVersion: garrison/v1
kind: Deployment
metadata:
  name: scripted-architect
spec:
  agent: scripted-architect
  harnessProfile: architect-script
  managementAccess: Drafts
  parameters:
    step1: 'garrison,garrison_studio_put_item,{"draftId":"$DRAFT","version":1,"kind":"Agent","name":"greeter","document":"apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: greeter\nspec:\n  displayName: Greeter\n"}'
    step2: 'garrison,garrison_studio_put_item,{"draftId":"$DRAFT","version":2,"kind":"Deployment","name":"greeter-dev","document":"apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: greeter-dev\nspec:\n  agent: greeter\n  harnessProfile: builtin/fake\n"}'
EOF
curl -s -X POST $API/manifests/apply -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @scripted-architect.yaml
curl -s -X POST $API/agents/scripted-architect/invoke -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"input":"Build me a greeter.","wait":true,"waitSeconds":120}' | jq -r .status
curl -s $API/studio/drafts/$DRAFT/diff -H "Authorization: Bearer $TOKEN" | jq -c '.items[] | {kind, name, change}'
```

The turn succeeds, the draft is at version 3, and the diff shows two `Create` items. Nothing is live yet: the next step is `request-apply` and a person's decision, exactly as for drafts a real architect writes. The draft must belong to the person who invokes the architect, because a Drafts run only reaches its own person's drafts.

The same deployment is a valid target for `PUT .../studio/architects/{id}/prompt`, since it carries the Drafts grant. That makes it a cheap way to check the next-turn rule: select a clone, invoke, edit the clone, invoke again, and compare the two runs' `templateVersions`.

## Status

The architect, its prompts, selection, the next-turn rule, and the delete protection are built and tested on Sqlite and PostgreSQL. The architect resource (`/studio/architects`) and its MCP tools are covered by the Touchstone case `studio-*: architects`. In the dashboard, the setup wizard's Agent Studio step creates the first architect with a chosen prompt, Agents > Architects lists, creates, edits, and deletes architects and chooses their prompts, a draft's Architect tab picks which architect to use, and the Architect prompt tab in a draft lists, clones, edits, resets, and selects architect prompts. The REST routes, MCP tools, and SDKs shown here do the same.
