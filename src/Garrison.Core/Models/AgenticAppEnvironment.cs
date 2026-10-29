namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Which deployment of the entry agent an app uses in one environment (AD6.1). The app UI starts conversations on
    /// the deployment of the app's live environment.
    /// </summary>
    public class AgenticAppEnvironment
    {
        /// <summary>
        /// Environment label, one of the tenant's environments.
        /// </summary>
        public string Environment { get; set; } = "dev";

        /// <summary>
        /// Entry agent deployment for this environment, or null for the entry agent's weighted selection among its
        /// deployments in the environment.
        /// </summary>
        public string? DeploymentId { get; set; } = null;
    }
}
