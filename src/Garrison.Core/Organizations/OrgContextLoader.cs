namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>
    /// Reads where an agent sits in a live organization for builtin/org-context (AA7.8). The first live organization, by
    /// creation, in which the agent holds a position is used. Thread-safe.
    /// </summary>
    public class OrgContextLoader
    {
        #region Public-Members

        /// <summary>
        /// Name of the built-in template (builtin/org-context).
        /// </summary>
        public static readonly string TemplateName = "org-context";

        /// <summary>
        /// Compiler prompt role the template is bound to. A deployment binding for this role replaces the tenant's
        /// org-context Fragment, which replaces the built-in.
        /// </summary>
        public static readonly string Role = "OrgContext";

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public OrgContextLoader(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The org context of an agent, or null when it holds no position in a live organization.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Context or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<CompilationOrgContext?> LoadAsync(string tenantId, string? agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) return null;
            foreach (Organization organization in await _Database.Organizations.ListLiveAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgRevision? revision = await _Database.Organizations.ReadRevisionAsync(tenantId, organization.CurrentRevisionId!, token).ConfigureAwait(false);
                if (revision == null) continue;
                OrgTree tree = new OrgTree(organization, revision.Units, revision.Id);
                OrgPosition? position = tree.PositionOf(agentId);
                if (position == null) continue;
                CompilationOrgContext context = new CompilationOrgContext();
                context.OrganizationName = organization.Name;
                context.Mission = organization.Mission;
                context.UnitName = position.UnitName;
                context.Title = position.Title;
                context.IsLead = position.IsLead;
                if (!position.ManagerIsBoard) context.ManagerName = await NameAsync(tenantId, position.ManagerAgentId!, token).ConfigureAwait(false);
                foreach (string report in tree.DirectReports(agentId)) context.DirectReports.Add(await NameAsync(tenantId, report, token).ConfigureAwait(false));
                foreach (OrgUnit peer in tree.PeersOf(position.UnitId)) context.PeerUnits.Add(peer.Name);
                return context;
            }
            return null;
        }

        #endregion

        #region Private-Methods

        private async Task<string> NameAsync(string tenantId, string agentId, CancellationToken token)
        {
            Agent? agent = await _Database.Agents.ReadAsync(tenantId, agentId, token).ConfigureAwait(false);
            return agent?.Name ?? agentId;
        }

        #endregion
    }
}
