namespace Garrison.Core.Manifests
{
    using System;

    /// <summary>
    /// A manifest resource named by kind and name (P12.21): an export selector (<c>Agent/triage</c>) or a built-in a
    /// bundle requires.
    /// </summary>
    public class ManifestResourceReference
    {
        #region Public-Members

        /// <summary>
        /// Kind, such as Agent or HarnessProfile. Never null.
        /// </summary>
        public string Kind
        {
            get
            {
                return _Kind;
            }
            set
            {
                _Kind = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name. Never null.
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

        #endregion

        #region Private-Members

        private string _Kind = String.Empty;
        private string _Name = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public ManifestResourceReference()
        {
        }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="name">Name.</param>
        public ManifestResourceReference(string kind, string name)
        {
            Kind = kind;
            Name = name;
        }

        /// <summary>
        /// Parse <c>Kind/name</c>, splitting on the first slash so names may contain slashes.
        /// </summary>
        /// <param name="text">Selector text.</param>
        /// <returns>Reference, or null when the text has no kind or no name.</returns>
        public static ManifestResourceReference? TryParse(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return null;
            string trimmed = text.Trim();
            int slash = trimmed.IndexOf('/');
            if (slash <= 0 || slash == trimmed.Length - 1) return null;
            return new ManifestResourceReference(trimmed.Substring(0, slash).Trim(), trimmed.Substring(slash + 1).Trim());
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The reference as <c>Kind/name</c>.
        /// </summary>
        /// <returns>Text.</returns>
        public override string ToString()
        {
            return _Kind + "/" + _Name;
        }

        #endregion
    }
}
