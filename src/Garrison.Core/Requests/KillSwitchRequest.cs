namespace Garrison.Core.Requests
{
    /// <summary>
    /// Turning the autonomy kill switch on or off (AA3).
    /// </summary>
    public class KillSwitchRequest
    {
        /// <summary>
        /// True stops keeper ticks in the tenant; false lets them resume. Required.
        /// </summary>
        public bool? Enabled { get; set; } = null;

        /// <summary>
        /// Why, or null. At most 2000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
