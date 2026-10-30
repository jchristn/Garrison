namespace Garrison.Sdk.Models
{
    using System;
    using System.Text.Json;
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
        /// Value in the earlier revision as a JSON value, or null. An object for the inputSchema and outputSchema fields,
        /// a string for every other field.
        /// </summary>
        public JsonElement? From { get; set; } = null;

        /// <summary>
        /// Value in the later revision as a JSON value, or null. An object for the inputSchema and outputSchema fields, a
        /// string for every other field.
        /// </summary>
        public JsonElement? To { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Field = String.Empty;

        #endregion
    }
}
