namespace Garrison.Benchmark.Datasets
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Enforces the rules in benchmarks/datasets/SCHEMA.md: unique identifiers, known kinds and actions, manifest
    /// documents that match their declared kind and name, probes that reference agents in their own corpus, negative
    /// probes that expect a failure (and positive probes that do not), value ranges, and at least one negative probe per
    /// corpus that has probes. Stateless and thread-safe.
    /// </summary>
    public static class DatasetValidator
    {
        #region Public-Members

        /// <summary>
        /// Manifest kinds Garrison accepts.
        /// </summary>
        public static readonly IReadOnlyList<string> Kinds = new List<string> { "Secret", "PromptTemplate", "HarnessProfile", "McpServer", "WorkspaceTemplate", "Agent", "Deployment" };

        /// <summary>
        /// Probe actions the runners implement.
        /// </summary>
        public static readonly IReadOnlyList<string> Actions = new List<string> { "run", "request", "blocked", "cancel", "idempotency", "cross-tenant", "priority", "no-overlap", "apply", "reachable" };

        /// <summary>
        /// Corpus commands. A load corpus holds the workload agent of the load and resilience commands.
        /// </summary>
        public static readonly IReadOnlyList<string> Commands = new List<string> { "ingest", "routing", "e2e", "load" };

        /// <summary>
        /// Run start modes.
        /// </summary>
        public static readonly IReadOnlyList<string> Modes = new List<string> { "create", "invoke", "wait" };

        /// <summary>
        /// Dataset tiers.
        /// </summary>
        public static readonly IReadOnlyList<string> Tiers = new List<string> { "live", "synthetic", "public", "local" };

        /// <summary>
        /// Largest manifest document in characters (64 KiB).
        /// </summary>
        public static readonly int MaxManifestChars = 65536;

        /// <summary>
        /// Largest probe input after InputRepeat, in characters.
        /// </summary>
        public static readonly int MaxInputChars = 1000000;

        #endregion

        #region Private-Members

        private static readonly Regex _IdPattern = new Regex("^[a-z0-9][a-z0-9-]*$", RegexOptions.CultureInvariant);
        private static readonly HashSet<string> _AgentActions = new HashSet<string>(StringComparer.Ordinal) { "run", "request", "blocked", "cancel", "idempotency", "cross-tenant", "priority", "no-overlap" };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a dataset.
        /// </summary>
        /// <param name="dataset">Dataset.</param>
        /// <returns>Problems found; empty when the dataset is valid.</returns>
        /// <exception cref="ArgumentNullException">Thrown when dataset is null.</exception>
        public static List<ValidationIssue> Validate(BenchmarkDataset dataset)
        {
            if (dataset == null) throw new ArgumentNullException(nameof(dataset));
            List<ValidationIssue> issues = new List<ValidationIssue>();

            if (String.IsNullOrEmpty(dataset.Name) || !_IdPattern.IsMatch(dataset.Name)) issues.Add(new ValidationIssue("dataset", "name must be lowercase letters, digits, and hyphens."));
            if (dataset.SchemaVersion != 1) issues.Add(new ValidationIssue("dataset", "schemaVersion must be 1."));
            if (String.IsNullOrEmpty(dataset.Tier) || !Tiers.Contains(dataset.Tier)) issues.Add(new ValidationIssue("dataset", "tier must be one of " + String.Join(", ", Tiers) + "."));
            if (dataset.Tier == "live")
            {
                if (String.IsNullOrEmpty(dataset.SnapshotDate) || !DateTime.TryParseExact(dataset.SnapshotDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime _))
                    issues.Add(new ValidationIssue("dataset", "a live dataset needs snapshotDate (yyyy-MM-dd): live data is frozen on a date."));
            }
            if (dataset.Corpora.Count == 0) issues.Add(new ValidationIssue("dataset", "needs at least one corpus."));

            HashSet<string> corpusIds = new HashSet<string>(StringComparer.Ordinal);
            int negatives = 0;
            foreach (BenchmarkCorpus corpus in dataset.Corpora)
            {
                string where = "corpus/" + corpus.Id;
                if (String.IsNullOrEmpty(corpus.Id) || !_IdPattern.IsMatch(corpus.Id)) issues.Add(new ValidationIssue(where, "id must be lowercase letters, digits, and hyphens."));
                if (!corpusIds.Add(corpus.Id)) issues.Add(new ValidationIssue(where, "duplicate corpus id."));
                if (!Commands.Contains(corpus.Command)) issues.Add(new ValidationIssue(where, "command must be one of " + String.Join(", ", Commands) + "."));
                ValidateItems(corpus, issues);
                negatives += ValidateProbes(corpus, issues);
                if (corpus.Probes.Count > 0 && !corpus.Probes.Any(p => p.Negative)) issues.Add(new ValidationIssue(where, "needs at least one negative probe (the correct outcome is a refusal, a clean failure, or nothing)."));
            }
            if (negatives == 0) issues.Add(new ValidationIssue("dataset", "needs at least one negative probe."));
            return issues;
        }

        /// <summary>
        /// The input a probe sends: Input repeated InputRepeat times.
        /// </summary>
        /// <param name="probe">Probe.</param>
        /// <returns>Input text (empty when Input is null).</returns>
        /// <exception cref="ArgumentNullException">Thrown when probe is null.</exception>
        public static string EffectiveInput(BenchmarkProbe probe)
        {
            if (probe == null) throw new ArgumentNullException(nameof(probe));
            if (String.IsNullOrEmpty(probe.Input)) return String.Empty;
            if (probe.InputRepeat <= 1) return probe.Input;
            return String.Concat(Enumerable.Repeat(probe.Input, Math.Min(probe.InputRepeat, 10000)));
        }

        /// <summary>
        /// The fake harness echo for an input: "Echo: " plus the first 200 characters, trimmed.
        /// </summary>
        /// <param name="input">Input text (the rendered prompt).</param>
        /// <returns>Expected result text.</returns>
        public static string ExpectedEcho(string input)
        {
            string prompt = input ?? String.Empty;
            return "Echo: " + (prompt.Length > 200 ? prompt.Substring(0, 200) : prompt).Trim();
        }

        #endregion

        #region Private-Methods

        private static void ValidateItems(BenchmarkCorpus corpus, List<ValidationIssue> issues)
        {
            HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
            HashSet<string> kindNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (BenchmarkItem item in corpus.Items)
            {
                string where = "corpus/" + corpus.Id + "/item/" + item.Id;
                if (String.IsNullOrEmpty(item.Id) || !_IdPattern.IsMatch(item.Id)) issues.Add(new ValidationIssue(where, "id must be lowercase letters, digits, and hyphens."));
                if (!ids.Add(item.Id)) issues.Add(new ValidationIssue(where, "duplicate item id."));
                if (!Kinds.Contains(item.Kind)) issues.Add(new ValidationIssue(where, "kind must be one of " + String.Join(", ", Kinds) + "."));
                if (String.IsNullOrEmpty(item.Name)) issues.Add(new ValidationIssue(where, "name is required."));
                if (!kindNames.Add(item.Kind + "/" + item.Name)) issues.Add(new ValidationIssue(where, "duplicate " + item.Kind + " named " + item.Name + "."));
                if (String.IsNullOrEmpty(item.Manifest))
                {
                    issues.Add(new ValidationIssue(where, "manifest is required."));
                    continue;
                }
                if (item.Manifest.Length > MaxManifestChars) issues.Add(new ValidationIssue(where, "manifest is longer than " + MaxManifestChars.ToString(CultureInfo.InvariantCulture) + " characters."));
                if (!Regex.IsMatch(item.Manifest, "^apiVersion:\\s*garrison/v1\\s*$", RegexOptions.Multiline)) issues.Add(new ValidationIssue(where, "manifest must declare apiVersion: garrison/v1."));
                if (!Regex.IsMatch(item.Manifest, "^kind:\\s*" + Regex.Escape(item.Kind) + "\\s*$", RegexOptions.Multiline)) issues.Add(new ValidationIssue(where, "manifest kind does not match the item kind " + item.Kind + "."));
                if (!Regex.IsMatch(item.Manifest, "^\\s+name:\\s*\"?" + Regex.Escape(item.Name) + "\"?\\s*$", RegexOptions.Multiline)) issues.Add(new ValidationIssue(where, "manifest metadata.name does not match the item name " + item.Name + "."));
                if (Regex.IsMatch(item.Manifest, "^---\\s*$", RegexOptions.Multiline)) issues.Add(new ValidationIssue(where, "an item holds exactly one document; remove the --- separator."));
            }
        }

        private static int ValidateProbes(BenchmarkCorpus corpus, List<ValidationIssue> issues)
        {
            HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
            HashSet<string> agents = new HashSet<string>(corpus.Items.Where(i => i.Kind == "Agent").Select(i => i.Name), StringComparer.Ordinal);
            int negatives = 0;
            foreach (BenchmarkProbe probe in corpus.Probes)
            {
                string where = "corpus/" + corpus.Id + "/probe/" + probe.Id;
                ProbeExpectation expect = probe.Expect ?? new ProbeExpectation();
                if (probe.Negative) negatives++;
                if (String.IsNullOrEmpty(probe.Id) || !_IdPattern.IsMatch(probe.Id)) issues.Add(new ValidationIssue(where, "id must be lowercase letters, digits, and hyphens."));
                if (!ids.Add(probe.Id)) issues.Add(new ValidationIssue(where, "duplicate probe id."));
                if (String.IsNullOrEmpty(probe.Type)) issues.Add(new ValidationIssue(where, "type is required."));
                if (String.IsNullOrEmpty(probe.Category)) issues.Add(new ValidationIssue(where, "category is required."));
                if (!Actions.Contains(probe.Action)) issues.Add(new ValidationIssue(where, "action must be one of " + String.Join(", ", Actions) + "."));
                if (!Modes.Contains(probe.Mode)) issues.Add(new ValidationIssue(where, "mode must be one of " + String.Join(", ", Modes) + "."));
                if (probe.InputRepeat < 1 || probe.InputRepeat > 10000) issues.Add(new ValidationIssue(where, "inputRepeat must be 1 to 10000."));
                if (probe.Count < 1 || probe.Count > 100) issues.Add(new ValidationIssue(where, "count must be 1 to 100."));
                if (probe.TimeoutSeconds < 1 || probe.TimeoutSeconds > 3600) issues.Add(new ValidationIssue(where, "timeoutSeconds must be 1 to 3600."));
                if (probe.Priority < -100 || probe.Priority > 100) issues.Add(new ValidationIssue(where, "priority must be -100 to 100."));
                if ((probe.Input ?? String.Empty).Length * (long)Math.Max(1, probe.InputRepeat) > MaxInputChars) issues.Add(new ValidationIssue(where, "input after inputRepeat is longer than " + MaxInputChars.ToString(CultureInfo.InvariantCulture) + " characters."));
                if (probe.Parameters != null && probe.Parameters.Any(p => String.IsNullOrEmpty(p.Key) || p.Value == null)) issues.Add(new ValidationIssue(where, "parameters need non-empty names and non-null values."));

                if (_AgentActions.Contains(probe.Action))
                {
                    if (String.IsNullOrEmpty(probe.Agent)) issues.Add(new ValidationIssue(where, "action " + probe.Action + " needs an agent."));
                    else if (!agents.Contains(probe.Agent) && !probe.Negative) issues.Add(new ValidationIssue(where, "agent " + probe.Agent + " is not an Agent item of this corpus (only a negative probe may name a missing agent)."));
                }
                if (probe.Action == "apply" && String.IsNullOrEmpty(probe.Manifest)) issues.Add(new ValidationIssue(where, "an apply probe needs a manifest."));
                if (probe.Action == "blocked" && String.IsNullOrEmpty(expect.BlockedReason)) issues.Add(new ValidationIssue(where, "a blocked probe needs expect.blockedReason."));
                if (probe.Action != "blocked" && !String.IsNullOrEmpty(expect.BlockedReason)) issues.Add(new ValidationIssue(where, "expect.blockedReason is only for blocked probes."));
                if (probe.Action != "cancel" && expect.MaxCancelMs.HasValue) issues.Add(new ValidationIssue(where, "expect.maxCancelMs is only for cancel probes."));
                if ((probe.Action == "priority" || probe.Action == "no-overlap") && probe.Count < 2) issues.Add(new ValidationIssue(where, "a " + probe.Action + " probe needs count of at least 2."));
                if (expect.ResultEcho && !String.IsNullOrEmpty(expect.ResultText)) issues.Add(new ValidationIssue(where, "set expect.resultEcho or expect.resultText, not both."));
                if (expect.ResultEcho && String.IsNullOrEmpty(probe.Input)) issues.Add(new ValidationIssue(where, "expect.resultEcho needs an input."));
                if (String.IsNullOrEmpty(expect.NodeLabelKey) != String.IsNullOrEmpty(expect.NodeLabelValue)) issues.Add(new ValidationIssue(where, "expect.nodeLabelKey and expect.nodeLabelValue go together."));

                bool expectsFailure = (expect.HttpStatus.HasValue && expect.HttpStatus.Value >= 400)
                    || (!String.IsNullOrEmpty(expect.Status) && expect.Status != "Succeeded" && expect.Status != "Cancelled")
                    || !String.IsNullOrEmpty(expect.BlockedReason)
                    || (expect.ManifestFailed.HasValue && expect.ManifestFailed.Value > 0)
                    || expect.OutputSchemaValid == false;
                if (probe.Negative && !expectsFailure) issues.Add(new ValidationIssue(where, "a negative probe must expect a refusal or failure (an HTTP status of 400 or more, a failed status, a blocked reason, a failed manifest document, or invalid output)."));
                if (!probe.Negative && expectsFailure) issues.Add(new ValidationIssue(where, "this probe expects a refusal or failure, so mark it negative."));
                if (!probe.Negative && probe.Action != "apply" && probe.Action != "reachable" && !HasRunExpectation(expect)) issues.Add(new ValidationIssue(where, "a positive probe needs at least one expectation about its result."));
            }
            return negatives;
        }

        private static bool HasRunExpectation(ProbeExpectation expect)
        {
            return expect.HttpStatus.HasValue || !String.IsNullOrEmpty(expect.Status) || !String.IsNullOrEmpty(expect.Outcome)
                || !String.IsNullOrEmpty(expect.ResultText) || expect.ResultEcho || !String.IsNullOrEmpty(expect.ResultContains)
                || !String.IsNullOrEmpty(expect.NodeLabelKey) || expect.MinEvents.HasValue || expect.MaxCancelMs.HasValue
                || expect.OutputSchemaValid.HasValue;
        }

        #endregion
    }
}
