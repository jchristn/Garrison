namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A promotion record item row with the identifier of the record it belongs to, used while loading items for a page
    /// of records.
    /// </summary>
    public class PromotionItemRow
    {
        /// <summary>
        /// Promotion record identifier.
        /// </summary>
        public string PromotionId { get; set; } = String.Empty;

        /// <summary>
        /// Item.
        /// </summary>
        public PromotionRecordItem Item { get; set; } = new PromotionRecordItem();
    }
}
