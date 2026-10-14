namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_pipeline_reviews.</summary>
    public class McpPipelineReviewListArguments
    {
        /// <summary>Optional status: Pending, Approved, ChangesRequested, Rejected, Expired, or Cancelled.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Optional pipeline run identifier (plr_...).</summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
