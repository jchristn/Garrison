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
        /// Page background behind the conversation as #RRGGBB, or null for the theme's background.
        /// </summary>
        public string? BackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background as #RRGGBB, or null for the theme's surface color.
        /// </summary>
        public string? HeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages as #RRGGBB, or null for the theme's bubble color. Your own messages use
        /// <see cref="PrimaryColor"/>.
        /// </summary>
        public string? AgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation list beside the chat as #RRGGBB, or null for the theme's surface color.
        /// </summary>
        public string? ConversationListColor { get; set; } = null;

        /// <summary>
        /// Background of the message input area under the conversation as #RRGGBB, or null for the theme's surface color.
        /// </summary>
        public string? ComposerColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation's file list as #RRGGBB, or null for the theme's surface color.
        /// </summary>
        public string? FilesColor { get; set; } = null;

        /// <summary>
        /// Typeface of the chat UI, or null for <see cref="AppFontEnum.System"/>.
        /// </summary>
        public AppFontEnum? FontFamily { get; set; } = null;

        /// <summary>
        /// Agent asset (an image) shown as the browser tab icon, or null to use the logo, or the default icon when there
        /// is no logo.
        /// </summary>
        public string? FaviconAssetId { get; set; } = null;

        /// <summary>
        /// Line shown under the name in the header and on the welcome screen, up to 200 characters, or null for none
        /// (LP-016).
        /// </summary>
        public string? Subtitle { get; set; } = null;

        /// <summary>
        /// Heading of the welcome screen, up to 120 characters, or null to show the display name.
        /// </summary>
        public string? WelcomeTitle { get; set; } = null;

        /// <summary>
        /// Placeholder text of the message input, up to 120 characters, or null for the app UI's default.
        /// </summary>
        public string? ComposerPlaceholder { get; set; } = null;

        /// <summary>
        /// Author name shown on the agent's messages, up to 80 characters, or null to show the entry agent's name.
        /// </summary>
        public string? AgentDisplayName { get; set; } = null;

        /// <summary>
        /// Agent asset (an image) shown beside the agent's messages, or null for no avatar. Same tenant, like
        /// <see cref="LogoAssetId"/>.
        /// </summary>
        public string? AgentAvatarAssetId { get; set; } = null;

        /// <summary>
        /// The palette preset the operator started from, or "custom", up to 64 characters, or null. Informational only:
        /// the app UI draws the stored colors (LP-017).
        /// </summary>
        public string? PaletteId { get; set; } = null;

        /// <summary>
        /// Primary color in the dark theme as #rgb or #rrggbb, or null to derive it from <see cref="PrimaryColor"/>.
        /// </summary>
        public string? DarkPrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color in the dark theme as #rgb or #rrggbb, or null to derive it from <see cref="AccentColor"/>.
        /// </summary>
        public string? DarkAccentColor { get; set; } = null;

        /// <summary>
        /// Page background in the dark theme as #rgb or #rrggbb, or null to derive it from <see cref="BackgroundColor"/>.
        /// </summary>
        public string? DarkBackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background in the dark theme as #rgb or #rrggbb, or null to derive it from <see cref="HeaderColor"/>.
        /// </summary>
        public string? DarkHeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages in the dark theme as #rgb or #rrggbb, or null to derive it from
        /// <see cref="AgentBubbleColor"/>.
        /// </summary>
        public string? DarkAgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation list in the dark theme as #rgb or #rrggbb, or null to derive it from
        /// <see cref="ConversationListColor"/>.
        /// </summary>
        public string? DarkConversationListColor { get; set; } = null;

        /// <summary>
        /// Background of the message input area in the dark theme as #rgb or #rrggbb, or null to derive it from
        /// <see cref="ComposerColor"/>.
        /// </summary>
        public string? DarkComposerColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation's file list in the dark theme as #rgb or #rrggbb, or null to derive it from
        /// <see cref="FilesColor"/>.
        /// </summary>
        public string? DarkFilesColor { get; set; } = null;

        /// <summary>
        /// Theme the app UI opens in. Default System.
        /// </summary>
        public AppThemeDefaultEnum ThemeDefault { get; set; } = AppThemeDefaultEnum.System;

        /// <summary>
        /// Whether end users may switch between light and dark. False hides the toggle and ignores a saved choice.
        /// Default true.
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
        /// Whether the app UI shows a "Powered by Garrison" footer. Default true.
        /// </summary>
        public bool ShowPoweredBy { get; set; } = true;

        /// <summary>
        /// Suggested first messages shown as buttons on a new conversation, in order. At most 4, each 1 to 200
        /// characters. Default empty; null is stored as empty.
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
        private List<string> _StarterPrompts = new List<string>();

        #endregion
    }
}
