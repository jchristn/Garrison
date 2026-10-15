namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Settings;
    using k8s.Models;

    /// <summary>
    /// Builds the Job and spec Secret of a KubernetesJob run (plan D-033, P11.1, P11.5, P11.6, P11.7, P11.10 to P11.12).
    /// The pod runs <c>run-one</c> as a non-root user with a read-only root filesystem, every capability dropped, no
    /// privilege escalation, the RuntimeDefault seccomp profile, no service account token, and no service links;
    /// writable paths (the run's work, home, and config directories, and /tmp) are emptyDir volumes. Stateless apart
    /// from its settings; thread-safe.
    /// </summary>
    public class RunPodManifestBuilder
    {
        #region Public-Members

        /// <summary>
        /// Seconds added to the run timeout, the pending timeout, and the kill grace for the Job's activeDeadlineSeconds,
        /// a backstop for when run-one cannot enforce the timeout itself. Minimum 0, maximum 3600, default 60.
        /// </summary>
        public int DeadlineMarginSeconds
        {
            get
            {
                return _DeadlineMarginSeconds;
            }
            set
            {
                _DeadlineMarginSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        #endregion

        #region Private-Members

        private readonly KubernetesExecutorSettings _Settings;
        private int _DeadlineMarginSeconds = 60;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Executor settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public RunPodManifestBuilder(KubernetesExecutorSettings settings)
        {
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Labels shared by the Job, its pod, the spec Secret, and the run's egress NetworkPolicy. A run whose spec has
        /// egress rules (P11.15) also gets garrison.io/egress=allowlist; the label is built in and cannot be set through
        /// Kubernetes.PodLabels.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Labels.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        public Dictionary<string, string> Labels(RunPodRequest request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            Dictionary<string, string> labels = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (KeyValuePair<string, string> label in _Settings.PodLabels) labels[label.Key] = label.Value;
            labels["app.kubernetes.io/name"] = RunPodNames.AppName;
            labels["app.kubernetes.io/component"] = "run";
            labels["app.kubernetes.io/part-of"] = "garrison";
            labels["app.kubernetes.io/managed-by"] = "garrison-worker";
            labels[RunPodNames.RunIdLabel] = RunPodNames.LabelValue(request.Assignment.RunId);
            labels[RunPodNames.WorkerLabel] = RunPodNames.LabelValue(request.NodeName);
            labels[RunPodNames.TenantLabel] = RunPodNames.LabelValue(request.Assignment.Spec?.TenantId);
            labels[RunPodNames.EpochLabel] = request.Assignment.Epoch.ToString(CultureInfo.InvariantCulture);
            labels.Remove(RunPodNames.EgressLabel);
            if (HasEgressRules(request)) labels[RunPodNames.EgressLabel] = RunPodNames.EgressAllowlistValue;
            return labels;
        }

        /// <summary>
        /// Whether a run has an egress allowlist (P11.15).
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>True when the run's spec has at least one egress rule.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        public static bool HasEgressRules(RunPodRequest request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return request.Assignment.Spec != null && request.Assignment.Spec.EgressRules.Count > 0;
        }

        /// <summary>
        /// The per-run egress NetworkPolicy of a run with an egress allowlist (P11.15, D-052). It selects exactly the
        /// run's pod (app.kubernetes.io/name, run ID, epoch, and the allowlist label), has policyTypes Egress only, and
        /// allows DNS (UDP and TCP 53 to any namespace), the Garrison server MCP port (pods labelled
        /// app.kubernetes.io/name=garrison-server, in <paramref name="serverNamespace"/> when it differs from the run
        /// namespace), and each egress rule as an ipBlock with its port and protocol (no port means every port). The
        /// garrison-run policy still denies ingress, and garrison-run-default-egress does not select the pod, so these
        /// are the only destinations the pod can reach. Owned by the Job, so Kubernetes deletes it with the Job.
        /// </summary>
        /// <param name="request">Request; its spec must have egress rules.</param>
        /// <param name="job">The created Job (owner), or null to build the policy without an owner.</param>
        /// <param name="serverNamespace">Namespace of the server pods, or null when it is the run namespace.</param>
        /// <returns>NetworkPolicy.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the run has no egress rules.</exception>
        public V1NetworkPolicy BuildNetworkPolicy(RunPodRequest request, V1Job? job, string? serverNamespace)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!HasEgressRules(request)) throw new ArgumentException("The run has no egress rules, so it needs no egress NetworkPolicy.", nameof(request));
            ExecutionSpec spec = request.Assignment.Spec!;
            string jobName = RunPodNames.JobName(request.Assignment.RunId, request.Assignment.Epoch);

            V1NetworkPolicy policy = new V1NetworkPolicy();
            policy.ApiVersion = "networking.k8s.io/v1";
            policy.Kind = "NetworkPolicy";
            policy.Metadata = new V1ObjectMeta();
            policy.Metadata.Name = RunPodNames.NetworkPolicyName(jobName);
            policy.Metadata.NamespaceProperty = request.Namespace;
            policy.Metadata.Labels = Labels(request);
            policy.Metadata.Annotations = new Dictionary<string, string>
            {
                { "garrison.io/run-id", request.Assignment.RunId },
                { "garrison.io/deployment-id", spec.DeploymentId ?? String.Empty }
            };
            if (job != null && job.Metadata != null && !String.IsNullOrEmpty(job.Metadata.Uid))
            {
                V1OwnerReference owner = new V1OwnerReference();
                owner.ApiVersion = "batch/v1";
                owner.Kind = "Job";
                owner.Name = job.Metadata.Name;
                owner.Uid = job.Metadata.Uid;
                owner.Controller = false;
                owner.BlockOwnerDeletion = false;
                policy.Metadata.OwnerReferences = new List<V1OwnerReference> { owner };
            }

            policy.Spec = new V1NetworkPolicySpec();
            policy.Spec.PodSelector = new V1LabelSelector();
            policy.Spec.PodSelector.MatchLabels = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                { "app.kubernetes.io/name", RunPodNames.AppName },
                { RunPodNames.RunIdLabel, RunPodNames.LabelValue(request.Assignment.RunId) },
                { RunPodNames.EpochLabel, request.Assignment.Epoch.ToString(CultureInfo.InvariantCulture) },
                { RunPodNames.EgressLabel, RunPodNames.EgressAllowlistValue }
            };
            policy.Spec.PolicyTypes = new List<string> { "Egress" };

            List<V1NetworkPolicyEgressRule> egress = new List<V1NetworkPolicyEgressRule>();
            egress.Add(new V1NetworkPolicyEgressRule
            {
                To = new List<V1NetworkPolicyPeer> { new V1NetworkPolicyPeer { NamespaceSelector = new V1LabelSelector() } },
                Ports = new List<V1NetworkPolicyPort>
                {
                    new V1NetworkPolicyPort { Port = (IntOrString)53, Protocol = "UDP" },
                    new V1NetworkPolicyPort { Port = (IntOrString)53, Protocol = "TCP" }
                }
            });

            V1NetworkPolicyPeer server = new V1NetworkPolicyPeer();
            server.PodSelector = new V1LabelSelector { MatchLabels = new Dictionary<string, string> { { "app.kubernetes.io/name", "garrison-server" } } };
            if (!String.IsNullOrWhiteSpace(serverNamespace) && !String.Equals(serverNamespace, request.Namespace, StringComparison.Ordinal))
                server.NamespaceSelector = new V1LabelSelector { MatchLabels = new Dictionary<string, string> { { "kubernetes.io/metadata.name", serverNamespace! } } };
            egress.Add(new V1NetworkPolicyEgressRule
            {
                To = new List<V1NetworkPolicyPeer> { server },
                Ports = new List<V1NetworkPolicyPort> { new V1NetworkPolicyPort { Port = (IntOrString)_Settings.ServerMcpPort, Protocol = "TCP" } }
            });

            foreach (DeploymentEgressRule rule in spec.EgressRules)
            {
                V1NetworkPolicyPort port = new V1NetworkPolicyPort();
                port.Protocol = rule.Protocol == EgressProtocolEnum.UDP ? "UDP" : "TCP";
                if (rule.Port.HasValue) port.Port = (IntOrString)rule.Port.Value;
                egress.Add(new V1NetworkPolicyEgressRule
                {
                    To = new List<V1NetworkPolicyPeer> { new V1NetworkPolicyPeer { IpBlock = new V1IPBlock { Cidr = rule.Cidr } } },
                    Ports = new List<V1NetworkPolicyPort> { port }
                });
            }
            policy.Spec.Egress = egress;
            return policy;
        }

        /// <summary>
        /// The spec Secret, owned by the Job so it is garbage collected with it.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="job">The created Job (its name and UID become the owner reference); null builds the Secret without an owner.</param>
        /// <returns>Secret.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        public V1Secret BuildSecret(RunPodRequest request, V1Job? job)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            string jobName = RunPodNames.JobName(request.Assignment.RunId, request.Assignment.Epoch);
            V1Secret secret = new V1Secret();
            secret.ApiVersion = "v1";
            secret.Kind = "Secret";
            secret.Type = "Opaque";
            secret.Metadata = new V1ObjectMeta();
            secret.Metadata.Name = RunPodNames.SecretName(jobName);
            secret.Metadata.NamespaceProperty = request.Namespace;
            secret.Metadata.Labels = Labels(request);
            if (job != null && job.Metadata != null && !String.IsNullOrEmpty(job.Metadata.Uid))
            {
                V1OwnerReference owner = new V1OwnerReference();
                owner.ApiVersion = "batch/v1";
                owner.Kind = "Job";
                owner.Name = job.Metadata.Name;
                owner.Uid = job.Metadata.Uid;
                owner.Controller = true;
                owner.BlockOwnerDeletion = false;
                secret.Metadata.OwnerReferences = new List<V1OwnerReference> { owner };
            }
            secret.StringData = new Dictionary<string, string> { { RunPodNames.SpecKey, request.EnvelopeJson } };
            return secret;
        }

        /// <summary>
        /// The run Job.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Job.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the image is missing or a PersistentVolume workspace names no claim.</exception>
        public V1Job BuildJob(RunPodRequest request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (String.IsNullOrWhiteSpace(request.Image)) throw new ArgumentException("The run pod image is not known; set Kubernetes.RunImage (GARRISON_WORKER_RUN_IMAGE).", nameof(request));
            ExecutionSpec spec = request.Assignment.Spec ?? new ExecutionSpec();
            string jobName = RunPodNames.JobName(request.Assignment.RunId, request.Assignment.Epoch);
            Dictionary<string, string> labels = Labels(request);

            V1Job job = new V1Job();
            job.ApiVersion = "batch/v1";
            job.Kind = "Job";
            job.Metadata = new V1ObjectMeta();
            job.Metadata.Name = jobName;
            job.Metadata.NamespaceProperty = request.Namespace;
            job.Metadata.Labels = new Dictionary<string, string>(labels);
            job.Metadata.Annotations = new Dictionary<string, string>
            {
                { "garrison.io/run-id", request.Assignment.RunId },
                { "garrison.io/agent", spec.AgentName ?? String.Empty },
                { "garrison.io/deployment-id", spec.DeploymentId ?? String.Empty }
            };

            job.Spec = new V1JobSpec();
            job.Spec.BackoffLimit = 0;
            job.Spec.Completions = 1;
            job.Spec.Parallelism = 1;
            job.Spec.ActiveDeadlineSeconds = ActiveDeadlineSeconds(spec);
            job.Spec.TtlSecondsAfterFinished = _Settings.JobTtlSeconds;

            V1PodTemplateSpec template = new V1PodTemplateSpec();
            template.Metadata = new V1ObjectMeta();
            template.Metadata.Labels = new Dictionary<string, string>(labels);
            template.Metadata.Annotations = new Dictionary<string, string> { { "garrison.io/run-id", request.Assignment.RunId } };
            job.Spec.Template = template;

            V1PodSpec pod = new V1PodSpec();
            template.Spec = pod;
            pod.RestartPolicy = "Never";
            pod.ServiceAccountName = _Settings.ServiceAccountName;
            pod.AutomountServiceAccountToken = false;
            pod.EnableServiceLinks = false;
            pod.TerminationGracePeriodSeconds = Math.Max(1, spec.KillGraceSeconds) + 10;
            if (!String.IsNullOrWhiteSpace(_Settings.RuntimeClassName)) pod.RuntimeClassName = _Settings.RuntimeClassName;
            if (_Settings.NodeSelector.Count > 0) pod.NodeSelector = new Dictionary<string, string>(_Settings.NodeSelector);
            if (request.ImagePullSecrets.Count > 0) pod.ImagePullSecrets = request.ImagePullSecrets.Where(s => !String.IsNullOrWhiteSpace(s)).Distinct().Select(s => new V1LocalObjectReference { Name = s }).ToList();

            pod.SecurityContext = new V1PodSecurityContext();
            pod.SecurityContext.RunAsNonRoot = true;
            pod.SecurityContext.RunAsUser = _Settings.RunAsUser;
            pod.SecurityContext.RunAsGroup = _Settings.RunAsGroup;
            pod.SecurityContext.FsGroup = _Settings.RunAsGroup;
            pod.SecurityContext.SeccompProfile = new V1SeccompProfile { Type = "RuntimeDefault" };

            V1Container container = new V1Container();
            container.Name = RunPodNames.ContainerName;
            container.Image = request.Image;
            if (!String.IsNullOrEmpty(request.ImagePullPolicy)) container.ImagePullPolicy = request.ImagePullPolicy;
            container.Args = new List<string> { "run-one", "--spec", RunPodNames.SpecDirectory + "/" + RunPodNames.SpecKey };
            container.Env = new List<V1EnvVar>
            {
                new V1EnvVar { Name = "HOME", Value = _Settings.PodDataPath + "/home" },
                new V1EnvVar { Name = "TMPDIR", Value = "/tmp" },
                new V1EnvVar { Name = "DOTNET_EnableDiagnostics", Value = "0" },
                new V1EnvVar { Name = "GARRISON_RUN_ID", Value = request.Assignment.RunId }
            };
            container.SecurityContext = new V1SecurityContext();
            container.SecurityContext.AllowPrivilegeEscalation = false;
            container.SecurityContext.Privileged = false;
            container.SecurityContext.ReadOnlyRootFilesystem = true;
            container.SecurityContext.RunAsNonRoot = true;
            container.SecurityContext.Capabilities = new V1Capabilities { Drop = new List<string> { "ALL" } };
            container.SecurityContext.SeccompProfile = new V1SeccompProfile { Type = "RuntimeDefault" };
            container.Resources = Resources(spec.PodResources);

            container.VolumeMounts = new List<V1VolumeMount>
            {
                new V1VolumeMount { Name = "spec", MountPath = RunPodNames.SpecDirectory, ReadOnlyProperty = true },
                new V1VolumeMount { Name = "data", MountPath = _Settings.PodDataPath },
                new V1VolumeMount { Name = "tmp", MountPath = "/tmp" }
            };

            V1SecretVolumeSource secretVolume = new V1SecretVolumeSource();
            secretVolume.SecretName = RunPodNames.SecretName(jobName);
            secretVolume.DefaultMode = 288; // 0440: readable by the pod user and its fsGroup only
            pod.Volumes = new List<V1Volume>
            {
                new V1Volume { Name = "spec", Secret = secretVolume },
                new V1Volume { Name = "data", EmptyDir = EmptyDir() },
                new V1Volume { Name = "tmp", EmptyDir = EmptyDir() }
            };

            if (spec.Workspace != null && spec.Workspace.Kind == WorkspaceKindEnum.PersistentVolume)
            {
                if (String.IsNullOrWhiteSpace(spec.Workspace.PersistentVolumeClaim)) throw new ArgumentException("The run's PersistentVolume workspace names no PersistentVolumeClaim.", nameof(request));
                pod.Volumes.Add(new V1Volume
                {
                    Name = "workspace",
                    PersistentVolumeClaim = new V1PersistentVolumeClaimVolumeSource { ClaimName = spec.Workspace.PersistentVolumeClaim }
                });
                container.VolumeMounts.Add(new V1VolumeMount { Name = "workspace", MountPath = _Settings.PodWorkspacePath });
            }

            pod.Containers = new List<V1Container> { container };
            return job;
        }

        /// <summary>Build one idle warm Pod with the cold executor's existing isolation controls and no spec Secret.</summary>
        /// <param name="request">Pool/image request with an idle placeholder run ID.</param>
        /// <param name="group">Stable shared pool/image identifier.</param>
        /// <returns>Idle warm Pod, ready only when stdin delivery is initialized.</returns>
        public V1Pod BuildWarmPod(RunPodRequest request, string group)
        {
            V1Job job = BuildJob(request);
            V1Pod pod = new V1Pod();
            pod.ApiVersion = "v1";
            pod.Kind = "Pod";
            pod.Metadata = new V1ObjectMeta
            {
                Name = job.Metadata.Name,
                NamespaceProperty = request.Namespace,
                Labels = new Dictionary<string, string>(job.Spec.Template.Metadata.Labels)
            };
            pod.Metadata.Labels["garrison.io/warm-group"] = group;
            pod.Metadata.Labels["garrison.io/warm-state"] = "idle";
            pod.Spec = job.Spec.Template.Spec;
            pod.Spec.Volumes = pod.Spec.Volumes.Where(v => v.Name != "spec").ToList();
            V1Container container = pod.Spec.Containers[0];
            container.VolumeMounts = container.VolumeMounts.Where(v => v.Name != "spec").ToList();
            container.Args = new List<string>
            {
                "run-one", "--stdin", "--stdin-wait-seconds", _Settings.WarmPods.IdleTimeoutSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture),
                "--max-spec-bytes", _Settings.WarmPods.MaxSpecBytes.ToString(System.Globalization.CultureInfo.InvariantCulture)
            };
            container.Stdin = true;
            container.StdinOnce = true;
            container.Tty = false;
            container.ReadinessProbe = new V1Probe
            {
                Exec = new V1ExecAction { Command = new List<string> { "/bin/sh", "-c", "test -f /tmp/garrison-warm-ready" } },
                InitialDelaySeconds = 1, PeriodSeconds = 1, TimeoutSeconds = 1, FailureThreshold = 3
            };
            return pod;
        }

        /// <summary>
        /// Mount path of a PersistentVolume workspace for a spec, or null when the spec's workspace is not one.
        /// </summary>
        /// <param name="spec">Execution spec.</param>
        /// <returns>Path or null.</returns>
        public string? WorkspaceMountPath(ExecutionSpec? spec)
        {
            if (spec?.Workspace == null || spec.Workspace.Kind != WorkspaceKindEnum.PersistentVolume) return null;
            return _Settings.PodWorkspacePath;
        }

        /// <summary>
        /// Directory inside the run pod holding the per-run directories.
        /// </summary>
        /// <returns>Path.</returns>
        public string WorkRoot()
        {
            return _Settings.PodDataPath + "/runs";
        }

        /// <summary>
        /// The Job's activeDeadlineSeconds: run timeout plus pending timeout plus kill grace plus the margin.
        /// </summary>
        /// <param name="spec">Execution spec.</param>
        /// <returns>Seconds.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spec is null.</exception>
        public long ActiveDeadlineSeconds(ExecutionSpec spec)
        {
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            return (long)Math.Max(1, spec.TimeoutSeconds) + _Settings.PendingTimeoutSeconds + Math.Max(0, spec.KillGraceSeconds) + _DeadlineMarginSeconds;
        }

        /// <summary>
        /// Effective resources: each value from the deployment, else the worker default.
        /// </summary>
        /// <param name="deployment">Deployment resources from the spec, or null.</param>
        /// <returns>Resource requirements.</returns>
        public V1ResourceRequirements Resources(RunPodResources? deployment)
        {
            RunPodResources defaults = _Settings.DefaultResources;
            Dictionary<string, ResourceQuantity> requests = new Dictionary<string, ResourceQuantity>(StringComparer.Ordinal);
            Dictionary<string, ResourceQuantity> limits = new Dictionary<string, ResourceQuantity>(StringComparer.Ordinal);
            Add(requests, "cpu", deployment?.CpuRequest ?? defaults.CpuRequest);
            Add(requests, "memory", deployment?.MemoryRequest ?? defaults.MemoryRequest);
            Add(requests, "ephemeral-storage", deployment?.EphemeralStorageRequest ?? defaults.EphemeralStorageRequest);
            Add(limits, "cpu", deployment?.CpuLimit ?? defaults.CpuLimit);
            Add(limits, "memory", deployment?.MemoryLimit ?? defaults.MemoryLimit);
            Add(limits, "ephemeral-storage", deployment?.EphemeralStorageLimit ?? defaults.EphemeralStorageLimit);
            // A deployment request above a worker default limit raises that limit to the request, so the pod stays valid.
            foreach (string name in new[] { "cpu", "memory", "ephemeral-storage" })
            {
                if (!requests.TryGetValue(name, out ResourceQuantity? request) || !limits.TryGetValue(name, out ResourceQuantity? limit)) continue;
                if (KubernetesNames.TryParseQuantity(request.ToString(), out decimal requested) && KubernetesNames.TryParseQuantity(limit.ToString(), out decimal limited) && requested > limited) limits[name] = request;
            }
            V1ResourceRequirements resources = new V1ResourceRequirements();
            if (requests.Count > 0) resources.Requests = requests;
            if (limits.Count > 0) resources.Limits = limits;
            return resources;
        }

        #endregion

        #region Private-Methods

        private V1EmptyDirVolumeSource EmptyDir()
        {
            V1EmptyDirVolumeSource source = new V1EmptyDirVolumeSource();
            if (!String.IsNullOrWhiteSpace(_Settings.EmptyDirSizeLimit)) source.SizeLimit = new ResourceQuantity(_Settings.EmptyDirSizeLimit);
            return source;
        }

        private static void Add(Dictionary<string, ResourceQuantity> target, string name, string? value)
        {
            if (String.IsNullOrWhiteSpace(value)) return;
            target[name] = new ResourceQuantity(value);
        }

        #endregion
    }
}
