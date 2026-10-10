namespace Garrison.Core.Models
{
    /// <summary>
    /// Outcome of an atomic run claim.
    /// </summary>
    public class ClaimResult
    {
        #region Public-Members

        /// <summary>
        /// New fencing epoch when the claim won; null otherwise.
        /// </summary>
        public long? Epoch { get; set; } = null;

        /// <summary>
        /// True when the claim lost because the deployment already had its maximum number of active runs.
        /// False when it won or when another claimer took the run first.
        /// </summary>
        public bool LimitReached { get; set; } = false;

        /// <summary>
        /// Whether the claim won.
        /// </summary>
        public bool Claimed
        {
            get
            {
                return Epoch.HasValue;
            }
        }

        #endregion
    }
}
