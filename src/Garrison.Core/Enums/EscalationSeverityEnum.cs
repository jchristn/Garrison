namespace Garrison.Core.Enums
{
    /// <summary>
    /// How urgent an escalation is (AA2). Notification endpoints can filter on it.
    /// </summary>
    public enum EscalationSeverityEnum
    {
        /// <summary>
        /// For information; no hurry.
        /// </summary>
        Info,

        /// <summary>
        /// Needs an answer soon.
        /// </summary>
        Warning,

        /// <summary>
        /// Needs an answer now.
        /// </summary>
        Urgent
    }
}
