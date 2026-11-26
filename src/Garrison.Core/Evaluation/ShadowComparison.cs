namespace Garrison.Core.Evaluation
{
    using System;

    /// <summary>
    /// The result of comparing a shadow run's output with its source run's output (AA9.7). Not thread-safe.
    /// </summary>
    public class ShadowComparison
    {
        #region Public-Members

        /// <summary>
        /// True when the outputs agree; false when they diverge. Default false.
        /// </summary>
        public bool Agreed { get; set; } = false;

        /// <summary>
        /// Short note on why, at most 2000 characters (longer values are cut), or null.
        /// </summary>
        public string? Note
        {
            get
            {
                return _Note;
            }
            set
            {
                _Note = value == null ? null : (value.Length > 2000 ? value.Substring(0, 2000) : value);
            }
        }

        #endregion

        #region Private-Members

        private string? _Note = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public ShadowComparison()
        {
        }

        /// <summary>
        /// Instantiate with a result.
        /// </summary>
        /// <param name="agreed">Whether the outputs agree.</param>
        /// <param name="note">Note, or null.</param>
        public ShadowComparison(bool agreed, string? note)
        {
            Agreed = agreed;
            Note = note;
        }

        #endregion
    }
}
