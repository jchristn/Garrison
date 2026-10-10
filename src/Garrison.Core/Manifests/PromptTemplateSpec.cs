namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Prompt template manifest spec.
    /// </summary>
    public class PromptTemplateSpec
    {
        /// <summary>
        /// Kind.
        /// </summary>
        public PromptTemplateKindEnum Kind { get; set; } = PromptTemplateKindEnum.Other;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Content.
        /// </summary>
        public string Content { get; set; } = String.Empty;
    }
}
