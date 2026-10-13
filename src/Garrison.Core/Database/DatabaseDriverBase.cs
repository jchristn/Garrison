namespace Garrison.Core.Database
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enums;

    /// <summary>
    /// Abstract database driver exposing domain-specific method interfaces.
    /// </summary>
    public abstract class DatabaseDriverBase : IDisposable, IAsyncDisposable
    {
        #region Public-Members

        /// <summary>
        /// Database provider.
        /// </summary>
        public abstract DatabaseTypeEnum DatabaseType { get; }

        /// <summary>
        /// Highest schema migration version applied, set by <see cref="InitializeAsync"/>.
        /// Zero until the driver is initialized, or when schema management is disabled and the version was not read.
        /// </summary>
        public int SchemaVersion { get; protected set; } = 0;

        /// <summary>
        /// Number of migrations this driver instance applied during <see cref="InitializeAsync"/>. With several replicas
        /// starting against one database, exactly one of them applies each migration; the others report 0.
        /// </summary>
        public int MigrationsApplied { get; protected set; } = 0;

        /// <summary>
        /// Tenant methods.
        /// </summary>
        public ITenantMethods Tenants { get; protected set; } = null!;

        /// <summary>
        /// User methods.
        /// </summary>
        public IUserMethods Users { get; protected set; } = null!;

        /// <summary>
        /// Credential methods.
        /// </summary>
        public ICredentialMethods Credentials { get; protected set; } = null!;

        /// <summary>
        /// AuthSession methods.
        /// </summary>
        public IAuthSessionMethods Sessions { get; protected set; } = null!;

        /// <summary>
        /// Role methods.
        /// </summary>
        public IRoleMethods Roles { get; protected set; } = null!;

        /// <summary>
        /// Permission methods.
        /// </summary>
        public IPermissionMethods Permissions { get; protected set; } = null!;

        /// <summary>
        /// RolePermissionMap methods.
        /// </summary>
        public IRolePermissionMapMethods RolePermissionMaps { get; protected set; } = null!;

        /// <summary>
        /// UserRoleAssignment methods.
        /// </summary>
        public IUserRoleAssignmentMethods UserRoleAssignments { get; protected set; } = null!;

        /// <summary>
        /// CredentialScopeAssignment methods.
        /// </summary>
        public ICredentialScopeAssignmentMethods CredentialScopeAssignments { get; protected set; } = null!;

        /// <summary>
        /// AuditRecord methods.
        /// </summary>
        public IAuditRecordMethods Audit { get; protected set; } = null!;

        /// <summary>
        /// RequestHistoryEntry methods.
        /// </summary>
        public IRequestHistoryEntryMethods RequestHistory { get; protected set; } = null!;

        /// <summary>
        /// HarnessProfile methods.
        /// </summary>
        public IHarnessProfileMethods HarnessProfiles { get; protected set; } = null!;

        /// <summary>
        /// PromptTemplate methods.
        /// </summary>
        public IPromptTemplateMethods PromptTemplates { get; protected set; } = null!;

        /// <summary>
        /// PromptTemplateVersion methods.
        /// </summary>
        public IPromptTemplateVersionMethods PromptTemplateVersions { get; protected set; } = null!;

        /// <summary>
        /// McpServer methods.
        /// </summary>
        public IMcpServerMethods McpServers { get; protected set; } = null!;

        /// <summary>
        /// Secret methods.
        /// </summary>
        public ISecretMethods Secrets { get; protected set; } = null!;

        /// <summary>
        /// WorkspaceTemplate methods.
        /// </summary>
        public IWorkspaceTemplateMethods WorkspaceTemplates { get; protected set; } = null!;

        /// <summary>
        /// ArtifactStore methods.
        /// </summary>
        public IArtifactStoreMethods ArtifactStores { get; protected set; } = null!;

        /// <summary>Collected run artifact metadata and database content.</summary>
        public IArtifactMethods Artifacts { get; protected set; } = null!;

        /// <summary>Operator-configured model price methods.</summary>
        public IModelPriceMethods ModelPrices { get; protected set; } = null!;

        /// <summary>Usage quota configuration and counters.</summary>
        public IUsageQuotaMethods UsageQuotas { get; protected set; } = null!;

        /// <summary>
        /// Agent methods.
        /// </summary>
        public IAgentMethods Agents { get; protected set; } = null!;

        /// <summary>
        /// Deployment methods.
        /// </summary>
        public IDeploymentMethods Deployments { get; protected set; } = null!;

        /// <summary>
        /// NodePool methods.
        /// </summary>
        public INodePoolMethods NodePools { get; protected set; } = null!;

        /// <summary>
        /// Node methods.
        /// </summary>
        public INodeMethods Nodes { get; protected set; } = null!;

        /// <summary>
        /// Run methods.
        /// </summary>
        public IRunMethods Runs { get; protected set; } = null!;

        /// <summary>
        /// RunEvent methods.
        /// </summary>
        public IRunEventMethods RunEvents { get; protected set; } = null!;

        /// <summary>
        /// CoordinationLease methods.
        /// </summary>
        public ICoordinationLeaseMethods CoordinationLeases { get; protected set; } = null!;

        /// <summary>
        /// ClusterSetting methods.
        /// </summary>
        public IClusterSettingMethods ClusterSettings { get; protected set; } = null!;

        /// <summary>
        /// ManifestApply methods.
        /// </summary>
        public IManifestApplyMethods ManifestApplies { get; protected set; } = null!;

        /// <summary>
        /// Signed-request nonce methods.
        /// </summary>
        public IRequestNonceMethods Nonces { get; protected set; } = null!;

        /// <summary>
        /// Rate limit bucket methods.
        /// </summary>
        public IRateLimitBucketMethods RateLimits { get; protected set; } = null!;

        /// <summary>
        /// Cluster MCP session methods.
        /// </summary>
        public IMcpSessionMethods McpSessions { get; protected set; } = null!;

        /// <summary>
        /// Polling backplane message methods.
        /// </summary>
        public IBackplaneMessageMethods BackplaneMessages { get; protected set; } = null!;

        /// <summary>
        /// Control-plane replica (control node) methods.
        /// </summary>
        public IControlNodeMethods ControlNodes { get; protected set; } = null!;

        /// <summary>
        /// Conversation methods.
        /// </summary>
        public IConversationMethods Conversations { get; protected set; } = null!;

        /// <summary>
        /// Permission approval methods (P12.3).
        /// </summary>
        public IApprovalMethods Approvals { get; protected set; } = null!;

        #endregion

        #region Private-Members

        private bool _Disposed = false;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Initialize the driver: create the schema or verify it, and apply migrations.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public abstract Task InitializeAsync(CancellationToken token = default);

        /// <summary>
        /// Take the database-wide startup lock, waiting while another replica holds it. Migrations and built-in seeding
        /// run under it so that replicas starting together never race. On Postgresql it is a session advisory lock on a
        /// dedicated connection, released when the handle is disposed or the process dies; on Sqlite it is a
        /// process-wide lock per database file.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Handle; dispose to release.</returns>
        public abstract Task<DatabaseLockHandle> AcquireStartupLockAsync(CancellationToken token = default);

        /// <summary>
        /// Read the highest applied migration version from the database (not the cached <see cref="SchemaVersion"/>).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Version, or 0 when no migration was applied.</returns>
        public abstract Task<int> ReadSchemaVersionAsync(CancellationToken token = default);

        /// <summary>
        /// Verify connectivity.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the database answered.</returns>
        public abstract Task<bool> PingAsync(CancellationToken token = default);

        /// <summary>
        /// Close the driver and release pooled resources.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public abstract Task CloseAsync(CancellationToken token = default);

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Dispose asynchronously.
        /// </summary>
        /// <returns>Value task.</returns>
        public async ValueTask DisposeAsync()
        {
            await CloseAsync().ConfigureAwait(false);
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
            _Disposed = true;
        }

        #endregion
    }
}
