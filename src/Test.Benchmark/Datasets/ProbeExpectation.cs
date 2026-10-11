namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What a probe must observe to pass. Every field that is set is checked; unset fields are not.
    /// </summary>
    public class ProbeExpectation
    {
        /// <summary>
        /// Expected HTTP status of the request that starts the probe.
        /// </summary>
        public int? HttpStatus { get; set; }

        /// <summary>
        /// Expected error code of a failed request.
        /// </summary>
        public string? ErrorCode { get; set; }

        /// <summary>
        /// Expected field code of a validation failure (any field), for example ParameterNotAllowed.
        /// </summary>
        public string? FieldCode { get; set; }

        /// <summary>
        /// Expected terminal run status, for example Succeeded or Failed.
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Expected run outcome.
        /// </summary>
        public string? Outcome { get; set; }

        /// <summary>
        /// Expected exact result text.
        /// </summary>
        public string? ResultText { get; set; }

        /// <summary>
        /// Expect the fake harness echo: 'Echo: ' plus the first 200 characters of the input, trimmed.
        /// </summary>
        public bool ResultEcho { get; set; }

        /// <summary>
        /// Text the result must contain.
        /// </summary>
        public string? ResultContains { get; set; }

        /// <summary>
        /// Label key the node that ran every run must carry.
        /// </summary>
        public string? NodeLabelKey { get; set; }

        /// <summary>
        /// Value of NodeLabelKey on that node.
        /// </summary>
        public string? NodeLabelValue { get; set; }

        /// <summary>
        /// Expected blockedReason while the run is queued (blocked probes).
        /// </summary>
        public string? BlockedReason { get; set; }

        /// <summary>
        /// Minimum run events.
        /// </summary>
        public int? MinEvents { get; set; }

        /// <summary>
        /// Event types that must each appear at least once.
        /// </summary>
        public List<string>? EventTypes { get; set; }

        /// <summary>
        /// Event sequences must be 1..n with no gap or duplicate.
        /// </summary>
        public bool ContiguousEvents { get; set; }

        /// <summary>
        /// Cancel probes: most milliseconds from the cancel request to a terminal Cancelled status.
        /// </summary>
        public int? MaxCancelMs { get; set; }

        /// <summary>
        /// Expected outputSchemaValid.
        /// </summary>
        public bool? OutputSchemaValid { get; set; }

        /// <summary>
        /// Expected repairAttempts.
        /// </summary>
        public int? RepairAttempts { get; set; }

        /// <summary>
        /// Apply probes: expected failedCount.
        /// </summary>
        public int? ManifestFailed { get; set; }

        /// <summary>
        /// Apply probes: expected createdCount.
        /// </summary>
        public int? ManifestCreated { get; set; }

        /// <summary>
        /// Apply probes: expected unchangedCount.
        /// </summary>
        public int? ManifestUnchanged { get; set; }

        /// <summary>
        /// Apply probes: text the first failed item's message must contain.
        /// </summary>
        public string? ManifestMessageContains { get; set; }
    }
}
