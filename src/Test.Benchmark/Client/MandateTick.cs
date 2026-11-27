namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// The fields of a keeper tick the harness reads.
    /// </summary>
    public class MandateTick
    {
        /// <summary>
        /// Identifier (mtk_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Mandate.
        /// </summary>
        public string MandateId { get; set; } = String.Empty;

        /// <summary>
        /// Timer, Manual, Message, EscalationAnswer, and so on.
        /// </summary>
        public string WakeSource { get; set; } = String.Empty;

        /// <summary>
        /// When the wake came due.
        /// </summary>
        public DateTime ScheduledUtc { get; set; } = DateTime.MinValue;

        /// <summary>
        /// When the scheduler handled the wake (started or skipped the tick).
        /// </summary>
        public DateTime StartedUtc { get; set; } = DateTime.MinValue;

        /// <summary>
        /// When the tick finished, or null while it runs.
        /// </summary>
        public DateTime? FinishedUtc { get; set; } = null;

        /// <summary>
        /// The run the tick started, or null for a skipped tick.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Outcome, or null while the tick runs.
        /// </summary>
        public string? Outcome { get; set; } = null;

        /// <summary>
        /// Why a tick was skipped or failed, or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;
    }
}
