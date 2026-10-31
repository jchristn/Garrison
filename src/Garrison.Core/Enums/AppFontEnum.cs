namespace Garrison.Core.Enums
{
    /// <summary>
    /// Typeface of an agentic app's chat UI. Each maps to a font stack the browser already has, so no font is
    /// downloaded.
    /// </summary>
    public enum AppFontEnum
    {
        /// <summary>
        /// The operating system's interface font (default).
        /// </summary>
        System,

        /// <summary>
        /// A neutral sans-serif (Helvetica, Arial).
        /// </summary>
        Sans,

        /// <summary>
        /// A serif for a more formal look (Georgia, Times).
        /// </summary>
        Serif,

        /// <summary>
        /// A rounded sans-serif where the system has one.
        /// </summary>
        Rounded,

        /// <summary>
        /// A monospaced font.
        /// </summary>
        Mono
    }
}
