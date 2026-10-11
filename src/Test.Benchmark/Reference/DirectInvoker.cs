namespace Garrison.Benchmark.Reference
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// The reference arm and floor: runs the fake harness directly, the way a script would without Garrison, with the
    /// same arguments and the same prompt on stdin. The difference between a Garrison run and this is what Garrison
    /// adds per run (queueing, compiling, leasing, workspace preparation, event shipping, completion). Thread-safe.
    /// </summary>
    public class DirectInvoker
    {
        #region Public-Members

        /// <summary>
        /// Full path of garrison-fake-harness.dll.
        /// </summary>
        public string HarnessDll
        {
            get
            {
                return _HarnessDll;
            }
        }

        /// <summary>
        /// The dotnet executable that hosts the harness. Default dotnet (from PATH).
        /// </summary>
        public string Dotnet { get; set; } = "dotnet";

        #endregion

        #region Private-Members

        private readonly string _HarnessDll;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="harnessDll">Path of garrison-fake-harness.dll.</param>
        /// <exception cref="FileNotFoundException">Thrown when the assembly does not exist.</exception>
        public DirectInvoker(string harnessDll)
        {
            if (String.IsNullOrEmpty(harnessDll) || !File.Exists(harnessDll)) throw new FileNotFoundException("The fake harness assembly was not found at '" + harnessDll + "'. Build src/Garrison.FakeHarness or pass --fake-harness <path to garrison-fake-harness.dll>.", harnessDll);
            _HarnessDll = Path.GetFullPath(harnessDll);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Find garrison-fake-harness.dll: the given path, else the newest net10.0 build under the repository.
        /// </summary>
        /// <param name="root">Repository root.</param>
        /// <param name="given">Path from --fake-harness, or null.</param>
        /// <returns>Path, or null when none was found.</returns>
        /// <exception cref="ArgumentNullException">Thrown when root is null.</exception>
        public static string? Locate(string root, string? given)
        {
            if (root == null) throw new ArgumentNullException(nameof(root));
            if (!String.IsNullOrEmpty(given)) return File.Exists(given) ? Path.GetFullPath(given) : null;
            List<string> candidates = new List<string>
            {
                Path.Combine(root, "benchmarks", ".run", "build", "bin", "Garrison.FakeHarness", "release_net10.0", "garrison-fake-harness.dll"),
                Path.Combine(root, "src", "Garrison.FakeHarness", "bin", "Release", "net10.0", "garrison-fake-harness.dll"),
                Path.Combine(root, "src", "Garrison.FakeHarness", "bin", "Debug", "net10.0", "garrison-fake-harness.dll"),
            };
            return candidates.Where(File.Exists).OrderByDescending(File.GetLastWriteTimeUtc).FirstOrDefault();
        }

        /// <summary>
        /// Run the harness once.
        /// </summary>
        /// <param name="arguments">Harness arguments, for example --format claude.</param>
        /// <param name="prompt">Prompt written to stdin.</param>
        /// <param name="timeoutMs">Timeout in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when arguments or prompt is null.</exception>
        public async Task<DirectResult> RunAsync(IEnumerable<string> arguments, string prompt, int timeoutMs, CancellationToken token)
        {
            if (arguments == null) throw new ArgumentNullException(nameof(arguments));
            if (prompt == null) throw new ArgumentNullException(nameof(prompt));
            List<string> all = new List<string> { _HarnessDll };
            all.AddRange(arguments);
            string workDirectory = Path.Combine(Path.GetTempPath(), "garrison-bench-direct");
            string home = Path.Combine(workDirectory, "home");
            Directory.CreateDirectory(home);
            // An isolated home, like the worker's isolateHome, so session files never land in the operator's home.
            Dictionary<string, string> environment = new Dictionary<string, string> { { "HOME", home }, { "USERPROFILE", home } };
            ProcessResult process = await ExternalProcess.RunAsync(Dotnet, all, prompt, workDirectory, timeoutMs, token, environment).ConfigureAwait(false);
            DirectResult result = new DirectResult();
            result.ElapsedMs = process.ElapsedMs;
            result.ExitCode = process.ExitCode;
            if (process.StartError != null) result.Error = process.StartError;
            else if (process.TimedOut) result.Error = "timed out after " + timeoutMs + " ms";

            bool plain = arguments.Contains("plain");
            if (plain)
            {
                result.ResultText = process.Stdout.Trim();
                return result;
            }
            System.Text.StringBuilder muxText = new System.Text.StringBuilder();
            bool sawMux = false;
            foreach (string line in process.Stdout.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                string trimmed = line.Trim();
                if (!trimmed.StartsWith('{')) continue;
                HarnessOutputLine? parsed = null;
                try
                {
                    parsed = JsonSerializer.Deserialize<HarnessOutputLine>(trimmed, JsonDefaults.Compact);
                }
                catch (JsonException)
                {
                }
                if (parsed == null) continue;
                if (parsed.Type == "result")
                {
                    result.ResultText = parsed.Result;
                    result.IsError = parsed.IsError;
                }
                else if (parsed.Type == "item.completed" && parsed.Item != null && parsed.Item.Type == "agent_message")
                {
                    result.ResultText = parsed.Item.Text;
                }
                else if (parsed.Type == "turn.failed")
                {
                    result.IsError = true;
                }
                else if (parsed.EventType == "assistant_text")
                {
                    muxText.Append(parsed.Text);
                    sawMux = true;
                }
                else if (parsed.EventType == "run_completed")
                {
                    if (parsed.Status != "completed") result.IsError = true;
                    if (sawMux) result.ResultText = muxText.ToString().Trim();
                }
            }
            return result;
        }

        #endregion
    }
}
