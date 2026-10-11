namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using k8s.Models;

    /// <summary>
    /// Reads a run pod's status: whether it started, is still pending, or failed, and why (plan P11.1). Turns
    /// Kubernetes reasons into run outcomes with clear messages. Stateless and thread-safe.
    /// </summary>
    public class RunPodDiagnosis
    {
        #region Public-Members

        /// <summary>
        /// State.
        /// </summary>
        public RunPodStateEnum State { get; set; } = RunPodStateEnum.Pending;

        /// <summary>
        /// Outcome when failed: PodFailed, TimedOut, or NodeLost (the pod vanished or was evicted while running; the
        /// worker leaves such runs to lease expiry so the deployment's retry policy applies).
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.PodFailed;

        /// <summary>
        /// Human-readable explanation (why it is pending, or why it failed).
        /// </summary>
        public string Message { get; set; } = String.Empty;

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _FatalWaitingReasons = new HashSet<string>(StringComparer.Ordinal)
        {
            "ImagePullBackOff", "InvalidImageName", "ErrImageNeverPull", "CreateContainerConfigError", "CreateContainerError", "RunContainerError", "CrashLoopBackOff"
        };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Diagnose a pod.
        /// </summary>
        /// <param name="pod">Pod.</param>
        /// <returns>Diagnosis.</returns>
        /// <exception cref="ArgumentNullException">Thrown when pod is null.</exception>
        public static RunPodDiagnosis OfPod(V1Pod pod)
        {
            if (pod == null) throw new ArgumentNullException(nameof(pod));
            V1PodStatus status = pod.Status ?? new V1PodStatus();
            RunPodDiagnosis diagnosis = new RunPodDiagnosis();

            if (String.Equals(status.Reason, "Evicted", StringComparison.Ordinal))
            {
                diagnosis.State = RunPodStateEnum.Failed;
                diagnosis.Message = "Run pod was evicted" + Suffix(status.Message) + ".";
                return diagnosis;
            }
            if (String.Equals(status.Reason, "DeadlineExceeded", StringComparison.Ordinal))
            {
                diagnosis.State = RunPodStateEnum.Failed;
                diagnosis.Outcome = RunOutcomeEnum.TimedOut;
                diagnosis.Message = "Run pod exceeded the Job's active deadline" + Suffix(status.Message) + ".";
                return diagnosis;
            }

            V1ContainerStatus? container = Container(status);
            if (container?.State?.Running != null || container?.State?.Terminated != null)
            {
                diagnosis.State = RunPodStateEnum.Started;
                return diagnosis;
            }
            if (String.Equals(status.Phase, "Running", StringComparison.Ordinal) || String.Equals(status.Phase, "Succeeded", StringComparison.Ordinal))
            {
                diagnosis.State = RunPodStateEnum.Started;
                return diagnosis;
            }

            V1ContainerStateWaiting? waiting = container?.State?.Waiting;
            if (waiting != null && !String.IsNullOrEmpty(waiting.Reason) && _FatalWaitingReasons.Contains(waiting.Reason))
            {
                diagnosis.State = RunPodStateEnum.Failed;
                diagnosis.Message = "Run pod container cannot start: " + waiting.Reason + Suffix(waiting.Message) + ".";
                return diagnosis;
            }
            if (String.Equals(status.Phase, "Failed", StringComparison.Ordinal))
            {
                diagnosis.State = RunPodStateEnum.Failed;
                diagnosis.Message = "Run pod failed before its container started" + Suffix(status.Reason) + Suffix(status.Message) + ".";
                return diagnosis;
            }

            diagnosis.State = RunPodStateEnum.Pending;
            V1PodCondition? scheduled = status.Conditions?.FirstOrDefault(c => c.Type == "PodScheduled");
            if (scheduled != null && String.Equals(scheduled.Status, "False", StringComparison.Ordinal))
            {
                diagnosis.Message = "not scheduled" + Suffix(scheduled.Reason) + Suffix(scheduled.Message);
            }
            else if (waiting != null)
            {
                diagnosis.Message = "container waiting" + Suffix(waiting.Reason) + Suffix(waiting.Message);
            }
            else
            {
                diagnosis.Message = "pod " + (status.Phase ?? "Pending");
            }
            return diagnosis;
        }

        /// <summary>
        /// Explain why a started run pod ended without reporting a completion.
        /// </summary>
        /// <param name="pod">Pod, or null when it no longer exists.</param>
        /// <param name="memoryLimit">The run container's memory limit, for the message; null when unknown.</param>
        /// <returns>Diagnosis with state Failed.</returns>
        public static RunPodDiagnosis OfEndedWithoutCompletion(V1Pod? pod, string? memoryLimit)
        {
            RunPodDiagnosis diagnosis = new RunPodDiagnosis();
            diagnosis.State = RunPodStateEnum.Failed;
            if (pod == null)
            {
                diagnosis.Outcome = RunOutcomeEnum.NodeLost;
                diagnosis.Message = "Run pod disappeared before reporting a completion (deleted, or its node was lost).";
                return diagnosis;
            }
            V1PodStatus status = pod.Status ?? new V1PodStatus();
            if (String.Equals(status.Reason, "Evicted", StringComparison.Ordinal))
            {
                diagnosis.Outcome = RunOutcomeEnum.NodeLost;
                diagnosis.Message = "Run pod was evicted" + Suffix(status.Message) + ".";
                return diagnosis;
            }
            if (String.Equals(status.Reason, "DeadlineExceeded", StringComparison.Ordinal))
            {
                diagnosis.Outcome = RunOutcomeEnum.TimedOut;
                diagnosis.Message = "Run pod exceeded the Job's active deadline" + Suffix(status.Message) + ".";
                return diagnosis;
            }
            V1ContainerStateTerminated? terminated = Container(status)?.State?.Terminated ?? Container(status)?.LastState?.Terminated;
            if (terminated != null)
            {
                if (String.Equals(terminated.Reason, "OOMKilled", StringComparison.Ordinal))
                {
                    diagnosis.Message = "Run pod was OOMKilled" + (String.IsNullOrEmpty(memoryLimit) ? String.Empty : " (memory limit " + memoryLimit + ")") + "; raise podResources.memoryLimit on the deployment.";
                    return diagnosis;
                }
                diagnosis.Message = "Run pod exited with code " + terminated.ExitCode + Suffix(terminated.Reason) + " without reporting a completion" + Suffix(terminated.Message) + ".";
                return diagnosis;
            }
            diagnosis.Message = "Run pod log ended without a completion (pod phase " + (status.Phase ?? "unknown") + Suffix(status.Reason) + ").";
            return diagnosis;
        }

        #endregion

        #region Private-Methods

        private static V1ContainerStatus? Container(V1PodStatus status)
        {
            if (status.ContainerStatuses == null) return null;
            return status.ContainerStatuses.FirstOrDefault(c => c.Name == RunPodNames.ContainerName) ?? status.ContainerStatuses.FirstOrDefault();
        }

        private static string Suffix(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return String.Empty;
            string trimmed = text.Trim().TrimEnd('.');
            if (trimmed.Length > 500) trimmed = trimmed.Substring(0, 500);
            return ": " + trimmed;
        }

        #endregion
    }
}
