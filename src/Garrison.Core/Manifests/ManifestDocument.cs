namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A parsed manifest document (apiVersion garrison/v1). The spec is a value tree because its shape depends on the kind.
    /// </summary>
    public class ManifestDocument
    {
        /// <summary>
        /// API version; must be garrison/v1.
        /// </summary>
        public string ApiVersion { get; set; } = String.Empty;

        /// <summary>
        /// Kind: HarnessProfile, PromptTemplate, McpServer, Secret, WorkspaceTemplate, Agent, or Deployment.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Metadata.
        /// </summary>
        public ManifestMetadata Metadata { get; set; } = new ManifestMetadata();

        /// <summary>
        /// Spec value tree (dictionaries, lists, scalars).
        /// </summary>
        public Dictionary<string, object?> Spec { get; set; } = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Zero-based position in the submitted body.
        /// </summary>
        public int Index { get; set; } = 0;
    }
}
