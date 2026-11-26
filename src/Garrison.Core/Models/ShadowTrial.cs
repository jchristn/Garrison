namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A shadow trial (AA9.1, AA9.7): a sampled share of a source deployment's inputs is copied to a candidate deployment
    /// as runs of kind Shadow, which cannot cause effects (AA-027), and their outputs are compared with the source's.
    /// Counters change only through atomic increments. Not thread-safe.
    /// </summary>
    public class ShadowTrial
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values that were clamped on create (code ValueClamped), or null. Never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                return _ClampWarnings.Count > 0 ? _ClampWarnings : null;
            }
        }

        /// <summary>
        /// Identifier (prefix shd_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewShadowTrialId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Short name, at most 128 characters, or null.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Agent of the source deployment, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Deployment whose inputs are sampled. Its own runs are never changed by the trial.
        /// </summary>
        public string SourceDeploymentId
        {
            get
            {
                return _SourceDeploymentId;
            }
            set
            {
                _SourceDeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment that receives the shadow copies.
        /// </summary>
        public string CandidateDeploymentId
        {
            get
            {
                return _CandidateDeploymentId;
            }
            set
            {
                _CandidateDeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Percent of the source's runs copied. Minimum 1, maximum 100, default 10; values outside are clamped.
        /// </summary>
        public int SamplePercent
        {
            get
            {
                return _SamplePercent;
            }
            set
            {
                _SamplePercent = ValueClamp.Int(value, 1, 100, "samplePercent", _ClampWarnings);
            }
        }

        /// <summary>
        /// When the trial ends and becomes Completed (UTC), or null to run until stopped.
        /// </summary>
        public DateTime? EndsUtc { get; set; } = null;

        /// <summary>
        /// Eval set whose checks compare outputs, or null.
        /// </summary>
        public string? ComparisonEvalSetId { get; set; } = null;

        /// <summary>
        /// Whether a judge run (builtin/eval-judge) decides whether the two outputs agree. Default false: without a judge
        /// or an eval set, outputs agree when their trimmed text is equal.
        /// </summary>
        public bool UseJudge { get; set; } = false;

        /// <summary>
        /// Status. Default Running.
        /// </summary>
        public ShadowTrialStatusEnum Status { get; set; } = ShadowTrialStatusEnum.Running;

        /// <summary>
        /// Why the trial stopped or failed, or null.
        /// </summary>
        public string? StopReason { get; set; } = null;

        /// <summary>
        /// Source and candidate output pairs compared.
        /// </summary>
        public long ComparedCount { get; set; } = 0;

        /// <summary>
        /// Comparisons where the outputs agreed.
        /// </summary>
        public long AgreedCount { get; set; } = 0;

        /// <summary>
        /// Comparisons where the outputs diverged.
        /// </summary>
        public long DivergedCount { get; set; } = 0;

        /// <summary>
        /// Shadow runs that failed while the source run succeeded.
        /// </summary>
        public long CandidateFailureCount { get; set; } = 0;

        /// <summary>
        /// Principal type of the person who started the trial. Default User.
        /// </summary>
        public PrincipalTypeEnum CreatedByType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of the person who started the trial, or null for a system administrator.
        /// </summary>
        public string? CreatedById { get; set; } = null;

        /// <summary>
        /// Name of the person who started the trial.
        /// </summary>
        public string? CreatedByName { get; set; } = null;

        /// <summary>
        /// Creation time (UTC); the trial starts sampling at once.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the trial left Running (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();
        private string _Id = IdGenerator.NewShadowTrialId();
        private string _TenantId = String.Empty;
        private string _SourceDeploymentId = String.Empty;
        private string _CandidateDeploymentId = String.Empty;
        private int _SamplePercent = 10;

        #endregion
    }
}
