namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Agent names and mandate summaries read while drawing one chart, so each is read once. Not thread-safe.
    /// </summary>
    public class ChartLookups
    {
        /// <summary>
        /// Agent names by identifier; null for an agent that no longer exists.
        /// </summary>
        public Dictionary<string, string?> AgentNames { get; } = new Dictionary<string, string?>(StringComparer.Ordinal);

        /// <summary>
        /// Mandate name and summary by mandate identifier.
        /// </summary>
        public Dictionary<string, OrgChartMember> Mandates { get; } = new Dictionary<string, OrgChartMember>(StringComparer.Ordinal);
    }
}
