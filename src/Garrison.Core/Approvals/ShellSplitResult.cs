namespace Garrison.Core.Approvals
{
    using System.Collections.Generic;

    /// <summary>
    /// A shell command line split into the simple commands an approval rule must cover (P12.3).
    /// </summary>
    public class ShellSplitResult
    {
        #region Public-Members

        /// <summary>
        /// Simple commands in order, trimmed, without the operators that joined them. Never null.
        /// </summary>
        public List<string> Commands { get; set; } = new List<string>();

        /// <summary>
        /// Whether the line contains command substitution or process substitution (a backtick, <c>$(</c>,
        /// <c>&lt;(</c>, or <c>&gt;(</c>) outside single quotes. Allow rules never cover such a line.
        /// </summary>
        public bool HasSubstitution { get; set; } = false;

        /// <summary>
        /// Whether a quote was left open. Allow rules never cover such a line.
        /// </summary>
        public bool Unbalanced { get; set; } = false;

        #endregion
    }
}
