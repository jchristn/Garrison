namespace Garrison.Core.Requests
{
    /// <summary>
    /// Cancellation of an escalation (AA2). A run blocked on it is cancelled too.
    /// </summary>
    public class EscalationCancelRequest
    {
        /// <summary>
        /// Why it was cancelled, or null. Kept with the escalation; at most 8000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
