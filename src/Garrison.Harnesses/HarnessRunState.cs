namespace Garrison.Harnesses
{
    using System;
    using System.Collections.Generic;
    using System.Text;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Normalized state accumulated by an output parser while a harness runs. Not thread-safe; one instance per run,
    /// written by the stdout reader.
    /// </summary>
    public class HarnessRunState
    {
        #region Public-Members

        /// <summary>
        /// Final result text reported by the harness's final event, when it has one.
        /// </summary>
        public string? FinalText { get; set; } = null;

        /// <summary>
        /// Concatenated assistant text seen so far.
        /// </summary>
        public StringBuilder AssistantText { get; } = new StringBuilder();

        /// <summary>
        /// Concatenated raw stdout, used by the PlainText parser and the Stdout result source.
        /// </summary>
        public StringBuilder Stdout { get; } = new StringBuilder();

        /// <summary>
        /// Structured output JSON, when the harness produced one.
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// Harness session identifier.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Model that served the run.
        /// </summary>
        public string? ServedModel { get; set; } = null;

        /// <summary>
        /// Input tokens.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Cached input tokens.
        /// </summary>
        public long CachedTokens { get; set; } = 0;

        /// <summary>
        /// Reasoning or thinking tokens, when the harness reports them separately; otherwise 0.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Cost in USD, when the harness reports it.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Whether the final event reported success.
        /// </summary>
        public bool SawSuccess { get; set; } = false;

        /// <summary>
        /// Whether a final event was seen at all.
        /// </summary>
        public bool SawFinalResult { get; set; } = false;

        /// <summary>
        /// Failure detected from the stream (for example an MCP server that did not connect), or null.
        /// </summary>
        public string? DetectedFailure { get; set; } = null;

        /// <summary>
        /// Detail of a credential failure reported in the stream (the harness could not authenticate to its model
        /// provider or could not resolve its credential configuration, for example a Mux 401 or config_unresolved_env),
        /// or null. It does not fail a run on its own; when the run fails, the outcome is NotCredentialed with this
        /// detail.
        /// </summary>
        public string? CredentialFailure { get; set; } = null;

        /// <summary>
        /// Whether the harness rejected its own output against the output schema it was given and exited non-zero
        /// only for that reason (Mux schema_validation_failed). The outcome classifier then treats the exit code as
        /// successful, so the control plane validates the output itself and can repair it in the same session.
        /// Default false.
        /// </summary>
        public bool HarnessRejectedOutputSchema { get; set; } = false;

        /// <summary>
        /// Number of lines that could not be parsed.
        /// </summary>
        public int UnparsedLines { get; set; } = 0;

        /// <summary>
        /// Maximum characters of a raw event retained on an event. Minimum 0, maximum 1048576, default 16384.
        /// </summary>
        public int MaxRawEventChars
        {
            get
            {
                return _MaxRawEventChars;
            }
            set
            {
                _MaxRawEventChars = Math.Clamp(value, 0, 1048576);
            }
        }

        #endregion

        #region Private-Members

        private readonly List<RunEventReport> _Pending = new List<RunEventReport>();
        private int _MaxRawEventChars = 16384;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Queue a normalized event. The caller assigns sequence numbers when draining.
        /// </summary>
        /// <param name="report">Event.</param>
        public void Emit(RunEventReport report)
        {
            if (report == null) return;
            if (report.RawEventJson != null && report.RawEventJson.Length > _MaxRawEventChars)
            {
                report.RawEventJson = _MaxRawEventChars == 0 ? null : report.RawEventJson.Substring(0, _MaxRawEventChars);
            }
            _Pending.Add(report);
        }

        /// <summary>
        /// Remove and return queued events in order.
        /// </summary>
        /// <returns>Events.</returns>
        public List<RunEventReport> Drain()
        {
            List<RunEventReport> drained = new List<RunEventReport>(_Pending);
            _Pending.Clear();
            return drained;
        }

        /// <summary>
        /// Best available result text: the final event text, else the concatenated assistant text.
        /// </summary>
        /// <returns>Text, or null when nothing was produced.</returns>
        public string? BestText()
        {
            if (!String.IsNullOrEmpty(FinalText)) return FinalText;
            if (AssistantText.Length > 0) return AssistantText.ToString();
            return null;
        }

        #endregion
    }
}
