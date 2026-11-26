namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of garrison_list_reports (AA5.4).</summary>
    public class McpReportList
    {
        /// <summary>Reports, newest first, with their metrics, issues, and decisions.</summary>
        public List<Report> Reports { get; set; } = new List<Report>();

        /// <summary>Total matching reports.</summary>
        public long TotalCount { get; set; } = 0;
    }
}
