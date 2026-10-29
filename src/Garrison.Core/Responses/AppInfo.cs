namespace Garrison.Core.Responses
{
    using System;
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
    }
}
