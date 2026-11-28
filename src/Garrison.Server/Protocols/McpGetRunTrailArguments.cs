namespace Garrison.Server.Protocols
{
    /// <summary>
    /// Typed garrison_get_run_trail arguments (LP1.7). Not thread-safe.
    /// </summary>
    public class McpGetRunTrailArguments
    {
        /// <summary>
        /// Run identifier (run_...). Required.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Whether to show each run's effect journal entries, or null for the RunTrail.IncludeEffects cluster setting
        /// (true by default).
        /// </summary>
        public bool? IncludeEffects { get; set; } = null;
    }
}
