namespace Garrison.Sdk.Requests
{
    using System.Collections.Generic;

    /// <summary>
    /// Selectors for a manifest bundle export. With no kinds and no resources every tenant-owned resource is exported.
    /// </summary>
    public class ManifestExportRequest
    {
        #region Public-Members

        /// <summary>
        /// Kinds to export in full (PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate, Agent, Deployment,
        /// Pipeline, Trigger, NotificationEndpoint). Default empty.
        /// </summary>
        public List<string> Kinds { get; set; } = new List<string>();

        /// <summary>
        /// Individual resources as Kind/name (for example Agent/triage). Default empty.
        /// </summary>
        public List<string> Resources { get; set; } = new List<string>();

        /// <summary>
        /// Whether to also export what the selection depends on (an agent brings its deployments, profile, templates,
        /// and so on). Default false.
        /// </summary>
        public bool FollowReferences { get; set; } = false;

        /// <summary>
        /// Whether to include referenced built-in prompt templates and harness profiles. Default false.
        /// </summary>
        public bool IncludeBuiltIn { get; set; } = false;

        #endregion
    }
}
