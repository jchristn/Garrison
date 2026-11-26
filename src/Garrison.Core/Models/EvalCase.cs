namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One case of an eval set version (AA9.1): an input, optional files, optional expected text, and the checks that
    /// score the output. Cases of an Approved set are immutable (AA9.2). Hidden cases are never shown to the run tokens of
    /// the agent being evaluated (AA-024). Not thread-safe.
    /// </summary>
    public class EvalCase
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values that were clamped on create or update (code ValueClamped), or null. Never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                return _ClampWarnings.Count > 0 ? _ClampWarnings : null;
            }
        }

        /// <summary>
        /// Identifier (prefix evc_). A copied case in a new set version gets a new identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewEvalCaseId() : value;
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
        /// Eval set version the case belongs to.
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
        /// Position in the set; cases run and list in ascending order, ties broken by identifier. Minimum 0, maximum
        /// 1000000, default 0; values outside are clamped.
        /// </summary>
        public int Order
        {
            get
            {
                return _Order;
            }
            set
            {
                _Order = ValueClamp.Int(value, 0, 1000000, "order", _ClampWarnings);
            }
        }

        /// <summary>
        /// Short name, at most 128 characters, or null.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Input sent to the evaluated agent.
        /// </summary>
        public string InputText
        {
            get
            {
                return _InputText;
            }
            set
            {
                _InputText = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the case is hidden from the evaluated agent's run tokens, which see its score only (AA-024). Default
        /// false.
        /// </summary>
        public bool Hidden { get; set; } = false;

        /// <summary>
        /// Expected output, or null. ExactMatch and Contains checks without an argument compare against it.
        /// </summary>
        public string? ExpectedText { get; set; } = null;

        /// <summary>
        /// Checks that score the output, in order. A case without checks is scored against its expected text by exact match, or by one Judge check when it has no expected text, which needs the set's judge agent.
        /// </summary>
        public List<EvalCaseCheck> Checks
        {
            get
            {
                return _Checks;
            }
            set
            {
                _Checks = value ?? new List<EvalCaseCheck>();
            }
        }

        /// <summary>
        /// Files placed in the case run's workspace before it starts, in order (inline text, or an agent asset file from the
        /// asset's latest version). Paths are unique within the case. Judge runs and RecentInputs replays get no files.
        /// </summary>
        public List<EvalCaseFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<EvalCaseFile>();
            }
        }

        /// <summary>
        /// Run the case was saved from (a studio playground run, AD11.5), or null. Must name a run in the same tenant
        /// (400 with code RunNotFound otherwise).
        /// </summary>
        public string? SourceRunId { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();
        private string _Id = IdGenerator.NewEvalCaseId();
        private string _TenantId = String.Empty;
        private string _SetId = String.Empty;
        private int _Order = 0;
        private string _InputText = String.Empty;
        private List<EvalCaseCheck> _Checks = new List<EvalCaseCheck>();
        private List<EvalCaseFile> _Files = new List<EvalCaseFile>();

        #endregion
    }
}
