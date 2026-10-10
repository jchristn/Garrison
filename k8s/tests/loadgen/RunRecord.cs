namespace Garrison.LoadGen
{
    using System;
    using System.Globalization;
    using System.Text;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Models;

    /// <summary>
    /// What the load generator knows about one run: the client-side submission and the latest server view.
    /// Not thread-safe; LoadGenerator serializes access.
    /// </summary>
    public class RunRecord
    {
        #region Public-Members

        /// <summary>
        /// Zero-based submission index.
        /// </summary>
        public int Index { get; set; } = 0;

        /// <summary>
        /// Idempotency key sent with the creation request.
        /// </summary>
        public string IdempotencyKey { get; set; } = String.Empty;

        /// <summary>
        /// Run identifier, or null when the creation never succeeded.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Client clock when the first creation attempt started (UTC).
        /// </summary>
        public DateTime SubmitStartUtc { get; set; } = DateTime.MinValue;

        /// <summary>
        /// Milliseconds from the first creation attempt to the successful response, or -1 when it never succeeded.
        /// </summary>
        public long SubmitMs { get; set; } = -1;

        /// <summary>
        /// Creation attempts made.
        /// </summary>
        public int SubmitAttempts { get; set; } = 0;

        /// <summary>
        /// Last creation error, or null.
        /// </summary>
        public string? SubmitError { get; set; } = null;

        /// <summary>
        /// Client clock when the run was first seen terminal (UTC), or null.
        /// </summary>
        public DateTime? ObservedTerminalUtc { get; set; } = null;

        /// <summary>
        /// Latest server view of the run, or null before the first successful read.
        /// </summary>
        public Run? Run { get; set; } = null;

        /// <summary>
        /// Whether the latest server view is terminal.
        /// </summary>
        public bool IsTerminal
        {
            get
            {
                return Run != null && Garrison.Sdk.Clients.RunsClient.IsTerminal(Run.Status);
            }
        }

        /// <summary>
        /// Claim latency in milliseconds: queued to leased on the server clock, or null when not leased yet.
        /// For a requeued run this is the latency of its last attempt.
        /// </summary>
        public long? ClaimMs
        {
            get
            {
                if (Run == null || Run.QueuedUtc == null || Run.LeasedUtc == null) return null;
                return (long)(Run.LeasedUtc.Value - Run.QueuedUtc.Value).TotalMilliseconds;
            }
        }

        /// <summary>
        /// Created to completed in milliseconds on the server clock, or null when not completed.
        /// </summary>
        public long? TotalMs
        {
            get
            {
                if (Run == null || Run.CompletedUtc == null) return null;
                return (long)(Run.CompletedUtc.Value - Run.CreatedUtc).TotalMilliseconds;
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// CSV header matching ToCsv.
        /// </summary>
        /// <returns>Header line.</returns>
        public static string CsvHeader()
        {
            return "index,runId,submitStartUtc,submitMs,submitAttempts,submitError,status,outcome,attempt,node,createdUtc,queuedUtc,leasedUtc,startedUtc,completedUtc,claimMs,queueMs,executionMs,totalMs,observedTerminalUtc,errorMessage";
        }

        /// <summary>
        /// One CSV line.
        /// </summary>
        /// <returns>Line.</returns>
        public string ToCsv()
        {
            StringBuilder sb = new StringBuilder();
            Run? run = Run;
            Append(sb, Index.ToString(CultureInfo.InvariantCulture));
            Append(sb, RunId);
            Append(sb, Date(SubmitStartUtc));
            Append(sb, SubmitMs.ToString(CultureInfo.InvariantCulture));
            Append(sb, SubmitAttempts.ToString(CultureInfo.InvariantCulture));
            Append(sb, SubmitError);
            Append(sb, run == null ? (RunId == null ? "NotCreated" : "Unknown") : run.Status.ToString());
            Append(sb, run == null ? null : run.Outcome.ToString());
            Append(sb, run == null ? null : run.Attempt.ToString(CultureInfo.InvariantCulture));
            Append(sb, run == null ? null : run.LeaseNodeName);
            Append(sb, run == null ? null : Date(run.CreatedUtc));
            Append(sb, run == null ? null : Date(run.QueuedUtc));
            Append(sb, run == null ? null : Date(run.LeasedUtc));
            Append(sb, run == null ? null : Date(run.StartedUtc));
            Append(sb, run == null ? null : Date(run.CompletedUtc));
            Append(sb, Number(ClaimMs));
            Append(sb, run == null ? null : Number(run.QueueMs));
            Append(sb, run == null ? null : Number(run.ExecutionMs));
            Append(sb, Number(TotalMs));
            Append(sb, Date(ObservedTerminalUtc));
            Append(sb, run == null ? null : run.ErrorMessage, true);
            return sb.ToString();
        }

        /// <summary>
        /// Whether the run ended Failed (or TimedOut) with an outcome the retry policy is allowed to produce.
        /// </summary>
        /// <param name="options">Options with the allowed outcomes.</param>
        /// <returns>True when the failure is allowed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public bool IsAllowedFailure(LoadGenOptions options)
        {
            if (options == null) throw new ArgumentNullException(nameof(options));
            if (Run == null || options.RequireSuccess) return false;
            if (Run.Status != RunStatusEnum.Failed) return false;
            return options.AllowedOutcomes.Contains(Run.Outcome.ToString());
        }

        #endregion

        #region Private-Methods

        private static void Append(StringBuilder sb, string? value, bool last = false)
        {
            if (!String.IsNullOrEmpty(value))
            {
                bool quote = value.IndexOfAny(new char[] { ',', '"', '\n', '\r' }) >= 0;
                if (quote) sb.Append('"').Append(value.Replace("\"", "\"\"").Replace('\n', ' ').Replace('\r', ' ')).Append('"');
                else sb.Append(value);
            }
            if (!last) sb.Append(',');
        }

        private static string? Date(DateTime? value)
        {
            if (value == null || value.Value == DateTime.MinValue) return null;
            return value.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
        }

        private static string? Number(long? value)
        {
            return value == null ? null : value.Value.ToString(CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
