namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Branding and sign-in mode of an agentic app, from GET /v1.0/apps/{slug}. Reading it needs no credentials.
    /// Not thread-safe.
    /// </summary>
    public class AppInfo
    {
        /// <summary>
        /// URL name of the app. Never null.
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
        /// Name shown to end users. Never null.
        /// </summary>
        public string DisplayName
        {
            get
            {
                return _DisplayName;
            }
            set
            {
                _DisplayName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Text shown before the first message, or null.
        /// </summary>
        public string? WelcomeText { get; set; } = null;

        /// <summary>
        /// Primary color (CSS color), or null for the default.
        /// </summary>
        public string? PrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color (CSS color), or null for the default.
        /// </summary>
        public string? AccentColor { get; set; } = null;

        /// <summary>
        /// Relative URL of the logo image, or null when the app has none.
        /// </summary>
        public string? LogoUrl { get; set; } = null;

        /// <summary>
        /// Page background as #RRGGBB, or null for the theme's background.
        /// </summary>
        public string? BackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background as #RRGGBB, or null for the theme's surface color.
        /// </summary>
        public string? HeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages as #RRGGBB, or null for the theme's bubble color.
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
        /// Typeface of the chat UI. Default System.
        /// </summary>
        public AppFontEnum FontFamily { get; set; } = AppFontEnum.System;

        /// <summary>
        /// Relative URL of the browser tab icon (/v1.0/apps/{slug}/favicon) when the app has a favicon or a logo, or
        /// null for the default icon.
        /// </summary>
        public string? FaviconUrl { get; set; } = null;

        /// <summary>
        /// Line under the name in the header and on the welcome screen, up to 200 characters, or null.
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
        /// Author name on the agent's messages: the app's agent display name, else the entry agent's name.
        /// </summary>
        public string? AgentDisplayName { get; set; } = null;

        /// <summary>
        /// Relative URL of the agent's avatar (/v1.0/apps/{slug}/avatar), or null without one.
        /// </summary>
        public string? AgentAvatarUrl { get; set; } = null;

        /// <summary>
        /// The palette preset the operator started from, or "custom", or null. Informational only.
        /// </summary>
        public string? PaletteId { get; set; } = null;

        /// <summary>
        /// Dark-theme primary color as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkPrimaryColor { get; set; } = null;

        /// <summary>
        /// Dark-theme accent color as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkAccentColor { get; set; } = null;

        /// <summary>
        /// Dark-theme page background as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkBackgroundColor { get; set; } = null;

        /// <summary>
        /// Dark-theme header bar background as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkHeaderColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the agent's messages as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkAgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the conversation list as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkConversationListColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the message input area as #rgb or #rrggbb, or null to derive it from the light color.
        /// </summary>
        public string? DarkComposerColor { get; set; } = null;

        /// <summary>
        /// Dark-theme background of the conversation's file list as #rgb or #rrggbb, or null to derive it from the light color.
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
        /// Suggested first messages for a new conversation, in order. At most 4, each 1 to 200 characters. Never
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
        /// How end users sign in. Default AppUsers.
        /// </summary>
        public AppAuthModeEnum AuthMode { get; set; } = AppAuthModeEnum.AppUsers;

        /// <summary>
        /// True when an anonymous session may be started.
        /// </summary>
        public bool AnonymousAllowed { get; set; } = false;

        /// <summary>
        /// True when end users see operator detail such as tool calls and thinking.
        /// </summary>
        public bool ShowOperatorDetail { get; set; } = false;

        private string _Slug = String.Empty;
        private string _DisplayName = String.Empty;
        private List<string> _StarterPrompts = new List<string>();
    }
}
