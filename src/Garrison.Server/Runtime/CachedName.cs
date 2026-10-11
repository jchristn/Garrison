namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// A display name cached with an expiry, used for metric labels. Immutable and thread-safe.
    /// </summary>
    public class CachedName
    {
        #region Public-Members

        /// <summary>
        /// Name.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// When the entry stops being trusted.
        /// </summary>
        public DateTime ExpiresUtc { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="expiresUtc">Expiry.</param>
        /// <exception cref="ArgumentNullException">Thrown when name is null.</exception>
        public CachedName(string name, DateTime expiresUtc)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            ExpiresUtc = expiresUtc;
        }

        #endregion
    }
}
