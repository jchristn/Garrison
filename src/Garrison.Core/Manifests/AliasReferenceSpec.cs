namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Deployment resource binding by alias and resource name.
    /// </summary>
    public class AliasReferenceSpec
    {
        /// <summary>
        /// Alias used in templates.
        /// </summary>
        public string Alias { get; set; } = String.Empty;

        /// <summary>
        /// Secret name (for secret bindings).
        /// </summary>
        public string? Secret { get; set; } = null;

        /// <summary>
        /// MCP server name (for MCP server bindings).
        /// </summary>
        public string? Server { get; set; } = null;
    }
}
