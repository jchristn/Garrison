namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Create or change an agent architect. On update, a null ArchitectPromptTemplateId keeps the current prompt, and
    /// deployment settings this request does not name are kept. Not thread-safe.
    /// </summary>
    public class ArchitectRequest
    {
        #region Public-Members

        /// <summary>
        /// Deployment name, unique in the tenant (409 NameConflict otherwise). Required. Never null.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Harness profile identifier, for example hrn_builtin_fake. Required. Never null.
        /// </summary>
        public string HarnessProfileId
        {
            get
            {
                return _HarnessProfileId;
            }
            set
            {
                _HarnessProfileId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Model, or null for the harness default.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// True when the architect accepts runs. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Identifier or name of a System template the tenant can read (400 InvalidArchitectPrompt otherwise). Null binds
        /// builtin/agent-architect on create and keeps the current prompt on update.
        /// </summary>
        public string? ArchitectPromptTemplateId { get; set; } = null;

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

        /// <summary>
        /// Identifier or name of an active secret in the tenant that the architect's harness signs in with, bound to its
        /// deployment under the alias "credential" (400 InvalidCredentialSecret otherwise). Null binds none on create and
        /// keeps the current one on update (null is not sent); an empty string on update removes it.
        /// </summary>
        public string? CredentialSecretId { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;
        private string _HarnessProfileId = String.Empty;
        private int? _ArchitectPromptVersion = null;

        #endregion
    }
}
