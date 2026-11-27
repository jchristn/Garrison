namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Body of a cascade cancel of an org unit (AA11.4).
    /// </summary>
    public class CascadeCancelRequest
    {
        /// <summary>
        /// Why, recorded on withdrawn escalations and in the audit record, or null. At most 1024 characters.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
