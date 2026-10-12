namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A permission request as a harness raised it (P12.3): the tool and its input, before rules are applied.
    /// </summary>
    public class ApprovalRequestInput
    {
        /// <summary>
        /// Where the request came from. Default Tool (a Claude Code permission prompt).
        /// </summary>
        public ApprovalKindEnum Kind { get; set; } = ApprovalKindEnum.Tool;

        /// <summary>
        /// Tool name, for example Bash, Edit, or mcp__github__create_issue. Required; at most 256 characters.
        /// </summary>
        public string ToolName { get; set; } = String.Empty;

        /// <summary>
        /// Tool input as JSON text, or null for none. Never stored in full.
        /// </summary>
        public string? InputJson { get; set; } = null;

        /// <summary>
        /// The harness's identifier of the tool call, or null.
        /// </summary>
        public string? ToolCallId { get; set; } = null;
    }
}
