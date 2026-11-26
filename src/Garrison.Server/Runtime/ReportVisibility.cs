namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Who sees which report (AA5.3, AA-056). People and credentials with Read on Report see every report in their tenant,
    /// checked by the caller. A run sees its own agent's reports and, before organizations exist (AA7), the reports of the
    /// members of the apps its agent is the entry agent of: a report filed within an app reaches that app's entry agent,
    /// and a report filed without an app reaches the entry agents of every app its author belongs to. Every audience
    /// resolves the same way until AA7 gives Manager, Chain, and Board their own reach. A peer never sees another peer's
    /// report. Thread-safe.
    /// </summary>
    public class ReportVisibility
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public ReportVisibility(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The reports an agent's runs may see: its own and its subordinates'.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">The viewing agent.</param>
        /// <param name="includeOwn">Whether to include the agent's own reports.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Visibility scope for a report filter.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or agentId is null or empty.</exception>
        public async Task<ReportVisibilityScope> ScopeForAsync(string tenantId, string agentId, bool includeOwn, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            ReportVisibilityScope scope = new ReportVisibilityScope();
            scope.AgentId = agentId;
            scope.IncludeOwn = includeOwn;
            scope.ManagedAppIds = await _Database.Apps.AppIdsWithEntryAgentAsync(tenantId, agentId, token).ConfigureAwait(false);
            List<string> members = await _Database.Apps.MemberAgentIdsAsync(tenantId, scope.ManagedAppIds, token).ConfigureAwait(false);
            scope.SubordinateAgentIds = members.Where(m => !String.Equals(m, agentId, StringComparison.Ordinal)).ToList();
            return scope;
        }

        /// <summary>
        /// Whether a run of an agent may read a report.
        /// </summary>
        /// <param name="agentId">The viewing agent.</param>
        /// <param name="report">The report, read in the viewer's tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when visible.</returns>
        /// <exception cref="ArgumentNullException">Thrown when agentId is null or empty or report is null.</exception>
        public async Task<bool> VisibleToAgentAsync(string agentId, Report report, CancellationToken token)
        {
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            if (report == null) throw new ArgumentNullException(nameof(report));
            if (String.Equals(report.AuthorAgentId, agentId, StringComparison.Ordinal)) return true;
            if (String.IsNullOrEmpty(report.AuthorAgentId)) return false;
            List<string> managed = await _Database.Apps.AppIdsWithEntryAgentAsync(report.TenantId, agentId, token).ConfigureAwait(false);
            if (managed.Count == 0) return false;
            List<string> authorApps = await _Database.Apps.AppIdsWithMemberAsync(report.TenantId, report.AuthorAgentId, token).ConfigureAwait(false);
            if (!authorApps.Any(a => managed.Contains(a))) return false;
            return String.IsNullOrEmpty(report.AppId) || managed.Contains(report.AppId);
        }

        #endregion
    }
}
