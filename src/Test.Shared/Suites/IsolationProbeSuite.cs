namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.FakeHarness;
    using Garrison.Harnesses.Execution;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// The fake harness's isolation probe mode (P11.17), used by k8s/tests/isolation-test.sh: probe parsing, option
    /// parsing, the PROBE result line format, each probe kind against local targets, and the harness end to end with
    /// probes from the command line and the prompt. Results must never carry file contents, variable values, or tokens.
    /// </summary>
    public static class IsolationProbeSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("isolation-probe", "parse", "Probe parsing: every kind, the optional 'probe ' prefix, marker name and text, unknown kinds and missing targets refused, prompt lines filtered", ParseAsync),
                new TestCaseDescriptor("isolation-probe", "options", "Options: --probe is repeatable, --probe-prompt and --probe-timeout-ms (clamped to 100..60000) parse, defaults are off", OptionsAsync),
                new TestCaseDescriptor("isolation-probe", "line-format", "Result line: PROBE|kind|target|OUTCOME|detail with upper-case outcomes, separators and line breaks escaped, detail truncated", LineFormatAsync),
                new TestCaseDescriptor("isolation-probe", "file-probes", "read, list, and glob probes: readable files are ALLOWED with a size and never their contents, missing and unmatched paths are BLOCKED", FileProbesAsync),
                new TestCaseDescriptor("isolation-probe", "env-probe", "env probe: a set variable is ALLOWED by name with no value, a prefix matches, an unset one is BLOCKED", EnvProbeAsync),
                new TestCaseDescriptor("isolation-probe", "network-probes", "connect and http probes: an open port is ALLOWED, a closed one BLOCKED; http 2xx is ALLOWED, 403 BLOCKED; a mounted service account token is sent but never shown", NetworkProbesAsync),
                new TestCaseDescriptor("isolation-probe", "harness", "Fake harness end to end: probes from --probe and prompt lines run in order, the marker lands in the working directory only, '../' names are refused, and the answer is the PROBE lines", HarnessAsync)
            };
            return new List<TestSuiteDescriptor> { new TestSuiteDescriptor("isolation-probe", "Isolation probe mode (fake harness)", cases) };
        }

        #endregion

        #region Private-Methods

        private static Task ParseAsync(CancellationToken token)
        {
            foreach (string kind in FakeProbe.Kinds)
            {
                string text = kind == "marker" ? "marker m.txt some text" : kind + " target";
                Assert.True(FakeProbe.TryParse(text, out FakeProbe? probe, out string? error), kind + " parses: " + error);
                Assert.Equal(kind, probe!.Kind, "Kind of " + text);
            }

            Assert.True(FakeProbe.TryParse("  PROBE Connect garrison-server:8700 ", out FakeProbe? prefixed, out string? _), "Prefix and case are accepted");
            Assert.Equal("connect", prefixed!.Kind, "Kind is lower case");
            Assert.Equal("garrison-server:8700", prefixed.Target, "Target is trimmed");

            Assert.True(FakeProbe.TryParse("probe read /workspaces/*/work/a file.txt", out FakeProbe? spaced, out string? _), "Paths with spaces parse");
            Assert.Equal("/workspaces/*/work/a file.txt", spaced!.Target, "Read target is the rest of the line");
            Assert.True(spaced.Argument == null, "Read has no argument");

            Assert.True(FakeProbe.TryParse("marker isolation-marker.txt run A was here", out FakeProbe? marker, out string? _), "Marker parses");
            Assert.Equal("isolation-marker.txt", marker!.Target, "Marker name");
            Assert.Equal("run A was here", marker.Argument, "Marker text");

            Assert.True(!FakeProbe.TryParse("delete /etc/passwd", out FakeProbe? _, out string? unknown), "Unknown kinds are refused");
            Assert.True((unknown ?? String.Empty).Contains("Unknown probe kind 'delete'", StringComparison.Ordinal), "Unknown kind error: " + unknown);
            Assert.True(!FakeProbe.TryParse("probe connect", out FakeProbe? _, out string? noTarget), "A probe needs a target");
            Assert.True((noTarget ?? String.Empty).Contains("needs a target", StringComparison.Ordinal), "Missing target error: " + noTarget);
            Assert.True(!FakeProbe.TryParse("marker only-a-name", out FakeProbe? _, out string? noText), "A marker needs text");
            Assert.True(!FakeProbe.TryParse("   ", out FakeProbe? _, out string? _), "Empty text is refused");

            bool threw = false;
            try
            {
                new FakeProbe("format", "x", null);
            }
            catch (ArgumentException)
            {
                threw = true;
            }
            Assert.True(threw, "The constructor refuses unknown kinds");

            List<string> lines = FakeProbe.PromptLines("You are a test agent.\n\nprobe read /etc/hostname\r\n  Probe env HOME\nprobes are fun\nplease probe connect x:1\n");
            Assert.Equal(2, lines.Count, "Only lines starting with 'probe ' count");
            Assert.Equal("probe read /etc/hostname", lines[0], "First prompt probe");
            Assert.Equal("Probe env HOME", lines[1], "Second prompt probe");
            Assert.Equal(0, FakeProbe.PromptLines(null).Count, "A null prompt has no probes");
            return Task.CompletedTask;
        }

        private static Task OptionsAsync(CancellationToken token)
        {
            FakeOptions defaults = FakeOptions.Parse(new[] { "--format", "claude" });
            Assert.Equal(0, defaults.Probes.Count, "No probes by default");
            Assert.True(!defaults.ProbePrompt, "Prompt probes are off by default");
            Assert.Equal(3000, defaults.ProbeTimeoutMs, "Default probe timeout");

            FakeOptions options = FakeOptions.Parse(new[] { "--probe", "read /a", "--format", "plain", "--probe", "connect b:1", "--probe-prompt", "--probe-timeout-ms", "50" });
            Assert.Equal(2, options.Probes.Count, "--probe is repeatable");
            Assert.Equal("read /a", options.Probes[0], "First probe in order");
            Assert.Equal("connect b:1", options.Probes[1], "Second probe in order");
            Assert.True(options.ProbePrompt, "--probe-prompt");
            Assert.Equal(100, options.ProbeTimeoutMs, "The timeout is clamped to at least 100");
            Assert.Equal("plain", options.Format, "Other options still parse");
            Assert.Equal(60000, FakeOptions.Parse(new[] { "--probe-timeout-ms", "999999" }).ProbeTimeoutMs, "The timeout is clamped to at most 60000");
            return Task.CompletedTask;
        }

        private static Task LineFormatAsync(CancellationToken token)
        {
            FakeProbeResult allowed = new FakeProbeResult("read", "/a|b", FakeProbeOutcomeEnum.Allowed, "line one\nline|two\r\tend");
            Assert.Equal("PROBE|read|/a/b|ALLOWED|line one line/two  end", allowed.ToLine(), "Separators and line breaks are escaped");
            Assert.Equal(5, allowed.ToLine().Split('|').Length, "Exactly five fields");
            Assert.Equal("PROBE|connect|x:1|BLOCKED|", new FakeProbeResult("connect", "x:1", FakeProbeOutcomeEnum.Blocked, String.Empty).ToLine(), "Blocked, empty detail");
            Assert.True(new FakeProbeResult("hold", "1", FakeProbeOutcomeEnum.Done, "held").ToLine().Contains("|DONE|", StringComparison.Ordinal), "Done");
            Assert.True(new FakeProbeResult("x", "y", FakeProbeOutcomeEnum.Error, "bad").ToLine().Contains("|ERROR|", StringComparison.Ordinal), "Error");

            FakeProbeResult longer = new FakeProbeResult("read", "/f", FakeProbeOutcomeEnum.Blocked, new string('x', 1000));
            longer.MaxDetailChars = 20;
            Assert.Equal("PROBE|read|/f|BLOCKED|" + new string('x', 20), longer.ToLine(), "Detail is truncated");
            longer.MaxDetailChars = 1;
            Assert.Equal(16, longer.MaxDetailChars, "MaxDetailChars minimum");
            Assert.True(FakeProbeResult.LinePrefix == "PROBE|", "Line prefix");
            return Task.CompletedTask;
        }

        private static async Task FileProbesAsync(CancellationToken token)
        {
            string root = TempRoot();
            try
            {
                string runA = Path.Combine(root, "run_a", "work");
                Directory.CreateDirectory(runA);
                Directory.CreateDirectory(Path.Combine(root, "run_b", "work"));
                string secret = "marker-secret-" + Guid.NewGuid().ToString("N");
                File.WriteAllText(Path.Combine(runA, "isolation-marker.txt"), secret);

                FakeProber prober = new FakeProber();
                FakeProbeResult direct = await prober.RunTextAsync("read " + Path.Combine(runA, "isolation-marker.txt"), token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, direct.Outcome, "A readable file is ALLOWED: " + direct.ToLine());
                Assert.True(direct.Detail.Contains("read " + secret.Length + " bytes", StringComparison.Ordinal), "The size is reported: " + direct.Detail);
                Assert.True(!direct.ToLine().Contains(secret, StringComparison.Ordinal), "Contents are never reported");

                FakeProbeResult glob = await prober.RunTextAsync("probe read " + Path.Combine(root, "*", "work", "isolation-marker.txt"), token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, glob.Outcome, "A glob finds the other run's marker: " + glob.ToLine());
                Assert.True(glob.Detail.Contains(runA, StringComparison.Ordinal), "The matched path is named: " + glob.Detail);

                FakeProbeResult noMatch = await prober.RunTextAsync("read " + Path.Combine(root, "*", "work", "nothing-here"), token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, noMatch.Outcome, "No glob match is BLOCKED");
                Assert.Equal("no match", noMatch.Detail, "No match detail");

                FakeProbeResult missing = await prober.RunTextAsync("read " + Path.Combine(root, "missing.txt"), token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, missing.Outcome, "A missing file is BLOCKED");
                Assert.True(missing.Detail.Contains("FileNotFoundException", StringComparison.Ordinal), "The error names the exception: " + missing.Detail);

                FakeProbeResult directory = await prober.RunTextAsync("read " + runA, token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, directory.Outcome, "A directory is not a readable file");

                FakeProbeResult list = await prober.RunTextAsync("list " + root, token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, list.Outcome, "A listable directory is ALLOWED");
                Assert.Equal("2 entries: run_a, run_b", list.Detail, "Entries are named in order");

                FakeProbeResult listMissing = await prober.RunTextAsync("list " + Path.Combine(root, "nope"), token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, listMissing.Outcome, "A missing directory is BLOCKED");

                if (!OperatingSystem.IsWindows())
                {
                    string locked = Path.Combine(root, "locked.txt");
                    File.WriteAllText(locked, "x");
                    File.SetUnixFileMode(locked, UnixFileMode.None);
                    FakeProbeResult denied = await prober.RunTextAsync("read " + locked, token).ConfigureAwait(false);
                    bool root0 = String.Equals(Environment.UserName, "root", StringComparison.Ordinal);
                    if (!root0) Assert.Equal(FakeProbeOutcomeEnum.Blocked, denied.Outcome, "A mode 000 file is BLOCKED: " + denied.ToLine());
                    File.SetUnixFileMode(locked, UnixFileMode.UserRead | UnixFileMode.UserWrite);
                }
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static async Task EnvProbeAsync(CancellationToken token)
        {
            string name = "GARRISON_PROBE_TEST_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpperInvariant();
            string value = "value-" + Guid.NewGuid().ToString("N");
            Environment.SetEnvironmentVariable(name, value);
            try
            {
                FakeProber prober = new FakeProber();
                FakeProbeResult set = await prober.RunTextAsync("env " + name, token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, set.Outcome, "A set variable is ALLOWED");
                Assert.True(set.Detail.Contains(name, StringComparison.Ordinal) && !set.ToLine().Contains(value, StringComparison.Ordinal), "Named, value not shown: " + set.Detail);

                FakeProbeResult prefix = await prober.RunTextAsync("env GARRISON_PROBE_TEST_*", token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, prefix.Outcome, "A prefix matches");
                Assert.True(prefix.Detail.Contains(name, StringComparison.Ordinal), "The prefix match names the variable");

                FakeProbeResult unset = await prober.RunTextAsync("env " + name + "_NOT_SET", token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, unset.Outcome, "An unset variable is BLOCKED");
                Assert.Equal("not set", unset.Detail, "Unset detail");
            }
            finally
            {
                Environment.SetEnvironmentVariable(name, null);
            }
        }

        private static async Task NetworkProbesAsync(CancellationToken token)
        {
            FakeProber prober = new FakeProber();
            prober.TimeoutMs = 2000;

            TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int open = ((IPEndPoint)listener.LocalEndpoint).Port;
            try
            {
                Task accepted = AcceptAndCloseAsync(listener, token);
                FakeProbeResult connected = await prober.RunTextAsync("connect 127.0.0.1:" + open, token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, connected.Outcome, "An open port is ALLOWED: " + connected.ToLine());
                await accepted.ConfigureAwait(false);
            }
            finally
            {
                listener.Stop();
            }

            int closed = FreePort();
            FakeProbeResult refused = await prober.RunTextAsync("connect 127.0.0.1:" + closed, token).ConfigureAwait(false);
            Assert.Equal(FakeProbeOutcomeEnum.Blocked, refused.Outcome, "A closed port is BLOCKED: " + refused.ToLine());
            FakeProbeResult badTarget = await prober.RunTextAsync("connect no-port-here", token).ConfigureAwait(false);
            Assert.Equal(FakeProbeOutcomeEnum.Error, badTarget.Outcome, "A target without a port is an ERROR");
            FakeProbeResult badPort = await prober.RunTextAsync("connect 127.0.0.1:70000", token).ConfigureAwait(false);
            Assert.Equal(FakeProbeOutcomeEnum.Error, badPort.Outcome, "A port above 65535 is an ERROR");

            string root = TempRoot();
            try
            {
                string tokenValue = "sa-token-" + Guid.NewGuid().ToString("N");
                string tokenPath = Path.Combine(root, "token");
                File.WriteAllText(tokenPath, tokenValue + "\n");

                FakeProber anonymous = new FakeProber();
                anonymous.ServiceAccountTokenPath = Path.Combine(root, "no-token");
                ConcurrentQueue<string> anonymousHeaders = new ConcurrentQueue<string>();
                FakeProbeResult ok = await HttpProbeAsync(anonymous, "200 OK", anonymousHeaders, token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Allowed, ok.Outcome, "HTTP 200 is ALLOWED: " + ok.ToLine());
                Assert.True(ok.Detail.Contains("HTTP 200 anonymous", StringComparison.Ordinal), "Anonymous detail: " + ok.Detail);
                Assert.True(!anonymousHeaders.Any(h => h.StartsWith("authorization:", StringComparison.OrdinalIgnoreCase)), "No token, no Authorization header");

                FakeProber withToken = new FakeProber();
                withToken.ServiceAccountTokenPath = tokenPath;
                ConcurrentQueue<string> headers = new ConcurrentQueue<string>();
                FakeProbeResult forbidden = await HttpProbeAsync(withToken, "403 Forbidden", headers, token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, forbidden.Outcome, "HTTP 403 is BLOCKED: " + forbidden.ToLine());
                Assert.True(forbidden.Detail.Contains("HTTP 403 with the service account token", StringComparison.Ordinal), "Token detail: " + forbidden.Detail);
                Assert.True(headers.Any(h => String.Equals(h, "Authorization: Bearer " + tokenValue, StringComparison.OrdinalIgnoreCase)), "The mounted token is sent as a bearer token");
                Assert.True(!forbidden.ToLine().Contains(tokenValue, StringComparison.Ordinal), "The token is never shown");

                FakeProbeResult unreachable = await withToken.RunTextAsync("http http://127.0.0.1:" + closed + "/api", token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Blocked, unreachable.Outcome, "An unreachable URL is BLOCKED: " + unreachable.ToLine());
                FakeProbeResult notHttp = await withToken.RunTextAsync("http ftp://127.0.0.1/", token).ConfigureAwait(false);
                Assert.Equal(FakeProbeOutcomeEnum.Error, notHttp.Outcome, "A non-HTTP URL is an ERROR");
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static async Task HarnessAsync(CancellationToken token)
        {
            string root = TempRoot();
            try
            {
                string work = Path.Combine(root, "run_b", "work");
                Directory.CreateDirectory(work);
                string other = Path.Combine(root, "other", "work");
                Directory.CreateDirectory(other);
                File.WriteAllText(Path.Combine(other, "isolation-marker.txt"), "other run");
                string name = "GARRISON_PROBE_HARNESS_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpperInvariant();
                string secretValue = "hidden-" + Guid.NewGuid().ToString("N");

                ProcessRunRequest request = new ProcessRunRequest();
                request.Executable = DotnetHost();
                request.Arguments = new List<string> { FakeHarnessDll(), "--format", "plain", "--probe", "env " + name, "--probe-prompt", "--probe-timeout-ms", "1000" };
                request.WorkingDirectory = work;
                foreach (string variable in new[] { "PATH", "DOTNET_ROOT", "TMPDIR", "LANG", "HOME" })
                {
                    string? value = Environment.GetEnvironmentVariable(variable);
                    if (!String.IsNullOrEmpty(value)) request.Environment[variable] = value;
                }
                request.Environment[name] = secretValue;
                request.Stdin = "Task for the probe agent.\nprobe marker isolation-marker.txt run B marker\nprobe marker ../escape.txt nope\nprobe read " + Path.Combine(root, "*", "work", "isolation-marker.txt") + "\nprobe hold 5\nprobe nonsense here\nnot a probe line\n";
                request.TimeoutSeconds = 60;

                List<string> lines = new List<string>();
                ProcessRunResult result = await new ProcessRunner().RunAsync(request, line => { lock (lines) lines.Add(line); }, null, token).ConfigureAwait(false);
                Assert.Equal(0, result.ExitCode ?? -1, "The harness exits 0: " + result.StderrTail);

                List<string> answer;
                lock (lines) answer = lines.Where(l => l.StartsWith(FakeProbeResult.LinePrefix, StringComparison.Ordinal)).ToList();
                Assert.Equal(6, answer.Count, "One answer line per probe: " + String.Join(" / ", answer));
                Assert.True(answer[0].StartsWith("PROBE|env|" + name + "|ALLOWED|", StringComparison.Ordinal), "--probe runs first: " + answer[0]);
                Assert.True(answer[1].StartsWith("PROBE|marker|isolation-marker.txt|DONE|", StringComparison.Ordinal), "Marker written: " + answer[1]);
                Assert.True(answer[2].StartsWith("PROBE|marker|../escape.txt|ERROR|", StringComparison.Ordinal), "'../' refused: " + answer[2]);
                Assert.True(answer[3].StartsWith("PROBE|read|", StringComparison.Ordinal) && answer[3].Contains("|ALLOWED|", StringComparison.Ordinal) && answer[3].Contains("(2 matches)", StringComparison.Ordinal), "Glob read over both workspaces: " + answer[3]);
                Assert.True(answer[4].StartsWith("PROBE|hold|5|DONE|", StringComparison.Ordinal), "Hold: " + answer[4]);
                Assert.True(answer[5].StartsWith("PROBE|nonsense|here|ERROR|Unknown probe kind", StringComparison.Ordinal), "Unknown kind: " + answer[5]);
                lock (lines) Assert.True(!lines.Any(l => l.Contains(secretValue, StringComparison.Ordinal)), "No output line carries the variable's value");

                Assert.Equal("run B marker" + Environment.NewLine, File.ReadAllText(Path.Combine(work, "isolation-marker.txt")), "The marker is in the working directory");
                Assert.True(!File.Exists(Path.Combine(root, "run_b", "escape.txt")), "Nothing is written outside the working directory");
                Assert.Equal("other run", File.ReadAllText(Path.Combine(other, "isolation-marker.txt")), "The other workspace is untouched");
            }
            finally
            {
                Directory.Delete(root, true);
            }
        }

        private static async Task<FakeProbeResult> HttpProbeAsync(FakeProber prober, string status, ConcurrentQueue<string> headers, CancellationToken token)
        {
            TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            try
            {
                int port = ((IPEndPoint)listener.LocalEndpoint).Port;
                Task serve = ServeOnceAsync(listener, status, headers, token);
                FakeProbeResult result = await prober.RunTextAsync("http http://127.0.0.1:" + port + "/api/v1/namespaces/garrison/secrets", token).ConfigureAwait(false);
                await serve.ConfigureAwait(false);
                return result;
            }
            finally
            {
                listener.Stop();
            }
        }

        private static async Task ServeOnceAsync(TcpListener listener, string status, ConcurrentQueue<string> headers, CancellationToken token)
        {
            using (TcpClient client = await listener.AcceptTcpClientAsync(token).ConfigureAwait(false))
            using (NetworkStream stream = client.GetStream())
            using (StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true))
            {
                string? line;
                while (!String.IsNullOrEmpty(line = await reader.ReadLineAsync(token).ConfigureAwait(false))) headers.Enqueue(line);
                byte[] response = Encoding.ASCII.GetBytes("HTTP/1.1 " + status + "\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}");
                await stream.WriteAsync(response, 0, response.Length, token).ConfigureAwait(false);
                await stream.FlushAsync(token).ConfigureAwait(false);
            }
        }

        private static async Task AcceptAndCloseAsync(TcpListener listener, CancellationToken token)
        {
            using (TcpClient client = await listener.AcceptTcpClientAsync(token).ConfigureAwait(false))
            {
                client.Close();
            }
        }

        private static int FreePort()
        {
            TcpListener probe = new TcpListener(IPAddress.Loopback, 0);
            probe.Start();
            int port = ((IPEndPoint)probe.LocalEndpoint).Port;
            probe.Stop();
            return port;
        }

        private static string TempRoot()
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-probe-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);
            return root;
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

        #endregion
    }
}
