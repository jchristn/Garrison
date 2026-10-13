namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Compilation;

    /// <summary>One resolved MCP entry from the invocation compiler.</summary>
    public class ProviderMcpSpec
    {
        /// <summary>Compiler-assigned server name.</summary>
        public string Name { get; set; } = String.Empty;
        /// <summary>Transport name, http or stdio.</summary>
        public string Transport { get; set; } = "http";
        /// <summary>Server base URL.</summary>
        public string Url { get; set; } = String.Empty;
        /// <summary>MCP path. Default /mcp.</summary>
        public string Path { get; set; } = "/mcp";
        /// <summary>Resolved headers; never log these values.</summary>
        public List<ExecutionEnvironmentVariable> Headers { get; set; } = new List<ExecutionEnvironmentVariable>();
        /// <summary>Whether missing connectivity fails the run. Default true.</summary>
        public bool Required { get; set; } = true;
        /// <summary>Required advertised tool names.</summary>
        public List<string> RequiredTools { get; set; } = new List<string>();
        /// <summary>Per-tool timeout. Default 600 seconds.</summary>
        public int ToolTimeoutSeconds { get; set; } = 600;
    }
}
