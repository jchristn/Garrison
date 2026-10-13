namespace Garrison.ProviderHarness
{
    using System;
    using Voltaic.Mcp;

    /// <summary>One model-visible function bound to a specific MCP server and tool.</summary>
    public class ProviderToolBinding
    {
        /// <summary>Original tool metadata.</summary>
        public ProviderToolInfo Tool { get; }
        /// <summary>Original server configuration.</summary>
        public ProviderMcpSpec Server { get; }
        /// <summary>Connected MCP client. Owned by the bridge.</summary>
        public McpHttpClient Client { get; }
        /// <summary>Safe model function alias.</summary>
        public string Alias { get; }
        /// <summary>Canonical Garrison permission-rule name.</summary>
        public string PermissionName { get { return "mcp__" + Server.Name + "__" + Tool.Name; } }
        /// <summary>Bind a model function to its source.</summary>
        /// <param name="tool">Tool metadata.</param>
        /// <param name="server">Server configuration.</param>
        /// <param name="client">Bridge-owned client.</param>
        /// <param name="alias">Bounded function alias.</param>
        public ProviderToolBinding(ProviderToolInfo tool, ProviderMcpSpec server, McpHttpClient client, string alias)
        {
            Tool = tool ?? throw new ArgumentNullException(nameof(tool));
            Server = server ?? throw new ArgumentNullException(nameof(server));
            Client = client ?? throw new ArgumentNullException(nameof(client));
            Alias = alias ?? throw new ArgumentNullException(nameof(alias));
        }
    }
}
