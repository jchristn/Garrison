namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Security;
    using Garrison.Server.Runtime;

    /// <summary>
    /// Finds what a resource-scoped grant can match for a target (UT-01, UT-02): the identifier behind a name, and the
    /// organizations the target belongs to. Membership comes from <see cref="ChainOfCommand"/>, so only published
    /// revisions of live organizations count; a unit is also placed by its working-tree row. Every read filters by the
    /// tenant. The kind of target is taken from its identifier prefix, and a value without a known prefix is treated as a
    /// name of the requested resource type. Thread-safe.
    /// </summary>
    public class ResourceLineageResolver
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ChainOfCommand _Chain;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="chain">Chain of command, the only reader of reporting lines.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ResourceLineageResolver(DatabaseDriverBase database, ChainOfCommand chain)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The lineage of a target.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="resourceType">Resource type the request names, used to resolve a value that is a name.</param>
        /// <param name="idOrName">Identifier or name of the target.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Lineage; empty when the target is unknown or belongs to no organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<ResourceLineage> ResolveAsync(string tenantId, ResourceTypeEnum resourceType, string? idOrName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            ResourceLineage lineage = new ResourceLineage();
            string value = (idOrName ?? String.Empty).Trim();
            if (value.Length == 0) return lineage;
            List<OrgTree>? trees = null;
            Func<Task<List<OrgTree>>> live = async () => trees ??= await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false);

            if (value.StartsWith(Constants.OrganizationIdPrefix, StringComparison.Ordinal))
            {
                return lineage;
            }
            if (value.StartsWith(Constants.OrgUnitIdPrefix, StringComparison.Ordinal))
            {
                await AddUnitAsync(tenantId, value, lineage, live, token).ConfigureAwait(false);
                return lineage;
            }
            if (value.StartsWith("agt_", StringComparison.Ordinal))
            {
                AddAgent(value, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith(Constants.MandateIdPrefix, StringComparison.Ordinal))
            {
                Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (mandate != null) AddMandate(mandate, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith("dep_", StringComparison.Ordinal))
            {
                Deployment? deployment = await _Database.Deployments.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (deployment != null) AddAgent(deployment.AgentId, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith("run_", StringComparison.Ordinal))
            {
                Run? run = await _Database.Runs.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (run != null) AddAgent(run.AgentId, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith(Constants.EscalationIdPrefix, StringComparison.Ordinal))
            {
                Escalation? escalation = await _Database.Escalations.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (escalation == null) return lineage;
                AddAgent(escalation.AgentId, lineage, await live().ConfigureAwait(false));
                if (escalation.TargetKind == EscalationTargetKindEnum.Agent) AddAgent(escalation.TargetId, lineage, await live().ConfigureAwait(false));
                if (!String.IsNullOrEmpty(escalation.MandateId))
                {
                    Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, escalation.MandateId, token).ConfigureAwait(false);
                    if (mandate != null) AddMandate(mandate, lineage, await live().ConfigureAwait(false));
                }
                return lineage;
            }
            if (value.StartsWith(Constants.FreezeIdPrefix, StringComparison.Ordinal))
            {
                Freeze? freeze = await _Database.Freezes.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (freeze != null) await AddFreezeTargetAsync(tenantId, freeze.TargetKind, freeze.TargetId, lineage, live, token).ConfigureAwait(false);
                return lineage;
            }
            if (value.StartsWith(Constants.ReportIdPrefix, StringComparison.Ordinal))
            {
                Report? report = await _Database.Reports.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (report == null) return lineage;
                AddAgent(report.AuthorAgentId, lineage, await live().ConfigureAwait(false));
                if (!String.IsNullOrEmpty(report.OrgUnitId)) await AddUnitAsync(tenantId, report.OrgUnitId, lineage, live, token).ConfigureAwait(false);
                return lineage;
            }
            if (value.StartsWith(Constants.ChangeRuleIdPrefix, StringComparison.Ordinal))
            {
                ChangeRule? rule = await _Database.ChangeRules.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (rule != null) lineage.AddAncestor(rule.OrganizationId);
                return lineage;
            }
            if (value.StartsWith(Constants.MemoryEntryIdPrefix, StringComparison.Ordinal))
            {
                MemoryEntry? entry = await _Database.MemoryEntries.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (entry == null) return lineage;
                if (entry.ScopeKind == MemoryScopeKindEnum.Organization) lineage.AddAncestor(entry.ScopeId);
                else if (entry.ScopeKind == MemoryScopeKindEnum.OrgUnit) await AddUnitAsync(tenantId, entry.ScopeId, lineage, live, token).ConfigureAwait(false);
                else if (entry.ScopeKind == MemoryScopeKindEnum.Agent) AddAgent(entry.ScopeId, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith(Constants.AgentMessageIdPrefix, StringComparison.Ordinal))
            {
                AgentMessage? message = await _Database.AgentMessages.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (message == null) return lineage;
                AddAgent(message.SenderAgentId, lineage, await live().ConfigureAwait(false));
                AddAgent(message.RecipientAgentId, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith(Constants.EvalSetIdPrefix, StringComparison.Ordinal))
            {
                EvalSet? set = await _Database.EvalSets.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (set != null && !String.IsNullOrEmpty(set.AuthoringOrgUnitId)) await AddUnitAsync(tenantId, set.AuthoringOrgUnitId, lineage, live, token).ConfigureAwait(false);
                return lineage;
            }
            if (value.StartsWith(Constants.EvalRunIdPrefix, StringComparison.Ordinal))
            {
                EvalRun? evalRun = await _Database.EvalRuns.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (evalRun == null) return lineage;
                AddAgent(evalRun.AgentId, lineage, await live().ConfigureAwait(false));
                if (!String.IsNullOrEmpty(evalRun.DeploymentId))
                {
                    Deployment? deployment = await _Database.Deployments.ReadAsync(tenantId, evalRun.DeploymentId, token).ConfigureAwait(false);
                    if (deployment != null) AddAgent(deployment.AgentId, lineage, await live().ConfigureAwait(false));
                }
                return lineage;
            }
            if (value.StartsWith(Constants.ShadowTrialIdPrefix, StringComparison.Ordinal))
            {
                ShadowTrial? trial = await _Database.ShadowTrials.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (trial != null) AddAgent(trial.AgentId, lineage, await live().ConfigureAwait(false));
                return lineage;
            }
            if (value.StartsWith(Constants.CanaryReleaseIdPrefix, StringComparison.Ordinal))
            {
                CanaryRelease? canary = await _Database.CanaryReleases.ReadAsync(tenantId, value, token).ConfigureAwait(false);
                if (canary != null) AddAgent(canary.AgentId, lineage, await live().ConfigureAwait(false));
                return lineage;
            }

            // A value without a known prefix is a name of the requested type: resolve it to its identifier, which is an
            // alias, then place that identifier.
            switch (resourceType)
            {
                case ResourceTypeEnum.Organization:
                    Organization? organization = await _Database.Organizations.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (organization != null) lineage.AddAlias(organization.Id);
                    break;
                case ResourceTypeEnum.Agent:
                    Agent? agent = await _Database.Agents.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (agent != null)
                    {
                        lineage.AddAlias(agent.Id);
                        AddAgent(agent.Id, lineage, await live().ConfigureAwait(false));
                    }
                    break;
                case ResourceTypeEnum.Deployment:
                    Deployment? named = await _Database.Deployments.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (named != null)
                    {
                        lineage.AddAlias(named.Id);
                        AddAgent(named.AgentId, lineage, await live().ConfigureAwait(false));
                    }
                    break;
                case ResourceTypeEnum.Mandate:
                    Mandate? keeper = await _Database.Mandates.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (keeper != null)
                    {
                        lineage.AddAlias(keeper.Id);
                        AddMandate(keeper, lineage, await live().ConfigureAwait(false));
                    }
                    break;
                case ResourceTypeEnum.AgenticApp:
                    AgenticApp? app = await _Database.Apps.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
                    if (app != null) lineage.AddAlias(app.Id);
                    break;
            }
            return lineage;
        }

        /// <summary>
        /// The lineage of a freeze target before the freeze exists, for authorizing a new freeze against the target.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="targetKind">Target kind.</param>
        /// <param name="targetId">Resolved target identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Lineage. A TenantAutonomy or App target belongs to no organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<ResourceLineage> ResolveFreezeTargetAsync(string tenantId, FreezeTargetKindEnum targetKind, string? targetId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            ResourceLineage lineage = new ResourceLineage();
            List<OrgTree>? trees = null;
            Func<Task<List<OrgTree>>> live = async () => trees ??= await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false);
            await AddFreezeTargetAsync(tenantId, targetKind, targetId, lineage, live, token).ConfigureAwait(false);
            return lineage;
        }

        /// <summary>
        /// The members of a set of organizations in their live trees: the organizations, their units, the agents that
        /// hold positions, and the keepers named on seats. Used to filter tenant lists for a principal whose access comes
        /// from organization-scoped grants.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationIds">Organization identifiers.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Members.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or organizationIds is null.</exception>
        public async Task<OrganizationMembers> MembersAsync(string tenantId, IEnumerable<string> organizationIds, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (organizationIds == null) throw new ArgumentNullException(nameof(organizationIds));
            OrganizationMembers members = new OrganizationMembers();
            HashSet<string> wanted = new HashSet<string>(organizationIds, StringComparer.Ordinal);
            foreach (string id in wanted) members.OrganizationIds.Add(id);
            foreach (OrgTree tree in await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                if (!wanted.Contains(tree.Organization.Id)) continue;
                foreach (OrgUnit unit in tree.Units)
                {
                    members.UnitIds.Add(unit.Id);
                    if (!String.IsNullOrEmpty(unit.LeadMandateId)) members.MandateIds.Add(unit.LeadMandateId);
                    foreach (OrgUnitMember member in unit.Members)
                    {
                        if (!String.IsNullOrEmpty(member.MandateId)) members.MandateIds.Add(member.MandateId);
                    }
                }
                foreach (string agentId in tree.AgentIds()) members.AgentIds.Add(agentId);
            }
            // The keepers and deployments of member agents belong to the organization too, as their lineage says.
            foreach (string agentId in members.AgentIds.ToList())
            {
                token.ThrowIfCancellationRequested();
                foreach (Deployment deployment in await _Database.Deployments.ListByAgentAsync(tenantId, agentId, token).ConfigureAwait(false)) members.DeploymentIds.Add(deployment.Id);
                EnumerationQuery query = new EnumerationQuery { MaxResults = 1000 };
                foreach (Mandate mandate in (await _Database.Mandates.EnumerateAsync(tenantId, null, agentId, null, query, token).ConfigureAwait(false)).Objects) members.MandateIds.Add(mandate.Id);
            }
            return members;
        }

        #endregion

        #region Private-Methods

        private async Task AddUnitAsync(string tenantId, string unitId, ResourceLineage lineage, Func<Task<List<OrgTree>>> live, CancellationToken token)
        {
            OrgUnit? unit = await _Database.Organizations.ReadUnitAsync(tenantId, unitId, token).ConfigureAwait(false);
            if (unit != null) lineage.AddAncestor(unit.OrganizationId);
            foreach (OrgTree tree in await live().ConfigureAwait(false))
            {
                if (tree.Unit(unitId) != null) lineage.AddAncestor(tree.Organization.Id);
            }
        }

        private static void AddAgent(string? agentId, ResourceLineage lineage, List<OrgTree> trees)
        {
            if (String.IsNullOrEmpty(agentId)) return;
            foreach (OrgTree tree in trees)
            {
                if (tree.PositionOf(agentId) != null) lineage.AddAncestor(tree.Organization.Id);
            }
        }

        private static void AddMandate(Mandate mandate, ResourceLineage lineage, List<OrgTree> trees)
        {
            AddAgent(mandate.AgentId, lineage, trees);
            foreach (OrgTree tree in trees)
            {
                bool seated = tree.Units.Any(u => String.Equals(u.LeadMandateId, mandate.Id, StringComparison.Ordinal)
                    || u.Members.Any(m => String.Equals(m.MandateId, mandate.Id, StringComparison.Ordinal)));
                if (seated) lineage.AddAncestor(tree.Organization.Id);
            }
        }

        private async Task AddFreezeTargetAsync(string tenantId, FreezeTargetKindEnum targetKind, string? targetId, ResourceLineage lineage, Func<Task<List<OrgTree>>> live, CancellationToken token)
        {
            if (String.IsNullOrEmpty(targetId)) return;
            switch (targetKind)
            {
                case FreezeTargetKindEnum.Organization:
                    lineage.AddAncestor(targetId);
                    return;
                case FreezeTargetKindEnum.OrgUnit:
                    await AddUnitAsync(tenantId, targetId, lineage, live, token).ConfigureAwait(false);
                    return;
                case FreezeTargetKindEnum.Agent:
                    AddAgent(targetId, lineage, await live().ConfigureAwait(false));
                    return;
                case FreezeTargetKindEnum.Mandate:
                    Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, targetId, token).ConfigureAwait(false);
                    if (mandate != null) AddMandate(mandate, lineage, await live().ConfigureAwait(false));
                    return;
                case FreezeTargetKindEnum.Deployment:
                    Deployment? deployment = await _Database.Deployments.ReadAsync(tenantId, targetId, token).ConfigureAwait(false);
                    if (deployment != null) AddAgent(deployment.AgentId, lineage, await live().ConfigureAwait(false));
                    return;
                default:
                    // TenantAutonomy is the kill switch, which reaches every organization; an App belongs to none.
                    return;
            }
        }

        #endregion
    }
}
