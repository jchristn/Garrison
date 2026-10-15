namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using Garrison.Server.Services;
    using SyslogLogging;

    /// <summary>
    /// Fires triggers (P12.5). The control-plane leader calls <see cref="SweepAsync(CancellationToken)"/> from its
    /// maintenance pass to fire due cron schedules; each occurrence is claimed with a compare-and-set on the trigger's
    /// nextfireutc and a unique fire key, so several replicas (or a leader change in the middle of a pass) fire it once.
    /// Missed occurrences collapse into one fire for the latest one (Triggers.CronMaxLatenessSeconds bounds how old it may
    /// be). Webhook and manual fires go through <see cref="FireAsync"/>. Every fire checks that the trigger's run-as
    /// principal may still run the target, renders the input from the trigger's PromptTemplate, and creates the run or
    /// pipeline run through the normal invocation path. Cron fires are at most once per occurrence: a replica that dies
    /// between claiming an occurrence and creating its run loses that occurrence. Thread-safe.
    /// </summary>
    public class TriggerService
    {
        #region Public-Members

        /// <summary>
        /// Name of the built-in input template: builtin/trigger-input. A tenant Task template with the name trigger-input
        /// replaces it for that tenant when a trigger sets no inputTemplateId.
        /// </summary>
        public static readonly string DefaultTemplateName = "trigger-input";

        /// <summary>
        /// Options, refreshed from the Triggers.* cluster settings.
        /// </summary>
        public TriggerOptions Options
        {
            get
            {
                return _Options;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunService _Runs;
        private readonly PipelineService _Pipelines;
        private readonly AuthorizationService _Authorization;
        private readonly TriggerOptions _Options;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Triggers] ";
        private DateTime _LastPruneUtc = DateTime.MinValue;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="pipelines">Pipeline service.</param>
        /// <param name="authorization">Authorization service (run-as checks).</param>
        /// <param name="options">Options.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public TriggerService(DatabaseDriverBase database, RunService runs, PipelineService pipelines, AuthorizationService authorization, TriggerOptions options, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Pipelines = pipelines ?? throw new ArgumentNullException(nameof(pipelines));
            _Authorization = authorization ?? throw new ArgumentNullException(nameof(authorization));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Fire every due cron trigger now (the leader's maintenance step), and prune old fire history once an hour.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when at least one trigger fired or was skipped.</returns>
        public Task<bool> SweepAsync(CancellationToken token)
        {
            return SweepAsync(DateTime.UtcNow, token);
        }

        /// <summary>
        /// Fire every cron trigger due at a given time. Used by the leader with the current time and by tests with a
        /// chosen one.
        /// </summary>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when at least one trigger fired or was skipped.</returns>
        public async Task<bool> SweepAsync(DateTime nowUtc, CancellationToken token)
        {
            bool changed = false;
            List<Trigger> due = await _Database.Triggers.ListDueAsync(nowUtc, _Options.SweepBatchSize, token).ConfigureAwait(false);
            foreach (Trigger trigger in due)
            {
                token.ThrowIfCancellationRequested();
                if (await FireDueAsync(trigger, nowUtc, token).ConfigureAwait(false)) changed = true;
            }

            if ((nowUtc - _LastPruneUtc).TotalHours >= 1)
            {
                _LastPruneUtc = nowUtc;
                int pruned = await _Database.TriggerFires.PruneAsync(nowUtc.AddDays(-_Options.FireRetentionDays), token).ConfigureAwait(false);
                if (pruned > 0)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RetentionDeleted, pruned, GarrisonMetrics.Tags("kind", "trigger_fires"));
                    changed = true;
                }
            }
            return changed;
        }

        /// <summary>
        /// Fire a trigger: record the fire (or return the earlier fire for a repeated webhook delivery identifier), check
        /// the run-as principal, render the input, and start the run or pipeline run. Failures are recorded on the fire,
        /// not thrown.
        /// </summary>
        /// <param name="trigger">Trigger.</param>
        /// <param name="source">Why it fired.</param>
        /// <param name="scheduledUtc">Cron occurrence, or the arrival time for webhook and manual fires (UTC).</param>
        /// <param name="deliveryId">Webhook delivery identifier, or null.</param>
        /// <param name="body">Webhook or manual payload bytes, or null.</param>
        /// <param name="contentType">Payload media type, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The fire, with Duplicate set when it repeats an earlier delivery.</returns>
        /// <exception cref="ArgumentNullException">Thrown when trigger is null.</exception>
        public async Task<TriggerFire> FireAsync(Trigger trigger, TriggerFireSourceEnum source, DateTime scheduledUtc, string? deliveryId, byte[]? body, string? contentType, CancellationToken token = default)
        {
            if (trigger == null) throw new ArgumentNullException(nameof(trigger));
            TriggerFire fire = NewFire(trigger, source, scheduledUtc, deliveryId);
            if (!await _Database.TriggerFires.TryCreateAsync(fire, token).ConfigureAwait(false))
            {
                TriggerFire? earlier = await _Database.TriggerFires.ReadByKeyAsync(trigger.Id, fire.FireKey, token).ConfigureAwait(false);
                if (earlier != null)
                {
                    earlier.Duplicate = true;
                    return earlier;
                }
            }

            try
            {
                await StartTargetAsync(trigger, fire, body, contentType, token).ConfigureAwait(false);
            }
            catch (TriggerFireException e)
            {
                Fail(fire, e.Code, e.Message);
            }
            catch (ValidationException e)
            {
                Fail(fire, e.Codes.Values.FirstOrDefault() ?? e.Code, e.Message);
            }
            catch (ConflictException e)
            {
                Fail(fire, e.Code, e.Message);
            }
            catch (NotFoundException e)
            {
                Fail(fire, "NotFound", e.Message);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Logging.Warn(_Header + "trigger " + trigger.Id + " (" + trigger.Name + ") fire " + fire.Id + " failed: " + e);
                Fail(fire, "InternalError", "The run could not be started: " + e.Message);
            }

            fire.FiredUtc = DateTime.UtcNow;
            await _Database.TriggerFires.UpdateAsync(fire, CancellationToken.None).ConfigureAwait(false);
            await _Database.Triggers.RecordFireAsync(trigger.Id, fire.Outcome, source == TriggerFireSourceEnum.Cron ? null : fire.FiredUtc, CancellationToken.None).ConfigureAwait(false);
            Finished(trigger, fire);
            return fire;
        }

        /// <summary>
        /// Render the input a fire would send, without firing. Used by tests and previews.
        /// </summary>
        /// <param name="trigger">Trigger.</param>
        /// <param name="source">Source to render for.</param>
        /// <param name="body">Payload bytes, or null.</param>
        /// <param name="contentType">Payload media type, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rendered input.</returns>
        /// <exception cref="ArgumentNullException">Thrown when trigger is null.</exception>
        /// <exception cref="TriggerFireException">Thrown when the template is missing or fails to render.</exception>
        public async Task<string> RenderAsync(Trigger trigger, TriggerFireSourceEnum source, byte[]? body, string? contentType, CancellationToken token = default)
        {
            if (trigger == null) throw new ArgumentNullException(nameof(trigger));
            TriggerFire fire = NewFire(trigger, source, DateTime.UtcNow, null);
            return await RenderInputAsync(trigger, fire, body, contentType, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private static TriggerFire NewFire(Trigger trigger, TriggerFireSourceEnum source, DateTime scheduledUtc, string? deliveryId)
        {
            TriggerFire fire = new TriggerFire();
            fire.TenantId = trigger.TenantId;
            fire.TriggerId = trigger.Id;
            fire.TriggerName = trigger.Name;
            fire.Source = source;
            fire.DeliveryId = String.IsNullOrEmpty(deliveryId) ? null : deliveryId;
            fire.ScheduledUtc = scheduledUtc;
            fire.FiredUtc = DateTime.UtcNow;
            fire.Outcome = TriggerFireOutcomeEnum.Started;
            if (source == TriggerFireSourceEnum.Cron) fire.FireKey = "cron:" + scheduledUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture);
            else if (source == TriggerFireSourceEnum.Webhook && fire.DeliveryId != null) fire.FireKey = "webhook:" + fire.DeliveryId;
            else fire.FireKey = fire.Id;
            return fire;
        }

        private async Task<bool> FireDueAsync(Trigger trigger, DateTime nowUtc, CancellationToken token)
        {
            if (!trigger.NextFireUtc.HasValue || String.IsNullOrWhiteSpace(trigger.CronExpression)) return false;
            DateTime expected = trigger.NextFireUtc.Value;
            DateTime latest;
            DateTime? next;
            try
            {
                latest = CronSchedule.LatestDue(trigger.CronExpression, trigger.TimeZone, expected, nowUtc);
                next = CronSchedule.Next(trigger.CronExpression, trigger.TimeZone, nowUtc);
            }
            catch (ArgumentException e)
            {
                // A stored schedule that no longer parses (for example a time zone removed from the host) stops firing.
                _Logging.Warn(_Header + "trigger " + trigger.Id + " (" + trigger.Name + ") has an unusable schedule and will not fire: " + e.Message);
                await _Database.Triggers.TryAdvanceAsync(trigger.Id, expected, null, expected, token).ConfigureAwait(false);
                return false;
            }

            // Exactly one replica wins each occurrence; a loser leaves the fire to the winner.
            if (!await _Database.Triggers.TryAdvanceAsync(trigger.Id, expected, next, latest, token).ConfigureAwait(false)) return false;

            int lateness = (int)Math.Min(Int32.MaxValue, Math.Max(0, (nowUtc - latest).TotalSeconds));
            if (_Options.CronMaxLatenessSeconds > 0 && lateness > _Options.CronMaxLatenessSeconds)
            {
                TriggerFire skipped = NewFire(trigger, TriggerFireSourceEnum.Cron, latest, null);
                skipped.Outcome = TriggerFireOutcomeEnum.Skipped;
                skipped.ErrorCode = "MissedSchedule";
                skipped.ErrorMessage = "The occurrence at " + latest.ToString("o", System.Globalization.CultureInfo.InvariantCulture) + " was missed by " + lateness + " seconds, more than Triggers.CronMaxLatenessSeconds (" + _Options.CronMaxLatenessSeconds + "), so it was not fired.";
                if (await _Database.TriggerFires.TryCreateAsync(skipped, token).ConfigureAwait(false))
                {
                    await _Database.Triggers.RecordFireAsync(trigger.Id, TriggerFireOutcomeEnum.Skipped, null, token).ConfigureAwait(false);
                    Finished(trigger, skipped);
                }
                return true;
            }

            await FireAsync(trigger, TriggerFireSourceEnum.Cron, latest, null, null, null, token).ConfigureAwait(false);
            return true;
        }

        private async Task StartTargetAsync(Trigger trigger, TriggerFire fire, byte[]? body, string? contentType, CancellationToken token)
        {
            string? denied = await RunAsDeniedAsync(trigger, token).ConfigureAwait(false);
            if (denied != null) throw new TriggerFireException("RunAsNotAuthorized", denied);
            string input = await RenderInputAsync(trigger, fire, body, contentType, token).ConfigureAwait(false);
            InvocationInputRules.Require(input);
            string idempotencyKey = "trigger:" + trigger.Id + ":" + fire.Id;

            if (trigger.TargetType == TriggerTargetTypeEnum.Pipeline)
            {
                Pipeline pipeline = await _Database.Pipelines.ReadAsync(trigger.TenantId, trigger.PipelineId ?? String.Empty, token).ConfigureAwait(false)
                    ?? throw new TriggerFireException("PipelineNotFound", "Pipeline " + trigger.PipelineId + " of trigger " + trigger.Name + " no longer exists.");
                PipelineStartRequest request = new PipelineStartRequest();
                request.Input = input;
                request.InputContentType = "text/plain";
                request.Priority = trigger.Priority;
                PipelineRun started = await _Pipelines.StartAsync(RunAsContext(trigger), pipeline, request, idempotencyKey, trigger.Id, token).ConfigureAwait(false);
                fire.PipelineRunId = started.Id;
                return;
            }

            Agent agent = await _Database.Agents.ReadAsync(trigger.TenantId, trigger.AgentId ?? String.Empty, token).ConfigureAwait(false)
                ?? throw new TriggerFireException("AgentNotFound", "Agent " + trigger.AgentId + " of trigger " + trigger.Name + " no longer exists.");
            RunCreateContext create = new RunCreateContext();
            create.TenantId = trigger.TenantId;
            create.Agent = agent;
            create.DeploymentId = trigger.DeploymentId;
            create.Input = input;
            create.InputContentType = "text/plain";
            create.Priority = trigger.Priority;
            create.Kind = RunKindEnum.Trigger;
            create.CallerType = trigger.RunAsType;
            create.CallerId = trigger.RunAsId;
            create.CallerName = "trigger:" + trigger.Name;
            create.IdempotencyKey = idempotencyKey;
            create.Surface = "trigger";
            create.TriggerId = trigger.Id;
            Run run = await _Runs.CreateAsync(create, token).ConfigureAwait(false);
            fire.RunId = run.Id;
        }

        private RequestContext RunAsContext(Trigger trigger)
        {
            RequestContext ctx = new RequestContext();
            ctx.IsAuthenticated = true;
            ctx.TenantId = trigger.TenantId;
            ctx.PrincipalType = trigger.RunAsType;
            ctx.PrincipalName = "trigger:" + trigger.Name;
            ctx.IsAdmin = trigger.RunAsType == PrincipalTypeEnum.Administrator;
            if (trigger.RunAsType == PrincipalTypeEnum.Credential) ctx.CredentialId = trigger.RunAsId;
            else ctx.UserId = trigger.RunAsId;
            return ctx;
        }

        private async Task<string?> RunAsDeniedAsync(Trigger trigger, CancellationToken token)
        {
            if (trigger.RunAsType == PrincipalTypeEnum.Administrator) return null;
            if (String.IsNullOrEmpty(trigger.RunAsId)) return "Trigger " + trigger.Name + " has no run-as principal. Save it again to run as yourself.";

            RequestContext origin = new RequestContext();
            origin.IsAuthenticated = true;
            origin.TenantId = trigger.TenantId;
            if (trigger.RunAsType == PrincipalTypeEnum.Credential)
            {
                Credential? credential = await _Database.Credentials.ReadAsync(trigger.TenantId, trigger.RunAsId, token).ConfigureAwait(false);
                if (credential == null || !credential.Active) return "The credential trigger " + trigger.Name + " runs as is missing or inactive. Save the trigger again to run as yourself.";
                User? owner = await _Database.Users.ReadAsync(trigger.TenantId, credential.UserId, token).ConfigureAwait(false);
                origin.PrincipalType = PrincipalTypeEnum.Credential;
                origin.CredentialId = credential.Id;
                origin.UserId = credential.UserId;
                origin.IsAdmin = owner != null && owner.IsAdmin;
                origin.IsTenantAdmin = owner != null && owner.IsTenantAdmin;
            }
            else
            {
                User? user = await _Database.Users.ReadAsync(trigger.TenantId, trigger.RunAsId, token).ConfigureAwait(false);
                if (user == null || !user.Active) return "The user trigger " + trigger.Name + " runs as is missing or inactive. Save the trigger again to run as yourself.";
                origin.PrincipalType = PrincipalTypeEnum.User;
                origin.UserId = user.Id;
                origin.IsAdmin = user.IsAdmin;
                origin.IsTenantAdmin = user.IsTenantAdmin;
            }

            List<string> agents = new List<string>();
            if (trigger.TargetType == TriggerTargetTypeEnum.Pipeline)
            {
                AuthorizationDecision pipelineDecision = await _Authorization.EvaluateAsync(origin, trigger.TenantId, ResourceTypeEnum.Pipeline, OperationTypeEnum.Execute, trigger.PipelineId, token).ConfigureAwait(false);
                if (!pipelineDecision.Permitted) return "Trigger " + trigger.Name + " runs as " + (trigger.RunAsName ?? trigger.RunAsId) + ", who may no longer start the pipeline: " + pipelineDecision.Reason;
                Pipeline? pipeline = await _Database.Pipelines.ReadAsync(trigger.TenantId, trigger.PipelineId ?? String.Empty, token).ConfigureAwait(false);
                if (pipeline != null) agents.AddRange(pipeline.Stages.Select(s => s.AgentId).Distinct(StringComparer.Ordinal));
            }
            else if (!String.IsNullOrEmpty(trigger.AgentId))
            {
                agents.Add(trigger.AgentId);
            }
            foreach (string agentId in agents)
            {
                AuthorizationDecision decision = await _Authorization.EvaluateAsync(origin, trigger.TenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agentId, token).ConfigureAwait(false);
                if (!decision.Permitted) return "Trigger " + trigger.Name + " runs as " + (trigger.RunAsName ?? trigger.RunAsId) + ", who may no longer run agent " + agentId + ": " + decision.Reason;
            }
            return null;
        }

        private async Task<string> RenderInputAsync(Trigger trigger, TriggerFire fire, byte[]? body, string? contentType, CancellationToken token)
        {
            string name;
            string content;
            if (!String.IsNullOrEmpty(trigger.InputTemplateId))
            {
                PromptTemplate template = await _Database.PromptTemplates.ReadAsync(trigger.TenantId, trigger.InputTemplateId, token).ConfigureAwait(false)
                    ?? throw new TriggerFireException("InputTemplateNotFound", "Input template " + trigger.InputTemplateId + " of trigger " + trigger.Name + " no longer exists.");
                name = template.Name;
                content = template.Content;
            }
            else
            {
                PromptTemplate? custom = await _Database.PromptTemplates.ReadByNameAsync(trigger.TenantId, DefaultTemplateName, token).ConfigureAwait(false);
                if (custom != null && custom.TenantId == trigger.TenantId && custom.Active && custom.Kind == PromptTemplateKindEnum.Task)
                {
                    name = custom.Name;
                    content = custom.Content;
                }
                else
                {
                    name = Constants.BuiltInPrefix + DefaultTemplateName;
                    PromptTemplate? stored = await _Database.PromptTemplates.ReadByNameAsync(null, name, token).ConfigureAwait(false);
                    content = stored != null && !String.IsNullOrWhiteSpace(stored.Content) ? stored.Content : BuiltInSeeder.PromptDefault(DefaultTemplateName) ?? String.Empty;
                }
            }

            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> map = TemplateContext.NewMap();
            map["id"] = trigger.Id;
            map["name"] = trigger.Name;
            map["description"] = trigger.Description;
            map["type"] = trigger.Type.ToString();
            map["source"] = fire.Source.ToString();
            map["isCron"] = fire.Source == TriggerFireSourceEnum.Cron;
            map["isWebhook"] = fire.Source == TriggerFireSourceEnum.Webhook;
            map["isManual"] = fire.Source == TriggerFireSourceEnum.Manual;
            map["fireId"] = fire.Id;
            map["scheduledUtc"] = fire.ScheduledUtc.ToString("o", System.Globalization.CultureInfo.InvariantCulture);
            map["firedUtc"] = fire.FiredUtc.ToString("o", System.Globalization.CultureInfo.InvariantCulture);
            map["cron"] = trigger.CronExpression;
            map["timeZone"] = trigger.TimeZone;
            context.Set("trigger", map);

            Dictionary<string, object?> webhook = TemplateContext.NewMap();
            string? text = body == null || body.Length == 0 ? null : Encoding.UTF8.GetString(body);
            webhook["body"] = text;
            webhook["json"] = ParseJson(text, contentType);
            webhook["contentType"] = contentType;
            webhook["deliveryId"] = fire.DeliveryId;
            context.Set("webhook", webhook);
            context.Set("tenant.id", trigger.TenantId);
            context.Set("now", DateTime.UtcNow);

            try
            {
                return TemplateRenderer.Render(content, context, new TemplateRenderOptions { TemplateName = name }).Trim();
            }
            catch (TemplateException e)
            {
                throw new TriggerFireException("TemplateRenderFailed", "Input template " + name + " failed to render: " + e.Message);
            }
        }

        private static object? ParseJson(string? text, string? contentType)
        {
            if (String.IsNullOrWhiteSpace(text)) return null;
            bool declared = contentType != null && contentType.Contains("json", StringComparison.OrdinalIgnoreCase);
            string trimmed = text.TrimStart();
            if (!declared && !trimmed.StartsWith("{", StringComparison.Ordinal) && !trimmed.StartsWith("[", StringComparison.Ordinal)) return null;
            try
            {
                // The payload is caller-defined, not a fixed contract: it becomes a template value tree as-is.
                using (JsonDocument document = JsonDocument.Parse(text, new JsonDocumentOptions { MaxDepth = 64 }))
                {
                    return TemplateSampleContext.FromJson(document.RootElement);
                }
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static void Fail(TriggerFire fire, string code, string message)
        {
            fire.Outcome = TriggerFireOutcomeEnum.Failed;
            fire.ErrorCode = String.IsNullOrEmpty(code) ? "FireFailed" : code;
            fire.ErrorMessage = message;
        }

        private void Finished(Trigger trigger, TriggerFire fire)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.TriggerFires, "tenant", trigger.TenantId, "source", fire.Source.ToString().ToLowerInvariant(), "outcome", fire.Outcome.ToString().ToLowerInvariant());
            string started = fire.RunId != null ? " run " + fire.RunId : (fire.PipelineRunId != null ? " pipeline run " + fire.PipelineRunId : String.Empty);
            string message = _Header + "trigger " + trigger.Id + " (" + trigger.Name + ") fired by " + fire.Source + ": " + fire.Outcome + started + (fire.ErrorCode != null ? " (" + fire.ErrorCode + ": " + fire.ErrorMessage + ")" : String.Empty)
                + " " + GarrisonTracing.LogFields("tenant", trigger.TenantId, "trigger", trigger.Name);
            if (fire.Outcome == TriggerFireOutcomeEnum.Started) _Logging.Info(message);
            else _Logging.Warn(message);
        }

        #endregion
    }
}
