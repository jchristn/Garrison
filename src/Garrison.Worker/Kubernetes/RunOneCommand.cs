namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Diagnostics;
    using System.IO;
    using System.Net.Sockets;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Worker.Execution;

    /// <summary>
    /// <c>garrison-worker run-one --spec &lt;path&gt;</c>: the entrypoint of a run pod (plan D-033). Reads the envelope the
    /// worker put in the spec Secret, runs the harness with the process executor and its run guards, and writes the
    /// start notification, events, and the completion as nonce-prefixed protocol lines to stdout. Diagnostics go to
    /// stderr. Holds no Garrison or Kubernetes credentials and never contacts the control plane.
    /// </summary>
    public static class RunOneCommand
    {
        #region Public-Methods

        /// <summary>
        /// Whether the arguments select run-one.
        /// </summary>
        /// <param name="args">Command-line arguments.</param>
        /// <returns>True for run-one.</returns>
        public static bool Matches(string[] args)
        {
            return args != null && args.Length > 0 && String.Equals(args[0], "run-one", StringComparison.Ordinal);
        }

        /// <summary>
        /// Run one run and exit.
        /// </summary>
        /// <param name="args">Arguments: run-one --spec &lt;path&gt;.</param>
        /// <returns>Exit code: 0 when a completion was written (whatever the run's outcome), 2 for usage errors, 3 when the spec could not be read.</returns>
        public static int Run(string[] args)
        {
            string? path = null;
            for (int i = 1; i < args.Length; i++)
            {
                if (args[i] == "--spec" && i + 1 < args.Length) path = args[++i];
            }
            if (String.IsNullOrEmpty(path))
            {
                Console.Error.WriteLine("usage: garrison-worker run-one --spec <path>");
                return 2;
            }

            using (CancellationTokenSource stop = new CancellationTokenSource())
            using (PosixSignalRegistration sigterm = PosixSignalRegistration.Create(PosixSignal.SIGTERM, context =>
            {
                context.Cancel = true;
                stop.Cancel();
            }))
            using (PosixSignalRegistration sigint = PosixSignalRegistration.Create(PosixSignal.SIGINT, context =>
            {
                context.Cancel = true;
                stop.Cancel();
            }))
            {
                return RunAsync(path, Console.OpenStandardOutput(), stop.Token).GetAwaiter().GetResult();
            }
        }

        /// <summary>
        /// Run one run from an envelope file, writing protocol lines to a stream.
        /// </summary>
        /// <param name="specPath">Envelope path.</param>
        /// <param name="output">Protocol output (stdout).</param>
        /// <param name="token">Cancellation token; cancellation stops the harness and writes a Cancelled completion.</param>
        /// <returns>Exit code (see <see cref="Run"/>).</returns>
        /// <exception cref="ArgumentNullException">Thrown when output is null.</exception>
        public static async Task<int> RunAsync(string specPath, Stream output, CancellationToken token)
        {
            if (output == null) throw new ArgumentNullException(nameof(output));
            bool hardened = ProcessHardening.DisableDumping();

            RunPodEnvelope? envelope;
            try
            {
                envelope = Serializer.Deserialize<RunPodEnvelope>(await File.ReadAllTextAsync(specPath, token).ConfigureAwait(false));
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is System.Text.Json.JsonException)
            {
                Console.Error.WriteLine("[run-one] cannot read the run spec at " + specPath + ": " + e.Message);
                return 3;
            }
            if (envelope == null || String.IsNullOrEmpty(envelope.Assignment.RunId))
            {
                Console.Error.WriteLine("[run-one] the run spec at " + specPath + " is empty");
                return 3;
            }

            using (StreamWriter writer = new StreamWriter(output, new UTF8Encoding(false), 65536, true))
            {
                writer.AutoFlush = false;
                PodLineReporter reporter;
                try
                {
                    reporter = new PodLineReporter(writer, envelope.Nonce);
                }
                catch (ArgumentException e)
                {
                    Console.Error.WriteLine("[run-one] " + e.Message);
                    return 3;
                }

                Console.Error.WriteLine("[run-one] run " + envelope.Assignment.RunId + " epoch " + envelope.Assignment.Epoch + " starting" + (hardened ? " (non-dumpable)" : String.Empty));
                string? home = Environment.GetEnvironmentVariable("HOME");
                if (!String.IsNullOrEmpty(home)) TryCreate(home);
                TryCreate(envelope.WorkRoot);
                if (!String.IsNullOrEmpty(envelope.WorkspaceMountPath)) LinkWorkspace(envelope);

                ExecutorOptions options = new ExecutorOptions();
                options.WorkRoot = envelope.WorkRoot;
                options.EnvironmentAllowlist = envelope.EnvironmentAllowlist;
                options.McpPreflightTimeoutMs = envelope.McpPreflightTimeoutMs;
                ProcessRunExecutor executor = new ProcessRunExecutor(options, message => Console.Error.WriteLine("[run-one] " + message));

                RunCompleteRequest complete;
                try
                {
                    RunCompleteRequest? blocked = await WaitForEgressPolicyAsync(envelope, reporter, token).ConfigureAwait(false);
                    complete = blocked ?? await executor.ExecuteAsync(envelope.Assignment, reporter, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (token.IsCancellationRequested)
                {
                    complete = new RunCompleteRequest();
                    complete.Status = RunStatusEnum.Cancelled;
                    complete.Outcome = RunOutcomeEnum.Cancelled;
                    complete.ErrorMessage = "Run was cancelled.";
                    complete.CompletedUtc = DateTime.UtcNow;
                }
                catch (Exception e)
                {
                    complete = new RunCompleteRequest();
                    complete.Status = RunStatusEnum.Failed;
                    complete.Outcome = RunOutcomeEnum.InternalError;
                    complete.ErrorMessage = "Run pod executor failed: " + e.Message;
                    complete.CompletedUtc = DateTime.UtcNow;
                }
                reporter.Complete(complete);
                await writer.FlushAsync(CancellationToken.None).ConfigureAwait(false);
                Console.Error.WriteLine("[run-one] run " + envelope.Assignment.RunId + " finished: " + complete.Status + " (" + complete.Outcome + ")");
            }
            return 0;
        }

        #endregion

        #region Private-Methods

        private static async Task<RunCompleteRequest?> WaitForEgressPolicyAsync(RunPodEnvelope envelope, PodLineReporter reporter, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(envelope.EgressCanary)) return null;
            int colon = envelope.EgressCanary.LastIndexOf(':');
            if (colon <= 0 || !Int32.TryParse(envelope.EgressCanary.Substring(colon + 1), out int port)) return null;
            string host = envelope.EgressCanary.Substring(0, colon);
            Stopwatch waited = Stopwatch.StartNew();
            TimeSpan limit = TimeSpan.FromSeconds(Math.Max(1, envelope.EgressCanaryTimeoutSeconds));
            while (true)
            {
                token.ThrowIfCancellationRequested();
                if (!await ReachableAsync(host, port, token).ConfigureAwait(false))
                {
                    RunEventReport ready = new RunEventReport();
                    ready.EventType = RunEventTypeEnum.Lifecycle;
                    ready.Code = "EgressPolicyEnforced";
                    ready.Text = "Run pod egress policy in effect after " + waited.ElapsedMilliseconds + " ms (" + envelope.EgressCanary + " is blocked).";
                    reporter.Emit(ready);
                    return null;
                }
                if (waited.Elapsed >= limit)
                {
                    RunCompleteRequest failed = new RunCompleteRequest();
                    failed.Status = RunStatusEnum.Failed;
                    failed.Outcome = RunOutcomeEnum.PodFailed;
                    failed.ErrorMessage = "The run pod could still reach " + envelope.EgressCanary + " after " + (int)limit.TotalSeconds + " s, so its NetworkPolicy is not enforced; the harness was not started. Apply the garrison-run NetworkPolicy with a network plugin that enforces it, or clear Kubernetes.EgressCanary.";
                    failed.CompletedUtc = DateTime.UtcNow;
                    return failed;
                }
                await Task.Delay(250, token).ConfigureAwait(false);
            }
        }

        private static async Task<bool> ReachableAsync(string host, int port, CancellationToken token)
        {
            using (TcpClient client = new TcpClient())
            using (CancellationTokenSource attempt = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                attempt.CancelAfter(1000);
                try
                {
                    await client.ConnectAsync(host, port, attempt.Token).ConfigureAwait(false);
                    return true;
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                    return false;
                }
                catch (SocketException)
                {
                    return false;
                }
            }
        }

        private static void LinkWorkspace(RunPodEnvelope envelope)
        {
            try
            {
                RunDirectories directories = new RunDirectories(envelope.WorkRoot, envelope.Assignment.RunId);
                Directory.CreateDirectory(directories.Root);
                if (!Directory.Exists(directories.Workspace)) Directory.CreateSymbolicLink(directories.Workspace, envelope.WorkspaceMountPath!);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is ArgumentException)
            {
                Console.Error.WriteLine("[run-one] cannot link the workspace to " + envelope.WorkspaceMountPath + ": " + e.Message);
            }
        }

        private static void TryCreate(string path)
        {
            try
            {
                Directory.CreateDirectory(path);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                Console.Error.WriteLine("[run-one] cannot create " + path + ": " + e.Message);
            }
        }

        #endregion
    }
}
