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
        /// Agents covered by an OrgUnit or Organization freeze (AA7.7), with the freeze that covers each, from the live
        /// revisions when the snapshot was read.
        /// </summary>
        public IReadOnlyDictionary<string, Freeze> OrgAgents { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="freezes">Active freezes.</param>
        /// <param name="loadedUtc">When they were read (UTC).</param>
        /// <param name="orgAgents">Agents covered by organization freezes, or null for none.</param>
        /// <exception cref="ArgumentNullException">Thrown when freezes is null.</exception>
        public FreezeSnapshot(List<Freeze> freezes, DateTime loadedUtc, Dictionary<string, Freeze>? orgAgents = null)
        {
            if (freezes == null) throw new ArgumentNullException(nameof(freezes));
            Freezes = freezes.AsReadOnly();
            LoadedUtc = loadedUtc;
            OrgAgents = orgAgents ?? new Dictionary<string, Freeze>(StringComparer.Ordinal);
        }
    }
}
