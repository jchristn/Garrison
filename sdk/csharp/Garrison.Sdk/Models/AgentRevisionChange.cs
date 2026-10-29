namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One field difference between two agent revisions.
    /// </summary>
    public class AgentRevisionChange
    {
        #region Public-Members

        /// <summary>
        /// Field name.
        /// </summary>
        public string Field
        {
            get
            {
                return _Field;
            }
            set
            {
                _Field = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Changed, Added, or Removed.
        /// </summary>
        public RevisionChangeTypeEnum ChangeType { get; set; } = RevisionChangeTypeEnum.Changed;

        /// <summary>
        /// Value in the earlier revision, or null.
        /// </summary>
        public string? From { get; set; } = null;

        /// <summary>
        /// Value in the later revision, or null.
        /// </summary>
        public string? To { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Field = String.Empty;

        #endregion
    }
}
