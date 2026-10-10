namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Distinct agents, harnesses, deployments, and served models among a tenant's runs in a range. Lists are sorted by name and never null.
    /// </summary>
    public class RunAnalyticsDimensions
    {
        /// <summary>
        /// Agents with runs in the range.
        /// </summary>
        public List<RunAnalyticsAgentDimension> Agents
        {
            get
            {
                return _Agents;
            }
            set
            {
                _Agents = value ?? new List<RunAnalyticsAgentDimension>();
            }
        }

        /// <summary>
        /// Harness types with runs in the range (for example ClaudeCode, Codex, Generic).
        /// </summary>
        public List<string> Harnesses
        {
            get
            {
                return _Harnesses;
            }
            set
            {
                _Harnesses = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Deployments with runs in the range.
        /// </summary>
        public List<RunAnalyticsDeploymentDimension> Deployments
        {
            get
            {
                return _Deployments;
            }
            set
            {
                _Deployments = value ?? new List<RunAnalyticsDeploymentDimension>();
            }
        }

        /// <summary>
        /// Served models with runs in the range; "unknown" stands for runs without a recorded model.
        /// </summary>
        public List<string> Models
        {
            get
            {
                return _Models;
            }
            set
            {
                _Models = value ?? new List<string>();
            }
        }

        /// <summary>
        /// True when the range held more runs than the server's analytics cap (100,000) and only the first runs were scanned.
        /// </summary>
        public bool Truncated { get; set; } = false;

        private List<RunAnalyticsAgentDimension> _Agents = new List<RunAnalyticsAgentDimension>();
        private List<string> _Harnesses = new List<string>();
        private List<RunAnalyticsDeploymentDimension> _Deployments = new List<RunAnalyticsDeploymentDimension>();
        private List<string> _Models = new List<string>();
    }
}
