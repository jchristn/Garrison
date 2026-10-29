namespace Garrison.Core.Manifests
{
    using System;

    /// <summary>
    /// One member of an AgenticApp manifest (AD6.11).
    /// </summary>
    public class AppMemberSpec
    {
        /// <summary>
        /// Agent name.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// What the member does in the app, or null.
        /// </summary>
        public string? Role { get; set; } = null;
    }
}
