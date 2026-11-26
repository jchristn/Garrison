namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A canary release (AA9.1, AA9.8): an agent's traffic moves from a baseline deployment to a candidate in steps of
    /// deployment weight, advancing while the candidate's error rate and eval score stay within thresholds and rolling
    /// the weights back otherwise. At most one release per agent is Running. Not thread-safe.
    /// </summary>
    public class CanaryRelease
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values the server clamped on create (code ValueClamped); responses only, otherwise null.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

        /// <summary>
        /// Identifier (prefix cnr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
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
        /// Agent whose traffic moves.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment receiving more traffic step by step.
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
        /// Deployment the traffic moves away from and returns to on rollback.
        /// </summary>
        public string BaselineDeploymentId
        {
            get
            {
                return _BaselineDeploymentId;
            }
            set
            {
                _BaselineDeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Baseline deployment's weight when the release started, restored on rollback or abort. Minimum 0, maximum 1000.
        /// </summary>
        public int BaselineInitialWeight
        {
            get
            {
                return _BaselineInitialWeight;
            }
            set
            {
                _BaselineInitialWeight = Math.Clamp(value, 0, 1000);
            }
        }

        /// <summary>
        /// Candidate deployment's weight when the release started, restored on rollback or abort. Minimum 0, maximum 1000.
        /// </summary>
        public int CandidateInitialWeight
        {
            get
            {
                return _CandidateInitialWeight;
            }
            set
            {
                _CandidateInitialWeight = Math.Clamp(value, 0, 1000);
            }
        }

        /// <summary>
        /// Steps, in order. At least one; at most 20.
        /// </summary>
        public List<CanaryReleaseStep> Steps
        {
            get
            {
                return _Steps;
            }
            set
            {
                _Steps = value ?? new List<CanaryReleaseStep>();
            }
        }

        /// <summary>
        /// Index of the current step in Steps, from 0. Minimum 0.
        /// </summary>
        public int CurrentStepIndex
        {
            get
            {
                return _CurrentStepIndex;
            }
            set
            {
                _CurrentStepIndex = Math.Max(0, value);
            }
        }

        /// <summary>
        /// When the current step started (UTC), or null before the first step.
        /// </summary>
        public DateTime? StepStartedUtc { get; set; } = null;

        /// <summary>
        /// Highest percent of the candidate's finished runs in a step that may fail before the release rolls back.
        /// Minimum 0, maximum 100, default 5; values outside are clamped.
        /// </summary>
        public double MaxErrorRatePercent
        {
            get
            {
                return _MaxErrorRatePercent;
            }
            set
            {
                _MaxErrorRatePercent = Math.Clamp(value, 0, 100);
            }
        }

        /// <summary>
        /// Lowest eval score (0 to 1) the candidate must reach on EvalSetId before each step advances, or null for no eval
        /// gate. Values outside are clamped.
        /// </summary>
        public double? MinEvalScore
        {
            get
            {
                return _MinEvalScore;
            }
            set
            {
                _MinEvalScore = value.HasValue && !Double.IsNaN(value.Value) ? Math.Clamp(value.Value, 0, 1) : null;
            }
        }

        /// <summary>
        /// Eval set run against the candidate at each step, or null.
        /// </summary>
        public string? EvalSetId { get; set; } = null;

        /// <summary>
        /// Status. Default Running.
        /// </summary>
        public CanaryStatusEnum Status { get; set; } = CanaryStatusEnum.Running;

        /// <summary>
        /// Why the release rolled back or was aborted, or null.
        /// </summary>
        public string? RollbackReason { get; set; } = null;

        /// <summary>
        /// Principal type of the person who started the release. Default User.
        /// </summary>
        public PrincipalTypeEnum CreatedByType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of the person who started the release, or null for a system administrator.
        /// </summary>
        public string? CreatedById { get; set; } = null;

        /// <summary>
        /// Name of the person who started the release.
        /// </summary>
        public string? CreatedByName { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the release left Running (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _CandidateDeploymentId = String.Empty;
        private string _BaselineDeploymentId = String.Empty;
        private int _BaselineInitialWeight = 100;
        private int _CandidateInitialWeight = 0;
        private List<CanaryReleaseStep> _Steps = new List<CanaryReleaseStep>();
        private int _CurrentStepIndex = 0;
        private double _MaxErrorRatePercent = 5;
        private double? _MinEvalScore = null;

        #endregion
    }
}
