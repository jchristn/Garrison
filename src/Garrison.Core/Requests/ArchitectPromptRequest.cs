namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Choose an architect deployment's prompt (AD7.14, AD-026).
    /// </summary>
    public class ArchitectPromptRequest
    {
        /// <summary>
        /// System template identifier or name (a built-in architect prompt, a clone, or another tenant System template).
        /// </summary>
        public string ArchitectPromptTemplateId { get; set; } = String.Empty;

        /// <summary>
        /// Version to pin, or null to follow the template's current version. Minimum 1.
        /// </summary>
        public int? ArchitectPromptVersion { get; set; } = null;
    }
}
