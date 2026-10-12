namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Conversations (plan P12.1): resolves the conversation a new run belongs to, serializes its turns, decides whether a
    /// turn resumes the harness session on the affinity node or falls back to a fresh session seeded with the transcript,
    /// records the session and affinity node of successful turns, and builds the transcript for fallback turns.
    /// Concurrency rule: a conversation runs one turn at a time; a turn requested while another is unfinished fails with
    /// 409 ConversationBusy rather than waiting, so no caller holds a connection open behind another caller's turn.
    /// Thread-safe.
    /// </summary>
    public class ConversationService
    {
        #region Public-Members

        /// <summary>
        /// Seconds a turn whose run is not stored yet still counts as in progress, so a second turn requested while the
        /// first is being created is refused rather than taking over. Minimum 5, maximum 600, default 60.
        /// </summary>
        public int CreationGraceSeconds
        {
            get
            {
                return _CreationGraceSeconds;
            }
            set
            {
                _CreationGraceSeconds = Math.Clamp(value, 5, 600);
            }
        }

        /// <summary>
        /// Logging, or null to log nothing. Default null; the runtime module sets it.
        /// </summary>
        public LoggingModule? Logging { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RuntimeOptions _Options;
        private readonly RunSignals _Signals;
        private int _CreationGraceSeconds = 60;
        private readonly string _Header = "[Conversations] ";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="signals">Run signals.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ConversationService(DatabaseDriverBase database, RuntimeOptions options, RunSignals signals)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Resolve the conversation a run being created belongs to, or null when the request asked for none. A
        /// conversation identifier must name an existing conversation of the tenant; an A2A context identifier names a
        /// conversation by identifier or by the client-supplied context identifier it was created for, and starts a new
        /// conversation for that context identifier when none exists. Pins the request to the conversation's deployment.
        /// </summary>
        /// <param name="create">Creation context; its DeploymentId is set to the conversation's deployment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Turn plan, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when create is null.</exception>
        /// <exception cref="NotFoundException">Thrown when a conversation identifier names no conversation of the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with ConversationAgentMismatch, ConversationDeploymentMismatch, or ConversationDeploymentUnavailable.</exception>
        public async Task<ConversationTurnPlan?> ResolveAsync(RunCreateContext create, CancellationToken token = default)
        {
            if (create == null) throw new ArgumentNullException(nameof(create));
            Conversation? conversation = null;
            bool isNew = false;

            if (!String.IsNullOrEmpty(create.ConversationId))
            {
                conversation = await _Database.Conversations.ReadAsync(create.TenantId, create.ConversationId, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("Conversation " + create.ConversationId + " not found.");
            }
            else if (!String.IsNullOrEmpty(create.ContextId))
            {
                conversation = await _Database.Conversations.ReadAsync(create.TenantId, create.ContextId, token).ConfigureAwait(false);
                if (conversation == null) conversation = await _Database.Conversations.ReadByContextIdAsync(create.TenantId, create.Agent.Id, create.ContextId, token).ConfigureAwait(false);
                if (conversation == null)
                {
                    conversation = NewConversation(create);
                    conversation.ContextId = create.ContextId;
                    isNew = true;
                }
            }
            else if (create.StartConversation)
            {
                conversation = NewConversation(create);
                isNew = true;
            }

            if (conversation == null) return null;

            if (!String.Equals(conversation.AgentId, create.Agent.Id, StringComparison.Ordinal))
            {
                throw new ConflictException("ConversationAgentMismatch", "Conversation " + conversation.Id + " is with agent " + conversation.AgentName + ", not " + create.Agent.Name + ". Send the turn to " + conversation.AgentName + ", or start a new conversation.");
            }

            if (!isNew && !String.IsNullOrEmpty(conversation.DeploymentId))
            {
                if (!String.IsNullOrEmpty(create.DeploymentId) && !String.Equals(create.DeploymentId, conversation.DeploymentId, StringComparison.Ordinal))
                {
                    throw new ConflictException("ConversationDeploymentMismatch", "Conversation " + conversation.Id + " runs on deployment " + conversation.DeploymentId + "; every turn of a conversation uses the deployment of its first turn. Omit deploymentId, or start a new conversation.");
                }
                Deployment? deployment = await _Database.Deployments.ReadAsync(create.TenantId, conversation.DeploymentId, token).ConfigureAwait(false);
                if (deployment == null || deployment.AgentId != create.Agent.Id)
                {
                    throw new ConflictException("ConversationDeploymentUnavailable", "Deployment " + conversation.DeploymentId + " of conversation " + conversation.Id + " was deleted, so the conversation cannot continue. Start a new conversation.");
                }
                create.DeploymentId = conversation.DeploymentId;
            }

            ConversationTurnPlan plan = new ConversationTurnPlan();
            plan.Conversation = conversation;
            plan.IsNew = isNew;
            return plan;
        }

        /// <summary>
        /// Begin a turn: store a new conversation or take the turn of an existing one (compare-and-set on its active
        /// run), then fill the run's conversation fields and decide whether the turn resumes the conversation's harness
        /// session on its affinity node or falls back to a fresh session.
        /// </summary>
        /// <param name="plan">Turn plan from <see cref="ResolveAsync"/>.</param>
        /// <param name="run">Run being created (not stored yet).</param>
        /// <param name="deployment">Deployment the run uses.</param>
        /// <param name="profile">Harness profile of the deployment.</param>
        /// <param name="surface">Protocol surface for the busy metric: rest, mcp, or a2a.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with ConversationBusy when another turn of the conversation is unfinished.</exception>
        public async Task BeginTurnAsync(ConversationTurnPlan plan, Run run, Deployment deployment, HarnessProfile profile, string surface, CancellationToken token = default)
        {
            if (plan == null) throw new ArgumentNullException(nameof(plan));
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (profile == null) throw new ArgumentNullException(nameof(profile));

            Conversation conversation = plan.Conversation;
            DateTime now = DateTime.UtcNow;
            if (plan.IsNew)
            {
                conversation.DeploymentId = deployment.Id;
                conversation.HarnessType = profile.HarnessType;
                conversation.Title = run.InputText;
                conversation.ActiveRunId = run.Id;
                conversation.LastActivityUtc = now;
                await _Database.Conversations.CreateAsync(conversation, token).ConfigureAwait(false);
                plan.Acquired = true;
            }
            else
            {
                string? active = conversation.ActiveRunId;
                if (await IsBusyAsync(conversation, token).ConfigureAwait(false)
                    || !await _Database.Conversations.TryAcquireTurnAsync(conversation.Id, active, run.Id, now, token).ConfigureAwait(false))
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.ConversationBusy, "surface", surface);
                    Conversation? latest = await _Database.Conversations.ReadAsync(conversation.Id, token).ConfigureAwait(false);
                    string working = latest?.ActiveRunId ?? active ?? "another run";
                    throw new ConflictException("ConversationBusy", "Conversation " + conversation.Id + " is still working on its previous turn (run " + working + "). Wait for that run to finish, or cancel it, then send the next turn.");
                }
                plan.PreviousActiveRunId = active;
                plan.Acquired = true;
                if (String.IsNullOrEmpty(conversation.DeploymentId)) conversation.DeploymentId = deployment.Id;
                conversation.HarnessType = profile.HarnessType;
                if (String.IsNullOrEmpty(conversation.Title)) conversation.Title = run.InputText;
            }

            run.ConversationId = conversation.Id;
            run.ConversationTurn = conversation.TurnCount + 1;

            if (conversation.TurnCount == 0)
            {
                plan.Mode = "first";
                return;
            }

            ConversationFallbackReasonEnum? reason = null;
            if (run.Executor != RunExecutorEnum.Process) reason = ConversationFallbackReasonEnum.ExecutorWithoutState;
            else if (!profile.SupportsResume) reason = ConversationFallbackReasonEnum.ResumeUnsupported;
            else if (String.IsNullOrEmpty(conversation.SessionId)) reason = ConversationFallbackReasonEnum.SessionMissing;
            else if (!String.Equals(conversation.SessionHarnessProfileId, profile.Id, StringComparison.Ordinal)) reason = ConversationFallbackReasonEnum.HarnessChanged;
            else if (String.IsNullOrEmpty(conversation.AffinityNodeId)) reason = ConversationFallbackReasonEnum.AffinityNodeLost;

            if (reason.HasValue)
            {
                run.ConversationFallbackReason = reason;
                plan.Mode = "fallback";
                return;
            }

            run.ResumeSessionId = conversation.SessionId;
            run.AffinityNodeId = conversation.AffinityNodeId;
            run.AffinityUntilUtc = now.AddMilliseconds(_Options.ConversationAffinityWaitMs);
            plan.Mode = "resume";
        }

        /// <summary>
        /// Record a turn whose run was stored: the conversation's last run, turn count, deployment, and title, and the
        /// fallback when the turn starts from the transcript.
        /// </summary>
        /// <param name="plan">Turn plan.</param>
        /// <param name="run">Stored run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task TurnCreatedAsync(ConversationTurnPlan plan, Run run, CancellationToken token = default)
        {
            if (plan == null) throw new ArgumentNullException(nameof(plan));
            if (run == null) throw new ArgumentNullException(nameof(run));
            await _Database.Conversations.RecordTurnStartedAsync(plan.Conversation, run.Id, token).ConfigureAwait(false);
            plan.Conversation.TurnCount = plan.Conversation.TurnCount + 1;
            plan.Conversation.LastRunId = run.Id;
            plan.Conversation.ActiveRunId = run.Id;
            GarrisonMetrics.Count(GarrisonMetricCatalog.ConversationTurns, "tenant", run.TenantId, "agent", run.AgentName, "mode", plan.Mode);
            if (run.ConversationFallbackReason.HasValue) await RecordFallbackAsync(run, run.ConversationFallbackReason.Value, null, token).ConfigureAwait(false);
            Logging?.Info(_Header + "run " + run.Id + " is turn " + run.ConversationTurn + " of conversation " + run.ConversationId + " (" + plan.Mode
                + (run.ConversationFallbackReason.HasValue ? ", " + run.ConversationFallbackReason.Value : String.Empty)
                + (String.IsNullOrEmpty(run.AffinityNodeId) ? String.Empty : ", affinity node " + run.AffinityNodeId) + ") " + RunTracing.LogFields(run.Id, run.TraceId));
        }

        /// <summary>
        /// Give back a turn whose run was never stored: restores the previous active run, and deletes a conversation that
        /// this turn created.
        /// </summary>
        /// <param name="plan">Turn plan.</param>
        /// <param name="run">Run that was not stored.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task ReleaseTurnAsync(ConversationTurnPlan plan, Run run, CancellationToken token = default)
        {
            if (plan == null) throw new ArgumentNullException(nameof(plan));
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (!plan.Acquired) return;
            if (plan.IsNew) await _Database.Conversations.DeleteAsync(plan.Conversation.Id, token).ConfigureAwait(false);
            else await _Database.Conversations.ReleaseTurnAsync(plan.Conversation.Id, run.Id, plan.PreviousActiveRunId, token).ConfigureAwait(false);
            plan.Acquired = false;
        }

        /// <summary>
        /// Whether a conversation has an unfinished turn: its active run exists and has not finished, or its active run is
        /// not stored yet and the turn began less than <see cref="CreationGraceSeconds"/> ago.
        /// </summary>
        /// <param name="conversation">Conversation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when busy.</returns>
        /// <exception cref="ArgumentNullException">Thrown when conversation is null.</exception>
        public async Task<bool> IsBusyAsync(Conversation conversation, CancellationToken token = default)
        {
            if (conversation == null) throw new ArgumentNullException(nameof(conversation));
            if (String.IsNullOrEmpty(conversation.ActiveRunId)) return false;
            Run? active = await _Database.Runs.ReadAsync(conversation.TenantId, conversation.ActiveRunId, token).ConfigureAwait(false);
            if (active != null) return !RunService.IsTerminal(active.Status);
            return conversation.LastActivityUtc.HasValue && conversation.LastActivityUtc.Value > DateTime.UtcNow.AddSeconds(-_CreationGraceSeconds);
        }

        /// <summary>
        /// Fill the computed <see cref="Conversation.Busy"/> flag.
        /// </summary>
        /// <param name="conversation">Conversation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The same conversation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when conversation is null.</exception>
        public async Task<Conversation> AnnotateAsync(Conversation conversation, CancellationToken token = default)
        {
            if (conversation == null) throw new ArgumentNullException(nameof(conversation));
            conversation.Busy = await IsBusyAsync(conversation, token).ConfigureAwait(false);
            return conversation;
        }

        /// <summary>
        /// Whether a node must leave a queued conversation turn alone because the turn is waiting for its affinity node:
        /// the run has an affinity node other than this one, that node is Ready, and the affinity wait has not ended.
        /// </summary>
        /// <param name="run">Queued run.</param>
        /// <param name="node">Node looking for work.</param>
        /// <param name="affinityNode">The run's affinity node, or null when it no longer exists.</param>
        /// <param name="nowUtc">Current time.</param>
        /// <returns>True when the node must skip the run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or node is null.</exception>
        public static bool DefersToAffinityNode(Run run, Node node, Node? affinityNode, DateTime nowUtc)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (String.IsNullOrEmpty(run.AffinityNodeId) || String.Equals(run.AffinityNodeId, node.Id, StringComparison.Ordinal)) return false;
            if (affinityNode == null || affinityNode.Status != NodeStatusEnum.Ready) return false;
            return run.AffinityUntilUtc.HasValue && run.AffinityUntilUtc.Value > nowUtc;
        }

        /// <summary>
        /// Turn a claimed conversation turn into a fallback when a node other than its affinity node claimed it: clears the
        /// session to resume and the affinity (fenced by the claim's epoch), records the fallback on the conversation, and
        /// appends a ConversationFallback event. Does nothing for runs that resume on their affinity node or that are not
        /// conversation turns.
        /// </summary>
        /// <param name="run">Claimed run (updated in place).</param>
        /// <param name="node">Node that claimed it.</param>
        /// <param name="epoch">Claim epoch.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the turn became a fallback.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or node is null.</exception>
        public async Task<bool> ApplyClaimFallbackAsync(Run run, Node node, long epoch, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (String.IsNullOrEmpty(run.ConversationId) || String.IsNullOrEmpty(run.ResumeSessionId)) return false;
            if (String.Equals(run.AffinityNodeId, node.Id, StringComparison.Ordinal)) return false;

            Node? affinity = String.IsNullOrEmpty(run.AffinityNodeId) ? null : await _Database.Nodes.ReadAsync(run.AffinityNodeId, token).ConfigureAwait(false);
            ConversationFallbackReasonEnum reason = affinity != null && affinity.Status == NodeStatusEnum.Ready ? ConversationFallbackReasonEnum.AffinityWaitExpired : ConversationFallbackReasonEnum.AffinityNodeLost;

            RunTransition transition = new RunTransition();
            transition.RunId = run.Id;
            transition.FromStatuses.Add(RunStatusEnum.Leased);
            transition.ToStatus = RunStatusEnum.Leased;
            transition.Epoch = epoch;
            transition.NodeId = node.Id;
            transition.ConversationFallback = reason;
            if (!await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false)) return false;

            string affinityName = affinity?.Name ?? run.AffinityNodeId ?? "the affinity node";
            run.ConversationFallbackReason = reason;
            run.ResumeSessionId = null;
            run.AffinityNodeId = null;
            run.AffinityUntilUtc = null;
            string text = reason == ConversationFallbackReasonEnum.AffinityNodeLost
                ? "Node " + affinityName + ", which holds this conversation's harness session, is not available, so node " + node.Name + " starts a fresh session seeded with the transcript of the earlier turns."
                : "Node " + affinityName + " did not take this turn within " + _Options.ConversationAffinityWaitMs + " ms, so node " + node.Name + " starts a fresh session seeded with the transcript of the earlier turns.";
            await RecordFallbackAsync(run, reason, text, token).ConfigureAwait(false);
            return true;
        }

        /// <summary>
        /// Requeue a conversation turn whose worker found the conversation's directories gone (outcome
        /// ConversationStateLost) as a fallback that any capable node may run: the run returns to Queued without using an
        /// attempt, its session to resume and affinity are cleared, and the fallback is recorded.
        /// </summary>
        /// <param name="run">Run as currently stored.</param>
        /// <param name="request">The worker's completion report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run was requeued; false when the report must be recorded as usual.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<bool> RequeueLostStateAsync(Run run, RunCompleteRequest request, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (request.Outcome != RunOutcomeEnum.ConversationStateLost || request.RepairAttempt > 0) return false;
            if (String.IsNullOrEmpty(run.ConversationId) || run.CancelRequested) return false;

            RunTransition transition = new RunTransition();
            transition.RunId = run.Id;
            transition.FromStatuses.Add(RunStatusEnum.Leased);
            transition.FromStatuses.Add(RunStatusEnum.Running);
            transition.ToStatus = RunStatusEnum.Queued;
            transition.Epoch = request.Epoch;
            transition.NodeId = request.NodeId;
            transition.ClearLease = true;
            transition.ConversationFallback = ConversationFallbackReasonEnum.WorkspaceLost;
            if (!await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false)) return false;

            // Fence the attempt that found nothing to resume: its run token stops working now (P10.21).
            await _Database.Sessions.RevokeByRunEpochAsync(run.Id, run.LeaseEpoch, "Conversation turn requeued as a fallback.", token).ConfigureAwait(false);
            run.ConversationFallbackReason = ConversationFallbackReasonEnum.WorkspaceLost;
            run.ResumeSessionId = null;
            run.AffinityNodeId = null;
            run.AffinityUntilUtc = null;
            string text = "Node " + (run.LeaseNodeName ?? request.NodeId) + " no longer has this conversation's directories, so the turn was queued again to start a fresh session seeded with the transcript of the earlier turns.";
            await RecordFallbackAsync(run, ConversationFallbackReasonEnum.WorkspaceLost, text, token).ConfigureAwait(false);
            _Signals.Notify(run.Id);
            _Signals.NotifyQueue();
            return true;
        }

        /// <summary>
        /// Record a successful turn on its conversation: the harness session the next turn resumes, the profile that
        /// created it, and the node that holds the conversation's directories (none for executors that keep no state).
        /// Applies only while the run is still the conversation's active turn.
        /// </summary>
        /// <param name="run">Run that succeeded.</param>
        /// <param name="nodeId">Node that ran it.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task RecordSuccessAsync(Run run, string nodeId, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (String.IsNullOrEmpty(run.ConversationId)) return;
            Deployment? deployment = await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            bool keepsState = run.Executor == RunExecutorEnum.Process;
            await _Database.Conversations.RecordTurnSucceededAsync(
                run.ConversationId!,
                run.Id,
                String.IsNullOrEmpty(run.SessionId) ? null : run.SessionId,
                deployment?.HarnessProfileId,
                keepsState ? nodeId : null,
                keepsState ? (run.LeaseNodeName ?? nodeId) : null,
                DateTime.UtcNow,
                token).ConfigureAwait(false);
        }

        /// <summary>
        /// Transcript of a fallback turn's conversation: the earlier successful turns, oldest first, limited to the newest
        /// Runtime.ConversationTranscriptTurns and with each input and answer cut at Runtime.ConversationTranscriptChars.
        /// Null for runs that are not fallback turns.
        /// </summary>
        /// <param name="run">Run being compiled.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Conversation inputs, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<CompilationConversation?> TranscriptAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (String.IsNullOrEmpty(run.ConversationId) || !run.ConversationFallbackReason.HasValue) return null;

            List<Run> earlier = new List<Run>();
            RunFilter filter = new RunFilter();
            filter.TenantId = run.TenantId;
            filter.ConversationId = run.ConversationId;
            filter.Status = RunStatusEnum.Succeeded;
            filter.MaxResults = 1000;
            filter.Ordering = EnumerationOrderEnum.CreatedAscending;
            for (int page = 0; page < 20; page++)
            {
                token.ThrowIfCancellationRequested();
                filter.Skip = page * filter.MaxResults;
                EnumerationResult<Run> result = await _Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
                earlier.AddRange(result.Objects.Where(r => r.Id != run.Id && r.ConversationTurn < run.ConversationTurn));
                if (result.Objects.Count < filter.MaxResults) break;
            }

            List<Run> ordered = earlier.OrderBy(r => r.ConversationTurn).ThenBy(r => r.CreatedUtc).ToList();
            int keep = _Options.ConversationTranscriptTurns;
            CompilationConversation conversation = new CompilationConversation();
            conversation.OmittedTurns = Math.Max(0, ordered.Count - keep);
            foreach (Run turn in ordered.Skip(conversation.OmittedTurns))
            {
                ConversationTranscriptTurn item = new ConversationTranscriptTurn();
                item.Turn = Math.Max(1, turn.ConversationTurn);
                string input = turn.InputText ?? String.Empty;
                string output = (String.IsNullOrEmpty(turn.ResultText) ? turn.StructuredOutputJson : turn.ResultText) ?? String.Empty;
                item.InputTruncated = input.Length > _Options.ConversationTranscriptChars;
                item.OutputTruncated = output.Length > _Options.ConversationTranscriptChars;
                item.Input = item.InputTruncated ? input.Substring(0, _Options.ConversationTranscriptChars) : input;
                item.Output = item.OutputTruncated ? output.Substring(0, _Options.ConversationTranscriptChars) : output;
                conversation.Turns.Add(item);
            }
            return conversation;
        }

        #endregion

        #region Private-Methods

        private static Conversation NewConversation(RunCreateContext create)
        {
            Conversation conversation = new Conversation();
            conversation.TenantId = create.TenantId;
            conversation.AgentId = create.Agent.Id;
            conversation.AgentName = create.Agent.Name;
            conversation.CallerType = create.CallerType;
            conversation.CallerId = create.CallerId;
            conversation.CallerName = create.CallerName;
            return conversation;
        }

        private async Task RecordFallbackAsync(Run run, ConversationFallbackReasonEnum reason, string? text, CancellationToken token)
        {
            await _Database.Conversations.RecordFallbackAsync(run.ConversationId!, reason, DateTime.UtcNow, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.ConversationFallbacks, "reason", reason.ToString());
            string message = text ?? "This turn starts a fresh harness session seeded with the transcript of the earlier turns (" + reason + ").";
            await AppendEventAsync(run, "ConversationFallback", message, token).ConfigureAwait(false);
            Logging?.Info(_Header + "conversation " + run.ConversationId + " turn " + run.ConversationTurn + " falls back (" + reason + "): " + message + " " + RunTracing.LogFields(run.Id, run.TraceId));
        }

        private async Task AppendEventAsync(Run run, string code, string text, CancellationToken token)
        {
            Run? current = await _Database.Runs.ReadAsync(run.Id, token).ConfigureAwait(false);
            long sequence = Math.Max(run.LastEventSequence, current?.LastEventSequence ?? 0);
            for (int attempt = 0; attempt < 5; attempt++)
            {
                sequence++;
                RunEvent evt = new RunEvent();
                evt.TenantId = run.TenantId;
                evt.RunId = run.Id;
                evt.Sequence = sequence;
                evt.EventType = RunEventTypeEnum.Lifecycle;
                evt.TimestampUtc = DateTime.UtcNow;
                evt.Text = text;
                evt.Code = code;
                int inserted = await _Database.RunEvents.InsertBatchAsync(new List<RunEvent> { evt }, token).ConfigureAwait(false);
                if (inserted > 0) break;
            }
            await _Database.Runs.UpdateLastEventSequenceAsync(run.Id, sequence, token).ConfigureAwait(false);
            run.LastEventSequence = Math.Max(run.LastEventSequence, sequence);
            _Signals.Notify(run.Id);
        }

        #endregion
    }
}
