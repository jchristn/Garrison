namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One deployment a promotion repinned (AD1.4), with the pin it replaced so a rollback can restore it exactly.
    /// </summary>
    public class PromotionRecordItem
    {
        #region Public-Members

        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string DeploymentId
        {
            get
            {
                return _DeploymentId;
            }
            set
            {
                _DeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment name at the time of the promotion.
        /// </summary>
        public string DeploymentName { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier of the deployment.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// The deployment's revision pin before the promotion, or null when it followed the latest published revision.
        /// </summary>
        public string? PreviousRevisionId { get; set; } = null;

        /// <summary>
        /// The revision pin the promotion wrote.
        /// </summary>
        public string? NewRevisionId { get; set; } = null;

        #endregion

        #region Private-Members

        private string _DeploymentId = String.Empty;

        #endregion
    }
}
