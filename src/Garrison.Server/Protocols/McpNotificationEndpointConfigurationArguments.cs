namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed notification endpoint management tool arguments (P12.14). Tenant identity comes from the authenticated caller.</summary>
    public class McpNotificationEndpointConfigurationArguments
    {
        /// <summary>Existing endpoint identifier or name for reads, replacements, and deletion. Null for creation.</summary>
        public string? Endpoint { get; set; } = null;

        /// <summary>Full endpoint configuration for creation or replacement. Null for reads and deletion.</summary>
        public NotificationEndpoint? Configuration { get; set; } = null;
    }
}
