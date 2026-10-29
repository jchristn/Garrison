namespace Garrison.Core.Enums
{
    /// <summary>
    /// Resource types used for authorization.
    /// </summary>
    public enum ResourceTypeEnum
    {
        /// <summary>
        /// All.
        /// </summary>
        All,

        /// <summary>
        /// Account.
        /// </summary>
        Account,

        /// <summary>
        /// Tenant.
        /// </summary>
        Tenant,

        /// <summary>
        /// Admin.
        /// </summary>
        Admin,

        /// <summary>
        /// User.
        /// </summary>
        User,

        /// <summary>
        /// Credential.
        /// </summary>
        Credential,

        /// <summary>
        /// Session.
        /// </summary>
        Session,

        /// <summary>
        /// Role.
        /// </summary>
        Role,

        /// <summary>
        /// Permission.
        /// </summary>
        Permission,

        /// <summary>
        /// Assignment.
        /// </summary>
        Assignment,

        /// <summary>
        /// Audit.
        /// </summary>
        Audit,

        /// <summary>
        /// RequestHistory.
        /// </summary>
        RequestHistory,

        /// <summary>
        /// Settings.
        /// </summary>
        Settings,

        /// <summary>
        /// HarnessProfile.
        /// </summary>
        HarnessProfile,

        /// <summary>
        /// PromptTemplate.
        /// </summary>
        PromptTemplate,

        /// <summary>
        /// Agent.
        /// </summary>
        Agent,

        /// <summary>
        /// Deployment.
        /// </summary>
        Deployment,

        /// <summary>
        /// McpServer.
        /// </summary>
        McpServer,

        /// <summary>
        /// Secret.
        /// </summary>
        Secret,

        /// <summary>
        /// Workspace.
        /// </summary>
        Workspace,

        /// <summary>
        /// ArtifactStore.
        /// </summary>
        ArtifactStore,

        /// <summary>
        /// Run.
        /// </summary>
        Run,

        /// <summary>
        /// Node.
        /// </summary>
        Node,

        /// <summary>
        /// NodePool.
        /// </summary>
        NodePool,

        /// <summary>
        /// Manifest.
        /// </summary>
        Manifest,

        /// <summary>
        /// Conversation.
        /// </summary>
        Conversation,

        /// <summary>
        /// Approval.
        /// </summary>
        Approval,

        /// <summary>
        /// Artifact.
        /// </summary>
        Artifact,

        /// <summary>
        /// Model price configuration.
        /// </summary>
        ModelPrice,

        /// <summary>Usage quota configuration and counters.</summary>
        UsageQuota,

        /// <summary>
        /// Pipeline definitions: ordered agent stages with optional review gates (P12.9). Execute starts a pipeline.
        /// </summary>
        Pipeline,

        /// <summary>
        /// Pipeline runs (P12.9): read, cancel, retry, and delete executions of a pipeline. Stage reviews are authorized as
        /// Approval.
        /// </summary>
        PipelineRun,

        /// <summary>
        /// Triggers (P12.5): cron schedules and signed webhooks that start runs or pipeline runs. Execute fires a trigger
        /// by hand; Update also rotates a webhook signing secret.
        /// </summary>
        Trigger,

        /// <summary>
        /// Notification endpoints (P12.14): outbound webhook subscriptions to run, pipeline, and approval events, with
        /// their delivery log. Execute sends a test notification; Update also rotates the signing secret.
        /// </summary>
        NotificationEndpoint,

        /// <summary>
        /// Agent revisions (AD1): drafts and published snapshots of an agent's definition. Create and Update edit the
        /// draft; Execute publishes it.
        /// </summary>
        AgentRevision,

        /// <summary>
        /// Promotions (AD1.4): moving a revision from one environment to the next, and rolling a promotion back. Read
        /// lists promotion records; Execute promotes or rolls back. A resource-scoped grant names the target environment,
        /// for example Execute on Promotion for prod.
        /// </summary>
        Promotion,

        /// <summary>
        /// Agent assets (AD2): versioned system prompts, skills, reference files, and document templates. Create also
        /// uploads a new version.
        /// </summary>
        AgentAsset
    }
}
