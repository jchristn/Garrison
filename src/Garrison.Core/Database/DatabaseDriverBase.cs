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
