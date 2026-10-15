namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
        using System.Globalization;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Worker.Settings;
    using k8s;
    using k8s.Autorest;
    using k8s.Models;

    /// <summary>
    /// Shared per-pool/image idle stock. A Kubernetes Lease fences refills and resource-version reservation assigns
    /// each ready Pod once. No run spec or credential is stored in an idle pod. All consumption ends with deletion.
    /// </summary>
    public class KubernetesWarmPool : IDisposable
    {
        /// <summary>Whether this worker may use the pool.</summary>
        public bool Available { get { return _Runtime.WarmAvailable; } }

        /// <summary>Direct mutating Kubernetes API requests, excluding log/status reads and attach transport.</summary>
        public long ApiWrites { get { return Interlocked.Read(ref _ApiWrites); } }

        /// <summary>Pods successfully consumed by this worker.</summary>
        public long Consumed { get { return Interlocked.Read(ref _Consumed); } }

        /// <summary>Shared pool/image identity; configuration differences use separate stocks.</summary>
        public string Group
        {
            get
            {
                string key = _Pool + "\n" + _Runtime.Image + "\n" + _Runtime.Namespace + "\n" + _Runtime.Settings.PodDataPath + "\n" + _Runtime.Settings.RuntimeClassName + "\n" + Serializer.Serialize(_Runtime.Settings.DefaultResources) + "\n"
                    + Serializer.Serialize(_Settings) + "\n" + _Runtime.Settings.ServiceAccountName + "\n" + _Runtime.ImagePullPolicy + "\n" + Serializer.Serialize(_Runtime.ImagePullSecrets) + "\n" + Serializer.Serialize(_Runtime.Settings.PodLabels) + "\n"
                    + String.Join(";", _Runtime.Settings.NodeSelector.OrderBy(p => p.Key).Select(p => p.Key + "=" + p.Value));
                return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key))).ToLowerInvariant().Substring(0, 24);
            }
        }

        private readonly KubernetesRuntime _Runtime;
        private readonly WarmPodSettings _Settings;
        private readonly RunPodManifestBuilder _Builder;
        private readonly string _Pool;
        private readonly string _Worker;
        private readonly string _Instance;
        private readonly Action<string>? _Log;
        private readonly SemaphoreSlim _Refill = new SemaphoreSlim(1, 1);
        private readonly Queue<DateTime> _Arrivals = new Queue<DateTime>();
        private readonly object _ArrivalLock = new object();
        private int _Queued;
        private long _ApiWrites;
        private long _Consumed;
        private bool _Disposed;
        private readonly Func<HashSet<string>>? _Active;

        /// <summary>Construct a shared stock manager.</summary>
        /// <param name="runtime">Initialized runtime, or one that will initialize before use.</param>
        /// <param name="pool">Worker pool name.</param>
        /// <param name="worker">Worker node name.</param>
        /// <param name="log">Optional safe diagnostic logger.</param>
        /// <param name="active">Current run/epoch keys held by this worker, for orphan recovery.</param>
        public KubernetesWarmPool(KubernetesRuntime runtime, string? pool, string worker, Action<string>? log = null, Func<HashSet<string>>? active = null)
        {
            _Runtime = runtime ?? throw new ArgumentNullException(nameof(runtime));
            _Settings = runtime.Settings.WarmPods;
            _Builder = new RunPodManifestBuilder(runtime.Settings);
            _Pool = pool ?? "default";
            _Worker = worker ?? throw new ArgumentNullException(nameof(worker));
            _Instance = worker + "-" + Guid.NewGuid().ToString("N").Substring(0, 12);
            _Log = log;
            _Active = active;
        }

        /// <summary>Observe eligible queue pressure without storing tenant data.</summary>
        /// <param name="queued">Bounded eligible queue estimate.</param>
        public void ObserveQueue(int queued) { Volatile.Write(ref _Queued, Math.Clamp(queued, 0, 500)); }

        /// <summary>Observe a Kubernetes assignment for adaptive refill.</summary>
        public void ObserveArrival()
        {
            lock (_ArrivalLock)
            {
                _Arrivals.Enqueue(DateTime.UtcNow);
                while (_Arrivals.Count > 4096) _Arrivals.Dequeue();
            }
        }

        /// <summary>Whether the precreated pod layout can execute this spec without altering isolation or resources.
        /// Runs with an egress allowlist (P11.15) are never compatible: a warm pod already runs under the default run
        /// egress, and relabeling it would leave a window in which the harness could reach the default destinations
        /// before the policy controller reprograms the pod, a window the egress canary cannot detect.</summary>
        /// <param name="spec">Spec.</param>
        /// <returns>Whether default warm layout is compatible.</returns>
        public static bool Compatible(ExecutionSpec spec)
        {
            return spec.Workspace.Kind != WorkspaceKindEnum.PersistentVolume && (spec.PodResources == null || spec.PodResources.IsEmpty) && spec.EgressRules.Count == 0;
        }

        /// <summary>Reserve one ready pod using a resource-version compare-and-set.</summary>
        /// <param name="assignment">Run.</param>
        /// <param name="required">Wait for Warm support rather than falling back cold.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Reserved pod, or null when ordinary work should take the cold path.</returns>
        public async Task<V1Pod?> TakeAsync(RunAssignment assignment, bool required, CancellationToken token)
        {
            if (!Available || !Compatible(assignment.Spec ?? new ExecutionSpec())) return null;
            DateTime deadline = DateTime.UtcNow.AddSeconds(_Runtime.Settings.PendingTimeoutSeconds);
            while (true)
            {
                V1PodList list = await Client().CoreV1.ListNamespacedPodAsync(_Runtime.Namespace, labelSelector: Selector(), cancellationToken: token).ConfigureAwait(false);
                foreach (V1Pod pod in list.Items.Where(Ready))
                {
                    pod.Metadata.Labels["garrison.io/warm-state"] = "claimed";
                    pod.Metadata.Labels[RunPodNames.RunIdLabel] = RunPodNames.LabelValue(assignment.RunId);
                    pod.Metadata.Labels[RunPodNames.WorkerLabel] = RunPodNames.LabelValue(_Worker);
                    pod.Metadata.Labels[RunPodNames.EpochLabel] = assignment.Epoch.ToString(CultureInfo.InvariantCulture);
                    pod.Metadata.Annotations ??= new Dictionary<string, string>();
                    pod.Metadata.Annotations["garrison.io/run-id"] = assignment.RunId;
                    pod.Metadata.Annotations["garrison.io/epoch"] = assignment.Epoch.ToString(CultureInfo.InvariantCulture);
                    SetOwner(pod);
                    pod.Metadata.Annotations["garrison.io/claimed-utc"] = DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture);
                    try
                    {
                        V1Pod reserved = await Client().CoreV1.ReplaceNamespacedPodAsync(pod, pod.Metadata.Name, _Runtime.Namespace, cancellationToken: token).ConfigureAwait(false);
                        Interlocked.Increment(ref _ApiWrites);
                        Interlocked.Increment(ref _Consumed);
                        return reserved;
                    }
                    catch (HttpOperationException ex) when (ex.Response.StatusCode == HttpStatusCode.Conflict || ex.Response.StatusCode == HttpStatusCode.NotFound) { }
                }
                if (!required || DateTime.UtcNow >= deadline) return null;
                ObserveQueue(Math.Max(1, Volatile.Read(ref _Queued)));
                await ReconcileAsync(token).ConfigureAwait(false);
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        /// <summary>Reconcile bounded shared idle stock while holding the pool's Kubernetes coordination Lease.</summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task ReconcileAsync(CancellationToken token)
        {
            if (!Available) return;
            await _Refill.WaitAsync(token).ConfigureAwait(false);
            try
            {
                V1PodList list = await Client().CoreV1.ListNamespacedPodAsync(_Runtime.Namespace, labelSelector: Selector(), cancellationToken: token).ConfigureAwait(false);
                HashSet<string>? active = _Active?.Invoke();
                foreach (V1Pod pod in list.Items.Where(p => p.Metadata.DeletionTimestamp == null && !Idle(p) && active != null
                    && p.Metadata.Labels.TryGetValue(RunPodNames.WorkerLabel, out string? owner) && owner == RunPodNames.LabelValue(_Worker)))
                {
                    IDictionary<string, string> annotations = pod.Metadata.Annotations ?? new Dictionary<string, string>();
                    if (annotations.TryGetValue("garrison.io/run-id", out string? runId) && annotations.TryGetValue("garrison.io/epoch", out string? epoch)
                        && Int64.TryParse(epoch, out long value) && !active!.Contains(KubernetesJobReconciler.Key(runId, value)))
                        await DeleteAsync(pod.Metadata.Name, token).ConfigureAwait(false);
                }
                if (!await OwnLeaseAsync(token).ConfigureAwait(false)) return;
                foreach (V1Pod pod in list.Items.Where(p => (p.Status?.Phase == "Failed" || p.Status?.Phase == "Succeeded") && (Idle(p) || OldClaim(p))))
                    await DeleteAsync(pod.Metadata.Name, token).ConfigureAwait(false);
                List<V1Pod> idle = list.Items.Where(p => Idle(p) && p.Status?.Phase != "Failed" && p.Status?.Phase != "Succeeded").OrderBy(p => p.Metadata.CreationTimestamp).ToList();
                int desired = WarmPodSizing.Desired(_Settings, Volatile.Read(ref _Queued), ArrivalRate());
                while (idle.Count > desired)
                {
                    V1Pod pod = idle[0];
                    idle.RemoveAt(0);
                    // A reservation changes resourceVersion. Preconditions prevent deleting a just-claimed idle pod.
                    await DeleteIdleAsync(pod, token).ConfigureAwait(false);
                }
                for (int i = idle.Count; i < desired; i++)
                {
                    if (!await OwnLeaseAsync(token).ConfigureAwait(false)) break;
                    ExecutionSpec spec = new ExecutionSpec { RunId = "run_warm_" + Guid.NewGuid().ToString("N"), Executor = RunExecutorEnum.KubernetesJob, TimeoutSeconds = 60 };
                    RunPodRequest request = new RunPodRequest
                    {
                        Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec }, NodeName = _Worker,
                        Namespace = _Runtime.Namespace, Image = _Runtime.Image!, ImagePullPolicy = _Runtime.ImagePullPolicy,
                        ImagePullSecrets = new List<string>(_Runtime.ImagePullSecrets)
                    };
                    V1Pod warm = _Builder.BuildWarmPod(request, Group);
                    SetOwner(warm);
                    await Client().CoreV1.CreateNamespacedPodAsync(warm, _Runtime.Namespace, cancellationToken: token).ConfigureAwait(false);
                    Interlocked.Increment(ref _ApiWrites);
                }
            }
            finally { _Refill.Release(); }
        }

        /// <summary>Run the refill loop; transient API failures do not terminate worker leasing.</summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task RunAsync(CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try { await ReconcileAsync(token).ConfigureAwait(false); }
                catch (Exception ex) when (ex is HttpOperationException || ex is HttpRequestException)
                { _Log?.Invoke("warm pool reconcile failed: " + ex.GetType().Name); }
                await Task.Delay(TimeSpan.FromSeconds(_Settings.ReconcileIntervalSeconds), token).ConfigureAwait(false);
            }
        }

        /// <summary>Delete a consumed pod. It never returns to idle stock.</summary>
        /// <param name="name">Pod name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string name, CancellationToken token)
        {
            try
            {
                await Client().CoreV1.DeleteNamespacedPodAsync(name, _Runtime.Namespace, body: new V1DeleteOptions { GracePeriodSeconds = 10 }, cancellationToken: token).ConfigureAwait(false);
                Interlocked.Increment(ref _ApiWrites);
            }
            catch (HttpOperationException ex) when (ex.Response.StatusCode == HttpStatusCode.NotFound) { }
        }

        /// <summary>Dispose managed resources after the worker has stopped its loops.</summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>Release the manager's semaphore.</summary>
        /// <param name="disposing">Whether managed resources are being released.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _Refill.Dispose();
            _Disposed = true;
        }

        private void SetOwner(V1Pod pod)
        {
            if (String.IsNullOrEmpty(_Runtime.WorkerPodUid)) return;
            pod.Metadata.OwnerReferences = new List<V1OwnerReference>
            {
                new V1OwnerReference { ApiVersion = "v1", Kind = "Pod", Name = _Worker, Uid = _Runtime.WorkerPodUid, Controller = false, BlockOwnerDeletion = false }
            };
        }

        private static bool OldClaim(V1Pod pod)
        {
            return pod.Metadata.Annotations != null && pod.Metadata.Annotations.TryGetValue("garrison.io/claimed-utc", out string? time)
                && DateTime.TryParse(time, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime claimed)
                && claimed.AddMinutes(3) < DateTime.UtcNow;
        }

        private IKubernetes Client() { return _Runtime.Client ?? throw new InvalidOperationException("Kubernetes is not initialized."); }
        private string Selector() { return "garrison.io/warm-group=" + Group; }
        private static bool Idle(V1Pod pod) { return pod.Metadata.DeletionTimestamp == null && pod.Metadata.Labels.TryGetValue("garrison.io/warm-state", out string? state) && state == "idle"; }
        private static bool Ready(V1Pod pod) { return Idle(pod) && pod.Status?.Phase == "Running" && pod.Status.Conditions?.Any(c => c.Type == "Ready" && c.Status == "True") == true; }

        private double ArrivalRate()
        {
            lock (_ArrivalLock)
            {
                DateTime cutoff = DateTime.UtcNow.AddSeconds(-30);
                while (_Arrivals.Count > 0 && _Arrivals.Peek() < cutoff) _Arrivals.Dequeue();
                return _Arrivals.Count / 30.0;
            }
        }

        private async Task DeleteIdleAsync(V1Pod pod, CancellationToken token)
        {
            try
            {
                await Client().CoreV1.DeleteNamespacedPodAsync(pod.Metadata.Name, _Runtime.Namespace,
                    body: new V1DeleteOptions { Preconditions = new V1Preconditions { Uid = pod.Metadata.Uid, ResourceVersion = pod.Metadata.ResourceVersion }, GracePeriodSeconds = 0 }, cancellationToken: token).ConfigureAwait(false);
                Interlocked.Increment(ref _ApiWrites);
            }
            catch (HttpOperationException ex) when (ex.Response.StatusCode == HttpStatusCode.Conflict || ex.Response.StatusCode == HttpStatusCode.NotFound) { }
        }

        private async Task<bool> OwnLeaseAsync(CancellationToken token)
        {
            string name = "garrison-warm-" + Group;
            DateTime now = DateTime.UtcNow;
            V1Lease lease;
            try { lease = await Client().CoordinationV1.ReadNamespacedLeaseAsync(name, _Runtime.Namespace, cancellationToken: token).ConfigureAwait(false); }
            catch (HttpOperationException ex) when (ex.Response.StatusCode == HttpStatusCode.NotFound)
            {
                lease = new V1Lease { ApiVersion = "coordination.k8s.io/v1", Kind = "Lease", Metadata = new V1ObjectMeta { Name = name, NamespaceProperty = _Runtime.Namespace }, Spec = new V1LeaseSpec { HolderIdentity = _Instance, RenewTime = now, LeaseDurationSeconds = 30 } };
                try
                {
                    await Client().CoordinationV1.CreateNamespacedLeaseAsync(lease, _Runtime.Namespace, cancellationToken: token).ConfigureAwait(false);
                    Interlocked.Increment(ref _ApiWrites);
                    return true;
                }
                catch (HttpOperationException conflict) when (conflict.Response.StatusCode == HttpStatusCode.Conflict) { return false; }
            }
            DateTime renewed = lease.Spec.RenewTime ?? lease.Spec.AcquireTime ?? DateTime.MinValue;
            bool mine = lease.Spec.HolderIdentity == _Instance;
            if (!mine && renewed.AddSeconds(lease.Spec.LeaseDurationSeconds ?? 30) > now) return false;
            if (mine && renewed.AddSeconds(10) > now) return true;
            lease.Spec.HolderIdentity = _Instance;
            lease.Spec.RenewTime = now;
            lease.Spec.LeaseDurationSeconds = 30;
            try
            {
                await Client().CoordinationV1.ReplaceNamespacedLeaseAsync(lease, name, _Runtime.Namespace, cancellationToken: token).ConfigureAwait(false);
                Interlocked.Increment(ref _ApiWrites);
                return true;
            }
            catch (HttpOperationException conflict) when (conflict.Response.StatusCode == HttpStatusCode.Conflict) { return false; }
        }
    }
}
