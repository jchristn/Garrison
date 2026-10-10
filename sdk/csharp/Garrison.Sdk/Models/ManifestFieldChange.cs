namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One field change reported for an Updated manifest item, by an apply or a dry run.
    /// </summary>
    public class ManifestFieldChange
    {
        #region Public-Members

        /// <summary>
        /// Field name, for example systemPrompt or parameters.model.
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
        /// Value before the change, as a string truncated to 200 characters. Null when the field had no value.
        /// </summary>
        public string? Before { get; set; } = null;

        /// <summary>
        /// Value after the change, as a string truncated to 200 characters. Null when the field has no value.
        /// </summary>
        public string? After { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Field = String.Empty;

        #endregion
    }
}
