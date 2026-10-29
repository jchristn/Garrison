/**
 * API client for the Garrison control plane.
 *
 * Hand-rolled over the browser fetch API (no axios). Every backend endpoint the dashboard uses is a named method
 * here, so contract changes are fixed in one place. List endpoints return the normalized page shape
 * { items, pageNumber, pageSize, totalCount }. Errors throw ApiError with the parsed error body.
 */

import { manifestExportQuery } from './manifestBundles';
import { transcriptQuery } from './transcripts';

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

  async _request(method, path, { query = null, body = null, headers = {}, raw = false, text: asText = false, withStatus = false } = {}) {
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
    if (asText && response.ok) return text;
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) throw new ApiError(response.status, parsed ?? response.statusText);
    if (withStatus) return { status: response.status, body: response.status === 204 ? null : parsed };
    if (response.status === 204) return null;
    return parsed;
  }

  /** GET that answers raw bytes as a Blob; a failed request throws ApiError with the parsed error body. */
  async _blob(path, query) {
    const headers = this._headers();
    delete headers['Content-Type'];
    let response;
    try {
      response = await fetch(this._url(path, query), { method: 'GET', headers });
    } catch (e) {
      throw new ApiError(0, { code: 'NetworkError', message: e?.message || 'Network error' });
    }
    if (response.status === 401) window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let parsed = text || response.statusText;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* not JSON */
      }
      throw new ApiError(response.status, parsed);
    }
    return response.blob();
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

  testMcpServer(tenantId, id, nodeId) {
    return this._request('POST', this._t(tenantId, `mcp-servers/${enc(id)}/test`), { query: { nodeId } });
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

  listArtifacts(tenantId, params) {
    return this._list(this._t(tenantId, 'artifacts'), params);
  }

  getArtifactDownloadUrl(tenantId, id) {
    return this._request('POST', this._t(tenantId, `artifacts/${enc(id)}/download-url`));
  }

  deleteArtifact(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `artifacts/${enc(id)}`));
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

  listModelPrices(tenantId, params) {
    return this._list(this._t(tenantId, 'model-prices'), params);
  }

  getModelPrice(tenantId, id) {
    return this._request('GET', this._t(tenantId, `model-prices/${enc(id)}`));
  }

  createModelPrice(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'model-prices'), { body });
  }

  updateModelPrice(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `model-prices/${enc(id)}`), { body });
  }

  deleteModelPrice(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `model-prices/${enc(id)}`));
  }

  listUsageQuotas(tenantId, params) {
    return this._list(this._t(tenantId, 'usage-quotas'), params);
  }

  getUsageQuota(tenantId, id) {
    return this._request('GET', this._t(tenantId, `usage-quotas/${enc(id)}`));
  }

  getUsageQuotaUsage(tenantId, id) {
    return this._request('GET', this._t(tenantId, `usage-quotas/${enc(id)}/usage`));
  }

  createUsageQuota(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'usage-quotas'), { body });
  }

  updateUsageQuota(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `usage-quotas/${enc(id)}`), { body });
  }

  deleteUsageQuota(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `usage-quotas/${enc(id)}`));
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

  /**
   * Invoke an agent. options: { wait, waitSeconds }. Returns the run. The body may carry `startConversation: true`
   * (the run is the first turn of a new conversation; the run's conversationId names it) or `conversationId` (the run
   * is the next turn of that conversation). 409 ConversationBusy when the previous turn has not finished.
   */
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

  // ------------------------------------------------------------------ agent revisions (AD1)

  /** An agent's revisions, newest first. Each is Draft or Published; at most one draft is open at a time. */
  listAgentRevisions(tenantId, agentId, params = { pageNumber: 1, pageSize: 1000 }) {
    return this._list(this._t(tenantId, `agents/${enc(agentId)}/revisions`), params);
  }

  /** One revision by identifier or number. */
  getAgentRevision(tenantId, agentId, revisionId) {
    return this._request('GET', this._t(tenantId, `agents/${enc(agentId)}/revisions/${enc(revisionId)}`));
  }

  /** Create the agent's draft revision, or replace the content of its open draft (201). */
  saveAgentDraft(tenantId, agentId, body) {
    return this._request('POST', this._t(tenantId, `agents/${enc(agentId)}/revisions`), { body });
  }

  /** Discard the open draft (204). 409 RevisionPublished for a published revision. */
  discardAgentRevision(tenantId, agentId, revisionId) {
    return this._request('DELETE', this._t(tenantId, `agents/${enc(agentId)}/revisions/${enc(revisionId)}`));
  }

  /**
   * Publish a draft. body: { changeNote? }. 409 RevisionUnchanged when it equals the latest published revision,
   * 409 RevisionPublished when it is already published.
   */
  publishAgentRevision(tenantId, agentId, revisionId, body = {}) {
    return this._request('POST', this._t(tenantId, `agents/${enc(agentId)}/revisions/${enc(revisionId)}/publish`), { body });
  }

  /** Field-level diff between two revisions (identifiers or numbers): { identical, changes: [{ field, changeType, from, to }] }. */
  diffAgentRevisions(tenantId, agentId, from, to) {
    return this._request('GET', this._t(tenantId, `agents/${enc(agentId)}/revisions/diff`), { query: { from, to } });
  }

  // ------------------------------------------------------------------ agent assets (AD2)

  /** Agent assets. params: { kind, search, pageNumber, pageSize }. */
  listAgentAssets(tenantId, params) {
    return this._list(this._t(tenantId, 'agent-assets'), params);
  }

  /** One asset by identifier or name. */
  getAgentAsset(tenantId, id) {
    return this._request('GET', this._t(tenantId, `agent-assets/${enc(id)}`));
  }

  /** Create an asset. 400 AssetTemplateRequired when a SystemPrompt asset has no prompt template (or another kind has one). */
  createAgentAsset(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'agent-assets'), { body });
  }

  /** Update an asset. 409 AssetKindImmutable or AssetStoreImmutable when the kind or the artifact store changes. */
  updateAgentAsset(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `agent-assets/${enc(id)}`), { body });
  }

  /** Delete an asset and its versions (204). 409 AssetInUse while an agent revision pins it; the message names the agents. */
  deleteAgentAsset(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `agent-assets/${enc(id)}`));
  }

  /** An asset's versions, newest first (a plain array). */
  listAgentAssetVersions(tenantId, id) {
    return this._request('GET', this._t(tenantId, `agent-assets/${enc(id)}/versions`));
  }

  /** One version with its files. */
  getAgentAssetVersion(tenantId, id, number) {
    return this._request('GET', this._t(tenantId, `agent-assets/${enc(id)}/versions/${enc(number)}`));
  }

  /**
   * Upload a new version. body: { changeNote?, files: [{ path, mediaType?, contentBase64 }] }. Returns
   * { created, version }: created is true for 201 (a new version) and false for 200 (the files equal the current
   * version, which is returned). 413 AssetFileTooLarge, AssetVersionTooLarge, AssetTooManyFiles; 400 with field codes
   * InvalidAssetPath and MacroFormatRefused, or AssetHasNoFiles for SystemPrompt assets.
   */
  async uploadAgentAssetVersion(tenantId, id, body) {
    const res = await this._request('POST', this._t(tenantId, `agent-assets/${enc(id)}/versions`), { body, withStatus: true });
    return { created: res.status === 201, version: res.body };
  }

  /** One file of a version as a Blob (download, or a read-only preview of text files). */
  getAgentAssetFile(tenantId, id, number, path) {
    return this._blob(this._t(tenantId, `agent-assets/${enc(id)}/versions/${enc(number)}/files`), { path });
  }

  // ------------------------------------------------------------------ capability catalog (AD4)

  /**
   * The capability catalog: agents, MCP tools, and harness built-ins. params: { kind, tag, search }. The server
   * answers the whole filtered catalog in one EnumerationResult (no paging); the result is { items, totalCount }.
   */
  async listCapabilities(tenantId, params = {}) {
    const query = {};
    for (const key of ['kind', 'tag', 'search']) if (params[key]) query[key] = params[key];
    const res = await this._request('GET', this._t(tenantId, 'capabilities'), { query });
    const items = Array.isArray(res?.objects) ? res.objects : Array.isArray(res) ? res : [];
    return { items, totalCount: res?.totalRecords ?? items.length };
  }

  /** One descriptor by identifier or name. */
  getCapability(tenantId, idOrName) {
    return this._request('GET', this._t(tenantId, `capabilities/${enc(idOrName)}`));
  }

  /** Create a manual descriptor (201). 400 InvalidJsonSchema on a schema field, 409 NameConflict for a taken name. */
  createCapability(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'capabilities'), { body });
  }

  /** Replace a manual descriptor. 409 CapabilityDerived for a derived one, NameConflict for a taken name. */
  updateCapability(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `capabilities/${enc(id)}`), { body });
  }

  /** Delete a manual descriptor (204). 409 CapabilityDerived for a derived one. */
  deleteCapability(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `capabilities/${enc(id)}`));
  }

  /**
   * Refresh derived descriptors now: agents, harness built-ins, MCP server tools (stdio servers through a worker), and
   * hints. With mcpServerId, only that server is listed. Returns { agents, harnessBuiltIns, hints, mcpServers: [{
   * mcpServerId, mcpServerName, tools, removed, warned, error }] }.
   */
  refreshCapabilities(tenantId, mcpServerId) {
    return this._request('POST', this._t(tenantId, 'capabilities/refresh'), { query: mcpServerId ? { mcpServerId } : null });
  }

  // ------------------------------------------------------------------ conversation file spaces (AD3)

  /**
   * The conversation's shared files: { fileSpaceId, fileCount, totalBytes, files: [ConversationFile] }. fileSpaceId is
   * null until the first turn or upload creates the space. includeDeleted lists soft-deleted files too.
   */
  listConversationFiles(tenantId, id, includeDeleted = false) {
    return this._request('GET', this._t(tenantId, `conversations/${enc(id)}/files`), { query: { includeDeleted: includeDeleted ? 'true' : 'false' } });
  }

  /** One file's bytes as a Blob: the current version, or `version` when given. */
  getConversationFileContent(tenantId, id, path, version) {
    return this._blob(this._t(tenantId, `conversations/${enc(id)}/files/content`), { path, version });
  }

  /** A file's versions, newest first (a plain array of ConversationFileVersion). */
  listConversationFileVersions(tenantId, id, path) {
    return this._request('GET', this._t(tenantId, `conversations/${enc(id)}/files/versions`), { query: { path } });
  }

  /**
   * Write a file. body: { path, content | contentBase64, mediaType?, baseVersion? }. Answers 201
   * { requestedPath, path, version, conflict, sha256 }; with a stale baseVersion, conflict is true and path is the
   * conflict name the upload was kept under. 400 InvalidFilePath (field code on path); 413 FileTooLarge,
   * FileSpaceFull, TooManyFiles naming the FileSpaces setting.
   */
  uploadConversationFile(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `conversations/${enc(id)}/files`), { body });
  }

  /** Soft-delete a file (204). Its versions are kept. */
  deleteConversationFile(tenantId, id, path) {
    return this._request('DELETE', this._t(tenantId, `conversations/${enc(id)}/files`), { query: { path } });
  }

  /** A link that opens one file version without credentials until it expires: { url, expiresUtc }. */
  conversationFileDownloadUrl(tenantId, id, path, version) {
    return this._request('POST', this._t(tenantId, `conversations/${enc(id)}/files/download-url`), { query: { path, version } });
  }

  // ------------------------------------------------------------------ environments and promotions (AD1)

  /** The tenant's ordered environment list: { environments: [{ name, description, position }], isDefault }. */
  getEnvironments(tenantId) {
    return this._request('GET', this._t(tenantId, 'environments'));
  }

  /** Replace the tenant's environment list. 409 EnvironmentInUse when a removed environment still has deployments. */
  updateEnvironments(tenantId, body) {
    return this._request('PUT', this._t(tenantId, 'environments'), { body });
  }

  /** Promotion and rollback records, newest first. params: { agentId, pageNumber, pageSize }. */
  listPromotions(tenantId, params = { pageNumber: 1, pageSize: 100 }) {
    return this._list(this._t(tenantId, 'promotions'), params);
  }

  getPromotion(tenantId, id) {
    return this._request('GET', this._t(tenantId, `promotions/${enc(id)}`));
  }

  /**
   * Promote a revision to the next environment. body: { agentId, sourceEnvironment, targetEnvironment?,
   * agentRevisionId?, allowSkip?, note? }. 409 PromotionOrderViolation when the target is not the next environment
   * and allowSkip is off; 403 without Execute on Promotion for the target.
   */
  promote(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'promotions'), { body });
  }

  /** Roll a promotion back, restoring the exact previous pins. body: { note? }. 409 AlreadyRolledBack. */
  rollbackPromotion(tenantId, id, body = {}) {
    return this._request('POST', this._t(tenantId, `promotions/${enc(id)}/rollback`), { body });
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

  /**
   * Evaluate a deployment's saved approval rules for a sample tool call without recording anything (P12.3).
   * body: { toolName, input?: { command, cwd, url, file_path, notebook_path, path, paths, pattern, query } }.
   * Returns { action, source, ruleId, rulePattern, suggestedRule, approvalsEnabled }.
   */
  checkApproval(tenantId, deploymentId, body) {
    return this._request('POST', this._t(tenantId, `deployments/${enc(deploymentId)}/approval-check`), { body });
  }

  // ------------------------------------------------------------------ approvals (P12.3)

  /** filters: status, runId, rootRunId, agentId, deploymentId, decisionSource, fromUtc, toUtc, pageNumber, pageSize. */
  listApprovals(tenantId, params) {
    return this._list(this._t(tenantId, 'approvals'), params);
  }

  getApproval(tenantId, id) {
    return this._request('GET', this._t(tenantId, `approvals/${enc(id)}`));
  }

  /**
   * Decide a pending approval. body: { decision: 'Allow'|'Deny', reason?, remember?, rulePattern? }. Throws 409
   * ApprovalNotPending when it was already decided, and 403 when remember needs Deployment Update the caller lacks.
   */
  decideApproval(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `approvals/${enc(id)}/decide`), { body });
  }

  /** Number of approvals waiting for a person (one-row page, totalRecords). */
  async countPendingApprovals(tenantId) {
    const page = await this.listApprovals(tenantId, { status: 'Pending', pageNumber: 1, pageSize: 1 });
    return page.totalCount ?? 0;
  }

  // ------------------------------------------------------------------ triggers (P12.5)

  /** Cron and webhook triggers. filters: type (Cron or Webhook), search, activeOnly, pageNumber, pageSize. */
  listTriggers(tenantId, params) {
    return this._list(this._t(tenantId, 'triggers'), params);
  }

  /** Read a trigger by ID or name. The signing secret is never returned here. */
  getTrigger(tenantId, id) {
    return this._request('GET', this._t(tenantId, `triggers/${enc(id)}`));
  }

  /** Create a trigger. A webhook trigger's signingSecret is in this response only. */
  createTrigger(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'triggers'), { body });
  }

  /** Update a trigger (the caller becomes its run-as principal; the type cannot change). */
  updateTrigger(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `triggers/${enc(id)}`), { body });
  }

  /** Delete a trigger and its fire history. */
  deleteTrigger(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `triggers/${enc(id)}`));
  }

  /** Replace a webhook trigger's signing secret; the new secret is in this response only. */
  rotateTriggerSecret(tenantId, id) {
    return this._request('POST', this._t(tenantId, `triggers/${enc(id)}/rotate-secret`));
  }

  /** Fire a trigger now. body: { body?: payload text, contentType? }. Returns the fire record. */
  fireTrigger(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `triggers/${enc(id)}/fire`), { body: body || {} });
  }

  /** A trigger's fires, newest first. filters: outcome, pageNumber, pageSize. */
  listTriggerFires(tenantId, id, params) {
    return this._list(this._t(tenantId, `triggers/${enc(id)}/fires`), params);
  }

  // ------------------------------------------------------------------ notification endpoints (P12.14)

  /** Outbound webhook subscriptions. filters: search, activeOnly, pageNumber, pageSize. */
  listNotificationEndpoints(tenantId, params) {
    return this._list(this._t(tenantId, 'notification-endpoints'), params);
  }

  /** Read a notification endpoint by ID or name. */
  getNotificationEndpoint(tenantId, id) {
    return this._request('GET', this._t(tenantId, `notification-endpoints/${enc(id)}`));
  }

  /** Create a notification endpoint; signingSecret is in this response only. 400 DestinationBlocked for refused URLs. */
  createNotificationEndpoint(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'notification-endpoints'), { body });
  }

  /** Update a notification endpoint (the signing secret is kept). */
  updateNotificationEndpoint(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `notification-endpoints/${enc(id)}`), { body });
  }

  /** Delete a notification endpoint and its delivery log. */
  deleteNotificationEndpoint(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `notification-endpoints/${enc(id)}`));
  }

  /** Replace a notification endpoint's signing secret; the new secret is in this response only. */
  rotateNotificationEndpointSecret(tenantId, id) {
    return this._request('POST', this._t(tenantId, `notification-endpoints/${enc(id)}/rotate-secret`));
  }

  /** Send a test notification now; returns the delivery after its first attempt. */
  testNotificationEndpoint(tenantId, id) {
    return this._request('POST', this._t(tenantId, `notification-endpoints/${enc(id)}/test`));
  }

  /** An endpoint's delivery log, newest first. filters: status, pageNumber, pageSize. */
  listNotificationDeliveries(tenantId, id, params) {
    return this._list(this._t(tenantId, `notification-endpoints/${enc(id)}/deliveries`), params);
  }

  /** One delivery with its payload. */
  getNotificationDelivery(tenantId, id, deliveryId) {
    return this._request('GET', this._t(tenantId, `notification-endpoints/${enc(id)}/deliveries/${enc(deliveryId)}`));
  }

  // ------------------------------------------------------------------ pipelines (P12.9)

  /** Pipeline definitions: ordered agent stages with optional review gates. filters: search, pageNumber, pageSize. */
  listPipelines(tenantId, params) {
    return this._list(this._t(tenantId, 'pipelines'), params);
  }

  /** Read a pipeline by ID or name, with its stages and stage parameters. */
  getPipeline(tenantId, id) {
    return this._request('GET', this._t(tenantId, `pipelines/${enc(id)}`));
  }

  /** Create a pipeline. 400 ValidationFailed reports stage fields as stages[i].field. */
  createPipeline(tenantId, body) {
    return this._request('POST', this._t(tenantId, 'pipelines'), { body });
  }

  /** Update a pipeline (its version increments; pipeline runs already started keep their snapshot). */
  updatePipeline(tenantId, id, body) {
    return this._request('PUT', this._t(tenantId, `pipelines/${enc(id)}`), { body });
  }

  /** Delete a pipeline. 409 PipelineInUse while one of its pipeline runs is unfinished. */
  deletePipeline(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `pipelines/${enc(id)}`));
  }

  /**
   * Start a pipeline. body: { input, inputContentType?, priority? }. options.idempotencyKey sends the Idempotency-Key
   * header, so a repeated start with the same key returns the first pipeline run. Returns the pipeline run.
   */
  startPipeline(tenantId, id, body, { idempotencyKey } = {}) {
    return this._request('POST', this._t(tenantId, `pipelines/${enc(id)}/start`), {
      body,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      query: { wait: 'false' }
    });
  }

  /** Render every stage prompt from sample input and sample stage outputs. body: { input, sampleOutputs: [] }. */
  previewPipeline(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `pipelines/${enc(id)}/preview`), { body });
  }

  /** filters: pipelineId, status, callerId, fromUtc, toUtc, pageNumber, pageSize. */
  listPipelineRuns(tenantId, params) {
    return this._list(this._t(tenantId, 'pipeline-runs'), params);
  }

  /** A pipeline run with its stages, stage run summaries (runs), and reviews. */
  getPipelineRun(tenantId, id) {
    return this._request('GET', this._t(tenantId, `pipeline-runs/${enc(id)}`));
  }

  /** Cancel a pipeline run, its pending review, and its current stage run. 409 PipelineRunFinished when it ended. */
  cancelPipelineRun(tenantId, id) {
    return this._request('POST', this._t(tenantId, `pipeline-runs/${enc(id)}/cancel`));
  }

  /** Resume a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped. */
  retryPipelineRun(tenantId, id) {
    return this._request('POST', this._t(tenantId, `pipeline-runs/${enc(id)}/retry`));
  }

  /** Delete a finished pipeline run and its reviews; stage runs are kept. 409 PipelineRunActive while unfinished. */
  deletePipelineRun(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `pipeline-runs/${enc(id)}`));
  }

  /** Stage reviews. filters: status, pipelineRunId, pipelineId, runId, decisionSource, fromUtc, toUtc, pageNumber, pageSize. */
  listPipelineReviews(tenantId, params) {
    return this._list(this._t(tenantId, 'pipeline-reviews'), params);
  }

  getPipelineReview(tenantId, id) {
    return this._request('GET', this._t(tenantId, `pipeline-reviews/${enc(id)}`));
  }

  /**
   * Decide a pending stage review. body: { decision: 'Approve'|'RequestChanges'|'Reject', comment? } (comment required
   * for RequestChanges). 409 ReviewNotPending when it was already decided, 409 RevisionLimitReached when the stage used
   * all its revisions.
   */
  decidePipelineReview(tenantId, id, body) {
    return this._request('POST', this._t(tenantId, `pipeline-reviews/${enc(id)}/decide`), { body });
  }

  /** Number of stage reviews waiting for a person (one-row page, totalRecords). */
  async countPendingPipelineReviews(tenantId) {
    const page = await this.listPipelineReviews(tenantId, { status: 'Pending', pageNumber: 1, pageSize: 1 });
    return page.totalCount ?? 0;
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

  /**
   * Export a manifest bundle as YAML text (P12.21). selection: { kinds: string[], resources: string[] ('Kind/name'),
   * followReferences, includeBuiltIn }; an empty selection exports every tenant-owned resource.
   */
  exportManifests(tenantId, selection = {}) {
    return this._request('GET', this._t(tenantId, 'manifests/export'), { query: manifestExportQuery(selection), text: true });
  }

  listManifestApplies(tenantId, params) {
    return this._list(this._t(tenantId, 'manifests/applies'), params);
  }

  getManifestApply(tenantId, id) {
    return this._request('GET', this._t(tenantId, `manifests/applies/${enc(id)}`));
  }

  // ------------------------------------------------------------------ transcripts

  /** Run transcript as text (P12.27). format: 'markdown' or 'json'. */
  runTranscript(tenantId, runId, format = 'markdown', includeThinking = false) {
    return this._request('GET', this._t(tenantId, `runs/${enc(runId)}/transcript`), { query: transcriptQuery(format, includeThinking), text: true });
  }

  /** Conversation transcript (every turn) as text (P12.27). */
  conversationTranscript(tenantId, id, format = 'markdown', includeThinking = false) {
    return this._request('GET', this._t(tenantId, `conversations/${enc(id)}/transcript`), { query: transcriptQuery(format, includeThinking), text: true });
  }

  // ------------------------------------------------------------------ conversations

  /** filters: agentId, contextId, callerId, search, ordering, pageNumber, pageSize. */
  listConversations(tenantId, params) {
    return this._list(this._t(tenantId, 'conversations'), params);
  }

  getConversation(tenantId, id) {
    return this._request('GET', this._t(tenantId, `conversations/${enc(id)}`));
  }

  /** 409 ConversationBusy while the conversation has an unfinished turn. The runs are kept. */
  deleteConversation(tenantId, id) {
    return this._request('DELETE', this._t(tenantId, `conversations/${enc(id)}`));
  }

  /** The conversation's turns (runs), oldest first. */
  listConversationRuns(tenantId, id, params = { pageNumber: 1, pageSize: 1000 }) {
    return this._list(this._t(tenantId, `conversations/${enc(id)}/runs`), params);
  }

  // ------------------------------------------------------------------ runs

  /** filters: status, agentId, deploymentId, harnessType, nodeId, conversationId, fromUtc, toUtc, pageNumber, pageSize. */
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

  /**
   * Cancel a run with a request that may outlive the page (fetch keepalive), used when the Invoke page is left or the
   * tab is closed. navigator.sendBeacon cannot send the Authorization header the cancel route needs, so this uses
   * fetch with keepalive. Best effort: it never throws.
   */
  cancelRunKeepalive(tenantId, id) {
    try {
      return fetch(this._url(this._t(tenantId, `runs/${enc(id)}/cancel`)), { method: 'POST', headers: this._headers(), keepalive: true }).catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
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
