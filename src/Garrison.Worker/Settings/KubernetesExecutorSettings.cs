namespace Garrison.Worker.Settings
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Settings for the KubernetesJob executor (plan D-033, Phase 11): the worker creates a Job per run in the run
    /// namespace and relays the run pod's events. Disabled by default; the Kubernetes manifests enable it with
    /// GARRISON_WORKER_KUBERNETES_ENABLED=true. Docker Compose and local workers keep Process only.
    /// </summary>
    public class KubernetesExecutorSettings
    {
        #region Public-Members

        /// <summary>
        /// Whether the worker offers the KubernetesJob executor. When true, the worker reports the KubernetesJob executor
        /// only if it reaches the Kubernetes API (in-cluster service account, or <see cref="KubeconfigPath"/>) and is
        /// allowed to create Jobs and Secrets and read pods and pod logs in the run namespace. Default false.
        /// Environment: GARRISON_WORKER_KUBERNETES_ENABLED.
        /// </summary>
        public bool Enabled { get; set; } = false;

        /// <summary>Warm run pod bounds, enabled by default for Kubernetes execution.</summary>
        public WarmPodSettings WarmPods
        {
            get { return _WarmPods; }
            set { _WarmPods = value ?? new WarmPodSettings(); }
        }

        private WarmPodSettings _WarmPods = new WarmPodSettings();

        /// <summary>
        /// Kubeconfig file used when the worker is not running in a cluster (development). Null uses the in-cluster
        /// service account. Environment: GARRISON_WORKER_KUBECONFIG.
        /// </summary>
        public string? KubeconfigPath { get; set; } = null;

        /// <summary>
        /// Namespace for run Jobs, Secrets, and pods. Null uses the worker's own namespace. A different namespace needs
        /// the worker Role and RoleBinding, the garrison-run ServiceAccount, and the run NetworkPolicy there, and
        /// <see cref="RunImage"/>. Environment: GARRISON_WORKER_RUN_NAMESPACE.
        /// </summary>
        public string? RunNamespace { get; set; } = null;

        /// <summary>
        /// Image of the run pod (it must contain the worker and the harnesses). Null uses the image of the worker's own
        /// container, read from its pod. Environment: GARRISON_WORKER_RUN_IMAGE.
        /// </summary>
        public string? RunImage { get; set; } = null;

        /// <summary>
        /// Image pull policy of the run pod: Always, IfNotPresent, or Never. Null uses the worker container's policy.
        /// Environment: GARRISON_WORKER_RUN_IMAGE_PULL_POLICY.
        /// </summary>
        public string? ImagePullPolicy
        {
            get
            {
                return _ImagePullPolicy;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value))
                {
                    _ImagePullPolicy = null;
                    return;
                }
                string trimmed = value.Trim();
                if (trimmed != "Always" && trimmed != "IfNotPresent" && trimmed != "Never") throw new ArgumentException("ImagePullPolicy must be Always, IfNotPresent, or Never, not '" + value + "'.", nameof(value));
                _ImagePullPolicy = trimmed;
            }
        }

        /// <summary>
        /// Image pull secrets (Secret names in the run namespace) for private registries. Empty uses the worker pod's
        /// own imagePullSecrets. Environment: GARRISON_WORKER_RUN_IMAGE_PULL_SECRETS (comma-separated).
        /// </summary>
        public List<string> ImagePullSecrets
        {
            get
            {
                return _ImagePullSecrets;
            }
            set
            {
                _ImagePullSecrets = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Service account of run pods. It should have no RoleBindings; its token is never mounted. Default garrison-run.
        /// Environment: GARRISON_WORKER_RUN_SERVICE_ACCOUNT.
        /// </summary>
        public string ServiceAccountName
        {
            get
            {
                return _ServiceAccountName;
            }
            set
            {
                _ServiceAccountName = String.IsNullOrWhiteSpace(value) ? "garrison-run" : value.Trim();
            }
        }

        /// <summary>
        /// RuntimeClass of run pods, for a sandboxed runtime such as gVisor (gvisor, runsc) or Kata Containers (kata).
        /// The RuntimeClass must exist in the cluster. Null uses the cluster default runtime.
        /// Environment: GARRISON_WORKER_RUN_RUNTIME_CLASS.
        /// </summary>
        public string? RuntimeClassName { get; set; } = null;

        /// <summary>
        /// Node selector of run pods (for example a dedicated, tainted node group). Environment:
        /// GARRISON_WORKER_RUN_NODE_SELECTOR (key=value pairs, comma-separated).
        /// </summary>
        public Dictionary<string, string> NodeSelector
        {
            get
            {
                return _NodeSelector;
            }
            set
            {
                _NodeSelector = value ?? new Dictionary<string, string>();
            }
        }

        /// <summary>
        /// Extra labels on run pods, Jobs, and Secrets. The built-in labels (app.kubernetes.io/name=garrison-run and the
        /// garrison.io/run-id, worker, tenant, and epoch labels) cannot be overridden.
        /// </summary>
        public Dictionary<string, string> PodLabels
        {
            get
            {
                return _PodLabels;
            }
            set
            {
                _PodLabels = value ?? new Dictionary<string, string>();
            }
        }

        /// <summary>
        /// Seconds a finished run Job (and, through its owner reference, the spec Secret) is kept before Kubernetes
        /// deletes it. Minimum 0, maximum 604800, default 300. Environment: GARRISON_WORKER_JOB_TTL_SECONDS.
        /// </summary>
        public int JobTtlSeconds
        {
            get
            {
                return _JobTtlSeconds;
            }
            set
            {
                _JobTtlSeconds = Math.Clamp(value, 0, 604800);
            }
        }

        /// <summary>
        /// Seconds a run pod may stay Pending (unschedulable, pulling its image, waiting for a volume) before the run
        /// fails with outcome PodFailed and the Job is deleted. Minimum 10, maximum 3600, default 300.
        /// Environment: GARRISON_WORKER_RUN_PENDING_TIMEOUT_SECONDS.
        /// </summary>
        public int PendingTimeoutSeconds
        {
            get
            {
                return _PendingTimeoutSeconds;
            }
            set
            {
                _PendingTimeoutSeconds = Math.Clamp(value, 10, 3600);
            }
        }

        /// <summary>
        /// User ID of the run pod. Must not be 0. Minimum 1, default 10001 (the image's garrison user).
        /// </summary>
        public long RunAsUser
        {
            get
            {
                return _RunAsUser;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(value), "Run pods never run as root; RunAsUser must be at least 1.");
                _RunAsUser = value;
            }
        }

        /// <summary>
        /// Group ID and fsGroup of the run pod. Minimum 1, default 10001.
        /// </summary>
        public long RunAsGroup
        {
            get
            {
                return _RunAsGroup;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(value), "RunAsGroup must be at least 1.");
                _RunAsGroup = value;
            }
        }

        /// <summary>
        /// Requests and limits for run pods whose deployment leaves them unset. Default: requests 100m CPU and 256Mi
        /// memory, limits 2 CPU, 4Gi memory, and 10Gi ephemeral storage.
        /// </summary>
        public RunPodResources DefaultResources
        {
            get
            {
                return _DefaultResources;
            }
            set
            {
                _DefaultResources = value ?? new RunPodResources();
            }
        }

        /// <summary>
        /// Directory inside the run pod (an emptyDir volume) that holds the run's work, home, and config directories.
        /// Default /garrison.
        /// </summary>
        public string PodDataPath
        {
            get
            {
                return _PodDataPath;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value) || !value.StartsWith("/", StringComparison.Ordinal)) throw new ArgumentException("PodDataPath must be an absolute path.", nameof(value));
                _PodDataPath = value.TrimEnd('/');
            }
        }

        /// <summary>
        /// Where a PersistentVolume workspace's claim is mounted in the run pod; the run's work directory is a link to
        /// it. Default /workspace.
        /// </summary>
        public string PodWorkspacePath
        {
            get
            {
                return _PodWorkspacePath;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value) || !value.StartsWith("/", StringComparison.Ordinal)) throw new ArgumentException("PodWorkspacePath must be an absolute path.", nameof(value));
                _PodWorkspacePath = value.TrimEnd('/');
            }
        }

        /// <summary>
        /// Size limit of each run pod emptyDir volume (data and /tmp), as a Kubernetes quantity. Null for none (the
        /// ephemeral storage limit still applies). Default null.
        /// </summary>
        public string? EmptyDirSizeLimit { get; set; } = null;

        /// <summary>
        /// Seconds between reconciliations that delete this worker's run Jobs for runs it no longer holds (also run at
        /// startup). Minimum 10, maximum 3600, default 60.
        /// </summary>
        public int ReconcileIntervalSeconds
        {
            get
            {
                return _ReconcileIntervalSeconds;
            }
            set
            {
                _ReconcileIntervalSeconds = Math.Clamp(value, 10, 3600);
            }
        }

        /// <summary>
        /// Milliseconds between pod status checks while a run pod is starting. Minimum 200, maximum 10000, default 1000.
        /// </summary>
        public int PollIntervalMs
        {
            get
            {
                return _PollIntervalMs;
            }
            set
            {
                _PollIntervalMs = Math.Clamp(value, 200, 10000);
            }
        }

        /// <summary>
        /// Egress canary for run pods as host:port: an address the run NetworkPolicy blocks (the manifests use the
        /// server's REST port, garrison-server:8700). run-one starts the harness only once a connection to it fails, so
        /// the harness never runs before the policy controller has programmed the pod; if it is still reachable after
        /// <see cref="EgressCanaryTimeoutSeconds"/>, the run fails with outcome PodFailed. Null or empty disables the
        /// check (clusters without NetworkPolicy enforcement). Environment: GARRISON_WORKER_RUN_EGRESS_CANARY.
        /// </summary>
        public string? EgressCanary
        {
            get
            {
                return _EgressCanary;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value))
                {
                    _EgressCanary = null;
                    return;
                }
                string trimmed = value.Trim();
                int colon = trimmed.LastIndexOf(':');
                if (colon <= 0 || !Int32.TryParse(trimmed.Substring(colon + 1), out int port) || port < 1 || port > 65535) throw new ArgumentException("EgressCanary must be host:port, not '" + value + "'.", nameof(value));
                _EgressCanary = trimmed;
            }
        }

        /// <summary>
        /// Seconds run-one waits for the egress canary to be blocked. Minimum 1, maximum 600, default 30.
        /// </summary>
        public int EgressCanaryTimeoutSeconds
        {
            get
            {
                return _EgressCanaryTimeoutSeconds;
            }
            set
            {
                _EgressCanaryTimeoutSeconds = Math.Clamp(value, 1, 600);
            }
        }

        /// <summary>
        /// Longest accepted protocol line from a run pod, in bytes. Longer lines are ignored and counted. Minimum 65536,
        /// maximum 67108864, default 8388608.
        /// </summary>
        public int MaxLineBytes
        {
            get
            {
                return _MaxLineBytes;
            }
            set
            {
                _MaxLineBytes = Math.Clamp(value, 65536, 67108864);
            }
        }

        #endregion

        #region Private-Members

        private string? _ImagePullPolicy = null;
        private List<string> _ImagePullSecrets = new List<string>();
        private string _ServiceAccountName = "garrison-run";
        private Dictionary<string, string> _NodeSelector = new Dictionary<string, string>();
        private Dictionary<string, string> _PodLabels = new Dictionary<string, string>();
        private int _JobTtlSeconds = 300;
        private int _PendingTimeoutSeconds = 300;
        private long _RunAsUser = 10001;
        private long _RunAsGroup = 10001;
        private RunPodResources _DefaultResources = DefaultPodResources();
        private string _PodDataPath = "/garrison";
        private string _PodWorkspacePath = "/workspace";
        private int _ReconcileIntervalSeconds = 60;
        private int _PollIntervalMs = 1000;
        private int _MaxLineBytes = 8388608;
        private string? _EgressCanary = null;
        private int _EgressCanaryTimeoutSeconds = 30;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Apply GARRISON_WORKER_KUBERNETES_ENABLED and the GARRISON_WORKER_RUN_* environment overrides.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when an override has an invalid value.</exception>
        public void ApplyEnvironment()
        {
            WarmPods.ApplyEnvironment();
            string? value = Env("GARRISON_WORKER_KUBERNETES_ENABLED");
            if (value != null && Boolean.TryParse(value, out bool enabled)) Enabled = enabled;
            value = Env("GARRISON_WORKER_KUBECONFIG");
            if (value != null) KubeconfigPath = value;
            value = Env("GARRISON_WORKER_RUN_NAMESPACE");
            if (value != null) RunNamespace = value;
            value = Env("GARRISON_WORKER_RUN_IMAGE");
            if (value != null) RunImage = value;
            value = Env("GARRISON_WORKER_RUN_IMAGE_PULL_POLICY");
            if (value != null) ImagePullPolicy = value;
            value = Env("GARRISON_WORKER_RUN_IMAGE_PULL_SECRETS");
            if (value != null) ImagePullSecrets = new List<string>(value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            value = Env("GARRISON_WORKER_RUN_SERVICE_ACCOUNT");
            if (value != null) ServiceAccountName = value;
            value = Env("GARRISON_WORKER_RUN_RUNTIME_CLASS");
            if (value != null) RuntimeClassName = value;
            value = Env("GARRISON_WORKER_RUN_NODE_SELECTOR");
            if (value != null) NodeSelector = Pairs(value);
            value = Env("GARRISON_WORKER_JOB_TTL_SECONDS");
            if (value != null && Int32.TryParse(value, out int ttl)) JobTtlSeconds = ttl;
            value = Env("GARRISON_WORKER_RUN_EGRESS_CANARY");
            if (value != null) EgressCanary = value;
            value = Env("GARRISON_WORKER_RUN_PENDING_TIMEOUT_SECONDS");
            if (value != null && Int32.TryParse(value, out int pending)) PendingTimeoutSeconds = pending;
        }

        #endregion

        #region Private-Methods

        private static RunPodResources DefaultPodResources()
        {
            RunPodResources resources = new RunPodResources();
            resources.CpuRequest = "100m";
            resources.MemoryRequest = "256Mi";
            resources.CpuLimit = "2";
            resources.MemoryLimit = "4Gi";
            resources.EphemeralStorageLimit = "10Gi";
            return resources;
        }

        private static Dictionary<string, string> Pairs(string value)
        {
            Dictionary<string, string> pairs = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (string pair in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                int index = pair.IndexOf('=');
                if (index <= 0) continue;
                pairs[pair.Substring(0, index).Trim()] = pair.Substring(index + 1).Trim();
            }
            return pairs;
        }

        private static string? Env(string name)
        {
            string? value = Environment.GetEnvironmentVariable(name);
            return String.IsNullOrEmpty(value) ? null : value;
        }

        #endregion
    }
}
