namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Radiant;

    /// <summary>
    /// Creates, cancels, retries, and waits on runs. Thread-safe.
    /// </summary>
    public class RunService
    {
        #region Public-Members

        /// <summary>
        /// Statuses that end a run.
        /// </summary>
        public static readonly HashSet<RunStatusEnum> TerminalStatuses = new HashSet<RunStatusEnum>
        {
            RunStatusEnum.Succeeded,
            RunStatusEnum.Failed,
            RunStatusEnum.Cancelled,
            RunStatusEnum.TimedOut,
            RunStatusEnum.Rejected
        };

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunSignals _Signals;
        private readonly RuntimeOptions _Options;
        private readonly GarrisonTelemetry _Telemetry;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RunService(DatabaseDriverBase database, RunSignals signals, RuntimeOptions options, GarrisonTelemetry telemetry)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create and queue a run.
        /// </summary>
        /// <param name="create">Creation context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The queued run, or the existing run for a repeated idempotency key.</returns>
        /// <exception cref="ArgumentNullException">Thrown when create is null.</exception>
        /// <exception cref="ValidationException">Thrown when the input or overrides are invalid.</exception>
        /// <exception cref="NotFoundException">Thrown when a requested deployment does not exist for the agent.</exception>
        /// <exception cref="ConflictException">Thrown when delegation depth is exceeded, or with NoActiveDeployment when the agent has no active deployment with a weight above zero.</exception>
        /// <exception cref="IdempotencyConflictException">Thrown when the idempotency key belongs to a run with different content.</exception>
        public async Task<Run> CreateAsync(RunCreateContext create, CancellationToken token = default)
        {
            if (create == null) throw new ArgumentNullException(nameof(create));
            if (String.IsNullOrEmpty(create.TenantId)) throw new ValidationException("A tenant is required.");
            if (create.Agent == null || String.IsNullOrEmpty(create.Agent.Id)) throw new ValidationException("An agent is required.");
            if (!create.Agent.Active) throw new ConflictException("AgentInactive", "Agent " + create.Agent.Name + " is inactive.");
            if (create.Agent.Kind != AgentKindEnum.Hosted) throw new ConflictException("RemoteAgentNotSupported", "Invoking remote agents is not available yet (plan Phase 12).");

            if (!String.IsNullOrEmpty(create.IdempotencyKey))
            {
                Run? existing = await _Database.Runs.ReadByIdempotencyKeyAsync(create.TenantId, create.CallerId, create.IdempotencyKey, token).ConfigureAwait(false);
                if (existing != null)
                {
                    // Same key and same content is a safe retry; the same key with different content is a mistake.
                    bool sameContent = existing.AgentId == create.Agent.Id && String.Equals(existing.InputText ?? String.Empty, create.Input ?? String.Empty, StringComparison.Ordinal);
                    if (sameContent) return existing;
                    string shown = create.IdempotencyKey.StartsWith("a2a:", StringComparison.Ordinal) ? create.IdempotencyKey.Substring(4) : create.IdempotencyKey;
                    throw new IdempotencyConflictException(shown, existing.Id,
                        "Idempotency key " + shown + " was already used for run " + existing.Id + " with different content. Use a new key for a new request; resend identical content to get the existing run.");
                }
            }

            Deployment deployment = await SelectDeploymentAsync(create, token).ConfigureAwait(false);
            HarnessProfile profile = await _Database.HarnessProfiles.ReadAsync(create.TenantId, deployment.HarnessProfileId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Harness profile " + deployment.HarnessProfileId + " for deployment " + deployment.Name + " was not found.");

            Run run = new Run();
            run.TenantId = create.TenantId;
            run.AgentId = create.Agent.Id;
            run.AgentName = create.Agent.Name;
            run.DeploymentId = deployment.Id;
            run.DeploymentVersion = deployment.ConfigVersion;
            run.HarnessType = profile.HarnessType;
            run.NodePoolId = deployment.NodePoolId;
            run.Kind = create.Kind;
            run.Priority = create.Priority;
            run.InputText = create.Input ?? String.Empty;
            run.InputContentType = String.IsNullOrEmpty(create.InputContentType) ? "text/plain" : create.InputContentType;
            run.CallerType = create.CallerType;
            run.CallerId = create.CallerId;
            run.CallerName = create.CallerName;
            run.IdempotencyKey = create.IdempotencyKey;
            run.RetryOfRunId = create.RetryOfRunId;
            run.MaxAttempts = deployment.MaxAttempts;
            run.Attempt = 1;

            if (create.Parent != null)
            {
                run.ParentRunId = create.Parent.Id;
                run.RootRunId = create.Parent.RootRunId ?? create.Parent.Id;
                run.Depth = create.Parent.Depth + 1;
                run.CallChain = (String.IsNullOrEmpty(create.Parent.CallChain) ? create.Parent.AgentName : create.Parent.CallChain) + "," + create.Agent.Name;
                if (run.Depth > _Options.MaxDelegationDepth)
                {
                    throw new ConflictException("DelegationDepthExceeded", "Delegation depth " + run.Depth + " exceeds the cluster maximum of " + _Options.MaxDelegationDepth + ".");
                }
            }
            else
            {
                run.CallChain = create.Agent.Name;
            }

            foreach (KeyValuePair<string, string> parameter in ValidateOverrides(deployment, create.Parameters))
            {
                RunParameter p = new RunParameter();
                p.Name = parameter.Key;
                p.Value = parameter.Value;
                run.Parameters.Add(p);
            }

            foreach (DeploymentNodeSelector selector in deployment.NodeSelector)
            {
                RunRequirement requirement = new RunRequirement();
                requirement.Key = selector.Key;
                requirement.Value = selector.Value;
                run.Requirements.Add(requirement);
            }

            run.Status = RunStatusEnum.Queued;
            run.QueuedUtc = DateTime.UtcNow;
            await _Database.Runs.CreateAsync(run, token).ConfigureAwait(false);

            _Telemetry.Increment("garrison.runs.created", new RadiantTag("harness", run.HarnessType.ToString()), new RadiantTag("kind", run.Kind.ToString()));
            _Signals.QueueChanged.Signal();
            return run;
        }

        /// <summary>
        /// Request cancellation. Queued runs cancel immediately; leased and running runs move to Cancelling and the
        /// worker is told on its next heartbeat.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="ConflictException">Thrown when the run already finished.</exception>
        public async Task<Run> CancelAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (TerminalStatuses.Contains(run.Status)) throw new ConflictException("RunFinished", "Run " + run.Id + " already finished with status " + run.Status + ".");

            RunTransition queued = new RunTransition();
            queued.RunId = run.Id;
            queued.FromStatuses.Add(RunStatusEnum.Queued);
            queued.FromStatuses.Add(RunStatusEnum.Pending);
            queued.ToStatus = RunStatusEnum.Cancelled;
            queued.Outcome = RunOutcomeEnum.Cancelled;
            queued.SetCompleted = true;
            queued.CancelRequested = true;
            if (!await _Database.Runs.TransitionAsync(queued, token).ConfigureAwait(false))
            {
                RunTransition active = new RunTransition();
                active.RunId = run.Id;
                active.FromStatuses.Add(RunStatusEnum.Leased);
                active.FromStatuses.Add(RunStatusEnum.Running);
                active.ToStatus = RunStatusEnum.Cancelling;
                active.CancelRequested = true;
                await _Database.Runs.TransitionAsync(active, token).ConfigureAwait(false);
            }

            _Signals.Notify(run.Id);
            Run? updated = await _Database.Runs.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            return updated ?? run;
        }

        /// <summary>
        /// Create a new run that repeats a finished run's input and parameters.
        /// </summary>
        /// <param name="original">Finished run.</param>
        /// <param name="callerType">Caller type.</param>
        /// <param name="callerId">Caller identifier.</param>
        /// <param name="callerName">Caller name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>New run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when original is null.</exception>
        /// <exception cref="ConflictException">Thrown with RunNotFinished when the run has not finished, AgentDeleted when its agent was deleted, or DeploymentDeleted when its deployment was deleted.</exception>
        public async Task<Run> RetryAsync(Run original, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token = default)
        {
            if (original == null) throw new ArgumentNullException(nameof(original));
            if (!TerminalStatuses.Contains(original.Status)) throw new ConflictException("RunNotFinished", "Only finished runs can be retried.");

            Agent agent = await _Database.Agents.ReadAsync(original.TenantId, original.AgentId, token).ConfigureAwait(false)
                ?? throw new ConflictException("AgentDeleted", "Run " + original.Id + " cannot be retried because the agent " + original.AgentName + " was deleted.");
            if (!String.IsNullOrEmpty(original.DeploymentId) && await _Database.Deployments.ReadAsync(original.TenantId, original.DeploymentId, token).ConfigureAwait(false) == null)
            {
                throw new ConflictException("DeploymentDeleted", "Run " + original.Id + " cannot be retried because its deployment " + original.DeploymentId + " was deleted. Invoke agent " + original.AgentName + " again instead.");
            }

            RunCreateContext create = new RunCreateContext();
            create.TenantId = original.TenantId;
            create.Agent = agent;
            create.DeploymentId = original.DeploymentId;
            create.Input = original.InputText ?? String.Empty;
            create.InputContentType = original.InputContentType;
            foreach (RunParameter parameter in original.Parameters) create.Parameters[parameter.Name] = parameter.Value;
            create.Priority = original.Priority;
            create.Kind = RunKindEnum.Retry;
            create.CallerType = callerType;
            create.CallerId = callerId;
            create.CallerName = callerName;
            create.RetryOfRunId = original.Id;
            return await CreateAsync(create, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Wait until a run finishes or the timeout elapses, then return its latest state.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="waitSeconds">Maximum wait in seconds (0 to 600).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run, or null when it no longer exists.</returns>
        public async Task<Run?> WaitAsync(string tenantId, string runId, int waitSeconds, CancellationToken token = default)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(Math.Clamp(waitSeconds, 0, 600));
            AsyncSignal signal = _Signals.For(runId);
            while (true)
            {
                Run? run = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
                if (run == null || TerminalStatuses.Contains(run.Status)) return run;
                int remaining = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                if (remaining <= 0) return run;
                await signal.WaitAsync(Math.Min(remaining, _Options.EventPollMs * 4), token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Whether a status is terminal.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>True when terminal.</returns>
        public static bool IsTerminal(RunStatusEnum status)
        {
            return TerminalStatuses.Contains(status);
        }

        #endregion

        #region Private-Methods

        private async Task<Deployment> SelectDeploymentAsync(RunCreateContext create, CancellationToken token)
        {
            if (!String.IsNullOrEmpty(create.DeploymentId))
            {
                Deployment? chosen = await _Database.Deployments.ReadAsync(create.TenantId, create.DeploymentId, token).ConfigureAwait(false);
                if (chosen == null || chosen.AgentId != create.Agent.Id) throw new NotFoundException("Deployment " + create.DeploymentId + " was not found for agent " + create.Agent.Name + ".");
                if (!chosen.Active) throw new ConflictException("DeploymentInactive", "Deployment " + chosen.Name + " is inactive.");
                return chosen;
            }

            List<Deployment> candidates = new List<Deployment>();
            int skip = 0;
            while (true)
            {
                EnumerationQuery query = new EnumerationQuery();
                query.MaxResults = 1000;
                query.Skip = skip;
                query.ActiveOnly = true;
                EnumerationResult<Deployment> page = await _Database.Deployments.EnumerateAsync(create.TenantId, query, token).ConfigureAwait(false);
                candidates.AddRange(page.Objects.Where(d => d.AgentId == create.Agent.Id && d.Active && d.Weight > 0));
                if (page.EndOfResults || page.Objects.Count == 0) break;
                skip += page.Objects.Count;
            }

            if (candidates.Count == 0)
            {
                throw new ConflictException("NoActiveDeployment", "Agent " + create.Agent.Name + " has no active deployment with a weight above zero, so it cannot run. Create a deployment for it, or activate one and give it a weight above zero.");
            }
            if (candidates.Count == 1) return candidates[0];

            int total = candidates.Sum(d => d.Weight);
            int pick = RandomNumberGenerator.GetInt32(total);
            foreach (Deployment candidate in candidates)
            {
                if (pick < candidate.Weight) return candidate;
                pick -= candidate.Weight;
            }
            return candidates[candidates.Count - 1];
        }

        private static Dictionary<string, string> ValidateOverrides(Deployment deployment, Dictionary<string, string>? requested)
        {
            Dictionary<string, string> accepted = new Dictionary<string, string>(StringComparer.Ordinal);
            if (requested == null || requested.Count == 0) return accepted;

            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, string> parameter in requested)
            {
                DeploymentRunOverrideRule? rule = deployment.AllowedRunOverrides.FirstOrDefault(r => String.Equals(r.Name, parameter.Key, StringComparison.Ordinal));
                if (rule == null)
                {
                    errors["parameters." + parameter.Key] = "Deployment " + deployment.Name + " does not allow overriding " + parameter.Key + ".";
                    codes["parameters." + parameter.Key] = "ParameterNotAllowed";
                    names.Add(parameter.Key);
                    continue;
                }

                string value = parameter.Value ?? String.Empty;
                string? problem = Check(rule, value);
                if (problem != null)
                {
                    errors["parameters." + parameter.Key] = "Parameter " + parameter.Key + ": " + problem;
                    codes["parameters." + parameter.Key] = "ParameterInvalid";
                    names.Add(parameter.Key);
                }
                else accepted[parameter.Key] = value;
            }

            if (errors.Count > 0)
            {
                throw new ValidationException("Run parameter" + (names.Count == 1 ? " " : "s ") + String.Join(", ", names) + (names.Count == 1 ? " is" : " are") + " not allowed for deployment " + deployment.Name + ": " + String.Join(" ", errors.Values), errors, codes);
            }
            return accepted;
        }

        private static string? Check(DeploymentRunOverrideRule rule, string value)
        {
            switch (rule.Validation)
            {
                case RunOverrideValidationEnum.Enum:
                    List<string> allowed = (rule.Pattern ?? String.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                    return allowed.Contains(value) ? null : "Value must be one of: " + String.Join(", ", allowed) + ".";
                case RunOverrideValidationEnum.Regex:
                    try
                    {
                        return Regex.IsMatch(value, "^(?:" + (rule.Pattern ?? ".*") + ")$", RegexOptions.None, TimeSpan.FromMilliseconds(250)) ? null : "Value does not match the allowed pattern.";
                    }
                    catch (RegexMatchTimeoutException)
                    {
                        return "Value could not be validated in time.";
                    }
                case RunOverrideValidationEnum.IntegerRange:
                    string[] parts = (rule.Pattern ?? String.Empty).Split(',', StringSplitOptions.TrimEntries);
                    if (!Int64.TryParse(value, out long number)) return "Value must be an integer.";
                    if (parts.Length == 2 && Int64.TryParse(parts[0], out long min) && Int64.TryParse(parts[1], out long max) && (number < min || number > max)) return "Value must be between " + min + " and " + max + ".";
                    return null;
                default:
                    return value.Length > 65536 ? "Value is too long." : null;
            }
        }

        #endregion
    }
}
