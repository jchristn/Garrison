/**
 * API client for the Garrison control plane.
 *
 * Hand-rolled over the browser fetch API (no axios). Every backend endpoint the dashboard uses is a named method
 * here, so contract changes are fixed in one place. List endpoints return the normalized page shape
 * { items, pageNumber, pageSize, totalCount }. Errors throw ApiError with the parsed error body.
 */

const enc = encodeURIComponent;

class ApiClient {
  /**
   * @param {string} baseUrl Base URL of the server (trailing slash optional).
   * @param {string|null} token Bearer token.
   */
  constructor(baseUrl, token = null) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, '');
    this.token = token;
  }

  _headers(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    try {
      const locale = document.documentElement.lang;
      if (locale) headers['Accept-Language'] = locale;
    } catch {
      /* not in a browser */
    }
    return headers;
  }

  _url(path, query) {
    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
      }
    }
    return url.toString();
  }

  /** Translate { pageNumber, pageSize, ...filters } into { maxResults, skip, ...filters }. */
  _enumParams(params = {}) {
    const { pageNumber, pageSize, ...rest } = params || {};
    const out = { ...rest };
    if (pageSize != null) {
      out.maxResults = pageSize;
      out.skip = ((pageNumber || 1) - 1) * pageSize;
    }
    return out;
  }

  /** Normalize an EnumerationResult into the table page shape. */
  _normalizeEnum(result, requestedPageNumber, requestedPageSize) {
    return normalizeEnumeration(result, requestedPageNumber, requestedPageSize);
  }

  async _request(method, path, { query = null, body = null, headers = {}, raw = false } = {}) {
    const init = { method, headers: this._headers(headers) };
    if (body !== null && body !== undefined) init.body = raw ? body : JSON.stringify(body);

    let response;
    try {
      response = await fetch(this._url(path, query), init);
    } catch (e) {
      throw new ApiError(0, { code: 'NetworkError', message: e?.message || 'Network error' });
    }

    if (response.status === 401 && !path.startsWith('/v1.0/token')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const text = await response.text().catch(() => '');
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) throw new ApiError(response.status, parsed ?? response.statusText);
    if (response.status === 204) return null;
    return parsed;
  }

  async _list(path, params = {}) {
    const res = await this._request('GET', path, { query: this._enumParams(params) });
    return this._normalizeEnum(res, params.pageNumber, params.pageSize);
  }

  /**
   * Audit and request history page by pageNumber and pageSize (not maxResults and skip) and answer
   * { pageNumber, pageSize, totalCount, totalPages, objects }.
   */
  async _pagedList(path, params = {}) {
    const res = await this._request('GET', path, { query: params });
    return this._normalizeEnum(res, params.pageNumber, params.pageSize);
  }

  _t(tenantId, sub) {
    return `/v1.0/api/tenants/${enc(tenantId)}/${sub}`;
  }

  // ------------------------------------------------------------------ auth and health

  /** Anonymous health probe. */
  healthCheck() {
    return this._request('GET', '/v1.0/api/health');
  }

  /** Validate the bearer token. */
  validateToken() {
    return this._request('GET', '/v1.0/token');
  }

  /** Describe the authenticated principal. */
  getTokenDetails() {
    return this._request('GET', '/v1.0/token/details');
  }

  /** Log in with tenant, email, and password. */
  loginWithPassword(tenantId, email, password) {
    return this._request('POST', '/v1.0/token', { body: { tenantId: tenantId || undefined, email, password } });
  }

  /** Log in with an access key and secret key. */
  loginWithKey(accessKey, secretKey) {
    return this._request('POST', '/v1.0/token', { body: { accessKey, secretKey } });
  }

  /** Refresh the session token. */
  refreshToken() {
    return this._request('POST', '/v1.0/token/refresh');
  }

  /** Revoke the session token (logout). */
  revokeToken() {
    return this._request('DELETE', '/v1.0/token');
  }

  // ------------------------------------------------------------------ server, settings, overview

  getServerInfo() {
    return this._request('GET', '/v1.0/api/server-info');
  }

  /** Reachability of the configured observability services, probed by the server and cached for 30 seconds. */
  getObservabilityStatus() {
    return this._request('GET', '/v1.0/api/observability/status');
  }

  getSettings() {
    return this._request('GET', '/v1.0/api/settings');
  }

  updateSettings(body) {
    return this._request('PUT', '/v1.0/api/settings', { body });
  }

  restartServer() {
    return this._request('POST', '/v1.0/api/settings/restart');
  }

  testDatabaseConnection(body) {
    return this._request('POST', '/v1.0/api/settings/database/test', { body });
  }

  getOverview(tenantId) {
    return this._request('GET', this._t(tenantId, 'overview'));
  }

  getQueueSummary(tenantId) {
    return this._request('GET', this._t(tenantId, 'queue/summary'));
  }

  /**
   * Run analytics over time (plan section 10.6). query: { from, to, interval, agentId, harnessType,
   * deploymentId, groupBy }. Returns { fromUtc, toUtc, interval, bucketSeconds, truncated, totals, series }.
   */
  getRunAnalytics(tenantId, query = {}) {
    return this._request('GET', this._t(tenantId, 'analytics/runs'), { query });
  }

  /** Distinct agents, harnesses, deployments, and served models seen in a range. query: { from, to }. */
  getRunAnalyticsDimensions(tenantId, query = {}) {
    return this._request('GET', this._t(tenantId, 'analytics/runs/dimensions'), { query });
  }

  // ------------------------------------------------------------------ tenants

  listTenants(params) {
    return this._list('/v1.0/api/tenants', params);
  }

  getTenant(id) {
    return this._request('GET', `/v1.0/api/tenants/${enc(id)}`);
  }

  createTenant(body) {
    return this._request('POST', '/v1.0/api/tenants', { body });
  }

  updateTenant(id, body) {
    return this._request('PUT', `/v1.0/api/tenants/${enc(id)}`, { body });
  }

  deleteTenant(id) {
    return this._request('DELETE', `/v1.0/api/tenants/${enc(id)}`);
  }

  // ------------------------------------------------------------------ users and credentials

  listUsers(tenantId, params) {
    return this._list(this._t(tenantId, 'users'), params);
  }

  getUser(tenantId, id) {
    return this._request('GET', this._t(tenantId, `users/${enc(id)}`));
  }

  createUser(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'users'), { body });
  }

  updateUser(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `users/${enc(id)}`), { body });
  }

  deleteUser(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `users/${enc(id)}`));
  }

  getUserPermissions(tenantId, id) {
    return this._request('GET', this._t(tenantId, `users/${enc(id)}/permissions`));
  }

  listCredentials(tenantId, params) {
    return this._list(this._t(tenantId, 'credentials'), params);
  }

  getCredential(tenantId, id) {
    return this._request('GET', this._t(tenantId, `credentials/${enc(id)}`));
  }

  /** Create a credential. The response includes secretKey exactly once. */
  createCredential(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'credentials'), { body });
  }

  updateCredential(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `credentials/${enc(id)}`), { body });
  }

  deleteCredential(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `credentials/${enc(id)}`));
  }

  /** Rotate a credential secret. The response includes the new secretKey exactly once. */
  rotateCredential(tenantId, id) {
    return this._request('POST', this._t(tenantId, `credentials/${enc(id)}/rotate`));
  }

  getCredentialPermissions(tenantId, id) {
    return this._request('GET', this._t(tenantId, `credentials/${enc(id)}/permissions`));
  }

  // ------------------------------------------------------------------ RBAC

  listRoles(tenantId, params) {
    return this._list(this._t(tenantId, 'roles'), params);
  }

  getRole(tenantId, id) {
    return this._request('GET', this._t(tenantId, `roles/${enc(id)}`));
  }

  createRole(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'roles'), { body });
  }

  updateRole(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `roles/${enc(id)}`), { body });
  }

  deleteRole(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `roles/${enc(id)}`));
  }

  cloneRole(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `roles/${enc(id)}/clone`), { body });
  }

  listPermissions(tenantId, params) {
    return this._list(this._t(tenantId, 'permissions'), params);
  }

  createPermission(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'permissions'), { body });
  }

  updatePermission(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `permissions/${enc(id)}`), { body });
  }

  deletePermission(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `permissions/${enc(id)}`));
  }

  listRolePermissions(tenantId, params) {
    return this._list(this._t(tenantId, 'role-permissions'), params);
  }

  createRolePermission(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'role-permissions'), { body });
  }

  deleteRolePermission(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `role-permissions/${enc(id)}`));
  }

  listUserRoleAssignments(tenantId, params) {
    return this._list(this._t(tenantId, 'user-role-assignments'), params);
  }

  createUserRoleAssignment(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'user-role-assignments'), { body });
  }

  updateUserRoleAssignment(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `user-role-assignments/${enc(id)}`), { body });
  }

  deleteUserRoleAssignment(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `user-role-assignments/${enc(id)}`));
  }

  listCredentialScopeAssignments(tenantId, params) {
    return this._list(this._t(tenantId, 'credential-scope-assignments'), params);
  }

  createCredentialScopeAssignment(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'credential-scope-assignments'), { body });
  }

  updateCredentialScopeAssignment(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `credential-scope-assignments/${enc(id)}`), { body });
  }

  deleteCredentialScopeAssignment(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `credential-scope-assignments/${enc(id)}`));
  }

  // ------------------------------------------------------------------ audit

  listAudit(tenantId, params) {
    return this._pagedList(this._t(tenantId, 'audit'), params);
  }

  getAuditRecord(tenantId, id) {
    return this._request('GET', this._t(tenantId, `audit/${enc(id)}`));
  }

  deleteAuditRecord(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `audit/${enc(id)}`));
  }

  deleteAuditBulk(tenantId, filters) {
    return this._request('DELETE', this._t(tenantId, 'audit'), { query: filters });
  }

  // ------------------------------------------------------------------ request history

  getRequestHistory(filters = {}) {
    return this._pagedList('/v1.0/api/request-history', filters);
  }

  getRequestHistorySummary(filters = {}) {
    return this._request('GET', '/v1.0/api/request-history/summary', { query: filters });
  }

  getRequestHistoryEntry(id) {
    return this._request('GET', `/v1.0/api/request-history/${enc(id)}`);
  }

  deleteRequestHistoryEntry(id) {
    return this._request('DELETE', `/v1.0/api/request-history/${enc(id)}`);
  }

  deleteRequestHistoryBulk(filters = {}) {
    return this._request('DELETE', '/v1.0/api/request-history', { query: filters });
  }

  // ------------------------------------------------------------------ harness profiles

  listHarnessProfiles(tenantId, params) {
    return this._list(this._t(tenantId, 'harness-profiles'), params);
  }

  listBuiltInHarnessProfiles() {
    return this._request('GET', '/v1.0/api/harness-profiles/builtin');
  }

  getHarnessProfile(tenantId, id) {
    return this._request('GET', this._t(tenantId, `harness-profiles/${enc(id)}`));
  }

  createHarnessProfile(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'harness-profiles'), { body });
  }

  updateHarnessProfile(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `harness-profiles/${enc(id)}`), { body });
  }

  deleteHarnessProfile(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `harness-profiles/${enc(id)}`));
  }

  cloneHarnessProfile(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `harness-profiles/${enc(id)}/clone`), { body });
  }

  // ------------------------------------------------------------------ prompt templates

  listPromptTemplates(tenantId, params) {
    return this._list(this._t(tenantId, 'prompt-templates'), params);
  }

  getPromptTemplate(tenantId, id) {
    return this._request('GET', this._t(tenantId, `prompt-templates/${enc(id)}`));
  }

  createPromptTemplate(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'prompt-templates'), { body });
  }

  /** Update a template. The server stores a new immutable version. */
  updatePromptTemplate(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `prompt-templates/${enc(id)}`), { body });
  }

  deletePromptTemplate(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `prompt-templates/${enc(id)}`));
  }

  clonePromptTemplate(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `prompt-templates/${enc(id)}/clone`), { body });
  }

  resetPromptTemplate(tenantId, id) {
    return this._request('POST', this._t(tenantId, `prompt-templates/${enc(id)}/reset`));
  }

  listPromptTemplateVersions(tenantId, id) {
    return this._request('GET', this._t(tenantId, `prompt-templates/${enc(id)}/versions`));
  }

  getPromptTemplateVersion(tenantId, id, version) {
    return this._request('GET', this._t(tenantId, `prompt-templates/${enc(id)}/versions/${enc(version)}`));
  }

  restorePromptTemplateVersion(tenantId, id, version) {
    return this._request('POST', this._t(tenantId, `prompt-templates/${enc(id)}/restore/${enc(version)}`));
  }

  /** Render a stored template with a sample context. Returns rendered text and variable usage. */
  renderPromptTemplate(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `prompt-templates/${enc(id)}/render`), { body });
  }

  /** Render ad hoc template content (used by the editor preview). */
  renderTemplateContent(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'prompt-templates/render'), { body });
  }

  // ------------------------------------------------------------------ MCP servers, secrets, workspaces, artifact stores

  listMcpServers(tenantId, params) {
    return this._list(this._t(tenantId, 'mcp-servers'), params);
  }

  createMcpServer(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'mcp-servers'), { body });
  }

  updateMcpServer(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `mcp-servers/${enc(id)}`), { body });
  }

  deleteMcpServer(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `mcp-servers/${enc(id)}`));
  }

  testMcpServer(tenantId, id) {
    return this._request('POST', this._t(tenantId, `mcp-servers/${enc(id)}/test`));
  }

  listSecrets(tenantId, params) {
    return this._list(this._t(tenantId, 'secrets'), params);
  }

  createSecret(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'secrets'), { body });
  }

  updateSecret(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `secrets/${enc(id)}`), { body });
  }

  deleteSecret(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `secrets/${enc(id)}`));
  }

  /** Set a secret value (write-only). */
  setSecretValue(tenantId, id, value) {
    return this._request('PUT', this._t(tenantId, `secrets/${enc(id)}/value`), { body: { value } });
  }

  rotateSecret(tenantId, id, value) {
    return this._request('POST', this._t(tenantId, `secrets/${enc(id)}/rotate`), { body: { value } });
  }

  listWorkspaceTemplates(tenantId, params) {
    return this._list(this._t(tenantId, 'workspace-templates'), params);
  }

  createWorkspaceTemplate(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'workspace-templates'), { body });
  }

  updateWorkspaceTemplate(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `workspace-templates/${enc(id)}`), { body });
  }

  deleteWorkspaceTemplate(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `workspace-templates/${enc(id)}`));
  }

  listArtifactStores(tenantId, params) {
    return this._list(this._t(tenantId, 'artifact-stores'), params);
  }

  createArtifactStore(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'artifact-stores'), { body });
  }

  updateArtifactStore(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `artifact-stores/${enc(id)}`), { body });
  }

  deleteArtifactStore(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `artifact-stores/${enc(id)}`));
  }

  // ------------------------------------------------------------------ agents and deployments

  listAgents(tenantId, params) {
    return this._list(this._t(tenantId, 'agents'), params);
  }

  getAgent(tenantId, id) {
    return this._request('GET', this._t(tenantId, `agents/${enc(id)}`));
  }

  createAgent(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'agents'), { body });
  }

  updateAgent(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `agents/${enc(id)}`), { body });
  }

  deleteAgent(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `agents/${enc(id)}`));
  }

  /** Invoke an agent. options: { wait, waitSeconds }. Returns the run. */
  invokeAgent(tenantId, id, body, { wait = false, waitSeconds } = {}) {
    return this._request('POST', this._t(tenantId, `agents/${enc(id)}/invoke`), {
      body,
      // Always explicit: the server waits for the run by default, which would hold the Invoke page until the run ends.
      query: { wait: wait ? 'true' : 'false', waitSeconds }
    });
  }

  getAgentCard(tenantId, id) {
    return this._request('GET', this._t(tenantId, `agents/${enc(id)}/card`));
  }

  registerAgent(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'agents/register'), { body });
  }

  listDeployments(tenantId, params) {
    return this._list(this._t(tenantId, 'deployments'), params);
  }

  getDeployment(tenantId, id) {
    return this._request('GET', this._t(tenantId, `deployments/${enc(id)}`));
  }

  createDeployment(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'deployments'), { body });
  }

  updateDeployment(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `deployments/${enc(id)}`), { body });
  }

  deleteDeployment(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `deployments/${enc(id)}`));
  }

  /** Compile a deployment with sample input; secrets are redacted by the server. */
  compileDeploymentPreview(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `deployments/${enc(id)}/compile-preview`), { body });
  }

  testDeployment(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `deployments/${enc(id)}/test`), { body });
  }

  // ------------------------------------------------------------------ manifests

  /** Apply a multi-document YAML or JSON manifest. */
  applyManifest(tenantId, text, dryRun = false) {
    const trimmed = (text || '').trim();
    const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');
    return this._request('POST', this._t(tenantId, 'manifests/apply'), {
      body: text,
      raw: true,
      headers: { 'Content-Type': isJson ? 'application/json' : 'application/yaml' },
      query: { dryRun: dryRun ? 'true' : undefined }
    });
  }

  exportManifests(tenantId) {
    return this._request('POST', this._t(tenantId, 'manifests/export'));
  }

  listManifestApplies(tenantId, params) {
    return this._list(this._t(tenantId, 'manifests/applies'), params);
  }

  getManifestApply(tenantId, id) {
    return this._request('GET', this._t(tenantId, `manifests/applies/${enc(id)}`));
  }

  // ------------------------------------------------------------------ runs

  /** filters: status, agentId, deploymentId, harnessType, nodeId, fromUtc, toUtc, pageNumber, pageSize. */
  listRuns(tenantId, params) {
    return this._list(this._t(tenantId, 'runs'), params);
  }

  getRun(tenantId, id) {
    return this._request('GET', this._t(tenantId, `runs/${enc(id)}`));
  }

  createRun(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'runs'), { body });
  }

  cancelRun(tenantId, id) {
    return this._request('POST', this._t(tenantId, `runs/${enc(id)}/cancel`));
  }

  retryRun(tenantId, id) {
    return this._request('POST', this._t(tenantId, `runs/${enc(id)}/retry`));
  }

  deleteRun(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `runs/${enc(id)}`));
  }

  /**
   * Run events after a sequence number. The server answers { runId, status, events, lastSequence, hasMore };
   * the result is { items, lastSequence, hasMore }.
   */
  async listRunEvents(tenantId, id, afterSequence = 0, limit = 500) {
    const res = await this._request('GET', this._t(tenantId, `runs/${enc(id)}/events`), { query: { afterSequence, limit } });
    const items = Array.isArray(res?.events) ? res.events : Array.isArray(res?.objects) ? res.objects : [];
    return { items, lastSequence: res?.lastSequence ?? null, hasMore: Boolean(res?.hasMore) };
  }

  listRunChildren(tenantId, id) {
    return this._list(this._t(tenantId, `runs/${enc(id)}/children`), {});
  }

  /**
   * Stream run events over SSE using fetch (EventSource cannot send the bearer header). Calls onEvent for each
   * parsed data payload. Returns an AbortController; abort() stops the stream.
   */
  streamRunEvents(tenantId, id, afterSequence, onEvent, onEnd) {
    const controller = new AbortController();
    const url = this._url(this._t(tenantId, `runs/${enc(id)}/events/stream`), { afterSequence });
    const headers = this._headers({ Accept: 'text/event-stream' });
    delete headers['Content-Type'];
    fetch(url, { headers, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok || !response.body) throw new ApiError(response.status, response.statusText);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';
          for (const frame of frames) {
            const data = parseSseFrame(frame);
            if (data !== null) onEvent?.(data);
          }
        }
        onEnd?.(null);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') onEnd?.(e);
      });
    return controller;
  }

  // ------------------------------------------------------------------ nodes

  listNodes(params) {
    return this._list('/v1.0/api/nodes', params);
  }

  getNode(id) {
    return this._request('GET', `/v1.0/api/nodes/${enc(id)}`);
  }

  cordonNode(id) {
    return this._request('POST', `/v1.0/api/nodes/${enc(id)}/cordon`);
  }

  uncordonNode(id) {
    return this._request('POST', `/v1.0/api/nodes/${enc(id)}/uncordon`);
  }

  drainNode(id) {
    return this._request('POST', `/v1.0/api/nodes/${enc(id)}/drain`);
  }

  deleteNode(id) {
    return this._request('DELETE', `/v1.0/api/nodes/${enc(id)}`);
  }

  /**
   * Control-plane replicas (GET /control-nodes). The normalized page also carries `respondingNodeId`, the replica
   * that answered, so a page can say which replica served it.
   */
  async listControlNodes(params) {
    const res = await this._request('GET', '/v1.0/api/control-nodes', { query: this._enumParams(params) });
    return { ...this._normalizeEnum(res, params?.pageNumber, params?.pageSize), respondingNodeId: res?.respondingNodeId || null };
  }

  /** One control-plane replica, with `respondingNodeId`. */
  getControlNode(id) {
    return this._request('GET', `/v1.0/api/control-nodes/${enc(id)}`);
  }

  listNodePools(params) {
    return this._list('/v1.0/api/node-pools', params);
  }

  createNodePool(body) {
    return this._request('POST', '/v1.0/api/node-pools', { body });
  }

  updateNodePool(id, body) {
    return this._request('PUT', `/v1.0/api/node-pools/${enc(id)}`, { body });
  }

  deleteNodePool(id) {
    return this._request('DELETE', `/v1.0/api/node-pools/${enc(id)}`);
  }

  // ------------------------------------------------------------------ OpenAPI and API Explorer

  getOpenApiSpec() {
    return this._request('GET', '/openapi.json');
  }

  /** Execute a request built by the API Explorer. Returns the raw Response for streaming access. */
  executeExplorer({ method, path, query, headers, body, signal }) {
    const finalHeaders = this._headers(headers || {});
    const hasBody = body !== null && body !== undefined && body !== '';
    if (!hasBody) delete finalHeaders['Content-Type'];
    return fetch(this._url(path, query), { method, headers: finalHeaders, body: hasBody ? body : undefined, signal });
  }

  /** WebSocket URL for live updates (token passed as a query parameter). */
  webSocketUrl() {
    const base = this.baseUrl.replace(/^http/, 'ws');
    return `${base}/v1.0/ws${this.token ? `?token=${enc(this.token)}` : ''}`;
  }
}

/** Parse one SSE frame; returns the parsed JSON (or raw text) of its data lines, or null. */
export function parseSseFrame(frame) {
  const lines = String(frame || '').split('\n');
  const data = lines.filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, ''));
  if (data.length === 0) return null;
  const text = data.join('\n');
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Normalize an EnumerationResult ({ objects, totalRecords, maxResults, skip }), a page result ({ objects, pageNumber,
 * pageSize, totalCount }), or a bare array into { items, pageNumber, pageSize, totalCount }.
 */
export function normalizeEnumeration(result, requestedPageNumber, requestedPageSize) {
  const objects = Array.isArray(result?.objects) ? result.objects : Array.isArray(result) ? result : [];
  if (result && !Array.isArray(result) && result.totalCount !== undefined && result.pageNumber !== undefined) {
    const pageSize = result.pageSize ?? requestedPageSize ?? (objects.length || 25);
    return {
      items: objects,
      pageNumber: result.pageNumber,
      pageSize,
      totalCount: result.totalCount,
      endOfResults: result.pageNumber >= (result.totalPages ?? Math.ceil(result.totalCount / pageSize))
    };
  }
  const total = result?.totalRecords ?? objects.length;
  const size = result?.maxResults ?? requestedPageSize ?? (objects.length || 25);
  const skip = result?.skip ?? 0;
  const pageNumber = size > 0 ? Math.floor(skip / size) + 1 : requestedPageNumber || 1;
  return {
    items: objects,
    pageNumber,
    pageSize: size,
    totalCount: total,
    endOfResults: result?.endOfResults ?? true
  };
}

/** Normalized API error: status, stable code, message, request ID, and field errors. */
export class ApiError extends Error {
  constructor(status, body) {
    const obj = body && typeof body === 'object' ? body : null;
    const message = obj?.message || (typeof body === 'string' && body) || `HTTP ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = obj?.code || (status === 0 ? 'NetworkError' : `Http${status}`);
    this.requestId = obj?.requestId || null;
    // Field errors: `fields` (most routes) or `errors` (settings, keyed by setting path). Both are { key: message }.
    this.fields = obj?.fields || (obj?.errors && typeof obj.errors === 'object' && !Array.isArray(obj.errors) ? obj.errors : null);
    // Machine codes per field (OutOfRange, NotAnInteger, ...), same keys as fields, for translation.
    this.fieldCodes = obj?.fieldCodes && typeof obj.fieldCodes === 'object' ? obj.fieldCodes : null;
    this.requiredPermission = obj?.requiredPermission || null;
    this.resourceType = obj?.resourceType || null;
    this.body = body;
  }
}

export default ApiClient;
