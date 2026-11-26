namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One live record in a <see cref="SubtreeInventory"/> (AA8.2): an agent, deployment, mandate, prompt template, or
    /// agent asset, with the references that decide which subtree it belongs to. Not thread-safe.
    /// </summary>
    public class InventoryResource
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind: Agent, Deployment, Mandate, PromptTemplate, or AgentAsset.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Name, as manifests and drafts use it.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// For a deployment or mandate, its agent; otherwise null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// For a mandate, its deployment; otherwise null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// For an agent or deployment, the prompt templates it uses (bindings, tool and skill description templates).
        /// </summary>
        public List<string> TemplateIds
        {
            get
            {
                return _TemplateIds;
            }
            set
            {
                _TemplateIds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// For an agent, the agent assets its current revision pins.
        /// </summary>
        public List<string> AssetIds
        {
            get
            {
                return _AssetIds;
            }
            set
            {
                _AssetIds = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private List<string> _TemplateIds = new List<string>();
        private List<string> _AssetIds = new List<string>();

        #endregion
    }
}
