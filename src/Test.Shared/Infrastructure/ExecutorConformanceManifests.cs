namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Worker.Kubernetes;
    using Garrison.Worker.Settings;
    using k8s;
    using k8s.Models;

    /// <summary>Creates credential-free Jobs using the production builder for the local Kubernetes conformance gate.</summary>
    public static class ExecutorConformanceManifests
    {
        /// <summary>Write two independent run Jobs and their spec Secrets.</summary>
        /// <param name="directory">Output directory.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static async Task WriteAsync(string directory, CancellationToken token = default)
        {
            if (String.IsNullOrWhiteSpace(directory)) throw new ArgumentException("An output directory is required.", nameof(directory));
            Directory.CreateDirectory(directory);
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            for (int i = 0; i < 2; i++)
            {
                ExecutionSpec spec = new ExecutionSpec();
                spec.RunId = "run_conformance_" + i;
                spec.TenantId = "ten_conformance";
                spec.AgentName = "conformance";
                spec.Executor = RunExecutorEnum.KubernetesJob;
                spec.HarnessType = HarnessTypeEnum.Generic;
                spec.Executable = "/bin/sh";
                spec.Arguments = new List<string>
                {
                    "-c",
                    "set -eu; test \"$(id -u)\" = 10001; test ! -e /var/run/secrets/kubernetes.io/serviceaccount/token; "
                    + "test ! -e /garrison/runs/conformance-marker; printf isolated > /garrison/runs/conformance-marker; "
                    + "case \"$HOME\" in /garrison/runs/*/home) ;; *) exit 41 ;; esac; "
                    + "case \"$PWD\" in /garrison/runs/*/work) ;; *) exit 42 ;; esac; "
                    + "if touch /garrison-readonly-probe 2>/dev/null; then exit 43; fi; "
                    + "printf 'CONFORMANCE_ISOLATED\\n'; sleep 3; printf 'CONFORMANCE_COMPLETE\\n'"
                };
                spec.Parser = OutputParserEnum.PlainText;
                spec.TimeoutSeconds = 60;
                spec.KillGraceSeconds = 1;
                RunAssignment assignment = new RunAssignment { RunId = spec.RunId, Epoch = 1, Spec = spec };
                RunPodEnvelope envelope = new RunPodEnvelope { Nonce = PodLineProtocol.NewNonce(), Assignment = assignment };
                RunPodRequest request = new RunPodRequest
                {
                    Assignment = assignment,
                    NodeName = "conformance-worker",
                    Namespace = "garrison-conformance",
                    Image = "jchristn77/garrison-worker:v0.1.0-alpha",
                    ImagePullPolicy = "Never",
                    EnvelopeJson = Serializer.Serialize(envelope)
                };
                V1Job job = builder.BuildJob(request);
                V1Secret secret = builder.BuildSecret(request, null);
                await File.WriteAllTextAsync(Path.Combine(directory, "job-" + i + ".json"), KubernetesJson.Serialize(job), token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(directory, "secret-" + i + ".json"), KubernetesJson.Serialize(secret), token).ConfigureAwait(false);
            }
        }
    }
}
