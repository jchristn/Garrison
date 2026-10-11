namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Garrison.Harnesses.Execution;
    using Garrison.Worker.Execution;
    using k8s;
    using k8s.Autorest;
    using k8s.Models;

    /// <summary>
    /// Runs a leased run in its own Kubernetes Job (plan D-033, P11.1). Creates the Job and its spec Secret (owned by
    /// the Job), waits for the pod to start (failing clearly on scheduling, image pull, or configuration problems),
    /// streams the pod log, accepts only nonce-prefixed protocol lines from run-one, forwards events through the
    /// reporter, and returns run-one's completion. Cancellation and timeouts delete the Job with foreground
    /// propagation. The worker keeps the lease and reports completion exactly as for process runs. When the pod is
    /// stopped from outside (its Job deleted, the pod evicted, or its node drained or lost) the result has outcome
    /// NodeLost, which the worker does not report: the lease expires and the control plane requeues or fails the run
    /// according to the deployment's retryOnNodeLoss, as for a lost worker. Thread-safe; each call is independent.
    /// </summary>
    public class KubernetesJobRunExecutor : IRunExecutor
    {
        #region Public-Members

        /// <summary>
        /// Seconds to allow for deleting a Job after cancellation. Minimum 1, maximum 120, default 15.
        /// </summary>
        public int DeleteTimeoutSeconds
        {
            get
            {
                return _DeleteTimeoutSeconds;
            }
            set
            {
                _DeleteTimeoutSeconds = Math.Clamp(value, 1, 120);
            }
        }

        #endregion

        #region Private-Members

        private readonly KubernetesRuntime _Runtime;
        private readonly RunPodManifestBuilder _Builder;
        private readonly string _NodeName;
        private readonly List<string> _EnvironmentAllowlist;
        private readonly int _McpPreflightTimeoutMs;
        private readonly Action<string>? _Log;
        private int _DeleteTimeoutSeconds = 15;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="runtime">Kubernetes runtime (initialized).</param>
        /// <param name="nodeName">Worker node name, written to the garrison.io/worker label.</param>
        /// <param name="environmentAllowlist">Worker environment allowlist passed to run-one.</param>
        /// <param name="mcpPreflightTimeoutMs">MCP pre-flight timeout passed to run-one.</param>
        /// <param name="log">Optional log callback (never receives secret values).</param>
        /// <exception cref="ArgumentNullException">Thrown when runtime or nodeName is null.</exception>
        public KubernetesJobRunExecutor(KubernetesRuntime runtime, string nodeName, List<string> environmentAllowlist, int mcpPreflightTimeoutMs, Action<string>? log = null)
        {
            _Runtime = runtime ?? throw new ArgumentNullException(nameof(runtime));
            _NodeName = nodeName ?? throw new ArgumentNullException(nameof(nodeName));
            _EnvironmentAllowlist = environmentAllowlist ?? new List<string>();
            _McpPreflightTimeoutMs = mcpPreflightTimeoutMs;
            _Builder = new RunPodManifestBuilder(runtime.Settings);
            _Log = log;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            if (reporter == null) throw new ArgumentNullException(nameof(reporter));
            using (Activity? span = GarrisonTracing.Start("run:k8s_job", ActivityKind.Internal, true))
            {
                RunCompleteRequest complete = await ExecuteCoreAsync(assignment, reporter, token).ConfigureAwait(false);
                span?.SetTag("garrison.outcome", complete.Outcome.ToString());
                if (complete.Outcome == RunOutcomeEnum.PodFailed)
                {
                    string reason = PodFailureReason(complete.ErrorMessage);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.K8sPodFailures, "reason", reason);
                    span?.SetTag("garrison.pod_failure", reason);
                    GarrisonTracing.Fail(span, complete.ErrorMessage ?? "PodFailed");
                }
                else if (complete.Status == RunStatusEnum.Succeeded)
                {
                    GarrisonTracing.Ok(span);
                }
                return complete;
            }
        }

        /// <summary>
        /// The reason label for a PodFailed error message: Unschedulable, ImagePull, OOMKilled, Evicted, PendingTimeout,
        /// SpecSecret, NoCompletion, ApiError, or Other.
        /// </summary>
        /// <param name="message">Error message, or null.</param>
        /// <returns>Reason label.</returns>
        public static string PodFailureReason(string? message)
        {
            if (String.IsNullOrEmpty(message)) return "Other";
            if (message.Contains("OOMKilled", StringComparison.OrdinalIgnoreCase) || message.Contains("out of memory", StringComparison.OrdinalIgnoreCase)) return "OOMKilled";
            if (message.Contains("ImagePull", StringComparison.OrdinalIgnoreCase) || message.Contains("ErrImage", StringComparison.OrdinalIgnoreCase) || message.Contains("image", StringComparison.OrdinalIgnoreCase)) return "ImagePull";
            if (message.Contains("Unschedulable", StringComparison.OrdinalIgnoreCase) || message.Contains("could not be scheduled", StringComparison.OrdinalIgnoreCase)) return "Unschedulable";
            if (message.Contains("Evicted", StringComparison.OrdinalIgnoreCase)) return "Evicted";
            if (message.Contains("stayed Pending", StringComparison.OrdinalIgnoreCase)) return "PendingTimeout";
            if (message.Contains("run spec Secret", StringComparison.OrdinalIgnoreCase)) return "SpecSecret";
            if (message.Contains("without reporting", StringComparison.OrdinalIgnoreCase) || message.Contains("was not created", StringComparison.OrdinalIgnoreCase)) return "NoCompletion";
            if (message.Contains("Run pod failed:", StringComparison.Ordinal)) return "ApiError";
            return "Other";
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded)
        {
            // Run pods keep nothing on the worker; their emptyDir volumes go with the pod.
        }

        #endregion

        #region Private-Methods

        private async Task<RunCompleteRequest> ExecuteCoreAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            ExecutionSpec spec = assignment.Spec ?? new ExecutionSpec();
            IKubernetes? client = _Runtime.Client;
            if (client == null || !_Runtime.Available) return Fail(RunOutcomeEnum.NoCapableWorker, "This worker cannot run KubernetesJob runs right now: " + _Runtime.Detail + ".");

            string nonce = PodLineProtocol.NewNonce();
            string jobName = RunPodNames.JobName(assignment.RunId, assignment.Epoch);
            string ns = _Runtime.Namespace;
            SecretScrubber scrubber = new SecretScrubber(spec.ScrubValues);
            RunPodRequest request = BuildRequest(assignment, nonce, ns);
            if (Encoding.UTF8.GetByteCount(request.EnvelopeJson) > 1000000)
            {
                return Fail(RunOutcomeEnum.InternalError, "The compiled run spec is larger than a Kubernetes Secret can hold (1 MiB); reduce inline files or prompts.");
            }

            // Overall watchdog: the run timeout plus the pending timeout plus the kill grace plus a margin.
            using (CancellationTokenSource watchdog = new CancellationTokenSource(TimeSpan.FromSeconds(_Builder.ActiveDeadlineSeconds(spec))))
            using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, watchdog.Token))
            {
                bool created = false;
                try
                {
                    V1Job job = _Builder.BuildJob(request);
                    long createStart = Stopwatch.GetTimestamp();
                    V1Job createdJob;
                    try
                    {
                        createdJob = await client.BatchV1.CreateNamespacedJobAsync(job, ns, cancellationToken: linked.Token).ConfigureAwait(false);
                    }
                    catch (Exception e) when (e is HttpOperationException || e is HttpRequestException)
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.K8sJobs, "result", "create_failed");
                        throw;
                    }
                    created = true;
                    GarrisonMetrics.Count(GarrisonMetricCatalog.K8sJobs, "result", "created");
                    try
                    {
                        await client.CoreV1.CreateNamespacedSecretAsync(_Builder.BuildSecret(request, createdJob), ns, cancellationToken: linked.Token).ConfigureAwait(false);
                    }
                    catch (HttpOperationException e)
                    {
                        await DeleteAsync(jobName).ConfigureAwait(false);
                        return Fail(RunOutcomeEnum.PodFailed, "Creating the run spec Secret failed: " + Describe(e));
                    }
                    Lifecycle(reporter, "RunPodCreated", "Created Job " + jobName + " in namespace " + ns + ".");
                    _Log?.Invoke("run " + assignment.RunId + " created job " + jobName + " in " + ns);

                    V1Pod? pod = await WaitForStartAsync(client, ns, jobName, reporter, linked.Token).ConfigureAwait(false);
                    if (pod == null) return Fail(RunOutcomeEnum.PodFailed, "Run pod for Job " + jobName + " was not created.");
                    RunPodDiagnosis start = RunPodDiagnosis.OfPod(pod);
                    if (start.State == RunPodStateEnum.Failed)
                    {
                        await DeleteAsync(jobName).ConfigureAwait(false);
                        return Fail(start.Outcome, scrubber.Scrub(start.Message));
                    }
                    if (start.State == RunPodStateEnum.Pending)
                    {
                        await DeleteAsync(jobName).ConfigureAwait(false);
                        return Fail(RunOutcomeEnum.PodFailed, scrubber.Scrub("Run pod stayed Pending for more than " + _Runtime.Settings.PendingTimeoutSeconds + " s (" + start.Message + ")."));
                    }
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.K8sPodStart, GarrisonMetrics.SecondsSince(createStart));
                    Lifecycle(reporter, "RunPodStarted", "Run pod " + pod.Metadata.Name + " started" + (String.IsNullOrEmpty(pod.Spec?.NodeName) ? String.Empty : " on node " + pod.Spec.NodeName) + ".");

                    PodLineParser parser = new PodLineParser(nonce, _Runtime.Settings.MaxLineBytes);
                    RunCompleteRequest? complete = await StreamAsync(client, ns, pod.Metadata.Name, parser, reporter, linked.Token).ConfigureAwait(false);
                    if (parser.Rejected > 0 || parser.Malformed > 0)
                    {
                        Emit(reporter, RunEventTypeEnum.Warning, "RunPodLinesRejected", "Ignored " + parser.Rejected + " line(s) that imitated the protocol without this run's nonce and " + parser.Malformed + " malformed protocol line(s) from the run pod.");
                    }
                    if (complete != null)
                    {
                        if (complete.Status == RunStatusEnum.Cancelled && !token.IsCancellationRequested)
                        {
                            // run-one got SIGTERM that this worker did not send.
                            await DeleteAsync(jobName).ConfigureAwait(false);
                            return Lost(reporter, "Run pod " + pod.Metadata.Name + " was stopped outside Garrison before it finished (its Job was deleted, or the pod was evicted or its node drained).");
                        }
                        if (complete.Outcome == RunOutcomeEnum.TimedOut) await DeleteAsync(jobName).ConfigureAwait(false);
                        return complete;
                    }

                    V1Pod? ended = await ReadPodAsync(client, ns, pod.Metadata.Name, CancellationToken.None).ConfigureAwait(false);
                    RunPodDiagnosis diagnosis = RunPodDiagnosis.OfEndedWithoutCompletion(ended, MemoryLimit(ended ?? pod));
                    await DeleteAsync(jobName).ConfigureAwait(false);
                    if (diagnosis.Outcome == RunOutcomeEnum.NodeLost) return Lost(reporter, scrubber.Scrub(diagnosis.Message) ?? String.Empty);
                    RunCompleteRequest failed = Fail(diagnosis.Outcome, scrubber.Scrub(diagnosis.Message));
                    List<string> recent = parser.RecentDiagnostics;
                    if (recent.Count > 0) failed.StderrTail = scrubber.Scrub(String.Join("\n", recent));
                    return failed;
                }
                catch (OperationCanceledException) when (token.IsCancellationRequested)
                {
                    if (created)
                    {
                        await DeleteAsync(jobName).ConfigureAwait(false);
                        _Log?.Invoke("run " + assignment.RunId + " cancelled; deleted job " + jobName);
                    }
                    RunCompleteRequest cancelled = new RunCompleteRequest();
                    cancelled.Status = RunStatusEnum.Cancelled;
                    cancelled.Outcome = RunOutcomeEnum.Cancelled;
                    cancelled.ErrorMessage = "Run was cancelled.";
                    cancelled.CompletedUtc = DateTime.UtcNow;
                    return cancelled;
                }
                catch (OperationCanceledException) when (watchdog.IsCancellationRequested)
                {
                    if (created) await DeleteAsync(jobName).ConfigureAwait(false);
                    RunCompleteRequest timedOut = Fail(RunOutcomeEnum.TimedOut, "Run pod did not finish within " + _Builder.ActiveDeadlineSeconds(spec) + " s (run timeout plus pending timeout and grace); the Job was deleted.");
                    timedOut.Status = RunStatusEnum.TimedOut;
                    return timedOut;
                }
                catch (Exception e) when (e is HttpOperationException || e is HttpRequestException || e is IOException || e is ArgumentException)
                {
                    if (created) await DeleteAsync(jobName).ConfigureAwait(false);
                    string detail = e is HttpOperationException http ? Describe(http) : e.Message;
                    return Fail(RunOutcomeEnum.PodFailed, scrubber.Scrub("Run pod failed: " + detail));
                }
            }
        }

        private RunPodRequest BuildRequest(RunAssignment assignment, string nonce, string ns)
        {
            RunPodEnvelope envelope = new RunPodEnvelope();
            envelope.Nonce = nonce;
            envelope.Assignment = assignment;
            envelope.WorkRoot = _Builder.WorkRoot();
            envelope.EnvironmentAllowlist = new List<string>(_EnvironmentAllowlist);
            envelope.McpPreflightTimeoutMs = _McpPreflightTimeoutMs;
            envelope.WorkspaceMountPath = _Builder.WorkspaceMountPath(assignment.Spec);
            envelope.EgressCanary = _Runtime.Settings.EgressCanary;
            envelope.EgressCanaryTimeoutSeconds = _Runtime.Settings.EgressCanaryTimeoutSeconds;

            RunPodRequest request = new RunPodRequest();
            request.Assignment = assignment;
            request.NodeName = _NodeName;
            request.Namespace = ns;
            request.Image = _Runtime.Image ?? String.Empty;
            request.ImagePullPolicy = _Runtime.ImagePullPolicy;
            request.ImagePullSecrets = new List<string>(_Runtime.ImagePullSecrets);
            request.EnvelopeJson = Serializer.Serialize(envelope);
            return request;
        }

        private async Task<V1Pod?> WaitForStartAsync(IKubernetes client, string ns, string jobName, IRunReporter reporter, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(_Runtime.Settings.PendingTimeoutSeconds);
            V1Pod? pod = null;
            string? lastMessage = null;
            while (true)
            {
                token.ThrowIfCancellationRequested();
                V1PodList pods = await client.CoreV1.ListNamespacedPodAsync(ns, labelSelector: "job-name=" + jobName, cancellationToken: token).ConfigureAwait(false);
                pod = pods.Items?.OrderByDescending(p => p.Metadata?.CreationTimestamp ?? DateTime.MinValue).FirstOrDefault();
                if (pod != null)
                {
                    RunPodDiagnosis diagnosis = RunPodDiagnosis.OfPod(pod);
                    if (diagnosis.State != RunPodStateEnum.Pending) return pod;
                    if (!String.Equals(lastMessage, diagnosis.Message, StringComparison.Ordinal))
                    {
                        lastMessage = diagnosis.Message;
                        Lifecycle(reporter, "RunPodPending", "Run pod " + pod.Metadata.Name + " is pending: " + diagnosis.Message + ".");
                    }
                }
                else
                {
                    V1Job? job = await ReadJobAsync(client, ns, jobName, token).ConfigureAwait(false);
                    V1JobCondition? failed = job?.Status?.Conditions?.FirstOrDefault(c => c.Type == "Failed" && c.Status == "True");
                    if (job == null || failed != null) return null;
                }
                if (DateTime.UtcNow >= deadline) return pod;
                await Task.Delay(_Runtime.Settings.PollIntervalMs, token).ConfigureAwait(false);
            }
        }

        private async Task<RunCompleteRequest?> StreamAsync(IKubernetes client, string ns, string podName, PodLineParser parser, IRunReporter reporter, CancellationToken token)
        {
            int failures = 0;
            while (true)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    using (Stream stream = await client.CoreV1.ReadNamespacedPodLogAsync(podName, ns, container: RunPodNames.ContainerName, follow: true, cancellationToken: token).ConfigureAwait(false))
                    using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                    {
                        while (true)
                        {
                            string? line = await reader.ReadLineAsync(token).ConfigureAwait(false);
                            if (line == null) break;
                            PodLine? message = parser.Accept(line);
                            if (message == null) continue;
                            failures = 0;
                            await HandleAsync(message, reporter, token).ConfigureAwait(false);
                            if (parser.Completion != null) return parser.Completion.Complete;
                        }
                    }
                }
                catch (Exception e) when ((e is HttpOperationException || e is HttpRequestException || e is IOException) && !token.IsCancellationRequested)
                {
                    failures++;
                    _Log?.Invoke("log stream of pod " + podName + " broke (attempt " + failures + "): " + e.Message);
                    if (e is HttpOperationException http && http.Response != null && http.Response.StatusCode == HttpStatusCode.NotFound) return null;
                    if (failures > 30) throw;
                }

                // The stream ended without a completion: either the container stopped, or the stream broke. Reconnect
                // while the container runs (already accepted lines are skipped by sequence); otherwise read the log once
                // more without following, in case the end of it was missed, and stop.
                V1Pod? pod = await ReadPodAsync(client, ns, podName, token).ConfigureAwait(false);
                if (pod == null) return null;
                V1ContainerStatus? status = pod.Status?.ContainerStatuses?.FirstOrDefault(c => c.Name == RunPodNames.ContainerName);
                bool running = status?.State?.Running != null;
                if (!running)
                {
                    await DrainAsync(client, ns, podName, parser, reporter, token).ConfigureAwait(false);
                    return parser.Completion?.Complete;
                }
                await Task.Delay(Math.Min(5000, 250 * Math.Max(1, failures)), token).ConfigureAwait(false);
            }
        }

        private async Task DrainAsync(IKubernetes client, string ns, string podName, PodLineParser parser, IRunReporter reporter, CancellationToken token)
        {
            try
            {
                using (Stream stream = await client.CoreV1.ReadNamespacedPodLogAsync(podName, ns, container: RunPodNames.ContainerName, follow: false, cancellationToken: token).ConfigureAwait(false))
                using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                {
                    while (true)
                    {
                        string? line = await reader.ReadLineAsync(token).ConfigureAwait(false);
                        if (line == null) break;
                        PodLine? message = parser.Accept(line);
                        if (message != null) await HandleAsync(message, reporter, token).ConfigureAwait(false);
                        if (parser.Completion != null) return;
                    }
                }
            }
            catch (Exception e) when ((e is HttpOperationException || e is HttpRequestException || e is IOException) && !token.IsCancellationRequested)
            {
                _Log?.Invoke("final log read of pod " + podName + " failed: " + e.Message);
            }
        }

        private static async Task HandleAsync(PodLine message, IRunReporter reporter, CancellationToken token)
        {
            switch (message.Type)
            {
                case PodLineTypeEnum.Started:
                    await reporter.StartedAsync(message.ProcessId, token).ConfigureAwait(false);
                    break;
                case PodLineTypeEnum.Event:
                    if (message.Event != null)
                    {
                        message.Event.Sequence = 0;
                        reporter.Emit(message.Event);
                    }
                    break;
            }
        }

        private static async Task<V1Pod?> ReadPodAsync(IKubernetes client, string ns, string name, CancellationToken token)
        {
            try
            {
                return await client.CoreV1.ReadNamespacedPodAsync(name, ns, cancellationToken: token).ConfigureAwait(false);
            }
            catch (HttpOperationException e) when (e.Response != null && e.Response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        private static async Task<V1Job?> ReadJobAsync(IKubernetes client, string ns, string name, CancellationToken token)
        {
            try
            {
                return await client.BatchV1.ReadNamespacedJobAsync(name, ns, cancellationToken: token).ConfigureAwait(false);
            }
            catch (HttpOperationException e) when (e.Response != null && e.Response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        private async Task DeleteAsync(string jobName)
        {
            using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromSeconds(_DeleteTimeoutSeconds)))
            {
                try
                {
                    await _Runtime.DeleteJobAsync(jobName, timeout.Token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.K8sJobs, "result", "deleted");
                }
                catch (Exception e) when (e is OperationCanceledException || e is HttpRequestException || e is IOException)
                {
                    _Log?.Invoke("deleting job " + jobName + " failed: " + e.Message + "; reconciliation will retry");
                }
            }
        }

        private static string? MemoryLimit(V1Pod? pod)
        {
            V1Container? container = pod?.Spec?.Containers?.FirstOrDefault(c => c.Name == RunPodNames.ContainerName);
            if (container?.Resources?.Limits == null) return null;
            return container.Resources.Limits.TryGetValue("memory", out ResourceQuantity? quantity) ? quantity?.ToString() : null;
        }

        private static string Describe(HttpOperationException e)
        {
            string text = e.Message;
            if (text.Length > 1000) text = text.Substring(0, 1000);
            return text;
        }

        private static void Lifecycle(IRunReporter reporter, string code, string text)
        {
            Emit(reporter, RunEventTypeEnum.Lifecycle, code, text);
        }

        private static void Emit(IRunReporter reporter, RunEventTypeEnum type, string code, string text)
        {
            RunEventReport report = new RunEventReport();
            report.EventType = type;
            report.Code = code;
            report.Text = text;
            reporter.Emit(report);
        }

        private RunCompleteRequest Lost(IRunReporter reporter, string message)
        {
            Emit(reporter, RunEventTypeEnum.Warning, "RunPodLost", message + " The lease is left to expire so the control plane applies the deployment's retryOnNodeLoss policy.");
            _Log?.Invoke(message);
            return Fail(RunOutcomeEnum.NodeLost, message);
        }

        private static RunCompleteRequest Fail(RunOutcomeEnum outcome, string? message)
        {
            RunCompleteRequest complete = new RunCompleteRequest();
            complete.Status = outcome == RunOutcomeEnum.TimedOut ? RunStatusEnum.TimedOut : RunStatusEnum.Failed;
            complete.Outcome = outcome;
            complete.ErrorMessage = message;
            complete.CompletedUtc = DateTime.UtcNow;
            return complete;
        }

        #endregion
    }
}
