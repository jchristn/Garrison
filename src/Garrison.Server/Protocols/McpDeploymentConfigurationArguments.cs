namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed deployment management arguments.</summary>
    public class McpDeploymentConfigurationArguments
    {
        /// <summary>Existing deployment identifier for reads, replacements, and deletion.</summary>
        public string? DeploymentId { get; set; } = null;
        /// <summary>Full deployment configuration for creation or replacement.</summary>
        public Deployment? Configuration { get; set; } = null;
    }
}
