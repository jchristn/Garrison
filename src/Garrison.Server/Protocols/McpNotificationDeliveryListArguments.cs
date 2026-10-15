namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_notification_deliveries (P12.14).</summary>
    public class McpNotificationDeliveryListArguments
    {
        /// <summary>Endpoint identifier or name. Required.</summary>
        public string? Endpoint { get; set; } = null;

        /// <summary>Optional status: Pending, Delivering, Succeeded, or Failed.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
