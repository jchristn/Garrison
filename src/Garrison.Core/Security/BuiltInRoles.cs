namespace Garrison.Core.Security
{
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Built-in role catalog. Role identifiers are stable so historical assignments keep resolving after refreshes.
    /// Thread-safe.
    /// </summary>
    public static class BuiltInRoles
    {
        #region Public-Members

        /// <summary>
        /// TenantAdmin role name.
        /// </summary>
        public const string TenantAdmin = "TenantAdmin";

        /// <summary>
        /// SecurityAdmin role name.
        /// </summary>
        public const string SecurityAdmin = "SecurityAdmin";

        /// <summary>
        /// Auditor role name.
        /// </summary>
        public const string Auditor = "Auditor";

        /// <summary>
        /// ResourceAdmin role name.
        /// </summary>
        public const string ResourceAdmin = "ResourceAdmin";

        /// <summary>
        /// Editor role name.
        /// </summary>
        public const string Editor = "Editor";

        /// <summary>
        /// Viewer role name.
        /// </summary>
        public const string Viewer = "Viewer";

        /// <summary>
        /// TenantMember role name.
        /// </summary>
        public const string TenantMember = "TenantMember";

        /// <summary>
        /// Custom role name.
        /// </summary>
        public const string Custom = "Custom";

        /// <summary>
        /// AgentDeveloper role name.
        /// </summary>
        public const string AgentDeveloper = "AgentDeveloper";

        /// <summary>
        /// AgentOperator role name.
        /// </summary>
        public const string AgentOperator = "AgentOperator";

        /// <summary>
        /// AgentInvoker role name.
        /// </summary>
        public const string AgentInvoker = "AgentInvoker";

        /// <summary>
        /// SecretManager role name.
        /// </summary>
        public const string SecretManager = "SecretManager";

        /// <summary>
        /// SecretUser role name: use secrets in configuration (Execute on Secret) without managing them.
        /// </summary>
        public const string SecretUser = "SecretUser";

        /// <summary>
        /// NodeAgent role name.
        /// </summary>
        public const string NodeAgent = "NodeAgent";

        /// <summary>
        /// AgentRegistrar role name.
        /// </summary>
        public const string AgentRegistrar = "AgentRegistrar";

        /// <summary>
        /// Releaser role name (AD1.4): promote revisions between environments and roll promotions back. Assign it at
        /// resource scope on an environment name (for example prod) to limit which environments a person may promote to.
        /// </summary>
        public const string Releaser = "Releaser";

        /// <summary>
        /// All built-in role definitions.
        /// </summary>
        public static IReadOnlyList<BuiltInRole> All
        {
            get
            {
                return _All;
            }
        }

        #endregion

        #region Private-Members

        private static readonly List<BuiltInRole> _All = Build();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Find a built-in role by name (case-insensitive).
        /// </summary>
        /// <param name="name">Role name.</param>
        /// <returns>Role or null.</returns>
        public static BuiltInRole? Find(string? name)
        {
            if (string.IsNullOrEmpty(name)) return null;
            return _All.FirstOrDefault(r => string.Equals(r.Name, name, System.StringComparison.OrdinalIgnoreCase));
        }

        #endregion

        #region Private-Methods

        private static List<BuiltInRole> Build()
        {
            List<BuiltInRole> roles = new List<BuiltInRole>();

            BuiltInRole tenantadmin = new BuiltInRole();
            tenantadmin.Id = "rol_builtin_tenantadmin";
            tenantadmin.Name = TenantAdmin;
            tenantadmin.Description = "All permissions on all resources within the tenant.";
            BuiltInPermission p_tenantadmin_all = new BuiltInPermission();
            p_tenantadmin_all.Name = "TenantAdmin.All";
            p_tenantadmin_all.ResourceTypes = new List<string> { "All" };
            p_tenantadmin_all.Operations = new List<string> { "All" };
            tenantadmin.Permissions.Add(p_tenantadmin_all);
            roles.Add(tenantadmin);

            BuiltInRole securityadmin = new BuiltInRole();
            securityadmin.Id = "rol_builtin_securityadmin";
            securityadmin.Name = SecurityAdmin;
            securityadmin.Description = "Administers users, credentials, roles, permissions, assignments, sessions, and audit.";
            BuiltInPermission p_securityadmin_admin = new BuiltInPermission();
            p_securityadmin_admin.Name = "SecurityAdmin.Admin";
            p_securityadmin_admin.ResourceTypes = new List<string> { "User", "Credential", "Session", "Role", "Permission", "Assignment", "Audit", "Tenant" };
            p_securityadmin_admin.Operations = new List<string> { "All" };
            securityadmin.Permissions.Add(p_securityadmin_admin);
            BuiltInPermission p_securityadmin_read = new BuiltInPermission();
            p_securityadmin_read.Name = "SecurityAdmin.Read";
            p_securityadmin_read.ResourceTypes = new List<string> { "Tenant", "Settings", "RequestHistory" };
            p_securityadmin_read.Operations = new List<string> { "Read" };
            securityadmin.Permissions.Add(p_securityadmin_read);
            roles.Add(securityadmin);

            BuiltInRole auditor = new BuiltInRole();
            auditor.Id = "rol_builtin_auditor";
            auditor.Name = Auditor;
            auditor.Description = "Read-only access to security records and audit.";
            BuiltInPermission p_auditor_read = new BuiltInPermission();
            p_auditor_read.Name = "Auditor.Read";
            p_auditor_read.ResourceTypes = new List<string> { "User", "Credential", "Session", "Role", "Permission", "Assignment", "Audit", "Tenant", "RequestHistory", "Run", "Conversation", "Agent", "Deployment", "ModelPrice", "UsageQuota", "Approval", "Pipeline", "PipelineRun", "Trigger", "NotificationEndpoint", "AgentRevision", "Promotion", "AgentAsset", "Capability", "FanOutGroup", "AgenticApp" };
            p_auditor_read.Operations = new List<string> { "Read" };
            auditor.Permissions.Add(p_auditor_read);
            roles.Add(auditor);

            BuiltInRole resourceadmin = new BuiltInRole();
            resourceadmin.Id = "rol_builtin_resourceadmin";
            resourceadmin.Name = ResourceAdmin;
            resourceadmin.Description = "All permissions on one specific resource (assign with Resource scope).";
            BuiltInPermission p_resourceadmin_all = new BuiltInPermission();
            p_resourceadmin_all.Name = "ResourceAdmin.All";
            p_resourceadmin_all.ResourceTypes = new List<string> { "All" };
            p_resourceadmin_all.Operations = new List<string> { "All" };
            resourceadmin.Permissions.Add(p_resourceadmin_all);
            roles.Add(resourceadmin);

            BuiltInRole editor = new BuiltInRole();
            editor.Id = "rol_builtin_editor";
            editor.Name = Editor;
            editor.Description = "Read and write domain resources; no administration.";
            BuiltInPermission p_editor_write = new BuiltInPermission();
            p_editor_write.Name = "Editor.Write";
            p_editor_write.ResourceTypes = new List<string> { "HarnessProfile", "PromptTemplate", "Agent", "Deployment", "McpServer", "Workspace", "ArtifactStore", "ModelPrice", "Run", "Manifest", "Conversation", "Artifact", "Approval", "Pipeline", "PipelineRun", "Trigger", "NotificationEndpoint", "AgentRevision", "Promotion", "AgentAsset", "Capability", "FanOutGroup", "AgenticApp" };
            p_editor_write.Operations = new List<string> { "Read", "Write", "Execute" };
            editor.Permissions.Add(p_editor_write);
            BuiltInPermission p_editor_quota = new BuiltInPermission();
            p_editor_quota.Name = "Editor.QuotaRead";
            p_editor_quota.ResourceTypes = new List<string> { "UsageQuota" };
            p_editor_quota.Operations = new List<string> { "Read" };
            editor.Permissions.Add(p_editor_quota);
            roles.Add(editor);

            BuiltInRole viewer = new BuiltInRole();
            viewer.Id = "rol_builtin_viewer";
            viewer.Name = Viewer;
            viewer.Description = "Read domain resources.";
            BuiltInPermission p_viewer_read = new BuiltInPermission();
            p_viewer_read.Name = "Viewer.Read";
            p_viewer_read.ResourceTypes = new List<string> { "HarnessProfile", "PromptTemplate", "Agent", "Deployment", "McpServer", "Workspace", "ArtifactStore", "ModelPrice", "UsageQuota", "Run", "Manifest", "Node", "NodePool", "Conversation", "Artifact", "Approval", "Pipeline", "PipelineRun", "Trigger", "NotificationEndpoint", "AgentRevision", "Promotion", "AgentAsset", "Capability", "FanOutGroup", "AgenticApp" };
            p_viewer_read.Operations = new List<string> { "Read" };
            viewer.Permissions.Add(p_viewer_read);
            roles.Add(viewer);

            BuiltInRole tenantmember = new BuiltInRole();
            tenantmember.Id = "rol_builtin_tenantmember";
            tenantmember.Name = TenantMember;
            tenantmember.Description = "Minimal tenant presence: read agents and own profile.";
            BuiltInPermission p_tenantmember_read = new BuiltInPermission();
            p_tenantmember_read.Name = "TenantMember.Read";
            p_tenantmember_read.ResourceTypes = new List<string> { "Agent", "Tenant" };
            p_tenantmember_read.Operations = new List<string> { "Read" };
            tenantmember.Permissions.Add(p_tenantmember_read);
            roles.Add(tenantmember);

            BuiltInRole custom = new BuiltInRole();
            custom.Id = "rol_builtin_custom";
            custom.Name = Custom;
            custom.Description = "Template marker for tenant-defined roles. Carries no permissions.";
            roles.Add(custom);

            BuiltInRole agentdeveloper = new BuiltInRole();
            agentdeveloper.Id = "rol_builtin_agentdeveloper";
            agentdeveloper.Name = AgentDeveloper;
            agentdeveloper.Description = "Author harness profiles, prompts, agents, deployments, MCP servers, and workspaces; invoke agents.";
            BuiltInPermission p_agentdeveloper_write = new BuiltInPermission();
            p_agentdeveloper_write.Name = "AgentDeveloper.Write";
            p_agentdeveloper_write.ResourceTypes = new List<string> { "HarnessProfile", "PromptTemplate", "Agent", "Deployment", "McpServer", "Workspace", "ArtifactStore", "Manifest", "Pipeline", "Trigger", "NotificationEndpoint", "AgentRevision", "AgentAsset", "Capability", "FanOutGroup", "AgenticApp" };
            p_agentdeveloper_write.Operations = new List<string> { "Read", "Write" };
            agentdeveloper.Permissions.Add(p_agentdeveloper_write);
            BuiltInPermission p_agentdeveloper_execute = new BuiltInPermission();
            p_agentdeveloper_execute.Name = "AgentDeveloper.Execute";
            p_agentdeveloper_execute.ResourceTypes = new List<string> { "Agent", "Pipeline", "Trigger", "NotificationEndpoint", "AgentRevision" };
            p_agentdeveloper_execute.Operations = new List<string> { "Execute" };
            agentdeveloper.Permissions.Add(p_agentdeveloper_execute);
            BuiltInPermission p_agentdeveloper_read = new BuiltInPermission();
            p_agentdeveloper_read.Name = "AgentDeveloper.Read";
            p_agentdeveloper_read.ResourceTypes = new List<string> { "Secret", "Run", "Conversation", "Node", "NodePool", "Approval", "PipelineRun", "Promotion" };
            p_agentdeveloper_read.Operations = new List<string> { "Read" };
            agentdeveloper.Permissions.Add(p_agentdeveloper_read);
            roles.Add(agentdeveloper);

            BuiltInRole agentoperator = new BuiltInRole();
            agentoperator.Id = "rol_builtin_agentoperator";
            agentoperator.Name = AgentOperator;
            agentoperator.Description = "Operate runs, decide permission approvals, and observe nodes.";
            BuiltInPermission p_agentoperator_read = new BuiltInPermission();
            p_agentoperator_read.Name = "AgentOperator.Read";
            p_agentoperator_read.ResourceTypes = new List<string> { "HarnessProfile", "PromptTemplate", "Agent", "Deployment", "McpServer", "Workspace", "Node", "NodePool", "Run", "Conversation", "ModelPrice", "UsageQuota", "Approval", "Pipeline", "PipelineRun", "Trigger", "NotificationEndpoint", "AgentRevision", "Promotion", "AgentAsset", "Capability", "FanOutGroup", "AgenticApp" };
            p_agentoperator_read.Operations = new List<string> { "Read" };
            agentoperator.Permissions.Add(p_agentoperator_read);
            BuiltInPermission p_agentoperator_execute = new BuiltInPermission();
            p_agentoperator_execute.Name = "AgentOperator.Execute";
            p_agentoperator_execute.ResourceTypes = new List<string> { "Agent", "Pipeline", "Trigger" };
            p_agentoperator_execute.Operations = new List<string> { "Execute" };
            agentoperator.Permissions.Add(p_agentoperator_execute);
            BuiltInPermission p_agentoperator_runs = new BuiltInPermission();
            p_agentoperator_runs.Name = "AgentOperator.Runs";
            p_agentoperator_runs.ResourceTypes = new List<string> { "Run", "Conversation", "Approval", "PipelineRun" };
            p_agentoperator_runs.Operations = new List<string> { "Update", "Delete" };
            agentoperator.Permissions.Add(p_agentoperator_runs);
            roles.Add(agentoperator);

            BuiltInRole agentinvoker = new BuiltInRole();
            agentinvoker.Id = "rol_builtin_agentinvoker";
            agentinvoker.Name = AgentInvoker;
            agentinvoker.Description = "Invoke agents and read runs. Intended for integration credentials.";
            BuiltInPermission p_agentinvoker_execute = new BuiltInPermission();
            p_agentinvoker_execute.Name = "AgentInvoker.Execute";
            p_agentinvoker_execute.ResourceTypes = new List<string> { "Agent", "Pipeline" };
            p_agentinvoker_execute.Operations = new List<string> { "Read", "Execute" };
            agentinvoker.Permissions.Add(p_agentinvoker_execute);
            BuiltInPermission p_agentinvoker_runs = new BuiltInPermission();
            p_agentinvoker_runs.Name = "AgentInvoker.Runs";
            p_agentinvoker_runs.ResourceTypes = new List<string> { "Run", "Conversation", "PipelineRun" };
            p_agentinvoker_runs.Operations = new List<string> { "Read", "Create" };
            agentinvoker.Permissions.Add(p_agentinvoker_runs);
            roles.Add(agentinvoker);

            BuiltInRole secretmanager = new BuiltInRole();
            secretmanager.Id = "rol_builtin_secretmanager";
            secretmanager.Name = SecretManager;
            secretmanager.Description = "Manage secrets and use them in configuration.";
            BuiltInPermission p_secretmanager_all = new BuiltInPermission();
            p_secretmanager_all.Name = "SecretManager.All";
            p_secretmanager_all.ResourceTypes = new List<string> { "Secret" };
            p_secretmanager_all.Operations = new List<string> { "All" };
            secretmanager.Permissions.Add(p_secretmanager_all);
            roles.Add(secretmanager);

            BuiltInRole secretuser = new BuiltInRole();
            secretuser.Id = "rol_builtin_secretuser";
            secretuser.Name = SecretUser;
            secretuser.Description = "Use secrets in deployments, MCP servers, harness profiles, artifact stores, workspace templates, and agents (Execute on Secret) without managing them. Assign at Resource scope to allow one secret.";
            BuiltInPermission p_secretuser_use = new BuiltInPermission();
            p_secretuser_use.Name = "SecretUser.Use";
            p_secretuser_use.ResourceTypes = new List<string> { "Secret" };
            p_secretuser_use.Operations = new List<string> { "Read", "Execute" };
            secretuser.Permissions.Add(p_secretuser_use);
            roles.Add(secretuser);

            BuiltInRole nodeagent = new BuiltInRole();
            nodeagent.Id = "rol_builtin_nodeagent";
            nodeagent.Name = NodeAgent;
            nodeagent.Description = "Internal role for worker node credentials. Grants the node protocol only.";
            BuiltInPermission p_nodeagent_execute = new BuiltInPermission();
            p_nodeagent_execute.Name = "NodeAgent.Execute";
            p_nodeagent_execute.ResourceTypes = new List<string> { "Node" };
            p_nodeagent_execute.Operations = new List<string> { "Execute", "Read" };
            nodeagent.Permissions.Add(p_nodeagent_execute);
            roles.Add(nodeagent);

            BuiltInRole agentregistrar = new BuiltInRole();
            agentregistrar.Id = "rol_builtin_agentregistrar";
            agentregistrar.Name = AgentRegistrar;
            agentregistrar.Description = "Self-register remote agents.";
            BuiltInPermission p_agentregistrar_write = new BuiltInPermission();
            p_agentregistrar_write.Name = "AgentRegistrar.Write";
            p_agentregistrar_write.ResourceTypes = new List<string> { "Agent" };
            p_agentregistrar_write.Operations = new List<string> { "Read", "Create", "Update" };
            agentregistrar.Permissions.Add(p_agentregistrar_write);
            roles.Add(agentregistrar);

            BuiltInRole releaser = new BuiltInRole();
            releaser.Id = "rol_builtin_releaser";
            releaser.Name = Releaser;
            releaser.Description = "Promote agent and app revisions between environments and roll promotions back.";
            BuiltInPermission p_releaser_execute = new BuiltInPermission();
            p_releaser_execute.Name = "Releaser.Execute";
            p_releaser_execute.ResourceTypes = new List<string> { "Promotion" };
            p_releaser_execute.Operations = new List<string> { "Read", "Execute" };
            releaser.Permissions.Add(p_releaser_execute);
            BuiltInPermission p_releaser_read = new BuiltInPermission();
            p_releaser_read.Name = "Releaser.Read";
            p_releaser_read.ResourceTypes = new List<string> { "Agent", "AgentRevision", "Deployment" };
            p_releaser_read.Operations = new List<string> { "Read" };
            releaser.Permissions.Add(p_releaser_read);
            roles.Add(releaser);

            return roles;
        }

        #endregion
    }
}
