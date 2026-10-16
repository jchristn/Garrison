namespace Test.Shared.Suites
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Worker.Execution;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Named conformance gates for the capabilities the built-in executors actually advertise. Reuses the behavior
    /// cases themselves rather than maintaining copies. Kernel/container verification has a separate local runner.
    /// </summary>
    public static class ExecutorConformanceSuite
    {
        /// <summary>Build one conformance suite per built-in executor.</summary>
        /// <returns>Process and KubernetesJob conformance suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            string process = "executor-conformance-process";
            string kubernetes = "executor-conformance-kubernetes";
            List<TestCaseDescriptor> processCases = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor(process, "declared-capabilities", "Process: immediate execution, isolated snapshots, and cross-node session continuation are advertised", ct => DeclaredAsync(RunExecutorEnum.Process, ct))
            };
            Copy(processCases, process, WorkerSuite.Build().First(s => s.SuiteId == "worker-executor"),
                "success-plain", "environment", "private-directories", "retention", "cancellation", "timeout", "portable-snapshot");
            Copy(processCases, process, ConversationSuite.Build().First(s => s.SuiteId == "conversation-unit"),
                "executor-formats", "executor-state-lost");
            List<TestCaseDescriptor> kubernetesCases = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor(kubernetes, "declared-capabilities", "KubernetesJob: only Container isolation and Cold startup are advertised", ct => DeclaredAsync(RunExecutorEnum.KubernetesJob, ct))
            };
            Copy(kubernetesCases, kubernetes, KubernetesExecutorSuite.Build().First(s => s.SuiteId == "k8s-executor"),
                "manifest-job", "manifest-secret", "run-one-fake", "protocol-injection", "protocol-limits", "routing", "diagnosis", "run-one-bad-spec");
            return new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor(process, "Process executor conformance", processCases),
                new TestSuiteDescriptor(kubernetes, "KubernetesJob executor conformance", kubernetesCases)
            };
        }

        private static void Copy(List<TestCaseDescriptor> target, string id, TestSuiteDescriptor source, params string[] cases)
        {
            foreach (string caseId in cases)
            {
                TestCaseDescriptor original = source.Cases.Single(c => c.CaseId == caseId);
                target.Add(new TestCaseDescriptor(id, caseId, original.DisplayName, original.ExecuteAsync));
            }
        }

        private static Task DeclaredAsync(RunExecutorEnum executor, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            ExecutorCapabilities capabilities = ExecutorCapabilityProfiles.For(executor);
            bool process = executor == RunExecutorEnum.Process;
            Assert.Equal(executor, capabilities.Executor, "Reported executor");
            Assert.Equal(process ? ExecutorIsolationEnum.Process : ExecutorIsolationEnum.Container, capabilities.Isolation, "Isolation promise");
            Assert.Equal(process ? ExecutorColdStartEnum.Immediate : ExecutorColdStartEnum.Cold, capabilities.ColdStartClass!.Value, "Startup promise");
            Assert.Equal(process, capabilities.SessionContinuation, "Only Process retains harness sessions");
            Assert.True(!capabilities.EgressControl, "Process and KubernetesJob do not promise generic egress control");
            Assert.Equal(process, capabilities.FilesystemSnapshot, "Only Process supports filesystem checkpoints");
            Assert.Equal(process, capabilities.CrossNodeRestore, "Only Process supports portable checkpoint restoration");
            capabilities.FilesystemSnapshot = !process;
            Assert.Equal(process, ExecutorCapabilityProfiles.For(executor).FilesystemSnapshot, "Reports are independent and cannot alter future registrations");
            return Task.CompletedTask;
        }
    }
}
