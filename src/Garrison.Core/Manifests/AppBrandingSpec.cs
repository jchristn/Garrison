namespace Garrison.Core.Manifests
{
    /// <summary>
    /// Branding of an AgenticApp manifest (AD6.11).
    /// </summary>
    public class AppBrandingSpec
    {
        /// <summary>
        /// Name shown in the app UI, or null for the app name.
        /// </summary>
        public string? DisplayName { get; set; } = null;

        /// <summary>
        /// Agent asset name whose first image is the logo, or null.
        /// </summary>
        public string? Logo { get; set; } = null;

        /// <summary>
        /// Primary color (#RRGGBB), or null.
        /// </summary>
        public string? PrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color (#RRGGBB), or null.
        /// </summary>
        public string? AccentColor { get; set; } = null;

        /// <summary>
        /// Welcome text, or null.
        /// </summary>
        public string? WelcomeText { get; set; } = null;

        /// <summary>
        /// Page background (#RRGGBB), or null.
        /// </summary>
        public string? BackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background (#RRGGBB), or null.
        /// </summary>
        public string? HeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages (#RRGGBB), or null.
        /// </summary>
        public string? AgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Typeface: System, Sans, Serif, Rounded, or Mono; null for System.
        /// </summary>
        public string? Font { get; set; } = null;

        /// <summary>
        /// Agent asset name or identifier of the browser tab icon, or null to use the logo.
        /// </summary>
        public string? Favicon { get; set; } = null;
    }
}
