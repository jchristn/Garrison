namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What a trigger starts when it fires (P12.5).
    /// </summary>
    public enum TriggerTargetTypeEnum
    {
        /// <summary>
        /// A run of an agent, optionally pinned to a deployment.
        /// </summary>
        Agent,

        /// <summary>
        /// A pipeline run.
        /// </summary>
        Pipeline,

        /// <summary>
        /// A scheduled check (AA11.3): an eval run of an eval set against a deployment's recent inputs. Requires EvalSetId
        /// and DeploymentId and a user run-as principal; run tokens cannot create or change these triggers.
        /// </summary>
        EvalSet
    }
}
