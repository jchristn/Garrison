namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;

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
        /// Background of the conversation list beside the chat (#RRGGBB), or null.
        /// </summary>
        public string? ConversationListColor { get; set; } = null;

        /// <summary>
        /// Background of the message input area under the conversation (#RRGGBB), or null.
        /// </summary>
        public string? ComposerColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation's file list (#RRGGBB), or null.
        /// </summary>
        public string? FilesColor { get; set; } = null;

        /// <summary>
        /// Typeface: System, Sans, Serif, Rounded, or Mono; null for System.
        /// </summary>
        public string? Font { get; set; } = null;

        /// <summary>
        /// Agent asset name or identifier of the browser tab icon, or null to use the logo.
        /// </summary>
        public string? Favicon { get; set; } = null;

        /// <summary>
        /// Line under the name in the header and on the welcome screen, up to 200 characters, or null.
        /// </summary>
        public string? Subtitle { get; set; } = null;

        /// <summary>
        /// Heading of the welcome screen, up to 120 characters, or null for the display name.
        /// </summary>
        public string? WelcomeTitle { get; set; } = null;

        /// <summary>
        /// Placeholder of the message input, up to 120 characters, or null.
        /// </summary>
        public string? ComposerPlaceholder { get; set; } = null;

        /// <summary>
        /// Author name on the agent's messages, up to 80 characters, or null for the entry agent's name.
        /// </summary>
        public string? AgentDisplayName { get; set; } = null;

        /// <summary>
        /// Agent asset name or identifier of the agent's avatar image, or null for none. Stored as agentAvatarAssetId.
        /// </summary>
        public string? AgentAvatar { get; set; } = null;

        /// <summary>
        /// The palette preset the operator started from, or custom, or null. Informational only.
        /// </summary>
        public string? PaletteId { get; set; } = null;

        /// <summary>
        /// Primary color in the dark theme (#rgb or #rrggbb), or null to derive it from the light color.
        /// </summary>
        public string? DarkPrimaryColor { get; set; } = null;

        /// <summary>
        /// Accent color in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkAccentColor { get; set; } = null;

        /// <summary>
        /// Page background in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkBackgroundColor { get; set; } = null;

        /// <summary>
        /// Header bar background in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkHeaderColor { get; set; } = null;

        /// <summary>
        /// Background of the agent's messages in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkAgentBubbleColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation list in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkConversationListColor { get; set; } = null;

        /// <summary>
        /// Background of the message input area in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkComposerColor { get; set; } = null;

        /// <summary>
        /// Background of the conversation's file list in the dark theme, or null to derive it.
        /// </summary>
        public string? DarkFilesColor { get; set; } = null;

        /// <summary>
        /// Theme the app UI opens in: System, Light, or Dark; null for System.
        /// </summary>
        public string? ThemeDefault { get; set; } = null;

        /// <summary>
        /// Whether end users may switch themes, or null for true.
        /// </summary>
        public bool? AllowThemeSwitch { get; set; } = null;

        /// <summary>
        /// Corner style: Sharp, Rounded, or Pill; null for Rounded.
        /// </summary>
        public string? CornerStyle { get; set; } = null;

        /// <summary>
        /// Spacing: Compact or Comfortable; null for Comfortable.
        /// </summary>
        public string? Density { get; set; } = null;

        /// <summary>
        /// Whether to show the conversation's file panel, or null for true.
        /// </summary>
        public bool? ShowFilesPanel { get; set; } = null;

        /// <summary>
        /// Whether to show the language picker, or null for true.
        /// </summary>
        public bool? ShowLanguagePicker { get; set; } = null;

        /// <summary>
        /// Whether to show the "Powered by Garrison" footer, or null for true.
        /// </summary>
        public bool? ShowPoweredBy { get; set; } = null;

        /// <summary>
        /// Suggested first messages for a new conversation, in order; at most 4, each up to 200 characters. Null for none.
        /// </summary>
        public List<string>? StarterPrompts { get; set; } = null;
    }
}
