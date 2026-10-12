namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Net.Sockets;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Radiant;
    using Voltaic.A2A;
    using Voltaic.Core;
    using WatsonWebserver.Core;

    /// <summary>
    /// A2A gateway on the main listener (D-013): one agent card and JSON-RPC endpoint per agent, built from Voltaic's
    /// public A2A models so Voltaic A2A clients interoperate. Tasks are runs.
    /// </summary>
    public class A2ARoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly AgentInvoker _Invoker;
        private readonly RunService _Runs;
        private readonly RunSignals _Signals;
        private readonly RuntimeOptions _Options;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="invoker">Agent invoker.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="options">Runtime options.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public A2ARoutes(ServerContext context, AgentInvoker invoker, RunService runs, RunSignals signals, RuntimeOptions options)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Invoker = invoker ?? throw new ArgumentNullException(nameof(invoker));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
            routes.Anonymous(HttpMethod.GET, "/v1.0/a2a/{tenantId}/{agentName}/.well-known/agent-card.json", CardAsync, "A2A agent card", "A2A");
            routes.Scoped(HttpMethod.GET, "/v1.0/a2a/{tenantId}", ResourceTypeEnum.Agent, OperationTypeEnum.Read, CatalogAsync, "A2A agent cards for every exposed agent in a tenant", "A2A", null, null, "none");
            routes.Authenticated(HttpMethod.POST, "/v1.0/a2a/{tenantId}/{agentName}", JsonRpcAsync, "A2A JSON-RPC endpoint (SendMessage, SendStreamingMessage, GetTask, ListTasks, CancelTask, SubscribeToTask)", "A2A");
        }

        /// <summary>
        /// A2A JSON-RPC methods this gateway answers, by the canonical name used as the method label on A2A metrics and
        /// spans (P13.20, P13.23). Requests for any other method are labeled unknown.
        /// </summary>
        /// <returns>Method names.</returns>
        public static List<string> Methods()
        {
            return new List<string> { "SendMessage", "SendStreamingMessage", "GetTask", "CancelTask", "ListTasks", "SubscribeToTask" };
        }

        #endregion

        #region Private-Methods

        private async Task CardAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            Agent? agent = await _Context.Database.Agents.ReadByNameAsync(tenantId, RouteHelpers.Param(context, "agentName") ?? String.Empty, context.Token).ConfigureAwait(false);
            if (agent == null || !agent.Active || !agent.ExposeA2A)
            {
                await RouteHelpers.NotFoundAsync(context, "Agent").ConfigureAwait(false);
                return;
            }
            await SendA2AJsonAsync(context, 200, await BuildCardAsync(context, tenantId, agent).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CatalogAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            query.ActiveOnly = true;
            EnumerationResult<Agent> agents = await _Context.Database.Agents.EnumerateAsync(tenantId, query, context.Token).ConfigureAwait(false);
            List<AgentCard> cards = new List<AgentCard>();
            foreach (Agent agent in agents.Objects.Where(a => a.ExposeA2A)) cards.Add(await BuildCardAsync(context, tenantId, agent).ConfigureAwait(false));
            await SendA2AJsonAsync(context, 200, cards).ConfigureAwait(false);
        }

        private async Task JsonRpcAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string agentName = RouteHelpers.Param(context, "agentName") ?? String.Empty;
            object? id = null;
            string method;
            JsonElement parameters;

            try
            {
                using (JsonDocument document = JsonDocument.Parse(context.Request.DataAsString ?? String.Empty))
                {
                    JsonElement root = document.RootElement;
                    if (root.TryGetProperty("id", out JsonElement idElement)) id = idElement.ValueKind == JsonValueKind.Number ? (object)idElement.GetInt64() : idElement.ToString();
                    method = root.TryGetProperty("method", out JsonElement methodElement) ? methodElement.GetString() ?? String.Empty : String.Empty;
                    parameters = root.TryGetProperty("params", out JsonElement paramsElement) ? paramsElement.Clone() : default;
                }
            }
            catch (JsonException)
            {
                await SendRpcErrorAsync(context, null, JsonRpcError.ParseError()).ConfigureAwait(false);
                return;
            }

            string methodLabel = MethodLabel(method);
            long start = Stopwatch.GetTimestamp();
            string result = "ok";
            Activity? span = GarrisonTracing.Start("a2a " + methodLabel);
            span?.SetTag("rpc.system", "jsonrpc");
            span?.SetTag("rpc.method", methodLabel);
            span?.SetTag("garrison.agent", agentName);
            span?.SetTag("garrison.tenant", tenantId);
            try
            {
                Agent? agent = await _Context.Database.Agents.ReadByNameAsync(tenantId, agentName, context.Token).ConfigureAwait(false);
                RequestContext ctx = RouteHelpers.Context(context);
                if (agent == null || !agent.ExposeA2A || (ctx.TenantId != tenantId && !ctx.IsAdmin))
                {
                    result = "error";
                    await SendRpcErrorAsync(context, id, Error(-32001, "Agent " + agentName + " not found.")).ConfigureAwait(false);
                    return;
                }

                try
                {
                    switch (method)
                    {
                        case A2AProtocol.SendMessage:
                        case "message/send":
                            await SendMessageAsync(context, ctx, tenantId, agent, id, Parse<SendMessageRequest>(parameters), false).ConfigureAwait(false);
                            return;
                        case A2AProtocol.SendStreamingMessage:
                        case "message/stream":
                            await SendMessageAsync(context, ctx, tenantId, agent, id, Parse<SendMessageRequest>(parameters), true).ConfigureAwait(false);
                            return;
                        case A2AProtocol.GetTask:
                        case "tasks/get":
                            GetTaskRequest get = Parse<GetTaskRequest>(parameters);
                            Run run = await RequireTaskAsync(ctx, tenantId, agent, get.Id, OperationTypeEnum.Read, context).ConfigureAwait(false);
                            CountTask(run);
                            await SendRpcResultAsync(context, id, A2AMapper.Task(run, true, await ContextIdAsync(run, null, context).ConfigureAwait(false))).ConfigureAwait(false);
                            return;
                        case A2AProtocol.CancelTask:
                        case "tasks/cancel":
                            CancelTaskRequest cancel = Parse<CancelTaskRequest>(parameters);
                            Run toCancel = await RequireTaskAsync(ctx, tenantId, agent, cancel.Id, OperationTypeEnum.Update, context).ConfigureAwait(false);
                            if (RunService.IsTerminal(toCancel.Status))
                            {
                                result = "error";
                    await SendRpcErrorAsync(context, id, Error((int)A2AErrorCode.TaskNotCancelable, "Task " + toCancel.Id + " already finished.")).ConfigureAwait(false);
                                return;
                            }
                            Run cancelled = await _Runs.CancelAsync(toCancel, context.Token).ConfigureAwait(false);
                            CountTask(cancelled);
                            await SendRpcResultAsync(context, id, A2AMapper.Task(cancelled, true, await ContextIdAsync(cancelled, null, context).ConfigureAwait(false))).ConfigureAwait(false);
                            return;
                        case A2AProtocol.ListTasks:
                        case "tasks/list":
                            await ListTasksAsync(context, ctx, tenantId, agent, id, Parse<ListTasksRequest>(parameters)).ConfigureAwait(false);
                            return;
                        case A2AProtocol.SubscribeToTask:
                        case "tasks/resubscribe":
                            SubscribeToTaskRequest subscribe = Parse<SubscribeToTaskRequest>(parameters);
                            Run watched = await RequireTaskAsync(ctx, tenantId, agent, subscribe.Id, OperationTypeEnum.Read, context).ConfigureAwait(false);
                            await StreamAsync(context, id, tenantId, watched).ConfigureAwait(false);
                            return;
                        default:
                            result = "error";
                    await SendRpcErrorAsync(context, id, JsonRpcError.MethodNotFound()).ConfigureAwait(false);
                            return;
                    }
                }
                catch (A2AAccessException e)
                {
                    result = "error";
                    await SendRpcErrorAsync(context, id, Error(e.Code, e.Message)).ConfigureAwait(false);
                }
                catch (NotFoundException e)
                {
                    result = "error";
                    await SendRpcErrorAsync(context, id, Error((int)A2AErrorCode.TaskNotFound, e.Message)).ConfigureAwait(false);
                }
                catch (IdempotencyConflictException e)
                {
                    // A reused messageId with different content (M1-10): HTTP 409 with a JSON-RPC error body.
                    JsonRpcError error = Error(-32602, "messageId " + e.Key + " was already used for task " + e.ExistingRunId + " with different content. Send a new messageId for a new message; resending identical content returns the existing task.");
                    error.Data = new A2AErrorData { Code = "MessageIdConflict", TaskId = e.ExistingRunId };
                    result = "error";
                    await SendRpcErrorAsync(context, id, error, 409).ConfigureAwait(false);
                }
                catch (ValidationException e)
                {
                    JsonRpcError error = Error(-32602, e.Describe());
                    A2AErrorData data = new A2AErrorData { Code = "ValidationFailed" };
                    if (e.Fields.Count > 0)
                    {
                        data.Errors = e.Fields;
                        data.FieldCodes = e.Fields.Keys.ToDictionary(k => k, k => e.CodeFor(k));
                    }
                    error.Data = data;
                    result = "error";
                    await SendRpcErrorAsync(context, id, error).ConfigureAwait(false);
                }
                catch (ConflictException e)
                {
                    JsonRpcError error = Error(-32602, e.Code + ": " + e.Message);
                    error.Data = new A2AErrorData { Code = e.Code };
                    result = "error";
                    await SendRpcErrorAsync(context, id, error).ConfigureAwait(false);
                }
                catch (Exception e) when (e is JsonException || e is ArgumentException)
                {
                    JsonRpcError error = Error(-32602, "InvalidParams: " + e.Message);
                    error.Data = new A2AErrorData { Code = "InvalidParams" };
                    result = "error";
                    await SendRpcErrorAsync(context, id, error).ConfigureAwait(false);
                }
                catch (Exception e) when (DatabaseFailures.Classify(e) != DatabaseFailureEnum.None && !context.Response.ResponseSent)
                {
                    // A database outage or an exhausted pool: a JSON-RPC error with HTTP 503 and Retry-After (G-25).
                    bool busy = DatabaseFailures.Classify(e) == DatabaseFailureEnum.Busy;
                    string code = busy ? "DatabaseBusy" : "DatabaseUnavailable";
                    JsonRpcError error = Error(-32603, code + ": " + (busy ? "The database has no free connections right now." : "The database cannot be reached right now.") + " Retry after the number of seconds in Retry-After.");
                    error.Data = new A2AErrorData { Code = code };
                    result = "error";
                    context.Response.Headers["Retry-After"] = Math.Max(1, _Context.Settings.Rest.DatabaseRetryAfterSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
                    await SendRpcErrorAsync(context, id, error, 503).ConfigureAwait(false);
                }
            }
            catch (Exception e)
            {
                result = "error";
                GarrisonTracing.Fail(span, e);
                throw;
            }
            finally
            {
                if (result == "ok") GarrisonTracing.Ok(span);
                else GarrisonTracing.Fail(span, "JSON-RPC error");
                span?.Dispose();
                TagList tags = GarrisonMetrics.Tags("method", methodLabel, "result", result);
                GarrisonMetrics.Count(GarrisonMetricCatalog.A2aRequests, 1, tags);
                GarrisonMetrics.Observe(GarrisonMetricCatalog.A2aDuration, GarrisonMetrics.SecondsSince(start), tags);
            }
        }

        private static string MethodLabel(string method)
        {
            switch (method)
            {
                case A2AProtocol.SendMessage:
                case "message/send":
                    return "SendMessage";
                case A2AProtocol.SendStreamingMessage:
                case "message/stream":
                    return "SendStreamingMessage";
                case A2AProtocol.GetTask:
                case "tasks/get":
                    return "GetTask";
                case A2AProtocol.CancelTask:
                case "tasks/cancel":
                    return "CancelTask";
                case A2AProtocol.ListTasks:
                case "tasks/list":
                    return "ListTasks";
                case A2AProtocol.SubscribeToTask:
                case "tasks/resubscribe":
                    return "SubscribeToTask";
                default:
                    return "unknown";
            }
        }

        private static void CountTask(Run run)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.A2aTasks, "state", A2AMapper.State(run.Status).ToString());
        }

        private async Task SendMessageAsync(HttpContextBase context, RequestContext ctx, string tenantId, Agent agent, object? id, SendMessageRequest request, bool streaming)
        {
            await RequireAsync(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, context).ConfigureAwait(false);
            InvocationOptions options = new InvocationOptions();
            options.Input = A2AMapper.InputText(request.Message);
            if (String.IsNullOrWhiteSpace(options.Input)) throw new ValidationException("The message has no text or data parts.");
            options.IdempotencyKey = String.IsNullOrEmpty(request.Message.MessageId) ? null : "a2a:" + request.Message.MessageId;

            // Every A2A message belongs to a conversation (P12.1): a known contextId continues it as the next turn, an
            // unknown one starts a conversation for it, and a message without one starts a new conversation whose
            // identifier is the contextId of the task.
            options.ContextId = String.IsNullOrWhiteSpace(request.Message.ContextId) ? null : request.Message.ContextId;
            options.StartConversation = true;
            if (request.Metadata != null)
            {
                foreach (KeyValuePair<string, object?> entry in request.Metadata.Where(m => m.Key.StartsWith("garrison.parameter.", StringComparison.Ordinal)))
                {
                    options.Parameters[entry.Key.Substring("garrison.parameter.".Length)] = entry.Value?.ToString() ?? String.Empty;
                }
            }
            options.Wait = !streaming && (request.Configuration == null || !request.Configuration.ReturnImmediately);
            options.WaitSeconds = _Context.Settings.Mcp.MaxToolWaitSeconds;
            options.CancelOnDisconnect = true;
            options.CallerGone = () => context.RequestAborted && !_Context.IsDraining;
            options.DisconnectReason = "the A2A client disconnected from a blocking SendMessage";
            options.Surface = "a2a";

            Run run = await _Invoker.InvokeAsync(ctx, tenantId, agent, options, context.Token).ConfigureAwait(false);
            if (streaming)
            {
                try
                {
                    await StreamAsync(context, id, tenantId, run).ConfigureAwait(false);
                }
                catch (Exception e) when ((e is OperationCanceledException || e is IOException || e is SocketException || e is ObjectDisposedException) && !_Context.IsDraining)
                {
                    // The client closed the stream of the task it started: nobody is listening, so stop the task.
                    await _Runs.CancelAbandonedAsync(tenantId, run.Id, "the A2A client disconnected from SendStreamingMessage", CancellationToken.None).ConfigureAwait(false);
                    throw;
                }
                if (context.Token.IsCancellationRequested && context.RequestAborted && !_Context.IsDraining)
                {
                    await _Runs.CancelAbandonedAsync(tenantId, run.Id, "the A2A client disconnected from SendStreamingMessage", CancellationToken.None).ConfigureAwait(false);
                }
                return;
            }

            SendMessageResponse response = new SendMessageResponse();
            response.Task = A2AMapper.Task(run, true, await ContextIdAsync(run, null, context).ConfigureAwait(false));
            CountTask(run);
            await SendRpcResultAsync(context, id, response).ConfigureAwait(false);
        }

        private async Task StreamAsync(HttpContextBase context, object? id, string tenantId, Run run)
        {
            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/event-stream";
            context.Response.Headers.Add("Cache-Control", "no-cache");
            context.Response.Headers.Add("X-Accel-Buffering", "no");
            context.Response.ServerSentEvents = true;

            _Context.Activity.StreamOpened();
            StreamTelemetry.Opened("a2a");
            try
            {
                string contextId = await ContextIdAsync(run, null, context).ConfigureAwait(false);
                StreamResponse first = new StreamResponse();
                first.Task = A2AMapper.Task(run, false, contextId);
                await SendStreamEventAsync(context, id, first, false).ConfigureAwait(false);

                TaskState lastState = A2AMapper.State(run.Status);
                using (RunSignalSubscription signal = _Signals.Subscribe(run.Id))
                {
                    while (!context.Token.IsCancellationRequested)
                    {
                        Run? current = await _Context.Database.Runs.ReadAsync(tenantId, run.Id, context.Token).ConfigureAwait(false);
                        if (current == null) break;
                        TaskState state = A2AMapper.State(current.Status);
                        bool terminal = RunService.IsTerminal(current.Status);

                        if (terminal && current.Status == RunStatusEnum.Succeeded)
                        {
                            StreamResponse artifact = new StreamResponse();
                            artifact.ArtifactUpdate = new TaskArtifactUpdateEvent { TaskId = current.Id, ContextId = contextId, Artifact = A2AMapper.ResultArtifact(current), Append = false, LastChunk = true };
                            await SendStreamEventAsync(context, id, artifact, false).ConfigureAwait(false);
                        }

                        if (state != lastState || terminal)
                        {
                            StreamResponse update = new StreamResponse();
                            update.StatusUpdate = new TaskStatusUpdateEvent { TaskId = current.Id, ContextId = contextId, Status = A2AMapper.Status(current) };
                            await SendStreamEventAsync(context, id, update, terminal).ConfigureAwait(false);
                            CountTask(current);
                            lastState = state;
                        }

                        if (terminal) return;
                        if (_Context.IsDraining) return;
                        using (CancellationTokenSource wait = CancellationTokenSource.CreateLinkedTokenSource(context.Token, _Context.Stopping))
                        {
                            try
                            {
                                await signal.WaitAsync(_Options.EventPollMs * 4, wait.Token).ConfigureAwait(false);
                            }
                            catch (OperationCanceledException) when (_Context.IsDraining && !context.Token.IsCancellationRequested)
                            {
                                return;
                            }
                        }
                    }
                }
            }
            finally
            {
                _Context.Activity.StreamClosed();
                StreamTelemetry.Closed("a2a");
            }
        }

        private async Task ListTasksAsync(HttpContextBase context, RequestContext ctx, string tenantId, Agent agent, object? id, ListTasksRequest request)
        {
            await RequireAsync(ctx, tenantId, ResourceTypeEnum.Run, OperationTypeEnum.Read, null, context).ConfigureAwait(false);
            RunFilter filter = new RunFilter();
            filter.TenantId = tenantId;
            filter.AgentId = agent.Id;
            if (!String.IsNullOrEmpty(request.ContextId))
            {
                // A conversation's context lists its turns; any other context identifier is a root run (delegation tree).
                Conversation? conversation = await _Context.Database.Conversations.ReadAsync(tenantId, request.ContextId, context.Token).ConfigureAwait(false);
                if (conversation == null || conversation.AgentId != agent.Id) conversation = await _Context.Database.Conversations.ReadByContextIdAsync(tenantId, agent.Id, request.ContextId, context.Token).ConfigureAwait(false);
                if (conversation != null && conversation.AgentId == agent.Id) filter.ConversationId = conversation.Id;
                else filter.RootRunId = request.ContextId;
            }
            filter.MaxResults = Math.Clamp(request.PageSize ?? 50, 1, 100);
            if (!String.IsNullOrEmpty(request.PageToken) && Int32.TryParse(request.PageToken, out int skip)) filter.Skip = skip;
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            ListTasksResponse response = new ListTasksResponse();
            Dictionary<string, string> contexts = new Dictionary<string, string>(StringComparer.Ordinal);
            List<AgentTask> tasks = new List<AgentTask>();
            foreach (Run listed in page.Objects) tasks.Add(A2AMapper.Task(listed, request.IncludeArtifacts ?? false, await ContextIdAsync(listed, contexts, context).ConfigureAwait(false)));
            response.Tasks = tasks;
            response.PageSize = filter.MaxResults;
            response.TotalSize = (int)Math.Min(page.TotalRecords, Int32.MaxValue);
            response.NextPageToken = page.EndOfResults ? String.Empty : (filter.Skip + page.Objects.Count).ToString();
            await SendRpcResultAsync(context, id, response).ConfigureAwait(false);
        }

        private async Task<Run> RequireTaskAsync(RequestContext ctx, string tenantId, Agent agent, string taskId, OperationTypeEnum operation, HttpContextBase context)
        {
            Run? run = String.IsNullOrEmpty(taskId) ? null : await _Context.Database.Runs.ReadAsync(tenantId, taskId, context.Token).ConfigureAwait(false);
            if (run == null || run.AgentId != agent.Id) throw new NotFoundException("Task " + taskId + " not found.");
            await RequireAsync(ctx, tenantId, ResourceTypeEnum.Run, operation, run.Id, context).ConfigureAwait(false);
            return run;
        }

        private async Task<string> ContextIdAsync(Run run, Dictionary<string, string>? cache, HttpContextBase context)
        {
            if (String.IsNullOrEmpty(run.ConversationId)) return A2AMapper.ContextId(run);
            if (cache != null && cache.TryGetValue(run.ConversationId, out string? cached)) return cached;
            Conversation? conversation = await _Context.Database.Conversations.ReadAsync(run.TenantId, run.ConversationId, context.Token).ConfigureAwait(false);
            string contextId = conversation?.EffectiveContextId() ?? run.ConversationId;
            if (cache != null) cache[run.ConversationId] = contextId;
            return contextId;
        }

        private async Task RequireAsync(RequestContext ctx, string tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, HttpContextBase context)
        {
            AuthorizationDecision decision = await _Context.Authorization.AuthorizeAsync(ctx, tenantId, resourceType, operation, resourceId, context.Token).ConfigureAwait(false);
            if (!decision.Permitted) throw new A2AAccessException(-32007, "Not permitted: " + decision.Reason);
        }

        private async Task<AgentCard> BuildCardAsync(HttpContextBase context, string tenantId, Agent agent)
        {
            return await _Context.Get<AgentCardService>().BuildCardAsync(tenantId, agent, BaseUrl(context), context.Token).ConfigureAwait(false);
        }

        private string BaseUrl(HttpContextBase context)
        {
            return ExternalUrls.RestBaseUrl(_Context, context);
        }

        private static T Parse<T>(JsonElement parameters) where T : new()
        {
            if (parameters.ValueKind == JsonValueKind.Undefined || parameters.ValueKind == JsonValueKind.Null) return new T();
            return JsonSerializer.Deserialize<T>(parameters.GetRawText(), A2AJson.DefaultOptions) ?? new T();
        }

        private static JsonRpcError Error(int code, string message)
        {
            JsonRpcError error = new JsonRpcError();
            error.Code = code;
            error.Message = message;
            return error;
        }

        private static async Task SendA2AJsonAsync(HttpContextBase context, int status, object body)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.Send(JsonSerializer.Serialize(body, body.GetType(), A2AJson.DefaultOptions)).ConfigureAwait(false);
        }

        private static async Task SendRpcResultAsync(HttpContextBase context, object? id, object result)
        {
            JsonRpcResponse response = new JsonRpcResponse();
            response.Id = id;
            response.Result = result;
            await SendA2AJsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private static async Task SendRpcErrorAsync(HttpContextBase context, object? id, JsonRpcError error, int status = 200)
        {
            JsonRpcResponse response = new JsonRpcResponse();
            response.Id = id;
            response.Error = error;
            await SendA2AJsonAsync(context, status, response).ConfigureAwait(false);
        }

        private static async Task SendStreamEventAsync(HttpContextBase context, object? id, StreamResponse payload, bool final)
        {
            JsonRpcResponse response = new JsonRpcResponse();
            response.Id = id;
            response.Result = payload;
            ServerSentEvent message = new ServerSentEvent();
            message.Data = JsonSerializer.Serialize(response, A2AJson.DefaultOptions);
            await context.Response.SendEvent(message, final, context.Token).ConfigureAwait(false);
            StreamTelemetry.Sent("a2a");
        }

        #endregion
    }
}
