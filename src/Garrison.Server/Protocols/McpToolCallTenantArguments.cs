namespace Garrison.Server.Protocols
{
    /// <summary>
    /// The administrator-only tenantId argument of a tools/call request. Other arguments are ignored here.
    /// </summary>
    public class McpToolCallTenantArguments
    {
        /// <summary>
        /// Tenant identifier a system administrator acts in; null when absent.
        /// </summary>
        public string? TenantId { get; set; } = null;
    }
}
