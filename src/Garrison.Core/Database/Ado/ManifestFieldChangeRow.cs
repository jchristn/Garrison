namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A manifest_apply_changes row as read from the database: the change and the item it belongs to.
    /// </summary>
    public class ManifestFieldChangeRow
    {
        /// <summary>
        /// Owning manifest apply item identifier.
        /// </summary>
        public string ItemId { get; set; } = String.Empty;

        /// <summary>
        /// The change.
        /// </summary>
        public ManifestFieldChange Change { get; set; } = new ManifestFieldChange();
    }
}
