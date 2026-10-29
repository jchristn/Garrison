namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A System prompt an architect deployment can use, with the architect deployments that bind it. Not thread-safe.
    /// </summary>
    public class ArchitectPromptEntry
    {
        #region Public-Members

        /// <summary>
        /// Template identifier. Never null.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Template name, for example builtin/agent-architect. Never null.
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
        /// True for a template Garrison ships.
        /// </summary>
        public bool IsBuiltIn { get; set; } = false;

        /// <summary>
        /// The built-in this template is or was cloned from (for example agent-architect), or null.
        /// </summary>
        public string? BuiltInKey { get; set; } = null;

        /// <summary>
        /// Current version number. Default 1.
        /// </summary>
        public int CurrentVersion { get; set; } = 1;

        /// <summary>
        /// True for builtin/agent-architect, which a deployment of agent-architect binds when none is chosen.
        /// </summary>
        public bool IsDefault { get; set; } = false;

        /// <summary>
        /// Identifiers of the architect deployments that bind this template as their System prompt. Never null.
        /// </summary>
        public List<string> Deployments
        {
            get
            {
                return _Deployments;
            }
            set
            {
                _Deployments = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private List<string> _Deployments = new List<string>();

        #endregion
    }
}
