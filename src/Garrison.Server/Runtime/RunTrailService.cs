namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;

    /// <summary>
    /// Builds the activity trail of a run (LEARNABILITY_PLAN.md section 6.2): it walks back from the run to where the work
    /// started (LP-003), then forward breadth first through child runs, fan-out groups, retries, messages and the runs they
    /// woke, reports, escalations, approvals, and effect journal entries, reading each level in batches by identifier set.
    /// Records are deduplicated, the walk stops at the caps in <see cref="RunTrailSettings"/> (LP-001), steps the caller
    /// may not read become Redacted placeholders (LP-004), and no text an agent wrote is copied in (LP-002). Run tokens are
    /// refused (LP-010). Thread-safe: each call keeps its own state.
    /// </summary>
    public class RunTrailService
    {
        #region Public-Members

        /// <summary>
        /// Caps and defaults, updated from the RunTrail.* cluster settings. Never null.
        /// </summary>
        public RunTrailSettings Settings
        {
            get
            {
                return _Settings;
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _ReplyPrefix = "rep_";
        private static readonly string _RedactedPrefix = "red_";
        private static readonly string _CallerPrefix = "caller_";
        private static readonly int _MaxDeliveredPerRun = 50;
        private readonly DatabaseDriverBase _Database;
        private readonly AuthorizationService _Authorization;
        private readonly ChainOfCommand _Chain;
        private readonly RunTrailSettings _Settings;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="authorization">Authorization service, for the per-step read checks.</param>
        /// <param name="chain">Chain of command, for unit names from live organizations.</param>
        /// <param name="settings">Caps and defaults.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public RunTrailService(DatabaseDriverBase database, AuthorizationService authorization, ChainOfCommand chain, RunTrailSettings settings)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Authorization = authorization ?? throw new ArgumentNullException(nameof(authorization));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the trail of a run. The caller must already be authorized to read the run; each other step is checked
        /// against the caller's read permission for its resource type.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier (the focus).</param>
        /// <param name="includeEffects">Whether to show effect journal entries, or null for RunTrail.IncludeEffects.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The trail.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx, tenantId, or runId is null or empty.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 RunTokenTrailNotAllowed for a run token (LP-010).</exception>
        /// <exception cref="NotFoundException">Thrown when the run does not exist in the tenant.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public async Task<RunTrail> BuildAsync(RequestContext ctx, string tenantId, string runId, bool? includeEffects, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            long started = Stopwatch.GetTimestamp();
            using (Activity? span = GarrisonTracing.Start("garrison.run_trail.build"))
            {
                try
                {
                    if (ctx.PrincipalType == PrincipalTypeEnum.Run)
                    {
                        throw new AppAccessException(403, "RunTokenTrailNotAllowed", "Activity trails are for people and API credentials; a run token cannot read one.");
                    }
                    Run focus = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false) ?? throw new NotFoundException("Run not found.");
                    RunTrail trail = await BuildCoreAsync(ctx, tenantId, focus, includeEffects ?? _Settings.IncludeEffects, token).ConfigureAwait(false);
                    span?.SetTag("node_count", trail.NodeCount);
                    span?.SetTag("hop_count", trail.HopCount);
                    span?.SetTag("truncation", trail.Truncation.ToString());
                    GarrisonTracing.Ok(span);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RunTrailRequests, "outcome", trail.Truncation == RunTrailTruncationEnum.None ? "built" : "truncated");
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.RunTrailBuildDuration, Stopwatch.GetElapsedTime(started).TotalSeconds, "truncation", trail.Truncation.ToString());
                    return trail;
                }
                catch (AppAccessException e)
                {
                    GarrisonTracing.Fail(span, e.Message);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RunTrailRequests, "outcome", "forbidden");
                    throw;
                }
                catch (NotFoundException e)
                {
                    GarrisonTracing.Fail(span, e.Message);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RunTrailRequests, "outcome", "not_found");
                    throw;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    GarrisonTracing.Fail(span, e);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RunTrailRequests, "outcome", "failed");
                    throw;
                }
            }
        }

        #endregion

        #region Private-Methods

        private async Task<RunTrail> BuildCoreAsync(RequestContext ctx, string tenantId, Run focus, bool includeEffects, CancellationToken token)
        {
            int maxNodes = _Settings.MaxNodes;
            int maxHops = _Settings.MaxMessageHops;
            int spanHours = _Settings.MaxSpanHours;

            RunTrailWalk probe = new RunTrailWalk(maxNodes, null);
            RunTrailOrigin origin = await OriginAsync(tenantId, focus, maxHops, maxNodes, probe, token).ConfigureAwait(false);
            DateTime originUtc = origin.Node?.StartedUtc ?? origin.Roots.Select(Start).Min();
            RunTrailWalk walk = new RunTrailWalk(maxNodes, originUtc.AddHours(spanHours));
            if (probe.Truncation != RunTrailTruncationEnum.None) walk.Truncate(probe.Truncation);
            foreach (KeyValuePair<string, Run> known in probe.Runs) walk.Runs[known.Key] = known.Value;

            string originId;
            if (origin.Node != null)
            {
                walk.Add(origin.Node, true);
                originId = origin.Node.Id;
            }
            else
            {
                originId = origin.Roots[0].Id;
            }

            if (origin.Message != null && origin.Node != null)
            {
                walk.Add(MessageNode(origin.Message));
                walk.Link(origin.Node.Id, origin.Message.Id, RunTrailEdgeKindEnum.Sent, origin.Message.CreatedUtc);
            }

            List<Run> frontier = new List<Run>();
            foreach (Run root in origin.Roots)
            {
                walk.Runs[root.Id] = root;
                walk.SetDepth(root.Id, origin.Message != null ? 1 : 0);
                if (!walk.Add(RunNode(root, focus.Id), root.Id == focus.Id)) continue;
                frontier.Add(root);
                if (origin.Message != null)
                {
                    walk.Link(origin.Message.Id, root.Id, origin.Message.WokeRecipient ? RunTrailEdgeKindEnum.Woke : RunTrailEdgeKindEnum.Delivered, Start(root));
                }
                else if (origin.Node != null)
                {
                    walk.Link(origin.Node.Id, root.Id, RunTrailEdgeKindEnum.Started, Start(root));
                }
            }

            HashSet<string> expanded = new HashSet<string>(StringComparer.Ordinal);
            while (frontier.Count > 0 && !walk.Full)
            {
                token.ThrowIfCancellationRequested();
                List<Run> level = frontier.Where(r => expanded.Add(r.Id)).ToList();
                if (level.Count == 0) break;
                frontier = await ExpandAsync(tenantId, level, focus.Id, maxHops, includeEffects, walk, token).ConfigureAwait(false);
            }

            if (!walk.Has(focus.Id))
            {
                walk.Runs[focus.Id] = focus;
                walk.Add(RunNode(focus, focus.Id), true);
            }

            Run firstRoot = origin.Roots[0];
            if (origin.Node != null && origin.Node.Kind == RunTrailNodeKindEnum.Caller && origin.Message == null && Terminal(firstRoot.Status) && walk.Has(firstRoot.Id))
            {
                RunTrailNode reply = new RunTrailNode();
                reply.Id = _ReplyPrefix + firstRoot.Id;
                reply.Kind = RunTrailNodeKindEnum.Reply;
                reply.State = firstRoot.Status.ToString();
                reply.StartedUtc = firstRoot.CompletedUtc ?? firstRoot.LastUpdateUtc;
                reply.Lane = RunTrailNode.CallerLane;
                reply.CallerType = origin.Node.CallerType;
                reply.CallerName = origin.Node.CallerName;
                if (walk.Add(reply)) walk.Link(firstRoot.Id, reply.Id, RunTrailEdgeKindEnum.Replied, reply.StartedUtc);
            }

            await AttachUnitsAsync(tenantId, walk, token).ConfigureAwait(false);
            originId = await RedactAsync(ctx, tenantId, walk, originId, focus.Id, token).ConfigureAwait(false);

            RunTrail trail = new RunTrail();
            trail.OriginId = originId;
            trail.FocusRunId = focus.Id;
            trail.Nodes = walk.Nodes;
            trail.Edges = walk.Edges;
            trail.Truncation = walk.Truncation;
            trail.NodeCount = walk.Nodes.Count;
            trail.HopCount = walk.MaxDepth;
            trail.GeneratedUtc = DateTime.UtcNow;
            return trail;
        }

        private async Task<RunTrailOrigin> OriginAsync(string tenantId, Run focus, int maxHops, int maxSteps, RunTrailWalk probe, CancellationToken token)
        {
            RunTrailOrigin origin = new RunTrailOrigin();
            HashSet<string> visited = new HashSet<string>(StringComparer.Ordinal);
            Run current = focus;
            probe.Runs[focus.Id] = focus;
            for (int step = 0; step <= maxSteps; step++)
            {
                token.ThrowIfCancellationRequested();
                if (!visited.Add(current.Id)) break;

                Run? parent = await LinkedRunAsync(tenantId, current.ParentRunId, probe, token).ConfigureAwait(false)
                    ?? await LinkedRunAsync(tenantId, current.RetryOfRunId, probe, token).ConfigureAwait(false);
                if (parent != null)
                {
                    current = parent;
                    continue;
                }

                if (!String.IsNullOrEmpty(current.PipelineRunId))
                {
                    origin.Node = await PipelineNodeAsync(tenantId, current, token).ConfigureAwait(false);
                    origin.Roots = (await _Database.Runs.ListByPipelineRunsAsync(tenantId, new List<string> { current.PipelineRunId }, maxSteps, token).ConfigureAwait(false))
                        .Where(r => String.IsNullOrEmpty(r.ParentRunId) && String.IsNullOrEmpty(r.RetryOfRunId)).ToList();
                    if (!origin.Roots.Any(r => r.Id == current.Id)) origin.Roots.Add(current);
                    return origin;
                }
                if (!String.IsNullOrEmpty(current.MandateTickId))
                {
                    origin.Node = await TickNodeAsync(tenantId, current, token).ConfigureAwait(false);
                    origin.Roots.Add(current);
                    return origin;
                }
                if (!String.IsNullOrEmpty(current.TriggerId))
                {
                    RunTrailNode trigger = new RunTrailNode();
                    trigger.Id = current.TriggerId;
                    trigger.Kind = RunTrailNodeKindEnum.Trigger;
                    trigger.StartedUtc = current.CreatedUtc;
                    trigger.Lane = RunTrailNode.CallerLane;
                    origin.Node = trigger;
                    origin.Roots.Add(current);
                    return origin;
                }

                AgentMessage? woke = (await _Database.AgentMessages.ListByDeliveredRunsAsync(tenantId, new List<string> { current.Id }, _MaxDeliveredPerRun, token).ConfigureAwait(false))
                    .Where(m => m.WokeRecipient).OrderBy(m => m.CreatedUtc).ThenBy(m => m.Id, StringComparer.Ordinal).FirstOrDefault();
                if (woke != null)
                {
                    if (origin.HopsBack >= maxHops)
                    {
                        probe.Truncate(RunTrailTruncationEnum.HopCap);
                        break;
                    }
                    origin.HopsBack++;
                    Run? sender = await LinkedRunAsync(tenantId, woke.SenderRunId, probe, token).ConfigureAwait(false);
                    if (sender != null)
                    {
                        current = sender;
                        continue;
                    }
                    origin.Node = CallerNode(woke.SenderPrincipalType, woke.SenderPrincipalId, woke.SenderName, woke.Id, woke.CreatedUtc);
                    origin.Message = woke;
                    origin.Roots.Add(current);
                    return origin;
                }

                Escalation? routed = (await _Database.Escalations.ListByRoutedRunsAsync(tenantId, new List<string> { current.Id }, 1, token).ConfigureAwait(false)).FirstOrDefault();
                Run? raising = routed == null ? null : await LinkedRunAsync(tenantId, routed.RaisingRunId, probe, token).ConfigureAwait(false);
                if (raising != null)
                {
                    current = raising;
                    continue;
                }

                origin.Node = CallerNode(current.CallerType, current.CallerId, current.CallerName, current.Id, current.CreatedUtc);
                origin.Roots.Add(current);
                return origin;
            }

            // The walk back stopped at a cap or a loop: the oldest run reached is the origin.
            if (probe.Truncation == RunTrailTruncationEnum.None) probe.Truncate(RunTrailTruncationEnum.HopCap);
            origin.Node = null;
            origin.Roots.Add(current);
            return origin;
        }

        private async Task<Run?> LinkedRunAsync(string tenantId, string? runId, RunTrailWalk probe, CancellationToken token)
        {
            if (String.IsNullOrEmpty(runId)) return null;
            if (probe.Runs.TryGetValue(runId, out Run? known)) return known;
            Run? run = (await _Database.Runs.ListByIdsAsync(tenantId, new List<string> { runId }, token).ConfigureAwait(false)).FirstOrDefault();
            if (run != null) probe.Runs[run.Id] = run;
            return run;
        }

        private async Task<List<Run>> ExpandAsync(string tenantId, List<Run> level, string focusId, int maxHops, bool includeEffects, RunTrailWalk walk, CancellationToken token)
        {
            List<string> ids = level.Select(r => r.Id).ToList();
            int limit = walk.Remaining;
            List<Run> next = new List<Run>();

            List<FanOutGroup> groups = await _Database.FanOuts.ListByParentsAsync(tenantId, ids, limit, token).ConfigureAwait(false);
            List<Run> children = await _Database.Runs.ListByParentsAsync(tenantId, ids, limit, token).ConfigureAwait(false);
            List<Run> retries = await _Database.Runs.ListRetriesOfAsync(tenantId, ids, limit, token).ConfigureAwait(false);
            List<EffectOperation> effects = includeEffects ? await _Database.EffectOperations.ListByRunsAsync(tenantId, ids, limit, token).ConfigureAwait(false) : new List<EffectOperation>();
            List<AgentMessage> sent = await _Database.AgentMessages.ListBySenderRunsAsync(tenantId, ids, limit, token).ConfigureAwait(false);
            List<Report> reports = await _Database.Reports.ListByRunsAsync(tenantId, ids, limit, token).ConfigureAwait(false);
            List<Escalation> escalations = await _Database.Escalations.ListByRaisingRunsAsync(tenantId, ids, limit, token).ConfigureAwait(false);
            List<Approval> approvals = await _Database.Approvals.ListByRunsAsync(tenantId, ids, limit, token).ConfigureAwait(false);

            List<string> targets = sent.Select(m => m.DeliveredRunId).Concat(escalations.Select(e => e.RoutedRunId))
                .Where(id => !String.IsNullOrEmpty(id) && !walk.Runs.ContainsKey(id!)).Select(id => id!).Distinct(StringComparer.Ordinal).ToList();
            foreach (Run run in await _Database.Runs.ListByIdsAsync(tenantId, targets, token).ConfigureAwait(false)) walk.Runs[run.Id] = run;

            foreach (FanOutGroup group in groups)
            {
                Run? parent = walk.Runs.TryGetValue(group.ParentRunId, out Run? p) ? p : null;
                if (walk.Add(GroupNode(group, parent))) walk.Link(group.ParentRunId, group.Id, RunTrailEdgeKindEnum.FannedOut, group.CreatedUtc);
            }

            foreach (Run child in children)
            {
                walk.Runs[child.Id] = child;
                walk.SetDepth(child.Id, walk.DepthOf(child.ParentRunId));
                bool isNew = !walk.Has(child.Id);
                if (!walk.Add(RunNode(child, focusId), child.Id == focusId)) continue;
                string from = !String.IsNullOrEmpty(child.FanOutGroupId) && walk.Has(child.FanOutGroupId) ? child.FanOutGroupId : child.ParentRunId!;
                walk.Link(from, child.Id, RunTrailEdgeKindEnum.Spawned, Start(child));
                if (isNew) next.Add(child);
            }

            foreach (Run retry in retries)
            {
                walk.Runs[retry.Id] = retry;
                walk.SetDepth(retry.Id, walk.DepthOf(retry.RetryOfRunId));
                bool isNew = !walk.Has(retry.Id);
                if (!walk.Add(RunNode(retry, focusId), retry.Id == focusId)) continue;
                walk.Link(retry.RetryOfRunId, retry.Id, RunTrailEdgeKindEnum.Retried, Start(retry));
                if (isNew) next.Add(retry);
            }

            foreach (EffectOperation effect in effects)
            {
                Run? run = walk.Runs.TryGetValue(effect.RunId, out Run? r) ? r : null;
                if (walk.Add(EffectNode(effect, run))) walk.Link(effect.RunId, effect.Id, RunTrailEdgeKindEnum.Performed, effect.CreatedUtc);
            }

            foreach (AgentMessage message in sent)
            {
                if (!walk.Add(MessageNode(message))) continue;
                walk.Link(message.SenderRunId, message.Id, RunTrailEdgeKindEnum.Sent, message.CreatedUtc);
                if (String.IsNullOrEmpty(message.DeliveredRunId) || !walk.Runs.TryGetValue(message.DeliveredRunId, out Run? target)) continue;
                if (message.WokeRecipient)
                {
                    int depth = walk.DepthOf(message.SenderRunId) + 1;
                    if (depth > maxHops && !walk.Has(target.Id))
                    {
                        walk.Truncate(RunTrailTruncationEnum.HopCap);
                        continue;
                    }
                    bool isNew = !walk.Has(target.Id);
                    walk.SetDepth(target.Id, depth);
                    if (!walk.Add(RunNode(target, focusId), target.Id == focusId)) continue;
                    walk.Link(message.Id, target.Id, RunTrailEdgeKindEnum.Woke, Start(target));
                    if (isNew) next.Add(target);
                }
                else
                {
                    // A message read by a run that was already working: the run has its own origin, so it is shown
                    // but not followed.
                    if (!walk.Add(RunNode(target, focusId), target.Id == focusId)) continue;
                    walk.Link(message.Id, target.Id, RunTrailEdgeKindEnum.Delivered, message.DeliveredUtc);
                }
            }

            foreach (Report report in reports)
            {
                Run? run = !String.IsNullOrEmpty(report.RunId) && walk.Runs.TryGetValue(report.RunId, out Run? r) ? r : null;
                if (walk.Add(ReportNode(report, run))) walk.Link(report.RunId, report.Id, RunTrailEdgeKindEnum.Filed, report.CreatedUtc);
            }

            foreach (Escalation escalation in escalations)
            {
                if (!walk.Add(EscalationNode(escalation))) continue;
                walk.Link(escalation.RaisingRunId, escalation.Id, RunTrailEdgeKindEnum.Raised, escalation.CreatedUtc);
                if (!String.IsNullOrEmpty(escalation.RoutedRunId) && walk.Runs.TryGetValue(escalation.RoutedRunId, out Run? routed))
                {
                    int depth = walk.DepthOf(escalation.RaisingRunId) + 1;
                    if (depth > maxHops && !walk.Has(routed.Id))
                    {
                        walk.Truncate(RunTrailTruncationEnum.HopCap);
                    }
                    else
                    {
                        bool isNew = !walk.Has(routed.Id);
                        walk.SetDepth(routed.Id, depth);
                        if (walk.Add(RunNode(routed, focusId), routed.Id == focusId))
                        {
                            walk.Link(escalation.Id, routed.Id, RunTrailEdgeKindEnum.Routed, Start(routed));
                            if (isNew) next.Add(routed);
                        }
                    }
                }
                if (escalation.Status == EscalationStatusEnum.Answered && escalation.Mode == EscalationModeEnum.Blocking)
                {
                    walk.Link(escalation.Id, escalation.RaisingRunId, RunTrailEdgeKindEnum.Answered, escalation.ResolvedUtc);
                }
            }

            foreach (Approval approval in approvals)
            {
                if (!walk.Add(ApprovalNode(approval))) continue;
                walk.Link(approval.RunId, approval.Id, RunTrailEdgeKindEnum.Requested, approval.RequestedUtc);
                if (approval.DecidedUtc.HasValue) walk.Link(approval.Id, approval.RunId, RunTrailEdgeKindEnum.Decided, approval.DecidedUtc);
            }

            return next;
        }

        private async Task AttachUnitsAsync(string tenantId, RunTrailWalk walk, CancellationToken token)
        {
            List<string> agents = walk.Nodes.Select(n => n.AgentId).Where(a => !String.IsNullOrEmpty(a)).Select(a => a!).Distinct(StringComparer.Ordinal).ToList();
            if (agents.Count == 0) return;
            List<OrgTree> trees = await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false);
            if (trees.Count == 0) return;
            Dictionary<string, OrgPosition> positions = new Dictionary<string, OrgPosition>(StringComparer.Ordinal);
            foreach (string agentId in agents)
            {
                foreach (OrgTree tree in trees)
                {
                    OrgPosition? position = tree.PositionOf(agentId);
                    if (position == null) continue;
                    positions[agentId] = position;
                    break;
                }
            }
            foreach (RunTrailNode node in walk.Nodes)
            {
                if (String.IsNullOrEmpty(node.AgentId) || !positions.TryGetValue(node.AgentId, out OrgPosition? position)) continue;
                node.UnitId = position.UnitId;
                node.UnitName = position.UnitName;
            }
        }

        private async Task<string> RedactAsync(RequestContext ctx, string tenantId, RunTrailWalk walk, string originId, string focusId, CancellationToken token)
        {
            Dictionary<ResourceTypeEnum, bool> tenantWide = new Dictionary<ResourceTypeEnum, bool>();
            Dictionary<string, bool> decided = new Dictionary<string, bool>(StringComparer.Ordinal);
            List<RunTrailNode> hidden = new List<RunTrailNode>();
            foreach (RunTrailNode node in walk.Nodes)
            {
                if (node.Id == focusId) continue;
                ResourceTypeEnum type = ResourceOf(node.Kind);
                string? resourceId = ResourceIdOf(node, walk);
                if (!tenantWide.TryGetValue(type, out bool wide))
                {
                    wide = (await _Authorization.EvaluateAsync(ctx, tenantId, type, OperationTypeEnum.Read, null, token).ConfigureAwait(false)).Permitted;
                    tenantWide[type] = wide;
                }
                if (wide) continue;
                string key = type.ToString() + "|" + (resourceId ?? String.Empty);
                if (!decided.TryGetValue(key, out bool permitted))
                {
                    permitted = !String.IsNullOrEmpty(resourceId) && (await _Authorization.EvaluateAsync(ctx, tenantId, type, OperationTypeEnum.Read, resourceId, token).ConfigureAwait(false)).Permitted;
                    decided[key] = permitted;
                }
                if (!permitted) hidden.Add(node);
            }

            int sequence = 0;
            foreach (RunTrailNode node in hidden)
            {
                sequence++;
                RunTrailNode placeholder = new RunTrailNode();
                placeholder.Id = _RedactedPrefix + sequence;
                placeholder.Kind = RunTrailNodeKindEnum.Redacted;
                placeholder.RedactedKind = node.Kind;
                placeholder.StartedUtc = node.StartedUtc;
                placeholder.Lane = node.Lane;
                if (node.Id == originId) originId = placeholder.Id;
                walk.Replace(node.Id, placeholder);
            }
            return originId;
        }

        private static ResourceTypeEnum ResourceOf(RunTrailNodeKindEnum kind)
        {
            switch (kind)
            {
                case RunTrailNodeKindEnum.Message:
                    return ResourceTypeEnum.AgentMessage;
                case RunTrailNodeKindEnum.Report:
                    return ResourceTypeEnum.Report;
                case RunTrailNodeKindEnum.Escalation:
                    return ResourceTypeEnum.Escalation;
                case RunTrailNodeKindEnum.Approval:
                    return ResourceTypeEnum.Approval;
                case RunTrailNodeKindEnum.FanOutGroup:
                    return ResourceTypeEnum.FanOutGroup;
                case RunTrailNodeKindEnum.PipelineRun:
                    return ResourceTypeEnum.PipelineRun;
                case RunTrailNodeKindEnum.KeeperTick:
                    return ResourceTypeEnum.Mandate;
                case RunTrailNodeKindEnum.Trigger:
                    return ResourceTypeEnum.Trigger;
                default:
                    return ResourceTypeEnum.Run;
            }
        }

        private static string? ResourceIdOf(RunTrailNode node, RunTrailWalk walk)
        {
            switch (node.Kind)
            {
                case RunTrailNodeKindEnum.Run:
                    return node.Id;
                case RunTrailNodeKindEnum.Effect:
                    return walk.Edges.FirstOrDefault(e => e.ToId == node.Id && e.Kind == RunTrailEdgeKindEnum.Performed)?.FromId;
                case RunTrailNodeKindEnum.Reply:
                    return node.Id.StartsWith(_ReplyPrefix, StringComparison.Ordinal) ? node.Id.Substring(_ReplyPrefix.Length) : null;
                case RunTrailNodeKindEnum.Caller:
                    return walk.Edges.FirstOrDefault(e => e.FromId == node.Id && e.Kind == RunTrailEdgeKindEnum.Started)?.ToId
                        ?? walk.Runs.Values.Select(r => r.Id).FirstOrDefault();
                case RunTrailNodeKindEnum.KeeperTick:
                    return walk.Runs.Values.FirstOrDefault(r => r.MandateTickId == node.Id)?.MandateId;
                default:
                    return node.Id;
            }
        }

        private async Task<RunTrailNode> PipelineNodeAsync(string tenantId, Run stage, CancellationToken token)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = stage.PipelineRunId!;
            node.Kind = RunTrailNodeKindEnum.PipelineRun;
            node.Lane = RunTrailNode.CallerLane;
            PipelineRun? pipeline = await _Database.PipelineRuns.ReadAsync(tenantId, stage.PipelineRunId!, token).ConfigureAwait(false);
            if (pipeline != null)
            {
                node.State = pipeline.Status.ToString();
                node.StartedUtc = pipeline.StartedUtc ?? pipeline.CreatedUtc;
                node.EndedUtc = pipeline.CompletedUtc;
                node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            }
            else
            {
                node.StartedUtc = stage.CreatedUtc;
            }
            return node;
        }

        private async Task<RunTrailNode> TickNodeAsync(string tenantId, Run run, CancellationToken token)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = run.MandateTickId!;
            node.Kind = RunTrailNodeKindEnum.KeeperTick;
            node.Lane = RunTrailNode.CallerLane;
            node.AgentId = run.AgentId;
            node.AgentName = run.AgentName;
            MandateTick? tick = (await _Database.MandateTicks.ListByIdsAsync(tenantId, new List<string> { run.MandateTickId! }, token).ConfigureAwait(false)).FirstOrDefault();
            if (tick != null)
            {
                node.State = tick.Outcome?.ToString();
                node.StartedUtc = tick.StartedUtc;
                node.EndedUtc = tick.FinishedUtc;
                node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            }
            else
            {
                node.StartedUtc = run.CreatedUtc;
            }
            return node;
        }

        private static RunTrailNode CallerNode(PrincipalTypeEnum type, string? principalId, string? name, string fallbackSuffix, DateTime atUtc)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = String.IsNullOrEmpty(principalId) ? _CallerPrefix + fallbackSuffix : principalId;
            node.Kind = RunTrailNodeKindEnum.Caller;
            node.Lane = RunTrailNode.CallerLane;
            node.StartedUtc = atUtc;
            node.CallerType = type;
            node.CallerName = name;
            return node;
        }

        private static RunTrailNode RunNode(Run run, string focusId)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = run.Id;
            node.Kind = RunTrailNodeKindEnum.Run;
            node.State = run.Status.ToString();
            node.AgentId = run.AgentId;
            node.AgentName = run.AgentName;
            node.DeploymentId = String.IsNullOrEmpty(run.DeploymentId) ? null : run.DeploymentId;
            node.StartedUtc = Start(run);
            node.EndedUtc = run.CompletedUtc;
            node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            node.InputTokens = run.InputTokens;
            node.OutputTokens = run.OutputTokens;
            node.CostUsd = run.CostUsd;
            node.RunKind = run.Kind;
            node.IsFocus = run.Id == focusId;
            node.Lane = run.AgentId;
            return node;
        }

        private static RunTrailNode GroupNode(FanOutGroup group, Run? parent)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = group.Id;
            node.Kind = RunTrailNodeKindEnum.FanOutGroup;
            node.State = group.Status.ToString();
            node.AgentId = parent?.AgentId;
            node.AgentName = parent?.AgentName;
            node.StartedUtc = group.CreatedUtc;
            node.EndedUtc = group.CompletedUtc;
            node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            node.Lane = parent?.AgentId ?? RunTrailNode.CallerLane;
            return node;
        }

        private static RunTrailNode EffectNode(EffectOperation effect, Run? run)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = effect.Id;
            node.Kind = RunTrailNodeKindEnum.Effect;
            node.State = effect.State.ToString();
            node.AgentId = run?.AgentId;
            node.AgentName = run?.AgentName;
            node.StartedUtc = effect.CreatedUtc;
            node.ToolName = effect.Tool;
            node.Lane = run?.AgentId ?? RunTrailNode.CallerLane;
            return node;
        }

        private static RunTrailNode MessageNode(AgentMessage message)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = message.Id;
            node.Kind = RunTrailNodeKindEnum.Message;
            node.State = message.Status.ToString();
            node.AgentId = message.SenderAgentId;
            node.AgentName = message.SenderAgentName;
            node.StartedUtc = message.CreatedUtc;
            node.EndedUtc = message.DeliveredUtc;
            node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            node.Lane = String.IsNullOrEmpty(message.SenderRunId) ? RunTrailNode.CallerLane : (message.SenderAgentId ?? RunTrailNode.CallerLane);
            return node;
        }

        private static RunTrailNode ReportNode(Report report, Run? run)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = report.Id;
            node.Kind = RunTrailNodeKindEnum.Report;
            node.State = "Filed";
            node.AgentId = report.AuthorAgentId ?? run?.AgentId;
            node.AgentName = report.AuthorAgentName ?? run?.AgentName;
            node.StartedUtc = report.CreatedUtc;
            node.Lane = node.AgentId ?? RunTrailNode.CallerLane;
            return node;
        }

        private static RunTrailNode EscalationNode(Escalation escalation)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = escalation.Id;
            node.Kind = RunTrailNodeKindEnum.Escalation;
            node.State = escalation.Status.ToString();
            node.AgentId = escalation.AgentId;
            node.AgentName = escalation.AgentName;
            node.StartedUtc = escalation.CreatedUtc;
            node.EndedUtc = escalation.ResolvedUtc;
            node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            node.Lane = escalation.AgentId ?? RunTrailNode.CallerLane;
            return node;
        }

        private static RunTrailNode ApprovalNode(Approval approval)
        {
            RunTrailNode node = new RunTrailNode();
            node.Id = approval.Id;
            node.Kind = RunTrailNodeKindEnum.Approval;
            node.State = approval.Status.ToString();
            node.AgentId = approval.AgentId;
            node.AgentName = approval.AgentName;
            node.DeploymentId = String.IsNullOrEmpty(approval.DeploymentId) ? null : approval.DeploymentId;
            node.StartedUtc = approval.RequestedUtc;
            node.EndedUtc = approval.DecidedUtc;
            node.DurationMs = Duration(node.StartedUtc, node.EndedUtc);
            node.Lane = approval.AgentId;
            return node;
        }

        private static DateTime Start(Run run)
        {
            return run.StartedUtc ?? run.CreatedUtc;
        }

        private static long? Duration(DateTime? start, DateTime? end)
        {
            if (!start.HasValue || !end.HasValue) return null;
            return (long)Math.Max(0, (end.Value - start.Value).TotalMilliseconds);
        }

        private static bool Terminal(RunStatusEnum status)
        {
            return status == RunStatusEnum.Succeeded || status == RunStatusEnum.Failed || status == RunStatusEnum.Cancelled
                || status == RunStatusEnum.TimedOut || status == RunStatusEnum.Rejected;
        }

        #endregion
    }
}
