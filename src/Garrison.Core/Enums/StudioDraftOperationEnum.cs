namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a draft item does to live configuration when the draft is applied (AD7.1).
    /// </summary>
    public enum StudioDraftOperationEnum
    {
        /// <summary>
        /// Create the record or update it to the item's document.
        /// </summary>
        Upsert,

        /// <summary>
        /// Delete the live record of the item's kind and name.
        /// </summary>
        Delete
    }
}
