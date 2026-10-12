namespace Garrison.Core.Enums
{
    /// <summary>
    /// Who or what decided a permission approval (P12.3).
    /// </summary>
    public enum ApprovalSourceEnum
    {
        /// <summary>
        /// A deployment approval rule matched.
        /// </summary>
        Rule,

        /// <summary>
        /// No rule matched and the deployment's default action (Allow or Deny) applied.
        /// </summary>
        Default,

        /// <summary>
        /// A person decided over REST, MCP, or the dashboard.
        /// </summary>
        User,

        /// <summary>
        /// The approval expired and the deployment's timeout decision applied.
        /// </summary>
        Timeout,

        /// <summary>
        /// The run was cancelled, finished, or lost its lease, or the harness stopped waiting.
        /// </summary>
        Cancelled
    }
}
