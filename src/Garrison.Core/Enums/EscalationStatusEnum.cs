namespace Garrison.Core.Enums
{
    /// <summary>
    /// Lifecycle state of an escalation (AA2). Only Open escalations can be answered, cancelled, withdrawn, or escalated up.
    /// </summary>
    public enum EscalationStatusEnum
    {
        /// <summary>
        /// Waiting for an answer.
        /// </summary>
        Open,

        /// <summary>
        /// Answered by a person, an agent, or the timeout default answer.
        /// </summary>
        Answered,

        /// <summary>
        /// The timeout passed with no answer and no default answer or next target.
        /// </summary>
        Expired,

        /// <summary>
        /// Cancelled by a person, or by the timeout action Cancel.
        /// </summary>
        Cancelled,

        /// <summary>
        /// Withdrawn by the run that raised it.
        /// </summary>
        Withdrawn
    }
}
