namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// An agentic app (AD6, AD-002): a group of agents with one entry agent that talks to people, the calls its members
    /// may make to each other, the entry deployment per environment, and how end users reach it through its own chat UI
    /// at /apps/{slug}/. Validation lives in the app service; this model holds values as given.
    /// </summary>
    public class AgenticApp
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix app_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAgenticAppId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// URL slug, unique across the cluster because it names the app's URL: 2 to 63 lowercase letters, digits, and
        /// hyphens, starting with a letter or digit. Default: the name.
        /// </summary>
        public string Slug { get; set; } = String.Empty;

        /// <summary>
        /// Description, up to 4000 characters, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// The member that talks to end users. Must be a member.
        /// </summary>
        public string EntryAgentId { get; set; } = String.Empty;

        /// <summary>
        /// Environment whose entry deployment the app UI uses. Default dev.
        /// </summary>
        public string LiveEnvironment { get; set; } = "dev";

        /// <summary>
        /// Who may use the app UI. Default AppUsers.
        /// </summary>
        public AppAuthModeEnum AuthMode { get; set; } = AppAuthModeEnum.AppUsers;

        /// <summary>
        /// Must be true, in addition to AuthMode Anonymous, for anonymous sessions. Default false.
        /// </summary>
        public bool AnonymousEnabled { get; set; } = false;

        /// <summary>
        /// Whether the app UI shows operator detail (tool calls, thinking). Default false.
        /// </summary>
        public bool ShowOperatorDetail { get; set; } = false;

        /// <summary>
        /// Name shown in the app UI, up to 128 characters, or null for the app name.
        /// </summary>
        public string? DisplayName { get; set; } = null;

        /// <summary>
        /// Agent asset (ReferenceFile) whose first image file is the app's logo, or null.
        /// </summary>
        public string? LogoAssetId { get; set; } = null;

        /// <summary>
        /// Primary color as #RRGGBB, or null for the default.
        /// </summary>
        public string? PrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color as #RRGGBB, or null for the default.
        /// </summary>
        public string? AccentColor { get; set; } = null;

        /// <summary>
        /// Text shown before the first message, up to 4000 characters, or null.
        /// </summary>
        public string? WelcomeText { get; set; } = null;

        /// <summary>
        /// Members, including the entry agent.
        /// </summary>
        public List<AgenticAppMember> Members
        {
            get
            {
                return _Members;
            }
            set
            {
                _Members = value ?? new List<AgenticAppMember>();
            }
        }

        /// <summary>
        /// Calls members may make to each other.
        /// </summary>
        public List<AgenticAppEdge> Edges
        {
            get
            {
                return _Edges;
            }
            set
            {
                _Edges = value ?? new List<AgenticAppEdge>();
            }
        }

        /// <summary>
        /// Entry deployment per environment.
        /// </summary>
        public List<AgenticAppEnvironment> Environments
        {
            get
            {
                return _Environments;
            }
            set
            {
                _Environments = value ?? new List<AgenticAppEnvironment>();
            }
        }

        /// <summary>
        /// Latest published app revision, or null. Set by the app service.
        /// </summary>
        public string? LatestPublishedRevisionId { get; set; } = null;

        /// <summary>
        /// Whether the app accepts sessions. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewAgenticAppId();
        private List<AgenticAppMember> _Members = new List<AgenticAppMember>();
        private List<AgenticAppEdge> _Edges = new List<AgenticAppEdge>();
        private List<AgenticAppEnvironment> _Environments = new List<AgenticAppEnvironment>();

        #endregion
    }
}
