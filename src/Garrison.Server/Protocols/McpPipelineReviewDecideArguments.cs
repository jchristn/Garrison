namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_decide_pipeline_review.</summary>
    public class McpPipelineReviewDecideArguments
    {
        /// <summary>Review identifier (prv_...). Required.</summary>
        public string? ReviewId { get; set; } = null;

        /// <summary>Decision: Approve, RequestChanges, or Reject. Required.</summary>
        public string? Decision { get; set; } = null;

        /// <summary>Optional comment (at most 8000 characters); required for RequestChanges. Approve notes reach the next stage.</summary>
        public string? Comment { get; set; } = null;
    }
}
