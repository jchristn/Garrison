namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Reads the evidence an executive's proposal carries (AA9.10): every eval run of the draft, and the shadow trials and
    /// canary releases whose candidate is a deployment the draft changes (by name) or a deployment one of the draft's eval
    /// runs ran on, created after the draft was. Every read is filtered by the draft's tenant. Thread-safe.
    /// </summary>
    public class ProposalEvidenceReader
    {
        #region Public-Members

        /// <summary>
        /// Shadow trials and canary releases read per candidate deployment. Minimum 1, maximum 1000, default 50.
        /// </summary>
        public int MaxPerDeployment
        {
            get
            {
                return _MaxPerDeployment;
            }
            set
            {
                _MaxPerDeployment = Math.Clamp(value, 1, 1000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private int _MaxPerDeployment = 50;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public ProposalEvidenceReader(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read a draft's evidence.
        /// </summary>
        /// <param name="draft">Executive draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The evidence; lists are empty when nothing tested the draft.</returns>
        /// <exception cref="ArgumentNullException">Thrown when draft is null.</exception>
        public async Task<ProposalEvidence> ReadAsync(StudioDraft draft, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            ProposalEvidence evidence = new ProposalEvidence();
            evidence.ContentChangedUtc = draft.ContentChangedOrUpdatedUtc();

            List<EvalRun> runs = await _Database.EvalRuns.ListForDraftAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false);
            foreach (EvalRun run in runs.OrderByDescending(r => r.CreatedUtc).ThenByDescending(r => r.Id, StringComparer.Ordinal))
            {
                evidence.EvalRuns.Add(new ProposalEvalEvidence
                {
                    EvalRunId = run.Id, SetName = run.SetName, SetVersion = run.SetVersion, AgentId = run.AgentId, DeploymentId = run.DeploymentId,
                    Status = run.Status, Score = run.Score, Threshold = run.Threshold, Passed = run.Passed, CompletedCases = run.CompletedCases,
                    TotalCases = run.TotalCases, Current = run.CreatedUtc >= evidence.ContentChangedUtc, CreatedUtc = run.CreatedUtc, CompletedUtc = run.CompletedUtc
                });
            }

            Dictionary<string, Deployment> candidates = new Dictionary<string, Deployment>(StringComparer.Ordinal);
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Kind == "Deployment" && i.Operation == StudioDraftOperationEnum.Upsert))
            {
                token.ThrowIfCancellationRequested();
                Deployment? live = await _Database.Deployments.ReadByNameAsync(draft.TenantId, item.Name, token).ConfigureAwait(false);
                if (live != null) candidates[live.Id] = live;
            }
            foreach (string deploymentId in runs.Where(r => !String.IsNullOrEmpty(r.DeploymentId)).Select(r => r.DeploymentId!).Distinct(StringComparer.Ordinal))
            {
                if (candidates.ContainsKey(deploymentId)) continue;
                Deployment? copy = await _Database.Deployments.ReadAsync(draft.TenantId, deploymentId, token).ConfigureAwait(false);
                if (copy != null) candidates[copy.Id] = copy;
            }

            EnumerationQuery query = new EnumerationQuery { MaxResults = _MaxPerDeployment, Ordering = EnumerationOrderEnum.CreatedDescending };
            List<ShadowTrial> trials = new List<ShadowTrial>();
            List<CanaryRelease> releases = new List<CanaryRelease>();
            HashSet<string> agentsRead = new HashSet<string>(StringComparer.Ordinal);
            foreach (Deployment candidate in candidates.Values)
            {
                token.ThrowIfCancellationRequested();
                EnumerationResult<ShadowTrial> page = await _Database.ShadowTrials.EnumerateAsync(draft.TenantId, null, candidate.Id, null, query, token).ConfigureAwait(false);
                trials.AddRange(page.Objects.Where(t => t.CreatedUtc >= draft.CreatedUtc));
                if (!agentsRead.Add(candidate.AgentId)) continue;
                EnumerationResult<CanaryRelease> canaries = await _Database.CanaryReleases.EnumerateAsync(draft.TenantId, candidate.AgentId, null, query, token).ConfigureAwait(false);
                releases.AddRange(canaries.Objects.Where(c => c.CreatedUtc >= draft.CreatedUtc && candidates.ContainsKey(c.CandidateDeploymentId)));
            }
            foreach (ShadowTrial trial in trials.GroupBy(t => t.Id, StringComparer.Ordinal).Select(g => g.First()).OrderByDescending(t => t.CreatedUtc))
            {
                evidence.ShadowTrials.Add(new ProposalShadowEvidence
                {
                    ShadowTrialId = trial.Id, Name = trial.Name, SourceDeploymentId = trial.SourceDeploymentId, CandidateDeploymentId = trial.CandidateDeploymentId,
                    CandidateDeploymentName = candidates.TryGetValue(trial.CandidateDeploymentId, out Deployment? named) ? named.Name : null,
                    Status = trial.Status, ComparedCount = trial.ComparedCount, AgreedCount = trial.AgreedCount, DivergedCount = trial.DivergedCount,
                    CandidateFailureCount = trial.CandidateFailureCount, CreatedUtc = trial.CreatedUtc, CompletedUtc = trial.CompletedUtc
                });
            }
            foreach (CanaryRelease release in releases.GroupBy(c => c.Id, StringComparer.Ordinal).Select(g => g.First()).OrderByDescending(c => c.CreatedUtc))
            {
                evidence.CanaryReleases.Add(new ProposalCanaryEvidence
                {
                    CanaryReleaseId = release.Id, AgentId = release.AgentId, CandidateDeploymentId = release.CandidateDeploymentId,
                    CandidateDeploymentName = candidates.TryGetValue(release.CandidateDeploymentId, out Deployment? named) ? named.Name : null,
                    BaselineDeploymentId = release.BaselineDeploymentId, Status = release.Status, CurrentStepIndex = release.CurrentStepIndex,
                    StepCount = release.Steps.Count, RollbackReason = release.RollbackReason, CreatedUtc = release.CreatedUtc, CompletedUtc = release.CompletedUtc
                });
            }
            return evidence;
        }

        #endregion
    }
}
