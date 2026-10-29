namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One field-level difference between two agent revisions (AD1.2).
    /// </summary>
    public class AgentRevisionChange
    {
        #region Public-Members

        /// <summary>
        /// Field name in camelCase, for example description, outputSchemaJson, delegationAllowList, or promptPins.
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
        /// Kind of change: Changed for a scalar field, Added or Removed for a list entry.
        /// </summary>
        public RevisionChangeTypeEnum ChangeType { get; set; } = RevisionChangeTypeEnum.Changed;

        /// <summary>
        /// Value in the older revision (null when absent or for Added).
        /// </summary>
        public string? From { get; set; } = null;

        /// <summary>
        /// Value in the newer revision (null when absent or for Removed).
        /// </summary>
        public string? To { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Field = String.Empty;

        #endregion
    }
}
