namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Create or edit an eval set (AA9.12). On create every field applies; on edit, name, origin, and cases are ignored
    /// (cases change through the case routes) and an approved set's edit creates its next version. Not thread-safe.
    /// </summary>
    public class EvalSetRequest
    {
        #region Public-Members

        /// <summary>
        /// Name shared by every version, 1 to 128 characters. Required on create.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// What the set checks, at most 2000 characters, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Human (default) or Playground for a person; a run token's set is always Evaluator.
        /// </summary>
        public EvalSetOriginEnum? Origin { get; set; } = null;

        /// <summary>
        /// Agent (identifier or name) that grades Judge checks, or null.
        /// </summary>
        public string? JudgeAgent { get; set; } = null;

        /// <summary>
        /// Tags, each at most 64 characters, or null for none (on edit, null keeps the current tags).
        /// </summary>
        public List<string>? Tags { get; set; } = null;

        /// <summary>
        /// Cases to create with the set, in order, or null for none. At most Evaluation.MaxCasesPerSet.
        /// </summary>
        public List<EvalCase>? Cases { get; set; } = null;

        #endregion
    }
}
