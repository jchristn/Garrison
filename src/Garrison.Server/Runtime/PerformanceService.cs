namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;

    /// <summary>
    /// Performance rollups of an organization's live tree (AA11.1, AA11.2): per agent and per unit subtree over a window,
    /// from the same run rows run analytics reads (Eval, Shadow, and Playground runs left out), plus escalations raised,
    /// loop-guard refusals of sent messages, eval scores on the agents' deployments, and the scheduled checks (AA11.3).
    /// Every read filters by the organization's tenant. Thread-safe.
    /// </summary>
    public class PerformanceService
    {
        #region Public-Members

        /// <summary>
        /// Most runs read per rollup; the newest are kept and the response says it was truncated. Minimum 1, maximum
        /// 1000000, default 100000.
        /// </summary>
        public int MaxRuns
        {
            get
            {
                return _MaxRuns;
            }
            set
            {
                _MaxRuns = Math.Clamp(value, 1, 1000000);
            }
        }

        /// <summary>
        /// Most completed eval runs read per rollup. Minimum 1, maximum 100000, default 10000.
        /// </summary>
        public int MaxEvalRuns
        {
            get
            {
                return _MaxEvalRuns;
            }
            set
            {
                _MaxEvalRuns = Math.Clamp(value, 1, 100000);
            }
        }

        /// <summary>
        /// Window used when the request gives no start. Minimum one hour, maximum <see cref="MaxWindow"/>, default 7 days.
        /// </summary>
        public TimeSpan DefaultWindow
        {
            get
            {
                return _DefaultWindow;
            }
            set
            {
                if (value < TimeSpan.FromHours(1)) value = TimeSpan.FromHours(1);
                if (value > MaxWindow) value = MaxWindow;
                _DefaultWindow = value;
            }
        }

        /// <summary>
        /// Longest window a request may ask for: 90 days. A longer one is refused with 400.
        /// </summary>
        public static TimeSpan MaxWindow
        {
            get
            {
                return TimeSpan.FromDays(90);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private int _MaxRuns = 100000;
        private int _MaxEvalRuns = 10000;
        private TimeSpan _DefaultWindow = TimeSpan.FromDays(7);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context with the chain of command registered.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public PerformanceService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Performance of an organization, or of one unit's subtree, over a window.
        /// </summary>
        /// <param name="organization">Organization, already loaded from the caller's tenant.</param>
        /// <param name="query">Window and optional unit; null for the defaults.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rollup. Before the first publish the lists are empty.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the window is empty or longer than 90 days.</exception>
        /// <exception cref="NotFoundException">Thrown when unitId names no unit of the organization's live tree.</exception>
        public async Task<OrgPerformance> GetAsync(Organization organization, PerformanceQuery? query, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            query = query ?? new PerformanceQuery();
            Window(query, out DateTime fromUtc, out DateTime toUtc);
            OrgTree? tree = await _Server.Get<ChainOfCommand>().TreeAsync(organization, token).ConfigureAwait(false);
            OrgUnit? unit = null;
            if (!String.IsNullOrWhiteSpace(query.UnitId))
            {
                string key = query.UnitId.Trim();
                unit = tree?.Unit(key) ?? tree?.UnitByName(key);
                if (unit == null) throw new NotFoundException("Unit " + key + " is not in organization " + organization.Name + ".");
            }
            return await BuildAsync(organization, tree, unit, fromUtc, toUtc, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Performance of one unit's subtree in a live tree (the subordinate tool, AA11.2). The caller has already checked
        /// that the unit lies in the lead's subtree.
        /// </summary>
        /// <param name="tree">Live tree.</param>
        /// <param name="unit">Unit of the tree.</param>
        /// <param name="query">Window; its unitId is ignored. Null for the defaults.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rollup restricted to the unit's subtree.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tree or unit is null.</exception>
        /// <exception cref="ValidationException">Thrown when the window is empty or longer than 90 days.</exception>
        public async Task<OrgPerformance> GetSubtreeAsync(OrgTree tree, OrgUnit unit, PerformanceQuery? query, CancellationToken token = default)
        {
            if (tree == null) throw new ArgumentNullException(nameof(tree));
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            Window(query ?? new PerformanceQuery(), out DateTime fromUtc, out DateTime toUtc);
            return await BuildAsync(tree.Organization, tree, unit, fromUtc, toUtc, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private void Window(PerformanceQuery query, out DateTime fromUtc, out DateTime toUtc)
        {
            toUtc = query.ToUtc.HasValue ? DateTime.SpecifyKind(query.ToUtc.Value, DateTimeKind.Utc) : DateTime.UtcNow;
            fromUtc = query.FromUtc.HasValue ? DateTime.SpecifyKind(query.FromUtc.Value, DateTimeKind.Utc) : toUtc - _DefaultWindow;
            if (fromUtc >= toUtc)
            {
                throw new ValidationException("fromUtc must be earlier than toUtc.", new Dictionary<string, string> { { "fromUtc", "Must be earlier than toUtc." } }, new Dictionary<string, string> { { "fromUtc", "InvalidValue" } });
            }
            if (toUtc - fromUtc > MaxWindow)
            {
                throw new ValidationException("The window is longer than " + MaxWindow.TotalDays + " days.", new Dictionary<string, string> { { "fromUtc", "The window is at most " + MaxWindow.TotalDays + " days." } }, new Dictionary<string, string> { { "fromUtc", "WindowTooLong" } });
            }
        }

        private async Task<OrgPerformance> BuildAsync(Organization organization, OrgTree? tree, OrgUnit? scope, DateTime fromUtc, DateTime toUtc, CancellationToken token)
        {
            string tenantId = organization.TenantId;
            OrgPerformance result = new OrgPerformance();
            result.OrganizationId = organization.Id;
            result.Name = organization.Name;
            result.FromUtc = fromUtc;
            result.ToUtc = toUtc;
            result.GeneratedUtc = DateTime.UtcNow;
            if (tree == null) return result;

            HashSet<string> scopeIds = new HashSet<string>(scope != null ? tree.Subtree(scope.Id).Select(u => u.Id) : tree.Units.Select(u => u.Id), StringComparer.Ordinal);
            List<OrgUnit> units = OrganizationService.TreeOrder(organization, tree.Units.ToList()).Where(u => scopeIds.Contains(u.Id)).ToList();

            // Agents in chart order: each unit's lead, then its members.
            List<AgentPerformance> agents = new List<AgentPerformance>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units)
            {
                if (!String.IsNullOrEmpty(unit.LeadAgentId) && seen.Add(unit.LeadAgentId)) agents.Add(new AgentPerformance { AgentId = unit.LeadAgentId, AgentName = unit.LeadAgentName, UnitId = unit.Id, UnitName = unit.Name, IsLead = true });
                foreach (OrgUnitMember member in unit.Members)
                {
                    if (!String.IsNullOrEmpty(member.AgentId) && seen.Add(member.AgentId)) agents.Add(new AgentPerformance { AgentId = member.AgentId, UnitId = unit.Id, UnitName = unit.Name, IsLead = false });
                }
            }
            List<string> agentIds = agents.Select(a => a.AgentId).ToList();
            if (agentIds.Count == 0)
            {
                foreach (OrgUnit unit in units) result.Units.Add(UnitRow(unit, new PerformanceAccumulator().ToMetrics()));
                return result;
            }

            foreach (AgentPerformance agent in agents.Where(a => String.IsNullOrEmpty(a.AgentName)))
            {
                token.ThrowIfCancellationRequested();
                Agent? stored = await _Server.Database.Agents.ReadAsync(tenantId, agent.AgentId, token).ConfigureAwait(false);
                agent.AgentName = stored?.Name;
            }

            List<Run> runs = await _Server.Database.Runs.ListForPerformanceAsync(tenantId, agentIds, fromUtc, toUtc, _MaxRuns + 1, token).ConfigureAwait(false);
            result.Truncated = runs.Count > _MaxRuns;
            if (result.Truncated) runs = runs.Take(_MaxRuns).ToList();
            Dictionary<string, List<Run>> runsByAgent = runs.GroupBy(r => r.AgentId, StringComparer.Ordinal).ToDictionary(g => g.Key, g => g.ToList(), StringComparer.Ordinal);
            Dictionary<string, long> escalations = await _Server.Database.Escalations.CountRaisedByAgentAsync(tenantId, agentIds, fromUtc, toUtc, token).ConfigureAwait(false);
            Dictionary<string, long> loopGuard = await _Server.Database.AgentMessages.CountLoopGuardRejectionsAsync(tenantId, agentIds, fromUtc, toUtc, token).ConfigureAwait(false);

            Dictionary<string, string> deploymentAgents = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (string agentId in agentIds)
            {
                token.ThrowIfCancellationRequested();
                foreach (Deployment deployment in await _Server.Database.Deployments.ListByAgentAsync(tenantId, agentId, token).ConfigureAwait(false))
                {
                    deploymentAgents[deployment.Id] = agentId;
                }
            }
            List<EvalRun> evalRuns = await _Server.Database.EvalRuns.ListCompletedForDeploymentsAsync(tenantId, deploymentAgents.Keys.ToList(), fromUtc, toUtc, _MaxEvalRuns, token).ConfigureAwait(false);
            Dictionary<string, List<EvalRun>> evalsByAgent = evalRuns.Where(e => e.DeploymentId != null && deploymentAgents.ContainsKey(e.DeploymentId))
                .GroupBy(e => deploymentAgents[e.DeploymentId!], StringComparer.Ordinal).ToDictionary(g => g.Key, g => g.ToList(), StringComparer.Ordinal);

            foreach (AgentPerformance agent in agents)
            {
                agent.Metrics = Accumulate(new[] { agent.AgentId }, runsByAgent, evalsByAgent, escalations, loopGuard);
                result.Agents.Add(agent);
            }
            foreach (OrgUnit unit in units)
            {
                HashSet<string> subtree = tree.SubtreeAgentIds(unit.Id);
                result.Units.Add(UnitRow(unit, Accumulate(subtree, runsByAgent, evalsByAgent, escalations, loopGuard)));
            }

            // Scheduled checks on the scope's deployments (AA11.3).
            List<Trigger> checks = await _Server.Database.Triggers.ListByTargetTypeAsync(tenantId, TriggerTargetTypeEnum.EvalSet, token).ConfigureAwait(false);
            foreach (Trigger trigger in checks.Where(t => !String.IsNullOrEmpty(t.DeploymentId) && deploymentAgents.ContainsKey(t.DeploymentId)))
            {
                token.ThrowIfCancellationRequested();
                result.Checks.Add(await CheckAsync(tenantId, trigger, deploymentAgents[trigger.DeploymentId!], token).ConfigureAwait(false));
            }
            return result;
        }

        private async Task<PerformanceCheck> CheckAsync(string tenantId, Trigger trigger, string agentId, CancellationToken token)
        {
            PerformanceCheck check = new PerformanceCheck();
            check.TriggerId = trigger.Id;
            check.TriggerName = trigger.Name;
            check.Active = trigger.Active;
            check.EvalSetId = trigger.EvalSetId ?? String.Empty;
            check.DeploymentId = trigger.DeploymentId ?? String.Empty;
            check.AgentId = agentId;
            check.CronExpression = trigger.Type == TriggerTypeEnum.Cron ? trigger.CronExpression : null;
            check.NextFireUtc = trigger.NextFireUtc;
            if (!String.IsNullOrEmpty(trigger.EvalSetId))
            {
                EvalSet? set = await _Server.Database.EvalSets.ReadAsync(tenantId, trigger.EvalSetId, token).ConfigureAwait(false);
                check.EvalSetName = set?.Name;
            }
            EvalRun? last = await _Server.Database.EvalRuns.ReadLatestByTriggerAsync(tenantId, trigger.Id, token).ConfigureAwait(false);
            if (last != null)
            {
                check.LastEvalRunId = last.Id;
                check.LastRunUtc = last.CreatedUtc;
                check.LastStatus = last.Status;
                check.LastScore = last.Score;
                check.LastPassed = last.Passed;
                if (check.EvalSetName == null) check.EvalSetName = last.SetName;
            }
            return check;
        }

        private static PerformanceMetrics Accumulate(IEnumerable<string> agentIds, Dictionary<string, List<Run>> runs, Dictionary<string, List<EvalRun>> evals, Dictionary<string, long> escalations, Dictionary<string, long> loopGuard)
        {
            PerformanceAccumulator accumulator = new PerformanceAccumulator();
            foreach (string agentId in agentIds)
            {
                if (runs.TryGetValue(agentId, out List<Run>? agentRuns)) accumulator.AddRuns(agentRuns);
                if (evals.TryGetValue(agentId, out List<EvalRun>? agentEvals)) accumulator.AddEvalRuns(agentEvals);
                if (escalations.TryGetValue(agentId, out long raised)) accumulator.AddEscalations(raised);
                if (loopGuard.TryGetValue(agentId, out long refused)) accumulator.AddLoopGuardRejections(refused);
            }
            return accumulator.ToMetrics();
        }

        private static OrgUnitPerformance UnitRow(OrgUnit unit, PerformanceMetrics metrics)
        {
            OrgUnitPerformance row = new OrgUnitPerformance();
            row.UnitId = unit.Id;
            row.UnitName = unit.Name;
            row.ParentUnitId = unit.ParentUnitId;
            row.LeadAgentId = unit.LeadAgentId;
            row.Metrics = metrics;
            return row;
        }

        #endregion
    }
}
