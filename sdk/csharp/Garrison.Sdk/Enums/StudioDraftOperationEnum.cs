namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What applying a studio draft does with one of its items.
    /// </summary>
    public enum StudioDraftOperationEnum
    {
        /// <summary>
        /// Create or update the resource from the item's manifest document. The default.
        /// </summary>
        Upsert,

        /// <summary>
        /// Delete the resource. Drafts can delete Agent, Deployment, Pipeline, and AgenticApp.
        /// </summary>
        Delete
    }
}
