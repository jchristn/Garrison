namespace Garrison.Sdk
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Clients;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Entry point of the Garrison SDK. Choose an authentication method (LoginAsync, LoginWithKeysAsync,
    /// UseAccessKey, UseSignedRequests, UseToken, or UseAdminApiKey), then use the module properties.
    /// Thread-safe for concurrent requests.
    /// </summary>
    public class GarrisonClient : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Default base URL.
        /// </summary>
        public static readonly string DefaultBaseUrl = "http://127.0.0.1:8700";

        /// <summary>
        /// Transport.
        /// </summary>
        public GarrisonTransport Transport { get; }

        /// <summary>
        /// Tenant identifier used for tenant-scoped APIs. Set automatically by login.
        /// </summary>
        public string? TenantId
        {
            get
            {
                return Transport.TenantId;
            }
            set
            {
                Transport.TenantId = value;
            }
        }

        /// <summary>
        /// Tenants.
        /// </summary>
        public TenantsClient Tenants { get; }

        /// <summary>
        /// Users.
        /// </summary>
        public UsersClient Users { get; }

        /// <summary>
        /// Credentials.
        /// </summary>
        public CredentialsClient Credentials { get; }

        /// <summary>
        /// Roles.
        /// </summary>
        public RolesClient Roles { get; }

        /// <summary>
        /// Permissions.
        /// </summary>
        public PermissionsClient Permissions { get; }

        /// <summary>
        /// Role to permission mappings.
        /// </summary>
        public RolePermissionsClient RolePermissions { get; }

        /// <summary>
        /// User role assignments.
        /// </summary>
        public UserRoleAssignmentsClient UserRoleAssignments { get; }

        /// <summary>
        /// Credential scope assignments.
        /// </summary>
        public CredentialScopeAssignmentsClient CredentialScopeAssignments { get; }

        /// <summary>
        /// Agents.
        /// </summary>
        public AgentsClient Agents { get; }

        /// <summary>
        /// Deployments.
        /// </summary>
        public DeploymentsClient Deployments { get; }

        /// <summary>
        /// Harness profiles.
        /// </summary>
        public HarnessProfilesClient HarnessProfiles { get; }

        /// <summary>
        /// Prompt templates.
        /// </summary>
        public PromptTemplatesClient PromptTemplates { get; }

        /// <summary>
        /// MCP servers.
        /// </summary>
        public McpServersClient McpServers { get; }

        /// <summary>
        /// Secrets.
        /// </summary>
        public SecretsClient Secrets { get; }

        /// <summary>
        /// Workspace templates.
        /// </summary>
        public WorkspaceTemplatesClient WorkspaceTemplates { get; }

        /// <summary>
        /// Artifact stores.
        /// </summary>
        public ArtifactStoresClient ArtifactStores { get; }

        /// <summary>Collected run artifacts.</summary>
        public ArtifactsClient Artifacts { get; }

        /// <summary>Operator-configured model prices.</summary>
        public ModelPricesClient ModelPrices { get; }

        /// <summary>Daily usage quotas.</summary>
        public UsageQuotasClient UsageQuotas { get; }

        /// <summary>
        /// Manifests.
        /// </summary>
        public ManifestsClient Manifests { get; }

        /// <summary>
        /// Runs.
        /// </summary>
        public RunsClient Runs { get; }

        /// <summary>
        /// Conversations (multi-turn sessions with one agent).
        /// </summary>
        public ConversationsClient Conversations { get; }

        /// <summary>
        /// Permission approvals.
        /// </summary>
        public ApprovalsClient Approvals { get; }

        /// <summary>
        /// Pipeline definitions: ordered agent stages with optional review gates. Start and preview pipelines here.
        /// </summary>
        public PipelinesClient Pipelines { get; }

        /// <summary>
        /// Pipeline runs: read, wait for, cancel, retry, and delete executions of a pipeline.
        /// </summary>
        public PipelineRunsClient PipelineRuns { get; }

        /// <summary>
        /// Pipeline stage reviews: list, read, and decide.
        /// </summary>
        public PipelineReviewsClient PipelineReviews { get; }

        /// <summary>
        /// Analytics.
        /// </summary>
        public AnalyticsClient Analytics { get; }

        /// <summary>
        /// Worker nodes.
        /// </summary>
        public NodesClient Nodes { get; }

        /// <summary>
        /// Control-plane replicas (control nodes).
        /// </summary>
        public ControlNodesClient ControlNodes { get; }

        /// <summary>
        /// Node pools.
        /// </summary>
        public NodePoolsClient NodePools { get; }

        /// <summary>
        /// Request history.
        /// </summary>
        public RequestHistoryClient RequestHistory { get; }

        /// <summary>
        /// Audit.
        /// </summary>
        public AuditClient Audit { get; }

        /// <summary>
        /// Settings.
        /// </summary>
        public SettingsClient Settings { get; }

        #endregion

        #region Private-Members

        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="baseUrl">Base URL. Default http://127.0.0.1:8700.</param>
        /// <param name="httpClient">Optional HttpClient.</param>
        public GarrisonClient(string? baseUrl = null, HttpClient? httpClient = null)
        {
            Transport = new GarrisonTransport(String.IsNullOrEmpty(baseUrl) ? DefaultBaseUrl : baseUrl, httpClient);
            Tenants = new TenantsClient(Transport);
            Users = new UsersClient(Transport);
            Credentials = new CredentialsClient(Transport);
            Roles = new RolesClient(Transport);
            Permissions = new PermissionsClient(Transport);
            RolePermissions = new RolePermissionsClient(Transport);
            UserRoleAssignments = new UserRoleAssignmentsClient(Transport);
            CredentialScopeAssignments = new CredentialScopeAssignmentsClient(Transport);
            Agents = new AgentsClient(Transport);
            Deployments = new DeploymentsClient(Transport);
            HarnessProfiles = new HarnessProfilesClient(Transport);
            PromptTemplates = new PromptTemplatesClient(Transport);
            McpServers = new McpServersClient(Transport);
            Secrets = new SecretsClient(Transport);
            WorkspaceTemplates = new WorkspaceTemplatesClient(Transport);
            ArtifactStores = new ArtifactStoresClient(Transport);
            Artifacts = new ArtifactsClient(Transport);
            ModelPrices = new ModelPricesClient(Transport);
            UsageQuotas = new UsageQuotasClient(Transport);
            Manifests = new ManifestsClient(Transport);
            Runs = new RunsClient(Transport);
            Conversations = new ConversationsClient(Transport);
            Approvals = new ApprovalsClient(Transport);
            Pipelines = new PipelinesClient(Transport);
            PipelineRuns = new PipelineRunsClient(Transport);
            PipelineReviews = new PipelineReviewsClient(Transport);
            Analytics = new AnalyticsClient(Transport);
            Nodes = new NodesClient(Transport);
            ControlNodes = new ControlNodesClient(Transport);
            NodePools = new NodePoolsClient(Transport);
            RequestHistory = new RequestHistoryClient(Transport);
            Audit = new AuditClient(Transport);
            Settings = new SettingsClient(Transport);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Log in with a user's email and password and use the issued bearer token.
        /// </summary>
        /// <param name="email">Email.</param>
        /// <param name="password">Password.</param>
        /// <param name="tenantId">Tenant identifier; null uses the Default tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Issued token.</returns>
        public async Task<TokenResponse> LoginAsync(string email, string password, string? tenantId = null, CancellationToken token = default)
        {
            TokenRequest request = new TokenRequest();
            request.Email = email;
            request.Password = password;
            request.TenantId = tenantId;
            return await IssueAsync(request, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Exchange an access key and secret key for a bearer token and use it.
        /// </summary>
        /// <param name="accessKey">Access key.</param>
        /// <param name="secretKey">Secret key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Issued token.</returns>
        public async Task<TokenResponse> LoginWithKeysAsync(string accessKey, string secretKey, CancellationToken token = default)
        {
            TokenRequest request = new TokenRequest();
            request.AccessKey = accessKey;
            request.SecretKey = secretKey;
            return await IssueAsync(request, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Use an existing bearer token.
        /// </summary>
        /// <param name="sessionToken">Token.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        public void UseToken(string sessionToken, string? tenantId)
        {
            Transport.AuthMode = AuthModeEnum.Token;
            Transport.Token = sessionToken;
            Transport.TenantId = tenantId;
        }

        /// <summary>
        /// Send access key and secret key headers on every request.
        /// </summary>
        /// <param name="accessKey">Access key.</param>
        /// <param name="secretKey">Secret key.</param>
        /// <param name="tenantId">Tenant identifier of the credential.</param>
        public void UseAccessKey(string accessKey, string secretKey, string tenantId)
        {
            Transport.AuthMode = AuthModeEnum.AccessKeySecret;
            Transport.AccessKey = accessKey;
            Transport.SecretKey = secretKey;
            Transport.TenantId = tenantId;
        }

        /// <summary>
        /// Sign every request with HMAC-SHA256; the secret key never crosses the wire.
        /// </summary>
        /// <param name="accessKey">Access key.</param>
        /// <param name="secretKey">Secret key.</param>
        /// <param name="tenantId">Tenant identifier of the credential.</param>
        public void UseSignedRequests(string accessKey, string secretKey, string tenantId)
        {
            Transport.AuthMode = AuthModeEnum.SignedRequest;
            Transport.AccessKey = accessKey;
            Transport.SecretKey = secretKey;
            Transport.TenantId = tenantId;
        }

        /// <summary>
        /// Use the system administrator API key.
        /// </summary>
        /// <param name="apiKey">API key.</param>
        /// <param name="tenantId">Tenant for tenant-scoped APIs.</param>
        public void UseAdminApiKey(string apiKey, string? tenantId)
        {
            Transport.AuthMode = AuthModeEnum.AdminApiKey;
            Transport.AdminApiKey = apiKey;
            Transport.TenantId = tenantId;
        }

        /// <summary>
        /// Describe the authenticated principal.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Details.</returns>
        public async Task<TokenDetailsResponse> GetTokenDetailsAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<TokenDetailsResponse>(HttpMethod.Get, "/v1.0/token/details", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Issue a fresh token for the authenticated principal and use it.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Issued token.</returns>
        public async Task<TokenResponse> RefreshAsync(CancellationToken token = default)
        {
            TokenResponse issued = await Transport.SendAsync<TokenResponse>(HttpMethod.Post, "/v1.0/token/refresh", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
            UseToken(issued.Token, issued.TenantId ?? Transport.TenantId);
            return issued;
        }

        /// <summary>
        /// Revoke the current bearer token.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LogoutAsync(CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, "/v1.0/token", token: token).ConfigureAwait(false);
            Transport.Token = null;
            Transport.AuthMode = AuthModeEnum.None;
        }

        /// <summary>
        /// Health check (anonymous).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Health.</returns>
        public async Task<HealthResponse> HealthAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<HealthResponse>(HttpMethod.Get, "/v1.0/api/health", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Server information.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Server info.</returns>
        public async Task<ServerInfoResponse> ServerInfoAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<ServerInfoResponse>(HttpMethod.Get, "/v1.0/api/server-info", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Tenant overview (Home page KPIs).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Overview.</returns>
        public async Task<OverviewResponse> OverviewAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<OverviewResponse>(HttpMethod.Get, TenantPath("/overview"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Active runs grouped by agent and harness.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows.</returns>
        public async Task<List<QueueSummaryRow>> QueueSummaryAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<List<QueueSummaryRow>>(HttpMethod.Get, TenantPath("/queue/summary"), token: token).ConfigureAwait(false) ?? new List<QueueSummaryRow>();
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) Transport.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task<TokenResponse> IssueAsync(TokenRequest request, CancellationToken token)
        {
            AuthModeEnum previous = Transport.AuthMode;
            Transport.AuthMode = AuthModeEnum.None;
            try
            {
                TokenResponse issued = await Transport.SendAsync<TokenResponse>(HttpMethod.Post, "/v1.0/token", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
                UseToken(issued.Token, issued.TenantId);
                return issued;
            }
            catch
            {
                Transport.AuthMode = previous;
                throw;
            }
        }

        private string TenantPath(string suffix)
        {
            if (String.IsNullOrEmpty(Transport.TenantId)) throw new InvalidOperationException("Set TenantId on the client (or log in) before calling tenant-scoped APIs.");
            return "/v1.0/api/tenants/" + Uri.EscapeDataString(Transport.TenantId) + suffix;
        }

        #endregion
    }
}
