namespace Garrison.Worker.Hosting
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Harnesses.Probing;
    using Garrison.Worker.Settings;

    /// <summary>
    /// Probes every configured harness in parallel without spending tokens. Thread-safe.
    /// </summary>
    public class CapabilityProber
    {
        #region Private-Members

        private readonly WorkerSettings _Settings;
        private readonly HarnessProbe _Probe = new HarnessProbe();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Worker settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public CapabilityProber(WorkerSettings settings)
        {
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Probe all harnesses.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Capabilities in configured order.</returns>
        public async Task<List<NodeCapabilityReport>> ProbeAllAsync(CancellationToken token)
        {
            Dictionary<string, string> environment = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (string name in _Settings.EnvironmentAllowlist)
            {
                string? value = Environment.GetEnvironmentVariable(name);
                if (!String.IsNullOrEmpty(value)) environment[name] = value;
            }
            string? home = Environment.GetEnvironmentVariable("HOME");
            if (!String.IsNullOrEmpty(home)) environment["HOME"] = home;

            List<Task<NodeCapabilityReport>> tasks = _Settings.Probes
                .Where(p => !String.IsNullOrEmpty(p.Executable))
                .Select(p => _Probe.ProbeAsync(p.HarnessType, p.Executable, new List<string>(p.Arguments), environment, token))
                .ToList();
            NodeCapabilityReport[] reports = await Task.WhenAll(tasks).ConfigureAwait(false);
            return reports.ToList();
        }

        /// <summary>
        /// Labels advertising available harnesses (garrison.io/harness-&lt;label&gt;=true).
        /// </summary>
        /// <param name="capabilities">Capabilities from <see cref="ProbeAllAsync"/>.</param>
        /// <returns>Labels.</returns>
        public Dictionary<string, string> CapabilityLabels(List<NodeCapabilityReport> capabilities)
        {
            Dictionary<string, string> labels = new Dictionary<string, string>(StringComparer.Ordinal);
            for (int i = 0; i < capabilities.Count; i++)
            {
                HarnessProbeSettings? probe = _Settings.Probes.FirstOrDefault(p => p.HarnessType == capabilities[i].HarnessType && p.Executable == capabilities[i].Executable);
                if (probe == null || String.IsNullOrEmpty(probe.Label) || !capabilities[i].Available) continue;
                labels["garrison.io/harness-" + probe.Label] = "true";
            }
            return labels;
        }

        #endregion
    }
}
