namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Globalization;
    using System.Security.Cryptography;
    using System.Text;

    /// <summary>
    /// Names and labels of run Jobs, pods, and spec Secrets (plan D-033). Stateless and thread-safe.
    /// </summary>
    public static class RunPodNames
    {
        #region Public-Members

        /// <summary>
        /// Label holding the run ID.
        /// </summary>
        public static readonly string RunIdLabel = "garrison.io/run-id";

        /// <summary>
        /// Label holding the name of the worker node that created the Job.
        /// </summary>
        public static readonly string WorkerLabel = "garrison.io/worker";

        /// <summary>
        /// Label holding the run's tenant ID.
        /// </summary>
        public static readonly string TenantLabel = "garrison.io/tenant";

        /// <summary>
        /// Label holding the lease epoch the Job was created for.
        /// </summary>
        public static readonly string EpochLabel = "garrison.io/epoch";

        /// <summary>
        /// Label marking a run pod whose deployment has an egress allowlist (P11.15). The garrison-run-default-egress
        /// NetworkPolicy selects only run pods without it, so the default HTTPS-to-anywhere rule never applies to them.
        /// </summary>
        public static readonly string EgressLabel = "garrison.io/egress";

        /// <summary>
        /// Value of <see cref="EgressLabel"/> on allowlisted run pods.
        /// </summary>
        public static readonly string EgressAllowlistValue = "allowlist";

        /// <summary>
        /// Value of app.kubernetes.io/name on run pods; the run NetworkPolicy selects it.
        /// </summary>
        public static readonly string AppName = "garrison-run";

        /// <summary>
        /// Name of the run container.
        /// </summary>
        public static readonly string ContainerName = "run";

        /// <summary>
        /// Key of the envelope in the spec Secret.
        /// </summary>
        public static readonly string SpecKey = "spec.json";

        /// <summary>
        /// Directory where the spec Secret is mounted.
        /// </summary>
        public static readonly string SpecDirectory = "/run/garrison";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Job name for a run and lease epoch: garrison-run-&lt;run id slug&gt;-&lt;hash&gt;-&lt;epoch&gt;, at most 63
        /// characters, lowercase. The hash keeps names unique when run IDs differ only in case.
        /// </summary>
        /// <param name="runId">Run ID.</param>
        /// <param name="epoch">Lease epoch.</param>
        /// <returns>Name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runId is null or empty.</exception>
        public static string JobName(string runId, long epoch)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            StringBuilder slug = new StringBuilder();
            foreach (char c in runId.ToLowerInvariant())
            {
                if (slug.Length >= 24) break;
                slug.Append((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ? c : '-');
            }
            string hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(runId))).Substring(0, 8).ToLowerInvariant();
            string name = "garrison-run-" + slug.ToString().Trim('-') + "-" + hash + "-" + Math.Max(0, epoch).ToString(CultureInfo.InvariantCulture);
            return name.Length > 63 ? name.Substring(0, 63).TrimEnd('-') : name;
        }

        /// <summary>
        /// Spec Secret name for a Job.
        /// </summary>
        /// <param name="jobName">Job name.</param>
        /// <returns>Name.</returns>
        public static string SecretName(string jobName)
        {
            return jobName + "-spec";
        }

        /// <summary>
        /// Name of the per-run egress NetworkPolicy of a Job (P11.15).
        /// </summary>
        /// <param name="jobName">Job name.</param>
        /// <returns>Name.</returns>
        public static string NetworkPolicyName(string jobName)
        {
            return jobName + "-egress";
        }

        /// <summary>
        /// Make a value safe for a label: at most 63 characters of letters, digits, '-', '_' and '.', starting and ending
        /// with a letter or digit. Empty input yields "none".
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>Label value.</returns>
        public static string LabelValue(string? value)
        {
            if (String.IsNullOrEmpty(value)) return "none";
            StringBuilder builder = new StringBuilder();
            foreach (char c in value)
            {
                if (builder.Length >= 63) break;
                bool ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.';
                builder.Append(ok ? c : '-');
            }
            string result = builder.ToString().Trim('-', '_', '.');
            return result.Length == 0 ? "none" : result;
        }

        #endregion
    }
}
