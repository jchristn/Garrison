namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Server.Services;

    /// <summary>
    /// Removes the eval copies the eval runner makes (AA9.3, AA9.10): the deployment copies eval-{agent}-r{n} of revision
    /// targets, and the agent and deployment copies eval-d{key}-{agent} and eval-{agent}-d{key} of studio draft targets.
    /// A draft's copies go when the draft is applied or deleted (<see cref="DeleteDraftCopiesAsync"/>); every other copy,
    /// and a draft copy that was still in use then, goes on the leader sweep once it has been idle for
    /// <see cref="IdleHours"/>. A copy is in use while it has an unfinished run, a pending or running eval run, a running
    /// shadow trial, or a running canary release; in-use copies are kept. Eval runs, their case results, and their runs are
    /// never deleted. Copies are recognized by the draft environment, protection, the eval- name prefix, and the
    /// description the runner gives them. Thread-safe.
    /// </summary>
    public class EvalCopyJanitor
    {
        #region Public-Members

        /// <summary>
        /// Hours a copy must be idle (no change and no run created or finished) before the sweep deletes it. Minimum 1,
        /// maximum 720, default 24.
        /// </summary>
        public int IdleHours
        {
            get
            {
                return _IdleHours;
            }
            set
            {
                _IdleHours = Math.Clamp(value, 1, 720);
            }
        }

        /// <summary>
        /// Seconds between sweeps that look for idle copies; the leader calls <see cref="SweepAsync(CancellationToken)"/> every maintenance
        /// pass and it does work at most this often. Minimum 60, maximum 86400, default 3600.
        /// </summary>
        public int SweepIntervalSeconds
        {
            get
            {
                return _SweepIntervalSeconds;
            }
            set
            {
                _SweepIntervalSeconds = Math.Clamp(value, 60, 86400);
            }
        }

        /// <summary>
        /// Clock for idle times. Default the system clock; tests set a manual one.
        /// </summary>
        public TimeProvider Clock
        {
            get
            {
                return _Clock;
            }
            set
            {
                _Clock = value ?? TimeProvider.System;
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _Marker = "(managed by the eval runner)";

        private readonly ServerContext _Server;
        private int _IdleHours = 24;
        private int _SweepIntervalSeconds = 3600;
        private TimeProvider _Clock = TimeProvider.System;
        private long _LastSweepTicks = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public EvalCopyJanitor(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a deployment is an eval copy made by the eval runner.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <returns>True for an eval copy.</returns>
        public static bool IsEvalCopy(Deployment deployment)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            return deployment.IsProtected
                && String.Equals(deployment.Environment, Constants.PlaygroundEnvironment, StringComparison.Ordinal)
                && deployment.Name.StartsWith("eval-", StringComparison.Ordinal)
                && deployment.Description != null
                && (deployment.Description.StartsWith("Eval copy for revision ", StringComparison.Ordinal) || deployment.Description.StartsWith("Eval copy of deployment ", StringComparison.Ordinal))
                && deployment.Description.Contains(_Marker, StringComparison.Ordinal);
        }

        /// <summary>
        /// Whether an agent is an eval copy of a new worker made for a studio draft's eval run.
        /// </summary>
        /// <param name="agent">Agent.</param>
        /// <returns>True for an eval copy.</returns>
        public static bool IsEvalCopy(Agent agent)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            return agent.IsProtected
                && agent.Name.StartsWith("eval-d", StringComparison.Ordinal)
                && agent.Description != null
                && agent.Description.StartsWith("Eval copy of agent ", StringComparison.Ordinal);
        }

        /// <summary>
        /// Delete a studio draft's eval copies (called when the draft is applied or deleted). Copies still in use are kept
        /// for the sweep.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The number of deployments and agents deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or draftId is null or empty.</exception>
        public async Task<int> DeleteDraftCopiesAsync(string tenantId, string draftId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(draftId)) throw new ArgumentNullException(nameof(draftId));
            string key = PlaygroundService.DraftEvalKey(tenantId, draftId);
            List<Agent> agents = (await AllAgentsAsync(tenantId, token).ConfigureAwait(false)).Where(a => IsEvalCopy(a) && a.Name.StartsWith("eval-d" + key + "-", StringComparison.Ordinal)).ToList();
            HashSet<string> agentIds = new HashSet<string>(agents.Select(a => a.Id), StringComparer.Ordinal);
            List<Deployment> deployments = (await AllDeploymentsAsync(tenantId, token).ConfigureAwait(false))
                .Where(d => IsEvalCopy(d) && (d.Name.EndsWith("-d" + key, StringComparison.Ordinal) || agentIds.Contains(d.AgentId))).ToList();
            EvalCopyUsage inUse = await InUseAsync(token).ConfigureAwait(false);
            return await DeleteAsync(tenantId, deployments, agents, inUse, null, "studio draft " + draftId + " was applied or deleted", token).ConfigureAwait(false);
        }

        /// <summary>
        /// The leader's sweep: delete every eval copy, in every tenant, that has been idle for <see cref="IdleHours"/>.
        /// Does work at most every <see cref="SweepIntervalSeconds"/> unless forced.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a copy was deleted.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            return await SweepAsync(false, token).ConfigureAwait(false) > 0;
        }

        /// <summary>
        /// Sweep for idle eval copies now or on schedule.
        /// </summary>
        /// <param name="force">True to sweep regardless of <see cref="SweepIntervalSeconds"/>.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The number of deployments and agents deleted.</returns>
        public async Task<int> SweepAsync(bool force, CancellationToken token = default)
        {
            DateTime now = _Clock.GetUtcNow().UtcDateTime;
            long last = Interlocked.Read(ref _LastSweepTicks);
            if (!force && last > 0 && now.Ticks - last < TimeSpan.FromSeconds(_SweepIntervalSeconds).Ticks) return 0;
            Interlocked.Exchange(ref _LastSweepTicks, now.Ticks);
            DateTime cutoff = now.AddHours(-_IdleHours);
            List<Deployment> deployments = (await AllDeploymentsAsync(null, token).ConfigureAwait(false)).Where(IsEvalCopy).ToList();
            List<Agent> agents = (await AllAgentsAsync(null, token).ConfigureAwait(false)).Where(IsEvalCopy).ToList();
            if (deployments.Count == 0 && agents.Count == 0) return 0;
            EvalCopyUsage inUse = await InUseAsync(token).ConfigureAwait(false);
            int deleted = 0;
            foreach (string tenantId in deployments.Select(d => d.TenantId).Concat(agents.Select(a => a.TenantId)).Distinct(StringComparer.Ordinal).ToList())
            {
                token.ThrowIfCancellationRequested();
                deleted += await DeleteAsync(tenantId, deployments.Where(d => d.TenantId == tenantId).ToList(), agents.Where(a => a.TenantId == tenantId).ToList(), inUse, cutoff, "it was idle for " + _IdleHours + " hour(s)", token).ConfigureAwait(false);
            }
            return deleted;
        }

        #endregion

        #region Private-Methods

        private async Task<int> DeleteAsync(string tenantId, List<Deployment> deployments, List<Agent> agents, EvalCopyUsage inUse, DateTime? idleBefore, string why, CancellationToken token)
        {
            int deleted = 0;
            HashSet<string> kept = new HashSet<string>(StringComparer.Ordinal);
            foreach (Deployment deployment in deployments)
            {
                token.ThrowIfCancellationRequested();
                if (!await DeletableAsync(deployment, inUse, idleBefore, token).ConfigureAwait(false))
                {
                    kept.Add(deployment.AgentId);
                    continue;
                }
                if (!await _Server.Database.Deployments.DeleteAsync(deployment.Id, token).ConfigureAwait(false)) continue;
                deleted++;
                await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "Deployment", deployment.Id, "Deleted eval copy " + deployment.Name + " because " + why + "; its eval runs and results are kept.", tenantId, token).ConfigureAwait(false);
            }
            foreach (Agent agent in agents)
            {
                token.ThrowIfCancellationRequested();
                if (kept.Contains(agent.Id)) continue;
                if (idleBefore.HasValue && agent.LastUpdateUtc > idleBefore.Value) continue;
                List<Deployment> remaining = await _Server.Database.Deployments.ListByAgentAsync(tenantId, agent.Id, token).ConfigureAwait(false);
                if (remaining.Count > 0) continue;
                if (!await _Server.Database.Agents.DeleteAsync(agent.Id, token).ConfigureAwait(false)) continue;
                deleted++;
                MemoryService? memory = _Server.TryGet<MemoryService>();
                if (memory != null) await memory.DeleteScopeAsync(tenantId, MemoryScopeKindEnum.Agent, agent.Id, token).ConfigureAwait(false);
                await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "Agent", agent.Id, "Deleted eval copy " + agent.Name + " because " + why + "; its eval runs and results are kept.", tenantId, token).ConfigureAwait(false);
            }
            return deleted;
        }

        private async Task<bool> DeletableAsync(Deployment deployment, EvalCopyUsage inUse, DateTime? idleBefore, CancellationToken token)
        {
            if (inUse.DeploymentIds.Contains(deployment.Id)) return false;
            if (await _Server.Database.Runs.CountActiveByDeploymentAsync(deployment.Id, token).ConfigureAwait(false) > 0) return false;
            if (await _Server.Database.CanaryReleases.ReadRunningForDeploymentAsync(deployment.TenantId, deployment.Id, token).ConfigureAwait(false) != null) return false;
            if (!idleBefore.HasValue) return true;
            if (deployment.LastUpdateUtc > idleBefore.Value) return false;
            RunFilter filter = new RunFilter { TenantId = deployment.TenantId, DeploymentId = deployment.Id, MaxResults = 1, Ordering = EnumerationOrderEnum.CreatedDescending };
            Run? latest = (await _Server.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).Objects.FirstOrDefault();
            if (latest == null) return true;
            return latest.CreatedUtc <= idleBefore.Value && (!latest.CompletedUtc.HasValue || latest.CompletedUtc.Value <= idleBefore.Value);
        }

        private async Task<EvalCopyUsage> InUseAsync(CancellationToken token)
        {
            EvalCopyUsage inUse = new EvalCopyUsage();
            foreach (EvalRun run in await _Server.Database.EvalRuns.ListActiveAsync(10000, token).ConfigureAwait(false))
            {
                if (!String.IsNullOrEmpty(run.DeploymentId)) inUse.DeploymentIds.Add(run.DeploymentId);
            }
            foreach (ShadowTrial trial in await _Server.Database.ShadowTrials.ListRunningAsync(10000, token).ConfigureAwait(false))
            {
                inUse.DeploymentIds.Add(trial.CandidateDeploymentId);
                inUse.DeploymentIds.Add(trial.SourceDeploymentId);
            }
            return inUse;
        }

        private async Task<List<Deployment>> AllDeploymentsAsync(string? tenantId, CancellationToken token)
        {
            List<Deployment> all = new List<Deployment>();
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000, Ordering = EnumerationOrderEnum.CreatedAscending };
            while (true)
            {
                EnumerationResult<Deployment> page = await _Server.Database.Deployments.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                all.AddRange(page.Objects);
                if (page.EndOfResults || page.Objects.Count == 0) return all;
                query.Skip += page.Objects.Count;
            }
        }

        private async Task<List<Agent>> AllAgentsAsync(string? tenantId, CancellationToken token)
        {
            List<Agent> all = new List<Agent>();
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000, Ordering = EnumerationOrderEnum.CreatedAscending };
            while (true)
            {
                EnumerationResult<Agent> page = await _Server.Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                all.AddRange(page.Objects);
                if (page.EndOfResults || page.Objects.Count == 0) return all;
                query.Skip += page.Objects.Count;
            }
        }

        #endregion
    }
}
