namespace Garrison.Harnesses.Execution
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Why a <see cref="RunGuard"/> stopped a run.
    /// </summary>
    public class RunGuardTrip
    {
        /// <summary>
        /// Event code of the Warning event the worker emits when a guard trips.
        /// </summary>
        public static readonly string EventCode = "RunGuardTriggered";

        /// <summary>
        /// Guard that tripped: repetitionGuard, maxAssistantChars, or noProgressSeconds (the limit names).
        /// </summary>
        public string Guard { get; set; } = String.Empty;

        /// <summary>
        /// Outcome the run ends with: RepetitionDetected, OutputLimitExceeded, or NoProgress.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.RepetitionDetected;

        /// <summary>
        /// Human-readable reason, used as the Warning event text and the run's error message.
        /// </summary>
        public string Reason { get; set; } = String.Empty;
    }
}
