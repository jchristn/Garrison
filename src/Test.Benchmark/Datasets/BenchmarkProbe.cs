namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One probe: an operation with a known correct outcome, scored 1 (pass) or 0 (fail) by its oracle.
    /// </summary>
    public class BenchmarkProbe
    {
        /// <summary>
        /// Probe identifier, unique in the corpus.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// What makes the probe hard (for example node-selector, priority, truncation, unknown-agent).
        /// </summary>
        public string Type { get; set; } = String.Empty;

        /// <summary>
        /// Domain area (for example placement, prompts, parsing, validation, isolation).
        /// </summary>
        public string Category { get; set; } = String.Empty;

        /// <summary>
        /// True when the correct outcome is a refusal, a clean failure, or nothing (a 4xx, a blocked run, a failed run with the right outcome).
        /// </summary>
        public bool Negative { get; set; }

        /// <summary>
        /// What the probe does: run, request, blocked, cancel, idempotency, cross-tenant, priority, no-overlap, apply, reachable. See SCHEMA.md.
        /// </summary>
        public string Action { get; set; } = String.Empty;

        /// <summary>
        /// Agent name the probe invokes.
        /// </summary>
        public string? Agent { get; set; }

        /// <summary>
        /// Input message.
        /// </summary>
        public string? Input { get; set; }

        /// <summary>
        /// Repeat Input this many times to build a large input. Default 1, minimum 1, maximum 10000.
        /// </summary>
        public int InputRepeat { get; set; } = 1;

        /// <summary>
        /// Per-run parameter overrides.
        /// </summary>
        public Dictionary<string, string>? Parameters { get; set; }

        /// <summary>
        /// Run priority, -100 to 100.
        /// </summary>
        public int Priority { get; set; }

        /// <summary>
        /// How runs are started: create (async create, then follow), invoke (invoke and wait on the server), or wait (create with wait).
        /// </summary>
        public string Mode { get; set; } = "create";

        /// <summary>
        /// Runs the probe starts (no-overlap and priority use several). Default 1, minimum 1, maximum 100.
        /// </summary>
        public int Count { get; set; } = 1;

        /// <summary>
        /// For apply probes: the manifest text to apply.
        /// </summary>
        public string? Manifest { get; set; }

        /// <summary>
        /// For apply probes: apply as a dry run.
        /// </summary>
        public bool DryRun { get; set; }

        /// <summary>
        /// Longest wait for the probe's runs to finish. Default 60, minimum 1, maximum 3600.
        /// </summary>
        public int TimeoutSeconds { get; set; } = 60;

        /// <summary>
        /// Run probes: fake harness arguments that reproduce the same work outside Garrison (for example --format claude
        /// --delay-ms 20). The direct arm runs the harness with these arguments and the probe input on stdin; that is the
        /// floor the end-to-end overhead is measured against. Null skips the direct arm for this probe.
        /// </summary>
        public List<string>? DirectArguments { get; set; }

        /// <summary>
        /// The oracle.
        /// </summary>
        public ProbeExpectation Expect { get; set; } = new ProbeExpectation();
    }
}
