namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_start_pipeline.</summary>
    public class McpPipelineStartArguments
    {
        /// <summary>Pipeline identifier or name. Required.</summary>
        public string? Pipeline { get; set; } = null;

        /// <summary>Input given to every stage as the caller's task. Required.</summary>
        public string? Input { get; set; } = null;

        /// <summary>Optional media type of the input. Null means text/plain.</summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>Optional priority of the stage runs. Null means 0.</summary>
        public int? Priority { get; set; } = null;

        /// <summary>
        /// Optional seconds to wait until the pipeline run ends or waits for a review. Null or 0 returns at once; values are
        /// clamped to the server's maximum MCP tool wait (at most 600).
        /// </summary>
        public int? WaitSeconds { get; set; } = null;

        /// <summary>Optional idempotency key: repeating a start with the same key and content returns the same pipeline run.</summary>
        public string? IdempotencyKey { get; set; } = null;
    }
}
