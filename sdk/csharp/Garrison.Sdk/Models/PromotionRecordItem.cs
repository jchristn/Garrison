namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One deployment changed by a promotion or rollback.
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
        /// Deployment name.
        /// </summary>
        public string? DeploymentName { get; set; } = null;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Revision pin before the change, or null when unpinned.
        /// </summary>
        public string? PreviousRevisionId { get; set; } = null;

        /// <summary>
        /// Revision pin after the change, or null when unpinned.
        /// </summary>
        public string? NewRevisionId { get; set; } = null;

        #endregion

        #region Private-Members

        private string _DeploymentId = String.Empty;

        #endregion
    }
}
