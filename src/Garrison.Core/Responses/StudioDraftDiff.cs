namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A draft compared with live configuration and validated by a manifest dry run (AD7.2).
    /// </summary>
    public class StudioDraftDiff
    {
        /// <summary>
        /// Draft identifier.
        /// </summary>
        public string DraftId { get; set; } = String.Empty;

        /// <summary>
        /// Draft version compared.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Whether every item validated and nothing is stale.
        /// </summary>
        public bool Valid { get; set; } = false;

        /// <summary>
        /// Items, in apply order.
        /// </summary>
        public List<StudioDraftDiffItem> Items { get; set; } = new List<StudioDraftDiffItem>();
    }
}
