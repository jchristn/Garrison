namespace Garrison.Core.Telemetry
{
    using System;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// The labels every per-run metric carries (P13.21): tenant, agent, deployment, harness, and served model. Values are
    /// folded by the cardinality guard when they are recorded. Not thread-safe; build one per measurement.
    /// </summary>
    public class RunMetricLabels
    {
        #region Public-Members

        /// <summary>
        /// Tenant identifier. Default empty (reported as none).
        /// </summary>
        public string Tenant { get; set; } = String.Empty;

        /// <summary>
        /// Agent name. Default empty.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Deployment name (the identifier when the name is not known). Default empty.
        /// </summary>
        public string Deployment { get; set; } = String.Empty;

        /// <summary>
        /// Harness type. Default empty.
        /// </summary>
        public string Harness { get; set; } = String.Empty;

        /// <summary>
        /// Served model as the harness reported it, or empty when not known (reported as none).
        /// </summary>
        public string Model { get; set; } = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public RunMetricLabels()
        {
        }

        /// <summary>
        /// Labels for a run.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="deploymentName">Deployment name, or null to report the deployment identifier.</param>
        /// <returns>Labels.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static RunMetricLabels For(Run run, string? deploymentName)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            RunMetricLabels labels = new RunMetricLabels();
            labels.Tenant = run.TenantId;
            labels.Agent = run.AgentName;
            labels.Deployment = String.IsNullOrEmpty(deploymentName) ? run.DeploymentId : deploymentName;
            labels.Harness = run.HarnessType.ToString();
            labels.Model = run.ServedModel ?? String.Empty;
            return labels;
        }

        /// <summary>
        /// Labels for a run being executed from its execution spec (worker side).
        /// </summary>
        /// <param name="spec">Execution spec.</param>
        /// <param name="model">Served model, or null.</param>
        /// <returns>Labels.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spec is null.</exception>
        public static RunMetricLabels For(ExecutionSpec spec, string? model)
        {
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            RunMetricLabels labels = new RunMetricLabels();
            labels.Tenant = spec.TenantId;
            labels.Agent = spec.AgentName;
            labels.Deployment = String.IsNullOrEmpty(spec.DeploymentName) ? spec.DeploymentId : spec.DeploymentName;
            labels.Harness = spec.HarnessType.ToString();
            labels.Model = model ?? String.Empty;
            return labels;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The guard label for a run outcome: repetition, no_progress, output_limit, timeout, blocked, or null when the
        /// outcome is not a guard trip.
        /// </summary>
        /// <param name="outcome">Outcome.</param>
        /// <returns>Guard label, or null.</returns>
        public static string? Guard(RunOutcomeEnum outcome)
        {
            switch (outcome)
            {
                case RunOutcomeEnum.RepetitionDetected:
                    return "repetition";
                case RunOutcomeEnum.NoProgress:
                    return "no_progress";
                case RunOutcomeEnum.OutputLimitExceeded:
                    return "output_limit";
                case RunOutcomeEnum.TimedOut:
                    return "timeout";
                case RunOutcomeEnum.NoCapableWorker:
                    return "blocked";
                default:
                    return null;
            }
        }

        #endregion
    }
}
