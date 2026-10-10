namespace Garrison.Harnesses.Probing
{
    using System;
    using System.Collections.Generic;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Harnesses.Execution;

    /// <summary>
    /// Runs a harness version probe (for example claude --version) that spends no tokens and reports a capability.
    /// Thread-safe.
    /// </summary>
    public class HarnessProbe
    {
        #region Public-Members

        /// <summary>
        /// Probe timeout in seconds. Minimum 1, maximum 300, default 20.
        /// </summary>
        public int TimeoutSeconds
        {
            get
            {
                return _TimeoutSeconds;
            }
            set
            {
                _TimeoutSeconds = Math.Clamp(value, 1, 300);
            }
        }

        #endregion

        #region Private-Members

        private static readonly Regex _Version = new Regex(@"\d+\.\d+(\.\d+)?([-+.][0-9A-Za-z.]+)?", RegexOptions.Compiled);
        private readonly ProcessRunner _Runner = new ProcessRunner();
        private int _TimeoutSeconds = 20;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Probe a harness.
        /// </summary>
        /// <param name="harnessType">Harness type.</param>
        /// <param name="executable">Executable.</param>
        /// <param name="arguments">Probe arguments, for example --version.</param>
        /// <param name="environment">Environment for the probe.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Capability report.</returns>
        public async Task<NodeCapabilityReport> ProbeAsync(HarnessTypeEnum harnessType, string executable, List<string> arguments, Dictionary<string, string> environment, CancellationToken token = default)
        {
            NodeCapabilityReport report = new NodeCapabilityReport();
            report.HarnessType = harnessType;
            report.Executable = executable;

            ProcessRunRequest request = new ProcessRunRequest();
            request.Executable = executable;
            request.Arguments = arguments ?? new List<string>();
            request.Environment = environment ?? new Dictionary<string, string>();
            request.WorkingDirectory = Environment.CurrentDirectory;
            request.TimeoutSeconds = _TimeoutSeconds;
            request.KillGraceSeconds = 0;
            request.MaxOutputBytes = 65536;
            request.StderrTailBytes = 2000;

            List<string> lines = new List<string>();
            ProcessRunResult result = await _Runner.RunAsync(request, line => lines.Add(line), null, token).ConfigureAwait(false);
            string output = String.Join("\n", lines).Trim();

            if (result.NotInstalled)
            {
                report.Available = false;
                report.Detail = "not installed";
                return report;
            }
            if (result.TimedOut || result.ExitCode != 0)
            {
                report.Available = false;
                report.Detail = result.TimedOut ? "probe timed out" : ("probe exited with " + result.ExitCode + ": " + Truncate(result.StderrTail.Trim(), 200));
                return report;
            }

            Match match = _Version.Match(output);
            report.Version = match.Success ? match.Value : Truncate(output, 64);
            report.Available = true;
            report.Detail = Truncate(output, 200);
            return report;
        }

        #endregion

        #region Private-Methods

        private static string Truncate(string text, int max)
        {
            return text.Length <= max ? text : text.Substring(0, max);
        }

        #endregion
    }
}
