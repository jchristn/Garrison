namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Choose the System prompt of an architect deployment. Not thread-safe.
    /// </summary>
    public class ArchitectPromptRequest
    {
        #region Public-Members

        /// <summary>
        /// Template identifier or name of a System template the tenant can read (400 InvalidArchitectPrompt otherwise).
        /// Never null.
        /// </summary>
        public string ArchitectPromptTemplateId
        {
            get
            {
                return _ArchitectPromptTemplateId;
            }
            set
            {
                _ArchitectPromptTemplateId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Version to pin, or null to follow the template's current version on every turn. Minimum 1.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when set below 1.</exception>
        public int? ArchitectPromptVersion
        {
            get
            {
                return _ArchitectPromptVersion;
            }
            set
            {
                if (value.HasValue && value.Value < 1) throw new ArgumentOutOfRangeException(nameof(ArchitectPromptVersion), "ArchitectPromptVersion is 1 or more.");
                _ArchitectPromptVersion = value;
            }
        }

        #endregion

        #region Private-Members

        private string _ArchitectPromptTemplateId = String.Empty;
        private int? _ArchitectPromptVersion = null;

        #endregion
    }
}
