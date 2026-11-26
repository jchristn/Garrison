namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One class of change a change rule pre-authorizes (AA8.4). Not thread-safe.
    /// </summary>
    public class ChangeRuleClass
    {
        #region Public-Members

        /// <summary>
        /// The class.
        /// </summary>
        public ChangeClassEnum Class { get; set; } = ChangeClassEnum.PromptRetune;

        #endregion
    }
}
