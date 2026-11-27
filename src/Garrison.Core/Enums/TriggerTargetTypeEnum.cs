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
        Pipeline,

        /// <summary>
        /// A scheduled check (AA11.3): an eval run of an eval set against a deployment's recent inputs, started as the
        /// trigger's run-as person. Only people create these triggers, and agents cannot grade or change the results.
        /// </summary>
        EvalSet
    }
}
