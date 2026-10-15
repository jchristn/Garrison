namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;
    using Voltaic.A2A;

    /// <summary>
    /// The one renderer of A2A agent cards (the public A2A card route, the tenant card catalog, and the REST agent card
    /// route all use it, G-4) and of MCP tool descriptions for agents offered as their own MCP tools. Descriptions come
    /// from prompt templates (the agent's override, else the built-in) rendered with the template language. Published to
    /// the server context. Thread-safe.
    /// </summary>
    public class AgentCardService
    {
        #region Public-Members

        /// <summary>
        /// Key of the bearer security scheme in every card's securitySchemes and securityRequirements: garrison.
        /// </summary>
        public static readonly string SecuritySchemeName = "garrison";

        #endregion

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
            string rendered = (await RenderAsync(tenantId, agent, agent.SkillDescriptionTemplateId, "builtin/a2a-skill-description", token).ConfigureAwait(false)).Trim();
            string skillDescription = String.IsNullOrWhiteSpace(rendered) ? (String.IsNullOrWhiteSpace(agent.Description) ? agent.Name : agent.Description!) : rendered;

            AgentCard card = new AgentCard();
            card.Name = String.IsNullOrWhiteSpace(agent.DisplayName) ? agent.Name : agent.DisplayName!;
            card.Description = String.IsNullOrWhiteSpace(agent.Description) ? skillDescription : agent.Description!;
            card.Version = String.IsNullOrWhiteSpace(agent.AgentVersion) ? Constants.ProductVersion : agent.AgentVersion!;
            AgentInterface endpoint = new AgentInterface();
            endpoint.Url = A2AUrl(tenantId, agent, baseUrl);
            endpoint.ProtocolBinding = "JSONRPC";
            card.SupportedInterfaces.Add(endpoint);
            card.Capabilities.Streaming = true;
            card.Capabilities.PushNotifications = false;
            card.Capabilities.StateTransitionHistory = false;
            AgentProvider provider = new AgentProvider();
            provider.Organization = "Garrison";
            provider.Url = Constants.RepositoryUrl;
            card.Provider = provider;
            card.DefaultInputModes = new List<string> { agent.InputMode == AgentInputModeEnum.Structured || !String.IsNullOrWhiteSpace(agent.InputSchemaJson) ? "application/json" : "text/plain" };
            card.DefaultOutputModes = new List<string> { "text/plain", "application/json" };

            if (agent.Skills.Count == 0)
            {
                AgentSkill skill = new AgentSkill();
                skill.Id = agent.Name;
                skill.Name = card.Name;
                skill.Description = skillDescription;
                skill.Tags = new List<string>(agent.Tags);
                card.Skills.Add(skill);
            }
            foreach (AgentSkillDefinition definition in agent.Skills)
            {
                AgentSkill skill = new AgentSkill();
                skill.Id = definition.SkillId;
                skill.Name = definition.Name;
                skill.Description = String.IsNullOrWhiteSpace(definition.Description) ? skillDescription : definition.Description!;
                skill.Tags = new List<string>(agent.Tags);
                card.Skills.Add(skill);
            }

            HttpAuthSecurityScheme http = new HttpAuthSecurityScheme();
            http.Scheme = "bearer";
            http.Description = "Garrison session token from POST /v1.0/token, or a run token issued to a Garrison agent.";
            SecurityScheme scheme = new SecurityScheme();
            scheme.HttpAuthSecurityScheme = http;
            card.SecuritySchemes = new Dictionary<string, SecurityScheme> { { SecuritySchemeName, scheme } };
            SecurityRequirement requirement = new SecurityRequirement();
            requirement.Schemes = new Dictionary<string, List<string>> { { SecuritySchemeName, new List<string>() } };
            card.SecurityRequirements = new List<SecurityRequirement> { requirement };
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
            if (template == null && fallbackName.StartsWith(Constants.BuiltInPrefix, StringComparison.Ordinal))
            {
                // A tenant template named like the built-in without its prefix (mcp-tool-description,
                // a2a-skill-description) replaces it for the tenant's agents that have no template of their own.
                PromptTemplate? shadow = await _Database.PromptTemplates.ReadByNameAsync(tenantId, fallbackName.Substring(Constants.BuiltInPrefix.Length), token).ConfigureAwait(false);
                if (shadow != null && shadow.TenantId == tenantId && shadow.Active && shadow.Kind == PromptTemplateKindEnum.ToolDescription) template = shadow;
            }
            template ??= await _Database.PromptTemplates.ReadByNameAsync(tenantId, fallbackName, token).ConfigureAwait(false);
            if (template == null) return agent.Description ?? agent.Name;

            TemplateContext context = new TemplateContext();
            context.Set("agent.name", agent.Name);
            context.Set("agent.displayName", agent.DisplayName);
            context.Set("agent.description", agent.Description);
            context.Set("agent.tags", new List<object?>(agent.Tags));
            context.Set("tenant.id", tenantId);
            context.Set("tool.name", String.IsNullOrWhiteSpace(agent.McpToolName) ? agent.Name : agent.McpToolName!.Trim());
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
