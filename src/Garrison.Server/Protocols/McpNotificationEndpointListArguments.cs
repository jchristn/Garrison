namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_notification_endpoints (P12.14).</summary>
    public class McpNotificationEndpointListArguments
    {
        /// <summary>Optional part of an endpoint name. Null lists every endpoint.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
