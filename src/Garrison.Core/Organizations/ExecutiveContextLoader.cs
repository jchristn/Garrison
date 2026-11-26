namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Loads an executive's authority for its system prompt (AA8.8): the unit a deployment with managementAccess OrgSubtree
    /// leads in a live organization, the units below it, and the change rules that bear on them. Thread-safe.
    /// </summary>
    public class ExecutiveContextLoader
    {
        #region Public-Members

        /// <summary>
        /// Name of the built-in fragment template (builtin/executive-system); a tenant Fragment template with this name
        /// replaces it for the tenant.
        /// </summary>
        public static readonly string TemplateName = "executive-system";

        /// <summary>
        /// Prompt role of the fragment; a deployment binding for this role replaces it for the deployment.
        /// </summary>
        public static readonly string Role = "ExecutiveSystem";

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
        public ExecutiveContextLoader(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Load the executive context of a deployment's run.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="agentId">The run's agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The context, or null when the deployment is not OrgSubtree or the agent leads no single live unit.</returns>
        public async Task<CompilationExecutiveContext?> LoadAsync(string tenantId, Deployment deployment, string? agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (deployment == null || deployment.ManagementAccess != ManagementAccessEnum.OrgSubtree || String.IsNullOrEmpty(agentId)) return null;
            OrgTree? found = null;
            OrgUnit? led = null;
            foreach (Organization organization in await _Database.Organizations.ListLiveAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgRevision? revision = await _Database.Organizations.ReadRevisionAsync(tenantId, organization.CurrentRevisionId!, token).ConfigureAwait(false);
                if (revision == null) continue;
                OrgTree tree = new OrgTree(organization, revision.Units, revision.Id);
                foreach (OrgUnit unit in tree.Units.Where(u => u.LeadAgentId == agentId))
                {
                    if (led != null) return null;
                    found = tree;
                    led = unit;
                }
            }
            if (found == null || led == null) return null;

            CompilationExecutiveContext context = new CompilationExecutiveContext();
            context.OrganizationName = found.Organization.Name;
            context.UnitName = led.Name;
            HashSet<string> agents = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in found.Subtree(led.Id).Where(u => u.Id != led.Id))
            {
                CompilationExecutiveUnit entry = new CompilationExecutiveUnit();
                entry.Name = unit.Name;
                entry.ParentName = found.Unit(unit.ParentUnitId ?? String.Empty)?.Name ?? String.Empty;
                entry.LeadName = String.IsNullOrEmpty(unit.LeadAgentId) ? null : await NameAsync(tenantId, unit.LeadAgentId, token).ConfigureAwait(false);
                entry.MemberCount = unit.Members.Count;
                context.Units.Add(entry);
                if (!String.IsNullOrEmpty(unit.LeadAgentId)) agents.Add(unit.LeadAgentId);
                foreach (OrgUnitMember member in unit.Members) agents.Add(member.AgentId);
            }
            agents.Remove(agentId);
            context.AgentCount = agents.Count;

            foreach (ChangeRule rule in await _Database.ChangeRules.ListInForceAsync(tenantId, found.Organization.Id, DateTime.UtcNow, token).ConfigureAwait(false))
            {
                if (!found.InSubtree(led.Id, rule.UnitId) && !found.InSubtree(rule.UnitId, led.Id)) continue;
                CompilationExecutiveRule entry = new CompilationExecutiveRule();
                entry.Name = rule.Name;
                entry.UnitName = found.Unit(rule.UnitId)?.Name ?? rule.UnitId;
                entry.Classes = String.Join(", ", rule.Classes.Select(c => c.Class.ToString()));
                entry.Limits = rule.Limits.Count == 0 ? null : String.Join("; ", rule.Limits.Select(Describe));
                entry.Expires = rule.ExpiresUtc?.ToString("u", CultureInfo.InvariantCulture);
                context.Rules.Add(entry);
            }
            return context;
        }

        #endregion

        #region Private-Methods

        private static string Describe(ChangeRuleLimit limit)
        {
            string min = limit.Minimum?.ToString("0.####", CultureInfo.InvariantCulture) ?? String.Empty;
            string max = limit.Maximum?.ToString("0.####", CultureInfo.InvariantCulture) ?? String.Empty;
            string range = limit.Minimum.HasValue && limit.Maximum.HasValue ? "from " + min + " to " + max : limit.Maximum.HasValue ? "at most " + max : "at least " + min;
            return limit.Class + " " + limit.Name + " " + range;
        }

        private async Task<string> NameAsync(string tenantId, string agentId, CancellationToken token)
        {
            Agent? agent = await _Database.Agents.ReadAsync(tenantId, agentId, token).ConfigureAwait(false);
            return agent?.Name ?? agentId;
        }

        #endregion
    }
}
