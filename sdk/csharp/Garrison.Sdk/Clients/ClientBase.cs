namespace Garrison.Sdk.Clients
{
    using System;
    using Garrison.Sdk.Http;

    /// <summary>
    /// Base for SDK modules: holds the transport and builds tenant-scoped paths.
    /// </summary>
    public abstract class ClientBase
    {
        #region Public-Members

        /// <summary>
        /// Transport.
        /// </summary>
        public GarrisonTransport Transport { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        /// <exception cref="ArgumentNullException">Thrown when transport is null.</exception>
        protected ClientBase(GarrisonTransport transport)
        {
            Transport = transport ?? throw new ArgumentNullException(nameof(transport));
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Tenant-scoped path.
        /// </summary>
        /// <param name="suffix">Suffix beginning with a slash.</param>
        /// <returns>Path.</returns>
        /// <exception cref="InvalidOperationException">Thrown when no tenant is set.</exception>
        protected string TenantPath(string suffix)
        {
            if (String.IsNullOrEmpty(Transport.TenantId)) throw new InvalidOperationException("Set TenantId on the client (or log in) before calling tenant-scoped APIs.");
            return "/v1.0/api/tenants/" + Uri.EscapeDataString(Transport.TenantId) + suffix;
        }

        /// <summary>
        /// Escape a path segment.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>Escaped value.</returns>
        /// <exception cref="ArgumentNullException">Thrown when value is null or empty.</exception>
        protected static string Segment(string value)
        {
            if (String.IsNullOrEmpty(value)) throw new ArgumentNullException(nameof(value));
            return Uri.EscapeDataString(value);
        }

        #endregion
    }
}
