namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// One escalation option row with its escalation identifier, used while loading options in bulk (AA2).
    /// </summary>
    public class EscalationOptionRow
    {
        /// <summary>
        /// Escalation identifier.
        /// </summary>
        public string EscalationId { get; set; } = String.Empty;

        /// <summary>
        /// The option.
        /// </summary>
        public EscalationOption Option { get; set; } = new EscalationOption();
    }
}
