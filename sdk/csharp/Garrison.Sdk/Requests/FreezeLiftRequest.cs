namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Lifting an active freeze. A frozen keeper becomes Active again with its next wake spread over a short window.
    /// </summary>
    public class FreezeLiftRequest
    {
        /// <summary>
        /// Why it was lifted, or null. At most 8000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
