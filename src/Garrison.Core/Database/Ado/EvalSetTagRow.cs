namespace Garrison.Core.Database.Ado
{
    using System;

    /// <summary>
    /// An eval set tag with the set version it belongs to, used while loading sets (AA9.2).
    /// </summary>
    public class EvalSetTagRow
    {
        /// <summary>
        /// Set identifier.
        /// </summary>
        public string SetId { get; set; } = String.Empty;

        /// <summary>
        /// Tag.
        /// </summary>
        public string Tag { get; set; } = String.Empty;
    }
}
