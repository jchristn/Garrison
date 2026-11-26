namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How the raising run waits for an answer (AA2, AA-016).
    /// </summary>
    public enum EscalationModeEnum
    {
        /// <summary>
        /// The default. The raising run continues; the answer reaches it later (a keeper is woken with it, other runs fetch it with garrison_get_escalation).
        /// </summary>
        NonBlocking,

        /// <summary>
        /// The raising run suspends through durable continuation and resumes with the answer. Needs a Process executor with suspension enabled and a harness profile that can resume.
        /// </summary>
        Blocking
    }
}
