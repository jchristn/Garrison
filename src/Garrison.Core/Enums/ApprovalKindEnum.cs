namespace Garrison.Core.Enums
{
    /// <summary>
    /// Where a permission request came from (P12.3).
    /// </summary>
    public enum ApprovalKindEnum
    {
        /// <summary>
        /// A Claude Code tool call relayed through <c>--permission-prompt-tool</c> to garrison_permission_prompt.
        /// </summary>
        Tool,

        /// <summary>
        /// A Codex app-server command execution approval (item/commandExecution/requestApproval), evaluated as Bash.
        /// </summary>
        Command,

        /// <summary>
        /// A Codex app-server file change approval (item/fileChange/requestApproval), evaluated as Edit.
        /// </summary>
        FileChange
    }
}
