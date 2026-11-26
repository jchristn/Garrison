namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Result of garrison_get_eval_run (AA9.12): the eval run and, unless left out, its case results (hidden cases as
    /// scores only for run tokens).
    /// </summary>
    public class McpEvalRunDetail
    {
        /// <summary>Eval run.</summary>
        public EvalRun EvalRun { get; set; } = new EvalRun();

        /// <summary>Case results in order, or null when left out.</summary>
        public List<EvalCaseResult>? Results { get; set; } = null;
    }
}
