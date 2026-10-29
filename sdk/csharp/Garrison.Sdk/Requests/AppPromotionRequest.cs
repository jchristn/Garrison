namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Promote a published app revision from one environment to the next. Every member's pinned revision moves to every
    /// deployment of that member in the target environment together, under one promotion record.
    /// </summary>
    public class AppPromotionRequest
    {
        #region Public-Members

        /// <summary>
        /// Environment to promote from. Required. Never null.
        /// </summary>
        public string SourceEnvironment
        {
            get
            {
                return _SourceEnvironment;
            }
            set
            {
                _SourceEnvironment = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Environment to promote to, or null for the environment after the source.
        /// </summary>
        public string? TargetEnvironment { get; set; } = null;

        /// <summary>
        /// App revision identifier (prefix apv_) or number, or null for the latest published app revision.
        /// </summary>
        public string? AppRevision { get; set; } = null;

        /// <summary>
        /// Whether the target may skip intermediate environments. Default false.
        /// </summary>
        public bool AllowSkip { get; set; } = false;

        /// <summary>
        /// Optional note recorded on the promotion record, or null.
        /// </summary>
        public string? Note { get; set; } = null;

        #endregion

        #region Private-Members

        private string _SourceEnvironment = String.Empty;

        #endregion
    }
}
