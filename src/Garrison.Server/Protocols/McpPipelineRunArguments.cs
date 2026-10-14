namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of the tools that act on one pipeline run.</summary>
    public class McpPipelineRunArguments
    {
        /// <summary>Pipeline run identifier (plr_...). Required.</summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Optional seconds garrison_get_pipeline_run waits until the pipeline run ends or waits for a review. Null or 0
        /// reads it at once; values are clamped to the server's maximum MCP tool wait (at most 600).
        /// </summary>
        public int? WaitSeconds { get; set; } = null;
    }
}
