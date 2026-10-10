namespace Garrison.Core.Responses
{
    using System.Collections.Generic;

    /// <summary>
    /// Distinct agents, harnesses, deployments, and served models among a tenant's runs in a range, used to populate
    /// analytics filters (plan section 10.6).
    /// </summary>
    public class RunAnalyticsDimensions
    {
        /// <summary>
        /// Agents that ran in the range, ordered by name.
        /// </summary>
        public List<RunAnalyticsAgentDimension> Agents { get; set; } = new List<RunAnalyticsAgentDimension>();

        /// <summary>
        /// Harness types that ran in the range, ordered by name.
        /// </summary>
        public List<string> Harnesses { get; set; } = new List<string>();

        /// <summary>
        /// Deployments that ran in the range, ordered by name.
        /// </summary>
        public List<RunAnalyticsDeploymentDimension> Deployments { get; set; } = new List<RunAnalyticsDeploymentDimension>();

        /// <summary>
        /// Served models seen in the range, ordered by name. Runs that recorded no model appear as "unknown".
        /// </summary>
        public List<string> Models { get; set; } = new List<string>();

        /// <summary>
        /// True when the range held more runs than the analytics cap and only the newest were examined.
        /// </summary>
        public bool Truncated { get; set; } = false;
    }
}
