namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Who authored a mandate revision, so every change of direction is attributable.
    /// </summary>
    public enum MandateRevisionSourceEnum
    {
        /// <summary>
        /// A person, through the API, the dashboard, an SDK, or a manifest.
        /// </summary>
        Human,

        /// <summary>
        /// A board member's direction to the organization's top agent.
        /// </summary>
        Board,

        /// <summary>
        /// An executive agent, through an approved studio draft.
        /// </summary>
        Executive,

        /// <summary>
        /// The agent architect, through an approved studio draft.
        /// </summary>
        Architect
    }
}
