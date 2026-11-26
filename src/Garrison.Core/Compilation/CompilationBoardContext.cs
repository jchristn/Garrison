namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// A turn of a conversation the board started with an organization's top agent (AA10.6), rendered into the system
    /// prompt through builtin/board-conversation as board.*. Not thread-safe.
    /// </summary>
    public class CompilationBoardContext
    {
        #region Public-Members

        /// <summary>
        /// Prompt role of the board conversation fragment. A deployment binding for this role replaces the tenant and
        /// built-in templates for that deployment.
        /// </summary>
        public static readonly string Role = "BoardConversation";

        /// <summary>
        /// Override name of the fragment: board-conversation (built-in builtin/board-conversation, kind Fragment).
        /// </summary>
        public static readonly string TemplateName = "board-conversation";

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name.
        /// </summary>
        public string OrganizationName { get; set; } = String.Empty;

        /// <summary>
        /// Mission, or null.
        /// </summary>
        public string? Mission { get; set; } = null;

        /// <summary>
        /// Name of the person who started the conversation, or null.
        /// </summary>
        public string? SpeakerName { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public CompilationBoardContext()
        {
        }

        #endregion
    }
}
