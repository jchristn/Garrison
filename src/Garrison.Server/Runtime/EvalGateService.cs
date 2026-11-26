namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Services;

    /// <summary>
    /// Eval gates (AA9.5, AA9.6, AA9.10, AD11.4): an environment that names an eval set admits a revision only when a
    /// completed eval run of that revision against the latest version of the set a person approved reached the
    /// environment's threshold; promotion gates never count a draft version. A change rule's gate also counts the latest
    /// version when no version is approved, but only for an executive's draft and only when an evaluator agent outside
    /// that executive's subtree wrote it (AA-024). Eval runs in RecentInputs mode replay production inputs without
    /// expected text and never satisfy a promotion gate or a change rule gate. Thread-safe.
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
        /// The set version that gates an executive's change: the latest approved version of the name, or, when no version
        /// is approved, the latest version when an evaluator agent outside the proposer's subtree wrote it (AA-024). The
        /// fallback needs a proposer, because separation cannot be checked without one; without a proposer only an
        /// approved version gates. Promotion gates use <see cref="ApprovedGateSetAsync"/>.
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
            if (proposer == null) return await ApprovedGateSetAsync(tenantId, setName, token).ConfigureAwait(false);
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
        /// The set version that gates a promotion or a deployment pin into a gated environment: the latest version of the
        /// name a person approved. A draft never gates a promotion, whoever wrote it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setName">Set name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The approved set version.</returns>
        /// <exception cref="EvalGateFailedException">Thrown when the set does not exist or has no approved version.</exception>
        public async Task<EvalSet> ApprovedGateSetAsync(string tenantId, string setName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(setName)) throw new ArgumentNullException(nameof(setName));
            EvalSet? approved = await _Server.Database.EvalSets.ReadLatestApprovedAsync(tenantId, setName, token).ConfigureAwait(false);
            if (approved != null) return approved;
            EvalSet? latest = await _Server.Database.EvalSets.ReadLatestAsync(tenantId, setName, token).ConfigureAwait(false);
            if (latest == null) throw new EvalGateFailedException(setName, null, "The gate's eval set " + setName + " does not exist.");
            throw new EvalGateFailedException(setName, null, "Eval set " + setName + " has no version a person approved, so it cannot gate a promotion yet (" + EvalGatePolicy.NotApproved + ").");
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
        /// Require an environment's gate for a revision. Does nothing when the environment has no gate. Only the latest
        /// approved version of the gate set counts, and only eval runs over the set's cases (InputMode Cases).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="environment">Target environment.</param>
        /// <param name="revision">Candidate revision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The passing eval run, or null when there is no gate.</returns>
        /// <exception cref="EvalGateFailedException">Thrown when the set has no approved version, or no completed eval run of the revision reached the threshold; the message and EvalRunId name the latest eval run.</exception>
        public async Task<EvalRun?> RequireAsync(string tenantId, TenantEnvironment environment, AgentRevision revision, CancellationToken token = default)
        {
            return await RequireCoreAsync(tenantId, environment, revision, "Promotion blocked", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Require an environment's gate when a deployment's pinned revision is set directly (AA9.6 hardening): creating a
        /// pinned deployment in a gated environment, changing the pin of one there, or moving a pinned deployment into one
        /// needs the same passing eval run as a promotion. Does nothing when the deployment pins no revision (it then
        /// follows the agent's latest published revision), when neither the pin nor the environment changes, or when the
        /// environment has no gate. A revision that does not exist is left to deployment validation.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment as it will be stored.</param>
        /// <param name="previous">Deployment as stored now, or null when it is being created.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The passing eval run, or null when no gate applies.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deployment is null.</exception>
        /// <exception cref="EvalGateFailedException">Thrown with EvalGateFailed when the gate has no passing eval run of the pinned revision.</exception>
        public async Task<EvalRun?> RequirePinAsync(string tenantId, Deployment deployment, Deployment? previous, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (String.IsNullOrEmpty(deployment.AgentRevisionId)) return null;
            if (String.Equals(deployment.Environment, Constants.PlaygroundEnvironment, StringComparison.Ordinal)) return null;
            if (previous != null
                && String.Equals(previous.AgentRevisionId, deployment.AgentRevisionId, StringComparison.Ordinal)
                && String.Equals(previous.Environment, deployment.Environment, StringComparison.Ordinal)) return null;
            List<TenantEnvironment> environments = await EnvironmentDefaults.ListAsync(_Server.Database, tenantId, token).ConfigureAwait(false);
            TenantEnvironment? environment = environments.FirstOrDefault(e => String.Equals(e.Name, deployment.Environment, StringComparison.Ordinal));
            if (environment == null || String.IsNullOrWhiteSpace(environment.EvalGateSet)) return null;
            AgentRevision? revision = await _Server.Database.AgentRevisions.ReadAsync(tenantId, deployment.AgentRevisionId, token).ConfigureAwait(false);
            if (revision == null) return null;
            string verb = "Pinning deployment " + (String.IsNullOrEmpty(deployment.Name) ? deployment.Id : deployment.Name) + " to revision " + revision.Number.ToString(CultureInfo.InvariantCulture) + " blocked";
            return await RequireCoreAsync(tenantId, environment, revision, verb, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Whether an executive's draft passes a change rule's eval gate (AA9.10): a completed eval run over the cases of the
        /// gate set's version (see <see cref="GateSetAsync"/>; RecentInputs runs never count), created after the draft's items last changed, scoring
        /// at least the rule's threshold (1 when the rule sets none). Never throws for a missing or unapproved set: the
        /// gate is then not passed and the reason says why.
        /// </summary>
        /// <param name="draft">Executive draft.</param>
        /// <param name="rule">Change rule with a gate.</param>
        /// <param name="proposer">Proposing executive, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The gate status for the rule.</returns>
        /// <exception cref="ArgumentNullException">Thrown when draft or rule is null.</exception>
        public async Task<ChangeRuleGateStatus> DraftGateAsync(StudioDraft draft, ChangeRule rule, ExecutivePosition? proposer, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            if (rule == null) throw new ArgumentNullException(nameof(rule));
            ChangeRuleGateStatus status = new ChangeRuleGateStatus { RuleId = rule.Id };
            if (String.IsNullOrWhiteSpace(rule.GateEvalSet))
            {
                status.Satisfied = true;
                return status;
            }
            string name = rule.GateEvalSet.Trim();
            double threshold = rule.GateThreshold ?? 1;
            string required = threshold.ToString("0.###", CultureInfo.InvariantCulture);
            EvalSet set;
            try
            {
                set = await GateSetAsync(draft.TenantId, name, proposer, token).ConfigureAwait(false);
            }
            catch (EvalGateFailedException e)
            {
                status.Reason = "rule " + rule.Name + " requires eval set " + name + " at score " + required + ", and that set cannot gate: " + e.Message;
                return status;
            }
            DateTime changed = draft.ContentChangedOrUpdatedUtc();
            List<EvalRun> current = (await _Server.Database.EvalRuns.ListForDraftAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false))
                .Where(r => r.SetId == set.Id && r.CreatedUtc >= changed && r.InputMode == EvalRunInputModeEnum.Cases)
                .OrderByDescending(r => r.CreatedUtc).ThenByDescending(r => r.Id, StringComparer.Ordinal).ToList();
            EvalRun? passing = current.FirstOrDefault(r => r.Status == EvalRunStatusEnum.Completed && r.Score.HasValue && r.Score.Value >= threshold - 1e-9);
            if (passing != null)
            {
                status.Satisfied = true;
                status.EvalRunId = passing.Id;
                return status;
            }
            string where = "rule " + rule.Name + " requires eval set " + set.Name + " version " + set.Version.ToString(CultureInfo.InvariantCulture) + " at score " + required;
            EvalRun? latest = current.FirstOrDefault();
            if (latest == null)
            {
                status.Reason = where + ", and the draft has no eval run against it since its last change. Run garrison_run_eval with this draft's studioDraftId.";
                return status;
            }
            status.EvalRunId = latest.Id;
            string state = latest.Status == EvalRunStatusEnum.Completed
                ? "scored " + (latest.Score ?? 0).ToString("0.###", CultureInfo.InvariantCulture)
                : "is " + latest.Status + (latest.FailureReason != null ? " (" + latest.FailureReason + ")" : String.Empty);
            status.Reason = where + "; the draft's latest eval run against it, " + latest.Id + ", " + state + ".";
            return status;
        }

        #endregion

        #region Private-Methods

        private async Task<EvalRun?> RequireCoreAsync(string tenantId, TenantEnvironment environment, AgentRevision revision, string blocked, CancellationToken token)
        {
            if (environment == null) throw new ArgumentNullException(nameof(environment));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (String.IsNullOrWhiteSpace(environment.EvalGateSet)) return null;
            string name = environment.EvalGateSet.Trim();
            double threshold = environment.EvalGateThreshold ?? 1;
            EvalSet set = await ApprovedGateSetAsync(tenantId, name, token).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery { MaxResults = _MaxRunsConsidered, Ordering = EnumerationOrderEnum.CreatedDescending };
            List<EvalRun> runs = (await _Server.Database.EvalRuns.EnumerateAsync(tenantId, set.Id, null, revision.Id, null, query, token).ConfigureAwait(false)).Objects
                .Where(r => r.InputMode == EvalRunInputModeEnum.Cases).ToList();
            EvalRun? passing = runs.FirstOrDefault(r => r.Status == EvalRunStatusEnum.Completed && r.Score.HasValue && r.Score.Value >= threshold - 1e-9);
            if (passing != null) return passing;
            string required = threshold.ToString("0.###", CultureInfo.InvariantCulture);
            string where = "environment " + environment.Name + " requires eval set " + set.Name + " version " + set.Version + " at score " + required;
            EvalRun? latest = runs.FirstOrDefault();
            if (latest == null) throw new EvalGateFailedException(set.Name, null, blocked + ": " + where + ", and revision " + revision.Number + " has no eval run against it. Run the set against the revision first.");
            string state = latest.Status == EvalRunStatusEnum.Completed
                ? "scored " + (latest.Score ?? 0).ToString("0.###", CultureInfo.InvariantCulture)
                : "is " + latest.Status + (latest.FailureReason != null ? " (" + latest.FailureReason + ")" : String.Empty);
            throw new EvalGateFailedException(set.Name, latest.Id, blocked + ": " + where + "; the latest eval run of revision " + revision.Number + ", " + latest.Id + ", " + state + ".");
        }

        #endregion
    }
}
