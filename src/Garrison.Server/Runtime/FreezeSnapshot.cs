namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// The active freezes of one tenant as <see cref="FreezeService"/> last read them (AA3.2). Immutable once built.
    /// </summary>
    public class FreezeSnapshot
    {
        /// <summary>
        /// Active freezes, oldest first.
        /// </summary>
        public IReadOnlyList<Freeze> Freezes { get; }

        /// <summary>
        /// When they were read (UTC).
        /// </summary>
        public DateTime LoadedUtc { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="freezes">Active freezes.</param>
        /// <param name="loadedUtc">When they were read (UTC).</param>
        /// <exception cref="ArgumentNullException">Thrown when freezes is null.</exception>
        public FreezeSnapshot(List<Freeze> freezes, DateTime loadedUtc)
        {
            if (freezes == null) throw new ArgumentNullException(nameof(freezes));
            Freezes = freezes.AsReadOnly();
            LoadedUtc = loadedUtc;
        }
    }
}
