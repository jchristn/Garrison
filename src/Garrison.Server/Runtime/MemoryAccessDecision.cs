namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Outcome of a MemoryAccessPolicy check (AA4.5). Immutable; thread-safe.
    /// </summary>
    public class MemoryAccessDecision
    {
        #region Public-Members

        /// <summary>
        /// Whether the access is allowed.
        /// </summary>
        public bool Permitted { get; }

        /// <summary>
        /// Error code when refused: Forbidden, OrganizationsUnavailable, or ScopedMemoryDisabled. Empty when allowed.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Why it was refused. Empty when allowed.
        /// </summary>
        public string Reason { get; }

        #endregion

        #region Constructors-and-Factories

        private MemoryAccessDecision(bool permitted, string code, string reason)
        {
            Permitted = permitted;
            Code = code;
            Reason = reason;
        }

        /// <summary>
        /// An allowed access.
        /// </summary>
        /// <returns>Decision.</returns>
        public static MemoryAccessDecision Allow()
        {
            return new MemoryAccessDecision(true, String.Empty, String.Empty);
        }

        /// <summary>
        /// A refused access.
        /// </summary>
        /// <param name="code">Error code.</param>
        /// <param name="reason">Reason.</param>
        /// <returns>Decision.</returns>
        public static MemoryAccessDecision Deny(string code, string reason)
        {
            return new MemoryAccessDecision(false, code ?? "Forbidden", reason ?? String.Empty);
        }

        #endregion
    }
}
