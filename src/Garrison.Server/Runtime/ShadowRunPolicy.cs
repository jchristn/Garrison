namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Server.Protocols;

    /// <summary>
    /// What a shadow run may do through Garrison's MCP server (AA-027, AA9.7). A run token belongs to a shadow run when
    /// its run has kind Shadow; the gateway re-reads the run on every call, so the flag cannot be dropped by the harness.
    /// A shadow run may read. It may not call any tool the effect journal would record (every non-read tool and every
    /// agent tool), and it may not use the messaging, escalation, report, memory-write, keeper, or studio draft tools
    /// even where one of them reads. The permission prompt stays available so the harness can ask, and the approval
    /// service answers Deny. Thread-safe.
    /// </summary>
    public static class ShadowRunPolicy
    {
        #region Public-Members

        /// <summary>
        /// Error code of every refusal: ShadowRunRefused.
        /// </summary>
        public static readonly string RefusalCode = "ShadowRunRefused";

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _AlwaysRefused = new HashSet<string>(StringComparer.Ordinal)
        {
            "garrison_send_message", "garrison_reply_message", "garrison_read_inbox", "garrison_ack_message",
            "garrison_escalate", "garrison_get_escalation", "garrison_list_my_escalations", "garrison_withdraw_escalation", "garrison_answer_escalation",
            "garrison_file_report",
            "garrison_memory_write", "garrison_memory_delete",
            "garrison_keeper_context", "garrison_keeper_complete_tick",
            "garrison_files_write", "garrison_files_delete",
            "garrison_invoke_agent", "garrison_start_run", "garrison_cancel_run",
            "garrison_fan_out", "garrison_gather", "garrison_cancel_fan_out"
        };

        private static readonly string _PermissionPrompt = "garrison_permission_prompt";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a run of this kind is a shadow run.
        /// </summary>
        /// <param name="run">Run, or null.</param>
        /// <returns>True for a run of kind Shadow.</returns>
        public static bool IsShadow(Run? run)
        {
            return run != null && run.Kind == RunKindEnum.Shadow;
        }

        /// <summary>
        /// Whether a shadow run is refused this tool.
        /// </summary>
        /// <param name="tool">Tool.</param>
        /// <returns>True when the call must be refused with <see cref="RefusalCode"/>.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tool is null.</exception>
        public static bool Refuses(McpToolDefinition tool)
        {
            if (tool == null) throw new ArgumentNullException(nameof(tool));
            if (String.Equals(tool.Name, _PermissionPrompt, StringComparison.Ordinal)) return false;
            if (tool.AgentTool) return true;
            if (_AlwaysRefused.Contains(tool.Name)) return true;
            if (tool.ResourceType == ResourceTypeEnum.StudioDraft) return true;
            return EffectClassificationRules.RequiresJournal(tool.Operation, tool.AgentTool, tool.Annotations);
        }

        /// <summary>
        /// The message a refused shadow run receives.
        /// </summary>
        /// <param name="toolName">Tool name.</param>
        /// <returns>Message.</returns>
        public static string RefusalMessage(string? toolName)
        {
            return (String.IsNullOrEmpty(toolName) ? "This tool" : toolName) + " is not available to a shadow run: shadow runs only read, and their effects (messages, escalations, reports, memory writes, drafts, files, other runs, and tools that change anything) are refused (AA-027).";
        }

        #endregion
    }
}
