namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Deployment resource bindings in a manifest.
    /// </summary>
    public class DeploymentResourcesSpec
    {
        /// <summary>
        /// Secret bindings.
        /// </summary>
        public List<AliasReferenceSpec> Secrets { get; set; } = new List<AliasReferenceSpec>();

        /// <summary>
        /// MCP server bindings.
        /// </summary>
        public List<AliasReferenceSpec> McpServers { get; set; } = new List<AliasReferenceSpec>();
    }
}
