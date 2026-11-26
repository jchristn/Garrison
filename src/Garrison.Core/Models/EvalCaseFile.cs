namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// A file placed in the run's working directory before an eval case runs (AA9.1). The content is either inline text
    /// (<see cref="ContentText"/>) or a file of an agent asset (<see cref="AssetId"/> and <see cref="AssetPath"/>), never
    /// both. Not thread-safe.
    /// </summary>
    public class EvalCaseFile
    {
        #region Public-Members

        /// <summary>
        /// Path relative to the working directory, with forward slashes, for example data/input.csv. No leading slash, no
        /// backslash, no "." or ".." segments; at most 512 characters.
        /// </summary>
        public string Path
        {
            get
            {
                return _Path;
            }
            set
            {
                _Path = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Media type, for example text/csv, or null to guess from the extension.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Inline text content, or null when the file comes from an asset.
        /// </summary>
        public string? ContentText { get; set; } = null;

        /// <summary>
        /// Agent asset (prefix aas_) holding the content, or null for inline content. The asset's latest version is used.
        /// </summary>
        public string? AssetId { get; set; } = null;

        /// <summary>
        /// Path of the file inside the asset, or null for inline content.
        /// </summary>
        public string? AssetPath { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Path = String.Empty;

        #endregion
    }
}
