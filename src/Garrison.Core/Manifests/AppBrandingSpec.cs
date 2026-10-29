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
    }
}
