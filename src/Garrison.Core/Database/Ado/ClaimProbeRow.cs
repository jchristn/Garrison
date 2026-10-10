namespace Garrison.Core.Database.Ado
{
    using System;

    /// <summary>
    /// Status and epoch of a run read back inside a claim transaction.
    /// </summary>
    public class ClaimProbeRow
    {
        /// <summary>
        /// Run status.
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// Lease epoch.
        /// </summary>
        public long Epoch { get; set; } = 0;
    }
}
