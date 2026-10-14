namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_list_pipelines.</summary>
    public class McpPipelineListArguments
    {
        /// <summary>Optional part of a pipeline name. Null lists every pipeline.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Optional page size. Null means 25; values are clamped to 1 through 100.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
