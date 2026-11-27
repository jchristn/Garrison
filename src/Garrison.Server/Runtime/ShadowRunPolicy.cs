namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Server.Protocols;

    /// <summary>
    /// What a shadow run, and every eval run, may do through Garrison's MCP server (AA-027, AA-074, AA9.7). A run token is
    /// restricted when its run has kind Shadow (a shadow copy) or Eval (an eval case run, a recent-input replay, or a judge
    /// run); the gateway re-reads the run on every call, so the flag cannot be dropped by the harness.
    /// A shadow run may read. It may not call any tool the effect journal would record (every non-read tool and every
    /// agent tool), and it may not use the messaging, escalation, report, memory-write, keeper, or studio draft tools
    /// even where one of them reads. The permission prompt stays available so the harness can ask, and the approval
    /// service answers Deny. Thread-safe.
    /// </summary>
    public static class ShadowRunPolicy
    {
        #region Public-Members

        /// <summary>
        /// Error code of a shadow run's refusals: ShadowRunRefused.
        /// </summary>
        public static readonly string RefusalCode = "ShadowRunRefused";

        /// <summary>
        /// Error code of an eval run's refusals (AA-074): EvalRunRefused.
        /// </summary>
        public static readonly string EvalRefusalCode = "EvalRunRefused";

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
        /// Whether a run is restricted like a shadow run: kind Shadow, or kind Eval (case runs, recent-input replays, and
        /// judge runs; AA-074), because replaying cases or production inputs must not act.
        /// </summary>
        /// <param name="run">Run, or null.</param>
        /// <returns>True for a run of kind Shadow or Eval.</returns>
        public static bool IsRestricted(Run? run)
        {
            return run != null && (run.Kind == RunKindEnum.Shadow || run.Kind == RunKindEnum.Eval);
        }

        /// <summary>
        /// The refusal code for a restricted run: <see cref="EvalRefusalCode"/> for an eval run, otherwise
        /// <see cref="RefusalCode"/>.
        /// </summary>
        /// <param name="run">Run, or null.</param>
        /// <returns>Code.</returns>
        public static string RefusalCodeFor(Run? run)
        {
            return run != null && run.Kind == RunKindEnum.Eval ? EvalRefusalCode : RefusalCode;
        }

        /// <summary>
        /// The message a refused restricted run receives.
        /// </summary>
        /// <param name="toolName">Tool name, or for a REST call a label such as "Execute on Agent".</param>
        /// <param name="run">Run, or null.</param>
        /// <returns>Message.</returns>
        public static string RefusalMessageFor(string? toolName, Run? run)
        {
            if (run == null || run.Kind != RunKindEnum.Eval) return RefusalMessage(toolName);
            return (String.IsNullOrEmpty(toolName) ? "This tool" : toolName) + " is not available to an eval run: eval case runs, recent-input replays, and judge runs only read, and their effects (messages, escalations, reports, memory writes, drafts, files, other runs, and tools that change anything) are refused (AA-074).";
        }

        /// <summary>
        /// Whether a restricted run is refused this tool.
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
            if (RefusesOperation(tool.ResourceType, tool.Operation)) return true;
            return EffectClassificationRules.RequiresJournal(tool.Operation, tool.AgentTool, tool.Annotations);
        }

        /// <summary>
        /// Whether a restricted run is refused an operation on a resource type, as the operation scope map records it for a
        /// REST route or an MCP tool (SR-29). Every operation other than Read is refused, and so is every operation on a
        /// studio draft. <see cref="Refuses"/> applies the same rule to tools, so REST and MCP refuse the same operations.
        /// </summary>
        /// <param name="resourceType">Resource type.</param>
        /// <param name="operation">Operation.</param>
        /// <returns>True when the call must be refused with <see cref="RefusalCodeFor"/>.</returns>
        public static bool RefusesOperation(ResourceTypeEnum resourceType, OperationTypeEnum operation)
        {
            if (resourceType == ResourceTypeEnum.StudioDraft) return true;
            return operation != OperationTypeEnum.Read;
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
