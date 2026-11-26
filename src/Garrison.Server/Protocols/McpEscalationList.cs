namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of the escalation list tools (AA2.7, AA2.9).</summary>
    public class McpEscalationList
    {
        /// <summary>Escalations, Open first, then newest first.</summary>
        public List<Escalation> Escalations { get; set; } = new List<Escalation>();

        /// <summary>Total matching escalations (for garrison_list_escalations), or the number returned.</summary>
        public long TotalCount { get; set; } = 0;
    }
}
