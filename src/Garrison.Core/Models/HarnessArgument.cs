namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of HarnessProfile: ordered argument templates.
    /// </summary>
    public class HarnessArgument
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewHarnessArgumentId() : value;
            }
        }

        /// <summary>
        /// Parent HarnessProfile identifier.
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
        /// Zero-based position.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Argument template. Renders to one argv entry.
        /// </summary>
        public string Template
        {
            get
            {
                return _Template;
            }
            set
            {
                _Template = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional condition template; the argument is skipped when it renders empty or false.
        /// </summary>
        public string? Condition { get; set; } = null;

        /// <summary>
        /// Optional list variable; the argument is emitted once per element.
        /// </summary>
        public string? RepeatOver { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewHarnessArgumentId();
        private string _HarnessProfileId = String.Empty;
        private string _Template = String.Empty;

        #endregion
    }
}
