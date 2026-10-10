namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One field a manifest apply changes (or, in a dry run, would change) on an existing resource. Values are text,
    /// truncated to <see cref="MaxValueLength"/> characters; secret values are never shown.
    /// </summary>
    public class ManifestFieldChange
    {
        #region Public-Members

        /// <summary>
        /// Maximum characters kept in Before and After: 200. Longer values end with "...".
        /// </summary>
        public static readonly int MaxValueLength = 200;

        /// <summary>
        /// Field path within the document spec, for example content, model, or resources.secrets[0].secret.
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
        /// Value before the change as text; null when the field was not set.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? Before
        {
            get
            {
                return _Before;
            }
            set
            {
                _Before = Truncate(value);
            }
        }

        /// <summary>
        /// Value after the change as text; null when the field is removed.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? After
        {
            get
            {
                return _After;
            }
            set
            {
                _After = Truncate(value);
            }
        }

        #endregion

        #region Private-Members

        private string _Field = String.Empty;
        private string? _Before = null;
        private string? _After = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public ManifestFieldChange()
        {
        }

        /// <summary>
        /// Instantiate with values.
        /// </summary>
        /// <param name="field">Field path.</param>
        /// <param name="before">Value before, or null.</param>
        /// <param name="after">Value after, or null.</param>
        public ManifestFieldChange(string field, string? before, string? after)
        {
            Field = field;
            Before = before;
            After = after;
        }

        #endregion

        #region Private-Methods

        private static string? Truncate(string? value)
        {
            if (value == null || value.Length <= MaxValueLength) return value;
            return value.Substring(0, MaxValueLength - 3) + "...";
        }

        #endregion
    }
}
