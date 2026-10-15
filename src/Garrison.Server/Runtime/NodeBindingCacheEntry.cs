namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// A cached node-to-credential binding (<see cref="NodeBindingCache"/>). Not thread-safe; entries are replaced, never
    /// changed after they are cached.
    /// </summary>
    public class NodeBindingCacheEntry
    {
        #region Public-Members

        /// <summary>
        /// Credential the node is bound to, or null when it was registered without one.
        /// </summary>
        public string? CredentialId { get; set; } = null;

        /// <summary>
        /// Node name, for error messages.
        /// </summary>
        public string NodeName { get; set; } = String.Empty;

        /// <summary>
        /// When the entry stops being used.
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.MinValue;

        #endregion
    }
}
