namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Kubernetes;
    using Garrison.Worker.Settings;
    using k8s.Models;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Pod-per-run executor (plan D-033, P11.9 unit level): the run pod log-line protocol and its resistance to
    /// impersonation, run-one end to end with the fake harness, Job and Secret manifests (security context, labels,
    /// resources, TTL, owner references), pod diagnosis, reconciliation, executor routing, and executor-aware
    /// persistence, validation, and scheduling on every provider.
    /// </summary>
    public static class KubernetesExecutorSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("k8s-executor", "protocol-roundtrip", "Protocol: lines written by run-one's reporter parse back in order with the completion", ProtocolRoundTripAsync),
                new TestCaseDescriptor("k8s-executor", "protocol-injection", "Protocol: lines with another nonce, a nonce mid-line, newline injection inside event text, replays, and lines after the completion are not accepted", ProtocolInjectionAsync),
                new TestCaseDescriptor("k8s-executor", "protocol-limits", "Protocol: oversize, malformed, and wrong-typed lines are counted and ignored; diagnostics keep only non-protocol lines", ProtocolLimitsAsync),
                new TestCaseDescriptor("k8s-executor", "run-one-stdin", "Warm input: a bounded stdin envelope executes once; extra input, malformed JSON, EOF, and oversize input cannot start another run", RunOneStdinAsync),
                new TestCaseDescriptor("k8s-executor", "run-one-fake", "run-one: the fake harness runs through the process executor; harness output that mimics the prefix with the real nonce stays data", RunOneFakeAsync),
                new TestCaseDescriptor("k8s-executor", "run-one-egress-canary", "run-one: the harness starts only once the egress canary is blocked; a reachable canary fails the run PodFailed without starting it", RunOneCanaryAsync),
                new TestCaseDescriptor("k8s-executor", "run-one-persistent-workspace", "run-one: a PersistentVolume workspace is linked into the run directory, shared by later runs, and never deleted", RunOnePersistentAsync),
                new TestCaseDescriptor("k8s-executor", "run-one-bad-spec", "run-one: a missing or empty spec exits 3 without protocol output", RunOneBadSpecAsync),
                new TestCaseDescriptor("k8s-executor", "manifest-job", "Manifest: Job with backoffLimit 0, TTL, active deadline, labels, no token, garrison-run account, hardened security context, emptyDirs, and the spec Secret mount", ManifestJobAsync),
                new TestCaseDescriptor("k8s-executor", "manifest-resources", "Manifest: deployment resources override worker defaults per value", ManifestResourcesAsync),
                new TestCaseDescriptor("k8s-executor", "manifest-options", "Manifest: runtimeClassName, node selector, image pull secrets, pull policy, and a PersistentVolume workspace mounted at the workspace path", ManifestOptionsAsync),
                new TestCaseDescriptor("k8s-executor", "manifest-secret", "Manifest: spec Secret carries the envelope and an owner reference to the Job", ManifestSecretAsync),
                new TestCaseDescriptor("k8s-executor", "names", "Names: Job names are DNS labels of at most 63 characters, unique per run ID case and epoch; label values are sanitized", NamesAsync),
                new TestCaseDescriptor("k8s-executor", "diagnosis", "Diagnosis: unschedulable stays pending; image pull, config errors, eviction, deadline, and OOMKilled fail with clear messages", DiagnosisAsync),
                new TestCaseDescriptor("k8s-executor", "reconcile-orphans", "Reconciliation: unfinished Jobs of runs or epochs not held are orphans; finished Jobs are left to their TTL", ReconcileOrphansAsync),
                new TestCaseDescriptor("k8s-executor", "routing", "Routing: Process specs run as subprocesses, KubernetesJob specs go to the Job executor or fail NoCapableWorker without one", RoutingAsync),
                new TestCaseDescriptor("k8s-executor", "warm-layout", "Warm pods preserve isolation and bounded adaptive stock", WarmLayoutAsync),
                new TestCaseDescriptor("k8s-executor", "settings", "Settings: executor environment overrides and guards", SettingsAsync),
                new TestCaseDescriptor("k8s-executor", "quantities", "Validation helpers: Kubernetes quantities and DNS-1123 names", QuantitiesAsync)
            };

            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("k8s-executor", "Pod-per-run executor", unit)
            };

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "k8s-executor-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "capability-persistence", "Structured executor reports and deployment/run requirements persist without JSON (" + provider + ")", ct => CapabilityPersistenceAsync(provider, ct)),
                    new TestCaseDescriptor(id, "warm-capability-claim", "Warm reports persist and authorize both cold and warm claims (" + provider + ")", ct => WarmCapabilityClaimAsync(provider, ct)),
                    new TestCaseDescriptor(id, "capability-claim", "Capability filtering precedes limits and atomic claims reject changed or absent reports (" + provider + ")", ct => CapabilityClaimAsync(provider, ct)),
                    new TestCaseDescriptor(id, "persistence", "Deployment executor and pod resources, pool default executor, node executors, run executor, and PersistentVolume claims round-trip (" + provider + ")", ct => PersistenceAsync(provider, ct)),
                    new TestCaseDescriptor(id, "claim-filter", "Claim candidates: Process-only nodes never see KubernetesJob runs, even behind a backlog; capable nodes see both (" + provider + ")", ct => ClaimFilterAsync(provider, ct)),
                    new TestCaseDescriptor(id, "blocked", "Blocked reason: a KubernetesJob run with only Process workers is NoCapableWorker and the message names the executor (" + provider + ")", ct => BlockedAsync(provider, ct)),
                    new TestCaseDescriptor(id, "schedule", "Scheduler: a KubernetesJob deployment's run is leased only to a capable node, with executor and pod resources in the spec; pool defaults apply (" + provider + ")", ct => ScheduleAsync(provider, ct)),
                    new TestCaseDescriptor(id, "validation", "API validation: bad quantities and a PersistentVolume workspace on a Process deployment are rejected (" + provider + ")", ct => ValidationAsync(provider, ct))
                };
                suites.Add(new TestSuiteDescriptor(id, "Pod-per-run executor data and scheduling (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string Nonce()
        {
            return PodLineProtocol.NewNonce();
        }

        private static RunEventReport Text(string text)
        {
            RunEventReport report = new RunEventReport();
            report.EventType = RunEventTypeEnum.AssistantText;
            report.Text = text;
            return report;
        }

        private static RunCompleteRequest Succeeded(string result)
        {
            RunCompleteRequest complete = new RunCompleteRequest();
            complete.Status = RunStatusEnum.Succeeded;
            complete.Outcome = RunOutcomeEnum.Succeeded;
            complete.ResultText = result;
            return complete;
        }

        private static List<string> Lines(string output)
        {
            return output.Split('\n').Where(l => l.Length > 0).ToList();
        }

        private static async Task ProtocolRoundTripAsync(CancellationToken token)
        {
            string nonce = Nonce();
            Assert.Equal(64, nonce.Length, "Nonce length");
            Assert.True(nonce != Nonce(), "Nonces differ per run");

            StringWriter writer = new StringWriter();
            PodLineReporter reporter = new PodLineReporter(writer, nonce);
            await reporter.StartedAsync(4242, token).ConfigureAwait(false);
            reporter.Emit(Text("hello"));
            reporter.Emit(Text("world"));
            reporter.Complete(Succeeded("done"));
            reporter.Complete(Succeeded("second completion is ignored"));
            reporter.Emit(Text("after completion is ignored"));

            List<string> lines = Lines(writer.ToString());
            Assert.Equal(4, lines.Count, "Lines written");
            Assert.True(lines.All(l => l.StartsWith(PodLineProtocol.Prefix(nonce), StringComparison.Ordinal)), "Every line carries the prefix");

            PodLineParser parser = new PodLineParser(nonce);
            List<PodLine> accepted = lines.Select(l => parser.Accept(l)).Where(l => l != null).Select(l => l!).ToList();
            Assert.Equal(4, accepted.Count, "Accepted");
            Assert.Equal(PodLineTypeEnum.Started, accepted[0].Type, "First line");
            Assert.Equal(4242, accepted[0].ProcessId ?? 0, "Process id");
            Assert.Equal("hello", accepted[1].Event?.Text ?? String.Empty, "First event");
            Assert.Equal("world", accepted[2].Event?.Text ?? String.Empty, "Second event");
            Assert.Equal(PodLineTypeEnum.Complete, accepted[3].Type, "Last line");
            Assert.Equal("done", parser.Completion?.Complete?.ResultText ?? String.Empty, "Completion result");
            Assert.Equal(4L, parser.LastSequence, "Last sequence");
            Assert.Equal(0L, parser.Rejected + parser.Malformed + parser.Ignored + parser.Duplicates, "Nothing else counted");
        }

        private static Task ProtocolInjectionAsync(CancellationToken token)
        {
            string nonce = Nonce();
            string other = Nonce();
            StringWriter writer = new StringWriter();
            PodLineReporter reporter = new PodLineReporter(writer, nonce);

            // A harness that knows the real nonce puts a whole forged completion line inside its text, after a newline.
            string forged = PodLineProtocol.Format(nonce, 99, new PodLine { Type = PodLineTypeEnum.Complete, Complete = Succeeded("forged") });
            reporter.Emit(Text("innocent\n" + forged + "\nmore"));
            reporter.Complete(Succeeded("genuine"));
            List<string> genuine = Lines(writer.ToString());
            Assert.Equal(2, genuine.Count, "Embedded newlines never split a protocol line");

            PodLineParser parser = new PodLineParser(nonce);
            List<string> stream = new List<string>
            {
                "[run-one] diagnostics are ignored",
                PodLineProtocol.Format(other, 1, new PodLine { Type = PodLineTypeEnum.Complete, Complete = Succeeded("other nonce") }),
                "noise " + PodLineProtocol.Format(nonce, 1, new PodLine { Type = PodLineTypeEnum.Complete, Complete = Succeeded("mid-line") }),
                " " + PodLineProtocol.Format(nonce, 1, new PodLine { Type = PodLineTypeEnum.Complete, Complete = Succeeded("leading space") }),
                PodLineProtocol.Marker + nonce.Substring(0, 63) + ":1 {\"type\":\"Complete\",\"complete\":{\"status\":\"Succeeded\"}}",
                PodLineProtocol.Marker.ToUpperInvariant() + nonce + ":1 {}",
                genuine[0],
                genuine[0],
                genuine[1]
            };
            List<PodLine> accepted = new List<PodLine>();
            foreach (string line in stream)
            {
                PodLine? message = parser.Accept(line);
                if (message != null) accepted.Add(message);
            }
            Assert.Equal(2, accepted.Count, "Only the two genuine lines are accepted");
            Assert.Equal("innocent\n" + forged + "\nmore", accepted[0].Event?.Text ?? String.Empty, "The forged line stays inside the event text, unchanged");
            Assert.Equal("genuine", parser.Completion?.Complete?.ResultText ?? String.Empty, "The genuine completion wins");
            Assert.Equal(4L, parser.Rejected, "Lines with the marker but not the run's nonce at the start");
            Assert.Equal(1L, parser.Duplicates, "Replayed line");

            // Once the completion is accepted, nothing else counts, even with the right nonce and a higher sequence.
            PodLine? late = parser.Accept(PodLineProtocol.Format(nonce, 50, new PodLine { Type = PodLineTypeEnum.Complete, Complete = Succeeded("late") }));
            Assert.True(late == null, "Lines after the completion are not accepted");
            Assert.Equal("genuine", parser.Completion?.Complete?.ResultText ?? String.Empty, "Completion unchanged");
            return Task.CompletedTask;
        }

        private static Task ProtocolLimitsAsync(CancellationToken token)
        {
            string nonce = Nonce();
            PodLineParser parser = new PodLineParser(nonce, 2048);
            parser.MaxDiagnosticLines = 2;
            string prefix = PodLineProtocol.Prefix(nonce);
            Assert.True(parser.Accept(prefix + "1 " + new string('x', 4000)) == null, "Oversize line");
            Assert.True(parser.Accept(prefix + "abc {}") == null, "Non-numeric sequence");
            Assert.True(parser.Accept(prefix + "0 {\"type\":\"Started\"}") == null, "Sequence 0");
            Assert.True(parser.Accept(prefix + "2 not json") == null, "Not JSON");
            Assert.True(parser.Accept(prefix + "3 {\"type\":\"Event\"}") == null, "Event without an event");
            Assert.True(parser.Accept(prefix + "4 {\"type\":\"Complete\"}") == null, "Complete without a completion");
            Assert.True(parser.Accept(prefix + "5") == null, "No payload");
            Assert.Equal(7L, parser.Malformed, "Malformed lines");
            Assert.True(parser.Accept(prefix + "6 {\"type\":\"Started\",\"processId\":7}") != null, "A good line after malformed ones");
            parser.Accept("one");
            parser.Accept("two");
            parser.Accept("three");
            Assert.Equal("two,three", String.Join(",", parser.RecentDiagnostics), "Diagnostics keep the most recent non-protocol lines");
            Assert.Equal(3L, parser.Ignored, "Ignored lines");

            bool threw = false;
            try
            {
                PodLineProtocol.Prefix("short");
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "Short nonces are refused");
            threw = false;
            try
            {
                PodLineProtocol.Prefix("abcdefghijklmnop:" + nonce);
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "Nonces with separators are refused");
            return Task.CompletedTask;
        }

        private static string FakeHarnessDll()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "garrison-fake-harness.dll");
            if (!File.Exists(path)) throw new TestAssertionException("garrison-fake-harness.dll not found next to the test runner at " + path + ".");
            return path;
        }

        private static string DotnetHost()
        {
            string? process = Environment.ProcessPath;
            if (!String.IsNullOrEmpty(process) && Path.GetFileNameWithoutExtension(process).Equals("dotnet", StringComparison.OrdinalIgnoreCase)) return process;
            return "dotnet";
        }

        private static async Task RunOneStdinAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-stdin-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);
            try
            {
                ExecutionSpec spec = new ExecutionSpec
                {
                    RunId = "run_stdin_" + Guid.NewGuid().ToString("N"), TenantId = "ten_stdin", AgentName = "fake",
                    HarnessType = HarnessTypeEnum.Generic, Executor = RunExecutorEnum.KubernetesJob,
                    Executable = DotnetHost(), Arguments = new List<string> { FakeHarnessDll(), "--format", "plain", "--answer", "stdin once" },
                    Parser = OutputParserEnum.PlainText, TimeoutSeconds = 30, KillGraceSeconds = 1
                };
                string nonce = Nonce();
                RunPodEnvelope envelope = new RunPodEnvelope { Nonce = nonce, Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec }, WorkRoot = root, EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG" } };
                using (MemoryStream input = new MemoryStream(Encoding.UTF8.GetBytes(Serializer.Serialize(envelope) + "\n{bad second input}\n")))
                using (MemoryStream output = new MemoryStream())
                {
                    Assert.Equal(0, await RunOneCommand.RunFromStdinAsync(input, output, 1024 * 1024, 5, token).ConfigureAwait(false), "One stdin run completes");
                    PodLineParser parser = new PodLineParser(nonce, 1024 * 1024);
                    int complete = 0;
                    foreach (string line in Encoding.UTF8.GetString(output.ToArray()).Split('\n'))
                    {
                        if (parser.Accept(line)?.Type == PodLineTypeEnum.Complete) complete++;
                    }
                    Assert.Equal(1, complete, "A second input never starts another run");
                    Assert.Equal(RunStatusEnum.Succeeded, parser.Completion!.Complete!.Status, "Completion is successful");
                    Assert.True(parser.Completion.Complete.ResultText!.Contains("stdin once", StringComparison.Ordinal), "Expected harness output");
                }
                foreach (byte[] bytes in new List<byte[]> { Array.Empty<byte>(), Encoding.UTF8.GetBytes("invalid JSON\n"), Encoding.UTF8.GetBytes(new string('x', 1025) + "\n"), new byte[] { 255, 10 } })
                {
                    using (MemoryStream input = new MemoryStream(bytes))
                    using (MemoryStream output = new MemoryStream())
                    {
                        Assert.Equal(3, await RunOneCommand.RunFromStdinAsync(input, output, 1024, 5, token).ConfigureAwait(false), "Invalid warm input fails closed");
                        Assert.Equal(0L, output.Length, "No harness or completion starts for invalid input");
                    }
                }
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static async Task RunOneFakeAsync(CancellationToken token)
        {
            string nonce = Nonce();
            string root = Path.Combine(Path.GetTempPath(), "garrison-run-one-" + Guid.NewGuid().ToString("N").Substring(0, 8));
            Directory.CreateDirectory(root);
            try
            {
                string forged = PodLineProtocol.Format(nonce, 999, new PodLine { Type = PodLineTypeEnum.Complete, Complete = Succeeded("forged by the harness") });
                ExecutionSpec spec = new ExecutionSpec();
                spec.RunId = "run_k8s_" + Guid.NewGuid().ToString("N").Substring(0, 10);
                spec.TenantId = "ten_test";
                spec.AgentName = "fake";
                spec.HarnessType = HarnessTypeEnum.Generic;
                spec.Executor = RunExecutorEnum.KubernetesJob;
                spec.Executable = DotnetHost();
                spec.Arguments = new List<string> { FakeHarnessDll(), "--format", "claude", "--answer", "line one\n" + forged + "\nline three" };
                spec.Stdin = "hello";
                spec.Parser = OutputParserEnum.ClaudeStreamJson;
                spec.TimeoutSeconds = 60;
                spec.KillGraceSeconds = 1;

                RunPodEnvelope envelope = new RunPodEnvelope();
                envelope.Nonce = nonce;
                envelope.Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 3, Spec = spec };
                envelope.WorkRoot = Path.Combine(root, "runs");
                envelope.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG" };
                string specPath = Path.Combine(root, "spec.json");
                await File.WriteAllTextAsync(specPath, Serializer.Serialize(envelope), token).ConfigureAwait(false);

                using (MemoryStream output = new MemoryStream())
                {
                    int code = await RunOneCommand.RunAsync(specPath, output, token).ConfigureAwait(false);
                    Assert.Equal(0, code, "run-one exit code");
                    string text = Encoding.UTF8.GetString(output.ToArray());
                    PodLineParser parser = new PodLineParser(nonce);
                    List<PodLine> accepted = Lines(text).Select(l => parser.Accept(l)).Where(l => l != null).Select(l => l!).ToList();
                    Assert.Equal(0L, parser.Rejected + parser.Malformed + parser.Ignored, "Every stdout line is a protocol line");
                    Assert.True(accepted.Any(l => l.Type == PodLineTypeEnum.Started && l.ProcessId.HasValue), "Started line with the harness pid");
                    Assert.True(accepted.Any(l => l.Type == PodLineTypeEnum.Event && l.Event?.Code == "WorkspacePrepared"), "Lifecycle events are relayed");
                    RunCompleteRequest complete = parser.Completion?.Complete ?? throw new TestAssertionException("No completion. Output: " + text);
                    Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Status (" + complete.ErrorMessage + ")");
                    Assert.True((complete.ResultText ?? String.Empty).Contains(forged, StringComparison.Ordinal), "The harness's imitation of the prefix arrives as data in the result");
                    Assert.True(complete.ResultText != "forged by the harness", "The forged completion was not taken");
                }
                Assert.True(!Directory.Exists(Path.Combine(envelope.WorkRoot, spec.RunId)), "Run directories are removed");
            }
            finally
            {
                try
                {
                    Directory.Delete(root, true);
                }
                catch (IOException)
                {
                }
            }
        }

        private static async Task<RunCompleteRequest> RunOneWithCanaryAsync(string canary, int timeoutSeconds, CancellationToken token)
        {
            string nonce = Nonce();
            string root = Path.Combine(Path.GetTempPath(), "garrison-run-one-" + Guid.NewGuid().ToString("N").Substring(0, 8));
            Directory.CreateDirectory(root);
            try
            {
                ExecutionSpec spec = new ExecutionSpec();
                spec.RunId = "run_canary_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                spec.TenantId = "ten_test";
                spec.Executable = DotnetHost();
                spec.Arguments = new List<string> { FakeHarnessDll(), "--format", "claude" };
                spec.Stdin = "hello";
                spec.Parser = OutputParserEnum.ClaudeStreamJson;
                spec.TimeoutSeconds = 60;
                RunPodEnvelope envelope = new RunPodEnvelope();
                envelope.Nonce = nonce;
                envelope.Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec };
                envelope.WorkRoot = Path.Combine(root, "runs");
                envelope.EnvironmentAllowlist = new List<string> { "PATH", "DOTNET_ROOT", "TMPDIR" };
                envelope.EgressCanary = canary;
                envelope.EgressCanaryTimeoutSeconds = timeoutSeconds;
                string specPath = Path.Combine(root, "spec.json");
                await File.WriteAllTextAsync(specPath, Serializer.Serialize(envelope), token).ConfigureAwait(false);
                using (MemoryStream output = new MemoryStream())
                {
                    await RunOneCommand.RunAsync(specPath, output, token).ConfigureAwait(false);
                    PodLineParser parser = new PodLineParser(nonce);
                    List<PodLine> lines = Lines(Encoding.UTF8.GetString(output.ToArray())).Select(l => parser.Accept(l)).Where(l => l != null).Select(l => l!).ToList();
                    RunCompleteRequest complete = parser.Completion?.Complete ?? throw new TestAssertionException("No completion.");
                    if (complete.Status == RunStatusEnum.Succeeded) Assert.True(lines.Any(l => l.Event?.Code == "EgressPolicyEnforced"), "EgressPolicyEnforced event before the harness");
                    else Assert.True(!lines.Any(l => l.Type == PodLineTypeEnum.Started), "The harness never started");
                    return complete;
                }
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static async Task<RunCompleteRequest> RunOneShellAsync(string root, string mount, string script, CancellationToken token)
        {
            string nonce = Nonce();
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = "run_pv_" + Guid.NewGuid().ToString("N").Substring(0, 8);
            spec.TenantId = "ten_test";
            spec.Executable = "/bin/sh";
            spec.Stdin = script;
            spec.Parser = OutputParserEnum.PlainText;
            spec.ResultSource = ResultSourceEnum.Stdout;
            spec.SuccessPolicy = SuccessPolicyEnum.ExitCode;
            spec.TimeoutSeconds = 30;
            spec.Workspace.Kind = WorkspaceKindEnum.PersistentVolume;
            spec.Workspace.PersistentVolumeClaim = "shared";
            RunPodEnvelope envelope = new RunPodEnvelope();
            envelope.Nonce = nonce;
            envelope.Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec };
            envelope.WorkRoot = Path.Combine(root, "runs");
            envelope.EnvironmentAllowlist = new List<string> { "PATH" };
            envelope.WorkspaceMountPath = mount;
            string specPath = Path.Combine(root, spec.RunId + ".json");
            await File.WriteAllTextAsync(specPath, Serializer.Serialize(envelope), token).ConfigureAwait(false);
            using (MemoryStream output = new MemoryStream())
            {
                await RunOneCommand.RunAsync(specPath, output, token).ConfigureAwait(false);
                PodLineParser parser = new PodLineParser(nonce);
                foreach (string line in Lines(Encoding.UTF8.GetString(output.ToArray()))) parser.Accept(line);
                return parser.Completion?.Complete ?? throw new TestAssertionException("No completion.");
            }
        }

        private static async Task RunOnePersistentAsync(CancellationToken token)
        {
            if (!File.Exists("/bin/sh")) return;
            string root = Path.Combine(Path.GetTempPath(), "garrison-run-one-" + Guid.NewGuid().ToString("N").Substring(0, 8));
            string mount = Path.Combine(root, "mounted-claim");
            Directory.CreateDirectory(mount);
            try
            {
                RunCompleteRequest first = await RunOneShellAsync(root, mount, "echo first >> notes.txt; cat notes.txt", token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, first.Status, "First run (" + first.ErrorMessage + ")");
                RunCompleteRequest second = await RunOneShellAsync(root, mount, "echo second >> notes.txt; cat notes.txt", token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, second.Status, "Second run (" + second.ErrorMessage + ")");
                Assert.Equal("first\nsecond", (second.ResultText ?? String.Empty).Replace("\r", String.Empty), "The second run sees the first run's file");
                Assert.Equal("first\nsecond\n", File.ReadAllText(Path.Combine(mount, "notes.txt")), "The claim keeps the files after both runs");
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static async Task RunOneCanaryAsync(CancellationToken token)
        {
            System.Net.Sockets.TcpListener listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
            listener.Start();
            int open = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
            try
            {
                RunCompleteRequest reachable = await RunOneWithCanaryAsync("127.0.0.1:" + open, 2, token).ConfigureAwait(false);
                Assert.Equal(RunOutcomeEnum.PodFailed, reachable.Outcome, "Reachable canary");
                Assert.True((reachable.ErrorMessage ?? String.Empty).Contains("NetworkPolicy is not enforced", StringComparison.Ordinal), "Message: " + reachable.ErrorMessage);
            }
            finally
            {
                listener.Stop();
            }
            RunCompleteRequest blocked = await RunOneWithCanaryAsync("127.0.0.1:" + open, 5, token).ConfigureAwait(false);
            Assert.Equal(RunStatusEnum.Succeeded, blocked.Status, "Blocked canary lets the harness run (" + blocked.ErrorMessage + ")");

            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            settings.EgressCanary = "garrison-server:8700";
            Assert.Equal("garrison-server:8700", settings.EgressCanary ?? String.Empty, "Canary setting");
            settings.EgressCanary = " ";
            Assert.True(settings.EgressCanary == null, "Blank disables");
            bool threw = false;
            try
            {
                settings.EgressCanary = "no-port";
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "A canary needs host:port");
        }

        private static async Task RunOneBadSpecAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-run-one-" + Guid.NewGuid().ToString("N").Substring(0, 8));
            Directory.CreateDirectory(root);
            try
            {
                using (MemoryStream output = new MemoryStream())
                {
                    Assert.Equal(3, await RunOneCommand.RunAsync(Path.Combine(root, "missing.json"), output, token).ConfigureAwait(false), "Missing spec");
                    string empty = Path.Combine(root, "empty.json");
                    await File.WriteAllTextAsync(empty, "{}", token).ConfigureAwait(false);
                    Assert.Equal(3, await RunOneCommand.RunAsync(empty, output, token).ConfigureAwait(false), "Empty spec");
                    Assert.Equal(0L, output.Length, "No protocol output");
                }
                Assert.Equal(2, RunOneCommand.Run(new[] { "run-one" }), "Usage error");
                Assert.True(RunOneCommand.Matches(new[] { "run-one", "--spec", "x" }), "run-one matches");
                Assert.True(!RunOneCommand.Matches(new[] { "garrison-worker.json" }), "A settings path does not match");
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static RunPodRequest Request(KubernetesExecutorSettings settings, Action<ExecutionSpec>? configure = null)
        {
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = "run_ABCdef123_xyz";
            spec.TenantId = "ten_alpha";
            spec.AgentName = "helper";
            spec.DeploymentId = "dep_one";
            spec.Executor = RunExecutorEnum.KubernetesJob;
            spec.TimeoutSeconds = 600;
            spec.KillGraceSeconds = 5;
            configure?.Invoke(spec);
            RunPodRequest request = new RunPodRequest();
            request.Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 7, Spec = spec };
            request.NodeName = "garrison-worker-0";
            request.Namespace = "garrison";
            request.Image = "jchristn77/garrison-worker:test";
            request.EnvelopeJson = "{\"nonce\":\"x\"}";
            return request;
        }

        private static Task ManifestJobAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            RunPodRequest request = Request(settings);
            V1Job job = builder.BuildJob(request);

            Assert.Equal(RunPodNames.JobName("run_ABCdef123_xyz", 7), job.Metadata.Name, "Job name");
            Assert.Equal("garrison", job.Metadata.NamespaceProperty, "Namespace");
            Assert.Equal(0, job.Spec.BackoffLimit ?? -1, "backoffLimit");
            Assert.Equal(300, job.Spec.TtlSecondsAfterFinished ?? -1, "ttlSecondsAfterFinished (Worker.JobTtlSeconds default)");
            Assert.Equal(600L + 300L + 5L + 60L, job.Spec.ActiveDeadlineSeconds ?? -1, "activeDeadlineSeconds = timeout + pending + grace + margin");

            foreach (IDictionary<string, string> labels in new[] { job.Metadata.Labels, job.Spec.Template.Metadata.Labels })
            {
                Assert.Equal("run_ABCdef123_xyz", labels[RunPodNames.RunIdLabel], "run-id label");
                Assert.Equal("garrison-worker-0", labels[RunPodNames.WorkerLabel], "worker label");
                Assert.Equal("ten_alpha", labels[RunPodNames.TenantLabel], "tenant label");
                Assert.Equal("7", labels[RunPodNames.EpochLabel], "epoch label");
                Assert.Equal("garrison-run", labels["app.kubernetes.io/name"], "app name label (selected by the run NetworkPolicy)");
            }
            Assert.Equal("run_ABCdef123_xyz", job.Metadata.Annotations["garrison.io/run-id"], "run-id annotation");

            V1PodSpec pod = job.Spec.Template.Spec;
            Assert.Equal("Never", pod.RestartPolicy, "restartPolicy");
            Assert.Equal("garrison-run", pod.ServiceAccountName, "serviceAccountName");
            Assert.Equal(false, pod.AutomountServiceAccountToken ?? true, "automountServiceAccountToken");
            Assert.Equal(false, pod.EnableServiceLinks ?? true, "enableServiceLinks");
            Assert.True(pod.RuntimeClassName == null, "No runtime class by default");
            Assert.Equal(true, pod.SecurityContext.RunAsNonRoot ?? false, "pod runAsNonRoot");
            Assert.Equal(10001L, pod.SecurityContext.RunAsUser ?? 0, "pod runAsUser");
            Assert.Equal(10001L, pod.SecurityContext.FsGroup ?? 0, "pod fsGroup");
            Assert.Equal("RuntimeDefault", pod.SecurityContext.SeccompProfile?.Type ?? String.Empty, "pod seccomp");

            V1Container container = pod.Containers.Single();
            Assert.Equal("run", container.Name, "container name");
            Assert.Equal("jchristn77/garrison-worker:test", container.Image, "image");
            Assert.Equal("run-one,--spec,/run/garrison/spec.json", String.Join(",", container.Args), "args");
            Assert.True(container.Command == null, "Entrypoint from the image");
            V1SecurityContext security = container.SecurityContext;
            Assert.Equal(false, security.AllowPrivilegeEscalation ?? true, "allowPrivilegeEscalation");
            Assert.Equal(false, security.Privileged ?? true, "privileged");
            Assert.Equal(true, security.ReadOnlyRootFilesystem ?? false, "readOnlyRootFilesystem");
            Assert.Equal(true, security.RunAsNonRoot ?? false, "container runAsNonRoot");
            Assert.Equal("ALL", String.Join(",", security.Capabilities.Drop), "capabilities dropped");
            Assert.True(security.Capabilities.Add == null || security.Capabilities.Add.Count == 0, "no capabilities added");
            Assert.Equal("RuntimeDefault", security.SeccompProfile?.Type ?? String.Empty, "container seccomp");

            Assert.Equal("/garrison/home", container.Env.Single(e => e.Name == "HOME").Value, "HOME on the data emptyDir");
            Assert.Equal("/tmp", container.Env.Single(e => e.Name == "TMPDIR").Value, "TMPDIR");
            Assert.Equal("0", container.Env.Single(e => e.Name == "DOTNET_EnableDiagnostics").Value, "diagnostics port off");

            Dictionary<string, V1VolumeMount> mounts = container.VolumeMounts.ToDictionary(m => m.Name, m => m);
            Assert.Equal("/run/garrison", mounts["spec"].MountPath, "spec mount");
            Assert.Equal(true, mounts["spec"].ReadOnlyProperty ?? false, "spec mount read-only");
            Assert.Equal("/garrison", mounts["data"].MountPath, "data mount");
            Assert.Equal("/tmp", mounts["tmp"].MountPath, "tmp mount");
            Dictionary<string, V1Volume> volumes = pod.Volumes.ToDictionary(v => v.Name, v => v);
            Assert.Equal(RunPodNames.SecretName(job.Metadata.Name), volumes["spec"].Secret.SecretName, "spec Secret volume");
            Assert.Equal(288, volumes["spec"].Secret.DefaultMode ?? 0, "spec Secret mode 0440");
            Assert.NotNull(volumes["data"].EmptyDir, "data is an emptyDir");
            Assert.NotNull(volumes["tmp"].EmptyDir, "tmp is an emptyDir");
            Assert.True(!volumes.ContainsKey("workspace"), "No PVC for an emptyDir workspace");
            Assert.True(pod.ImagePullSecrets == null, "No pull secrets unless configured");
            return Task.CompletedTask;
        }

        private static Task ManifestResourcesAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            V1ResourceRequirements defaults = builder.BuildJob(Request(settings)).Spec.Template.Spec.Containers[0].Resources;
            Assert.Equal("100m", defaults.Requests["cpu"].ToString(), "default cpu request");
            Assert.Equal("256Mi", defaults.Requests["memory"].ToString(), "default memory request");
            Assert.Equal("2", defaults.Limits["cpu"].ToString(), "default cpu limit");
            Assert.Equal("4Gi", defaults.Limits["memory"].ToString(), "default memory limit");
            Assert.Equal("10Gi", defaults.Limits["ephemeral-storage"].ToString(), "default ephemeral storage limit");

            RunPodRequest request = Request(settings, spec =>
            {
                spec.PodResources = new RunPodResources { CpuRequest = "500m", MemoryLimit = "1Gi", EphemeralStorageRequest = "2Gi" };
            });
            V1ResourceRequirements merged = builder.BuildJob(request).Spec.Template.Spec.Containers[0].Resources;
            Assert.Equal("500m", merged.Requests["cpu"].ToString(), "deployment cpu request");
            Assert.Equal("256Mi", merged.Requests["memory"].ToString(), "default memory request kept");
            Assert.Equal("2Gi", merged.Requests["ephemeral-storage"].ToString(), "deployment ephemeral storage request");
            Assert.Equal("1Gi", merged.Limits["memory"].ToString(), "deployment memory limit");
            Assert.Equal("2", merged.Limits["cpu"].ToString(), "default cpu limit kept");

            RunPodRequest big = Request(settings, spec => spec.PodResources = new RunPodResources { MemoryRequest = "8Gi", CpuRequest = "3" });
            V1ResourceRequirements raised = builder.BuildJob(big).Spec.Template.Spec.Containers[0].Resources;
            Assert.Equal("8Gi", raised.Limits["memory"].ToString(), "A request above the default limit raises the limit");
            Assert.Equal("3", raised.Limits["cpu"].ToString(), "CPU limit raised to the request");

            settings.DefaultResources = new RunPodResources();
            V1ResourceRequirements none = new RunPodManifestBuilder(settings).BuildJob(Request(settings)).Spec.Template.Spec.Containers[0].Resources;
            Assert.True(none.Requests == null && none.Limits == null, "No requests or limits when nothing is set");
            return Task.CompletedTask;
        }

        private static Task ManifestOptionsAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            settings.RuntimeClassName = "gvisor";
            settings.NodeSelector = new Dictionary<string, string> { { "garrison.io/runs", "true" } };
            settings.JobTtlSeconds = 30;
            settings.ServiceAccountName = "custom-run";
            settings.EmptyDirSizeLimit = "5Gi";
            settings.PodLabels = new Dictionary<string, string> { { "team", "agents" }, { "app.kubernetes.io/name", "spoofed" } };
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            RunPodRequest request = Request(settings, spec =>
            {
                spec.Workspace.Kind = WorkspaceKindEnum.PersistentVolume;
                spec.Workspace.PersistentVolumeClaim = "shared-repo";
            });
            request.ImagePullSecrets = new List<string> { "registry-creds", "registry-creds", "" };
            request.ImagePullPolicy = "Always";
            V1Job job = builder.BuildJob(request);
            V1PodSpec pod = job.Spec.Template.Spec;
            Assert.Equal("gvisor", pod.RuntimeClassName, "runtimeClassName");
            Assert.Equal("true", pod.NodeSelector["garrison.io/runs"], "node selector");
            Assert.Equal(30, job.Spec.TtlSecondsAfterFinished ?? -1, "TTL");
            Assert.Equal("custom-run", pod.ServiceAccountName, "service account");
            Assert.Equal("registry-creds", String.Join(",", pod.ImagePullSecrets.Select(s => s.Name)), "image pull secrets, deduplicated");
            Assert.Equal("Always", pod.Containers[0].ImagePullPolicy, "pull policy");
            Assert.Equal("agents", job.Metadata.Labels["team"], "extra label");
            Assert.Equal("garrison-run", job.Metadata.Labels["app.kubernetes.io/name"], "built-in labels cannot be overridden");
            Assert.Equal("5Gi", pod.Volumes.Single(v => v.Name == "data").EmptyDir.SizeLimit.ToString(), "emptyDir size limit");

            V1Volume workspace = pod.Volumes.Single(v => v.Name == "workspace");
            Assert.Equal("shared-repo", workspace.PersistentVolumeClaim.ClaimName, "PVC claim");
            V1VolumeMount mount = pod.Containers[0].VolumeMounts.Single(m => m.Name == "workspace");
            Assert.Equal("/workspace", mount.MountPath, "PVC mounted at the workspace mount path (run-one links the run's work directory to it)");
            Assert.Equal("/workspace", builder.WorkspaceMountPath(request.Assignment.Spec) ?? String.Empty, "Envelope mount path for PersistentVolume workspaces");
            Assert.True(builder.WorkspaceMountPath(Request(settings).Assignment.Spec) == null, "No mount path for emptyDir workspaces");

            RunPodRequest missing = Request(settings, spec => spec.Workspace.Kind = WorkspaceKindEnum.PersistentVolume);
            bool threw = false;
            try
            {
                builder.BuildJob(missing);
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "A PersistentVolume workspace without a claim is refused");

            RunPodRequest noImage = Request(settings);
            noImage.Image = String.Empty;
            threw = false;
            try
            {
                builder.BuildJob(noImage);
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "A missing image is refused");
            return Task.CompletedTask;
        }

        private static Task ManifestSecretAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            RunPodRequest request = Request(settings);
            V1Job job = builder.BuildJob(request);
            job.Metadata.Uid = "0b7c4f1e-1111-2222-3333-444455556666";

            V1Secret secret = builder.BuildSecret(request, job);
            Assert.Equal(RunPodNames.SecretName(job.Metadata.Name), secret.Metadata.Name, "Secret name matches the Job's volume");
            Assert.Equal("Opaque", secret.Type, "type");
            Assert.Equal(request.EnvelopeJson, secret.StringData[RunPodNames.SpecKey], "envelope stored");
            V1OwnerReference owner = secret.Metadata.OwnerReferences.Single();
            Assert.Equal("batch/v1", owner.ApiVersion, "owner apiVersion");
            Assert.Equal("Job", owner.Kind, "owner kind");
            Assert.Equal(job.Metadata.Name, owner.Name, "owner name");
            Assert.Equal(job.Metadata.Uid, owner.Uid, "owner uid");
            Assert.Equal(true, owner.Controller ?? false, "controller");
            Assert.Equal("run_ABCdef123_xyz", secret.Metadata.Labels[RunPodNames.RunIdLabel], "Secret labels");
            Assert.Equal("garrison-worker-0", secret.Metadata.Labels[RunPodNames.WorkerLabel], "Secret worker label (reconciliation)");

            V1Secret ownerless = builder.BuildSecret(request, null);
            Assert.True(ownerless.Metadata.OwnerReferences == null, "No owner without a created Job");
            return Task.CompletedTask;
        }

        private static Task NamesAsync(CancellationToken token)
        {
            string a = RunPodNames.JobName("run_ABCdef", 1);
            string b = RunPodNames.JobName("run_abcdef", 1);
            string c = RunPodNames.JobName("run_ABCdef", 2);
            Assert.True(a != b, "Run IDs differing only in case get different names");
            Assert.True(a != c, "Epochs get different names");
            string longName = RunPodNames.JobName("run_" + new string('Z', 200), Int64.MaxValue);
            foreach (string name in new[] { a, b, c, longName })
            {
                Assert.True(name.Length <= 63, "Name " + name + " is at most 63 characters");
                Assert.True(KubernetesNames.IsSubdomain(name) && !name.Contains('.', StringComparison.Ordinal), "Name " + name + " is a DNS label");
                Assert.True(name.StartsWith("garrison-run-", StringComparison.Ordinal), "Name prefix");
            }
            Assert.Equal("none", RunPodNames.LabelValue(null), "Empty label value");
            Assert.Equal("a-b_c.d", RunPodNames.LabelValue("a/b_c.d"), "Sanitized label value");
            Assert.Equal(63, RunPodNames.LabelValue(new string('x', 100)).Length, "Label values are cut at 63");
            Assert.Equal("x", RunPodNames.LabelValue("-x-"), "Label values start and end with alphanumerics");
            return Task.CompletedTask;
        }

        private static V1Pod Pod(string phase, V1ContainerState? state, string? reason = null, string? message = null, V1PodCondition? condition = null)
        {
            V1Pod pod = new V1Pod();
            pod.Metadata = new V1ObjectMeta { Name = "p" };
            pod.Status = new V1PodStatus();
            pod.Status.Phase = phase;
            pod.Status.Reason = reason;
            pod.Status.Message = message;
            if (condition != null) pod.Status.Conditions = new List<V1PodCondition> { condition };
            if (state != null) pod.Status.ContainerStatuses = new List<V1ContainerStatus> { new V1ContainerStatus { Name = "run", State = state, Image = "i", ImageID = "i", Ready = false, RestartCount = 0 } };
            return pod;
        }

        private static Task DiagnosisAsync(CancellationToken token)
        {
            RunPodDiagnosis unschedulable = RunPodDiagnosis.OfPod(Pod("Pending", null, null, null, new V1PodCondition { Type = "PodScheduled", Status = "False", Reason = "Unschedulable", Message = "0/1 nodes are available: 1 Insufficient memory." }));
            Assert.Equal(RunPodStateEnum.Pending, unschedulable.State, "Unschedulable waits (until the pending timeout)");
            Assert.True(unschedulable.Message.Contains("Insufficient memory", StringComparison.Ordinal), "Message names the scheduler's reason: " + unschedulable.Message);

            RunPodDiagnosis pulling = RunPodDiagnosis.OfPod(Pod("Pending", new V1ContainerState { Waiting = new V1ContainerStateWaiting { Reason = "ContainerCreating" } }));
            Assert.Equal(RunPodStateEnum.Pending, pulling.State, "ContainerCreating waits");

            RunPodDiagnosis backoff = RunPodDiagnosis.OfPod(Pod("Pending", new V1ContainerState { Waiting = new V1ContainerStateWaiting { Reason = "ImagePullBackOff", Message = "Back-off pulling image \"nope:1\"" } }));
            Assert.Equal(RunPodStateEnum.Failed, backoff.State, "ImagePullBackOff fails");
            Assert.Equal(RunOutcomeEnum.PodFailed, backoff.Outcome, "ImagePullBackOff outcome");
            Assert.True(backoff.Message.Contains("ImagePullBackOff", StringComparison.Ordinal) && backoff.Message.Contains("nope:1", StringComparison.Ordinal), "Message: " + backoff.Message);

            Assert.Equal(RunPodStateEnum.Pending, RunPodDiagnosis.OfPod(Pod("Pending", new V1ContainerState { Waiting = new V1ContainerStateWaiting { Reason = "ErrImagePull" } })).State, "ErrImagePull is retried by the kubelet before failing");
            Assert.Equal(RunPodStateEnum.Failed, RunPodDiagnosis.OfPod(Pod("Pending", new V1ContainerState { Waiting = new V1ContainerStateWaiting { Reason = "CreateContainerConfigError", Message = "secret not found" } })).State, "Configuration errors fail");
            Assert.Equal(RunPodStateEnum.Started, RunPodDiagnosis.OfPod(Pod("Running", new V1ContainerState { Running = new V1ContainerStateRunning() })).State, "Running");
            Assert.Equal(RunPodStateEnum.Started, RunPodDiagnosis.OfPod(Pod("Failed", new V1ContainerState { Terminated = new V1ContainerStateTerminated { ExitCode = 137, Reason = "OOMKilled" } })).State, "A terminated container started");

            RunPodDiagnosis evicted = RunPodDiagnosis.OfPod(Pod("Failed", null, "Evicted", "The node was low on resource: ephemeral-storage."));
            Assert.Equal(RunPodStateEnum.Failed, evicted.State, "Evicted before start");
            Assert.True(evicted.Message.Contains("evicted", StringComparison.Ordinal) && evicted.Message.Contains("ephemeral-storage", StringComparison.Ordinal), "Message: " + evicted.Message);

            RunPodDiagnosis deadline = RunPodDiagnosis.OfPod(Pod("Failed", null, "DeadlineExceeded", "Pod was active on the node longer than the specified deadline"));
            Assert.Equal(RunOutcomeEnum.TimedOut, deadline.Outcome, "Deadline exceeded is TimedOut");

            RunPodDiagnosis oom = RunPodDiagnosis.OfEndedWithoutCompletion(Pod("Failed", new V1ContainerState { Terminated = new V1ContainerStateTerminated { ExitCode = 137, Reason = "OOMKilled" } }), "512Mi");
            Assert.Equal(RunOutcomeEnum.PodFailed, oom.Outcome, "OOMKilled outcome");
            Assert.True(oom.Message.Contains("OOMKilled", StringComparison.Ordinal) && oom.Message.Contains("512Mi", StringComparison.Ordinal), "OOM message: " + oom.Message);

            RunPodDiagnosis exited = RunPodDiagnosis.OfEndedWithoutCompletion(Pod("Failed", new V1ContainerState { Terminated = new V1ContainerStateTerminated { ExitCode = 3, Reason = "Error" } }), null);
            Assert.True(exited.Message.Contains("code 3", StringComparison.Ordinal), "Exit code message: " + exited.Message);
            Assert.True(RunPodDiagnosis.OfEndedWithoutCompletion(null, null).Message.Contains("disappeared", StringComparison.Ordinal), "Missing pod");
            Assert.Equal(RunOutcomeEnum.NodeLost, RunPodDiagnosis.OfEndedWithoutCompletion(null, null).Outcome, "A vanished pod is node loss (lease left to expire, retry policy applies)");
            Assert.Equal(RunOutcomeEnum.NodeLost, RunPodDiagnosis.OfEndedWithoutCompletion(Pod("Failed", null, "Evicted", "node drained"), null).Outcome, "An evicted running pod is node loss");
            Assert.Equal(RunOutcomeEnum.PodFailed, exited.Outcome, "A crash without completion is PodFailed");
            Assert.True(RunPodDiagnosis.OfEndedWithoutCompletion(Pod("Failed", null, "Evicted", "memory pressure"), null).Message.Contains("evicted", StringComparison.Ordinal), "Evicted while running");
            return Task.CompletedTask;
        }

        private static V1Job Job(string runId, long epoch, string? condition)
        {
            V1Job job = new V1Job();
            job.Metadata = new V1ObjectMeta { Name = RunPodNames.JobName(runId, epoch) };
            job.Metadata.Labels = new Dictionary<string, string> { { RunPodNames.RunIdLabel, RunPodNames.LabelValue(runId) }, { RunPodNames.EpochLabel, epoch.ToString(System.Globalization.CultureInfo.InvariantCulture) } };
            job.Metadata.Annotations = new Dictionary<string, string> { { RunPodNames.RunIdLabel, runId } };
            job.Status = new V1JobStatus();
            if (condition != null) job.Status.Conditions = new List<V1JobCondition> { new V1JobCondition { Type = condition, Status = "True" } };
            return job;
        }

        private static Task ReconcileOrphansAsync(CancellationToken token)
        {
            HashSet<string> held = new HashSet<string> { KubernetesJobReconciler.Key("run_held", 2) };
            Assert.True(!KubernetesJobReconciler.IsOrphan(Job("run_held", 2, null), held), "A held run's Job is kept");
            Assert.True(KubernetesJobReconciler.IsOrphan(Job("run_held", 1, null), held), "An older epoch of a held run is an orphan");
            Assert.True(KubernetesJobReconciler.IsOrphan(Job("run_gone", 1, null), held), "A run not held is an orphan");
            Assert.True(!KubernetesJobReconciler.IsOrphan(Job("run_gone", 1, "Complete"), held), "Finished Jobs are left to their TTL");
            Assert.True(!KubernetesJobReconciler.IsOrphan(Job("run_gone", 1, "Failed"), held), "Failed Jobs are left to their TTL");
            Assert.True(KubernetesJobReconciler.IsOrphan(Job("run_held", 2, null), new HashSet<string>()), "After a restart everything unfinished is orphaned");
            return Task.CompletedTask;
        }

        private static async Task RoutingAsync(CancellationToken token)
        {
            RecordingExecutor process = new RecordingExecutor("process");
            RecordingExecutor kubernetes = new RecordingExecutor("kubernetes");
            RoutingRunExecutor routing = new RoutingRunExecutor(process, kubernetes);
            RunAssignment processRun = new RunAssignment { RunId = "run_p", Spec = new ExecutionSpec { RunId = "run_p", Executor = RunExecutorEnum.Process } };
            RunAssignment jobRun = new RunAssignment { RunId = "run_k", Spec = new ExecutionSpec { RunId = "run_k", Executor = RunExecutorEnum.KubernetesJob } };
            Garrison.Worker.Reporting.InMemoryRunReporter reporter = new Garrison.Worker.Reporting.InMemoryRunReporter();

            Assert.Equal("process", (await routing.ExecuteAsync(processRun, reporter, token).ConfigureAwait(false)).ResultText ?? String.Empty, "Process spec");
            Assert.Equal("kubernetes", (await routing.ExecuteAsync(jobRun, reporter, token).ConfigureAwait(false)).ResultText ?? String.Empty, "KubernetesJob spec");
            routing.Release(processRun, true);
            routing.Release(jobRun, true);
            Assert.Equal(1, process.Released, "Process release");
            Assert.Equal(1, kubernetes.Released, "Kubernetes release");

            RoutingRunExecutor processOnly = new RoutingRunExecutor(process, null);
            RunCompleteRequest refused = await processOnly.ExecuteAsync(jobRun, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunOutcomeEnum.NoCapableWorker, refused.Outcome, "A KubernetesJob spec on a Process-only worker never runs as a subprocess");
            Assert.Equal(2, process.Executed + kubernetes.Executed, "Nothing else executed");
        }

        private static Task SettingsAsync(CancellationToken token)
        {
            string[] names = { "GARRISON_WORKER_KUBERNETES_ENABLED", "GARRISON_WORKER_RUN_NAMESPACE", "GARRISON_WORKER_RUN_IMAGE_PULL_SECRETS", "GARRISON_WORKER_RUN_NODE_SELECTOR", "GARRISON_WORKER_JOB_TTL_SECONDS", "GARRISON_WORKER_RUN_RUNTIME_CLASS", "GARRISON_WORKER_RUN_IMAGE_PULL_POLICY" };
            Dictionary<string, string?> saved = names.ToDictionary(n => n, n => Environment.GetEnvironmentVariable(n));
            try
            {
                Environment.SetEnvironmentVariable("GARRISON_WORKER_KUBERNETES_ENABLED", "true");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_NAMESPACE", "garrison-runs");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_IMAGE_PULL_SECRETS", "a, b");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_NODE_SELECTOR", "pool=runs,zone=a");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_JOB_TTL_SECONDS", "9999999");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_RUNTIME_CLASS", "kata");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_IMAGE_PULL_POLICY", "IfNotPresent");
                WorkerSettings settings = new WorkerSettings();
                Assert.True(!settings.Kubernetes.Enabled, "Disabled by default");
                settings.ApplyEnvironment();
                Assert.True(settings.Kubernetes.Enabled, "Enabled from the environment");
                Assert.Equal("garrison-runs", settings.Kubernetes.RunNamespace ?? String.Empty, "Run namespace");
                Assert.Equal("a,b", String.Join(",", settings.Kubernetes.ImagePullSecrets), "Pull secrets");
                Assert.Equal("runs", settings.Kubernetes.NodeSelector["pool"], "Node selector");
                Assert.Equal(604800, settings.Kubernetes.JobTtlSeconds, "TTL clamped");
                Assert.Equal("kata", settings.Kubernetes.RuntimeClassName ?? String.Empty, "Runtime class");
                Assert.Equal("IfNotPresent", settings.Kubernetes.ImagePullPolicy ?? String.Empty, "Pull policy");
            }
            finally
            {
                foreach (KeyValuePair<string, string?> pair in saved) Environment.SetEnvironmentVariable(pair.Key, pair.Value);
            }

            KubernetesExecutorSettings guarded = new KubernetesExecutorSettings();
            bool threw = false;
            try
            {
                guarded.RunAsUser = 0;
            }
            catch (ArgumentOutOfRangeException)
            {
                threw = true;
            }
            Assert.True(threw, "Run pods never run as root");
            threw = false;
            try
            {
                guarded.ImagePullPolicy = "Sometimes";
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "Invalid pull policy");
            Assert.Equal("garrison-run", guarded.ServiceAccountName, "Default run service account");
            return Task.CompletedTask;
        }

        private static Task QuantitiesAsync(CancellationToken token)
        {
            foreach (string good in new[] { "500m", "2", "1.5", "512Mi", "4Gi", "100M", "1e3", ".5" }) Assert.True(KubernetesNames.IsQuantity(good), good + " is a quantity");
            foreach (string bad in new[] { "", "lots", "512MB", "-1", "1 Gi", "Gi" }) Assert.True(!KubernetesNames.IsQuantity(bad), "'" + bad + "' is not a quantity");
            decimal value;
            Assert.True(KubernetesNames.TryParseQuantity("500m", out value) && value == 0.5m, "500m");
            Assert.True(KubernetesNames.TryParseQuantity("2Gi", out value) && value == 2147483648m, "2Gi");
            Assert.True(KubernetesNames.TryParseQuantity("1M", out value) && value == 1000000m, "1M");
            Assert.True(KubernetesNames.TryParseQuantity("1e3", out value) && value == 1000m, "1e3");
            Assert.True(!KubernetesNames.TryParseQuantity("lots", out value), "invalid");
            foreach (string good in new[] { "shared-repo", "a", "repo.v2" }) Assert.True(KubernetesNames.IsSubdomain(good), good + " is a DNS-1123 name");
            foreach (string bad in new[] { "", "Upper", "-x", "x-", "a_b" }) Assert.True(!KubernetesNames.IsSubdomain(bad), "'" + bad + "' is not a DNS-1123 name");
            return Task.CompletedTask;
        }

        private static Run NewRun(string tenantId, RunExecutorEnum executor)
        {
            Run run = new Run();
            run.TenantId = tenantId;
            run.AgentId = "agt_test";
            run.AgentName = "tester";
            run.DeploymentId = "dep_test";
            run.HarnessType = HarnessTypeEnum.Generic;
            run.Executor = executor;
            run.Status = RunStatusEnum.Queued;
            run.QueuedUtc = DateTime.UtcNow;
            run.InputText = "hello";
            return run;
        }

        private static Node NewNode(string name, params RunExecutorEnum[] executors)
        {
            Node node = new Node();
            node.Name = name + "-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            node.Status = NodeStatusEnum.Ready;
            node.MaxConcurrentRuns = 8;
            node.LastHeartbeatUtc = DateTime.UtcNow;
            node.Capabilities.Add(new NodeCapability { NodeId = node.Id, HarnessType = HarnessTypeEnum.Generic, Available = true });
            node.Executors = executors.ToList();
            return node;
        }

        private static async Task PersistenceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = new Deployment();
                deployment.TenantId = "ten_k8s";
                deployment.AgentId = "agt_k8s";
                deployment.Name = "k8s-" + Guid.NewGuid().ToString("N").Substring(0, 6);
                deployment.HarnessProfileId = "hpf_x";
                deployment.Executor = RunExecutorEnum.KubernetesJob;
                deployment.PodResources = new RunPodResources { CpuRequest = "250m", CpuLimit = "1", MemoryRequest = "256Mi", MemoryLimit = "1Gi", EphemeralStorageRequest = "1Gi", EphemeralStorageLimit = "5Gi" };
                deployment = await db.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                Deployment read = await db.Deployments.ReadAsync(deployment.Id, token).ConfigureAwait(false) ?? throw new TestAssertionException("Deployment not read back.");
                Assert.Equal(RunExecutorEnum.KubernetesJob, read.Executor ?? RunExecutorEnum.Process, "Deployment executor");
                Assert.Equal("250m|1|256Mi|1Gi|1Gi|5Gi", String.Join("|", read.PodResources.CpuRequest, read.PodResources.CpuLimit, read.PodResources.MemoryRequest, read.PodResources.MemoryLimit, read.PodResources.EphemeralStorageRequest, read.PodResources.EphemeralStorageLimit), "Pod resources");
                read.Executor = null;
                read.PodResources = new RunPodResources();
                await db.Deployments.UpdateAsync(read, token).ConfigureAwait(false);
                Deployment cleared = await db.Deployments.ReadAsync(deployment.Id, token).ConfigureAwait(false) ?? throw new TestAssertionException("Deployment not read back.");
                Assert.True(cleared.Executor == null && cleared.PodResources.IsEmpty, "Cleared executor and resources");

                NodePool pool = await db.NodePools.CreateAsync(new NodePool { Name = "jobs-" + Guid.NewGuid().ToString("N").Substring(0, 6), DefaultExecutor = RunExecutorEnum.KubernetesJob }, token).ConfigureAwait(false);
                Assert.Equal(RunExecutorEnum.KubernetesJob, (await db.NodePools.ReadAsync(pool.Id, token).ConfigureAwait(false))?.DefaultExecutor ?? RunExecutorEnum.Process, "Pool default executor");

                Node node = await db.Nodes.CreateAsync(NewNode("exec", RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                Node readNode = await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false) ?? throw new TestAssertionException("Node not read back.");
                Assert.Equal("Process,KubernetesJob", String.Join(",", readNode.Executors), "Node executors");
                readNode.Executors = new List<RunExecutorEnum> { RunExecutorEnum.Process };
                await db.Nodes.UpdateAsync(readNode, token).ConfigureAwait(false);
                Assert.Equal("Process", String.Join(",", (await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false))!.Executors), "Node executors replaced");
                Assert.Equal("Process", String.Join(",", RunExecutors.Of(new Node())), "A node without executors supports Process");

                Run run = await db.Runs.CreateAsync(NewRun("ten_k8s", RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                Assert.Equal(RunExecutorEnum.KubernetesJob, (await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false))?.Executor ?? RunExecutorEnum.Process, "Run executor");

                WorkspaceTemplate workspace = new WorkspaceTemplate();
                workspace.TenantId = "ten_k8s";
                workspace.Name = "pv-" + Guid.NewGuid().ToString("N").Substring(0, 6);
                workspace.Kind = WorkspaceKindEnum.PersistentVolume;
                workspace.PersistentVolumeClaim = "shared-repo";
                workspace = await db.WorkspaceTemplates.CreateAsync(workspace, token).ConfigureAwait(false);
                WorkspaceTemplate readWorkspace = await db.WorkspaceTemplates.ReadAsync(workspace.Id, token).ConfigureAwait(false) ?? throw new TestAssertionException("Workspace not read back.");
                Assert.Equal(WorkspaceKindEnum.PersistentVolume, readWorkspace.Kind, "Workspace kind");
                Assert.Equal("shared-repo", readWorkspace.PersistentVolumeClaim ?? String.Empty, "Workspace claim");

                Assert.Equal(RunExecutorEnum.KubernetesJob, RunExecutors.Resolve(new Deployment(), pool), "Pool default applies");
                Assert.Equal(RunExecutorEnum.Process, RunExecutors.Resolve(new Deployment { Executor = RunExecutorEnum.Process }, pool), "Deployment executor wins over the pool");
                Assert.Equal(RunExecutorEnum.Process, RunExecutors.Resolve(new Deployment(), null), "Process otherwise");
            }
        }

        private static Task WarmLayoutAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            WarmPodSettings settings = new WarmPodSettings();
            Assert.True(settings.Enabled, "Warming defaults enabled");
            Assert.Equal(1, WarmPodSizing.Desired(settings, 0, 0), "Idle minimum");
            Assert.Equal(4, WarmPodSizing.Desired(settings, 100, 100), "Pressure never exceeds maximum");
            Assert.Equal(3, WarmPodSizing.Desired(settings, 0, 1), "Arrival rate contributes to stock");
            settings.Enabled = false;
            Assert.Equal(0, WarmPodSizing.Desired(settings, 100, 100), "Disabled means no stock");
            KubernetesExecutorSettings executor = new KubernetesExecutorSettings();
            RunPodRequest request = new RunPodRequest
            {
                Assignment = new RunAssignment { RunId = "run_warm_layout", Epoch = 1, Spec = new ExecutionSpec { Executor = RunExecutorEnum.KubernetesJob } },
                Namespace = "garrison", NodeName = "worker", Image = "worker:test"
            };
            V1Pod pod = new RunPodManifestBuilder(executor).BuildWarmPod(request, "test-group");
            V1Container container = pod.Spec.Containers[0];
            Assert.True(container.Stdin == true && container.StdinOnce == true && container.Tty != true, "One authenticated stdin delivery");
            Assert.True(container.Args.Contains("--stdin") && !container.Args.Contains("--spec"), "No mounted run input");
            Assert.True(pod.Spec.Volumes.All(v => v.Secret == null), "Idle stock holds no run credential Secret");
            Assert.True(pod.Spec.AutomountServiceAccountToken == false && container.SecurityContext.ReadOnlyRootFilesystem == true, "Existing isolation retained");
            Assert.Equal(10001L, pod.Spec.SecurityContext.RunAsUser!.Value, "Unprivileged runtime");
            Assert.True(container.ReadinessProbe != null && pod.Metadata.Labels["garrison.io/warm-state"] == "idle", "Readiness gates reservation");
            Assert.True(KubernetesWarmPool.Compatible(request.Assignment.Spec), "Default layout is compatible");
            request.Assignment.Spec.Workspace.Kind = WorkspaceKindEnum.PersistentVolume;
            Assert.True(!KubernetesWarmPool.Compatible(request.Assignment.Spec), "PVCs cannot silently use default layout");
            request.Assignment.Spec.Workspace.Kind = WorkspaceKindEnum.Empty;
            request.Assignment.Spec.PodResources = new RunPodResources { MemoryLimit = "256Mi" };
            Assert.True(!KubernetesWarmPool.Compatible(request.Assignment.Spec), "Custom resource limits cannot silently use default layout");
            return Task.CompletedTask;
        }

        private static async Task WarmCapabilityClaimAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                string tenant = "ten_warm_" + Guid.NewGuid().ToString("N");
                Node node = NewNode("warm", RunExecutorEnum.KubernetesJob);
                node.ExecutorCapabilities.Add(ExecutorCapabilityProfiles.For(RunExecutorEnum.KubernetesJob, true));
                node = await db.Nodes.CreateAsync(node, token).ConfigureAwait(false);
                Node saved = (await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false))!;
                Assert.True(saved.ExecutorCapabilities[0].WarmStart, "Warm support persists");
                foreach (ExecutorColdStartEnum startup in new[] { ExecutorColdStartEnum.Cold, ExecutorColdStartEnum.Warm })
                {
                    Run run = NewRun(tenant, RunExecutorEnum.KubernetesJob);
                    run.RequiredCapabilities.ColdStartClass = startup;
                    run = await db.Runs.CreateAsync(run, token).ConfigureAwait(false);
                    ClaimCandidateFilter filter = new ClaimCandidateFilter { AllowedTenantIds = new List<string> { tenant }, HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, ExecutorCapabilities = ExecutorCapabilityRules.Of(saved) };
                    Assert.True((await db.Runs.ListClaimCandidatesAsync(filter, token).ConfigureAwait(false)).Any(r => r.Id == run.Id), "Selection accepts " + startup);
                    if (startup == ExecutorColdStartEnum.Warm)
                    {
                        node.ExecutorCapabilities[0].WarmStart = false;
                        await db.Nodes.UpdateAsync(node, token).ConfigureAwait(false);
                        Assert.True(!(await db.Runs.TryClaimAsync(run.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim rejects lost warm support");
                        node.ExecutorCapabilities[0].WarmStart = true;
                        await db.Nodes.UpdateAsync(node, token).ConfigureAwait(false);
                    }
                    Assert.True((await db.Runs.TryClaimAsync(run.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim accepts " + startup);
                }
            }
        }

        private static async Task CapabilityPersistenceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                ExecutorRequirements required = new ExecutorRequirements
                {
                    Isolation = ExecutorIsolationEnum.SandboxedRuntime, EgressControl = true,
                    FilesystemSnapshot = true, SessionContinuation = true, CrossNodeRestore = true,
                    ColdStartClass = ExecutorColdStartEnum.Warm
                };
                Deployment deployment = new Deployment { TenantId = "ten_caps", AgentId = "agt_caps", Name = "caps", RequiredCapabilities = required };
                deployment = await db.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                Deployment? read = await db.Deployments.ReadAsync(deployment.Id, token).ConfigureAwait(false);
                Assert.True(read != null && read.RequiredCapabilities.CrossNodeRestore && read.RequiredCapabilities.ColdStartClass == ExecutorColdStartEnum.Warm, "Deployment requirements round-trip");
                Run run = NewRun("ten_caps", RunExecutorEnum.KubernetesJob);
                run.RequiredCapabilities = required.Clone();
                run = await db.Runs.CreateAsync(run, token).ConfigureAwait(false);
                Run? roundTrip = await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false);
                Assert.True(roundTrip != null && roundTrip.RequiredCapabilities.Isolation == ExecutorIsolationEnum.SandboxedRuntime && roundTrip.RequiredCapabilities.EgressControl && roundTrip.RequiredCapabilities.FilesystemSnapshot && roundTrip.RequiredCapabilities.SessionContinuation, "Run requirements round-trip");
                required.SessionContinuation = false;
                Assert.True(run.RequiredCapabilities.SessionContinuation, "An admitted requirement snapshot does not follow deployment edits");
                Node node = NewNode("caps", RunExecutorEnum.KubernetesJob);
                node.ExecutorCapabilities.Add(new ExecutorCapabilities { Executor = RunExecutorEnum.KubernetesJob, Isolation = ExecutorIsolationEnum.Container, ColdStartClass = ExecutorColdStartEnum.Cold, EgressControl = true });
                node = await db.Nodes.CreateAsync(node, token).ConfigureAwait(false);
                Node? nodeRead = await db.Nodes.ReadAsync(node.Id, token).ConfigureAwait(false);
                Assert.True(nodeRead != null && nodeRead.ExecutorCapabilities.Count == 1 && nodeRead.ExecutorCapabilities[0].EgressControl, "Node reports round-trip");
                Assert.True(!ExecutorCapabilityRules.Matches(nodeRead!.ExecutorCapabilities[0], run.RequiredCapabilities), "A container does not satisfy sandbox, snapshot, session, restore, or warm requirements");
            }
        }

        private static async Task CapabilityClaimAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                string tenant = "ten_caps_" + Guid.NewGuid().ToString("N");
                Node node = NewNode("caps", RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob);
                node.ExecutorCapabilities.Add(new ExecutorCapabilities { Executor = RunExecutorEnum.Process, ColdStartClass = ExecutorColdStartEnum.Immediate, SessionContinuation = true });
                node.ExecutorCapabilities.Add(new ExecutorCapabilities { Executor = RunExecutorEnum.KubernetesJob, Isolation = ExecutorIsolationEnum.Container, ColdStartClass = ExecutorColdStartEnum.Cold });
                node = await db.Nodes.CreateAsync(node, token).ConfigureAwait(false);
                for (int i = 0; i < 30; i++)
                {
                    Run blocked = NewRun(tenant, RunExecutorEnum.KubernetesJob);
                    blocked.Priority = 10;
                    blocked.RequiredCapabilities.FilesystemSnapshot = true;
                    await db.Runs.CreateAsync(blocked, token).ConfigureAwait(false);
                }
                Run eligible = NewRun(tenant, RunExecutorEnum.KubernetesJob);
                eligible.RequiredCapabilities.Isolation = ExecutorIsolationEnum.Container;
                eligible.RequiredCapabilities.ColdStartClass = ExecutorColdStartEnum.Cold;
                eligible = await db.Runs.CreateAsync(eligible, token).ConfigureAwait(false);
                ClaimCandidateFilter filter = new ClaimCandidateFilter { HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, AllowedTenantIds = new List<string> { tenant }, ExecutorCapabilities = ExecutorCapabilityRules.Of(node), Limit = 1 };
                List<Run> candidates = await db.Runs.ListClaimCandidatesAsync(filter, token).ConfigureAwait(false);
                Assert.Equal(1, candidates.Count, "Capability filtering happens before LIMIT");
                Assert.Equal(eligible.Id, candidates[0].Id, "Unsupported high-priority work cannot hide eligible work");
                Assert.True(!(await db.Runs.TryClaimAsync(eligible.Id, "nod_unknown", "legacy", DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim refuses an unreported container capability");
                node.ExecutorCapabilities.Clear();
                await db.Nodes.UpdateAsync(node, token).ConfigureAwait(false);
                Assert.True(!(await db.Runs.TryClaimAsync(eligible.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Capabilities lost after selection cannot be claimed");
                node.ExecutorCapabilities.Add(new ExecutorCapabilities { Executor = RunExecutorEnum.KubernetesJob, Isolation = ExecutorIsolationEnum.Container, ColdStartClass = ExecutorColdStartEnum.Cold });
                await db.Nodes.UpdateAsync(node, token).ConfigureAwait(false);
                Assert.True((await db.Runs.TryClaimAsync(eligible.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Current container report authorizes claim");
                Run process = NewRun(tenant, RunExecutorEnum.Process);
                process.RequiredCapabilities.Isolation = ExecutorIsolationEnum.Container;
                Assert.True(!ExecutorCapabilityRules.Supports(NewNode("legacy", RunExecutorEnum.Process), process), "Process-only pools cannot satisfy Container isolation");
                foreach (ExecutorRequirements requirement in new List<ExecutorRequirements> { new ExecutorRequirements { EgressControl = true }, new ExecutorRequirements { FilesystemSnapshot = true }, new ExecutorRequirements { CrossNodeRestore = true }, new ExecutorRequirements { SessionContinuation = true }, new ExecutorRequirements { ColdStartClass = ExecutorColdStartEnum.Warm } })
                {
                    Run impossible = NewRun(tenant, RunExecutorEnum.Process);
                    impossible.RequiredCapabilities = requirement;
                    impossible = await db.Runs.CreateAsync(impossible, token).ConfigureAwait(false);
                    Assert.True(!(await db.Runs.TryClaimAsync(impossible.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claims enforce every required dimension");
                }
            }
        }

        private static async Task ClaimFilterAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                string tenant = "ten_claim_" + Guid.NewGuid().ToString("N").Substring(0, 6);
                for (int i = 0; i < 30; i++)
                {
                    Run job = NewRun(tenant, RunExecutorEnum.KubernetesJob);
                    job.Priority = 10;
                    await db.Runs.CreateAsync(job, token).ConfigureAwait(false);
                }
                Run process = await db.Runs.CreateAsync(NewRun(tenant, RunExecutorEnum.Process), token).ConfigureAwait(false);

                ClaimCandidateFilter processOnly = new ClaimCandidateFilter();
                processOnly.HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic };
                processOnly.AllowedTenantIds = new List<string> { tenant };
                processOnly.Executors = RunExecutors.Of(new Node());
                processOnly.Limit = 16;
                List<Run> seen = await db.Runs.ListClaimCandidatesAsync(processOnly, token).ConfigureAwait(false);
                Assert.True(seen.Any(r => r.Id == process.Id), "A Process-only node sees the Process run behind 30 KubernetesJob runs");
                Assert.True(seen.All(r => r.Executor == RunExecutorEnum.Process), "A Process-only node never sees KubernetesJob runs");

                ClaimCandidateFilter capable = new ClaimCandidateFilter();
                capable.HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic };
                capable.AllowedTenantIds = new List<string> { tenant };
                capable.Executors = new List<RunExecutorEnum> { RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob };
                capable.Limit = 100;
                List<Run> all = await db.Runs.ListClaimCandidatesAsync(capable, token).ConfigureAwait(false);
                Assert.Equal(31, all.Count, "A capable node sees both kinds");

                ClaimCandidateFilter jobsOnly = new ClaimCandidateFilter();
                jobsOnly.HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic };
                jobsOnly.AllowedTenantIds = new List<string> { tenant };
                jobsOnly.Executors = new List<RunExecutorEnum> { RunExecutorEnum.KubernetesJob };
                jobsOnly.Limit = 100;
                Assert.True((await db.Runs.ListClaimCandidatesAsync(jobsOnly, token).ConfigureAwait(false)).All(r => r.Executor == RunExecutorEnum.KubernetesJob), "A KubernetesJob-only filter excludes Process runs");
            }
        }

        private static async Task BlockedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                BlockedRunService blocked = new BlockedRunService(db);
                blocked.SnapshotTtlMs = 0;
                Run run = await db.Runs.CreateAsync(NewRun("ten_blocked", RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                await db.Nodes.CreateAsync(NewNode("process-only", RunExecutorEnum.Process), token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoCapableWorker, (await blocked.AnnotateAsync(run, token).ConfigureAwait(false))!.BlockedReason, "Only Process workers");
                Assert.True(BlockedRunService.Describe(run, RunBlockedReasonEnum.NoCapableWorker).Contains("KubernetesJob executor", StringComparison.Ordinal), "Description names the executor");
                await db.Nodes.CreateAsync(NewNode("capable", RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                Assert.True((await blocked.AnnotateAsync(run, token).ConfigureAwait(false))!.BlockedReason == null, "Not blocked with a capable worker");
            }
        }

        private static async Task<Run> InvokeAsync(TestServerHost host, string tenantId, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "hello pod";
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + tenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            return Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
        }

        private static async Task ScheduleAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 1, token: token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Replicas[0];
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await cluster.CreateAgentAsync(0, "pod-agent-" + Guid.NewGuid().ToString("N").Substring(0, 4), d =>
                {
                    d.Executor = RunExecutorEnum.KubernetesJob;
                    d.PodResources = new RunPodResources { MemoryLimit = "768Mi", CpuRequest = "200m" };
                }, token).ConfigureAwait(false);
                Run run = await InvokeAsync(host, cluster.TenantId, agent, token).ConfigureAwait(false);
                Assert.Equal(RunExecutorEnum.KubernetesJob, run.Executor, "Run records the deployment's executor");

                SchedulerService scheduler = host.Server.Context.Get<SchedulerService>();
                Node processNode = await db.Nodes.CreateAsync(NewNode("sched-process", RunExecutorEnum.Process), token).ConfigureAwait(false);
                NodeLeaseRequest request = new NodeLeaseRequest();
                request.NodeId = processNode.Id;
                request.MaxRuns = 4;
                request.WaitMs = 0;
                NodeLeaseResponse none = await scheduler.LeaseAsync(processNode, request, token).ConfigureAwait(false);
                Assert.Equal(0, none.Assignments.Count, "A Process-only node is not leased the KubernetesJob run");

                Node jobNode = await db.Nodes.CreateAsync(NewNode("sched-jobs", RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                request.NodeId = jobNode.Id;
                NodeLeaseResponse leased = await scheduler.LeaseAsync(jobNode, request, token).ConfigureAwait(false);
                RunAssignment assignment = leased.Assignments.SingleOrDefault(a => a.RunId == run.Id) ?? throw new TestAssertionException("The capable node was not leased the run.");
                Assert.Equal(RunExecutorEnum.KubernetesJob, assignment.Spec.Executor, "Spec executor");
                Assert.Equal("768Mi", assignment.Spec.PodResources?.MemoryLimit ?? String.Empty, "Spec memory limit");
                Assert.Equal("200m", assignment.Spec.PodResources?.CpuRequest ?? String.Empty, "Spec cpu request");
                Assert.True(!assignment.Spec.RetainForRepair, "KubernetesJob runs are never retained for repair");

                // Pool default executor: a deployment that leaves executor unset inherits it.
                NodePool pool = await db.NodePools.CreateAsync(new NodePool { Name = "jobs-pool-" + Guid.NewGuid().ToString("N").Substring(0, 4), DefaultExecutor = RunExecutorEnum.KubernetesJob }, token).ConfigureAwait(false);
                Agent pooled = await cluster.CreateAgentAsync(0, "pool-agent-" + Guid.NewGuid().ToString("N").Substring(0, 4), d => d.NodePoolId = pool.Id, token).ConfigureAwait(false);
                Run pooledRun = await InvokeAsync(host, cluster.TenantId, pooled, token).ConfigureAwait(false);
                Assert.Equal(RunExecutorEnum.KubernetesJob, pooledRun.Executor, "Pool default executor applies");

                Agent plain = await cluster.CreateAgentAsync(0, "plain-agent-" + Guid.NewGuid().ToString("N").Substring(0, 4), null, token).ConfigureAwait(false);
                Run plainRun = await InvokeAsync(host, cluster.TenantId, plain, token).ConfigureAwait(false);
                Assert.Equal(RunExecutorEnum.Process, plainRun.Executor, "Process by default");
                request.NodeId = processNode.Id;
                NodeLeaseResponse processLease = await scheduler.LeaseAsync(processNode, request, token).ConfigureAwait(false);
                Assert.True(processLease.Assignments.Any(a => a.RunId == plainRun.Id), "The Process node takes the Process run");
                Assert.True(processLease.Assignments.All(a => a.Spec.Executor == RunExecutorEnum.Process), "and only Process runs");
            }
        }

        private static async Task ValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 1, token: token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Replicas[0];
                string tenantPath = "/v1.0/api/tenants/" + cluster.TenantId;
                Agent agent = await cluster.CreateAgentAsync(0, "valid-agent-" + Guid.NewGuid().ToString("N").Substring(0, 4), null, token).ConfigureAwait(false);
                HarnessProfile profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(cluster.TenantId, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("No fake profile.");

                Deployment bad = new Deployment();
                bad.AgentId = agent.Id;
                bad.Name = "bad-quantity";
                bad.HarnessProfileId = profile.Id;
                bad.Executor = RunExecutorEnum.KubernetesJob;
                bad.PodResources = new RunPodResources { MemoryLimit = "lots" };
                TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", bad, token).ConfigureAwait(false);
                Assert.Equal(400, response.StatusCode, "Bad quantity rejected");
                Assert.True(response.Body.Contains("podResources.memoryLimit", StringComparison.Ordinal), "Error names the field: " + response.Body);

                Deployment inverted = new Deployment();
                inverted.AgentId = agent.Id;
                inverted.Name = "inverted";
                inverted.HarnessProfileId = profile.Id;
                inverted.PodResources = new RunPodResources { MemoryRequest = "2Gi", MemoryLimit = "1Gi" };
                TestResponse invertedResponse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", inverted, token).ConfigureAwait(false);
                Assert.Equal(400, invertedResponse.StatusCode, "Request above limit rejected");
                Assert.True(invertedResponse.Body.Contains("podResources.memoryRequest", StringComparison.Ordinal), "Error names the request: " + invertedResponse.Body);

                WorkspaceTemplate noClaim = new WorkspaceTemplate { Name = "pv-noclaim", Kind = WorkspaceKindEnum.PersistentVolume };
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/workspace-templates", noClaim, token).ConfigureAwait(false)).StatusCode, "PersistentVolume workspace without a claim");

                WorkspaceTemplate pv = new WorkspaceTemplate { Name = "pv-ok", Kind = WorkspaceKindEnum.PersistentVolume, PersistentVolumeClaim = "shared-repo" };
                WorkspaceTemplate created = await HttpTestHelpers.SendAsync<WorkspaceTemplate>(host.AdminClient, HttpMethod.Post, tenantPath + "/workspace-templates", pv, 201, token).ConfigureAwait(false);

                Deployment processPv = new Deployment();
                processPv.AgentId = agent.Id;
                processPv.Name = "process-pv";
                processPv.HarnessProfileId = profile.Id;
                processPv.WorkspaceTemplateId = created.Id;
                TestResponse mismatch = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", processPv, token).ConfigureAwait(false);
                Assert.Equal(400, mismatch.StatusCode, "PersistentVolume workspace on a Process deployment");
                Assert.True(mismatch.Body.Contains("KubernetesJob", StringComparison.Ordinal), "Error explains the executor: " + mismatch.Body);

                processPv.Executor = RunExecutorEnum.KubernetesJob;
                processPv.PodResources = new RunPodResources { MemoryLimit = "2Gi" };
                Deployment ok = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", processPv, 201, token).ConfigureAwait(false);
                Assert.Equal(RunExecutorEnum.KubernetesJob, ok.Executor ?? RunExecutorEnum.Process, "Executor returned by the API");
                Assert.Equal("2Gi", ok.PodResources.MemoryLimit ?? String.Empty, "Pod resources returned by the API");
                processPv.Name = "warm-custom";
                processPv.RequiredCapabilities.ColdStartClass = ExecutorColdStartEnum.Warm;
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", processPv, token).ConfigureAwait(false)).StatusCode, "Warm custom resources rejected");
                processPv.PodResources = new RunPodResources();
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", processPv, token).ConfigureAwait(false)).StatusCode, "Warm PVC rejected");
                processPv.RequiredCapabilities.ColdStartClass = null;
                profile.SupportsResume = false;
                await host.Server.Context.Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                processPv.Name = "session-required";
                processPv.RequiredCapabilities.SessionContinuation = true;
                TestResponse session = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", processPv, token).ConfigureAwait(false);
                Assert.Equal(400, session.StatusCode, "Session continuation requires a resume-capable harness profile");
                processPv.RequiredCapabilities.SessionContinuation = false;
                processPv.RequiredCapabilities.Isolation = (ExecutorIsolationEnum)99;
                TestResponse isolation = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", processPv, token).ConfigureAwait(false);
                Assert.Equal(400, isolation.StatusCode, "Unknown isolation cannot become a capability claim");

            }
        }

        #endregion
    }
}
