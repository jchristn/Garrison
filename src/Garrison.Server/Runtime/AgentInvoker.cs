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
        /// <exception cref="DelegationCapacityExhaustedException">Thrown when a calling run would wait on its child but the delegation capacity limits refuse the wait.</exception>
        public async Task<Run> InvokeAsync(RequestContext ctx, string tenantId, Agent agent, InvocationOptions options, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (options == null) throw new ArgumentNullException(nameof(options));

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

            // Wait handshake (P12.38): a run that waits on its child is recorded as waiting before the child exists, so
            // the scheduler opens a child reserve slot for it and the next delegation sees it.
            string? waitId = null;
            if (create.Parent != null && (options.Wait || options.CallerWaits))
            {
                create.RunId = IdGenerator.NewRunId();
                waitId = await BeginWaitAsync(create.Parent, create.RunId, token).ConfigureAwait(false);
            }

            Run run;
            bool created = false;
            try
            {
                try
                {
                    run = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
                    created = true;
                }
                catch (ConflictException e) when (create.Parent != null && e.Code == "DelegationDepthExceeded")
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.DelegationDenials, "reason", e.Code);
                    throw;
                }
            }
            finally
            {
                if (!created && waitId != null) await EndWaitAsync(waitId).ConfigureAwait(false);
            }
            if (waitId != null && !String.Equals(run.Id, create.RunId, StringComparison.Ordinal))
            {
                // An idempotent retry returned the run created earlier: wait on that one.
                await _Database.Runs.UpdateChildWaitAsync(waitId, run.Id, token).ConfigureAwait(false);
            }
            if (!options.Wait)
            {
                // A caller that follows the run by itself ends the wait when it stops.
                options.ChildWaitId = waitId;
                return run;
            }
            long waitStart = Stopwatch.GetTimestamp();
            string result = "cancelled";
            try
            {
                Run? finished = await _Runs.WaitAsync(tenantId, run.Id, options.WaitSeconds, token).ConfigureAwait(false);
                result = finished != null && RunService.IsTerminal(finished.Status) ? "completed" : "timeout";
                return finished ?? run;
            }
            catch (OperationCanceledException) when (token.IsCancellationRequested && options.CancelOnDisconnect && !_Runs.ShutdownToken.IsCancellationRequested && (options.CallerGone == null || options.CallerGone()))
            {
                // Nobody is waiting for the result any more: stop the harness instead of letting it run to its deadline.
                result = "disconnected";
                if (await _Runs.CancelAbandonedAsync(tenantId, run.Id, options.DisconnectReason, CancellationToken.None).ConfigureAwait(false))
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.DisconnectCancels, "surface", options.Surface);
                }
                throw;
            }
            finally
            {
                if (waitId != null) await EndWaitAsync(waitId).ConfigureAwait(false);
                GarrisonMetrics.Observe(GarrisonMetricCatalog.InvocationWait, GarrisonMetrics.SecondsSince(waitStart), "surface", options.Surface, "result", result);
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

        private async Task<string> BeginWaitAsync(Run parent, string childRunId, CancellationToken token)
        {
            ChildWaitRequest request = new ChildWaitRequest();
            request.TenantId = parent.TenantId;
            request.ParentRunId = parent.Id;
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
