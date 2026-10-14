namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A manifest_apply_warnings row as read from the database: the warning and the item it belongs to.
    /// </summary>
    public class FieldWarningRow
    {
        /// <summary>
        /// Owning manifest apply item identifier.
        /// </summary>
        public string ItemId { get; set; } = String.Empty;

        /// <summary>
        /// The warning.
        /// </summary>
        public FieldWarning Warning { get; set; } = new FieldWarning();
    }
}
