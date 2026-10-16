namespace Garrison.Server.Runtime
{
    using System;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Shared invocation path for REST, MCP, and A2A: resolves the agent, applies the caller identity (originating
    /// principal for run tokens), enforces delegation policy, creates the run, and optionally waits. A run that delegates
    /// and waits is recorded as waiting on its child before the child is created (the delegation wait handshake, P12.38),
    /// and the handshake fails fast with DelegationCapacityExhausted when waiting could leave no capacity to run the
    /// child. Authorization of Execute on the agent is the caller's responsibility. Thread-safe.
    /// </summary>
    public class AgentInvoker
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunService _Runs;
        private readonly DelegationPolicy _Delegation;
        private readonly RuntimeOptions _Options;
        private readonly InputSchemaValidator _InputSchemas = new InputSchemaValidator();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="delegation">Delegation policy.</param>
        /// <param name="options">Runtime options (delegation queue depth and retry hint).</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AgentInvoker(DatabaseDriverBase database, RunService runs, DelegationPolicy delegation, RuntimeOptions options)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Delegation = delegation ?? throw new ArgumentNullException(nameof(delegation));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Resolve an agent by identifier or name within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Agent identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent.</returns>
        /// <exception cref="NotFoundException">Thrown when not found.</exception>
        public async Task<Agent> ResolveAgentAsync(string tenantId, string? idOrName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(idOrName)) throw new NotFoundException("An agent name or identifier is required.");
            Agent? agent = await _Database.Agents.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false);
            if (agent == null) agent = await _Database.Agents.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false);
            return agent ?? throw new NotFoundException("Agent " + idOrName + " not found.");
        }

        /// <summary>
        /// Invoke an agent.
        /// </summary>
        /// <param name="ctx">Authenticated caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="options">Invocation options.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run (finished when waiting succeeded within the timeout).</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ValidationException">Thrown with the field code InputRequired when the input is missing, empty, or whitespace, and with InputNotJson or InputSchemaViolation field codes when the agent has an input schema the input does not match.</exception>
        /// <exception cref="DelegationCapacityExhaustedException">Thrown when a calling run would wait on its child but the delegation capacity limits refuse the wait.</exception>
        public async Task<Run> InvokeAsync(RequestContext ctx, string tenantId, Agent agent, InvocationOptions options, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (options == null) throw new ArgumentNullException(nameof(options));
            InvocationInputRules.Require(options.Input);

            // P12.22: an agent with an input schema takes a JSON document that matches it, on every surface.
            _InputSchemas.Require(agent.InputSchemaJson, options.Input);

            RunCreateContext create = new RunCreateContext();
            create.TenantId = tenantId;
            create.Agent = agent;
            create.DeploymentId = options.DeploymentId;
            create.Input = options.Input ?? String.Empty;
            create.InputContentType = options.InputContentType;
            create.Parameters = options.Parameters;
            create.Priority = options.Priority;
            create.Kind = options.Kind;
            create.IdempotencyKey = options.IdempotencyKey;
            create.ConversationId = String.IsNullOrWhiteSpace(options.ConversationId) ? null : options.ConversationId.Trim();
            create.StartConversation = options.StartConversation;
            create.ContextId = String.IsNullOrWhiteSpace(options.ContextId) ? null : options.ContextId.Trim();
            create.Surface = options.Surface;

            if (ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId))
            {
                Run parent = await _Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false)
                    ?? throw new ConflictException("ParentRunNotFound", "The calling run no longer exists.");
                try
                {
                    await _Delegation.CheckAsync(parent, agent, token).ConfigureAwait(false);
                }
                catch (ConflictException e)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.DelegationDenials, "reason", e.Code);
                    throw;
                }
                create.Parent = parent;
                create.Kind = RunKindEnum.Delegated;
                create.CallerType = ctx.OriginPrincipalType ?? PrincipalTypeEnum.User;
                create.CallerId = ctx.OriginPrincipalId;
                create.CallerName = "agent " + parent.AgentName;
                create.Priority = parent.Priority;
            }
            else
            {
                create.CallerType = ctx.PrincipalType;
                create.CallerId = ctx.PrincipalId;
                create.CallerName = ctx.PrincipalName;
            }

            // A resident parent cannot silently switch to polling after its child is queued: removing its wait
            // handshake would close the child reserve while the parent still occupies a normal execution slot.
            bool reserved = create.Parent != null && options.Wait && !options.DurableWait;
            if (reserved && !_Options.SynchronousWaits.TryEnter(_Options.MaxSynchronousWaiters, true))
            {
                DelegationCapacityExhaustedException refused = new DelegationCapacityExhaustedException(
                    DelegationCapacityLimitEnum.SynchronousWaiters, create.Parent!.LeaseNodeId,
                    _Options.SynchronousWaits.Active, _Options.MaxSynchronousWaiters, _Options.DelegationRetryAfterSeconds);
                GarrisonMetrics.Count(GarrisonMetricCatalog.DelegationDenials, "reason", refused.Code);
                throw refused;
            }
            try
            {
                return await InvokePreparedAsync(create, options, reserved, token).ConfigureAwait(false);
            }
            finally
            {
                if (reserved) _Options.SynchronousWaits.Release();
            }
        }

        /// <summary>
        /// End a delegation wait left open for a caller that follows its run by itself
        /// (<see cref="InvocationOptions.CallerWaits"/>). Never throws for a database failure: a record left behind stops
        /// counting once the child finishes, and the leader deletes it.
        /// </summary>
        /// <param name="waitId">Wait identifier from <see cref="InvocationOptions.ChildWaitId"/>; null does nothing.</param>
        /// <returns>Task.</returns>
        public async Task EndChildWaitAsync(string? waitId)
        {
            if (String.IsNullOrEmpty(waitId)) return;
            await EndWaitAsync(waitId).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task<Run> InvokePreparedAsync(RunCreateContext create, InvocationOptions options, bool waitReserved, CancellationToken token)
        {
            string tenantId = create.TenantId;
            string? waitId = null;
            bool callerOwnsWait = false;
            try
            {
                // Admission records the handshake before child creation, so the scheduler can open its reserve.
                if (create.Parent != null && (options.Wait || options.CallerWaits))
                {
                    create.RunId = IdGenerator.NewRunId();
                    waitId = await BeginWaitAsync(create.Parent, create.RunId, options.DurableWait, token).ConfigureAwait(false);
                }
                Run run;
                try
                {
                    run = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
                }
                catch (ConflictException e) when (create.Parent != null && e.Code == "DelegationDepthExceeded")
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.DelegationDenials, "reason", e.Code);
                    throw;
                }
                if (waitId != null && !String.Equals(run.Id, create.RunId, StringComparison.Ordinal))
                {
                    // An idempotent retry returned earlier work. A failed update must release both resources.
                    await _Database.Runs.UpdateChildWaitAsync(waitId, run.Id, token).ConfigureAwait(false);
                }
                if (!options.Wait)
                {
                    options.ChildWaitId = waitId;
                    callerOwnsWait = true;
                    return run;
                }
                long waitStart = Stopwatch.GetTimestamp();
                string result = "cancelled";
                try
                {
                    Run? finished = waitReserved
                        ? await _Runs.WaitReservedAsync(tenantId, run.Id, options.WaitSeconds, token).ConfigureAwait(false)
                        : await _Runs.WaitAsync(tenantId, run.Id, options.WaitSeconds, token).ConfigureAwait(false);
                    result = finished != null && RunService.IsTerminal(finished.Status) ? "completed" : "timeout";
                    return finished ?? run;
                }
                catch (OperationCanceledException) when (token.IsCancellationRequested && options.CancelOnDisconnect && !_Runs.ShutdownToken.IsCancellationRequested && (options.CallerGone == null || options.CallerGone()))
                {
                    result = "disconnected";
                    if (await _Runs.CancelAbandonedAsync(tenantId, run.Id, options.DisconnectReason, CancellationToken.None).ConfigureAwait(false))
                        GarrisonMetrics.Count(GarrisonMetricCatalog.DisconnectCancels, "surface", options.Surface);
                    throw;
                }
                finally
                {
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.InvocationWait, GarrisonMetrics.SecondsSince(waitStart), "surface", options.Surface, "result", result);
                }
            }
            finally
            {
                if (!callerOwnsWait && waitId != null) await EndWaitAsync(waitId).ConfigureAwait(false);
            }
        }

        private async Task<string> BeginWaitAsync(Run parent, string childRunId, bool durable, CancellationToken token)
        {
            ChildWaitRequest request = new ChildWaitRequest();
            request.TenantId = parent.TenantId;
            request.ParentRunId = parent.Id;
            request.Durable = durable;
            request.ChildRunId = childRunId;
            request.ChildQueueDepth = _Options.DelegationChildQueueDepth;
            ChildWaitAdmission admission = await _Database.Runs.BeginChildWaitAsync(request, token).ConfigureAwait(false);
            if (admission.Admitted) return admission.WaitId!;

            DelegationCapacityExhaustedException refused = new DelegationCapacityExhaustedException(admission.Limit, admission.NodeId, admission.Used, admission.Maximum, _Options.DelegationRetryAfterSeconds);
            GarrisonMetrics.Count(GarrisonMetricCatalog.DelegationDenials, "reason", refused.Code);
            throw refused;
        }

        private async Task EndWaitAsync(string waitId)
        {
            // Not cancellable: the caller may be gone. A record left behind stops counting once the child finishes, and
            // the leader deletes it.
            try
            {
                await _Database.Runs.EndChildWaitAsync(waitId, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception e) when (DatabaseFailures.Classify(e) != DatabaseFailureEnum.None)
            {
            }
        }

        #endregion
    }
}
