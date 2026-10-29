namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Everything the compiler loaded for one deployment.
    /// </summary>
    public class CompilationInputs
    {
        /// <summary>
        /// Tenant.
        /// </summary>
        public Tenant? Tenant { get; set; } = null;

        /// <summary>
        /// Deployment.
        /// </summary>
        public Deployment Deployment { get; set; } = new Deployment();

        /// <summary>
        /// Agent.
        /// </summary>
        public Agent Agent { get; set; } = new Agent();

        /// <summary>
        /// Agent revision whose content was applied to <see cref="Agent"/> (AD1.3), or null when the agent has none.
        /// </summary>
        public AgentRevision? AgentRevision { get; set; } = null;

        /// <summary>
        /// Asset versions the agent revision pins (AD2.4), excluding SystemPrompt assets, which become the System prompt.
        /// </summary>
        public List<CompilationAsset> Assets { get; set; } = new List<CompilationAsset>();

        /// <summary>
        /// Harness profile.
        /// </summary>
        public HarnessProfile Profile { get; set; } = new HarnessProfile();

        /// <summary>
        /// Prompts by role.
        /// </summary>
        public Dictionary<string, BoundPrompt> Prompts { get; set; } = new Dictionary<string, BoundPrompt>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Bound MCP servers with their aliases.
        /// </summary>
        public List<McpServer> McpServers { get; set; } = new List<McpServer>();

        /// <summary>
        /// Bound secrets by alias.
        /// </summary>
        public Dictionary<string, Secret> Secrets { get; set; } = new Dictionary<string, Secret>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Workspace template.
        /// </summary>
        public WorkspaceTemplate? Workspace { get; set; } = null;

        /// <summary>Configured artifact store, without decrypted provider credentials.</summary>
        public ArtifactStore? ArtifactStore { get; set; } = null;

        /// <summary>
        /// Secret holding git credentials for the workspace.
        /// </summary>
        public Secret? WorkspaceSecret { get; set; } = null;

        /// <summary>
        /// Templates available to includes, by name, with their current version.
        /// </summary>
        public Dictionary<string, BoundPrompt> Includes { get; set; } = new Dictionary<string, BoundPrompt>(StringComparer.Ordinal);

        /// <summary>
        /// Whether the run executes inside a container or pod (G-29): a KubernetesJob run, or a Process run on a worker
        /// that reported Containerized. Exposed to templates as executor.containerized. Default false.
        /// </summary>
        public bool Containerized { get; set; } = false;
    }
}
