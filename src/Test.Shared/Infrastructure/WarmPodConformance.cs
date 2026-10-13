namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Kubernetes;
    using Garrison.Worker.Reporting;
    using Garrison.Worker.Settings;
    using k8s;
    using k8s.Models;
    using Touchstone.Core;

    /// <summary>Opt-in real Kubernetes warm-pod reservation, isolation, cancellation, and startup gate.</summary>
    public static class WarmPodConformance
    {
        /// <summary>Run against an isolated namespace using an operator-supplied kubeconfig and locally imported image.</summary>
        /// <param name="kubeconfig">Temporary kubeconfig path.</param>
        /// <param name="image">Imported worker image.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Diagnostic summary without credentials.</returns>
        public static async Task<string> RunAsync(string kubeconfig, string image, CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings
            {
                Enabled = true, KubeconfigPath = kubeconfig, RunNamespace = "garrison-conformance", RunImage = image,
                ImagePullPolicy = "Never", PendingTimeoutSeconds = 60
            };
            settings.WarmPods.MinCount = 2;
            settings.WarmPods.MaxCount = 2;
            using (KubernetesRuntime runtime = new KubernetesRuntime(settings))
            {
                Assert.True(await runtime.InitializeAsync("conformance-worker", token).ConfigureAwait(false), "Runtime connected");
                Assert.True(runtime.WarmAvailable, "Warm RBAC available");
                using (KubernetesWarmPool pool = new KubernetesWarmPool(runtime, "conformance", "worker-a"))
                using (KubernetesWarmPool other = new KubernetesWarmPool(runtime, "conformance", "worker-b", active: () => new HashSet<string>()))
                {
                    await Task.WhenAll(pool.ReconcileAsync(token), other.ReconcileAsync(token)).ConfigureAwait(false);
                    DateTime deadline = DateTime.UtcNow.AddSeconds(90);
                    while (true)
                    {
                        V1PodList pods = await runtime.Client!.CoreV1.ListNamespacedPodAsync(runtime.Namespace, labelSelector: "garrison.io/warm-group=" + pool.Group, cancellationToken: token).ConfigureAwait(false);
                        Assert.True(pods.Items.Count <= 2, "Shared refill remains bounded");
                        if (pods.Items.Count == 2 && pods.Items.All(p => p.Status?.Conditions?.Any(c => c.Type == "Ready" && c.Status == "True") == true)) break;
                        Assert.True(DateTime.UtcNow < deadline, "Warm stock becomes Ready");
                        await Task.Delay(250, token).ConfigureAwait(false);
                    }
                    RunAssignment first = Assignment("one", true, false);
                    RunAssignment second = Assignment("two", true, false);
                    V1Pod?[] reserved = await Task.WhenAll(pool.TakeAsync(first, true, token), other.TakeAsync(second, true, token)).ConfigureAwait(false);
                    Assert.True(reserved.All(p => p != null) && reserved[0]!.Metadata.Uid != reserved[1]!.Metadata.Uid, "Competing workers reserve distinct pods");
                    await other.ReconcileAsync(token).ConfigureAwait(false);
                    V1PodList orphans = await runtime.Client!.CoreV1.ListNamespacedPodAsync(runtime.Namespace, labelSelector: "garrison.io/warm-group=" + pool.Group, cancellationToken: token).ConfigureAwait(false);
                    Assert.True(orphans.Items.All(p => p.Metadata.Name != reserved[1]!.Metadata.Name || p.Metadata.DeletionTimestamp != null), "A nonleader reconciles its own lost assignments");
                    foreach (V1Pod? pod in reserved) await pool.DeleteAsync(pod!.Metadata.Name, token).ConfigureAwait(false);
                    // Wait for deleting stock to disappear before refilling to keep the test's absolute count strict.
                    await Task.Delay(1500, token).ConfigureAwait(false);
                    List<double> warm = new List<double>();
                    List<double> cold = new List<double>();
                    KubernetesJobRunExecutor executor = new KubernetesJobRunExecutor(runtime, "worker-a", new List<string>(), 1000, warmPool: pool);
                    long warmWritesBefore = pool.ApiWrites + other.ApiWrites;
                    for (int i = 0; i < 6; i++)
                    {
                        await Task.WhenAll(pool.ReconcileAsync(token), other.ReconcileAsync(token)).ConfigureAwait(false);
                        await WaitReadyAsync(runtime, pool.Group, token).ConfigureAwait(false);
                        RunAssignment assignment = Assignment("warm" + i, true, false);
                        InMemoryRunReporter reporter = new InMemoryRunReporter();
                        long start = Stopwatch.GetTimestamp();
                        Task<RunCompleteRequest> running = executor.ExecuteAsync(assignment, reporter, token);
                        warm.Add(await FirstEventAsync(reporter, running, start, token).ConfigureAwait(false));
                        RunCompleteRequest complete = await running.ConfigureAwait(false);
                        Assert.Equal(RunStatusEnum.Succeeded, complete.Status, "Warm run succeeds: " + complete.ErrorMessage);
                        Assert.True(complete.ResultText?.Contains("CONFORMANCE_ISOLATED", StringComparison.Ordinal) == true, "Warm isolation checks execute");
                        reporter = new InMemoryRunReporter();
                        start = Stopwatch.GetTimestamp();
                        running = executor.ExecuteAsync(Assignment("cold" + i, false, false), reporter, token);
                        cold.Add(await FirstEventAsync(reporter, running, start, token).ConfigureAwait(false));
                        Assert.Equal(RunStatusEnum.Succeeded, (await running.ConfigureAwait(false)).Status, "Cold path preserved");
                    }
                    long warmWritesAfter = pool.ApiWrites + other.ApiWrites;
                    await Task.WhenAll(pool.ReconcileAsync(token), other.ReconcileAsync(token)).ConfigureAwait(false);
                    await WaitReadyAsync(runtime, pool.Group, token).ConfigureAwait(false);
                    using (CancellationTokenSource cancel = CancellationTokenSource.CreateLinkedTokenSource(token))
                    {
                        InMemoryRunReporter reporter = new InMemoryRunReporter();
                        Task<RunCompleteRequest> running = executor.ExecuteAsync(Assignment("cancel", true, true), reporter, cancel.Token);
                        await FirstEventAsync(reporter, running, Stopwatch.GetTimestamp(), token).ConfigureAwait(false);
                        cancel.Cancel();
                        Assert.Equal(RunStatusEnum.Cancelled, (await running.ConfigureAwait(false)).Status, "Cancellation stops warm execution");
                    }
                    V1PodList after = await runtime.Client!.CoreV1.ListNamespacedPodAsync(runtime.Namespace, labelSelector: "garrison.io/warm-state=claimed", cancellationToken: token).ConfigureAwait(false);
                    Assert.True(after.Items.All(p => p.Metadata.DeletionTimestamp != null), "Consumed pods are deleted, never returned to stock");
                    settings.WarmPods.Enabled = false;
                    long coldWritesBeforeReject = executor.ColdApiWrites;
                    RunCompleteRequest rejected = await executor.ExecuteAsync(Assignment("warm-disabled", true, false), new InMemoryRunReporter(), token).ConfigureAwait(false);
                    Assert.Equal(RunOutcomeEnum.NoCapableWorker, rejected.Outcome, "Explicit warm cannot fall back after warming is disabled");
                    Assert.Equal(coldWritesBeforeReject, executor.ColdApiWrites, "Rejected warm run creates no cold Job");
                    warm.Sort(); cold.Sort();
                    return "PASS warm isolation, distinct reservations, shared bounds, orphan cleanup, completion, cancellation, and deletion. Warm first protocol event p50=" + warm[2].ToString("F3") + "s p95=" + warm[5].ToString("F3")
                        + "s; cold p50=" + cold[2].ToString("F3") + "s p95=" + cold[5].ToString("F3") + "s. Successful direct API writes per measured run: warm=" + ((warmWritesAfter - warmWritesBefore) / 6.0).ToString("F2") + "; cold=" + (executor.ColdApiWrites / 6.0).ToString("F2") + " (controller writes excluded).";
                }
            }
        }

        private static RunAssignment Assignment(string suffix, bool warm, bool slow)
        {
            ExecutionSpec spec = new ExecutionSpec
            {
                RunId = "run_conformance_" + suffix, TenantId = "ten_conformance", AgentName = "conformance",
                Executor = RunExecutorEnum.KubernetesJob, HarnessType = HarnessTypeEnum.Generic, Executable = "/bin/sh",
                Parser = OutputParserEnum.PlainText, TimeoutSeconds = 60, KillGraceSeconds = 1,
                RequiredCapabilities = new ExecutorRequirements { ColdStartClass = warm ? ExecutorColdStartEnum.Warm : ExecutorColdStartEnum.Cold },
                Arguments = new List<string> { "-c", "set -eu; test \"$(id -u)\" = 10001; test ! -e /var/run/secrets/kubernetes.io/serviceaccount/token; test ! -e /garrison/runs/conformance-marker; touch /garrison/runs/conformance-marker; case \"$HOME\" in /garrison/runs/*/home) ;; *) exit 41 ;; esac; case \"$PWD\" in /garrison/runs/*/work) ;; *) exit 42 ;; esac; if touch /garrison-readonly-probe 2>/dev/null; then exit 43; fi; printf 'CONFORMANCE_ISOLATED\\n'; sleep " + (slow ? "30" : "0.1") }
            };
            return new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec };
        }

        private static async Task WaitReadyAsync(KubernetesRuntime runtime, string group, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(90);
            while (true)
            {
                V1PodList pods = await runtime.Client!.CoreV1.ListNamespacedPodAsync(runtime.Namespace, labelSelector: "garrison.io/warm-group=" + group + ",garrison.io/warm-state=idle", cancellationToken: token).ConfigureAwait(false);
                if (pods.Items.Any(p => p.Metadata.DeletionTimestamp == null && p.Status?.Conditions?.Any(c => c.Type == "Ready" && c.Status == "True") == true)) return;
                Assert.True(DateTime.UtcNow < deadline, "Warm refill becomes Ready");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<double> FirstEventAsync(InMemoryRunReporter reporter, Task<RunCompleteRequest> running, long start, CancellationToken token)
        {
            while (!reporter.Started)
            {
                if (running.IsCompleted)
                {
                    RunCompleteRequest complete = await running.ConfigureAwait(false);
                    throw new TestAssertionException("Run ended before Started: " + complete.ErrorMessage);
                }
                await Task.Delay(5, token).ConfigureAwait(false);
            }
            return Stopwatch.GetElapsedTime(start).TotalSeconds;
        }
    }
}
