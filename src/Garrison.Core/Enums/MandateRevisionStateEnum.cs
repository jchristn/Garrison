namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of a mandate revision (AA1). A published revision is immutable.
    /// </summary>
    public enum MandateRevisionStateEnum
    {
        /// <summary>
        /// Editable. Not used by ticks until published.
        /// </summary>
        Draft,

        /// <summary>
        /// Immutable. The latest published revision is the mandate's current revision.
        /// </summary>
        Published
    }
}
