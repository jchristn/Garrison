namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// What an app's chat UI needs before anyone signs in (AD6.6, AD6.10): branding and how to sign in.
    /// </summary>
    public class AppInfo
    {
        /// <summary>
        /// URL slug.
        /// </summary>
        public string Slug { get; set; } = String.Empty;

        /// <summary>
        /// Name shown: the display name, or the app name.
        /// </summary>
        public string DisplayName { get; set; } = String.Empty;

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Text shown before the first message, or null.
        /// </summary>
        public string? WelcomeText { get; set; } = null;

        /// <summary>
        /// Primary color (#RRGGBB), or null.
        /// </summary>
        public string? PrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color (#RRGGBB), or null.
        /// </summary>
        public string? AccentColor { get; set; } = null;

        /// <summary>
        /// Logo URL relative to the server, or null without a logo.
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
        /// Path of the browser tab icon (the favicon asset, else the logo), or null for the default icon.
        /// </summary>
        public string? FaviconUrl { get; set; } = null;

        /// <summary>
        /// Line under the name in the header and on the welcome screen, or null.
        /// </summary>
        public string? Subtitle { get; set; } = null;

        /// <summary>
        /// Heading of the welcome screen, or null to show <see cref="DisplayName"/>.
        /// </summary>
        public string? WelcomeTitle { get; set; } = null;

        /// <summary>
        /// Placeholder of the message input, or null for the app UI's default.
        /// </summary>
        public string? ComposerPlaceholder { get; set; } = null;

        /// <summary>
        /// Author name on the agent's messages: the app's agent display name, else the entry agent's name, or null when
        /// neither is known.
        /// </summary>
        public string? AgentDisplayName { get; set; } = null;

        /// <summary>
        /// Path of the agent's avatar image (/v1.0/apps/{slug}/avatar), or null without an avatar.
        /// </summary>
        public string? AgentAvatarUrl { get; set; } = null;

        /// <summary>
        /// The palette preset the operator started from, or "custom", or null. Informational only.
        /// </summary>
        public string? PaletteId { get; set; } = null;

        /// <summary>
        /// Primary color in the dark theme (#rgb or #rrggbb), or null to derive it from <see cref="PrimaryColor"/>.
        /// </summary>
        public string? DarkPrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color in the dark theme, or null to derive it from <see cref="AccentColor"/>.
        /// </summary>
        public string? DarkAccentColor { get; set; } = null;

        /// <summary>
        /// Page background in the dark theme, or null to derive it from <see cref="BackgroundColor"/>.
        /// </summary>
        public string? DarkBackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background in the dark theme, or null to derive it from <see cref="HeaderColor"/>.
        /// </summary>
        public string? DarkHeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages in the dark theme, or null to derive it from <see cref="AgentBubbleColor"/>.
        /// </summary>
        public string? DarkAgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation list in the dark theme, or null to derive it from
        /// <see cref="ConversationListColor"/>.
        /// </summary>
        public string? DarkConversationListColor { get; set; } = null;

        /// <summary>
        /// Background of the message input area in the dark theme, or null to derive it from <see cref="ComposerColor"/>.
        /// </summary>
        public string? DarkComposerColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation's file list in the dark theme, or null to derive it from <see cref="FilesColor"/>.
        /// </summary>
        public string? DarkFilesColor { get; set; } = null;

        /// <summary>
        /// Theme the app UI opens in. Default System.
        /// </summary>
        public AppThemeDefaultEnum ThemeDefault { get; set; } = AppThemeDefaultEnum.System;

        /// <summary>
        /// Whether end users may switch themes; false hides the toggle and ignores a saved choice. Default true.
        /// </summary>
        public bool AllowThemeSwitch { get; set; } = true;

        /// <summary>
        /// Corner style. Default Rounded.
        /// </summary>
        public AppCornerStyleEnum CornerStyle { get; set; } = AppCornerStyleEnum.Rounded;

        /// <summary>
        /// Spacing. Default Comfortable.
        /// </summary>
        public AppDensityEnum Density { get; set; } = AppDensityEnum.Comfortable;

        /// <summary>
        /// Whether to show the conversation's file panel. Default true.
        /// </summary>
        public bool ShowFilesPanel { get; set; } = true;

        /// <summary>
        /// Whether to show the language picker. Default true.
        /// </summary>
        public bool ShowLanguagePicker { get; set; } = true;

        /// <summary>
        /// Whether to show the "Powered by Garrison" footer. Default true.
        /// </summary>
        public bool ShowPoweredBy { get; set; } = true;

        /// <summary>
        /// Suggested first messages for a new conversation, in order; at most 4. Never null.
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
        /// Who may sign in.
        /// </summary>
        public AppAuthModeEnum AuthMode { get; set; } = AppAuthModeEnum.AppUsers;

        /// <summary>
        /// Whether an anonymous session can be started.
        /// </summary>
        public bool AnonymousAllowed { get; set; } = false;

        /// <summary>
        /// Whether the UI shows operator detail such as tool calls.
        /// </summary>
        public bool ShowOperatorDetail { get; set; } = false;

        private List<string> _StarterPrompts = new List<string>();
    }
}
