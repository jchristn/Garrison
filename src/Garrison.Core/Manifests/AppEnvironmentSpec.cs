namespace Garrison.Core.Manifests
{
    using System;

    /// <summary>
    /// The entry deployment of an AgenticApp manifest for one environment (AD6.11).
    /// </summary>
    public class AppEnvironmentSpec
    {
        /// <summary>
        /// Environment label.
        /// </summary>
        public string Environment { get; set; } = String.Empty;

        /// <summary>
        /// Entry agent deployment name, or null for the entry agent's deployment in the environment.
        /// </summary>
        public string? Deployment { get; set; } = null;
    }
}
