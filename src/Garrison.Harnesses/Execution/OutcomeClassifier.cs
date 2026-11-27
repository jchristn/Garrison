namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;

    /// <summary>
    /// Classifies a finished harness run (Aegon order): cancelled, run guard trip, timed out, not installed, output limit, parser
    /// failure, success per policy, credential failures reported in the stream, credential heuristics from stderr,
    /// otherwise failed. The exit code is recorded but
    /// decides success only when the success policy involves it (or the parser is PlainText). Thread-safe.
    /// </summary>
    public static class OutcomeClassifier
    {
        #region Public-Members

        /// <summary>
        /// Lowercase stderr fragments that indicate missing or invalid credentials.
        /// </summary>
        public static IReadOnlyList<string> CredentialMarkers
        {
            get
            {
                return _CredentialMarkers;
            }
        }

        /// <summary>
        /// The code at the start of the error message of a run that failed because the model gave no answer and called no
        /// tools: EmptyResponse. The outcome is HarnessFailed.
        /// </summary>
        public static readonly string EmptyResponseCode = "EmptyResponse";

        #endregion

        #region Private-Members

        private static readonly List<string> _CredentialMarkers = new List<string>
        {
            "authentication_failed",
            "not logged in",
            "invalid api key",
            "invalid_api_key",
            "401 unauthorized",
            "please run /login",
            "please login",
            "api key not found",
            "no api key",
            "missing api key",
            "unauthorized"
        };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Classify.
        /// </summary>
        /// <param name="spec">Execution spec.</param>
        /// <param name="process">Process result.</param>
        /// <param name="state">Parser state.</param>
        /// <returns>Outcome.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static HarnessOutcome Classify(ExecutionSpec spec, ProcessRunResult process, HarnessRunState state)
        {
            return Classify(spec, process, state, null);
        }

        /// <summary>
        /// Classify, taking a run guard trip into account. A trip ranks right after cancellation: the run ends Failed
        /// with the guard's outcome (RepetitionDetected, OutputLimitExceeded, or NoProgress) even when the harness
        /// managed to exit on its own after the trip.
        /// </summary>
        /// <param name="spec">Execution spec.</param>
        /// <param name="process">Process result.</param>
        /// <param name="state">Parser state.</param>
        /// <param name="trip">Run guard trip, or null when no guard tripped.</param>
        /// <returns>Outcome.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spec, process, or state is null.</exception>
        public static HarnessOutcome Classify(ExecutionSpec spec, ProcessRunResult process, HarnessRunState state, RunGuardTrip? trip)
        {
            if (state == null) throw new ArgumentNullException(nameof(state));
            return Classify(spec, process, state, trip, state.BestText());
        }

        /// <summary>
        /// Classify, taking a run guard trip and the run's result text into account. A run its harness reports as
        /// successful still fails (HarnessFailed, with a message that starts with <see cref="EmptyResponseCode"/>) when the
        /// parser set <see cref="HarnessRunState.EmptyAnswerFails"/> and the run produced no result text, no structured
        /// output, and no tool call.
        /// </summary>
        /// <param name="spec">Execution spec.</param>
        /// <param name="process">Process result.</param>
        /// <param name="state">Parser state.</param>
        /// <param name="trip">Run guard trip, or null when no guard tripped.</param>
        /// <param name="resultText">The run's result text as the result source yields it (for example the last message
        /// file), or null when there is none.</param>
        /// <returns>Outcome.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spec, process, or state is null.</exception>
        public static HarnessOutcome Classify(ExecutionSpec spec, ProcessRunResult process, HarnessRunState state, RunGuardTrip? trip, string? resultText)
        {
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (process == null) throw new ArgumentNullException(nameof(process));
            if (state == null) throw new ArgumentNullException(nameof(state));

            if (process.Cancelled) return Make(RunStatusEnum.Cancelled, RunOutcomeEnum.Cancelled, "Run was cancelled.");
            if (trip != null) return Make(RunStatusEnum.Failed, trip.Outcome, trip.Reason);
            if (process.TimedOut) return Make(RunStatusEnum.TimedOut, RunOutcomeEnum.TimedOut, "Run exceeded its deadline of " + spec.TimeoutSeconds + " seconds.");
            if (process.NotInstalled) return Make(RunStatusEnum.Failed, RunOutcomeEnum.NotInstalled, process.LaunchError ?? ("Executable '" + spec.Executable + "' is not installed."));
            if (process.OutputLimitExceeded) return Make(RunStatusEnum.Failed, RunOutcomeEnum.OutputLimitExceeded, "Harness output exceeded " + spec.MaxOutputBytes + " bytes.");

            bool exitOk = process.ExitCode.HasValue && (spec.SuccessExitCodes.Count == 0 ? process.ExitCode.Value == 0 : spec.SuccessExitCodes.Contains(process.ExitCode.Value));

            // A harness that rejected its own output against the output schema exited non-zero for that reason alone.
            // Let the control plane validate the output so it can repair it in the same session.
            if (state.HarnessRejectedOutputSchema && process.ExitCode.HasValue) exitOk = true;
            SuccessPolicyEnum policy = spec.Parser == OutputParserEnum.PlainText ? SuccessPolicyEnum.ExitCode : spec.SuccessPolicy;

            bool success;
            switch (policy)
            {
                case SuccessPolicyEnum.ExitCode:
                    success = exitOk;
                    break;
                case SuccessPolicyEnum.FinalEventAndExitCode:
                    success = exitOk && state.SawSuccess && state.DetectedFailure == null;
                    break;
                default:
                    success = state.SawSuccess && state.DetectedFailure == null;
                    break;
            }

            if (success && state.EmptyAnswerFails && state.ToolCallCount == 0 && String.IsNullOrWhiteSpace(resultText) && String.IsNullOrWhiteSpace(state.StructuredOutputJson))
            {
                // AA12.7: a harness that reports success for a model call that returned nothing did no work. Counting it as
                // success marked a keeper tick Unreported and a message Delivered with nothing done.
                return Make(RunStatusEnum.Failed, RunOutcomeEnum.HarnessFailed, EmptyResponseMessage(state));
            }

            if (success) return Make(RunStatusEnum.Succeeded, RunOutcomeEnum.Succeeded, null);

            if (state.CredentialFailure != null)
            {
                return Make(RunStatusEnum.Failed, RunOutcomeEnum.NotCredentialed, "Harness is not credentialed: " + state.CredentialFailure);
            }

            string stderrLower = (process.StderrTail ?? String.Empty).ToLowerInvariant();
            if (_CredentialMarkers.Any(m => stderrLower.Contains(m, StringComparison.Ordinal)))
            {
                return Make(RunStatusEnum.Failed, RunOutcomeEnum.NotCredentialed, "Harness is not credentialed: " + LastLine(process.StderrTail));
            }

            if (state.DetectedFailure != null) return Make(RunStatusEnum.Failed, RunOutcomeEnum.HarnessFailed, state.DetectedFailure);

            string detail = LastLine(process.StderrTail);
            if (String.IsNullOrEmpty(detail)) detail = state.SawFinalResult ? "Harness reported failure." : "Harness exited with code " + (process.ExitCode?.ToString() ?? "unknown") + " without a final result.";
            return Make(RunStatusEnum.Failed, RunOutcomeEnum.HarnessFailed, detail);
        }

        #endregion

        #region Private-Methods

        private static HarnessOutcome Make(RunStatusEnum status, RunOutcomeEnum outcome, string? message)
        {
            HarnessOutcome result = new HarnessOutcome();
            result.Status = status;
            result.Outcome = outcome;
            result.ErrorMessage = message;
            return result;
        }

        private static string EmptyResponseMessage(HarnessRunState state)
        {
            string tokens = state.OutputTokens > 0
                ? " The model used " + state.OutputTokens + " output tokens" + (state.ReasoningTokens > 0 ? ", " + state.ReasoningTokens + " of them for reasoning" : String.Empty) + "; a reasoning model can spend its whole output budget thinking, so raise the harness's output token limit (for Mux, the endpoint's maxTokens)."
                : String.Empty;
            return EmptyResponseCode + ": the harness reported success, but the model gave no answer and called no tools." + tokens;
        }

        private static string LastLine(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return String.Empty;
            string[] lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return lines.Length == 0 ? String.Empty : lines[lines.Length - 1];
        }

        #endregion
    }
}
