namespace Garrison.Server.Protocols
{
    using Garrison.Core.Enums;

    /// <summary>Typed prompt template tool arguments (AD7.14).</summary>
    public class McpPromptTemplateArguments
    {
        /// <summary>Template identifier or name.</summary>
        public string? Template { get; set; } = null;

        /// <summary>New name, for clone and update.</summary>
        public string? Name { get; set; } = null;

        /// <summary>Description, for update.</summary>
        public string? Description { get; set; } = null;

        /// <summary>Template kind, for update; omit to keep it.</summary>
        public PromptTemplateKindEnum? Kind { get; set; } = null;

        /// <summary>Content, for update; omit to keep it. For render, content to render instead of the stored template.</summary>
        public string? Content { get; set; } = null;

        /// <summary>Change note, for update.</summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>Sample render context, for render: an object passed through to the renderer as over REST.</summary>
        public System.Text.Json.JsonElement? Context { get; set; } = null;
    }
}
