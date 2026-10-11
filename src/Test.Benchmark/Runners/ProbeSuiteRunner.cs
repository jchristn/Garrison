namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Reference;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The routing command (scheduling and placement correctness) and the e2e command (the full user-facing run
    /// flow, with the direct-invocation reference arm as its floor). Both provision each corpus as a workspace, run
    /// every probe in every arm, and score it against its oracle.
    /// </summary>
    public static class ProbeSuiteRunner
    {
        #region Public-Methods

        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="kind">routing or e2e.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Exit code.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context or kind is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, string kind, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (kind == null) throw new ArgumentNullException(nameof(kind));
            bool e2e = kind == "e2e";
            LoadedDataset? loaded = RunnerSupport.LoadDataset(context, "benchmarks/datasets/synthetic-fleet.json");
            if (loaded == null) return 1;

            List<string> corpusFilter = context.Args.GetList("corpus", String.Empty);
            int repeat = context.Args.GetInt("repeat", e2e ? 3 : 1, 1, 1000);
            int limit = context.Args.GetInt("limit", 0, 0, 100000);
            int warmup = context.Args.GetInt("warmup", e2e ? 2 : 0, 0, 100);
            bool deterministic = context.Args.GetBool("deterministic", !e2e);
            bool useDirect = context.Args.GetBool("direct", e2e);
            int pollMs = context.Args.GetInt("poll-ms", 100, 10, 10000);
            string? suffix = context.Args.GetOptional("workspace-suffix");

            DirectInvoker? direct = null;
            List<string> notes = new List<string>();
            if (useDirect)
            {
                string? dll = DirectInvoker.Locate(context.Root, context.Args.GetOptional("fake-harness"));
                if (dll == null) notes.Add("Direct arm skipped: garrison-fake-harness.dll not found (build src/Garrison.FakeHarness or pass --fake-harness).");
                else direct = new DirectInvoker(dll);
            }

            ProbeExecutor executor = new ProbeExecutor(context.Client, pollMs, direct);
            executor.Stream = context.Args.GetBool("stream", true);
            executor.OtherTenant = context.Args.GetString("other-tenant", "default");

            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(context.Args.GetInt("ready-timeout-seconds", 120, 1, 3600)), token).ConfigureAwait(false)) return 1;
            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = kind;
            report.Deterministic = deterministic;
            report.Notes.AddRange(notes);
            Provisioner provisioner = new Provisioner(context.Client);
            List<string> provisionFailures = new List<string>();

            List<BenchmarkCorpus> corpora = loaded.Dataset.Corpora
                .Where(c => corpusFilter.Count > 0 ? corpusFilter.Contains(c.Id) : c.Command == kind)
                .ToList();
            if (corpora.Count == 0)
            {
                Console.Error.WriteLine("Dataset " + loaded.Dataset.Name + " has no corpus for the " + kind + " command" + (corpusFilter.Count > 0 ? " named " + String.Join(",", corpusFilter) : String.Empty) + ".");
                return 1;
            }

            foreach (BenchmarkCorpus corpus in corpora)
            {
                token.ThrowIfCancellationRequested();
                List<BenchmarkProbe> probes = ProbeSelection.Select(corpus.Probes, limit, context.Seed);
                Workspace workspace;
                try
                {
                    workspace = await provisioner.ProvisionAsync(loaded.Dataset.Name, corpus, suffix, token).ConfigureAwait(false);
                    BenchmarkContext.Log("corpus " + corpus.Id + ": workspace " + workspace.Name + (workspace.Reused ? " (reused)" : " (new)") + ", " + probes.Count + " probes x " + repeat);
                }
                catch (InvalidOperationException e)
                {
                    provisionFailures.Add(corpus.Id + ": " + e.Message);
                    BenchmarkContext.Log("corpus " + corpus.Id + " failed to load: " + e.Message);
                    foreach (BenchmarkProbe probe in probes)
                    {
                        for (int r = 0; r < repeat; r++) report.Outcomes.Add(Unloaded(corpus, probe, r, e.Message));
                    }
                    continue;
                }

                foreach (BenchmarkProbe probe in probes.Where(p => p.Action == "run").Take(warmup))
                {
                    await executor.ExecuteAsync(workspace.TenantId, corpus, probe, -1, token).ConfigureAwait(false);
                    if (direct != null) await executor.ExecuteDirectAsync(corpus, probe, -1, token).ConfigureAwait(false);
                }

                foreach (BenchmarkProbe probe in probes)
                {
                    for (int r = 0; r < repeat; r++)
                    {
                        token.ThrowIfCancellationRequested();
                        ProbeOutcome outcome = await executor.ExecuteAsync(workspace.TenantId, corpus, probe, r, token).ConfigureAwait(false);
                        report.Outcomes.Add(outcome);
                        ProbeOutcome? floor = direct == null ? null : await executor.ExecuteDirectAsync(corpus, probe, r, token).ConfigureAwait(false);
                        if (floor != null)
                        {
                            report.Outcomes.Add(floor);
                            if (outcome.Passed && floor.Passed && outcome.LatencyMs.HasValue && floor.LatencyMs.HasValue)
                            {
                                outcome.Timings["directMs"] = floor.LatencyMs.Value;
                                outcome.Timings["overheadMs"] = outcome.LatencyMs.Value - floor.LatencyMs.Value;
                            }
                        }
                        if (!outcome.Passed) BenchmarkContext.Log("  miss " + corpus.Id + "/" + probe.Id + "#" + r + ": " + String.Join("; ", outcome.Failures));
                    }
                }
            }

            if (provisionFailures.Count > 0)
            {
                report.Incomplete = true;
                report.IncompleteReason = "Incomplete load: " + provisionFailures.Count + " corpus failed to provision (" + String.Join(" | ", provisionFailures) + ")";
            }
            Dictionary<string, string> arms = new Dictionary<string, string>
            {
                { "garrison", "Runs through Garrison: REST create or invoke, scheduling, lease, compile, worker, fake harness, event shipping, completion." },
                { "direct", "Reference arm and floor: the same fake harness, arguments, and prompt, started directly by the harness with no Garrison in between." },
            };
            await RunnerSupport.FinishAsync(context, report, loaded.Dataset.Name, loaded.Sha256, loaded.Path, startedUtc, arms, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }

        #endregion

        #region Private-Methods

        private static ProbeOutcome Unloaded(BenchmarkCorpus corpus, BenchmarkProbe probe, int repeat, string reason)
        {
            ProbeOutcome outcome = new ProbeOutcome();
            outcome.Corpus = corpus.Id;
            outcome.ProbeId = probe.Id;
            outcome.Repeat = repeat;
            outcome.Arm = "garrison";
            outcome.Type = probe.Type;
            outcome.Category = probe.Category;
            outcome.Negative = probe.Negative;
            outcome.Errored = true;
            outcome.Failures.Add("corpus did not load: " + reason);
            return outcome;
        }

        #endregion
    }
}
