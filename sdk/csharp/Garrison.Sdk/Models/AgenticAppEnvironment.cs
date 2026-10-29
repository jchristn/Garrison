namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// The entry deployment an agentic app uses in one environment. Not thread-safe.
    /// </summary>
    public class AgenticAppEnvironment
    {
        #region Public-Members

        /// <summary>
        /// Environment name, for example dev, staging, or prod. Default dev. Never null.
        /// </summary>
        public string Environment
        {
            get
            {
                return _Environment;
            }
            set
            {
                _Environment = value ?? "dev";
            }
        }

        /// <summary>
        /// Deployment of the entry agent that serves the app in this environment, or null when none is assigned (the app
        /// UI then answers 409 AppNotDeployed for that environment).
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Environment = "dev";

        #endregion
    }
}
