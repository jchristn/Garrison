namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;

    /// <summary>
    /// What a manifest bundle export contains (P12.21). With no kinds and no resources, every tenant-owned resource is
    /// exported.
    /// </summary>
    public class ManifestExportOptions
    {
        #region Public-Members

        /// <summary>
        /// Kinds whose every record is exported (PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate, Agent,
        /// Deployment, Pipeline, Trigger, NotificationEndpoint). Never null.
        /// </summary>
        public List<string> Kinds
        {
            get
            {
                return _Kinds;
            }
            set
            {
                _Kinds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Individual resources to export. Never null.
        /// </summary>
        public List<ManifestResourceReference> Resources
        {
            get
            {
                return _Resources;
            }
            set
            {
                _Resources = value ?? new List<ManifestResourceReference>();
            }
        }

        /// <summary>
        /// Whether what the selection depends on is exported too (an agent brings its deployments, their profiles,
        /// templates, workspaces, and MCP servers, and the triggers and notification endpoints that target it). Default false.
        /// </summary>
        public bool FollowReferences { get; set; } = false;

        /// <summary>
        /// Whether referenced built-in prompt templates and harness profiles are exported as documents. Default false.
        /// Applying a built-in document leaves the built-in unchanged.
        /// </summary>
        public bool IncludeBuiltIn { get; set; } = false;

        #endregion

        #region Private-Members

        private List<string> _Kinds = new List<string>();
        private List<ManifestResourceReference> _Resources = new List<ManifestResourceReference>();

        #endregion
    }
}
