namespace Garrison.Core.Requests
{
    /// <summary>
    /// Cancelling everything in an organization unit's subtree (AA11.4).
    /// </summary>
    public class CascadeCancelRequest
    {
        /// <summary>
        /// Why, or null. At most 1024 characters. Recorded in the audit record and as the reason on withdrawn escalations.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
