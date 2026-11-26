namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One case of an eval set version (AA9.1): an input, optional files, optional expected text, and the checks that
    /// score the output. Cases of an Approved set are immutable (AA9.2). Hidden cases are never shown to the run tokens of
    /// the agent being evaluated (AA-024). Not thread-safe.
    /// </summary>
    public class EvalCase
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values the server clamped on create or update (code ValueClamped); responses only, otherwise null.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

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
                _Order = Math.Clamp(value, 0, 1000000);
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
        /// Checks that score the output, in order. A case without checks scores 1 when its run succeeds.
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
        /// Files placed in the working directory before the case runs, in order.
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
        /// Run the case was saved from (a studio playground run, AD11.5), or null.
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

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _SetId = String.Empty;
        private int _Order = 0;
        private string _InputText = String.Empty;
        private List<EvalCaseCheck> _Checks = new List<EvalCaseCheck>();
        private List<EvalCaseFile> _Files = new List<EvalCaseFile>();

        #endregion
    }
}
