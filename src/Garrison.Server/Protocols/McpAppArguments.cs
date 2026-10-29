namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed agentic app tool arguments (AD6.11).</summary>
    public class McpAppArguments
    {
        /// <summary>App name or identifier, for get and update.</summary>
        public string? App { get; set; } = null;

        /// <summary>Part of an app name, for list.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Most results for list, 1 to 100; default 25.</summary>
        public int? MaxResults { get; set; } = null;

        /// <summary>App fields for create and update, as over REST.</summary>
        public AgenticApp? Configuration { get; set; } = null;
    }
}
