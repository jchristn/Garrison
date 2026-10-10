namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// A prompt template resolved for a deployment role, at the version the deployment pins or the current version.
    /// </summary>
    public class BoundPrompt
    {
        /// <summary>
        /// Role, for example System or Task.
        /// </summary>
        public string Role { get; set; } = String.Empty;

        /// <summary>
        /// Template identifier.
        /// </summary>
        public string TemplateId { get; set; } = String.Empty;

        /// <summary>
        /// Template name.
        /// </summary>
        public string TemplateName { get; set; } = String.Empty;

        /// <summary>
        /// Version used.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Content at that version.
        /// </summary>
        public string Content { get; set; } = String.Empty;
    }
}
