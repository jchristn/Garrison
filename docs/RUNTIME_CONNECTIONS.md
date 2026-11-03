# Shared harnesses and endpoints

Configure runtime access once in **Connections**. A connection is a tenant harness profile. Reusable model, endpoint, and authentication settings live in `runtimeConfiguration`; existing custom harness records also remain selectable using their launch definitions and defaults. It combines a harness adapter with a model or Mux endpoint name, and any authentication references. Choose the harness or API type when adding a connection. Custom executable, arguments, files, and parser settings are available under **Advanced launch settings** in that same editor. There is one connection list. Creation offers one choice per harness type; Codex uses its streaming app-server profile when available. Existing connections retain their configured driver.

Architects and agent deployments reference the saved profile through `harnessProfileId`. Agent Wizard step 2 lists connections only. The wizard automatically reuses an active architect on the selected connection or creates a guided architect referencing it. Resuming a draft preserves its existing architect when it uses that connection. No architect is offered as a second kind of connection choice. The same reference is used when configuring the draft's dev deployments.

To change a connection, edit its saved profile. The next run of every consumer resolves the current configuration. Runs already executing retain their compiled specification. A shared edit therefore affects every referencing architect and deployment; create another saved connection when consumers need different models or access settings.

## Dashboard navigation

**Connections** is a standalone page for harnesses and API endpoints. **Configuration** has one horizontal tab row for Secrets, Prompt Templates, Assets, MCP Servers, and Workspaces. **Operations** has one horizontal tab row for Artifact Stores, Model Prices, Usage Quotas, and Notifications. Neither workspace has vertical section navigation or nested tab rows. On narrow screens, the single row scrolls horizontally.

Both workspaces link to a dedicated **Import / Export** workspace. Its Apply, Export, and History tabs are its only tab row. Existing URLs redirect to the correct workspace while preserving filters and anchors.

**Agents > Architects > Add Architect** asks for a name and a connection from the registry. The selected endpoint, model, and authentication appear as a read-only summary. Optional description, prompt customization, pinned prompt version, and availability are under **Architect options**. No endpoint or credential values are entered again.


## REST and SDK contract

The existing tenant `/harness-profiles` REST API owns connections. No second connection registry or new permission type is introduced. Read a built-in profile, create a tenant copy with a name and the following additional field, and reference the returned ID from consumers:

```json
{
  "runtimeConfiguration": {
    "model": "your-cloud-model",
    "inferenceEndpoint": {
      "protocol": "Ollama",
      "baseUrl": "https://ollama.com",
      "authenticationType": "BearerToken",
      "credentials": [
        { "name": "", "location": "Header", "secretId": "sec_saved_token" }
      ]
    }
  }
}
```

This object supplements the normal harness profile fields; use the `builtin/provider-api` adapter for HTTP inference. The dashboard copies the adapter fields when a template is selected. For local Ollama, select `None` and an empty credentials array. OpenAI-compatible services use `protocol: OpenAiCompatible`. See [HTTP protocols and authentication](PROVIDER_API.md) for all supported schemes.

For Mux, use `runtimeConfiguration.endpointName` with the worker-configured endpoint name. Mux supplies its own model and authentication. For CLI harnesses, use optional `runtimeConfiguration.model` and `runtimeConfiguration.credentialSecretId`; compatible CLI sign-in files remain supported. Built-in records with `runtimeConfiguration: null` are harness choices when creating a connection. Existing tenant custom harness records with a null configuration remain usable connections with harness defaults; they do not need to be recreated.

An architect request needs only its name, the saved profile ID, and optional architect prompt settings:

```json
{
  "name": "ollama-architect",
  "harnessProfileId": "hrn_saved_connection",
  "architectPromptTemplateId": "builtin/agent-architect-guided"
}
```

Ordinary deployments likewise reference `harnessProfileId`. The server clears superseded inline connection fields when a saved connection is selected. Architect responses project the effective model and endpoint for compatibility; these values are resolved from the saved profile. C#, JavaScript, Python, and Go SDKs expose `HarnessRuntimeConfiguration`. MCP architect creation and update use the same existing profile reference. MCP manifest tools can create or update the shared profile itself.

## Credentials and permissions

Credentials remain encrypted tenant secrets. Connection records, REST responses, manifests, and wizard local state contain references rather than values. Creating, cloning, or changing a connection requires permission to use its credentials. Selecting a connection for a deployment and starting runs still enforce `SecretUse`; a profile reference cannot grant access to a secret. Changes to harness or MCP templates also check the resolved connection secrets they could render. Secret deletion identifies the saved connection using it, even when the connection has no deployments yet. Profile deletion identifies referencing deployments.

## Migration and manifests

Schema 45 adds structured runtime settings and ordered credential-reference tables. After built-ins are seeded, startup moves existing inline deployment settings into named tenant connections, switches each deployment to that profile, and removes the copied inline settings. Existing architects therefore appear in Wizard step 2 and their migrated connections appear in the central registry. Deterministic profile IDs make migration restartable and safe for multiple replicas. Existing valid settings and encrypted secret references are preserved. Different legacy deployments receive separate profiles so migration does not couple settings that were previously independent; they can subsequently select the same saved connection deliberately.

Legacy API clients may still use inline connection fields with unconfigured adapter templates. Those deployments remain compatible and are migrated on the next server startup. New dashboard flows use saved references exclusively.

Manifest export includes a connection's configuration in its `HarnessProfile` document, substitutes secret names for IDs, and lists the secrets as bundle requirements. Import resolves those names in the destination tenant. Deployment documents retain the profile name reference. Secret values are never exported.

## Validation

The shared provider suite tests migration, idempotency, persistence, propagation to multiple consumers, secret-use denial, and portable manifests. Studio tests cover REST and MCP architect creation by saved profile ID, projected settings, and blocked secret/profile deletion. Browser tests cover navigation redirects and mobile selection, all HTTP authentication choices in the central editor, existing Ollama architect reuse, and wizard design, approval, and deployment reference behavior.

## Wizard design conversation

Step 3 gives the conversation the full width until the architect adds draft items. The draft summary then appears alongside the chat on wide screens and below it on narrow screens. A larger, resizable message box supports detailed answers, and the Send button keeps its normal height. Keyboard guidance and the AI notice share one footer row where space allows.

## Connections and architects

A connection defines access to a harness or model endpoint. An architect is an agent that uses a connection together with design instructions and permission to work on Studio drafts. Wizard step 2 asks only for the connection; choosing and preparing the architect is the wizard's responsibility. Users who need to customize an architect's instructions can still do so under Agents > Architects.
