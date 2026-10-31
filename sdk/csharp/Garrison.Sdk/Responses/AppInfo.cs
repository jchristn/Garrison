namespace Garrison.Sdk.Responses
{
    using System;
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
        /// Typeface of the chat UI. Default System.
        /// </summary>
        public AppFontEnum FontFamily { get; set; } = AppFontEnum.System;

        /// <summary>
        /// Relative URL of the browser tab icon (/v1.0/apps/{slug}/favicon) when the app has a favicon or a logo, or
        /// null for the default icon.
        /// </summary>
        public string? FaviconUrl { get; set; } = null;

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
    }
}
