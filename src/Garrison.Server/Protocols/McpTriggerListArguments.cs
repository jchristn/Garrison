namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_triggers (P12.5).</summary>
    public class McpTriggerListArguments
    {
        /// <summary>Optional part of a trigger name. Null lists every trigger.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Optional type: Cron or Webhook.</summary>
        public string? Type { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
