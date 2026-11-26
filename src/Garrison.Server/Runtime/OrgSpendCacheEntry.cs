namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// A subtree's spend in one budget window as <see cref="OrgBudgetGuard"/> last read it. Immutable.
    /// </summary>
    public class OrgSpendCacheEntry
    {
        /// <summary>
        /// Spend in US dollars.
        /// </summary>
        public double SpentUsd { get; }

        /// <summary>
        /// When it was read (UTC).
        /// </summary>
        public DateTime LoadedUtc { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="spentUsd">Spend in US dollars.</param>
        /// <param name="loadedUtc">When it was read (UTC).</param>
        public OrgSpendCacheEntry(double spentUsd, DateTime loadedUtc)
        {
            SpentUsd = spentUsd;
            LoadedUtc = loadedUtc;
        }
    }
}
