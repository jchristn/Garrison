namespace Garrison.Core.Enums
{
    /// <summary>
    /// Who resolved an escalation (AA2, AA-039).
    /// </summary>
    public enum EscalationResolutionSourceEnum
    {
        /// <summary>
        /// A user or credential answered or cancelled it.
        /// </summary>
        User,

        /// <summary>
        /// A run of the target agent answered it.
        /// </summary>
        Agent,

        /// <summary>
        /// The timeout sweep answered it with the default, cancelled it, escalated it up, or expired it.
        /// </summary>
        Timeout,

        /// <summary>
        /// The raising run withdrew it.
        /// </summary>
        Raiser,

        /// <summary>
        /// Garrison resolved it, for example when its raising run was deleted or an escalated-up child was answered.
        /// </summary>
        System
    }
}
