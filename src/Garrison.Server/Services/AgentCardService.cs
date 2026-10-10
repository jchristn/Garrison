namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;
    using Voltaic.A2A;

    /// <summary>
    /// Builds A2A agent cards and MCP tool descriptions for agents from their templates (agent override, else the
    /// built-in template). Published to the server context for the protocol module. Thread-safe.
    /// </summary>
    public class AgentCardService
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly Func<string> _ApiBaseUrl;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="apiBaseUrl">Callback returning the external REST base URL used when no request-specific URL is given.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AgentCardService(DatabaseDriverBase database, Func<string> apiBaseUrl)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _ApiBaseUrl = apiBaseUrl ?? throw new ArgumentNullException(nameof(apiBaseUrl));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// A2A endpoint URL of an agent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <returns>URL.</returns>
        public string A2AUrl(string tenantId, Agent agent)
        {
            return A2AUrl(tenantId, agent, _ApiBaseUrl());
        }

        /// <summary>
        /// A2A endpoint URL of an agent under a given external base URL.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="baseUrl">External REST base URL, for example https://garrison.example.com.</param>
        /// <returns>URL.</returns>
        /// <exception cref="ArgumentNullException">Thrown when agent or baseUrl is null.</exception>
        public string A2AUrl(string tenantId, Agent agent, string baseUrl)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (baseUrl == null) throw new ArgumentNullException(nameof(baseUrl));
            return baseUrl.TrimEnd('/') + "/v1.0/a2a/" + tenantId + "/" + agent.Name;
        }

        /// <summary>
        /// Build an agent card.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Card.</returns>
        /// <exception cref="ArgumentNullException">Thrown when agent is null.</exception>
        public async Task<AgentCard> BuildCardAsync(string tenantId, Agent agent, CancellationToken token = default)
        {
            return await BuildCardAsync(tenantId, agent, _ApiBaseUrl(), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Build an agent card whose interface URL uses a given external base URL.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="baseUrl">External REST base URL, for example https://garrison.example.com.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Card.</returns>
        /// <exception cref="ArgumentNullException">Thrown when agent or baseUrl is null.</exception>
        public async Task<AgentCard> BuildCardAsync(string tenantId, Agent agent, string baseUrl, CancellationToken token = default)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (baseUrl == null) throw new ArgumentNullException(nameof(baseUrl));
            string description = await RenderAsync(tenantId, agent, agent.SkillDescriptionTemplateId, "builtin/a2a-skill-description", token).ConfigureAwait(false);

            AgentCard card = new AgentCard();
            card.Name = String.IsNullOrEmpty(agent.DisplayName) ? agent.Name : agent.DisplayName!;
            card.Description = String.IsNullOrWhiteSpace(description) ? (agent.Description ?? agent.Name) : description.Trim();
            card.Version = String.IsNullOrEmpty(agent.AgentVersion) ? Constants.ProductVersion : agent.AgentVersion!;
            AgentInterface endpoint = new AgentInterface();
            endpoint.Url = A2AUrl(tenantId, agent, baseUrl);
            endpoint.ProtocolBinding = "JSONRPC";
            card.SupportedInterfaces.Add(endpoint);
            card.Capabilities.Streaming = true;
            card.Capabilities.PushNotifications = false;
            card.DefaultInputModes = new List<string> { agent.InputSchemaJson == null ? "text/plain" : "application/json", "text/plain" };
            card.DefaultOutputModes = new List<string> { agent.OutputSchemaJson == null ? "text/plain" : "application/json" };

            if (agent.Skills.Count == 0)
            {
                AgentSkill skill = new AgentSkill();
                skill.Id = agent.Name;
                skill.Name = card.Name;
                skill.Description = card.Description;
                skill.Tags = new List<string>(agent.Tags);
                card.Skills.Add(skill);
            }
            foreach (AgentSkillDefinition definition in agent.Skills)
            {
                AgentSkill skill = new AgentSkill();
                skill.Id = definition.SkillId;
                skill.Name = definition.Name;
                skill.Description = definition.Description ?? card.Description;
                skill.Tags = new List<string>(agent.Tags);
                card.Skills.Add(skill);
            }

            SecurityScheme bearer = new SecurityScheme();
            HttpAuthSecurityScheme http = new HttpAuthSecurityScheme();
            http.Scheme = "bearer";
            http.Description = "Garrison session token or run token.";
            bearer.HttpAuthSecurityScheme = http;
            card.SecuritySchemes = new Dictionary<string, SecurityScheme> { { "bearer", bearer } };
            return card;
        }

        /// <summary>
        /// Render the description used when the agent is exposed as an MCP tool.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Description.</returns>
        public async Task<string> ToolDescriptionAsync(string tenantId, Agent agent, CancellationToken token = default)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            string text = await RenderAsync(tenantId, agent, agent.ToolDescriptionTemplateId, "builtin/mcp-tool-description", token).ConfigureAwait(false);
            return text.Trim();
        }

        #endregion

        #region Private-Methods

        private async Task<string> RenderAsync(string tenantId, Agent agent, string? templateId, string fallbackName, CancellationToken token)
        {
            PromptTemplate? template = null;
            if (!String.IsNullOrEmpty(templateId)) template = await _Database.PromptTemplates.ReadAsync(tenantId, templateId, token).ConfigureAwait(false);
            template ??= await _Database.PromptTemplates.ReadByNameAsync(tenantId, fallbackName, token).ConfigureAwait(false);
            if (template == null) return agent.Description ?? agent.Name;

            TemplateContext context = new TemplateContext();
            context.Set("agent.name", agent.Name);
            context.Set("agent.displayName", agent.DisplayName);
            context.Set("agent.description", agent.Description);
            context.Set("agent.tags", new List<object?>(agent.Tags));
            context.Set("tenant.id", tenantId);
            context.Set("garrison.version", Constants.ProductVersion);
            try
            {
                return TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name });
            }
            catch (TemplateException)
            {
                return agent.Description ?? agent.Name;
            }
        }

        #endregion
    }
}
