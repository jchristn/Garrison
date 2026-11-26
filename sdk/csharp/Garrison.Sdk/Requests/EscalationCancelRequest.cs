namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Cancellation of an open escalation. A run blocked on it is cancelled too.
    /// </summary>
    public class EscalationCancelRequest
    {
        /// <summary>
        /// Why it was cancelled, or null. At most 8000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
