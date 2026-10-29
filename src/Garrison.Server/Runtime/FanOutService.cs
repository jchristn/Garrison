namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;
    using SyslogLogging;

    /// <summary>
    /// Parallel fan-out and gather (AD5, AD-016): starts a group of delegated child runs in one call, joins them by
    /// policy, and enforces the group's timeout and budget. Members are ordinary delegated runs, so allow lists, depth,
    /// capacity, and suspension work as for single delegations. Groups are evaluated when a member finishes, when gather
    /// polls, and by the leader sweep. Thread-safe.
    /// </summary>
    public class FanOutService
    {
        #region Public-Members

        /// <summary>
        /// Continuation service, used to resume a suspended parent when its group ends. Null leaves resuming to the
        /// continuation sweep.
        /// </summary>
        public ContinuationService? Continuations { get; set; } = null;

        /// <summary>
        /// How often gather re-reads its group while it waits, in milliseconds. Minimum 50, maximum 5000, default 250.
        /// </summary>
        public int GatherPollMs
        {
            get
            {
                return _GatherPollMs;
            }
            set
            {
                _GatherPollMs = Math.Clamp(value, 50, 5000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunService _Runs;
        private readonly AgentInvoker _Invoker;
        private readonly DelegationPolicy _Delegation;
        private readonly RuntimeOptions _Options;
        private readonly LoggingModule? _Logging;
        private readonly InputSchemaValidator _InputSchemas = new InputSchemaValidator();
        private int _GatherPollMs = 250;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="invoker">Agent invoker.</param>
        /// <param name="delegation">Delegation policy.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public FanOutService(DatabaseDriverBase database, RunService runs, AgentInvoker invoker, DelegationPolicy delegation, RuntimeOptions options, LoggingModule? logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Invoker = invoker ?? throw new ArgumentNullException(nameof(invoker));
            _Delegation = delegation ?? throw new ArgumentNullException(nameof(delegation));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Logging = logging;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start a group of child runs of a parent run without waiting (AD5.2). Every member is checked first (agent,
        /// allow list, depth, cycle, input schema); a failure refuses the whole call before any child starts. An identical
        /// request from the same parent returns its existing group instead of starting new children.
        /// </summary>
        /// <param name="ctx">The parent run's request context.</param>
        /// <param name="parent">Parent run.</param>
        /// <param name="request">Members, join policy, timeout, and budget.</param>
        /// <param name="authorize">Checks the caller may execute one member's agent; throws when it may not.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The group.</returns>
        /// <exception cref="ValidationException">Thrown for a malformed request (FanOutTooWide, ValidationFailed) or a member input that breaks its agent's schema.</exception>
        /// <exception cref="ConflictException">Thrown when a member fails a delegation check; the code is the check's.</exception>
        /// <exception cref="NotFoundException">Thrown when a member's agent does not exist.</exception>
        /// <exception cref="DelegationCapacityExhaustedException">Thrown when children could never run; members already started are cancelled.</exception>
        public async Task<FanOutGroupView> StartAsync(RequestContext ctx, Run parent, FanOutRequest request, Func<Agent, CancellationToken, Task> authorize, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (parent == null) throw new ArgumentNullException(nameof(parent));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (authorize == null) throw new ArgumentNullException(nameof(authorize));
            FanOutJoinPolicyEnum policy = ValidateRequest(request);
            string digest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Serializer.Serialize(request)))).ToLowerInvariant();
            FanOutGroup? existing = await _Database.FanOuts.ReadByDigestAsync(parent.TenantId, parent.Id, digest, token).ConfigureAwait(false);
            if (existing != null) return await ViewAsync(await EvaluateAsync(existing, token).ConfigureAwait(false), false, token).ConfigureAwait(false);

            // Check every member before any child starts (AD5.2).
            List<Agent> agents = new List<Agent>();
            for (int i = 0; i < request.Members.Count; i++)
            {
                FanOutMemberRequest member = request.Members[i];
                try
                {
                    Agent agent = await _Invoker.ResolveAgentAsync(parent.TenantId, member.Agent, token).ConfigureAwait(false);
                    await authorize(agent, token).ConfigureAwait(false);
                    await _Delegation.CheckAsync(parent, agent, token).ConfigureAwait(false);
                    InvocationInputRules.Require(member.Input);
                    _InputSchemas.Require(agent.InputSchemaJson, member.Input);
                    agents.Add(agent);
                }
                catch (ConflictException e)
                {
                    throw new ConflictException(e.Code, "Member " + i + " (" + member.Agent + "): " + e.Message + " No member was started.");
                }
                catch (NotFoundException e)
                {
                    throw new NotFoundException("Member " + i + " (" + member.Agent + "): " + e.Message + " No member was started.");
                }
                catch (ValidationException e)
                {
                    ValidationException wrapped = new ValidationException("Member " + i + " (" + member.Agent + "): " + e.Message + " No member was started.", e.Fields, e.Codes);
                    wrapped.Code = e.Code;
                    throw wrapped;
                }
            }

            FanOutGroup group = new FanOutGroup();
            group.TenantId = parent.TenantId;
            group.ParentRunId = parent.Id;
            group.RootRunId = parent.RootRunId ?? parent.Id;
            group.JoinPolicy = policy;
            group.Quorum = policy == FanOutJoinPolicyEnum.Quorum ? request.Quorum!.Value : 1;
            group.TimeoutSeconds = request.TimeoutSeconds ?? 0;
            group.DeadlineUtc = group.TimeoutSeconds > 0 ? DateTime.UtcNow.AddSeconds(group.TimeoutSeconds) : null;
            group.MaxCostUsd = request.MaxCostUsd;
            group.MaxTokens = request.MaxTokens;
            group.CancelRemaining = request.CancelRemaining ?? true;
            group.RequestDigest = digest;
            HashSet<string> labels = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < request.Members.Count; i++)
            {
                string label = String.IsNullOrWhiteSpace(request.Members[i].Label) ? agents[i].Name : request.Members[i].Label!.Trim();
                if (label.Length > 128) label = label.Substring(0, 128);
                string unique = label;
                for (int n = 2; !labels.Add(unique); n++) unique = label + "-" + n;
                group.Members.Add(new FanOutGroupMember { Position = i, Label = unique, AgentName = agents[i].Name, ChildRunId = IdGenerator.NewRunId() });
            }
            await _Database.FanOuts.CreateAsync(group, token).ConfigureAwait(false);

            Deployment? parentDeployment = await _Database.Deployments.ReadAsync(parent.TenantId, parent.DeploymentId, token).ConfigureAwait(false);
            bool durable = parentDeployment?.SuspensionEnabled == true;
            List<string> waits = new List<string>();
            try
            {
                for (int i = 0; i < group.Members.Count; i++)
                {
                    FanOutMemberRequest member = request.Members[i];
                    InvocationOptions options = new InvocationOptions();
                    options.Input = member.Input;
                    options.DeploymentId = String.IsNullOrWhiteSpace(member.DeploymentId) ? null : member.DeploymentId;
                    options.Parameters = member.Parameters ?? new Dictionary<string, string>();
                    options.Wait = false;
                    options.CallerWaits = true;
                    options.DurableWait = durable;
                    options.FanOutGroupId = group.Id;
                    options.RunId = group.Members[i].ChildRunId;
                    options.IdempotencyKey = group.Id + ":" + i.ToString(System.Globalization.CultureInfo.InvariantCulture);
                    options.Surface = "mcp";
                    await _Invoker.InvokeAsync(ctx, parent.TenantId, agents[i], options, token).ConfigureAwait(false);
                    if (!String.IsNullOrEmpty(options.ChildWaitId)) waits.Add(options.ChildWaitId);
                }
            }
            catch (Exception e) when (e is DelegationCapacityExhaustedException || e is ConflictException || e is ValidationException || e is NotFoundException)
            {
                // A member that could not start (capacity, a race with a deleted agent): stop the ones that did, so the
                // call either starts the whole group or leaves nothing running.
                await _Database.FanOuts.EndAsync(group.Id, FanOutGroupStatusEnum.Cancelled, "Not every member could start: " + e.Message, CancellationToken.None).ConfigureAwait(false);
                foreach (FanOutGroupMember started in group.Members) await _Runs.CancelAbandonedAsync(group.TenantId, started.ChildRunId, "its fan-out group could not start every member", CancellationToken.None).ConfigureAwait(false);
                foreach (string wait in waits) await _Invoker.EndChildWaitAsync(wait).ConfigureAwait(false);
                throw;
            }
            _Logging?.Info("[FanOut] run " + parent.Id + " started group " + group.Id + " with " + group.Members.Count + " members (" + policy + (durable ? ", durable" : String.Empty) + ")");
            return await ViewAsync(await EvaluateAsync(group, token).ConfigureAwait(false), false, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Re-evaluate a running group from its members' runs: record usage, then end it when its parent finished, its
        /// budget or timeout is exceeded, or its join policy is met (or can no longer be met). Ending cancels the members
        /// still running (for Joined, only with CancelRemaining) and resumes a suspended parent.
        /// </summary>
        /// <param name="group">Group with members.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The group as it is now.</returns>
        /// <exception cref="ArgumentNullException">Thrown when group is null.</exception>
        public async Task<FanOutGroup> EvaluateAsync(FanOutGroup group, CancellationToken token)
        {
            if (group == null) throw new ArgumentNullException(nameof(group));
            if (group.Status != FanOutGroupStatusEnum.Running) return group;
            List<Run?> runs = await MemberRunsAsync(group, token).ConfigureAwait(false);
            int total = group.Members.Count;
            int finished = runs.Count(r => r == null || RunService.IsTerminal(r.Status));
            int succeeded = runs.Count(r => r != null && r.Status == RunStatusEnum.Succeeded);
            double cost = runs.Sum(r => r?.CostUsd ?? 0);
            long tokens = runs.Sum(r => r == null ? 0 : r.InputTokens + r.OutputTokens);
            if (Math.Abs(cost - group.CostUsd) > 1e-9 || tokens != group.Tokens)
            {
                await _Database.FanOuts.UpdateUsageAsync(group.Id, cost, tokens, token).ConfigureAwait(false);
                group.CostUsd = cost;
                group.Tokens = tokens;
            }

            Run? parent = await _Database.Runs.ReadAsync(group.TenantId, group.ParentRunId, token).ConfigureAwait(false);
            FanOutGroupStatusEnum? end = null;
            string reason = String.Empty;
            if (parent == null || RunService.IsTerminal(parent.Status) || parent.Status == RunStatusEnum.Cancelling || parent.CancelRequested)
            {
                end = FanOutGroupStatusEnum.Cancelled;
                reason = "The parent run finished or was cancelled.";
            }
            else if (group.MaxCostUsd.HasValue && cost > group.MaxCostUsd.Value)
            {
                end = FanOutGroupStatusEnum.BudgetExceeded;
                reason = "The members spent " + cost.ToString("0.######", System.Globalization.CultureInfo.InvariantCulture) + " USD, over the budget of " + group.MaxCostUsd.Value.ToString("0.######", System.Globalization.CultureInfo.InvariantCulture) + " USD.";
            }
            else if (group.MaxTokens.HasValue && tokens > group.MaxTokens.Value)
            {
                end = FanOutGroupStatusEnum.BudgetExceeded;
                reason = "The members used " + tokens + " tokens, over the budget of " + group.MaxTokens.Value + ".";
            }
            else if (finished < total && group.DeadlineUtc.HasValue && DateTime.UtcNow >= group.DeadlineUtc.Value)
            {
                end = FanOutGroupStatusEnum.TimedOut;
                reason = "The group's timeout of " + group.TimeoutSeconds + " seconds passed with " + (total - finished) + " members still running.";
            }
            else
            {
                string? joined = JoinReason(group, total, finished, succeeded);
                if (joined != null)
                {
                    end = FanOutGroupStatusEnum.Joined;
                    reason = joined;
                }
            }
            if (!end.HasValue) return group;
            if (!await _Database.FanOuts.EndAsync(group.Id, end.Value, reason, token).ConfigureAwait(false))
            {
                return await _Database.FanOuts.ReadAsync(group.TenantId, group.Id, token).ConfigureAwait(false) ?? group;
            }
            group.Status = end.Value;
            group.StatusReason = reason;
            group.CompletedUtc = DateTime.UtcNow;
            if (end.Value != FanOutGroupStatusEnum.Joined || group.CancelRemaining)
            {
                for (int i = 0; i < runs.Count; i++)
                {
                    if (runs[i] == null || RunService.IsTerminal(runs[i]!.Status)) continue;
                    await _Runs.CancelAbandonedAsync(group.TenantId, group.Members[i].ChildRunId, "its fan-out group " + group.Id + " ended " + end.Value, token).ConfigureAwait(false);
                }
            }
            _Logging?.Info("[FanOut] group " + group.Id + " of run " + group.ParentRunId + " ended " + end.Value + ": " + reason);
            ContinuationService? continuations = Continuations;
            if (continuations != null) await continuations.ResumeAsync(group.TenantId, group.ParentRunId, token).ConfigureAwait(false);
            return group;
        }

        /// <summary>
        /// Wait up to waitSeconds for a group to end, then return every finished member's result, the members still
        /// running, and the failures (AD5.3). Partial results are always returned when the wait runs out.
        /// </summary>
        /// <param name="group">Group with members.</param>
        /// <param name="waitSeconds">Most seconds to wait; 0 returns at once.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The group with results and a rendered summary.</returns>
        /// <exception cref="ArgumentNullException">Thrown when group is null.</exception>
        public async Task<FanOutGroupView> GatherAsync(FanOutGroup group, int waitSeconds, CancellationToken token)
        {
            if (group == null) throw new ArgumentNullException(nameof(group));
            DateTime until = DateTime.UtcNow.AddSeconds(Math.Max(0, waitSeconds));
            FanOutGroup current = await EvaluateAsync(group, token).ConfigureAwait(false);
            while (current.Status == FanOutGroupStatusEnum.Running && DateTime.UtcNow < until)
            {
                await Task.Delay(_GatherPollMs, token).ConfigureAwait(false);
                FanOutGroup? fresh = await _Database.FanOuts.ReadAsync(group.TenantId, group.Id, token).ConfigureAwait(false);
                if (fresh == null) break;
                current = await EvaluateAsync(fresh, token).ConfigureAwait(false);
            }
            return await ViewAsync(current, true, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Cancel a running group (AD5.4): every member still running is cancelled and the group ends Cancelled.
        /// </summary>
        /// <param name="group">Group with members.</param>
        /// <param name="reason">Why, for the record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The group as it is now.</returns>
        /// <exception cref="ArgumentNullException">Thrown when group is null.</exception>
        public async Task<FanOutGroupView> CancelAsync(FanOutGroup group, string reason, CancellationToken token)
        {
            if (group == null) throw new ArgumentNullException(nameof(group));
            if (group.Status == FanOutGroupStatusEnum.Running && await _Database.FanOuts.EndAsync(group.Id, FanOutGroupStatusEnum.Cancelled, reason, token).ConfigureAwait(false))
            {
                group.Status = FanOutGroupStatusEnum.Cancelled;
                group.StatusReason = reason;
                group.CompletedUtc = DateTime.UtcNow;
                foreach (FanOutGroupMember member in group.Members) await _Runs.CancelAbandonedAsync(group.TenantId, member.ChildRunId, "its fan-out group " + group.Id + " was cancelled", token).ConfigureAwait(false);
                ContinuationService? continuations = Continuations;
                if (continuations != null) await continuations.ResumeAsync(group.TenantId, group.ParentRunId, token).ConfigureAwait(false);
            }
            return await ViewAsync(group, false, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Evaluate the group of a run that just finished, so the group ends (and a suspended parent resumes) as soon as
        /// its policy is met.
        /// </summary>
        /// <param name="run">Finished run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task OnRunFinishedAsync(Run run, CancellationToken token)
        {
            if (run == null || String.IsNullOrEmpty(run.FanOutGroupId)) return;
            FanOutGroup? group = await _Database.FanOuts.ReadAsync(run.TenantId, run.FanOutGroupId, token).ConfigureAwait(false);
            if (group != null) await EvaluateAsync(group, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Leader sweep: evaluate running groups, so timeouts, budgets, cancelled members, and finished parents end their
        /// groups even when no member completion arrives.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a group ended.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            bool changed = false;
            foreach (FanOutGroup running in await _Database.FanOuts.ListRunningAsync(500, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                FanOutGroup? group = await _Database.FanOuts.ReadAsync(running.TenantId, running.Id, token).ConfigureAwait(false);
                if (group == null) continue;
                FanOutGroup after = await EvaluateAsync(group, token).ConfigureAwait(false);
                if (after.Status != FanOutGroupStatusEnum.Running) changed = true;
            }
            return changed;
        }

        /// <summary>
        /// Describe a group with its members' current state and results.
        /// </summary>
        /// <param name="group">Group with members.</param>
        /// <param name="summary">Whether to render the fan-out-gather-result summary.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>View.</returns>
        /// <exception cref="ArgumentNullException">Thrown when group is null.</exception>
        public async Task<FanOutGroupView> ViewAsync(FanOutGroup group, bool summary, CancellationToken token)
        {
            if (group == null) throw new ArgumentNullException(nameof(group));
            FanOutGroupView view = new FanOutGroupView
            {
                FanOutGroupId = group.Id, ParentRunId = group.ParentRunId, Status = group.Status, StatusReason = group.StatusReason, JoinPolicy = group.JoinPolicy,
                Quorum = group.Quorum, Total = group.Members.Count, CostUsd = group.CostUsd, Tokens = group.Tokens, MaxCostUsd = group.MaxCostUsd, MaxTokens = group.MaxTokens,
                DeadlineUtc = group.DeadlineUtc, CreatedUtc = group.CreatedUtc, CompletedUtc = group.CompletedUtc
            };
            List<Run?> runs = await MemberRunsAsync(group, token).ConfigureAwait(false);
            int limit = _Options.GatherResultCharLimit;
            for (int i = 0; i < group.Members.Count; i++)
            {
                FanOutGroupMember member = group.Members[i];
                Run? run = runs[i];
                FanOutMemberView item = new FanOutMemberView { Label = member.Label, Agent = member.AgentName, RunId = member.ChildRunId };
                if (run == null)
                {
                    item.Status = RunStatusEnum.Cancelled;
                    item.ErrorMessage = "The member's run no longer exists.";
                }
                else
                {
                    item.Status = run.Status;
                    item.Outcome = RunService.IsTerminal(run.Status) ? run.Outcome : null;
                    string text = run.ResultText ?? String.Empty;
                    item.ResultTruncated = text.Length > limit;
                    item.ResultText = text.Length == 0 ? null : (item.ResultTruncated ? text.Substring(0, limit) : text);
                    item.StructuredOutputJson = run.StructuredOutputJson;
                    item.ErrorMessage = run.ErrorMessage;
                    item.CostUsd = run.CostUsd;
                    item.Tokens = run.InputTokens + run.OutputTokens;
                    if (!String.IsNullOrEmpty(run.FileSpaceId)) item.FilesWritten = await _Database.FileSpaces.PathsWrittenByRunAsync(run.TenantId, run.FileSpaceId, run.Id, token).ConfigureAwait(false);
                }
                view.Members.Add(item);
                if (!RunService.IsTerminal(item.Status)) view.Pending.Add(item.Label);
                else if (item.Status != RunStatusEnum.Succeeded) view.Failed.Add(item.Label);
                if (RunService.IsTerminal(item.Status)) view.Finished++;
                if (item.Status == RunStatusEnum.Succeeded) view.Succeeded++;
            }
            if (summary) view.Summary = await RenderSummaryAsync(group.TenantId, view, token).ConfigureAwait(false);
            return view;
        }

        #endregion

        #region Private-Methods

        private FanOutJoinPolicyEnum ValidateRequest(FanOutRequest request)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> codes = new Dictionary<string, string>(StringComparer.Ordinal);
            if (request.Members == null || request.Members.Count == 0)
            {
                errors["members"] = "List at least one member.";
                codes["members"] = "Required";
            }
            else if (request.Members.Count > _Options.MaxFanOutWidth)
            {
                ValidationException wide = new ValidationException("A fan-out starts at most " + _Options.MaxFanOutWidth + " members (Delegation.MaxFanOutWidth); this call has " + request.Members.Count + ". No member was started.",
                    new Dictionary<string, string> { ["members"] = "At most " + _Options.MaxFanOutWidth + " members." }, new Dictionary<string, string> { ["members"] = "FanOutTooWide" });
                wide.Code = "FanOutTooWide";
                throw wide;
            }
            else
            {
                for (int i = 0; i < request.Members.Count; i++)
                {
                    if (request.Members[i] == null || String.IsNullOrWhiteSpace(request.Members[i].Agent))
                    {
                        errors["members[" + i + "].agent"] = "Name the member's agent.";
                        codes["members[" + i + "].agent"] = "Required";
                    }
                    else if (String.IsNullOrWhiteSpace(request.Members[i].Input))
                    {
                        errors["members[" + i + "].input"] = "Give the member its complete input.";
                        codes["members[" + i + "].input"] = "Required";
                    }
                }
            }
            FanOutJoinPolicyEnum policy = FanOutJoinPolicyEnum.All;
            if (!String.IsNullOrWhiteSpace(request.JoinPolicy) && !Enum.TryParse(request.JoinPolicy, true, out policy))
            {
                errors["joinPolicy"] = "joinPolicy is All, Any, or Quorum.";
                codes["joinPolicy"] = "InvalidJoinPolicy";
            }
            int count = request.Members?.Count ?? 0;
            if (policy == FanOutJoinPolicyEnum.Quorum && (!request.Quorum.HasValue || request.Quorum.Value < 1 || request.Quorum.Value > count))
            {
                errors["quorum"] = "Quorum needs a quorum from 1 to the member count (" + count + ").";
                codes["quorum"] = "InvalidQuorum";
            }
            if (request.TimeoutSeconds.HasValue && (request.TimeoutSeconds.Value < 0 || request.TimeoutSeconds.Value > 86400))
            {
                errors["timeoutSeconds"] = "timeoutSeconds is 0 to 86400.";
                codes["timeoutSeconds"] = "OutOfRange";
            }
            if (request.MaxCostUsd.HasValue && !(request.MaxCostUsd.Value > 0))
            {
                errors["maxCostUsd"] = "maxCostUsd is greater than 0.";
                codes["maxCostUsd"] = "OutOfRange";
            }
            if (request.MaxTokens.HasValue && request.MaxTokens.Value < 1)
            {
                errors["maxTokens"] = "maxTokens is at least 1.";
                codes["maxTokens"] = "OutOfRange";
            }
            if (errors.Count > 0) throw new ValidationException("The fan-out request is not valid: " + String.Join(" ", errors.Values) + " No member was started.", errors, codes);
            return policy;
        }

        private static string? JoinReason(FanOutGroup group, int total, int finished, int succeeded)
        {
            switch (group.JoinPolicy)
            {
                case FanOutJoinPolicyEnum.Any:
                    if (succeeded >= 1) return "A member succeeded.";
                    if (finished == total) return "Every member finished and none succeeded.";
                    return null;
                case FanOutJoinPolicyEnum.Quorum:
                    if (succeeded >= group.Quorum) return succeeded + " members succeeded, meeting the quorum of " + group.Quorum + ".";
                    if (total - (finished - succeeded) < group.Quorum) return "Too many members failed for the quorum of " + group.Quorum + " to be met.";
                    return null;
                default:
                    return finished == total ? "Every member finished." : null;
            }
        }

        private async Task<List<Run?>> MemberRunsAsync(FanOutGroup group, CancellationToken token)
        {
            List<Run?> runs = new List<Run?>();
            foreach (FanOutGroupMember member in group.Members) runs.Add(await _Database.Runs.ReadAsync(group.TenantId, member.ChildRunId, token).ConfigureAwait(false));
            return runs;
        }

        private async Task<string> RenderSummaryAsync(string tenantId, FanOutGroupView view, CancellationToken token)
        {
            PromptTemplate? template = await _Database.PromptTemplates.ReadByNameAsync(tenantId, "fan-out-gather-result", token).ConfigureAwait(false);
            if (template == null || template.TenantId != tenantId || !template.Active || template.Kind != PromptTemplateKindEnum.Task)
            {
                template = await _Database.PromptTemplates.ReadByNameAsync(null, "builtin/fan-out-gather-result", token).ConfigureAwait(false)
                    ?? throw new NotFoundException("The builtin/fan-out-gather-result template was not found.");
            }
            TemplateContext context = new TemplateContext();
            context.Set("fanout.groupId", view.FanOutGroupId);
            context.Set("fanout.status", view.Status.ToString());
            context.Set("fanout.joinPolicy", view.JoinPolicy == FanOutJoinPolicyEnum.Quorum ? "Quorum " + view.Quorum : view.JoinPolicy.ToString());
            context.Set("fanout.reason", view.StatusReason ?? String.Empty);
            context.Set("fanout.total", view.Total);
            context.Set("fanout.finished", view.Finished);
            context.Set("fanout.succeeded", view.Succeeded);
            context.Set("fanout.pending", view.Pending.Count);
            List<object?> members = new List<object?>();
            foreach (FanOutMemberView member in view.Members)
            {
                members.Add(new Dictionary<string, object?>
                {
                    ["label"] = member.Label, ["agent"] = member.Agent, ["runId"] = member.RunId, ["status"] = member.Status.ToString(),
                    ["result"] = member.ResultText ?? member.StructuredOutputJson ?? String.Empty, ["error"] = member.ErrorMessage ?? String.Empty,
                    ["files"] = String.Join(", ", member.FilesWritten)
                });
            }
            context.Set("fanout.members", members);
            return TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false });
        }

        #endregion
    }
}
