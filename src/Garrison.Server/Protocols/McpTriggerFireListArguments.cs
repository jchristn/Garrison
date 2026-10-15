namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_trigger_fires (P12.5).</summary>
    public class McpTriggerFireListArguments
    {
        /// <summary>Trigger identifier or name. Required.</summary>
        public string? Trigger { get; set; } = null;

        /// <summary>Optional outcome: Started, Failed, or Skipped.</summary>
        public string? Outcome { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
