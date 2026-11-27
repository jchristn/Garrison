namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One evaluation of an eval set version against an agent revision or a deployment (AA9.1, AA9.3). Each case runs as
    /// a run of kind Eval and records an <see cref="EvalCaseResult"/>. Scores are fractions from 0 to 1. Not thread-safe.
    /// </summary>
    public class EvalRun
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
        /// Identifier (prefix evr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewEvalRunId() : value;
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
        /// Eval set version evaluated.
        /// </summary>
        public string SetId
        {
            get
            {
                return _SetId;
            }
            set
            {
                _SetId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name of the eval set, stored at creation.
        /// </summary>
        public string SetName
        {
            get
            {
                return _SetName;
            }
            set
            {
                _SetName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Version number of the eval set, stored at creation. Minimum 1.
        /// </summary>
        public int SetVersion
        {
            get
            {
                return _SetVersion;
            }
            set
            {
                _SetVersion = Math.Max(1, value);
            }
        }

        /// <summary>
        /// What is evaluated. Default Deployment.
        /// </summary>
        public EvalRunTargetEnum TargetType { get; set; } = EvalRunTargetEnum.Deployment;

        /// <summary>
        /// Agent evaluated (the revision's agent or the deployment's agent), or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agent revision evaluated when TargetType is AgentRevision, or null.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Deployment evaluated when TargetType is Deployment; for an agent revision, the deployment whose settings the
        /// ephemeral deployment copies, or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Studio draft the evaluation is evidence for (an executive's proposal, AA9.10), or null.
        /// </summary>
        public string? StudioDraftId { get; set; } = null;

        /// <summary>
        /// Status. Default Pending.
        /// </summary>
        public EvalRunStatusEnum Status { get; set; } = EvalRunStatusEnum.Pending;

        /// <summary>
        /// Where inputs come from. Default Cases.
        /// </summary>
        public EvalRunInputModeEnum InputMode { get; set; } = EvalRunInputModeEnum.Cases;

        /// <summary>
        /// Recent runs replayed when InputMode is RecentInputs. Minimum 1, maximum 1000, default 20; values outside are
        /// clamped. Ignored for Cases.
        /// </summary>
        public int RecentInputCount
        {
            get
            {
                return _RecentInputCount;
            }
            set
            {
                _RecentInputCount = ValueClamp.Int(value, 1, 1000, "recentInputCount", _ClampWarnings);
            }
        }

        /// <summary>
        /// Weighted mean of the case scores, from 0 to 1, or null until the run completes. Values outside are clamped.
        /// </summary>
        public double? Score
        {
            get
            {
                return _Score;
            }
            set
            {
                _Score = value.HasValue ? Math.Clamp(value.Value, 0, 1) : null;
            }
        }

        /// <summary>
        /// Score the run must reach to pass, from 0 to 1, or null for no threshold (Passed stays null). Values outside are
        /// clamped.
        /// </summary>
        public double? Threshold
        {
            get
            {
                return _Threshold;
            }
            set
            {
                _Threshold = ValueClamp.NullableDouble(value, 0, 1, "threshold", _ClampWarnings);
            }
        }

        /// <summary>
        /// Whether Score reached Threshold, or null while running or without a threshold.
        /// </summary>
        public bool? Passed { get; set; } = null;

        /// <summary>
        /// Most USD the run's case and judge runs may spend, or null for no budget. Minimum 0, maximum 100000; values
        /// outside are clamped. When spending reaches it, remaining cases are skipped and the run fails with BudgetExhausted.
        /// </summary>
        public double? BudgetUsd
        {
            get
            {
                return _BudgetUsd;
            }
            set
            {
                _BudgetUsd = ValueClamp.NullableDouble(value, 0, 100000, "budgetUsd", _ClampWarnings);
            }
        }

        /// <summary>
        /// USD spent so far by the run's case and judge runs.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Cases to run (the set's case count, or the recent inputs found).
        /// </summary>
        public int TotalCases { get; set; } = 0;

        /// <summary>
        /// Cases finished, passed or not.
        /// </summary>
        public int CompletedCases { get; set; } = 0;

        /// <summary>
        /// Cases that passed.
        /// </summary>
        public int PassedCases { get; set; } = 0;

        /// <summary>
        /// Cases whose run failed or could not start.
        /// </summary>
        public int ErroredCases { get; set; } = 0;

        /// <summary>
        /// Why the run failed or was cancelled, or null.
        /// </summary>
        public string? FailureReason { get; set; } = null;

        /// <summary>
        /// Principal type of whoever started the run (User, Credential, or Run). Default User.
        /// </summary>
        public PrincipalTypeEnum StartedByType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of whoever started the run, or null for a system administrator or the system.
        /// </summary>
        public string? StartedById { get; set; } = null;

        /// <summary>
        /// Display name of whoever started the run.
        /// </summary>
        public string? StartedByName { get; set; } = null;

        /// <summary>
        /// Run that started the evaluation (an executive's run calling garrison_run_eval), or null.
        /// </summary>
        public string? OriginRunId { get; set; } = null;

        /// <summary>
        /// EvalSet trigger that started the evaluation as a scheduled check (AA11.3), or null.
        /// </summary>
        public string? TriggerId { get; set; } = null;

        /// <summary>
        /// Judge agent that grades this evaluation in place of the set's judgeAgent (a scheduled check's evalJudgeAgentId),
        /// or null to use the set's. Set only by EvalSet triggers.
        /// </summary>
        public string? JudgeAgentId { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the first case started (UTC), or null.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// When the run reached Completed, Failed, or Cancelled (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();
        private string _Id = IdGenerator.NewEvalRunId();
        private string _TenantId = String.Empty;
        private string _SetId = String.Empty;
        private string _SetName = String.Empty;
        private int _SetVersion = 1;
        private int _RecentInputCount = 20;
        private double? _Score = null;
        private double? _Threshold = null;
        private double? _BudgetUsd = null;

        #endregion
    }
}
