namespace Garrison.Core.Telemetry
{
    using System;
    using System.Diagnostics;

    /// <summary>
    /// Run tracing helpers (P13.16). Every run belongs to one W3C trace: the server records it when the run is created
    /// (span run:create), parents the claim and compile spans (run:claim, run:compile) on it, and ships the traceparent
    /// to the worker in the execution spec so the worker's span (harness &lt;type&gt; exec) joins the same trace. Trace
    /// identifiers exist even when no exporter listens, so runs always record a trace ID. Stateless and thread-safe.
    /// </summary>
    public static class RunTracing
    {
        #region Public-Members

        /// <summary>
        /// Activity source for server spans, named Garrison. Radiant subscribes to it when telemetry is enabled.
        /// </summary>
        public static readonly ActivitySource Source = new ActivitySource("Garrison");

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start the span for a new run. When a parent traceparent is given (delegation: the parent run's trace), the
        /// span joins that trace; otherwise it joins <see cref="Activity.Current"/> (for example the HTTP request span)
        /// or starts a new trace.
        /// </summary>
        /// <param name="name">Span name, for example run:create.</param>
        /// <param name="parentTraceParent">W3C traceparent to parent on, or null.</param>
        /// <returns>Started activity, or null when no listener samples the span. Dispose it to end the span.</returns>
        /// <exception cref="ArgumentNullException">Thrown when name is null or empty.</exception>
        public static Activity? Start(string name, string? parentTraceParent)
        {
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            try
            {
                if (!String.IsNullOrEmpty(parentTraceParent) && ActivityContext.TryParse(parentTraceParent, null, out ActivityContext parent))
                {
                    return Source.StartActivity(name, ActivityKind.Internal, parent);
                }
                return Source.StartActivity(name, ActivityKind.Internal);
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// The W3C traceparent a new run should record: the started span when there is one, else the parent traceparent,
        /// else the current activity, else a newly generated sampled traceparent.
        /// </summary>
        /// <param name="activity">Span started for the run, or null.</param>
        /// <param name="parentTraceParent">Parent traceparent, or null.</param>
        /// <returns>Traceparent in the form 00-&lt;trace id&gt;-&lt;span id&gt;-&lt;flags&gt;.</returns>
        public static string TraceParentFor(Activity? activity, string? parentTraceParent)
        {
            if (activity != null && activity.IdFormat == ActivityIdFormat.W3C && !String.IsNullOrEmpty(activity.Id)) return activity.Id;
            if (!String.IsNullOrEmpty(parentTraceParent) && TraceIdOf(parentTraceParent) != null) return parentTraceParent;
            Activity? current = Activity.Current;
            if (current != null && current.IdFormat == ActivityIdFormat.W3C && !String.IsNullOrEmpty(current.Id)) return current.Id;
            return "00-" + ActivityTraceId.CreateRandom().ToHexString() + "-" + ActivitySpanId.CreateRandom().ToHexString() + "-01";
        }

        /// <summary>
        /// Trace ID (32 lowercase hexadecimal characters) of a W3C traceparent.
        /// </summary>
        /// <param name="traceParent">Traceparent, or null.</param>
        /// <returns>Trace ID, or null when the value is missing or malformed.</returns>
        public static string? TraceIdOf(string? traceParent)
        {
            if (String.IsNullOrEmpty(traceParent)) return null;
            if (!ActivityContext.TryParse(traceParent, null, out ActivityContext context)) return null;
            string id = context.TraceId.ToHexString();
            return id == "00000000000000000000000000000000" ? null : id;
        }

        /// <summary>
        /// Log fields that identify a run, appended to server and worker log lines so a Loki query for the run ID (or
        /// the trace ID) finds them: <c>run=&lt;runId&gt; trace=&lt;traceId&gt;</c>, with <c>trace=-</c> when unknown.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="traceId">Trace ID, or null.</param>
        /// <returns>Fields without leading or trailing spaces.</returns>
        public static string LogFields(string? runId, string? traceId)
        {
            return "run=" + (String.IsNullOrEmpty(runId) ? "-" : runId) + " trace=" + (String.IsNullOrEmpty(traceId) ? "-" : traceId);
        }

        #endregion
    }
}
