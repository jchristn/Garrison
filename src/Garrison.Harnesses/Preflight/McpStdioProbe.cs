namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Harnesses.Execution;

    /// <summary>Single-use worker-local stdio handshake and tool listing with bounded output and process-tree cleanup. Thread-safe.</summary>
    public class McpStdioProbe
    {
        /// <summary>Maximum stdout bytes. Default 1 MiB; range 4096 to 16 MiB.</summary>
        public long MaxOutputBytes { get { return _MaxOutputBytes; } set { _MaxOutputBytes = Math.Clamp(value, 4096, 16L * 1024 * 1024); } }
        /// <summary>Maximum tools/list pages. Default 50; range 1 to 1000.</summary>
        public int MaxPages { get { return _MaxPages; } set { _MaxPages = Math.Clamp(value, 1, 1000); } }
        /// <summary>Maximum unique tool names. Default 1000; range 1 to 10000.</summary>
        public int MaxTools { get { return _MaxTools; } set { _MaxTools = Math.Clamp(value, 1, 10000); } }
        private long _MaxOutputBytes = 1024 * 1024;
        private int _MaxPages = 50;
        private int _MaxTools = 1000;

        /// <summary>Run initialize and tools/list; no tool is invoked. Caller owns the temporary working directory.</summary>
        /// <param name="test">Compiled diagnostic.</param>
        /// <param name="workingDirectory">Private diagnostic working directory.</param>
        /// <param name="baseEnvironment">Allowlisted worker environment, without worker credentials.</param>
        /// <param name="token">Host cancellation.</param>
        /// <returns>Safe result without stderr or provider payloads.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<McpServerTestResponse> TestAsync(McpWorkerTest test, string workingDirectory, Dictionary<string, string> baseEnvironment, CancellationToken token = default)
        {
            if (test == null) throw new ArgumentNullException(nameof(test));
            if (workingDirectory == null) throw new ArgumentNullException(nameof(workingDirectory));
            if (baseEnvironment == null) throw new ArgumentNullException(nameof(baseEnvironment));
            token.ThrowIfCancellationRequested();
            Stopwatch watch = Stopwatch.StartNew();
            McpServerTestResponse response = new McpServerTestResponse();
            if (test.ExpiresUtc <= DateTime.UtcNow) { response.Error = "MCP diagnostic expired before execution."; return response; }
            using (CancellationTokenSource stop = new CancellationTokenSource())
            using (CancellationTokenSource deadline = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                deadline.CancelAfter(TimeSpan.FromMilliseconds(Math.Max(1, Math.Min(test.TimeoutMs, (test.ExpiresUtc - DateTime.UtcNow).TotalMilliseconds))));
                McpProbeDriver driver = new McpProbeDriver(stop, MaxPages, MaxTools);
                ProcessRunRequest request = new ProcessRunRequest
                {
                    Executable = test.Command, Arguments = new List<string>(test.Arguments), Environment = new Dictionary<string, string>(baseEnvironment),
                    WorkingDirectory = workingDirectory, StdinDriver = driver, StopToken = stop.Token,
                    MaxOutputBytes = MaxOutputBytes, TimeoutSeconds = (int)Math.Ceiling(test.TimeoutMs / 1000.0), KillGraceSeconds = 1, StderrTailBytes = 0
                };
                request.Environment["HOME"] = workingDirectory;
                request.Environment["USERPROFILE"] = workingDirectory;
                foreach (ExecutionEnvironmentVariable variable in test.Environment) request.Environment[variable.Name] = variable.Value;
                try
                {
                    ProcessRunResult process = await new ProcessRunner().RunAsync(request, driver.Accept, null, deadline.Token).ConfigureAwait(false);
                    token.ThrowIfCancellationRequested();
                    response.Tools = driver.Tools;
                    response.ToolDetails = driver.ToolDetails;
                    response.MissingRequiredTools = test.RequiredTools.Where(name => !response.Tools.Contains(name, StringComparer.Ordinal)).ToList();
                    response.Success = driver.Success && response.MissingRequiredTools.Count == 0;
                    if (!response.Success) response.Error = driver.Error ?? (deadline.IsCancellationRequested || process.TimedOut ? "MCP diagnostic timed out." : process.OutputLimitExceeded ? "MCP diagnostic exceeded its output limit." : driver.Success ? "Required tools are missing." : "MCP server did not complete the diagnostic exchange.");
                }
                catch (Exception ex) when (ex is IOException || ex is System.ComponentModel.Win32Exception || ex is UnauthorizedAccessException || ex is InvalidOperationException)
                {
                    response.Error = "MCP diagnostic could not launch or communicate: " + ex.GetType().Name + ".";
                }
            }
            response.DurationMs = watch.ElapsedMilliseconds;
            return response;
        }
    }
}
