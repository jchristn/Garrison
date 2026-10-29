namespace Garrison.Sdk.Enums
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
        /// Triggers (P12.5): cron schedules and signed webhooks. Execute fires a trigger by hand.
        /// </summary>
        Trigger,

        /// <summary>
        /// Notification endpoints (P12.14) and their delivery log. Execute sends a test notification.
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
        AgentAsset,

        /// <summary>
        /// Conversation file spaces (AD3): the files a conversation's turns and its delegation trees share. Users reach
        /// them through Read and Update on the Conversation or Run they belong to; this type names them in audit records
        /// and in the operation scope map.
        /// </summary>
        ConversationFileSpace,

        /// <summary>
        /// Capability descriptors (AD4): the catalog of agents, MCP tools, and harness built-ins an orchestrator can
        /// use. Derived descriptors are maintained by Garrison; Create, Update, and Delete apply to manual descriptors,
        /// and Execute refreshes derived ones.
        /// </summary>
        Capability,

        /// <summary>
        /// Fan-out groups (AD5): children a run started in parallel with garrison_fan_out. Read reads a group and its
        /// results; Update cancels it. Users reach a group through its parent run.
        /// </summary>
        FanOutGroup,

        /// <summary>
        /// Agentic apps (AD6): a group of agents with an entry agent, its graph, app revisions, and its end-user chat UI.
        /// Execute publishes app revisions. A resource-scoped assignment of the built-in AppUser role lets a user use one
        /// app's chat UI.
        /// </summary>
        AgenticApp
    }
}
