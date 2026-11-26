namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;

    /// <summary>
    /// Keeps the runs of hidden eval cases away from run tokens (AA9.5, AA-024). A case run's input is the hidden case's
    /// input, and its judge runs' input quotes the input and the expected text, so a run token that could read those runs
    /// would read the hidden case. Run reads by run tokens (REST, MCP, WebSocket) ask <see cref="HiddenAsync"/> and answer
    /// 404 when it says yes; lists drop those runs. People and API credentials are never affected, and a run reading itself
    /// is always allowed. Which case a run belongs to comes from its idempotency key (eval:{evalRunId}:{order} for the case
    /// run, eval:{evalRunId}:{order}:judge:{n} for its judges); a run whose key cannot be read is treated as hidden when
    /// the set has any hidden case. Thread-safe.
    /// </summary>
    public class HiddenEvalRunPolicy
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public HiddenEvalRunPolicy(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a run must look as if it did not exist to the caller: true only for a run token reading another run
        /// that is a case or judge run of a hidden eval case.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="run">Run the caller wants to read (already read in the caller's tenant).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run is hidden from the caller.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or run is null.</exception>
        public async Task<bool> HiddenAsync(RequestContext ctx, Run run, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (!Applies(ctx, run)) return false;
            List<EvalCase>? cases = await HiddenCasesAsync(run, token).ConfigureAwait(false);
            return cases != null && Hidden(run, cases);
        }

        /// <summary>
        /// The runs of a list the caller may see: every run for people and API credentials; for a run token, the list
        /// without the runs of hidden eval cases.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="runs">Runs (read in the caller's tenant).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The visible runs, in the same order.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or runs is null.</exception>
        public async Task<List<Run>> VisibleAsync(RequestContext ctx, List<Run> runs, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (runs == null) throw new ArgumentNullException(nameof(runs));
            if (ctx.PrincipalType != PrincipalTypeEnum.Run || !runs.Any(r => Applies(ctx, r))) return runs;
            Dictionary<string, List<EvalCase>?> byEvalRun = new Dictionary<string, List<EvalCase>?>(StringComparer.Ordinal);
            List<Run> visible = new List<Run>();
            foreach (Run run in runs)
            {
                token.ThrowIfCancellationRequested();
                if (!Applies(ctx, run))
                {
                    visible.Add(run);
                    continue;
                }
                if (!byEvalRun.TryGetValue(run.EvalRunId!, out List<EvalCase>? cases))
                {
                    cases = await HiddenCasesAsync(run, token).ConfigureAwait(false);
                    byEvalRun[run.EvalRunId!] = cases;
                }
                if (cases == null || !Hidden(run, cases)) visible.Add(run);
            }
            return visible;
        }

        /// <summary>
        /// The case order an eval run's case or judge run belongs to, read from its idempotency key.
        /// </summary>
        /// <param name="evalRunId">Eval run identifier.</param>
        /// <param name="idempotencyKey">The run's idempotency key, or null.</param>
        /// <returns>The order, or null when the key is not an eval key of that eval run.</returns>
        public static int? CaseOrder(string evalRunId, string? idempotencyKey)
        {
            if (String.IsNullOrEmpty(evalRunId) || String.IsNullOrEmpty(idempotencyKey)) return null;
            string prefix = "eval:" + evalRunId + ":";
            if (!idempotencyKey.StartsWith(prefix, StringComparison.Ordinal)) return null;
            string rest = idempotencyKey.Substring(prefix.Length);
            int colon = rest.IndexOf(':');
            string number = colon < 0 ? rest : rest.Substring(0, colon);
            if (!Int32.TryParse(number, NumberStyles.None, CultureInfo.InvariantCulture, out int order)) return null;
            return order;
        }

        #endregion

        #region Private-Methods

        private static bool Applies(RequestContext ctx, Run run)
        {
            if (ctx.PrincipalType != PrincipalTypeEnum.Run) return false;
            if (run.Kind != RunKindEnum.Eval || String.IsNullOrEmpty(run.EvalRunId)) return false;
            // The run under evaluation may read itself.
            return !String.Equals(ctx.RunId, run.Id, StringComparison.Ordinal);
        }

        private async Task<List<EvalCase>?> HiddenCasesAsync(Run run, CancellationToken token)
        {
            // Null when no case of the run's eval run is hidden; otherwise the set version's cases in order. An eval run
            // that no longer exists cannot say which case the run held, so its runs stay hidden.
            EvalRun? evalRun = await _Database.EvalRuns.ReadAsync(run.TenantId, run.EvalRunId!, token).ConfigureAwait(false);
            if (evalRun == null) return new List<EvalCase>();
            if (evalRun.InputMode != EvalRunInputModeEnum.Cases) return null;
            List<EvalCase> cases = await _Database.EvalCases.ListBySetAsync(run.TenantId, evalRun.SetId, token).ConfigureAwait(false);
            return cases.Any(c => c.Hidden) ? cases : null;
        }

        private static bool Hidden(Run run, List<EvalCase> cases)
        {
            if (cases.Count == 0) return true;
            int? order = CaseOrder(run.EvalRunId!, run.IdempotencyKey);
            if (!order.HasValue || order.Value < 0 || order.Value >= cases.Count) return true;
            return cases[order.Value].Hidden;
        }

        #endregion
    }
}
