namespace Garrison.Core.Enums
{
    /// <summary>
    /// Who an escalation is addressed to (AA2).
    /// </summary>
    public enum EscalationTargetKindEnum
    {
        /// <summary>
        /// A user of the tenant; the target identifier is the user identifier. People are notified.
        /// </summary>
        User,

        /// <summary>
        /// Everyone holding a role; the target identifier is the role identifier. People are notified.
        /// </summary>
        Role,

        /// <summary>
        /// An agent; the target identifier is the agent identifier or name. A run of its default active deployment is started to answer.
        /// </summary>
        Agent,

        /// <summary>
        /// The raising agent's manager in a live organization (AA7.5): the stored escalation targets that agent, or, above the
        /// root unit, the person behind the keeper or the raising run. Refused with ManagerUnavailable for an agent that
        /// holds no position.
        /// </summary>
        Manager
    }
}
