namespace Garrison.Core.Security
{
    using System;
    using System.IO;
    using System.Net;

    /// <summary>
    /// Thrown when an outbound connection is refused because every address its host resolves to is blocked by
    /// <see cref="OutboundAddressPolicy"/>. HttpClient reports it as the inner exception of an HttpRequestException.
    /// </summary>
    public class OutboundAddressBlockedException : IOException
    {
        #region Public-Members

        /// <summary>
        /// Host name or address the caller asked for.
        /// </summary>
        public string Host { get; }

        /// <summary>
        /// The first refused address, or null when the host resolved to nothing usable.
        /// </summary>
        public IPAddress? Address { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="host">Host name or address.</param>
        /// <param name="address">The first refused address, or null.</param>
        /// <param name="message">Message naming the host and why it was refused.</param>
        public OutboundAddressBlockedException(string host, IPAddress? address, string message) : base(message)
        {
            Host = host ?? String.Empty;
            Address = address;
        }

        #endregion
    }
}
