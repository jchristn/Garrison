namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Diagnostics.Metrics;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Approvals;
    using Garrison.Core.Codex;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using SyslogLogging;

    /// <summary>
    /// Permission approvals (P12.3). A harness asks through garrison_permission_prompt (Claude Code directly, Codex
    /// app-server through the worker); the run's deployment rules allow or deny at once, or a pending approval is created
    /// and the call blocks until a person decides on any replica, the approval expires, or the run stops. Decisions are
    /// compare-and-set updates in the database, and waiters wake through <see cref="RunSignals.NotifyApproval"/> (the
    /// backplane carries it to every replica) with a database recheck as the fallback. Thread-safe.
    /// </summary>
    public class ApprovalService : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Maximum characters of the redacted input preview stored on an approval. Minimum 256, maximum 65536, default 4000.
        /// </summary>
        public int PreviewLength
        {
            get
            {
                return _PreviewLength;
            }
            set
            {
                _PreviewLength = Math.Clamp(value, 256, 65536);
            }
        }

        /// <summary>
        /// Maximum characters of an approval summary. Minimum 64, maximum 4000, default 500.
        /// </summary>
        public int SummaryLength
        {
            get
            {
                return _SummaryLength;
            }
            set
            {
                _SummaryLength = Math.Clamp(value, 64, 4000);
            }
        }

        /// <summary>
        /// How often a waiting call re-reads the database in case a wake-up was lost, in milliseconds. Minimum 100,
        /// maximum 30000, default 2000.
        /// </summary>
        public int RecheckMs
        {
            get
            {
                return _RecheckMs;
            }
            set
            {
                _RecheckMs = Math.Clamp(value, 100, 30000);
            }
        }

        /// <summary>
        /// Seconds past its expiry before the leader's sweep applies the timeout decision to a pending approval nobody is
        /// waiting on (for example after the waiting replica stopped). Minimum 0, maximum 3600, default 30.
        /// </summary>
        public int SweepGraceSeconds
        {
            get
            {
                return _SweepGraceSeconds;
            }
            set
            {
                _SweepGraceSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Seconds kept between a pending approval's expiry and the run's deadline, so the timeout decision reaches the
        /// harness before the run times out. Minimum 0, maximum 600, default 15.
        /// </summary>
        public int DeadlineMarginSeconds
        {
            get
            {
                return _DeadlineMarginSeconds;
            }
            set
            {
                _DeadlineMarginSeconds = Math.Clamp(value, 0, 600);
            }
        }

        /// <summary>
        /// Whether this replica leads the cluster; only the leader reports the pending gauge. Null reports always.
        /// </summary>
        public Func<bool>? IsLeader { get; set; } = null;

        /// <summary>
        /// Name of the tenant prompt template that replaces the built-in denial message: approval-denied.
        /// </summary>
        public static string DeniedTemplateName
        {
            get
            {
                return "approval-denied";
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunSignals _Signals;
        private readonly SecretCipher _Cipher;
        private readonly AuditService _Audit;
        private readonly LoggingModule _Logging;
        private readonly GaugeRegistration _PendingGauge;
        private readonly string _Header = "[Approvals] ";
        private int _PreviewLength = 4000;
        private int _SummaryLength = 500;
        private int _RecheckMs = 2000;
        private int _SweepGraceSeconds = 30;
        private int _DeadlineMarginSeconds = 15;
        private long _PendingCount = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="signals">Run signals (approval and node wake-ups).</param>
        /// <param name="cipher">Secret cipher, used to redact the deployment's secret values from previews.</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ApprovalService(DatabaseDriverBase database, RunSignals signals, SecretCipher cipher, AuditService audit, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _PendingGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.ApprovalsPending, ObservePending);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Decide a permission request from a run: evaluate the deployment's rules, record the approval, and for Ask wait
        /// until a person decides, the approval expires, the run stops, or the caller gives up.
        /// </summary>
        /// <param name="run">The asking run (from the run token).</param>
        /// <param name="input">Request.</param>
        /// <param name="token">Cancelled when the harness stops waiting (MCP cancellation, closed session).</param>
        /// <returns>The outcome; never null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or input is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the tool name is missing or too long.</exception>
        public async Task<ApprovalOutcome> RequestAsync(Run run, ApprovalRequestInput input, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (input == null) throw new ArgumentNullException(nameof(input));
            string toolName = (input.ToolName ?? String.Empty).Trim();
            if (toolName.Length == 0) throw new ArgumentException("tool_name is required.", nameof(input));
            if (toolName.Length > 256) throw new ArgumentException("tool_name is longer than 256 characters.", nameof(input));

            Deployment? deployment = await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            ApprovalToolInput typed = ParseInput(input.InputJson);
            string inputJson = String.IsNullOrWhiteSpace(input.InputJson) ? "{}" : input.InputJson!.Trim();
            string? cwd = WorkingDirectory(run.Id, typed);
            ApprovalRuleMatch match = ApprovalRuleMatcher.Evaluate(deployment?.ApprovalRules, toolName, typed, inputJson, cwd);
            ApprovalRuleActionEnum action = match.Action ?? deployment?.ApprovalDefaultAction ?? ApprovalRuleActionEnum.Ask;
            ApprovalRedactor redactor = await RedactorAsync(run, deployment, token).ConfigureAwait(false);

            Approval approval = new Approval();
            approval.TenantId = run.TenantId;
            approval.RunId = run.Id;
            approval.RootRunId = String.IsNullOrEmpty(run.RootRunId) || run.RootRunId == run.Id ? null : run.RootRunId;
            approval.AgentId = run.AgentId;
            approval.AgentName = run.AgentName;
            approval.DeploymentId = run.DeploymentId;
            approval.LeaseEpoch = run.LeaseEpoch;
            approval.HarnessType = run.HarnessType;
            approval.Kind = input.Kind;
            approval.ToolName = toolName;
            approval.ToolCallId = String.IsNullOrWhiteSpace(input.ToolCallId) ? null : input.ToolCallId!.Trim();
            approval.InputPreview = redactor.RedactAndClip(inputJson, _PreviewLength);
            approval.Summary = redactor.RedactAndClip(Summarize(typed, inputJson), _SummaryLength);
            approval.SuggestedRule = redactor.Redact(ApprovalRuleMatcher.SuggestRule(toolName, typed, cwd));
            approval.TimeoutDecision = deployment?.ApprovalTimeoutDecision ?? ApprovalDecisionEnum.Deny;
            approval.RequestedUtc = DateTime.UtcNow;
            approval.RuleId = match.Rule?.Id;
            approval.RulePattern = match.Rule?.Pattern;
            GarrisonMetrics.Count(GarrisonMetricCatalog.ApprovalsRequested, 1, Tags4("tenant", run.TenantId, "agent", run.AgentName, "kind", input.Kind.ToString(), "action", action.ToString().ToLowerInvariant()));

            if (!IsActive(run, run.LeaseEpoch))
            {
                Decided(approval, ApprovalStatusEnum.Cancelled, ApprovalDecisionEnum.Deny, ApprovalSourceEnum.Cancelled, "garrison", "The run is not running.");
                await _Database.Approvals.CreateAsync(approval, token).ConfigureAwait(false);
                return await OutcomeAsync(approval, deployment, token).ConfigureAwait(false);
            }

            if (action != ApprovalRuleActionEnum.Ask)
            {
                bool allow = action == ApprovalRuleActionEnum.Allow;
                ApprovalSourceEnum source = match.Rule != null ? ApprovalSourceEnum.Rule : ApprovalSourceEnum.Default;
                string by = match.Rule != null ? "rule " + match.Rule.Pattern : "deployment default";
                Decided(approval, allow ? ApprovalStatusEnum.Approved : ApprovalStatusEnum.Denied, allow ? ApprovalDecisionEnum.Allow : ApprovalDecisionEnum.Deny, source, by, null);
                await _Database.Approvals.CreateAsync(approval, token).ConfigureAwait(false);
                Changed(approval, run.LeaseNodeId);
                GarrisonMetrics.Count(GarrisonMetricCatalog.ApprovalsDecided, 1, Tags4("tenant", run.TenantId, "agent", run.AgentName, "source", source.ToString().ToLowerInvariant(), "decision", approval.Decision!.Value.ToString().ToLowerInvariant()));
                _Logging.Debug(_Header + approval.Id + " " + toolName + " " + (allow ? "allowed" : "denied") + " by " + by + " " + RunTracing.LogFields(run.Id, run.TraceId));
                return await OutcomeAsync(approval, deployment, token).ConfigureAwait(false);
            }

            int timeoutSeconds = deployment?.ApprovalTimeoutSeconds ?? 300;
            DateTime expires = approval.RequestedUtc.AddSeconds(timeoutSeconds);
            if (run.DeadlineUtc.HasValue)
            {
                DateTime latest = run.DeadlineUtc.Value.AddSeconds(-_DeadlineMarginSeconds);
                if (latest < expires) expires = latest > approval.RequestedUtc.AddSeconds(5) ? latest : approval.RequestedUtc.AddSeconds(5);
            }
            approval.ExpiresUtc = expires;
            approval.Status = ApprovalStatusEnum.Pending;
            await _Database.Approvals.CreateAsync(approval, token).ConfigureAwait(false);
            await _Database.Runs.AdjustPendingApprovalsAsync(run.Id, 1, 0, token).ConfigureAwait(false);
            Interlocked.Increment(ref _PendingCount);
            Changed(approval, run.LeaseNodeId);
            _Logging.Info(_Header + approval.Id + " waiting for a person to decide " + toolName + (String.IsNullOrEmpty(approval.Summary) ? String.Empty : " (" + approval.Summary + ")") + " until " + expires.ToString("o") + " " + RunTracing.LogFields(run.Id, run.TraceId) + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "agent", run.AgentName));

            Approval final = await WaitAsync(approval, token).ConfigureAwait(false);
            return await OutcomeAsync(final, deployment, CancellationToken.None).ConfigureAwait(false);
        }

        /// <summary>
        /// A person's decision on a pending approval. Optionally adds a rule to the deployment (remember); the caller checks
        /// that the principal may update the deployment before passing remember.
        /// </summary>
        /// <param name="ctx">Deciding principal.</param>
        /// <param name="approval">Approval (read in the caller's tenant).</param>
        /// <param name="request">Decision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The decided approval.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the decision is missing or the remembered rule is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with ApprovalNotPending when the approval was already decided.</exception>
        public async Task<Approval> DecideAsync(RequestContext ctx, Approval approval, ApprovalDecideRequest request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (approval == null) throw new ArgumentNullException(nameof(approval));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (!request.Decision.HasValue) throw new ValidationException("decision is required (Allow or Deny).", new Dictionary<string, string> { { "decision", "Allow or Deny." } });
            string? reason = String.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason!.Trim();
            if (reason != null && reason.Length > 4000) throw new ValidationException("The reason is longer than 4000 characters.", new Dictionary<string, string> { { "reason", "At most 4000 characters." } });
            if (approval.Status != ApprovalStatusEnum.Pending) throw new ConflictException("ApprovalNotPending", "Approval " + approval.Id + " is no longer pending; it is " + approval.Status + ".");

            string? pattern = null;
            if (request.Remember)
            {
                pattern = String.IsNullOrWhiteSpace(request.RulePattern) ? (approval.SuggestedRule ?? approval.ToolName) : request.RulePattern!.Trim();
                if (!ApprovalRuleParser.TryParse(pattern, out ParsedApprovalRule? parsed, out string? error) || parsed == null)
                {
                    throw new ValidationException("The rule pattern is invalid: " + error, new Dictionary<string, string> { { "rulePattern", error ?? "Invalid pattern." } });
                }
                pattern = parsed.Raw;
            }

            bool allow = request.Decision.Value == ApprovalDecisionEnum.Allow;
            ApprovalResolution resolution = new ApprovalResolution();
            resolution.ApprovalId = approval.Id;
            resolution.Status = allow ? ApprovalStatusEnum.Approved : ApprovalStatusEnum.Denied;
            resolution.Decision = request.Decision.Value;
            resolution.Source = ApprovalSourceEnum.User;
            resolution.DecidedBy = ctx.PrincipalName ?? ctx.UserId ?? ctx.CredentialId ?? "unknown";
            resolution.DecidedById = ctx.CredentialId ?? ctx.UserId;
            resolution.Reason = reason;
            if (!await ResolveAsync(approval, resolution, token).ConfigureAwait(false))
            {
                Approval? current = await _Database.Approvals.ReadAsync(approval.TenantId, approval.Id, token).ConfigureAwait(false);
                throw new ConflictException("ApprovalNotPending", "Approval " + approval.Id + " is no longer pending; it is " + (current?.Status.ToString() ?? "gone") + ".");
            }

            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ApprovalDecided, "Approval", approval.Id, (allow ? "Allowed " : "Denied ") + approval.ToolName + " for run " + approval.RunId + (reason == null ? "." : ": " + reason), approval.TenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + approval.Id + " " + approval.ToolName + " " + (allow ? "allowed" : "denied") + " by " + resolution.DecidedBy + " " + RunTracing.LogFields(approval.RunId, null));

            if (request.Remember && pattern != null)
            {
                Deployment? deployment = await _Database.Deployments.ReadAsync(approval.TenantId, approval.DeploymentId, token).ConfigureAwait(false);
                if (deployment != null)
                {
                    DeploymentApprovalRule rule = new DeploymentApprovalRule();
                    rule.Action = allow ? ApprovalRuleActionEnum.Allow : ApprovalRuleActionEnum.Deny;
                    rule.Pattern = pattern;
                    rule.Description = "Remembered from approval " + approval.Id + " by " + resolution.DecidedBy + " on " + DateTime.UtcNow.ToString("yyyy-MM-dd") + ".";
                    deployment.ApprovalRules.Add(rule);
                    deployment.ConfigVersion = deployment.ConfigVersion + 1;
                    deployment.LastUpdateUtc = DateTime.UtcNow;
                    await _Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                    await _Database.Approvals.SetRememberedRuleAsync(approval.Id, rule.Id, token).ConfigureAwait(false);
                    await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Deployment", deployment.Id, "Added approval rule " + rule.Action + " " + rule.Pattern + " to deployment " + deployment.Name + " (configuration version " + deployment.ConfigVersion + ") from approval " + approval.Id + ".", approval.TenantId, token).ConfigureAwait(false);
                }
            }

            return await _Database.Approvals.ReadAsync(approval.TenantId, approval.Id, token).ConfigureAwait(false) ?? approval;
        }

        /// <summary>
        /// Cancel every pending approval of a run (the run was cancelled or stopped); waiting harness calls are answered
        /// with a denial.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="reason">Why, recorded on the approvals.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Approvals cancelled.</returns>
        public async Task<int> CancelPendingAsync(string runId, string reason, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) return 0;
            int cancelled = 0;
            foreach (Approval approval in await _Database.Approvals.ListByRunAsync(runId, 1000, token).ConfigureAwait(false))
            {
                if (approval.Status != ApprovalStatusEnum.Pending) continue;
                if (await ResolveAsync(approval, Resolution(approval, ApprovalStatusEnum.Cancelled, ApprovalDecisionEnum.Deny, ApprovalSourceEnum.Cancelled, reason), token).ConfigureAwait(false)) cancelled++;
            }
            return cancelled;
        }

        /// <summary>
        /// Leader sweep: cancel pending approvals whose run stopped or moved to another lease epoch, and apply the timeout
        /// decision to pending approvals past their expiry plus <see cref="SweepGraceSeconds"/> that no waiter resolved.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when any approval was resolved.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            DateTime now = DateTime.UtcNow;
            bool any = false;
            List<Approval> pending = await _Database.Approvals.ListPendingAsync(1000, token).ConfigureAwait(false);
            foreach (Approval approval in pending)
            {
                token.ThrowIfCancellationRequested();
                Run? run = await _Database.Runs.ReadAsync(approval.TenantId, approval.RunId, token).ConfigureAwait(false);
                if (run == null || !IsActive(run, approval.LeaseEpoch))
                {
                    any |= await ResolveAsync(approval, Resolution(approval, ApprovalStatusEnum.Cancelled, ApprovalDecisionEnum.Deny, ApprovalSourceEnum.Cancelled, StopReason(run)), token).ConfigureAwait(false);
                    continue;
                }
                if (approval.ExpiresUtc.HasValue && approval.ExpiresUtc.Value.AddSeconds(_SweepGraceSeconds) <= now)
                {
                    any |= await ResolveAsync(approval, Expiry(approval), token).ConfigureAwait(false);
                }
            }
            Interlocked.Exchange(ref _PendingCount, await _Database.Approvals.CountPendingAsync(null, token).ConfigureAwait(false));
            return any;
        }

        /// <summary>
        /// Evaluate a hypothetical request against a deployment's rules without recording anything.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <param name="request">Request.</param>
        /// <returns>What the rules would do.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the tool name is missing.</exception>
        public ApprovalCheckResponse Check(Deployment deployment, ApprovalCheckRequest request)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (String.IsNullOrWhiteSpace(request.ToolName)) throw new ValidationException("toolName is required.", new Dictionary<string, string> { { "toolName", "Required." } });
            ApprovalToolInput input = request.Input ?? new ApprovalToolInput();
            string json = Serializer.Serialize(input);
            ApprovalRuleMatch match = ApprovalRuleMatcher.Evaluate(deployment.ApprovalRules, request.ToolName.Trim(), input, json, input.Cwd);
            ApprovalCheckResponse response = new ApprovalCheckResponse();
            response.Action = match.Action ?? deployment.ApprovalDefaultAction;
            response.Source = match.Rule != null ? ApprovalSourceEnum.Rule : ApprovalSourceEnum.Default;
            response.RuleId = match.Rule?.Id;
            response.RulePattern = match.Rule?.Pattern;
            response.SuggestedRule = ApprovalRuleMatcher.SuggestRule(request.ToolName.Trim(), input, input.Cwd);
            response.ApprovalsEnabled = deployment.ApprovalsEnabled;
            return response;
        }

        /// <summary>
        /// Render the message a harness receives for a denied approval from the approval-denied prompt template (a tenant
        /// template of kind Other with that name, else the built-in).
        /// </summary>
        /// <param name="approval">Denied approval.</param>
        /// <param name="timeoutSeconds">The deployment's approval timeout, for the timeout wording.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when approval is null.</exception>
        public async Task<string> DenialMessageAsync(Approval approval, int timeoutSeconds, CancellationToken token = default)
        {
            if (approval == null) throw new ArgumentNullException(nameof(approval));
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["id"] = approval.Id;
            map["toolName"] = approval.ToolName;
            map["summary"] = approval.Summary;
            map["reason"] = approval.Reason;
            map["rulePattern"] = approval.RulePattern;
            map["decidedBy"] = approval.DecidedBy;
            map["source"] = approval.DecisionSource?.ToString();
            map["timeoutSeconds"] = timeoutSeconds;
            map["byUser"] = approval.DecisionSource == ApprovalSourceEnum.User;
            map["byRule"] = approval.DecisionSource == ApprovalSourceEnum.Rule;
            map["byDefault"] = approval.DecisionSource == ApprovalSourceEnum.Default;
            map["byTimeout"] = approval.DecisionSource == ApprovalSourceEnum.Timeout;
            map["byCancel"] = approval.DecisionSource == ApprovalSourceEnum.Cancelled || approval.DecisionSource == null;
            context.Set("approval", map);
            context.Set("tenant.id", approval.TenantId);

            string builtIn = BuiltInSeeder.PromptDefault(DeniedTemplateName) ?? String.Empty;
            string content = builtIn;
            string name = "builtin/" + DeniedTemplateName;
            PromptTemplate? custom = await _Database.PromptTemplates.ReadByNameAsync(approval.TenantId, DeniedTemplateName, token).ConfigureAwait(false);
            if (custom != null && custom.TenantId == approval.TenantId && custom.Active && custom.Kind == PromptTemplateKindEnum.Other)
            {
                content = custom.Content;
                name = custom.Name;
            }
            else
            {
                PromptTemplate? stored = await _Database.PromptTemplates.ReadByNameAsync(null, "builtin/" + DeniedTemplateName, token).ConfigureAwait(false);
                if (stored != null && !String.IsNullOrWhiteSpace(stored.Content)) content = stored.Content;
            }

            try
            {
                string rendered = TemplateRenderer.Render(content, context, new TemplateRenderOptions { TemplateName = name }).Trim();
                if (rendered.Length > 0) return rendered;
            }
            catch (TemplateException e)
            {
                _Logging.Warn(_Header + "denial template " + name + " failed to render, using the built-in: " + e.Message);
            }
            return TemplateRenderer.Render(builtIn, context, new TemplateRenderOptions { TemplateName = "builtin/" + DeniedTemplateName }).Trim();
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _PendingGauge.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private IEnumerable<Measurement<double>> ObservePending()
        {
            if (IsLeader != null && !IsLeader()) return Array.Empty<Measurement<double>>();
            return new Measurement<double>[] { new Measurement<double>(Interlocked.Read(ref _PendingCount)) };
        }

        private async Task<Approval> WaitAsync(Approval approval, CancellationToken token)
        {
            using (RunSignalSubscription subscription = _Signals.SubscribeApproval(approval.Id))
            {
                while (true)
                {
                    Approval? current = await _Database.Approvals.ReadAsync(approval.TenantId, approval.Id, CancellationToken.None).ConfigureAwait(false);
                    if (current == null) return approval;
                    if (current.Status != ApprovalStatusEnum.Pending) return current;

                    Run? run = await _Database.Runs.ReadAsync(current.TenantId, current.RunId, CancellationToken.None).ConfigureAwait(false);
                    if (run == null || !IsActive(run, current.LeaseEpoch))
                    {
                        await ResolveAsync(current, Resolution(current, ApprovalStatusEnum.Cancelled, ApprovalDecisionEnum.Deny, ApprovalSourceEnum.Cancelled, StopReason(run)), CancellationToken.None).ConfigureAwait(false);
                        continue;
                    }
                    DateTime now = DateTime.UtcNow;
                    if (current.ExpiresUtc.HasValue && now >= current.ExpiresUtc.Value)
                    {
                        await ResolveAsync(current, Expiry(current), CancellationToken.None).ConfigureAwait(false);
                        continue;
                    }
                    if (token.IsCancellationRequested)
                    {
                        await ResolveAsync(current, Resolution(current, ApprovalStatusEnum.Cancelled, ApprovalDecisionEnum.Deny, ApprovalSourceEnum.Cancelled, "The harness stopped waiting for the decision."), CancellationToken.None).ConfigureAwait(false);
                        continue;
                    }

                    int remaining = current.ExpiresUtc.HasValue ? (int)Math.Ceiling((current.ExpiresUtc.Value - now).TotalMilliseconds) : _RecheckMs;
                    try
                    {
                        await subscription.WaitAsync(Math.Max(1, Math.Min(remaining, _RecheckMs)), token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException) when (token.IsCancellationRequested)
                    {
                        // Handled at the top of the loop: the approval is cancelled unless someone decided meanwhile.
                    }
                }
            }
        }

        private async Task<bool> ResolveAsync(Approval approval, ApprovalResolution resolution, CancellationToken token)
        {
            if (!await _Database.Approvals.ResolveAsync(resolution, token).ConfigureAwait(false)) return false;

            long waitMs = Math.Max(0, (long)(resolution.DecidedUtc - approval.RequestedUtc).TotalMilliseconds);
            await _Database.Runs.AdjustPendingApprovalsAsync(approval.RunId, -1, resolution.Source == ApprovalSourceEnum.Cancelled ? 0 : waitMs, token).ConfigureAwait(false);
            if (Interlocked.Decrement(ref _PendingCount) < 0) Interlocked.Exchange(ref _PendingCount, 0);

            string source = resolution.Source.ToString().ToLowerInvariant();
            string decision = resolution.Decision.ToString().ToLowerInvariant();
            GarrisonMetrics.Count(GarrisonMetricCatalog.ApprovalsDecided, 1, Tags4("tenant", approval.TenantId, "agent", approval.AgentName, "source", source, "decision", decision));
            GarrisonMetrics.Observe(GarrisonMetricCatalog.ApprovalWait, waitMs / 1000.0, GarrisonMetrics.Tags("source", source, "decision", decision));

            approval.Status = resolution.Status;
            approval.Decision = resolution.Decision;
            approval.DecisionSource = resolution.Source;
            approval.DecidedBy = resolution.DecidedBy;
            approval.Reason = resolution.Reason;
            approval.DecidedUtc = resolution.DecidedUtc;
            Run? run = await _Database.Runs.ReadAsync(approval.TenantId, approval.RunId, token).ConfigureAwait(false);
            Changed(approval, run?.LeaseNodeId);
            if (resolution.Source != ApprovalSourceEnum.User)
            {
                _Logging.Info(_Header + approval.Id + " " + approval.ToolName + " " + resolution.Status.ToString().ToLowerInvariant() + " (" + source + "): " + (resolution.Reason ?? String.Empty) + " " + RunTracing.LogFields(approval.RunId, run?.TraceId));
            }
            return true;
        }

        private void Changed(Approval approval, string? leaseNodeId)
        {
            _Signals.NotifyApproval(approval.Id);
            _Signals.Notify(approval.RunId);
            _Signals.NotifyNode(leaseNodeId);
        }

        private async Task<ApprovalOutcome> OutcomeAsync(Approval approval, Deployment? deployment, CancellationToken token)
        {
            ApprovalOutcome outcome = new ApprovalOutcome();
            outcome.Approval = approval;
            outcome.Decision = approval.Decision ?? ApprovalDecisionEnum.Deny;
            if (outcome.Decision == ApprovalDecisionEnum.Deny) outcome.Message = await DenialMessageAsync(approval, deployment?.ApprovalTimeoutSeconds ?? 300, token).ConfigureAwait(false);
            return outcome;
        }

        private static void Decided(Approval approval, ApprovalStatusEnum status, ApprovalDecisionEnum decision, ApprovalSourceEnum source, string by, string? reason)
        {
            approval.Status = status;
            approval.Decision = decision;
            approval.DecisionSource = source;
            approval.DecidedBy = by;
            approval.Reason = reason;
            approval.DecidedUtc = approval.RequestedUtc;
        }

        private static ApprovalResolution Resolution(Approval approval, ApprovalStatusEnum status, ApprovalDecisionEnum decision, ApprovalSourceEnum source, string reason)
        {
            ApprovalResolution resolution = new ApprovalResolution();
            resolution.ApprovalId = approval.Id;
            resolution.Status = status;
            resolution.Decision = decision;
            resolution.Source = source;
            resolution.DecidedBy = "garrison";
            resolution.Reason = reason;
            return resolution;
        }

        private static ApprovalResolution Expiry(Approval approval)
        {
            return Resolution(approval, ApprovalStatusEnum.Expired, approval.TimeoutDecision, ApprovalSourceEnum.Timeout,
                "Nobody decided before the approval expired; the timeout decision " + approval.TimeoutDecision + " applied.");
        }

        private static bool IsActive(Run run, long epoch)
        {
            if (run.CancelRequested || run.Status == RunStatusEnum.Cancelling || RunService.IsTerminal(run.Status)) return false;
            if (run.Status != RunStatusEnum.Running && run.Status != RunStatusEnum.Leased) return false;
            return run.LeaseEpoch == epoch;
        }

        private static string StopReason(Run? run)
        {
            if (run == null) return "The run no longer exists.";
            if (run.CancelRequested || run.Status == RunStatusEnum.Cancelling || run.Status == RunStatusEnum.Cancelled) return "The run was cancelled.";
            if (RunService.IsTerminal(run.Status)) return "The run finished (" + run.Status + ").";
            return "The run attempt that asked lost its lease; a newer attempt is running.";
        }

        private static TagList Tags4(string k1, string? v1, string k2, string? v2, string k3, string? v3, string k4, string? v4)
        {
            return GarrisonMetrics.Tags(k1, v1, k2, v2, k3, v3, k4, v4);
        }

        private static ApprovalToolInput ParseInput(string? json)
        {
            if (String.IsNullOrWhiteSpace(json)) return new ApprovalToolInput();
            try
            {
                return Serializer.Deserialize<ApprovalToolInput>(json) ?? new ApprovalToolInput();
            }
            catch (Exception e) when (e is JsonException || e is NotSupportedException || e is ArgumentException)
            {
                return new ApprovalToolInput();
            }
        }

        private static string? WorkingDirectory(string runId, ApprovalToolInput input)
        {
            if (!String.IsNullOrWhiteSpace(input.Cwd)) return input.Cwd!.Trim();
            // Run directories are <workRoot>/<runId>/work, so a path inside the workspace reveals it.
            string marker = "/" + runId + "/work";
            foreach (string path in ApprovalRuleMatcher.Paths(input))
            {
                string normalized = path.Replace('\\', '/');
                int at = normalized.IndexOf(marker, StringComparison.Ordinal);
                if (at < 0) continue;
                int end = at + marker.Length;
                if (end == normalized.Length || normalized[end] == '/') return normalized.Substring(0, end);
            }
            return null;
        }

        private static string Summarize(ApprovalToolInput input, string inputJson)
        {
            if (!String.IsNullOrWhiteSpace(input.Command)) return input.Command!.Trim();
            if (!String.IsNullOrWhiteSpace(input.Url)) return input.Url!.Trim();
            List<string> paths = ApprovalRuleMatcher.Paths(input);
            if (paths.Count > 0) return String.Join(", ", paths);
            if (!String.IsNullOrWhiteSpace(input.Query)) return input.Query!.Trim();
            if (!String.IsNullOrWhiteSpace(input.Pattern)) return input.Pattern!.Trim();
            return inputJson;
        }

        private async Task<ApprovalRedactor> RedactorAsync(Run run, Deployment? deployment, CancellationToken token)
        {
            return await new RunRedactorFactory(_Database, _Cipher).ForDeploymentAsync(run.TenantId, deployment, token).ConfigureAwait(false);
        }

        #endregion
    }
}
