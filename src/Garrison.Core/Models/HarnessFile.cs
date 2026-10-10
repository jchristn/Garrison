namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of HarnessProfile: files materialized before launch.
    /// </summary>
    public class HarnessFile
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewHarnessFileId() : value;
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
        /// Base directory.
        /// </summary>
        public FileBaseDirectoryEnum BaseDirectory { get; set; } = FileBaseDirectoryEnum.Config;

        /// <summary>
        /// Relative path template.
        /// </summary>
        public string PathTemplate
        {
            get
            {
                return _PathTemplate;
            }
            set
            {
                _PathTemplate = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Content template. May include another template with {{> name}}.
        /// </summary>
        public string ContentTemplate
        {
            get
            {
                return _ContentTemplate;
            }
            set
            {
                _ContentTemplate = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional condition template.
        /// </summary>
        public string? Condition { get; set; } = null;

        /// <summary>
        /// Optional octal file mode, for example 600.
        /// </summary>
        public string? Mode { get; set; } = null;

        /// <summary>
        /// Whether the content is secret.
        /// </summary>
        public bool IsSecret { get; set; } = false;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewHarnessFileId();
        private string _HarnessProfileId = String.Empty;
        private string _PathTemplate = String.Empty;
        private string _ContentTemplate = String.Empty;

        #endregion
    }
}
