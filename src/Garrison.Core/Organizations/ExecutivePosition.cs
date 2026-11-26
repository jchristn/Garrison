namespace Garrison.Core.Organizations
{
    using System;

    /// <summary>
    /// Where an executive sits (AA8.1): the live unit its agent leads, resolved for a deployment with managementAccess
    /// OrgSubtree. Not thread-safe.
    /// </summary>
    public class ExecutivePosition
    {
        #region Public-Members

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name.
        /// </summary>
        public string OrganizationName { get; set; } = String.Empty;

        /// <summary>
        /// The unit the executive leads.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// The unit's name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// The executive's agent.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// The executive's deployment.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        #endregion
    }
}
