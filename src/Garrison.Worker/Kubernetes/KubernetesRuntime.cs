namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Telemetry;
    using Garrison.Worker.Settings;
    using k8s;
    using k8s.Autorest;
    using k8s.Models;

    /// <summary>
    /// The worker's connection to the Kubernetes API for the KubernetesJob executor: the client, the run namespace,
    /// the run image, and whether the worker may create run Jobs (reported as the KubernetesJob executor capability).
    /// Thread-safe after <see cref="InitializeAsync"/>.
    /// </summary>
    public class KubernetesRuntime : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Settings.
        /// </summary>
        public KubernetesExecutorSettings Settings
        {
            get
            {
                return _Settings;
            }
        }

        /// <summary>
        /// Client, or null before initialization or when the API is unreachable.
        /// </summary>
        public IKubernetes? Client
        {
            get
            {
                return _Client;
            }
        }

        /// <summary>
        /// Run namespace (resolved at initialization).
        /// </summary>
        public string Namespace { get; private set; } = "default";

        /// <summary>
        /// Run pod image (resolved at initialization), or null.
        /// </summary>
        public string? Image { get; private set; } = null;

        /// <summary>
        /// Run pod image pull policy, or null.
        /// </summary>
        public string? ImagePullPolicy { get; private set; } = null;

        /// <summary>
        /// Run pod image pull secrets.
        /// </summary>
        public List<string> ImagePullSecrets { get; private set; } = new List<string>();

        /// <summary>
        /// Whether the KubernetesJob executor is usable: enabled, connected, image known, and RBAC allows it.
        /// </summary>
        public bool Available
        {
            get
            {
                return Volatile.Read(ref _Available) == 1;
            }
        }

        /// <summary>Whether warm Pod creation, attach, reservation, and shared-pool coordination are permitted.</summary>
        public bool WarmAvailable
        {
            get { return Available && _Settings.WarmPods.Enabled && _Settings.WarmPods.MaxCount > 0 && Volatile.Read(ref _WarmAvailable) == 1; }
        }

        /// <summary>
        /// Whether per-run egress allowlists are enforced (P11.15): the executor is available, Kubernetes.EgressAllowlists
        /// is on, the worker may create, get, list, and delete NetworkPolicies in the run namespace, and no shared policy
        /// widens allowlisted run pods (<see cref="EgressPolicyAudit"/>). Reported as the EgressControl capability.
        /// </summary>
        public bool EgressAvailable
        {
            get { return Available && _Settings.EgressAllowlists && Volatile.Read(ref _EgressAvailable) == 1; }
        }

        /// <summary>
        /// Why egress allowlists are not enforced, or a summary when they are.
        /// </summary>
        public string EgressDetail { get; private set; } = "not initialized";

        /// <summary>
        /// Namespace of the Garrison server pods for the MCP rule of allowlisted run pods: Kubernetes.ServerNamespace,
        /// else the worker's own namespace (resolved at initialization).
        /// </summary>
        public string ServerNamespace { get; private set; } = "default";

        /// <summary>
        /// Why the executor is unavailable, or a summary when available.
        /// </summary>
        public string Detail { get; private set; } = "not initialized";

        /// <summary>Worker Pod UID, when it was readable in the run namespace, for same-namespace warm Pod ownership.</summary>
        public string? WorkerPodUid { get; private set; } = null;

        #endregion

        #region Private-Members

        private readonly KubernetesExecutorSettings _Settings;
        private readonly Action<string>? _Log;
        private IKubernetes? _Client = null;
        private int _Available = 0;
        private int _WarmAvailable = 0;
        private int _EgressAvailable = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Executor settings.</param>
        /// <param name="log">Optional log callback.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public KubernetesRuntime(KubernetesExecutorSettings settings, Action<string>? log = null)
        {
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _Log = log;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Connect, resolve the namespace and image, and check permissions. Safe to call again (the probe loop does);
        /// returns whether the executor is available.
        /// </summary>
        /// <param name="podName">The worker's pod name (its node name), used to read its own image.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when available.</returns>
        public async Task<bool> InitializeAsync(string podName, CancellationToken token)
        {
            if (!_Settings.Enabled) return SetAvailable(false, "disabled (Kubernetes.Enabled is false)");
            try
            {
                if (_Client == null)
                {
                    KubernetesClientConfiguration configuration;
                    if (!String.IsNullOrEmpty(_Settings.KubeconfigPath))
                    {
                        configuration = KubernetesClientConfiguration.BuildConfigFromConfigFile(_Settings.KubeconfigPath);
                    }
                    else if (InCluster())
                    {
                        configuration = KubernetesClientConfiguration.InClusterConfig();
                    }
                    else
                    {
                        return SetAvailable(false, "not running in a cluster (no service account token) and no Kubernetes.KubeconfigPath");
                    }
                    string own = !String.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("POD_NAMESPACE")) ? Environment.GetEnvironmentVariable("POD_NAMESPACE")!
                        : !String.IsNullOrWhiteSpace(configuration.Namespace) ? configuration.Namespace!
                        : "default";
                    Namespace = !String.IsNullOrWhiteSpace(_Settings.RunNamespace) ? _Settings.RunNamespace!
                        : !String.IsNullOrWhiteSpace(configuration.Namespace) ? configuration.Namespace!
                        : Environment.GetEnvironmentVariable("POD_NAMESPACE") ?? "default";
                    ServerNamespace = !String.IsNullOrWhiteSpace(_Settings.ServerNamespace) ? _Settings.ServerNamespace!.Trim() : own;
                    // Every Kubernetes API call is an outbound call (service kubernetes) with a client span (P13.24).
                    _Client = new k8s.Kubernetes(configuration, new TelemetryHttpHandler("kubernetes"));
                }

                Image = _Settings.RunImage;
                ImagePullPolicy = _Settings.ImagePullPolicy;
                ImagePullSecrets = new List<string>(_Settings.ImagePullSecrets);
                if (String.IsNullOrWhiteSpace(Image) || ImagePullPolicy == null || ImagePullSecrets.Count == 0) await ReadOwnPodAsync(podName, token).ConfigureAwait(false);
                if (String.IsNullOrWhiteSpace(Image)) return SetAvailable(false, "the run image is unknown: set Kubernetes.RunImage (GARRISON_WORKER_RUN_IMAGE) or let the worker read its own pod");

                List<string> denied = new List<string>();
                foreach (string[] check in new[]
                {
                    new[] { "batch", "jobs", "create", "" }, new[] { "batch", "jobs", "delete", "" }, new[] { "batch", "jobs", "list", "" },
                    new[] { "", "secrets", "create", "" },
                    new[] { "", "pods", "list", "" }, new[] { "", "pods", "get", "" }, new[] { "", "pods", "get", "log" }
                })
                {
                    if (!await AllowedAsync(check[0], check[1], check[2], check[3], token).ConfigureAwait(false)) denied.Add(check[2] + " " + check[1] + (check[3].Length > 0 ? "/" + check[3] : String.Empty));
                }
                if (denied.Count > 0) return SetAvailable(false, "RBAC in namespace " + Namespace + " does not allow: " + String.Join(", ", denied));
                _Settings.WarmPods.Validate();
                List<string> warmDenied = new List<string>();
                if (_Settings.WarmPods.Enabled)
                {
                    foreach (string[] check in new[]
                    {
                        new[] { "", "pods", "create", "" }, new[] { "", "pods", "update", "" }, new[] { "", "pods", "delete", "" }, new[] { "", "pods", "create", "attach" }, new[] { "", "pods", "get", "attach" },
                        new[] { "coordination.k8s.io", "leases", "get", "" }, new[] { "coordination.k8s.io", "leases", "create", "" }, new[] { "coordination.k8s.io", "leases", "update", "" }
                    })
                    {
                        if (!await AllowedAsync(check[0], check[1], check[2], check[3], token).ConfigureAwait(false)) warmDenied.Add(check[2] + " " + check[1] + (check[3].Length > 0 ? "/" + check[3] : String.Empty));
                    }
                }
                Interlocked.Exchange(ref _WarmAvailable, _Settings.WarmPods.Enabled && warmDenied.Count == 0 ? 1 : 0);
                if (warmDenied.Count > 0) _Log?.Invoke("warm pods unavailable; cold execution remains available. Missing RBAC: " + String.Join(", ", warmDenied));
                await CheckEgressAsync(token).ConfigureAwait(false);
                return SetAvailable(true, "namespace " + Namespace + ", image " + Image);
            }
            catch (Exception e) when (e is HttpOperationException || e is HttpRequestException || e is IOException || e is k8s.Exceptions.KubeConfigException || e is TaskCanceledException)
            {
                if (token.IsCancellationRequested) throw;
                return SetAvailable(false, "Kubernetes API unavailable: " + e.Message);
            }
        }

        /// <summary>
        /// Delete a Job with foreground propagation (its pod is stopped first, then the Job and its spec Secret go).
        /// Not found counts as deleted.
        /// </summary>
        /// <param name="name">Job name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted or already gone.</returns>
        public async Task<bool> DeleteJobAsync(string name, CancellationToken token)
        {
            IKubernetes client = RequireClient();
            try
            {
                V1DeleteOptions options = new V1DeleteOptions();
                options.PropagationPolicy = "Foreground";
                await client.BatchV1.DeleteNamespacedJobAsync(name, Namespace, options, cancellationToken: token).ConfigureAwait(false);
                return true;
            }
            catch (HttpOperationException e) when (e.Response != null && e.Response.StatusCode == HttpStatusCode.NotFound)
            {
                return true;
            }
            catch (HttpOperationException e)
            {
                _Log?.Invoke("deleting job " + name + " failed: " + e.Message);
                return false;
            }
        }

        /// <summary>
        /// Delete a run's egress NetworkPolicy (P11.15). Not found counts as deleted.
        /// </summary>
        /// <param name="name">Policy name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted or already gone.</returns>
        public async Task<bool> DeleteNetworkPolicyAsync(string name, CancellationToken token)
        {
            IKubernetes client = RequireClient();
            try
            {
                await client.NetworkingV1.DeleteNamespacedNetworkPolicyAsync(name, Namespace, cancellationToken: token).ConfigureAwait(false);
                return true;
            }
            catch (HttpOperationException e) when (e.Response != null && e.Response.StatusCode == HttpStatusCode.NotFound)
            {
                return true;
            }
            catch (HttpOperationException e)
            {
                _Log?.Invoke("deleting network policy " + name + " failed: " + e.Message);
                return false;
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose.
        /// </summary>
        /// <param name="disposing">Whether called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            _Disposed = true;
            if (disposing) _Client?.Dispose();
        }

        #endregion

        #region Private-Methods

        private IKubernetes RequireClient()
        {
            return _Client ?? throw new InvalidOperationException("The Kubernetes client is not initialized.");
        }

        private bool SetAvailable(bool available, string detail)
        {
            int previous = Interlocked.Exchange(ref _Available, available ? 1 : 0);
            bool changed = (previous == 1) != available || !String.Equals(Detail, detail, StringComparison.Ordinal);
            Detail = detail;
            if (changed) _Log?.Invoke("KubernetesJob executor " + (available ? "available: " : "unavailable: ") + detail);
            return available;
        }

        private async Task CheckEgressAsync(CancellationToken token)
        {
            if (!_Settings.EgressAllowlists)
            {
                SetEgress(false, "off (Kubernetes.EgressAllowlists is false)");
                return;
            }
            if (String.IsNullOrWhiteSpace(_Settings.EgressCanary))
            {
                // Without the canary nothing proves the network plugin enforces NetworkPolicy, and an allowlist that is
                // not enforced must never look enforced (D-052).
                SetEgress(false, "Kubernetes.EgressCanary is not set, so the worker cannot confirm that the network plugin enforces NetworkPolicy");
                return;
            }
            try
            {
                List<string> denied = new List<string>();
                foreach (string verb in new[] { "create", "get", "list", "delete" })
                {
                    if (!await AllowedAsync("networking.k8s.io", "networkpolicies", verb, "", token).ConfigureAwait(false)) denied.Add(verb + " networkpolicies");
                }
                if (denied.Count > 0)
                {
                    SetEgress(false, "RBAC in namespace " + Namespace + " does not allow: " + String.Join(", ", denied));
                    return;
                }
                V1NetworkPolicyList list = await RequireClient().NetworkingV1.ListNamespacedNetworkPolicyAsync(Namespace, cancellationToken: token).ConfigureAwait(false);
                List<string> widening = EgressPolicyAudit.Widening(list.Items ?? new List<V1NetworkPolicy>(), EgressPolicyAudit.AllowlistedPodLabels(_Settings.PodLabels));
                if (widening.Count > 0)
                {
                    SetEgress(false, "a shared NetworkPolicy in " + Namespace + " would widen allowlisted run pods (" + String.Join("; ", widening) + "); select only pods without the " + RunPodNames.EgressLabel + " label, as garrison-run-default-egress does");
                    return;
                }
                SetEgress(true, "enforced in namespace " + Namespace);
            }
            catch (Exception e) when (e is HttpOperationException || e is HttpRequestException || e is IOException)
            {
                if (token.IsCancellationRequested) throw;
                SetEgress(false, "checking NetworkPolicies failed: " + e.Message);
            }
        }

        private void SetEgress(bool available, string detail)
        {
            int previous = Interlocked.Exchange(ref _EgressAvailable, available ? 1 : 0);
            bool changed = (previous == 1) != available || !String.Equals(EgressDetail, detail, StringComparison.Ordinal);
            EgressDetail = detail;
            if (changed && _Settings.EgressAllowlists) _Log?.Invoke("egress allowlists " + (available ? "available: " : "unavailable: ") + detail);
        }

        private static bool InCluster()
        {
            return !String.IsNullOrEmpty(Environment.GetEnvironmentVariable("KUBERNETES_SERVICE_HOST"))
                && File.Exists("/var/run/secrets/kubernetes.io/serviceaccount/token");
        }

        private async Task ReadOwnPodAsync(string podName, CancellationToken token)
        {
            if (String.IsNullOrEmpty(podName)) return;
            try
            {
                V1Pod pod = await RequireClient().CoreV1.ReadNamespacedPodAsync(podName, Namespace, cancellationToken: token).ConfigureAwait(false);
                WorkerPodUid = pod.Metadata?.Uid;
                V1Container? container = pod.Spec?.Containers?.FirstOrDefault(c => c.Name == "worker") ?? pod.Spec?.Containers?.FirstOrDefault();
                if (String.IsNullOrWhiteSpace(Image)) Image = container?.Image;
                if (ImagePullPolicy == null) ImagePullPolicy = container?.ImagePullPolicy;
                if (ImagePullSecrets.Count == 0 && pod.Spec?.ImagePullSecrets != null) ImagePullSecrets = pod.Spec.ImagePullSecrets.Where(s => !String.IsNullOrEmpty(s.Name)).Select(s => s.Name).ToList();
            }
            catch (HttpOperationException e)
            {
                _Log?.Invoke("cannot read the worker's own pod " + podName + " in " + Namespace + " (" + e.Message + "); set Kubernetes.RunImage");
            }
        }

        private async Task<bool> AllowedAsync(string group, string resource, string verb, string subresource, CancellationToken token)
        {
            V1SelfSubjectAccessReview review = new V1SelfSubjectAccessReview();
            review.ApiVersion = "authorization.k8s.io/v1";
            review.Kind = "SelfSubjectAccessReview";
            review.Spec = new V1SelfSubjectAccessReviewSpec();
            review.Spec.ResourceAttributes = new V1ResourceAttributes();
            review.Spec.ResourceAttributes.Group = group;
            review.Spec.ResourceAttributes.Resource = resource;
            review.Spec.ResourceAttributes.Verb = verb;
            review.Spec.ResourceAttributes.NamespaceProperty = Namespace;
            if (subresource.Length > 0) review.Spec.ResourceAttributes.Subresource = subresource;
            V1SelfSubjectAccessReview result = await RequireClient().AuthorizationV1.CreateSelfSubjectAccessReviewAsync(review, cancellationToken: token).ConfigureAwait(false);
            return result.Status != null && result.Status.Allowed;
        }

        #endregion
    }
}
