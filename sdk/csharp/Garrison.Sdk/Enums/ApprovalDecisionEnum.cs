namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What a harness is told about a permission request (P12.3).
    /// </summary>
    public enum ApprovalDecisionEnum
    {
        /// <summary>
        /// The tool call may run.
        /// </summary>
        Allow,

        /// <summary>
        /// The tool call must not run.
        /// </summary>
        Deny
    }
}
