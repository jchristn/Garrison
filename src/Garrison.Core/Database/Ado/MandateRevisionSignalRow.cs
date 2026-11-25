namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A mandate_revision_signals row as read from the database: the signal and the revision it belongs to.
    /// </summary>
    public class MandateRevisionSignalRow
    {
        /// <summary>
        /// Owning revision identifier.
        /// </summary>
        public string RevisionId { get; set; } = String.Empty;

        /// <summary>
        /// The signal, with its order.
        /// </summary>
        public MandateRevisionSignal Signal { get; set; } = new MandateRevisionSignal();
    }
}
