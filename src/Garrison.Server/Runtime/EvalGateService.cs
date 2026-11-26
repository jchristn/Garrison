namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Services;

    /// <summary>
    /// Eval gates (AA9.5, AA9.6, AD11.4): an environment that names an eval set admits a revision only when a completed
    /// eval run of that revision against the gate's set version reached the environment's threshold. The gate's version is
    /// the latest one a person approved; without one, the latest version counts only when an evaluator agent outside the
    /// proposer's subtree wrote it (AA-024). Thread-safe.
    /// </summary>
    public class EvalGateService
    {
        #region Public-Members

        /// <summary>
        /// Recent eval runs of a revision against the gate's set version that are looked at. Minimum 1, maximum 1000,
        /// default 100.
        /// </summary>
        public int MaxRunsConsidered
        {
            get
            {
                return _MaxRunsConsidered;
            }
            set
            {
                _MaxRunsConsidered = Math.Clamp(value, 1, 1000);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ChainOfCommand _Chain;
        private int _MaxRunsConsidered = 100;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="chain">Chain of command, for a proposing executive's subtree.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvalGateService(ServerContext server, ChainOfCommand chain)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The set version that gates a change: the latest approved version of the name, or the latest version when an
        /// evaluator outside the proposer's subtree wrote it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setName">Set name.</param>
        /// <param name="proposer">Proposing executive, or null for a person.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The gate set version.</returns>
        /// <exception cref="EvalGateFailedException">Thrown when no version of the set may gate the change.</exception>
        public async Task<EvalSet> GateSetAsync(string tenantId, string setName, ExecutivePosition? proposer, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(setName)) throw new ArgumentNullException(nameof(setName));
            EvalSet? approved = await _Server.Database.EvalSets.ReadLatestApprovedAsync(tenantId, setName, token).ConfigureAwait(false);
            if (approved != null) return approved;
            EvalSet? latest = await _Server.Database.EvalSets.ReadLatestAsync(tenantId, setName, token).ConfigureAwait(false);
            if (latest == null) throw new EvalGateFailedException(setName, null, "The gate's eval set " + setName + " does not exist.");
            string? refusal = await RefusalAsync(tenantId, latest, proposer, token).ConfigureAwait(false);
            if (refusal == null) return latest;
            throw new EvalGateFailedException(setName, null, refusal == EvalGatePolicy.SelfAuthored
                ? "Eval set " + setName + " was written inside the proposer's own subtree and cannot gate its change (" + refusal + ")."
                : "Eval set " + setName + " has no version a person approved, so it cannot gate yet (" + refusal + ").");
        }

        /// <summary>
        /// Why a set version cannot gate a proposer's change, or null when it can (AA-024).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="set">Set version.</param>
        /// <param name="proposer">Proposing executive, or null for a person.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>EvalSetNotApproved, EvalSetSelfAuthored, or null.</returns>
        public async Task<string?> RefusalAsync(string tenantId, EvalSet set, ExecutivePosition? proposer, CancellationToken token = default)
        {
            if (set == null) throw new ArgumentNullException(nameof(set));
            OrgTree? tree = proposer == null ? null : await _Chain.LiveTreeAsync(tenantId, proposer.OrganizationId, token).ConfigureAwait(false);
            return EvalGatePolicy.Refusal(set, tree, proposer?.UnitId, proposer?.AgentId);
        }

        /// <summary>
        /// Require an environment's gate for a revision. Does nothing when the environment has no gate.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="environment">Target environment.</param>
        /// <param name="revision">Candidate revision.</param>
        /// <param name="proposer">Proposing executive, or null for a person.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The passing eval run, or null when there is no gate.</returns>
        /// <exception cref="EvalGateFailedException">Thrown when no completed eval run of the revision reached the threshold; the message and EvalRunId name the latest eval run.</exception>
        public async Task<EvalRun?> RequireAsync(string tenantId, TenantEnvironment environment, AgentRevision revision, ExecutivePosition? proposer, CancellationToken token = default)
        {
            if (environment == null) throw new ArgumentNullException(nameof(environment));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (String.IsNullOrWhiteSpace(environment.EvalGateSet)) return null;
            string name = environment.EvalGateSet.Trim();
            double threshold = environment.EvalGateThreshold ?? 1;
            EvalSet set = await GateSetAsync(tenantId, name, proposer, token).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery { MaxResults = _MaxRunsConsidered, Ordering = EnumerationOrderEnum.CreatedDescending };
            List<EvalRun> runs = (await _Server.Database.EvalRuns.EnumerateAsync(tenantId, set.Id, null, revision.Id, null, query, token).ConfigureAwait(false)).Objects;
            EvalRun? passing = runs.FirstOrDefault(r => r.Status == EvalRunStatusEnum.Completed && r.Score.HasValue && r.Score.Value >= threshold - 1e-9);
            if (passing != null) return passing;
            string required = threshold.ToString("0.###", CultureInfo.InvariantCulture);
            string where = "environment " + environment.Name + " requires eval set " + set.Name + " version " + set.Version + " at score " + required;
            EvalRun? latest = runs.FirstOrDefault();
            if (latest == null) throw new EvalGateFailedException(set.Name, null, "Promotion blocked: " + where + ", and revision " + revision.Number + " has no eval run against it. Run the set against the revision first.");
            string state = latest.Status == EvalRunStatusEnum.Completed
                ? "scored " + (latest.Score ?? 0).ToString("0.###", CultureInfo.InvariantCulture)
                : "is " + latest.Status + (latest.FailureReason != null ? " (" + latest.FailureReason + ")" : String.Empty);
            throw new EvalGateFailedException(set.Name, latest.Id, "Promotion blocked: " + where + "; the latest eval run of revision " + revision.Number + ", " + latest.Id + ", " + state + ".");
        }

        #endregion
    }
}
