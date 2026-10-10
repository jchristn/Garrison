namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// A deployment seen in a run analytics range.
    /// </summary>
    public class RunAnalyticsDeploymentDimension
    {
        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Deployment name, or the identifier when the deployment no longer exists.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Identifier of the agent the deployment belongs to.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;
    }
}
