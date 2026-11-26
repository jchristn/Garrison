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
        /// The raising agent's manager in its organization. Unavailable until organizations land (AA7.5).
        /// </summary>
        Manager
    }
}
