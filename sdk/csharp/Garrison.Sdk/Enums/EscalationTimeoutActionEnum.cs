namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What happens when an escalation's timeout passes with no answer (AA2).
    /// </summary>
    public enum EscalationTimeoutActionEnum
    {
        /// <summary>
        /// Answer with the escalation's default answer. Raising one with this action needs a default answer.
        /// </summary>
        UseDefaultAnswer,

        /// <summary>
        /// Cancel the escalation, and the raising run when it is blocked on it.
        /// </summary>
        Cancel,

        /// <summary>
        /// Escalate to the next target: the mandate's default target, and the manager once organizations land. With no next target the escalation expires.
        /// </summary>
        EscalateUp
    }
}
