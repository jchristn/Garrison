namespace Garrison.Benchmark
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Runners;
    using Garrison.Benchmark.Stub;

    /// <summary>
    /// Entry point of Garrison.Benchmark: command dispatch and the fixed exit codes (0 success; 1 error, validation
    /// failure, or regression; 2 unknown command or bad usage; 3 incomplete run; 130 cancelled with Ctrl+C).
    /// </summary>
    public static class Program
    {
        #region Public-Methods

        /// <summary>
        /// Entry point.
        /// </summary>
        /// <param name="args">Command and options.</param>
        /// <returns>Exit code.</returns>
        public static async Task<int> Main(string[] args)
        {
            using (CancellationTokenSource cancel = new CancellationTokenSource())
            {
                ConsoleCancelEventHandler handler = (sender, e) =>
                {
                    e.Cancel = true;
                    cancel.Cancel();
                };
                Console.CancelKeyPress += handler;
                try
                {
                    BenchmarkArguments arguments;
                    try
                    {
                        arguments = new BenchmarkArguments(args);
                    }
                    catch (ArgumentException e)
                    {
                        Console.Error.WriteLine(e.Message);
                        Usage();
                        return 2;
                    }
                    if (arguments.Command.Length == 0 || arguments.Command == "help" || arguments.Has("help"))
                    {
                        Usage();
                        return arguments.Command.Length == 0 ? 2 : 0;
                    }
                    using (BenchmarkContext context = new BenchmarkContext(arguments))
                    {
                        int code = await DispatchAsync(context, cancel.Token).ConfigureAwait(false);
                        foreach (string unread in arguments.Unread()) Console.Error.WriteLine("warning: option --" + unread + " was not used by " + arguments.Command + ".");
                        return code;
                    }
                }
                catch (OperationCanceledException) when (cancel.IsCancellationRequested)
                {
                    Console.Error.WriteLine("Cancelled.");
                    return 130;
                }
                catch (ArgumentException e)
                {
                    Console.Error.WriteLine(e.Message);
                    return 2;
                }
                catch (Exception e) when (e is InvalidOperationException || e is IOException || e is DirectoryNotFoundException || e is InvalidDataException)
                {
                    Console.Error.WriteLine("error: " + e.Message);
                    return 1;
                }
                finally
                {
                    Console.CancelKeyPress -= handler;
                }
            }
        }

        /// <summary>
        /// Run the context's command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Exit code.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> DispatchAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            switch (context.Args.Command)
            {
                case "validate":
                    return ValidateRunner.Run(context);
                case "generate":
                    return await GenerateRunner.RunAsync(context, token).ConfigureAwait(false);
                case "ingest":
                    return await IngestRunner.RunAsync(context, token).ConfigureAwait(false);
                case "routing":
                    return await ProbeSuiteRunner.RunAsync(context, "routing", token).ConfigureAwait(false);
                case "e2e":
                    return await ProbeSuiteRunner.RunAsync(context, "e2e", token).ConfigureAwait(false);
                case "load":
                    return await LoadRunner.RunAsync(context, token).ConfigureAwait(false);
                case "resilience":
                    return await ResilienceRunner.RunAsync(context, token).ConfigureAwait(false);
                case "compare":
                    return await CompareRunner.RunAsync(context, token).ConfigureAwait(false);
                case "history":
                    return await HistoryRunner.RunAsync(context, token).ConfigureAwait(false);
                case "stub":
                    return await StubRunner.RunAsync(context, token).ConfigureAwait(false);
                case "wait":
                    return await WaitRunner.RunAsync(context, token).ConfigureAwait(false);
                case "ci-gate":
                    return await CiGateRunner.RunAsync(context, token).ConfigureAwait(false);
                default:
                    Console.Error.WriteLine("Unknown command '" + context.Args.Command + "'.");
                    Usage();
                    return 2;
            }
        }

        #endregion

        #region Private-Methods

        private static void Usage()
        {
            string[] lines = new string[]
            {
                "Garrison.Benchmark " + BenchmarkContext.HarnessVersion + ": black-box benchmarks for Garrison (see benchmarks/README.md).",
                String.Empty,
                "Usage: Garrison.Benchmark <command> [--option value] [--flag]",
                String.Empty,
                "Commands:",
                "  validate    Check dataset files against benchmarks/datasets/SCHEMA.md.",
                "  generate    Build a dataset from its committed sources (--kind synthetic|live).",
                "  ingest      Manifest apply at scale: docs/s, apply latency, idempotent re-apply, reachability.",
                "  routing     Scheduling correctness: placement, blocked runs, priority, concurrency limits.",
                "  e2e         Full run flow per probe, with the direct-invocation reference arm (the floor).",
                "  load        Throughput and latency per concurrency (closed) or rate (open), optional scale-out sweep.",
                "  resilience  Failing and overrunning harnesses; worker, server, and database failures (k3d).",
                "  compare     Paired, significance-gated diff of two reports; exit 1 on regression.",
                "  history     Headline metrics per round with net change and baselines.",
                "  stub        Run the stub dependency (the fake harness) on its own.",
                "  ci-gate     Deterministic subset against committed baselines (--update to rewrite them).",
                "  wait        Wait for the server and --nodes Ready workers (used by the stack scripts).",
                String.Empty,
                "Common options: --url (http://127.0.0.1:37870, or GARRISON_BENCH_URL), --admin-key (or GARRISON_BENCH_ADMIN_KEY),",
                "  --dataset, --label, --seed (42), --resamples (2000), --stack (k3d|local|external), --kubeconfig, --context,",
                "  --results-dir, --shared-note, --require-pass.",
                String.Empty,
                "Exit codes: 0 success, 1 error or regression, 2 bad usage, 3 incomplete run, 130 cancelled.",
            };
            foreach (string line in lines) Console.Out.WriteLine(line);
        }

        #endregion
    }
}
