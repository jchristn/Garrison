namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An agentic app: a group of agents behind one chat UI at /apps/{slug}/. The entry agent talks to end users and the
    /// edges say which members may call which. The server checks that the entry agent is a member, edges connect members,
    /// every member is reachable from the entry agent, and the edges have no cycle. Not thread-safe.
    /// </summary>
    public class AgenticApp
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix app_). Set by the server; leave empty when creating. Never null.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier. Set by the server. Never null.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name, unique in the tenant: 1 to 64 lowercase letters, digits, and hyphens. Never null.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// URL name, unique across the cluster (409 AppSlugTaken). Empty on create means the name. Never null.
        /// </summary>
        public string Slug
        {
            get
            {
                return _Slug;
            }
            set
            {
                _Slug = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// The member that talks to end users. An agent name is accepted on create and update. Never null.
        /// </summary>
        public string EntryAgentId
        {
            get
            {
                return _EntryAgentId;
            }
            set
            {
                _EntryAgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The environment the app UI uses. Default dev. Never null.
        /// </summary>
        public string LiveEnvironment
        {
            get
            {
                return _LiveEnvironment;
            }
            set
            {
                _LiveEnvironment = value ?? "dev";
            }
        }

        /// <summary>
        /// Who may use the app UI. Default AppUsers.
        /// </summary>
        public AppAuthModeEnum AuthMode { get; set; } = AppAuthModeEnum.AppUsers;

        /// <summary>
        /// Whether anonymous sessions are allowed. Only takes effect with AuthMode Anonymous. Default false.
        /// </summary>
        public bool AnonymousEnabled { get; set; } = false;

        /// <summary>
        /// Whether end users see tool calls, thinking, progress, and warnings. Default false.
        /// </summary>
        public bool ShowOperatorDetail { get; set; } = false;

        /// <summary>
        /// Display name shown in the app UI (header, sign-in page, browser tab title), or null for the name. Any
        /// characters, up to 128. Unlike Name and Slug it is not limited to lowercase letters, digits, and hyphens.
        /// </summary>
        public string? DisplayName { get; set; } = null;

        /// <summary>
        /// Agent asset whose current version's first image is the logo, or null.
        /// </summary>
        public string? LogoAssetId { get; set; } = null;

        /// <summary>
        /// Primary color as #RRGGBB, for example #1F6FEB, or null. Colors buttons, the header rule, and your own messages.
        /// Anything else is 400 InvalidColor.
        /// </summary>
        public string? PrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color, or null.
        /// </summary>
        public string? AccentColor { get; set; } = null;

        /// <summary>
        /// Text shown before the first message, or null.
        /// </summary>
        public string? WelcomeText { get; set; } = null;

        /// <summary>
        /// Page background behind the conversation as #RRGGBB, or null for the theme's background. Anything else is
        /// 400 InvalidColor.
        /// </summary>
        public string? BackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background as #RRGGBB, or null for the theme's surface color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? HeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages as #RRGGBB, or null for the theme's bubble color. Your own messages use
        /// PrimaryColor. Anything else is 400 InvalidColor.
        /// </summary>
        public string? AgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation list beside the chat as #RRGGBB, or null for the theme's surface color.
        /// Anything else is 400 InvalidColor.
        /// </summary>
        public string? ConversationListColor { get; set; } = null;

        /// <summary>
        /// Background of the message input area under the conversation as #RRGGBB, or null for the theme's surface
        /// color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? ComposerColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation's file list as #RRGGBB, or null for the theme's surface color. Anything else
        /// is 400 InvalidColor.
        /// </summary>
        public string? FilesColor { get; set; } = null;

        /// <summary>
        /// Typeface of the chat UI, or null for System.
        /// </summary>
        public AppFontEnum? FontFamily { get; set; } = null;

        /// <summary>
        /// Agent asset (an image) shown as the browser tab icon, or null to use the logo, or the default icon when there
        /// is no logo. An unknown asset is 400 UnknownAsset.
        /// </summary>
        public string? FaviconAssetId { get; set; } = null;

        /// <summary>
        /// Line under the name in the header and on the welcome screen, up to 200 characters, or null. Longer is 400 TooLong.
        /// </summary>
        public string? Subtitle { get; set; } = null;

        /// <summary>
        /// Heading of the welcome screen, up to 120 characters, or null to show the display name.
        /// </summary>
        public string? WelcomeTitle { get; set; } = null;

        /// <summary>
        /// Placeholder of the message input, up to 120 characters, or null for the app UI's default.
        /// </summary>
        public string? ComposerPlaceholder { get; set; } = null;

        /// <summary>
        /// Author name on the agent's messages, up to 80 characters, or null to show the entry agent's name.
        /// </summary>
        public string? AgentDisplayName { get; set; } = null;

        /// <summary>
        /// Agent asset (an image) shown beside the agent's messages, or null. An unknown asset is 400 UnknownAsset.
        /// </summary>
        public string? AgentAvatarAssetId { get; set; } = null;

        /// <summary>
        /// The palette preset the operator started from, or "custom", up to 64 characters, or null. Informational only.
        /// </summary>
        public string? PaletteId { get; set; } = null;

        /// <summary>
        /// Dark-theme primary color as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkPrimaryColor { get; set; } = null;

        /// <summary>
        /// Dark-theme accent color as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkAccentColor { get; set; } = null;

        /// <summary>
        /// Dark-theme page background as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkBackgroundColor { get; set; } = null;

        /// <summary>
        /// Dark-theme header bar background as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkHeaderColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the agent's messages as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkAgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the conversation list as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkConversationListColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the message input area as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkComposerColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the conversation's file list as #rgb or #rrggbb, or null to derive it from the light color. Anything else is 400 InvalidColor.
        /// </summary>
        public string? DarkFilesColor { get; set; } = null;

        /// <summary>
        /// Theme the app UI opens in. Default System.
        /// </summary>
        public AppThemeDefaultEnum ThemeDefault { get; set; } = AppThemeDefaultEnum.System;

        /// <summary>
        /// Whether end users may switch themes; false hides the toggle. Default true.
        /// </summary>
        public bool AllowThemeSwitch { get; set; } = true;

        /// <summary>
        /// Corner style of buttons, bubbles, and panels. Default Rounded.
        /// </summary>
        public AppCornerStyleEnum CornerStyle { get; set; } = AppCornerStyleEnum.Rounded;

        /// <summary>
        /// Spacing of the app UI. Default Comfortable.
        /// </summary>
        public AppDensityEnum Density { get; set; } = AppDensityEnum.Comfortable;

        /// <summary>
        /// Whether the app UI shows the conversation's file panel. Default true.
        /// </summary>
        public bool ShowFilesPanel { get; set; } = true;

        /// <summary>
        /// Whether the app UI shows its language picker. Default true.
        /// </summary>
        public bool ShowLanguagePicker { get; set; } = true;

        /// <summary>
        /// Whether the app UI shows the "Powered by Garrison" footer. Default true.
        /// </summary>
        public bool ShowPoweredBy { get; set; } = true;

        /// <summary>
        /// Suggested first messages for a new conversation, in order. At most 4, each 1 to 200 characters (otherwise 400 TooMany, Required, or TooLong). Never
        /// null; assigning null stores an empty list.
        /// </summary>
        public List<string> StarterPrompts
        {
            get
            {
                return _StarterPrompts;
            }
            set
            {
                _StarterPrompts = value ?? new List<string>();
            }
        }

        /// <summary>
        /// The agents in the app. Never null; assigning null stores an empty list.
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
        /// Calls members may make. Never null; assigning null stores an empty list.
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
        /// The entry deployment per environment. Never null; assigning null stores an empty list.
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
        /// Latest published app revision identifier (prefix apv_), or null. Set by the server.
        /// </summary>
        public string? LatestPublishedRevisionId { get; set; } = null;

        /// <summary>
        /// Whether the app is active. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Creation time, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _Slug = String.Empty;
        private string _EntryAgentId = String.Empty;
        private string _LiveEnvironment = "dev";
        private List<AgenticAppMember> _Members = new List<AgenticAppMember>();
        private List<AgenticAppEdge> _Edges = new List<AgenticAppEdge>();
        private List<AgenticAppEnvironment> _Environments = new List<AgenticAppEnvironment>();
        private List<string> _StarterPrompts = new List<string>();

        #endregion
    }
}
