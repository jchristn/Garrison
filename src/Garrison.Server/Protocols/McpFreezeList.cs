namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of garrison_list_freezes (AA3.5).</summary>
    public class McpFreezeList
    {
        /// <summary>Freezes, active first, then newest first.</summary>
        public List<Freeze> Freezes { get; set; } = new List<Freeze>();

        /// <summary>Total matching freezes.</summary>
        public long TotalCount { get; set; } = 0;

        /// <summary>Whether the autonomy kill switch is on.</summary>
        public bool KillSwitchEnabled { get; set; } = false;
    }
}
