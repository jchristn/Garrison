// English source catalog for the Garrison dashboard. Every other locale mirrors these keys.

import { tips, explainers } from './en.tips.js';

// Lowercase a title for use mid-sentence, keeping acronyms (MCP, API, A2A, ID, URL) intact.
const midSentence = (text) =>
  text
    .split(' ')
    .map((word) => (/^[A-Z0-9]{2,}s?$/.test(word) ? word : word.toLowerCase()))
    .join(' ');

const resourcePage = (title, singular, subtitle, emptyBody) => ({
  title,
  subtitle,
  add: `Add ${singular}`,
  create: `Create ${singular}`,
  edit: `Edit ${singular}`,
  view: `${singular.charAt(0).toUpperCase()}${singular.slice(1)} details`,
  deleteTitle: `Delete ${singular}`,
  emptyTitle: `No ${midSentence(title)} yet`,
  emptyBody
});

const en = {
  processSecurity: { trustedOnly: "Process executor: trusted only. Runs share the worker user, filesystem, and network, including access to other runs and worker credentials. Use KubernetesJob for untrusted inputs." },
  common: {
    eventCodes: { ApprovalRequested: 'Approval requested', ApprovalDecided: 'Approval decided', StructuredOutputInvalid: 'Structured output invalid', RunBlocked: 'Run blocked', EventsDropped: 'Events dropped', HarnessExited: 'Harness exited', McpPreflightWarning: 'MCP preflight warning', McpPreflightPassed: 'MCP preflight passed', RepairAttemptStarted: 'Output repair started', WorkspacePrepared: 'Workspace prepared', RunGuardTriggered: 'Run guard stopped the run', ConversationFallback: 'Conversation fallback', ConversationResumed: 'Conversation resumed', ConversationStateLost: 'Conversation state lost' },
    fieldCodes: { ExpiryInPast: 'Choose a time in the future.', ParameterInvalid: 'This value is not valid for this parameter.', ParameterNotAllowed: 'This deployment does not let callers override this parameter.', SettingsFileReadOnly: 'The settings file is read-only, so this change cannot be saved.', OverriddenByEnvironment: 'An environment variable sets this value, so it cannot be changed here.', PathRequired: 'A setting path is required.', UnknownSetting: 'This server does not have this setting.', TooLong: 'This value is too long.', NotAllowedValue: 'Choose one of the allowed values.', NotABoolean: 'Choose true or false.', NotAnInteger: 'Enter a whole number.', OutOfRange: 'The value is outside the allowed range.' },
    serverText: {
      approvalWaitingExpires: 'Waiting for a person to approve {{subject}}; approval {{id}} expires at {{expires}}.',
      approvalWaiting: 'Waiting for a person to approve {{subject}}; approval {{id}}.',
      notApplied: 'Not applied because another document failed validation.',
      wouldBeUnchanged: 'Already up to date; nothing would change.',
      wouldBeUpdated: 'Would be updated.',
      wouldBeCreated: 'Would be created.',
      inUse: '{{what}} is still bound by these deployments: {{deployments}}. Remove the bindings first.',
      noActiveDeployment: 'Agent {{agent}} has no active deployment with a weight above zero. Add a deployment or raise a deployment\'s weight, then try again.',
      toolCallDenied: 'Tool call denied: {{id}}',
      threadStarted: 'Thread started.',
      runStartedModel: 'Run started ({{model}}).',
      runStarted: 'Run started.',
      sessionInitializedModel: 'Session initialized ({{model}}).',
      sessionInitialized: 'Session initialized.',
      harnessFailed: 'The harness reported a failure.',
      exitedNoResult: 'Harness exited with code {{code}} without a final result.',
      harnessExited: 'Harness exited: {{status}} ({{outcome}}).',
      harnessExitedCode: 'Harness exited with code {{code}}: {{status}} ({{outcome}}).',
      mcpPreflight: 'MCP preflight passed. Servers checked: {{count}}.',
      repairAttempt: 'Structured output repair attempt {{attempt}}: resuming the harness session in {{path}}.',
      workspacePrepared: 'Workspace prepared at {{path}}.',
      guardRepetitionUnit: 'Repetition guard: the last {{window}} characters of assistant text are the {{size}}-character unit "{{unit}}" repeated {{count}} times.',
      guardDegenerate: 'Repetition guard: the last {{window}} characters of assistant text contain no letters or digits (only whitespace, punctuation, or symbols), ending with "{{tail}}".',
      guardNoProgress: 'The run made no progress for {{seconds}} seconds (no assistant text, thinking, tool call, or tool result, and no tool call open); its noProgressSeconds limit is {{limit}}.',
      guardOutputLimit: 'Assistant text passed the run\'s maxAssistantChars limit of {{limit}} characters.',
      valueClamped: 'The value {{given}} for {{field}} is outside the allowed range {{minimum}} to {{maximum}}; {{stored}} was stored.'
    },
    appName: 'Garrison',
    language: { label: 'Language' },
    theme: { switchToLight: 'Switch to light theme', switchToDark: 'Switch to dark theme' },
    actions: {
      apply: 'Apply',
      back: 'Back',
      cancel: 'Cancel',
      clear: 'Clear',
      clone: 'Clone',
      close: 'Close',
      confirm: 'Confirm',
      copied: 'Copied',
      copy: 'Copy',
      delete: 'Delete',
      duplicate: 'Duplicate',
      edit: 'Edit',
      hide: 'Hide value',
      logout: 'Log out',
      next: 'Next',
      openGithub: 'Open the Garrison repository on GitHub',
      remove: 'Remove',
      retry: 'Retry',
      reveal: 'Show value',
      save: 'Save',
      view: 'View',
      viewDetails: 'View details',
      viewJson: 'View JSON'
    },
    boolean: { yes: 'Yes', no: 'No' },
    confirm: {
      deleteNamed: 'Delete "{{name}}"? This cannot be undone.',
      bulkDelete: 'Delete {{count}} selected records? This cannot be undone.'
    },
    errors: {
      listItem: 'Item {{index}}: {{message}}',
      chooseOne: 'Choose at least one option.',
      fixFields: 'Some fields need attention. Review the highlighted values.',
      invalidEmail: 'Enter a valid email address.',
      invalidJson: 'This is not valid JSON.',
      loadFailed: 'Failed to load data.',
      requestId: 'Request {{id}}.',
      required: 'This field is required.',
      requiredPermission: 'Requires {{permission}} on {{resource}}.'
    },
    generic: {
      deletedName: '{{name}} (deleted)',
      actions: 'Actions',
      active: 'Active',
      all: 'All',
      any: 'Any',
      builtIn: 'Built-in',
      custom: 'Custom',
      inactive: 'Inactive',
      loading: 'Loading...',
      never: 'Never',
      none: 'None',
      notAvailable: 'n/a',
      saving: 'Saving...'
    },
    relativeTime: { now: 'just now' },
    states: {
      forbiddenTitle: 'You do not have access to this page',
      forbiddenBody: 'Ask an administrator for a role that grants access, or choose another page.',
      unavailableTitle: 'Not available on this server yet',
      unavailableBody: 'The server did not expose the {{resource}} endpoints. Upgrade the server or check the API Explorer for what it supports.'
    },
    toasts: {
      bulkDeleted: 'Deleted {{count}} records ({{failed}} failed).',
      cloned: 'Cloned.',
      created: 'Created.',
      deleted: 'Deleted.',
      saved: 'Saved.'
    },
    units: { msShort: 'ms', sShort: 's', mShort: 'min', tokPerSec: 'tok/s' }
  },
  errorCodes: {
    ApprovalNotPending: 'This approval was already decided, so it cannot be decided again.',
    MessageIdConflict: 'This A2A message ID was already used with different content. Send the message with a new ID.',
    IdempotencyKeyConflict: 'This idempotency key was already used for a different request. Use a new key.',
    DeploymentDeleted: 'The deployment of this run was deleted, so the run cannot be retried. Invoke the agent again instead.',
    AgentDeleted: 'The agent of this run was deleted, so the run cannot be retried.',
    NoActiveDeployment: 'This agent has no active deployment with a weight above zero. Add a deployment or raise a deployment\'s weight.',
    TenantNotFound: 'That tenant does not exist. Check the tenant ID.',
    NetworkError: 'Could not reach the server. Check the server URL and that the server is running.',
    AuthenticationRequired: 'Your session has expired. Sign in again.',
    InvalidCredentials: 'The tenant, email, password, or keys are incorrect.',
    RateLimited: 'Too many sign-in attempts. Wait a minute and try again.',
    AuthorizationDenied: 'You do not have permission for this action.',
    NotFound: 'The record was not found.',
    RouteNotFound: 'This server does not support that endpoint.',
    ValidationFailed: 'Some values are invalid.',
    InvalidBody: 'The request body is not valid.',
    InvalidJson: 'The request body is not valid JSON.',
    Conflict: 'This conflicts with an existing record.',
    BuiltInImmutable: 'Built-in records cannot be changed. Clone it to customize.',
    Protected: 'This record is protected and cannot be deleted.',
    StaleLease: 'The run lease is no longer held by that node.',
    InternalError: 'The server hit an internal error. Check the server logs with the request ID.',
    Http400: 'The request was rejected as invalid.',
    Http403: 'You do not have permission for this action.',
    Http404: 'Not found.',
    Http409: 'Conflict with the current state.',
    Http500: 'The server hit an internal error.',
    Http503: 'The server is unavailable.',
    ConversationBusy: 'This conversation is still working on its previous turn. Wait for that run to finish, or cancel it, then try again.',
    ConversationAgentMismatch: 'This conversation belongs to a different agent. Send the turn to that agent, or start a new conversation.',
    ConversationDeploymentMismatch: 'Every turn of a conversation runs on the deployment of its first turn. Leave the deployment empty, or start a new conversation.',
    ConversationDeploymentUnavailable: 'The deployment this conversation runs on was deleted, so the conversation cannot continue. Start a new conversation.'
  },
  enums: {
    approvalStatus: {
      Pending: 'Pending',
      Approved: 'Approved',
      Denied: 'Denied',
      Expired: 'Expired',
      Cancelled: 'Cancelled'
    },
    approvalDecision: {
      Allow: 'Allow',
      Deny: 'Deny'
    },
    approvalSource: {
      DurableResume: "Checkpoint approval",
      Rule: 'Rule',
      Default: 'Deployment default',
      User: 'Person',
      Timeout: 'Timeout',
      Cancelled: 'Run stopped'
    },
    approvalRuleAction: {
      Allow: 'Allow',
      Deny: 'Deny',
      Ask: 'Ask a person'
    },
    approvalKind: {
      Tool: 'Tool call',
      Command: 'Command',
      FileChange: 'File change'
    },
    principalType: { Administrator: 'Administrator', User: 'User', Credential: 'Access key', Run: 'Run token' },
    runBlockedReason: { NoReadyWorker: 'No ready worker', NoCapableWorker: 'No capable worker', NoMatchingPool: 'No matching pool' },
    promptDelivery: { Stdin: 'Standard input', Argument: 'Command-line argument', File: 'File', CodexAppServer: 'Codex app-server (JSON-RPC)' },
    systemPromptDelivery: {
      File: 'File',
      Argument: 'Command-line argument',
      Environment: 'Environment variable',
      PrependToPrompt: 'Prepended to the prompt',
      None: 'Not delivered'
    },
    mcpConfigFormat: { None: 'No MCP configuration', ClaudeJson: 'Claude Code JSON', CodexToml: 'Codex TOML', MuxJson: 'Mux JSON', GeminiSettings: 'Gemini CLI settings' },
    outputParser: {
      ClaudeStreamJson: 'Claude Code stream JSON',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'Codex app-server JSON-RPC',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'Gemini CLI stream JSON',
      GenericJsonl: 'Generic JSONL',
      PlainText: 'Plain text'
    },
    resultSource: { ParserFinalEvent: 'Final parser event', LastMessageFile: 'Last message file', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: 'Final event', ExitCode: 'Exit code', FinalEventAndExitCode: 'Final event and exit code' },
    fileBaseDirectory: { Config: 'Configuration directory', Workspace: 'Workspace', Home: 'Home directory' },
    artifactStoreKind: { Database: 'Database', Filesystem: 'File system', S3: 'S3' },
    agentInputMode: { Text: 'Text', Structured: 'Structured JSON' },
    argumentOverrideOperation: { Append: 'Append', Prepend: 'Prepend', Remove: 'Remove', Replace: 'Replace' },
    runOverrideValidation: { Any: 'Any value', Enum: 'One of a list', Regex: 'Regular expression', IntegerRange: 'Integer range' },
    credentialAuthMode: { DirectHeader: 'Direct headers', SignedRequest: 'Signed requests', SessionExchange: 'Session token exchange', Hybrid: 'Any method' },
    operationType: { All: 'All operations', Create: 'Create', Read: 'Read', Write: 'Write', Update: 'Update', Delete: 'Delete', Execute: 'Execute', Admin: 'Administer' },
    usageQuotaScope: {"Tenant": "Tenant", "Agent": "Agent", "Deployment": "Deployment"},
    resourceType: {
      All: 'All resources',
      Account: 'Account',
      Tenant: 'Tenant',
      Admin: 'Administration',
      User: 'User',
      Credential: 'Access key',
      Session: 'Session',
      Role: 'Role',
      Permission: 'Permission',
      Assignment: 'Assignment',
      Audit: 'Audit log',
      RequestHistory: 'Request history',
      Settings: 'Settings',
      HarnessProfile: 'Harness profile',
      PromptTemplate: 'Prompt template',
      Agent: 'Agent',
      Deployment: 'Deployment',
      McpServer: 'MCP server',
      Secret: 'Secret',
      Workspace: 'Workspace',
      ArtifactStore: 'Artifact store',
      ModelPrice: "model price",
      UsageQuota: "usage quota",
      Run: 'Run',
      Node: 'Node',
      NodePool: 'Node pool',
      Manifest: 'Manifest',
      Conversation: 'Conversation',
      Approval: 'Approval',
      Artifact: 'Artifact'
    },
    runStatus: {
      Pending: 'Pending',
      Queued: 'Queued',
      Leased: 'Leased',
      Running: 'Running',
      Cancelling: 'Cancelling',
      Succeeded: 'Succeeded',
      Failed: 'Failed',
      Cancelled: 'Cancelled',
      TimedOut: 'Timed out',
      Rejected: 'Rejected'
    },
    runOutcome: {
      None: 'None',
      Succeeded: 'Succeeded',
      HarnessFailed: 'Harness failed',
      NotInstalled: 'Harness not installed',
      NotCredentialed: 'Missing credentials',
      McpPreflightFailed: 'MCP pre-flight failed',
      NodeLost: 'Node lost',
      OutputLimitExceeded: 'Output limit exceeded',
      SchemaValidationFailed: 'Output schema invalid',
      TimedOut: 'Timed out',
      Cancelled: 'Cancelled',
      StaleLease: 'Stale lease',
      CompileFailed: 'Compile failed',
      WorkspaceFailed: 'Workspace failed',
      Rejected: 'Rejected',
      InternalError: 'Internal error',
      NoCapableWorker: 'No capable worker',
      RepetitionDetected: 'Repetition detected',
      NoProgress: 'No progress',
      PodFailed: 'Run pod failed',
      ConversationStateLost: 'Conversation state lost'
    },
    runEventType: {
      Lifecycle: 'Lifecycle',
      AssistantText: 'Assistant',
      Thinking: 'Thinking',
      ToolCall: 'Tool call',
      ToolResult: 'Tool result',
      Usage: 'Usage',
      Progress: 'Progress',
      Warning: 'Warning',
      Error: 'Error',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: 'Result'
    },
    nodeStatus: { Ready: 'Ready', Draining: 'Draining', Cordoned: 'Cordoned', Lost: 'Lost', Offline: 'Offline' },
    controlNodeStatus: { Starting: 'Starting', Ready: 'Ready', Draining: 'Draining', Offline: 'Offline' },
    backplane: { Local: 'Local (one replica)', Polling: 'Database polling', PostgresNotify: 'PostgreSQL notifications' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: 'Generic' },
    agentKind: { Hosted: 'Hosted', Remote: 'Remote' },
    delegationMode: { None: 'No delegation', AllowList: 'Allow list', Any: 'Any agent' },
    secretStatus: { Ok: 'OK', NeedsReauthentication: 'Needs reauthentication' },
    secretKind: {
      AnthropicApiKey: 'Anthropic API key',
      ClaudeCodeOAuthToken: 'Claude Code OAuth token',
      OpenAiApiKey: 'OpenAI API key',
      CodexAuthJson: 'Codex auth.json',
      GeminiApiKey: 'Gemini API key',
      GenericEnv: 'Environment value',
      GenericFile: 'File content',
      BearerToken: 'Bearer token',
      BasicAuth: 'Basic authentication',
      GitCredential: 'Git credential'
    },
    workspaceKind: { Empty: 'Empty', GitRepository: 'Git repository', Seeded: 'Seeded files', PersistentVolume: 'Persistent volume' },
    runExecutor: { Process: 'Process', KubernetesJob: 'Kubernetes Job' },
    workspaceRetention: { Delete: 'Delete', Keep: 'Keep', KeepOnFailure: 'Keep on failure' },
    promptTemplateKind: { System: 'System', Task: 'Task', Fragment: 'Fragment', ToolDescription: 'Tool description', ConfigFile: 'Config file', Other: 'Other' },
    permissionType: { Permit: 'Permit', Deny: 'Deny' },
    resourceScope: { Tenant: 'Tenant', Resource: 'Resource' },
    resourceBindingKind: { McpServer: 'MCP server', Secret: 'Secret' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: 'Created', Updated: 'Updated', Unchanged: 'Unchanged', Failed: 'Failed', Validated: 'Validated' },
    auditEventType: {
      ApprovalDecided: 'Approval decided',
      AuthSuccess: 'Sign-in succeeded',
      AuthFailure: 'Sign-in failed',
      SessionIssued: 'Session issued',
      SessionRevoked: 'Session revoked',
      CredentialCreated: 'Credential created',
      CredentialRotated: 'Credential rotated',
      CredentialUsed: 'Credential used',
      AuthorizationDenied: 'Authorization denied',
      AuthorizationBypass: 'Authorization bypass',
      RoleChanged: 'Role changed',
      PermissionChanged: 'Permission changed',
      AssignmentChanged: 'Assignment changed',
      ConfigurationChanged: 'Configuration changed',
      SecretChanged: 'Secret changed',
      SettingsChanged: 'Settings changed',
      RestartRequested: 'Restart requested',
      ManifestApplied: 'Manifest applied',
      NodeRegistered: 'Node registered',
      NodeStatusChanged: 'Node status changed',
      RunCancelled: 'Run cancelled',
      ConversationDeleted: 'Conversation deleted'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Affinity node not ready',
      AffinityWaitExpired: 'Affinity wait expired',
      WorkspaceLost: 'Workspace lost',
      SessionMissing: 'No session to resume',
      HarnessChanged: 'Harness profile changed',
      ResumeUnsupported: 'Resume not supported',
      ExecutorWithoutState: 'Executor keeps no state'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} approval waiting',
    approvalsPending_other: '{{count}} approvals waiting',
    primary: 'Primary navigation',
    sections: {
      operate: 'Operate',
      platform: 'Platform',
      administration: 'Administration'
    },
    hubs: {
      approvals: {
        label: 'Approvals',
        tip: 'Tool calls waiting for a person, and every decision'
      },
      home: { label: 'Home', tip: 'Fleet and run health at a glance' },
      invoke: { label: 'Invoke', tip: 'Try an agent interactively' },
      runs: { label: 'Runs', tip: 'Runs and the scheduling queue' },
      analytics: { label: 'Analytics', tip: 'Run speed, tokens, cost, and outcomes over time' },
      agents: { label: 'Agents', tip: 'Agents and the deployments that run them' },
      configuration: { label: 'Configuration', tip: 'Harness profiles, prompt templates, MCP servers, secrets, workspaces, artifact stores, and manifests' },
      fleet: { label: 'Fleet', tip: 'Control plane, worker nodes, and node pools' },
      access: { label: 'Access', tip: 'Tenants, users, credentials, roles, and assignments' },
      monitoring: { label: 'Monitoring', tip: 'Request history, audit, and the API Explorer' },
      system: { label: 'System', tip: 'Server settings and server info' }
    },
    items: {
      approvals: {
        label: 'Approvals',
        tip: 'Allow or deny tool calls agents asked to make'
      },
      home: { label: 'Home', tip: 'Fleet and run health at a glance' },
      invoke: { label: 'Invoke', tip: 'Try an agent interactively' },
      runs: { label: 'Runs', tip: 'Find, inspect, cancel, and retry runs' },
      queue: { label: 'Queue', tip: 'Scheduling pressure by agent and harness' },
      analytics: { label: 'Analytics', tip: 'Run speed, tokens, cost, and outcomes over time' },
      nodes: { label: 'Worker nodes', tip: 'Worker nodes and their harness capabilities' },
      controlNodes: { label: 'Control plane', tip: 'Server replicas that serve the API and schedule runs' },
      nodePools: { label: 'Node Pools', tip: 'Group nodes and dedicate them to tenants' },
      agents: { label: 'Agents', tip: 'Agents exposed over REST, MCP, and A2A' },
      deployments: { label: 'Deployments', tip: 'Bind agents to harnesses, prompts, and resources' },
      harnessProfiles: { label: 'Harness Profiles', tip: 'How each harness runs headless' },
      promptTemplates: { label: 'Prompt Templates', tip: 'Every prompt Garrison sends, versioned' },
      mcpServers: { label: 'MCP Servers', tip: 'Tools available to agents' },
      secrets: { label: 'Secrets', tip: 'Harness and integration credentials' },
      workspaces: { label: 'Workspaces', tip: 'How run workspaces are prepared' },
      artifactStores: { label: 'Artifact Stores', tip: 'Where run artifacts are stored' },
      modelPrices: { label: "Model Prices", tip: "Operator-configured USD rates for estimating cost when a harness omits it. Reported cost, including zero, takes precedence." },
      usageQuotas: { label: "Usage Quotas", tip: "Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment." },
      manifests: { label: 'Manifests', tip: 'Apply and export configuration as code' },
      requests: { label: 'Request History', tip: 'Inspect HTTP traffic and failures' },
      audit: { label: 'Audit', tip: 'Security and configuration events' },
      explorer: { label: 'API Explorer', tip: 'Execute live API calls' },
      tenants: { label: 'Tenants', tip: 'Manage tenants' },
      users: { label: 'Users', tip: 'Manage users' },
      credentials: { label: 'Credentials', tip: 'Access keys for automation' },
      roles: { label: 'Roles', tip: 'Roles and permissions' },
      assignments: { label: 'Assignments', tip: 'Grant roles to users and credentials' },
      settings: { label: 'Settings', tip: 'Edit server and cluster settings' },
      serverInfo: { label: 'Server Info', tip: 'Endpoints, version, and your identity' },
      conversations: {
        label: 'Conversations',
        tip: 'Multi-turn exchanges with an agent'
      }
    },
    setup: 'Setup wizard',
    setupTip: 'Configure a credential, apply a sample agent, and test it',
    tour: 'Guided tour',
    tourTip: 'Replay the guided tour',
    version: 'Version {{version}}',
    collapseSidebar: 'Toggle navigation',
    skipToContent: 'Skip to content'
  },
  login: {
    title: 'Garrison',
    subtitle: 'Sign in to the agent control plane',
    tabs: { password: 'Email and password', accessKey: 'Access key' },
    serverUrl: 'Server URL',
    serverInUse: 'Server in use:',
    useDifferentServer: 'Use a different server',
    useDefaultServer: 'Use the default server',
    tenantId: 'Tenant ID',
    email: 'Email',
    password: 'Password',
    accessKey: 'Access key',
    secretKey: 'Secret key',
    submit: 'Sign in',
    connecting: 'Signing in...',
    restoring: 'Restoring your session...',
    errorGeneric: 'Could not sign in. Check your credentials and that the server is reachable.',
    footerHint: 'Default credentials: admin@garrison / password in tenant default.'
  },
  topbar: {
    server: 'Server',
    tenant: 'Tenant',
    switchTenant: 'Switch tenant',
    copyServer: 'Copy server URL',
    live: 'Live',
    polling: 'Polling',
    liveOn: 'Receiving live updates over WebSocket',
    liveOff: 'Live updates unavailable; pages refresh by polling',
    health: { healthy: 'Healthy', unhealthy: 'Unreachable', unknown: 'Checking' }
  },
  roles: {
    systemAdmin: 'System admin',
    tenantAdmin: 'Tenant admin',
    user: 'User',
    credential: 'Access key',
    run: 'Run token'
  },
  components: {
    fieldWarnings: { title_one: 'Saved with {{count}} adjusted value', title_other: 'Saved with {{count}} adjusted values', body: 'The server accepted the request but stored these values differently from what was sent.', dismiss: 'Dismiss', codes: { ValueClamped: 'Value clamped to the allowed range' } },
    approvals: {
      awaiting: 'Awaiting approval',
      decideTitle: 'Decide {{tool}}',
      decision: 'Decision',
      reason: 'Reason',
      reasonPlaceholder: 'Optional. The agent and the audit log see it.',
      remember: 'Remember as a rule for this deployment',
      rulePattern: 'Rule pattern',
      rememberHint: 'Adds a rule with the action {{action}} to the deployment, so matching calls are decided without asking. This also needs permission to update the deployment.',
      submitAllow: 'Allow',
      submitDeny: 'Deny',
      timeoutThen: 'then {{decision}}',
      toasts: {
        allowed: 'Allowed {{tool}}.',
        denied: 'Denied {{tool}}.',
        allowedRemembered: 'Allowed {{tool}} and added the rule {{pattern}}.',
        deniedRemembered: 'Denied {{tool}} and added the rule {{pattern}}.',
        notPending: 'This approval was already decided by someone else or by its timeout. The list now shows the result.',
        forbidden: 'You may read approvals but not decide them. Ask an administrator for the Approval Update permission.',
        forbiddenRemember: 'Remembering a rule also needs permission to update the deployment. Decide without remembering, or ask for Deployment Update.'
      }
    },
    approvalCheck: {
      title: 'Test a tool call',
      saveFirst: 'Save the deployment first. The test checks the rules the server has stored.',
      hint: 'Checks the saved rules, so save your changes before testing them. Nothing is recorded.',
      toolName: 'Tool',
      inputs: {
        command: 'Command',
        url: 'URL',
        query: 'Search query',
        file_path: 'File path',
        notebook_path: 'Notebook path',
        pattern: 'Pattern'
      },
      run: 'Check',
      checking: 'Checking...',
      byRule: '{{action}} by this rule:',
      byDefault: '{{action}} by the deployment default, because no rule matched.',
      suggestedRule: 'Suggested rule:',
      disabled: 'Approvals are off for this deployment, so its runs never ask. Turn them on and save to apply these rules.'
    },
    blocked: {
      title: 'Waiting for a worker',
      body: 'This run is queued, but no worker can take it right now.',
      reasons: {
        NoReadyWorker: 'No worker node is Ready. Start a worker or register a new one, and check the Fleet page for nodes that are Lost, Offline, Draining, or Cordoned.',
        NoCapableWorker: 'Workers are Ready, but none reports the {{harness}} harness as available. Start or register a worker with that harness installed, or check its credentials and probe results on the Fleet page.',
        NoMatchingPool: 'A Ready worker can run {{harness}}, but none matches this deployment\'s node pool or node selectors. Check the deployment\'s placement, or add a worker to that pool.'
      },
      failNote: 'When the cluster setting Runtime.FailBlockedAfterSeconds is above 0, a run that stays blocked that long fails with the outcome "No capable worker".',
      openFleet: 'Open Fleet',
      openAgent: 'Open the agent\'s deployments',
      homeBanner_one: '{{count}} queued run cannot start: no Ready worker can run it.',
      homeBanner_other: '{{count}} queued runs cannot start: no Ready worker can run them.',
      showRuns: 'Show queued runs',
      queueColumn: 'Blocked',
      queueCount_one: '{{count}} blocked',
      queueCount_other: '{{count}} blocked'
    },
    autoRefresh: {
      label: 'Auto-refresh',
      none: 'Off',
      seconds_one: 'Every {{count}} second',
      seconds_other: 'Every {{count}} seconds'
    },
    chart: {
      success: 'Success',
      failure: 'Failed',
      total: 'Total',
      avgDuration: 'Avg duration',
      noData: 'No activity in this range.',
      range: 'Time range',
      ranges: { hour: 'Last hour', day: 'Last day', week: 'Last week', month: 'Last month', custom: 'Custom' }
    },
    compilePreview: {
      title: 'Compile preview',
      input: 'Sample input',
      compile: 'Compile',
      compiling: 'Compiling...',
      commandLine: 'Command line',
      stdin: 'Standard input',
      environment: 'Environment',
      files_one: '{{count}} file',
      files_other: '{{count}} files'
    },
    confirm: { title: 'Please confirm', message: 'Are you sure you want to continue?' },
    diff: { before: 'Before', after: 'After' },
    explainer: { about: 'About {{topic}}', dismiss: 'Hide this explanation' },
    export: { label: 'Export', csv: 'CSV (data)', png: 'PNG image', svg: 'SVG image', json: 'JSON (data)', failed: 'Export failed. {{message}}', tableTitle: 'table {{table}}' },
    filters: {
      allTenants: 'All tenants',
      clear: 'Clear filters',
      from: 'From',
      to: 'To',
      method: 'Method',
      path: 'Path contains',
      pathPlaceholder: 'for example /v1.0/api/tenants',
      searchName: 'Search by name',
      status: 'Status code',
      statusPlaceholder: 'for example 404',
      tenant: 'Tenant'
    },
    form: {
      addItem: 'Add item',
      addRow: 'Add row',
      key: 'Key',
      value: 'Value',
      moveUp: 'Move up',
      moveDown: 'Move down',
      noItems: 'No items yet.',
      onePerLine: 'One value per line',
      steps: 'Form steps'
    },
    mcpTest: {
      title: 'MCP connection test',
      testing: 'Connecting and listing tools...',
      ok: 'Connected',
      failed: 'Failed',
      tools_one: '{{count}} tool',
      tools_other: '{{count}} tools'
    },
    permissions: {
      title: 'Effective permissions',
      none: 'No grants. This principal can only use bypass rules, if any.',
      source: 'Role',
      type: 'Type',
      resources: 'Resource types',
      operations: 'Operations',
      scope: 'Scope'
    },
    requestDetails: {
      title: 'Request details',
      metadata: 'Metadata',
      requestHeaders: 'Request headers',
      requestBody: 'Request body',
      responseHeaders: 'Response headers',
      responseBody: 'Response body',
      rawJson: 'Raw JSON',
      truncated: 'Truncated ({{bytes}} bytes original)',
      empty: 'No content.',
      fields: {
        id: 'Request ID',
        method: 'Method',
        path: 'Path',
        url: 'URL',
        status: 'Status',
        duration: 'Duration',
        createdUtc: 'Created',
        completedUtc: 'Completed',
        sourceIp: 'Source IP',
        principal: 'Principal',
        tenant: 'Tenant',
        user: 'User'
      }
    },
    secretOnce: {
      title: 'Copy this secret now',
      warning: 'This is the only time the secret is shown. Store it somewhere safe before closing.',
      accessKey: 'Access key',
      secretKey: 'Secret key',
      done: 'I saved it'
    },
    table: {
      bulkActions: 'Bulk actions',
      bulkDelete: 'Delete selected',
      clearSelection: 'Clear selection',
      empty: 'No records to display.',
      first: 'First page',
      jump: 'Jump to page',
      last: 'Last page',
      loading: 'Loading records...',
      next: 'Next page',
      noMatches: 'No records match the current filters.',
      pageOf: 'Page {{page}} of {{total}}',
      pageSize: 'Per page',
      pinned: 'Always shown',
      prev: 'Previous page',
      records_one: 'record',
      records_other: 'records',
      refresh: 'Refresh',
      selectAll: 'Select all rows on this page',
      selectColumns: 'Select columns',
      selected_one: '{{formattedCount}} selected',
      selected_other: '{{formattedCount}} selected',
      selectRow: 'Select row',
      showing: 'Showing {{from}} to {{to}}',
      sortBy: 'Sort by {{column}}',
      sortPageOnly: 'Sorts the current page only'
    }
  },
  resources: {
    approvals: {
      ...resourcePage('Approvals', 'approval', 'Tool calls agents asked to make, decided by a deployment rule, the deployment default, a person, or a timeout. Pending ones wait for you.', 'Approvals appear when a deployment with approvals turned on asks before a tool call.'),
      emptyTitle: 'No approvals yet',
      columns: {
        createdUtc: 'Requested',
        agentName: 'Agent',
        toolName: 'Tool',
        summary: 'Request',
        status: 'Status',
        decision: 'Decision',
        decisionSource: 'Source',
        decidedBy: 'Decided by',
        expiresUtc: 'Expires',
        kind: 'Kind',
        harnessType: 'Harness',
        runId: 'Run',
        waitMs: 'Wait',
        reason: 'Reason',
        decidedUtc: 'Decided',
        id: 'ID'
      },
      fields: {
        status: 'Status',
        decision: 'Decision',
        decisionSource: 'Decision source',
        decidedBy: 'Decided by',
        toolName: 'Tool',
        kind: 'Kind',
        harnessType: 'Harness',
        agentName: 'Agent',
        runId: 'Run',
        rootRunId: 'Root run',
        deploymentId: 'Deployment',
        leaseEpoch: 'Lease epoch',
        requestedUtc: 'Requested',
        expiresUtc: 'Expires',
        decidedUtc: 'Decided',
        waitMs: 'Wait time',
        timeoutDecision: 'Decision on timeout',
        toolCallId: 'Tool call ID',
        reason: 'Reason',
        summary: 'Summary',
        inputPreview: 'Input (redacted)',
        rulePattern: 'Matched rule',
        ruleId: 'Rule ID',
        suggestedRule: 'Suggested rule',
        rememberedRuleId: 'Remembered rule ID'
      },
      filters: {
        runId: 'Run ID',
        runIdPlaceholder: 'Run ID (run_...)'
      },
      actions: {
        allow: 'Allow',
        deny: 'Deny',
        openRun: 'Open run'
      }
    },
    tenants: {
      ...resourcePage('Tenants', 'tenant', 'Isolated workspaces, each with its own users, agents, secrets, and runs.', 'Create a tenant to isolate a team or customer.'),
      columns: { name: 'Name', id: 'ID', description: 'Description', active: 'Active', createdUtc: 'Created' },
      fields: { name: 'Name', description: 'Description', active: 'Active' }
    },
    users: {
      ...resourcePage('Users', 'user', 'People who sign in to this tenant with an email and password.', 'Add a user so a person can sign in to this tenant.'),
      columns: { email: 'Email', name: 'Name', id: 'ID', role: 'Role', active: 'Active', createdUtc: 'Created' },
      fields: { email: 'Email', password: 'Password', firstName: 'First name', lastName: 'Last name', isTenantAdmin: 'Tenant administrator', isAdmin: 'System administrator', active: 'Active' },
      hints: { isAdmin: 'System administrators can manage every tenant and bypass all authorization.', password: 'Leave blank when editing to keep the current password.' },
      actions: { permissions: 'Effective permissions' }
    },
    credentials: {
      ...resourcePage('Credentials', 'credential', 'Access keys used by automation, SDKs, and integrations. Secrets are shown once.', 'Create an access key so a script or service can call Garrison.'),
      columns: { name: 'Name', accessKey: 'Access key', secretKeyLast4: 'Secret', userId: 'Owner', lastUsedUtc: 'Last used', expiresUtc: 'Expires', active: 'Active', id: 'ID' },
      fields: { name: 'Name', userId: 'Owner', authMode: 'Authentication mode', expiresUtc: 'Expires', active: 'Active' },
      hints: { userId: 'A credential can never exceed the permissions of its owner.' },
      actions: { rotate: 'Rotate secret' }
    },
    roles: {
      ...resourcePage('Roles', 'role', 'Roles group permissions. Built-in roles are read-only; clone one to customize.', 'Create a custom role, or clone a built-in role.'),
      columns: { name: 'Name', description: 'Description', isBuiltIn: 'Type', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: { name: 'Name', description: 'Description', active: 'Active' }
    },
    permissions: {
      ...resourcePage('Permissions', 'permission', 'Permit or deny operations on resource types. Deny always wins.', 'Create a permission and map it to a role.'),
      columns: { name: 'Name', permissionType: 'Type', resourceTypes: 'Resource types', operationTypes: 'Operations', isBuiltIn: 'Origin', id: 'ID' },
      fields: { name: 'Name', permissionType: 'Type', resourceTypes: 'Resource types', operationTypes: 'Operations', active: 'Active' }
    },
    userAssignments: {
      ...resourcePage('User assignments', 'user assignment', 'Grant roles to users at tenant or resource scope.', 'Assign a role to a user.'),
      columns: { userId: 'User', roleName: 'Role', resourceScope: 'Scope', resourceId: 'Resource', active: 'Active', createdUtc: 'Created', id: 'ID' },
      fields: { userId: 'User', roleId: 'Role', resourceScope: 'Scope', resourceId: 'Resource ID', inheritsToChildren: 'Applies to resources in the tenant', active: 'Active' }
    },
    credentialAssignments: {
      ...resourcePage('Credential assignments', 'credential assignment', 'Grant roles to access keys. Keep credentials narrower than their owners.', 'Assign a role to a credential.'),
      columns: { credentialId: 'Credential', roleName: 'Role', resourceScope: 'Scope', resourceId: 'Resource', active: 'Active', createdUtc: 'Created', id: 'ID' },
      fields: { credentialId: 'Credential', roleId: 'Role', resourceScope: 'Scope', resourceId: 'Resource ID', inheritsToChildren: 'Applies to resources in the tenant', active: 'Active' }
    },
    harnessProfiles: {
      ...resourcePage('Harness Profiles', 'harness profile', 'Describe exactly how a harness runs headless: executable, arguments, environment, files, and output parsing.', 'Clone a built-in profile to customize how a harness is launched.'),
      steps: { basics: 'Basics', invocation: 'Invocation', output: 'Output', limits: 'Limits' },
      columns: { name: 'Name', harnessType: 'Harness', executable: 'Executable', outputParser: 'Parser', isBuiltIn: 'Origin', id: 'ID', createdUtc: 'Created' },
      fields: {
        name: 'Name',
        description: 'Description',
        harnessType: 'Harness type',
        executable: 'Executable',
        probeArguments: 'Version probe arguments',
        active: 'Active',
        arguments: 'Arguments',
        argTemplate: 'Template',
        argCondition: 'Condition',
        argRepeatOver: 'Repeat over',
        promptDelivery: 'Prompt delivery',
        promptArgumentTemplate: 'Prompt argument or file name',
        systemPromptDelivery: 'System prompt delivery',
        systemPromptTarget: 'System prompt target',
        mcpConfigFormat: 'MCP configuration format',
        mcpConfigFileName: 'MCP configuration file name',
        environment: 'Environment',
        envName: 'Name',
        envValue: 'Value template',
        isSecret: 'Secret',
        files: 'Files',
        fileBase: 'Base directory',
        filePath: 'Path',
        fileContent: 'Content template',
        fileMode: 'Mode',
        credentialEnvironmentAllowlist: 'Allowed credential variables',
        outputParser: 'Output parser',
        genericTextField: 'Text field path',
        genericFinalField: 'Final result field path',
        genericSuccessField: 'Success field path',
        genericSuccessValue: 'Success value',
        resultSource: 'Result source',
        resultFileName: 'Result file name',
        successPolicy: 'Success policy',
        successExitCodes: 'Successful exit codes',
        defaultTimeoutSeconds: 'Default timeout (seconds)',
        killGraceSeconds: 'Kill grace (seconds)',
        maxOutputBytes: 'Maximum output (bytes)',
        stderrTailBytes: 'Stderr tail (bytes)',
        isolateHome: 'Isolate HOME per run',
        supportsResume: 'Supports session resume'
      },
      hints: {
        arguments: 'Each template renders to one argument. A condition that renders empty or false skips the argument.',
        executable: 'Command name on the worker PATH, or an absolute path.',
        environment: 'Reference bound secrets with {{secret.alias}}. The process environment starts empty except for the allowlist.',
        successPolicy: 'Garrison decides success from the final parser event by default, not the exit code.'
      },
      errors: { reservedPrefix: 'The builtin/ prefix is reserved.' }
    },
    promptTemplates: {
      deleteBound_other: '"{{name}}" is bound by {{count}} deployments, so the server will refuse to delete it. Remove the binding from these deployments first:',
      deleteBound_one: '"{{name}}" is bound by {{count}} deployment, so the server will refuse to delete it. Remove the binding from this deployment first:',
      deleteUnbound: 'Delete "{{name}}" and all of its versions? No deployment binds it. This cannot be undone.',
      ...resourcePage('Prompt Templates', 'template', 'Every prompt and configuration file Garrison renders. Each save creates a version.', 'Create a template, or clone a built-in one.'),
      add: 'New template',
      columns: { name: 'Name', kind: 'Kind', currentVersion: 'Version', description: 'Description', isBuiltIn: 'Origin', id: 'ID', lastUpdateUtc: 'Updated' },
      fields: { name: 'Name', kind: 'Kind', description: 'Description' }
    },
    mcpServers: {
      ...resourcePage('MCP Servers', 'MCP server', 'MCP servers agents can use. Headers and environment may reference secrets.', 'Register an MCP server so deployments can bind it.'),
      columns: { name: 'Name', transport: 'Transport', endpoint: 'Endpoint', required: 'Required', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: {
        name: 'Name',
        transport: 'Transport',
        description: 'Description',
        url: 'Base URL',
        path: 'MCP path',
        headers: 'Headers',
        headerName: 'Name',
        headerValue: 'Value template',
        command: 'Command',
        arguments: 'Arguments',
        environment: 'Environment',
        requiredTools: 'Required tools',
        toolTimeoutSeconds: 'Tool timeout (seconds)',
        required: 'Fail the run when unreachable',
        active: 'Active'
      },
      hints: { requiredTools: 'Pre-flight fails the run before launch when a listed tool is missing.' },
      actions: { test: 'Test connection' }
    },
    secrets: {
      errors: { expiryPast: 'Choose an expiry in the future, or leave it empty so the secret never expires.' },
      ...resourcePage('Secrets', 'secret', "Encrypted credentials for harnesses and integrations. Secret managers can reveal values; every reveal is audited.", 'Add the API key or token your agents need, for example an Anthropic API key.'),
      notSet: 'Not set',
      neverRefreshed: 'Not yet',
      reauth: { title: 'This login needs reauthentication', since: 'Since {{time}}', action: 'Runs that use this secret fail until you replace its value. Sign in again with codex login using a separate CODEX_HOME, then use Set value to store the new auth.json, or switch the deployment to an OpenAI API key secret. Do not keep using the same login on another machine: both copies share one refresh token.' },
      columns: { status: 'Status', accessTokenExpiresUtc: 'Access token expires', name: 'Name', kind: 'Kind', valueLast4: 'Value', rotatedUtc: 'Last changed', expiresUtc: 'Expires', active: 'Active', id: 'ID' },
      fields: { refreshedUtc: 'Last refreshed by Garrison', accessTokenExpiresUtc: 'Access token expires', name: 'Name', kind: 'Kind', description: 'Description', value: 'Value', newValue: 'New value', expiresUtc: 'Expires', active: 'Active' },
      hints: { expiresUtc: 'Must be in the future. Leave empty for a secret that never expires.', kind: 'Subscription tokens on shared servers may violate provider terms. Prefer API keys for shared deployments.' },
      actions: { setValue: 'Set value', rotate: 'Rotate' }
    },
    workspaces: {
      ...resourcePage('Workspaces', 'workspace template', 'How a run workspace is prepared: empty, cloned from Git, or seeded with files.', 'Create a workspace template so deployments start from a repository or files.'),
      columns: { name: 'Name', kind: 'Kind', gitUrl: 'Repository', retention: 'Retention', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: { name: 'Name', kind: 'Kind', description: 'Description', gitUrl: 'Repository URL', gitRef: 'Branch, tag, or commit', gitDepth: 'Clone depth', gitCredentialSecretId: 'Git credential', persistentVolumeClaim: 'PersistentVolumeClaim name', files: 'Files', filePath: 'Path', fileContent: 'Content', retention: 'Retention', active: 'Active' },
      hints: { persistentVolumeClaim: 'An existing claim in the run namespace. Only deployments with the Kubernetes Job executor can use this workspace; its contents persist across runs.' },
      errors: { claimName: 'Use lowercase letters, digits, hyphens, and dots, starting and ending with a letter or digit.' }
    },
    modelPrices: {
      ...{"title": "Model Prices", "subtitle": "Operator-configured USD rates for estimating cost when a harness omits it. Reported cost, including zero, takes precedence.", "add": "Add model price", "create": "Create model price", "edit": "Edit model price", "view": "Model price details", "deleteTitle": "Delete model price", "emptyTitle": "No model prices yet", "emptyBody": "Add a price for an exact harness and served model. No provider rates are seeded."},
      columns: {"name": "Name", "active": "Active", "id": "ID", "createdUtc": "Created", "model": "Served model", "harnessType": "Harness", "inputUsdPerMillion": "Input USD / million tokens", "outputUsdPerMillion": "Output USD / million tokens"},
      fields: {"name": "Name", "description": "Description", "active": "Active", "model": "Served model", "harnessType": "Harness", "inputUsdPerMillion": "Input USD / million tokens", "outputUsdPerMillion": "Output USD / million tokens", "cachedInputUsdPerMillion": "Cached input USD / million tokens", "reasoningUsdPerMillion": "Reasoning USD / million tokens", "inputIncludesCachedTokens": "Input count includes cached tokens", "outputIncludesReasoningTokens": "Output count includes reasoning tokens"},
      hints: {"cachedInputUsdPerMillion": "Leave empty to use the corresponding input or output rate. Zero means free.", "reasoningUsdPerMillion": "Leave empty to use the corresponding input or output rate. Zero means free.", "inputIncludesCachedTokens": "Enable when cached tokens are included in input. Disable for Claude Code, which reports cache reads separately.", "outputIncludesReasoningTokens": "Enable when reasoning tokens are included in output. Included subtotals are deducted before applying their separate rate."},
      errors: {"rate": "Enter a finite rate from 0 to 1,000,000,000. Zero is valid.", "model": "Enter an exact model name of 1 to 256 characters without control characters."}
    },
    usageQuotas: {"title": "Usage Quotas", "subtitle": "Daily UTC limits on runs, tokens, known cost, and current concurrency for a tenant, agent, or deployment.", "add": "Add usage quota", "create": "Create usage quota", "edit": "Edit usage quota", "view": "Usage quota details", "deleteTitle": "Delete usage quota", "emptyTitle": "No usage quotas yet", "emptyBody": "Add a quota for a tenant, agent, or deployment. Empty limits are unlimited.", "columns": {"name": "Name", "active": "Active", "id": "ID", "createdUtc": "Created", "scope": "Scope", "resourceId": "Target resource", "dailyRunLimit": "Runs per UTC day", "dailyTokenLimit": "Tokens per UTC day", "dailyCostUsdLimit": "Known USD per UTC day", "maxConcurrentRuns": "Maximum active runs", "enforcementEnabled": "Enforce limits"}, "fields": {"name": "Name", "description": "Description", "active": "Active", "scope": "Scope", "resourceId": "Target resource", "dailyRunLimit": "Runs per UTC day", "dailyTokenLimit": "Tokens per UTC day", "dailyCostUsdLimit": "Known USD per UTC day", "maxConcurrentRuns": "Maximum active runs", "enforcementEnabled": "Enforce limits"}, "hints": {"dailyRunLimit": "Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs. Limits apply only when enforcement is enabled.", "dailyTokenLimit": "Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs. Limits apply only when enforcement is enabled.", "dailyCostUsdLimit": "Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs. Limits apply only when enforcement is enabled.", "maxConcurrentRuns": "Leave empty for unlimited usage. Zero disallows usage. Daily counters reset at midnight UTC; concurrency counts currently active runs. Limits apply only when enforcement is enabled.", "resourceId": "Add a quota for a tenant, agent, or deployment. Empty limits are unlimited.", "enforcementEnabled": "Off by default. Enable explicitly to reject runs at configured limits and lower supported harness budgets. When off, usage is monitored and limits do not affect execution."}, "errors": {"limit": "Enter a nonnegative limit within the field range. Counts must be whole numbers."}, "incomplete": "Cost accounting is incomplete: {{count}} completed runs have no reported or estimated cost. Limits apply only when enforcement is enabled; missing cost alone does not block admission.", "actions": {"usage": "Daily usage"}, "usage": {"windowStartUtc": "Window starts (UTC)", "windowEndUtc": "Daily reset (UTC)", "runsUsed": "Runs admitted", "tokensUsed": "Completed tokens", "costUsd": "Known cost (USD)", "unknownCostRuns": "Runs with missing cost", "activeRuns": "Active runs"}},
    artifactStores: {
      ...resourcePage('Artifact Stores', 'artifact store', 'Where files produced by runs are kept.', 'Create an artifact store to keep run outputs.'),
      columns: { name: 'Name', kind: 'Kind', description: 'Description', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: { name: 'Name', kind: 'Kind', description: 'Description', active: 'Active' }
    },
    agents: {
      deleteWithDeployments_other: 'Delete "{{name}}" and its {{count}} deployments? The deployments below are deleted too. This cannot be undone.',
      deleteWithDeployments_one: 'Delete "{{name}}" and its {{count}} deployment? The deployment below is deleted too. This cannot be undone.',
      deleteNoDeployments: 'Delete "{{name}}"? It has no deployments. This cannot be undone.',
      ...resourcePage('Agents', 'agent', 'Named capabilities exposed over REST, MCP, and A2A. Deployments decide how they run.', 'Add an agent, or apply the sample manifest from Configuration > Manifests.'),
      sections: { identity: 'Identity', exposure: 'Exposure', io: 'Input and output', delegation: 'Delegation' },
      columns: { name: 'Name', displayName: 'Display name', kind: 'Kind', exposure: 'Exposure', delegationMode: 'Delegation', tags: 'Tags', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: {
        name: 'Name',
        displayName: 'Display name',
        description: 'Description',
        kind: 'Kind',
        agentVersion: 'Version',
        tags: 'Tags',
        remoteProtocol: 'Remote protocol',
        remoteEndpointUrl: 'Remote endpoint URL',
        exposeA2A: 'Expose over A2A',
        exposeMcpTool: 'Expose as its own MCP tool',
        mcpToolName: 'MCP tool name',
        skills: 'A2A skills',
        skillId: 'Skill ID',
        skillName: 'Name',
        skillDescription: 'Description',
        inputMode: 'Input mode',
        inputSchema: 'Input JSON Schema',
        outputSchema: 'Output JSON Schema',
        delegationMode: 'Delegation',
        delegationAllowList: 'Agents it may call',
        delegationMaxDepth: 'Maximum depth',
        delegationAllowRecursion: 'Allow recursion',
        active: 'Active'
      },
      hints: { name: 'Lowercase letters, digits, and hyphens. Used in URLs and A2A cards.' },
      errors: { dnsName: 'Use lowercase letters, digits, and hyphens, starting and ending with a letter or digit.' }
    },
    deployments: {
      approvalsOn_one: 'On, {{count}} rule',
      approvalsOn_other: 'On, {{count}} rules',
      approvalsOff: 'Off',
      promptRoles: { Repair: 'Structured output repair', DelegatedTask: 'Task wrapper for delegated runs', Task: 'Task wrapper', System: 'System prompt', ConversationFallback: 'Conversation fallback (transcript)' },
      ...resourcePage('Deployments', 'deployment', 'Bind an agent to a harness profile, prompts, secrets, MCP servers, placement, and limits.', 'Create a deployment to make an agent runnable.'),
      steps: { approvals: 'Approvals', basics: 'Basics', harness: 'Harness', prompts: 'Prompts', resources: 'Resources', overrides: 'Overrides', placement: 'Placement and limits' },
      columns: { approvalsEnabled: 'Approvals', name: 'Name', agentId: 'Agent', harnessProfileId: 'Harness profile', model: 'Model', executor: 'Executor', weight: 'Weight', configVersion: 'Config version', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: {
        approvalsEnabled: 'Ask before tool calls (approvals)',
        approvalDefaultAction: 'When no rule matches',
        approvalTimeoutSeconds: 'Approval timeout (seconds)',
        approvalTimeoutDecision: 'Decision when nobody answers',
        approvalRules: 'Approval rules',
        ruleAction: 'Action',
        rulePattern: 'Rule',
        ruleInputPattern: 'Input pattern',
        ruleDescription: 'Description',
        approvalTest: 'Test a tool call',
        name: 'Name',
        agentId: 'Agent',
        description: 'Description',
        weight: 'Traffic weight',
        active: 'Active',
        harnessProfileId: 'Harness profile',
        model: 'Model',
        fallbackModel: 'Fallback model',
        effort: 'Effort',
        maxTurns: 'Maximum turns',
        maxBudgetUsd: 'Maximum budget (USD)',
        parameters: 'Parameters',
        paramName: 'Name',
        paramValue: 'Value',
        promptBindings: 'Prompt bindings',
        promptRole: 'Role',
        template: 'Template',
        pinnedVersion: 'Pinned version',
        resourceBindings: 'Resource bindings',
        bindingKind: 'Kind',
        alias: 'Alias',
        resource: 'Resource',
        workspaceTemplateId: 'Workspace template',
        artifactStoreId: 'Artifact store',
        argumentOverrides: 'Argument overrides',
        operation: 'Operation',
        match: 'Match',
        argTemplate: 'Template',
        condition: 'Condition',
        environmentOverrides: 'Environment overrides',
        envName: 'Name',
        envValue: 'Value template',
        isSecret: 'Secret',
        fileOverrides: 'File overrides',
        allowedRunOverrides: 'Per-run overrides callers may set',
        validation: 'Validation',
        pattern: 'Pattern or values',
        nodePoolId: 'Node pool',
        nodeSelector: 'Node selector',
        maxConcurrentRuns: 'Maximum concurrent runs',
        timeoutSeconds: 'Timeout (seconds)',
        maxAttempts: 'Maximum attempts',
        repetitionGuard: 'Repetition guard',
        maxAssistantChars: 'Maximum assistant characters',
        noProgressSeconds: 'No-progress timeout (seconds)',
        executor: 'Executor',
        podCpuRequest: 'CPU request',
        podCpuLimit: 'CPU limit',
        podMemoryRequest: 'Memory request',
        podMemoryLimit: 'Memory limit',
        podEphemeralStorageRequest: 'Ephemeral storage request',
        podEphemeralStorageLimit: 'Ephemeral storage limit'
      },
      hints: {
        approvalsEnabled: 'Works with Claude Code profiles and profiles that use the Codex app-server. Other harnesses have no approval hook, so the server refuses this setting for them.',
        approvalDefaultAction: 'Ask a person waits in the Approvals inbox until someone decides or the timeout passes.',
        approvalTimeoutSeconds: 'From 10 to 3,600 seconds. Empty uses 300.',
        approvalRules: 'Deny beats Ask, and Ask beats Allow. Examples: Bash(npm test), Bash(npm run *), Edit(src/**), WebFetch(domain:example.com), mcp__github__*.',
        secretsKinds: 'The harness profile {{profile}} needs any secret of kind {{kinds}}. Bind one under any alias.',
        secretsAliases: 'The harness profile {{profile}} reads secrets bound with these aliases: {{aliases}}.',
        secretsNone: 'The harness profile {{profile}} does not read any secret, so no secret binding is needed.',
        promptBindings: 'Map prompt roles (System, Task, DelegatedTask, and any role the harness profile uses) to templates. Leave the version empty to follow the latest.',
        resourceBindings: 'Aliases become template variables, for example {{secret.anthropic}}.',
        weight: 'Requests without an explicit deployment are split across active deployments by weight.',
        maxConcurrentRuns: '0 means unlimited.',
        timeoutCap: 'Every run is capped at {{value}} seconds by the cluster setting {{setting}}.',
        zeroUnlimited: '0 means unlimited.',
        zeroOff: '0 turns the guard off.',
        guardDefault: 'Empty uses the cluster default, {{value}}, from {{setting}}.',
        guardDefaultUnknown: 'Empty uses the cluster setting {{setting}}.',
        guardOwn: 'Set on this deployment. The cluster default ({{setting}}) is {{value}}.',
        guardOwnUnknown: 'Set on this deployment instead of the cluster setting {{setting}}.',
        guardFollowing: 'Follows the cluster default, {{value}}, from {{setting}}.',
        executorInherit: 'Empty uses the node pool default: {{executor}}.',
        executorSet: 'Process runs the harness inside the worker; Kubernetes Job runs it in a pod of its own.',
        podCpuRequest: 'Pod resources apply to Kubernetes Job runs only. Use Kubernetes quantities such as 500m, 2, 512Mi, or 4Gi; empty uses the worker default.'
      },
      actions: { addRule: 'Add rule', compilePreview: 'Compile preview', test: 'Test invoke', useClusterDefault: 'Use cluster default' },
      sections: {
        guards: 'Run guards',
        execution: 'Executor and pod resources'
      },
      placeholders: {
        ruleInputPattern: 'Optional regular expression over the input JSON',
        clusterDefault: 'Cluster default ({{value}})',
        clusterDefaultUnknown: 'Cluster default'
      },
      executorInherit: 'Node pool default',
      executorInheritShort: 'Pool default',
      errors: { rulePatternRequired: 'Enter a rule pattern.', rulePatternOneLine: 'A rule pattern must fit on one line.', rulePatternTooLong: 'A rule pattern can be at most 1,000 characters.', tooManyRules: 'A deployment can have at most 500 approval rules.', approvalTimeout: 'Enter a whole number of seconds from 10 to 3,600.', quantity: 'Use a Kubernetes quantity such as 500m, 2, 512Mi, or 4Gi.' },
      guardStates: {
        on: 'on',
        off: 'off'
      }
    },
    nodePools: {
      ...resourcePage('Node Pools', 'node pool', 'Group worker nodes by label and optionally dedicate them to tenants.', 'Create a node pool to dedicate capacity.'),
      allTenants: 'All tenants',
      columns: { name: 'Name', description: 'Description', tenants: 'Tenants', defaultExecutor: 'Default executor', active: 'Active', id: 'ID', createdUtc: 'Created' },
      fields: { name: 'Name', description: 'Description', defaultExecutor: 'Default executor', tenants: 'Allowed tenant IDs', active: 'Active' },
      hints: { tenants: 'Leave empty to allow every tenant.' }
    },
    runs: {
      ...resourcePage('Runs', 'run', 'Every agent invocation with its status, node, duration, and outcome.', 'Invoke an agent to start a run.'),
      columns: {
        approvalWaitMs: 'Approval wait',
        delegationWaitMs: 'Delegation wait',
        timeToFirstTokenExcludingDelegationMs: 'TTFT excl. delegation',
        id: 'Run',
        agentName: 'Agent',
        status: 'Status',
        outcome: 'Outcome',
        harnessType: 'Harness',
        leaseNodeName: 'Node',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: 'Streaming',
        executionMs: 'Duration',
        queueMs: 'Queue time',
        totalMs: 'Total time',
        inputTokens: 'Input tokens',
        outputTokens: 'Output tokens',
        cachedTokens: 'Cached tokens',
        reasoningTokens: 'Reasoning tokens',
        outputTokensPerSecond: 'Tokens/s',
        costUsd: 'Cost',
        toolCallCount: 'Tool calls',
        depth: 'Depth',
        createdUtc: 'Created',
        conversationId: 'Conversation'
      },
      actions: { cancel: 'Cancel run', retry: 'Retry run' },
      toasts: { cancelRequested: 'Cancellation requested.', retried: 'Retry started.' },
      turn: 'turn {{turn}}'
    },
    nodes: {
      ...resourcePage('Nodes', 'node', 'Worker nodes that lease and execute runs. Cordon or drain a node before maintenance.', 'Worker nodes register themselves when they start. Deploy the worker StatefulSet or run Garrison.Worker locally.'),
      columns: { name: 'Name', status: 'Status', capacity: 'Runs', harnesses: 'Harnesses', executors: 'Executors', containerized: 'Containerized', labels: 'Labels', nodeVersion: 'Version', lastHeartbeatUtc: 'Last heartbeat', id: 'ID' },
      fields: { address: 'Address', maxConcurrentRuns: 'Capacity', childReserveSlots: 'Child reserve', maxResidentWaiters: 'Most waiting runs', activeRuns: 'Active runs', capabilities: 'Capabilities', detectedVersion: 'Version', available: 'Available', detail: 'Detail' },
      actions: { cordon: 'Cordon', uncordon: 'Uncordon', drain: 'Drain', runs: 'View runs', grafana: 'Open in Grafana' },
      toasts: { cordoned: 'Node cordoned.', uncordoned: 'Node uncordoned.', draining: 'Node is draining.' }
    },
    controlNodes: {
      ...resourcePage('Control plane', 'control node', 'Server replicas that serve the API, MCP, and A2A and schedule runs. Each one registers itself and heartbeats every 5 seconds.', 'Control nodes appear when a server replica starts. Servers older than this console do not report them.'),
      emptyTitle: 'No control nodes reported',
      columns: { name: 'Name', status: 'Status', version: 'Version', schemaVersion: 'Schema', backplane: 'Backplane', uptime: 'Uptime', lastHeartbeatUtc: 'Last heartbeat', activeRequests: 'Requests', openStreams: 'Streams', heldLongPolls: 'Long polls', address: 'Address', hostname: 'Host name', startedUtc: 'Started', id: 'ID' },
      fields: { name: 'Name', id: 'Node ID', hostname: 'Host name', address: 'Address', isLeader: 'Leader', leaderEpoch: 'Leader epoch', version: 'Version', schemaVersion: 'Schema version', backplane: 'Backplane', startedUtc: 'Started', uptime: 'Uptime', lastHeartbeatUtc: 'Last heartbeat', activeRequests: 'Active requests', openStreams: 'Open streams', heldLongPolls: 'Held long polls', respondingNodeId: 'Answered by' },
      leader: 'Leader',
      stale: 'Stale',
      answeredBy: 'Which replica answered: {{node}}',
      answeredByLeader: 'Which replica answered: {{node}} (the leader)',
      actions: { grafana: 'Open in Grafana' }
    },
    audit: {
      ...resourcePage('Audit', 'audit record', 'Authentication, authorization, and configuration events for this tenant.', 'Security events appear here as people and agents use Garrison.'),
      emptyTitle: 'No audit records yet',
      columns: { createdUtc: 'Time', eventType: 'Event', principalName: 'Principal', resource: 'Resource', reason: 'Reason', sourceIp: 'Source IP', id: 'ID' },
      fields: {
        eventType: 'Event',
        principalType: 'Principal type',
        principalName: 'Principal',
        principalId: 'Principal ID',
        resourceType: 'Resource type',
        resourceId: 'Resource ID',
        operation: 'Operation',
        method: 'Method',
        path: 'Path',
        authResult: 'Authentication result',
        authorizationResult: 'Authorization result',
        reason: 'Reason',
        bypassReason: 'Bypass reason',
        statusCode: 'Status code',
        sourceIp: 'Source IP',
        requestId: 'Request ID',
        createdUtc: 'Time'
      }
    },
    manifestApplies: {
      ...resourcePage('Apply history', 'apply', 'Every manifest apply and dry run, with per-document results.', 'Applies appear here after you apply or dry-run a manifest.'),
      columns: { createdUtc: 'Time', principalName: 'Applied by', dryRun: 'Dry run', counts: 'Results' }
    },
    conversations: {
      title: 'Conversations',
      subtitle: 'Multi-turn exchanges with an agent. Each turn is a run that resumes the harness session of the turn before it.',
      add: 'Add conversation',
      create: 'Create conversation',
      edit: 'Edit conversation',
      view: 'Conversation details',
      deleteTitle: 'Delete conversation',
      emptyTitle: 'No conversations yet',
      emptyBody: 'Start one on the Invoke page with "Start a new conversation", or send an A2A message: every A2A context is a conversation.',
      untitled: 'Untitled conversation',
      columns: {
        title: 'Title',
        agentName: 'Agent',
        state: 'State',
        turnCount: 'Turns',
        affinityNodeName: 'Affinity node',
        fallbackCount: 'Fallbacks',
        lastFallbackReason: 'Last fallback',
        harnessType: 'Harness',
        callerName: 'Started by',
        contextId: 'Context ID',
        sessionId: 'Session ID',
        lastActivityUtc: 'Last activity',
        createdUtc: 'Created',
        id: 'ID'
      },
      states: {
        busy: 'Working',
        idle: 'Idle'
      },
      actions: {
        continue: 'Continue',
        runs: 'View turns as runs'
      }
    }
  },
  views: {
    approvalDetail: {
      title: 'Approval',
      titleWithTool: 'Approval for {{tool}}',
      backToInbox: 'All approvals',
      pending: 'Waiting for a person to allow or deny this tool call.',
      pendingExpires: 'Waiting for a person. If nobody decides, it expires {{when}} with the decision {{decision}}.',
      request: 'Request',
      rules: 'Rules',
      noRule: 'No rule matched',
      noInput: 'No input was recorded.',
      notFoundTitle: 'Approval not found',
      notFoundBody: 'It may belong to another tenant, or the ID is wrong.'
    },
    home: {
      observabilityState: { reachable: 'Reachable', unreachable: 'Unreachable', checking: 'Checking', unknown: 'Status unknown' },
      observabilityVersion: 'Version {{version}}',
      observabilityOpen: 'Open {{service}}',
      kpisGrafana: 'Open the overview in Grafana',
      grafanaDashboards: 'Grafana dashboards',
      grafanaSections: { overview: 'Overview', http: 'HTTP API', runs: 'Runs', agents: 'Agents', models: 'Models and tokens', workers: 'Workers', kubernetes: 'Kubernetes executor', protocols: 'Protocols', scheduler: 'Scheduler and queue', database: 'Database', controlPlane: 'Control plane', security: 'Security and auth', integrations: 'Integrations', logs: 'Logs and traces', autonomy: 'Autonomy' },
      observabilitySetup: 'Set up observability',
      observabilityNone: 'No observability services (Grafana, Prometheus, Tempo, or Loki) are configured for this deployment.',
      observability: 'Observability',
      title: 'Home',
      subtitle: 'What your agents and worker nodes are doing right now.',
      lastLoaded: 'Updated {{time}}',
      partial: 'Some panels could not load. The values shown are partial.',
      getStartedTitle: 'No agents in this tenant yet',
      getStartedBody: 'The setup wizard adds a credential, applies a sample agent, and runs a test.',
      runSetup: 'Run setup',
      kpis: {
        agents: 'Agents',
        deployments: 'Deployments',
        activeRuns: 'Active runs',
        queued: 'Queued',
        succeeded: 'Succeeded',
        failed: 'Failed',
        nodes: 'Nodes ready',
        controlNodes: 'Control plane ready',
        nodesNote: 'Ready / total',
        last24h: 'Last 24 hours'
      },
      requestActivity: 'API request activity',
      nodesTitle: 'Nodes',
      noNodesTitle: 'No worker nodes registered',
      noNodesBody: 'Start Garrison.Worker or scale the worker StatefulSet. Nodes register themselves.',
      nodeLoad: '{{active}} of {{max}} runs',
      controlPlaneSection: 'Control plane',
      workersSection: 'Worker nodes',
      openControlPlane: 'View all',
      openWorkers: 'View all',
      noControlNodes: 'No control nodes have registered yet.',
      controlNodesUnavailable: 'Control nodes are not available: the server is older than this console, or you may not read nodes.',
      recentFailures: 'Recent failures',
      noFailures: 'No failed runs recently.',
      cta: {
        title: 'Common tasks',
        invoke: 'Invoke an agent',
        addAgent: 'Add an agent',
        applyManifest: 'Apply a manifest',
        inspectRuns: 'Inspect runs',
        nodes: 'Check worker nodes',
        apiExplorer: 'Open the API Explorer',
        analytics: 'View run analytics'
      },
      externalServices: 'External services',
      externalServicesNote: 'Bundled observability tools. Change default credentials before sharing this deployment.',
      externalServicesNone: 'No external services are configured for this deployment.',
      credentials: 'Default credentials',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: 'Show raw text',
      showRendered: 'Show formatted'
    },
    invoke: {
      stream: {
        tabsLabel: 'Response views',
        cardLabel: 'Run output',
        preview: 'Preview',
        response: 'Response',
        starting: 'Starting the run...',
        live: 'Live',
        finished: 'Finished',
        elapsed: 'Elapsed',
        firstToken: 'First token',
        tokensPerSecond: 'Speed',
        finishedHint: 'Run finished.',
        showResponse: 'See Response',
        reasoning: 'Reasoning',
        waiting: 'Waiting for output...',
        waitingCodex: 'Waiting for output. Codex sends its answer in one piece when it is done.',
        codexNote: 'Codex does not stream: its answer appears here in one piece when the run finishes.',
        noText: 'The run produced no streamed text. The Response tab has the result.',
        jump: 'Jump to latest',
        tool: {
          running: 'running',
          ok: 'succeeded',
          failed: 'failed'
        }
      },
      noDeployment: 'This agent has no active deployment with a weight above zero, so an invoke would be refused. Add a deployment on the Deployments tab or raise a deployment\'s weight.',
      title: 'Invoke',
      subtitle: 'Send a message to an agent and watch the transcript stream.',
      request: 'Request',
      agent: 'Agent',
      deployment: 'Deployment',
      weighted: 'Any active deployment (weighted)',
      default: 'Deployment default',
      message: 'Message',
      messagePlaceholder: 'What should the agent do?',
      shortcut: 'Press Ctrl+Enter or Cmd+Enter to send.',
      send: 'Send',
      sending: 'Sending...',
      openRun: 'Open run',
      idleTitle: 'No run yet',
      idleBody: 'Send a message to start a run. The transcript appears here as it streams.',
      noAgentsTitle: 'No agents to invoke',
      noAgentsBody: 'Create an agent and a deployment, or apply the sample manifest.',
      applySample: 'Go to manifests',
      stopOnLeave: 'Stop the run when I leave',
      cancel: 'Cancel run',
      cancelling: 'Cancelling...',
      timeLimit: 'Time limit',
      timeLimitPlaceholder: 'Deployment default',
      timeLimitClear: 'Use the default',
      timeLimitRange: 'Allowed: {{min}} to {{max}}.',
      timeLimitAny: 'Seconds the run may take before it times out.',
      timeLimitCap: 'The cluster stops every run after {{max}}.',
      timeLimitErrors: {
        notInteger: 'Enter a whole number of seconds.',
        range: 'Enter a time limit from {{min}} to {{max}}.',
        aboveCap: 'The cluster allows at most {{max}} per run.'
      },
      timeUnits: {
        seconds: '{{value}} s',
        minutes: '{{value}} min',
        hours: '{{value}} h',
        secondsWord: 'seconds'
      },
      conversation: {
        mode: 'Conversation',
        modes: {
          none: 'Single run (no conversation)',
          start: 'Start a new conversation',
          continue: 'Continue a conversation'
        },
        pick: 'Conversation to continue',
        choose: 'Choose a conversation',
        option: '{{title}} (turns: {{turns}})',
        pinned: 'Every turn runs on the deployment of the conversation\'s first turn, so the deployment cannot be chosen here.',
        busy: 'This conversation is still working on its previous turn. A new message is refused until that run finishes.',
        open: 'Open conversation (turn {{turn}})'
      }
    },
    runDetail: {
      awaitingApproval_one: 'This run is waiting for a person to approve {{count}} tool call.',
      awaitingApproval_other: 'This run is waiting for a person to approve {{count}} tool calls.',
      reviewApprovals: 'Review',
      approvals_one: 'Approvals ({{count}})',
      approvals_other: 'Approvals ({{count}})',
      noApprovals: 'This run has not asked for any approvals.',
      openApproval: 'Open approval',
      viewTrace: 'View trace',
      viewLogs: 'View logs',
      traceId: 'Trace ID',
      deploymentDeleted: 'The deployment this run used was deleted, so it cannot be retried. Invoke the agent {{agent}} again instead.',
      templatesUsed: 'Templates used',
      agentDeleted: 'The agent {{agent}} no longer exists, so this run cannot be retried. Its record, transcript, and telemetry stay available here.',
      title: 'Run',
      titleWithAgent: 'Run of {{agent}}',
      deployment: 'Deployment',
      model: 'Served model',
      tokensLabel: 'Tokens',
      tokens: '{{input}} in, {{output}} out',
      estimated: 'estimated',
      caller: 'Caller',
      parent: 'Parent run',
      attempt: 'Attempt',
      outputSchema: 'Output schema',
      outputSchemaStates: {
        valid: 'Valid',
        validAfterRepair: 'Valid after one repair',
        invalid: 'Invalid',
        invalidAfterRepair: 'Invalid after one repair'
      },
      started: 'Started',
      completed: 'Completed',
      exitCode: 'Exit code',
      transcript: 'Transcript',
      result: 'Result',
      input: 'Input',
      stderr: 'Stderr',
      children_one: 'Child runs ({{count}})',
      children_other: 'Child runs ({{count}})',
      eventFilter: 'Show',
      eventCount_one: '{{count}} event',
      eventCount_other: '{{count}} events',
      noEvents: 'No events yet. Events appear as the harness produces them.',
      failed: 'Failed',
      noResult: 'The run produced no result text.',
      pending: 'The result appears when the run finishes.',
      structuredOutput: 'Structured output',
      templateVersions: 'Prompt template versions used',
      noStderr: 'No stderr was captured.',
      noChildren: 'This run did not delegate to other agents.',
      confirmCancel: 'Cancel this run? The harness process is stopped on its node.',
      notFoundTitle: 'Run not found',
      notFoundBody: 'It may have been deleted, or it belongs to another tenant.',
      telemetry: {
        approvalNote: 'This run spent {{wait}} waiting for approval decisions. Execution time includes that wait.',
        delegationNote: 'This run waited {{wait}} on runs it delegated to. Time to first token is {{ttft}} including that wait and {{excluding}} without it, which is the figure to compare with agents that do not delegate.',
        title: 'Telemetry',
        phases: 'Run time by phase',
        phase: { delegation: 'Waiting on delegated runs', queue: 'Queue', startup: 'Startup to first token', streaming: 'Streaming', tail: 'After last token' },
        fields: {
          approvalWaitMs: 'Approval wait',
          delegationWaitMs: 'Delegation wait',
          timeToFirstTokenExcludingDelegationMs: 'Time to first token excluding delegation',
          timeToFirstTokenMs: 'Time to first token',
          streamingMs: 'Streaming time',
          executionMs: 'Execution time',
          queueMs: 'Queue time',
          totalMs: 'Total time',
          outputTokensPerSecond: 'Output tokens per second',
          inputTokens: 'Input tokens',
          outputTokens: 'Output tokens',
          cachedTokens: 'Cached tokens',
          reasoningTokens: 'Reasoning tokens',
          toolCallCount: 'Tool calls',
          costUsd: 'Cost',
          firstTokenUtc: 'First token at',
          lastTokenUtc: 'Last token at'
        }
      },
      conversation: 'Conversation',
      conversationSession: 'Session',
      resumeSessionId: 'Resumed session',
      affinityNode: 'Affinity node',
      affinityUntil: 'until {{time}}'
    },
    queue: {
      title: 'Queue',
      subtitle: 'Work waiting for a node, leased, and running, by agent and harness.',
      queued: 'Queued',
      leased: 'Leased',
      running: 'Running',
      emptyTitle: 'Nothing is waiting',
      emptyBody: 'Runs appear here while they wait for a worker node.'
    },
    agentDetail: {
      invoke: 'Invoke',
      grafana: 'Open in Grafana',
      noActiveDeployment: 'This agent has no active deployment, so invocations will be rejected.',
      deployments_one: 'Deployments ({{count}})',
      deployments_other: 'Deployments ({{count}})',
      recentRuns: 'Recent runs',
      card: 'A2A card',
      traffic: 'Traffic share',
      noDeploymentsTitle: 'No deployments',
      noDeploymentsBody: 'Create a deployment to bind this agent to a harness.',
      noRuns: 'This agent has not run yet.',
      selectionNote: 'Each invocation without an explicit deployment goes to one active deployment, chosen at random in proportion to its weight.',
      manageDeployments: 'Manage deployments',
      conversations: 'Conversations'
    },
    templateEditor: {
      cloneToEdit: 'Clone to edit',
      builtInReadOnly: 'Built-in templates are read-only, so every field here is locked. Clone it to get an editable copy.',
      renameHint: 'You can rename this template. Deployments keep their bindings because they refer to its ID, but templates that include it by name must be updated by hand.',
      cloneDialog: { taken: 'A template named {{name}} already exists. Choose another name.', reserved: 'Names starting with builtin/ are reserved for built-in templates.', hint: 'You can rename the copy later on its page.', name: 'Name of the copy', body: 'The copy starts with the current content as version 1 and can be edited, renamed, and deleted.', title: 'Clone {{name}}' },
      newTitle: 'New prompt template',
      subtitle: 'Write the template, preview it with a sample context, and save.',
      builtInNote: 'Built-in templates are read-only. Clone to customize, or reset to restore the shipped content.',
      content: 'Content',
      changeNote: 'Change note',
      syntaxHint: 'Syntax: {{variable}}, {{value | default: "x"}}, {{#if x}}...{{else}}...{{/if}}, {{#each list}}...{{/each}}, {{> template-name}}.',
      variables: 'Variables used',
      noVariables: 'No variables referenced.',
      preview: 'Live preview',
      sampleContext: 'Sample context (JSON)',
      rendered: 'Rendered',
      previewEmpty: 'The rendered text appears here.',
      missing: 'Missing variables: {{list}}',
      versions_one: 'Versions ({{count}})',
      versions_other: 'Versions ({{count}})',
      noVersions: 'No saved versions yet.',
      version: 'Version',
      note: 'Note',
      author: 'Author',
      diff: 'Diff',
      restore: 'Restore',
      diffTitle: 'Version {{version}} compared to the editor',
      current: 'Editor',
      reset: 'Reset to default',
      savedVersion: 'Saved a new version.',
      restored: 'Restored version {{version}}.',
      resetDone: 'Reset to the shipped content.',
      confirm: {
        restoreTitle: 'Restore version',
        restoreMessage: 'Restore version {{version}}? The current content is kept in history.',
        resetTitle: 'Reset template',
        resetMessage: 'Reset "{{name}}" to the shipped content?',
        deleteTitle: 'Delete template',
        deleteMessage: 'Delete "{{name}}"? Deployments that bind it will fail to compile.'
      }
    },
    manifests: {
      warnings_one: '{{count}} warning',
      warnings_other: '{{count}} warnings',
      planned: 'Would be: {{result}}',
      changes: { count_other: '{{count}} fields change.', count_one: '{{count}} field changes.', empty: '(empty)', after: 'After', before: 'Before', field: 'Field' },
      title: 'Manifests',
      subtitle: 'Apply configuration as code. Dry runs validate without writing.',
      applyTab: 'Apply',
      exportTab: 'Export',
      historyTab: 'History',
      upload: 'Upload file',
      loadSample: 'Load sample',
      document: 'Manifest (YAML or JSON, multiple documents)',
      dryRun: 'Dry run',
      apply: 'Apply',
      validated: 'Validation finished.',
      applied: 'Manifest applied.',
      results: 'Results',
      dryRunResults: 'Dry run results',
      kind: 'Kind',
      name: 'Name',
      result: 'Result',
      message: 'Message',
      confirmTitle: 'Apply manifest',
      confirmMessage: 'Apply every document in this manifest to the current tenant?',
      exportHelp: 'Export this tenant\'s configuration. Secret values are never exported.',
      export: 'Export',
      download: 'Download',
      counts: '{{created}} created, {{updated}} updated, {{unchanged}} unchanged, {{failed}} failed'
    },
    requests: {
      grafana: 'HTTP dashboard in Grafana',
      title: 'Request History',
      subtitle: 'Captured API traffic. Drill into any request and manage retention.',
      kpis: { total: 'Retained requests', success: 'Successful', failure: 'Failures', avgDuration: 'Avg duration' },
      columns: { time: 'Time', method: 'Method', path: 'Path', status: 'Status', duration: 'Duration', principal: 'Principal' },
      bulkDeleteTitle: 'Delete request history',
      bulkDeleteMessage: 'Delete all {{count}} requests matching the current filters?',
      bulkDeleteAll: 'Delete all matching',
      deleteOneTitle: 'Delete request',
      deleteOneMessage: 'Delete request {{id}}?',
      deleted: 'Deleted.',
      emptyTitle: 'No request history',
      emptyBodyNoTraffic: 'No API traffic has been retained yet.',
      emptyBodyNoMatch: 'No requests match the current filters.'
    },
    explorer: {
      title: 'API Explorer',
      subtitle: 'Execute live calls against this server, driven by its OpenAPI document.',
      operations: 'Operations',
      selectOperation: 'Select an operation to build a request.',
      selectOperationOption: 'Choose an operation...',
      pathParams: 'Path parameters',
      queryParams: 'Query parameters',
      headers: 'Headers',
      addHeader: 'Add header',
      headerName: 'Header name',
      headerValue: 'Value of header {{name}}',
      removeHeader: 'Remove header {{name}}',
      body: 'Request body',
      resolvedUrl: 'Resolved URL',
      copyUrl: 'Copy URL',
      execute: 'Execute',
      executing: 'Executing...',
      stop: 'Stop',
      streaming: 'Streaming',
      response: 'Response',
      responseHeaders: 'Response headers',
      responseBody: 'Response body',
      snippets: 'Code snippets',
      history: 'Recent requests',
      historyEmpty: 'No recent requests.',
      loadHistory: 'Load',
      deleteHistory: 'Delete',
      clearHistory: 'Clear history',
      required: 'required',
      confirmTitle: 'Execute destructive operation',
      confirmMessage: 'This {{method}} request may modify or delete data. Continue?',
      noSpecTitle: 'OpenAPI document unavailable',
      noSpecBody: 'This server did not return a usable /openapi.json document, so the explorer cannot list operations.'
    },
    settings: {
      errors: { allowed: 'Choose one of: {{values}}.', boolean: 'Choose true or false.', max: 'Enter {{max}} or less.', min: 'Enter {{min}} or more.', range: 'Enter a value from {{min}} to {{max}}.', integer: 'Enter a whole number.', number: 'Enter a number.' },
      notSaved: 'Nothing was saved. Fix the highlighted settings and save again.',
      title: 'Settings',
      subtitle: 'Server settings from the settings file and cluster settings stored in the database.',
      readOnly: 'You are viewing settings read-only. Only system administrators can change them.',
      restartBanner: 'Some saved changes take effect after a restart.',
      restarting: 'The server is restarting. This page reconnects automatically.',
      restarted: 'The server is back online.',
      restartTimeout: 'The server did not come back within three minutes. Check the pod status.',
      restart: 'Restart server',
      restartConfirmTitle: 'Restart server',
      restartConfirmMessage: 'Restart this control-plane node now? In-flight requests are drained and the console reconnects.',
      savedLive: 'Settings saved and applied.',
      savedRestart: 'Settings saved. Restart the server to apply every change.',
      live: 'Live',
      restartRequired: 'Restart required',
      secretSet: 'Set (enter a new value to replace)',
      secretNotSet: 'Not set',
      invalidNumber: 'Enter a number.',
      range: 'Allowed range {{min}} to {{max}}',
      testDatabase: 'Test database connection',
      testing: 'Testing...',
      dbOk: 'Connection succeeded',
      dbFailed: 'Connection failed',
      unavailableTitle: 'Settings unavailable',
      unavailableBody: 'This server did not return its settings.',
      sources: { File: 'Settings file', Environment: 'Environment', ConfigMap: 'ConfigMap', Database: 'Cluster' },
      lockedBy: {
        Environment: 'Set by an environment variable. The environment value wins.',
        ConfigMap: 'Managed by a Kubernetes ConfigMap. Change it in your manifests.',
        other: 'This setting cannot be edited here.'
      },
      groups: { Codex: 'Codex', Archive: 'Archive', General: 'General', Rest: 'REST', Mcp: 'MCP', Database: 'Database', Logging: 'Logging', Auth: 'Authentication', Security: 'Security', RequestHistory: 'Request history', Telemetry: 'Telemetry', Cluster: 'Cluster', Scheduling: 'Scheduling', Runs: 'Runs', Audit: 'Audit', Runtime: 'Runtime', Observability: 'Observability' },
      fields: {
        Observability: {
          GrafanaUrl: 'Grafana URL',
          PrometheusUrl: 'Prometheus URL',
          LokiUrl: 'Loki URL',
          TempoUrl: 'Tempo URL',
          GrafanaInternalUrl: 'Grafana internal URL',
          PrometheusInternalUrl: 'Prometheus internal URL',
          LokiInternalUrl: 'Loki internal URL',
          TempoInternalUrl: 'Tempo internal URL'
        },
        Rest: {
          ExternalBaseUrl: 'External REST URL',
          PublicBaseUrl: 'Internal REST URL for runs',
          Ssl: 'REST TLS',
          Port: 'REST port',
          Hostname: 'REST bind host name'
        },
        Mcp: {
          InternalPort: 'Internal MCP port',
          SessionIdleTimeoutSeconds: 'MCP session idle timeout (seconds)',
          MaxToolWaitSeconds: 'Maximum MCP tool wait (seconds)',
          PublicUrl: 'Internal MCP URL for runs',
          Path: 'MCP path',
          Port: 'MCP port',
          Hostname: 'MCP bind host name',
          Enable: 'MCP server enabled'
        },
        Database: {
          MinPoolSize: 'Minimum pooled connections',
          ConnectionTimeoutSeconds: 'Connection wait timeout (seconds)',
          CommandTimeoutSeconds: 'Command timeout (seconds)',
          ConnectionIdleLifetimeSeconds: 'Idle connection lifetime (seconds)',
          MaxPoolSize: 'Connection pool size',
          Schema: 'Database schema',
          Password: 'Database password',
          Username: 'Database user',
          DatabaseName: 'Database name',
          Port: 'Database port',
          Host: 'Database host',
          Filename: 'Sqlite file',
          Type: 'Database provider'
        },
        Logging: {
          MinimumSeverity: 'Minimum log severity',
          LogFilename: 'Log file name',
          LogDirectory: 'Log directory',
          FileLogging: 'Log to a file',
          ConsoleLogging: 'Log to the console'
        },
        Auth: {
          RateLimitPerMinute: 'Sign-in attempts per minute',
          PasswordHashIterations: 'Password hash iterations',
          SignedRequestSkewSeconds: 'Signed request clock skew (seconds)',
          AdminApiKey: 'Administrator API key',
          TokenLifetimeMinutes: 'Session lifetime (minutes)',
          SigningKey: 'Token signing key',
          Issuer: 'Token issuer'
        },
        Security: {
          NodeSecretKey: 'Worker node secret key',
          NodeAccessKey: 'Worker node access key',
          DefaultSecretKey: 'Default secret key',
          DefaultAccessKey: 'Default access key',
          AdminPassword: 'Initial administrator password',
          AdminEmail: 'Initial administrator email',
          MasterKey: 'Secret encryption master key'
        },
        RequestHistory: {
          CaptureNodeProtocol: 'Capture successful worker protocol requests',
          MaxResponseBodyBytes: 'Maximum captured response body (bytes)',
          MaxRequestBodyBytes: 'Maximum captured request body (bytes)',
          RetentionDays: 'Request history retention (days)',
          Enabled: 'Capture request history'
        },
        Telemetry: {
          OtlpEndpoint: 'OTLP endpoint',
          OtlpEnable: 'OTLP export enabled',
          PrometheusPort: 'Prometheus port',
          PrometheusEnable: 'Prometheus endpoint enabled',
          ServiceName: 'Telemetry service name',
          Enabled: 'Telemetry enabled'
        },
        Archive: {
          Directory: 'Archive directory'
        },
        Cluster: {
          Backplane: 'Event backplane',
          BackplanePollMs: 'Backplane polling interval (ms)',
          ExpectedReplicas: 'Expected control plane replicas'
        },
        Scheduling: {
          EventPollMs: 'Event polling interval (ms)',
          InvocationWaitPollMs: 'Invocation wait fallback re-read (ms)',
          NodeHeartbeatTimeoutMs: 'Node heartbeat timeout (ms)',
          LeaseWaitMs: 'Lease long-poll wait (ms)',
          LeaseDurationMs: 'Run lease duration (ms)',
          PauseGraceMs: 'Grace after a host pause (ms)'
        },
        Runs: {
          EventRetentionDays: 'Run event retention (days)',
          RetentionDays: 'Run retention (days)',
          MaxDelegationDepth: 'Maximum delegation depth',
          DelegationChildQueueDepth: 'Most queued children of waiting runs',
          DelegationRetryAfterSeconds: 'Delegation capacity retry hint (seconds)',
          DefaultTimeoutSeconds: 'Default run timeout (seconds)'
        },
        Codex: {
          RefreshBeforeExpirySeconds: 'Refresh Codex logins before expiry (seconds)',
          RefreshCheckIntervalSeconds: 'Background login check interval (seconds)',
          RefreshTimeoutSeconds: 'Login refresh timeout (seconds)',
          TokenEndpoint: 'OAuth token endpoint',
          ClientId: 'OAuth client ID'
        },
        Runtime: {
          FailBlockedAfterSeconds: 'Fail blocked runs after (seconds)',
          MaxRunSeconds: 'Maximum run time (seconds)',
          RepetitionGuard: 'Repetition guard by default',
          MaxAssistantChars: 'Default maximum assistant characters',
          NoProgressSeconds: 'Default no-progress timeout (seconds)',
          ConversationAffinityWaitMs: 'Conversation affinity wait (ms)',
          ConversationTranscriptTurns: 'Fallback transcript turns',
          ConversationTranscriptChars: 'Fallback transcript characters per message'
        },
        Audit: {
          RetentionDays: 'Audit retention (days)'
        }
      }
    },
    analytics: {
      grafana: 'Runs dashboard in Grafana',
      deletedAgent: 'Deleted agent ({{id}})',
      deletedDeployment: 'Deleted deployment ({{id}})',
      title: 'Analytics',
      subtitle: 'How fast, how costly, and how reliable your runs are over time.',
      loading: 'Loading analytics...',
      filters: { ttft: 'Exclude delegation wait from TTFT', range: 'Range', from: 'From', to: 'To', agentId: 'Agent', harnessType: 'Harness', deploymentId: 'Deployment', model: 'Model', groupBy: 'Group by' },
      allAgents: 'All agents',
      allHarnesses: 'All harnesses',
      allDeployments: 'All deployments',
      allModels: 'All models',
      unknownModel: 'Unknown model',
      groupBy: { none: 'No grouping', agent: 'Agent', harness: 'Harness', model: 'Model', harnessModel: 'Harness and model' },
      export: { window: 'Time range: {{from}} to {{to}}' },
      usage: { title: 'Usage by harness and model', help: 'Tokens and cost over time for every harness and model combination in the range, plus a breakdown table.' },
      breakdown: {
        title: 'Harness by model breakdown',
        columns: { harness: 'Harness', model: 'Model', runs: 'Runs', inputTokens: 'Input tokens', outputTokens: 'Output tokens', cachedTokens: 'Cached tokens', reasoningTokens: 'Reasoning tokens', costUsd: 'Cost', timeToFirstTokenMsAvg: 'Avg TTFT' }
      },
      rangeError: {
        incomplete: 'Choose both a start and an end time for the custom range.',
        reversed: 'The start of the custom range must be before its end.'
      },
      truncated: 'This range holds more runs than the server aggregates in one request, so the numbers cover only part of it. Narrow the range or add filters for exact figures.',
      unavailableTitle: 'Analytics is not available on this server yet',
      unavailableBody: 'This server does not expose the run analytics endpoint. Upgrade the server to see charts here.',
      emptyTitle: 'No runs in this range',
      emptyBody: 'Nothing matched the range and filters. Widen the range, clear a filter, or invoke an agent.',
      noDataInChart: 'No data for this chart in the selected range.',
      cards: {
        delegationWait: 'Avg delegation wait',
        ttftExcludingDelegation: 'Avg TTFT excluding delegation',
        runs: 'Runs',
        runsNote: '{{succeeded}} succeeded, {{failed}} failed',
        successRate: 'Success rate',
        ttft: 'Avg time to first token',
        execution: 'Avg execution time',
        queue: 'Avg queue time',
        tokens: 'Tokens',
        tokensNote: '{{input}} in, {{output}} out',
        throughput: 'Avg output speed',
        cost: 'Cost',
        toolCalls: 'Tool calls',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: 'Run outcomes', help: 'Runs per bucket by how they ended.' },
        ttft: { helpExcluding: 'Harness start to first model output, without the time spent waiting on delegated runs.', title: 'Time to first token', help: 'Harness start to first model output. Includes CLI startup.' },
        duration: { title: 'Streaming and execution time', help: 'Streaming is first to last model output; execution is process start to exit.' },
        queue: { title: 'Queue time', help: 'Time from queued to leased by a worker node.' },
        tokens: { title: 'Tokens', help: 'Input, output, cached, and reasoning tokens per bucket.' },
        throughput: { title: 'Output tokens per second', help: 'Output tokens divided by streaming time, averaged per bucket.' },
        cost: { title: 'Cost', help: 'Reported cost in US dollars per bucket.' },
        toolCalls: { title: 'Tool calls', help: 'Tool call events per bucket.' },
        usageTokens: { title: 'Tokens by harness and model', help: 'Input plus output tokens per bucket, stacked by harness and model.' },
        usageCost: { title: 'Cost by harness and model', help: 'Reported cost per bucket, stacked by harness and model.' }
      },
      groupedTitle: '{{chart}}: {{metric}}',
      metrics: {
        delegationWaitMsAvg: 'Delegation wait (avg)',
        timeToFirstTokenExcludingDelegationMsP95: 'Excluding delegation (p95)',
        timeToFirstTokenExcludingDelegationMsP50: 'Excluding delegation (p50)',
        timeToFirstTokenExcludingDelegationMsAvg: 'Excluding delegation (avg)',
        runs: 'Runs',
        succeeded: 'Succeeded',
        failed: 'Failed',
        cancelled: 'Cancelled',
        timedOut: 'Timed out',
        inputTokens: 'Input',
        outputTokens: 'Output',
        cachedTokens: 'Cached',
        reasoningTokens: 'Reasoning',
        totalTokens: 'Input plus output tokens',
        costUsd: 'Cost',
        toolCalls: 'Tool calls',
        timeToFirstTokenMsAvg: 'Average',
        timeToFirstTokenMsP50: 'Median (p50)',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: 'Streaming (avg)',
        executionMsAvg: 'Execution (avg)',
        executionMsP95: 'Execution (p95)',
        queueMsAvg: 'Average queue time',
        outputTokensPerSecondAvg: 'Average tokens per second'
      },
      other: 'Other',
      hiddenGroups_one: '{{count}} less busy group is not shown.',
      hiddenGroups_other: '{{count}} less busy groups are not shown.',
      legend: 'Series in {{chart}}',
      dataTable: 'Data table',
      bucketStart: 'Bucket start'
    },
    serverInfo: {
      serverInUse: 'Server in use',
      title: 'Server Info',
      subtitle: 'Endpoints, versions, and the identity you are signed in with.',
      endpoints: 'Endpoints',
      rest: 'REST API',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: 'Server',
      version: 'Server version',
      dashboardVersion: 'Dashboard version',
      node: 'Control node',
      database: 'Database',
      health: 'Health',
      replicas: 'Expected replicas',
      routes: 'Registered operations',
      serverTime: 'Server time',
      principal: 'Signed in as',
      principalName: 'Principal',
      principalType: 'Principal type',
      role: 'Role',
      tenant: 'Tenant',
      expires: 'Session expires',
      features: 'Feature flags'
    },
    runGuard: {
      titles: {
        RepetitionDetected: 'Stopped: the model was repeating itself',
        NoProgress: 'Stopped: the run stopped making progress',
        OutputLimitExceeded: 'Stopped: the answer reached its size limit'
      },
      bodies: {
        RepetitionDetected: 'The repetition guard saw the same short text written over and over (or only whitespace and punctuation), so Garrison stopped the run instead of letting it run until its deadline.',
        NoProgress: 'No text, thinking, or tool activity arrived for longer than the no-progress timeout, so Garrison stopped the run.',
        OutputLimitExceeded: 'The answer passed the maximum number of assistant characters allowed per run, so Garrison stopped the run.'
      },
      detected: 'What was detected: {{reason}}',
      partialKept: 'The output written before the stop ({{chars}} characters) is kept as the run result.',
      noPartial: 'The run wrote no output before it was stopped.',
      tune: 'To change when this happens, edit the deployment {{deployment}}: its Placement and limits step has Repetition guard, Maximum assistant characters, and No-progress timeout. Left empty, they follow the cluster defaults in Settings (Runtime).',
      tuneAny: 'To change when this happens, edit the deployment: its Placement and limits step has Repetition guard, Maximum assistant characters, and No-progress timeout. Left empty, they follow the cluster defaults in Settings (Runtime).',
      openDeployments: 'Open deployments',
      openSettings: 'Open settings'
    },
    conversationDetail: {
      title: 'Conversation',
      notFoundTitle: 'Conversation not found',
      notFoundBody: 'It may have been deleted, or it belongs to another tenant. Its turns stay on the Runs page.',
      deployment: 'Deployment',
      activeRun: 'Unfinished turn',
      turns: 'Turns',
      turnsCount: 'Turns ({{count}})',
      noTurns: 'This conversation has no turns yet.',
      pending: 'Waiting for the result',
      columns: {
        turn: 'Turn',
        run: 'Run',
        status: 'Status',
        outcome: 'Outcome',
        session: 'Session',
        input: 'Input',
        result: 'Result',
        node: 'Node',
        created: 'Created'
      },
      session: {
        first: 'New session',
        resumed: 'Resumed',
        fallback: 'Fresh session',
        pending: 'Not placed yet'
      },
      continueTitle: 'Continue the conversation',
      message: 'Next message',
      messagePlaceholder: 'Ask a follow-up question or give the next instruction...',
      busyNotice: 'The previous turn is still working. You can send the next message when it finishes.',
      send: 'Send turn',
      turnStarted: 'Turn {{turn}} started.',
      openInvoke: 'Continue in Invoke',
      confirmDelete: 'Delete the conversation "{{title}}"? Its turns stay on the Runs page as ordinary runs, but no new turn can continue it.'
    }
  },
  wizard: {
    title: 'Set up Garrison',
    stepOf: 'Step {{step}} of {{total}}',
    steps: { welcome: 'Welcome', secret: 'Credential', manifest: 'Sample agent', invoke: 'Test run' },
    welcomeBody: 'This tenant has no agents yet. In a few steps you will:',
    welcomeItem1: 'Store a harness credential such as an Anthropic or OpenAI API key (optional).',
    welcomeItem2: 'Apply a sample agent that uses the built-in fake harness, so it works without credentials.',
    welcomeItem3: 'Run it and watch the transcript.',
    start: 'Start',
    skip: 'Skip setup',
    skipStep: 'Skip this step',
    secretBody: 'Add a credential your real agents will need. You can skip this and add secrets later.',
    saveSecret: 'Save and continue',
    secretSaved: 'Secret saved.',
    manifestBody: 'This manifest creates an echo agent and a deployment that uses the fake harness.',
    invokeBody: 'Send a message to the echo agent. You will be taken to the run as it executes.',
    invoke: 'Run it',
    noAgent: 'The sample agent was not found. Apply the manifest first.'
  },
  tour: {
    title: 'Guided tour',
    skip: 'Skip tour',
    done: 'Done',
    steps: {
      sidebar: { title: 'Navigation', body: 'Pages are grouped into hubs. Each hub has tabs across the top of the page, and every tab has its own link.' },
      topbar: { title: 'Context', body: 'The server, tenant, your identity, health, and live status are always visible here.' },
      kpis: { title: 'At a glance', body: 'Each card summarizes a resource. Click a card to open the filtered list.' },
      invoke: { title: 'Invoke', body: 'Try any agent interactively and watch its transcript stream.' },
      configure: { title: 'Configuration', body: 'Harness profiles, prompt templates, MCP servers, and secrets control exactly what runs. Agents and deployments have their own hub.' },
      observe: { title: 'Monitoring', body: 'Request history, audit, and the API Explorer help you verify and debug.' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(en.resources.deployments.fields, {"capIsolation": "Minimum isolation", "capColdStartClass": "Startup class", "capEgressControl": "Require egress control", "capFilesystemSnapshot": "Require filesystem snapshots", "capSessionContinuation": "Require session continuation", "capCrossNodeRestore": "Require cross-node restore"});
Object.assign(en.tips.resources.deployments, {"capIsolation": "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.", "capColdStartClass": "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.", "capEgressControl": "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.", "capFilesystemSnapshot": "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.", "capSessionContinuation": "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.", "capCrossNodeRestore": "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued."});
en.resources.deployments.hints.capabilities = "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.";
en.resources.nodes.columns.executorCapabilities = "Executor capabilities";
en.tips.resources.nodes.executorCapabilities = "Runs wait for a worker with these capabilities. Select KubernetesJob for Container isolation. Unavailable snapshot, restore, or warm-pod capabilities keep runs queued.";
en.enums.executorIsolation = {"Process": "Process", "Container": "Container", "SandboxedRuntime": "Sandboxed runtime"};
en.enums.executorColdStart = {"Immediate": "Immediate", "Cold": "Cold", "Warm": "Warm"};
// Artifact collection and browsing (P12.8).
en.nav.items.artifacts = { label: "Artifacts", tip: "Files collected from runs." };
en.resources.artifacts = { ...resourcePage("Artifacts", "artifact", "Files collected from runs.", "Configure a store and explicit deployment globs to collect files."), columns: {"name": "Name", "runId": "Run", "artifactStoreId": "Store", "mediaType": "Media type", "sizeBytes": "Bytes", "sha256": "SHA-256 hash", "createdUtc": "Created", "id": "ID", "leaseEpoch": "Lease epoch", "repairAttempt": "Repair attempt"}, fields: {"name": "Name", "runId": "Run", "artifactStoreId": "Store", "mediaType": "Media type", "sizeBytes": "Bytes", "sha256": "SHA-256 hash", "createdUtc": "Created", "id": "ID", "leaseEpoch": "Lease epoch", "repairAttempt": "Repair attempt"}, actions: { download: "Download" } };
en.tips.resources.artifacts = { ...{"name": "Files collected from runs. Name", "runId": "Files collected from runs. Run", "artifactStoreId": "Files collected from runs. Store", "mediaType": "Files collected from runs. Media type", "sizeBytes": "Files collected from runs. Bytes", "sha256": "Files collected from runs. SHA-256", "createdUtc": "Files collected from runs. Created", "id": "Files collected from runs. ID", "leaseEpoch": "Files collected from runs. Lease epoch", "repairAttempt": "Files collected from runs. Repair attempt"}, actions: { download: "Download this file using a temporary link." }, filters: { runId: "Run", storeId: "Store" } };
Object.assign(en.resources.artifactStores.fields, {"pathPrefix": "Path prefix", "bucket": "Bucket", "endpoint": "Endpoint", "region": "Region", "secretId": "Credential", "forcePathStyle": "Path-style requests"});
Object.assign(en.tips.resources.artifactStores, {"pathPrefix": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionToken. Empty credential uses the server credential chain.", "bucket": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionToken. Empty credential uses the server credential chain.", "endpoint": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionToken. Empty credential uses the server credential chain.", "region": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionToken. Empty credential uses the server credential chain.", "secretId": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionToken. Empty credential uses the server credential chain.", "forcePathStyle": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionToken. Empty credential uses the server credential chain."});
en.resources.deployments.fields.artifactGlobs = "Collection globs";
en.tips.resources.deployments.artifactGlobs = "Collect only matching relative workspace files, for example reports/**/*.json. Empty disables collection.";
en.resources.deployments.hints.artifactGlobs = "Collect only matching relative workspace files, for example reports/**/*.json. Empty disables collection.";
Object.assign(en.common.eventCodes, { ArtifactCollectionWarning: "Artifact collection warning", ArtifactsCollected: "Artifacts collected" });
en.tips.nav.tabs.artifacts = en.nav.items.artifacts.tip + " " + en.tips.resources.artifacts.actions.download;
Object.assign(en.components.mcpTest, {"worker": "Worker node", "chooseWorker": "Select a Ready worker. The configured command runs there to list tools; no tools are invoked.", "runTest": "Run test"});
export default en;

en.views.settings.groups.Leases = "Coordination leases";
en.views.settings.fields.Leases = {"Provider": "Provider", "ClutchEndpoint": "Clutch endpoint", "ClutchAccessKey": "Clutch access key", "KeyPrefix": "Key prefix", "RequestTimeoutMs": "Request timeout (ms)", "SweepIntervalMs": "Sweep interval (ms)", "MaxLeaseMs": "Maximum lease (ms)", "MaxHoldMs": "Maximum hold (ms)"};

en.enums.harnessType.ProviderApi = "Provider API";
en.enums.outputParser.ProviderApiJsonl = "Provider API JSONL";
en.enums.harnessType.OpenCode = "opencode";
en.enums.harnessType.Pi = "pi";
en.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
en.enums.outputParser.PiJsonl = "pi JSONL";
en.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
en.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): definitions (Agents > Pipelines), pipeline runs (Runs > Pipeline runs), and stage reviews
// (Approvals > Stage reviews).
en.nav.hubs.approvals.tip = 'Tool calls and pipeline stages waiting for a person, and every decision';
Object.assign(en.nav, { approvalsPending_one: '{{count}} item waiting for a person', approvalsPending_other: '{{count}} items waiting for a person' });
Object.assign(en.nav.items, {
  pipelines: { label: 'Pipelines', tip: 'Ordered agent stages with optional review gates' },
  pipelineRuns: { label: 'Pipeline runs', tip: 'Executions of pipelines, stage by stage' },
  pipelineReviews: { label: 'Stage reviews', tip: 'Pipeline stages waiting for a person to review them' }
});
Object.assign(en.errorCodes, {
  RevisionLimitReached: 'This stage already used all its revisions, so changes can no longer be requested. Approve or reject it instead.',
  ReviewNotPending: 'This review was already decided, by someone else or by its timeout, so it cannot be decided again.',
  PipelineInUse: 'This pipeline has unfinished pipeline runs. Wait for them to finish, or cancel them, then delete the pipeline.',
  PipelineRunActive: 'Only finished pipeline runs can be deleted. Cancel this pipeline run first.',
  PipelineRunFinished: 'This pipeline run has already finished, so it cannot be cancelled.',
  PipelineRunNotRetryable: 'Only failed, timed out, or cancelled pipeline runs can be retried.',
  PipelineRunChanged: 'This pipeline run changed while the request was processed. Reload it and try again.',
  PipelineInactive: 'This pipeline is inactive. Turn it on before starting it.',
  PipelineEmpty: 'A pipeline needs at least one stage.',
  PipelineStageRun: 'This run is a stage of a pipeline run, so it cannot be retried on its own. Retry the pipeline run instead.',
  ReferencedByPipeline: 'A pipeline stage uses this agent. Remove the agent from every pipeline before deleting it.'
});
en.enums.pipelineRunStatus = { Running: 'Running', AwaitingReview: 'Awaiting review', Cancelling: 'Cancelling', Succeeded: 'Succeeded', Failed: 'Failed', Cancelled: 'Cancelled', TimedOut: 'Timed out' };
en.enums.pipelineRunOutcome = { None: 'None', Succeeded: 'Succeeded', StageFailed: 'Stage failed', StageStartFailed: 'Stage could not start', ReviewRejected: 'Review rejected', ReviewExpired: 'Review expired', Cancelled: 'Cancelled', TimedOut: 'Timed out', InternalError: 'Internal error' };
en.enums.pipelineStageStatus = { Pending: 'Pending', Running: 'Running', AwaitingReview: 'Awaiting review', Succeeded: 'Succeeded', Failed: 'Failed', Cancelled: 'Cancelled' };
en.enums.pipelineReviewStatus = { Pending: 'Pending', Approved: 'Approved', ChangesRequested: 'Changes requested', Rejected: 'Rejected', Expired: 'Expired', Cancelled: 'Cancelled' };
en.enums.pipelineReviewDecision = { Approve: 'Approve', RequestChanges: 'Request changes', Reject: 'Reject' };
en.enums.pipelineReviewSource = { User: 'Person', Timeout: 'Timeout', Cancelled: 'Pipeline run stopped' };
Object.assign(en.enums.resourceType, { Pipeline: 'Pipeline', PipelineRun: 'Pipeline run' });
Object.assign(en.enums.auditEventType, { PipelineReviewDecided: 'Stage review decided', PipelineRunCancelled: 'Pipeline run cancelled' });
en.resources.deployments.promptRoles.PipelineStage = 'Pipeline stage (handoff)';
Object.assign(en.resources.runs.columns, { pipelineRunId: 'Pipeline run' });
en.resources.runs.pipelineStage = 'stage {{position}}, execution {{execution}}';
en.resources.pipelines = {
  ...resourcePage('Pipelines', 'pipeline', 'Ordered agent stages: each stage runs one agent and hands its output to the next, with optional review gates.', 'Create a pipeline to chain agents: each stage receives the output of the stage before it.'),
  columns: { name: 'Name', stages: 'Stages', reviewGates: 'Review gates', maxDurationSeconds: 'Time limit', version: 'Version', active: 'Active', description: 'Description', id: 'ID', lastUpdateUtc: 'Updated', createdUtc: 'Created' },
  fields: {
    name: 'Name',
    description: 'Description',
    maxDurationSeconds: 'Time limit (seconds)',
    active: 'Active',
    stages: 'Stages',
    stageName: 'Stage name',
    agentId: 'Agent',
    deploymentId: 'Deployment',
    handoffTemplateId: 'Handoff template',
    handoffTemplateVersion: 'Pinned template version',
    outputCharLimit: 'Handoff character limit',
    maxAttempts: 'Maximum attempts',
    continueOnFailure: 'Continue on failure',
    requiresReview: 'Requires review',
    reviewTimeoutSeconds: 'Review timeout (seconds)',
    reviewTimeoutAction: 'When the review times out',
    maxRevisions: 'Maximum revisions',
    stageDescription: 'Stage description',
    parameters: 'Run parameters'
  },
  hints: {
    maxDurationSeconds: 'From {{min}} to {{max}}. 0 means no limit. The limit covers the whole pipeline run, including time spent waiting for reviews.',
    stages: 'Stages run in this order. Each stage starts when the stage before it succeeds (or fails with Continue on failure) and, if it requires a review, after a person approves it.',
    noDeployments: 'This agent has no deployments yet. Leave the deployment empty or add one under Deployments.',
    handoffTemplateVersion: 'Empty uses the template\'s current version.',
    outputCharLimit: 'From {{min}} to {{max}}. Default {{default}}.',
    maxAttempts: 'From {{min}} to {{max}}. Default {{default}}.',
    reviewTimeoutSeconds: 'From {{min}} to {{max}}. 0 waits indefinitely.',
    maxRevisions: 'From {{min}} to {{max}}. Default {{default}}.',
    parameters: 'Only with a deployment, and only parameters that deployment lets callers override.'
  },
  errors: {
    dnsName: 'Use 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.',
    range: 'Enter a whole number from {{min}} to {{max}}.',
    noStages: 'Add at least one stage.',
    tooManyStages: 'A pipeline has at most {{max}} stages.',
    stageNameLong: 'Stage names are limited to 128 characters.',
    stageNameDuplicate: 'Another stage is already named {{name}}.',
    version: 'Enter a version number of 1 or more, or leave it empty.',
    parametersNeedDeployment: 'Run parameters need a deployment, because they are checked against that deployment\'s allowed overrides.',
    parametersUnique: 'Each parameter name may appear once.',
    stageInvalid: 'this stage has errors.'
  },
  actions: { start: 'Start', preview: 'Preview prompts', runs: 'View pipeline runs' },
  stageHeading: 'Stage {{position}}: {{name}}',
  stageCount: '{{count}} of at most {{max}}',
  stageSummary: '{{count}} stages: {{chain}}',
  addStage: 'Add stage',
  removeStage: 'Remove stage',
  noStages: 'No stages yet.',
  chooseAgent: 'Choose an agent',
  anyDeployment: 'Any active deployment (weighted)',
  defaultHandoff: 'Deployment binding or built-in',
  parameterName: 'Parameter',
  parameterValue: 'Value',
  noLimit: 'No limit',
  versionNotice: 'Version {{version}}. Saving creates a new version; pipeline runs already started keep the stages they started with.'
};
en.resources.pipelineRuns = {
  ...resourcePage('Pipeline runs', 'pipeline run', 'Every execution of a pipeline. Open one to follow its stages, decide its reviews, or cancel and retry it.', 'Start a pipeline from Agents > Pipelines to see its runs here.'),
  columns: { id: 'ID', pipelineName: 'Pipeline', status: 'Status', outcome: 'Outcome', progress: 'Stage', callerName: 'Started by', errorMessage: 'Error', priority: 'Priority', deadlineUtc: 'Deadline', completedUtc: 'Completed', createdUtc: 'Created' },
  actions: { cancel: 'Cancel', retry: 'Retry', stageRuns: 'View stage runs', finalRun: 'Open final run' },
  toasts: { cancelRequested: 'Cancellation requested for the pipeline run and its current stage.', retried: 'The pipeline run resumes at the stage where it stopped.' },
  progressValue: '{{position}} of {{count}}',
  versionShort: '(version {{version}})'
};
en.resources.pipelineReviews = {
  ...resourcePage('Stage reviews', 'stage review', 'Pipeline stages that wait for a person to approve them, request changes, or reject them.', 'Stages that require a review appear here after they finish.'),
  columns: { createdUtc: 'Requested', pipelineName: 'Pipeline', stageName: 'Stage', status: 'Status', decision: 'Decision', decisionSource: 'Decided by', comment: 'Comment', decidedBy: 'Reviewer', expiresUtc: 'Times out', pipelineRunId: 'Pipeline run', runId: 'Stage run', decidedUtc: 'Decided', id: 'ID' },
  filters: { pipelineRunId: 'Pipeline run ID', pipelineRunIdPlaceholder: 'Pipeline run ID (plr_...)' },
  actions: { approve: 'Approve', requestChanges: 'Request changes', reject: 'Reject', openStageRun: 'Open stage run' },
  noTimeout: 'Waits indefinitely'
};
en.components.pipelineReviews = {
  decideTitle: 'Review stage {{stage}} of {{pipeline}}',
  decision: 'Decision',
  positionExecution: 'stage {{position}}, execution {{execution}}',
  revisionsLeft: 'Revisions left',
  revisionsLeftValue: '{{left}} of {{max}}',
  noRevisionsLeft: 'This stage used all {{max}} revisions. The server will refuse Request changes; approve or reject it instead.',
  timeoutThen: 'then {{decision}}',
  commentApprove: 'Notes for the next stage',
  commentApprovePlaceholder: 'Optional. The next stage receives these notes with the output.',
  commentRequestChanges: 'What should change',
  commentRequestChangesPlaceholder: 'Required. The stage runs again with this feedback.',
  commentReject: 'Reason',
  commentRejectPlaceholder: 'Optional. Recorded with the decision; the pipeline run fails.',
  commentRequired: 'Describe what should change. The stage runs again with this feedback.',
  commentTooLong: 'Comments are limited to {{max}} characters.',
  submit: { Approve: 'Approve stage', RequestChanges: 'Request changes', Reject: 'Reject stage' },
  toasts: {
    Approve: 'Approved stage {{stage}} of {{pipeline}}.',
    RequestChanges: 'Requested changes to stage {{stage}} of {{pipeline}}; it runs again with your feedback.',
    Reject: 'Rejected stage {{stage}} of {{pipeline}}; the pipeline run fails.',
    notPending: 'This review was already decided, by someone else or by its timeout. The list now shows the current state.',
    revisionLimit: 'This stage already used all its revisions (maximum {{max}}), so changes can no longer be requested. Approve or reject it instead.'
  }
};
en.components.pipelineStart = {
  title: 'Start {{name}}',
  intro_one: 'The input goes to the pipeline\'s only stage.',
  intro_other: 'The input goes to the first of {{count}} stages; every stage also sees it as the original task.',
  input: 'Input',
  inputPlaceholder: 'What should the pipeline work on?',
  shortcut: 'Press Ctrl+Enter or Cmd+Enter to start.',
  submit: 'Start pipeline',
  starting: 'Starting...',
  started: 'Started {{name}}.'
};
en.components.pipelinePreview = {
  title: 'Preview prompts of {{name}}',
  input: 'Sample input',
  sampleInput: 'Summarize the open issues and propose a fix for the most urgent one.',
  sampleOutput: 'Sample output of {{stage}}.',
  outputOf: 'Sample output of stage {{position}} ({{stage}})',
  render: 'Render prompts',
  rendering: 'Rendering...',
  stageHeading: 'Stage {{position}}: {{stage}} ({{agent}})',
  deployment: 'Deployment: {{deployment}}',
  rendered: 'Rendered',
  failed: 'Failed'
};
en.views.pipelineRunDetail = {
  title: 'Pipeline run',
  heading: 'Pipeline run of {{pipeline}}',
  notFoundTitle: 'Pipeline run not found',
  notFoundBody: 'It may have been deleted, or it belongs to another tenant.',
  live: 'Live',
  polling: 'Refreshing',
  finalRun: 'Final run',
  started: 'Started',
  input: 'Input',
  reviewTitle: 'Waiting for your review',
  reviewBody: 'Stage {{position}} ({{stage}}) finished execution {{execution}} and waits for a review. Read its output in the stage run:',
  reviewExpires: 'If nobody decides by {{time}}, the review is decided automatically: {{decision}}.',
  reviewNoTimeout: 'The review waits until a person decides, unless the pipeline\'s time limit ends the run first.',
  stages: 'Stages',
  stagesCount_one: '{{count}} stage',
  stagesCount_other: '{{count}} stages',
  noStages: 'This pipeline run has no stages.',
  current: 'Current',
  reviewGate: 'Review gate',
  agent: 'Agent {{agent}}',
  counts: 'Executions {{executions}}, attempts {{attempts}} of {{maxAttempts}}, revisions {{revisions}} of {{maxRevisions}}',
  startedAt: 'started',
  blocked: 'Waiting to start: {{reason}}.',
  nextAttempt: 'Next attempt at {{time}}.',
  reviewItem: 'Review of execution {{execution}}',
  columns: { execution: 'Execution', run: 'Stage run', status: 'Status', outcome: 'Outcome', error: 'Error', created: 'Created' },
  confirmCancelTitle: 'Cancel pipeline run',
  confirmCancel: 'Cancel this pipeline run of {{pipeline}}? Its current stage run is cancelled and a pending review is closed. You can retry it later.',
  confirmDelete: 'Delete this pipeline run of {{pipeline}} and its reviews? Its stage runs stay on the Runs page.'
};
Object.assign(en.views.runDetail, { pipelineRun: 'Pipeline run' });
en.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Pipeline sweep interval (ms)';
en.views.settings.fields.Runtime.PipelineMaxStages = 'Maximum stages per pipeline';

// Deployment trust level (P11.14).
en.enums.trustLevel = { Trusted: "Trusted", Untrusted: "Untrusted" };
en.enums.runBlockedReason.NoIsolatingWorker = "No isolating worker";
en.components.blocked.reasons.NoIsolatingWorker = "This run is Untrusted and needs Container isolation, but no Ready worker that can run {{harness}} offers it. Add a worker with the Kubernetes Job executor, in a cluster where it may create Jobs.";
en.tips.enums.runBlockedReason.NoIsolatingWorker = "Blocked: this Untrusted run needs Container isolation, and no Ready worker with its harness offers it. It waits in the queue until a worker with the Kubernetes Job executor registers.";
en.tips.enums.trustLevel = { Trusted: "Input comes from trusted callers only. Runs may use the Process executor, which is not isolated from other runs or the worker.", Untrusted: "Input may come from untrusted sources. Runs only go to an executor with Container isolation or stronger, and wait in the queue until one is available." };
Object.assign(en.common.fieldCodes, { TenantRequiresUntrusted: "This tenant requires every deployment to be Untrusted.", UntrustedNeedsIsolation: "An Untrusted deployment cannot use the Process executor. Choose Kubernetes Job or leave the executor empty." });
en.resources.deployments.fields.trustLevel = "Trust level";
en.resources.deployments.columns.trustLevel = "Trust level";
en.resources.deployments.hints.trustLevel = "Choose Untrusted when callers or content may be untrusted. Untrusted runs need Container isolation: an empty executor then means Kubernetes Job, and runs wait until a worker can isolate them.";
en.tips.resources.deployments.trustLevel = "Trusted allows the Process executor, which is not isolated. Untrusted runs only on an executor with Container isolation or stronger.";
en.tips.resources.deployments.trustFlagged = "This tenant requires Untrusted deployments. This deployment was Trusted before the policy was turned on: it keeps running as configured, but it must be set to Untrusted the next time it is saved.";
en.resources.deployments.trust = { tenantRequiresUntrusted: "This tenant requires Untrusted deployments. Set the trust level to Untrusted to save this deployment.", untrustedProcess: "Untrusted deployments cannot use the Process executor. Choose Kubernetes Job or leave the executor empty.", flagged: "Trusted, policy requires Untrusted" };
en.resources.tenants.fields.requireUntrustedDeployments = "Require Untrusted deployments";
en.resources.tenants.columns.requireUntrustedDeployments = "Requires Untrusted";
en.resources.tenants.hints = { ...(en.resources.tenants.hints || {}), requireUntrustedDeployments: "Creating or saving a Trusted deployment is refused. Existing Trusted deployments keep running and are flagged until they are saved as Untrusted." };
en.tips.resources.tenants.requireUntrustedDeployments = "When on, every deployment in this tenant must be Untrusted, so its runs only go to isolated executors.";
en.views.runDetail.trustLevel = "Trust level";
en.tips.views.runDetail.trustLevel = "The deployment's trust level when this run was queued. Untrusted runs only go to an executor with Container isolation or stronger.";

// Deployment effect policy (P12.29).
en.enums.effectPolicy = { AtMostOnce: "At most once", AtLeastOnce: "At least once", Journaled: "Journaled" };
en.tips.enums.effectPolicy = { AtMostOnce: "If the worker is lost after the run started, the run fails with Node lost and is never started again. No external effect happens twice. The default.", AtLeastOnce: "If the worker is lost after the run started, the run goes back to the queue while it has attempts left. Effects the lost attempt already made (a push, a message) may happen again.", Journaled: "Requeues only when every effect went through the effect journal. The journal is not available yet, so this behaves like At most once." };
Object.assign(en.common.fieldCodes, { EffectPolicyConflict: "The effect policy disagrees with the deprecated retryOnNodeLoss value. Send only the effect policy." });
en.resources.deployments.fields.effectPolicy = "Effect policy";
en.resources.deployments.columns.effectPolicy = "Effect policy";
en.resources.deployments.hints.effectPolicy = "At most once (default) fails a started run whose worker is lost with Node lost. At least once requeues it while attempts remain and may repeat effects. Journaled behaves like At most once until the effect journal exists. A run that never started is always requeued.";
en.tips.resources.deployments.effectPolicy = "What happens to a started run when its worker is lost: fail it (At most once), requeue it (At least once), or Journaled, which behaves like At most once for now.";
en.views.runDetail.effectPolicy = "Effect policy";
en.tips.views.runDetail.effectPolicy = "The deployment's effect policy when this run was queued. It decides what happens if the run's worker is lost; later deployment changes do not affect this run.";
en.views.settings.fields.Scheduling.QueueWakeFanout = "Queue wakeup fanout (polls per replica)";
en.views.settings.fields.Scheduling.RemoteWakeDelayMs = "Remote wakeup hold (ms)";
en.views.settings.fields.Auth.CacheSeconds = "Authentication cache lifetime (seconds)";

// Deployment egress allowlists (P11.15).
en.resources.deployments.fields.egressRules = "Egress allowlist";
en.resources.deployments.fields.egressCidr = "CIDR block";
en.resources.deployments.fields.egressPort = "Destination port";
en.resources.deployments.fields.egressProtocol = "Protocol";
en.resources.deployments.columns.egressRules = "Egress";
en.resources.deployments.hints.egressRules = "Leave empty to use the cluster's default run egress (HTTPS to anywhere). With rules, run pods may reach only DNS, the Garrison MCP port, and these blocks, and runs need a Kubernetes worker that enforces them. Enter CIDR blocks, not host names; resolve names to addresses yourself. An empty port allows every port. At most 64 rules.";
en.resources.deployments.egress = {"add": "Add egress rule", "allPorts": "All ports", "default": "Default", "count_one": "Allowlist, {{count}} rule", "count_other": "Allowlist, {{count}} rules", "note_one": "This deployment has {{count}} egress rule. Its runs only run on Kubernetes workers with egress allowlists enabled, in a pod whose NetworkPolicy allows only DNS, the Garrison MCP port, and the rule. When no such worker is Ready, runs wait in the queue (No isolating worker); they never run without the allowlist.", "note_other": "This deployment has {{count}} egress rules. Its runs only run on Kubernetes workers with egress allowlists enabled, in a pod whose NetworkPolicy allows only DNS, the Garrison MCP port, and the rules. When no such worker is Ready, runs wait in the queue (No isolating worker); they never run without the allowlist.", "errors": {"cidrRequired": "Enter a CIDR block, for example 203.0.113.0/24.", "cidrFormat": "Use CIDR notation with a prefix length, for example 198.51.100.7/32. Host names are not accepted.", "cidrAddress": "The address is not a valid IPv4 or IPv6 address.", "cidrPrefix": "The prefix length is out of range (0 to 32 for IPv4, 0 to 128 for IPv6).", "cidrMapped": "IPv4-mapped IPv6 addresses are not allowed; enter the IPv4 block instead.", "cidrHostBits": "The address has bits set after the prefix; use the network address of the block."}};
Object.assign(en.common.fieldCodes, {"InvalidCidr": "Invalid CIDR block.", "PortOutOfRange": "The port must be from 1 to 65535, or empty for every port.", "InvalidProtocol": "Unknown protocol; use TCP or UDP.", "TooManyEgressRules": "A deployment can have at most 64 egress rules.", "EgressRulesNeedKubernetesJob": "Egress rules are enforced only for Kubernetes Job runs. Choose Kubernetes Job or leave the executor empty.", "EgressRulesNeedColdStart": "Egress rules need cold startup, because warm pods already run with the default egress. Clear the startup class or choose Cold."});
en.components.blocked.reasons.NoIsolatingWorkerEgress = "This run's deployment has an egress allowlist, which only a Kubernetes worker with egress allowlists enabled can enforce, and no Ready worker that can run {{harness}} offers that. The run waits in the queue and never runs without the allowlist. Turn on egress allowlists for a Kubernetes Job worker in a cluster whose network plugin enforces NetworkPolicy.";
en.tips.enums.runBlockedReason.NoIsolatingWorker = "Blocked: this run needs an isolated worker (Container isolation for an Untrusted run, or egress control for a deployment with an egress allowlist), and no Ready worker with its harness offers it. It waits in the queue until a suitable Kubernetes Job worker registers.";
en.tips.resources.deployments.egressRules = "Destinations that run pods of this deployment may reach, as CIDR blocks with an optional port and protocol. Empty uses the default run egress.";
en.tips.resources.deployments.egressRulesItems = {"cidr": "Destination block in CIDR notation, IPv4 or IPv6, for example 203.0.113.0/24. Resolve host names to addresses yourself.", "port": "Destination port from 1 to 65535. Leave empty to allow every port of the block.", "protocol": "TCP for most services, or UDP."};
en.tips.resources.deployments.egressDefault = "No egress allowlist: run pods use the cluster's default run egress.";

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
})(en, {
 "nav": {
  "items": {
   "triggers": {
    "label": "Triggers",
    "tip": "Cron schedules and signed webhooks that start runs"
   },
   "notifications": {
    "label": "Notifications",
    "tip": "Signed webhooks about runs, pipelines, and approvals"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "Cron schedule",
   "Webhook": "Signed webhook"
  },
  "triggerTargetType": {
   "Agent": "Agent run",
   "Pipeline": "Pipeline run"
  },
  "triggerFireSource": {
   "Cron": "Schedule",
   "Webhook": "Webhook delivery",
   "Manual": "Fired by hand"
  },
  "triggerFireOutcome": {
   "Started": "Started",
   "Failed": "Failed",
   "Skipped": "Skipped"
  },
  "notificationEvent": {
   "RunSucceeded": "Run succeeded",
   "RunFailed": "Run failed",
   "RunCancelled": "Run cancelled",
   "RunTimedOut": "Run timed out",
   "PipelineCompleted": "Pipeline completed",
   "PipelineFailed": "Pipeline failed",
   "ApprovalRequested": "Approval requested",
   "Test": "Test notification"
  },
  "notificationDeliveryStatus": {
   "Pending": "Pending",
   "Delivering": "Delivering",
   "Succeeded": "Delivered",
   "Failed": "Gave up"
  },
  "runKind": {
   "Invoke": "Invocation",
   "Delegated": "Delegated",
   "Test": "Test run",
   "Retry": "Retry",
   "Pipeline": "Pipeline stage",
   "Trigger": "Started by a trigger"
  },
  "resourceType": {
   "Trigger": "Trigger",
   "NotificationEndpoint": "Notification endpoint"
  },
  "auditEventType": {
   "SigningSecretRotated": "Signing secret rotated"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "A trigger uses this record. Change or delete that trigger first.",
  "ReferencedByNotificationEndpoint": "A notification endpoint filters on this record. Change or delete that endpoint first.",
  "NotAWebhookTrigger": "Only webhook triggers have a signing secret.",
  "TriggerInactive": "This trigger is inactive.",
  "InvalidSignature": "The webhook signature is missing, malformed, too old, or does not match.",
  "PayloadTooLarge": "The payload is larger than the server accepts."
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "Enter an absolute HTTP or HTTPS URL without a user name or password.",
   "DestinationBlocked": "The server refuses this destination: loopback, private, link-local, and metadata addresses are blocked unless an operator allows private destinations.",
   "EventsRequired": "Choose at least one event.",
   "InvalidEvent": "One of the events is not supported.",
   "InvalidCron": "The cron expression is invalid. Use five fields: minute, hour, day of month, month, and day of week.",
   "InvalidTimeZone": "Unknown time zone. Use an IANA name such as UTC or America/New_York.",
   "TypeImmutable": "The trigger type cannot change. Create a new trigger instead.",
   "TargetMismatch": "This field does not belong to the chosen target.",
   "PayloadTooLarge": "The payload is larger than the server accepts."
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "Trigger",
    "kind": "Run kind"
   }
  },
  "triggers": {
   "title": "Triggers",
   "subtitle": "Cron schedules and signed webhooks that start an agent run or a pipeline run.",
   "add": "Add trigger",
   "create": "Create trigger",
   "edit": "Edit trigger",
   "view": "Trigger details",
   "deleteTitle": "Delete trigger",
   "emptyTitle": "No triggers yet",
   "emptyBody": "Create a trigger to run an agent on a schedule or when another system sends a webhook.",
   "columns": {
    "name": "Name",
    "type": "Type",
    "target": "Starts",
    "schedule": "Schedule",
    "active": "Active",
    "lastFire": "Last fire",
    "nextFireUtc": "Next fire",
    "fireCount": "Fires",
    "runAs": "Runs as",
    "signingSecretLast4": "Secret ends",
    "description": "Description",
    "id": "ID",
    "createdUtc": "Created"
   },
   "fields": {
    "name": "Name",
    "type": "Type",
    "description": "Description",
    "targetType": "Starts",
    "agentId": "Agent",
    "deploymentId": "Deployment",
    "pipelineId": "Pipeline",
    "inputTemplateId": "Input template",
    "priority": "Priority",
    "cronExpression": "Cron expression",
    "timeZone": "Time zone",
    "active": "Active",
    "webhook": "Webhook URL"
   },
   "hints": {
    "type": "The type cannot change after the trigger is created.",
    "inputTemplateId": "A Task template that renders the run input from trigger.* and webhook.* variables. Empty uses the built-in trigger-input template.",
    "priority": "From {{min}} to {{max}}. Higher runs first.",
    "cronExpression": "Five fields: minute, hour, day of month, month, day of week. Example: 0 9 * * 1-5 runs at 09:00 on weekdays.",
    "timeZone": "IANA name such as UTC or America/New_York. Daylight saving changes are handled for you.",
    "webhookNew": "The webhook URL and the signing secret appear after you save. The secret is shown once."
   },
   "errors": {
    "name": "Use 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.",
    "description": "Descriptions are limited to {{max}} characters.",
    "agentRequired": "Choose the agent this trigger runs.",
    "pipelineRequired": "Choose the pipeline this trigger starts.",
    "cron": "Enter five fields (minute hour day month weekday) or a macro such as @daily.",
    "priority": "Enter a whole number from {{min}} to {{max}}."
   },
   "actions": {
    "fire": "Fire now",
    "fires": "Fire history",
    "runs": "View runs",
    "rotateSecret": "Rotate secret"
   },
   "fires": {
    "firedUtc": "Fired",
    "source": "Source",
    "outcome": "Outcome",
    "started": "Started run",
    "deliveryId": "Delivery ID",
    "error": "Error",
    "runId": "Run",
    "pipelineRunId": "Pipeline run"
   },
   "confirmRotateTitle": "Rotate signing secret",
   "confirmRotate": "Replace the signing secret of {{name}}? The old secret stops working at once, so senders must switch to the new one.",
   "anyDeployment": "Any active deployment (weighted)",
   "builtinTemplate": "Built-in trigger-input template",
   "webhookSchedule": "When a signed webhook arrives",
   "neverFired": "Not fired yet",
   "runAsNotice": "Runs as {{name}}. Saving changes makes you the principal this trigger runs as.",
   "secretEnding": "The current secret ends in {{last4}}."
  },
  "notifications": {
   "title": "Notifications",
   "subtitle": "Webhook endpoints that receive signed notifications when runs and pipelines finish or approvals wait.",
   "add": "Add endpoint",
   "create": "Create notification endpoint",
   "edit": "Edit notification endpoint",
   "view": "Notification endpoint details",
   "deleteTitle": "Delete notification endpoint",
   "emptyTitle": "No notification endpoints yet",
   "emptyBody": "Add an endpoint to receive a signed HTTP POST when a run fails, a pipeline finishes, or an approval waits.",
   "columns": {
    "name": "Name",
    "url": "URL",
    "events": "Events",
    "filters": "Filters",
    "active": "Active",
    "signingSecretLast4": "Secret ends",
    "includeResultText": "Result text",
    "description": "Description",
    "id": "ID",
    "createdUtc": "Created",
    "agent": "Agent",
    "deployment": "Deployment"
   },
   "fields": {
    "name": "Name",
    "description": "Description",
    "url": "URL",
    "events": "Events",
    "agentId": "Only this agent",
    "deploymentId": "Only this deployment",
    "includeResultText": "Include result text",
    "resultTextMaxChars": "Result text limit (characters)",
    "active": "Active"
   },
   "hints": {
    "url": "An HTTP or HTTPS URL. Loopback, private, and metadata addresses are refused unless an operator allows private destinations, and redirects are not followed.",
    "events": "Pipeline events are not sent while an agent or deployment filter is set.",
    "agentId": "Empty sends events for every agent.",
    "deploymentId": "Empty sends events for every deployment.",
    "includeResultText": "Off by default: notifications carry identifiers, status, and timestamps but no run output.",
    "resultTextMaxChars": "From {{min}} to {{max}}. Default {{default}}."
   },
   "errors": {
    "name": "Use 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.",
    "url": "Enter an absolute HTTP or HTTPS URL without a user name or password.",
    "events": "Choose at least one event.",
    "resultTextMaxChars": "Enter a whole number from {{min}} to {{max}}."
   },
   "actions": {
    "test": "Send test",
    "deliveries": "Delivery log",
    "rotateSecret": "Rotate secret"
   },
   "deliveries": {
    "createdUtc": "Queued",
    "event": "Event",
    "status": "Status",
    "attempts": "Attempts",
    "lastStatusCode": "HTTP status",
    "lastError": "Last error",
    "lastAttemptUtc": "Last attempt",
    "nextAttemptUtc": "Next attempt",
    "deliveredUtc": "Delivered",
    "payload": "Payload",
    "id": "Delivery ID"
   },
   "confirmRotateTitle": "Rotate signing secret",
   "confirmRotate": "Replace the signing secret of {{name}}? Notifications are signed with the new secret from now on, including retries already queued.",
   "anyAgent": "Every agent",
   "anyDeployment": "Every deployment",
   "noFilter": "Everything",
   "eventCount_one": "{{count}} event",
   "eventCount_other": "{{count}} events",
   "resultTextUpTo_one": "Up to {{count}} character",
   "resultTextUpTo_other": "Up to {{count}} characters",
   "secretNotice": "Notifications are signed with a secret ending in {{last4}}, set {{time}}. Rotate it to get a new one."
  }
 },
 "components": {
  "signingSecret": {
   "title": "Signing secret",
   "warning": "Copy this secret now. Garrison stores it encrypted and will not show it again; rotate it if it is lost.",
   "secret": "Secret",
   "url": "Webhook URL",
   "done": "I saved it",
   "scheme": "Sign each request with the header {{header}}: {{format}}. Send {{delivery}} to make repeated deliveries count once."
  },
  "triggerFire": {
   "title": "Fire {{name}}",
   "intro": "Start this trigger now. A payload is optional; the input template sees it as webhook.body.",
   "body": "Payload",
   "contentType": "Payload content type",
   "submit": "Fire",
   "firing": "Firing..."
  },
  "triggerFires": {
   "title": "Fire history",
   "count_one": "{{shown}} of {{count}} fire",
   "count_other": "{{shown}} of {{count}} fires",
   "empty": "This trigger has not fired yet.",
   "scheduled": "for {{time}}"
  },
  "notificationDeliveries": {
   "title": "Delivery log",
   "count_one": "{{shown}} of {{count}} delivery",
   "count_other": "{{shown}} of {{count}} deliveries",
   "empty": "Nothing was sent to this endpoint yet.",
   "detail": "Selected delivery"
  },
  "notificationTest": {
   "title": "Test notification",
   "sending": "Sending a test notification...",
   "succeeded": "The endpoint accepted the test notification.",
   "failed": "The test notification failed and will not be retried. See the error below.",
   "pending": "The first attempt failed; Garrison will retry it. See the error below."
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Trigger"
  },
  "settings": {
   "groups": {
    "Triggers": "Triggers",
    "Notifications": "Notifications"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Largest webhook body (bytes)",
     "WebhookToleranceSeconds": "Webhook timestamp tolerance (seconds)",
     "CronMaxLatenessSeconds": "Cron catch-up limit (seconds)",
     "FireRetentionDays": "Fire history retention (days)"
    },
    "Notifications": {
     "AllowPrivateDestinations": "Allow private destinations",
     "MaxAttempts": "Delivery attempts",
     "InitialBackoffSeconds": "First retry delay (seconds)",
     "MaxBackoffSeconds": "Longest retry delay (seconds)",
     "TimeoutSeconds": "Delivery timeout (seconds)",
     "DispatchIntervalMs": "Dispatch interval (ms)",
     "SweepOverlapSeconds": "Event sweep overlap (seconds)",
     "DeliveryRetentionDays": "Delivery log retention (days)"
    }
   }
  }
 }
});
Object.assign(en.common.fieldCodes, {"SecretUseDenied": "You do not have permission to use this secret. Ask for the SecretUser or SecretManager role on it.", "GrantCeiling": "You can only grant permissions you hold yourself.", "ReservedRoleName": "This is the name of a built-in role. Choose another name."});
en.components.mcpTest.noWorkers = "No Ready worker offers stdio diagnostics. Workers run them only when an operator sets GARRISON_WORKER_MCP_TESTS_ENABLED=true on them, because the command runs on the worker host, outside run isolation.";

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
})(en, {
 "components": {
  "transcriptExport": {
   "label": "Export transcript",
   "exporting": "Exporting...",
   "markdown": "Markdown document (.md)",
   "json": "JSON (.json)",
   "includeThinking": "Include thinking",
   "failed": "Transcript export failed: {{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Structured input",
    "modeLabel": "Input editor",
    "modeForm": "Form",
    "modeJson": "Raw JSON",
    "required": "required",
    "choose": "Select a value",
    "addItem": "Add item",
    "removeItem": "Remove item",
    "jsonLabel": "Input JSON",
    "jsonPlaceholder": "JSON value",
    "unsupported": "This input schema has no properties to build a form from. Enter the JSON document the agent expects.",
    "invalidRaw": "The JSON is not valid. Fix it before switching to the form.",
    "errors": {
     "required": "This field is required.",
     "number": "Enter a number.",
     "integer": "Enter a whole number.",
     "json": "Enter valid JSON."
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "Export scope",
    "scopeAll": "All resources",
    "scopeSelected": "Selected resources",
    "kinds": "Kinds",
    "resources": "Resources",
    "resourcesHint": "One Kind/name per line or separated by commas, for example Agent/triage.",
    "invalidSelectors": "Not a Kind/name with a known kind: {{entries}}",
    "followReferences": "Include what they reference",
    "includeBuiltIn": "Include referenced built-ins",
    "exporting": "Exporting...",
    "noSecrets": "This bundle needs no secrets.",
    "requiredSecrets": "Create these secrets in the target tenant before applying. Secret values are never exported.",
    "requiredArtifactStores": "Create these artifact stores in the target tenant before applying."
   }
  }
 }
});

// Durable continuation and remote execution.
en.enums.runStatus.Suspended = "Suspended";
en.resources.deployments.fields.suspensionEnabled = "Suspend while awaiting approval";
en.resources.harnessProfiles.fields.sessionFormat = "Harness session format";
en.enums.auditEventType.QueueFull = "Queue full";
en.enums.runExecutor.RemoteA2A = "Remote A2A";
en.enums.runExecutor.RemoteMcp = "Remote MCP";
en.tips.resources.deployments.suspensionEnabled = "Opt in to durable checkpoints while waiting. Requires a Process executor, isolated home, compatible resumable harness, and an artifact store.";
en.tips.resources.harnessProfiles.sessionFormat = "Versioned on-disk session format used for portable checkpoints. Change it when a harness upgrade changes session compatibility.";
en.tips.enums.runStatus.Suspended = "The run has a durable session checkpoint and holds no worker lease or slot while it waits.";
en.tips.enums.runExecutor.RemoteA2A = "Executes an authenticated registered A2A agent with deadline and cancellation handling.";
en.tips.enums.runExecutor.RemoteMcp = "Invokes the selected registered remote MCP tool with validated JSON input.";
en.tips.enums.auditEventType.QueueFull = "Run admission was rejected because a configured cluster, tenant, or agent queue bound was reached.";

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
})(en, {
 "enums": {
  "agentRevisionState": {
   "Draft": "Draft",
   "Published": "Published"
  },
  "promotionKind": {
   "Promote": "Promotion",
   "Rollback": "Rollback"
  },
  "promotionOutcome": {
   "Applied": "Applied",
   "RolledBack": "Rolled back"
  },
  "revisionChangeType": {
   "Changed": "Changed",
   "Added": "Added",
   "Removed": "Removed"
  },
  "resourceType": {
   "AgentRevision": "Agent revision",
   "Promotion": "Promotion"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "The target is not the next environment after the source. Turn on Allow skipping environments to promote out of order.",
  "NoNextEnvironment": "The source is the last environment, so there is nothing to promote to.",
  "NoTargetDeployments": "This agent has no deployment in the target environment. Create one there first.",
  "NoSourceRevision": "There is no revision to promote: the agent has no deployment in the source environment or no published revision. Choose a revision explicitly.",
  "AmbiguousSourceRevision": "Deployments in the source environment run different revisions. Choose the revision to promote.",
  "RevisionNotPublished": "That revision is a draft. Publish it before promoting it.",
  "PromotionConflict": "A deployment changed while the promotion was applied. Nothing was changed; reload and try again.",
  "NotAPromotion": "Only promotions can be rolled back, not rollbacks.",
  "AlreadyRolledBack": "This promotion was already rolled back.",
  "RevisionUnchanged": "The draft is the same as the latest published revision. Change it before publishing, or discard it.",
  "RevisionPublished": "This revision is already published and cannot change.",
  "EnvironmentInUse": "An environment you removed still has deployments. Move or delete those deployments first."
 },
 "views": {
  "agentDetail": {
   "revisions": "Revisions",
   "draftNotice": "This agent has draft changes that are not published. Deployments keep running published revisions until the draft is published.",
   "reviewDraft": "Review draft"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "Revision",
    "state": "State",
    "author": "Author",
    "changeNote": "Change note",
    "publishedUtc": "Published",
    "actions": "Actions"
   },
   "number": "Revision {{number}}",
   "option": "Revision {{number}} ({{state}})",
   "latest": "Latest",
   "empty": "This agent has no revisions yet.",
   "compareTitle": "Compare revisions",
   "from": "From",
   "to": "To",
   "pickTwo": "Select two different revisions to compare.",
   "identical": "Revisions {{from}} and {{to}} have the same content.",
   "diffSummary": "Fields changed between revision {{from}} and revision {{to}}: {{changed}}.",
   "diffColumns": {
    "field": "Field",
    "change": "Change",
    "before": "Before",
    "after": "After"
   },
   "emptyValue": "(empty)",
   "compare": "Compare",
   "publish": "Publish",
   "discard": "Discard draft",
   "publishTitle": "Publish revision {{number}}",
   "publishBody": "Publishing makes revision {{number}} the latest published revision. Deployments that follow the latest revision run it from their next run; pinned deployments keep their revision.",
   "changeNote": "Change note",
   "changeNotePlaceholder": "What changed and why (optional)",
   "publishing": "Publishing...",
   "published": "Published revision {{number}}.",
   "discardTitle": "Discard draft revision {{number}}",
   "discardMessage": "Discard the draft? Its changes are lost. Published revisions and deployments are not affected.",
   "discarded": "The draft was discarded."
  },
  "promote": {
   "title": "Promote a revision",
   "intro": "Pins every deployment of the agent in the target environment to the revision running in the source environment. Each promotion is recorded and can be rolled back.",
   "agent": "Agent",
   "revision": "Revision to promote",
   "revisionFromSource": "The revision running in the source environment",
   "source": "From environment",
   "target": "To environment",
   "targetNext": "Next environment ({{name}})",
   "allowSkip": "Allow skipping environments",
   "skipWarning": "{{target}} is not the environment right after {{source}}.",
   "note": "Note",
   "notePlaceholder": "Why this promotion (optional)",
   "submit": "Promote",
   "promoting": "Promoting...",
   "promoted": "Promoted to {{target}}. Deployments updated: {{deployments}}.",
   "errors": {
    "noNext": "There is no environment after the source environment.",
    "sameEnvironment": "Choose a target environment other than the source.",
    "needsSkip": "This target skips an environment. Turn on Allow skipping environments to promote out of order."
   }
  },
  "promotions": {
   "title": "Promotion history",
   "agentFilter": "Agent",
   "allAgents": "All agents",
   "empty": "No promotions or rollbacks yet.",
   "columns": {
    "createdUtc": "When",
    "kind": "Kind",
    "outcome": "Outcome",
    "agent": "Agent",
    "revision": "Revision",
    "environments": "Environments",
    "deployments": "Deployments",
    "actor": "By",
    "note": "Note",
    "actions": "Actions"
   },
   "path": "{{source}} to {{target}}",
   "pinChange": "({{from}} to {{to}})",
   "skipped": "Skipped environments",
   "rollback": "Roll back",
   "rollbackTitle": "Roll back promotion",
   "rollbackMessage": "Restore the revision pins that the deployments changed by this promotion from {{source}} to {{target}} had before it? Deployments affected: {{deployments}}.",
   "rollbackNote": "Rollback note",
   "rolledBack": "Rolled back. The previous revision pins are restored."
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "Environment",
    "agentRevisionId": "Pinned revision"
   },
   "fields": {
    "environment": "Environment",
    "agentRevisionId": "Revision pin"
   },
   "hints": {
    "environment": "Promotion moves revisions through environments in the tenant's order.",
    "agentRevisionId": "Empty follows the agent's latest published revision. A pin keeps this deployment on one revision until you change it or a promotion does."
   },
   "followLatest": "Follow latest published",
   "latest": "Latest",
   "selectAgentFirst": "Select an agent first.",
   "noPublished": "This agent has no published revision yet.",
   "actions": {
    "promote": "Promote",
    "promotions": "Promotion history"
   }
  }
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
})(en, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "Assets",
    "tip": "Versioned system prompts, skills, reference files, and document templates that agent revisions pin."
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "System prompt",
   "Skill": "Skill",
   "ReferenceFile": "Reference file",
   "DocumentTemplate": "Document template"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Asset integrity failed"
  },
  "resourceType": {
   "AgentAsset": "Agent asset"
  }
 },
 "errorCodes": {
  "AssetInUse": "Agent revisions still pin this asset. Remove it from those revisions before deleting it.",
  "AssetKindImmutable": "The kind of an asset cannot change after it is created. Create a new asset instead.",
  "AssetStoreImmutable": "The artifact store of an asset cannot change after it is created. Create a new asset instead.",
  "AssetTemplateRequired": "System prompt assets need a prompt template, and other kinds cannot have one.",
  "AssetFileTooLarge": "A file is larger than the Assets.MaxFileBytes setting allows.",
  "AssetVersionTooLarge": "The files together are larger than the Assets.MaxVersionBytes setting allows.",
  "AssetTooManyFiles": "This upload has more files than the Assets.MaxFilesPerVersion setting allows.",
  "AssetHasNoFiles": "System prompt assets have no files. Edit their prompt template instead."
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "Use a relative path with forward slashes and no \".\" or \"..\" segments, at most 512 characters.",
   "MacroFormatRefused": "Macro-enabled Office files are refused (Assets.AllowMacroFormats). Save the file as .docx or .dotx.",
   "AssetHasNoFiles": "System prompt assets have no files. Edit their prompt template instead.",
   "AssetTemplateRequired": "Choose a prompt template for a system prompt asset."
  },
  "serverText": {
   "assetInUse": "Asset {{asset}} is pinned by revisions of these agents: {{agents}}. Remove it from those revisions first.",
   "assetFileTooLarge": "File {{path}} is {{size}} bytes; the limit is {{limit}} bytes (Assets.MaxFileBytes).",
   "assetVersionTooLarge": "This version is larger than {{limit}} bytes (Assets.MaxVersionBytes).",
   "assetTooManyFiles": "A version holds at most {{limit}} files (Assets.MaxFilesPerVersion); this upload has {{count}}.",
   "assetHasNoFiles": "System prompt assets have no files. Edit their prompt template instead."
  }
 },
 "resources": {
  "agentAssets": {
   "title": "Assets",
   "subtitle": "Versioned system prompts, skills, reference files, and document templates that agent revisions pin.",
   "add": "Add asset",
   "create": "Create asset",
   "edit": "Edit asset",
   "view": "Asset details",
   "deleteTitle": "Delete asset",
   "emptyTitle": "No assets yet",
   "emptyBody": "Create an asset, upload its files as a version, and pin it on an agent revision.",
   "columns": {
    "name": "Name",
    "kind": "Kind",
    "currentVersion": "Current version",
    "description": "Description",
    "tags": "Tags",
    "artifactStoreId": "Store",
    "id": "ID",
    "createdUtc": "Created"
   },
   "fields": {
    "name": "Name",
    "kind": "Kind",
    "promptTemplateId": "Prompt template",
    "artifactStoreId": "Artifact store",
    "description": "Description",
    "tags": "Tags"
   },
   "hints": {
    "kind": "Fixed after creation. A system prompt asset takes its text from a prompt template; the other kinds hold uploaded files.",
    "promptTemplateId": "The prompt template whose text this asset supplies as the agent's system prompt.",
    "artifactStoreId": "Where the uploaded files are kept. Fixed after creation. Leave empty to keep them in the Garrison database."
   },
   "errors": {
    "templateRequired": "Choose the prompt template this system prompt asset uses."
   },
   "version": "v{{number}}",
   "noVersion": "No versions",
   "databaseStore": "Garrison database",
   "actions": {
    "versions": "Versions"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "Assets"
   }
  },
  "assets": {
   "versionsTitle": "Versions of {{name}}",
   "current": "Current",
   "noVersions": "This asset has no versions yet. Upload its files below.",
   "systemPromptNotice": "System prompt assets have no files. Their text comes from their prompt template, so edit the template to change it.",
   "showFiles": "Files",
   "filesTitle": "Files of version {{number}}",
   "noFiles": "This version has no files.",
   "preview": "Preview",
   "download": "Download",
   "previewTitle": "{{path}} (version {{number}})",
   "emptyFile": "This file is empty.",
   "versionColumns": {
    "number": "Version",
    "author": "Author",
    "changeNote": "Change note",
    "totalBytes": "Total size",
    "createdUtc": "Created",
    "actions": "Actions"
   },
   "fileColumns": {
    "path": "Path",
    "mediaType": "Media type",
    "sizeBytes": "Size",
    "sha256": "SHA-256 digest",
    "actions": "Actions"
   },
   "uploadTitle": "Upload a new version",
   "uploadHint": "Choose one or more files. Every upload is a complete version: files left out are not carried over from the current version.",
   "files": "Files",
   "uploadColumns": {
    "path": "Path in the asset",
    "mediaType": "Media type",
    "size": "Size",
    "actions": "Remove"
   },
   "mediaTypeGuessed": "From the file extension",
   "removeFile": "Remove this file from the upload",
   "changeNote": "Change note",
   "changeNotePlaceholder": "What changed in this version",
   "upload": "Upload version",
   "uploading": "Uploading...",
   "uploadCreated": "Created version {{number}}.",
   "uploadUnchanged": "The files are the same as the current version {{number}}, so no new version was created.",
   "limitSetting": "The limit is set by the {{setting}} server setting.",
   "duplicatePath": "Another file in this upload has the same path.",
   "pinVersion": "{{name}} v{{version}}",
   "pinCurrent": "{{name}} (current)",
   "pinsTitle": "Asset pins",
   "pinsSave": "Save draft",
   "pinsSaved": "Saved the asset pins on draft revision {{number}}.",
   "pinsDraft": "Changes the asset pins of draft revision {{number}}. Everything else in the draft stays as it is.",
   "pinsNewDraft": "There is no open draft. Saving starts a new draft from published revision {{number}} with these asset pins.",
   "pinsEmpty": "No assets are pinned.",
   "pinAsset": "Asset",
   "pinVersionLabel": "Version",
   "chooseAsset": "Choose an asset",
   "assetOption": "{{name}} ({{kind}})",
   "followCurrent": "Current version",
   "removePin": "Remove this asset pin",
   "addPin": "Add asset",
   "editPins": "Assets",
   "pinsNewDraftButton": "Pin assets in a new draft"
  }
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
})(en, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "Conversation sections",
   "tabs": {
    "turns": "Turns",
    "files": "Files"
   }
  },
  "runDetail": {
   "fileSpace": "File space",
   "openFiles": "Open files"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "File space folder"
   },
   "hints": {
    "fileSpaceMountPath": "Folder in the run's workspace that receives the conversation's shared files at run start; changes in it are written back at run end. Default files."
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "Use a relative path with forward slashes and no \".\" or \"..\" segments.",
  "FileTooLarge": "The file is larger than the FileSpaces.MaxFileBytes setting allows.",
  "FileSpaceFull": "The file space would grow past the FileSpaces.MaxTotalBytes setting.",
  "TooManyFiles": "The file space already holds as many files as the FileSpaces.MaxFiles setting allows.",
  "StaleFileUpload": "The run no longer holds its lease, so its file changes were not written."
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "Use a relative path with forward slashes and no \".\" or \"..\" segments."
  },
  "serverText": {
   "fileSpaceFileTooLarge": "File {{path}} is {{size}} bytes; the limit is {{limit}} bytes (FileSpaces.MaxFileBytes).",
   "fileSpaceFull": "The file space would hold more than {{limit}} bytes (FileSpaces.MaxTotalBytes).",
   "fileSpaceTooManyFiles": "The file space already holds {{count}} files (FileSpaces.MaxFiles).",
   "fileNotFound": "File {{path}} was not found."
  }
 },
 "components": {
  "files": {
   "title": "Files",
   "summary": "Shared files: {{count}} ({{size}})",
   "live": "Live",
   "polling": "Polling",
   "includeDeleted": "Show deleted files",
   "refresh": "Refresh",
   "spaceId": "File space {{id}}",
   "emptyTitle": "No files yet",
   "emptyBody": "Files that turns write into the shared folder, or that you upload below, show up here.",
   "emptyBodyDeleted": "Nothing has been written to this conversation's shared folder, not even a file that was later deleted.",
   "columns": {
    "path": "Path",
    "currentVersion": "Version",
    "sizeBytes": "Size",
    "mediaType": "Media type",
    "lastUpdateUtc": "Updated",
    "actions": "Actions"
   },
   "deleted": "Deleted",
   "version": "v{{number}}",
   "versions": "Versions",
   "download": "Download",
   "deleteLabel": "Delete {{path}}",
   "deletedToast": "Deleted {{path}}. Its versions are kept.",
   "deleteTitle": "Delete file",
   "confirmDelete": "Delete {{path}} from the shared files? Later turns will not see it. Its versions are kept, and you can still download them.",
   "versionsTitle": "Versions of {{path}}",
   "noVersions": "This file has no versions.",
   "current": "Current",
   "versionColumns": {
    "number": "Version",
    "sizeBytes": "Size",
    "mediaType": "Media type",
    "sha256": "SHA-256 digest",
    "writtenBy": "Written by",
    "createdUtc": "Written",
    "actions": "Actions"
   },
   "preview": "Preview",
   "previewTitle": "{{path}} (version {{number}})",
   "emptyFile": "This version is empty.",
   "uploadTitle": "Upload files",
   "uploadHint": "Choose one or more files and check their paths. A path that matches a listed file adds a new version of it. If a turn changed that file after the list loaded, your upload is kept next to it under a conflict name instead of replacing it.",
   "uploadCreated": "Added {{path}} as version {{version}}.",
   "uploadReplaced": "Saved {{path}} as version {{version}}.",
   "uploadConflict": "{{requested}} changed after the list loaded, so your upload was kept as {{path}}. Compare the two files and delete the one you do not need.",
   "chooseFiles": "Files to upload",
   "uploadColumns": {
    "path": "Path in the shared folder",
    "replaces": "Replaces",
    "size": "Size",
    "actions": "Remove"
   },
   "replacesVersion": "Version {{version}}",
   "newFile": "New file",
   "removeFile": "Remove this file from the upload",
   "upload": "Upload",
   "uploading": "Uploading...",
   "limitSetting": "The limit is set by the {{setting}} server setting."
  }
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
})(en, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "Capabilities",
    "tip": "The capability catalog: agents, MCP tools, and harness built-ins that orchestrating agents can find and use, with cost and latency hints."
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Agent",
   "McpTool": "MCP tool",
   "HarnessBuiltIn": "Harness built-in"
  },
  "capabilityOrigin": {
   "Derived": "Derived",
   "Manual": "Manual"
  },
  "capabilityHintStatus": {
   "Unknown": "Unknown",
   "Known": "Known"
  },
  "runBlockedReason": {
   "NoToolWorker": "No worker with the tool"
  },
  "resourceType": {
   "ConversationFileSpace": "Conversation file space",
   "Capability": "Capability"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "A schema is not a valid JSON Schema. Fix the input or output schema and save again.",
  "NameConflict": "Another manual capability already uses this name. Choose a different name.",
  "CapabilityDerived": "This capability is derived from its source and follows it, so it cannot be edited or deleted here. Change the source instead.",
  "InvalidTags": "Use at most 32 tags, each 1 to 64 characters.",
  "TooManyRequirements": "Use at most 16 node label requirements."
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "This is not a valid JSON Schema.",
   "InvalidTags": "Use at most 32 tags, each 1 to 64 characters.",
   "TooManyRequirements": "Use at most 16 node label requirements."
  },
  "serverText": {
   "capabilityDerivedEdit": "Capability {{name}} is derived from its source and follows it. Change the source instead.",
   "capabilityDerivedDelete": "Capability {{name}} is derived from its source and goes away with it, so it cannot be deleted directly.",
   "capabilityShared": "Capability {{name}} is shared by every tenant and comes from a built-in harness profile, so it cannot be changed.",
   "capabilityNameConflict": "A manual capability named {{name}} already exists.",
   "capabilitySecretsDenied": "You may not use the secrets that MCP server {{server}} sends, so its tools were not listed.",
   "capabilityNoStdioWorker": "No Ready worker has stdio MCP diagnostics turned on (GARRISON_WORKER_MCP_TESTS_ENABLED), so the stdio server's tools could not be listed.",
   "capabilityRefreshFailed": "Refresh failed at {{when}}: {{error}}",
   "capabilityMissingTools": "Required tools are missing: {{tools}}.",
   "capabilityProbeShadowed": "Workers probe {{name}} as {{probe}}, which another harness profile defined first. This profile's definition is not probed."
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "This run's agent uses {{tools}}, and no Ready worker that can run {{harness}} reports it. Install the tool on a worker host so its probe reports the node label garrison.io/tool-{name}=true, or add that label to a worker by hand."
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "Capabilities"
   }
  },
  "capabilities": {
   "noSource": "Manual entry",
   "shared": "Shared",
   "hintsLine": "Median {{median}}, p90 {{p90}}, {{cost}} per run",
   "hintsLineNoCost": "Median {{median}}, p90 {{p90}}, no cost recorded",
   "hintsTitle": "Cost and latency hints",
   "noCost": "No cost recorded",
   "windowDays_one": "{{count}} day",
   "windowDays_other": "{{count}} days",
   "refreshWarning": "The last refresh of this entry's source failed.",
   "requirementsTitle": "Node labels a run needs",
   "noRequirements": "None. Runs that use this capability can go to any worker.",
   "noSchema": "No schema",
   "fields": {
    "kind": "Kind",
    "origin": "Origin",
    "source": "Source",
    "lastRefreshedUtc": "Last refreshed",
    "tags": "Tags",
    "id": "ID",
    "summary": "Summary",
    "hintStatus": "Status",
    "sampleSize": "Runs summarized",
    "medianDurationMs": "Median duration",
    "p90DurationMs": "p90 duration",
    "meanCostUsd": "Mean cost",
    "windowDays": "Window",
    "computedUtc": "Computed",
    "inputSchema": "Input schema",
    "outputSchema": "Output schema"
   },
   "refreshTitle": "Refresh the capability catalog",
   "refreshHint": "Garrison derives agent and harness built-in entries again, lists the tools of each MCP server (stdio servers through a worker with stdio diagnostics turned on), and recomputes agent hints. Listing a server sends it the secrets its templates name, so you need permission to use them.",
   "refreshServer": "MCP servers to list",
   "refreshAll": "Every active MCP server",
   "refreshRun": "Refresh now",
   "refreshing": "Refreshing...",
   "refreshDone": "The capability catalog is up to date.",
   "refreshPartial_one": "The catalog was refreshed, but {{count}} MCP server could not be listed.",
   "refreshPartial_other": "The catalog was refreshed, but {{count}} MCP servers could not be listed.",
   "refresh": {
    "agents": "Agent entries changed",
    "harnessBuiltIns": "Built-in entries changed",
    "hints": "Hints recomputed",
    "servers": "MCP servers listed",
    "tools": "Tool entries written",
    "removed": "Tool entries removed",
    "failed": "Servers that failed",
    "noServers": "No MCP server was listed.",
    "failedBadge": "Failed",
    "listedBadge": "Listed",
    "columns": {
     "server": "MCP server",
     "status": "Result",
     "tools": "Tools",
     "removed": "Removed",
     "warned": "Kept with a warning",
     "error": "Error"
    }
   },
   "errors": {
    "nameLength": "Use 1 to {{max}} characters.",
    "summaryLength": "Use at most {{max}} characters.",
    "tags": "Use at most {{max}} tags, each 1 to {{length}} characters.",
    "requirementCount": "Use at most {{max}} node label requirements.",
    "requirement": "Every requirement needs a node label key of 1 to {{max}} characters.",
    "toolNeedsServer": "Choose the MCP server the tool belongs to.",
    "probeCount": "A harness profile has at most {{max}} tool probes.",
    "probeName": "The tool name is 1 to 63 lowercase letters, digits, dots, and hyphens, starting with a letter or digit.",
    "probeDuplicate": "Another probe in this profile is named {{name}}.",
    "probeExecutable": "The executable is a bare file name found on the PATH (letters, digits, dots, underscores, plus signs, and hyphens), with no folder.",
    "probeArgument": "Choose no argument or one of {{allowed}}.",
    "probeDescription": "Use at most {{max}} characters."
   },
   "draftTitle": "Capabilities",
   "draftSave": "Save draft",
   "draftSaved": "Saved the capabilities on draft revision {{number}}.",
   "draftEdit": "Changes the capabilities of draft revision {{number}}. Everything else in the draft stays as it is.",
   "draftNew": "There is no open draft. Saving starts a new draft from published revision {{number}} with these capabilities.",
   "draftPlacementHint": "A harness built-in named here adds its node label to this agent's runs, so they only go to workers that reported the tool.",
   "draftEmpty": "This revision uses no capabilities.",
   "notInCatalog": "Not in the catalog",
   "removeName": "Remove {{name}}",
   "chooseName": "Choose a capability",
   "nameOption": "{{name}} ({{kinds}})",
   "addName": "Add capability",
   "newDraftButton": "Choose capabilities in a new draft",
   "editDraft": "Capabilities"
  }
 },
 "resources": {
  "capabilities": {
   "title": "Capabilities",
   "subtitle": "Agents, MCP tools, and harness built-ins that orchestrating agents can find and use, with cost and latency hints.",
   "add": "Add capability",
   "create": "Create capability",
   "edit": "Edit capability",
   "view": "Capability details",
   "deleteTitle": "Delete capability",
   "emptyTitle": "No capabilities yet",
   "emptyBody": "Publish an agent revision, register an MCP server, or add a tool probe to a harness profile, then refresh. You can also add a manual entry.",
   "columns": {
    "name": "Name",
    "kind": "Kind",
    "origin": "Origin",
    "summary": "Summary",
    "source": "Source",
    "hints": "Hints",
    "tags": "Tags",
    "lastRefreshedUtc": "Last refreshed",
    "id": "ID",
    "createdUtc": "Created"
   },
   "fields": {
    "name": "Name",
    "kind": "Kind",
    "summary": "Summary",
    "sourceAgentId": "Agent it stands for",
    "sourceMcpServerId": "MCP server it belongs to",
    "sourceToolName": "Tool name on that server",
    "tags": "Tags",
    "requirements": "Node labels a run needs",
    "inputSchema": "Input schema",
    "outputSchema": "Output schema"
   },
   "hints": {
    "kind": "Manual entries can be of any kind, for example a conversion service that agents reach through a skill.",
    "requirements": "A run of an agent that uses this capability goes only to workers with every one of these node labels.",
    "sourceMcpServerId": "Optional. A run token sees an entry that names a server only when its deployment binds that server.",
    "inputSchema": "A JSON Schema, for example {\"type\": \"object\"}. Leave empty when the capability takes free text."
   },
   "tagFilter": "Tag",
   "refresh": "Refresh",
   "warningBadge": "Refresh failed",
   "warnings_one": "{{count}} entry kept its last good content because the last refresh of its source failed. Open it to see why.",
   "warnings_other": "{{count}} entries kept their last good content because the last refresh of their source failed. Open one to see why.",
   "noSourceOption": "None",
   "requirementKey": "Node label",
   "requirementValue": "Value"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "Tool probes",
    "probeName": "Tool name",
    "probeExecutable": "Executable",
    "probeArgument": "Argument",
    "probeDescription": "Description"
   },
   "columns": {
    "toolProbes": "Tool probes"
   },
   "hints": {
    "toolProbes": "Tools this harness can use when the worker host has them. Workers run each probe before they register and report the tools that answer as node labels garrison.io/tool-{name}=true."
   },
   "addToolProbe": "Add tool probe",
   "probeNoArgument": "No argument"
  }
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
})(en, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "Running",
   "Joined": "Joined",
   "TimedOut": "Timed out",
   "BudgetExceeded": "Over budget",
   "Cancelled": "Cancelled"
  },
  "fanOutJoinPolicy": {
   "All": "All",
   "Any": "Any",
   "Quorum": "Quorum"
  },
  "resourceType": {
   "FanOutGroup": "Fan-out group"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Fan-out group"
  }
 },
 "components": {
  "fanOut": {
   "group": "Fan-out group",
   "groupTitle": "Fan-out group {{id}}",
   "otherChildren": "Other child runs",
   "detailsUnavailable": "The group's details could not be loaded, so only its member runs are listed.",
   "policy": "Join policy",
   "quorumPolicy": "{{policy}}: {{quorum}} of {{total}}",
   "progress": "Progress",
   "progressValue": "{{finished}} of {{total}} finished, {{succeeded}} succeeded",
   "cost": "Cost",
   "tokens": "Tokens",
   "usedOf": "{{used}} of {{limit}}",
   "noLimit": "{{used}} (no limit)",
   "deadline": "Deadline",
   "noDeadline": "None",
   "started": "Started",
   "completed": "Ended",
   "pending": "Still running: {{labels}}",
   "failed": "Did not succeed: {{labels}}",
   "live": "Live",
   "polling": "Polling",
   "cancel": "Cancel group",
   "cancelTitle": "Cancel fan-out group",
   "confirmCancel": "Cancel fan-out group {{id}}? Members still running are cancelled, and the parent run sees the group as Cancelled.",
   "cancelledToast": "Fan-out group {{id}} was cancelled.",
   "columns": {
    "label": "Label",
    "agent": "Agent",
    "status": "Status",
    "costUsd": "Cost",
    "tokens": "Tokens",
    "run": "Run"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "The parent run finished or was cancelled.",
   "fanOutCostExceeded": "The members spent {{cost}} USD, over the budget of {{budget}} USD.",
   "fanOutTokensExceeded": "The members used {{tokens}} tokens, over the budget of {{budget}}.",
   "fanOutTimedOut": "The group's timeout of {{seconds}} seconds passed with {{running}} members still running.",
   "fanOutAnySucceeded": "A member succeeded.",
   "fanOutNoneSucceeded": "Every member finished and none succeeded.",
   "fanOutQuorumMet": "{{succeeded}} members succeeded, meeting the quorum of {{quorum}}.",
   "fanOutQuorumUnreachable": "Too many members failed for the quorum of {{quorum}} to be met.",
   "fanOutAllFinished": "Every member finished.",
   "fanOutCancelledByTool": "Cancelled by the parent run with garrison_cancel_fan_out.",
   "fanOutCancelledBy": "Cancelled by {{who}}."
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
})(en, {
 "nav": {
  "items": {
   "apps": {
    "label": "Apps",
    "tip": "Agentic apps: groups of agents behind one chat UI for end users, with their call graph, delegation, revisions, and shareable URL."
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Tenant users",
   "AppUsers": "App users",
   "Anonymous": "Anonymous"
  },
  "resourceType": {
   "AgenticApp": "Agentic app"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "Another app already uses this URL slug. Slugs are unique across the cluster, so choose a different one.",
  "NoPublishedRevision": "There is no published revision to use. Publish one first.",
  "AgentInUse": "This agent is a member of an agentic app. Remove it from the app first."
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "Use 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.",
   "InvalidSlug": "Use 2 to 63 lowercase letters, digits, and hyphens, starting with a letter or digit.",
   "UnknownAgent": "There is no such agent in this tenant.",
   "DuplicateMember": "Each agent can be a member only once.",
   "EntryNotMember": "The entry agent must be one of the members.",
   "EdgeNotMember": "Both ends of a call must be members of the app.",
   "SelfEdge": "A member cannot call itself.",
   "AppGraphCycle": "The calls between members form a cycle. Remove one of the calls in the loop.",
   "UnreachableMember": "Every member must be reachable from the entry agent through calls.",
   "UnreachableMemberNamed": "The entry agent cannot reach these members through calls: {{names}}. Add a call to each of them or remove them.",
   "UnknownEnvironment": "This environment does not exist in the tenant.",
   "InvalidEntryDeployment": "Choose a deployment of the entry agent in this environment.",
   "DuplicateEnvironment": "List each environment only once.",
   "InvalidColor": "Use a color in the form #RRGGBB, for example #1F6FEB.",
   "UnknownAsset": "There is no such agent asset in this tenant.",
   "Required": "This field is required.",
   "TooMany": "There are too many items here."
  },
  "serverText": {
   "appNameConflict": "An app named {{name}} already exists.",
   "appSlugTaken": "The URL slug {{slug}} is taken. Slugs are unique across the cluster, so choose another.",
   "appNoPublishedRevision": "App {{name}} has no published revision to promote.",
   "appMemberNotPublished": "Member {{name}} has no published revision to pin. Publish one first.",
   "appRevisionPublished": "Revision {{number}} of app {{name}} is already published.",
   "appNoTargetDeployments": "Member {{member}} has no deployment in environment {{environment}}. Create one there first. Nothing was promoted.",
   "agentInApps": "Agent {{agent}} is a member of {{apps}}. Remove it from the app first."
  }
 },
 "components": {
  "form": {
   "pickColor": "Pick a color for {{field}}"
  },
  "apps": {
   "graph": {
    "empty": "Add members to see the app's graph.",
    "summary": "App graph with {{members}} members and {{edges}} calls",
    "edgeFanOut": "{{caller}} calls {{callee}}, also several at once",
    "edgeSingle": "{{caller}} calls {{callee}}, one call at a time",
    "entryNode": "{{name}}, the entry agent",
    "unreachableNode": "{{name}}, which the entry agent cannot reach",
    "entry": "entry agent",
    "unreachable": "not reachable",
    "legendFanOut": "Calls in parallel allowed",
    "legendSingle": "One call at a time"
   },
   "share": {
    "noSlug": "Give the app a name or a URL slug to get its link.",
    "open": "Open",
    "copy": "Copy app URL",
    "inactive": "The app is inactive, so the link does not work until you turn it back on.",
    "signIn": {
     "TenantUsers": "Any active user of this tenant can sign in.",
     "AppUsers": "Only users who hold the AppUser role on this app can sign in.",
     "Anonymous": "Anyone with the link can use the app without signing in. Signed-in users still work.",
     "AnonymousDisabled": "Anonymous is chosen but not turned on, so nobody gets in without signing in, and only tenant users with access can sign in."
    }
   },
   "delegation": {
    "title": "Delegation from the app graph",
    "intro": "The app's calls are its delegation policy. Each member should allow exactly the members it calls, with a maximum depth that covers the longest chain below it. Members whose published revision says otherwise are drifting.",
    "apply": "Write drafts",
    "applying": "Writing drafts...",
    "applied": "Wrote {{drafts}} draft revisions; {{skipped}} members skipped.",
    "appliedSummary": "Wrote {{drafts}} draft revisions and published nothing. {{skipped}} members were skipped. Review and publish the drafts on each agent's Revisions tab.",
    "drifting_one": "{{count}} member's published delegation differs from the graph.",
    "drifting_other": "{{count}} members' published delegation differs from the graph.",
    "inSync": "Every member's published delegation matches the graph.",
    "empty": "This app has no members.",
    "notPublished": "Not published",
    "drift": "Drift",
    "inSyncBadge": "In sync",
    "draftConflict": "Draft conflict",
    "draft": "Draft {{number}}",
    "review": "The drafts are not live yet. Open each agent, review the draft on its Revisions tab, and publish it.",
    "columns": {
     "member": "Member",
     "desiredMode": "Graph mode",
     "desiredAllowList": "Graph allow list",
     "desiredMaxDepth": "Graph depth",
     "publishedMode": "Published mode",
     "publishedAllowList": "Published allow list",
     "publishedMaxDepth": "Published depth",
     "status": "Status"
    }
   },
   "revisions": {
    "title": "App revisions",
    "intro": "An app revision pins every member's latest published revision and copies the calls between them. Publish it, then promote it to move every member to the next environment together.",
    "changeNote": "Change note",
    "changeNotePlaceholder": "What changed since the last revision",
    "take": "Take revision",
    "taking": "Taking...",
    "taken": "Took app revision {{number}}.",
    "published": "Published app revision {{number}}.",
    "empty": "No app revisions yet. Take one when every member has a published revision.",
    "promote": "Promote",
    "publish": "Publish",
    "publishTitle": "Publish app revision {{number}}",
    "publishConfirm": "Publish revision {{number}} of {{name}}? A published revision cannot change, and it becomes the one promotions use by default.",
    "pin": "{{name}}, revision {{number}}",
    "columns": {
     "number": "Revision",
     "state": "State",
     "members": "Pinned members",
     "edges": "Calls",
     "author": "Author",
     "changeNote": "Change note",
     "publishedUtc": "Published",
     "actions": "Actions"
    }
   },
   "promote": {
    "title": "Promote app",
    "intro": "Every member's pinned revision goes to every deployment of that member in the target environment, in one step. If a member has no deployment there, nothing moves.",
    "revision": "App revision",
    "latestRevision": "Latest published",
    "promoted": "Promoted the app to {{target}}: {{deployments}} deployments updated.",
    "denied": "You may not promote to {{target}}. Promoting needs Execute on Promotion for the target environment."
   }
  }
 },
 "resources": {
  "apps": {
   "title": "Apps",
   "subtitle": "Groups of agents behind one chat UI for end users. The entry agent talks to people and calls the other members along the app's calls.",
   "add": "Add app",
   "create": "Create app",
   "edit": "Edit app",
   "view": "App details",
   "deleteTitle": "Delete app",
   "emptyTitle": "No apps yet",
   "emptyBody": "Create an app from agents you already have: pick the members, the entry agent that talks to people, and who calls whom.",
   "columns": {
    "name": "Name",
    "url": "App URL",
    "entryAgentId": "Entry agent",
    "members": "Members",
    "liveEnvironment": "Live environment",
    "authMode": "Sign-in",
    "active": "Status",
    "description": "Description",
    "id": "ID",
    "lastUpdateUtc": "Updated",
    "createdUtc": "Created"
   },
   "fields": {
    "name": "Name",
    "slug": "URL slug",
    "description": "Description",
    "active": "Active",
    "members": "Members",
    "membersItems": {
     "agentId": "Agent",
     "role": "Role"
    },
    "entryAgentId": "Entry agent",
    "edges": "Calls between members",
    "edgesItems": {
     "callerAgentId": "Caller",
     "calleeAgentId": "Callee",
     "fanOutAllowed": "Parallel calls allowed"
    },
    "graph": "Graph",
    "environments": "Entry deployment per environment",
    "environmentsItems": {
     "environment": "Environment",
     "deploymentId": "Entry deployment"
    },
    "liveEnvironment": "Live environment",
    "authMode": "Who may use the app",
    "anonymousEnabled": "Allow anonymous use",
    "showOperatorDetail": "Show tool calls and thinking to end users",
    "share": "Shareable link",
    "displayName": "Display name",
    "logoAssetId": "Logo",
    "primaryColor": "Primary color",
    "accentColor": "Accent color",
    "welcomeText": "Welcome text"
   },
   "hints": {
    "slug": "The app lives at /apps/{slug}/. Leave empty to use the name. Slugs are unique across the cluster.",
    "members": "The agents in the app. The role is a short note on what each one does.",
    "entryAgentId": "The member that talks to end users. Every other member must be reachable from it.",
    "edges": "Who may call whom. The calls must not form a loop, and they become each member's delegation policy.",
    "environments": "The entry agent's deployment the app uses in each environment. Without one, the app uses the entry agent's first active deployment there, in name order.",
    "liveEnvironment": "The environment the app UI talks to.",
    "anonymousEnabled": "Needed for Anonymous sign-in. Anonymous sessions are short and rate limited.",
    "showOperatorDetail": "End users always see answers, results, and errors. Turn this on to also show tool calls, thinking, and progress.",
    "logoAssetId": "The first image in the asset's current version.",
    "welcomeText": "Shown to end users before they send their first message."
   },
   "steps": {
    "general": "App",
    "members": "Members and calls",
    "environments": "Environments",
    "access": "Sign-in and link",
    "branding": "Branding"
   },
   "actions": {
    "delegation": "Delegation",
    "revisions": "Revisions and promotion"
   },
   "errors": {
    "nameTaken": "Another app in this tenant already uses this name."
   },
   "addMember": "Add member",
   "addEdge": "Add call",
   "addEnvironment": "Add environment",
   "chooseAgent": "Choose an agent",
   "chooseEntry": "Choose a member",
   "rolePlaceholder": "What this member does",
   "noEntryDeployment": "First active deployment",
   "noLogo": "No logo",
   "displayNamePlaceholder": "Shown in the app's header"
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
})(en, {
 "nav": {
  "items": {
   "studio": {
    "label": "Studio",
    "tip": "Agent studio: design agents and apps in drafts with the agent architect, try them in the playground, and ask for a draft to be applied."
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "Studio draft"
  },
  "approvalKind": {
   "DraftApply": "Draft apply"
  },
  "studioDraftStatus": {
   "Open": "Open",
   "PendingApproval": "Pending approval",
   "Applied": "Applied",
   "Discarded": "Discarded"
  },
  "studioDraftOperation": {
   "Upsert": "Create or update",
   "Delete": "Delete"
  },
  "studioDiffChange": {
   "Create": "Create",
   "Update": "Update",
   "Delete": "Delete",
   "Unchanged": "Unchanged",
   "Failed": "Failed"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "The draft changed since you read it. Read it again and retry.",
  "DraftNotOpen": "The draft is not open, so it cannot change. Only an open draft takes edits.",
  "DraftStale": "Live configuration changed after the draft was based on it. Rebase the stale items and request apply again.",
  "DraftInvalid": "The draft has documents that do not validate. Fix the items marked Failed first.",
  "DraftEmpty": "The draft holds no items, so there is nothing to apply.",
  "ApproverLacksPermission": "You may not allow this draft: allowing it needs Create on Manifest and Delete on each kind the draft deletes.",
  "AgentNotLive": "That agent is new in this draft. Apply the draft before trying the agent in the playground.",
  "NotAnArchitectDeployment": "Only architect deployments take an architect prompt: deployments of agent-architect or with draft access.",
  "InvalidArchitectPrompt": "That prompt cannot be an architect prompt. Choose a System template of this tenant.",
  "PromptTemplateInUse": "This prompt template is bound by deployments. Switch them to another template first.",
  "ReservedEnvironment": "The draft environment is reserved for the playground.",
  "NoDeploymentInEnvironment": "The agent has no deployment in that environment."
 },
 "views": {
  "studio": {
   "title": "Studio",
   "subtitle": "Design agents and apps in drafts. Nothing changes in live configuration until a person approves applying a draft.",
   "newDraft": "New draft",
   "refresh": "Refresh",
   "search": "Search titles",
   "scopeLabel": "Whose drafts",
   "scopes": {
    "mine": "Mine",
    "all": "All"
   },
   "statusLabel": "Status",
   "columns": {
    "title": "Title",
    "status": "Status",
    "owner": "Owner",
    "targetApp": "Target app",
    "items": "Items",
    "version": "Version",
    "updated": "Updated"
   },
   "open": "Open",
   "discard": "Discard",
   "discardTitle": "Discard draft",
   "discardMessage": "Discard {{title}}? A discarded draft can no longer change or be applied.",
   "discardPendingMessage": "Discard {{title}}? Its apply approval is cancelled, and the draft can no longer change or be applied.",
   "discarded": "Discarded {{title}}.",
   "emptyTitle": "No drafts",
   "emptyBody": "Start a draft, empty or from an existing app, and design it with the agent architect.",
   "emptyFiltered": "No drafts match these filters.",
   "untitled": "Untitled draft"
  },
  "studioDraft": {
   "title": "Studio draft",
   "notFoundTitle": "Draft not found",
   "notFoundBody": "The draft does not exist, or you may not read it.",
   "back": "All drafts",
   "version": "Version {{version}}",
   "live": "Live",
   "polling": "Polling",
   "architect": "Architect",
   "tabsLabel": "Draft workspace",
   "tabs": {
    "architect": "Architect",
    "items": "Items",
    "graph": "Graph",
    "apply": "Diff and apply",
    "playground": "Playground",
    "preview": "Compile preview",
    "prompts": "Architect prompt"
   },
   "notOpen": {
    "PendingApproval": "This draft waits for a decision on applying it, so it cannot change. Deny the approval or discard the draft to change it again.",
    "Applied": "This draft was applied to live configuration and can no longer change. Start a new draft for further changes.",
    "Discarded": "This draft was discarded and can no longer change.",
    "other": "This draft cannot change right now."
   },
   "liveNotice": "The draft moved to version {{version}} ({{status}}).",
   "liveChanged": "Changed: {{items}}.",
   "removedTag": "removed",
   "dismissNotice": "Dismiss"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "New draft",
    "intro": "A draft holds the manifest documents you and the agent architect edit. Start empty, or from an existing app with everything it references.",
    "titleField": "Title",
    "titlePlaceholder": "Research app with a writer",
    "fromApp": "Start from app",
    "emptyDraft": "Empty draft",
    "fromAppHint": "The app, its members, their deployments, prompts, and assets become items. Each remembers the live version it started from, so the studio notices later changes.",
    "create": "Create draft",
    "creating": "Creating...",
    "created": "Started draft {{title}}."
   },
   "architect": {
    "title": "New architect",
    "intro": "The agent architect designs agents and apps in your drafts. Give it a deployment: a harness profile, a model, and the prompt it works with. It edits only your drafts and never applies them.",
    "name": "Deployment name",
    "harnessProfile": "Harness profile",
    "chooseProfile": "Choose a harness profile",
    "model": "Model",
    "modelHint": "Leave empty to use the harness profile's default model.",
    "prompt": "Architect prompt",
    "defaultPrompt": "{{name}} (default)",
    "preview": "Prompt preview",
    "previewEmpty": "Choose a prompt to see it rendered.",
    "cloneLink": "Clone this prompt to change it",
    "noAgent": "This tenant has no agent named {{name}}, so no architect can be created. Ask an administrator.",
    "create": "Create architect",
    "creating": "Creating...",
    "created": "Created architect {{name}}."
   },
   "chat": {
    "title": "Architect",
    "architect": "Architect deployment",
    "chooseArchitect": "Choose an architect",
    "newArchitect": "New architect",
    "noArchitect": "There is no architect deployment yet. Create one to design with the agent architect.",
    "openConversation": "Open conversation",
    "newConversation": "New conversation",
    "you": "You",
    "architectSays": "Architect",
    "openRun": "Run",
    "thinking": "Working...",
    "empty": "Tell the architect what to build. The first message tells it which draft to work in.",
    "pickFirst": "Choose or create an architect to start.",
    "message": "Message",
    "placeholder": "Design a research app: a planner that fans out to two researchers and a writer.",
    "firstHint": "Starts a conversation with this architect about this draft.",
    "continueHint": "Continues the conversation. Ctrl+Enter or Cmd+Enter sends.",
    "send": "Send"
   },
   "items": {
    "title": "Items",
    "titleCount": "Items ({{total}})",
    "add": "Add item",
    "addConfirm": "Open editor",
    "columns": {
     "kind": "Kind",
     "name": "Name",
     "operation": "Operation",
     "stale": "Stale",
     "updated": "Updated"
    },
    "stale": "Stale",
    "empty": "No items yet. Add one, or ask the architect.",
    "remove": "Remove",
    "removeTitle": "Remove item",
    "removeMessage": "Remove {{item}} from the draft? Live configuration does not change.",
    "removed": "Removed {{item}}.",
    "saved": "Saved {{item}}. The draft is at version {{version}}.",
    "editorTitle": "Edit {{item}}",
    "newEditorTitle": "New item {{item}}",
    "document": "Manifest document",
    "versionHint": "Saving sends version {{version}}, the one you read. If the draft changed since, the save is refused and your text stays here.",
    "unsaved": "Unsaved changes",
    "errors": {
     "name": "Use letters, digits, dots, slashes, and hyphens, starting with a letter or digit.",
     "exists": "The draft already holds {{kind}}/{{name}}.",
     "deleteKind": "Only Agent, Deployment, Pipeline, and AgenticApp items can be deleted, not {{kind}}."
    },
    "conflict": {
     "title": "The draft changed while you edited it: version {{from}} is now {{to}}.",
     "added": "Added: {{items}}",
     "updated": "Edited: {{items}}",
     "removed": "Removed: {{items}}",
     "status": "Its status is now {{status}}.",
     "layout": "Only its graph layout changed.",
     "mine": "The item you are editing changed too. Compare your text with the new version before you save again.",
     "retry": "Your text is still in the editor. Save again to apply it to the new version.",
     "dismiss": "Dismiss"
    }
   },
   "graph": {
    "title": "Graph",
    "empty": "The draft holds no apps or agents to draw yet.",
    "depth": "depth {{depth}}",
    "entryAgent": "Entry agent: {{name}}",
    "deleted": "Deleted",
    "inDraft": "In draft",
    "loose": "Agents in no app",
    "capabilities": "Capabilities: {{list}}",
    "legend": "Each call is labelled with the delegation depth it needs. A solid line allows parallel calls, a dashed line one call at a time. Capabilities appear under an agent's name."
   },
   "diff": {
    "title": "Diff and apply",
    "refresh": "Refresh diff",
    "validate": "Validate",
    "validating": "Validating...",
    "requestApply": "Request apply",
    "requesting": "Requesting...",
    "requested": "Apply requested. A person who may apply manifests decides it.",
    "valid": "Valid: {{create}} to create, {{update}} to update, {{delete}} to delete, {{unchanged}} unchanged.",
    "invalid": "Not valid: {{failed}} failed and {{stale}} stale. Planned: {{create}} to create, {{update}} to update, {{delete}} to delete, {{unchanged}} unchanged.",
    "validOk": "The draft is valid.",
    "validFailed": "The draft is not valid. See the items marked Failed or Stale.",
    "empty": "The draft holds no items to compare.",
    "columns": {
     "item": "Item",
     "change": "Change",
     "details": "Details"
    },
    "none": "(none)",
    "approval": "Apply approval",
    "allow": "Allow",
    "deny": "Deny",
    "allowed": "Allowed. The draft is being applied.",
    "denied": "Denied. The draft is open again.",
    "reason": "Reason",
    "reasonPlaceholder": "Optional, kept with the decision",
    "waiting": "Waiting for a person who may decide approvals and apply manifests.",
    "applied": "Applied as manifest apply {{id}}."
   },
   "playground": {
    "title": "Playground",
    "intro": "Each turn saves the draft's document for the agent as its draft revision and runs it on a temporary playground deployment. Nothing is published, and live configuration does not change.",
    "agent": "Agent",
    "defaultAgent": "Entry agent ({{name}})",
    "defaultAgentShort": "Entry agent",
    "input": "Input",
    "answer": "Answer",
    "placeholder": "What should the agent do?",
    "firstHint": "Starts a playground conversation.",
    "continueHint": "Continues the playground conversation.",
    "send": "Run turn",
    "turn": "Turn {{number}}, {{agent}}",
    "openRun": "Run detail",
    "conversation": "Conversation",
    "export": "Download transcript",
    "reset": "New conversation",
    "empty": "No turns yet.",
    "exportDraft": "Draft",
    "exportTurn": "Turn",
    "exportRun": "Run"
   },
   "preview": {
    "title": "Compile preview",
    "intro": "See what a run would start with before you deploy: the command line, where assets are placed, and the file space mount. Secret values are redacted.",
    "deployment": "Deployment",
    "chooseDeployment": "Choose a deployment",
    "revision": "Agent revision",
    "deploymentRevision": "The deployment's own revision",
    "revisionOption": "Revision {{number}} ({{state}})",
    "environment": "Environment",
    "deploymentEnvironment": "The deployment's environment",
    "input": "Sample input",
    "compiled": "Compiled {{deployment}} with {{revision}}.",
    "assets": "Placed assets ({{total}})",
    "noAssets": "The revision places no assets.",
    "columns": {
     "path": "Path",
     "asset": "Asset",
     "kind": "Kind",
     "version": "Version",
     "size": "Size"
    },
    "fileSpace": "File space",
    "fileSpaceMount": "Mounted at {{path}} with {{files}} files now (at most {{maxFiles}} files of up to {{maxBytes}} each).",
    "noFileSpace": "No file space is mounted, because the run would not be part of a conversation.",
    "redacted": "The server redacts secret values in the command line, the environment, and the files."
   },
   "prompts": {
    "title": "Architect prompt",
    "templatesLink": "Open in Prompt Templates",
    "forArchitect": "Prompts the agent architect can use. Select one for {{architect}}.",
    "noArchitect": "Prompts the agent architect can use. Choose an architect on the Architect tab to select one for it.",
    "nextTurn": "A new selection or a saved edit takes effect on the architect's next turn.",
    "current": "{{architect}} uses {{name}}, following its current version ({{version}}).",
    "currentPinned": "{{architect}} uses {{name}}, pinned to version {{version}}.",
    "inUse": "{{name}} cannot be deleted while deployments use it: {{deployments}}. Select another prompt for them first.",
    "empty": "No architect prompts.",
    "columns": {
     "name": "Name",
     "description": "Description",
     "version": "Version",
     "usedBy": "Used by"
    },
    "default": "Default",
    "selectedBadge": "Selected",
    "usedBy": "Architects: {{total}}",
    "select": "Select",
    "selected": "{{architect}} uses {{name}} from its next turn.",
    "saved": "Saved {{name}} as a new version.",
    "editorTitle": "Edit {{name}} (version {{version}})",
    "name": "Name",
    "description": "Description",
    "body": "Prompt body",
    "preview": "Rendered preview",
    "deleteMessage": "Delete {{name}}? Architect deployments that use it: {{total}}. A prompt in use cannot be deleted."
   }
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
})(en, {
 "components": {
  "studio": {
   "canvas": {
    "title": "Canvas",
    "appPicker": "App",
    "flowLabel": "Canvas of app {{app}}",
    "noApp": "The draft holds no app yet. Ask the architect for one, or start a draft from an existing app.",
    "calls": "Calls ({{total}})",
    "noCalls": "No calls yet. Drag from an agent's right edge to another agent, or press C on one agent and Enter on the other.",
    "addLoose": "Add to app",
    "remove": "Remove from app",
    "removeTitle": "Remove agent from app",
    "removeMessage": "Remove {{name}} from {{app}}? Its calls go too. The agent itself stays, and live configuration does not change until the draft is applied.",
    "operationFailed": "{{operation}} was refused.",
    "operations": {
     "AddMember": "Adding an agent",
     "RemoveMember": "Removing an agent",
     "Connect": "Connecting",
     "Disconnect": "Disconnecting",
     "SetEntry": "Setting the entry agent",
     "MoveNode": "Moving an agent"
    },
    "toolbar": {
     "label": "Canvas actions",
     "addAgent": "Add agent",
     "addPlaceholder": "Agent name",
     "role": "Role",
     "rolePlaceholder": "Role (optional)",
     "add": "Add",
     "connect": "Connect from",
     "setEntry": "Make entry agent",
     "remove": "Remove",
     "disconnect": "Disconnect",
     "fit": "Fit view"
    },
    "connectBar": {
     "message": "Connecting from {{name}}. Pick the agent it calls: click it, press Enter on it, or choose it here.",
     "to": "Calls",
     "fanOut": "Parallel calls",
     "confirm": "Connect"
    },
    "keys": {
     "title": "Keyboard shortcuts",
     "tab": "Tab moves through the agents in reading order, starting at the entry agent.",
     "select": "Enter or Space selects the focused agent and opens its properties.",
     "connect": "C on an agent starts a call from it; C or Enter on another agent finishes it.",
     "entry": "E makes the focused agent the entry agent.",
     "remove": "Delete removes the focused agent from the app, after a confirmation.",
     "move": "Arrow keys move a selected agent; hold Shift for bigger steps. The position is saved after a short pause.",
     "add": "N jumps to the Add agent field.",
     "calls": "In the list of calls, Enter selects a call, Delete disconnects it, and F switches parallel calls on or off.",
     "escape": "Escape cancels a call you started."
    },
    "node": {
     "entry": "Entry",
     "unreachable": "Unreachable",
     "connecting": "Calling from here"
    },
    "a11y": {
     "node": "Press Enter or Space to select this agent, then the arrow keys to move it. Press C to connect it, E to make it the entry agent, or Delete to remove it.",
     "edge": "A call between two agents. Select it in the list of calls below the canvas.",
     "handle": "Connection point",
     "moved": "Moved the agent {{direction}}. New position: {{x}}, {{y}}.",
     "directions": {
      "up": "up",
      "down": "down",
      "left": "left",
      "right": "right"
     }
    },
    "announce": {
     "added": "Added {{name}} to {{app}}.",
     "connectStart": "Connecting from {{name}}. Move to the agent it calls and press Enter, or press Escape to cancel.",
     "connectCancelled": "Connection cancelled.",
     "connected": "{{from}} now calls {{to}}.",
     "disconnected": "{{from}} no longer calls {{to}}.",
     "fanOutOn": "{{from}} may now call {{to}} in parallel.",
     "fanOutOff": "{{from}} now calls {{to}} one at a time.",
     "entry": "{{name}} is now the entry agent of {{app}}.",
     "removed": "Removed {{name}} from {{app}}.",
     "selfEdge": "An agent cannot call itself. Pick another agent."
    },
    "summary": {
     "noApp": "There is no app to describe.",
     "agents_one": "App {{app}} has {{count}} agent.",
     "agents_other": "App {{app}} has {{count}} agents.",
     "callCount_one": "There is {{count}} call between them.",
     "callCount_other": "There are {{count}} calls between them.",
     "entry": "The entry agent is {{name}}.",
     "noEntry": "No entry agent is set.",
     "callParallel": "{{from}} calls {{to}}, parallel calls allowed, delegation depth {{depth}}.",
     "callSingle": "{{from}} calls {{to}}, one call at a time, delegation depth {{depth}}."
    },
    "conflict": {
     "mine": "{{item}} changed too. Your edit is still in the panel; compare it with the new version before you save again.",
     "kept": "Your edit of {{item}} is still in the panel. Save again to apply it to the new version.",
     "operation": "{{operation}} was not applied. Try again on the new version, or leave it.",
     "retry": "Try again"
    },
    "panel": {
     "label": "Properties",
     "tabsLabel": "Properties of {{name}}",
     "properties": "Agent",
     "runtime": "Runtime",
     "save": "Save to draft",
     "reset": "Undo changes",
     "saved": "Saved {{item}}. Diff and apply shows the change.",
     "check": "The server's check of this item: {{message}}",
     "unparsable": "The item's YAML does not parse, so the panel cannot change it. Fix it on the Items tab first. ({{message}})"
    },
    "agent": {
     "title": "Agent {{name}}",
     "isEntry": "This is the app's entry agent: it talks to the people using the app.",
     "notHeld": "The draft does not hold {{name}}'s document yet. Bring it in to edit it here; live configuration does not change.",
     "deleted": "The draft deletes {{name}}. Put it back on the Items tab to edit it.",
     "bring": "Bring into draft",
     "description": "Description",
     "inputSchema": "Input schema",
     "outputSchema": "Output schema",
     "schemaHint": "JSON Schema as JSON. Leave it empty for plain text.",
     "assets": "Assets",
     "noAssets": "The next revision pins no assets.",
     "assetsKept": "The document names no assets, so the agent keeps the ones it has.",
     "assetName": "Asset name",
     "assetVersion": "Version",
     "latest": "Latest",
     "removeAsset": "Remove asset {{name}}",
     "addAsset": "Add asset",
     "capabilities": "Capabilities",
     "capabilitiesHint": "Separate names with commas. An empty list clears them.",
     "capabilitiesKept": "Separate names with commas. Left empty, the agent keeps the capabilities it has.",
     "systemPrompt": "System prompt",
     "noDeployments": "The draft holds no deployment of this agent, so no System prompt is set here.",
     "promptLine": "{{environment}}: {{deployment}} uses {{prompt}}",
     "builtInPrompt": "the built-in default",
     "showRuntime": "Edit on the Runtime tab",
     "errors": {
      "json": "This is not valid JSON.",
      "object": "A schema is a JSON object, such as {\"type\": \"object\"}.",
      "version": "Use a whole number, or leave it empty for the latest version."
     }
    },
    "edge": {
     "title": "Call from {{from}} to {{to}}",
     "from": "Caller",
     "to": "Callee",
     "depth": "Delegation depth",
     "depthHint": "Derived from the graph: one plus the longest chain of calls below {{to}}. It changes when calls below it change.",
     "fanOut": "Parallel calls (fan-out)",
     "fanOutOn": "{{from}} may start several calls to {{to}} at once.",
     "fanOutOff": "{{from}} calls {{to}} one at a time."
    },
    "app": {
     "title": "App {{name}}",
     "hint": "Select an agent or a call on the canvas to edit it. With nothing selected, this panel edits the app.",
     "entry": "Entry agent",
     "noEntry": "No entry agent",
     "noMembers": "Add an agent first; the first one becomes the entry agent.",
     "notHeld": "The draft does not hold {{name}}'s document yet. Bring it in to edit its sign-in and branding here.",
     "deleted": "The draft deletes {{name}}. Put it back on the Items tab to edit it.",
     "bring": "Bring into draft",
     "description": "Description",
     "authMode": "Sign-in",
     "authDefault": "Server default",
     "anonymous": "Allow anonymous use",
     "branding": "Branding",
     "brandingFields": {
      "displayName": "Display name",
      "logo": "Logo asset",
      "primaryColor": "Primary color",
      "accentColor": "Accent color",
      "welcomeText": "Welcome text"
     },
     "errors": {
      "color": "Use a hex color such as #1F6FEB."
     }
    },
    "runtime": {
     "title": "Runtime of {{name}}",
     "none": "The draft holds no deployment of {{name}}. Bring a live one in below, or ask the architect for one.",
     "deployment": "Environment and deployment",
     "option": "{{environment}}: {{name}}",
     "scope": "Edits change only {{name}} in {{environment}} (harness profile {{profile}}). Other environments keep their own values.",
     "fields": {
      "model": "Model",
      "effort": "Effort",
      "timeoutSeconds": "Time limit (seconds)",
      "maxTurns": "Maximum turns",
      "maxBudgetUsd": "Budget (USD)",
      "systemTemplate": "System prompt template",
      "systemVersion": "Pinned version",
      "approvalsEnabled": "Ask for approval of tool calls",
      "approvalDefaultAction": "When no rule matches"
     },
     "hints": {
      "timeoutSeconds": "Whole seconds, 1 or more. Empty uses the harness profile's limit.",
      "maxTurns": "Whole number, 1 or more. Empty means the harness decides.",
      "maxBudgetUsd": "0 or more, for example 2.50. Empty means no budget."
     },
     "builtIn": "Built-in default",
     "approvals": "Approvals",
     "noRules": "No rules. Every tool call gets the default action.",
     "rule": {
      "action": "Action",
      "pattern": "Tool pattern",
      "inputPattern": "Input pattern",
      "inputPlaceholder": "Input pattern (optional)",
      "remove": "Remove rule {{number}}",
      "add": "Add rule"
     },
     "live": "Live deployments not in the draft",
     "noLive": "Every live deployment of this agent is already in the draft, or it has none.",
     "bring": "Bring into draft",
     "exportMissing": "The export of {{name}} came back without its document.",
     "errors": {
      "integer": "Use a whole number of 1 or more.",
      "number": "Use a number of 0 or more.",
      "pattern": "A rule needs a tool pattern.",
      "version": "Use a whole number, and name a template to pin."
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "That agent is not a member of the app.",
   "SelfEdge": "An agent cannot call itself.",
   "NoSuchEdge": "The app has no such call.",
   "AppDeleted": "The draft deletes this app. Put it back first.",
   "InvalidDocument": "The document does not parse as one manifest document.",
   "DocumentMismatch": "The document's kind or name does not match the item."
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
})(en, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "Or open Agent Studio and describe what you need: the agent architect drafts it for you to review.",
   "openStudio": "Open Agent Studio"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "Agent Studio"
   },
   "serverInfo": {
    "label": "About",
    "tip": "Product, versions, links, endpoints, and your identity"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "Agent Studio"
  },
  "welcomeItemStudio": "Give the agent architect a harness and model, so it can design agents and apps with you in Agent Studio (optional).",
  "studioBody": "The agent architect designs agents and apps with you in Agent Studio. Choose the harness profile and model it runs on, and the architect prompt that guides it. Its deployment may only edit your studio drafts. You can skip this step and create an architect later from the studio.",
  "createArchitect": "Create the architect",
  "architectCreated": "Agent architect {{name}} created.",
  "architectReady": "The agent architect {{name}} is ready. After setup, open Agent Studio and start a draft with it.",
  "continue": "Continue"
 },
 "views": {
  "home": {
   "getStartedBody": "The setup wizard adds a credential, gives the agent architect a harness and model, applies a sample agent, and runs a test. Or open Agent Studio and describe the app you want.",
   "openStudio": "Open Agent Studio"
  },
  "studio": {
   "title": "Agent Studio"
  },
  "studioDraft": {
   "tabs": {
    "release": "Release"
   }
  },
  "serverInfo": {
   "title": "About",
   "subtitle": "Versions, links, endpoints, and the identity you are signed in with.",
   "positioning": "Build, deploy, and run agentic apps on the agent harnesses you already use.",
   "versions": "Server version {{server}}, dashboard version {{dashboard}}",
   "docs": "Documentation",
   "studioDocs": "Agent Studio guide",
   "website": "Website",
   "source": "Source code"
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Environments"
   }
  }
 },
 "components": {
  "apps": {
   "release": {
    "title": "Environments and promotion",
    "intro": "Each member's deployments per environment, with the revision each one pins and its environment overrides. Compare two environments before you promote, and roll a promotion back from the history.",
    "live": "Live in {{environment}}",
    "environments": "Environments",
    "source": "Compare",
    "target": "with",
    "member": "Member",
    "entry": "Entry",
    "noDeployment": "No deployment",
    "secretOverride": "{{name}} (secret)",
    "difference": "{{source}} to {{target}}",
    "differenceNone": "Difference",
    "diff": {
     "Same": "Same",
     "Missing": "No deployment in {{target}}",
     "revisions": "Revisions differ",
     "overrides": "Overrides differ",
     "both": "Revisions and overrides differ"
    },
    "promote": "Promote {{source}} to {{target}}",
    "promoteNothing": "Promote",
    "missing": "No deployment in {{target}}: {{names}}. Promoting now would fail and move nothing; add a deployment there first.",
    "history": "Promotion history",
    "historyEmpty": "This app has not been promoted yet."
   }
  },
  "studio": {
   "release": {
    "title": "Release",
    "app": "App",
    "noAppsTitle": "This draft builds no app",
    "noAppsBody": "Add an app to the draft, on the Graph tab or by asking the architect, to promote it from here once it is applied.",
    "notLiveTitle": "{{name}} is not live yet",
    "notLiveBody": "Apply the draft first. Applying publishes its agents and deploys them to dev; then you can promote the app from here."
   }
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
})(en, {
 "nav": {
  "items": {
   "architects": {
    "label": "Architects",
    "tip": "Agent architects: reusable deployments of the agent architect that design agents and apps with you in any studio draft."
   }
  }
 },
 "resources": {
  "architects": {
   "title": "Architects",
   "subtitle": "The agent architects in this tenant. Each one is a deployment of agent-architect with its own harness profile, model, and prompt, and any studio draft can use it.",
   "add": "Add architect",
   "create": "Create architect",
   "edit": "Edit architect",
   "view": "Architect details",
   "deleteTitle": "Delete architect",
   "emptyTitle": "No architects yet",
   "emptyBody": "Create an architect to design agents and apps with you in Agent Studio. Pick the harness profile and model it runs on, and the prompt it works with.",
   "columns": {
    "name": "Name",
    "harnessProfileId": "Harness profile",
    "model": "Model",
    "architectPromptTemplateId": "Architect prompt",
    "active": "Status",
    "description": "Description",
    "id": "ID",
    "lastUpdateUtc": "Updated",
    "createdUtc": "Created"
   },
   "fields": {
    "name": "Name",
    "description": "Description",
    "harnessProfileId": "Harness profile",
    "model": "Model",
    "architectPromptTemplateId": "Architect prompt",
    "architectPromptVersion": "Pinned prompt version",
    "active": "Active"
   },
   "hints": {
    "model": "Leave empty to use the harness profile's default model.",
    "architectPromptVersion": "Leave empty to always use the prompt's current version."
   },
   "actions": {
    "prompts": "Architect prompts",
    "deployment": "Deployment settings"
   },
   "errors": {
    "nameTaken": "Another deployment in this tenant already uses this name.",
    "version": "Enter a whole number from 1, or leave it empty."
   },
   "promptPinned": "{{name}} (version {{version}})",
   "defaultModel": "Profile default",
   "defaultBadge": "Default",
   "promptsTitle": "Architect prompts for {{name}}"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "Manage architects"
   }
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
})(en, {
 "components": {
  "confirm": {
   "typeToConfirm": "Please type '{{word}}' in the box below to confirm."
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "Deleted agent {{name}}."
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
})(en, {
 "components": {
  "studio": {
   "architect": {
    "credential": "Credential",
    "noCredential": "None",
    "credentialOption": "{{name}} ({{kind}})"
   },
   "chat": {
    "notCredentialedTitle": "The architect could not sign in to its model provider",
    "notCredentialedBody": "Authentication failed for {{architect}}. Check the credential on its saved connection; the run error below explains the cause.",
    "noCredentialTitle": "This architect has no credential",
    "noCredentialBody": "{{architect}} runs on {{profile}}, which needs a secret to sign in. Without one, its turns fail with Not logged in. Choose a credential for it on the Architects page.",
    "fixCredential": "Fix the architect's credential",
    "openSecrets": "Open Secrets"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "Credential"
   },
   "fields": {
    "credentialSecretId": "Credential"
   },
   "noCredential": "None"
  }
 }
});

// Hints that say where a field's choices come from and link to that page (architect forms).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "components": {
  "dependencyHint": {
   "refresh": "Refresh list"
  },
  "architectHints": {
   "harness": "The built-in profiles (Claude Code, Codex, and others) are ready to use.",
   "harnessLink": "Open Agent Resources > Harnesses & Endpoints",
   "credentialNotNeeded": "{{profile}} needs no credential.",
   "credentialLink": "Open Platform Configuration > Secrets",
   "prompt": "A change applies on the architect's next turn.",
   "promptLink": "Open Agent Resources > Prompt Templates",
   "credentialNoProfile": "The secret the harness signs in with.",
   "credentialChosen": "The secret {{profile}} signs in with.",
   "credentialPick": "{{profile}} signs in with a secret of kind {{kinds}}. Choose one, or every turn fails with Not logged in.",
   "credentialAdd": "{{profile}} signs in with a secret of kind {{kinds}}, and this tenant has none yet. Add one on Platform Configuration > Secrets, then choose it here. Without it, every turn fails with Not logged in."
  }
 }
});

// The New architect dialog's introduction names the credential.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "components": {
  "studio": {
   "architect": {
    "intro": "The agent architect designs agents and apps in your drafts. Give it a harness profile, the secret it signs in with, a model, and the prompt it works with. It edits only your drafts and never applies them."
   }
  }
 }
});

// The setup wizard's Agent Studio step names the credential and where architects live.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "wizard": {
  "studioBody": "The agent architect designs agents and apps with you in Agent Studio. Choose the harness profile and model it runs on, the credential it signs in with (the secret you saved in the previous step is chosen for you when it fits the harness), and the architect prompt that guides it. Its deployment may only edit your studio drafts. You can skip this step and create an architect later on Agents > Architects."
 }
});

// Secrets: how to get the value for each kind (Create secret, Set value, and the setup wizard).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "components": {
  "secretGuide": {
   "title": "How to get the value for {{kind}}",
   "AnthropicApiKey": {
    "s1": "Sign in to the Anthropic Console and open Settings > API keys:",
    "s2": "Choose Create Key, give it a name such as garrison, and copy the key. It starts with sk-ant-api and is shown only once.",
    "s3": "Paste it into Value. Claude Code, opencode, pi, Mux, and the provider API harness receive it as ANTHROPIC_API_KEY."
   },
   "ClaudeCodeOAuthToken": {
    "s1": "On any computer, install Claude Code if it is not there yet:",
    "s2": "Run this command and sign in, in the browser window it opens, with the Claude account whose Pro or Max subscription the agents should use:",
    "s3": "Copy the token it prints. It starts with sk-ant-oat and lasts one year; set Expires to that date so Garrison shows when it lapses.",
    "s4": "Paste it into Value. Claude Code receives it as CLAUDE_CODE_OAUTH_TOKEN.",
    "note": "A subscription token draws on one person's plan, and using it to serve other people may break Anthropic's terms. Use an Anthropic API key for anything shared."
   },
   "OpenAiApiKey": {
    "s1": "Sign in to the OpenAI Platform and open API keys:",
    "s2": "Choose Create new secret key, pick the project whose billing pays for the runs, and copy the key. It starts with sk- and is shown only once.",
    "s3": "Paste it into Value. Codex, opencode, pi, Mux, and the provider API harness receive it as OPENAI_API_KEY."
   },
   "CodexAuthJson": {
    "s1": "Install the Codex CLI if it is not there yet:",
    "s2": "Sign in with your ChatGPT account under a new, empty Codex home, so this login belongs to Garrison alone:",
    "s3": "Validate the file in the same terminal. Continue only if this prints Valid JSON:",
    "copy": "On macOS, copy the file directly to the clipboard with the command below, then paste into Value. On other systems, open auth.json in a text editor and copy the entire file. Do not copy wrapped terminal output or the shell prompt.",
    "s4": "After the secret is saved successfully, delete that folder and do not use this login anywhere else. Garrison refreshes it from now on:",
    "note": "Two copies of one login share a refresh token, and whichever refreshes second breaks the other. Using a personal ChatGPT plan to serve other people may break OpenAI's terms; an OpenAI API key is simpler for shared deployments."
   },
   "GeminiApiKey": {
    "s1": "Open Google AI Studio and sign in with the Google account that should pay:",
    "s2": "Choose Create API key, pick or create a Google Cloud project, and copy the key. It starts with AIza.",
    "s3": "Paste it into Value. Gemini CLI and pi receive it as GEMINI_API_KEY, and opencode as GOOGLE_GENERATIVE_AI_API_KEY."
   },
   "GenericEnv": {
    "s1": "Paste any single value: a token, password, or URL that a harness or tool reads from an environment variable.",
    "s2": "Bind the secret to a deployment under an alias, then add an environment override that uses it, for example:",
    "s3": "The variable must be in the harness profile's credential allowlist, or the deployment is refused."
   },
   "GenericFile": {
    "s1": "Paste the whole file, line breaks included: a service account JSON, a certificate, or a configuration file.",
    "s2": "Bind the secret to a deployment under an alias and add a file override whose content is the secret, for example:"
   },
   "BearerToken": {
    "s1": "Paste only the token, without the word Bearer.",
    "s2": "Remote agents use it as their credential secret, and workspace templates use it to clone a private repository (as the password for user x-access-token). An MCP server can send it in a header written as {{secret.<alias>}}."
   },
   "BasicAuth": {
    "s1": "Paste the user name and password in this form:",
    "s2": "Bind the secret to a deployment under an alias and use it in a template as {{secret.<alias>}}."
   },
   "GitCredential": {
    "s1": "For GitHub, create a fine-grained personal access token with read access to Contents on the repositories to clone:",
    "s2": "Paste the token alone; Garrison sends it as the password for user x-access-token. For GitLab, Bitbucket, or another host, paste username:token instead.",
    "s3": "Choose this secret as the Git credential of the workspace template that clones the repository."
   }
  }
 }
});

// The studio chat: wait-state phrases, thinking, per-turn telemetry labels, tool chips, and copy.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "Waiting for a worker to start this turn...",
     "phrases": {
      "p1": "Reading your draft...",
      "p2": "Thinking it through...",
      "p3": "Sketching the agents...",
      "p4": "Working out who calls whom...",
      "p5": "Checking Garrison's conventions...",
      "p6": "Choosing the right capabilities...",
      "p7": "Drafting the manifests...",
      "p8": "Weighing a few designs...",
      "p9": "Lining up the deployments...",
      "p10": "Reviewing the prompts...",
      "p11": "Mapping the app's graph...",
      "p12": "Looking for a simpler shape...",
      "p13": "Double-checking the details...",
      "p14": "Putting the pieces together...",
      "p15": "Almost there...",
      "p16": "Still working on it..."
     }
    },
    "thinkingSummary": "Thinking",
    "metrics": {
     "model": "Model",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "Streaming",
     "totalMs": "Total",
     "inputTokens": "In",
     "outputTokens": "Out",
     "cachedTokens": "Cached",
     "reasoningTokens": "Reasoning",
     "outputTokensPerSecond": "Tok/s",
     "toolCallCount": "Tools",
     "costUsd": "Cost"
    }
   }
  }
 }
});

// The studio chat: turn details popover, tool call cards, links to mentioned records, keys, and the caution.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "Turn details"
    },
    "tool": {
     "running": "running",
     "ok": "done",
     "failed": "failed",
     "input": "Arguments",
     "output": "Result",
     "none": "None",
     "waiting": "Waiting for the result..."
    },
    "refs": {
     "apr": "Open approval",
     "run": "Open run",
     "cnv": "Open conversation",
     "agt": "Open agent",
     "sdr": "Open draft",
     "plr": "Open pipeline run",
     "tpl": "Open prompt template"
    },
    "keysHint": "Enter sends. Ctrl+Enter or Shift+Enter adds a new line.",
    "disclaimer": "AI can make mistakes. Check all answers.",
    "continueHint": "Continues the conversation."
   }
  }
 }
});

// Agent wizard: the guided path from a description to approved agents running in dev, its entry points, and the studio tab it replaces.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "Agent wizard",
    "tip": "A guided path from a description of what you need to approved agents that run in dev: model access, design with the agent architect, review, approval, and a first conversation."
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "Agent wizard"
  }
 },
 "common": {
  "states": {
   "studioHint": "Or open the agent wizard and describe what you need: it walks you through building, approving, and trying the agents.",
   "openStudio": "Open the agent wizard"
  }
 },
 "views": {
  "home": {
   "openStudio": "Open the agent wizard"
  },
  "studioDraft": {
   "back": "Back to the wizard"
  },
  "agentWizard": {
   "title": "Agent wizard",
   "subtitle": "Describe what you need. The wizard takes you from there to approved agents running in dev.",
   "subtitleDraft": "Building: {{title}}",
   "advanced": "Advanced",
   "stepsLabel": "Wizard steps",
   "back": "Back",
   "working": "Working...",
   "steps": {
    "goal": "Goal",
    "access": "Model access",
    "design": "Design",
    "review": "Review",
    "approve": "Approve",
    "test": "Try it"
   },
   "goal": {
    "title": "What should your agents do?",
    "intro": "Give the project a name and describe the job in plain words. The agent architect reads this and designs one agent or a team of agents for it.",
    "name": "Project name",
    "namePlaceholder": "Research assistant",
    "nameHint": "A short name you will recognize later. You cannot change it after this step.",
    "goal": "What the agents should do",
    "goalPlaceholder": "Research a topic on the web, summarize what it finds with sources, and write a short report.",
    "goalHint": "Say who uses it, what goes in, and what should come out. The architect asks about anything it needs to know.",
    "next": "Start",
    "resume": "Or continue one of your drafts",
     "allDrafts": "All drafts"
   },
   "access": {
    "title": "Model access",
    "intro": "Choose the harness your agents run on and the credential it signs in with. The agent architect uses the same harness and credential while it designs with you.",
    "harness": "Harness profile",
    "harnessHint": "The CLI that runs the agents, for example Claude Code or Codex.",
    "model": "Model",
    "modelHint": "Optional. Leave it empty to use the harness's default model.",
    "credential": "Credential",
    "noCredentialNeeded": "{{profile}} does not need a credential.",
    "credentialIntro": "{{profile}} signs in with a secret of kind {{kinds}}. Choose one you saved earlier, or add one now.",
    "noFittingSecret": "You have no saved secret of kind {{kinds}} yet. Add one below; the steps for getting the value are shown with it.",
    "addSecret": "Add a credential",
    "saveSecret": "Save the credential",
    "architectDescription": "Agent architect set up by the agent wizard.",
    "next": "Continue to design"
   },
   "design": {
    "title": "Design with the architect",
    "intro": "Chat with the agent architect. It asks what it needs to know and builds the agents in your draft as you talk. The panel on the right shows what the draft holds.",
    "contents": "In the draft",
    "empty": "Nothing yet. The architect adds agents here as it designs them.",
    "agents": "Agents",
    "firstMessage": "I want to build this: {{goal}}\n\nThe agents will run on the {{profile}} harness profile with the credential secret {{secret}}. Ask me anything you need to know, then design the agents in this draft.",
    "chatTitle": "Chat with {{architect}}",
    "next": "Continue to review"
   },
   "review": {
    "title": "Review",
    "intro": "The wizard checks every item in the draft against your live configuration. Anything that would fail goes back to the architect to fix.",
    "status": {
     "PendingApproval": "This draft is waiting for approval. Continue to the next step.",
     "Applied": "This draft is applied. Continue to the next step.",
     "Discarded": "This draft was discarded. Start a new one from the first step."
    },
    "kind": "Kind",
    "name": "Name",
    "change": "Change",
    "note": "Note",
    "problems_one": "{{count}} item would not apply.",
    "problems_other": "{{count}} items would not apply.",
    "askFix": "Ask the architect to fix it",
    "valid": "Everything in the draft checks out. Continue to approve it.",
    "validate": "Check again",
    "fixMessage": "The draft does not validate yet. Please fix these problems:\n{{problems}}",
    "next": "Continue to approve"
   },
   "approve": {
    "title": "Approve",
    "intro": "Approving applies the draft and makes the agents live. The wizard then gives each agent a dev deployment, so you can try it right away.",
    "reason": "Approved in the agent wizard.",
    "summary": "The draft holds {{total}} items, including {{agents}} agents. They will run on {{profile}} with the credential {{secret}}.",
    "will1": "Every item in the draft is created or updated together. If any of them fails, nothing is changed.",
    "will2": "Each agent gets a dev deployment on the harness you chose, with the credential bound.",
    "will3": "If you are not allowed to approve, the request waits for someone who is, and this page continues when they decide.",
    "approve": "Approve and publish",
    "waiting": "Waiting for someone with approval rights to decide. This page continues on its own when they do.",
    "openApproval": "Open the approval",
    "retry": "Try again",
    "done": "Approved and published. Every agent has a dev deployment that is ready to run.",
    "agent": "Agent",
    "deployment": "Dev deployment",
    "what": "What the wizard did",
    "actions": {
     "create": "Created the deployment",
     "bind": "Bound the credential",
     "ready": "Already ready"
    },
    "next": "Continue to try it"
   },
   "test": {
    "title": "Try it",
    "intro": "Talk to your new agent in dev. When you are happy with it, open it to promote it or share it.",
    "talkingTo": "Talking to {{name}}.",
    "empty": "Send a message to start a conversation.",
    "message": "Message",
    "next": "Where to go next",
    "openAgent": "Open {{name}}",
    "openApp": "Open the app {{name}}",
    "openInvoke": "Open in Invoke",
    "another": "Build another"
   }
  }
 }
});

// Agent wizard: the Try it step opens the app's own chat.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "Open the {{name}} chat"
   }
  }
 }
});

// App branding: background, header, and agent message colors, typeface, and browser tab icon.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "Page background",
    "headerColor": "Header color",
    "agentBubbleColor": "Agent message color",
    "fontFamily": "Typeface",
    "faviconAssetId": "Browser tab icon"
   },
   "hints": {
    "displayName": "Shown in the chat header and on the agent's messages. Any characters, up to 128. The name above is only the identifier.",
    "faviconAssetId": "An image asset. Leave it empty to use the logo.",
    "primaryColor": "Buttons and your own messages.",
    "accentColor": "Highlights, focus rings, and the selected conversation.",
    "backgroundColor": "The page behind the conversation.",
    "headerColor": "The bar across the top with the name and logo.",
    "agentBubbleColor": "The agent's messages. Text color is picked for contrast."
   },
   "faviconFromLogo": "Same as the logo",
   "defaultColor": "Default {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "System",
   "Sans": "Sans-serif",
   "Serif": "Serif",
   "Rounded": "Rounded",
   "Mono": "Monospace"
  }
 },
 "components": {
  "form": {
   "defaultColor": "Default"
  }
 }
});

// App branding: conversation list, message input, and file list colors.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "Conversation list color",
    "composerColor": "Message input color",
    "filesColor": "File list color"
   },
   "hints": {
    "conversationListColor": "The list of conversations on the side.",
    "composerColor": "The area under the conversation where you type.",
    "filesColor": "The list of files the agent wrote."
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(en.views.agentWizard.goal, {
  "updated": "Updated {{date}}",
  "continue": "Continue"
});
Object.assign(en.views.agentWizard.access, {
  "muxEndpoint": "Mux endpoint URL",
  "muxAdapter": "Endpoint adapter",
  "muxOptionalCredential": "Credential (optional)",
  "muxHint": "Mux can use an endpoint without a provider API key. Enter an endpoint URL that the worker can reach. Choose a credential only if that endpoint requires authentication.",
  "needEndpoint": "Enter a valid HTTP or HTTPS Mux endpoint URL."
});
Object.assign(en.views.agentWizard.design, {
  "firstMessageMux": "I want to build this: {{goal}}\n\nUse Mux with endpoint {{endpoint}}, adapter {{adapter}}, and model {{model}}. No provider API key is required unless the endpoint requires authentication. Ask me anything you need to know, then design the agents in this draft."
});
Object.assign(en.views.agentWizard.approve.actions, {"configure": "Endpoint configured"});

// Harness-specific wizard configuration.
Object.assign(en.views.agentWizard.access, {
  "muxEndpoint": "Mux endpoint name",
  "muxHint": "Enter the endpoint name configured in Mux on the execution workers, for example local. Mux supplies its URL, adapter, model, and authentication.",
  "needEndpoint": "Enter a configured Mux endpoint name, not a URL.",
  "providerModelHint": "Use the CLI model identifier, usually provider/model. Authentication depends on that provider; a saved credential is optional.",
  "optionalCredentialIntro": "{{profile}} supports saved secrets of kind {{kinds}}. Choose one if your provider requires it, or continue without a saved credential.",
  "providerEndpoint": "Provider API endpoint URL",
  "providerEndpointHint": "This harness calls an OpenAI-compatible HTTP API directly. Enter its base URL and model.",
  "providerAnonymous": "The provider endpoint does not require authentication",
  "needProviderEndpoint": "Enter a valid HTTP or HTTPS provider URL without credentials, query parameters, or a fragment."
});
Object.assign(en.views.agentWizard.design, {
  "firstMessageMux": "I want to build this: {{goal}}\n\nUse the configured Mux endpoint named {{endpoint}}. Its model and authentication come from Mux. Ask me anything you need to know, then design the agents in this draft."
});
Object.assign(en.views.agentWizard.access, {"intro": "Choose the harness and its connection settings. The agent architect uses the same configuration while it designs with you."});

// Typed inference protocol and authentication editor.
Object.assign(en, {
  "inference": {
    "modelHint": "Choose a model served by this endpoint.",
    "title": "Inference endpoint",
    "protocol": "API protocol",
    "baseUrl": "Base URL",
    "authentication": "Authentication type",
    "name": "Header / query parameter name",
    "location": "Credential placement",
    "header": "Header",
    "query": "Query string",
    "secret": "Credential secret",
    "addValue": "Add credential value",
    "username": "Username secret",
    "password": "Password secret",
    "hint": "Choose protocol and authentication independently. Ollama Cloud uses bearer authentication; local Ollama usually needs none. Values are stored as encrypted secrets.",
    "invalid": "Enter a valid endpoint URL and select all required credential names and secrets.",
    "value": "Credential value",
    "auth": {
      "None": "None",
      "BearerToken": "Bearer token",
      "ApiKey": "API key",
      "Headers": "Header values",
      "QueryString": "Query parameters",
      "Basic": "Basic authentication"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
en.runtime = {
  "title": "Harnesses & Endpoints",
  "connections": "Saved connections",
  "templates": "Advanced harness templates",
  "connection": "Connection",
  "architect": "Architect",
  "choose": "Choose an architect or connection",
  "harness": "Harness template",
  "chooseHarness": "Choose a harness template",
  "manage": "Manage harnesses and endpoints",
  "configureFirst": "Configure a saved connection first.",
  "sharedHint": "Configure once here. Architects and deployments reference this connection; changes apply to every consumer on its next run.",
  "reuseHint": "Use an existing architect immediately, or choose a saved connection to create one. No credentials or endpoint details need to be entered again.",
  "importExport": "Import / Export"
};
en.nav.hubs.configuration = {"label": "Agent Resources", "tip": "Connection settings for agents and architects."};
en.nav.hubs.platformConfiguration = {"label": "Platform Configuration", "tip": "Credentials, storage, pricing, quotas, and notifications."};
en.nav.items.harnessProfiles.label = "Harnesses & Endpoints";
en.views.agentWizard.access.intro = "Use an existing architect immediately, or choose a saved connection to create one. No credentials or endpoint details need to be entered again.";

en.resources.harnessProfiles.title = en.runtime.title;
en.resources.harnessProfiles.subtitle = en.runtime.sharedHint;
en.components.architectHints.harness = en.runtime.sharedHint;
en.components.architectHints.harnessLink = en.runtime.manage;

Object.assign(en.runtime, {"add": "Add connection", "create": "Create connection", "edit": "Edit connection", "view": "Connection details"});

en.explainers.harnessProfiles.p2 = en.runtime.sharedHint;
en.explainers.secrets.p2 = en.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(en.runtime, {"title": "Connections", "sharedHint": "Reusable harnesses and API endpoints. Configure once, then select a connection wherever an agent runs.", "harness": "Connection type", "chooseHarness": "Choose a harness or API type", "customHarness": "Custom harness", "advancedLaunch": "Advanced launch settings", "advancedArchitect": "Architect options (optional)", "pickConnection": "Choose a connection. Its model, endpoint, and credentials are already configured."});
en.nav.hubs.connections = {"label": "Connections", "tip": "Reusable harnesses and API endpoints. Configure once, then select a connection wherever an agent runs."};
en.nav.hubs.configuration = {"label": "Configuration", "tip": "Manage prompts, assets, tool servers, credentials, storage, and policies."};
en.nav.items.harnessProfiles.label = "Connections";
en.resources.harnessProfiles.title = "Connections";
en.components.studio.architect.harnessProfile = en.runtime.connection;

Object.assign(en.runtime, {"emptyTitle": "No connections yet", "apiType": "HTTP API (Ollama / OpenAI-compatible)"});

en.nav.items.manifests.label = en.runtime.importExport;

en.runtime.manage = "Manage connections";
en.components.architectHints.harnessLink = en.runtime.manage;
en.explainers.secrets.p2 = "Connections reference these secrets for authentication. Update a value here without reconfiguring each architect or deployment.";

en.runtime.launchDefaults = "This connection uses its existing launch configuration. Edit it under Advanced launch settings if needed.";

// One horizontal workspace navigation level; the wizard selects connections only.
en.nav.hubs.operations = {"label": "Operations", "tip": "Manage stored outputs, model prices, usage limits, and notifications."};
en.nav.hubs.configuration.tip = "Prompts, assets, tools, credentials, and workspaces for your agents.";
en.nav.hubs.manifests = { label: en.runtime.importExport, tip: en.tips.nav.tabs.manifests };
en.runtime.choose = "Select a connection";
en.runtime.reuseHint = "Choose the connection for designing and running your agents. The wizard prepares its design assistant automatically.";
en.views.agentWizard.access.intro = en.runtime.reuseHint;

en.views.manifests.title = en.runtime.importExport;

en.views.agentWizard.design.intro = "Answer the architect’s questions to design your agent.";

en.views.studio.deleteMultiple = "Delete Multiple";
en.views.studio.deleteMultipleMessage = "Permanently delete the {{count}} selected drafts? Pending apply approvals will be cancelled. Published agents and deployments are not affected.";

en.views.studio.discard = en.common.actions.delete;
en.views.studio.discardTitle = "Delete draft";
en.views.studio.discardMessage = "Permanently delete {{title}}? Published agents and deployments are not affected.";
en.views.studio.discardPendingMessage = "Permanently delete {{title}}? Its pending apply approval will be cancelled. Published agents and deployments are not affected.";
en.views.studio.discarded = "Deleted {{title}}.";

en.components.studio.chat.resize = "Resize chat";
en.components.studio.chat.resizeHint = "Drag to resize the chat. Use Up or Down to adjust its height, or Home to reset.";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
en.components.secretReveal = { title: "Reveal secret value", warning: "Revealing shows the stored value in plain text. Every reveal is recorded in the audit log with your name. Close this dialog when you are done; the value is not kept.", value: "Value", reveal: "Reveal", hide: "Hide" };
en.tips.secretReveal = { reveal: "Decrypt and show the stored value. The server writes a SecretRevealed audit record.", hide: "Hide the value again. Revealing it once more writes another audit record.", close: "Close the dialog and discard the revealed value.", value: "The decrypted value, exactly as stored. Treat it like a password.", copy: "Copy the value to the clipboard." };
en.resources.secrets.actions.reveal = "Reveal";
en.tips.resources.secrets.actions.reveal = "Show the stored value in plain text. Requires Admin on Secret (SecretManager or TenantAdmin) and is recorded in the audit log.";
en.tips.resources.secrets.revealNoValue = "This secret has no stored value yet. Use Set value first.";
en.enums.auditEventType.SecretRevealed = "Secret revealed";
en.tips.enums.auditEventType.SecretRevealed = "Someone with Admin on Secret read a secret's decrypted value.";

// Keepers (AA1.16): the Autonomy workspace, the keeper list and page, keeper enums, and the Home Autonomy card.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "Autonomy",
    "tip": "Agents that keep working on their own: keepers wake on a schedule and look after a standing job."
   }
  },
  "items": {
   "keepers": {
    "label": "Keepers",
    "tip": "Agents that wake on a schedule to look after a standing job"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "Keeper tick"
  },
  "resourceType": {
   "Mandate": "Keeper (mandate)"
  },
  "mandateStatus": {
   "Draft": "Draft",
   "Active": "Active",
   "Paused": "Paused",
   "Frozen": "Frozen",
   "CapReached": "Budget reached",
   "Retired": "Retired"
  },
  "mandateRevisionState": {
   "Draft": "Draft",
   "Published": "Published"
  },
  "mandateRevisionSource": {
   "Human": "Person",
   "Board": "Board",
   "Executive": "Executive",
   "Architect": "Agent architect"
  },
  "wakeMode": {
   "Fixed": "Fixed interval",
   "Backoff": "Back off when quiet"
  },
  "wakeSource": {
   "Timer": "Schedule",
   "Manual": "Woken by hand",
   "Message": "Message",
   "EscalationAnswer": "Escalation answered",
   "Webhook": "Webhook",
   "Report": "Report"
  },
  "tickOutcome": {
   "Quiet": "Quiet",
   "Acted": "Acted",
   "Attention": "Needs attention",
   "Escalated": "Escalated",
   "Failed": "Failed",
   "Skipped": "Skipped",
   "Unreported": "Not reported"
  }
 },
 "errorCodes": {
  "MandateActive": "A tick of this keeper is running. Wait for it to finish, pause the keeper, or delete it anyway, which cancels the tick's run.",
  "MandateNotActive": "Only an active keeper can be woken or paused.",
  "MandateNotPaused": "Only a paused keeper can be resumed.",
  "RemoteAgentUnsupported": "Keepers run on hosted deployments, so a remote agent cannot be a keeper.",
  "DeploymentInactive": "That deployment is inactive. Choose an active deployment.",
  "DeploymentAgentMismatch": "That deployment belongs to another agent. Choose one of this agent's deployments.",
  "RevisionMismatch": "That revision belongs to another keeper."
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "Keeper"
   }
  },
  "keepers": {
   "title": "Keepers",
   "subtitle": "Agents that wake on a schedule to look after a standing job, and report what they found each time.",
   "add": "Add keeper",
   "create": "Create keeper",
   "edit": "Edit keeper",
   "view": "Keeper details",
   "deleteTitle": "Delete keeper",
   "emptyTitle": "No keepers yet",
   "emptyBody": "Create a keeper to have an agent check on something regularly, such as a queue, a dashboard, or an inbox, and act or ask for help when it needs to.",
   "columns": {
    "name": "Name",
    "status": "Status",
    "agent": "Agent",
    "deployment": "Deployment",
    "nextWakeUtc": "Next wake",
    "currentIntervalSeconds": "Interval",
    "lastTick": "Last tick",
    "tickCount": "Ticks",
    "currentRevisionNumber": "Revision",
    "runAs": "Runs as",
    "description": "Description",
    "id": "ID",
    "createdUtc": "Created"
   },
   "fields": {
    "name": "Name",
    "description": "Description",
    "agentId": "Agent",
    "deploymentId": "Deployment",
    "objective": "Objective",
    "healthyDefinition": "What healthy looks like",
    "autonomy": "What it may do on its own",
    "escalationPolicy": "When to ask for help",
    "direction": "Current direction",
    "signals": "Signals to watch",
    "signalsItems": {
     "name": "Signal",
     "description": "What it means"
    },
    "wakeMode": "Wake mode",
    "minIntervalSeconds": "Minimum interval (seconds)",
    "maxIntervalSeconds": "Maximum interval (seconds)",
    "backoffFactor": "Backoff factor",
    "jitterPercent": "Jitter (percent)",
    "budgetPerTickUsd": "Budget per tick (USD)",
    "budgetPerDayUsd": "Budget per day (USD)",
    "maxTokensPerTick": "Most tokens per tick",
    "changeNote": "Change note"
   },
   "hints": {
    "name": "Lowercase letters, digits, and hyphens.",
    "agentId": "A hosted agent. The agent cannot change after the keeper is created.",
    "deploymentId": "The active deployment each tick runs on.",
    "objective": "The standing job, in plain words. The keeper reads it at every tick.",
    "minIntervalSeconds": "From {{min}} to {{max}} seconds. The cluster setting Autonomy.MinIntervalSeconds may raise it.",
    "maxIntervalSeconds": "From {{min}} to {{max}} seconds. Backoff stops growing here.",
    "backoffFactor": "From {{min}} to {{max}}. After each quiet tick the interval is multiplied by this.",
    "jitterPercent": "From {{min}} to {{max}}. Empty uses the cluster default.",
    "budgetPerTickUsd": "Empty means no limit.",
    "budgetPerDayUsd": "Empty means no limit.",
    "maxTokensPerTick": "Input plus output tokens. Empty means no limit.",
    "changeNote": "Why this revision changes the keeper. Shown in the revision list."
   },
   "sections": {
    "mandate": "Mandate",
    "schedule": "Wake schedule",
    "budgets": "Budgets"
   },
   "sectionHints": {
    "mandate": "Saving publishes these fields as revision 1 and starts the wake schedule. Later changes go through New revision on the keeper's page.",
    "budgets": "Stored now and enforced in a later release."
   },
   "errors": {
    "name": "Use 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.",
    "nameTaken": "Another keeper already uses this name.",
    "text": "Limited to {{max}} characters.",
    "agentRequired": "Choose the agent that keeps this mandate.",
    "deploymentRequired": "Choose the deployment its ticks run on.",
    "objective": "Describe the standing job.",
    "signalsMax": "A revision has at most {{max}} signals.",
    "signalName": "Signal names are 1 to {{max}} characters.",
    "signalUnique": "Each signal needs a different name.",
    "signalsInvalid": "Fix the signals marked below.",
    "interval": "Enter whole seconds from {{min}} to {{max}}.",
    "maxBelowMin": "The maximum interval cannot be shorter than the minimum.",
    "backoffFactor": "Enter a number from {{min}} to {{max}}.",
    "jitterPercent": "Enter a whole number from {{min}} to {{max}}.",
    "budget": "Enter an amount from {{min}} to {{max}}.",
    "maxTokens": "Enter a whole number from {{min}} to {{max}}."
   },
   "actions": {
    "pause": "Pause",
    "resume": "Resume",
    "wake": "Wake now",
    "runs": "View runs"
   },
   "toasts": {
    "pause": "Paused {{name}}.",
    "resume": "Resumed {{name}}. It wakes now.",
    "wake": "{{name}} wakes now."
   },
   "units": {
    "seconds_one": "{{count}} second",
    "seconds_other": "{{count}} seconds",
    "minutes_one": "{{count}} min",
    "minutes_other": "{{count}} min",
    "hours_one": "{{count}} hour",
    "hours_other": "{{count}} hours",
    "days_one": "{{count}} day",
    "days_other": "{{count}} days"
   },
   "ticking": "Ticking",
   "neverTicked": "Not woken yet",
   "addSignal": "Add signal",
   "signalNamePlaceholder": "queue depth",
   "editNotice": "Runs as {{name}}. Saving makes you the principal its ticks run as. To change the objective or schedule, open the keeper and use New revision."
  }
 },
 "components": {
  "keeperRevision": {
   "title": "New revision of {{name}}",
   "intro": "This becomes revision {{number}}. Publishing it makes it current at once: the backoff resets and the keeper wakes now.",
   "draft": "Save as draft",
   "publish": "Publish",
   "drafted": "Saved revision {{number}} as a draft.",
   "published": "Published revision {{number}}."
  }
 },
 "views": {
  "runDetail": {
   "keeper": "Keeper"
  },
  "home": {
   "autonomy": {
    "title": "Autonomy",
    "open": "Open keepers",
    "empty": "No keepers yet. A keeper wakes on a schedule to look after a standing job.",
    "active": "active",
    "paused": "paused",
    "ticking": "ticking now",
    "nextWake": "Next wake:",
    "allQuiet": "No keeper needs attention.",
    "attention_one": "{{count}} keeper needs attention",
    "attention_other": "{{count}} keepers need attention"
   }
  },
  "keeperDetail": {
   "title": "Keeper",
   "heading": "Keeper {{name}}",
   "notFoundTitle": "Keeper not found",
   "notFoundBody": "It may have been deleted, or it belongs to another tenant.",
   "live": "Live",
   "polling": "Refreshing",
   "newRevision": "New revision",
   "noWake": "Not scheduled",
   "quietStreak": "Quiet ticks in a row",
   "activeRun": "Running tick",
   "revisionTitle": "Current revision",
   "revisionHeading": "Current revision ({{number}})",
   "noRevision": "No revision is published yet. Use New revision to write one and publish it.",
   "clusterDefault": "Cluster default",
   "noLimit": "No limit",
   "ticks": "Ticks",
   "outcomeFilter": "Outcome",
   "allOutcomes": "All outcomes",
   "noTicksTitle": "No ticks yet",
   "noTicksActive": "The first tick starts at the next wake. Use Wake now to start one at once.",
   "noTicksBody": "Ticks appear here once the keeper is active and wakes.",
   "chartTitle": "Interval after each tick",
   "chartHelp": "Minutes until the next wake, as set when each tick finished. Quiet ticks lengthen it in Backoff mode.",
   "chartSeries": "Interval (minutes)",
   "columns": {
    "started": "Started",
    "source": "Woken by",
    "outcome": "Outcome",
    "run": "Run",
    "interval": "Next interval",
    "cost": "Cost",
    "summary": "Summary",
    "number": "Number",
    "state": "State",
    "revisionSource": "Source",
    "author": "Author",
    "changeNote": "Change note",
    "created": "Created"
   },
   "requested": "asked for {{interval}}",
   "revisions": "Revisions",
   "noRevisions": "No revisions yet.",
   "current": "Current",
   "diff": "Compare",
   "diffTitle": "Revision {{number}} compared with the one before",
   "diffFirst": "This is the first revision, so everything in it is new.",
   "revisionLabel": "Revision {{number}}",
   "nothing": "Nothing",
   "confirmDelete": "Delete keeper {{name}} with its revisions and tick history? Its past runs stay.",
   "confirmForceDelete": "A tick of {{name}} is running. Delete the keeper anyway and cancel that tick's run?",
   "forceDelete": "Delete and cancel tick",
   "changeNote": "Change note: {{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "Agents that work on their own between requests. Keepers wake on a schedule, check on a standing job, and act or ask for help."
   },
   "tabs": {
    "keepers": "Keepers: agents that wake on a schedule to look after a standing job, with their ticks and revisions."
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "Started by a keeper's wake. The run is one tick of that keeper and links back to it."
   },
   "resourceType": {
    "Mandate": "Keepers (mandates): the standing jobs agents look after on a wake schedule, with their revisions and ticks."
   },
   "mandateStatus": {
    "Draft": "Created without a published revision, so it does not wake yet. Publish a revision to start it.",
    "Active": "Wakes on its schedule. Each wake starts one tick, a run of its deployment.",
    "Paused": "Does not wake until someone resumes it. Resuming wakes it at once with the interval reset.",
    "Frozen": "Stopped by an administrator or a policy. It does not wake until it is unfrozen.",
    "CapReached": "Its daily budget is used up. It wakes again when the next UTC day starts.",
    "Retired": "No longer in use. It keeps its history and never wakes."
   },
   "mandateRevisionState": {
    "Draft": "Saved but not in use. Publish it to make it the keeper's current revision.",
    "Published": "Was or is in use. Published revisions never change; write a new revision instead."
   },
   "mandateRevisionSource": {
    "Human": "Written by a person in the dashboard, the API, or a manifest.",
    "Board": "Set by a board of agents that oversees this keeper.",
    "Executive": "Set by an executive agent that directs this keeper.",
    "Architect": "Written by the agent architect from a studio draft."
   },
   "wakeMode": {
    "Fixed": "Wakes every minimum interval, whatever the last tick found.",
    "Backoff": "Waits longer after each quiet tick, up to the maximum interval, and returns to the minimum once something happens."
   },
   "wakeSource": {
    "Timer": "The wake schedule came due, so the keeper woke on its own.",
    "Manual": "Someone used Wake now or resumed the keeper.",
    "Message": "A message arrived for the keeper.",
    "EscalationAnswer": "Someone answered a question the keeper escalated.",
    "Webhook": "Another system called the keeper's webhook.",
    "Report": "Another agent's report asked this keeper to look."
   },
   "tickOutcome": {
    "Quiet": "Everything was healthy and nothing needed doing. In Backoff mode the next wake comes later.",
    "Acted": "The keeper changed something to keep the job healthy.",
    "Attention": "The keeper found something a person should look at.",
    "Escalated": "The keeper asked a person or another agent for a decision.",
    "Failed": "The tick's run failed, timed out, or was cancelled.",
    "Skipped": "A wake came while the previous tick was still running, so it was skipped and the next one waits for it.",
    "Unreported": "The run finished without reporting an outcome, so the keeper may need a clearer objective."
   }
  },
  "resources": {
   "runs": {
    "mandateId": "The keeper that started this run as one of its ticks, if any. Click it to open the keeper.",
    "openKeeper": "Open the keeper whose tick this run is."
   },
   "keepers": {
    "add": "Create a keeper: choose a hosted agent and deployment, describe the standing job, and set how often it wakes.",
    "name": "A unique name in this tenant, used in URLs, manifests, and the API.",
    "status": "Whether the keeper wakes on its schedule (Active) or is waiting, paused, frozen, or retired.",
    "agent": "The hosted agent that keeps this mandate. Each tick runs this agent.",
    "deployment": "The deployment each tick runs on, which sets the harness, model, and tools.",
    "nextWakeUtc": "When the next tick starts. Hover for the exact time.",
    "currentIntervalSeconds": "The wait after the last tick. In Backoff mode it grows after quiet ticks.",
    "lastTick": "When the keeper last woke and what that tick reported.",
    "tickCount": "How many ticks the keeper has run in total.",
    "currentRevisionNumber": "The published revision the keeper follows now.",
    "runAs": "The user or credential whose permissions each tick runs with: whoever last saved the keeper.",
    "description": "Notes for people. The keeper does not read this; it reads the objective.",
    "id": "The keeper's identifier, used in the API and in run records.",
    "createdUtc": "When the keeper was created.",
    "agentId": "The hosted agent that keeps this mandate. Remote agents cannot be keepers. Fixed after creation.",
    "deploymentId": "The active deployment of that agent each tick runs on.",
    "objective": "The standing job in plain words, such as keep the support queue under 20 open tickets. The keeper reads it at every tick.",
    "healthyDefinition": "What good looks like, so the keeper can tell a quiet tick from one that needs action.",
    "autonomy": "What the keeper may change on its own without asking anyone.",
    "escalationPolicy": "When the keeper should stop and ask a person or another agent for a decision.",
    "direction": "Short-term guidance that may change often, such as a focus for this week.",
    "signals": "Named measurements the keeper should check each tick, with what each one means.",
    "signalsItems": {
     "name": "A short name for the measurement, unique within the revision.",
     "description": "What the measurement means and which values are worrying."
    },
    "wakeMode": "Fixed wakes at the minimum interval every time. Backoff waits longer after quiet ticks.",
    "minIntervalSeconds": "The shortest wait between scheduled wakes, in seconds.",
    "maxIntervalSeconds": "The longest wait between scheduled wakes in Backoff mode, in seconds.",
    "backoffFactor": "How much the wait grows after each quiet tick in Backoff mode. 2 doubles it.",
    "jitterPercent": "A random delay of up to this percent of the interval, so many keepers do not wake at the same moment.",
    "budgetPerTickUsd": "The most one tick may cost in US dollars.",
    "budgetPerDayUsd": "The most this keeper's ticks may cost per UTC day in US dollars.",
    "maxTokensPerTick": "The most input and output tokens one tick may use.",
    "changeNote": "A short note on why this revision changes the keeper, kept with the revision.",
    "sections": {
     "mandate": "What the keeper looks after and how much it may do on its own.",
     "schedule": "How often the keeper wakes and how the wait changes after quiet ticks.",
     "budgets": "Limits on what the keeper's ticks may cost and use."
    },
    "actions": {
     "pause": "Stop waking this keeper. A running tick finishes; no new one starts until you resume it.",
     "resume": "Start waking this keeper again. It wakes at once with its interval reset to the minimum.",
     "wake": "Start a tick now instead of waiting for the schedule. If a tick is running, the new one starts after it.",
     "runs": "Open the Runs page filtered to this keeper's ticks."
    },
    "ticking": "A tick of this keeper is running now."
   }
  },
  "keeperRevision": {
   "done": "Close this dialog. The revision was saved with the adjusted values listed above.",
   "draft": "Save this revision as a draft without using it. Publish it later from the revision list.",
   "publish": "Save this revision and make it current now. The backoff resets and the keeper wakes at once."
  },
  "views": {
   "runDetail": {
    "keeper": "The keeper that started this run as one of its ticks.",
    "openKeeper": "Open the keeper, with its ticks and revisions."
   },
   "home": {
    "autonomy": {
     "title": "Keepers in this tenant and the ones whose last tick needs a person.",
     "open": "Open the Keepers page to create, pause, wake, or edit keepers.",
     "active": "Keepers that wake on their schedule.",
     "paused": "Keepers that do not wake until someone resumes them.",
     "ticking": "Keepers with a tick running right now.",
     "nextWake": "The soonest scheduled wake among active keepers.",
     "attention": "Keepers whose last tick needs attention, escalated, failed, or did not report, and keepers stopped by a budget or freeze.",
     "openKeeper": "Open this keeper's page to see its ticks."
    }
   },
   "keeperDetail": {
    "openRun": "Open this run's detail page: its transcript, tool calls, and result.",
    "live": "Updates arrive as ticks start and finish, over the live connection.",
    "polling": "The live connection is unavailable, so the page re-reads the keeper every few seconds.",
    "viewJson": "Show the keeper record with its current revision as JSON.",
    "newRevision": "Write a new revision of the objective, schedule, or budgets, starting from the current one.",
    "delete": "Delete this keeper with its revisions and tick history. Its past runs stay.",
    "forceDelete": "Delete the keeper and cancel the run of the tick in progress.",
    "openAgent": "Open the agent this keeper runs.",
    "quietStreak": "How many ticks in a row found nothing to do. In Backoff mode each one lengthens the wait.",
    "activeRun": "The run of the tick in progress, if one is running.",
    "revisionTitle": "The published revision the keeper follows at every tick.",
    "ticks": "Every wake of this keeper, newest first: what woke it, what it found, and the wait it set.",
    "outcomeFilter": "Show only ticks with this outcome.",
    "outcomeCounts": "How many ticks on this page had each outcome.",
    "chart": "The wait after each tick on this page, oldest on the left. It grows after quiet ticks in Backoff mode and resets when something happens.",
    "columns": {
     "started": "When the tick started. Hover for the exact time.",
     "source": "What woke the keeper for this tick.",
     "outcome": "What the tick reported: quiet, acted, needs attention, escalated, or failed.",
     "run": "The run that carried out the tick.",
     "interval": "The wait until the next wake, as set when this tick finished.",
     "cost": "What the tick's run cost, from the model price list.",
     "summary": "What the keeper said it found or did, or the error that stopped the tick.",
     "number": "The revision number. The current one is marked.",
     "state": "Draft revisions are saved but not in use; published ones were or are in use.",
     "revisionSource": "Who wrote the revision: a person, the agent architect, or an overseeing agent.",
     "author": "The user or credential that saved the revision.",
     "changeNote": "Why the revision changed the keeper.",
     "created": "When the revision was saved."
    },
    "requested": "The keeper asked for this wait; the server keeps it within the minimum and maximum interval.",
    "revisions": "Every revision of this keeper, newest first. Compare one with the one before, or publish a draft.",
    "current": "The revision the keeper follows now.",
    "diff": "Show what this revision changed compared with the revision before it."
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "Keepers",
   "p1": "A keeper is an agent with a standing job, its mandate. It wakes on a schedule, checks how things stand, acts within what it may do on its own, and reports a short outcome each time. Each wake is a tick, and each tick is one run of the keeper's deployment.",
   "p2": "In Backoff mode a quiet tick makes the next wake come later, up to the maximum interval, and anything else brings it back to the minimum. Only one tick runs at a time: a wake that arrives during a tick waits for it to finish.",
   "p3": "Changes to the objective, schedule, or budgets are revisions. Publishing a revision makes it current at once and wakes the keeper, and every revision stays in the history to compare."
  }
 }
});

// Escalations (AA2.13): the Escalations page, answer dialog, detail page, Autonomy badge, Home list, escalation
// enums, keeper escalation targets, and the notification endpoint minimum severity.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "Agents that keep working on their own: keepers wake on a schedule to look after a standing job, and escalations are the questions they ask people."
   }
  },
  "items": {
   "escalations": {
    "label": "Escalations",
    "tip": "Questions agents asked a person, a role, or another agent, and the answers"
   }
  },
  "escalationsOpen_one": "{{count}} escalation waiting for an answer",
  "escalationsOpen_other": "{{count}} escalations waiting for an answer"
 },
 "enums": {
  "resourceType": {
   "Escalation": "Escalation"
  },
  "notificationEvent": {
   "EscalationRaised": "Escalation raised",
   "EscalationExpired": "Escalation timed out"
  },
  "escalationStatus": {
   "Open": "Open",
   "Answered": "Answered",
   "Expired": "Timed out",
   "Cancelled": "Cancelled",
   "Withdrawn": "Withdrawn"
  },
  "escalationSeverity": {
   "Info": "Info",
   "Warning": "Warning",
   "Urgent": "Urgent"
  },
  "escalationMode": {
   "NonBlocking": "Non-blocking",
   "Blocking": "Blocking"
  },
  "escalationTargetKind": {
   "User": "User",
   "Role": "Role",
   "Agent": "Agent",
   "Manager": "Manager"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "Use the default answer",
   "Cancel": "Cancel",
   "EscalateUp": "Escalate up"
  },
  "escalationResolutionSource": {
   "User": "A person",
   "Agent": "An agent",
   "Timeout": "Timeout",
   "Raiser": "The raising run",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "Escalated up",
   "answerTitle": "Answer {{agent}}",
   "submit": "Send answer",
   "expires": "Times out {{when}}, then: {{action}}",
   "question": "Question",
   "context": "Context",
   "choice": "Choose an option",
   "default": "Default",
   "defaultAnswer": "Default answer: {{answer}}",
   "explain": "Explanation (optional)",
   "text": "Answer",
   "textPlaceholder": "Write your answer. The agent reads it as data, not as instructions.",
   "errors": {
    "choice": "Choose one of the options.",
    "unknownChoice": "That option is not offered by this escalation.",
    "text": "Write an answer.",
    "textMax": "The answer is limited to {{max}} characters."
   },
   "toasts": {
    "answered": "Answer sent to {{agent}}.",
    "passedUp": "This escalation was passed up to another one. Answer that one instead.",
    "notOpen": "Someone else answered it first, or it timed out.",
    "forbidden": "You need Update on Escalation to answer."
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "Escalations",
   "subtitle": "Questions agents asked a person, a role, or another agent. Open ones wait for an answer; blocking ones hold their run until then.",
   "add": "Add escalation",
   "create": "Create escalation",
   "edit": "Edit escalation",
   "view": "Escalation details",
   "deleteTitle": "Delete escalation",
   "emptyTitle": "No escalations",
   "emptyBody": "An escalation appears when an agent asks a person, a role, or another agent to decide something with garrison_escalate.",
   "columns": {
    "createdUtc": "Raised",
    "severity": "Severity",
    "status": "Status",
    "question": "Question",
    "agent": "Agent",
    "target": "Addressed to",
    "expiresUtc": "Times out",
    "answer": "Answer",
    "mode": "Mode",
    "mandate": "Keeper",
    "resolvedBy": "Answered by",
    "resolutionSource": "Resolved by",
    "resolvedUtc": "Resolved",
    "raisingRunId": "Raising run",
    "id": "ID"
   },
   "filters": {
    "targetKind": "Addressed to"
   },
   "fields": {
    "status": "Status",
    "severity": "Severity",
    "mode": "Mode",
    "target": "Addressed to",
    "agent": "Raised by",
    "raisingRunId": "Raising run",
    "mandate": "Keeper",
    "mandateTickId": "Keeper tick",
    "routedRunId": "Answering run",
    "parentEscalationId": "Escalated from",
    "escalatedToId": "Escalated to",
    "timeoutAction": "On timeout",
    "expiresUtc": "Times out",
    "createdUtc": "Raised",
    "leaseEpoch": "Lease epoch",
    "context": "Context",
    "options": "Options",
    "answerChoice": "Choice",
    "answerText": "Answer",
    "resolvedBy": "Answered by",
    "resolutionSource": "Resolved by",
    "resolvedUtc": "Resolved"
   },
   "actions": {
    "answer": "Answer",
    "openEscalatedTo": "Open the escalation it went to",
    "openRun": "Open raising run",
    "openKeeper": "Open keeper",
    "cancel": "Cancel escalation"
   },
   "cancelTitle": "Cancel this escalation?",
   "cancelMessage": "{{agent}} will not get an answer. The escalation is kept as Cancelled.",
   "cancelBlocking": "{{agent}} is waiting on this answer. Cancelling the escalation cancels that run too.",
   "toasts": {
    "cancelled": "Escalation cancelled."
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "Escalate to",
    "escalationTargetId": "Escalation target"
   },
   "noEscalationTarget": "The person who saved the revision",
   "escalationTargetPlaceholder": "User, role, or agent ID or name",
   "errors": {
    "escalationTargetId": "Name the user, role, or agent to escalate to."
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "Minimum escalation severity"
   },
   "anySeverity": "Any severity"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "Escalation",
   "titleWithAgent": "Escalation from {{agent}}",
   "notFoundTitle": "Escalation not found",
   "notFoundBody": "It does not exist in this tenant, or it was deleted with its tenant.",
   "back": "Back to escalations",
   "open": "This escalation is waiting for an answer.",
   "openBlocking": "The raising run is suspended until this escalation is answered.",
   "expires": "It times out {{when}}, then: {{action}}.",
   "passedUp": "Nobody answered in time, so this escalation was passed up. Answer the new one:",
   "question": "Question",
   "chosen": "Chosen",
   "answer": "Answer"
  },
  "home": {
   "escalations": {
    "title_one": "{{count}} escalation waiting for an answer",
    "title_other": "{{count}} escalations waiting for an answer",
    "open": "Open escalations",
    "more_one": "And {{count}} more.",
    "more_other": "And {{count}} more."
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_one": "{{count}} escalation is waiting for an answer. Open Autonomy, then Escalations.",
   "escalationsBadge_other": "{{count}} escalations are waiting for an answer. Open Autonomy, then Escalations.",
   "tabs": {
    "escalations": "Escalations: questions agents asked a person, a role, or another agent, open ones first, with Answer and Cancel."
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "Questions runs raise for a person, a role, or another agent, and their answers."
   },
   "notificationEvent": {
    "EscalationRaised": "An agent raised an escalation. Endpoints can skip ones below a minimum severity.",
    "EscalationExpired": "An escalation timed out before anyone answered it."
   },
   "escalationStatus": {
    "Open": "Waiting for an answer. A blocking escalation holds its run until then.",
    "Answered": "Someone answered it; the raising run or keeper received the answer.",
    "Expired": "Nobody answered before the timeout, and the timeout action ran.",
    "Cancelled": "A person cancelled it; a run that was blocked on it was cancelled too.",
    "Withdrawn": "The agent that raised it withdrew the question."
   },
   "escalationSeverity": {
    "Info": "For information: answer when convenient.",
    "Warning": "Needs a decision soon. This is the default severity.",
    "Urgent": "Needs a decision now. Listed first and sent to every endpoint that subscribes."
   },
   "escalationMode": {
    "NonBlocking": "The run carries on and picks up the answer later; a keeper receives it in its next tick.",
    "Blocking": "The run suspends until someone answers, then resumes with the answer."
   },
   "escalationTargetKind": {
    "User": "One person, by user ID or email.",
    "Role": "Anyone who holds the role and can update escalations.",
    "Agent": "Another agent: a run of its default active deployment receives the question.",
    "Manager": "The agent's manager in an organization. Not available until organizations arrive."
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "Answer with the default answer when nobody answers in time.",
    "Cancel": "Cancel the escalation, and a run blocked on it, when nobody answers in time.",
    "EscalateUp": "Pass the question to the keeper's default target when nobody answers in time."
   },
   "escalationResolutionSource": {
    "User": "A person answered or cancelled it.",
    "Agent": "Another agent answered it with garrison_answer_escalation.",
    "Timeout": "The timeout action resolved it.",
    "Raiser": "The run that raised it withdrew it.",
    "System": "Garrison resolved it, for example when its run ended."
   }
  },
  "components": {
   "escalations": {
    "passedUp": "Nobody answered in time, so the question went to another escalation. Answer that one.",
    "submit": "Send the answer. A blocked run resumes and a keeper wakes with it.",
    "question": "The question exactly as the agent wrote it.",
    "context": "What the agent said about the situation. It is the agent's text, not instructions to you.",
    "choice": "The agent offered these options. Pick one.",
    "defaultChoice": "The default answer: the one used if the escalation times out with Use the default answer.",
    "pickChoice": "Choose this option.",
    "explain": "Optional text sent with your choice, for example why you chose it.",
    "text": "Your answer. The agent receives it as data."
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "When the agent raised it. Hover for the exact time.",
    "severity": "How urgent the agent says it is.",
    "status": "Open, answered, timed out, cancelled, or withdrawn.",
    "question": "What the agent asked, as it wrote it. Hover for the full question.",
    "agent": "The agent whose run raised it.",
    "target": "Who it is addressed to: a user, a role, or another agent.",
    "expiresUtc": "When it times out if nobody answers.",
    "answer": "The option chosen or the text of the answer.",
    "mode": "Blocking escalations hold their run until answered; non-blocking ones do not.",
    "mandate": "The keeper whose tick raised it, if any.",
    "resolvedBy": "Who answered or cancelled it.",
    "resolutionSource": "What resolved it: a person, an agent, the timeout, or the raising run.",
    "resolvedUtc": "When it was answered, cancelled, withdrawn, or timed out.",
    "raisingRunId": "The run that raised it. Open it from the row menu.",
    "id": "The escalation ID (esc_...), for the API and MCP tools.",
    "routedRunId": "The run started so another agent could answer it.",
    "mandateTickId": "The keeper tick that raised it.",
    "parentEscalationId": "The escalation that timed out and was passed up to this one.",
    "escalatedToId": "The escalation this one was passed up to when it timed out.",
    "timeoutAction": "What happens when nobody answers in time.",
    "leaseEpoch": "The run's lease epoch when it raised the escalation. A blocking wait belongs to that epoch.",
    "context": "What the agent said about the situation. It is the agent's text, not instructions to you.",
    "options": "The answers the agent offered. The default is used if it times out with Use the default answer.",
    "answerChoice": "The option chosen.",
    "answerText": "The text of the answer.",
    "actions": {
     "answer": "Answer this escalation with one of its options or free text.",
     "openEscalatedTo": "Open the escalation this one was passed up to.",
     "openRun": "Open the run that raised it.",
     "openKeeper": "Open the keeper whose tick raised it.",
     "cancel": "Cancel it without an answer. A run blocked on it is cancelled too."
    }
   },
   "keepers": {
    "escalationTargetKind": "Who this keeper's escalations go to when it does not name anyone, and where timed-out ones are passed up.",
    "escalationTargetId": "The user ID or email, role name, or agent ID or name to escalate to."
   },
   "notifications": {
    "escalationMinimumSeverity": "Send escalation events only at this severity or above. Applies to Escalation raised and Escalation timed out."
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "Open this run.",
    "openEscalation": "Open this escalation.",
    "back": "Back to the list of escalations.",
    "viewJson": "Show the escalation as returned by the API.",
    "question": "The question and context as the agent wrote them, and the options it offered.",
    "answer": "How the escalation was resolved.",
    "openAgent": "Open the agent that raised it.",
    "openKeeper": "Open the keeper whose tick raised it."
   },
   "home": {
    "escalations": {
     "title": "Escalations waiting for an answer, most urgent first.",
     "open": "Open the escalations list."
    }
   }
  },
  "filters": {
   "severity": "Show only escalations of this severity. Choose All to remove the filter.",
   "targetKind": "Show only escalations addressed to users, roles, or agents. Choose All to remove the filter."
  }
 },
 "explainers": {
  "escalations": {
   "title": "Escalations",
   "p1": "An escalation is a question an agent asks when it should not decide alone. It goes to a user, to everyone with a role, or to another agent, with optional choices, a default answer, a severity, and a timeout.",
   "p2": "Most escalations are non-blocking: the run carries on, and a keeper finds the answer in its next tick. A blocking escalation suspends its run, which resumes with the answer once someone replies.",
   "p3": "If nobody answers in time, the timeout action runs: use the default answer, cancel, or pass the question up to the keeper's default target. Answers reach the agent as data and cannot widen its permissions."
  }
 }
});

// Brakes (AA3.8): the Freezes page, the freeze and lift dialogs, the frozen banners, the autonomy kill switch on
// Settings and the Home Autonomy card, the freeze enums and audit and notification events, and the brake error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "freezes": {
    "label": "Freezes",
    "tip": "Brakes on agents, deployments, keepers, and apps, and the autonomy kill switch"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "Freeze"
  },
  "auditEventType": {
   "FreezeApplied": "Freeze applied",
   "FreezeLifted": "Freeze lifted",
   "KillSwitchChanged": "Kill switch changed",
   "BoardDirectionGiven": "Board direction given"
  },
  "notificationEvent": {
   "FreezeApplied": "Freeze applied",
   "MandateCapReached": "Keeper spend cap reached"
  },
  "freezeTargetKind": {
   "Agent": "Agent",
   "Deployment": "Deployment",
   "Mandate": "Keeper",
   "App": "App",
   "OrgUnit": "Organization unit",
   "Organization": "Organization",
   "TenantAutonomy": "Kill switch"
  }
 },
 "errorCodes": {
  "Frozen": "This is frozen: new runs are refused until the freeze is lifted.",
  "AlreadyFrozen": "This is already frozen. Lift that freeze first, or leave it in place.",
  "FreezeLifted": "Someone already lifted this freeze.",
  "KillSwitch": "The autonomy kill switch is on, so keeper runs are refused.",
  "MandateBudgetExceeded": "This keeper has spent its budget for this tick or for today.",
  "OrganizationsUnavailable": "Organization freezes arrive with organizations. Freeze an agent, deployment, keeper, or app instead."
 },
 "freezes": {
  "killSwitchTarget": "The autonomy kill switch",
  "freezeTitle": "Freeze?",
  "freezeMessage": "Freeze {{target}}? New runs are refused until the freeze is lifted, and keepers in scope stop waking.",
  "freezePickMessage": "Choose what to freeze. New runs are refused until the freeze is lifted, and keepers in scope stop waking.",
  "pickTarget": "Choose...",
  "reasonPlaceholder": "Why? People who see the freeze read this.",
  "liftTitle": "Lift this freeze?",
  "liftMessage": "Lift the freeze on {{target}}? New runs are accepted again.",
  "liftKeeperMessage": "Lift the freeze on {{target}}? The keeper becomes active again and its next wake is spread over a short window.",
  "bannerOwn": "Frozen: new runs are refused until the freeze is lifted.",
  "bannerTarget": "{{target}} is frozen: its new runs are refused.",
  "bannerKillSwitch": "The autonomy kill switch is on: no keeper ticks start in this tenant.",
  "bannerBy": "Frozen by {{who}} {{when}}.",
  "bannerReason": "Reason: {{reason}}",
  "openTarget": "Open it",
  "status": {
   "active": "Active",
   "lifted": "Lifted"
  },
  "fields": {
   "targetKind": "What to freeze",
   "target": "Target",
   "reason": "Reason (optional)",
   "liftReason": "Reason for lifting (optional)",
   "cancelActiveRuns": "Also cancel runs that are already active"
  },
  "actions": {
   "freeze": "Freeze",
   "freezeAny": "Freeze something",
   "lift": "Lift freeze",
   "openTarget": "Open what it freezes"
  },
  "errors": {
   "reasonMax": "The reason is limited to {{max}} characters.",
   "target": "Choose what to freeze."
  },
  "toasts": {
   "frozen": "{{target}} is frozen.",
   "frozenCancelled_one": "{{target}} is frozen and {{count}} active run was cancelled.",
   "frozenCancelled_other": "{{target}} is frozen and {{count}} active runs were cancelled.",
   "lifted": "The freeze on {{target}} is lifted."
  },
  "killSwitch": {
   "title": "Autonomy kill switch",
   "on": "On",
   "off": "Off",
   "turnOn": "Turn on",
   "turnOff": "Turn off",
   "help": "While the kill switch is on, no keeper ticks start and keeper runs are refused. Invocations by people and API credentials keep working.",
   "changedBy": "Turned on by {{who}} {{when}}.",
   "onTitle": "Turn on the kill switch?",
   "onMessage": "Every keeper in this tenant stops waking, and keeper runs are refused, until the switch is turned off. Ticks already running finish.",
   "offTitle": "Turn off the kill switch?",
   "offMessage": "Keepers start waking again, with their next wakes spread over a short window.",
   "toasts": {
    "on": "The kill switch is on. No keeper ticks start.",
    "off": "The kill switch is off. Keepers wake again."
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "Freezes",
   "subtitle": "Brakes that refuse new runs of an agent, deployment, keeper, or app until someone lifts them. The kill switch shows here too.",
   "add": "Add freeze",
   "create": "Create freeze",
   "edit": "Edit freeze",
   "view": "Freeze details",
   "deleteTitle": "Delete freeze",
   "emptyTitle": "No freezes",
   "emptyBody": "Nothing is frozen. Freeze an agent, deployment, keeper, or app from its page or with Freeze something.",
   "columns": {
    "createdUtc": "Frozen",
    "status": "Status",
    "targetKind": "Kind",
    "target": "Target",
    "reason": "Reason",
    "createdBy": "Frozen by",
    "cancelledRunCount": "Runs cancelled",
    "liftedUtc": "Lifted",
    "liftedBy": "Lifted by",
    "liftReason": "Reason for lifting",
    "targetId": "Target ID",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_one": "{{count}} freeze is active",
    "freezes_other": "{{count}} freezes are active"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "Freezes: brakes on agents, deployments, keepers, and apps, active ones first, with Freeze and Lift."
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "Freezes that stop new runs of an agent, deployment, keeper, or app, and the autonomy kill switch."
   },
   "auditEventType": {
    "FreezeApplied": "Someone froze an agent, deployment, keeper, or app.",
    "FreezeLifted": "Someone lifted a freeze, so runs in its scope are accepted again.",
    "KillSwitchChanged": "Someone turned the autonomy kill switch on or off.",
    "BoardDirectionGiven": "Someone gave the CEO keeper direction from the board."
   },
   "notificationEvent": {
    "FreezeApplied": "Someone froze an agent, deployment, keeper, or app, or turned on the kill switch.",
    "MandateCapReached": "A keeper reached its daily spend cap and stops waking until the next UTC day."
   },
   "freezeTargetKind": {
    "Agent": "Every deployment of the agent: new runs are refused and its keepers stop waking.",
    "Deployment": "One deployment: new runs are refused and keepers that run on it stop waking.",
    "Mandate": "One keeper: it stops waking until the freeze is lifted.",
    "App": "One app: new conversations and turns in its chat are refused.",
    "OrgUnit": "An organization unit. Not available until organizations arrive.",
    "Organization": "A whole organization. Not available until organizations arrive.",
    "TenantAutonomy": "The kill switch: no keeper ticks start anywhere in the tenant."
   }
  },
  "freezes": {
   "denied": "You may not do this. It needs {{operation}} on Freeze.",
   "openTarget": "Open the page of what this freeze stops.",
   "status": {
    "active": "In force: new runs in scope are refused.",
    "lifted": "Someone lifted it; runs are accepted again."
   },
   "actions": {
    "freeze": "Freeze it: new runs are refused and keepers in scope stop waking until the freeze is lifted. You confirm first.",
    "freezeAny": "Choose an agent, deployment, keeper, or app and freeze it. You confirm first.",
    "lift": "Lift the freeze so new runs are accepted again. You confirm first."
   },
   "fields": {
    "targetKind": "Freeze an agent (all its deployments), one deployment, one keeper, or one app.",
    "target": "The record to freeze.",
    "reason": "Optional. Shown on the frozen banner and in the audit log.",
    "liftReason": "Optional. Recorded with the freeze and in the audit log.",
    "cancelActiveRuns": "Also cancel the runs in scope that are already queued or running. Without it they finish."
   },
   "filters": {
    "active": "Show only active freezes or only lifted ones. Choose All to show both.",
    "targetKind": "Show only freezes of this kind. Choose All to remove the filter."
   },
   "killSwitch": {
    "title": "One switch that stops every keeper in this tenant. Ordinary invocations keep working.",
    "on": "On: no keeper ticks start and keeper runs are refused.",
    "off": "Off: keepers wake on their schedules.",
    "turnOn": "Stop every keeper in this tenant. You confirm first.",
    "turnOff": "Let keepers wake again. You confirm first."
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "When it was frozen. Hover for the exact time.",
    "status": "Active while the freeze is in force; Lifted after.",
    "targetKind": "What kind of record is frozen.",
    "target": "The frozen agent, deployment, keeper, or app.",
    "reason": "Why it was frozen. Hover for the full text.",
    "createdBy": "The person or API credential that applied the freeze.",
    "cancelledRunCount": "How many active runs the freeze cancelled, when it was asked to.",
    "liftedUtc": "When the freeze was lifted.",
    "liftedBy": "The person or API credential that lifted the freeze.",
    "liftReason": "Why the freeze was lifted, as the person wrote it.",
    "targetId": "The ID of the frozen record.",
    "id": "The freeze ID (mfz_...), for the API and MCP tools."
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "Open the list of active freezes."
    }
   }
  },
  "filters": {
   "active": "Show only active records or only inactive ones. Choose All to show both."
  }
 },
 "explainers": {
  "freezes": {
   "title": "Freezes",
   "p1": "A freeze is a brake. While it is active, Garrison refuses new runs of the frozen agent, deployment, keeper, or app with 409 Frozen, and keepers in scope stop waking. Runs already active finish unless the freeze also cancels them.",
   "p2": "Freeze from an agent, deployment, keeper, or app page, or here with Freeze something. Lifting a freeze accepts runs again; a frozen keeper becomes active with its next wake spread over a short window.",
   "p3": "The autonomy kill switch, on Settings and the Home page, stops every keeper tick in the tenant at once. It shows here as a Kill switch freeze."
  }
 }
});

// Scoped memory (AA4.13): the Memory page, its scope list, content viewer, and delete dialog, the scope kind enum,
// the Memory resource type, and the memory error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "memory": {
    "label": "Memory",
    "tip": "What agents and people saved, by scope, with who wrote each entry and when"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "Memory"
  },
  "memoryScopeKind": {
   "Agent": "Agent",
   "App": "App",
   "OrgUnit": "Organization unit",
   "Organization": "Organization"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "This memory entry changed since you loaded it. Reload it and decide again.",
  "MemoryDisabled": "Agent memory is turned off on this server, so entry text cannot be read and entries cannot be deleted."
 },
 "memory": {
  "legacy": "Legacy",
  "deletedScope": "{{id}} (deleted)",
  "neverRead": "Never",
  "noExpiry": "Never",
  "deleteTitle": "Delete this memory entry?",
  "deleteMessage": "Delete {{key}} from {{scope}}? Agents that look for it find nothing, and its text is removed. This cannot be undone.",
  "deleteVersion": "This deletes version {{version}}, the one you loaded. If someone wrote a newer version since, the delete is refused.",
  "deleteReloaded": "Reloaded: the entry is now at version {{version}}. Delete removes this version.",
  "scopes": {
   "label": "Memory scopes",
   "all": "All scopes",
   "totals_one": "{{entries}} entry, {{bytes}}",
   "totals_other": "{{entries}} entries, {{bytes}}",
   "loadFailed": "The memory scopes could not be loaded.",
   "empty": {
    "Agent": "No agent has saved memory yet.",
    "App": "No app has shared memory yet.",
    "OrgUnit": "No organization unit has memory yet.",
    "Organization": "No organization has memory yet."
   }
  },
  "filters": {
   "search": "Search",
   "searchPlaceholder": "Key, category, or tag",
   "categoryPlaceholder": "Category",
   "tag": "Tag",
   "tagPlaceholder": "Tag",
   "writer": "Written by"
  },
  "actions": {
   "viewContent": "View content",
   "copyId": "Copy ID",
   "openRun": "Open writer run",
   "reload": "Reload entry"
  },
  "viewer": {
   "title": "Memory entry",
   "content": "Saved content",
   "untrusted": "This is data an agent or a person saved. It is shown as plain text exactly as stored; nothing in it is run, rendered, or followed.",
   "loading": "Loading the saved text...",
   "empty": "This entry holds no text."
  },
  "errors": {
   "conflict": "Someone changed this entry since you loaded version {{version}}, so it was not deleted. Reload it to see what it holds now.",
   "gone": "This entry no longer exists. Someone else may have deleted it."
  },
  "toasts": {
   "deleted": "Deleted {{key}}.",
   "copied": "Copied the entry ID."
  }
 },
 "resources": {
  "memory": {
   "title": "Memory",
   "subtitle": "What agents and people saved, by scope: who wrote each entry, when, from which run, and how big it is. Open an entry to read it, and delete what should not be remembered.",
   "add": "Add memory entry",
   "create": "Create memory entry",
   "edit": "Edit memory entry",
   "view": "Memory entry",
   "deleteTitle": "Delete memory entry",
   "emptyTitle": "No memory yet",
   "emptyBody": "Agents save memory with the garrison_memory tools while they run. Entries show here by scope once one is written.",
   "columns": {
    "key": "Key",
    "scope": "Scope",
    "category": "Category",
    "tags": "Tags",
    "writer": "Written by",
    "lastUpdateUtc": "Last written",
    "lastReadUtc": "Last read",
    "version": "Version",
    "bytes": "Size",
    "expiresUtc": "Expires",
    "writerRunId": "Writer run",
    "createdUtc": "Created",
    "sha256": "SHA-256",
    "id": "ID"
   }
  }
 }
});

// Reports (AA5.10): the Reports page, the report page and its metric chart, the File report dialog, the report
// enums, the Report resource type, and the ReportUnhealthy notification event.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "reports": {
    "label": "Reports",
    "tip": "Status reports, incidents, decisions, and handoffs that agents and people filed, with health and metrics"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "Report"
  },
  "notificationEvent": {
   "ReportUnhealthy": "Unhealthy report filed"
  },
  "reportKind": {
   "Status": "Status",
   "Incident": "Incident",
   "Decision": "Decision",
   "Handoff": "Handoff",
   "Brief": "Brief"
  },
  "reportHealth": {
   "Healthy": "Healthy",
   "Degraded": "Degraded",
   "Unhealthy": "Unhealthy",
   "Unknown": "Unknown"
  },
  "reportAudience": {
   "Manager": "Manager",
   "Chain": "Management chain",
   "Board": "Board"
  },
  "reportIssueSeverity": {
   "Low": "Low",
   "Medium": "Medium",
   "High": "High"
  }
 },
 "reports": {
  "untrusted": "An agent or a person wrote this report. Its title, body, metrics, issues, and decisions are shown as plain text exactly as filed; nothing in them is run, rendered, or followed.",
  "period": "{{from}} to {{to}}",
  "periodFrom": "From {{from}}",
  "periodTo": "Until {{to}}",
  "filters": {
   "author": "Author",
   "app": "App",
   "from": "Filed after",
   "to": "Filed before"
  },
  "actions": {
   "file": "File report",
   "copyId": "Copy ID",
   "openRun": "Open run",
   "openKeeper": "Open keeper",
   "openAuthor": "Open author"
  },
  "toasts": {
   "filed": "Filed {{title}}.",
   "copied": "Copied the report ID."
  },
  "file": {
   "title": "File a report",
   "intro": "Write down how things stand. Everyone who can read reports sees it here, and an Unhealthy report notifies the endpoints that subscribe to it. A filed report cannot be changed.",
   "noAgent": "No agent (my own name)",
   "fields": {
    "title": "Title",
    "kind": "Kind",
    "health": "Health",
    "audience": "Audience",
    "agent": "File for agent",
    "body": "Body"
   },
   "errors": {
    "title": "Give the report a title of 1 to {{max}} characters.",
    "body": "The body holds at most {{max}} bytes."
   }
  },
  "chart": {
   "metric": "Metric",
   "title": "{{metric}} over time",
   "help_one": "{{count}} value {{agent}} reported, oldest first.",
   "help_other": "{{count}} values {{agent}} reported, oldest first.",
   "noMetrics": "This report carries no metrics, so there is nothing to chart.",
   "noAuthor": "No agent wrote this report, so there is no author history to chart.",
   "empty": "No values for this metric yet.",
   "failed": "The metric history could not be loaded."
  }
 },
 "views": {
  "reportDetail": {
   "title": "Report",
   "notFoundTitle": "Report not found",
   "notFoundBody": "It does not exist in this tenant, or it was removed with its tenant.",
   "back": "Back to reports",
   "body": "Body",
   "metrics": "Metrics",
   "chart": "Metric history",
   "issues": "Issues",
   "decisions": "Decisions",
   "noBody": "This report has no body.",
   "noMetrics": "This report has no metrics.",
   "noIssues": "No issues reported.",
   "noDecisions": "No decisions recorded.",
   "columns": {
    "name": "Name",
    "value": "Value",
    "unit": "Unit"
   },
   "fields": {
    "health": "Health",
    "kind": "Kind",
    "audience": "Audience",
    "author": "Author",
    "period": "Period",
    "createdUtc": "Filed",
    "filedBy": "Filed by",
    "runId": "Run",
    "mandateId": "Keeper",
    "mandateTickId": "Keeper tick",
    "app": "App",
    "orgUnitId": "Organization unit"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "Reports",
   "subtitle": "What agents and people filed upward: how things stand, incidents, decisions, and handoffs, with health and metrics. Open one to read it and chart a metric over time.",
   "add": "File report",
   "create": "File report",
   "edit": "Report",
   "view": "Report details",
   "deleteTitle": "Delete report",
   "emptyTitle": "No reports yet",
   "emptyBody": "Agents file reports with the garrison_file_report tool while they run, and people file them here or through the API. They show here once one is filed.",
   "columns": {
    "createdUtc": "Filed",
    "title": "Title",
    "author": "Author",
    "kind": "Kind",
    "health": "Health",
    "app": "App",
    "period": "Period",
    "issues": "Issues",
    "audience": "Audience",
    "filedBy": "Filed by",
    "runId": "Run",
    "id": "ID"
   }
  }
 }
});

// Messages (AA6.12): the Messages page, the thread page, the agent inbox tab, the Send message dialog, the
// Home card line, the message enums, the AgentMessage resource type, and the Message run kind.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "messages": {
    "label": "Messages",
    "tip": "Mail between agents and from people, with the messages loop guards refused and why"
   },
   "messageThreads": {
    "label": "Message thread",
    "tip": "Every message of one thread, oldest first"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "Agent message"
  },
  "runKind": {
   "Message": "Urgent message"
  },
  "messageStatus": {
   "Queued": "Queued",
   "Delivered": "Delivered",
   "Acknowledged": "Acknowledged",
   "Expired": "Expired",
   "Rejected": "Rejected"
  },
  "messageUrgency": {
   "Normal": "Normal",
   "Urgent": "Urgent"
  },
  "messageRejection": {
   "HopLimit": "Hop limit",
   "LineRate": "Line rate",
   "ThreadBudget": "Thread budget",
   "NoLine": "No line",
   "Frozen": "Recipient frozen"
  }
 },
 "messages": {
  "untrusted": "Agents and people wrote these messages. Subjects, bodies, and rejection details are shown as plain text exactly as sent; nothing in them is run, rendered, or followed.",
  "views": {
   "label": "Which messages",
   "all": "All messages",
   "rejected": "Rejected",
   "rejectedNote": "Messages the loop guards refused when they were sent, with the reason. A rejected message was never delivered."
  },
  "filters": {
   "reason": "Reason",
   "sender": "Sender",
   "recipient": "Recipient",
   "from": "Sent after",
   "to": "Sent before"
  },
  "actions": {
   "send": "Send message",
   "openThread": "Open thread",
   "copyId": "Copy ID",
   "openSender": "Open sender",
   "openRecipient": "Open recipient",
   "openDeliveredRun": "Open delivered run",
   "openEscalation": "Open escalation"
  },
  "toasts": {
   "sent": "Sent to {{recipient}}.",
   "copied": "Copied the message ID."
  },
  "send": {
   "title": "Send a message",
   "intro": "Write to an agent. The message waits in its inbox until a run reads it; an urgent message wakes the agent now.",
   "replyIntro": "Reply in this thread. The reply goes to the agent that sent the message.",
   "pickRecipient": "Choose an agent",
   "ttlPlaceholder": "Server default",
   "sending": "Sending...",
   "rejected": "The loop guards refused this message.",
   "rejectedStored": "The refused message is kept in the Rejected list.",
   "fields": {
    "recipient": "To",
    "subject": "Subject",
    "body": "Body",
    "urgency": "Urgency",
    "ttlSeconds": "Expires after (seconds)"
   },
   "errors": {
    "recipient": "Choose the agent to send the message to.",
    "subject": "Give the message a subject of 1 to {{max}} characters.",
    "body": "The body holds at most {{max}} bytes.",
    "ttlSeconds": "Enter a whole number of seconds from {{min}} to {{max}}, or leave it empty."
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "Message thread",
   "notFoundTitle": "Thread not found",
   "notFoundBody": "It does not exist in this tenant, or it was removed with its tenant.",
   "back": "Back to messages",
   "count_one": "{{count}} message",
   "count_other": "{{count}} messages",
   "rejectedCount_one": "{{count}} rejected",
   "rejectedCount_other": "{{count}} rejected",
   "emptyTitle": "No messages in this thread",
   "emptyBody": "The thread exists but holds no messages you can read.",
   "listLabel": "Messages in this thread, oldest first",
   "noBody": "This message has no body.",
   "noDetail": "No further detail.",
   "woke": "Woke the recipient",
   "artifacts": "Attached artifacts",
   "reply": "Reply",
   "replyPrefix": "Re: ",
   "fields": {
    "sender": "From",
    "recipient": "To",
    "createdUtc": "Sent",
    "hopCount": "Hops",
    "deliveredRunId": "Delivered to run",
    "deliveredUtc": "Delivered",
    "acknowledgedUtc": "Acknowledged",
    "expiresUtc": "Expires",
    "wokeRecipient": "Wake",
    "escalationId": "Escalation",
    "id": "Message ID"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "Inbox",
    "status": "Status",
    "openAll": "Open in Messages",
    "none": "No messages for this agent yet.",
    "noneWithStatus": "No messages for this agent with this status.",
    "more": "Showing the newest {{shown}} of {{total}}. Open in Messages to see them all."
   }
  },
  "home": {
   "autonomy": {
    "rejected_one": "{{count}} message rejected by loop guards in the last 24 hours",
    "rejected_other": "{{count}} messages rejected by loop guards in the last 24 hours",
    "noneRejected": "No messages rejected by loop guards in the last 24 hours"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "Messages",
   "subtitle": "Mail between agents and from people, newest first, with the messages the loop guards refused. Open one to read its whole thread.",
   "add": "Send message",
   "create": "Send message",
   "edit": "Message",
   "view": "Message details",
   "deleteTitle": "Delete message",
   "emptyTitle": "No messages yet",
   "emptyBody": "Agents send messages with the garrison_send_message tool while they run, and people send them here or through the API. They show here once one is sent.",
   "columns": {
    "createdUtc": "Sent",
    "urgency": "Urgency",
    "status": "Status",
    "subject": "Subject",
    "sender": "From",
    "recipient": "To",
    "reason": "Rejection",
    "hopCount": "Hops",
    "deliveredRunId": "Delivered to run",
    "expiresUtc": "Expires",
    "escalationId": "Escalation",
    "threadId": "Thread",
    "id": "ID"
   }
  }
 }
});

// Organizations (AA7.14): the Organizations page, the organization page with its chart, unit editor, budgets, and
// revisions, the organization enums, the Organization resource type, and the organization error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "organizations": {
    "label": "Organizations",
    "tip": "Trees of units with leads, members, peer lines, and budgets, published as revisions"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "Organization"
  },
  "organizationStatus": {
   "Draft": "Draft",
   "Active": "Active",
   "Frozen": "Frozen",
   "Retired": "Retired"
  },
  "budgetPeriod": {
   "Day": "Day",
   "Month": "Month"
  },
  "orgRevisionState": {
   "Draft": "Draft",
   "Published": "Published",
   "Superseded": "Superseded"
  }
 },
 "organizations": {
  "notPublished": "Not published",
  "actions": {
   "open": "Open organization",
   "copyId": "Copy ID"
  },
  "toasts": {
   "copied": "Copied the organization ID.",
   "unitAdded": "Added unit {{name}} to the working tree.",
   "unitSaved": "Saved unit {{name}}.",
   "unitRemoved": "Removed unit {{name}} from the working tree.",
   "published": "Revision {{number}} is live.",
   "drafted": "Saved revision {{number}} as a draft.",
   "rolledBack": "Rolled back to revision {{number}}. Revision {{live}} is live.",
   "retired": "Retired {{name}}.",
   "reactivated": "Brought {{name}} back."
  },
  "errors": {
   "OneRoot": "An organization has exactly one root unit, the one without a parent.",
   "ParentNotFound": "The parent unit is not part of this organization.",
   "Cycle": "A unit cannot sit below itself or below one of its own units.",
   "UnitNameTaken": "Another unit of this organization already has this name.",
   "LeadsTwoUnits": "This agent already leads another unit. An agent leads at most one unit per organization.",
   "PositionTaken": "This agent already holds a position in the organization. An agent is a lead or a member of one unit only.",
   "PeerNotFound": "A peer line points at a unit that is not part of this organization.",
   "BudgetPeriodTaken": "A unit has one budget per period.",
   "BudgetInvalid": "A budget must be a positive amount in US dollars.",
   "BudgetExceedsParent": "A unit's budget cannot be larger than the budget of the unit above it.",
   "TooManyUnits": "The organization already has as many units as the server allows.",
   "TooManyMembers": "The unit already has as many members as the server allows.",
   "TooManyPeerLines": "The unit already has as many peer lines as the server allows.",
   "UnitHasChildren": "Remove or move the units below this one first.",
   "OrganizationRetired": "The organization is retired. Bring it back before changing it.",
   "AgentInactive": "The agent does not exist or is not active.",
   "MandateMismatch": "The keeper belongs to another agent. Pick a keeper of the agent in this position.",
   "RevisionMismatch": "That revision belongs to another organization.",
   "RevisionPublished": "That revision was already published.",
   "RevisionNeverPublished": "Only revisions that were live once can be rolled back to.",
   "AlreadyLive": "That revision is already live.",
   "NothingToRollBack": "There is no earlier live revision to return to.",
   "StatusNotSettable": "An organization can be retired, or brought back from retired. Publishing and freezes set the other statuses.",
   "NameConflict": "Another organization already uses this name."
  },
  "spend": {
   "noBudget": "{{period}}: {{spent}} spent, no budget",
   "of": "{{period}}: {{spent}} of {{amount}} ({{percent}})",
   "exhausted": "Budget used up"
  },
  "chart": {
   "lead": "Lead",
   "noLead": "No lead",
   "members": "Members ({{count}})",
   "peers": "Peer lines",
   "app": "App",
   "collapse": "Collapse the units below {{name}}",
   "expand": "Expand the units below {{name}}",
   "addChild": "Add unit below"
  },
  "unit": {
   "addTitle": "Add a unit",
   "editTitle": "Edit unit {{name}}",
   "add": "Add unit",
   "saving": "Saving...",
   "intro": "Changes go to the working tree. Nothing goes live until you publish a revision. Names hold up to {{max}} characters.",
   "namePlaceholder": "billing",
   "titlePlaceholder": "Head of billing",
   "noParent": "None (the root unit)",
   "noLead": "No lead yet",
   "noMandate": "No keeper",
   "noApp": "No app",
   "noPeers": "Add another unit first to draw a peer line to it.",
   "noBudget": "No budget",
   "addMember": "Add member",
   "sections": {
    "lead": "Lead",
    "members": "Members and peer lines",
    "budgets": "Budgets"
   },
   "fields": {
    "name": "Name",
    "parentUnitId": "Reports to",
    "description": "Description",
    "leadAgentId": "Lead agent",
    "leadTitle": "Lead title",
    "leadMandateId": "Lead keeper",
    "appId": "App",
    "members": "Members",
    "memberAgent": "Agent",
    "memberTitle": "Title",
    "memberMandate": "Keeper",
    "peerUnitIds": "Peer lines",
    "budgetDay": "Daily budget (USD)",
    "budgetMonth": "Monthly budget (USD)"
   },
   "errors": {
    "name": "Give the unit a name of 1 to {{max}} characters.",
    "description": "The description holds at most {{max}} characters.",
    "title": "A title holds at most {{max}} characters.",
    "memberAgent": "Pick an agent for every member, or remove the empty row.",
    "duplicateAgent": "An agent can hold only one position in the unit.",
    "budget": "Enter an amount above zero, or leave it empty for no budget."
   }
  },
  "form": {
   "errors": {
    "name": "Give the organization a name of 1 to {{max}} characters.",
    "text": "This field holds at most {{max}} characters."
   }
  },
  "diff": {
   "none": "No differences. The two trees are the same.",
   "empty": "(none)",
   "between": "From {{before}} to {{after}}.",
   "added": "Units added ({{count}})",
   "removed": "Units removed ({{count}})",
   "changed": "Units changed ({{count}})",
   "field": "Field",
   "fields": {
    "name": "Name",
    "description": "Description",
    "parent": "Reports to",
    "lead": "Lead",
    "leadTitle": "Lead title",
    "leadMandate": "Lead keeper",
    "app": "App",
    "members": "Members",
    "peers": "Peer lines",
    "budgets": "Budgets"
   },
   "title": "Revision {{number}} compared with the live organization",
   "pendingTitle": "Unpublished changes",
   "nothingLive": "nothing live yet",
   "working": "the working tree"
  },
  "revisions": {
   "label": "Revision {{number}}",
   "rollbackOf": "(copy of revision {{number}})"
  },
  "rollback": {
   "note": "Rolled back to revision {{number}} from the dashboard."
  }
 },
 "views": {
  "organizationDetail": {
   "title": "Organization",
   "heading": "Organization {{name}}",
   "notFoundTitle": "Organization not found",
   "notFoundBody": "It does not exist in this tenant, or it was deleted.",
   "live": "Live updates",
   "editDetails": "Edit details",
   "reactivate": "Bring back",
   "retire": "Retire",
   "publish": "Publish changes",
   "retiredBanner": "This organization is retired. Its chain of command, lines, and budgets no longer apply, and nothing in it can change until you bring it back.",
   "pending": "The working tree has unpublished changes: {{added}} added, {{changed}} changed, {{removed}} removed.",
   "neverPublished": "Nothing is live yet. Publish a revision to put this organization to work.",
   "reviewPending": "Review changes",
   "units": "Units",
   "lastUpdate": "Last changed",
   "tabs": {
    "chart": "Chart",
    "budgets": "Budgets and spend",
    "revisions": "Revisions ({{count}})"
   },
   "chartView": "Which tree",
   "viewWorking": "Working tree",
   "viewLive": "Live",
   "addUnit": "Add unit",
   "addRoot": "Add the root unit",
   "workingNote": "The working tree is what you edit. Publish a revision to make it live.",
   "liveNote": "The live revision: the chain of command, lines, and budgets follow this tree.",
   "noUnitsTitle": "No units yet",
   "noUnitsBody": "Add the root unit, led by the agent at the top, then add units below it.",
   "budgetsNote": "Each budget caps what the unit and every unit below it may spend in a UTC day or month. Spend counts the known cost of finished runs under the live revision.",
   "noBudgetsTitle": "No budgets",
   "noBudgetsBody": "Edit a unit to give it a daily or monthly budget.",
   "noSpend": "No spend recorded",
   "columns": {
    "unit": "Unit",
    "day": "Day",
    "month": "Month",
    "spend": "Spend",
    "number": "Revision",
    "state": "State",
    "note": "Note",
    "author": "Author",
    "created": "Created",
    "published": "Published"
   },
   "noRevisionsTitle": "No revisions yet",
   "noRevisionsBody": "Publish changes to snapshot the working tree as a revision.",
   "current": "Live",
   "compare": "Compare with live",
   "publishRevision": "Publish",
   "rollback": "Roll back",
   "publishTitle": "Publish changes",
   "publishIntro": "Publishing snapshots the working tree as a new revision and makes it live, with the current revision of every keeper it names. Save as draft keeps the snapshot without making it live.",
   "saveDraft": "Save as draft",
   "publishNow": "Publish",
   "note": "Note",
   "diffNote": "Note: {{note}}",
   "removeUnitTitle": "Remove unit",
   "confirmRemoveUnit": "Remove unit {{name}} from the working tree? Peer lines that point at it go too. The live organization does not change until you publish.",
   "rollbackTitle": "Roll back",
   "confirmRollback": "Make revision {{number}} live again in place of revision {{live}}? The working tree and the keepers it names return to that revision, and the rollback is recorded as a new revision.",
   "retireTitle": "Retire organization",
   "confirmRetire": "Retire {{name}}? Its chain of command, lines, and budgets stop applying, and it cannot change until you bring it back.",
   "confirmDelete": "Delete {{name}} with its {{units}} units and {{revisions}} revisions? Memory saved for its units and for the organization is deleted too. This cannot be undone."
  }
 },
 "resources": {
  "organizations": {
   "title": "Organizations",
   "subtitle": "Trees of units, each led by an agent with members, peer lines, and budgets. Open one to edit its chart and publish it.",
   "add": "Create organization",
   "create": "Create organization",
   "edit": "Edit organization",
   "view": "Organization details",
   "deleteTitle": "Delete organization",
   "emptyTitle": "No organizations yet",
   "emptyBody": "Create an organization, add a root unit led by the agent at the top, add units below it, and publish.",
   "columns": {
    "name": "Name",
    "status": "Status",
    "currentRevisionNumber": "Live revision",
    "description": "Description",
    "createdUtc": "Created",
    "mission": "Mission",
    "id": "ID"
   },
   "fields": {
    "name": "Name",
    "description": "Description",
    "mission": "Mission"
   },
   "hints": {
    "name": "1 to {{max}} characters, unique in the tenant.",
    "description": "Optional, at most {{max}} characters.",
    "mission": "What the organization is for, in plain words. Optional, at most {{max}} characters."
   }
  }
 }
});

// Organizations on the studio canvas (AA7.10): the Apps and Organizations switch, the organization canvas, its
// toolbar, panels, outline, and keyboard help, the unit operations, and their field codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "common": {
  "fieldCodes": {
   "OneRoot": "The organization already has a root unit. Pick a parent for this unit.",
   "UnitNameTaken": "The organization already has a unit with this name.",
   "UnitNotFound": "The organization has no unit with this name.",
   "UnitHasChildren": "Remove the units below this one first.",
   "NoSuchPeerLine": "These two units have no peer line.",
   "OrganizationDeleted": "The draft deletes this organization. Put it back first.",
   "PeerNotFound": "A unit cannot have a peer line to itself."
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "What the canvas shows",
     "apps": "Apps",
     "organizations": "Organizations"
    },
    "operations": {
     "AddUnit": "Adding a unit",
     "RemoveUnit": "Removing a unit",
     "AddUnitMember": "Adding a member",
     "RemoveUnitMember": "Removing a member",
     "ConnectUnits": "Adding a peer line",
     "DisconnectUnits": "Removing a peer line"
    },
    "org": {
     "none": "The draft holds no organization yet. Type an organization name and a unit name above to start one; its first unit is the root.",
     "flowLabel": "Organization {{organization}}",
     "picker": "Organization",
     "units": "Units",
     "root": "Root unit",
     "peers": "Peer lines",
     "orgTitle": "Organization {{name}}",
     "orgHint": "Select a unit to edit its members and peer lines. Units sit inside the unit they report to.",
     "deleted": "The draft deletes this organization. Its units cannot change until it is put back.",
     "unitTitle": "Unit {{name}}",
     "reportsTo": "Reports to",
     "lead": "Lead",
     "members": "Members ({{count}})",
     "noMembers": "No members besides the lead.",
     "memberAgent": "Agent",
     "memberTitle": "Title (optional)",
     "addMember": "Add member",
     "removeMember": "Remove",
     "noPeers": "No peer lines.",
     "disconnect": "Disconnect",
     "addChild": "Add unit below",
     "startPeer": "Start peer line",
     "removeUnit": "Remove unit",
     "peerTitle": "Peer line {{from}} and {{to}}",
     "peerHint": "{{from}} and {{to}} may message each other directly, without going through a shared manager.",
     "peerList": "Peer lines ({{total}})",
     "noPeerLines": "No peer lines yet. Select a unit and start one, or drag from a unit's right handle to another unit.",
     "removeTitle": "Remove unit",
     "removeMessage": "Remove unit {{name}} from organization {{organization}} in this draft? Peer lines that name it go too. A unit with units below it cannot be removed.",
     "toolbar": {
      "label": "Organization tools",
      "addUnit": "Add unit",
      "unitPlaceholder": "Unit name",
      "parent": "Reports to",
      "noParent": "No parent (root)",
      "under": "Under {{name}}",
      "lead": "Lead agent",
      "leadPlaceholder": "Lead agent (optional)",
      "leadTitle": "Lead title (optional)",
      "organization": "Organization",
      "add": "Add"
     },
     "connectBar": {
      "message": "Drawing a peer line from {{name}}."
     },
     "keys": {
      "tab": "Tab moves through the units, each unit before the units below it.",
      "select": "Enter or Space selects the focused unit and opens its properties.",
      "peer": "C on a unit starts a peer line from it; C or Enter on another unit finishes it.",
      "remove": "Delete removes the focused unit, after a confirmation.",
      "add": "N jumps to the Add unit field.",
      "peers": "In the list of peer lines, Enter selects a line and Delete removes it.",
      "escape": "Escape cancels a peer line you started."
     },
     "node": {
      "root": "Root",
      "reportsTo": "reports to {{name}}",
      "lead": "Lead: {{name}}",
      "noLead": "No lead",
      "members": "members {{list}}"
     },
     "summary": {
      "none": "There is no organization to describe.",
      "units_one": "Organization {{organization}} has {{count}} unit.",
      "units_other": "Organization {{organization}} has {{count}} units.",
      "root": "The root unit is {{name}}.",
      "peerCount_one": "There is {{count}} peer line.",
      "peerCount_other": "There are {{count}} peer lines.",
      "unitRoot": "{{name}} is the root unit and {{lead}}.",
      "unitChild": "{{name}} reports to {{parent}} and {{lead}}.",
      "ledBy": "is led by {{name}}",
      "noLead": "has no lead",
      "peer": "{{from}} and {{to}} have a peer line."
     },
     "a11y": {
      "unit": "Press Enter or Space to select this unit. Press C to start a peer line, Delete to remove the unit.",
      "peer": "A peer line between two units.",
      "handle": "Drag to another unit to draw a peer line"
     },
     "announce": {
      "added": "Added unit {{name}} to {{organization}}.",
      "peerStart": "Drawing a peer line from {{name}}. Move to the other unit and press Enter, or press Escape to cancel.",
      "connected": "{{from}} and {{to}} now have a peer line.",
      "disconnected": "{{from}} and {{to}} no longer have a peer line.",
      "memberAdded": "Added {{name}} to unit {{unit}}.",
      "memberRemoved": "Removed {{name}} from unit {{unit}}.",
      "removed": "Removed unit {{name}} from {{organization}}."
     }
    }
   }
  }
 }
});

// Change rules and proposals (AA8.12): the Change rules page, the Proposals tab of the organization page, the change
// class and management access enums, the ChangeRule resource type, the OrgProposalApplied event, and the error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "changeRules": {
    "label": "Change rules",
    "tip": "Routine changes that executives may make in their subtrees without asking"
   }
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "Change rule"
  },
  "notificationEvent": {
   "OrgProposalApplied": "Org proposal applied"
  },
  "managementAccess": {
   "None": "None",
   "Drafts": "Studio drafts",
   "OrgSubtree": "Executive over its subtree"
  },
  "changeClass": {
   "PromptRetune": "Prompt retune",
   "WakeTuning": "Wake tuning",
   "MandateTextEdit": "Keeper text edit",
   "AddWorker": "Add worker",
   "RemoveWorker": "Remove worker",
   "ModelChange": "Model change",
   "DeploymentWeight": "Deployment weight"
  }
 },
 "errorCodes": {
  "RulesArePeopleOnly": "Only people write change rules. An agent cannot create, change, or delete one.",
  "ProposalNotPending": "This proposal is no longer waiting for a decision. Open it again to see where it stands.",
  "ApproverIsAgent": "An agent cannot decide a proposal. A person has to."
 },
 "changeRules": {
  "actions": {
   "openOrganization": "Open organization",
   "copyId": "Copy ID"
  },
  "toasts": {
   "copied": "Copied the change rule ID."
  },
  "status": {
   "Active": "In force",
   "Inactive": "Switched off",
   "Expired": "Expired"
  },
  "limit": {
   "text": "{{class}}, {{name}}: {{range}}",
   "between": "{{min}} to {{max}}",
   "atMost": "at most {{max}}",
   "atLeast": "at least {{min}}",
   "any": "no bound"
  },
  "limitNames": {
   "count": "Changes per proposal",
   "minIntervalSeconds": "Shortest wake interval (seconds)",
   "maxIntervalSeconds": "Longest wake interval (seconds)",
   "backoffFactor": "Backoff factor",
   "jitterPercent": "Jitter (percent)",
   "weight": "Traffic weight"
  },
  "errors": {
   "UnknownLimit": "This class has no limit by that name. Pick one from the list.",
   "ClassNotInRule": "A limit must be for a class the rule lists. Add the class or change the limit.",
   "UnitNotFound": "That unit is not in the live chart of this organization.",
   "Duplicate": "Each class and each limit can appear only once.",
   "BoundRequired": "Give the limit a minimum, a maximum, or both.",
   "MinimumAboveMaximum": "The minimum is larger than the maximum.",
   "NegativeBound": "Limits are zero or more.",
   "ExpiryInPast": "Pick an expiry in the future, or leave it empty so the rule never expires.",
   "OrganizationNotFound": "That organization does not exist in this tenant.",
   "OrganizationNotSettable": "A rule stays with its organization. Create a new rule for another one.",
   "TooMany": "A rule holds at most {{max}} limits."
  },
  "form": {
   "errors": {
    "name": "Give the rule a name of 1 to {{max}} characters.",
    "description": "The description holds at most {{max}} characters.",
    "organization": "Pick the organization the rule is for.",
    "unit": "Pick a unit of this organization.",
    "classes": "Pick at least one class of change."
   }
  }
 },
 "orgProposals": {
  "title": "Proposals",
  "note": "Executives propose changes to the units they lead. A proposal applies at once when change rules cover every change in it. Anything else waits here for a person.",
  "rulesLink": "Change rules",
  "views": {
   "label": "Which proposals",
   "all": "All",
   "needsApproval": "Needs approval",
   "needsApprovalCount": "Needs approval ({{count}})",
   "applied": "Applied"
  },
  "emptyTitle": "No proposals here",
  "emptyBody": "When an executive proposes a change to the units below it, the proposal shows up here.",
  "columns": {
   "title": "Proposal",
   "unit": "Unit",
   "agent": "Executive",
   "decision": "Decision",
   "updated": "Last changed"
  },
  "decision": {
   "rule": "Applied by rule",
   "approved": "Approved",
   "needsApproval": "Needs approval",
   "denied": "Denied",
   "lapsed": "Lapsed",
   "drafting": "Being drafted"
  },
  "byRules": "Rules: {{names}}",
  "byPerson": "By {{name}}",
  "decide": "Review and decide",
  "toasts": {
   "approved": "Approved {{title}}. It is live now.",
   "denied": "Denied {{title}}. It went back to the executive."
  },
  "review": {
   "open": "Review",
   "title": "Proposal: {{title}}",
   "run": "Proposed in run",
   "approve": "Approve",
   "deny": "Deny",
   "appliedByRule": "Applied at once because change rules covered every change. Rules: {{names}}.",
   "approvedBy": "Approved by {{name}}.",
   "deniedBy": "Denied by {{name}}.",
   "reasonGiven": "Reason: {{reason}}",
   "revision": "Recorded as revision {{number}} of the organization. Roll back that revision to undo it.",
   "appliedNoDiff": "This proposal is applied, so its changes are part of the live configuration. Compare the revision it was recorded as to see them.",
   "covered": "Change rules cover every change below, so this proposal applies without a person.",
   "notCovered": "At least one change below is not covered by a change rule, so a person decides.",
   "refusals": "Hard limits refuse these changes. No rule or approval can lift them:",
   "noChanges": "The proposal holds no changes.",
   "columns": {
    "item": "Change",
    "change": "Kind",
    "rule": "Covered by"
   },
   "coveredBy": "Rule {{name}}",
   "reason": "Reason",
   "reasonPlaceholder": "Optional. The executive sees it."
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "Proposals ({{count}})"
   },
   "appliedProposal": "Applied proposal"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "managementAccess": "Management access"
   },
   "hints": {
    "managementAccess": "Most agents need None. Studio drafts lets runs draft studio changes for the person who started them. Executive over its subtree lets the agent that leads an organization unit propose changes to the units below it."
   }
  },
  "changeRules": {
   "title": "Change rules",
   "subtitle": "Routine changes that executives may make in their subtrees without waiting for a person. Anything a rule does not cover still needs approval.",
   "add": "Add rule",
   "create": "Add change rule",
   "edit": "Edit change rule",
   "view": "Change rule",
   "deleteTitle": "Delete change rule",
   "emptyTitle": "No change rules yet",
   "emptyBody": "Add a rule to let executives apply routine changes, such as wake tuning, without waiting for approval.",
   "noLimits": "No limits",
   "noExpiry": "Never",
   "chooseOrganization": "Choose an organization",
   "chooseUnit": "Choose a unit",
   "addLimit": "Add limit",
   "filters": {
    "activeOnly": "Status",
    "inForce": "In force only"
   },
   "columns": {
    "name": "Name",
    "status": "Status",
    "organization": "Organization",
    "unit": "Covers",
    "classes": "Classes",
    "limits": "Limits",
    "expiresUtc": "Expires",
    "createdByName": "Created by",
    "description": "Description",
    "createdUtc": "Created",
    "id": "ID"
   },
   "fields": {
    "organizationId": "Organization",
    "unitId": "Unit (with the units below it)",
    "name": "Name",
    "description": "Description",
    "classes": "Classes of change",
    "limits": "Limits",
    "limitClass": "Class",
    "limitName": "Limit",
    "minimum": "Minimum",
    "maximum": "Maximum",
    "active": "In force",
    "expiresUtc": "Expires"
   },
   "hints": {
    "organizationId": "Required. A rule stays with its organization.",
    "unitId": "Required. The rule covers changes to this unit and every unit below it.",
    "name": "1 to {{max}} characters.",
    "description": "Optional, at most {{max}} characters.",
    "classes": "Required. A proposal applies by rule only when every change in it is of a class some rule allows.",
    "limits": "Optional, at most {{max}}. Changes per proposal caps how many changes of a class one proposal may hold; the others bound the new values.",
    "expiresUtc": "Optional. The rule stops applying at this time."
   }
  }
 }
});

// Evaluations (AA9.9, AA9.15): the Eval sets, Eval runs, Shadow trials, and Canary releases pages under Autonomy,
// the case and run forms, the playground's Save as eval case, the new enums, resource types, run kinds, the
// CanaryRolledBack event, and the error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "evaluations": {
    "label": "Eval sets",
    "tip": "Versioned sets of cases that grade agents before they ship"
   },
   "evalRuns": {
    "label": "Eval runs",
    "tip": "Runs of an eval set against a deployment or an agent revision"
   },
   "shadowTrials": {
    "label": "Shadow trials",
    "tip": "A candidate deployment replays real inputs without acting"
   },
   "canaryReleases": {
    "label": "Canary releases",
    "tip": "A candidate deployment takes a rising share of traffic in steps"
   }
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "Eval set",
   "EvalRun": "Eval run",
   "ShadowTrial": "Shadow trial",
   "CanaryRelease": "Canary release"
  },
  "notificationEvent": {
   "CanaryRolledBack": "Canary rolled back"
  },
  "runKind": {
   "Eval": "Eval case",
   "Shadow": "Shadow copy"
  },
  "evalSetState": {
   "Draft": "Draft",
   "Approved": "Approved"
  },
  "evalSetOrigin": {
   "Human": "Written by a person",
   "Evaluator": "Written by an agent",
   "Playground": "From the playground"
  },
  "evalScorer": {
   "ExactMatch": "Exact match",
   "Contains": "Contains",
   "JsonSchemaValid": "Valid JSON Schema",
   "Judge": "Judge agent"
  },
  "evalRunStatus": {
   "Pending": "Pending",
   "Running": "Running",
   "Completed": "Completed",
   "Failed": "Failed",
   "Cancelled": "Cancelled"
  },
  "evalRunTarget": {
   "AgentRevision": "Agent revision",
   "Deployment": "Deployment"
  },
  "evalRunInputMode": {
   "Cases": "The set's cases",
   "RecentInputs": "Recent inputs"
  },
  "shadowTrialStatus": {
   "Running": "Running",
   "Completed": "Completed",
   "Stopped": "Stopped",
   "Failed": "Failed"
  },
  "canaryStatus": {
   "Running": "Running",
   "Promoted": "Promoted",
   "RolledBack": "Rolled back",
   "Aborted": "Aborted"
  }
 },
 "errorCodes": {
  "EvalSetExists": "An eval set with this name already exists. Open it and edit it to make its next version.",
  "AlreadyApproved": "This version is already approved.",
  "EvalSetEmpty": "This eval set has no cases yet. Add a case first.",
  "EvalSetImmutable": "This version is approved and is kept as it is. Edit it to open the next version, or delete a draft version instead.",
  "ApprovalIsPeopleOnly": "Only a person can approve an eval set. An agent cannot approve the set that grades it.",
  "EvalRunFinished": "This eval run has already finished.",
  "ShadowTrialAlreadyRunning": "This candidate is already shadowing that deployment in another trial.",
  "ShadowTrialNotRunning": "This shadow trial is no longer running.",
  "CanaryAlreadyRunning": "One of these deployments is already in a running canary release.",
  "CanaryNotRunning": "This canary release is no longer running.",
  "EvalGateFailed": "The promotion needs a passing eval run of this revision against the environment's approved eval set, and there is none yet.",
  "PeopleOnly": "Only people and API credentials can do this. A run token cannot."
 },
 "evals": {
  "versionShort": "v{{version}}",
  "setVersion": "{{name}} v{{version}}",
  "percent": "{{value}}%",
  "progress": "{{completed}} of {{total}} cases, {{passed}} passed",
  "noJudge": "No judge",
  "noSet": "None",
  "untilStopped": "Until stopped",
  "verdict": {
   "passed": "Passed",
   "failed": "Below threshold",
   "none": "No verdict"
  },
  "outcome": {
   "passed": "Passed",
   "failed": "Failed",
   "errored": "Errored"
  },
  "target": {
   "deployment": "Deployment {{name}}",
   "revision": "Agent {{agent}}, revision {{revision}}"
  },
  "actions": {
   "runSet": "Run set",
   "openSet": "Open set",
   "cancelRun": "Cancel run",
   "stopTrial": "Stop trial",
   "abortCanary": "Abort release",
   "copyId": "Copy ID"
  },
  "toasts": {
   "copied": "Copied the ID.",
   "approved": "Approved {{name}} v{{version}}. It can gate promotions now.",
   "caseSaved": "Saved the case.",
   "caseSavedNextVersion": "Saved the case to version {{version}}, a new draft.",
   "caseSavedTo": "Saved the case to {{name}}.",
   "caseRemoved": "Removed the case.",
   "caseRemovedNextVersion": "Removed the case from version {{version}}, a new draft.",
   "setSavedNextVersion": "Saved as version {{version}}, a new draft.",
   "runStarted": "Started an eval run of {{name}}.",
   "runCancelled": "Cancelled the eval run.",
   "trialStopped": "Stopped the shadow trial.",
   "canaryAborted": "Aborted the canary release. The initial weights are back."
  },
  "reason": {
   "label": "Reason",
   "placeholder": "Optional. It is kept with the record and in the audit log."
  },
  "form": {
   "errors": {
    "name": "Give the set a name of 1 to {{max}} characters.",
    "description": "The description holds at most {{max}} characters.",
    "judgeAgent": "The judge agent name holds at most {{max}} characters.",
    "tags": "Each tag holds at most {{max}} characters."
   }
  },
  "set": {
   "nextVersion": "This version is approved, so saving makes version {{version}} as a draft. This version stays as it is."
  },
  "case": {
   "addTitle": "Add a case to {{name}}",
   "editTitle": "Edit case {{number}}",
   "save": "Save case",
   "nextVersion": "This version is approved, so the change goes to version {{version}}, a new draft. This version stays as it is.",
   "fromRun": "Saved from run {{id}}.",
   "fields": {
    "name": "Name",
    "inputText": "Input",
    "expectedText": "Expected output",
    "hidden": "Hidden from the agents being graded",
    "checks": "Checks"
   },
   "placeholders": {
    "name": "Optional, for example refund over the limit",
    "inputText": "The message the agent receives",
    "expectedText": "What a good answer says"
   },
   "hints": {
    "name": "Optional, at most {{max}} characters.",
    "inputText": "Required. The case sends this to the agent as its input.",
    "expectedText": "Optional. Exact match and Contains checks compare against it when they have no text of their own; the judge reads it as the reference answer.",
    "hidden": "An agent's own runs see only the score of a hidden case, never its input or expected output, so it cannot learn the answers."
   },
   "checks": {
    "scorer": "Scorer",
    "weight": "Weight",
    "add": "Add check",
    "remove": "Remove check {{number}}",
    "none": "No checks. The case is scored by exact match against the expected output, or by the judge agent when there is no expected output."
   },
   "scorerHints": {
    "ExactMatch": "Passes when the output equals the text, ignoring surrounding whitespace.",
    "Contains": "Passes when the output contains the text.",
    "JsonSchemaValid": "Passes when the output is JSON that matches the schema.",
    "Judge": "The set's judge agent grades the output against the rubric and the expected output."
   },
   "argumentLabels": {
    "ExactMatch": "Exact text",
    "Contains": "Text to find",
    "JsonSchemaValid": "JSON Schema",
    "Judge": "Rubric"
   },
   "argumentPlaceholders": {
    "ExactMatch": "Empty uses the expected output",
    "Contains": "Empty uses the expected output",
    "JsonSchemaValid": "{\"type\": \"object\", \"required\": [\"answer\"]}",
    "Judge": "Optional. What a good answer must do"
   },
   "errors": {
    "input": "A case needs input text.",
    "name": "The name holds at most {{max}} characters.",
    "weight": "A weight is 0 to {{max}}.",
    "schema": "Put a JSON Schema object here.",
    "argument": "Give the text, or fill in the case's expected output."
   }
  },
  "run": {
   "title": "Run an eval set",
   "titleFor": "Run {{name}} v{{version}}",
   "intro": "Each case runs as its own Eval run. Runs against an agent revision use a temporary deployment and leave live traffic alone.",
   "start": "Start run",
   "starting": "Starting...",
   "setOption": "{{name}} v{{version}}",
   "chooseDeployment": "Choose a deployment",
   "chooseAgent": "Choose an agent",
   "fields": {
    "setId": "Eval set",
    "targetType": "Evaluate",
    "deploymentId": "Deployment",
    "agentId": "Agent",
    "agentRevisionId": "Revision",
    "inputMode": "Inputs",
    "recentInputCount": "Recent inputs to replay",
    "thresholdPercent": "Pass threshold (percent)",
    "budgetUsd": "Budget (USD)"
   },
   "hints": {
    "setId": "The newest version of each set is listed.",
    "targetType": "A deployment as it runs now, or an agent revision such as the draft the studio playground runs.",
    "agentId": "Required. Without a revision the agent's draft revision runs, or its latest published one.",
    "agentRevisionId": "Optional. An agent revision ID; empty runs the draft revision.",
    "inputMode": "The set's cases, or the deployment's latest succeeded inputs graded by the judge agent.",
    "recentInputCount": "1 to {{max}}.",
    "thresholdPercent": "Optional, 0 to 100. The run passes when its weighted score reaches it.",
    "budgetUsd": "Optional. When case and judge runs spend this much, the remaining cases are skipped and the run fails."
   },
   "errors": {
    "set": "Pick the eval set to run.",
    "deployment": "Pick the deployment to evaluate.",
    "agent": "Pick the agent to evaluate.",
    "threshold": "A threshold is 0 to 100 percent.",
    "budget": "A budget is 0 to {{max}} USD.",
    "recentInputs": "Replay 1 to {{max}} recent inputs."
   }
  },
  "save": {
   "open": "Save as eval case",
   "title": "Save as eval case",
   "intro": "The turn's input and the agent's answer become a case. Edit the expected output so it says what a good answer is, not only what this one said.",
   "set": "Eval set",
   "newSet": "New eval set...",
   "newSetName": "New set name",
   "newSetHint": "The new set starts as a draft with origin From the playground.",
   "submit": "Save case",
   "done": "Done",
   "openSet": "Open set",
   "runSet": "Run set",
   "entryAgent": "the entry agent",
   "saved": "Saved the case to {{name}} v{{version}}.",
   "runHint": "Run set evaluates the draft revision of {{agent}}, the revision this playground ran.",
   "errors": {
    "set": "Pick an eval set, or make a new one."
   }
  },
  "setDetail": {
   "title": "Eval set",
   "back": "All eval sets",
   "notFoundTitle": "Eval set not found",
   "notFoundBody": "It may have been a draft that someone deleted. Approved versions are always kept.",
   "approve": "Approve",
   "approveTitle": "Approve {{name}} v{{version}}",
   "approveMessage": "An approved version is kept exactly as it is and can gate promotions and canary releases. Later edits make the next version as a draft.",
   "approvedNote": "This version is approved and kept as it is. Editing the set or a case makes version {{version}} as a draft.",
   "approvedByAt": "{{name}}, {{when}}",
   "needsJudge": "Some cases are graded by the judge agent, but this set has none. Edit the set and pick a judge agent before you run it.",
   "editTitle": "Edit {{name}}",
   "deleteTitle": "Delete draft version",
   "deleteMessage": "Delete {{name}} v{{version}}? Approved versions are not affected.",
   "cases": "Cases ({{count}})",
   "addCase": "Add case",
   "noCases": "No cases yet. Add one here, or save a turn from the studio playground.",
   "noExpected": "None",
   "hidden": "Hidden",
   "removeCaseTitle": "Remove case {{number}}",
   "removeCaseMessage": "Remove this case from the draft?",
   "removeCaseApproved": "This version is approved, so the case is removed from version {{version}}, a new draft. This version keeps it.",
   "versions": "Versions",
   "thisVersion": "v{{version}} (this one)",
   "runs": "Recent eval runs",
   "allRuns": "All runs of this version",
   "noRuns": "This version has not been run yet.",
   "fields": {
    "state": "State",
    "origin": "Origin",
    "judgeAgent": "Judge agent",
    "tags": "Tags",
    "authoredBy": "Written by",
    "approvedBy": "Approved by",
    "previousVersion": "Previous version",
    "lastUpdateUtc": "Last changed",
    "description": "Description"
   },
   "columns": {
    "order": "#",
    "name": "Name",
    "input": "Input",
    "expected": "Expected output",
    "scorers": "Scored by",
    "hidden": "Hidden",
    "source": "From run"
   },
   "versionColumns": {
    "version": "Version",
    "state": "State",
    "caseCount": "Cases",
    "approvedBy": "Approved by",
    "lastUpdateUtc": "Last changed"
   },
   "runColumns": {
    "run": "Eval run",
    "status": "Status",
    "verdict": "Verdict",
    "score": "Score",
    "target": "Evaluated",
    "createdUtc": "Started"
   }
  },
  "runDetail": {
   "title": "Eval run",
   "back": "All eval runs",
   "notFoundTitle": "Eval run not found",
   "notFoundBody": "Check the ID, or open the run from its eval set.",
   "live": "Live",
   "polling": "Polling",
   "failure": "The run failed: {{reason}}",
   "progressLabel": "Cases finished",
   "kpi": {
    "score": "Score",
    "threshold": "Threshold {{threshold}}",
    "noThreshold": "No threshold",
    "passed": "Cases passed",
    "errored": "Cases errored",
    "cost": "Cost",
    "budget": "Budget {{budget}}",
    "noBudget": "No budget"
   },
   "fields": {
    "target": "Evaluated",
    "targetType": "Target",
    "inputMode": "Inputs",
    "startedBy": "Started by",
    "createdUtc": "Started",
    "completedUtc": "Finished",
    "studioDraftId": "Studio draft"
   },
   "recentInputs": "{{count}} recent inputs",
   "results": "Case results ({{count}})",
   "failingOnly": "Failing only ({{count}})",
   "noFailing": "Every case passed.",
   "noResults": "This run recorded no case results.",
   "waiting": "Waiting for the first case to finish.",
   "caseNumber": "Case {{number}}",
   "recentInput": "Recent input {{number}}",
   "checksPassed": "{{passed}} of {{total}} passed",
   "open": "Open",
   "columns": {
    "order": "#",
    "case": "Case",
    "outcome": "Outcome",
    "score": "Score",
    "checks": "Checks",
    "output": "Output"
   },
   "resultTitle": "Case {{number}}",
   "resultTitleNamed": "Case {{number}}: {{name}}",
   "scoreIs": "Score {{score}}",
   "openCaseRun": "Open case run",
   "openSourceRun": "Open source run",
   "hiddenCase": "This case is hidden from the agents being graded.",
   "input": "Input",
   "diff": "Expected output against the output",
   "expected": "Expected",
   "output": "Output",
   "noOutput": "No output.",
   "checks": "Checks",
   "noChecks": "No checks were scored.",
   "checkColumns": {
    "scorer": "Scorer",
    "weight": "Weight",
    "score": "Score",
    "outcome": "Outcome",
    "note": "Scorer note",
    "judgeRun": "Judge run"
   },
   "cancelTitle": "Cancel eval run",
   "cancelMessage": "Cancel this run of {{name}}? Cases that have not finished are cancelled with it."
  },
  "shadow": {
   "errors": {
    "name": "The name holds at most {{max}} characters.",
    "source": "Pick the deployment whose runs are copied.",
    "candidate": "Pick the candidate deployment.",
    "same": "The candidate must be a different deployment from the source.",
    "sample": "Sample 1 to 100 percent of the runs.",
    "ends": "Pick an end in the future, or leave it empty to run until stopped."
   }
  },
  "shadowDetail": {
   "title": "Shadow trial",
   "back": "All shadow trials",
   "notFoundTitle": "Shadow trial not found",
   "notFoundBody": "Check the ID, or open the trial from the list.",
   "note": "Shadow runs replay the source's inputs on the candidate. They cannot use effectful tools, send messages, write memory, or file reports, and the source runs are not affected.",
   "stopReason": "Stopped: {{reason}}",
   "stopTitle": "Stop shadow trial",
   "stopMessage": "Stop {{name}}? No more runs are copied; the counts so far are kept.",
   "kpi": {
    "compared": "Compared",
    "agreed": "Agreed",
    "diverged": "Diverged",
    "failures": "Candidate failures",
    "agreement": "Agreement"
   },
   "comparison": {
    "text": "Normalized text",
    "set": "With an eval set",
    "judge": "By the judge agent"
   },
   "fields": {
    "source": "Source",
    "candidate": "Candidate",
    "samplePercent": "Sampled",
    "comparison": "Compared by",
    "endsUtc": "Ends",
    "createdBy": "Started by",
    "createdUtc": "Started",
    "completedUtc": "Finished"
   }
  },
  "canary": {
   "stepOf": "Step {{number}} of {{total}} at {{percent}}%",
   "gateText": "{{name}} at {{score}} or more",
   "noGate": "No eval gate",
   "errors": {
    "agent": "Pick the agent whose traffic is shifted.",
    "candidate": "Pick the candidate deployment.",
    "baseline": "Pick the baseline deployment.",
    "same": "The candidate and the baseline must be different deployments.",
    "steps": "List at least one step. The last step is 100 percent.",
    "tooMany": "A release has at most {{max}} steps.",
    "increasing": "Each step's percent is 1 to 100 and higher than the step before it.",
    "lastStep": "The last step must be 100 percent.",
    "errorRate": "The error rate ceiling is 0 to 100 percent.",
    "gate": "An eval gate needs both an eval set and a minimum score, or neither.",
    "score": "The minimum score is 0 to 100 percent."
   }
  },
  "canaryDetail": {
   "title": "Canary release",
   "heading": "Canary release of {{agent}}",
   "back": "All canary releases",
   "notFoundTitle": "Canary release not found",
   "notFoundBody": "Check the ID, or open the release from the list.",
   "rolledBack": "Rolled back: {{reason}} The initial weights are back.",
   "aborted": "Aborted: {{reason}} The initial weights are back.",
   "promoted": "Promoted. {{candidate}} takes all of the traffic.",
   "noReason": "no reason given.",
   "withWeight": "{{name}} (weight {{weight}} before the release)",
   "gate": "Latest eval score of {{score}} or more",
   "steps": "Steps",
   "columns": {
    "step": "Step",
    "weightPercent": "Candidate traffic",
    "minimumRuns": "Minimum runs",
    "minimumMinutes": "Minimum minutes",
    "state": "State"
   },
   "stepStates": {
    "done": "Done",
    "current": "Current",
    "stopped": "Stopped here",
    "pending": "Waiting"
   },
   "abortTitle": "Abort canary release",
   "abortMessage": "Abort the release? Both deployments go back to the weights they had before it started.",
   "fields": {
    "agent": "Agent",
    "candidate": "Candidate",
    "baseline": "Baseline",
    "maxErrorRatePercent": "Error rate ceiling",
    "gate": "Eval gate",
    "stepStartedUtc": "Current step started",
    "createdBy": "Started by",
    "completedUtc": "Finished"
   }
  },
  "fieldCodes": {
   "InputRequired": "A case needs input text.",
   "UnknownScorer": "Use Exact match, Contains, Valid JSON Schema, or Judge agent.",
   "ArgumentRequired": "Give the text, or fill in the case's expected output.",
   "InvalidJsonSchema": "This is not a valid JSON Schema.",
   "TooManyCases": "The set has the most cases a set may hold.",
   "EvaluatorIsForAgents": "Origin Written by an agent is for sets an agent made. Pick Written by a person or From the playground.",
   "SetRequired": "Pick the eval set to run.",
   "TargetRequired": "Pick what to evaluate.",
   "RecentInputsNeedDeployment": "Recent inputs replay a deployment's runs. Evaluate a deployment.",
   "NoRecentInputs": "The deployment has no succeeded runs to replay yet.",
   "EvalSetEmpty": "This version has no cases.",
   "JudgeAgentRequired": "Some cases need the judge agent, but the set has none. Edit the set and pick one.",
   "DeploymentNotFound": "That deployment does not exist in this tenant.",
   "SameDeployment": "Pick two different deployments.",
   "DifferentAgent": "Both deployments must belong to the same agent.",
   "DeploymentInactive": "That deployment is inactive. Activate it first.",
   "AgentMismatch": "The agent must be the source deployment's agent.",
   "EndsInPast": "Pick an end in the future, or leave it empty.",
   "EvalSetNotFound": "That eval set does not exist in this tenant.",
   "AgentNotFound": "That agent does not exist in this tenant.",
   "EvalGateIncomplete": "An eval gate needs both an eval set and a minimum score, or neither.",
   "NotIncreasing": "Each step's percent must be higher than the step before it.",
   "LastStepNotFull": "The last step must be 100 percent."
  }
 },
 "resources": {
  "evalSets": {
   "title": "Eval sets",
   "subtitle": "Versioned cases that grade an agent. Approve a version so it can gate promotions and canary releases.",
   "add": "Add eval set",
   "create": "Add eval set",
   "edit": "Edit eval set",
   "view": "Eval set",
   "deleteTitle": "Delete draft version",
   "emptyTitle": "No eval sets yet",
   "emptyBody": "Add a set and its cases here, or save a turn from the studio playground as the first case.",
   "filters": {
    "latestOnly": "Versions",
    "newestOnly": "Newest version only",
    "allVersions": "Every version"
   },
   "columns": {
    "name": "Name",
    "version": "Version",
    "state": "State",
    "origin": "Origin",
    "caseCount": "Cases",
    "judgeAgent": "Judge agent",
    "tags": "Tags",
    "authoredByName": "Written by",
    "approvedByName": "Approved by",
    "description": "Description",
    "lastUpdateUtc": "Last changed",
    "id": "ID"
   },
   "fields": {
    "name": "Name",
    "description": "Description",
    "origin": "Origin",
    "judgeAgent": "Judge agent",
    "tags": "Tags"
   },
   "hints": {
    "name": "1 to {{max}} characters. The name stays the same across versions.",
    "description": "Optional, at most {{max}} characters.",
    "origin": "From the playground marks sets that grew out of playground turns.",
    "judgeAgent": "The agent that grades Judge checks, cases without expected output, and recent inputs.",
    "tags": "Optional, one per line, at most {{max}} characters each."
   }
  },
  "evalRuns": {
   "title": "Eval runs",
   "subtitle": "Each run of an eval set version against a deployment or an agent revision, with its score against the threshold.",
   "add": "Run set",
   "create": "Run an eval set",
   "edit": "Eval run",
   "view": "Eval run",
   "deleteTitle": "Delete eval run",
   "emptyTitle": "No eval runs yet",
   "emptyBody": "Run an eval set to grade a deployment or a draft revision before it ships.",
   "columns": {
    "setName": "Eval set",
    "status": "Status",
    "verdict": "Verdict",
    "score": "Score",
    "threshold": "Threshold",
    "progress": "Progress",
    "target": "Evaluated",
    "inputMode": "Inputs",
    "costUsd": "Cost",
    "startedByName": "Started by",
    "createdUtc": "Started",
    "id": "ID"
   }
  },
  "shadowTrials": {
   "title": "Shadow trials",
   "subtitle": "A candidate deployment replays a share of a live deployment's inputs without acting, and the outputs are compared.",
   "add": "Start shadow trial",
   "create": "Start a shadow trial",
   "edit": "Shadow trial",
   "view": "Shadow trial",
   "deleteTitle": "Delete shadow trial",
   "emptyTitle": "No shadow trials yet",
   "emptyBody": "Start a trial to see how a candidate deployment answers real inputs before it takes any traffic.",
   "columns": {
    "name": "Name",
    "status": "Status",
    "source": "Source",
    "candidate": "Candidate",
    "samplePercent": "Sampled",
    "comparedCount": "Compared",
    "agreedCount": "Agreed",
    "divergedCount": "Diverged",
    "candidateFailureCount": "Failures",
    "agreement": "Agreement",
    "endsUtc": "Ends",
    "createdUtc": "Started",
    "id": "ID"
   },
   "fields": {
    "name": "Name",
    "sourceDeploymentId": "Source deployment",
    "candidateDeploymentId": "Candidate deployment",
    "samplePercent": "Sample (percent)",
    "endsUtc": "Ends",
    "comparisonEvalSetId": "Compare with eval set",
    "useJudge": "Compare with the judge agent"
   },
   "hints": {
    "name": "Optional, at most {{max}} characters.",
    "sourceDeploymentId": "Required. Its succeeded runs are copied; it is not affected.",
    "candidateDeploymentId": "Required. Another deployment of the same agent.",
    "samplePercent": "1 to 100, default 10. The share of the source's runs that are copied.",
    "endsUtc": "Optional. Empty runs until someone stops it.",
    "comparisonEvalSetId": "Optional. Without one the outputs are compared as normalized text.",
    "useJudge": "Ask the judge agent whether the two outputs agree."
   }
  },
  "canaryReleases": {
   "title": "Canary releases",
   "subtitle": "A candidate deployment takes a rising share of an agent's traffic in steps and rolls back on its own when it misbehaves.",
   "add": "Start canary release",
   "create": "Start a canary release",
   "edit": "Canary release",
   "view": "Canary release",
   "deleteTitle": "Delete canary release",
   "emptyTitle": "No canary releases yet",
   "emptyBody": "Start a release to move traffic to a new deployment a step at a time.",
   "addStep": "Add step",
   "columns": {
    "agent": "Agent",
    "status": "Status",
    "candidate": "Candidate",
    "baseline": "Baseline",
    "step": "Step",
    "maxErrorRatePercent": "Error ceiling",
    "gate": "Eval gate",
    "rollbackReason": "Rollback reason",
    "createdUtc": "Started",
    "id": "ID"
   },
   "fields": {
    "agentId": "Agent",
    "baselineDeploymentId": "Baseline deployment",
    "candidateDeploymentId": "Candidate deployment",
    "steps": "Steps",
    "weightPercent": "Candidate traffic (percent)",
    "minimumRuns": "Minimum runs",
    "minimumMinutes": "Minimum minutes",
    "maxErrorRatePercent": "Error rate ceiling (percent)",
    "evalSetId": "Eval gate set",
    "minEvalScorePercent": "Minimum eval score (percent)"
   },
   "hints": {
    "agentId": "Required. Both deployments belong to it.",
    "baselineDeploymentId": "Required. It keeps the rest of the traffic.",
    "candidateDeploymentId": "Required. The deployment being released.",
    "steps": "1 to {{max}} steps. Each percent is higher than the one before, and the last is 100.",
    "maxErrorRatePercent": "0 to 100, default 5. More failed candidate runs than this in a step rolls the release back.",
    "evalSetId": "Optional. A step advances only when the latest eval run of this set reaches the minimum score.",
    "minEvalScorePercent": "Required with an eval gate set, 0 to 100."
   }
  }
 }
});

// The board (AA10.4, AA10.6, AA10.7, AA10.8): the Board page under Autonomy with its chart, attention, proposals with
// evidence, spend, brief, brakes, direction, and conversation with the CEO; the Autonomy tour stops; the setup wizard's
// first keeper step; the BoardBrief event; and the board error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "board": {
    "label": "Board",
    "tip": "One organization at a glance: health, attention, proposals, spend, brakes, and the CEO"
   }
  }
 },
 "enums": {
  "notificationEvent": {
   "BoardBrief": "Board brief filed"
  }
 },
 "errorCodes": {
  "BoardCeoMissing": "This organization has no CEO: the root unit needs a lead with a keeper in the live revision.",
  "BoardCeoUnavailable": "The CEO's keeper has no deployment, so there is nothing to talk to. Give the keeper a deployment first."
 },
 "views": {
  "organizationDetail": {
   "openBoard": "Board"
  }
 },
 "board": {
  "title": "Board",
  "subtitle": "Oversee an organization of keepers: what needs a decision, what it costs, and the brakes.",
  "heading": "Board of {{name}}",
  "generated": "Updated",
  "refresh": "Refresh",
  "openOrganization": "Open organization",
  "killSwitchOn": "The kill switch is on: no keeper in this tenant wakes until it is turned off.",
  "notFoundTitle": "Board not available",
  "notFoundBody": "The organization does not exist, or you cannot read it.",
  "picker": {
   "title": "Pick an organization",
   "select": "Organization",
   "choose": "Choose an organization",
   "open": "Open board",
   "emptyTitle": "No organizations yet",
   "emptyBody": "Create an organization of keepers first. Its board shows up here.",
   "organizations": "Go to organizations"
  },
  "chart": {
   "title": "Chart and health",
   "empty": "The organization has no units yet. Add units and publish a revision on the organization page.",
   "health": "Unit health",
   "frozen": "Frozen",
   "overBudget": "Over budget",
   "columns": {
    "unit": "Unit",
    "health": "Health",
    "escalations": "Open escalations",
    "brakes": "Brakes",
    "lastReport": "Last report"
   }
  },
  "attention": {
   "title": "Needs attention",
   "empty": "Nothing needs the board right now.",
   "none": "None.",
   "escalations_one": "{{count}} open escalation",
   "escalations_other": "{{count}} open escalations",
   "reports_one": "{{count}} unhealthy report",
   "reports_other": "{{count}} unhealthy reports",
   "caps_one": "{{count}} unit at a budget cap",
   "caps_other": "{{count}} units at a budget cap",
   "raisedBy": "Raised by {{name}}",
   "filedBy": "Filed by {{name}}"
  },
  "proposals": {
   "title": "Proposals",
   "empty": "No proposal waits for a decision.",
   "by": "{{agent}} in {{unit}}",
   "showChanges": "Show changes",
   "hideChanges": "Hide changes"
  },
  "evidence": {
   "title": "Evidence",
   "empty": "No eval runs, shadow trials, or canary releases back this proposal yet.",
   "since": "Since the proposal last changed at {{when}}.",
   "evalRuns": "Eval runs",
   "shadowTrials": "Shadow trials",
   "canaryReleases": "Canary releases",
   "evalSet": "{{name}} v{{version}}",
   "evalScore": "Score {{score}} against {{threshold}}, {{done}} of {{total}} cases",
   "stale": "Before the last change",
   "shadow": "Shadow trial {{name}}",
   "shadowCounts": "{{agreed}} of {{compared}} agreed, {{diverged}} diverged, {{failures}} candidate failures",
   "canary": "Canary of {{name}}",
   "canaryStep": "Step {{step}} of {{total}}",
   "rollback": "Rolled back: {{reason}}"
  },
  "spend": {
   "title": "Spend against budget",
   "empty": "No unit has a budget or spend in the current window."
  },
  "brief": {
   "title": "Latest brief",
   "ceo": "CEO: {{name}}, lead of {{unit}}.",
   "cadence_one": "Briefs every hour.",
   "cadence_other": "Briefs every {{count}} hours.",
   "noCadence": "No brief cadence is set on the CEO's keeper.",
   "empty": "The CEO has not filed a brief yet."
  },
  "ceo": {
   "missing": "The root unit has no lead, so the organization has no CEO.",
   "noMandate": "The CEO has no keeper in the live revision.",
   "noDeployment": "The CEO's keeper has no deployment to talk to."
  },
  "brakes": {
   "title": "Brakes",
   "active_one": "{{count}} active freeze",
   "active_other": "{{count}} active freezes",
   "none": "Nothing is frozen.",
   "frozenBy": "Frozen by {{name}}",
   "lift": "Lift",
   "freezeOrg": "Freeze organization",
   "unit": "Unit",
   "pickUnit": "Choose a unit",
   "freezeUnit": "Freeze unit",
   "rollback": "Roll back chart",
   "rollbackTitle": "Roll back the chart",
   "rollbackMessage": "Return the organization to the revision that was live before revision {{number}}? The chain of command, budgets, and message lines follow it at once.",
   "rollbackNote": "Rolled back from the board",
   "rolledBack": "Rolled back. Revision {{number}} is live."
  },
  "direction": {
   "title": "Direction for the CEO",
   "note": "The text becomes a new published revision of the CEO's keeper, and its next tick reads it as the board's instruction.",
   "text": "Direction",
   "placeholder": "For example: hold refunds over $500 for a person until the audit ends.",
   "count": "{{count}} of {{max}} characters",
   "changeNote": "Change note",
   "changeNotePlaceholder": "Why the board gave this direction (optional)",
   "submit": "Send direction",
   "given": "Direction published as revision {{number}} of {{name}}.",
   "errors": {
    "required": "Write the direction for the CEO.",
    "tooLong": "Use at most {{max}} characters."
   }
  },
  "ceoChat": {
   "title": "Talk to the CEO",
   "note": "Messages start a conversation with the CEO's deployment, framed as coming from the board.",
   "talkingTo": "You are talking to {{name}} as the board.",
   "conversation": "Conversation",
   "newConversation": "New conversation",
   "new": "New",
   "transcript": "Conversation with the CEO",
   "empty": "No messages yet. Ask the CEO how the organization is doing.",
   "message": "Message",
   "tooLong": "Use at most {{max}} characters."
  }
 },
 "wizard": {
  "steps": {
   "keeper": "First keeper"
  },
  "welcomeItemKeeper": "Create your first keeper: an agent that wakes on a schedule and works toward an objective.",
  "keeper": {
   "body": "A keeper gives the sample agent an objective and wakes it on a schedule, backing off while nothing changes. It uses the fake harness, so it costs nothing. You can pause or delete it on the Keepers page.",
   "objectiveDefault": "Check in once in a while and report that everything is quiet.",
   "description": "Created by the setup wizard.",
   "create": "Create keeper",
   "created": "Keeper {{name}} created. It wakes on its schedule.",
   "ready": "Keeper {{name}} is ready. Continue to the test run."
  }
 },
 "tour": {
  "steps": {
   "autonomy": {
    "title": "Autonomy",
    "body": "Keepers are agents that wake on a schedule and work toward an objective. Escalations, freezes, the kill switch, memory, reports, and messages keep them in check."
   },
   "board": {
    "title": "The board",
    "body": "Organizations group keepers under a CEO. The Board tab shows one organization's health, what needs a decision, spend, and the brakes, and lets you direct and talk to the CEO."
   }
  }
 },
 "explainers": {
  "board": {
   "title": "The board",
   "p1": "The board is the person or group above an organization's root unit. This page gathers what they need in one place: each unit's health from its latest report, open escalations, unhealthy reports, units at a budget cap, and proposals waiting for a decision with their eval, shadow, and canary evidence.",
   "p2": "The brakes freeze a unit or the whole organization, roll the chart back, or stop every keeper with the kill switch. Direction becomes a new revision of the CEO's keeper, and Talk to the CEO opens an ordinary conversation with the CEO's deployment."
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "board": "Board: one organization's health, attention, proposals, spend, brief, and brakes on one page."
   }
  },
  "enums": {
   "notificationEvent": {
    "BoardBrief": "The CEO of an organization filed a brief for the board."
   }
  },
  "views": {
   "organizationDetail": {
    "openBoard": "Open this organization's board: health, attention, proposals, spend, brakes, and the CEO."
   }
  },
  "wizard": {
   "keeper": {
    "name": "Name of the keeper: letters, digits, dots, dashes, and underscores.",
    "objective": "What the keeper works toward. Each tick reads it.",
    "create": "Create the keeper on the sample agent's fake harness deployment and move to the test run.",
    "skip": "Continue without a keeper. You can add one on the Keepers page."
   }
  },
  "board": {
   "refresh": "Read the board again. It also refreshes when the organization changes.",
   "openOrganization": "Open the organization page to edit units, budgets, and revisions.",
   "openEscalation": "Open the escalation to answer it.",
   "openReport": "Open the report with its metrics, issues, and decisions.",
   "openKeeper": "Open the CEO's keeper with its ticks and revisions.",
   "picker": {
    "select": "The organization whose board to open.",
    "open": "Open the board of this organization.",
    "organizations": "Open the organizations page to create one."
   },
   "chart": {
    "title": "The live chart: each unit with its lead, members, health from its latest report, and spend.",
    "frozen": "An active freeze covers this unit or the whole organization.",
    "overBudget": "The unit's subtree has spent a whole budget in the current window.",
    "columns": {
     "unit": "The unit in the live revision.",
     "health": "Health from the latest report filed in the unit. Unknown when it has none.",
     "escalations": "Open escalations raised by agents of the unit.",
     "brakes": "Whether a freeze covers the unit and whether it is over a budget.",
     "lastReport": "When the latest report was filed. Opens the report."
    }
   },
   "attention": {
    "title": "What waits for the board: open escalations, reports from the last 7 days that are degraded or unhealthy, and units at a budget cap."
   },
   "proposals": {
    "title": "Changes the organization's executives proposed that no change rule covered, waiting for a person.",
    "toggle": "Show or hide the proposal's changes and the rule that covers each, read from the server."
   },
   "evidence": {
    "title": "Eval runs, shadow trials, and canary releases of the proposed agents since the proposal last changed.",
    "openEvalRun": "Open the eval run with its case results.",
    "openShadowTrial": "Open the shadow trial with its comparisons.",
    "openCanary": "Open the canary release with its steps.",
    "stale": "This eval run started before the proposal last changed, so it may not test the current changes."
   },
   "spend": {
    "title": "Each unit's spend in the current day and month windows against its budgets."
   },
   "brief": {
    "title": "The newest brief the CEO filed for the board, and how often the CEO's keeper asks for one."
   },
   "brakes": {
    "title": "Stop work fast: freeze a unit or the organization, roll back the chart, or turn on the kill switch.",
    "lift": "Lift this freeze. Work in its scope may start again.",
    "freezeOrg": "Freeze every agent and keeper of this organization until the freeze is lifted. Asks for confirmation.",
    "orgFrozen": "The organization is already frozen. Lift that freeze first.",
    "unit": "The unit to freeze, with everything below it.",
    "freezeUnit": "Freeze the chosen unit and its subtree. Asks for confirmation.",
    "rollback": "Return to the revision that was live before the current one. Asks for confirmation.",
    "rollbackNone": "There is no earlier live revision to return to."
   },
   "direction": {
    "title": "Instruct the CEO. The text is published as a new revision of the CEO's keeper with source Board.",
    "text": "1 to 4000 characters. The CEO's next tick reads it as the board's instruction.",
    "changeNote": "Optional, at most 2000 characters. Stored with the revision.",
    "submit": "Publish the direction as a new revision of the CEO's keeper."
   },
   "ceoChat": {
    "title": "A conversation with the CEO's deployment. Each message is a run you can open like any other.",
    "conversation": "Continue a past board conversation or start a new one.",
    "new": "Start a new conversation with the CEO.",
    "message": "What to say to the CEO. Enter sends; Shift+Enter adds a line.",
    "send": "Send the message. The reply streams in below."
   }
  }
 }
});

// Performance signals and org-scale brakes (AA11.7): the Performance page under Autonomy with its window picker, unit
// and agent tables, chart, and scheduled checks; the EvalSet trigger target; the budget freeze margin; cancel
// everything in a unit; the rollback's in-flight ticks choice; the OrgBudgetFrozen and UnitCascadeCancelled labels;
// and the tour stop.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "items": {
   "performance": {
    "label": "Performance",
    "tip": "How an organization's units and agents are doing, with the checks agents cannot grade"
   }
  }
 },
 "enums": {
  "triggerTargetType": {
   "EvalSet": "Scheduled check"
  },
  "notificationEvent": {
   "OrgBudgetFrozen": "Unit frozen over budget"
  },
  "auditEventType": {
   "OrgBudgetFrozen": "Unit frozen over budget",
   "UnitCascadeCancelled": "Everything in a unit cancelled"
  },
  "rollbackActiveTicks": {
   "Finish": "Let them finish",
   "Cancel": "Cancel them"
  }
 },
 "errorCodes": {
  "OrganizationNotLive": "The organization has no live revision yet. Publish a revision first."
 },
 "resources": {
  "organizations": {
   "fields": {
    "budgetFreezeMarginPercent": "Budget freeze margin (%)"
   },
   "hints": {
    "budgetFreezeMarginPercent": "From {{min}} to {{max}}, default {{default}}. A unit whose spend passes its budget by this much is frozen until a person lifts the freeze. 0 freezes at the budget."
   }
  },
  "triggers": {
   "fields": {
    "evalSetId": "Eval set",
    "evalJudgeAgentId": "Judge agent",
    "evalRecentInputCount": "Recent inputs"
   },
   "hints": {
    "evalSetId": "The set the check runs. Results go to managers on the performance page.",
    "checkDeployment": "Required. The check replays this deployment's recent inputs against the set.",
    "evalRecentInputCount": "From {{min}} to {{max}}, default {{default}}. How many of the deployment's latest inputs each check replays."
   },
   "errors": {
    "evalSetRequired": "Choose the eval set this check runs.",
    "deploymentRequired": "Choose the deployment this check grades.",
    "evalRecentInputCount": "Enter a whole number from {{min}} to {{max}}."
   },
   "setJudge": "The eval set's judge agent",
   "checkNotice": "A scheduled check runs as the person who saved it. Agents cannot create, change, or grade checks."
  }
 },
 "organizations": {
  "form": {
   "errors": {
    "margin": "Enter a whole number from {{min}} to {{max}}."
   }
  }
 },
 "views": {
  "organizationDetail": {
   "openPerformance": "Performance",
   "freezeMargin": "Frozen at {{percent}}% over budget"
  }
 },
 "rollbackTicks": {
  "legend": "Keeper ticks in flight"
 },
 "cascadeCancel": {
  "action": "Cancel everything in this unit",
  "title": "Cancel everything in {{name}}",
  "message": "Cancel every queued and running run, keeper tick, open escalation, and queued message of the agents in {{name}} and every unit below it? This does not freeze the unit, so new work can start again.",
  "reason": "Reason",
  "reasonPlaceholder": "Why everything stops (optional)",
  "keep": "Keep running",
  "confirm": "Cancel everything",
  "working": "Cancelling...",
  "done": "Everything in {{name}} was cancelled.",
  "resultIntro": "Everything in {{name}} has stopped:",
  "notFrozen": "The unit is not frozen. Freeze it to keep new work from starting.",
  "freeze": "Freeze unit",
  "counts": {
   "runsCancelled": "Runs cancelled",
   "ticksCancelled": "Keeper ticks cancelled",
   "escalationsWithdrawn": "Escalations withdrawn",
   "messagesExpired": "Messages expired"
  }
 },
 "performance": {
  "title": "Performance",
  "subtitle": "How each unit and agent of an organization did: outcomes, cost, latency, escalations, and eval scores.",
  "heading": "Performance of {{name}}",
  "range": "From {{from}} to {{to}}",
  "notFoundTitle": "Performance not available",
  "notFoundBody": "The organization does not exist, or you cannot read it.",
  "unit": "Unit",
  "allUnits": "Every unit",
  "lead": "Lead",
  "sample": "Run {{n}}",
  "outcomes": "{{succeeded}} ok, {{failed}} failed, {{cancelled}} cancelled",
  "evalScore_one": "{{score}} over {{count}} eval run",
  "evalScore_other": "{{score}} over {{count}} eval runs",
  "picker": {
   "title": "Pick an organization",
   "emptyTitle": "No organizations yet",
   "emptyBody": "Create an organization of keepers first. Its performance shows up here."
  },
  "window": {
   "label": "Window",
   "24h": "24 hours",
   "7d": "7 days",
   "30d": "30 days",
   "custom": "Custom",
   "from": "From",
   "to": "To",
   "apply": "Apply",
   "errors": {
    "from": "Choose the first day.",
    "to": "Choose the last day.",
    "order": "The last day must not be before the first.",
    "span": "A window covers at most {{max}} days."
   }
  },
  "chart": {
   "title": "Success rate and cost by unit",
   "successRate": "Success rate",
   "cost": "Cost",
   "noRuns": "No finished runs",
   "rateLabel": "Success rate of {{unit}}: {{value}}",
   "costLabel": "Cost of {{unit}}: {{value}}"
  },
  "columns": {
   "unit": "Unit",
   "agent": "Agent",
   "runs": "Runs",
   "outcomes": "Outcomes",
   "successRate": "Success rate",
   "costUsd": "Cost",
   "latency": "Latency p50 / p95 / p99",
   "escalations": "Escalations",
   "loopGuardRejections": "Loop guard refusals",
   "evalScore": "Eval score",
   "samples": "Sample runs"
  },
  "units": {
   "title": "Units",
   "empty": "No unit is in the live chart for this window."
  },
  "agents": {
   "title": "Agents",
   "empty": "No agent is positioned in the live chart."
  },
  "checks": {
   "title": "Scheduled checks",
   "note": "Checks are eval runs on a schedule against a deployment's recent inputs. People create them; agents cannot grade or change them.",
   "new": "New check",
   "empty": "No scheduled check targets this organization's deployments.",
   "never": "Not run yet",
   "passed": "Passed",
   "failed": "Below threshold",
   "columns": {
    "check": "Check",
    "evalSet": "Eval set",
    "deployment": "Deployment",
    "schedule": "Schedule",
    "lastRun": "Last run",
    "lastScore": "Last score",
    "nextFire": "Next run"
   }
  }
 },
 "tour": {
  "steps": {
   "performance": {
    "title": "Performance",
    "body": "The Performance tab shows how each unit and agent of an organization did over a window, and the scheduled checks that grade them without letting agents grade themselves."
   }
  }
 },
 "explainers": {
  "performance": {
   "title": "Performance",
   "p1": "Each unit row covers the unit and everything below it: runs created in the window, how they ended, the success rate (succeeded over succeeded plus failed), cost, latency percentiles, escalations raised, loop-guard refusals, and the mean score of eval runs against the unit's deployments. Eval, shadow, and playground runs do not count.",
   "p2": "Scheduled checks are EvalSet triggers: on their schedule they run an approved eval set against a deployment's recent inputs. Only people create them, so an agent cannot grade its own work."
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "performance": "Performance: outcomes, cost, latency, escalations, and eval scores by unit and agent, with the scheduled checks."
   }
  },
  "enums": {
   "triggerTargetType": {
    "EvalSet": "Each fire starts an eval run of the set against the deployment's recent inputs. Only people can create these."
   },
   "notificationEvent": {
    "OrgBudgetFrozen": "A unit's spend passed its budget by the organization's margin, and the budget guard froze it."
   },
   "auditEventType": {
    "OrgBudgetFrozen": "The budget guard froze a unit whose spend passed its budget by the organization's margin.",
    "UnitCascadeCancelled": "Someone cancelled every run, keeper tick, escalation, and queued message in a unit's subtree."
   },
   "rollbackActiveTicks": {
    "Finish": "Ticks already running complete, but their keepers stay on the restored revisions.",
    "Cancel": "Runs of ticks in flight are cancelled before the chart is restored."
   }
  },
  "resources": {
   "organizations": {
    "budgetFreezeMarginPercent": "How far over a budget a unit may go before the budget guard freezes it, in percent: 0 to 100, default 10."
   },
   "triggers": {
    "evalSetId": "The eval set the check runs on each fire.",
    "evalJudgeAgentId": "The agent that grades the answers. Empty uses the eval set's judge.",
    "evalRecentInputCount": "How many of the deployment's latest inputs each eval run replays, 1 to 50."
   }
  },
  "views": {
   "organizationDetail": {
    "openPerformance": "Open this organization's performance by unit and agent, with its scheduled checks."
   }
  },
  "rollbackTicks": {
   "legend": "What happens to keeper ticks that are running when the chart rolls back."
  },
  "board": {
   "brakes": {
    "pickUnitFirst": "Choose a unit first."
   }
  },
  "cascadeCancel": {
   "action": "Stop all work in this unit and below it: runs, keeper ticks, escalations, and queued messages. Asks for confirmation.",
   "confirm": "Cancel everything in the unit's subtree now. This cannot be undone.",
   "reason": "Optional, at most 1024 characters. Recorded in the audit log and on withdrawn escalations.",
   "freeze": "Freeze the unit so no new work starts until the freeze is lifted.",
   "counts": {
    "runsCancelled": "Queued and running runs of agents in the subtree that were cancelled.",
    "ticksCancelled": "Keeper ticks in flight that were cancelled.",
    "escalationsWithdrawn": "Open escalations raised by agents in the subtree that were withdrawn.",
    "messagesExpired": "Queued messages to agents in the subtree that expired."
   }
  },
  "performance": {
   "refresh": "Read the performance again for the chosen window.",
   "unit": "Show one unit and everything below it, or every unit.",
   "lead": "This agent leads its unit.",
   "openAgent": "Open the agent.",
   "openRun": "Open this sample run.",
   "picker": {
    "open": "Open the performance of this organization."
   },
   "window": {
    "24h": "The last 24 hours.",
    "7d": "The last 7 days.",
    "30d": "The last 30 days.",
    "custom": "Choose the first and last day, at most 90 days apart.",
    "from": "The first day of the window (UTC).",
    "to": "The last day of the window (UTC), included.",
    "apply": "Read the performance for these days."
   },
   "chart": {
    "title": "Success rate and cost of each unit's subtree in the window.",
    "successRate": "Succeeded runs over succeeded plus failed runs.",
    "cost": "Spend of the unit's subtree, scaled to the most expensive unit."
   },
   "columns": {
    "unit": "The unit. Its row covers everything below it.",
    "agent": "The agent and the unit it sits in.",
    "runs": "Runs created in the window, without eval, shadow, and playground runs.",
    "outcomes": "Succeeded, failed, and cancelled runs.",
    "successRate": "Succeeded over succeeded plus failed. Empty when no run finished.",
    "costUsd": "Spend of these runs in US dollars.",
    "latency": "Median, 95th, and 99th percentile run time of finished runs.",
    "escalations": "Escalations raised, with the share of runs that raised one.",
    "loopGuardRejections": "Message sends and wakes the loop guard refused.",
    "evalScore": "Mean score of completed eval runs against these deployments, scheduled checks included.",
    "samples": "Up to five runs to look at: the newest failed first, then the newest succeeded."
   },
   "units": {
    "title": "Each unit with the metrics of its whole subtree."
   },
   "agents": {
    "title": "Each agent in the live chart with its own metrics."
   },
   "checks": {
    "title": "Eval runs on a schedule against the organization's deployments, set up by people.",
    "new": "Open the trigger editor with a scheduled check target.",
    "openSet": "Open the eval set.",
    "openRun": "Open the last eval run with its case results.",
    "passed": "The last run reached the set's threshold.",
    "failed": "The last run stayed below the set's threshold.",
    "columns": {
     "check": "The trigger that schedules the check, and whether it is active.",
     "evalSet": "The eval set the check runs.",
     "deployment": "The deployment whose recent inputs the check replays.",
     "schedule": "The cron expression of the trigger.",
     "lastRun": "When the last eval run started, and its status. Opens the run.",
     "lastScore": "The score of the last eval run, 0 to 100 percent.",
     "nextFire": "When the check runs next."
    }
   }
  }
 }
});

// Simulated user findings (AA12.8): the missing-permission tooltip of Autonomy write actions (UT-03), the keeper
// link on an escalation (UT-12), the tab bar scroll buttons (UT-16), the run form's empty threshold and budget
// (UT-07), and the Manual wake source (UT-15).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "common": {
  "tabs": {
   "scrollBack": "Show earlier tabs",
   "scrollForward": "Show more tabs"
  }
 },
 "evals": {
  "run": {
   "placeholders": {
    "thresholdPercent": "None",
    "budgetUsd": "None"
   },
   "hints": {
    "thresholdPercent": "Optional, 0 to 100. The run passes when its weighted score reaches it. Leave it empty for no threshold and no pass or fail verdict.",
    "budgetUsd": "Optional. When case and judge runs spend this much, the remaining cases are skipped and the run fails. Leave it empty for no budget."
   }
  }
 },
 "tips": {
  "permissions": {
   "denied": "You may not do this. It needs {{operation}} on {{resource}}."
  },
  "views": {
   "escalationDetail": {
    "openKeeperNamed": "Open the keeper whose tick raised it. Its ID is {{id}}."
   }
  },
  "tabs": {
   "scrollBack": "Scroll the tab bar back to the tabs hidden before the first one shown.",
   "scrollForward": "Scroll the tab bar to the tabs hidden past its edge."
  },
  "enums": {
   "wakeSource": {
    "Manual": "A person woke the keeper: Wake now, resuming it, publishing a revision, or giving direction."
   }
  }
 }
});

// AA12.8 follow-ups: keeper and escalation audit event labels, the board's earlier unhealthy report count, the
// RevisionUnchanged refusal of keeper publish and board direction, typed field errors (InvalidType, InvalidValue),
// and the harness profile MCP tool name prefix.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "enums": {
  "auditEventType": {
   "MandatePaused": "Keeper paused",
   "MandateResumed": "Keeper resumed",
   "MandateWoken": "Keeper woken",
   "MandateDeleted": "Keeper deleted",
   "EscalationAnswered": "Escalation answered",
   "EscalationCancelled": "Escalation cancelled"
  }
 },
 "board": {
  "attention": {
   "earlier_one": "and {{count}} earlier",
   "earlier_other": "and {{count}} earlier"
  },
  "direction": {
   "unchanged": "{{name}} already has this direction in its current revision. Nothing was published and the CEO did not wake."
  }
 },
 "errorCodes": {
  "RevisionUnchanged": "Nothing changed, so nothing was published. The draft is the same as the latest published revision. Change it before publishing, or discard it."
 },
 "components": {
  "keeperRevision": {
   "unchanged": "Saved revision {{number}} as a draft, but did not publish it: it says the same as the current revision."
  }
 },
 "common": {
  "fieldCodes": {
   "InvalidType": "This value has the wrong type.",
   "InvalidTypeOf": "Enter {{type}}.",
   "InvalidValue": "This value is not allowed.",
   "InvalidValueOneOf": "Choose one of: {{values}}.",
   "InvalidValueRange": "Enter a value from {{min}} to {{max}}.",
   "fieldMessage": "{{field}}: {{message}}"
  },
  "fieldTypes": {
   "text": "text",
   "trueFalse": "true or false",
   "wholeNumber": "a whole number",
   "number": "a number",
   "map": "an object of names to values",
   "list": "a list",
   "object": "an object",
   "dateTime": "a date and time such as 2026-12-31T00:00:00Z",
   "duration": "a duration such as 00:05:00"
  }
 },
 "resources": {
  "harnessProfiles": {
   "fields": {
    "mcpToolNamePrefix": "MCP tool name prefix"
   },
   "hints": {
    "mcpToolNamePrefix": "Optional. Letters, digits, _ - . : and {server}, up to 128 characters."
   },
   "errors": {
    "toolPrefixTooLong": "Use at most {{max}} characters.",
    "toolPrefixInvalid": "Use only letters, digits, _ - . : and {server}."
   }
  }
 },
 "tips": {
  "enums": {
   "auditEventType": {
    "MandatePaused": "Someone paused a keeper: it stops waking until resumed.",
    "MandateResumed": "Someone resumed a paused keeper, which wakes now.",
    "MandateWoken": "Someone used Wake now on a keeper.",
    "MandateDeleted": "Someone deleted a keeper with its revisions and ticks.",
    "EscalationAnswered": "Someone answered an open escalation.",
    "EscalationCancelled": "Someone cancelled an open escalation."
   }
  },
  "board": {
   "attention": {
    "earlier_one": "This author filed {{count}} earlier degraded or unhealthy report in the last 7 days. Opens all their reports.",
    "earlier_other": "This author filed {{count}} earlier degraded or unhealthy reports in the last 7 days. Opens all their reports."
   }
  },
  "keeperRevision": {
   "unchanged": "This revision says the same as the current one, so publishing it would change nothing. Change something first."
  },
  "resources": {
   "harnessProfiles": {
    "mcpToolNamePrefix": "What the harness puts before an MCP tool's name when it shows the tool to the model. Use {server} for the server name, for example mcp__{server}__ or {server}. (dot). Leave it empty when the model sees plain tool names."
   }
  }
 }
});

// Navigation (AA13): Organizations and Evaluations are their own hubs, split out of Autonomy.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(en, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "Agents that keep working on their own: keepers wake on a schedule, write to each other, file reports, remember, and ask people when they are stuck. Freezes stop them."
   },
   "organizations": {
    "label": "Organizations",
    "tip": "Agents arranged as a chart of units with leads and budgets, with the board, performance by unit, and the change rules that let executives apply proposals."
   },
   "evaluations": {
    "label": "Evaluations",
    "tip": "Checks before a change reaches production: eval sets and their runs, shadow trials beside the live agent, and canary releases that move traffic in steps."
   }
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "Agents that keep working on their own: keepers wake on a schedule, write to each other, file reports, remember, and ask people when they are stuck. Freezes stop them.",
    "organizations": "Agents arranged as a chart of units with leads and budgets, with the board, performance by unit, and the change rules that let executives apply proposals.",
    "evaluations": "Checks before a change reaches production: eval sets and their runs, shadow trials beside the live agent, and canary releases that move traffic in steps."
   }
  }
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
})(en, {
 "components": {
  "table": {
   "columns": "Columns"
  }
 }
});
