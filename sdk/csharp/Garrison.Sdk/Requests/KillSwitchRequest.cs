namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Turning the autonomy kill switch on or off.
    /// </summary>
    public class KillSwitchRequest
    {
        /// <summary>
        /// True to turn the switch on, false to turn it off. Required by the server.
        /// </summary>
        public bool? Enabled { get; set; } = null;

        /// <summary>
        /// Why, or null. At most 2000 characters. Kept with the switch while it is on.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
