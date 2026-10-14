namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_pipeline_runs.</summary>
    public class McpPipelineRunListArguments
    {
        /// <summary>Optional pipeline identifier or name. Null lists runs of every pipeline.</summary>
        public string? Pipeline { get; set; } = null;

        /// <summary>Optional status: Running, AwaitingReview, Cancelling, Succeeded, Failed, Cancelled, or TimedOut.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
