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

function run(i) {
  const status = RUN_STATUSES[i % RUN_STATUSES.length];
  const terminal = !['Running', 'Queued'].includes(status);
  const queued = status === 'Queued';
  const outcome = status === 'Failed' ? (i % 12 === 7 ? 'NoCapableWorker' : 'HarnessFailed') : status === 'Succeeded' ? 'Succeeded' : status === 'Cancelled' ? 'Cancelled' : 'None';
  const out = record('run', i, {
    tenantId: TENANT,
    agentId: 'agt_0001',
    agentName: 'echo-agent',
    deploymentId: 'dep_0001',
    deploymentVersion: 3,
    harnessType: 'ClaudeCode',
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
    if (status === 'Failed') out.errorMessage = outcome === 'NoCapableWorker' ? 'No Ready worker could run this run within Runtime.FailBlockedAfterSeconds.' : 'Harness reported error_during_execution (is_error).';
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
  secrets: (i) => base('sec', i, { description: 'Secret', kind: 'AnthropicApiKey', valueLast4: 'wxyz', fingerprint: 'ac3ff3db6348426c', keyVersion: 1, rotatedUtc: iso(i * 60) }),
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
      allowedRunOverrides: [{ id: `chr_${id}_0000all`, deploymentId: id, name: 'format', validation: 'Any' }]
    });
  },
  // Node pools and nodes are cluster-wide records: no tenantId.
  'node-pools': (i) => record('np', i, { name: `np-${i}`, description: 'Pool', tenants: [] }),
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
    { path: 'Runtime.FailBlockedAfterSeconds', group: 'Runtime', description: 'Seconds a queued run may wait with no Ready worker able to run it before it fails with outcome NoCapableWorker. 0 waits forever.', type: 'int', value: '0', isSecret: false, isSet: true, source: 'Database', applyMode: 'Live', editable: true, minimum: 0, maximum: 604800 },
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

const EVENTS = [
  // Events Garrison writes carry a machine code (P9.17) so the dashboard can translate them.
  event(1, 'Lifecycle', { text: 'Workspace prepared at /work/run_0001.', code: 'WorkspacePrepared' }),
  event(2, 'AssistantText', { text: 'Hello from the fake harness.', rawEventJson: '{"type":"assistant"}' }),
  event(3, 'ToolCall', { toolName: 'read_file', text: '{"path":"README.md"}' }),
  event(4, 'Usage', { inputTokens: 1201, outputTokens: 341 }),
  event(5, 'Result', { text: 'Done.', rawEventJson: '{"type":"result","is_error":false}' })
];

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
  capabilities: { streaming: true, pushNotifications: false },
  skills: [{ id: 'echo', name: 'Echo', description: 'Echoes input', tags: ['sample'] }],
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  securitySchemes: { bearer: { httpAuthSecurityScheme: { scheme: 'bearer', description: 'Garrison session token or run token.' } } }
};

const SERVER_INFO = {
  product: 'Garrison',
  version: '0.1.0-alpha',
  nodeId: 'garrison-command-0',
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
  dashboards: { overview: 'garrison-overview', http: 'garrison-http', runs: 'garrison-runs', workers: 'garrison-workers', protocols: 'garrison-protocols', integrations: 'garrison-integrations' }
};

/** GET /observability/status: always the four services, in order. Nothing is configured in the default mocks. */
function observabilityStatus() {
  return ['grafana', 'prometheus', 'loki', 'tempo'].map((service) => ({ service, configured: false, reachable: false, checkedUtc: iso(0) }));
}

/** JSON body for a request, or undefined when unhandled. Also used by the contract test (tests/contract/run.mjs). */
export function respond(method, url) {
  const p = url.pathname;
  if (p === '/openapi.json') return OPENAPI;
  if (p === '/v1.0/token' && method === 'POST') return { token: 'tok_e2e', expiresUtc: iso(-60), tenantId: TENANT, sessionId: 'ses_e2e', principalType: 'User' };
  if (p === '/v1.0/token' && method === 'GET') return { valid: true };
  if (p === '/v1.0/token/details') return PRINCIPAL;
  if (p.startsWith('/v1.0/token')) return {};
  if (p === '/v1.0/api/health') return { status: 'healthy', node: 'garrison-command-0', version: '0.1.0-alpha', database: 'ok', schemaVersion: 6, expectedSchemaVersion: 6, backplane: 'PostgresNotify', utc: iso(0) };
  if (p === '/v1.0/api/server-info') return SERVER_INFO;
  if (p === '/v1.0/api/observability/status') return observabilityStatus();
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
      const events = EVENTS.filter((e) => e.sequence > after).map((e) => ({ ...e, runId: parts[1] }));
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
      const body = EVENTS.map((e) => `event: run.event\ndata: ${JSON.stringify(e)}\n\n`).join('') + `event: run.status\ndata: ${JSON.stringify({ status: 'Succeeded' })}\n\n`;
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
