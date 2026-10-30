// English tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into en.js.
// Tooltips say what a control is and how it is used, never just the label again (D-030).

const TELEMETRY = {
  approvalWaitMs: 'Approval wait: total time this run spent waiting for permission approvals that a person or a timeout decided. Calls decided at once by a rule or the deployment default add nothing. Measured by the server; n/a when the run never waited.',
  delegationWaitMs: 'Delegation wait: how long this run waited on child runs it started through Garrison (other agents it delegated to), from the server timestamps of those child runs. Zero or n/a when the run delegated nothing.',
  timeToFirstTokenExcludingDelegationMs: 'Time to first token excluding delegation: time to first token minus the time the run spent waiting on runs it delegated to before its first output. Use it to compare agents that delegate with agents that do not. Measured from server timestamps; never negative.',
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
  fieldWarnings: { dismiss: 'Hide this notice. The record is already saved with the values listed here.' },
  approvals: {
    awaiting_one: 'The harness asked before a tool call and is waiting for a person. Open the Approvals tab to allow or deny it ({{count}} waiting).',
    awaiting_other: 'The harness asked before tool calls and is waiting for a person. Open the Approvals tab to allow or deny them ({{count}} waiting).',
    decide: {
      decision: 'Choose whether the harness may make this tool call. The run continues as soon as you submit.',
      allow: 'Let the harness make this tool call. The run continues with it.',
      deny: 'Refuse this tool call. The harness gets the denial message and continues without it.',
      reason: 'Optional note saved with the decision and written to the audit log. A denial passes it on to the agent.',
      remember: 'Also add a rule to this approval\'s deployment so the same kind of call is decided automatically next time.',
      rulePattern: 'The rule to add, in Claude Code rule syntax. It starts as the suggested rule; widen or narrow it before saving.',
      submitAllow: 'Allow the tool call now. The decision is final and cannot be changed afterwards.',
      submitDeny: 'Deny the tool call now. The decision is final and cannot be changed afterwards.'
    }
  },
  approvalCheck: {
    toolName: 'Tool name as the harness reports it, such as Bash, Edit, WebFetch, or an MCP tool like mcp__github__create_issue.',
    inputs: {
      command: 'The shell command to test, for example npm run build && npm test. Every subcommand must be allowed.',
      url: 'The URL the tool would fetch. WebFetch rules match on its domain.',
      query: 'The search query the tool would send.',
      file_path: 'Path of the file the tool would read or change, relative to the workspace or absolute.',
      notebook_path: 'Path of the notebook the tool would change.',
      pattern: 'The glob or search pattern the tool would use.'
    },
    run: 'Evaluate the deployment\'s saved rules for this tool call and show the result. Nothing is recorded and no run is affected.',
    suggestedRule: 'The rule "remember" would add for this call. Copy it into the rules above to cover similar calls.'
  },
  ids: { deleted: 'This record was deleted. ID {{id}}. The copy button copies the ID.', named: 'ID {{id}}. Use the copy button to copy the ID for the API, SDKs, or a support request.' },
  markdown: {
    column: 'Column {{name}} of a table in the agent output. Wide tables scroll sideways inside their frame.',
    showRaw: 'Show the exact text the agent returned, without Markdown formatting, so you can inspect or copy it.',
    showRendered: 'Show the text formatted as Markdown again, with tables, lists, code blocks, and links.',
    copy: 'Copy the raw result text, Markdown syntax included, to the clipboard.',
    link: 'Opens {{href}} in a new tab. The link comes from agent output, so check the address before you trust it.'
  },
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
    approvalsBadge_one: '{{count}} tool call is waiting for a person to allow or deny it. Open Approvals to decide.',
    approvalsBadge_other: '{{count}} tool calls are waiting for a person to allow or deny them. Open Approvals to decide.',
    hubs: {
      approvals: 'The approvals inbox: tool calls agents asked to make that wait for a person, and the history of every decision by rule, default, person, or timeout.',
      home: 'Start here: live counts of agents, runs, and worker nodes, API traffic, recent failures, and shortcuts to common tasks.',
      invoke: 'Send a message to an agent from the browser and watch the transcript stream, without writing any code.',
      runs: 'Every agent invocation, its transcript, outcome, and telemetry, plus the queue of work waiting for a node.',
      analytics: 'Charts of run speed, token use, cost, outcomes, and tool calls over time, filterable by agent, harness, and deployment.',
      agents: 'The agents callers invoke by name, and the deployments that decide how each one actually runs.',
      configuration: 'The building blocks deployments use: harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores, and manifests.',
      fleet: 'The control-plane replicas that serve the API and schedule runs, the worker nodes that execute runs, and the node pools that group workers for placement.',
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
      agentAssets: 'Versioned system prompts, skills, reference files, and document templates that agent revisions pin, with upload and history.',
      artifactStores: 'Destinations for files that runs produce and you want to keep after the run ends.',
      modelPrices: "Operator-configured USD rates for estimating cost when a harness omits it. Reported cost, including zero, takes precedence.",
      usageQuotas: "Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.",
      manifests: 'Apply or export the whole tenant configuration as YAML so it can live in source control.',
      nodes: 'Worker machines or pods that pull runs and execute harnesses. Cordon, drain, or inspect them here.',
      controlNodes: 'Server replicas (control nodes) that serve REST, MCP, and A2A and schedule runs. One of them is the leader and runs cluster maintenance. Read-only status, version, and activity.',
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
      serverInfo: 'REST, MCP, and A2A addresses, server and dashboard versions, and the identity you are signed in as.',
      conversations: 'Multi-turn conversations with agents: each turn is a run that resumes the session of the turn before it. Open one to read its turns and send the next message.'
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
    serverUrl: 'Base address of another Garrison server, for example 127.0.0.1:9700. The browser can reach it only if the dashboard allows its origin (GARRISON_CSP_CONNECT_SRC).',
    useDifferentServer: 'Sign in to a server other than the one this console was deployed with. Its origin has to be allowed in GARRISON_CSP_CONNECT_SRC.',
    useDefaultServer: 'Hide the Server URL field and sign in to the server this console was deployed with.',
    serverInUse: 'The Garrison server this console signs in to: GARRISON_API_URL when it is set, otherwise this page\'s own origin, which proxies the API.',
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
    decisionSource: 'Show only approvals decided one way: by a rule, the deployment default, a person, a timeout, or a stopped run.',
    runId: 'Show only the approvals of one run. Paste a run ID such as run_...; the list updates when you stop typing.',
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
    clear: 'Reset every filter above to empty and search again.',
    agentId: 'Show only records that belong to one agent. Choose All to remove the filter.'
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
    id: 'Copy the record ID to the clipboard, for use with the REST API, SDKs, or filters.',
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
    approvalsOn_one: 'Approvals are on: the harness asks before tool calls, and {{count}} rule decides some of them automatically.',
    approvalsOn_other: 'Approvals are on: the harness asks before tool calls, and {{count}} rules decide some of them automatically.',
    approvalsOff: 'Approvals are off: the harness makes tool calls under its own permission settings without asking.',
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
      delegation: 'Time before the first model output that the run spent waiting on child runs it delegated to. It is not harness startup.',
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
    approvalStatus: {
      Pending: 'Waiting for a person to allow or deny it. The harness is blocked on this call until then.',
      Approved: 'The tool call was allowed, by a rule, the deployment default, a person, or a timeout.',
      Denied: 'The tool call was refused. The harness received the denial message and continued without it.',
      Expired: 'Nobody decided in time, so the deployment\'s timeout decision was applied.',
      Cancelled: 'The run stopped while the approval was pending, so it was closed without a decision.'
    },
    approvalDecision: {
      Allow: 'Allow: the harness was permitted to make the tool call.',
      Deny: 'Deny: the harness was refused and told why.'
    },
    approvalSource: {
      DurableResume: "A one-time human approval carried from the previous durable checkpoint. It applies only to the matching resumed tool request.",
      Rule: 'Decided at once by a rule on the deployment. The matched rule is shown next to it.',
      Default: 'No rule matched, so the deployment\'s default action decided it.',
      User: 'A person decided it in the dashboard, over the API, or over MCP.',
      Timeout: 'Nobody decided before it expired, so the deployment\'s timeout decision applied.',
      Cancelled: 'The run stopped while this approval was waiting.'
    },
    approvalRuleAction: {
      Allow: 'Allow: matching tool calls go ahead without asking anyone.',
      Deny: 'Deny: matching tool calls are refused without asking anyone. Deny beats every other rule.',
      Ask: 'Ask a person: matching tool calls wait in the Approvals inbox for a decision.'
    },
    approvalKind: {
      Tool: 'A Claude Code permission prompt for any tool, including MCP tools.',
      Command: 'A shell command a Codex app-server run wants to execute. Rules evaluate it as Bash.',
      FileChange: 'A file change a Codex app-server run wants to make. Rules evaluate it as Edit.'
    },
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
      OutputLimitExceeded: 'The run produced too much output: its answer passed the deployment\'s maximum assistant characters (a run guard), or the harness wrote more than the harness profile allows. The output so far is kept.',
      SchemaValidationFailed: 'The result did not match the agent\'s output JSON Schema: after one repair attempt, or at once when the harness cannot resume its session.',
      TimedOut: 'The run reached its deadline.',
      Cancelled: 'The run was cancelled on request.',
      StaleLease: 'The worker reported back after losing its lease, so its result was ignored.',
      CompileFailed: 'The deployment could not be compiled, for example because of a missing template variable.',
      WorkspaceFailed: 'The workspace could not be prepared, for example because a Git clone failed.',
      Rejected: 'The request was rejected before a run could start.',
      InternalError: 'Garrison hit an internal error. The server logs have details.',
      NoCapableWorker: 'The run waited in the queue longer than the cluster setting Runtime.FailBlockedAfterSeconds allows, and no Ready worker could run it, so it was failed.',
      RepetitionDetected: 'A run guard stopped the run because its answer degenerated into the same short text repeated over and over, or only whitespace and punctuation. The output so far is kept. Tune it with the deployment\'s Repetition guard.',
      NoProgress: 'A run guard stopped the run because no text, thinking, or tool activity arrived for longer than the deployment\'s no-progress timeout. The output so far is kept.',
      PodFailed: 'The run pod failed outside the harness: it could not be scheduled, its image could not be pulled, it ran out of memory, it was evicted, or it ended without reporting. The error message names the cause.',
      ConversationStateLost: 'The node that was to resume this conversation turn no longer had the conversation\'s directories. Garrison requeues such a turn once as a fallback; this outcome stays only when that was not possible.'
    },
    controlNodeStatus: {
      Starting: 'Starting: the replica is initializing and does not serve traffic yet.',
      Ready: 'Ready: the replica is heartbeating and serving REST, MCP, and A2A requests.',
      Draining: 'Draining: shutdown has begun. Readiness answers 503, and its streams and long polls are ending.',
      Offline: 'Offline: the replica stopped cleanly, or was silent for 30 seconds and the leader marked it. Offline rows are removed after 24 hours.'
    },
    backplane: {
      Local: 'Local: events stay inside this process. Fine for a single replica; other replicas do not see them.',
      Polling: 'Database polling: replicas share live events by polling the database. Works with any database, with a short delay.',
      PostgresNotify: 'PostgreSQL notifications: replicas share live events through PostgreSQL LISTEN and NOTIFY, with little delay.'
    },
    nodeStatus: {
      Ready: 'Ready: heartbeating and accepting new runs.',
      Draining: 'Draining: finishing its current runs and accepting no new ones.',
      Cordoned: 'Cordoned: accepting no new runs; current runs continue normally.',
      Lost: 'Lost: missed its heartbeats. Its runs are requeued or failed.',
      Offline: 'Offline: shut down cleanly and holds no runs.'
    },
    usageQuotaScope: {"Tenant": "Tenant. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "Agent": "Agent. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "Deployment": "Deployment. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment."},
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
    secretStatus: {
      Ok: 'The credential is usable, as far as Garrison knows. Setting a new value always returns a secret to this state.',
      NeedsReauthentication: 'OpenAI rejected the stored ChatGPT login for good, for example because its refresh token was already used. Runs that use this secret fail until you replace its value with a fresh login.'
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
      Seeded: 'Each run starts with the files listed in the template.',
      PersistentVolume: 'Each run mounts an existing PersistentVolumeClaim as its workspace, so files persist between runs. Needs the Kubernetes Job executor.'
    },
    runExecutor: {
      Process: 'The harness runs as a subprocess of the worker, in the worker\'s container, with its own work, home, and config directories.',
      KubernetesJob: 'The worker starts a Kubernetes Job per run: the harness runs in its own pod with no Kubernetes or Garrison credentials, a read-only root filesystem, and the deployment\'s resource limits.'
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
      ApprovalDecided: 'A person allowed or denied a pending tool call. The record names the tool, the run, and the reason.',
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
      RunCancelled: 'A run was cancelled by a user, an access key, or its parent run.',
      ConversationDeleted: 'Someone deleted a conversation. Its turns are kept as ordinary runs.'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'The node holding the conversation was no longer ready (lost, draining, cordoned, or deleted), so another node took the turn.',
      AffinityWaitExpired: 'The node holding the conversation stayed ready but did not claim the turn within Runtime.ConversationAffinityWaitMs, so another node took it.',
      WorkspaceLost: 'The node claimed the turn, but the conversation\'s workspace and home directories were gone there.',
      SessionMissing: 'Earlier turns exist, but none reported a harness session to resume, for example because they all failed early.',
      HarnessChanged: 'The deployment\'s harness profile changed since the session was recorded, so the new profile cannot resume it.',
      ResumeUnsupported: 'The deployment\'s harness profile does not support resuming a session, so every later turn starts from the transcript.',
      ExecutorWithoutState: 'The turn runs as a Kubernetes Job, which starts with an empty home directory every time, so every later turn starts from the transcript.'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'When the harness asked. Hover the value for the exact time.',
      agentName: 'The agent whose run asked for this tool call.',
      toolName: 'The tool the harness wants to use, such as Bash, Edit, WebFetch, or an MCP tool.',
      summary: 'One line about the call: the command, URL, paths, or query, with secrets redacted.',
      status: 'Pending until decided, then Approved, Denied, Expired (timeout), or Cancelled (the run stopped).',
      decision: 'Allow or Deny once decided; empty while the approval is pending.',
      decisionSource: 'What decided it: a rule, the deployment default, a person, a timeout, or a stopped run.',
      decidedBy: 'The person or access key that decided, when a person decided it.',
      expiresUtc: 'When a pending approval times out and the deployment\'s timeout decision applies.',
      kind: 'Tool call (Claude Code), Command, or File change (Codex app-server).',
      harnessType: 'The harness that asked: Claude Code or Codex.',
      runId: 'The run that asked. Open it to see the transcript around the call.',
      rootRunId: 'The top-level run of the delegation tree, when the run that asked was delegated.',
      deploymentId: 'The deployment whose rules evaluated this call. Remembered rules are added to it.',
      leaseEpoch: 'Lease epoch of the run attempt that asked, so a decision never reaches a later attempt.',
      requestedUtc: 'When the harness asked for permission.',
      decidedUtc: 'When the decision was made.',
      waitMs: 'How long the call waited from request to decision.',
      timeoutDecision: 'What happens if nobody decides before the approval expires, from the deployment settings.',
      toolCallId: 'The harness\'s own ID for this tool call, for matching it in the transcript.',
      reason: 'The note the person who decided wrote, if any.',
      inputPreview: 'The tool input the harness sent, as JSON, with secrets and token-like values redacted.',
      rulePattern: 'The deployment rule that matched this call, when a rule decided it or asked for a person.',
      ruleId: 'ID of the matched deployment rule.',
      suggestedRule: 'A rule that would match this call. Remember as rule prefills it.',
      rememberedRuleId: 'ID of the rule that was added to the deployment when this approval was decided with remember.',
      id: 'Approval identifier (apr_...) for the API and MCP tools.',
      actions: {
        allow: 'Allow this pending tool call, with an optional reason and an option to remember it as a rule.',
        deny: 'Deny this pending tool call, with an optional reason and an option to remember it as a rule.',
        openRun: 'Open the run that asked, to read its transcript around this tool call.'
      }
    },
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
      promptDelivery: 'How the task prompt reaches the harness: on standard input, as an argument, in a file, or as one turn over the Codex app-server protocol (JSON-RPC on stdin and stdout, so output streams).',
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
      actions: { clone: 'Copy this template under a new name you choose, then open the copy in the editor.' },
      add: 'Write a new prompt template in the editor with live preview. Each save becomes a version.',
      name: 'Template name, unique in the tenant. Deployments bind templates by ID, so renaming a custom template keeps their bindings; includes refer to it by name.',
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
      status: 'Whether the stored credential still works. Garrison marks a Codex login as needing reauthentication when it can no longer be refreshed.',
      accessTokenExpiresUtc: 'When the access token in a stored Codex ChatGPT login expires. Garrison refreshes it before then and writes the new tokens back to the secret.',
      refreshedUtc: 'When Garrison last refreshed this Codex login itself. Runs only ever receive a copy without the refresh token.',
      statusMessage: 'Why the login cannot be used, as reported by the provider.',
      statusUtc: 'When Garrison found that the login can no longer be refreshed.',
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
      persistentVolumeClaim: 'Name of the PersistentVolumeClaim to mount at the workspace path. It must already exist in the run namespace; Garrison never creates or deletes it.',
      files: 'Files written into the workspace before the run starts.',
      filesItems: {
        path: 'Path of the file relative to the workspace root.',
        content: 'Text content of the file.'
      },
      active: 'Inactive templates cannot be used by new runs.'
    },
    modelPrices: {"add": "Add a price for an exact harness and served model. No provider rates are seeded.", "name": "A unique configuration name for this price entry within the tenant.", "description": "Operator notes about the source and effective date of these rates.", "active": "Inactive prices are not used. Saved run costs do not change when prices are edited or deleted.", "model": "Enter an exact model name of 1 to 256 characters without control characters.", "harnessType": "The harness whose token accounting and exact model name these rates describe.", "inputUsdPerMillion": "Input USD / million tokens. Enter a finite rate from 0 to 1,000,000,000. Zero is valid.", "outputUsdPerMillion": "Output USD / million tokens. Enter a finite rate from 0 to 1,000,000,000. Zero is valid.", "cachedInputUsdPerMillion": "Leave empty to use the corresponding input or output rate. Zero means free.", "reasoningUsdPerMillion": "Leave empty to use the corresponding input or output rate. Zero means free.", "inputIncludesCachedTokens": "Enable when cached tokens are included in input. Disable for Claude Code, which reports cache reads separately.", "outputIncludesReasoningTokens": "Enable when reasoning tokens are included in output. Included subtotals are deducted before applying their separate rate."},
    usageQuotas: {"add": "Add a quota for a tenant, agent, or deployment. Empty limits are unlimited.", "name": "Name. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "description": "Description. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "active": "Active. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "scope": "Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "resourceId": "Add a quota for a tenant, agent, or deployment. Empty limits are unlimited.", "dailyRunLimit": "Runs per UTC day. Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs.", "dailyTokenLimit": "Tokens per UTC day. Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs.", "dailyCostUsdLimit": "Known USD per UTC day. Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs.", "maxConcurrentRuns": "Maximum active runs. Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs.", "actions": {"usage": "Daily usage. Runs per UTC day. Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs."}, "usage": {"windowStartUtc": "Window starts (UTC). Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "windowEndUtc": "Daily reset (UTC). Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "runsUsed": "Runs admitted. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "tokensUsed": "Completed tokens. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "costUsd": "Known cost (USD). Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "unknownCostRuns": "Runs with missing cost. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "activeRuns": "Active runs. Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment."}, "enforcementEnabled": "Off by default. Enable explicitly to reject runs at configured limits and lower supported harness budgets. When off, usage is monitored and limits do not affect execution."},
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
      inputSchemaJson: "JSON Schema for the agent input. When set, every invocation input must be a JSON document that matches it, and Invoke shows a form generated from it.",
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
      approvalsEnabled: 'Make the harness ask before tool calls. Rules below decide most calls; the rest wait for a person in the Approvals inbox. Claude Code and Codex app-server profiles only.',
      approvalDefaultAction: 'What happens when no rule matches a tool call: allow it, deny it, or ask a person.',
      approvalTimeoutSeconds: 'How long a call waits for a person before the timeout decision applies, from 10 to 3,600 seconds.',
      approvalTimeoutDecision: 'The decision applied when nobody answers in time. Deny is the safe choice.',
      approvalRules: 'Ordered rules in Claude Code syntax. Deny beats Ask and Ask beats Allow; within one action the first match is reported.',
      approvalRulesItems: {
        action: 'What a matching call gets: Allow, Deny, or Ask a person.',
        pattern: 'Claude Code rule, for example Bash(npm test), Bash(npm run *), Edit(src/**), Read, WebFetch(domain:example.com), or mcp__github__*.',
        inputPattern: 'Optional .NET regular expression the tool input JSON must also match, for finer control than the pattern.',
        description: 'Why this rule exists, for the people who maintain it.'
      },
      approvalTest: 'Try a tool call against the deployment\'s saved rules and see whether it would be allowed, denied, or sent to a person.',
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
      timeoutSeconds: 'Run deadline in seconds. Empty uses the harness profile default. The cluster setting Runtime.MaxRunSeconds caps every run, including per-run time limits.',
      maxAttempts: 'How many times a run may be attempted in total. Between 1 and 10.',
      steps: {
        approvals: 'Which tool calls the harness may make, which it may not, and which wait for a person.',
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
      },
      repetitionGuard: 'Stop a run when its answer degenerates into the same short text repeated over and over, or only whitespace and punctuation (outcome Repetition detected). Unset follows the cluster default; check or clear the box to set it for this deployment.',
      maxAssistantChars: 'Most characters of assistant text one run may write before Garrison stops it (outcome Output limit exceeded). 0 means unlimited; empty uses the cluster default.',
      noProgressSeconds: 'Stop a run when no text, thinking, tool call, or tool result arrives for this many seconds while no tool call is running (outcome No progress). 0 turns it off; empty uses the cluster default.',
      executor: 'How runs execute: Process (inside the worker) or Kubernetes Job (a pod per run, stronger isolation). Empty follows the node pool\'s default executor, then Process.',
      podCpuRequest: 'CPU the run pod requests, for example 250m. Empty uses the worker default.',
      podCpuLimit: 'Most CPU the run pod may use, for example 2. Empty uses the worker default.',
      podMemoryRequest: 'Memory the run pod requests, for example 512Mi. Empty uses the worker default.',
      podMemoryLimit: 'Most memory the run pod may use, for example 4Gi. A run above it is stopped with outcome Run pod failed.',
      podEphemeralStorageRequest: 'Local disk the run pod requests for its workspace, home, and temporary files, for example 1Gi.',
      podEphemeralStorageLimit: 'Most local disk the run pod may use, for example 10Gi. A pod above it is evicted and the run fails.',
      useClusterDefault: 'Clear this deployment\'s own setting so the repetition guard follows the cluster default again.',
      sections: {
        guards: 'Run guards stop runaway runs early on every harness. Each one left empty follows its cluster default in Settings (Runtime).',
        execution: 'Choose where runs execute and, for Kubernetes Job runs, the run pod\'s CPU, memory, and disk.'
      }
    },
    nodePools: {
      add: 'Create a pool to group nodes and optionally reserve them for certain tenants.',
      name: 'Pool name. Nodes join a pool when they register, and deployments can require one.',
      description: 'What hardware or purpose this pool represents.',
      tenants: 'Tenants allowed to use the pool. Empty means every tenant.',
      defaultExecutor: 'Executor for runs of deployments in this pool that do not choose one. Empty means Process.',
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
      },
      conversationId: 'The conversation this run is a turn of, with its turn number. Empty for runs outside a conversation.',
      conversationTurn: 'Position of this run in its conversation, starting at 1 for the turn that started it.'
    },
    nodes: {
      containerized: 'Whether the worker runs inside a container or pod, as it reported at registration. Codex runs on a containerized worker default to the danger-full-access sandbox because the container is the isolation boundary.',
      name: 'Node name, usually the Kubernetes pod name of the worker.',
      status: 'Whether the node accepts new runs. Cordon or drain a node before maintenance.',
      capacity: 'Runs the node holds now out of the most it accepts at once.',
      harnesses: 'Harnesses the node found installed and working when it probed them at startup.',
      executors: 'Executors the node offers. Kubernetes Job appears only when the worker runs in a cluster with permission to create Jobs.',
      labels: 'Key and value labels the node advertises. Deployment node selectors match against them.',
      nodeVersion: 'Version of the worker software on the node.',
      lastHeartbeatUtc: 'When the node last checked in. Nodes that stop checking in are marked lost.',
      address: 'Informational address the node reported.',
      maxConcurrentRuns: 'Most runs this node accepts at once.',
      childReserveSlots: 'Extra slots for delegated runs whose parent waits on them: one opens per run on this node that is waiting on a child, up to this many.',
      maxResidentWaiters: 'Most runs on this node that may wait on a delegated run at once. 0 means its capacity. A delegation beyond it fails with DelegationCapacityExhausted.',
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
        grafana: 'Open the Workers dashboard in Grafana in a new tab, filtered to node {{node}}.',
        cordon: 'Stop sending new runs to this node. Runs already on it finish normally.',
        uncordon: 'Let this node accept new runs again.',
        drain: 'Stop new runs and let current ones finish, then the node goes idle. Use before shutting it down.',
        runs: 'Open the Runs list filtered to runs this node executed.'
      }
    },
    controlNodes: {
      name: 'Replica name: the node ID the server runs with (GARRISON_NODE_ID, the pod name in Kubernetes).',
      status: 'Lifecycle of the replica: Starting, Ready, Draining, or Offline. Only Ready replicas serve traffic.',
      version: 'Garrison server version this replica runs. Different versions are expected only during a rolling update.',
      schemaVersion: 'Database schema version the replica found at startup. Every replica should report the same number.',
      backplane: 'How this replica shares live events (run streams, WebSocket updates) with the other replicas.',
      uptime: 'How long the replica process has been running, counted from its start time. Hover to see the exact start.',
      lastHeartbeatUtc: 'When the replica last heartbeated. Replicas heartbeat every 5 seconds; anything older than 15 seconds is highlighted as stale.',
      activeRequests: 'HTTP requests the replica was handling at its last heartbeat.',
      openStreams: 'Server-sent event streams and WebSocket connections open on the replica at its last heartbeat.',
      heldLongPolls: 'Worker lease long polls the replica was holding at its last heartbeat. Idle workers wait there for new runs.',
      address: 'IP address and REST port of the replica, as it reported them.',
      hostname: 'Host name of the machine or pod the replica runs on.',
      startedUtc: 'When the replica process started, in your local time zone.',
      id: 'Node ID of the replica. It matches respondingNodeId in API responses and the node label in metrics.',
      isLeader: 'Whether this replica holds the maintenance leader lease. One replica leads at a time.',
      leaderEpoch: 'Fencing epoch of the leader lease. It goes up each time leadership moves to another replica.',
      respondingNodeId: 'The replica that answered this single read. Behind a load balancer it can differ from the replica shown.',
      answeredBy: 'The control node that answered the request for this list (respondingNodeId). Behind a load balancer, each refresh may be answered by a different replica.',
      badges: {
        leader: 'Leader: this replica holds the maintenance lease. It runs retention cleanup, marks silent replicas Offline, and does other cluster-wide upkeep.',
        leaderEpoch: 'Leader: this replica holds the maintenance lease (epoch {{epoch}}). It runs retention cleanup, marks silent replicas Offline, and does other cluster-wide upkeep.',
        stale: 'Stale: no heartbeat for more than {{seconds}} seconds, although replicas heartbeat every 5 seconds. The replica may be overloaded, cut off, or gone; the leader marks it Offline after 30 seconds.'
      },
      actions: {
        grafana: 'Open the Garrison overview dashboard in Grafana in a new tab, filtered to control node {{node}}.'
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
      principalName: 'The user or access key that applied the manifest.',
      dryRun: 'Yes means it was only validated and nothing was written.',
      counts: 'How many documents created, updated, left unchanged, or failed records.'
    },
    conversations: {
      title: 'The first line of the first message, which names the conversation. Click the row to open its turns.',
      agentName: 'The agent the conversation is with. Every turn goes to this agent.',
      state: 'Working while a turn is unfinished; a new message is refused until it ends. Idle when the next message can be sent.',
      turnCount: 'How many turns (runs) the conversation has had, including failed ones.',
      affinityNodeName: 'The worker node holding the conversation\'s workspace and harness session. The next turn prefers this node so it can resume.',
      fallbackCount: 'How many turns could not resume the harness session and started a fresh one seeded with the transcript of the earlier turns.',
      lastFallbackReason: 'Why the most recent fallback turn could not resume the session, for example the affinity node was not ready.',
      harnessType: 'The harness that runs every turn, taken from the deployment of the first turn.',
      callerName: 'Who started the conversation: a user, an access key, or another agent\'s run.',
      contextId: 'The A2A context ID the client supplied, when the conversation came in over A2A. Empty for conversations started over REST or MCP.',
      sessionId: 'The harness session the next turn resumes. Empty until a turn reports one.',
      lastActivityUtc: 'When the latest turn was sent or finished. Hover the value for the exact time.',
      createdUtc: 'When the first turn started the conversation. Hover the value for the exact time.',
      id: 'Conversation identifier. Pass it as conversationId when invoking the agent to send the next turn.',
      fallbackLast: 'Turns that started a fresh session from the transcript. The most recent reason: {{reason}}.',
      states: {
        busy: 'A turn of this conversation is still queued or running. Wait for it to finish, or cancel it, before sending the next message.',
        idle: 'No turn is in progress. The next message continues the conversation.'
      },
      actions: {
        continue: 'Open Invoke with this conversation selected, so the next message is sent as its next turn.',
        runs: 'Open the Runs list filtered to the turns of this conversation, with every run column and filter.'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: 'Open the run that asked, to read its transcript around this tool call.',
      openAgent: 'Open the agent page with its deployments and recent runs.',
      openDeployment: 'Open the Deployments tab filtered to this deployment, where its approval rules are edited.',
      backToInbox: 'Go back to the approvals inbox with every pending approval.',
      viewJson: 'Show the complete approval record as JSON, exactly as the API returns it.',
      request: 'What the harness asked to do: the one-line summary and the full tool input with secrets redacted.',
      rules: 'The deployment rule that matched, the rule this call suggests, and the rule remembered from the decision.',
      copyRule: 'Copy the suggested rule, for example to paste it into the deployment\'s approval rules.'
    },
    home: {
      observabilityState: {
        reachable: 'The server reached {{service}} at its internal URL in the last 30 seconds.',
        unreachable: 'The server could not reach {{service}} at its internal URL. Check that the service is running and that the internal URL setting points at it.',
        checking: 'Asking the server whether {{service}} is reachable.',
        unknown: 'The server did not report whether {{service}} is reachable. The status check failed or this server does not support it yet.'
      },
      observabilityVersion: 'Version {{service}} reported to the server\'s health check.',
      kpisGrafana: 'Open the Garrison overview dashboard in Grafana in a new tab to see these numbers over time.',
      grafanaDashboards: 'The Garrison folder in Grafana has one dashboard per section. Each link opens that dashboard in a new tab.',
      grafanaSections: {
        overview: 'Health at a glance: replicas and workers up, run and request rates, errors, cost, and recent problems.',
        http: 'REST traffic by route: request rate, latency percentiles, errors, payload sizes, authentication failures, and requests in flight.',
        runs: 'Run lifecycle: runs created and finished by outcome, stage durations, cancellations, structured output validation, and repairs.',
        agents: 'Per-agent performance: invocations, run time and queue time percentiles, time to first token, streaming time, outcomes, and guard trips.',
        models: 'Token use and cost by model and agent: input, output, cached, and reasoning tokens, cost, and output throughput.',
        workers: 'Worker nodes: leases, runs per node, completion reports, heartbeats, free slots, and calls to the control plane.',
        kubernetes: 'Pod-per-run executor: run Jobs created and deleted, pod start latency, pod failures by reason, and orphan cleanups.',
        protocols: 'MCP, A2A, and streaming: tool calls and durations, sessions, A2A methods and task states, SSE streams, WebSockets, and delegation.',
        scheduler: 'Scheduling: queue depth by agent and harness, claim results and latency, lease long polls, blocked runs, and lease expirations.',
        database: 'Database: statement latency by operation and table, errors, connections in use, write lock waits, and retention.',
        controlPlane: 'Control-plane replicas: status, leader changes, backplane traffic and lag, heartbeats, and background service iterations.',
        security: 'Authentication failures by scheme and reason, authorization denials, rate limiting, tokens issued, secret decryption, and Codex token refreshes.',
        integrations: 'Outbound calls by service: MCP server tests, observability probes, the MCP proxy, the Kubernetes API, and the control plane from workers.',
        logs: 'Log volume, errors and warnings by component and tenant, recent error lines, and links to traces.'
      },
      observabilityDocs: 'Open the telemetry guide in a new tab: how to scrape Garrison metrics and connect Grafana, Prometheus, Tempo, or Loki.',
      observability: 'Links to the metrics, dashboard, and tracing tools this deployment reports as configured. Services that are not configured are not shown.',
      kpis: {
        agents: 'Agents defined in this tenant. Click to open the Agents list.',
        deployments: 'Deployments across every agent. Each one is a way an agent can run. Click to open them.',
        activeRuns: 'Runs leased or running on a worker right now. Click to see them.',
        queued: 'Runs waiting for a worker node. A number that keeps growing means you need more nodes or capacity.',
        succeeded: 'Runs that finished successfully in the last 24 hours. Click to list them.',
        failed: 'Runs that failed in the last 24 hours. Click to list them and read why.',
        nodes: 'Worker nodes ready to take runs, out of all registered nodes. Click to manage them.',
        controlNodes: 'Control-plane replicas that are Ready, out of all registered ones (Offline rows stay listed for 24 hours). The leader is {{leader}}. Click to open Fleet > Control plane.',
        controlNodesNoLeader: 'Control-plane replicas that are Ready, out of all registered ones (Offline rows stay listed for 24 hours). No replica holds the leader lease right now, so cluster maintenance is paused. Click to open Fleet > Control plane.'
      },
      openFailure: 'Open this failed run to read its transcript, error, and stderr.',
      openControlPlane: 'Open Fleet > Control plane to see every replica with its status, leader, version, heartbeat, and activity.',
      openWorkers: 'Open Fleet > Worker nodes to see every worker with its capacity, harnesses, and heartbeat, and to cordon or drain it.',
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
        loki: 'Open Loki to search Garrison logs in a new tab.',
        grafana: 'Open Grafana dashboards for Garrison metrics in a new tab.',
        prometheus: 'Open the Prometheus server that scrapes Garrison metrics in a new tab.',
        tempo: 'Open Tempo to browse traces in a new tab.'
      },
      serviceGeneric: 'Open this bundled service in a new tab.'
    },
    runDetail: {
      openApproval: 'Open this approval with its full tool input, rule, and decision.',
      reviewApprovals: 'Show this run\'s approvals, where you can allow or deny the pending tool calls.',
      approvalActions: 'Allow or deny a pending tool call, or open the approval for every field.',
      viewTrace: 'Open this run\'s trace in Grafana Explore (Tempo) in a new tab. It shows the compile, claim, and harness spans across the server and the worker node.',
      viewLogs: 'Open the server and worker log lines about this run in Grafana Explore (Loki) in a new tab, limited to the run\'s time range.',
      traceId: 'W3C trace ID of the trace this run was compiled in. Search for it in Tempo, or use View trace. Empty for runs created before trace IDs were recorded.',
      eventCode: 'What kind of message Garrison wrote here, in your language. The text next to it is the original message from the server or worker.',
      openTemplate: 'Open template {{name}}. This run used version {{version}}; its Versions tab shows that content and the diff to the current one.',
      templatesUsed: 'The exact prompt template versions this run was compiled with. Click one to open that template and compare versions.',
      live: 'Events are streaming live from the server as the harness produces them.',
      viewJson: 'Show the complete run record as JSON, including every telemetry field.',
      deployment: 'The deployment that was selected for this run, by name or by traffic weight.',
      model: 'The model the harness reported it actually used, which can differ from the deployment\'s requested model.',
      tokens: 'Input and output tokens for the whole run. The telemetry panel below has the full breakdown.',
      caller: 'Who started the run: a user, an access key, or another agent\'s run.',
      parent: 'The run that delegated to this one, when an agent called another agent.',
      openParent: 'Open the parent run that delegated this work.',
      attempt: 'Which attempt this is, out of the most the deployment allows.',
      outputSchema: 'Whether the final output matched the agent\'s output JSON Schema. When it did not and the harness can resume its session, Garrison sends one repair prompt in the same session. The transcript\'s warning events list the validation errors.',
      created: 'When the run was requested.',
      started: 'When the harness process started on the worker.',
      completed: 'When the run reached its final state.',
      exitCode: 'Exit code of the harness process. Success is usually judged from the final event, not this code.',
      tabs: {
        approvals: 'Tool calls this run asked permission for, how each was decided, and Allow and Deny for the pending ones.',
        transcript: 'Every event the harness produced: assistant text, thinking, tool calls and results, and usage.',
        result: 'The final answer and any structured output.',
        input: 'What the caller sent, the parameters, and the exact prompt template versions used.',
        stderr: 'The last part of the harness\'s standard error, with secrets scrubbed. Look here when a run fails.',
        children: 'Runs this run started by calling other agents.'
      },
      eventFilter: 'Show only one type of event, such as tool calls or errors.',
      openChild: 'Open this child run, started when this run called another agent.',
      eventCodes: {
        ApprovalRequested: 'The harness asked before a tool call and the call is waiting for a person. Decide it on the Approvals tab.',
        ApprovalDecided: 'A permission request was decided by a rule, the deployment default, a person, or a timeout. The text says which.',
        RunGuardTriggered: 'A run guard stopped this run. The message says which guard tripped and what it saw; the run ends Failed with that guard\'s outcome and keeps its partial output.',
        ConversationFallback: 'This turn could not resume the conversation\'s harness session, so it started a fresh session seeded with the transcript of the earlier turns. The message says why.',
        ConversationStateLost: 'The node claimed this turn but the conversation\'s directories were gone, so the turn was returned to the queue to run as a fallback.'
      },
      conversation: 'The conversation this run is a turn of, and its turn number. Click to open the conversation.',
      openConversation: 'Open the conversation with every turn and a box to send the next one.',
      conversationSession: 'Whether this turn resumed the conversation\'s harness session or started a fresh one from the transcript, and why.',
      resumeSessionId: 'The harness session this turn resumed, left by the turn before it.',
      affinityNode: 'The node that holds the conversation\'s directories. Other nodes leave the turn alone until the time shown, unless this node stops being ready.'
    },
    agentDetail: {
      name: 'The name callers use to invoke this agent.',
      viewJson: 'Show the full agent record as JSON.',
      invoke: 'Open Invoke with this agent selected. A deployment is picked by weight unless you choose one.',
      grafana: 'Open the Agents dashboard in Grafana in a new tab, filtered to this agent: invocations, run time percentiles, time to first token, streaming time, tokens, cost, and guard trips.',
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
      },
      conversations: 'Open the Conversations list filtered to this agent.'
    },
    queue: {
      queued: 'Runs waiting for a node. Click to list them.',
      leased: 'Runs a node has claimed but not started yet. Click to list them.',
      running: 'Runs executing now. Click to list them.',
      agent: 'The agent the waiting work belongs to.',
      harness: 'The harness those runs need. Only nodes that advertise it can take them.'
    },
    invoke: {
      stream: {
        tabs: {
          preview: 'Watch the answer as it streams, formatted as Markdown, with reasoning and tool calls. Selected while a run is in progress.',
          response: 'The final run result: result text (formatted or raw), structured output, outcome, errors, telemetry, and links.'
        },
        live: 'The run is in progress. This view updates as output arrives over the live event stream.',
        finished: 'The run has ended and no more output will arrive. The Response tab has the final result.',
        elapsed: 'Time since you clicked Send, measured in your browser. It stops when the run ends.',
        firstToken: 'Time from Send to the first streamed output (text or reasoning), measured in your browser, so it includes queueing and harness startup. The run page shows the worker-measured value.',
        tokensPerSecond: 'Output tokens per second while streaming, from the usage the harness reported. Once the run ends it shows the server-measured rate.',
        codexNote: 'Codex prints each message only when it is complete (codex exec --json), so nothing streams token by token. Elapsed time keeps counting while it works.',
        showResponse: 'Switch to the Response tab for the final result, structured output, and telemetry.',
        reasoning: 'Thinking text the model produced before or between answers. Collapsed by default; click to expand it.',
        jump: 'Scroll to the newest output and keep following the stream as it arrives.',
        tool: {
          running: 'The agent called the tool {{name}} and is waiting for its result.',
          ok: 'The tool {{name}} returned a result without an error.',
          failed: 'The tool {{name}} returned an error. The agent may retry it or continue without it.'
        }
      },
      applySample: 'Go to Manifests, where the sample manifest creates an agent you can try right away.',
      agent: 'The agent to call. Only active agents are listed.',
      deployment: 'Leave on Any to let Garrison pick by traffic weight, or choose one deployment to test it directly.',
      parameter: 'Per-run value for {{name}}. The deployment allows callers to override it; leave empty for the default.',
      message: 'What you want the agent to do. It is sent as the run input and wrapped by the task template.',
      send: 'Start a run with this message and stream its transcript here.',
      openRun: 'Open the full run page with result, telemetry, and stderr.',
      stopOnLeave: 'When on, Garrison cancels the run in progress if you leave this page, close the tab, or send a new message, so nobody pays for output no one reads. Turn it off to keep runs going; they stay on the Runs page. Remembered in this browser.',
      cancel: 'Stop this run now. The worker ends the harness process within a few seconds and the output so far is kept.',
      cancelling: 'Cancel requested. The worker is stopping the harness; this changes to the final status when the run reports Cancelled.',
      sendReplaces: 'Cancel the run in progress, then start a new run with this message. Turn off "Stop the run when I leave" to keep the current run going instead.',
      sendKeeps: 'Start a new run with this message. The run in progress keeps going because "Stop the run when I leave" is off; find it on the Runs page.',
      timeLimit: 'Optional deadline for this run, in seconds, which this deployment lets callers set. Leave empty for the deployment default. The run times out when it passes the limit.',
      timePreset: 'Set the time limit for this run to {{value}}.',
      timePresetClear: 'Clear the time limit so the run uses the deployment default.',
      conversation: {
        mode: 'Run once, start a new conversation whose later turns resume this harness session, or send the next turn of an existing conversation.',
        pick: 'The conversation to continue. Only this agent\'s conversations are listed; the newest come first.',
        deploymentPinned: 'A conversation stays on the deployment of its first turn, so the deployment is fixed while continuing one.',
        open: 'Open the conversation this run belongs to, with every turn and a box to send the next one.'
      }
    },
    manifests: {
      warnings: 'Values in this document that were accepted but stored differently, for example a number outside its range that was clamped. The list under the row names each field.',
      planned: 'What applying this document would do: create the record, update it, or leave it unchanged. A dry run validates without changing anything.',
      changes: { after: 'The value the manifest sets. Long values are cut at 200 characters.', before: 'The value stored now. Long values are cut at 200 characters.', field: 'The setting of this record that the manifest changes, for example model or parameters.model.' },
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
      cloneName: 'Name for the copy. Lowercase letters, digits, hyphens, and slashes work well; the builtin/ prefix is reserved.',
      cloneConfirm: 'Create the copy with this name and open it in the editor.',
      clone: 'Make an editable copy of this template. You choose the copy\'s name before it is created.',
      reset: 'Restore this built-in template to the content Garrison ships with.',
      delete: 'Delete this template and its versions. The server refuses while any deployment binds it; the confirmation lists them.',
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
      serverInUse: 'The address this console sends API calls to. It is GARRISON_API_URL when that is set, otherwise the dashboard\'s own origin.',
      rest: 'Base address for REST API calls and SDKs.',
      mcp: 'Address MCP clients connect to. Each agent exposed as a tool appears there.',
      a2a: 'Base address of the A2A gateway for this tenant. Each agent has its own card below it.',
      openapi: 'The OpenAPI document that describes every REST operation.',
      version: 'Version of the Garrison server.',
      dashboardVersion: 'Version of this console.',
      node: 'The control-plane replica (control node) that answered this page\'s server info request. With several replicas, a reload may be answered by another one.',
      nodeLink: 'Open Fleet > Control plane to see this replica next to the others, with its status, heartbeat, and whether it is the leader.',
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
      grafana: 'Open the HTTP dashboard in Grafana in a new tab: request rates, latency, and errors over time from Prometheus metrics.',
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
      settingPath: 'Setting path: {{path}}. Use this name in the settings file and in the settings REST API.',
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
        Observability: 'Where Grafana, Prometheus, Loki, and Tempo are. Browser URLs feed the Home cards and the Grafana links; internal URLs are what the server probes for reachability. Empty means not configured.',
        Runtime: 'How the control plane bounds runs: the longest a run may take, the run guard defaults deployments follow, and how long a queued run may wait for a capable worker.',
        Rest: 'How the REST API listens: host, port, TLS, and public address.',
        Mcp: 'How the MCP server listens and how long tool calls may wait.',
        Database: 'Which database Garrison uses and how to connect.',
        Logging: 'Where logs go and how detailed they are.',
        Auth: 'Token signing, lifetimes, and sign-in rate limits.',
        Security: 'Encryption master key and bootstrap accounts.',
        RequestHistory: 'Whether API requests are captured and how much of each body is kept.',
        Telemetry: 'Metrics and tracing export.',
        Archive: 'Where runs and events are archived before retention deletes them.',
        Cluster: 'How many control-plane replicas are expected.',
        Scheduling: 'Lease lengths and heartbeat timeouts for worker nodes.',
        Runs: 'Run defaults and how long runs and events are retained.',
        Audit: 'How long audit records are kept.'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: 'The longest any run may take, in seconds. Deployment timeouts, per-run time limits, and profile defaults above it are lowered to it.',
          RepetitionGuard: 'Whether deployments that leave Repetition guard empty stop runs whose answer degenerates into repetition (outcome Repetition detected).',
          MaxAssistantChars: 'Characters of assistant text after which a run stops (outcome Output limit exceeded), for deployments that leave the limit empty. 0 is unlimited.',
          NoProgressSeconds: 'Seconds without text, thinking, or tool activity after which a run stops (outcome No progress), for deployments that leave the limit empty. 0 turns it off.',
          ConversationAffinityWaitMs: 'How long a conversation turn waits for the node holding its harness session before another node takes it and starts a fresh session from the transcript. Other nodes take it at once when that node is not ready. 0 never waits.',
          ConversationTranscriptTurns: 'Most earlier turns repeated to a conversation turn that falls back to a fresh harness session. The newest turns are kept.',
          ConversationTranscriptChars: 'Most characters of each earlier message and answer repeated to a fallback turn. Longer ones are cut and marked as truncated.'
        },
        Scheduling: {
          PauseGraceMs: 'After a host sleep or VM pause, the leader waits one heartbeat window plus this many milliseconds before it marks nodes Lost or fails their runs. Default 5000.'
        }
      }
    },
    runGuard: {
      openDeployments: 'Go to Deployments to change a deployment\'s run guards: Repetition guard, Maximum assistant characters, and No-progress timeout.',
      openSettings: 'Go to Settings to change the cluster defaults (Runtime) that deployments without their own run guards follow.'
    },
    conversationDetail: {
      viewJson: 'Show the full conversation record as JSON.',
      openInvoke: 'Open Invoke with this conversation selected, to send the next turn with the full streaming view.',
      delete: 'Delete this conversation. Its turns stay on the Runs page as ordinary runs, but the conversation can no longer be continued.',
      deleteBusy: 'A turn is still unfinished, so the server refuses to delete the conversation until that run ends or is cancelled.',
      agent: 'The agent this conversation is with. Click to open the agent.',
      openAgent: 'Open this agent\'s page with its deployments and recent runs.',
      deployment: 'Every turn runs on this deployment: the one the first turn was routed to.',
      activeRun: 'The turn that is still queued or running. The next message is refused until it finishes.',
      openRun: 'Open this run\'s page with its full transcript, result, and telemetry.',
      turns: 'Every turn of the conversation, oldest first. Each turn is a run.',
      columns: {
        turn: 'Position of the turn in the conversation, starting at 1.',
        run: 'The run that executed this turn. Click to open its transcript.',
        status: 'Where the turn\'s run is in its lifecycle: queued, running, or one of the finished states.',
        outcome: 'Why the turn\'s run ended, in more detail than the status.',
        session: 'Whether the turn resumed the harness session of the turn before it, or started a fresh session seeded with the transcript (and why).',
        input: 'The start of the message sent for this turn. Hover for more of it.',
        result: 'The start of the answer, or the error when the run failed. Hover for more of it.',
        node: 'The worker node that ran the turn.',
        created: 'When the turn was sent. Hover the value for the exact time.'
      },
      session: {
        first: 'The first turn: it starts the harness session the later turns resume.',
        resumed: 'This turn resumed the harness session {{session}} on the node that holds the conversation\'s directories, so the agent kept its full context.',
        fallback: 'This turn could not resume the session, so it started a fresh harness session seeded with the transcript of the earlier turns.',
        pending: 'The turn is waiting for a node, so it is not known yet whether it will resume the session or fall back.'
      },
      continueTitle: 'Send the next message as the next turn of this conversation. It runs on the same agent and deployment.',
      message: 'The next message for the agent. It continues the conversation with the context of the earlier turns.',
      send: 'Send this message as the next turn. The turn appears in the list above and refreshes until it finishes.',
      sendBusy: 'The previous turn is still unfinished. The server refuses a new turn until it ends, so wait or cancel it first.'
    }
  },
  analytics: {
    grafana: 'Open the Runs dashboard in Grafana in a new tab for the same time range as this page.',
    filters: {
      ttft: 'When checked, the time to first token chart leaves out the time runs spent waiting on agents they delegated to, so delegating agents compare fairly with agents that answer directly.',
      range: 'Time window for every chart and total: the last hour, day, week, or 30 days, or a custom start and end.',
      from: 'Start of the custom range, in your local time zone.',
      to: 'End of the custom range, in your local time zone.',
      agentId: 'Count only runs of this agent. The deployment list narrows to its deployments.',
      harnessType: 'Count only runs executed by this harness.',
      deploymentId: 'Count only runs of this deployment, for example to compare two models of one agent.',
      model: 'Count only runs whose harness reported this served model. The list shows models seen in the selected range.',
      groupBy: 'Split every chart into one series per agent, harness, model, or harness and model pair, so you can compare them.'
    },
    cards: {
      delegationWait: 'Average time runs spent waiting on child runs they delegated to. n/a when no run in the range delegated.',
      ttftExcludingDelegation: 'Average time to first token without the time runs waited on agents they delegated to. The note shows the 95th percentile.',
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
      delegationWaitMsAvg: 'Mean time runs waited on child runs they delegated to. Click to hide or show this line.',
      timeToFirstTokenExcludingDelegationMsP95: '95th percentile time to first token without the wait on delegated runs. Click to hide or show this line.',
      timeToFirstTokenExcludingDelegationMsP50: 'Median time to first token without the wait on delegated runs. Click to hide or show this line.',
      timeToFirstTokenExcludingDelegationMsAvg: 'Mean time to first token without the wait on delegated runs. Click to hide or show this line.',
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
  approvals: {
    title: 'How approvals work',
    p1: 'A deployment with approvals turned on makes its harness ask Garrison before tool calls: Claude Code through its permission prompt tool, and Codex app-server runs for commands and file changes.',
    p2: 'Each request is checked against the deployment\'s rules. Deny beats Ask, and Ask beats Allow; when nothing matches, the deployment default applies. Allow and Deny answer at once; Ask puts the request here and the run waits.',
    p3: 'Allow or deny a pending request with an optional reason. Remember as rule adds a rule to the deployment so the next similar call is decided automatically. Requests nobody decides expire with the deployment\'s timeout decision.'
  },
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
  modelPrices: {"title": "Model Prices", "p1": "Operator-configured USD rates for estimating cost when a harness omits it. Reported cost, including zero, takes precedence.", "p2": "Inactive prices are not used. Saved run costs do not change when prices are edited or deleted."},
  usageQuotas: {"title": "Usage Quotas", "p1": "Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "p2": "Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs. Off by default. Enable explicitly to reject runs at configured limits and lower supported harness budgets. When off, usage is monitored and limits do not affect execution."},
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
  controlNodes: {
    title: 'Control nodes and worker nodes',
    p1: 'A control node is one replica of the Garrison server. Control nodes serve the REST API, the MCP server, and the A2A gateway, authenticate callers, compile deployments into runs, and schedule those runs. Any replica can answer any request, so a load balancer can spread traffic across them.',
    p2: 'One control node is the leader. It holds a lease in the database and runs cluster-wide maintenance: retention cleanup, marking silent replicas Offline, and removing old rows. If the leader stops, another replica takes over the lease within seconds.',
    p3: 'Worker nodes, on the Worker nodes tab, do the other half: they pull leased runs from the control plane and execute the harnesses. Control nodes never run a harness, and workers never touch the database. Every replica registers itself and heartbeats every 5 seconds, so this tab is read-only.'
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
  },
  conversations: {
    title: 'Conversations and turns',
    p1: 'A conversation is a series of runs with one agent. The first turn starts a harness session; each later turn resumes that session on the same worker node, so the agent keeps its files, tools, and context between messages.',
    p2: 'Only one turn runs at a time: a new message is refused while the previous turn is unfinished. Every turn stays on the deployment of the first turn.',
    p3: 'When a turn cannot resume (the node is gone or busy for too long, the files were removed, or the harness cannot resume), it falls back to a fresh session seeded with the transcript of the earlier turns. The Fallbacks column counts these turns and the turn list says why.'
  }
};

export { tips, explainers };

tips.views.settings.groups.Leases = "Optional coordination backend; configure all replicas consistently and restart. Database is the default.";
tips.views.settings.fields.Leases = {"Provider": "Optional coordination backend; configure all replicas consistently and restart. Database is the default.", "ClutchEndpoint": "Supply a Clutch access key through a secret or environment override; endpoints must not contain credentials.", "ClutchAccessKey": "Supply a Clutch access key through a secret or environment override; endpoints must not contain credentials.", "KeyPrefix": "Optional coordination backend; configure all replicas consistently and restart. Database is the default.", "RequestTimeoutMs": "Optional coordination backend; configure all replicas consistently and restart. Database is the default.", "SweepIntervalMs": "Optional coordination backend; configure all replicas consistently and restart. Database is the default.", "MaxLeaseMs": "Optional coordination backend; configure all replicas consistently and restart. Database is the default.", "MaxHoldMs": "Optional coordination backend; configure all replicas consistently and restart. Database is the default."};

tips.enums.harnessType.ProviderApi = "Optional direct provider API loop through PolyPrompt. Requires an endpoint and model; CLI deployments are unchanged.";
tips.enums.harnessType.OpenCode = "opencode CLI, run headless with opencode run and JSON events. Works with Anthropic, OpenAI, Google, and other model providers.";
tips.enums.harnessType.Pi = "pi coding agent, run with --mode json. Works with Anthropic, OpenAI, Google, and other model providers.";

// Pipelines (P12.9).
tips.nav.hubs.approvals = 'Everything waiting for a person: tool calls agents asked to make and pipeline stages that require a review, with the history of every decision.';
tips.nav.approvalsBadgeCombined = 'Waiting for a person: tool call approvals ({{approvals}}) and pipeline stage reviews ({{reviews}}). Open Approvals to decide them.';
Object.assign(tips.nav.tabs, {
  approvals: 'Tool calls agents asked to make that wait for a person to allow or deny them, and every past decision by rule, default, person, or timeout.',
  pipelineReviews: 'Pipeline stages that finished and wait for a person: approve them, request changes (the stage runs again with your feedback), or reject them.',
  pipelines: 'Chains of agents: each stage runs one agent, hands its output to the next stage through a prompt template, and can wait for a review.',
  pipelineRuns: 'Every execution of a pipeline with its status and outcome. Open one for the stage timeline, its stage runs, and its reviews.'
});
tips.filters.pipelineId = 'Show only records of one pipeline. Choose All to remove the filter.';
tips.filters.pipelineRunId = 'Show only the reviews of one pipeline run. Paste an ID such as plr_...; the list updates when you stop typing.';
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: 'A stage is running, starting, or about to start.',
    AwaitingReview: 'A stage finished and waits for a person to approve it, request changes, or reject it.',
    Cancelling: 'Cancellation was requested; the current stage run is being stopped.',
    Succeeded: 'Every stage finished and every review gate was approved.',
    Failed: 'A stage failed after its attempts, could not start, or a reviewer rejected it. Retry resumes at that stage.',
    Cancelled: 'Someone cancelled the pipeline run. Retry resumes at the stage where it stopped.',
    TimedOut: 'The pipeline ran longer than its time limit, including time spent waiting for reviews.'
  },
  pipelineRunOutcome: {
    None: 'The pipeline run has not finished yet.',
    Succeeded: 'Every stage succeeded and every review was approved.',
    StageFailed: 'A stage failed on every attempt and does not continue on failure.',
    StageStartFailed: 'A stage could not start, for example because its agent or deployment is gone or its prompt did not compile.',
    ReviewRejected: 'A reviewer rejected a stage, which ends the pipeline run.',
    ReviewExpired: 'A review timed out and its timeout action was Reject.',
    Cancelled: 'Someone cancelled the pipeline run or one of its stage runs.',
    TimedOut: 'The pipeline ran past its time limit.',
    InternalError: 'The server hit an unexpected error while advancing the pipeline. Check the server logs.'
  },
  pipelineStageStatus: {
    Pending: 'The stage has not started; earlier stages are still running.',
    Running: 'The stage run is queued or running. A failed attempt starts a new execution until the attempts run out.',
    AwaitingReview: 'The stage finished and waits for a person to review its output.',
    Succeeded: 'The stage finished and, if it requires a review, was approved.',
    Failed: 'The stage failed on every attempt, could not start, or was rejected.',
    Cancelled: 'The stage stopped because the pipeline run was cancelled or timed out.'
  },
  pipelineReviewStatus: {
    Pending: 'Waiting for a person to approve, request changes, or reject.',
    Approved: 'Approved: the pipeline moved on to the next stage, with the notes if any.',
    ChangesRequested: 'Changes requested: the stage ran again with the feedback.',
    Rejected: 'Rejected: the pipeline run failed at this stage.',
    Expired: 'Nobody decided in time, so the stage\'s timeout action decided it.',
    Cancelled: 'The pipeline run stopped before anyone decided.'
  },
  pipelineReviewDecision: {
    Approve: 'Accept the stage output and continue with the next stage. Optional notes go to the next stage.',
    RequestChanges: 'Run the same stage again with your feedback. Limited by the stage\'s maximum revisions.',
    Reject: 'Stop the pipeline run here. It fails with the outcome Review rejected.'
  },
  pipelineReviewSource: {
    User: 'A person decided the review.',
    Timeout: 'The review timed out and the stage\'s timeout action decided it.',
    Cancelled: 'The pipeline run was cancelled or timed out while the review was pending.'
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: 'A person or a timeout approved, rejected, or requested changes to a pipeline stage review.',
  PipelineRunCancelled: 'Someone cancelled a pipeline run, its pending review, and its current stage run.'
});
Object.assign(tips.resources.runs, {
  pipelineRunId: 'The pipeline run this run is a stage of, with the stage position and execution. Empty for runs outside pipelines.',
  pipelineStage: 'Stage position in the pipeline and which execution of that stage this run is (retries and revisions add executions).'
});
tips.resources.pipelines = {
  add: 'Create a pipeline: an ordered list of stages, each running one agent and handing its output to the next.',
  name: 'Unique pipeline name in this tenant, used by the API, MCP tools, SDKs, and manifests. Lowercase letters, digits, and hyphens.',
  stages: 'The stages in run order. Each stage runs one agent; its output is handed to the next stage through a prompt template.',
  reviewGates: 'How many stages wait for a person to review their output before the pipeline continues.',
  maxDurationSeconds: 'Longest the whole pipeline run may take, in seconds, including review waits. 0 means no limit; past it the run times out.',
  version: 'Increases with every saved change. Pipeline runs record the version they started with and keep its stages.',
  stageHeading: 'One stage of the pipeline, run in the order shown. Use the arrows to move it and the bin to remove it.',
  moveUp: 'Move this stage one place earlier. Stages run in the order shown.',
  moveDown: 'Move this stage one place later. Stages run in the order shown.',
  removeStage: 'Remove this stage from the pipeline. A pipeline needs at least one stage.',
  addStage: 'Add a stage at the end of the pipeline. It receives the output of the stage before it.',
  stagesItems: {
    name: 'Name of this stage, unique within the pipeline. Shown in the timeline, reviews, and handoff prompts.',
    agentId: 'The agent this stage runs. Starting the pipeline needs permission to execute every stage agent.',
    deploymentId: 'A fixed deployment of the stage agent. Empty picks one of the agent\'s active deployments by weight, like an ordinary invoke.',
    handoffTemplateId: 'Task prompt template that wraps this stage\'s task with earlier outputs, review notes, and revision feedback. Empty uses the deployment\'s PipelineStage binding or the built-in template.',
    handoffTemplateVersion: 'Use this version of the handoff template even after it changes. Empty always uses the current version.',
    outputCharLimit: 'Most characters of each earlier stage\'s output passed to this stage. Longer outputs are cut and marked as truncated.',
    maxAttempts: 'How many times the stage runs when its run fails or times out, before the stage counts as failed.',
    continueOnFailure: 'When the stage fails on every attempt, continue with the next stage anyway; that stage sees the failure in the handoff.',
    requiresReview: 'After the stage finishes, wait for a person to approve it, request changes, or reject it under Approvals > Stage reviews.',
    reviewTimeoutSeconds: 'How long the review may wait before the timeout action decides it. 0 waits until a person decides.',
    reviewTimeoutAction: 'What happens when the review times out: approve and continue, or reject and fail the pipeline run.',
    maxRevisions: 'How many times a reviewer may request changes to this stage. After that only Approve and Reject remain.',
    description: 'Free-text note about what this stage does, for people. It is not sent to the agent.',
    parameters: 'Run parameter overrides for this stage\'s runs, such as model or format. Allowed only with a deployment that lets callers override them.'
  },
  actions: {
    start: 'Start this pipeline with input text and follow its stages on the pipeline run page.',
    preview: 'Render every stage prompt from sample input and sample stage outputs, without starting any run.',
    runs: 'Show the runs of this pipeline on the Pipeline runs tab.'
  }
};
tips.resources.pipelineRuns = {
  id: 'Pipeline run identifier (plr_...). Use it with the API, MCP tools, and SDKs.',
  pipelineName: 'The pipeline this run executes. Pipeline runs keep the stages of the version they started with.',
  pipelineVersion: 'The pipeline version this run started with. Later edits to the pipeline do not change it.',
  status: 'Where the pipeline run is now: running, awaiting a review, cancelling, or finished.',
  outcome: 'Why the pipeline run finished: succeeded, a stage failed or could not start, a review was rejected or expired, cancelled, or timed out.',
  progress: 'The stage the pipeline run is at, out of all its stages.',
  callerName: 'The user or access key that started the pipeline run.',
  errorMessage: 'What went wrong, when the pipeline run failed or timed out.',
  priority: 'Queue priority given to every stage run. Higher numbers are scheduled first.',
  deadlineUtc: 'When the pipeline run times out, from the pipeline\'s time limit. Empty when there is no limit.',
  completedUtc: 'When the pipeline run finished.',
  createdUtc: 'When the pipeline run was started. Hover the value for the exact time.',
  actions: {
    cancel: 'Cancel the pipeline run: its current stage run is cancelled and a pending review is closed.',
    retry: 'Resume a failed, timed out, or cancelled pipeline run at the stage where it stopped, with a new execution of that stage.',
    stageRuns: 'Show the runs of every stage of this pipeline run on the Runs tab.',
    finalRun: 'Open the run of the last stage, whose result is the result of the pipeline.'
  }
};
tips.resources.pipelineReviews = {
  createdUtc: 'When the stage finished and the review was requested. Hover the value for the exact time.',
  pipelineName: 'The pipeline whose stage waits for the review.',
  stageName: 'The stage to review, with its position and which execution of the stage produced the output.',
  positionExecution: 'Stage position in the pipeline, and which execution of the stage this review covers. Revisions add executions.',
  status: 'Pending reviews wait for a person; the others show how the review ended.',
  decision: 'Approve, Request changes, or Reject, once the review is decided.',
  decisionSource: 'Who decided: a person, the stage\'s review timeout, or the pipeline run stopping.',
  comment: 'Notes passed to the next stage (approve), feedback the stage ran again with (request changes), or the reason (reject).',
  decidedBy: 'The person who decided the review.',
  expiresUtc: 'When the review times out and the stage\'s timeout action decides it. Empty when it waits until a person decides.',
  pipelineRunId: 'The pipeline run this review belongs to. Click a row to open its stage timeline.',
  runId: 'The stage run whose output is under review. Open it to read the result before deciding.',
  decidedUtc: 'When the review was decided.',
  id: 'Review identifier (prv_...). Use it with the API, MCP tools, and SDKs to decide the review.',
  filters: { decisionSource: 'Show only reviews decided one way: by a person, by the review timeout, or by the pipeline run stopping.' },
  actions: {
    approve: 'Approve the stage output and let the pipeline continue, optionally with notes for the next stage.',
    requestChanges: 'Run the stage again with your feedback. Each request uses one of the stage\'s revisions.',
    reject: 'Reject the stage output. The pipeline run fails with the outcome Review rejected.',
    openStageRun: 'Open the stage run under review to read its transcript and result.'
  }
};
tips.pipelineReviews = {
  revisionsLeft: 'How many more times changes may be requested for this stage before only Approve and Reject remain.',
  decide: {
    decision: 'Choose what happens to the stage output. The pipeline run continues as soon as you submit.',
    Approve: 'Accept the stage output; the pipeline continues with the next stage, or succeeds after the last one.',
    RequestChanges: 'Send the stage back with feedback. It runs again and comes back for review.',
    Reject: 'Refuse the stage output. The pipeline run stops and fails.',
    commentApprove: 'Optional notes the next stage receives together with this stage\'s output.',
    commentRequestChanges: 'Required feedback. The stage runs again with it, so say what to change.',
    commentReject: 'Optional reason, saved with the decision and in the audit log.',
    submitApprove: 'Approve the stage now. The decision is final and cannot be changed afterwards.',
    submitRequestChanges: 'Send the feedback now. The stage runs again; its next output comes back for review.',
    submitReject: 'Reject the stage now. The pipeline run fails; this cannot be undone, but it can be retried.'
  }
};
tips.pipelineStart = {
  input: 'The task for the pipeline. The first stage works on it, and every later stage sees it as the original task next to the earlier outputs.',
  submit: 'Start a pipeline run with this input and open its stage timeline.'
};
tips.pipelinePreview = {
  input: 'Sample caller input used to render every stage prompt. Nothing is run.',
  sampleOutput: 'Pretend output of stage {{stage}}, handed to the stage after it in the preview.',
  render: 'Render every stage prompt with these samples, as the stage runs would receive them. Secrets are redacted.',
  stage: 'The prompt this stage would receive, rendered from its handoff template with the samples above.',
  rendered: 'The stage prompt rendered without errors.',
  failed: 'The stage prompt could not be rendered; the message says why, for example a missing agent or deployment.'
};
Object.assign(tips.views.runDetail, {
  pipelineRun: 'This run is a stage of a pipeline run. The text after the ID names the stage position and execution.',
  openPipelineRun: 'Open the pipeline run this run belongs to, with its stage timeline and reviews.'
});
tips.views.pipelineRunDetail = {
  viewJson: 'Show the full pipeline run with its stages, stage runs, and reviews as JSON.',
  delete: 'Delete this finished pipeline run and its reviews. Its stage runs stay on the Runs page.',
  live: 'Updates arrive over the live connection as soon as a stage or review changes.',
  polling: 'The live connection is not available, so the page re-reads the pipeline run every few seconds.',
  pipeline: 'The pipeline this run executes, with the version it started with. Click to find it under Agents > Pipelines.',
  openPipeline: 'Open Agents > Pipelines filtered to this pipeline.',
  openRun: 'Open this stage run with its transcript, result, and telemetry.',
  finalRun: 'The run of the last stage. Its result is the result of the pipeline run.',
  started: 'When the first stage run was created.',
  input: 'The input the pipeline run was started with. Every stage sees it as the original task.',
  reviewTitle: 'A stage finished and waits for your decision. Read its output in the stage run, then decide.',
  stages: 'Every stage in run order with its status, executions, attempts, revisions, stage runs, and reviews.',
  current: 'The stage the pipeline run is at now.',
  reviewGate: 'This stage waits for a person to review its output before the pipeline continues.',
  agent: 'The agent this stage runs, as recorded when the pipeline run started.',
  counts: 'Executions count every run of the stage; attempts count runs since the last review; revisions count requested changes.',
  reviewItem: 'A review of one execution of this stage and how it was decided.',
  columns: {
    execution: 'Which execution of the stage this run is. Retries after failures and revisions after reviews add executions.',
    run: 'The stage run. Click to open its transcript and result.',
    status: 'Status of the stage run: queued, running, or how it finished.',
    outcome: 'Why the stage run finished.',
    error: 'Error message of the stage run, when it failed.',
    created: 'When the stage run was created.'
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'How often the leader advances pipeline runs that missed a completion signal, retries blocked stage starts, and applies review timeouts and pipeline time limits, in milliseconds.';
tips.views.settings.fields.Runtime.PipelineMaxStages = 'Most stages a pipeline definition may have. Saving a pipeline with more stages is refused.';
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: 'Most queued delegated runs whose parent is waiting on them, across the cluster. A run that starts waiting on another delegated run beyond this fails at once with DelegationCapacityExhausted.',
  DelegationRetryAfterSeconds: 'Seconds suggested in Retry-After when a delegation that waits is refused with DelegationCapacityExhausted.'
});
Object.assign(explainers, {
  pipelines: {
    title: 'Pipelines and stages',
    p1: 'A pipeline chains agents. Each stage runs one agent, optionally on a fixed deployment, and hands its output (text, structured output, and artifact references) to the next stage through a prompt template.',
    p2: 'A stage can retry failed runs, continue past a failure, and wait for a review. Reviews appear under Approvals > Stage reviews; requesting changes runs the stage again with the feedback.',
    p3: 'Editing a pipeline creates a new version. Pipeline runs that already started keep the stages they started with.'
  },
  pipelineRuns: {
    title: 'Pipeline runs',
    p1: 'A pipeline run executes the stages of one pipeline version in order. Every stage execution is an ordinary run, linked from the stage timeline.',
    p2: 'Cancel stops the current stage run and closes a pending review. Retry resumes a failed, timed out, or cancelled pipeline run at the stage where it stopped.'
  },
  pipelineReviews: {
    title: 'Stage reviews',
    p1: 'A stage that requires a review waits here after it finishes. Approve continues with the next stage, Request changes runs the stage again with your feedback, and Reject fails the pipeline run.',
    p2: 'Reviews without a timeout wait until a person decides. With a timeout, the stage\'s timeout action decides when time runs out.'
  }
});
tips.views.settings.fields.Scheduling = Object.assign(tips.views.settings.fields.Scheduling || {}, {
  QueueWakeFanout: "How many waiting worker lease requests each replica wakes for a newly queued run, among those whose worker could take it. A request that cannot take the run hands it to the next one. 0 wakes every matching request on every replica, as before. Default 1.",
  RemoteWakeDelayMs: "How long other replicas wait before waking one of their own lease requests for a run whose replica already woke one, in milliseconds. The wait ends early when the run is claimed or when that replica has no request left that could take it. 0 wakes one request on every replica at once. Default 250."
});
tips.views.settings.fields.Auth = Object.assign(tips.views.settings.fields.Auth || {}, {
  CacheSeconds: "How long each replica keeps the sessions, tenants, users, and credentials it reads to authenticate requests, in seconds. Revoking a token or changing users, credentials, roles, or tenants through the API takes effect on every replica at once; this is the longest a change made any other way can go unnoticed. 0 turns the cache off. Default 5."
});

// Triggers (P12.5) and notification endpoints (P12.14).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "nav": {
  "tabs": {
   "triggers": "Start runs without a caller: cron schedules evaluated in a time zone, and webhook URLs that accept HMAC-signed requests from other systems.",
   "notifications": "Tell other systems what happened: Garrison POSTs a signed JSON notification when a run or pipeline finishes or an approval waits for a person."
  }
 },
 "filters": {
  "type": "Show only cron triggers or only webhook triggers. Choose All to see both.",
  "outcome": "Show only fires that started a run, failed, or were skipped. Choose All to see every fire.",
  "deliveryStatus": "Show only deliveries in one state: waiting, being sent, delivered, or given up."
 },
 "enums": {
  "triggerType": {
   "Cron": "Fires on a five-field cron schedule evaluated by the control-plane leader in the trigger time zone.",
   "Webhook": "Fires when a request signed with the trigger secret arrives at its webhook URL."
  },
  "triggerTargetType": {
   "Agent": "Each fire queues one run of the agent, on a fixed deployment or by traffic weight.",
   "Pipeline": "Each fire starts one run of the pipeline with all of its stages."
  },
  "triggerFireSource": {
   "Cron": "The cron schedule came due and the leader fired it.",
   "Webhook": "A correctly signed webhook delivery arrived.",
   "Manual": "A person or credential used the Fire now action."
  },
  "triggerFireOutcome": {
   "Started": "The fire created a run or pipeline run; follow the link to see it.",
   "Failed": "Nothing started: the template failed, the run-as principal lost access, or the target was missing.",
   "Skipped": "The occurrence was missed for longer than the cron catch-up limit and was not fired."
  },
  "notificationEvent": {
   "RunSucceeded": "Sent when a run finishes with status Succeeded.",
   "RunFailed": "Sent when a run finishes with status Failed or Rejected.",
   "RunCancelled": "Sent when a run is cancelled before it finishes.",
   "RunTimedOut": "Sent when a run passes its deadline and is stopped.",
   "PipelineCompleted": "Sent when every stage of a pipeline run succeeded.",
   "PipelineFailed": "Sent when a pipeline run fails, times out, or is cancelled.",
   "ApprovalRequested": "Sent when a tool call approval or a pipeline stage review waits for a person.",
   "Test": "Sent only by the Send test action, to check that the endpoint works."
  },
  "notificationDeliveryStatus": {
   "Pending": "Waiting for its next attempt; failed attempts are retried with growing delays.",
   "Delivering": "A control-plane replica is sending it right now.",
   "Succeeded": "The endpoint answered with a 2xx status and the notification is done.",
   "Failed": "Garrison stopped trying: the attempts ran out or the endpoint answered with a status that is not retried."
  },
  "runKind": {
   "Invoke": "Started by a caller over REST, MCP, A2A, or the dashboard.",
   "Delegated": "Started by another agent through Garrison delegation.",
   "Test": "A test run of one deployment from the dashboard or API.",
   "Retry": "A new attempt of an earlier run that someone retried.",
   "Pipeline": "One stage execution of a pipeline run.",
   "Trigger": "Started by a cron schedule, a signed webhook, or a manual fire of a trigger."
  },
  "auditEventType": {
   "SigningSecretRotated": "Someone replaced the signing secret of a trigger or a notification endpoint; the old secret stopped working."
  }
 },
 "resources": {
  "runs": {
   "triggerId": "The trigger that started this run, if any. Click it to open that trigger's fire history.",
   "kind": "How the run was started: by a caller, by another agent, as a test, retry, pipeline stage, or by a trigger.",
   "openTrigger": "Open the fire history of the trigger that started this run."
  },
  "triggers": {
   "add": "Create a cron schedule or a signed webhook that starts an agent or pipeline without anyone invoking it.",
   "type": "Cron fires on a schedule; Webhook fires when another system sends a signed request. It cannot change later.",
   "target": "What each fire starts: a run of an agent or a run of a pipeline.",
   "schedule": "The cron expression and its time zone, or the note that the trigger waits for webhook deliveries.",
   "lastFire": "When the trigger last fired and whether that fire started a run.",
   "nextFireUtc": "When an active cron trigger fires next. Webhook and inactive triggers have none.",
   "fireCount": "How many times this trigger fired, including failed and skipped fires.",
   "runAs": "The user or credential runs started by this trigger act as. Every fire checks that it may still run the target.",
   "signingSecretLast4": "The last four characters of the webhook signing secret, so you can tell which secret a sender uses.",
   "targetType": "Whether each fire runs one agent or starts a whole pipeline.",
   "agentId": "The agent each fire runs. You need permission to execute it.",
   "deploymentId": "Pin runs to one deployment of the agent, or leave empty to choose by traffic weight.",
   "pipelineId": "The pipeline each fire starts. You need permission to start it and to run its stage agents.",
   "inputTemplateId": "The prompt template that turns the fire (time, payload, delivery ID) into the run input.",
   "priority": "Queue priority of the runs this trigger starts, from -100 to 100. Higher runs are leased first.",
   "cronExpression": "When the trigger fires, as a five-field cron expression or a macro such as @hourly.",
   "timeZone": "The IANA time zone the cron expression is read in, for example Europe/Berlin.",
   "webhook": "Send signed POST requests here. Requests with a missing, stale, or wrong signature are refused with 401.",
   "actions": {
    "fire": "Fire this trigger once now, optionally with a test payload, and see the run it started.",
    "fires": "See when this trigger fired, why, and which run or pipeline run each fire started.",
    "runs": "Open the Runs list filtered to the runs this trigger started.",
    "rotateSecret": "Create a new webhook signing secret. The old one stops working immediately."
   },
   "fires": {
    "firedUtc": "When the fire was processed. Cron fires also show the occurrence they were for.",
    "source": "Why the trigger fired: its schedule, a webhook delivery, or a person.",
    "outcome": "Whether the fire started a run, failed, or was skipped.",
    "started": "The run or pipeline run this fire created. Click it to open it.",
    "deliveryId": "The X-Garrison-Delivery header of the webhook request; repeats with the same value fire once.",
    "error": "Why the fire did not start anything, with a stable error code.",
    "runId": "The run this fire created. Click it to open the run.",
    "pipelineRunId": "The pipeline run this fire started. Click it to open it."
   }
  },
  "notifications": {
   "add": "Register a URL that receives a signed HTTP POST when chosen events happen in this tenant.",
   "url": "Where Garrison sends notifications. Private and metadata addresses are refused and redirects are not followed.",
   "events": "The events this endpoint receives. Hover a value in the list to see all of them.",
   "filters": "Agent or deployment filters that narrow which run and approval events are sent.",
   "signingSecretLast4": "The last four characters of the signing secret, so receivers can tell which secret signs requests.",
   "includeResultText": "Whether run notifications carry the run result text, cut to the configured limit.",
   "agentId": "Send only events about runs of this agent. Pipeline events stop while a filter is set.",
   "deploymentId": "Send only events about runs of this deployment. Pipeline events stop while a filter is set.",
   "resultTextMaxChars": "Longest result text included in a notification, in characters.",
   "actions": {
    "test": "Send a Test notification now and show whether the endpoint accepted it.",
    "deliveries": "See every notification sent to this endpoint with attempts, HTTP status, and errors.",
    "rotateSecret": "Create a new signing secret. Retries already queued are signed with it too."
   },
   "deliveries": {
    "createdUtc": "When the event was queued for this endpoint. Click it to show the delivery details.",
    "event": "Which event this notification reports.",
    "status": "Whether the notification is waiting, being sent, delivered, or given up.",
    "attempts": "Attempts made so far and the most that will be made.",
    "lastStatusCode": "HTTP status the endpoint answered on the last attempt; empty when no response arrived.",
    "lastError": "What went wrong on the last attempt, such as a timeout or a refused destination.",
    "lastAttemptUtc": "When the last attempt to send this notification was made.",
    "nextAttemptUtc": "When the next retry is due; empty once the delivery is finished.",
    "deliveredUtc": "When the endpoint accepted the notification.",
    "payload": "The exact JSON body sent on every attempt. It never contains secrets.",
    "id": "Delivery identifier, also sent as X-Garrison-Delivery so receivers can ignore repeats."
   }
  }
 },
 "views": {
  "runDetail": {
   "trigger": "The trigger that started this run, and how the run was started.",
   "openTrigger": "Open the fire history of this trigger in Agents > Triggers."
  },
  "pipelineRunDetail": {
   "trigger": "The trigger that started this pipeline run. Its stage runs carry the same trigger."
  },
  "settings": {
   "groups": {
    "Triggers": "Limits for trigger webhooks, cron catch-up after downtime, and how long fire history is kept.",
    "Notifications": "Outbound notification delivery: SSRF protection, retries and backoff, timeouts, and how long the delivery log is kept."
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Largest webhook request body in bytes. Larger deliveries answer 413 before the signature is checked.",
     "WebhookToleranceSeconds": "Largest difference between a webhook signature timestamp and the server clock. Older deliveries are refused, so captured requests cannot be replayed.",
     "CronMaxLatenessSeconds": "Missed cron occurrences collapse into one fire, unless the latest is older than this many seconds; then it is recorded as Skipped. 0 always fires once.",
     "FireRetentionDays": "Days trigger fire history is kept before it is deleted."
    },
    "Notifications": {
     "AllowPrivateDestinations": "Allow notification URLs on loopback and private networks. Off by default to prevent server-side request forgery; link-local and metadata addresses stay blocked.",
     "MaxAttempts": "Most delivery attempts for one notification before it is marked as given up.",
     "InitialBackoffSeconds": "Delay before the second attempt; each later delay doubles up to the longest retry delay.",
     "MaxBackoffSeconds": "The longest delay between two attempts of one notification.",
     "TimeoutSeconds": "Seconds one delivery attempt may take, including the connection.",
     "DispatchIntervalMs": "How often each control-plane replica looks for notifications that are due, in milliseconds.",
     "SweepOverlapSeconds": "Seconds of already scanned history the leader reads again on each pass, so late events are not missed.",
     "DeliveryRetentionDays": "Days finished deliveries stay in the delivery log."
    }
   }
  }
 },
 "signingSecret": {
  "done": "Close this window. The secret cannot be shown again, so copy it first.",
  "secret": "The signing secret. Senders and receivers use it to compute the HMAC-SHA256 signature.",
  "copy": "Copy the signing secret to the clipboard so you can store it in the other system.",
  "url": "The URL other systems POST signed webhook deliveries to.",
  "copyUrl": "Copy the webhook URL to the clipboard."
 },
 "triggerFire": {
  "submit": "Fire the trigger once now with this payload. The run starts as the trigger's run-as principal.",
  "body": "Optional payload text. The input template sees it as webhook.body, and as webhook.json when it is JSON.",
  "contentType": "Media type of the payload, such as application/json. Leave empty for plain text.",
  "openRun": "Open the run this fire started.",
  "openPipelineRun": "Open the pipeline run this fire started."
 },
 "triggerFires": {
  "refresh": "Load the newest fires of this trigger again."
 },
 "notificationDeliveries": {
  "refresh": "Load the newest deliveries of this endpoint again.",
  "open": "Show this delivery's payload, attempts, and last error below the list.",
  "detail": "Every field of the selected delivery, including the JSON payload that was sent."
 }
});
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(explainers, {
 "triggers": {
  "title": "Triggers",
  "p1": "A trigger starts an agent run or a pipeline run without anyone invoking it: on a cron schedule, or when another system sends a webhook signed with the trigger's secret.",
  "p2": "The run input comes from a prompt template that can use the fire time and the webhook payload. Runs act as the user or credential that last saved the trigger, and every fire checks that it may still run the target.",
  "p3": "If no control-plane replica could fire a schedule for a while, the missed occurrences become one fire. Webhook deliveries that repeat an X-Garrison-Delivery value fire once."
 },
 "notifications": {
  "title": "Notifications",
  "p1": "A notification endpoint receives a signed JSON POST when a subscribed event happens: a run or pipeline finishing, or an approval waiting for a person.",
  "p2": "Deliveries are queued durably and retried with growing delays. The same delivery ID is sent on every attempt, so receivers can ignore repeats.",
  "p3": "Notifications never include secrets or run input, and include run output only when you allow it. Private network addresses are refused unless an operator allows them."
 }
});

// Transcript export (P12.27), manifest bundle export (P12.21), and schema invoke forms (P12.22).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "components": {
  "transcriptExport": {
   "menu": "Download this transcript as a file: input, assistant text, tool calls, approvals, errors, usage, and cost, with secrets redacted.",
   "markdown": "Download a readable Markdown transcript, suitable for sharing or attaching to a ticket.",
   "json": "Download the transcript as a typed JSON document (garrison.transcript/v1) for scripts and other tools.",
   "includeThinking": "Also include the model thinking events. They are left out by default because they are long and internal."
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "This agent has an input schema, so its input is a JSON document. Fill in the form, or switch to raw JSON.",
    "modeForm": "Edit the input with a form generated from the agent input schema.",
    "modeJson": "Edit the input as raw JSON text. Values carry over when you switch back to the form.",
    "field": "Value for {{name}}, as the agent input schema describes it.",
    "fieldWithDescription": "{{name}}: {{description}}",
    "addItem": "Add another item to this list.",
    "removeItem": "Remove this item from the list.",
    "jsonLabel": "The JSON document sent as the run input. It must match the agent input schema."
   }
  },
  "manifests": {
   "bundle": {
    "scopeAll": "Export every resource this tenant owns. Built-ins are left out unless you include them.",
    "scopeSelected": "Export only the kinds and resources you choose, optionally with what they depend on.",
    "kinds": "Export every resource of the checked kinds.",
    "kind": "Export every {{kind}} in this tenant.",
    "resources": "Specific resources to export, written as Kind/name, for example Agent/triage or Pipeline/release.",
    "followReferences": "Also export what the selection depends on: deployments, harness profiles, prompt templates, workspaces, MCP servers, triggers, and notification endpoints. Secrets are listed as requirements, never exported.",
    "includeBuiltIn": "Add the built-in prompt templates and harness profiles the bundle references. Applying leaves built-ins unchanged and only checks that they exist."
   }
  }
 }
});

// Agent revisions, environments, and promotions (AD1.9).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "enums": {
  "agentRevisionState": {
   "Draft": "An unpublished revision. Only one draft is open per agent; no deployment runs it until it is published.",
   "Published": "A frozen revision. Deployments that follow the latest revision, or pin this one, run it."
  },
  "promotionKind": {
   "Promote": "Pinned the deployments of an environment to a revision taken from the environment before it.",
   "Rollback": "Restored the revision pins a promotion replaced, exactly as they were before it."
  },
  "promotionOutcome": {
   "Applied": "The pins this record set are still in place.",
   "RolledBack": "A later rollback restored the pins this promotion replaced."
  },
  "revisionChangeType": {
   "Changed": "The field has a different value in the newer revision.",
   "Added": "The field or list entry exists only in the newer revision.",
   "Removed": "The field or list entry exists only in the older revision."
  }
 },
 "filters": {
  "environment": "Show only deployments in one environment, such as dev, staging, or prod. Applies to the loaded page."
 },
 "resources": {
  "deployments": {
   "environment": "The environment this deployment belongs to. Promotions move a revision from one environment to the next in the tenant's order.",
   "agentRevisionId": "The agent revision this deployment runs. Latest follows each newly published revision; a pinned revision stays until changed or promoted.",
   "environmentBadge": "This deployment runs in the {{environment}} environment.",
   "followsLatest": "Not pinned: this deployment runs the agent's latest published revision.",
   "pinnedRevision": "Pinned: this deployment runs {{revision}} until the pin changes.",
   "actions": {
    "promote": "Promote the agent's revision from one environment to the next, updating the pins of every deployment there.",
    "promotions": "See past promotions and rollbacks, and roll a promotion back to restore the previous pins."
   }
  }
 },
 "views": {
  "agentDetail": {
   "reviewDraft": "Open the Revisions tab to compare the draft with the latest published revision and publish or discard it.",
   "tabs": {
    "revisions": "Every saved revision of this agent: compare any two, publish the draft, or discard it."
   },
   "columns": {
    "environment": "The environment the deployment belongs to, used by promotions.",
    "revision": "The revision the deployment runs: Latest follows each publish, a number is a pin."
   }
  }
 },
 "revisions": {
  "columns": {
   "number": "Revision number. Numbers increase with each saved revision of this agent.",
   "state": "Draft revisions can still change; published revisions are frozen.",
   "author": "Who saved this revision: the user or access key that created or last replaced it.",
   "changeNote": "What changed and why, as written when the revision was published.",
   "publishedUtc": "When the revision was published. Empty for the draft.",
   "actions": "Compare, publish, or discard a revision."
  },
  "latest": "The latest published revision. Deployments without a pin run this one.",
  "compare": "Show what changed between this revision and the published revision before it.",
  "publish": "Publish this draft so it becomes the latest published revision.",
  "discard": "Delete this draft. Published revisions are not affected.",
  "discardConfirm": "Delete the draft permanently. This cannot be undone.",
  "from": "The older side of the comparison: values shown as Before.",
  "to": "The newer side of the comparison: values shown as After.",
  "publishSubmit": "Publish the draft now. Deployments that follow the latest revision run it from their next run.",
  "changeNote": "Optional note saved with the published revision and shown in the revision list. Up to 2000 characters.",
  "diffColumns": {
   "field": "The revision field that differs, such as description or promptPins.",
   "change": "Whether the field was changed, added, or removed.",
   "before": "The value in the older revision.",
   "after": "The value in the newer revision."
  }
 },
 "promote": {
  "agent": "The agent whose revision is promoted. Its deployments in the target environment are updated.",
  "revision": "Leave on the source revision to promote what the source environment runs, or pick a published revision.",
  "source": "The environment the revision comes from.",
  "target": "The environment to update. Defaults to the one after the source in the tenant's order.",
  "allowSkip": "Required when the target is not the next environment. Skipped environments are recorded with the promotion.",
  "note": "Optional note saved with the promotion record. Up to 2000 characters.",
  "submit": "Apply the promotion now. Every deployment of the agent in the target environment gets the new pin."
 },
 "promotions": {
  "agentFilter": "Show only promotions and rollbacks of one agent.",
  "refresh": "Reload the promotion history from the server.",
  "columns": {
   "createdUtc": "When the promotion or rollback was applied.",
   "kind": "Promotion, or a rollback of an earlier promotion.",
   "outcome": "Whether the pins are still in place or were rolled back later.",
   "agent": "The agent whose deployments were updated.",
   "revision": "The revision that was promoted.",
   "environments": "Source and target environment of the promotion.",
   "deployments": "Each deployment that was updated, with its pin before and after.",
   "actor": "Who applied the promotion or rollback.",
   "note": "The note given when the record was created.",
   "actions": "Roll back an applied promotion."
  },
  "skipped": "This promotion skipped at least one environment, which needed Allow skipping.",
  "rollback": "Restore the revision pins these deployments had before this promotion.",
  "rollbackConfirm": "Apply the rollback now. It is recorded in the promotion history.",
  "rollbackNote": "Optional note saved with the rollback record. Up to 2000 characters."
 }
});

// Agent assets: the Assets page, versions and uploads, and asset pins on revisions (AD2.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "The agent's system prompt, supplied by a prompt template. It has no uploaded files.",
   "Skill": "A skill folder the harness loads, placed where the harness profile puts skills.",
   "ReferenceFile": "A file the agent can read during a run, placed in the run's workspace.",
   "DocumentTemplate": "A document template, such as a .docx or .dotx file, the agent fills in during a run."
  },
  "runOutcome": {
   "AssetIntegrityFailed": "An asset file failed its SHA-256 check or could not be downloaded before launch, so the harness never started."
  }
 },
 "resources": {
  "agentAssets": {
   "add": "Create a new asset. Upload its files as a version afterwards, then pin it on an agent revision.",
   "name": "Unique name of the asset in this tenant. Revisions and manifests can refer to the asset by this name.",
   "kind": "System prompt, skill, reference file, or document template. Fixed after the asset is created.",
   "currentVersion": "The newest version. Pins that follow the current version use it from the next run.",
   "description": "What the asset holds and which agents use it, in plain words.",
   "tags": "Labels for finding and grouping assets. They have no effect on runs.",
   "artifactStoreId": "Where the asset's files are stored. Garrison database means they are kept in the control plane database.",
   "promptTemplateId": "The prompt template that supplies a system prompt asset's text. Required for system prompts only.",
   "databaseStore": "The files are stored in the Garrison database, not in an external artifact store.",
   "kindFilter": "Show only assets of one kind: system prompts, skills, reference files, or document templates.",
   "actions": {
    "versions": "Open the version history: browse files, preview text files, download them, and upload a new version."
   }
  }
 },
 "revisions": {
  "columns": {
   "assetPins": "Assets this revision pins, each at a fixed version or following the asset's current version."
  }
 },
 "assets": {
  "files": "Choose one or more files from your computer. They are read in the browser and uploaded together as one version.",
  "path": "Where the file goes inside the asset, as a relative path with forward slashes, for example docs/guide.md.",
  "uploadColumns": {
   "path": "The path of each file inside the asset. Edit it before uploading if needed.",
   "mediaType": "The media type the browser reported. The server guesses it from the extension when empty.",
   "size": "Size of the file as read from your computer.",
   "actions": "Take a file out of this upload before sending it."
  },
  "removeFile": "Take this file out of the upload. Nothing is sent until you upload.",
  "changeNote": "Optional note saved with the new version and shown in the version history. Up to 2000 characters.",
  "upload": "Upload the chosen files as one new version. Identical files return the current version instead.",
  "current": "This is the asset's current version, used by pins that follow the current version.",
  "showFiles": "Show the files of this version with their sizes, digests, previews, and downloads.",
  "versionColumns": {
   "number": "Version number. Each upload with different files adds the next number.",
   "author": "Who uploaded this version.",
   "changeNote": "The note given when this version was uploaded.",
   "totalBytes": "Combined size of every file in this version.",
   "createdUtc": "When this version was uploaded.",
   "actions": "Show the files of a version."
  },
  "fileColumns": {
   "path": "Path of the file inside the asset, which is where it is placed for a run.",
   "mediaType": "Media type stored with the file.",
   "sizeBytes": "Size of the file in this version.",
   "sha256": "Start of the file's SHA-256 digest. Workers check it before a run starts.",
   "actions": "Preview text files in place or download any file."
  },
  "sha256Full": "Full SHA-256 digest of this file: {{sha}}",
  "preview": "Show this text file read-only below the file list. Nothing can be edited here.",
  "download": "Download this file of this version to your computer.",
  "pinsSave": "Save these asset pins on the draft. Publish the draft afterwards for deployments to use them.",
  "pinAsset": "The asset to pin on this revision. Each asset can be pinned once.",
  "pinVersion": "Pin a fixed version, or choose Current version to use the asset's newest version at run time.",
  "removePin": "Remove this asset from the revision's pins.",
  "addPin": "Add another asset to the revision's pins.",
  "editPins": "Add, remove, or change the asset pins of this draft revision.",
  "pinsNewDraft": "Start a new draft from the latest published revision and choose its asset pins.",
  "pinnedVersion": "This asset is pinned at a fixed version, so runs keep using it after new uploads.",
  "pinnedCurrent": "This asset follows its current version, so runs use the newest upload."
 }
});

// Conversation file spaces: the Files tab on Conversation detail, file versions and uploads, and the deployment's file space folder (AD3.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "views": {
  "conversationDetail": {
   "tabs": {
    "turns": "The turns of this conversation, oldest first, and the box for sending the next one.",
    "files": "The shared folder that every turn and every delegated agent of this conversation reads and writes, with version history and downloads."
   }
  },
  "runDetail": {
   "fileSpace": "The shared file space this run copies into its workspace at start and writes back at the end. Runs of one conversation, pipeline run, or delegation tree share it.",
   "openFiles": "Open the Files tab of this run's conversation to browse, download, or upload the shared files."
  }
 },
 "resources": {
  "deployments": {
   "fileSpaceMountPath": "Folder inside the run's workspace where the shared file space is synced, for example files. Relative, with forward slashes, at most 128 characters."
  }
 },
 "files": {
  "summary": "How many current files the shared folder holds and their combined size. Deleted files are not counted.",
  "live": "The list updates as soon as a turn, a delegated agent, or a person changes a file.",
  "polling": "The live connection is not available, so the list refreshes every {{seconds}} seconds while this tab is open.",
  "includeDeleted": "Also list files that were deleted. Their versions are kept and can still be downloaded.",
  "refresh": "Load the file list from the server again right now.",
  "columns": {
   "path": "Path of the file inside the shared folder. Runs find it under the deployment's file space folder.",
   "currentVersion": "The newest version. Every write by a turn, an agent, or an upload adds one.",
   "sizeBytes": "Size of the current version of the file.",
   "mediaType": "Media type stored with the current version.",
   "lastUpdateUtc": "When the file last changed.",
   "actions": "Show the version history, download the current version, or delete the file."
  },
  "deleted": "This file was deleted. Later turns no longer see it, but its versions are kept.",
  "versions": "Open the version history of this file, with a download and a text preview for each version.",
  "download": "Download the current version of this file through a short-lived link.",
  "delete": "Delete this file from the shared folder. Its versions are kept.",
  "confirmDelete": "Delete the file now. Later turns will not see it.",
  "versionColumns": {
   "number": "Version number. Each write adds the next number.",
   "sizeBytes": "Size of the file in this version.",
   "mediaType": "Media type stored with this version.",
   "sha256": "Start of this version's SHA-256 digest. Workers check it when they sync the file.",
   "writtenBy": "The agent whose run wrote this version, or the person who uploaded it.",
   "createdUtc": "When this version was written.",
   "actions": "Preview text versions in place, or download any version."
  },
  "current": "This is the version that later turns see.",
  "sha256Full": "Full SHA-256 digest of this version: {{sha}}",
  "openRun": "Open the run that wrote this version.",
  "preview": "Show this version read-only below the list. Nothing can be edited here.",
  "downloadVersion": "Download this version of the file to your computer.",
  "chooseFiles": "Choose one or more files from your computer. They are read in the browser and uploaded one at a time.",
  "uploadColumns": {
   "path": "Where each file goes in the shared folder. Edit it before uploading if needed.",
   "replaces": "The listed version this upload replaces, or New file. A file changed since then is kept under a conflict name.",
   "size": "Size of the file as read from your computer.",
   "actions": "Take a file out of this upload before sending it."
  },
  "path": "Path inside the shared folder, relative with forward slashes, for example notes/sources.md.",
  "removeFile": "Take this file out of the upload. Nothing is sent until you upload.",
  "upload": "Send each chosen file to the shared folder, one at a time, with the version it replaces."
 }
});

// Capability catalog: the Capabilities page, refresh, tool probes on harness profiles, and capabilities on revisions (AD4.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "nav": {
  "tabs": {
   "capabilities": "The capability catalog: agents, MCP tools, and harness built-ins with sources, cost and latency hints, and a refresh."
  }
 },
 "filters": {
  "tag": "Show only capabilities with this exact tag. The list updates when you stop typing.",
  "origin": "Show only derived entries, which follow their source, or only manual entries written by people."
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Another Garrison agent, described from its latest published revision. An orchestrating agent can delegate to it.",
   "McpTool": "A tool of an MCP server registered in this tenant, described from the server's tool list.",
   "HarnessBuiltIn": "A program the harness can run on its worker host, such as pandoc or LibreOffice, found by a tool probe on a harness profile."
  },
  "capabilityOrigin": {
   "Derived": "Garrison keeps this entry in step with its source. It cannot be edited or deleted here; change the source instead.",
   "Manual": "A person wrote this entry. It can be edited and deleted here."
  },
  "capabilityHintStatus": {
   "Unknown": "Too few runs finished in the hint window to say anything, so no values are shown. MCP tools and built-ins always have Unknown hints.",
   "Known": "Enough runs finished in the hint window, so the duration and cost values are backed by real runs."
  },
  "runBlockedReason": {
   "NoToolWorker": "Blocked: this run's agent uses a harness built-in tool, such as pandoc, and no Ready worker that can run it reports the tool. It waits in the queue until such a worker registers."
  }
 },
 "resources": {
  "capabilities": {
   "add": "Write a manual entry for something Garrison cannot derive, for example a conversion service that agents reach through a skill.",
   "name": "Name agents use to find the capability. Agents are named after the agent, MCP tools as server/tool, built-ins after the tool.",
   "kind": "Agent, MCP tool, or harness built-in. Manual entries may use any kind.",
   "origin": "Derived entries follow their source and cannot be changed here; manual entries were written by people.",
   "summary": "What the capability does and when to use it, as agents read it. Up to 4000 characters.",
   "source": "Where the entry comes from: the agent, the MCP server and tool, or the harness profile and the node label a run needs.",
   "hints": "Median and 90th percentile run duration and mean cost from recent finished runs, or Unknown when too few runs finished.",
   "tags": "Labels for filtering the catalog. Agents can filter by tag too.",
   "lastRefreshedUtc": "When Garrison last refreshed a derived entry from its source. Empty for manual entries.",
   "sourceAgentId": "Optional. The Garrison agent this manual entry stands for.",
   "sourceMcpServerId": "Optional. The MCP server whose tool this manual entry stands for.",
   "sourceToolName": "The tool's name on the chosen MCP server.",
   "requirements": "Node labels, such as garrison.io/tool-pandoc=true, a worker must report before it takes a run that uses this capability.",
   "inputSchemaJson": "JSON Schema of what the capability takes. Garrison checks that it is a valid JSON Schema when you save.",
   "outputSchemaJson": "JSON Schema of what the capability returns. Garrison checks that it is a valid JSON Schema when you save.",
   "kindFilter": "Show only agents, only MCP tools, or only harness built-ins. Choose All to see the whole catalog.",
   "originFilter": "Show only derived entries, which follow their source, or only manual entries written by people.",
   "tagFilter": "Show only capabilities with this exact tag. The list updates when you stop typing.",
   "refresh": "Refresh derived entries now: agents, harness built-ins, MCP server tools, and agent hints. Shows what changed and which servers failed.",
   "warnings": "Entries whose source could not be refreshed keep their last good content and show the reason in their details.",
   "warningBadge": "The last refresh of this entry's source failed, so it shows its last good content. Reason: {{warning}}"
  },
  "harnessProfiles": {
   "toolProbes": "Tools this harness can use when the worker host has them, such as pandoc. Each becomes a harness built-in in the capability catalog.",
   "toolProbesItems": {
    "name": "Tool name in the catalog and in the node label garrison.io/tool-{name}: lowercase letters, digits, dots, and hyphens.",
    "executable": "Bare file name the worker looks up on its PATH, for example soffice. No folder is allowed.",
    "argument": "The one argument the probe passes, such as --version. Only version and help flags are allowed, or none.",
    "description": "What the tool does, shown in the capability catalog. Up to 1024 characters."
   }
  }
 },
 "revisions": {
  "columns": {
   "capabilities": "Capabilities this revision uses, by name. Harness built-ins among them limit its runs to workers that report the tool."
  }
 },
 "capabilities": {
  "sourceAgent": "Open agent {{name}}, which this entry describes from its latest published revision.",
  "sourceMcpServer": "Open MCP server {{name}} in the MCP Servers tab. Its tool list is the source of this entry.",
  "sourceTool": "The name of the tool on the MCP server: {{tool}}.",
  "sourceProfile": "Open harness profile {{name}}, whose tool probe is the source of this entry.",
  "nodeLabel": "A run that uses this capability goes only to a worker that reports the node label {{label}}.",
  "noSource": "A manual entry that names no agent or MCP server. Every run that can read the catalog sees it.",
  "hintsUnknown": "Too few runs finished in the hint window to say anything, so no values are shown. This never means zero.",
  "hintsKnown_one": "Summarized from {{count}} finished run over the last {{days}} days.",
  "hintsKnown_other": "Summarized from {{count}} finished runs over the last {{days}} days.",
  "refreshWarning": "Garrison could not refresh this entry from its source, so the entry keeps its last good content until the next refresh succeeds.",
  "lockedBanner": "Why this entry cannot be edited or deleted here, and where to change it instead.",
  "lockedShared": "Shared by every tenant: this entry comes from a tool probe on a built-in harness profile, so it cannot be edited or deleted. Clone the profile to change its probes.",
  "locked": {
   "Agent": "Derived from the agent's latest published revision, so it cannot be edited or deleted here. Publish a new revision to change it; deactivating the agent removes it.",
   "McpTool": "Derived from the MCP server's tool list, so it cannot be edited or deleted here. Change the server or its tools, then refresh.",
   "HarnessBuiltIn": "Derived from a tool probe on a harness profile, so it cannot be edited or deleted here. Change the profile's tool probes instead."
  },
  "shared": "Every tenant sees this entry. It comes from a tool probe on a built-in harness profile.",
  "hintsTitle": "Duration and cost of recent finished runs of this agent. MCP tools and built-ins have no hints.",
  "requirementsTitle": "Node labels a worker must report before it takes a run whose agent uses this capability.",
  "fields": {
   "kind": "Agent, MCP tool, or harness built-in.",
   "origin": "Derived entries follow their source; manual entries were written by people.",
   "source": "The agent, MCP server and tool, or harness profile this entry comes from.",
   "lastRefreshedUtc": "When Garrison last refreshed this entry from its source. Empty for manual entries.",
   "tags": "Labels for filtering the catalog.",
   "id": "Identifier of the catalog entry, starting with cap_.",
   "summary": "What the capability does and when to use it, as agents read it.",
   "hintStatus": "Known when enough runs finished in the window; Unknown otherwise, and then no value is shown.",
   "sampleSize": "How many finished runs the hints summarize, the most recent first.",
   "medianDurationMs": "Median time from start to completion of the summarized runs.",
   "p90DurationMs": "Nine in ten of the summarized runs finished within this time.",
   "meanCostUsd": "Mean cost in US dollars of the summarized runs that recorded a cost.",
   "windowDays": "How many days back the hints look (the Capabilities.HintWindowDays setting).",
   "computedUtc": "When the hints were last computed by the maintenance loop or a refresh.",
   "inputSchemaJson": "JSON Schema of what the capability takes, or none for free text.",
   "outputSchemaJson": "JSON Schema of what the capability returns, or none."
  },
  "refreshServer": "List the tools of every active MCP server, or of one server only. Stdio servers are listed through a worker.",
  "refreshRun": "Start the refresh now. It can take a while when MCP servers are slow to answer.",
  "refresh": {
   "agents": "Agent entries created, refreshed, or removed by this refresh.",
   "harnessBuiltIns": "Harness built-in entries created, refreshed, or removed, across every scope.",
   "hints": "Agent entries whose cost and latency hints were computed again.",
   "servers": "How many MCP servers this refresh tried to list.",
   "tools": "Tool entries written from the servers that answered.",
   "removed": "Tool entries removed because their server no longer lists the tool.",
   "failed": "Servers whose tools could not be listed. Their entries keep their last good content.",
   "failedBadge": "The tools of this server could not be listed. Its entries keep their last good content with a warning.",
   "listedBadge": "The server answered and its tool entries are up to date.",
   "columns": {
    "server": "The MCP server whose tools were listed.",
    "status": "Whether the server's tools could be listed.",
    "tools": "Tool entries written for this server.",
    "removed": "Tool entries removed because the server no longer lists them.",
    "warned": "Entries that kept their last good content and now carry a refresh warning.",
    "error": "Why the listing failed, when it did."
   }
  },
  "draftSave": "Save these capabilities on the draft. Publish the draft afterwards for deployments to use them.",
  "notInCatalog": "No catalog entry has this name right now. The run starts anyway, but the agent cannot find this capability.",
  "removeName": "Remove this capability from the revision.",
  "chooseName": "Pick a capability from the catalog by name. Names used by more than one kind are listed once.",
  "addName": "Add the chosen capability to the revision.",
  "newDraft": "Start a new draft from the latest published revision and choose the capabilities it uses.",
  "editDraft": "Add or remove the capabilities this draft revision uses.",
  "revisionName": "This revision uses capability {{name}}. Agents find it in the catalog by this name."
 }
});

// Fan-out groups in the run tree of Run detail: status, join policy, budget, members, and Cancel group (AD5.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "The group is waiting for its members. It ends when the join policy is met, the deadline passes, the budget runs out, or someone cancels it.",
   "Joined": "The join policy was met, or every member finished, so the parent run can use the members' results.",
   "TimedOut": "The deadline passed before the join policy was met. Members still running were cancelled.",
   "BudgetExceeded": "The members' cost or tokens went over the group's budget. Members still running were cancelled.",
   "Cancelled": "Someone cancelled the group, or its parent run finished or was cancelled. Members still running were cancelled."
  },
  "fanOutJoinPolicy": {
   "All": "The group joins when every member has finished, whether it succeeded or not.",
   "Any": "The group joins as soon as one member succeeds. The others are cancelled unless the call asked to keep them running.",
   "Quorum": "The group joins once the given number of members succeed, or as soon as too many have failed for that to happen."
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "The fan-out group this run belongs to. Its parent run started it together with other members and joins their results.",
   "openFanOutGroup": "Open the parent run's run tree at this fan-out group to see the other members, the join policy, and the budget."
  }
 },
 "fanOut": {
  "group": "Child runs this run started together with garrison_fan_out, joined under one policy, budget, and deadline.",
  "otherChildren": "Child runs this run delegated to one at a time, outside any fan-out group.",
  "reason": "Why the group ended, as the server recorded it.",
  "policy": "When the group counts as done: All waits for every member, Any for one success, Quorum for the given number of successes.",
  "progress": "Members that finished, members that succeeded, and the number of members in the group.",
  "cost": "Cost the members recorded so far, against the group's maximum cost when one is set.",
  "costValue": "Total recorded cost of all members. Members whose model has no price add nothing.",
  "tokens": "Input and output tokens the members used so far, against the group's maximum when one is set.",
  "tokensValue": "Input plus output tokens of all members together.",
  "budgetBar": "{{percent}}% of the budget used. The group ends as Over budget when usage goes past it.",
  "deadline": "When the group times out. Members still running at that moment are cancelled.",
  "started": "When the parent run started this group.",
  "completed": "When the group ended and stopped waiting for members.",
  "pending": "Labels of the members that have not finished yet.",
  "failed": "Labels of the members that finished without succeeding.",
  "live": "Updates arrive over the live connection as soon as a member's status or the group's usage changes.",
  "polling": "The live connection is not available, so the group is reloaded every {{seconds}} seconds.",
  "cancel": "Cancel this group now. Members still running are cancelled, and the parent run gets the results gathered so far.",
  "confirmCancel": "Cancel the group and every member that is still running. This cannot be undone.",
  "openMember": "Open the run of member {{label}} to see its transcript, result, and telemetry.",
  "columns": {
   "label": "The name the parent run gave this member when it started the group.",
   "agent": "The agent this member runs, chosen by the parent run.",
   "status": "Where the member's run is now, and how it ended.",
   "costUsd": "Recorded cost of this member's run.",
   "tokens": "Input and output tokens this member's run used.",
   "run": "The member's run. Open it for the transcript and the result."
  }
 }
});

// Agentic apps: the Apps tab, its editor, graph, link, delegation, revisions, and promotion (AD6.11).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "nav": {
  "tabs": {
   "apps": "Agentic apps: groups of agents behind one end-user chat UI, with their call graph, delegation, revisions, promotion, and link."
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Any active user of this tenant can sign in to the app with their email and password.",
   "AppUsers": "Only tenant users who hold the built-in AppUser role on this app can sign in. Assign it with resource scope on the app.",
   "Anonymous": "Anyone with the link can use the app without signing in, but only when anonymous use is also turned on."
  }
 },
 "form": {
  "pickColor": "Pick {{field}} from a color picker instead of typing the #RRGGBB value."
 },
 "resources": {
  "apps": {
   "add": "Create an app from agents you already have: members, an entry agent, the calls between them, and how people sign in.",
   "name": "Name of the app in this tenant: lowercase letters, digits, and hyphens. Manifests and the API refer to it by this name.",
   "slug": "The URL name, so the app lives at /apps/{slug}/. Unique across the cluster. Empty means the name.",
   "description": "What the app is for. End users see it on the app's sign-in page.",
   "active": "Inactive apps keep their settings, but their link and their sessions stop working.",
   "url": "The app's address for end users. Copy it to share, or open it to see what end users see.",
   "entryAgentId": "The member that talks to end users and starts every conversation. The other members are reached from it.",
   "members": "The agents in the app, each with an optional role note. An agent that belongs to an app cannot be deleted.",
   "membersItems": {
    "agentId": "An agent of this tenant to include in the app. Each agent can be a member once.",
    "role": "A short note on what this member does in the app, up to 256 characters."
   },
   "edges": "Which member may call which. Together they form the app's graph and become each member's delegation policy.",
   "edgesItems": {
    "callerAgentId": "The member that makes the call.",
    "calleeAgentId": "The member that is called. It must be a different member than the caller.",
    "fanOutAllowed": "Let the caller start several runs of this member at once with garrison_fan_out."
   },
   "graph": "The members and calls as a picture, read only. The entry agent is on the left; members it cannot reach are outlined in red.",
   "environments": "For each environment, the entry agent's deployment the app uses there. Promotion keeps these in step.",
   "environmentsItems": {
    "environment": "An environment of this tenant, such as dev, staging, or prod.",
    "deploymentId": "A deployment of the entry agent in this environment. Only those deployments are listed."
   },
   "liveEnvironment": "The environment the app's chat UI uses now. Change it to switch end users to another environment.",
   "authMode": "Tenant users, users holding the AppUser role on this app, or anyone with the link (with anonymous use turned on).",
   "anonymousEnabled": "Turns on anonymous sessions. Anonymous sign-in works only when this is on and the mode is Anonymous.",
   "showOperatorDetail": "Show end users the tool calls, thinking, and progress of each turn, not only the answer.",
   "share": "The link to give end users, with who can sign in under the sign-in setting chosen above.",
   "displayName": "The name shown in the app's header and sign-in page. Empty means the app's name.",
   "logoAssetId": "An agent asset whose current version holds the logo image. Upload one under Configuration, Agent assets.",
   "primaryColor": "Main color of the app UI, as #RRGGBB. Empty keeps the default color.",
   "accentColor": "Second color of the app UI for highlights, as #RRGGBB. Empty keeps the default color.",
   "welcomeText": "Text end users see before their first message, up to 4000 characters.",
   "id": "The app's identifier. The API and manifests accept it as well as the name.",
   "lastUpdateUtc": "When the app's settings last changed.",
   "createdUtc": "When the app was created.",
   "membersCell": "Members of the app: {{names}}.",
   "activeBadge": "The app is active: its link works for the people its sign-in setting lets in.",
   "inactiveBadge": "The app is inactive: its settings are kept, but its link and sessions do not work.",
   "steps": {
    "general": "The app's name, URL slug, description, and whether it is active.",
    "members": "The agents in the app, the entry agent, and the calls between them, with a picture of the graph.",
    "environments": "The entry deployment the app uses in each environment, and the environment the app runs on now.",
    "access": "Who may sign in, whether end users see tool calls, and the link to share.",
    "branding": "Display name, logo, colors, and welcome text end users see."
   },
   "actions": {
    "delegation": "Compare each member's published delegation with what the graph calls for, and write drafts that fix the drift.",
    "revisions": "List the app's revisions, take a new one, publish it, and promote the app to the next environment."
   }
  }
 },
 "apps": {
  "denied": "You need {{operation}} permission on {{resource}} for this. Ask an administrator for a role that grants it.",
  "graph": "Read-only picture of the app: members, the calls between them, and which ones the entry agent can reach.",
  "url": "The app's address. {{who}}",
  "open": "Open the app in a new browser tab, the way end users see it. {{who}}",
  "copyUrl": "Copy the app's address to share it. {{who}}",
  "signIn": {
   "TenantUsers": "Any active user of this tenant can sign in.",
   "AppUsers": "Only users who hold the AppUser role on this app can sign in.",
   "Anonymous": "Anyone with the link can use it without signing in.",
   "AnonymousDisabled": "Anonymous is chosen but not turned on, so only signed-in users with access get in."
  },
  "delegation": {
   "apply": "Write the graph's delegation into a draft revision of each drifting member. Nothing is published, and manual drafts are left alone.",
   "applyNothing": "Every member's published delegation already matches the graph, so there is nothing to write.",
   "openAgent": "Open agent {{name}} to review and publish its draft revision.",
   "drift": "The member's published delegation differs from what the graph calls for. Write drafts to fix it, then publish them.",
   "inSync": "The member's published delegation matches the graph.",
   "draftConflict": "The member's open draft already changes delegation another way, so it was left alone. Publish or discard that draft first.",
   "skipped": "This member was skipped: {{reason}}.",
   "draft": "The graph's delegation is in draft revision {{number}} of this member. Publish it to make it live.",
   "columns": {
    "member": "The member agent. Open it to review its revisions.",
    "desiredMode": "The delegation mode the graph calls for: Allow list when the member calls others, None when it calls nobody.",
    "desiredAllowList": "The members this member calls in the graph.",
    "desiredMaxDepth": "The longest chain of calls below this member in the graph.",
    "publishedMode": "The delegation mode in the member's latest published revision.",
    "publishedAllowList": "The allow list in the member's latest published revision.",
    "publishedMaxDepth": "The maximum depth in the member's latest published revision.",
    "status": "Whether the member drifts from the graph, and the draft written or the reason it was skipped."
   }
  },
  "revisions": {
   "promote": "Promote a published app revision: every member moves to the next environment together, or nothing moves.",
   "promoteNothing": "Publish an app revision first. Only published revisions can be promoted.",
   "changeNote": "A note on what changed, kept with the revision. Up to 2000 characters.",
   "take": "Take a draft app revision that pins every member's latest published revision and copies the calls.",
   "latest": "The app's latest published revision, which promotions use unless you choose another.",
   "pin": "This revision pins revision {{number}} of {{name}}.",
   "publishedBy": "Published by {{name}} at {{when}}.",
   "publish": "Publish this draft app revision. After that it cannot change and can be promoted.",
   "publishConfirm": "Publish the revision now. It cannot be edited afterwards.",
   "columns": {
    "number": "The revision number, counting up from 1 for this app.",
    "state": "Draft until published. Only published revisions can be promoted.",
    "members": "The member revisions this app revision pins.",
    "edges": "How many calls between members the revision copied.",
    "author": "The person who took this revision.",
    "changeNote": "The note written when the revision was taken.",
    "publishedUtc": "When the revision was published, and by whom.",
    "actions": "Publish a draft revision."
   }
  },
  "promote": {
   "submit": "Promote now. Every member's deployments in the target environment get the pinned revisions, or nothing changes.",
   "revision": "The published app revision to promote. The latest one is used unless you choose another.",
   "source": "The environment to promote from, usually the one the app runs on now.",
   "target": "The environment to promote to. By default the one after the source."
  }
 }
});

// Agent studio: the Studio tab, the draft workspace, the architect dialogs, the playground, the compile preview, and the architect prompt panel (AD7.10, AD7.16, AD9.2, AD9.3).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "nav": {
  "tabs": {
   "studio": "The agent studio: drafts of agents and apps that you design with the agent architect, try in the playground, and ask a person to apply."
  }
 },
 "enums": {
  "approvalKind": {
   "DraftApply": "A request to apply a studio draft to live configuration. Allowing it applies every document in the draft as one manifest apply."
  },
  "studioDraftStatus": {
   "Open": "The draft can be edited by you and the agent architect, validated, tried in the playground, and sent for approval.",
   "PendingApproval": "The draft waits for a decision on its apply approval and is frozen until then. A denial opens it again.",
   "Applied": "The draft was applied to live configuration as one manifest apply. It can no longer change.",
   "Discarded": "The draft was discarded. It can no longer change, and a pending apply approval was cancelled."
  },
  "studioDraftOperation": {
   "Upsert": "Applying the draft creates the resource, or updates it when it already exists.",
   "Delete": "Applying the draft deletes the resource. Only agents, deployments, pipelines, and apps can be deleted this way."
  },
  "studioDiffChange": {
   "Create": "The resource does not exist yet, so applying the draft creates it.",
   "Update": "The resource exists and differs, so applying the draft updates the listed fields.",
   "Delete": "The draft deletes this resource when it is applied.",
   "Unchanged": "The document matches live configuration, so applying it changes nothing.",
   "Failed": "The document does not validate. The details say why; fix it before requesting apply."
  }
 },
 "views": {
  "studio": {
   "newDraft": "Start a draft, empty or from an existing app, and open its workspace.",
   "refresh": "Read the list of drafts again from the server.",
   "search": "Find drafts whose title contains this text. The server does the search.",
   "scope": "Show only your own drafts, or every draft of the tenant you may read.",
   "scopes": {
    "mine": "Show only the drafts you started, or that an architect started for you.",
    "all": "Show every draft in the tenant that you may read, whoever started it."
   },
   "statusChip": "Show drafts with status {{status}}. With no status chosen, every status shows.",
   "columns": {
    "title": "The draft's title. Open it to see its workspace with the architect, items, graph, and apply.",
    "status": "Open drafts can change; pending ones wait for an apply decision; applied and discarded ones are final.",
    "owner": "The person who started the draft. An architect works only on the drafts of the person talking to it.",
    "targetApp": "The app the draft designs. Graph operations and the playground use it by default.",
    "items": "How many manifest documents the draft holds, one per resource.",
    "version": "Raised by one on every change to the draft. Each edit names the version it read.",
    "updated": "When the draft last changed."
   },
   "openDraft": "Open the draft's workspace: architect chat, items, graph, diff and apply, playground, and preview.",
   "discard": "Discard the draft after a confirmation. It can no longer change or be applied.",
   "discardPending": "Discard the draft after a confirmation. Its pending apply approval is cancelled."
  },
  "studioDraft": {
   "version": "Every change raises the version. Edits send the version they read, so nobody overwrites someone else's change.",
   "live": "Connected to the draft's live channel, so changes by others and by the architect appear at once.",
   "polling": "The live channel is not available, so the page reads the draft again every few seconds.",
   "back": "Go back to the list of studio drafts.",
   "viewJson": "Show the draft as the server returned it, with every item and the canvas layout.",
   "architect": "The architect deployment this workspace talks to. Choose it on the Architect tab.",
   "dismissNotice": "Hide this notice about the latest change to the draft.",
   "tabs": {
    "architect": "Talk with the agent architect, which edits this draft for you.",
    "items": "The manifest documents in the draft, with an editor for each one.",
    "graph": "A read-only picture of the draft's apps, calls, delegation depth, and capabilities.",
    "apply": "Compare the draft with live configuration, validate it, and ask for it to be applied.",
    "playground": "Run the draft's agents before anything is published, over several turns.",
    "preview": "Compile a deployment to see its command line, placed assets, and file space mount.",
    "prompts": "Choose and edit the prompt the agent architect works with."
   }
  }
 },
 "studio": {
  "notOpen": "This draft is {{status}}, and only an open draft can change.",
  "newDraft": {
   "titleField": "A short name for the draft, shown in the list and to the architect. Empty uses a default title.",
   "fromApp": "Start from an existing app with everything it references, or start with an empty draft.",
   "create": "Create the draft and open its workspace. Live configuration does not change."
  },
  "architect": {
   "name": "Name of the new architect deployment in this tenant, for example architect.",
   "harnessProfileId": "The harness the architect runs on, for example Claude Code. It needs a worker that can run it.",
   "model": "The model the harness uses for the architect. Empty uses the harness profile's default.",
   "promptId": "The System prompt the architect works with. Built-ins come first; clones of them follow.",
   "preview": "The chosen prompt rendered with sample values, as the architect would receive it.",
   "cloneLink": "Open this prompt on the Prompt Templates screen, where you can clone it and edit the clone.",
   "create": "Create the deployment of agent-architect with draft access and the chosen prompt.",
   "noAgent": "No architect can be created because this tenant has no agent-architect agent."
  },
  "chat": {
   "title": "A conversation with the agent architect about this draft. It edits the draft; you approve applying it.",
   "architect": "The architect deployment to talk to. Choosing another one starts a new conversation.",
   "newArchitect": "Create an architect deployment: harness profile, model, and architect prompt.",
   "openConversation": "Open this conversation on its own page, with every turn as a run.",
   "newConversation": "Forget this conversation in this browser and start a new one with the next message.",
   "you": "What you sent to the architect in this turn.",
   "architectSays": "The architect's answer to this turn. The draft changes it made appear in the other tabs.",
   "openRun": "Open the run of this turn, with its transcript and the tools it called.",
   "message": "What you want the architect to design or change. The draft's ID goes with the first message.",
   "send": "Send the message to the architect. The answer appears here when the turn ends.",
   "sendBusy": "The architect is still working on the last message. Wait for it to finish.",
   "sendNoArchitect": "Choose or create an architect deployment before sending a message."
  },
  "items": {
   "title": "The manifest documents in the draft, one per resource, keyed by kind and name.",
   "add": "Add a new document to the draft. It is saved when you save it in the editor.",
   "addConfirm": "Open the editor with a starting document of this kind and name.",
   "kind": "The manifest kind of the document, for example Agent or Deployment.",
   "name": "The resource name, which must match the name inside the document.",
   "operation": "Create or update the resource on apply, or delete it.",
   "stale": "Whether live configuration changed after the draft was based on this document.",
   "updated": "When this item last changed in the draft.",
   "staleBadge": "Live configuration changed after the draft started from this document. Rebase it before applying.",
   "editItem": "Open this document in the editor to change and save it.",
   "viewItem": "Open this document in the editor to read it. The draft cannot change right now.",
   "remove": "Remove this document from the draft after a confirmation. Live configuration does not change.",
   "editor": "The document as manifest YAML. Saving sends the version you read.",
   "document": "Plain manifest YAML. Its kind and name must match the item's.",
   "save": "Save the document into the draft at the version you read.",
   "closeEditor": "Close the editor. Unsaved text is lost.",
   "dismissConflict": "Hide this notice about the change that refused your save."
  },
  "graph": {
   "title": "Read-only picture of the draft's apps: members, calls, delegation depth, and capabilities.",
   "app": "An app the draft holds or refers to, drawn from its entry agent.",
   "deletedApp": "Applying the draft deletes this app.",
   "draftedApp": "The draft holds this app's document, so its graph shows the draft's version.",
   "deletedAgent": "Applying the draft deletes this agent.",
   "loose": "Agents the draft holds that belong to none of its apps.",
   "legend": "How to read the graph: labels, line styles, and the capabilities under each agent."
  },
  "diff": {
   "title": "Each document against live configuration, validation, and the request to apply the draft.",
   "refresh": "Compare every document with live configuration again.",
   "validate": "Run a manifest dry run of the draft. Nothing changes; the results show per item.",
   "requestApply": "Validate the draft and create an approval to apply it. The draft is frozen until it is decided.",
   "columns": {
    "item": "The document's kind and name.",
    "change": "What applying the draft would do to this resource.",
    "details": "The fields that change, or why the document does not validate."
   },
   "approval": "The approval that decides whether this draft is applied.",
   "openApproval": "Open the approval with its full summary and diff.",
   "reason": "Why you allow or deny the draft. It is recorded with the decision.",
   "allow": "Allow the approval: the draft is validated again and applied as one manifest apply.",
   "deny": "Deny the approval: nothing is applied, and the draft is open again."
  },
  "playground": {
   "title": "Try the draft's agents before anything is published, over several turns.",
   "agent": "The agent to run. The default is the entry agent of the draft's target app.",
   "input": "What the agent should do in this turn.",
   "send": "Save the agent's document as its draft revision and run it in the playground.",
   "sendBusy": "The last turn is still running. Wait for it to finish.",
   "openRun": "Open the run, with its run tree, fan-out groups, and the conversation's files.",
   "conversation": "Open the playground conversation, with every turn as a run.",
   "export": "Download the playground turns as a Markdown file.",
   "reset": "Start a new playground conversation with the next turn."
  },
  "preview": {
   "title": "Compile a deployment with sample input before you deploy. Secret values are redacted.",
   "deploymentId": "The deployment to compile.",
   "agentRevisionId": "An agent revision to compile instead of the deployment's own, for example a draft revision.",
   "environment": "Compile the agent's deployment in this environment instead of the chosen one.",
   "input": "The sample input the compiled prompt is rendered with.",
   "compile": "Compile the deployment and show the command line, assets, and file space.",
   "compileNoDeployment": "Choose a deployment to compile first.",
   "commandLine": "The command the worker would start, shell quoted for display.",
   "assets": "Where the revision's assets would be written before the harness starts.",
   "columns": {
    "path": "Where the file is placed, relative to the run's directories.",
    "asset": "The agent asset the file comes from.",
    "kind": "What the asset is used for, for example a skill or a reference file.",
    "version": "The asset version the revision pins.",
    "size": "The size of the placed file."
   },
   "fileSpace": "The conversation's shared file space and where the run would see it."
  },
  "prompts": {
   "title": "The prompts the agent architect can work with, and which one each architect uses.",
   "templatesLink": "Open the Prompt Templates screen filtered to architect prompts.",
   "columns": {
    "name": "The prompt template's name. Built-ins start with builtin/.",
    "description": "A short note on what the prompt makes the architect do differently.",
    "version": "The prompt's current version. Every save adds one.",
    "usedBy": "How many architect deployments use this prompt. Hover for their names."
   },
   "defaultBadge": "New architect deployments use this prompt unless another one is chosen.",
   "selectedBadge": "The prompt {{architect}} uses now.",
   "select": "Make this the prompt of the current architect. It takes effect on the architect's next turn.",
   "alreadySelected": "The current architect already uses this prompt.",
   "selectNoArchitect": "Choose an architect on the Architect tab first; the selection applies to that deployment.",
   "clone": "Copy this prompt into a new template that you can edit.",
   "edit": "Edit the name, description, and body. Every save is a new version.",
   "delete": "Delete this prompt after a confirmation. A prompt that a deployment uses cannot be deleted.",
   "builtInLocked": "Built-in prompts cannot be edited or deleted. Clone this prompt and change the clone.",
   "editor": "Edit the prompt and preview it. Architects following its current version use a save from their next turn.",
   "closeEditor": "Close the editor. Unsaved text is lost.",
   "name": "The template's name in this tenant. It must stay unique.",
   "description": "A short note on what this prompt makes the architect do.",
   "body": "The prompt text, with template variables and includes of fragments such as builtin/agent-architect-design.",
   "preview": "The body rendered with sample values, as the architect would receive it.",
   "save": "Save the edit as a new version of the prompt."
  }
 }
});

// Studio canvas: the interactive graph, its toolbar, property panels, runtime per environment, and outline (AD8.2 to AD8.6).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "views": {
  "studioDraft": {
   "tabs": {
    "graph": "Edit the draft's app on a canvas: agents, calls, the entry agent, properties, and runtime per environment."
   }
  }
 },
 "studio": {
  "graph": {
   "title": "The draft's app as an editable canvas, with its agents, calls, and delegation depth."
  },
  "canvas": {
   "title": "The draft's app as an editable graph. Each change is saved into the draft at once; nothing goes live until the draft is applied.",
   "appPicker": "The app the canvas shows, when the draft holds more than one.",
   "node": "An agent of the app. Drag it to move it, drag from its right edge to connect it, or focus it and use the keyboard shortcuts.",
   "nodeReadOnly": "An agent of the app. The draft cannot change right now, so the canvas is read-only.",
   "addAgent": "Type an agent's name or pick one from the tenant's agents and the draft's, then press Enter.",
   "role": "An optional note on what this agent does in the app, kept with its membership.",
   "add": "Make the agent a member of {{app}}. The first member becomes the entry agent.",
   "connect": "Start a call from {{name}}, then pick the agent it calls.",
   "needAgent": "Select an agent on the canvas first.",
   "needCall": "Select a call first: click it on the canvas or pick it in the list of calls.",
   "alreadyEntry": "{{name}} is already the entry agent.",
   "setEntry": "Make the selected agent the one that talks to the people using the app.",
   "remove": "Take the selected agent out of the app with its calls, after a confirmation.",
   "disconnect": "Delete the selected call. The two agents stay in the app.",
   "fit": "Zoom and pan so every agent of the app is visible.",
   "connectTo": "The agent that the caller may call.",
   "fanOut": "On: the caller may start several calls to this agent at once (fan-out). Off: one call at a time.",
   "connectConfirm": "Let {{from}} call {{to}} and save the call into the draft.",
   "connectNoTarget": "There is no other agent in the app to call yet.",
   "connectCancel": "Stop connecting without adding a call.",
   "keys": "Show the keys that work on the canvas.",
   "calls": "Every call of the app in words. These buttons are the keyboard way to select and change calls.",
   "call": "Select this call. Delete disconnects it, F switches parallel calls on or off.",
   "callReadOnly": "Select this call to see its properties. The draft cannot change right now.",
   "addLoose": "Make {{name}} a member of {{app}}, so it can be connected.",
   "retry": "Send the refused change again, on the version of the draft just read.",
   "dismissError": "Hide this message about the refused change.",
   "panel": {
    "properties": "The agent's own document: description, schemas, assets, and capabilities.",
    "runtime": "The agent's deployments in each environment: model, limits, prompt, and approvals.",
    "save": "Write these fields into the draft item at the version you read. Nothing goes live.",
    "reset": "Go back to the values the draft holds now.",
    "nothingToSave": "Nothing changed yet, so there is nothing to save.",
    "nothingToReset": "Nothing changed yet, so there is nothing to undo."
   },
   "agent": {
    "title": "Fields of the agent's document in this draft. Saving rewrites its Agent item.",
    "bring": "Copy the agent's live document (or a new one) into the draft so you can edit it.",
    "description": "What the agent does, shown to people and to agents that call it.",
    "inputSchema": "A JSON Schema the agent's input must match. Empty means plain text input.",
    "outputSchema": "A JSON Schema the agent's structured output follows. Empty means no structured output.",
    "assets": "Agent assets (skills, references, templates) the next revision pins, by name and optional version.",
    "assetName": "The agent asset's name in this tenant.",
    "assetVersion": "A version to pin. Empty follows the asset's latest version.",
    "removeAsset": "Drop this pin from the agent's next revision when you save.",
    "addAsset": "Pin another agent asset to the agent's next revision.",
    "capabilities": "Capabilities the agent uses, such as host tools a worker must have (pandoc, git).",
    "systemPrompt": "The System prompt is set per deployment, so each environment can use its own.",
    "showRuntime": "Open the agent's deployments, where the System prompt and its version are edited."
   },
   "edge": {
    "title": "The selected call: who calls whom, fan-out, and the delegation depth it needs.",
    "from": "The agent that makes this call.",
    "to": "The agent this call reaches.",
    "depth": "How many levels of delegation the caller needs for this call, worked out from the graph."
   },
   "app": {
    "title": "Fields of the app's document in this draft. Saving rewrites its AgenticApp item.",
    "entry": "The member that talks to the people using the app. Changing it is saved at once.",
    "bring": "Copy the app's live document into the draft so you can edit its sign-in and branding.",
    "description": "What the app is for, shown in the console's app list.",
    "authMode": "Who may sign in to the app: tenant users, app users, or anyone (anonymous).",
    "anonymous": "Let people use the app without signing in, when the sign-in mode allows it.",
    "branding": "How the app's chat page looks to the people using it.",
    "brandingFields": {
     "displayName": "The name in the app's header. Empty uses the app's name.",
     "logo": "An agent asset whose first image becomes the app's logo.",
     "primaryColor": "The main color of the app's page, as a hex value.",
     "accentColor": "The second color of the app's page, as a hex value.",
     "welcomeText": "The first thing people read when they open the app."
    }
   },
   "runtime": {
    "title": "The agent's deployments in this draft, one environment at a time.",
    "deployment": "Pick the environment's deployment to edit. Saving changes only that deployment's item.",
    "live": "Deployments of this agent that run now but are not in the draft. Bring one in to change it.",
    "bring": "Copy {{name}}'s live document into the draft as a new item.",
    "approvals": "Whether tool calls of this deployment's runs wait for a person, and the rules that decide first.",
    "fields": {
     "model": "The model the harness uses, for example sonnet. Empty uses the harness profile's default.",
     "effort": "Reasoning effort the harness passes on, for example high. Empty leaves it to the harness.",
     "timeoutSeconds": "How long a run may take before it is stopped, in seconds.",
     "maxTurns": "How many model turns a run may take before it stops.",
     "maxBudgetUsd": "How much a run may cost in US dollars before the harness stops it.",
     "systemTemplate": "The prompt template used as the System prompt, by name. Empty uses the built-in default.",
     "systemVersion": "A version of that template to pin. Empty follows its latest version.",
     "approvalsEnabled": "On: tool calls that no rule allows wait for a person in Approvals.",
     "approvalDefaultAction": "What happens to a tool call that no rule matches: allow it, deny it, or ask a person."
    },
    "rule": {
     "action": "What this rule does with a matching tool call.",
     "pattern": "Which tool calls the rule matches, for example Bash(git *).",
     "inputPattern": "An optional pattern the tool call's input must also match.",
     "remove": "Delete this rule when you save.",
     "add": "Add a rule; rules are checked in order and the first match decides."
    }
   }
  }
 }
});

// Agent Studio positioning and the About page (AD12.12), the setup wizard's Agent Studio step (AD9.5, AD9.9), and app
// environments, promotion, and rollback in the Apps tab and the studio (AD9.6).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "nav": {
  "brand": "Garrison Agent Studio: build, deploy, and run agentic apps on the agent harnesses you already use.",
  "tabs": {
   "serverInfo": "About Garrison Agent Studio: the server and dashboard versions, links to the documentation and the website, the REST, MCP, and A2A addresses, and the identity you are signed in as."
  }
 },
 "common": {
  "openStudio": "Open Agent Studio, where the agent architect drafts agents and apps with you. Nothing goes live until a person approves the draft."
 },
 "wizard": {
  "start": "Begin setup: add a credential, set up the agent architect, apply a sample agent, and test it.",
  "skipStudio": "Continue without an architect. You can create one later in Agent Studio with New architect.",
  "createArchitect": "Create a deployment of agent-architect with these choices and go to the next step. Its runs may only edit your studio drafts.",
  "continue": "The architect already exists. Go on to the next step of the setup."
 },
 "views": {
  "home": {
   "openStudio": "Open Agent Studio and describe the app you want; the agent architect drafts it, and a person approves it before it goes live."
  },
  "studioDraft": {
   "tabs": {
    "release": "The apps this draft builds, once applied: their deployments per environment, promotion from dev to staging and prod, and rollback from the history."
   }
  },
  "serverInfo": {
   "product": "The product this console belongs to: Agent Studio builds agentic apps on top of the Garrison runtime.",
   "docs": "Open the Garrison documentation in a new tab: architecture, configuration, harnesses, the studio, apps, and security.",
   "studioDocs": "Open the Agent Studio guide in a new tab: drafts, the agent architect, applying a draft, and promotion.",
   "website": "Open usegarrison.ai in a new tab for the product overview, screenshots, and walkthroughs.",
   "source": "Open the Garrison repository on GitHub in a new tab: source code, issues, and releases."
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "See the app's deployments per environment with their pinned revisions and overrides, promote it to the next environment, and roll a promotion back."
   }
  }
 },
 "apps": {
  "release": {
   "live": "The environment whose entry deployment the app URL uses: {{environment}}. Change it on the app's Environments step.",
   "environments": "Every member's deployments in each environment: the revision each one pins (Latest when it follows the latest published revision) and its environment overrides.",
   "source": "The environment to compare from, usually the one you tested in. It is also where Promote starts.",
   "target": "The environment to compare with and promote to. Leave it on the next environment to follow the promotion order.",
   "promote": "Open the promote dialog for {{source}} to {{target}}: each member's pinned revision moves to its deployments in {{target}} in one transaction.",
   "noNext": "There is no environment after {{source}}, so there is nothing to promote to.",
   "denied": "You need Execute permission on Promotion for {{environment}} to do this. Ask an administrator for the Releaser role.",
   "noDeployment": "This member has no deployment in {{environment}}. A promotion to {{environment}} fails until it has one.",
   "overrides": "Environment overrides of this deployment: variables set for its runs. Secret values are never shown.",
   "entry": "The entry agent: people who use the app talk to this member first.",
   "history": "Every promotion and rollback of this app, newest first. An applied promotion can be rolled back once, which restores the pins it replaced.",
   "refresh": "Read the deployments and the promotion history of this app again.",
   "columns": {
    "member": "The app's member agents, the entry agent first.",
    "environment": "Deployments of each member in {{environment}}, with their pinned revision and environment overrides.",
    "difference": "Whether each member's pins and overrides match between the two environments you compare."
   },
   "diff": {
    "Same": "The pinned revisions and the overrides in {{source}} and {{target}} match.",
    "Differs": "The pinned revisions or the overrides differ between {{source}} and {{target}}. Promoting moves the pins; each deployment keeps its own overrides.",
    "Missing": "This member has no deployment in {{target}}. Promoting from {{source}} would fail and move nothing."
   }
  }
 },
 "studio": {
  "release": {
   "title": "The apps this draft builds, read from live configuration: deployments per environment, promote, and rollback.",
   "app": "Choose which of the draft's apps to show when the draft builds more than one."
  }
 }
});

// Agents > Architects: reusable agent architects any studio draft can use, and the studio's link to them.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "nav": {
  "tabs": {
   "architects": "Agent architects you can reuse in any studio draft: create, edit, and delete them, and choose the harness profile, model, and prompt each one works with."
  }
 },
 "resources": {
  "architects": {
   "add": "Create an agent architect: a deployment of agent-architect that edits only your studio drafts and never applies them.",
   "harnessProfileId": "The harness profile the architect runs on, which decides the agent CLI it uses (Claude Code, Codex, and so on).",
   "model": "The model the architect asks the harness for. Empty uses the harness profile's default model.",
   "architectPromptTemplateId": "The System template that tells the architect how to work. The built-in prompts come first; clone one to change it.",
   "architectPromptVersion": "Pin the architect to one version of its prompt. Empty follows the current version, so a saved edit applies on its next turn.",
   "defaultModel": "No model is set, so the architect uses the harness profile's default model.",
   "defaultBadge": "This architect uses the built-in default prompt, builtin/agent-architect.",
   "activeBadge": "Active: drafts can start new conversations with this architect.",
   "inactiveBadge": "Inactive: the architect takes no new turns and drafts do not offer it until you turn it back on.",
   "actions": {
    "prompts": "Manage the architect prompts: choose the one this architect uses, and clone, edit, reset, or delete prompts.",
    "deployment": "Open the deployment behind this architect to change its limits, executor, egress rules, and other settings."
   }
  }
 },
 "studio": {
  "chat": {
   "manageArchitects": "Open Agents > Architects to create, edit, or delete the architects every draft can use."
  }
 }
});

// Typed confirmation for destructive deletes, and deleting an agent from its page.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "confirm": {
  "typeToConfirm": "Type {{word}} exactly as shown to turn on the Delete button. This keeps a stray click from deleting something you cannot get back.",
  "typeFirst": "Type {{word}} in the box first. The button stays off until the word matches."
 },
 "resources": {
  "agents": {
   "protected": "{{name}} is a protected built-in agent that Garrison seeds in every tenant, so it cannot be changed or deleted."
  }
 },
 "views": {
  "agentDetail": {
   "delete": "Delete this agent with its deployments and revision history. You type delete to confirm, and a trigger, pipeline, app, or notification endpoint that uses it blocks the delete."
  }
 }
});

// Architect credentials: the secret an architect's harness signs in with, and the studio's notice when it cannot.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(tips, {
 "studio": {
  "architect": {
   "credentialSecretId": "The secret the architect's harness signs in with: an Anthropic API key or a Claude Code OAuth token for Claude Code, an OpenAI API key or ChatGPT login for Codex, and so on. Garrison binds it to the architect's deployment.",
   "addSecret": "Open Secrets in a new tab to add the API key or token, then come back and choose it here."
  },
  "chat": {
   "fixCredential": "Open Agents > Architects filtered to this architect, then edit it and choose its credential secret.",
   "openSecrets": "Open Configuration > Secrets to add the API key or token, or to check the value of the one the architect uses."
  }
 },
 "resources": {
  "architects": {
   "credentialSecretId": "The secret the architect's harness signs in with: an Anthropic API key or a Claude Code OAuth token for Claude Code, an OpenAI API key or ChatGPT login for Codex, and so on. Garrison binds it to the architect's deployment.",
   "credentialCell": "The secret this architect's harness signs in with ({{kind}}).",
   "noCredential": "No credential secret is bound, so harnesses that need one (Claude Code, Codex, Gemini CLI) fail with Not logged in. Edit the architect to choose one."
  }
 }
});
