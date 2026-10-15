namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a trigger starts when it fires (P12.5).
    /// </summary>
    public enum TriggerTargetTypeEnum
    {
        /// <summary>
        /// A run of an agent (optionally pinned to one deployment).
        /// </summary>
        Agent,

        /// <summary>
        /// A pipeline run.
        /// </summary>
        Pipeline
    }
}
