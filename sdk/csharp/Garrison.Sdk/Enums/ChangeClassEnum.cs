namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Classes of executive change a change rule may pre-authorize (AA8.5). Every change in an executive's draft maps to
    /// one or more classes; a change with no class always waits for a person.
    /// </summary>
    public enum ChangeClassEnum
    {
        /// <summary>
        /// Prompt material: a prompt template or agent asset used only inside the subtree, a deployment's prompt bindings
        /// or description, or an agent's display name, description, skills, tags, or pinned assets.
        /// </summary>
        PromptRetune,

        /// <summary>
        /// A mandate's wake mode, interval bounds, backoff factor, or jitter.
        /// </summary>
        WakeTuning,

        /// <summary>
        /// A mandate's objective, healthy definition, autonomy, escalation policy, direction, or signals.
        /// </summary>
        MandateTextEdit,

        /// <summary>
        /// A new worker: a new agent, its deployment and mandate, or an agent added to a unit below the executive.
        /// </summary>
        AddWorker,

        /// <summary>
        /// An agent removed from a unit below the executive. Live records are never deleted by an executive.
        /// </summary>
        RemoveWorker,

        /// <summary>
        /// A deployment's model, fallback model, effort, or inference endpoint.
        /// </summary>
        ModelChange,

        /// <summary>
        /// A deployment's routing weight.
        /// </summary>
        DeploymentWeight
    }
}
