namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of an eval set version (AA9.1). Approved versions are immutable: an edit creates the next version as a Draft (AA9.2).
    /// </summary>
    public enum EvalSetStateEnum
    {
        /// <summary>
        /// Being written; cases may be added, changed, and removed. A draft cannot gate a promotion or a change rule.
        /// </summary>
        Draft,

        /// <summary>
        /// Approved by a person (AA-024). Immutable; editing it creates the next version as a Draft.
        /// </summary>
        Approved
    }
}
