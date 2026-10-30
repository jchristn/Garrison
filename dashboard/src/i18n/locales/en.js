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
    footerHint: 'Local development default: admin@garrison in tenant default.'
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
      selected_one: '{{count}} selected',
      selected_other: '{{count}} selected',
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
      ...resourcePage('Secrets', 'secret', 'Encrypted credentials for harnesses and integrations. Values are write-only.', 'Add the API key or token your agents need, for example an Anthropic API key.'),
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
        inputSchemaJson: 'Input JSON Schema',
        outputSchemaJson: 'Output JSON Schema',
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
      grafanaSections: { overview: 'Overview', http: 'HTTP API', runs: 'Runs', agents: 'Agents', models: 'Models and tokens', workers: 'Workers', kubernetes: 'Kubernetes executor', protocols: 'Protocols', scheduler: 'Scheduler and queue', database: 'Database', controlPlane: 'Control plane', security: 'Security and auth', integrations: 'Integrations', logs: 'Logs and traces' },
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
    "inputSchemaJson": "Input schema",
    "outputSchemaJson": "Output schema"
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
    "inputSchemaJson": "Input schema",
    "outputSchemaJson": "Output schema"
   },
   "hints": {
    "kind": "Manual entries can be of any kind, for example a conversion service that agents reach through a skill.",
    "requirements": "A run of an agent that uses this capability goes only to workers with every one of these node labels.",
    "sourceMcpServerId": "Optional. A run token sees an entry that names a server only when its deployment binds that server.",
    "inputSchemaJson": "A JSON Schema, for example {\"type\": \"object\"}. Leave empty when the capability takes free text."
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
    "notCredentialedBody": "Its harness has no working credential (Claude Code reports this as Not logged in). Give {{architect}} a credential secret on the Architects page, or check that the secret's value is right.",
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
   "harnessLink": "Open Configuration > Harness Profiles",
   "credentialNotNeeded": "{{profile}} needs no credential.",
   "credentialLink": "Open Configuration > Secrets",
   "prompt": "A change applies on the architect's next turn.",
   "promptLink": "Open Configuration > Prompt Templates",
   "credentialNoProfile": "The secret the harness signs in with.",
   "credentialChosen": "The secret {{profile}} signs in with.",
   "credentialPick": "{{profile}} signs in with a secret of kind {{kinds}}. Choose one, or every turn fails with Not logged in.",
   "credentialAdd": "{{profile}} signs in with a secret of kind {{kinds}}, and this tenant has none yet. Add one on Configuration > Secrets, then choose it here. Without it, every turn fails with Not logged in."
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
    "s3": "Print the login file and paste all of it into Value:",
    "s4": "Delete that folder, and do not use this login anywhere else. Garrison refreshes it from now on:",
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
