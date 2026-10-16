namespace Garrison.Core.Telemetry
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Radiant;

    /// <summary>
    /// Every Garrison metric (P13.20 to P13.24): name, kind, unit, labels, emitting process, coverage category, and
    /// Grafana dashboard. <see cref="GarrisonMetrics"/> creates its instruments from these descriptors, the telemetry
    /// pipeline applies their histogram buckets, docs/TELEMETRY.md lists them, and the coverage tests check that each one
    /// is documented and charted. Label keys are the constants on <see cref="GarrisonMetrics"/>. Thread-safe (immutable
    /// after static initialization; do not modify the descriptors).
    /// </summary>
    public static class GarrisonMetricCatalog
    {
        #region Public-Members

        /// <summary>
        /// Labels every per-run metric carries: tenant, agent, deployment, harness, model.
        /// </summary>
        public static readonly string RunLabels = "tenant, agent, deployment, harness, model";

        /// <summary>Workspace cache lookups by deployment, cache layer, and hit or miss.</summary>
        public static readonly MetricDescriptor WorkspaceCacheRequests = new MetricDescriptor("garrison.worker.workspace.cache", MetricKindEnum.Counter, "{request}", "tenant, agent, deployment, cache, result", "Workspace cache lookups, split by git mirror or prepared archive and hit or miss", "worker", "Workers", "garrison-workers");

        /// <summary>Application operations by bounded component, operation and outcome.</summary>
        public static readonly MetricDescriptor ApplicationOperations = new MetricDescriptor("garrison.application.operations", MetricKindEnum.Counter, "{operation}", "component, operation, result", "Application stage completions including errors and cancellations; labels contain no run identifiers or input", "server and worker", "Integrations", "garrison-integrations");

        /// <summary>Application operation duration, including failures and cancellations.</summary>
        public static readonly MetricDescriptor ApplicationOperationDuration = new MetricDescriptor("garrison.application.operation.duration", MetricKindEnum.Histogram, "s", "component, operation, result", "Application stage wall time; use nested traces to separate database, admission and outbound work", "server and worker", "Integrations", "garrison-integrations", TelemetryBuckets.Fast);

        /// <summary>Gateway-owned authorization, fence and journal wall time excluding tool execution and transport.</summary>
        public static readonly MetricDescriptor GatewayOverheadDuration = new MetricDescriptor("garrison.gateway.overhead.duration", MetricKindEnum.Histogram, "s", "mode, result", "Gateway-owned elapsed time excluding awaited tool dispatch; includes authorization, database statements and lock waits", "server", "Integrations", "garrison-integrations", TelemetryBuckets.Fast);

        /// <summary>Synchronous wait admission outcomes; fallback returns the admitted run without holding an HTTP request.</summary>
        public static readonly MetricDescriptor SynchronousWaitAdmission = new MetricDescriptor("garrison.synchronous.wait.admission", MetricKindEnum.Counter, "{request}", "result", "Synchronous wait admission, accepted asynchronous fallback, or fail-fast delegation denial protecting worker protocol request capacity", "server", "HTTP", "garrison-http");

        /// <summary>Active synchronous invocation waiters in this control-plane process.</summary>
        public static readonly MetricDescriptor SynchronousWaiters = new MetricDescriptor("garrison.synchronous.waiters", MetricKindEnum.UpDownCounter, "{request}", "", "Active synchronous invocation waiters admitted by the shared request budget", "server", "HTTP", "garrison-http");

        // HTTP

        /// <summary>REST requests handled.</summary>
        public static readonly MetricDescriptor HttpRequests = new MetricDescriptor("garrison.http.requests", MetricKindEnum.Counter, "{request}", "method, route, status_code, status_class, tenant", "REST requests handled, by route template (never the raw path), method, status, and tenant. Requests the client abandoned (a worker dropping its cancellation watch, a closed browser tab) have status_code 499 and status_class aborted, never 5xx", "server", "HTTP", "garrison-http");

        /// <summary>REST request duration.</summary>
        public static readonly MetricDescriptor HttpRequestDuration = new MetricDescriptor("garrison.http.request.duration", MetricKindEnum.Histogram, "s", "method, route, status_class, tenant", "Time from the request arriving to the response being sent", "server", "HTTP", "garrison-http", TelemetryBuckets.Request);

        /// <summary>REST request body size.</summary>
        public static readonly MetricDescriptor HttpRequestSize = new MetricDescriptor("garrison.http.request.size", MetricKindEnum.Histogram, "By", "method, route", "Request body size", "server", "HTTP", "garrison-http", TelemetryBuckets.Bytes);

        /// <summary>REST response body size.</summary>
        public static readonly MetricDescriptor HttpResponseSize = new MetricDescriptor("garrison.http.response.size", MetricKindEnum.Histogram, "By", "method, route", "Response body size (0 for streamed responses)", "server", "HTTP", "garrison-http", TelemetryBuckets.Bytes);

        /// <summary>REST requests in flight.</summary>
        public static readonly MetricDescriptor HttpInFlight = new MetricDescriptor("garrison.http.requests.in_flight", MetricKindEnum.ObservableGauge, "{request}", "", "REST requests being handled right now, including long polls and streams", "server", "HTTP", "garrison-http");

        // Security

        /// <summary>Authentication failures.</summary>
        public static readonly MetricDescriptor AuthFailures = new MetricDescriptor("garrison.auth.failures", MetricKindEnum.Counter, "{request}", "scheme, reason", "Requests rejected by authentication, by scheme (BearerToken, AccessKeySignature, ...) and reason (Invalid, NotFound, Inactive, Missing)", "server", "Security", "garrison-security");

        /// <summary>Rate-limit rejections.</summary>
        public static readonly MetricDescriptor AuthRateLimited = new MetricDescriptor("garrison.auth.rate_limited", MetricKindEnum.Counter, "{request}", "scope", "Requests refused by the authentication rate limiter, by limiter scope", "server", "Security", "garrison-security");

        /// <summary>Authorization denials.</summary>
        public static readonly MetricDescriptor AuthzDenials = new MetricDescriptor("garrison.authz.denials", MetricKindEnum.Counter, "{request}", "resource, operation, result", "Authorization denials by resource type, operation, and result (Forbidden, NotFound)", "server", "Security", "garrison-security");

        /// <summary>Authentication cache lookups.</summary>
        public static readonly MetricDescriptor AuthCacheLookups = new MetricDescriptor("garrison.auth.cache_lookups", MetricKindEnum.Counter, "{lookup}", "entity, result", "Authentication lookups by record (session, tenant, user, credential) and result: hit (answered from the per-replica cache, Auth.CacheSeconds) or miss (read from the database)", "server", "Security", "garrison-security");

        /// <summary>Tokens issued.</summary>
        public static readonly MetricDescriptor AuthTokensIssued = new MetricDescriptor("garrison.auth.tokens_issued", MetricKindEnum.Counter, "{token}", "scheme, principal", "Session tokens issued (sign-ins and token exchanges) by scheme and principal type (User, Credential, Run)", "server", "Security", "garrison-security");

        /// <summary>Secret decryptions.</summary>
        public static readonly MetricDescriptor SecretDecrypts = new MetricDescriptor("garrison.secret.decrypts", MetricKindEnum.Counter, "{operation}", "result", "Secret decryptions by result (ok, error)", "server", "Security", "garrison-security");

        /// <summary>Codex token refreshes.</summary>
        public static readonly MetricDescriptor CodexTokenRefresh = new MetricDescriptor("garrison.codex.token_refresh", MetricKindEnum.Counter, "{refresh}", "result", "Control-plane refreshes of Codex auth.json credentials by result (ok, failed, reauth_required, skipped)", "server", "Security", "garrison-security");

        /// <summary>Audit records.</summary>
        public static readonly MetricDescriptor AuditEvents = new MetricDescriptor("garrison.audit.events", MetricKindEnum.Counter, "{event}", "type", "Audit records written, by event type", "server", "Security", "garrison-security");

        // Runs

        /// <summary>Runs created.</summary>
        public static readonly MetricDescriptor RunsCreated = new MetricDescriptor("garrison.runs.created", MetricKindEnum.Counter, "{run}", "tenant, agent, deployment, harness, kind, executor", "Runs created (invocations), per agent and deployment", "server", "Runs", "garrison-runs");

        /// <summary>Runs finished.</summary>
        public static readonly MetricDescriptor RunsFinished = new MetricDescriptor("garrison.runs.finished", MetricKindEnum.Counter, "{run}", "tenant, agent, deployment, harness, model, outcome", "Runs that reached a terminal status, by outcome and served model", "server", "Runs", "garrison-runs");

        /// <summary>Run stage durations.</summary>
        public static readonly MetricDescriptor RunStageDuration = new MetricDescriptor("garrison.run.stage.duration", MetricKindEnum.Histogram, "s", "stage, tenant, agent, deployment, harness, model", "Per-run stage durations: queue (queued to leased), claim (scheduler claim and compile inside the lease request), startup (leased to harness start), first_token (TTFT), first_token_excl_delegation, streaming (first to last output), execution (harness start to exit), delegation_wait, total (queued to completion received)", "server", "Runs", "garrison-agents", TelemetryBuckets.Run);

        /// <summary>Tokens consumed.</summary>
        public static readonly MetricDescriptor RunTokens = new MetricDescriptor("garrison.run.tokens", MetricKindEnum.Counter, "{token}", "direction, tenant, agent, deployment, harness, model", "Tokens consumed by finished runs, by direction (input, output, cached, reasoning)", "server", "Models", "garrison-models");

        /// <summary>Tokens per run.</summary>
        public static readonly MetricDescriptor HarnessTokens = new MetricDescriptor("garrison.harness.tokens", MetricKindEnum.Histogram, "{token}", "direction, agent, harness, model", "Tokens per run as reported by the harness, by direction", "server", "Models", "garrison-models", TelemetryBuckets.Tokens);

        /// <summary>Cost accumulated.</summary>
        public static readonly MetricDescriptor RunCostUsd = new MetricDescriptor("garrison.run.cost_usd", MetricKindEnum.Counter, "{usd}", RunLabels, "Reported or estimated cost of finished runs in US dollars", "server", "Models", "garrison-models");

        /// <summary>Cost per run.</summary>
        public static readonly MetricDescriptor RunCost = new MetricDescriptor("garrison.run.cost", MetricKindEnum.Histogram, "{usd}", "agent, harness, model", "Cost per run in US dollars", "server", "Models", "garrison-models", TelemetryBuckets.Cost);

        /// <summary>Output tokens per second.</summary>
        public static readonly MetricDescriptor RunOutputRate = new MetricDescriptor("garrison.run.output_rate", MetricKindEnum.Histogram, null, "agent, harness, model", "Output tokens per second over the streaming window (runs with at least 100 ms of streaming)", "server", "Models", "garrison-models", TelemetryBuckets.Rate);

        /// <summary>Tool calls per run.</summary>
        public static readonly MetricDescriptor RunToolCalls = new MetricDescriptor("garrison.run.tool_calls", MetricKindEnum.Histogram, "{call}", "agent, harness", "Tool calls (MCP tools, shell commands, searches) per run", "server", "Agents", "garrison-agents", TelemetryBuckets.Count);

        /// <summary>Run guard trips.</summary>
        public static readonly MetricDescriptor RunGuardTrips = new MetricDescriptor("garrison.runs.guard_trips", MetricKindEnum.Counter, "{run}", "guard, tenant, agent, harness", "Runs stopped by a guard: repetition, no_progress, output_limit, timeout, blocked", "server", "Agents", "garrison-agents");

        /// <summary>Run cancellations.</summary>
        public static readonly MetricDescriptor RunCancellations = new MetricDescriptor("garrison.runs.cancellations", MetricKindEnum.Counter, "{run}", "tenant, agent, reason", "Cancellation requests accepted, by reason (request, disconnect, parent, pipeline)", "server", "Runs", "garrison-runs");

        /// <summary>Permission requests evaluated (P12.3).</summary>
        public static readonly MetricDescriptor ApprovalsRequested = new MetricDescriptor("garrison.approvals.requested", MetricKindEnum.Counter, "{request}", "tenant, agent, kind, action", "Permission requests relayed by harnesses, by the action the deployment's rules chose (allow, deny, ask)", "server", "Runs", "garrison-runs");

        /// <summary>Permission approvals decided (P12.3).</summary>
        public static readonly MetricDescriptor ApprovalsDecided = new MetricDescriptor("garrison.approvals.decided", MetricKindEnum.Counter, "{approval}", "tenant, agent, source, decision", "Permission approvals decided, by who decided (rule, default, user, timeout, cancelled) and the decision (allow, deny)", "server", "Runs", "garrison-runs");

        /// <summary>Time pending approvals waited (P12.3).</summary>
        public static readonly MetricDescriptor ApprovalWait = new MetricDescriptor("garrison.approval.wait", MetricKindEnum.Histogram, "s", "source, decision", "Time a pending approval waited for a person, the timeout, or a cancellation", "server", "Runs", "garrison-runs", TelemetryBuckets.Run);

        /// <summary>Pending approvals (P12.3).</summary>
        public static readonly MetricDescriptor ApprovalsPending = new MetricDescriptor("garrison.approvals.pending", MetricKindEnum.ObservableGauge, "{approval}", "", "Approvals waiting for a person, as of the leader's last sweep; aggregate with max", "server", "Runs", "garrison-runs");

        /// <summary>Structured output validations.</summary>
        public static readonly MetricDescriptor SchemaValidations = new MetricDescriptor("garrison.runs.schema_validations", MetricKindEnum.Counter, "{validation}", "result, execution, harness, tenant, agent", "Validations of run output against the agent's output schema", "server", "Runs", "garrison-runs");

        /// <summary>Structured output repairs.</summary>
        public static readonly MetricDescriptor Repairs = new MetricDescriptor("garrison.runs.repairs", MetricKindEnum.Counter, "{repair}", "harness, tenant, agent", "Structured output repair attempts started", "server", "Runs", "garrison-runs");

        /// <summary>Conversation turns.</summary>
        public static readonly MetricDescriptor ConversationTurns = new MetricDescriptor("garrison.conversation.turns", MetricKindEnum.Counter, "{turn}", "tenant, agent, mode", "Conversation turns created, by how the harness session starts: first (a new conversation), resume (the session on the affinity node), or fallback (a fresh session seeded with the transcript)", "server", "Runs", "garrison-runs");

        /// <summary>Conversation fallbacks.</summary>
        public static readonly MetricDescriptor ConversationFallbacks = new MetricDescriptor("garrison.conversation.fallbacks", MetricKindEnum.Counter, "{turn}", "reason", "Conversation turns that could not resume their harness session and started a fresh one from the transcript, by reason (AffinityNodeLost, AffinityWaitExpired, WorkspaceLost, SessionMissing, HarnessChanged, ResumeUnsupported, ExecutorWithoutState)", "server", "Runs", "garrison-runs");

        /// <summary>Conversation turns refused because another turn was unfinished.</summary>
        public static readonly MetricDescriptor ConversationBusy = new MetricDescriptor("garrison.conversation.busy", MetricKindEnum.Counter, "{request}", "surface", "Conversation turns refused with 409 ConversationBusy because the conversation's previous turn had not finished, by surface (rest, mcp, a2a)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline runs started (P12.9).</summary>
        public static readonly MetricDescriptor PipelinesStarted = new MetricDescriptor("garrison.pipelines.started", MetricKindEnum.Counter, "{pipeline_run}", "tenant, pipeline", "Pipeline runs started (an idempotent repeat of a start is not counted)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline runs finished (P12.9).</summary>
        public static readonly MetricDescriptor PipelinesFinished = new MetricDescriptor("garrison.pipelines.finished", MetricKindEnum.Counter, "{pipeline_run}", "tenant, pipeline, outcome", "Pipeline runs that reached a terminal status, by outcome (Succeeded, StageFailed, StageStartFailed, ReviewRejected, ReviewExpired, Cancelled, TimedOut, InternalError)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline stage executions created (P12.9).</summary>
        public static readonly MetricDescriptor PipelineStageExecutions = new MetricDescriptor("garrison.pipeline.stage.executions", MetricKindEnum.Counter, "{execution}", "tenant, pipeline, mode", "Pipeline stage runs created, by why the execution started: first, retry (a failed attempt), revision (a reviewer requested changes), or resume (a retried pipeline run)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline stage runs that could not be created (P12.9).</summary>
        public static readonly MetricDescriptor PipelineStageStartFailures = new MetricDescriptor("garrison.pipeline.stage.start_failures", MetricKindEnum.Counter, "{failure}", "tenant, pipeline, kind", "Pipeline stage runs that could not be created, by kind: transient (for example QuotaExceeded, retried by the sweep) or permanent (the pipeline run fails with StageStartFailed)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline advancement passes (P12.9).</summary>
        public static readonly MetricDescriptor PipelineAdvances = new MetricDescriptor("garrison.pipeline.advances", MetricKindEnum.Counter, "{pass}", "trigger, result", "Pipeline run advancement passes, by trigger (hook, sweep, api) and result (changed when the pass moved the pipeline run, unchanged otherwise)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline reviews decided (P12.9).</summary>
        public static readonly MetricDescriptor PipelineReviewsDecided = new MetricDescriptor("garrison.pipeline.reviews.decided", MetricKindEnum.Counter, "{review}", "tenant, pipeline, source, decision", "Pipeline stage reviews decided, by who decided (user, timeout, cancelled) and the decision (approve, requestchanges, reject, none)", "server", "Runs", "garrison-runs");

        /// <summary>Pipeline review wait (P12.9).</summary>
        public static readonly MetricDescriptor PipelineReviewWait = new MetricDescriptor("garrison.pipeline.review.wait", MetricKindEnum.Histogram, "s", "source, decision", "Time a pipeline stage review waited for its decision", "server", "Runs", "garrison-runs", TelemetryBuckets.Run);

        /// <summary>Pending pipeline reviews (P12.9).</summary>
        public static readonly MetricDescriptor PipelineReviewsPending = new MetricDescriptor("garrison.pipeline.reviews.pending", MetricKindEnum.ObservableGauge, "{review}", "", "Pipeline stage reviews waiting for a person, as of the leader's last pipeline sweep; aggregate with max", "server", "Runs", "garrison-runs");

        /// <summary>Trigger fires (P12.5).</summary>
        public static readonly MetricDescriptor TriggerFires = new MetricDescriptor("garrison.trigger.fires", MetricKindEnum.Counter, "{fire}", "tenant, source, outcome", "Trigger fires, by source (cron, webhook, manual) and outcome (started, failed, skipped); repeated webhook deliveries are not counted", "server", "Runs", "garrison-runs");

        /// <summary>Trigger webhook deliveries refused before firing (P12.5).</summary>
        public static readonly MetricDescriptor TriggerWebhookRejections = new MetricDescriptor("garrison.trigger.webhook.rejections", MetricKindEnum.Counter, "{request}", "reason", "Trigger webhook deliveries refused before firing, by reason (missing, malformed, stale, mismatch, too_large, inactive, bad_delivery_id)", "server", "Runs", "garrison-runs");

        /// <summary>Notification delivery attempts (P12.14).</summary>
        public static readonly MetricDescriptor NotificationDeliveries = new MetricDescriptor("garrison.notification.deliveries", MetricKindEnum.Counter, "{attempt}", "event, result", "Notification delivery attempts, by event and result (succeeded, retry, failed, blocked)", "server", "Runs", "garrison-runs");

        /// <summary>Notifications queued (P12.14).</summary>
        public static readonly MetricDescriptor NotificationsQueued = new MetricDescriptor("garrison.notifications.queued", MetricKindEnum.Counter, "{notification}", "event", "Notifications queued in the outbox, by event", "server", "Runs", "garrison-runs");

        /// <summary>Run events received.</summary>
        public static readonly MetricDescriptor RunEvents = new MetricDescriptor("garrison.run.events", MetricKindEnum.Counter, "{event}", "type", "Run events received from workers, by event type", "server", "Runs", "garrison-runs");

        /// <summary>Events per batch.</summary>
        public static readonly MetricDescriptor EventBatchSize = new MetricDescriptor("garrison.event.batch.size", MetricKindEnum.Histogram, "{event}", "", "Events per batch received from workers", "server", "Runs", "garrison-runs", TelemetryBuckets.Count);

        /// <summary>Unfinished runs (Pending, Queued).</summary>
        public static readonly MetricDescriptor RunsQueued = new MetricDescriptor("garrison.runs.queued", MetricKindEnum.ObservableGauge, "{run}", "", "Runs waiting for a worker (Pending and Queued), cluster-wide; aggregate with max", "server", "Runs", "garrison-runs");

        /// <summary>Unfinished runs (Leased, Running, Cancelling).</summary>
        public static readonly MetricDescriptor RunsActive = new MetricDescriptor("garrison.runs.active", MetricKindEnum.ObservableGauge, "{run}", "", "Runs leased, running, or cancelling, cluster-wide; aggregate with max", "server", "Runs", "garrison-runs");

        // Scheduler

        /// <summary>Queue depth per agent.</summary>
        public static readonly MetricDescriptor QueueDepth = new MetricDescriptor("garrison.queue.depth", MetricKindEnum.ObservableGauge, "{run}", "status, tenant, agent, harness", "Unfinished runs by status, tenant, agent, and harness, cluster-wide (refreshed every 10 seconds); aggregate with max", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Blocked runs per reason.</summary>
        public static readonly MetricDescriptor RunsBlockedCurrent = new MetricDescriptor("garrison.runs.blocked.current", MetricKindEnum.ObservableGauge, "{run}", "reason", "Queued runs no Ready worker can run right now, by reason; aggregate with max", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Blocked-run notices.</summary>
        public static readonly MetricDescriptor RunsBlocked = new MetricDescriptor("garrison.runs.blocked", MetricKindEnum.Counter, "{run}", "reason", "Runs that became blocked (warning appended)", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Blocked runs failed.</summary>
        public static readonly MetricDescriptor RunsBlockedFailed = new MetricDescriptor("garrison.runs.blocked.failed", MetricKindEnum.Counter, "{run}", "reason", "Blocked runs failed with NoCapableWorker after Runtime.FailBlockedAfterSeconds", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Claim attempts.</summary>
        public static readonly MetricDescriptor Claims = new MetricDescriptor("garrison.claims", MetricKindEnum.Counter, "{claim}", "result, harness", "Lease claim attempts: won, lost (another node claimed first), limit (deployment at its concurrency limit), affinity (a conversation turn left for its affinity node)", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Claim duration.</summary>
        public static readonly MetricDescriptor ClaimDuration = new MetricDescriptor("garrison.scheduler.claim.duration", MetricKindEnum.Histogram, "s", "result", "Time to find, claim, and compile a run inside one lease request (result assigned or empty)", "server", "Scheduler", "garrison-scheduler", TelemetryBuckets.Request);

        /// <summary>Lease requests answered.</summary>
        public static readonly MetricDescriptor LeaseRequests = new MetricDescriptor("garrison.scheduler.lease_requests", MetricKindEnum.Counter, "{request}", "result", "Worker lease requests answered, by result (assigned, empty)", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Lease long-poll wait.</summary>
        public static readonly MetricDescriptor LeaseWait = new MetricDescriptor("garrison.scheduler.lease_wait.duration", MetricKindEnum.Histogram, "s", "result", "How long a lease request waited (long poll) before it was answered", "server", "Scheduler", "garrison-scheduler", TelemetryBuckets.Request);

        /// <summary>Lease long-poll wakeups.</summary>
        public static readonly MetricDescriptor QueueWakeups = new MetricDescriptor("garrison.scheduler.queue_wakeups", MetricKindEnum.Counter, "{wakeup}", "source", "Lease long polls woken to look for work again, by source: notify (a queued run this poll could take, one poll per replica by default), handoff (another poll could not take the run and handed it on), pending (a run was queued while this poll was looking for work), broadcast (every poll woken: a backplane resynchronization, an older replica, or Scheduling.QueueWakeFanout 0), or poll (the fallback poll interval, Runtime.LeasePollMs, passed without a signal)", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Deployment claim lock wait.</summary>
        public static readonly MetricDescriptor DeploymentLockWait = new MetricDescriptor("garrison.scheduler.deployment_lock.wait", MetricKindEnum.Histogram, "s", "", "Time a claim waited for the per-deployment concurrency lock that serializes claims of one deployment (Postgresql only; Sqlite has a single writer)", "server", "Scheduler", "garrison-scheduler", TelemetryBuckets.Fast);

        /// <summary>Compile duration.</summary>
        public static readonly MetricDescriptor CompileDuration = new MetricDescriptor("garrison.compile.duration", MetricKindEnum.Histogram, "s", "harness, agent, result", "Time to compile a claimed run into an execution spec", "server", "Scheduler", "garrison-scheduler", TelemetryBuckets.Fast);

        /// <summary>Lease expirations.</summary>
        public static readonly MetricDescriptor LeaseExpirations = new MetricDescriptor("garrison.lease.expirations", MetricKindEnum.Counter, "{run}", "action", "Runs whose worker stopped renewing the lease (requeued or failed)", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Lease renewals.</summary>
        public static readonly MetricDescriptor LeaseRenewals = new MetricDescriptor("garrison.lease.renewals", MetricKindEnum.Counter, "{renewal}", "result", "Run leases extended by worker heartbeats, by result: renewed, or lost (the lease had moved on, so the worker is told to stop the run)", "server", "Scheduler", "garrison-scheduler");

        /// <summary>Node heartbeats.</summary>
        public static readonly MetricDescriptor NodeHeartbeats = new MetricDescriptor("garrison.node.heartbeats", MetricKindEnum.Counter, "{heartbeat}", "result", "Worker heartbeats received (ok, unknown_node, rejected)", "server", "Workers", "garrison-workers");

        /// <summary>Node transitions.</summary>
        public static readonly MetricDescriptor NodeTransitions = new MetricDescriptor("garrison.node.transitions", MetricKindEnum.Counter, "{transition}", "status", "Worker node state transitions, by new status (Ready, Draining, Lost, Offline, Registered)", "server", "Workers", "garrison-workers");

        /// <summary>Nodes by status.</summary>
        public static readonly MetricDescriptor Nodes = new MetricDescriptor("garrison.nodes", MetricKindEnum.ObservableGauge, "{node}", "status", "Worker nodes by status, cluster-wide; aggregate with max", "server", "Workers", "garrison-workers");

        // Protocols

        /// <summary>MCP tool calls.</summary>
        public static readonly MetricDescriptor McpToolCalls = new MetricDescriptor("garrison.mcp.tool.calls", MetricKindEnum.Counter, "{call}", "tool, tenant", "MCP tool calls; agent tools are reported as tool=agent", "server", "Protocols", "garrison-protocols");

        /// <summary>MCP tool outcomes.</summary>
        public static readonly MetricDescriptor McpToolResults = new MetricDescriptor("garrison.mcp.tool.results", MetricKindEnum.Counter, "{call}", "tool, result", "MCP tool outcomes (ok, error)", "server", "Protocols", "garrison-protocols");

        /// <summary>MCP tool duration.</summary>
        public static readonly MetricDescriptor McpToolDuration = new MetricDescriptor("garrison.mcp.tool.duration", MetricKindEnum.Histogram, "s", "tool, result", "MCP tool call duration, including the wait for invoked agents", "server", "Protocols", "garrison-protocols", TelemetryBuckets.Run);

        /// <summary>MCP sessions active.</summary>
        public static readonly MetricDescriptor McpSessionsActive = new MetricDescriptor("garrison.mcp.sessions.active", MetricKindEnum.ObservableGauge, "{session}", "", "MCP sessions served by this replica", "server", "Protocols", "garrison-protocols");

        /// <summary>MCP session events.</summary>
        public static readonly MetricDescriptor McpSessions = new MetricDescriptor("garrison.mcp.sessions", MetricKindEnum.Counter, "{session}", "event", "MCP session lifecycle: created, restored (served on another replica than the one that created it), closed, expired", "server", "Protocols", "garrison-protocols");

        /// <summary>A2A requests.</summary>
        public static readonly MetricDescriptor A2aRequests = new MetricDescriptor("garrison.a2a.requests", MetricKindEnum.Counter, "{request}", "method, result", "A2A JSON-RPC requests by method and result (ok, error)", "server", "Protocols", "garrison-protocols");

        /// <summary>A2A request duration.</summary>
        public static readonly MetricDescriptor A2aDuration = new MetricDescriptor("garrison.a2a.request.duration", MetricKindEnum.Histogram, "s", "method, result", "A2A JSON-RPC method duration", "server", "Protocols", "garrison-protocols", TelemetryBuckets.Run);

        /// <summary>A2A task states.</summary>
        public static readonly MetricDescriptor A2aTasks = new MetricDescriptor("garrison.a2a.tasks", MetricKindEnum.Counter, "{task}", "state", "A2A task states returned to callers (submitted, working, completed, failed, canceled, ...)", "server", "Protocols", "garrison-protocols");

        /// <summary>SSE streams active.</summary>
        public static readonly MetricDescriptor SseStreamsActive = new MetricDescriptor("garrison.sse.streams.active", MetricKindEnum.ObservableGauge, "{stream}", "stream", "Server-sent event streams open on this replica (run_events, a2a)", "server", "Protocols", "garrison-protocols");

        /// <summary>SSE events sent.</summary>
        public static readonly MetricDescriptor SseEvents = new MetricDescriptor("garrison.sse.events", MetricKindEnum.Counter, "{event}", "stream", "Server-sent events written", "server", "Protocols", "garrison-protocols");

        /// <summary>WebSocket sessions active.</summary>
        public static readonly MetricDescriptor WebSocketSessions = new MetricDescriptor("garrison.websocket.sessions.active", MetricKindEnum.ObservableGauge, "{session}", "", "Live-update WebSocket sessions open on this replica", "server", "Protocols", "garrison-protocols");

        /// <summary>WebSocket messages.</summary>
        public static readonly MetricDescriptor WebSocketMessages = new MetricDescriptor("garrison.websocket.messages", MetricKindEnum.Counter, "{message}", "direction", "Live-update WebSocket messages (received, sent)", "server", "Protocols", "garrison-protocols");

        /// <summary>Delegation depth.</summary>
        public static readonly MetricDescriptor DelegationDepth = new MetricDescriptor("garrison.delegation.depth", MetricKindEnum.Histogram, "{level}", "agent", "Call depth of delegated runs when they are created", "server", "Protocols", "garrison-protocols", TelemetryBuckets.Count);

        /// <summary>Delegation denials.</summary>
        public static readonly MetricDescriptor DelegationDenials = new MetricDescriptor("garrison.delegation.denials", MetricKindEnum.Counter, "{request}", "reason", "Delegations refused (depth, cycle, policy, quota)", "server", "Protocols", "garrison-protocols");

        /// <summary>Invocation waits.</summary>
        public static readonly MetricDescriptor InvocationWait = new MetricDescriptor("garrison.invocation.wait.duration", MetricKindEnum.Histogram, "s", "surface, result", "How long synchronous invocations (REST wait, MCP garrison_invoke_agent and agent tools, A2A message/send) waited, by result (completed, timeout, disconnected, cancelled)", "server", "Protocols", "garrison-protocols", TelemetryBuckets.Run);

        /// <summary>cancelOnDisconnect cancellations.</summary>
        public static readonly MetricDescriptor DisconnectCancels = new MetricDescriptor("garrison.invocation.disconnect_cancels", MetricKindEnum.Counter, "{run}", "surface", "Runs cancelled because the waiting caller disconnected (cancelOnDisconnect)", "server", "Protocols", "garrison-protocols");

        // Control plane

        /// <summary>Control nodes by status.</summary>
        public static readonly MetricDescriptor ControlNodes = new MetricDescriptor("garrison.control_nodes", MetricKindEnum.ObservableGauge, "{node}", "status", "Control-plane replicas by status; every replica reports the same cluster-wide counts, so aggregate with max", "server", "Control plane", "garrison-control-plane");

        /// <summary>Control node heartbeats.</summary>
        public static readonly MetricDescriptor ControlNodeHeartbeats = new MetricDescriptor("garrison.control_node.heartbeats", MetricKindEnum.Counter, "{heartbeat}", "result", "This replica's control node heartbeats (ok, error)", "server", "Control plane", "garrison-control-plane");

        /// <summary>Control node transitions.</summary>
        public static readonly MetricDescriptor ControlNodeTransitions = new MetricDescriptor("garrison.control_node.transitions", MetricKindEnum.Counter, "{transition}", "status", "Control node state transitions, by new status", "server", "Control plane", "garrison-control-plane");

        /// <summary>Leader changes.</summary>
        public static readonly MetricDescriptor LeaderChanges = new MetricDescriptor("garrison.leader.changes", MetricKindEnum.Counter, "{change}", "role", "Leadership acquired or lost by this replica", "server", "Control plane", "garrison-control-plane");

        /// <summary>Leader flag.</summary>
        public static readonly MetricDescriptor IsLeader = new MetricDescriptor("garrison.leader.is_leader", MetricKindEnum.ObservableGauge, "{flag}", "", "1 on the replica that holds leadership, 0 elsewhere", "server", "Control plane", "garrison-control-plane");

        /// <summary>Maintenance pauses.</summary>
        public static readonly MetricDescriptor MaintenancePauses = new MetricDescriptor("garrison.maintenance.pauses", MetricKindEnum.Counter, "{pause}", "leader", "Process pauses (VM or container freeze) detected by maintenance", "server", "Control plane", "garrison-control-plane");

        /// <summary>Backplane published.</summary>
        public static readonly MetricDescriptor BackplanePublished = new MetricDescriptor("garrison.backplane.published", MetricKindEnum.Counter, "{message}", "backplane, kind", "Backplane messages published by this replica", "server", "Control plane", "garrison-control-plane");

        /// <summary>Backplane received.</summary>
        public static readonly MetricDescriptor BackplaneReceived = new MetricDescriptor("garrison.backplane.received", MetricKindEnum.Counter, "{message}", "backplane, kind", "Backplane messages received from other replicas", "server", "Control plane", "garrison-control-plane");

        /// <summary>Backplane lag.</summary>
        public static readonly MetricDescriptor BackplaneLag = new MetricDescriptor("garrison.backplane.lag", MetricKindEnum.Histogram, "s", "backplane", "Time from publish on one replica to delivery on another", "server", "Control plane", "garrison-control-plane", TelemetryBuckets.Request);

        /// <summary>Background iteration duration.</summary>
        public static readonly MetricDescriptor BackgroundDuration = new MetricDescriptor("garrison.background.duration", MetricKindEnum.Histogram, "s", "service, operation, result", "Duration of one iteration of a background service (scheduler, maintenance steps, leader election, retention, gauges, settings refresh, ...)", "server, worker", "Control plane", "garrison-control-plane", TelemetryBuckets.Request);

        /// <summary>Background iterations.</summary>
        public static readonly MetricDescriptor BackgroundIterations = new MetricDescriptor("garrison.background.iterations", MetricKindEnum.Counter, "{iteration}", "service, operation, result", "Background service iterations by result (ok, idle, error)", "server, worker", "Control plane", "garrison-control-plane");

        /// <summary>Build information.</summary>
        public static readonly MetricDescriptor BuildInfo = new MetricDescriptor("garrison.build.info", MetricKindEnum.ObservableGauge, "{process}", "version, process", "Always 1; carries the Garrison version and process (server, worker)", "server, worker", "Control plane", "garrison-overview");

        // Database

        /// <summary>Database statement duration.</summary>
        public static readonly MetricDescriptor DbDuration = new MetricDescriptor("garrison.db.operation.duration", MetricKindEnum.Histogram, "s", "provider, operation, table, result", "Database statement and transaction duration by provider, operation (select, insert, update, delete, transaction, ...), and table", "server", "Database", "garrison-database", TelemetryBuckets.Fast);

        /// <summary>Database errors.</summary>
        public static readonly MetricDescriptor DbErrors = new MetricDescriptor("garrison.db.errors", MetricKindEnum.Counter, "{error}", "provider, operation, table, error", "Database statements that threw, by exception type", "server", "Database", "garrison-database");

        /// <summary>Connections in use.</summary>
        public static readonly MetricDescriptor DbConnections = new MetricDescriptor("garrison.db.connections.in_use", MetricKindEnum.UpDownCounter, "{connection}", "provider", "Database connections open in this process (Postgresql pooling detail is in the npgsql_* metrics)", "server", "Database", "garrison-database");

        /// <summary>Write lock wait.</summary>
        public static readonly MetricDescriptor DbWriteLockWait = new MetricDescriptor("garrison.db.write_lock.wait", MetricKindEnum.Histogram, "s", "provider", "Time waiting for the Sqlite write lock", "server", "Database", "garrison-database", TelemetryBuckets.Fast);

        /// <summary>Transaction retries.</summary>
        public static readonly MetricDescriptor DbRetries = new MetricDescriptor("garrison.db.transaction.retries", MetricKindEnum.Counter, "{retry}", "provider", "Transactions retried after a transient conflict (serialization failure, busy database)", "server", "Database", "garrison-database");

        /// <summary>Retention deletions.</summary>
        public static readonly MetricDescriptor RetentionDeleted = new MetricDescriptor("garrison.retention.deleted", MetricKindEnum.Counter, "{row}", "kind", "Rows removed by retention (runs, events, request history, audit, ...)", "server", "Database", "garrison-database");

        /// <summary>Request history captures.</summary>
        public static readonly MetricDescriptor RequestHistoryCaptured = new MetricDescriptor("garrison.request_history.captured", MetricKindEnum.Counter, "{request}", "result", "Request history entries written or dropped", "server", "Database", "garrison-database");

        /// <summary>Run archive results.</summary>
        public static readonly MetricDescriptor ArchiveRuns = new MetricDescriptor("garrison.archive.runs", MetricKindEnum.Counter, "{record}", "kind, result", "Runs and events written to the retention archive (kind runs or events, result ok or error)", "server", "Database", "garrison-database");

        // Integrations

        /// <summary>Outbound requests.</summary>
        public static readonly MetricDescriptor OutboundRequests = new MetricDescriptor("garrison.outbound.requests", MetricKindEnum.Counter, "{request}", "service, operation, result", "Outbound calls (MCP server tests, A2A remote agents, observability probes, metrics relay, MCP proxying, Kubernetes API) by result (ok, error, status class)", "server, worker", "Integrations", "garrison-integrations");

        /// <summary>Outbound duration.</summary>
        public static readonly MetricDescriptor OutboundDuration = new MetricDescriptor("garrison.outbound.duration", MetricKindEnum.Histogram, "s", "service, operation, result", "Outbound call duration", "server, worker", "Integrations", "garrison-integrations", TelemetryBuckets.Request);

        /// <summary>Observability service reachability.</summary>
        public static readonly MetricDescriptor ObservabilityReachable = new MetricDescriptor("garrison.observability.reachable", MetricKindEnum.ObservableGauge, "{flag}", "service", "1 when the server's last probe reached the observability service (Grafana, Prometheus, Loki, Tempo), 0 when not; absent when not configured", "server", "Integrations", "garrison-integrations");

        // Workers

        /// <summary>Lease requests.</summary>
        public static readonly MetricDescriptor WorkerLeases = new MetricDescriptor("garrison.worker.leases", MetricKindEnum.Counter, "{request}", "result", "Lease requests and what came back (assigned, empty, error)", "worker", "Workers", "garrison-workers");



        /// <summary>Runs finished on the worker.</summary>
        public static readonly MetricDescriptor WorkerRuns = new MetricDescriptor("garrison.worker.runs", MetricKindEnum.Counter, "{run}", "tenant, agent, deployment, harness, model, outcome", "Runs this worker finished", "worker", "Workers", "garrison-workers");

        /// <summary>Run duration on the worker.</summary>
        public static readonly MetricDescriptor WorkerRunDuration = new MetricDescriptor("garrison.worker.run.duration", MetricKindEnum.Histogram, "s", RunLabels, "Run duration on the worker (lease to completion report)", "worker", "Workers", "garrison-workers", TelemetryBuckets.Run);

        /// <summary>TTFT on the worker.</summary>
        public static readonly MetricDescriptor WorkerRunTtft = new MetricDescriptor("garrison.worker.run.ttft", MetricKindEnum.Histogram, "s", RunLabels, "Harness process start to first model output", "worker", "Workers", "garrison-workers", TelemetryBuckets.Run);

        /// <summary>Streaming time on the worker.</summary>
        public static readonly MetricDescriptor WorkerRunStreaming = new MetricDescriptor("garrison.worker.run.streaming", MetricKindEnum.Histogram, "s", RunLabels, "First to last model output", "worker", "Workers", "garrison-workers", TelemetryBuckets.Run);

        /// <summary>Worker run stages.</summary>
        public static readonly MetricDescriptor WorkerRunStage = new MetricDescriptor("garrison.worker.run.stage.duration", MetricKindEnum.Histogram, "s", "stage, harness, agent", "Worker run stages: workspace (prepare), execution (executor, including MCP preflight), report (completion report until accepted)", "worker", "Workers", "garrison-workers", TelemetryBuckets.Run);

        /// <summary>Worker tokens.</summary>
        public static readonly MetricDescriptor WorkerTokens = new MetricDescriptor("garrison.worker.harness.tokens", MetricKindEnum.Counter, "{token}", "direction, tenant, agent, deployment, harness, model", "Tokens reported by harnesses on this worker, by direction (input, output, cached, reasoning)", "worker", "Workers", "garrison-models");

        /// <summary>Worker cost.</summary>
        public static readonly MetricDescriptor WorkerCost = new MetricDescriptor("garrison.worker.harness.cost_usd", MetricKindEnum.Counter, "{usd}", RunLabels, "Reported cost of runs on this worker in US dollars", "worker", "Workers", "garrison-models");

        /// <summary>Worker guard trips.</summary>
        public static readonly MetricDescriptor WorkerGuardTrips = new MetricDescriptor("garrison.worker.run.guard_trips", MetricKindEnum.Counter, "{run}", "guard, harness, agent", "Runs this worker stopped with a guard (repetition, no_progress, output_limit, timeout)", "worker", "Workers", "garrison-agents");

        /// <summary>Conversation directories swept.</summary>
        public static readonly MetricDescriptor WorkerConversationsSwept = new MetricDescriptor("garrison.worker.conversations.swept", MetricKindEnum.Counter, "{conversation}", "", "Conversation directories this worker deleted after they went unused for ConversationRetentionHours", "worker", "Workers", "garrison-workers");

        /// <summary>Completion reports.</summary>
        public static readonly MetricDescriptor WorkerCompletionReports = new MetricDescriptor("garrison.worker.completion_reports", MetricKindEnum.Counter, "{report}", "result", "Completion reports: accepted, stale (lease lost), abandoned (gave up after CompletionRetrySeconds)", "worker", "Workers", "garrison-workers");

        /// <summary>Events shipped.</summary>
        public static readonly MetricDescriptor WorkerEvents = new MetricDescriptor("garrison.worker.events", MetricKindEnum.Counter, "{event}", "result", "Run events relayed to the control plane (shipped, dropped)", "worker", "Workers", "garrison-workers");

        /// <summary>Worker heartbeats.</summary>
        public static readonly MetricDescriptor WorkerHeartbeats = new MetricDescriptor("garrison.worker.heartbeats", MetricKindEnum.Counter, "{heartbeat}", "result", "Heartbeats sent (ok, error)", "worker", "Workers", "garrison-workers");

        /// <summary>Worker pauses.</summary>
        public static readonly MetricDescriptor WorkerPauses = new MetricDescriptor("garrison.worker.pauses", MetricKindEnum.Counter, "{pause}", "", "Process pauses detected by the worker's heartbeat loop", "worker", "Workers", "garrison-workers");

        /// <summary>Capability probes.</summary>
        public static readonly MetricDescriptor WorkerProbes = new MetricDescriptor("garrison.worker.capability.probes", MetricKindEnum.Counter, "{probe}", "harness, result", "Harness capability probes (available, unavailable)", "worker", "Workers", "garrison-workers");

        /// <summary>Runs active on the worker.</summary>
        public static readonly MetricDescriptor WorkerRunsActive = new MetricDescriptor("garrison.worker.runs.active", MetricKindEnum.ObservableGauge, "{run}", "", "Runs in progress on this worker", "worker", "Workers", "garrison-workers");

        /// <summary>Free slots on the worker.</summary>
        public static readonly MetricDescriptor WorkerSlotsFree = new MetricDescriptor("garrison.worker.slots.free", MetricKindEnum.ObservableGauge, "{slot}", "", "Free run slots on this worker", "worker", "Workers", "garrison-workers");

        // Kubernetes executor

        /// <summary>Run Jobs.</summary>
        public static readonly MetricDescriptor K8sJobs = new MetricDescriptor("garrison.worker.k8s.jobs", MetricKindEnum.Counter, "{job}", "result", "Run Jobs created (created, create_failed) and deleted", "worker", "Kubernetes", "garrison-kubernetes");

        /// <summary>Pod start latency.</summary>
        public static readonly MetricDescriptor K8sPodStart = new MetricDescriptor("garrison.worker.k8s.pod_start.duration", MetricKindEnum.Histogram, "s", "", "Run Job created to its pod running", "worker", "Kubernetes", "garrison-kubernetes", TelemetryBuckets.Run);

        /// <summary>Pod failures.</summary>
        public static readonly MetricDescriptor K8sPodFailures = new MetricDescriptor("garrison.worker.k8s.pod_failures", MetricKindEnum.Counter, "{pod}", "reason", "Run pods that failed outside the harness (PodFailed), by reason (Unschedulable, ImagePull, OOMKilled, Evicted, ...)", "worker", "Kubernetes", "garrison-kubernetes");

        /// <summary>Orphan cleanups.</summary>
        public static readonly MetricDescriptor K8sReconciled = new MetricDescriptor("garrison.worker.jobs.reconciled", MetricKindEnum.Counter, "{job}", "result", "Orphaned run Jobs deleted by the reconciler", "worker", "Kubernetes", "garrison-kubernetes");

        // Telemetry

        /// <summary>Folded label values.</summary>
        public static readonly MetricDescriptor LabelsFolded = new MetricDescriptor("garrison.telemetry.labels_folded", MetricKindEnum.Counter, "{value}", "label", "Measurements whose label value was replaced by other because the label already had Telemetry.MaxLabelValues distinct values", "server, worker", "Telemetry", "garrison-overview");

        /// <summary>Telemetry diagnostics.</summary>
        public static readonly MetricDescriptor TelemetryDiagnostics = new MetricDescriptor("garrison.telemetry.diagnostics", MetricKindEnum.Counter, "{message}", "severity", "Diagnostics reported by the telemetry pipeline (export failures and the like)", "server, worker", "Telemetry", "garrison-logs");

        #endregion

        #region Private-Members

        private static readonly List<MetricDescriptor> _All = new List<MetricDescriptor>
        {
            SynchronousWaitAdmission, SynchronousWaiters, HttpRequests, HttpRequestDuration, HttpRequestSize, HttpResponseSize, HttpInFlight,
            AuthFailures, AuthRateLimited, AuthzDenials, AuthCacheLookups, AuthTokensIssued, SecretDecrypts, CodexTokenRefresh, AuditEvents,
            RunsCreated, RunsFinished, RunStageDuration, RunTokens, HarnessTokens, RunCostUsd, RunCost, RunOutputRate, RunToolCalls,
            RunGuardTrips, RunCancellations, ApprovalsRequested, ApprovalsDecided, ApprovalWait, ApprovalsPending, SchemaValidations, Repairs, ConversationTurns, ConversationFallbacks, ConversationBusy, PipelinesStarted, PipelinesFinished, PipelineStageExecutions, PipelineStageStartFailures, PipelineAdvances, PipelineReviewsDecided, PipelineReviewWait, PipelineReviewsPending, TriggerFires, TriggerWebhookRejections, NotificationDeliveries, NotificationsQueued, RunEvents, EventBatchSize, RunsQueued, RunsActive,
            QueueDepth, RunsBlockedCurrent, RunsBlocked, RunsBlockedFailed, Claims, ClaimDuration, LeaseRequests, LeaseWait, QueueWakeups, DeploymentLockWait, CompileDuration,
            LeaseExpirations, LeaseRenewals, NodeHeartbeats, NodeTransitions, Nodes,
            McpToolCalls, McpToolResults, McpToolDuration, McpSessionsActive, McpSessions, A2aRequests, A2aDuration, A2aTasks,
            SseStreamsActive, SseEvents, WebSocketSessions, WebSocketMessages, DelegationDepth, DelegationDenials, InvocationWait, DisconnectCancels,
            ControlNodes, ControlNodeHeartbeats, ControlNodeTransitions, LeaderChanges, IsLeader, MaintenancePauses,
            BackplanePublished, BackplaneReceived, BackplaneLag, BackgroundDuration, BackgroundIterations, BuildInfo,
            GatewayOverheadDuration, ApplicationOperations, ApplicationOperationDuration, DbDuration, DbErrors, DbConnections, DbWriteLockWait, DbRetries, RetentionDeleted, RequestHistoryCaptured, ArchiveRuns,
            OutboundRequests, OutboundDuration, ObservabilityReachable,
            WorkspaceCacheRequests, WorkerLeases, WorkerRuns, WorkerRunDuration, WorkerRunTtft, WorkerRunStreaming, WorkerRunStage,
            WorkerTokens, WorkerCost, WorkerGuardTrips, WorkerCompletionReports, WorkerConversationsSwept, WorkerEvents, WorkerHeartbeats, WorkerPauses, WorkerProbes,
            WorkerRunsActive, WorkerSlotsFree,
            K8sJobs, K8sPodStart, K8sPodFailures, K8sReconciled,
            LabelsFolded, TelemetryDiagnostics
        };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Every descriptor, in catalog order.
        /// </summary>
        /// <returns>Descriptors (a new list).</returns>
        public static List<MetricDescriptor> All()
        {
            return new List<MetricDescriptor>(_All);
        }

        /// <summary>
        /// Find a descriptor by instrument name.
        /// </summary>
        /// <param name="name">Instrument name.</param>
        /// <returns>Descriptor, or null.</returns>
        public static MetricDescriptor? Find(string name)
        {
            return _All.FirstOrDefault(d => String.Equals(d.Name, name, StringComparison.Ordinal));
        }

        #endregion
    }
}
