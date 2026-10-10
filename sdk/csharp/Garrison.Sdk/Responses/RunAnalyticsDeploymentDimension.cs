namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// A deployment that has runs in an analytics range.
    /// </summary>
    public class RunAnalyticsDeploymentDimension
    {
        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment name; the identifier when the deployment no longer exists.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Identifier of the agent the deployment's runs belong to.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
    }
}
