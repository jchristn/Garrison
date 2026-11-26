namespace Garrison.Core.Organizations
{
    using System;

    /// <summary>
    /// A hard limit an executive's draft item breaks (AA8.3, AA-022). No change rule lifts it. Not thread-safe.
    /// </summary>
    public class ExecutiveRefusal
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind of the item.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Name of the item.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// OutsideSubtree, SelfModification, ForbiddenKind, BudgetIncrease, or AuthorityChange.
        /// </summary>
        public string Code { get; set; } = String.Empty;

        /// <summary>
        /// What is wrong, written for the executive that has to fix it.
        /// </summary>
        public string Message { get; set; } = String.Empty;

        #endregion
    }
}
