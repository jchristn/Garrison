// English tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into en.js.
// Tooltips say what a control is and how it is used, never just the label again (D-030).

const TELEMETRY = {
  timeToFirstTokenMs: 'Time to first token: from the moment the worker starts the harness process until the model produces its first output (text or thinking). It includes harness startup, so a slow CLI start shows up here. Measured on the worker with a monotonic clock.',
  streamingMs: 'Streaming time: from the first model output to the last one. This is how long the model was actually producing output. Measured on the worker with a monotonic clock.',
  executionMs: 'Execution time: from harness process start to process exit, as measured by the worker. Older servers that do not report it fall back to the started and completed timestamps.',
  queueMs: 'Queue time: how long the run waited between being queued and being leased by a worker node. High values mean every eligible node was busy or none matched the placement rules. Measured by the server.',
  totalMs: 'Total time: from queued to completed, so queue time plus execution plus result reporting. Measured by the server.',
  outputTokensPerSecond: 'Output tokens per second: output tokens divided by streaming time. Shown only when streaming lasted at least 100 ms, because shorter windows give meaningless rates.',
  inputTokens: 'Input tokens the harness reported for the whole run, including system prompt, tool results, and conversation history across turns.',
  outputTokens: 'Output tokens the model generated across every turn of the run, as reported by the harness parser.',
  cachedTokens: 'Input tokens served from the provider prompt cache. Cached tokens are usually billed at a lower rate, so a high share here keeps cost down.',
  reasoningTokens: 'Reasoning or thinking tokens, when the harness reports them separately (for example Codex reasoning output). Zero when the harness does not break them out.',
  toolCallCount: 'Number of tool call events in the run: MCP tools, built-in harness tools, and calls to other Garrison agents. Counted by the worker from the event stream.',
  costUsd: 'Cost in US dollars as reported by the harness. Marked as estimated when Garrison computed it from token counts instead of the harness reporting it.',
  firstTokenUtc: 'Wall-clock time (UTC, shown in your time zone) of the first model output event in the run.',
  lastTokenUtc: 'Wall-clock time (UTC, shown in your time zone) of the last model output event in the run.'
};

const FILE_ITEMS = {
  baseDirectory: 'Which directory the path is relative to: the run config directory, the workspace, or the run HOME directory.',
  pathTemplate: 'Relative path of the file to write before launch. Templates are allowed, for example settings/{{run.id}}.json.',
  contentTemplate: 'Template rendered into the file content. It may reference variables and bound secrets with {{secret.alias}}.',
  condition: 'Template expression; when it renders empty or false the file is not written.',
  mode: 'Unix file mode in octal, for example 0600 for files that hold credentials.',
  isSecret: 'Treat the rendered content as secret: it is never logged and is redacted in compile previews.'
};

const tips = {
  common: {
    fields: {
      name: 'Unique name for this record within the tenant. Other records and manifests refer to it by this name.',
      description: 'Free-text note for people. It explains what this record is for and is not used at run time.',
      active: 'Inactive records are kept but ignored. Turn this off to pause something without deleting it.',
      id: 'System-generated identifier with a type prefix. Use it in API calls and scripts; it never changes.',
      createdUtc: 'When this record was created. Hover the value for the exact date and time.',
      lastUpdateUtc: 'When this record was last changed.',
      isBuiltIn: 'Built-in records ship with Garrison and are read-only. Custom records were created in this tenant and can be edited.',
      expiresUtc: 'After this time the record stops working. Leave empty for no expiry.'
    }
  },
  explainer: {
    reopen: 'Show the explanation of {{topic}} again: what this page manages and how it relates to the rest of Garrison.',
    dismiss: 'Hide this explanation. A small "About" button stays in its place so you can bring it back at any time.'
  },
  nav: {
    hubs: {
      home: 'Start here: live counts of agents, runs, and worker nodes, API traffic, recent failures, and shortcuts to common tasks.',
      invoke: 'Send a message to an agent from the browser and watch the transcript stream, without writing any code.',
      runs: 'Every agent invocation, its transcript, outcome, and telemetry, plus the queue of work waiting for a node.',
      analytics: 'Charts of run speed, token use, cost, outcomes, and tool calls over time, filterable by agent, harness, and deployment.',
      agents: 'The agents callers invoke by name, and the deployments that decide how each one actually runs.',
      configuration: 'The building blocks deployments use: harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores, and manifests.',
      fleet: 'The worker nodes that execute runs and the node pools that group them for placement.',
      access: 'Who can sign in and what they may do: tenants, users, access keys, roles, and role assignments.',
      monitoring: 'Investigate what happened: captured API requests, the security audit trail, and a live API Explorer.',
      system: 'Server settings and the endpoints, versions, and identity of the server you are connected to.'
    },
    tabs: {
      runs: 'Search, filter, and inspect individual runs. Open one to read its transcript, result, and telemetry, or cancel and retry it.',
      queue: 'Runs that are waiting for a node, leased, or running right now, grouped by agent and harness.',
      agents: 'Named agents that callers invoke over REST, MCP, or A2A. An agent is the identity; its deployments decide how it runs.',
      deployments: 'How each agent runs: harness profile, model, prompts, MCP servers, secrets, workspace, placement, limits, and traffic weight.',
      harnessProfiles: 'Recipes for launching a CLI harness headless: executable, arguments, environment, files, and output parsing.',
      promptTemplates: 'Every prompt and generated config file Garrison sends to a harness, versioned with a live preview.',
      mcpServers: 'Tool servers agents can use. Register them here, then bind them to deployments.',
      secrets: 'Encrypted API keys and tokens. Deployments bind them by alias; values are never shown again.',
      workspaces: 'Templates for the directory a run works in: empty, cloned from Git, or seeded with files.',
      artifactStores: 'Destinations for files that runs produce and you want to keep after the run ends.',
      manifests: 'Apply or export the whole tenant configuration as YAML so it can live in source control.',
      nodes: 'Worker machines or pods that pull runs and execute harnesses. Cordon, drain, or inspect them here.',
      nodePools: 'Named groups of nodes, optionally reserved for specific tenants. Deployments can require a pool.',
      tenants: 'Isolated organizations on this server, each with its own users, agents, secrets, and runs.',
      users: 'People who sign in with an email and password. Each user can own access keys.',
      credentials: 'Access keys for scripts, SDKs, and services. Each key belongs to a user and acts with that user\'s permissions or fewer.',
      roles: 'Named bundles of permissions, plus the permissions themselves. Assign roles to grant access.',
      assignments: 'Grants that connect a role to a user or an access key, for the whole tenant or one resource.',
      requests: 'API requests this server captured, with headers, bodies, timing, and status, for debugging integrations.',
      audit: 'Security and configuration events: sign-ins, denials, secret changes, manifest applies, and node changes.',
      explorer: 'Pick any API operation from the server\'s OpenAPI document, fill in parameters, and execute it live.',
      settings: 'Server and cluster settings with their source and whether a change applies live or needs a restart.',
      serverInfo: 'REST, MCP, and A2A addresses, server and dashboard versions, and the identity you are signed in as.'
    },
    subtabs: {
      roles: 'Roles group permissions under one name, such as Operator or Invoker. Assign a role to give someone all of its permissions.',
      permissions: 'Individual rules that permit or deny operations on resource types. Roles are made of these; deny always wins.',
      userAssignments: 'Grant roles to people who sign in with an email and password.',
      credentialAssignments: 'Grant roles to access keys used by automation. Keep keys narrower than their owners.'
    },
    setup: 'Open the setup wizard: store a harness credential, apply a sample agent, and run it once to confirm everything works.',
    tour: 'Replay the short guided tour that points out navigation, context, and where configuration lives.',
    skipToContent: 'Jump past the navigation straight to the main content of this page. Mostly useful for keyboard users.'
  },
  topbar: {
    toggleSidebar: 'Collapse or expand the navigation sidebar. On small screens it opens the navigation as an overlay.',
    server: 'The Garrison server this console talks to: {{url}}. The dot shows whether its health check is passing.',
    health: {
      healthy: 'The server answered its health check in the last 30 seconds.',
      unhealthy: 'The server did not answer its health check. Requests from this page will probably fail.',
      unknown: 'Waiting for the first health check result from the server.'
    },
    copyServer: 'Copy the server URL, for example to configure an SDK or a curl command.',
    switchTenant: 'System administrators can view any tenant. Every page shows the selected tenant\'s data.',
    tenant: 'You are working in tenant {{tenant}}. Every record and run you see belongs to it.',
    principal: 'You are signed in as {{name}}. Actions you take are recorded under this identity.',
    role: 'Your highest access level in this tenant. It decides which pages and actions are available.',
    liveOn: 'Connected to the server over WebSocket, so run and node changes appear as they happen.',
    liveOff: 'No live connection. Pages refresh on their own timers instead, so changes can take a few seconds to show.',
    github: 'Open the Garrison source repository on GitHub in a new tab, for documentation and issues.',
    themeLight: 'Switch to the light color theme. The choice is remembered in this browser.',
    themeDark: 'Switch to the dark color theme. The choice is remembered in this browser.',
    logout: 'Sign out and revoke this browser session. You will need to sign in again.',
    language: 'Change the display language. Dates and numbers follow the language too, and the choice is remembered.'
  },
  login: {
    passwordTab: 'Sign in as a person with a tenant, email, and password.',
    keyTab: 'Sign in with an access key and secret key, the same pair scripts and SDKs use.',
    serverUrl: 'Base address of the Garrison REST API, for example the port-forwarded server on 127.0.0.1:8700.',
    tenantId: 'The tenant your account belongs to. The local default tenant is called default.',
    email: 'The email address of your user account in this tenant.',
    password: 'Your account password. It is sent once to get a session token and never stored by the browser app.',
    accessKey: 'The public half of an access key, starting with access_. Create keys under Access, Credentials.',
    secretKey: 'The private half of the access key. It was shown once when the key was created or rotated.',
    submit: 'Check the credentials with the server and open the console for your tenant.'
  },
  table: {
    selectAll: 'Select or clear every row on this page, for example to delete them together.',
    selectRow: 'Select this row for a bulk action such as delete.',
    sortServer: '{{tip}} Click to sort the whole list by this column; click again to reverse the order.',
    sortPageOnly: '{{tip}} Click to sort the rows on this page only; the server cannot sort by this column.',
    clearSelection: 'Unselect every selected row without changing anything.',
    pageSize: 'How many rows to load per page. Larger pages take longer to load. The choice is remembered per table.',
    first: 'Go to the first page of results.',
    prev: 'Go back one page of results.',
    jump: 'Type a page number between 1 and {{total}} and press Enter to jump straight to it.',
    next: 'Go forward one page of results.',
    last: 'Go to the last page of results.',
    refresh: 'Reload this list from the server now, keeping your page, filters, and sort.',
    autoRefresh: 'Reload this data automatically on a timer. Off keeps it still while you read.',
    selectColumns: 'Choose which columns the table shows. Your choice is remembered per table in this browser.',
    columnPinned: '{{column}} is always shown because rows cannot be identified without it.',
    columnToggle: 'Show or hide the {{column}} column. {{tip}}',
    actionsFor: 'Open the actions for {{name}}: view, edit, duplicate, view JSON, delete, and record-specific actions.',
    actionsMenu: 'Open the actions available for this row.',
    actionsColumn: 'Per-row actions. Click the three dots to view, edit, duplicate, inspect the JSON, or delete.',
    search: 'Type part of a name to narrow the list. The search runs on the server after you stop typing.',
    clearFilters: 'Remove the search text and every filter and show the full list again.',
    bulkDelete: 'Delete every selected row. You will be asked to confirm first.'
  },
  filters: {
    status: 'Show only records in this state. Choose All to remove the filter.',
    harnessType: 'Show only records for one harness, such as Claude Code or Codex.',
    kind: 'Show only records of one kind. Choose All to remove the filter.',
    eventType: 'Show only audit events of one type, such as failed sign-ins or secret changes.',
    fromUtc: 'Show only records created at or after this time (your local time zone).',
    toUtc: 'Show only records created before this time (your local time zone).',
    method: 'Show only requests that used this HTTP method.',
    statusCode: 'Show only requests that returned this HTTP status code, for example 404 or 500.',
    pathContains: 'Show only requests whose path contains this text, for example /agents.',
    tenantId: 'Show only requests made in this tenant. Leave empty for every tenant.',
    apply: 'Run the search with the filter values above.',
    clear: 'Reset every filter above to empty and search again.'
  },
  form: {
    option: 'Include {{option}} in {{field}}. Checked options are saved; unchecked ones are left out.',
    reveal: 'Show the typed value in plain text so you can check it before saving.',
    hide: 'Mask the value again so people looking at your screen cannot read it.',
    key: 'Key for this entry of {{field}}. Keys must be unique within the list.',
    value: 'Value for this entry of {{field}}. Templates and secret references are allowed where noted.',
    removeRow: 'Remove this entry from the list. Nothing is saved until you click Save.',
    addRow: 'Add an empty key and value entry to {{field}}.',
    moveUp: 'Move this item one place earlier. Order matters here, for example for argument lists.',
    moveDown: 'Move this item one place later. Order matters here, for example for argument lists.',
    removeItem: 'Remove this item from the list. Nothing is saved until you click Save.',
    addItem: 'Add a new, empty item to {{field}} and fill in its fields.'
  },
  actions: {
    openDetail: 'Open the full detail page for this record.',
    view: 'Open this record read-only to see every field without risk of changing it.',
    edit: 'Open this record in a form to change it. Changes apply when you click Save.',
    duplicate: 'Start a new record prefilled with this one\'s values and a -copy name. Nothing is created until you save.',
    viewJson: 'Show the raw JSON exactly as the API returns it, for debugging or copying into scripts.',
    delete: 'Permanently delete this record. You will be asked to confirm, and it cannot be undone.',
    add: 'Create a new record of this type in a form.',
    switchToEdit: 'Switch this read-only view to an editable form.',
    retryLoad: 'Try loading this data from the server again.'
  },
  modal: {
    close: 'Close this window. Nothing on the server changes.',
    dismiss: 'Close this window without saving. You can also press Escape.',
    cancelForm: 'Close the form and discard unsaved changes.',
    back: 'Go to the previous step of the form. Values you entered are kept.',
    next: 'Go to the next step of the form. Nothing is saved until you click Save.',
    saveEdit: 'Save your changes to this record. The server validates them and reports any field that needs attention.',
    saveCreate: 'Create the record with these values. The server validates them and reports any field that needs attention.',
    saveValue: 'Send the value to the server. It is encrypted on arrival and never shown again.'
  },
  confirm: {
    delete: 'Yes, permanently delete this record.',
    bulkDelete: 'Yes, permanently delete every selected record.',
    cancel: 'Go back without doing anything.',
    danger: 'Carry out this destructive action. It cannot be undone.',
    confirm: 'Carry out the action described above.'
  },
  copy: {
    value: 'Copy this value to the clipboard.',
    block: 'Copy the whole block to the clipboard, ready to paste into a terminal or file.',
    done: 'Copied to the clipboard.'
  },
  chart: {
    ranges: {
      hour: 'Show the last 60 minutes, in one-minute buckets.',
      day: 'Show the last 24 hours. Buckets are sized so the chart stays readable.',
      week: 'Show the last 7 days. Buckets are sized so the chart stays readable.',
      month: 'Show the last 30 days. Buckets are sized so the chart stays readable.',
      custom: 'Pick your own start and end time. Very long ranges are rejected by the server.'
    },
    refresh: 'Reload the chart data from the server now.',
    tenant: 'Show request activity for one tenant or for every tenant on the server.'
  },
  badges: {
    active: 'Active: this record is in use.',
    inactive: 'Inactive: this record is kept but ignored until it is turned back on.',
    builtIn: 'Built-in: shipped with Garrison and read-only. Clone it to make a version you can edit.',
    custom: 'Custom: created in this tenant, so it can be edited and deleted.',
    systemAdmin: 'System administrator: can manage every tenant and bypasses authorization checks.',
    tenantAdmin: 'Tenant administrator: can manage everything inside this tenant.',
    user: 'Regular user: access comes only from role assignments.',
    role: 'This assignment grants the {{role}} role and every permission in it.',
    deploymentActive: 'Active: this deployment receives its share of the agent\'s traffic.',
    deploymentInactive: 'Inactive: this deployment receives no traffic, but can still be named explicitly when invoking.'
  },
  permissions: {
    source: 'The role this grant comes from. Fix access by changing that role or the assignment that grants it.',
    type: 'Permit grants the operations; Deny blocks them even when another role permits them.',
    resources: 'The kinds of records this grant covers, such as Agent or Run.',
    operations: 'What may be done to those records, such as Read, Create, or Execute.',
    scope: 'Tenant scope covers every record of the type; Resource scope covers one specific record.'
  },
  compilePreview: {
    input: 'A sample caller message to compile with. It becomes {{input.message}} in the task template.',
    compile: 'Compile this deployment exactly as a run would, without starting one, and show the command line, files, and environment.'
  },
  secretOnce: {
    accessKey: 'The public access key. It identifies the credential and is safe to store in configuration.',
    secretKey: 'The secret key. This is the only time it is shown; copy it into your password manager or secret store now.',
    done: 'Close this window. The secret key cannot be retrieved later, only rotated.'
  },
  wizard: {
    skip: 'Close the wizard and do not offer it again for this tenant. You can reopen it from the sidebar.',
    back: 'Go back to the previous step of the wizard.',
    start: 'Begin setup: add a credential, apply a sample agent, and test it.',
    saveSecret: 'Store the credential encrypted in this tenant and move to the next step.',
    skipStep: 'Continue without adding a credential. The sample agent does not need one.',
    apply: 'Create the sample agent and deployment from the manifest shown above.',
    invoke: 'Start a run of the sample agent with your message and open its detail page.',
    secretName: 'Name for the stored credential. Deployments refer to it by this name when they bind it.',
    manifest: 'The sample manifest in YAML. You can edit it before applying, for example to rename the agent.',
    message: 'The message to send to the sample agent. The fake harness echoes it back.'
  },
  tour: {
    skip: 'End the tour now. You can replay it from the sidebar.',
    back: 'Show the previous stop on the tour.',
    next: 'Move to the next stop on the tour.',
    done: 'Finish the tour. You can replay it from the sidebar.'
  },
  telemetry: {
    ...TELEMETRY,
    panel: 'How long each phase of this run took and what it consumed. Durations come from the worker and server clocks described on each field.',
    phases: 'Where the run spent its time, left to right: waiting in the queue, harness startup until the first token, streaming output, and the rest of execution.',
    phase: {
      queue: 'Waiting in the queue for a worker node to lease the run.',
      startup: 'From process start to the first model output, including harness startup and the first model request.',
      streaming: 'From the first to the last model output.',
      tail: 'Execution after the last model output: tool calls, result handling, and process exit.'
    }
  },
  blocked: {
    panel: 'Why this run is still queued and what to change so a worker can pick it up.',
    openFleet: 'Open the Fleet page to see which worker nodes are Ready, which harnesses each one reports, and their probe details.',
    openAgent: 'Open this run\'s agent to check its deployments, including each deployment\'s node pool and node selectors.',
    homeBanner: 'Queued runs that no Ready worker can run right now. They stay queued until a capable worker appears, or fail once Runtime.FailBlockedAfterSeconds is set and passes.',
    showRuns: 'Open the Runs page filtered to queued runs. Blocked runs carry a warning badge that explains the reason.',
    queueColumn: 'Queued runs in this group that no Ready worker can run right now. Hover the badge for the reason and what to do.'
  },
  enums: {
    runBlockedReason: {
      NoReadyWorker: 'Blocked: no worker node is Ready, so nothing can take this run. Start a worker or register a new one, then check the Fleet page for nodes that are Lost, Offline, Draining, or Cordoned.',
      NoCapableWorker: 'Blocked: worker nodes are Ready, but none reports this run\'s harness as available. Start or register a worker with the harness installed, or check its credentials and probe results on the Fleet page.',
      NoMatchingPool: 'Blocked: a Ready worker can run this harness, but none matches the deployment\'s node pool, the pool\'s tenant restriction, or its node selectors. Check the deployment\'s placement, or add a worker to that pool.'
    },
    runStatus: {
      Pending: 'Pending: the run was accepted and is being prepared before it joins the queue.',
      Queued: 'Queued: waiting for a worker node with a matching harness and placement to lease it.',
      Leased: 'Leased: a worker node claimed the run and is preparing the workspace.',
      Running: 'Running: the harness process is executing on a worker node.',
      Cancelling: 'Cancelling: a stop was requested and the worker is shutting the harness down.',
      Succeeded: 'Succeeded: the harness finished and produced a valid result.',
      Failed: 'Failed: the run ended with an error. The outcome column says why.',
      Cancelled: 'Cancelled: someone stopped the run before it finished.',
      TimedOut: 'Timed out: the run hit its deadline and was stopped.',
      Rejected: 'Rejected: the run could not start, for example because no deployment was active.'
    },
    runOutcome: {
      None: 'The run has not finished, so there is no outcome yet.',
      Succeeded: 'The harness finished and its result passed validation.',
      HarnessFailed: 'The harness reported a failure or exited without a usable result. Check stderr and the transcript.',
      NotInstalled: 'The harness executable was not found on the worker node.',
      NotCredentialed: 'The harness had no usable credentials. Bind a secret to the deployment.',
      McpPreflightFailed: 'A required MCP server or tool was unreachable when the worker checked before launch.',
      NodeLost: 'The worker node stopped heartbeating while it held the run.',
      OutputLimitExceeded: 'The harness wrote more output than the profile allows.',
      SchemaValidationFailed: 'The result did not match the agent\'s output JSON Schema, even after one repair attempt.',
      TimedOut: 'The run reached its deadline.',
      Cancelled: 'The run was cancelled on request.',
      StaleLease: 'The worker reported back after losing its lease, so its result was ignored.',
      CompileFailed: 'The deployment could not be compiled, for example because of a missing template variable.',
      WorkspaceFailed: 'The workspace could not be prepared, for example because a Git clone failed.',
      Rejected: 'The request was rejected before a run could start.',
      InternalError: 'Garrison hit an internal error. The server logs have details.',
      NoCapableWorker: 'The run waited in the queue longer than the cluster setting Runtime.FailBlockedAfterSeconds allows, and no Ready worker could run it, so it was failed.'
    },
    nodeStatus: {
      Ready: 'Ready: heartbeating and accepting new runs.',
      Draining: 'Draining: finishing its current runs and accepting no new ones.',
      Cordoned: 'Cordoned: accepting no new runs; current runs continue normally.',
      Lost: 'Lost: missed its heartbeats. Its runs are requeued or failed.',
      Offline: 'Offline: shut down cleanly and holds no runs.'
    },
    harnessType: {
      ClaudeCode: 'Anthropic Claude Code CLI, run headless with stream-JSON output.',
      Codex: 'OpenAI Codex CLI, run with exec and JSONL output.',
      Mux: 'Mux CLI with JSONL output; works with local and hosted model endpoints.',
      GeminiCli: 'Google Gemini CLI with stream-JSON output.',
      Generic: 'Any other command-line agent, described entirely by the harness profile.'
    },
    agentKind: {
      Hosted: 'Hosted: Garrison runs this agent itself through its deployments on worker nodes.',
      Remote: 'Remote: the agent runs elsewhere and Garrison forwards calls to its A2A or MCP endpoint.'
    },
    secretKind: {
      AnthropicApiKey: 'An Anthropic API key, injected as ANTHROPIC_API_KEY by the Claude Code profile.',
      ClaudeCodeOAuthToken: 'A Claude Code subscription token. Check provider terms before using it on shared servers.',
      OpenAiApiKey: 'An OpenAI API key for Codex or other OpenAI-backed harnesses.',
      CodexAuthJson: 'The contents of a Codex auth.json file, written into the run HOME.',
      GeminiApiKey: 'A Google Gemini API key for the Gemini CLI.',
      GenericEnv: 'Any value meant for an environment variable.',
      GenericFile: 'Any value meant to be written into a file.',
      BearerToken: 'A bearer token, typically used in an MCP server Authorization header.',
      BasicAuth: 'A user name and password pair for basic authentication.',
      GitCredential: 'A token or password used to clone private Git repositories for workspaces.'
    },
    workspaceKind: {
      Empty: 'Each run starts in a new empty directory.',
      GitRepository: 'Each run starts with a fresh clone of a Git repository.',
      Seeded: 'Each run starts with the files listed in the template.'
    },
    promptTemplateKind: {
      System: 'A system prompt: the standing instructions that set up the agent.',
      Task: 'A task prompt: wraps the caller\'s message into what the harness receives.',
      Fragment: 'A reusable piece included by other templates with {{> name}}.',
      ToolDescription: 'Text that describes an agent as an MCP tool or A2A skill.',
      ConfigFile: 'The content of a generated configuration file, such as an MCP config.',
      Other: 'Any other text a harness profile renders.'
    },
    mcpTransport: {
      Http: 'Garrison and the harness reach the server over streamable HTTP at a URL.',
      Stdio: 'The harness starts the server as a local process and talks to it over stdin and stdout.'
    },
    permissionType: {
      Permit: 'Permit: allows the listed operations.',
      Deny: 'Deny: blocks the listed operations, even when another permission allows them.'
    },
    artifactStoreKind: {
      Database: 'Artifacts are stored in the Garrison database. Simple, but best for small files.',
      Filesystem: 'Artifacts are written to a directory the server can reach.',
      S3: 'Artifacts are uploaded to an S3-compatible bucket.'
    },
    manifestApplyResult: {
      Created: 'This document created a new record.',
      Updated: 'This document changed an existing record.',
      Unchanged: 'The record already matched this document, so nothing changed.',
      Failed: 'This document failed validation. Nothing in the manifest was written.',
      Validated: 'Dry run: this document is valid and would be applied.'
    },
    auditEventType: {
      AuthSuccess: 'Someone signed in or authenticated a request successfully.',
      AuthFailure: 'A sign-in or authentication attempt failed. Repeated failures can mean someone is guessing.',
      SessionIssued: 'A session token was issued.',
      SessionRevoked: 'A session token was revoked, for example by signing out.',
      CredentialCreated: 'A new access key was created.',
      CredentialRotated: 'An access key\'s secret was replaced.',
      CredentialUsed: 'An access key was used to authenticate.',
      AuthorizationDenied: 'A request was refused because the caller lacked permission.',
      AuthorizationBypass: 'A request skipped authorization through a bypass rule, such as a system administrator.',
      RoleChanged: 'A role was created, changed, or deleted.',
      PermissionChanged: 'A permission was created, changed, or deleted.',
      AssignmentChanged: 'A role assignment was created, changed, or deleted.',
      ConfigurationChanged: 'An agent, deployment, profile, template, or other configuration record changed.',
      SecretChanged: 'A secret was created, changed, rotated, or deleted.',
      SettingsChanged: 'Server settings were changed.',
      RestartRequested: 'Someone asked the server to restart.',
      ManifestApplied: 'A manifest was applied to the tenant.',
      NodeRegistered: 'A worker node registered with the control plane.',
      NodeStatusChanged: 'A worker node was cordoned, drained, lost, or came back.',
      RunCancelled: 'A run was cancelled by a user, an access key, or its parent run.'
    }
  },
  resources: {
    tenants: {
      add: 'Create a new tenant: an isolated space with its own users, agents, secrets, and runs.',
      name: 'Display name of the tenant. People pick the tenant by its ID when they sign in.',
      description: 'Who or what this tenant is for, for example a team or customer.',
      active: 'Inactive tenants cannot sign in or run agents. Their data is kept.'
    },
    users: {
      add: 'Create a person who signs in with email and password. Give them access with a role assignment afterwards.',
      email: 'The address the person signs in with. Unique within the tenant.',
      name: 'First and last name, shown in audit records and lists.',
      role: 'Administrator level of the account. Ordinary users get access through role assignments.',
      password: 'Sign-in password. When editing, leave it empty to keep the current password.',
      firstName: 'Given name, shown in lists and audit records.',
      lastName: 'Family name, shown in lists and audit records.',
      isTenantAdmin: 'Tenant administrators can manage everything inside this tenant, including users and secrets.',
      isAdmin: 'System administrators manage every tenant and bypass authorization. Grant sparingly.',
      active: 'Inactive users cannot sign in, and their access keys stop working.',
      actions: { permissions: 'Show every permission this user ends up with after combining all roles and assignments.' }
    },
    credentials: {
      add: 'Create an access key for a script, SDK, or service. The secret is shown once after saving.',
      name: 'What this key is for, for example ci-pipeline. Helps you find it before rotating or deleting.',
      accessKey: 'The public half of the key, sent with every request. Safe to store in configuration.',
      secretKeyLast4: 'The last four characters of the secret, so you can match a key without seeing it.',
      userId: 'The user who owns this key. A key can never do more than its owner.',
      lastUsedUtc: 'When the key last authenticated a request. Old dates point to unused keys you can delete.',
      authMode: 'How the key may authenticate: sent directly, signed per request, exchanged for a session, or any of these (Hybrid).',
      expiresUtc: 'After this time the key stops working. Leave empty for a key that does not expire.',
      active: 'Inactive keys are rejected but kept, so you can turn them back on.',
      actions: {
        rotate: 'Replace the secret with a new one. The old secret stops working immediately; the new one is shown once.',
        permissions: 'Show every permission this key ends up with after combining its owner, roles, and assignments.'
      }
    },
    roles: {
      add: 'Create a custom role, then add permissions to it and assign it to users or keys.',
      name: 'Name people see when assigning the role, for example Release Operator.',
      description: 'What the role is for and who should get it.',
      active: 'Inactive roles grant nothing, even where they are assigned.',
      actions: { clone: 'Make an editable copy of this built-in role that you can adjust.' }
    },
    permissions: {
      add: 'Create a rule that permits or denies operations on resource types.',
      name: 'Short name for the rule, shown when you build roles.',
      permissionType: 'Permit allows the operations below. Deny blocks them and always wins over a permit.',
      resourceTypes: 'Which kinds of records the rule covers. All covers every type.',
      operationTypes: 'Which operations the rule covers, such as Read, Create, or Execute (invoke).',
      active: 'Inactive permissions have no effect.'
    },
    userAssignments: {
      add: 'Give a user a role, for the whole tenant or for one specific record.',
      userId: 'The person who receives the role.',
      roleName: 'The role granted. The person gets every permission in it.',
      roleId: 'The role to grant. The person gets every permission in it.',
      resourceScope: 'Tenant applies the role to every record. Resource limits it to the one record named below.',
      resourceId: 'Identifier of the single record the role applies to, for example an agent ID.',
      inheritsToChildren: 'Apply the role to every record in the tenant, including ones created later.',
      active: 'Inactive assignments grant nothing but are kept.'
    },
    credentialAssignments: {
      add: 'Give an access key a role, for the whole tenant or for one specific record.',
      credentialId: 'The access key that receives the role. It still cannot exceed its owner.',
      roleName: 'The role granted to the key.',
      roleId: 'The role to grant. Pick the narrowest role that lets the automation do its job.',
      resourceScope: 'Tenant applies the role to every record. Resource limits it to the one record named below.',
      resourceId: 'Identifier of the single record the role applies to, for example the one agent a CI job may invoke.',
      inheritsToChildren: 'Apply the role to every record in the tenant, including ones created later.',
      active: 'Inactive assignments grant nothing but are kept.'
    },
    harnessProfiles: {
      add: 'Describe a new way to launch a CLI agent headless. Cloning a built-in profile is usually easier.',
      name: 'Profile name. Deployments choose a profile by this name. The builtin/ prefix is reserved.',
      harnessType: 'Which harness this profile launches. Workers advertise the types they can run, which drives placement.',
      executable: 'Command to run on the worker, found on PATH or given as an absolute path, for example claude.',
      outputParser: 'How the harness output is turned into transcript events and a final result.',
      description: 'What is special about this profile, for example which flags it adds.',
      probeArguments: 'Arguments for a version check that spends no tokens, such as --version. Workers run it at startup.',
      active: 'Inactive profiles cannot be used by new runs.',
      arguments: 'Ordered command-line arguments. Each one is a template, may be skipped by a condition, and may repeat over a list.',
      argumentsItems: {
        template: 'Text of one argument, for example --model or {{deployment.model}}.',
        condition: 'Template expression; when it renders empty or false this argument is skipped.',
        repeatOver: 'Name of a list variable; the argument is emitted once per element.'
      },
      promptDelivery: 'How the task prompt reaches the harness: on standard input, as an argument, or in a file.',
      promptArgumentTemplate: 'The argument or file name used when the prompt is not sent on standard input.',
      systemPromptDelivery: 'How the system prompt reaches the harness: a file, an argument, an environment variable, prepended to the task, or not at all.',
      systemPromptTarget: 'The flag, variable, or file name that carries the system prompt.',
      mcpConfigFormat: 'Which MCP configuration format this harness reads. Garrison writes the run\'s bound MCP servers in it.',
      mcpConfigFileName: 'File name of the generated MCP configuration, inside the run config directory.',
      environment: 'Environment variables for the process. Values are templates; {{secret.alias}} pulls in a bound secret.',
      environmentItems: {
        name: 'Variable name, for example ANTHROPIC_API_KEY.',
        valueTemplate: 'Template for the value. Use {{secret.alias}} for credentials.',
        condition: 'Template expression; when it renders empty or false the variable is not set.',
        isSecret: 'Treat the value as secret: never logged and redacted in previews.'
      },
      files: 'Files written before launch, such as settings files or auth.json.',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: 'Environment variable names that may be filled from secrets for this harness. Anything else is refused.',
      genericTextField: 'JSON path to the assistant text in each output line, for the Generic JSONL parser.',
      genericFinalField: 'JSON path to the final result text, for the Generic JSONL parser.',
      genericSuccessField: 'JSON path that tells whether the run succeeded, for the Generic JSONL parser.',
      genericSuccessValue: 'The value at the success path that means the run succeeded, for example true.',
      resultSource: 'Where the final answer comes from: the parser\'s final event, a last-message file, or all of standard output.',
      resultFileName: 'Name of the file the harness writes its last message to, when the result source is a file.',
      successPolicy: 'How success is decided: by the final parser event, by the exit code, or by both.',
      successExitCodes: 'Exit codes that count as success when the policy uses exit codes. One per line.',
      defaultTimeoutSeconds: 'Run deadline in seconds when the deployment sets none. Between 5 and 86400.',
      killGraceSeconds: 'Seconds between asking the process to stop and killing its process tree. Between 0 and 60.',
      maxOutputBytes: 'Most standard output a run may produce before it fails as Output limit exceeded.',
      stderrTailBytes: 'How much of the end of standard error to keep for the run detail page.',
      isolateHome: 'Give every run its own HOME directory so harness settings and caches never leak between runs.',
      supportsResume: 'Whether this harness can resume an earlier session. Used by conversations.',
      steps: {
        basics: 'Name, harness type, executable, and the version probe.',
        invocation: 'Arguments, prompt delivery, MCP configuration, environment, and files.',
        output: 'How output is parsed and how success is decided.',
        limits: 'Timeouts, output limits, and HOME isolation.'
      },
      actions: { clone: 'Make an editable copy of this profile in your tenant, named with a -custom suffix.' }
    },
    promptTemplates: {
      add: 'Write a new prompt template in the editor with live preview. Each save becomes a version.',
      name: 'Template name. Deployments and other templates refer to it by this name.',
      kind: 'What the template is used for: system prompt, task wrapper, fragment, tool description, or config file.',
      currentVersion: 'The newest saved version. Deployments either pin a version or follow the newest.',
      description: 'What the template does and where it is used.'
    },
    mcpServers: {
      add: 'Register an MCP server so deployments can bind it and their agents can use its tools.',
      name: 'Server name. Deployments bind it by this name and give it an alias.',
      transport: 'HTTP servers are reached at a URL; stdio servers are started by the harness as a local process.',
      endpoint: 'Where the server is reached: its URL and path, or the command for a stdio server.',
      required: 'When on, a run fails before launch if this server or its required tools are unreachable.',
      description: 'What tools this server offers and which agents should use it.',
      url: 'Base URL of the server as the worker nodes can reach it, without the MCP path.',
      path: 'Path of the MCP endpoint on that server, usually /mcp.',
      headers: 'HTTP headers sent to the server, such as Authorization. Values may use {{secret.alias}}.',
      headersItems: {
        name: 'Header name, for example Authorization.',
        valueTemplate: 'Header value template, for example Bearer {{secret.github}}.'
      },
      command: 'Executable that starts the stdio server on the worker.',
      arguments: 'Arguments for the stdio server command, one per line.',
      environment: 'Environment variables for the stdio server process. Values may use {{secret.alias}}.',
      environmentItems: {
        name: 'Variable name for the server process.',
        valueTemplate: 'Value template. Use {{secret.alias}} for credentials.'
      },
      requiredTools: 'Tools that must exist on this server. The worker checks before launch and fails the run if one is missing.',
      toolTimeoutSeconds: 'How long a single tool call may take before the harness gives up on it.',
      active: 'Inactive servers are left out of new runs even where a deployment binds them.',
      actions: { test: 'Connect to the server now and list its tools, to check the address and credentials.' }
    },
    secrets: {
      add: 'Store a new credential, such as an API key or token, encrypted at rest. Deployments reference it by alias; the value is never shown again after saving.',
      name: 'Secret name. Deployments pick the secret by this name and give it an alias.',
      kind: 'What sort of credential this is. Built-in profiles use the kind to know which variable or file to fill.',
      valueLast4: 'The last four characters of the stored value, so you can tell secrets apart without revealing them.',
      rotatedUtc: 'When the value was last set or rotated.',
      expiresUtc: 'Informational expiry. Rotate the value before this date.',
      description: 'Where the value came from and which agents need it.',
      value: 'The secret value. It is encrypted when saved and can never be read back, only replaced.',
      newValue: 'The replacement value. It takes effect for every run compiled after you save.',
      active: 'Inactive secrets are not injected into runs.',
      saveValue: 'Encrypt and store the new value. The old value is discarded and cannot be recovered.',
      actions: {
        setValue: 'Replace the stored value with a new one you type in. The old value cannot be recovered.',
        rotate: 'Swap in a new value and record the rotation time, for example after the provider issued a new key.'
      }
    },
    workspaces: {
      add: 'Define how a run\'s working directory is prepared: empty, cloned from Git, or seeded with files.',
      name: 'Template name. Deployments pick a workspace template by this name.',
      kind: 'Empty starts with nothing, Git repository clones a repo, Seeded writes the files listed below.',
      gitUrl: 'Repository to clone for each run. Private repositories need a Git credential secret.',
      retention: 'What happens to the directory after the run: delete it, keep it, or keep it only when the run failed.',
      description: 'What the workspace contains and which agents use it.',
      gitRef: 'Branch, tag, or commit to check out. Leave empty for the default branch.',
      gitDepth: 'How many commits to fetch. 1 is fastest; 0 fetches the full history.',
      gitCredentialSecretId: 'Secret holding the token or password used to clone a private repository.',
      files: 'Files written into the workspace before the run starts.',
      filesItems: {
        path: 'Path of the file relative to the workspace root.',
        content: 'Text content of the file.'
      },
      active: 'Inactive templates cannot be used by new runs.'
    },
    artifactStores: {
      add: 'Create a destination for files runs produce, so they outlive the run\'s workspace.',
      name: 'Store name. Deployments pick an artifact store by this name.',
      kind: 'Where files are kept: the Garrison database, a filesystem directory, or an S3 bucket.',
      description: 'What is stored here and how long it should be kept.',
      active: 'Inactive stores receive no new artifacts.'
    },
    agents: {
      add: 'Create a new agent identity. It does nothing until you add at least one deployment for it.',
      name: 'DNS-safe name callers use to invoke the agent over REST, MCP, and A2A. Lowercase letters, digits, and hyphens.',
      displayName: 'Friendly name shown in the console and the A2A agent card.',
      kind: 'Hosted agents run here through deployments. Remote agents run elsewhere and are called through their endpoint.',
      exposure: 'Which protocols advertise the agent: A2A gives it an agent card; MCP makes it a tool for MCP clients.',
      delegationMode: 'Which other agents this agent\'s runs may invoke: none, an allow list, or any agent.',
      tags: 'Labels for finding and grouping agents. They have no effect on how the agent runs.',
      description: 'What the agent does, in plain words. It is shown to callers and in the A2A card, so write it for them.',
      agentVersion: 'Version string advertised in the A2A card. Change it when the agent\'s behavior changes.',
      remoteProtocol: 'How Garrison calls the remote agent: A2A or MCP.',
      remoteEndpointUrl: 'Address of the remote agent\'s A2A or MCP endpoint.',
      exposeA2A: 'Publish an A2A agent card so other A2A agents can discover and call this agent.',
      exposeMcpTool: 'Offer this agent as its own tool on Garrison\'s MCP server, so MCP clients can call it directly.',
      mcpToolName: 'Tool name MCP clients see. Leave empty to use the agent name.',
      skills: 'A2A skills listed in the agent card. They describe what callers can ask for.',
      skillsItems: {
        skillId: 'Stable identifier of the skill in the A2A card.',
        name: 'Short skill name shown to A2A callers.',
        description: 'What the skill does, written for the calling agent.'
      },
      inputMode: 'Text accepts a plain message. Structured requires input that matches the input JSON Schema.',
      inputSchemaJson: 'JSON Schema the input must match when the input mode is Structured.',
      outputSchemaJson: 'JSON Schema the result must match. Garrison validates the output and retries once with a repair prompt.',
      delegationAllowList: 'The agents this agent may call when delegation uses an allow list.',
      delegationMaxDepth: 'How many levels of agent-to-agent calls may follow below this agent. Between 0 and 10.',
      delegationAllowRecursion: 'Let the same agent appear twice in one chain of calls. Off prevents loops.',
      active: 'Inactive agents cannot be invoked.',
      sections: {
        identity: 'Who the agent is: its name, description, kind, and version.',
        exposure: 'Which protocols advertise the agent and what skills it lists.',
        io: 'What input the agent accepts and what output it must return.',
        delegation: 'Whether this agent may call other agents, and how deep.'
      }
    },
    deployments: {
      add: 'Create a deployment: the concrete way an agent runs, with a harness profile, model, prompts, and resources.',
      name: 'Deployment name, unique in the tenant, for example reviewer-claude.',
      agentId: 'The agent this deployment runs. Invoking that agent may pick this deployment.',
      harnessProfileId: 'The harness profile that launches the CLI, for example builtin/claude-code.',
      model: 'Model name passed to the harness, for example sonnet or gpt-5. Available to templates as deployment.model.',
      weight: 'Traffic weight among the agent\'s active deployments. A deployment with weight 300 gets three times the calls of one with 100.',
      configVersion: 'Increases on every change. Each run records the version it was compiled from.',
      description: 'How this deployment differs from the agent\'s others, for example a cheaper model.',
      active: 'Inactive deployments receive no weighted traffic, but callers can still name them explicitly.',
      fallbackModel: 'Model to use when the main model is overloaded, if the harness supports it.',
      effort: 'Reasoning effort hint passed to harnesses that support it, such as low, medium, or high.',
      maxTurns: 'Most agent turns a run may take before the harness stops it.',
      maxBudgetUsd: 'Spending cap per run in US dollars, for harnesses that enforce one.',
      parameters: 'Named values templates can read as deployment.parameters.name.',
      parametersItems: {
        name: 'Parameter name, referenced as deployment.parameters.name.',
        value: 'Default value. Callers may override it only if it is listed under per-run overrides.'
      },
      promptBindings: 'Which prompt template fills each role (System, Task, DelegatedTask, and so on).',
      promptBindingsItems: {
        role: 'The prompt role this binding fills, such as System or Task.',
        templateId: 'The template used for that role.',
        pinnedVersion: 'Version to pin. Leave empty to always use the newest version.'
      },
      resourceBindings: 'MCP servers and secrets this deployment uses, each under an alias for templates.',
      resourceBindingsItems: {
        kind: 'Whether this binding is an MCP server or a secret.',
        alias: 'Short name templates use, for example anthropic in {{secret.anthropic}}.',
        resourceId: 'The MCP server or secret being bound.'
      },
      workspaceTemplateId: 'How each run\'s working directory is prepared. Empty means a fresh empty directory.',
      artifactStoreId: 'Where files produced by runs are uploaded after they finish.',
      argumentOverrides: 'Changes to the harness profile\'s arguments for this deployment only: append, prepend, replace, or remove.',
      argumentOverridesItems: {
        operation: 'What to do: append, prepend, replace a matching argument, or remove it.',
        match: 'The existing argument to replace or remove.',
        template: 'The new argument text. Templates are allowed.',
        condition: 'Template expression; when it renders empty or false the override is skipped.'
      },
      environmentOverrides: 'Environment variables added or replaced for this deployment only.',
      environmentOverridesItems: {
        name: 'Variable name to add or replace.',
        valueTemplate: 'Value template. Use {{secret.alias}} for bound secrets.',
        isSecret: 'Treat the value as secret: never logged and redacted in previews.'
      },
      fileOverrides: 'Files added or replaced for this deployment only.',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: 'Parameters callers may change per run, with validation. Everything else stays fixed.',
      allowedRunOverridesItems: {
        name: 'Parameter callers may set per run, such as model or tone.',
        validation: 'How the caller\'s value is checked: anything, a list of values, a regular expression, or a number range.',
        pattern: 'Allowed values separated by commas, a regular expression, or min,max for a number range.'
      },
      nodePoolId: 'Run only on nodes in this pool. Leave empty to allow any eligible node.',
      nodeSelector: 'Node labels that must match exactly, for example gpu=true.',
      nodeSelectorItems: {
        key: 'Label name the node must have.',
        value: 'Label value the node must have.'
      },
      maxConcurrentRuns: 'Most runs of this deployment at once across all nodes. 0 means no limit.',
      timeoutSeconds: 'Run deadline in seconds. Empty uses the harness profile default.',
      maxAttempts: 'How many times a run may be attempted in total. Between 1 and 10.',
      retryOnNodeLoss: 'Put the run back in the queue when its node disappears, instead of failing it.',
      steps: {
        basics: 'Name, agent, and traffic weight.',
        harness: 'Harness profile, model, limits, and parameters.',
        prompts: 'Which template fills each prompt role.',
        resources: 'MCP servers, secrets, workspace, and artifact store.',
        overrides: 'Per-deployment changes to arguments, environment, and files, and what callers may override.',
        placement: 'Where runs may execute and how many at once.'
      },
      actions: {
        compilePreview: 'Compile this deployment with a sample message and see the exact command line, files, and environment a run would get.',
        test: 'Open Invoke with this deployment preselected to send it a real message.'
      }
    },
    nodePools: {
      add: 'Create a pool to group nodes and optionally reserve them for certain tenants.',
      name: 'Pool name. Nodes join a pool when they register, and deployments can require one.',
      description: 'What hardware or purpose this pool represents.',
      tenants: 'Tenants allowed to use the pool. Empty means every tenant.',
      active: 'Inactive pools accept no new runs.'
    },
    runs: {
      ...TELEMETRY,
      id: 'Run identifier. Click the row to open the transcript, result, and telemetry.',
      agentName: 'The agent that was invoked. A run always belongs to one deployment of that agent.',
      status: 'Where the run is in its lifecycle: queued, leased, running, or one of the finished states.',
      outcome: 'Why the run ended, in more detail than the status, for example Missing credentials.',
      harnessType: 'The harness that executed the run, taken from the deployment\'s profile.',
      leaseNodeName: 'The worker node that ran it. Empty while the run is still queued.',
      depth: 'How many agent-to-agent calls deep this run is. 0 is a run started directly by a caller.',
      createdUtc: 'When the run was requested. Hover the value for the exact time.',
      actions: {
        cancel: 'Stop this run. The worker terminates the harness process and the run ends as Cancelled.',
        retry: 'Start a new run with the same input and deployment. The original run is kept.'
      }
    },
    nodes: {
      name: 'Node name, usually the Kubernetes pod name of the worker.',
      status: 'Whether the node accepts new runs. Cordon or drain a node before maintenance.',
      capacity: 'Runs the node holds now out of the most it accepts at once.',
      harnesses: 'Harnesses the node found installed and working when it probed them at startup.',
      labels: 'Key and value labels the node advertises. Deployment node selectors match against them.',
      nodeVersion: 'Version of the worker software on the node.',
      lastHeartbeatUtc: 'When the node last checked in. Nodes that stop checking in are marked lost.',
      address: 'Informational address the node reported.',
      maxConcurrentRuns: 'Most runs this node accepts at once.',
      activeRuns: 'Runs the node holds right now.',
      capabilities: 'What each harness probe found: type, detected version, and whether it is usable.',
      labelsItems: { key: 'Label name, matched by deployment node selectors.', value: 'Label value, matched exactly by deployment node selectors.' },
      capabilitiesItems: {
        harnessType: 'Harness the probe checked.',
        detectedVersion: 'Version string the harness reported.',
        available: 'Whether the harness can run on this node.',
        detail: 'Probe output, useful when a harness is unavailable.'
      },
      actions: {
        cordon: 'Stop sending new runs to this node. Runs already on it finish normally.',
        uncordon: 'Let this node accept new runs again.',
        drain: 'Stop new runs and let current ones finish, then the node goes idle. Use before shutting it down.',
        runs: 'Open the Runs list filtered to runs this node executed.'
      }
    },
    audit: {
      createdUtc: 'When the event happened, in your local time zone.',
      eventType: 'What kind of security or configuration event this was.',
      principalName: 'Who did it: a user, an access key, or a run acting for an agent.',
      resource: 'The kind of record and the operation involved, for example Agent / Read.',
      reason: 'Why the event happened or why access was denied.',
      sourceIp: 'Network address the request came from.',
      principalType: 'Whether the actor was a user, an access key, or a run token.',
      principalId: 'Identifier of the user, access key, or run that acted.',
      resourceType: 'Kind of record involved, such as Agent or Secret.',
      resourceId: 'Identifier of the record involved.',
      operation: 'Operation that was attempted, such as Read or Execute.',
      method: 'HTTP method of the request.',
      path: 'Path of the request that caused the event.',
      authResult: 'Outcome of checking who the caller is.',
      authorizationResult: 'Outcome of checking what the caller may do.',
      bypassReason: 'Why authorization was skipped, for example a system administrator.',
      statusCode: 'HTTP status returned to the caller.',
      requestId: 'Request identifier. Search Request History or the server logs with it.'
    },
    manifestApplies: {
      createdUtc: 'When the manifest was applied or dry-run.',
      principalName: 'Who applied it.',
      dryRun: 'Yes means it was only validated and nothing was written.',
      counts: 'How many documents created, updated, left unchanged, or failed records.'
    }
  },
  views: {
    home: {
      kpis: {
        agents: 'Agents defined in this tenant. Click to open the Agents list.',
        deployments: 'Deployments across every agent. Each one is a way an agent can run. Click to open them.',
        activeRuns: 'Runs leased or running on a worker right now. Click to see them.',
        queued: 'Runs waiting for a worker node. A number that keeps growing means you need more nodes or capacity.',
        succeeded: 'Runs that finished successfully in the last 24 hours. Click to list them.',
        failed: 'Runs that failed in the last 24 hours. Click to list them and read why.',
        nodes: 'Worker nodes ready to take runs, out of all registered nodes. Click to manage them.'
      },
      openFailure: 'Open this failed run to read its transcript, error, and stderr.',
      cta: {
        invoke: 'Send a message to any agent from the browser.',
        addAgent: 'Go to Agents to create a new agent identity.',
        applyManifest: 'Apply configuration as YAML, for example a sample agent.',
        inspectRuns: 'Browse every run with filters and telemetry.',
        nodes: 'See which worker nodes are ready and what they can run.',
        apiExplorer: 'Try any API call live against this server.',
        analytics: 'See run speed, tokens, cost, and outcomes over time.'
      },
      services: {
        grafana: 'Open Grafana dashboards for Garrison metrics in a new tab.',
        prometheus: 'Open the Prometheus server that scrapes Garrison metrics in a new tab.',
        tempo: 'Open Tempo to browse traces in a new tab.'
      },
      serviceGeneric: 'Open this bundled service in a new tab.'
    },
    runDetail: {
      live: 'Events are streaming live from the server as the harness produces them.',
      viewJson: 'Show the complete run record as JSON, including every telemetry field.',
      deployment: 'The deployment that was selected for this run, by name or by traffic weight.',
      model: 'The model the harness reported it actually used, which can differ from the deployment\'s requested model.',
      tokens: 'Input and output tokens for the whole run. The telemetry panel below has the full breakdown.',
      caller: 'Who started the run: a user, an access key, or another agent\'s run.',
      parent: 'The run that delegated to this one, when an agent called another agent.',
      openParent: 'Open the parent run that delegated this work.',
      attempt: 'Which attempt this is, out of the most the deployment allows.',
      created: 'When the run was requested.',
      started: 'When the harness process started on the worker.',
      completed: 'When the run reached its final state.',
      exitCode: 'Exit code of the harness process. Success is usually judged from the final event, not this code.',
      tabs: {
        transcript: 'Every event the harness produced: assistant text, thinking, tool calls and results, and usage.',
        result: 'The final answer and any structured output.',
        input: 'What the caller sent, the parameters, and the exact prompt template versions used.',
        stderr: 'The last part of the harness\'s standard error, with secrets scrubbed. Look here when a run fails.',
        children: 'Runs this run started by calling other agents.'
      },
      eventFilter: 'Show only one type of event, such as tool calls or errors.',
      openChild: 'Open this child run, started when this run called another agent.'
    },
    agentDetail: {
      name: 'The name callers use to invoke this agent.',
      viewJson: 'Show the full agent record as JSON.',
      invoke: 'Open Invoke with this agent selected. A deployment is picked by weight unless you choose one.',
      id: 'Agent identifier for API calls.',
      tabs: {
        deployments: 'The ways this agent runs, with their weights and the share of traffic each one receives.',
        runs: 'The most recent runs of this agent.',
        card: 'The A2A agent card other agents read to discover this agent.'
      },
      addDeployment: 'Go to Deployments to create one for this agent. Without one it cannot run.',
      manageDeployments: 'Open the Deployments tab to edit weights, models, and bindings.',
      openRun: 'Open this run\'s transcript and telemetry.',
      columns: {
        name: 'Deployment name. Callers can name it explicitly to bypass the weighted choice.',
        harness: 'The harness profile that launches the CLI for this deployment.',
        model: 'The model this deployment asks the harness to use.',
        weight: 'The raw traffic weight set on the deployment.',
        traffic: 'Share of invocations this deployment receives: its weight divided by the sum of active weights.',
        active: 'Only active deployments receive weighted traffic.'
      }
    },
    queue: {
      queued: 'Runs waiting for a node. Click to list them.',
      leased: 'Runs a node has claimed but not started yet. Click to list them.',
      running: 'Runs executing now. Click to list them.',
      agent: 'The agent the waiting work belongs to.',
      harness: 'The harness those runs need. Only nodes that advertise it can take them.'
    },
    invoke: {
      applySample: 'Go to Manifests, where the sample manifest creates an agent you can try right away.',
      agent: 'The agent to call. Only active agents are listed.',
      deployment: 'Leave on Any to let Garrison pick by traffic weight, or choose one deployment to test it directly.',
      parameter: 'Per-run value for {{name}}. The deployment allows callers to override it; leave empty for the default.',
      message: 'What you want the agent to do. It is sent as the run input and wrapped by the task template.',
      send: 'Start a run with this message and stream its transcript here.',
      openRun: 'Open the full run page with result, telemetry, and stderr.'
    },
    manifests: {
      results: 'What the apply did with each document in the manifest.',
      kind: 'The kind of record the document describes, such as Agent or Deployment.',
      name: 'The record name from the document metadata.',
      result: 'Whether the document created, updated, or left a record unchanged, or failed.',
      message: 'Details from the server, such as a validation error.',
      tabs: {
        apply: 'Paste or upload a manifest, validate it with a dry run, and apply it.',
        export: 'Download this tenant\'s configuration as a manifest. Secret values are never included.',
        history: 'Every past apply and dry run, with per-document results.'
      },
      upload: 'Load a YAML or JSON manifest file from your computer into the editor.',
      loadSample: 'Replace the editor content with the sample manifest: an echo agent on the fake harness.',
      document: 'One or more YAML or JSON documents separated by ---. Records refer to each other by name.',
      dryRun: 'Validate every document and show what would change, without writing anything.',
      apply: 'Validate and write every document. If any document fails, nothing is written.',
      export: 'Generate a manifest that recreates this tenant\'s configuration.',
      download: 'Save the exported manifest as a YAML file.',
      confirmApply: 'Write the manifest to this tenant now.'
    },
    templateEditor: {
      clone: 'Make an editable copy of this template with a -custom suffix.',
      reset: 'Restore this built-in template to the content Garrison ships with.',
      delete: 'Delete this template. Deployments that bind it will fail to compile.',
      create: 'Create the template and its first version.',
      save: 'Save the content as a new version. Deployments that follow the newest version pick it up for new runs.',
      content: 'The template text. Use {{variables}}, conditions, loops, and includes; the preview updates as you type.',
      changeNote: 'A short note saved with the version, explaining what changed and why.',
      tabs: {
        preview: 'Render the template against the sample context to see exactly what a harness would receive.',
        versions: 'Every saved version, with diff and restore.'
      },
      sampleContext: 'JSON standing in for a real run\'s data. Edit it to see how the template reacts.',
      columns: {
        version: 'Version number. Higher is newer.',
        note: 'The change note saved with the version.',
        author: 'Who saved this version of the template.',
        saved: 'When the version was saved.'
      },
      diff: 'Compare this version with what is in the editor now.',
      restore: 'Make this version current again. The current content stays in history.'
    },
    serverInfo: {
      rest: 'Base address for REST API calls and SDKs.',
      mcp: 'Address MCP clients connect to. Each agent exposed as a tool appears there.',
      a2a: 'Base address of the A2A gateway for this tenant. Each agent has its own card below it.',
      openapi: 'The OpenAPI document that describes every REST operation.',
      version: 'Version of the Garrison server.',
      dashboardVersion: 'Version of this console.',
      node: 'Which control-plane replica answered.',
      database: 'Database engine the server uses.',
      health: 'Result of the server health check.',
      replicas: 'How many control-plane replicas the cluster expects.',
      routes: 'How many API operations the server registered.',
      serverTime: 'The server clock. Large differences from your clock can break signed requests.',
      principalName: 'The identity you are signed in as.',
      principalType: 'Whether you signed in as a user or with an access key.',
      role: 'Your highest access level.',
      tenant: 'The tenant your session belongs to.',
      expires: 'When your session ends and you must sign in again.',
      rawJson: 'Show the raw server info response.'
    },
    requests: {
      kpis: {
        total: 'Requests the server kept in its history for the selected range and filters.',
        success: 'Requests that returned a 2xx or 3xx status.',
        failure: 'Requests that returned a 4xx or 5xx status.',
        avgDuration: 'Average time the server took to answer.'
      },
      columns: {
        time: 'When the request arrived.',
        method: 'HTTP method of the request.',
        path: 'Path that was called. Hover a value to see it in full.',
        status: 'HTTP status the server returned.',
        duration: 'How long the server took to answer.',
        principal: 'Who made the request: a user, an access key, or a run token.'
      },
      viewDetails: 'Open the request with headers, bodies, and timing.',
      viewJson: 'Open the request record, including its raw JSON.',
      deleteOne: 'Remove this request from the history.',
      bulkDeleteAll: 'Delete every request that matches the current filters, not just this page.'
    },
    explorer: {
      operations: 'Pick an API operation, grouped by area. The form below adapts to its parameters.',
      pathParam: 'Path parameter {{name}} ({{type}}). It is substituted into the URL. {{description}}',
      queryParam: 'Query parameter {{name}} ({{type}}). It is appended to the URL when filled in. {{description}}',
      copyUrl: 'Copy the fully resolved request URL.',
      headerName: 'Name of a request header. Authorization is added for you from your session.',
      headerValue: 'Value sent for this header.',
      removeHeader: 'Remove this header from the request.',
      addHeader: 'Add another request header.',
      body: 'JSON request body for operations that create or change records.',
      execute: 'Send the request to the server now with your session. Destructive methods ask for confirmation.',
      stop: 'Abort the request or stop reading a streaming response.',
      snippets: {
        curl: 'The same request as a curl command for a terminal.',
        fetch: 'The same request as JavaScript fetch code.',
        csharp: 'The same request as C# HttpClient code.'
      },
      clearHistory: 'Forget every recent request stored in this browser.',
      loadHistory: 'Load this request back into the form.',
      deleteHistory: 'Remove this entry from the recent requests list.',
      confirmExecute: 'Send this request even though it may change or delete data.'
    },
    settings: {
      viewJson: 'Show the raw settings response.',
      restart: 'Restart this control-plane replica so restart-required settings take effect.',
      save: 'Save every changed setting. Live settings apply at once; others wait for a restart.',
      groupGeneric: 'Settings in the {{group}} group.',
      fieldGeneric: 'Server setting {{path}}.',
      applyLive: 'Applies immediately when saved.',
      applyRestart: 'Takes effect after the server restarts.',
      source: {
        File: 'Currently set in the settings file. Saving here updates it.',
        Environment: 'Set by an environment variable, which wins over any value saved here.',
        ConfigMap: 'Managed by a Kubernetes ConfigMap. Change it in your manifests instead.',
        Database: 'Stored as a cluster setting in the database, shared by every replica.'
      },
      sourceGeneric: 'Where the current value comes from.',
      testDatabase: 'Try connecting with the database settings above before saving them.',
      groups: {
        Runtime: 'How the control plane treats queued runs, including how long a run may wait for a capable worker before it fails.',
        Rest: 'How the REST API listens: host, port, TLS, and public address.',
        Mcp: 'How the MCP server listens and how long tool calls may wait.',
        Database: 'Which database Garrison uses and how to connect.',
        Logging: 'Where logs go and how detailed they are.',
        Auth: 'Token signing, lifetimes, and sign-in rate limits.',
        Security: 'Encryption master key and bootstrap accounts.',
        RequestHistory: 'Whether API requests are captured and how much of each body is kept.',
        Telemetry: 'Metrics and tracing export.',
        Cluster: 'How many control-plane replicas are expected.',
        Scheduling: 'Lease lengths and heartbeat timeouts for worker nodes.',
        Runs: 'Run defaults and how long runs and events are retained.',
        Audit: 'How long audit records are kept.'
      }
    }
  },
  analytics: {
    filters: {
      from: 'Start of the custom range, in your local time zone.',
      to: 'End of the custom range, in your local time zone.',
      agentId: 'Count only runs of this agent. The deployment list narrows to its deployments.',
      harnessType: 'Count only runs executed by this harness.',
      deploymentId: 'Count only runs of this deployment, for example to compare two models of one agent.',
      model: 'Count only runs whose harness reported this served model. The list shows models seen in the selected range.',
      groupBy: 'Split every chart into one series per agent, harness, model, or harness and model pair, so you can compare them.'
    },
    cards: {
      runs: 'Runs requested in the range that match the filters.',
      successRate: 'Succeeded runs as a share of finished runs (succeeded, failed, cancelled, and timed out).',
      ttft: 'Average time to first token across runs that produced output. The note shows the 95th percentile.',
      execution: 'Average harness execution time. The note shows the 95th percentile, which reflects your slow runs.',
      queue: 'Average time runs waited for a worker node.',
      tokens: 'Input plus output tokens across all runs in the range.',
      throughput: 'Average output tokens per second while streaming.',
      cost: 'Total reported cost in US dollars.',
      toolCalls: 'Total tool calls made by runs in the range.'
    },
    charts: {
      outcomes: 'How runs ended in each time bucket. Hover a bar to see the counts.',
      ttft: 'How long runs took to produce their first token: average, median, and 95th percentile.',
      duration: 'How long the model streamed and how long the harness ran in total.',
      queue: 'How long runs waited before a node leased them.',
      tokens: 'Tokens consumed per bucket, split by kind.',
      throughput: 'Output generation speed in tokens per second.',
      cost: 'Reported spend per bucket.',
      toolCalls: 'Tool calls made per bucket.',
      usageTokens: 'Input plus output tokens over time, one stacked segment per harness and model pair. Hover a bar for the split.',
      usageCost: 'Reported cost over time, one stacked segment per harness and model pair. Hover a bar for the split.'
    },
    metrics: {
      runs: 'Runs requested in the bucket.',
      succeeded: 'Runs that finished successfully. Click to hide or show this series.',
      failed: 'Runs that failed. Click to hide or show this series.',
      cancelled: 'Runs that were cancelled. Click to hide or show this series.',
      timedOut: 'Runs that hit their deadline. Click to hide or show this series.',
      inputTokens: 'Input tokens sent to the model. Click to hide or show this series.',
      outputTokens: 'Output tokens the model generated. Click to hide or show this series.',
      cachedTokens: 'Input tokens served from the prompt cache. Click to hide or show this series.',
      reasoningTokens: 'Reasoning tokens, where the harness reports them. Click to hide or show this series.',
      totalTokens: 'Input tokens plus output tokens for the runs in each bucket.',
      costUsd: 'Reported cost in US dollars.',
      toolCalls: 'Tool calls made by runs in each bucket. Click to hide or show this series.',
      timeToFirstTokenMsAvg: 'Mean time to first token in the bucket. Click to hide or show this line.',
      timeToFirstTokenMsP50: 'Median time to first token: half the runs were faster. Click to hide or show this line.',
      timeToFirstTokenMsP95: '95th percentile time to first token: only 1 in 20 runs was slower. Click to hide or show this line.',
      streamingMsAvg: 'Mean streaming time, first to last model output. Click to hide or show this line.',
      executionMsAvg: 'Mean harness execution time, process start to exit. Click to hide or show this line.',
      executionMsP95: '95th percentile execution time. Click to hide or show this line.',
      queueMsAvg: 'Mean time from queued to leased.',
      outputTokensPerSecondAvg: 'Mean output tokens per second while streaming.'
    },
    groupSeries: {
      none: '{{name}}: {{metric}}.',
      agent: 'Runs of agent {{name}}: {{metric}}. Click to hide or show this series.',
      harness: 'Runs on the {{name}} harness: {{metric}}. Click to hide or show this series.',
      model: 'Runs served by model {{name}}: {{metric}}. Click to hide or show this series.',
      harnessModel: 'Runs on {{name}} (harness / model): {{metric}}. Click to hide or show this series.'
    },
    otherSeries: 'Every group outside the busiest ones, added together. Click to hide or show it.',
    dataTable: 'Show the numbers behind this chart as a table, one row per time bucket.',
    bucketStart: 'Start of the time bucket. Each row covers one bucket.',
    usage: 'Usage over time split by harness and model, regardless of the group-by setting above, with totals for the whole range.',
    breakdown: 'Totals for the selected range per harness and model pair. Use it to see which model drives your token use and cost.',
    breakdownColumns: {
      harness: 'The harness that ran these runs.',
      model: 'The model the harness reported serving. Unknown means the harness did not report one.',
      runs: 'Runs on this harness and model in the range.',
      inputTokens: 'Input tokens sent to the model across these runs.',
      outputTokens: 'Output tokens the model generated across these runs.',
      cachedTokens: 'Input tokens served from the prompt cache across these runs.',
      reasoningTokens: 'Reasoning tokens, for harnesses that report them separately.',
      costUsd: 'Total reported cost in US dollars for these runs.',
      timeToFirstTokenMsAvg: 'Average time to first token, weighted by the number of runs in each time bucket.'
    }
  },
  export: {
    menu: 'Download {{name}}: the data as CSV or JSON, or the chart as a PNG or SVG image with its title, legend, filters, and time range.',
    csv: 'Download the exact data behind this view as CSV: one row per bucket or record, ISO 8601 UTC timestamps, and plain dot-decimal numbers.',
    png: 'Download the chart as a PNG image at twice screen resolution, with title, legend, active filters, and time range.',
    svg: 'Download the chart as a scalable SVG image, with title, legend, active filters, and time range.',
    json: 'Download the data as JSON, with the series, buckets, filters, and time range in one document.'
  }
};

const explainers = {
  diagram: {
    label: 'Diagram: a caller invokes an agent by name, Garrison picks one of the agent\'s deployments by weight, and that deployment\'s bindings decide how the run executes.',
    caller: { title: 'Caller', body: 'REST, MCP, A2A, or another agent', tip: 'Anything that invokes an agent: the REST API, an MCP client, an A2A agent, or another agent\'s run. Callers only know the agent name.' },
    agent: { title: 'Agent', body: 'Name, description, exposure, delegation, output schema', tip: 'The addressable identity. Callers invoke it by name; it says what the agent is and how it is exposed, not how it runs.' },
    deploymentA: { title: 'Deployment A, weight 300', body: 'Claude Code, sonnet', tip: 'One way to run the agent. With weight 300 against 100 it gets 75% of invocations that do not name a deployment.' },
    deploymentB: { title: 'Deployment B, weight 100', body: 'Mux, local model', tip: 'Another way to run the same agent. Callers can also name it explicitly to bypass the weighted choice.' },
    binds: { title: 'Each deployment binds', body: 'Harness profile, prompts, MCP servers, secrets, workspace, node pool, limits', tip: 'Everything that turns a request into a concrete process: which CLI, which prompts, which tools and credentials, and where it may run.' },
    run: { title: 'Run', body: 'One execution of one deployment', tip: 'Each invocation creates one run, compiled from the chosen deployment and executed on a worker node.' }
  },
  agents: {
    title: 'Agents and deployments',
    p1: 'An agent is the identity callers use. It has a name, a description, how it is exposed (A2A card, MCP tool), whether it may call other agents, and the output schema its answers must match. On its own an agent does not run anything.',
    p2: 'A deployment is how the agent runs: which harness profile and model, which prompt templates, which MCP servers and secrets (by alias), what workspace, which node pool, and what limits and per-run parameters apply. An agent can have several deployments, each with a traffic weight.',
    p3: 'When someone invokes the agent, Garrison picks one of its active deployments at random by weight, unless the caller named a specific deployment. That is how you run a Claude Code and a Mux variant side by side, or move traffic to a new model gradually.'
  },
  deployments: {
    title: 'What a deployment is',
    p1: 'A deployment turns an agent into something runnable. It belongs to exactly one agent and binds a harness profile (which CLI to launch), a model, prompt templates for each role, MCP servers and secrets under aliases, an optional workspace and artifact store, placement on node pools or labels, and limits such as timeout and concurrency.',
    p2: 'An agent with several active deployments splits its traffic by weight: weights 300 and 100 send three out of four calls to the first. Inactive deployments get no weighted traffic but can still be named explicitly, which is handy for testing a new configuration before giving it weight.',
    p3: 'Use Compile preview on a deployment to see the exact command line, files, and environment a run would receive, without starting one.'
  },
  agentDetail: {
    title: 'How this agent runs',
    p1: 'This agent is reached by its name. The deployments below are the concrete ways it can run. Each active deployment receives a share of traffic equal to its weight divided by the total weight of the active deployments; callers that name a deployment skip the weighted choice.'
  },
  harnessProfiles: {
    title: 'Harness profiles and deployments',
    p1: 'A harness profile is a launch recipe for one command-line agent: the executable, the argument templates, environment variables, files to write, how the prompt and system prompt are delivered, which MCP config format it reads, and how its output is parsed into events.',
    p2: 'Profiles are shared building blocks. A deployment picks one profile and then adds the specifics: the model, prompts, secrets, and any argument or environment overrides that apply only to it. Many deployments can use the same profile, so a fix to the profile reaches all of them.',
    p3: 'Built-in profiles are read-only. Clone one to change it.'
  },
  promptTemplates: {
    title: 'Prompt templates and how deployments use them',
    p1: 'Every piece of text Garrison sends to a harness is a template: system prompts, the wrapper around the caller\'s message, delegation instructions, tool descriptions, and generated config files. Templates use variables such as {{input.message}} and {{deployment.model}}, and each save creates a new version.',
    p2: 'Deployments bind templates to prompt roles (System, Task, DelegatedTask, and others). A binding either follows the newest version or pins one, so you can edit a template without changing a production deployment until you choose to. Every run records the exact versions it used.'
  },
  mcpServers: {
    title: 'MCP servers and bindings',
    p1: 'An MCP server listed here is a tool provider: an address (or a command for stdio servers), headers or environment it needs, and the tools that must be present. Registering a server does not give it to any agent yet.',
    p2: 'A deployment binds the servers its agent should use, each under an alias. At compile time Garrison writes them into the harness\'s MCP configuration, resolving secret references in headers, and the worker checks required tools before launch. Garrison\'s own MCP server is added automatically when the agent may delegate.'
  },
  secrets: {
    title: 'Secrets and aliases',
    p1: 'A secret is an encrypted value such as an API key or token. The value is write-only: after saving you can replace or rotate it, but no one can read it back through the console or the API.',
    p2: 'Deployments bind secrets under an alias. Harness profile environment variables and files then refer to {{secret.alias}}, so the same profile works with different keys in different deployments. Values are decrypted only while a run is compiled, sent to the worker over TLS, and scrubbed from logs.'
  },
  workspaces: {
    title: 'Workspaces',
    p1: 'A workspace template describes the directory each run starts in: empty, a fresh Git clone (with an optional credential secret for private repositories), or a set of seeded files. Retention decides whether the directory is deleted or kept after the run.',
    p2: 'A deployment can bind zero or one workspace template. Every run gets its own copy, so runs never see each other\'s files.'
  },
  artifactStores: {
    title: 'Artifact stores',
    p1: 'An artifact store is where files produced by runs are kept after the run\'s workspace is gone. A deployment can bind one store, and the worker uploads matching files there when the run finishes.'
  },
  manifests: {
    title: 'Manifests and the records they create',
    p1: 'A manifest is the tenant\'s configuration written as YAML or JSON documents: secrets (without values by default), prompt templates, harness profiles, MCP servers, workspace templates, agents, and deployments. Documents refer to each other by name, so one manifest works in any tenant.',
    p2: 'Applying a manifest creates or updates ordinary records, the same ones you see on the other tabs. Applying it twice changes nothing. A dry run shows what would change without writing, and Export produces a manifest that recreates this tenant.'
  },
  nodes: {
    title: 'Nodes and node pools',
    p1: 'A node is one worker process, usually a pod, that pulls runs from the control plane, launches harnesses, and streams their events back. Nodes register themselves, report which harnesses they found, and send heartbeats; you do not create them here.',
    p2: 'A node can belong to a node pool and carry labels. Deployments use pools and label selectors to decide where their runs may execute. Cordon a node to stop new work, or drain it before maintenance.'
  },
  nodePools: {
    title: 'Node pools and nodes',
    p1: 'A node pool is a named group of worker nodes, for example GPU machines or nodes reserved for one customer. Nodes join a pool when they register. A pool can be limited to certain tenants.',
    p2: 'Deployments that name a pool only run on its nodes. Deployments without a pool can run on any eligible node.'
  },
  tenants: {
    title: 'Tenants',
    p1: 'A tenant is an isolated organization on this server. Users, access keys, agents, secrets, and runs all belong to one tenant, and nothing is visible across tenants. Node pools and worker nodes are shared unless a pool is reserved for specific tenants.'
  },
  users: {
    title: 'Users and credentials',
    p1: 'A user is a person who signs in with an email and password. A credential (access key) is how automation signs in. Every access key belongs to a user and can never do more than that user can.',
    p2: 'Neither gets access just by existing. Access comes from the administrator flags on the user and from role assignments.'
  },
  credentials: {
    title: 'Credentials and users',
    p1: 'A credential is an access key and secret key pair for scripts, SDKs, and services. It belongs to a user. Its effective permissions are the overlap of what its own role assignments grant and what its owner may do.',
    p2: 'The secret key is shown once, when the key is created or rotated. Rotate keys regularly and delete ones that have not been used in a long time.'
  },
  roles: {
    title: 'Roles, permissions, and assignments',
    p1: 'A permission is a single rule: permit or deny certain operations (such as Read or Execute) on certain resource types (such as Agent or Run). A role is a named bundle of permissions. Deny always wins over permit.',
    p2: 'Nothing changes for anyone until a role is assigned. Assignments, on the next tab, connect a role to a user or an access key, for the whole tenant or for one record.'
  },
  assignments: {
    title: 'Assignments',
    p1: 'An assignment grants one role to one user or access key. Tenant scope applies the role to every record of the covered types; resource scope applies it to a single record, such as one agent a CI job may invoke.',
    p2: 'Use Effective permissions on a user or credential to see the combined result of all their assignments.'
  },
  runs: {
    title: 'Runs and the queue',
    p1: 'A run is one invocation of one deployment. It is queued, leased by a worker node, executed, and finished with an outcome, a transcript, a result, and telemetry such as time to first token, tokens, and cost.',
    p2: 'The Queue tab shows the same runs while they wait: queued runs need a node with the right harness and placement, leased runs have been claimed, and running runs are executing. Runs that sit in the queue for long point to too little capacity or placement rules no node matches.'
  },
  queue: {
    title: 'The queue',
    p1: 'This is the live view of runs that have not finished: waiting for a node, leased, or running, grouped by agent and harness. It is the same data as the Runs tab, summarized to show scheduling pressure.',
    p2: 'A growing queued count for one harness usually means no ready node advertises that harness, the matching nodes are full, or the deployment requires a pool or labels that no node has.'
  },
  invoke: {
    title: 'What happens when you invoke',
    p1: 'You call the agent by name. Unless you pick a deployment, Garrison chooses one of the agent\'s active deployments by weight, validates any per-run parameters against what that deployment allows, and queues a run. The transcript streams here as the worker executes it.'
  },
  audit: {
    title: 'Audit and request history',
    p1: 'Audit records are security and configuration events: sign-ins, denied requests, secret and role changes, manifest applies, and node status changes. They are kept for the retention period in settings.',
    p2: 'Request History, on the previous tab, is the raw HTTP traffic. Use audit to answer who changed what, and request history to debug what a client actually sent.'
  },
  requests: {
    title: 'Request history',
    p1: 'Every API request this server captured, with method, path, status, timing, headers, and bodies (truncated to the configured size). Use it to debug integrations and SDK calls. Click a bar in the chart to narrow the table to that time.'
  },
  analytics: {
    title: 'What these charts measure',
    p1: 'Time to first token is from harness process start to the first model output, so it includes CLI startup. Streaming time runs from the first to the last model output, and execution time from process start to exit. Queue time is how long a run waited for a worker node. These are measured on the worker and server clocks.',
    p2: 'Token counts and cost come from what each harness reports. Cached tokens are input tokens served from the provider\'s prompt cache, and reasoning tokens appear only for harnesses that report them separately. Output tokens per second is output tokens divided by streaming time.',
    p3: 'Averages ignore runs where a value could not be measured. Percentiles show the tail: p95 means only one run in twenty was slower. Group by agent or harness to compare them side by side.'
  }
};

export { tips, explainers };
