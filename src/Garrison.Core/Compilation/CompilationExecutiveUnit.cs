namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// A unit below an executive as its system prompt shows it (AA8.8). Not thread-safe.
    /// </summary>
    public class CompilationExecutiveUnit
    {
        /// <summary>
        /// Unit name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Parent unit name.
        /// </summary>
        public string ParentName { get; set; } = String.Empty;

        /// <summary>
        /// Lead agent name, or null.
        /// </summary>
        public string? LeadName { get; set; } = null;

        /// <summary>
        /// Members other than the lead.
        /// </summary>
        public long MemberCount { get; set; } = 0;
    }
}
