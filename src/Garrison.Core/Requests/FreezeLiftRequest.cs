namespace Garrison.Core.Requests
{
    /// <summary>
    /// Lifting a freeze (AA3).
    /// </summary>
    public class FreezeLiftRequest
    {
        /// <summary>
        /// Why the freeze was lifted, or null. Kept with the freeze; at most 2000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
