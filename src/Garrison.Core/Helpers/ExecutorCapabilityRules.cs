namespace Garrison.Core.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Executor capability validation and placement matching.</summary>
    public static class ExecutorCapabilityRules
    {
        /// <summary>Validate enum values in a capability requirement.</summary>
        /// <param name="value">Requirements.</param>
        /// <exception cref="ArgumentException">Thrown for unknown capability values.</exception>
        public static void Validate(ExecutorRequirements value)
        {
            if (value == null) throw new ArgumentNullException(nameof(value));
            if (!Enum.IsDefined(value.Isolation)) throw new ArgumentException("Unknown executor isolation level.");
            if (value.ColdStartClass.HasValue && !Enum.IsDefined(value.ColdStartClass.Value)) throw new ArgumentException("Unknown executor startup class.");
        }

        /// <summary>
        /// Minimum isolation a trust level needs (P11.14): Container for Untrusted, Process (no minimum) for Trusted.
        /// </summary>
        /// <param name="trustLevel">Trust level.</param>
        /// <returns>Minimum isolation.</returns>
        public static ExecutorIsolationEnum MinimumIsolation(DeploymentTrustLevelEnum trustLevel)
        {
            return trustLevel == DeploymentTrustLevelEnum.Untrusted ? ExecutorIsolationEnum.Container : ExecutorIsolationEnum.Process;
        }

        /// <summary>
        /// The effective placement requirement of a deployment: an independent copy of its required capabilities with
        /// the isolation raised to the trust level's minimum, and, when the deployment has an egress allowlist (P11.15),
        /// EgressControl required and isolation raised to at least Container. This is the only place trust level and
        /// egress rules become placement requirements; admission stores the result on the run, and every claim path
        /// (candidate selection, the atomic claim, the delegated child reserve claim) and blocked-run detection match
        /// against the stored run columns.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <returns>Effective requirements.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deployment is null.</exception>
        public static ExecutorRequirements Effective(Deployment deployment)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            ExecutorRequirements effective = deployment.RequiredCapabilities.Clone();
            ExecutorIsolationEnum minimum = MinimumIsolation(deployment.TrustLevel);
            if (effective.Isolation < minimum) effective.Isolation = minimum;
            if (deployment.EgressRules.Count > 0)
            {
                effective.EgressControl = true;
                if (effective.Isolation < ExecutorIsolationEnum.Container) effective.Isolation = ExecutorIsolationEnum.Container;
            }
            return effective;
        }

        /// <summary>
        /// Fill a new run's placement from its deployment at admission: trust level, resolved executor, and effective
        /// requirements. Later deployment edits do not change the run.
        /// </summary>
        /// <param name="run">Run being admitted.</param>
        /// <param name="deployment">Deployment.</param>
        /// <param name="pool">The deployment's node pool when its executor is unset, else null.</param>
        /// <exception cref="ArgumentNullException">Thrown when run or deployment is null.</exception>
        public static void Admit(Run run, Deployment deployment, NodePool? pool)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            run.TrustLevel = deployment.TrustLevel;
            run.Executor = RunExecutors.Resolve(deployment, pool);
            run.RequiredCapabilities = Effective(deployment);
        }

        /// <summary>
        /// Whether a node offers an executor with at least a run's required isolation for the run's executor and, when
        /// the run requires it, egress control (P11.15), ignoring every other capability. Used to name missing isolation
        /// or egress enforcement as the blocked reason of Untrusted runs and runs with an egress allowlist.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="run">Run.</param>
        /// <returns>True when the node can isolate the run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node or run is null.</exception>
        public static bool Isolates(Node node, Run run)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (run == null) throw new ArgumentNullException(nameof(run));
            return Of(node).Any(c => c.Executor == run.Executor && c.Isolation >= run.RequiredCapabilities.Isolation
                && (!run.RequiredCapabilities.EgressControl || c.EgressControl));
        }

        /// <summary>True when a requirement asks for more than legacy Process placement.</summary>
        /// <param name="value">Requirements.</param>
        /// <returns>Whether capabilities must be reported.</returns>
        public static bool RequiresReport(ExecutorRequirements value)
        {
            return value.Isolation != ExecutorIsolationEnum.Process || value.EgressControl || value.FilesystemSnapshot
                || value.SessionContinuation || value.CrossNodeRestore || value.ColdStartClass.HasValue;
        }

        /// <summary>Reports for a node, with conservative legacy defaults for unreported executor names.</summary>
        /// <param name="node">Node.</param>
        /// <returns>Capability records.</returns>
        public static List<ExecutorCapabilities> Of(Node node)
        {
            return RunExecutors.Of(node).Select(e => node.ExecutorCapabilities.FirstOrDefault(c => c.Executor == e)
                ?? new ExecutorCapabilities { Executor = e }).ToList();
        }

        /// <summary>Whether a node can satisfy this admitted run's executor and capability requirements.</summary>
        /// <param name="node">Node.</param>
        /// <param name="run">Run.</param>
        /// <returns>Whether the run can execute.</returns>
        public static bool Supports(Node node, Run run)
        {
            return Of(node).Any(c => c.Executor == run.Executor && Matches(c, run.RequiredCapabilities));
        }

        /// <summary>Match ordered isolation, required flags, and optional exact startup class.</summary>
        /// <param name="capability">Capability record.</param>
        /// <param name="required">Required capabilities.</param>
        /// <returns>True when every requirement is satisfied.</returns>
        public static bool Matches(ExecutorCapabilities capability, ExecutorRequirements required)
        {
            return capability.Isolation >= required.Isolation
                && (!required.EgressControl || capability.EgressControl)
                && (!required.FilesystemSnapshot || capability.FilesystemSnapshot)
                && (!required.SessionContinuation || capability.SessionContinuation)
                && (!required.CrossNodeRestore || capability.CrossNodeRestore)
                && (!required.ColdStartClass.HasValue || required.ColdStartClass == capability.ColdStartClass
                    || (required.ColdStartClass == ExecutorColdStartEnum.Warm && capability.WarmStart));
        }
    }
}
