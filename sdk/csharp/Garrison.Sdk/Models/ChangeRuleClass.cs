namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One class of change a change rule pre-authorizes (AA8.4). Not thread-safe.
    /// </summary>
    public class ChangeRuleClass
    {
        /// <summary>
        /// The class. Default PromptRetune.
        /// </summary>
        public ChangeClassEnum Class { get; set; } = ChangeClassEnum.PromptRetune;
    }
}
