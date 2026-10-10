namespace Garrison.Core.Services
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Catalog entry for a built-in prompt template (Seed/Prompts/catalog.json).
    /// </summary>
    public class BuiltInPromptDefinition
    {
        /// <summary>
        /// Key; the template name is builtin/ followed by the key.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Kind.
        /// </summary>
        public PromptTemplateKindEnum Kind { get; set; } = PromptTemplateKindEnum.Other;

        /// <summary>
        /// Description.
        /// </summary>
        public string Description { get; set; } = String.Empty;
    }
}
