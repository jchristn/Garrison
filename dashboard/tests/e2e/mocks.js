// Deterministic API mocks so the e2e suite runs without a Garrison server.
//
// Every response mirrors the shape the real server returns (keys and value types, nulls omitted the way the server
// omits them). `npm run test:contract` starts a real server and fails when a shape here drifts (P5.51), so change
// a mock only together with the server contract.

const NOW = Date.parse('2026-10-09T12:00:00Z');
const iso = (offsetMinutes) => new Date(NOW - offsetMinutes * 60000).toISOString();
const TENANT = 'default';
const pad = (i) => String(i).padStart(4, '0');

export const PRINCIPAL = {
  principalType: 'User',
  principalId: 'usr_admin',
  principalName: 'admin@garrison',
  tenantId: TENANT,
  userId: 'usr_admin',
  sessionId: 'ses_e2e',
  authScheme: 'BearerToken',
  isAdmin: true,
  isTenantAdmin: true,
  email: 'admin@garrison',
  firstName: 'Garrison',
  lastName: 'Administrator',
  expiresUtc: iso(-60)
};

const RUN_STATUSES = ['Succeeded', 'Failed', 'Running', 'Queued', 'Succeeded', 'Cancelled'];

/** Why a queued run is blocked (G-15): run_0003 has no capable worker, run_0009 no Ready worker, run_0015 no pool. */
const BLOCKED = { 3: 'NoCapableWorker', 9: 'NoReadyWorker', 15: 'NoMatchingPool' };

/** Fields every stored record carries. */
function record(prefix, i, extra = {}) {
  return { id: `${prefix}_${pad(i)}`, ...extra, active: true, isProtected: false, createdUtc: iso(i * 7), lastUpdateUtc: iso(i * 3) };
}

/** A tenant-owned record with a name. */
function base(prefix, i, extra = {}) {
  return record(prefix, i, { tenantId: TENANT, name: `${prefix}-${i}`, ...extra });
}

/** Run guard stops (P3.15): errorMessage and RunGuardTriggered text, exactly as the worker writes them. */
export const GUARD_MESSAGES = {
  RepetitionDetected: 'Repetition guard: the last 1,000 characters of assistant text contain no letters or digits (only whitespace, punctuation, or symbols), ending with " \\n* \\n* \\n* \\n*".',
  NoProgress: 'The run made no progress for 300 seconds (no assistant text, thinking, tool call, or tool result, and no tool call open); its noProgressSeconds limit is 300.',
  OutputLimitExceeded: "Assistant text passed the run's maxAssistantChars limit of 200,000 characters."
};

/** Partial output a guard stop keeps as the result: the start of an answer, then the loop. */
export const GUARD_PARTIAL = `Here is the plan:\n\n${'* \n'.repeat(40)}`;

function run(i) {
  const status = RUN_STATUSES[i % RUN_STATUSES.length];
  const terminal = !['Running', 'Queued'].includes(status);
  const queued = status === 'Queued';
  // P3.15: run_0013 is a run a repetition guard stopped.
  const outcome = status === 'Failed' ? (i % 12 === 7 ? 'NoCapableWorker' : i === 13 ? 'RepetitionDetected' : 'HarnessFailed') : status === 'Succeeded' ? 'Succeeded' : status === 'Cancelled' ? 'Cancelled' : 'None';
  const out = record('run', i, {
    tenantId: TENANT,
    agentId: 'agt_0001',
    agentName: 'echo-agent',
    deploymentId: 'dep_0001',
    deploymentVersion: 3,
    harnessType: 'ClaudeCode',
    executor: 'Process',
    nodePoolId: 'np_0001',
    kind: 'Invoke',
    status,
    outcome,
    priority: 0,
    inputText: 'Say hello',
    inputContentType: 'text/plain',
    callerType: 'User',
    callerId: 'usr_0001',
    callerName: 'admin@garrison',
    depth: 0,
    callChain: 'echo-agent',
    attempt: 1,
    maxAttempts: 1,
    leaseEpoch: queued ? 0 : 1,
    queuedUtc: iso(i * 7 + 0.05),
    cancelRequested: status === 'Cancelled',
    inputTokens: 1200 + i,
    outputTokens: 340 + i,
    cachedTokens: 800 + i,
    costEstimated: false,
    reasoningTokens: i % 2 ? 0 : 64,
    // P12.3: run_0002 (Running) waits for a person to approve one tool call; finished runs report the time they waited.
    pendingApprovals: i === 2 ? 1 : 0,
    awaitingApproval: i === 2,
    approvalWaitMs: terminal && i % 4 === 1 ? 42000 : null,
    toolCallCount: i % 4,
    lastEventSequence: queued ? 0 : 4,
    parameters: [{ id: `rpa_${pad(i)}`, runId: `run_${pad(i)}`, name: 'format', value: 'claude' }],
    requirements: [],
    templateVersions: [{ id: `rtv_${pad(i)}`, runId: `run_${pad(i)}`, templateId: 'tpl_builtin_default_task', templateName: 'builtin/default-task', version: 1 }],
    // The server always serializes blockedReason, null when the run is not Queued or a worker can take it.
    blockedReason: queued ? BLOCKED[i] || null : null,
    // Always serialized too: null when the agent has no output schema (the echo agent has none).
    outputSchemaValid: null,
    schemaValidationErrors: null,
    repairAttempts: 0,
    // P13.16: W3C trace ID (32 lowercase hex) of the trace the run was compiled in.
    traceId: `4bf92f3577b34da6a3ce929d0e0e${pad(i)}`
  });
  if (!queued) {
    Object.assign(out, {
      leaseNodeId: 'node_0001',
      leaseNodeName: 'garrison-worker-0',
      leasedUtc: iso(i * 7 + 0.04),
      startedUtc: iso(i * 7),
      deadlineUtc: iso(i * 7 - 30),
      sessionId: `ses-${i}`,
      servedModel: 'claude-sonnet-5-5',
      costUsd: 0.0123 * i,
      firstTokenUtc: iso(i * 7 - 0.02),
      lastTokenUtc: iso(i * 7 - 0.8),
      timeToFirstTokenMs: 1200 + i * 10,
      // M1-08 (P9.17): every fifth run delegated and waited 800 ms on its child before the first token.
      delegationWaitMs: i % 5 === 1 ? 800 : 0,
      timeToFirstTokenExcludingDelegationMs: 1200 + i * 10 - (i % 5 === 1 ? 800 : 0),
      streamingMs: i % 6 === 3 ? null : 46000 + i,
      executionMs: 60000 + i,
      queueMs: 600 + i,
      totalMs: 61000 + i,
      outputTokensPerSecond: i % 6 === 3 ? null : (340 + i) / ((46000 + i) / 1000)
    });
  } else {
    Object.assign(out, { firstTokenUtc: null, lastTokenUtc: null, timeToFirstTokenMs: null, delegationWaitMs: null, timeToFirstTokenExcludingDelegationMs: null, streamingMs: null, executionMs: null, queueMs: null, totalMs: null, outputTokensPerSecond: null });
  }
  if (terminal) {
    Object.assign(out, { completedUtc: iso(i * 7 - 1), exitCode: status === 'Failed' ? 1 : 0, stderrTail: '', resultText: 'Hello from the fake harness.' });
    if (status === 'Failed') out.errorMessage = outcome === 'NoCapableWorker' ? 'No Ready worker could run this run within Runtime.FailBlockedAfterSeconds.' : outcome === 'RepetitionDetected' ? GUARD_MESSAGES.RepetitionDetected : 'Harness reported error_during_execution (is_error).';
    if (outcome === 'RepetitionDetected') out.resultText = GUARD_PARTIAL;
  }
  if (status === 'Running') out.resultText = 'Hello from the fake harness.';
  return out;
}

const PROFILE_ARGS = (id) => [
  { id: `chr_${id}_0000arg`, harnessProfileId: id, position: 0, template: '-p' },
  { id: `chr_${id}_0001arg`, harnessProfileId: id, position: 1, template: '--model', condition: '{{deployment.model}}' }
];

const FACTORIES = {
  tenants: (i) => record('ten', i, { id: i === 1 ? TENANT : `ten_${i}`, name: i === 1 ? 'default' : `tenant-${i}`, description: 'Sample tenant' }),
  users: (i) => record('usr', i, { tenantId: TENANT, firstName: 'User', lastName: String(i), email: `user${i}@garrison.local`, isAdmin: i === 1, isTenantAdmin: i < 3 }),
  credentials: (i) => base('cred', i, { userId: 'usr_0001', accessKey: `AK${i}XYZ`, secretKeyLast4: 'ab12', authMode: 'Hybrid', lastUsedUtc: iso(i) }),
  roles: (i) => base('role', i, { description: 'Role description', isBuiltIn: i < 3 }),
  permissions: (i) => base('perm', i, { permissionType: i % 4 === 0 ? 'Deny' : 'Permit', isBuiltIn: i < 3, resourceTypes: ['Agent', 'Run'], operationTypes: ['Read', 'Execute'] }),
  'role-permissions': (i) => record('rpm', i, { tenantId: TENANT, roleId: 'role_0001', permissionId: `perm_${pad(i)}` }),
  'user-role-assignments': (i) => record('ura', i, { tenantId: TENANT, userId: 'usr_0001', roleId: 'role_0001', roleName: 'TenantAdmin', resourceScope: 'Tenant', inheritsToChildren: true }),
  'credential-scope-assignments': (i) => record('csa', i, { tenantId: TENANT, credentialId: 'cred_0001', roleId: 'role_0002', roleName: 'Invoker', resourceScope: 'Resource', resourceId: 'agt_0001', inheritsToChildren: true }),
  'harness-profiles': (i) => {
    const id = `hp_${pad(i)}`;
    return base('hp', i, {
      name: i === 1 ? 'builtin/claude-code' : `profile-${i}`,
      description: 'Harness profile',
      harnessType: ['ClaudeCode', 'Codex', 'GeminiCli', 'Generic'][i % 4],
      executable: 'claude',
      promptDelivery: 'Stdin',
      systemPromptDelivery: 'File',
      systemPromptTarget: 'system-prompt.md',
      mcpConfigFormat: 'ClaudeJson',
      mcpConfigFileName: 'mcp.json',
      outputParser: 'ClaudeStreamJson',
      resultSource: 'ParserFinalEvent',
      resultFileName: 'last-message.txt',
      successPolicy: 'FinalEvent',
      defaultTimeoutSeconds: 1800,
      killGraceSeconds: 5,
      maxOutputBytes: 67108864,
      stderrTailBytes: 8000,
      isolateHome: true,
      supportsResume: false,
      isBuiltIn: i === 1,
      builtInKey: i === 1 ? 'claude-code' : undefined,
      genericTextField: 'text',
      genericFinalField: 'result',
      genericSuccessField: 'ok',
      genericSuccessValue: 'true',
      arguments: PROFILE_ARGS(id),
      environment: [{ id: `chr_${id}_0000env`, harnessProfileId: id, name: 'NO_COLOR', valueTemplate: '1', isSecret: false }],
      files: [{ id: `chr_${id}_0000fil`, harnessProfileId: id, baseDirectory: 'Config', pathTemplate: 'system-prompt.md', contentTemplate: '{{prompts.system}}', isSecret: false, condition: '{{prompts.system}}' }],
      successExitCodes: [0],
      probeArguments: ['--version'],
      credentialEnvironmentAllowlist: ['ANTHROPIC_API_KEY']
    });
  },
  // Built-ins carry their real names, so the deployment wizard's per-role defaults (M1-03) can be exercised.
  'prompt-templates': (i) =>
    base('pt', i, {
      name: i === 1 ? 'builtin/default-system' : i === 2 ? 'builtin/default-task' : `template-${i}`,
      description: 'Prompt template',
      kind: i === 1 ? 'System' : i === 2 ? 'Task' : ['System', 'Task', 'Fragment'][i % 3],
      content: 'You are {{agent.name}}. Task: {{input.message}}',
      currentVersion: i,
      isBuiltIn: i < 3,
      builtInKey: i === 1 ? 'default-system' : i === 2 ? 'default-task' : undefined,
      variables: [{ id: `chr_pt_${pad(i)}_0000var`, promptTemplateId: `pt_${pad(i)}`, name: 'input.message', required: false }]
    }),
  'prompt-template-versions': (v) => record('tpr', v, { tenantId: TENANT, templateId: 'pt_0001', version: v, content: `Version ${v} {{input.message}}`, changeNote: `v${v}`, createdBy: 'admin@garrison' }),
  'mcp-servers': (i) =>
    base('mcp', i, {
      description: 'MCP server',
      transport: i % 2 ? 'Http' : 'Stdio',
      url: 'http://127.0.0.1:9000',
      path: '/mcp',
      command: i % 2 ? undefined : 'npx',
      toolTimeoutSeconds: 600,
      required: i === 1,
      arguments: i % 2 ? [] : ['-y', 'some-mcp'],
      environment: [],
      headers: [{ id: `chr_mcp_${pad(i)}_0000hea`, mcpServerId: `mcp_${pad(i)}`, name: 'X-Team', valueTemplate: 'platform' }],
      requiredTools: ['search']
    }),
  // sec_0002 is a Codex ChatGPT login the provider rejected (G-22): runs that bind it fail until it is replaced.
  secrets: (i) =>
    i === 2
      ? base('sec', i, {
          description: 'Codex login',
          kind: 'CodexAuthJson',
          valueLast4: 'Z"\n}',
          fingerprint: '5d1c0e8b2a7f4c19',
          keyVersion: 1,
          rotatedUtc: iso(i * 60),
          status: 'NeedsReauthentication',
          statusMessage: 'OpenAI rejected the stored refresh token (HTTP 401 refresh_token_reused: Your refresh token has already been used to generate a new access token.). The refresh token was already used, usually because the same login also refreshed somewhere else (another machine, or a copy of this auth.json)',
          statusUtc: iso(30),
          refreshedUtc: iso(1440),
          accessTokenExpiresUtc: iso(60)
        })
      : base('sec', i, { description: 'Secret', kind: 'AnthropicApiKey', valueLast4: 'wxyz', fingerprint: 'ac3ff3db6348426c', keyVersion: 1, rotatedUtc: iso(i * 60), status: 'Ok' }),
  'workspace-templates': (i) =>
    base('wst', i, {
      description: 'Workspace',
      kind: 'GitRepository',
      gitUrl: 'https://github.com/jchristn/Garrison.git',
      gitRef: 'main',
      gitDepth: 1,
      retention: 'Delete',
      files: [{ id: `chr_wst_${pad(i)}_0000fil`, workspaceTemplateId: `wst_${pad(i)}`, path: 'README.md', content: 'hello' }]
    }),
  'artifact-stores': (i) => base('as', i, { description: 'Database store', kind: 'Database' }),
  agents: (i) =>
    base('agt', i, {
      name: i === 1 ? 'echo-agent' : `agent-${i}`,
      displayName: `Agent ${i}`,
      description: 'Sample agent',
      kind: 'Hosted',
      exposeA2A: true,
      exposeMcpTool: i % 2 === 0,
      mcpToolName: i % 2 === 0 ? `agent_${i}` : undefined,
      inputMode: 'Text',
      delegationMode: i === 2 ? 'AllowList' : 'None',
      delegationMaxDepth: 2,
      delegationAllowRecursion: false,
      registrationTtlSeconds: 0,
      skills: [{ skillId: 'echo', name: 'Echo', description: 'Echoes input' }],
      tags: ['sample'],
      delegationAllowList: i === 2 ? ['echo-agent'] : []
    }),
  deployments: (i) => {
    const id = `dep_${pad(i)}`;
    return base('dep', i, {
      name: `deployment-${i}`,
      description: 'Deployment',
      agentId: i <= 2 ? 'agt_0001' : `agt_000${i}`,
      harnessProfileId: 'hp_0001',
      model: i === 2 ? 'gpt-oss:20b' : 'sonnet',
      timeoutSeconds: 300,
      // P3.15 run guards: deployment-2 (the small local model) sets its own; the others follow the cluster defaults.
      ...(i === 2 ? { repetitionGuard: true, maxAssistantChars: 50000, noProgressSeconds: 120 } : {}),
      // Phase 11: deployments carry run pod resources (empty unless set); executor is omitted to inherit the pool default.
      podResources: i === 4 ? { cpuRequest: '250m', memoryLimit: '2Gi' } : {},
      maxConcurrentRuns: 0,
      maxAttempts: 1,
      retryOnNodeLoss: false,
      weight: i === 1 ? 300 : 100,
      nodePoolId: 'np_0001',
      workspaceTemplateId: 'wst_0001',
      artifactStoreId: 'as_0001',
      configVersion: 3,
      active: i !== 3,
      promptBindings: [
        { id: `chr_${id}_0000pro`, deploymentId: id, role: 'System', templateId: 'tpl_builtin_default_system' },
        { id: `chr_${id}_0001pro`, deploymentId: id, role: 'Task', templateId: 'tpl_builtin_default_task', pinnedVersion: 1 }
      ],
      resourceBindings: [
        { id: `chr_${id}_0000res`, deploymentId: id, kind: 'McpServer', alias: 'tools', resourceId: 'mcp_0001' },
        { id: `chr_${id}_0001res`, deploymentId: id, kind: 'Secret', alias: 'anthropic', resourceId: 'sec_0001' }
      ],
      argumentOverrides: [{ id: `chr_${id}_0000arg`, deploymentId: id, position: 0, operation: 'Append', template: '--verbose' }],
      environmentOverrides: [{ id: `chr_${id}_0000env`, deploymentId: id, name: 'LOG_LEVEL', valueTemplate: 'info', isSecret: false }],
      fileOverrides: [{ id: `chr_${id}_0000fil`, deploymentId: id, baseDirectory: 'Config', pathTemplate: 'extra.txt', contentTemplate: 'x', isSecret: false }],
      nodeSelector: [{ id: `chr_${id}_0000nod`, deploymentId: id, key: 'zone', value: 'a' }],
      parameters: [{ id: `chr_${id}_0000par`, deploymentId: id, name: 'format', value: 'claude' }],
      // P12.3: deployment-1 asks before tool calls, with three ordered rules; the others leave approvals off.
      approvalsEnabled: i === 1,
      approvalDefaultAction: 'Ask',
      approvalTimeoutSeconds: 300,
      approvalTimeoutDecision: 'Deny',
      approvalRules:
        i === 1
          ? [
              { id: 'dar_0001', deploymentId: id, action: 'Allow', pattern: 'Bash(git status:*)', description: 'Read-only status checks' },
              { id: 'dar_0002', deploymentId: id, action: 'Deny', pattern: 'Bash(rm:*)', description: 'Never delete files' },
              { id: 'dar_0003', deploymentId: id, action: 'Ask', pattern: 'WebFetch', inputPattern: '"url":"https://internal\\.' }
            ]
          : [],
      allowedRunOverrides: [
        { id: `chr_${id}_0000all`, deploymentId: id, name: 'format', validation: 'Any' },
        // P3.15: callers may set a per-run time limit on deployment-2, from 30 seconds to 30 minutes.
        ...(i === 2 ? [{ id: `chr_${id}_0001all`, deploymentId: id, name: 'timeoutSeconds', validation: 'IntegerRange', pattern: '30,1800' }] : [])
      ]
    });
  },
  // Node pools and nodes are cluster-wide records: no tenantId.
  // Phase 11: np-1 runs deployments without their own executor as Kubernetes Jobs.
  'node-pools': (i) => record('np', i, { name: `np-${i}`, description: 'Pool', tenants: [], ...(i === 1 ? { defaultExecutor: 'KubernetesJob' } : {}) }),
  runs: run,
  nodes: (i) => {
    const id = `node_${pad(i)}`;
    return record('node', i, {
      name: `garrison-worker-${i - 1}`,
      address: `garrison-worker-${i - 1}.garrison`,
      nodeVersion: '0.1.0-alpha',
      status: i === 3 ? 'Cordoned' : 'Ready',
      maxConcurrentRuns: 4,
      activeRuns: i % 3,
      credentialId: 'cred_node',
      lastHeartbeatUtc: iso(0),
      registeredUtc: iso(600),
      labels: [{ id: `chr_${id}_0000lab`, nodeId: id, key: 'zone', value: 'a' }],
      executors: i === 1 ? ['Process', 'KubernetesJob'] : ['Process'],
      capabilities: [{ id: `chr_${id}_0000cap`, nodeId: id, harnessType: 'ClaudeCode', executable: 'claude', detectedVersion: '2.1.0', available: true, detail: '2.1.0 (Claude Code)' }]
    });
  },
  audit: (i) =>
    record('aud', i, {
      tenantId: TENANT,
      eventType: i % 5 === 0 ? 'AuthorizationDenied' : 'AuthSuccess',
      requestId: `req-${i}`,
      principalType: 'User',
      principalId: 'usr_0001',
      principalName: 'admin@garrison',
      authScheme: 'BearerToken',
      sessionId: 'ses_e2e',
      authResult: 'Success',
      resourceType: 'Agent',
      resourceId: 'agt_0001',
      operation: 'Read',
      authorizationResult: i % 5 === 0 ? 'DeniedImplicit' : 'Permitted',
      bypassReason: 'IsAdmin',
      statusCode: i % 5 === 0 ? 403 : 200,
      reason: 'ok',
      description: 'Read agent',
      sourceIp: '127.0.0.1'
    }),
  'manifest-applies': (i) =>
    record('ma', i, {
      tenantId: TENANT,
      principalName: 'admin@garrison',
      dryRun: i % 2 === 0,
      documentCount: 3,
      createdCount: 2,
      updatedCount: 1,
      unchangedCount: 0,
      failedCount: 0,
      items: [
        { id: `chr_ma_${pad(i)}_0000ite`, manifestApplyId: `ma_${pad(i)}`, position: 0, kind: 'Agent', name: 'echo-agent', result: i % 2 === 0 ? 'Validated' : 'Created', plannedResult: 'Created', resourceId: 'agt_0001' },
        {
          id: `chr_ma_${pad(i)}_0001ite`,
          manifestApplyId: `ma_${pad(i)}`,
          position: 1,
          kind: 'Deployment',
          name: 'echo-agent-default',
          result: i % 2 === 0 ? 'Validated' : 'Updated',
          plannedResult: 'Updated',
          resourceId: 'dep_0001',
          // M1-14 (P9.17): field-level changes for Updated items, values as strings truncated to 200 characters.
          changes: [
            { field: 'weight', before: '100', after: '300' },
            { field: 'model', before: null, after: 'sonnet' }
          ]
        }
      ]
    }),
  'request-history': (i) => ({
    id: `req_${pad(i)}`,
    tenantId: TENANT,
    userId: 'usr_0001',
    principalName: 'admin@garrison',
    method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
    path: `/v1.0/api/tenants/${TENANT}/agents`,
    url: `/v1.0/api/tenants/${TENANT}/agents`,
    statusCode: i % 7 === 0 ? 500 : i % 5 === 0 ? 404 : 200,
    durationMs: 3 + i,
    sourceIp: '127.0.0.1',
    requestBodyBytes: 0,
    requestBodyTruncated: false,
    responseBody: '{"objects":[]}',
    responseBodyBytes: 14,
    responseBodyTruncated: false,
    createdUtc: iso(i * 2),
    completedUtc: iso(i * 2 - 0.01),
    headers: [{ id: `chr_req_${pad(i)}_0000hea`, requestHistoryEntryId: `req_${pad(i)}`, direction: 'Request', name: 'accept', value: 'application/json' }]
  })
};

const TOTALS = { runs: 137, 'request-history': 64, audit: 42 };

/**
 * Permission approvals (P12.3), shaped like the server's Approval: apr_0001 and apr_0002 wait for a person on
 * run_0002; the rest show every way a request is decided (rule, person with remember, timeout, deployment default).
 * Garrison records itself ("garrison") as the decider when a rule, the default, or a timeout decides.
 */
const APPROVAL_ROWS = [
  { status: 'Pending', kind: 'Tool', toolName: 'Bash', summary: 'git push origin main', input: { command: 'git push origin main' }, suggestedRule: 'Bash(git push:*)', runId: 'run_0002' },
  { status: 'Pending', kind: 'Tool', toolName: 'WebFetch', summary: 'https://internal.example.com/wiki', input: { url: 'https://internal.example.com/wiki', prompt: 'Summarize' }, suggestedRule: 'WebFetch(domain:internal.example.com)', runId: 'run_0002', ruleId: 'dar_0003', rulePattern: 'WebFetch' },
  { status: 'Approved', kind: 'Tool', toolName: 'Bash', summary: 'git status --short', input: { command: 'git status --short' }, suggestedRule: 'Bash(git status:*)', decision: 'Allow', decisionSource: 'Rule', ruleId: 'dar_0001', rulePattern: 'Bash(git status:*)', decidedBy: 'garrison', waitMs: 3 },
  { status: 'Denied', kind: 'Tool', toolName: 'Bash', summary: 'rm -rf build', input: { command: 'rm -rf build', token: '[redacted]' }, suggestedRule: 'Bash(rm:*)', decision: 'Deny', decisionSource: 'User', decidedBy: 'admin@garrison', decidedById: 'usr_0001', reason: 'Do not delete the build output.', rememberedRuleId: 'dar_0002', waitMs: 95000 },
  { status: 'Expired', kind: 'Tool', toolName: 'mcp__github__create_issue', summary: 'mcp__github__create_issue', input: { title: 'Flaky test' }, suggestedRule: 'mcp__github__create_issue', decision: 'Deny', decisionSource: 'Timeout', decidedBy: 'garrison', waitMs: 300000 },
  { status: 'Approved', kind: 'Command', toolName: 'Bash', summary: 'npm test', input: { command: 'npm test', cwd: '/work/run_0005' }, suggestedRule: 'Bash(npm test:*)', decision: 'Allow', decisionSource: 'Default', decidedBy: 'garrison', waitMs: 2, harnessType: 'Codex' }
];

/** One approval record by row number (1-based). */
export function approval(i) {
  const row = APPROVAL_ROWS[(i - 1) % APPROVAL_ROWS.length];
  const pending = row.status === 'Pending';
  const out = {
    id: `apr_${pad(i)}`,
    tenantId: TENANT,
    runId: row.runId || `run_${pad(i)}`,
    agentId: 'agt_0001',
    agentName: 'echo-agent',
    deploymentId: 'dep_0001',
    leaseEpoch: 1,
    harnessType: row.harnessType || 'ClaudeCode',
    kind: row.kind,
    toolName: row.toolName,
    toolCallId: `toolu_${pad(i)}`,
    inputPreview: JSON.stringify(row.input),
    summary: row.summary,
    suggestedRule: row.suggestedRule,
    status: row.status,
    timeoutDecision: 'Deny',
    requestedUtc: iso(i * 5),
    createdUtc: iso(i * 5),
    lastUpdateUtc: iso(i * 5 - 1)
  };
  for (const key of ['decision', 'decisionSource', 'ruleId', 'rulePattern', 'rememberedRuleId', 'decidedBy', 'decidedById', 'reason']) if (row[key]) out[key] = row[key];
  if (pending) out.expiresUtc = iso(i * 5 - 5);
  else {
    out.decidedUtc = iso(i * 5 - 1);
    out.waitMs = row.waitMs;
  }
  return out;
}

/** GET /approvals with the filters the inbox and run detail send (status, runId, agentId, decisionSource). */
function approvalList(url) {
  let rows = APPROVAL_ROWS.map((_, k) => approval(k + 1));
  for (const key of ['status', 'runId', 'agentId', 'decisionSource', 'deploymentId']) {
    const value = url.searchParams.get(key);
    if (value) rows = rows.filter((r) => r[key] === value);
  }
  const maxResults = Number(url.searchParams.get('maxResults') || 25);
  const skip = Number(url.searchParams.get('skip') || 0);
  const objects = rows.slice(skip, skip + maxResults);
  return { success: true, maxResults, skip, totalRecords: rows.length, recordsRemaining: Math.max(0, rows.length - skip - objects.length), endOfResults: skip + objects.length >= rows.length, timestampUtc: iso(0), objects };
}

/** POST /approvals/{id}/decide: the approval as a person allowed it. */
export function decidedApproval(id) {
  const source = approval(/^apr_\d+$/.test(id) ? Number(id.slice(4)) : 1);
  const out = { ...source, id, status: 'Approved', decision: 'Allow', decisionSource: 'User', decidedBy: 'admin@garrison', decidedById: 'usr_0001', decidedUtc: iso(0), waitMs: 60000 };
  delete out.expiresUtc;
  return out;
}

/** POST /deployments/{id}/approval-check: what the saved rules do with a tool call. Nothing is recorded. */
export const APPROVAL_CHECK = { action: 'Allow', source: 'Rule', ruleId: 'dar_0001', rulePattern: 'Bash(git status:*)', suggestedRule: 'Bash(git status:*)', approvalsEnabled: true };

/** EnumerationResult: the maxResults and skip envelope most list routes return. */
function enumerate(collection, url) {
  const factory = FACTORIES[collection];
  if (!factory) return null;
  const total = TOTALS[collection] ?? 6;
  const pageSize = Number(url.searchParams.get('maxResults') || url.searchParams.get('pageSize') || 25);
  const skip = Number(url.searchParams.get('skip') || 0) || (Number(url.searchParams.get('pageNumber') || 1) - 1) * pageSize;
  const objects = [];
  for (let i = skip + 1; i <= Math.min(total, skip + pageSize); i++) objects.push(factory(i));
  return { success: true, maxResults: pageSize, skip, totalRecords: total, recordsRemaining: Math.max(0, total - skip - objects.length), endOfResults: skip + objects.length >= total, timestampUtc: iso(0), objects };
}

/** Audit and request history page by pageNumber and pageSize and answer { pageNumber, pageSize, totalCount, totalPages, objects }. */
function page(collection, url) {
  const total = TOTALS[collection] ?? 6;
  const pageSize = Number(url.searchParams.get('pageSize') || 25);
  const pageNumber = Number(url.searchParams.get('pageNumber') || 1);
  const objects = [];
  for (let i = (pageNumber - 1) * pageSize + 1; i <= Math.min(total, pageNumber * pageSize); i++) objects.push(FACTORIES[collection](i));
  return { pageNumber, pageSize, totalCount: total, totalPages: Math.ceil(total / pageSize), objects };
}

const SETTINGS = {
  settingsFile: '/etc/garrison/garrison.json',
  settingsFileWritable: true,
  restartPending: false,
  fields: [
    { path: 'Rest.Port', group: 'Rest', description: 'REST port.', type: 'int', value: '8700', isSecret: false, isSet: true, source: 'File', applyMode: 'RestartRequired', editable: true, minimum: 1, maximum: 65535 },
    { path: 'Rest.Hostname', group: 'Rest', description: 'REST bind hostname (* for all interfaces).', type: 'string', value: '127.0.0.1', isSecret: false, isSet: true, source: 'Environment', applyMode: 'RestartRequired', editable: false },
    { path: 'Logging.ConsoleLogging', group: 'Logging', description: 'Log to the console.', type: 'bool', value: 'true', isSecret: false, isSet: true, source: 'File', applyMode: 'RestartRequired', editable: true },
    { path: 'Logging.MinimumSeverity', group: 'Logging', description: 'Minimum severity, 0 (debug) to 7 (emergency).', type: 'int', value: '2', isSecret: false, isSet: true, source: 'File', applyMode: 'Live', editable: true, minimum: 0, maximum: 7 },
    { path: 'Database.Type', group: 'Database', description: 'Database provider.', type: 'enum', value: 'Sqlite', isSecret: false, isSet: true, source: 'File', applyMode: 'RestartRequired', editable: true, allowedValues: ['Sqlite', 'Postgresql'] },
    { path: 'Database.Password', group: 'Database', description: 'Database password.', type: 'secret', isSecret: true, isSet: true, value: '********', source: 'File', applyMode: 'RestartRequired', editable: true },
    { path: 'Scheduling.LeaseDurationMs', group: 'Scheduling', description: 'Run lease duration; heartbeats extend it.', type: 'int', value: '30000', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 5000, maximum: 600000 },
    { path: 'Scheduling.PauseGraceMs', group: 'Scheduling', description: 'Grace after a detected pause before nodes are marked Lost.', type: 'int', value: '5000', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 1000, maximum: 600000 },
    // P3.15: the run cap and the run guard defaults deployments follow.
    { path: 'Runtime.MaxRunSeconds', group: 'Runtime', description: "Cluster cap on any run's execution in seconds.", type: 'int', value: '1200', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 60, maximum: 604800 },
    { path: 'Runtime.RepetitionGuard', group: 'Runtime', description: 'Default for deployments that do not set repetitionGuard.', type: 'bool', value: 'true', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true },
    { path: 'Runtime.MaxAssistantChars', group: 'Runtime', description: 'Default for deployments that do not set maxAssistantChars. 0 is unlimited.', type: 'int', value: '200000', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 0, maximum: 100000000 },
    { path: 'Runtime.NoProgressSeconds', group: 'Runtime', description: 'Default for deployments that do not set noProgressSeconds. 0 turns the guard off.', type: 'int', value: '300', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 0, maximum: 86400 },
    { path: 'Runtime.FailBlockedAfterSeconds', group: 'Runtime', description: 'Seconds a queued run may wait with no Ready worker able to run it before it fails with outcome NoCapableWorker. 0 waits forever.', type: 'int', value: '0', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 0, maximum: 604800 },
    // G-22: control-plane refresh of Codex ChatGPT logins; settings-file values that apply live.
    { path: 'Codex.RefreshBeforeExpirySeconds', group: 'Codex', description: 'Refresh a ChatGPT login stored in a CodexAuthJson secret when its access token expires within this many seconds (half the token lifetime for short-lived tokens). Keep it above Runtime.MaxRunSeconds.', type: 'int', value: '86400', isSecret: false, isSet: true, source: 'File', applyMode: 'Live', editable: true, minimum: 300, maximum: 2592000 },
    { path: 'Codex.TokenEndpoint', group: 'Codex', description: 'OAuth token endpoint for Codex login refreshes. Empty uses https://auth.openai.com/oauth/token, the endpoint the Codex CLI uses.', type: 'string', value: 'https://auth.openai.com/oauth/token', isSecret: false, isSet: true, source: 'File', applyMode: 'Live', editable: true },
    // P13.13: observability URLs are cluster string settings; empty means not configured.
    { path: 'Observability.GrafanaUrl', group: 'Observability', description: 'Browser-facing Grafana URL for the Home card and deep links, for example https://grafana.example.com. Empty means not configured.', type: 'string', value: '', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true },
    { path: 'Observability.GrafanaInternalUrl', group: 'Observability', description: 'URL the server uses to probe Grafana for reachability. Empty uses the browser-facing URL.', type: 'string', value: '', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true }
  ]
};

const OPENAPI = {
  openapi: '3.0.1',
  info: { title: 'Garrison', version: '0.1.0-alpha', description: 'Garrison control plane REST API.' },
  paths: {
    '/v1.0/api/health': { get: { tags: ['Health'], summary: 'Health check', operationId: 'health' } },
    '/v1.0/api/tenants/{tenantId}/agents': {
      get: { tags: ['Agents'], summary: 'List agents', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'maxResults', in: 'query', schema: { type: 'integer' } }] },
      post: { tags: ['Agents'], summary: 'Create agent', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } } }
    },
    '/v1.0/api/tenants/{tenantId}/agents/{agentId}': {
      delete: { tags: ['Agents'], summary: 'Delete agent', parameters: [{ name: 'tenantId', in: 'path', required: true }, { name: 'agentId', in: 'path', required: true }] }
    }
  }
};

function summary() {
  const buckets = [];
  for (let i = 0; i < 24; i++) buckets.push({ bucketStartUtc: iso(i * 60), bucketEndUtc: iso(i * 60 - 60), successCount: 10 + (i % 5), failureCount: i % 3, averageDurationMs: 20 + i });
  return { totalCount: 400, totalSuccess: 360, totalFailure: 40, averageDurationMs: 24, buckets };
}

const ANALYTICS_GROUPS = {
  agent: [
    { key: 'agt_0001', label: 'echo-agent', scale: 1 },
    { key: 'agt_0002', label: 'agent-2', scale: 0.5 }
  ],
  harness: [
    { key: 'ClaudeCode', label: 'ClaudeCode', scale: 1 },
    { key: 'Mux', label: 'Mux', scale: 0.4 }
  ],
  model: [
    { key: 'claude-sonnet-5-5', label: 'claude-sonnet-5-5', scale: 1 },
    { key: 'gpt-oss:20b', label: 'gpt-oss:20b', scale: 0.4 }
  ],
  harnessModel: [
    { key: 'ClaudeCode|claude-sonnet-5-5', label: 'ClaudeCode / claude-sonnet-5-5', scale: 1 },
    { key: 'Mux|gpt-oss:20b', label: 'Mux / gpt-oss:20b', scale: 0.4 },
    { key: 'Codex|unknown', label: 'Codex / unknown', scale: 0.2 }
  ]
};

export const DIMENSIONS = {
  agents: [
    { id: 'agt_0001', name: 'echo-agent' },
    { id: 'agt_0002', name: 'agent-2' }
  ],
  harnesses: ['ClaudeCode', 'Codex', 'Mux'],
  deployments: [
    { id: 'dep_0001', name: 'deployment-1', agentId: 'agt_0001' },
    { id: 'dep_0002', name: 'deployment-2', agentId: 'agt_0001' }
  ],
  models: ['claude-sonnet-5-5', 'gpt-oss:20b', 'unknown'],
  truncated: false
};

function analyticsMetrics(i, scale) {
  const runs = Math.round((8 + (i % 5)) * scale);
  const failed = i % 4 === 0 ? 1 : 0;
  const cancelled = i % 7 === 0 ? 1 : 0;
  const timedOut = i % 9 === 0 ? 1 : 0;
  const quiet = i % 11 === 5;
  return {
    runs: quiet ? 0 : runs,
    succeeded: quiet ? 0 : Math.max(0, runs - failed - cancelled - timedOut),
    failed: quiet ? 0 : failed,
    cancelled: quiet ? 0 : cancelled,
    timedOut: quiet ? 0 : timedOut,
    inputTokens: quiet ? 0 : runs * 2100,
    outputTokens: quiet ? 0 : runs * 340,
    cachedTokens: quiet ? 0 : runs * 900,
    reasoningTokens: quiet ? 0 : runs * 40,
    costUsd: quiet ? 0 : Number((runs * 0.0123).toFixed(4)),
    toolCalls: quiet ? 0 : runs * 2,
    timeToFirstTokenMsAvg: quiet ? null : 1100 + (i % 6) * 90,
    timeToFirstTokenMsP50: quiet ? null : 1000 + (i % 6) * 80,
    timeToFirstTokenMsP95: quiet ? null : 2400 + (i % 6) * 150,
    timeToFirstTokenExcludingDelegationMsAvg: quiet ? null : 900 + (i % 6) * 90,
    timeToFirstTokenExcludingDelegationMsP50: quiet ? null : 850 + (i % 6) * 80,
    timeToFirstTokenExcludingDelegationMsP95: quiet ? null : 1900 + (i % 6) * 150,
    delegationWaitMsAvg: quiet ? null : i % 3 === 0 ? 0 : 200 + (i % 4) * 50,
    streamingMsAvg: quiet ? null : 4200 + (i % 8) * 200,
    executionMsAvg: quiet ? null : 6100 + (i % 8) * 250,
    executionMsP95: quiet ? null : 11000 + (i % 8) * 400,
    queueMsAvg: quiet ? null : 150 + (i % 5) * 40,
    outputTokensPerSecondAvg: quiet ? null : 70 + (i % 9) * 3
  };
}

function sumMetrics(list) {
  const out = {};
  for (const m of list) for (const [k, v] of Object.entries(m)) if (/^(runs|succeeded|failed|cancelled|timedOut|inputTokens|outputTokens|cachedTokens|reasoningTokens|costUsd|toolCalls)$/.test(k)) out[k] = (out[k] || 0) + v;
  const avg = (k) => {
    const vals = list.map((m) => m[k]).filter((v) => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  for (const k of ['timeToFirstTokenMsAvg', 'timeToFirstTokenMsP50', 'timeToFirstTokenMsP95', 'timeToFirstTokenExcludingDelegationMsAvg', 'timeToFirstTokenExcludingDelegationMsP50', 'timeToFirstTokenExcludingDelegationMsP95', 'delegationWaitMsAvg', 'streamingMsAvg', 'executionMsAvg', 'executionMsP95', 'queueMsAvg', 'outputTokensPerSecondAvg']) out[k] = avg(k);
  return out;
}

/** GET /analytics/runs: 24 buckets across the requested range, one series per group when grouping. */
export function analytics(url) {
  const to = url.searchParams.get('to') ? Date.parse(url.searchParams.get('to')) : NOW;
  const from = url.searchParams.get('from') ? Date.parse(url.searchParams.get('from')) : to - 24 * 3600 * 1000;
  const count = 24;
  const bucketMs = Math.max(60000, Math.floor((to - from) / count));
  const groupBy = url.searchParams.get('groupBy') || 'none';
  const groups = ANALYTICS_GROUPS[groupBy] || [{ key: 'all', label: 'All runs', scale: 1 }];
  const series = groups.map((g) => ({
    key: g.key,
    label: g.label,
    buckets: Array.from({ length: count }, (_, i) => ({ startUtc: new Date(from + i * bucketMs).toISOString(), ...analyticsMetrics(i, g.scale) }))
  }));
  return {
    fromUtc: new Date(from).toISOString(),
    toUtc: new Date(to).toISOString(),
    interval: 'auto',
    bucketSeconds: Math.round(bucketMs / 1000),
    truncated: false,
    totals: sumMetrics(series.flatMap((s) => s.buckets)),
    series
  };
}

const event = (sequence, eventType, extra) => ({ id: `rev_${pad(sequence)}`, tenantId: TENANT, runId: 'run_0001', sequence, eventType, timestampUtc: iso(6 - sequence * 0.5), ...extra, createdUtc: iso(6 - sequence * 0.5) });

/** Markdown the mocked stream sends in small pieces: a heading, a table, a list with a link, and a code block. */
export const STREAM_DELTAS = ['## Sum', 'mary\n\n', '| File | Lines |\n|---|---|\n', '| README.md | 42 |\n\n', '- **Bold** item\n', '- [Docs](https://example.com/docs)\n\n', '```bash\nnpm test\n```\n'];

const EVENTS = [
  // Events Garrison writes carry a machine code (P9.17) so the dashboard can translate them.
  event(1, 'Lifecycle', { text: 'Workspace prepared at /work/run_0001.', code: 'WorkspacePrepared' }),
  event(2, 'Thinking', { text: 'The user wants a greeting. I will check the README first.' }),
  event(3, 'AssistantText', { text: 'Hello from the fake harness.', rawEventJson: '{"type":"assistant"}' }),
  event(4, 'ToolCall', { toolName: 'read_file', toolCallId: 'toolu_01', text: '{"path":"README.md"}' }),
  event(5, 'ToolResult', { toolName: 'read_file', toolCallId: 'toolu_01', success: true, text: '# Garrison' }),
  // Token deltas (no raw line), the way Claude Code streams with partial messages (P5.52).
  ...STREAM_DELTAS.map((text, i) => event(6 + i, 'AssistantText', { text })),
  event(6 + STREAM_DELTAS.length, 'Usage', { inputTokens: 1201, outputTokens: 341 }),
  event(7 + STREAM_DELTAS.length, 'Result', { text: 'Done.', rawEventJson: '{"type":"result","is_error":false}' })
];

/** Transcript of a guard-stopped run: the loop, then one RunGuardTriggered warning and the exit. */
export function guardEvents(outcome = 'RepetitionDetected') {
  return [
    event(1, 'Lifecycle', { text: 'Workspace prepared at /work/run_0013.', code: 'WorkspacePrepared' }),
    event(2, 'AssistantText', { text: 'Here is the plan:\n\n' }),
    ...Array.from({ length: 4 }, (_, k) => event(3 + k, 'AssistantText', { text: '* \n'.repeat(10) })),
    event(7, 'Warning', { text: GUARD_MESSAGES[outcome], code: 'RunGuardTriggered' }),
    event(8, 'Lifecycle', { text: `Harness exited with code 143: Failed (${outcome}).`, code: 'HarnessExited' })
  ];
}

/** A run a run guard stopped, shaped like the server's. */
export function guardRun(id, outcome = 'RepetitionDetected', extra = {}) {
  return { ...run(13), id, outcome, errorMessage: GUARD_MESSAGES[outcome], resultText: GUARD_PARTIAL, ...extra };
}

const OVERVIEW = () => ({
  agents: 6,
  deployments: 6,
  runsLast24Hours: 137,
  runsByStatus: [
    { status: 'Running', count: 2 },
    { status: 'Queued', count: 3 },
    { status: 'Succeeded', count: 120 },
    { status: 'Failed', count: 12 }
  ],
  nodesByStatus: [
    { status: 'Ready', count: 2 },
    { status: 'Cordoned', count: 1 }
  ],
  controlNodesByStatus: [{ status: 'Ready', count: 2 }],
  leaderNodeId: 'garrison-server-a',
  queued: 3,
  blockedRuns: 2,
  active: 2,
  generatedUtc: new Date().toISOString(),
  recentFailures: [2, 8].map((i) => ({ ...FACTORIES.runs(i), status: 'Failed', outcome: 'HarnessFailed', completedUtc: iso(i * 7 - 1), exitCode: 1, stderrTail: '', errorMessage: 'Harness reported error_during_execution (is_error).' }))
});

const PERMISSIONS = (principalType, principalId) => ({
  principalType,
  principalId,
  tenantId: TENANT,
  isAdmin: false,
  isTenantAdmin: false,
  grants: [
    { source: 'TenantMember', permissionType: 'Permit', resourceTypes: ['Agent', 'Tenant'], operations: ['Read'], scope: 'Tenant', inheritsToChildren: true },
    { source: 'Invoker', permissionType: 'Permit', resourceTypes: ['Agent'], operations: ['Execute'], scope: 'Resource', resourceId: 'agt_0001', inheritsToChildren: false }
  ],
  hasPermission: [
    { resourceType: 'Agent', operation: 'Read', permitted: true },
    { resourceType: 'Agent', operation: 'Delete', permitted: false }
  ]
});

const AGENT_CARD = {
  name: 'Agent 1',
  description: 'Sample agent',
  version: '0.1.0-alpha',
  supportedInterfaces: [{ url: `http://127.0.0.1:8700/v1.0/a2a/${TENANT}/echo-agent`, protocolBinding: 'JSONRPC', protocolVersion: '1.0' }],
  provider: { organization: 'Garrison', url: 'https://github.com/jchristn/Garrison' },
  capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: false },
  skills: [{ id: 'echo', name: 'Echo', description: 'Echoes input', tags: ['sample'] }],
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  securitySchemes: { garrison: { httpAuthSecurityScheme: { scheme: 'bearer', description: 'Garrison session token or run token.' } } },
  securityRequirements: [{ schemes: { garrison: [] } }]
};

const SERVER_INFO = {
  product: 'Garrison',
  version: '0.1.0-alpha',
  nodeId: 'garrison-server-a',
  restUrl: 'http://127.0.0.1:8700',
  mcpUrl: 'http://127.0.0.1:8701/mcp',
  a2aUrl: 'http://127.0.0.1:8700/v1.0/a2a',
  openApiUrl: 'http://127.0.0.1:8700/openapi.json',
  databaseType: 'Sqlite',
  expectedReplicas: 1,
  telemetryEnabled: false,
  requestHistoryEnabled: true,
  routeCount: 214,
  repositoryUrl: 'https://github.com/jchristn/Garrison',
  startedUtc: iso(600),
  features: ['mcp', 'a2a', 'request-history'],
  // P13.13: always present; URLs are null when not configured, datasources and dashboards null without Grafana.
  observability: { grafanaUrl: null, prometheusUrl: null, lokiUrl: null, tempoUrl: null, datasources: null, dashboards: null }
};

/** GET /server-info observability block with every service configured (P13.14 tests). */
export const OBSERVABILITY_CONFIGURED = {
  grafanaUrl: 'http://localhost:3000/',
  prometheusUrl: 'http://127.0.0.1:9090',
  lokiUrl: 'http://127.0.0.1:3100',
  tempoUrl: 'http://127.0.0.1:3200',
  datasources: { prometheus: 'garrison-prometheus', loki: 'garrison-loki', tempo: 'garrison-tempo' },
  dashboards: {
    overview: 'garrison-overview',
    http: 'garrison-http',
    runs: 'garrison-runs',
    workers: 'garrison-workers',
    protocols: 'garrison-protocols',
    integrations: 'garrison-integrations',
    agents: 'garrison-agents',
    models: 'garrison-models',
    kubernetes: 'garrison-kubernetes',
    scheduler: 'garrison-scheduler',
    database: 'garrison-database',
    controlPlane: 'garrison-control-plane',
    security: 'garrison-security',
    logs: 'garrison-logs'
  }
};

/** GET /observability/status: always the four services, in order. Nothing is configured in the default mocks. */
function observabilityStatus() {
  return ['grafana', 'prometheus', 'loki', 'tempo'].map((service) => ({ service, configured: false, reachable: false, checkedUtc: iso(0) }));
}

/**
 * A control-plane replica (P10.19), the shape GET /control-nodes returns. Timestamps follow the real clock (not NOW)
 * so heartbeat ages read as fresh in the browser; pass `lastHeartbeatUtc` to simulate a stale replica.
 */
export function controlNode(name, extra = {}) {
  const now = Date.now();
  return {
    id: name,
    name,
    hostname: name,
    address: extra.address || '10.42.0.17:8700',
    version: '0.1.0-alpha',
    schemaVersion: 7,
    backplane: 'PostgresNotify',
    status: 'Ready',
    startedUtc: new Date(now - (3 * 3600 + 25 * 60) * 1000).toISOString(),
    lastHeartbeatUtc: new Date(now - 2000).toISOString(),
    activeRequests: 0,
    openStreams: 0,
    heldLongPolls: 0,
    isLeader: false,
    ...extra
  };
}

/** Two Ready replicas; garrison-server-a holds the leader lease (matches OVERVIEW.leaderNodeId). */
export function controlNodes() {
  return [
    controlNode('garrison-server-a', { isLeader: true, leaderEpoch: 4, activeRequests: 1, openStreams: 2, heldLongPolls: 3 }),
    controlNode('garrison-server-b', { address: '10.42.0.18:8700', activeRequests: 0, openStreams: 1, heldLongPolls: 1 })
  ];
}

/** GET /control-nodes: the enumeration envelope plus respondingNodeId. */
export function controlNodeList(objects = controlNodes(), respondingNodeId = 'garrison-server-a') {
  return { respondingNodeId, success: true, maxResults: 25, skip: 0, totalRecords: objects.length, recordsRemaining: 0, endOfResults: true, timestampUtc: new Date().toISOString(), objects };
}

/** JSON body for a request, or undefined when unhandled. Also used by the contract test (tests/contract/run.mjs). */
export function respond(method, url) {
  const p = url.pathname;
  if (p === '/openapi.json') return OPENAPI;
  if (p === '/v1.0/token' && method === 'POST') return { token: 'tok_e2e', expiresUtc: iso(-60), tenantId: TENANT, sessionId: 'ses_e2e', principalType: 'User' };
  if (p === '/v1.0/token' && method === 'GET') return { valid: true };
  if (p === '/v1.0/token/details') return PRINCIPAL;
  if (p.startsWith('/v1.0/token')) return {};
  if (p === '/v1.0/api/health') return { status: 'healthy', node: 'garrison-server-a', version: '0.1.0-alpha', database: 'ok', schemaVersion: 6, expectedSchemaVersion: 6, backplane: 'PostgresNotify', utc: iso(0) };
  if (p === '/v1.0/api/server-info') return SERVER_INFO;
  if (p === '/v1.0/api/observability/status') return observabilityStatus();
  if (p === '/v1.0/api/control-nodes') return controlNodeList();
  if (p.startsWith('/v1.0/api/control-nodes/')) {
    const id = decodeURIComponent(p.split('/').pop());
    const node = controlNodes().find((n) => n.id === id) || controlNodes()[0];
    return { ...node, respondingNodeId: 'garrison-server-a' };
  }
  if (p === '/v1.0/api/settings') return method === 'GET' ? SETTINGS : { saved: true, restartRequired: true, appliedLive: [], pendingRestart: ['Rest.Port'], settings: SETTINGS };
  if (p.startsWith('/v1.0/api/settings')) return { success: true, message: 'ok' };
  if (p === '/v1.0/api/request-history/summary') return summary();
  if (p === '/v1.0/api/request-history') return method === 'GET' ? page('request-history', url) : undefined;
  if (p === '/v1.0/api/harness-profiles/builtin') return enumerate('harness-profiles', url).objects;

  let m = p.match(/^\/v1\.0\/api\/(request-history|nodes|node-pools|tenants)(?:\/([^/]+))?(?:\/(cordon|uncordon|drain))?$/);
  if (m) {
    if (!m[2]) return method === 'GET' ? enumerate(m[1], url) : FACTORIES[m[1]](99);
    return FACTORIES[m[1]](1);
  }

  m = p.match(/^\/v1\.0\/api\/tenants\/[^/]+\/(.+)$/);
  if (m) {
    const parts = m[1].split('/');
    const collection = parts[0];
    if (collection === 'overview') return OVERVIEW();
    if (collection === 'analytics' && parts[1] === 'runs' && parts[2] === 'dimensions') return DIMENSIONS;
    if (collection === 'analytics' && parts[1] === 'runs') return analytics(url);
    if (collection === 'queue') return [{ agentName: 'echo-agent', harnessType: 'ClaudeCode', queued: 3, leased: 1, running: 2 }];
    if (collection === 'audit' && parts.length === 1 && method === 'GET') return page('audit', url);
    if (collection === 'manifests' && parts[1] === 'applies') return parts.length === 2 ? enumerate('manifest-applies', url) : FACTORIES['manifest-applies'](1);
    if (collection === 'manifests' && parts[1] === 'export') return 'apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: echo-agent\n';
    if (collection === 'manifests')
      return {
        items: [
          { kind: 'Agent', name: 'echo-agent', result: 'Validated', plannedResult: 'Created', message: 'Would be created.' },
          { kind: 'Deployment', name: 'echo-agent-default', result: 'Validated', plannedResult: 'Updated', message: 'Would be updated.', changes: [{ field: 'timeoutSeconds', before: '300', after: '120' }] }
        ]
      };
    if (collection === 'runs' && parts[2] === 'events') {
      // Same shape as the server: { runId, status, events, lastSequence, hasMore }.
      const after = Number(url.searchParams.get('afterSequence') || 0);
      const source = parts[1] === 'run_0013' ? guardEvents() : EVENTS;
      const events = source.filter((e) => e.sequence > after).map((e) => ({ ...e, runId: parts[1] }));
      return { runId: parts[1], status: 'Succeeded', events, lastSequence: events.length ? events[events.length - 1].sequence : after, hasMore: false };
    }
    if (collection === 'runs' && parts[2] === 'children') return { success: true, maxResults: 100, skip: 0, totalRecords: 1, recordsRemaining: 0, endOfResults: true, timestampUtc: iso(0), objects: [{ ...FACTORIES.runs(4), id: 'run_child', kind: 'Delegated', depth: 1, parentRunId: parts[1], rootRunId: parts[1] }] };
    // run_0003 style IDs map to that factory row; any other ID gets run 7 (a failed run carrying every field).
    if (collection === 'runs' && parts.length === 2 && method === 'GET') return { ...FACTORIES.runs(/^run_\d+$/.test(parts[1]) ? Number(parts[1].slice(4)) : 7), id: parts[1] };
    if (collection === 'agents' && parts[2] === 'invoke') return { ...FACTORIES.runs(1), id: 'run_0001', status: 'Running', outcome: 'None' };
    if (collection === 'agents' && parts[2] === 'card') return AGENT_CARD;
    if ((collection === 'users' || collection === 'credentials') && parts[2] === 'permissions') return PERMISSIONS(collection === 'users' ? 'User' : 'Credential', parts[1]);
    if (collection === 'prompt-templates' && parts[1] === 'render') return { rendered: 'You are echo-agent. Task: hello', missingVariables: [] };
    if (collection === 'prompt-templates' && parts[2] === 'versions') return parts.length === 4 ? FACTORIES['prompt-template-versions'](Number(parts[3]) || 1) : [1, 2].map(FACTORIES['prompt-template-versions']);
    if (collection === 'approvals' && parts.length === 1 && method === 'GET') return approvalList(url);
    if (collection === 'approvals' && parts[2] === 'decide') return decidedApproval(parts[1]);
    // apr_0003 style IDs map to that row; any other ID gets row 3 (decided by a rule, the shape the contract test seeds).
    if (collection === 'approvals' && parts.length === 2) return { ...approval(/^apr_\d+$/.test(parts[1]) ? Number(parts[1].slice(4)) : 3), id: parts[1] };
    if (collection === 'deployments' && parts[2] === 'approval-check') return APPROVAL_CHECK;
    if (parts.length === 1) return method === 'GET' ? enumerate(collection, url) : FACTORIES[collection]?.(99) || {};
    if (parts.length === 2 && FACTORIES[collection]) return FACTORIES[collection](1);
    return {};
  }
  return undefined;
}

/** Install mocks on a Playwright page. */
export async function installMocks(page) {
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => ws.close());
  await page.route(/\/(v1\.0|openapi\.json)/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.endsWith('/events/stream')) {
      const runId = decodeURIComponent(url.pathname.split('/').slice(-3)[0]);
      const body = EVENTS.map((e) => `event: run.event\ndata: ${JSON.stringify({ ...e, runId })}\n\n`).join('') + `event: run.status\ndata: ${JSON.stringify({ status: 'Succeeded' })}\n\n`;
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body });
    }
    const method = req.method();
    if (method === 'DELETE') return route.fulfill({ status: 204, body: '' });
    const body = respond(method, url);
    if (body === undefined) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'RouteNotFound', code: 'RouteNotFound', message: 'Not found' }) });
    if (typeof body === 'string') return route.fulfill({ status: 200, contentType: 'application/yaml', body });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

/**
 * Replace the run event stream with one the test drives (P5.52). Mocked routes can only answer with a whole body,
 * so this patches fetch for /events/stream URLs in the page and returns a live ReadableStream per run. Push frames
 * with `pushRunEvent(page, runId, event)` or `pushRunFrame(page, runId, eventName, data)`. With ignoreAbort, an
 * aborted stream keeps accepting frames, which simulates a late frame from a previous run still in flight.
 */
export async function installControlledStream(page, { ignoreAbort = false } = {}) {
  await page.addInitScript(
    ({ ignoreAbort: keepOpen }) => {
      const streams = {};
      const encoder = new TextEncoder();
      window.__sse = { streams, opened: [] };
      window.__ssePush = (runId, name, data) => {
        const list = streams[runId] || [];
        for (const s of list) {
          if (s.closed) continue;
          try {
            s.controller.enqueue(encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            s.closed = true;
          }
        }
        return list.filter((s) => !s.closed).length;
      };
      const original = window.fetch.bind(window);
      window.fetch = (input, init = {}) => {
        const url = typeof input === 'string' ? input : input.url;
        const m = /\/runs\/([^/]+)\/events\/stream/.exec(url);
        if (!m) return original(input, init);
        const runId = decodeURIComponent(m[1]);
        const entry = { closed: false, controller: null };
        const body = new ReadableStream({
          start(controller) {
            entry.controller = controller;
          }
        });
        if (init.signal && !keepOpen) {
          init.signal.addEventListener('abort', () => {
            entry.closed = true;
            try {
              entry.controller.error(new DOMException('Aborted', 'AbortError'));
            } catch {
              /* already closed */
            }
          });
        }
        (streams[runId] = streams[runId] || []).push(entry);
        window.__sse.opened.push(runId);
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }));
      };
    },
    { ignoreAbort }
  );
}

/** Send one run event over the controlled stream. Returns the number of open streams that received it. */
export function pushRunEvent(page, runId, event) {
  return page.evaluate(({ id, e }) => window.__ssePush(id, 'run.event', e), { id: runId, e: { runId, timestampUtc: new Date().toISOString(), ...event } });
}

/** Send any SSE frame (for example run.completed with the final run) over the controlled stream. */
export function pushRunFrame(page, runId, name, data) {
  return page.evaluate(({ id, n, d }) => window.__ssePush(id, n, d), { id: runId, n: name, d: data });
}

/** A run record shaped like the server's, for controlled-stream tests. */
export function mockRun(id, extra = {}) {
  return { ...FACTORIES.runs(1), id, ...extra };
}
