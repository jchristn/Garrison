namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using k8s;
    using k8s.Autorest;
    using k8s.Models;

    /// <summary>
    /// Deletes this worker's run Jobs for runs it no longer holds (plan D-033, P11.7): after a restart, the worker holds
    /// nothing, so every unfinished Job labelled with its node name is orphaned; the control plane requeues or fails
    /// those runs when their leases expire. Spec Secrets need no reconciliation: each is created after its Job with an
    /// owner reference to it, so Kubernetes garbage collects it with the Job (the worker is never granted list or get on
    /// Secrets). Finished Jobs are left to their TTL. Per-run egress NetworkPolicies (P11.15) are owned by their Job too,
    /// and are also deleted here once their run is no longer held, finished or not, because the executor deletes them
    /// when the run ends and one that remains was missed. Thread-safe.
    /// </summary>
    public class KubernetesJobReconciler
    {
        #region Private-Members

        private readonly KubernetesRuntime _Runtime;
        private readonly string _NodeName;
        private readonly Action<string>? _Log;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="runtime">Kubernetes runtime.</param>
        /// <param name="nodeName">This worker's node name.</param>
        /// <param name="log">Optional log callback.</param>
        /// <exception cref="ArgumentNullException">Thrown when runtime or nodeName is null.</exception>
        public KubernetesJobReconciler(KubernetesRuntime runtime, string nodeName, Action<string>? log = null)
        {
            _Runtime = runtime ?? throw new ArgumentNullException(nameof(runtime));
            _NodeName = nodeName ?? throw new ArgumentNullException(nameof(nodeName));
            _Log = log;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether an unfinished Job must be deleted: it belongs to a run and epoch this worker does not hold.
        /// </summary>
        /// <param name="job">Job.</param>
        /// <param name="held">Held runs as "runId/epoch" keys built with <see cref="Key"/>.</param>
        /// <returns>True to delete.</returns>
        /// <exception cref="ArgumentNullException">Thrown when job or held is null.</exception>
        public static bool IsOrphan(V1Job job, ISet<string> held)
        {
            if (job == null) throw new ArgumentNullException(nameof(job));
            if (held == null) throw new ArgumentNullException(nameof(held));
            if (Finished(job)) return false;
            string? runId = null;
            if (job.Metadata?.Annotations != null) job.Metadata.Annotations.TryGetValue(RunPodNames.RunIdLabel, out runId);
            if (String.IsNullOrEmpty(runId) && job.Metadata?.Labels != null) job.Metadata.Labels.TryGetValue(RunPodNames.RunIdLabel, out runId);
            string? epochText = null;
            if (job.Metadata?.Labels != null) job.Metadata.Labels.TryGetValue(RunPodNames.EpochLabel, out epochText);
            long epoch = Int64.TryParse(epochText, NumberStyles.Integer, CultureInfo.InvariantCulture, out long parsed) ? parsed : -1;
            return String.IsNullOrEmpty(runId) || !held.Contains(Key(runId, epoch));
        }

        /// <summary>
        /// Whether a run's egress NetworkPolicy must be deleted: it belongs to a run and epoch this worker does not hold.
        /// </summary>
        /// <param name="policy">Policy.</param>
        /// <param name="held">Held runs as "runId/epoch" keys built with <see cref="Key"/>.</param>
        /// <returns>True to delete.</returns>
        /// <exception cref="ArgumentNullException">Thrown when policy or held is null.</exception>
        public static bool IsOrphan(V1NetworkPolicy policy, ISet<string> held)
        {
            if (policy == null) throw new ArgumentNullException(nameof(policy));
            if (held == null) throw new ArgumentNullException(nameof(held));
            return !held.Contains(Key(RunIdOf(policy.Metadata), EpochOf(policy.Metadata)));
        }

        /// <summary>
        /// Key of a held run.
        /// </summary>
        /// <param name="runId">Run ID.</param>
        /// <param name="epoch">Lease epoch.</param>
        /// <returns>Key.</returns>
        public static string Key(string runId, long epoch)
        {
            return runId + "/" + epoch.ToString(CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Delete orphaned Jobs.
        /// </summary>
        /// <param name="heldRuns">Returns the runs this worker holds, as keys from <see cref="Key"/>. Called after the
        /// Jobs are listed, so a run launched meanwhile (added before its Job is created) is never mistaken for an orphan.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of Jobs deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when heldRuns is null.</exception>
        public async Task<int> ReconcileAsync(Func<ISet<string>> heldRuns, CancellationToken token)
        {
            if (heldRuns == null) throw new ArgumentNullException(nameof(heldRuns));
            IKubernetes? client = _Runtime.Client;
            if (client == null || !_Runtime.Available) return 0;
            string selector = RunPodNames.WorkerLabel + "=" + RunPodNames.LabelValue(_NodeName) + ",app.kubernetes.io/name=" + RunPodNames.AppName;
            int deleted = 0;
            try
            {
                V1JobList jobs = await client.BatchV1.ListNamespacedJobAsync(_Runtime.Namespace, labelSelector: selector, cancellationToken: token).ConfigureAwait(false);
                ISet<string> held = heldRuns();
                foreach (V1Job job in jobs.Items ?? new List<V1Job>())
                {
                    if (job.Metadata?.Name == null) continue;
                    if (!IsOrphan(job, held)) continue;
                    if (await _Runtime.DeleteJobAsync(job.Metadata.Name, token).ConfigureAwait(false))
                    {
                        deleted++;
                        _Log?.Invoke("reconciliation deleted orphaned job " + job.Metadata.Name + " (run not held by this worker)");
                    }
                }
            }
            catch (Exception e) when ((e is HttpOperationException || e is HttpRequestException) && !token.IsCancellationRequested)
            {
                _Log?.Invoke("job reconciliation failed: " + e.Message);
            }
            if (_Runtime.EgressAvailable)
            {
                try
                {
                    V1NetworkPolicyList policies = await client.NetworkingV1.ListNamespacedNetworkPolicyAsync(_Runtime.Namespace, labelSelector: selector, cancellationToken: token).ConfigureAwait(false);
                    ISet<string> held = heldRuns();
                    foreach (V1NetworkPolicy policy in policies.Items ?? new List<V1NetworkPolicy>())
                    {
                        if (policy.Metadata?.Name == null) continue;
                        if (!IsOrphan(policy, held)) continue;
                        if (await _Runtime.DeleteNetworkPolicyAsync(policy.Metadata.Name, token).ConfigureAwait(false))
                        {
                            deleted++;
                            _Log?.Invoke("reconciliation deleted orphaned network policy " + policy.Metadata.Name + " (run not held by this worker)");
                        }
                    }
                }
                catch (Exception e) when ((e is HttpOperationException || e is HttpRequestException) && !token.IsCancellationRequested)
                {
                    _Log?.Invoke("network policy reconciliation failed: " + e.Message);
                }
            }
            return deleted;
        }

        #endregion

        #region Private-Methods

        private static string RunIdOf(V1ObjectMeta? metadata)
        {
            string? runId = null;
            if (metadata?.Annotations != null) metadata.Annotations.TryGetValue(RunPodNames.RunIdLabel, out runId);
            if (String.IsNullOrEmpty(runId) && metadata?.Labels != null) metadata.Labels.TryGetValue(RunPodNames.RunIdLabel, out runId);
            return runId ?? String.Empty;
        }

        private static long EpochOf(V1ObjectMeta? metadata)
        {
            string? epochText = null;
            if (metadata?.Labels != null) metadata.Labels.TryGetValue(RunPodNames.EpochLabel, out epochText);
            return Int64.TryParse(epochText, NumberStyles.Integer, CultureInfo.InvariantCulture, out long parsed) ? parsed : -1;
        }

        private static bool Finished(V1Job job)
        {
            if (job.Status?.Conditions == null) return false;
            return job.Status.Conditions.Any(c => (c.Type == "Complete" || c.Type == "Failed") && c.Status == "True");
        }

        #endregion
    }
}
