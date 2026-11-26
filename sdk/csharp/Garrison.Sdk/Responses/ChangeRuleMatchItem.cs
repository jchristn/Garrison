namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// How one change of an executive's draft fared against the change rules (AA8.6). Not thread-safe.
    /// </summary>
    public class ChangeRuleMatchItem
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind of the item.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Item name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// What changed, or null.
        /// </summary>
        public string? Detail { get; set; } = null;

        /// <summary>
        /// What the change is about; count limits count distinct subjects, so a new worker's agent, deployment, and unit
        /// placement count once.
        /// </summary>
        public string Subject { get; set; } = String.Empty;

        /// <summary>
        /// Classes of the change. Never null.
        /// </summary>
        public List<ChangeClassEnum> Classes
        {
            get
            {
                return _Classes;
            }
            set
            {
                _Classes = value ?? new List<ChangeClassEnum>();
            }
        }

        /// <summary>
        /// The rule that covers the change, or null when it needs a person.
        /// </summary>
        public string? RuleId { get; set; } = null;

        /// <summary>
        /// The covering rule's name, or null.
        /// </summary>
        public string? RuleName { get; set; } = null;

        /// <summary>
        /// Why no rule covers the change, or null when one does.
        /// </summary>
        public string? Reason { get; set; } = null;

        #endregion

        #region Private-Members

        private List<ChangeClassEnum> _Classes = new List<ChangeClassEnum>();

        #endregion
    }
}
