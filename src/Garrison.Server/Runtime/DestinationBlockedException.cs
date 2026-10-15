namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A notification destination was refused by the SSRF rules when the delivery connected (P12.14): the host resolved
    /// only to refused addresses, or did not resolve at all.
    /// </summary>
    public class DestinationBlockedException : Exception
    {
        #region Public-Members

        /// <summary>
        /// Why the destination was refused.
        /// </summary>
        public DestinationBlockReasonEnum Reason { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="reason">Reason.</param>
        /// <param name="message">Message.</param>
        public DestinationBlockedException(DestinationBlockReasonEnum reason, string message) : base(message)
        {
            Reason = reason;
        }

        #endregion
    }
}
