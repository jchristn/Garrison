namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using Radiant;

    /// <summary>
    /// Validates a run's final output against the agent's output schema when the run completes, decides whether one
    /// repair attempt may start, compiles the repair (resuming the harness session with the Repair prompt template),
    /// and writes one Warning run event per failed validation (plan P3.2.7). Thread-safe.
    /// </summary>
    public class StructuredOutputService
    {
        #region Public-Members

        /// <summary>
        /// Validator used for every check. Its settings (for example <see cref="OutputSchemaValidator.MaxErrors"/>)
        /// may be changed at startup.
        /// </summary>
        public OutputSchemaValidator Validator
        {
            get
            {
                return _Validator;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly Func<InvocationCompiler> _Compiler;
        private readonly AuthenticationService _Authentication;
        private readonly RuntimeOptions _Options;
        private readonly GarrisonTelemetry _Telemetry;
        private readonly OutputSchemaValidator _Validator = new OutputSchemaValidator();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="compiler">Compiler accessor.</param>
        /// <param name="authentication">Authentication service (issues run tokens for repairs of delegating agents).</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public StructuredOutputService(DatabaseDriverBase database, Func<InvocationCompiler> compiler, AuthenticationService authentication, RuntimeOptions options, GarrisonTelemetry telemetry)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Compiler = compiler ?? throw new ArgumentNullException(nameof(compiler));
            _Authentication = authentication ?? throw new ArgumentNullException(nameof(authentication));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a successful execution's output when the run's agent has an output schema.
        /// </summary>
        /// <param name="run">Run as stored (before applying the report).</param>
        /// <param name="request">Completion report of a successful execution.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The check, or null when the agent has no output schema (validation skipped).</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or request is null.</exception>
        public async Task<StructuredOutputCheck?> CheckAsync(Run run, RunCompleteRequest request, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (request == null) throw new ArgumentNullException(nameof(request));

            Agent? agent = await _Database.Agents.ReadAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false);
            if (agent == null || String.IsNullOrWhiteSpace(agent.OutputSchemaJson)) return null;

            StructuredOutputCheck check = new StructuredOutputCheck();
            check.Agent = agent;
            check.Validation = _Validator.Validate(agent.OutputSchemaJson!, request.StructuredOutputJson, request.ResultText);
            TagList validation = GarrisonMetrics.Tags("result", check.Validation.Valid ? "valid" : "invalid", "execution", request.RepairAttempt > 0 ? "repair" : "original", "harness", run.HarnessType.ToString(), "tenant", run.TenantId);
            validation.Add("agent", GarrisonMetrics.Fold("agent", run.AgentName));
            GarrisonMetrics.Count(GarrisonMetricCatalog.SchemaValidations, 1, validation);
            if (check.Validation.Valid) return check;

            check.NoRepairReason = await RepairBlockerAsync(run, request, check.Validation, token).ConfigureAwait(false);
            check.CanRepair = check.NoRepairReason == null;
            return check;
        }

        /// <summary>
        /// Compile the structured output repair for a run and build the completion response that hands it to the
        /// worker. Sets <see cref="Run.DeadlineUtc"/> on the run to cover the repair and records the repair template
        /// version on the run. Does not write the run row; the caller records the repair with
        /// <c>Runs.RecordRepairAsync</c>.
        /// </summary>
        /// <param name="run">Run (with children loaded).</param>
        /// <param name="repair">Repair inputs.</param>
        /// <param name="eventSequenceStart">Last stored event sequence; the worker numbers repair events after it.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Completion response carrying the repair spec.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or repair is null.</exception>
        /// <exception cref="CompilationException">Thrown when the repair cannot be compiled.</exception>
        public async Task<RunCompleteResponse> BuildRepairAsync(Run run, CompilationRepair repair, long eventSequenceStart, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (repair == null) throw new ArgumentNullException(nameof(repair));

            Agent? agent = await _Database.Agents.ReadAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false);
            Deployment? deployment = await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            HarnessProfile? profile = deployment == null ? null : await _Database.HarnessProfiles.ReadAsync(run.TenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
            int timeoutSeconds = InvocationCompiler.EffectiveTimeoutSeconds(deployment, profile, run.Parameters, 1800, _Options.MaxRunSeconds);
            DateTime deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds + _Options.DeadlineGraceSeconds);

            string? runToken = null;
            if (agent != null && (agent.DelegationMode != DelegationModeEnum.None || (deployment != null && (deployment.ApprovalsEnabled || deployment.ArtifactGlobs.Count > 0))))
            {
                runToken = await _Authentication.IssueForRunAsync(run, run.LeaseEpoch, deadline, token).ConfigureAwait(false);
            }

            CompilationResult compiled = await _Compiler().CompileRepairAsync(run, runToken, repair, token).ConfigureAwait(false);
            compiled.Spec.TimeoutSeconds = Math.Min(compiled.Spec.TimeoutSeconds > 0 ? compiled.Spec.TimeoutSeconds : timeoutSeconds, _Options.MaxRunSeconds);
            run.DeadlineUtc = DateTime.UtcNow.AddSeconds(compiled.Spec.TimeoutSeconds + _Options.DeadlineGraceSeconds);

            List<RunTemplateVersion> added = compiled.TemplateVersions
                .Where(v => !run.TemplateVersions.Any(e => e.TemplateId == v.TemplateId && e.Version == v.Version))
                .ToList();
            if (added.Count > 0)
            {
                run.TemplateVersions = run.TemplateVersions.Concat(added).ToList();
                await _Database.Runs.ReplaceTemplateVersionsAsync(run, token).ConfigureAwait(false);
            }

            RunCompleteResponse response = new RunCompleteResponse();
            response.Message = "Structured output failed schema validation; run repair attempt " + repair.Attempt + ".";
            response.Repair = compiled.Spec;
            response.RepairAttempt = repair.Attempt;
            response.EventSequenceStart = eventSequenceStart;
            GarrisonMetrics.Count(GarrisonMetricCatalog.Repairs, "harness", run.HarnessType.ToString(), "tenant", run.TenantId, "agent", run.AgentName);
            return response;
        }

        /// <summary>
        /// Append the Warning run event for a failed validation.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="repairAttempt">Execution that failed: 0 original, 1 repair.</param>
        /// <param name="validation">Failed validation.</param>
        /// <param name="noRepairReason">Why no repair starts, or null when one starts.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The event's sequence (the run's new last event sequence).</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or validation is null.</exception>
        public async Task<long> AppendWarningAsync(Run run, int repairAttempt, OutputSchemaValidationResult validation, string? noRepairReason, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (validation == null) throw new ArgumentNullException(nameof(validation));

            SchemaValidationNotice notice = new SchemaValidationNotice();
            notice.Notice = SchemaValidationNotice.KindName;
            notice.RepairAttempt = repairAttempt;
            notice.Source = validation.Source;
            notice.Errors = new List<string>(validation.Errors);
            notice.TotalErrors = validation.TotalErrors;
            notice.RepairStarted = noRepairReason == null;
            notice.NoRepairReason = noRepairReason;

            string text = (repairAttempt > 0 ? "Repaired output" : "Output") + " does not match the agent's output schema: " + validation.Summary() + ". "
                + (noRepairReason == null ? "Starting one repair attempt that resumes the harness session." : "No repair: " + noRepairReason + ".");

            Run? current = await _Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false);
            long sequence = Math.Max(run.LastEventSequence, current?.LastEventSequence ?? 0);
            for (int attempt = 0; attempt < 5; attempt++)
            {
                sequence++;
                RunEvent evt = new RunEvent();
                evt.TenantId = run.TenantId;
                evt.RunId = run.Id;
                evt.Sequence = sequence;
                evt.EventType = RunEventTypeEnum.Warning;
                evt.TimestampUtc = DateTime.UtcNow;
                evt.Text = text;
                evt.Code = "StructuredOutputInvalid";
                evt.RawEventJson = Serializer.Serialize(notice);
                int inserted = await _Database.RunEvents.InsertBatchAsync(new List<RunEvent> { evt }, token).ConfigureAwait(false);
                if (inserted > 0) break;
            }

            await _Database.Runs.UpdateLastEventSequenceAsync(run.Id, sequence, token).ConfigureAwait(false);
            run.LastEventSequence = Math.Max(run.LastEventSequence, sequence);
            return sequence;
        }

        /// <summary>
        /// Build the error message for a run that fails with SchemaValidationFailed.
        /// </summary>
        /// <param name="validation">Failed validation.</param>
        /// <param name="repairAttempt">Execution that failed: 0 original, 1 repair.</param>
        /// <param name="noRepairReason">Why no repair was attempted after the original execution, or null.</param>
        /// <returns>Message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when validation is null.</exception>
        public static string FailureMessage(OutputSchemaValidationResult validation, int repairAttempt, string? noRepairReason)
        {
            if (validation == null) throw new ArgumentNullException(nameof(validation));
            string message = "Output does not match the agent's output schema" + (repairAttempt > 0 ? " after one repair attempt" : String.Empty) + ": " + validation.Summary() + ".";
            if (repairAttempt == 0 && !String.IsNullOrEmpty(noRepairReason)) message += " No repair was attempted: " + noRepairReason + ".";
            return message;
        }

        #endregion

        #region Private-Methods

        private async Task<string?> RepairBlockerAsync(Run run, RunCompleteRequest request, OutputSchemaValidationResult validation, CancellationToken token)
        {
            if (validation.SchemaUnusable) return "the output schema itself could not be used, so a repair cannot help";
            if (request.RepairAttempt > 0 || run.RepairAttempts > 0) return "the one repair attempt was already used";
            if (run.CancelRequested) return "cancellation was requested";
            if (!request.SupportsRepair) return "the worker that ran it cannot run repairs";

            Deployment? deployment = await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            HarnessProfile? profile = deployment == null ? null : await _Database.HarnessProfiles.ReadAsync(run.TenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
            if (profile == null) return "the deployment's harness profile was not found";
            if (!profile.SupportsResume) return "harness profile " + profile.Name + " does not support resume";
            if (String.IsNullOrEmpty(request.SessionId)) return "the harness reported no session ID to resume";
            return null;
        }

        #endregion
    }
}
