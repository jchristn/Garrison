namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Sockets;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
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

            _Context.Telemetry.Increment("garrison.a2a.requests", new RadiantTag("method", method));
            Agent? agent = await _Context.Database.Agents.ReadByNameAsync(tenantId, agentName, context.Token).ConfigureAwait(false);
            RequestContext ctx = RouteHelpers.Context(context);
            if (agent == null || !agent.ExposeA2A || (ctx.TenantId != tenantId && !ctx.IsAdmin))
            {
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
                        await SendRpcResultAsync(context, id, A2AMapper.Task(run)).ConfigureAwait(false);
                        return;
                    case A2AProtocol.CancelTask:
                    case "tasks/cancel":
                        CancelTaskRequest cancel = Parse<CancelTaskRequest>(parameters);
                        Run toCancel = await RequireTaskAsync(ctx, tenantId, agent, cancel.Id, OperationTypeEnum.Update, context).ConfigureAwait(false);
                        if (RunService.IsTerminal(toCancel.Status))
                        {
                            await SendRpcErrorAsync(context, id, Error((int)A2AErrorCode.TaskNotCancelable, "Task " + toCancel.Id + " already finished.")).ConfigureAwait(false);
                            return;
                        }
                        Run cancelled = await _Runs.CancelAsync(toCancel, context.Token).ConfigureAwait(false);
                        await SendRpcResultAsync(context, id, A2AMapper.Task(cancelled)).ConfigureAwait(false);
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
                        await SendRpcErrorAsync(context, id, JsonRpcError.MethodNotFound()).ConfigureAwait(false);
                        return;
                }
            }
            catch (A2AAccessException e)
            {
                await SendRpcErrorAsync(context, id, Error(e.Code, e.Message)).ConfigureAwait(false);
            }
            catch (NotFoundException e)
            {
                await SendRpcErrorAsync(context, id, Error((int)A2AErrorCode.TaskNotFound, e.Message)).ConfigureAwait(false);
            }
            catch (IdempotencyConflictException e)
            {
                // A reused messageId with different content (M1-10): HTTP 409 with a JSON-RPC error body.
                JsonRpcError error = Error(-32602, "messageId " + e.Key + " was already used for task " + e.ExistingRunId + " with different content. Send a new messageId for a new message; resending identical content returns the existing task.");
                error.Data = new A2AErrorData { Code = "MessageIdConflict", TaskId = e.ExistingRunId };
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
                await SendRpcErrorAsync(context, id, error).ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                JsonRpcError error = Error(-32602, e.Code + ": " + e.Message);
                error.Data = new A2AErrorData { Code = e.Code };
                await SendRpcErrorAsync(context, id, error).ConfigureAwait(false);
            }
            catch (Exception e) when (e is JsonException || e is ArgumentException)
            {
                JsonRpcError error = Error(-32602, "InvalidParams: " + e.Message);
                error.Data = new A2AErrorData { Code = "InvalidParams" };
                await SendRpcErrorAsync(context, id, error).ConfigureAwait(false);
            }
        }

        private async Task SendMessageAsync(HttpContextBase context, RequestContext ctx, string tenantId, Agent agent, object? id, SendMessageRequest request, bool streaming)
        {
            await RequireAsync(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, context).ConfigureAwait(false);
            InvocationOptions options = new InvocationOptions();
            options.Input = A2AMapper.InputText(request.Message);
            if (String.IsNullOrWhiteSpace(options.Input)) throw new ValidationException("The message has no text or data parts.");
            options.IdempotencyKey = String.IsNullOrEmpty(request.Message.MessageId) ? null : "a2a:" + request.Message.MessageId;
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
            response.Task = A2AMapper.Task(run);
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
            try
            {
                StreamResponse first = new StreamResponse();
                first.Task = A2AMapper.Task(run, false);
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
                            artifact.ArtifactUpdate = new TaskArtifactUpdateEvent { TaskId = current.Id, ContextId = A2AMapper.Task(current, false).ContextId, Artifact = A2AMapper.ResultArtifact(current), Append = false, LastChunk = true };
                            await SendStreamEventAsync(context, id, artifact, false).ConfigureAwait(false);
                        }

                        if (state != lastState || terminal)
                        {
                            StreamResponse update = new StreamResponse();
                            update.StatusUpdate = new TaskStatusUpdateEvent { TaskId = current.Id, ContextId = A2AMapper.Task(current, false).ContextId, Status = A2AMapper.Status(current) };
                            await SendStreamEventAsync(context, id, update, terminal).ConfigureAwait(false);
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
            }
        }

        private async Task ListTasksAsync(HttpContextBase context, RequestContext ctx, string tenantId, Agent agent, object? id, ListTasksRequest request)
        {
            await RequireAsync(ctx, tenantId, ResourceTypeEnum.Run, OperationTypeEnum.Read, null, context).ConfigureAwait(false);
            RunFilter filter = new RunFilter();
            filter.TenantId = tenantId;
            filter.AgentId = agent.Id;
            filter.RootRunId = request.ContextId;
            filter.MaxResults = Math.Clamp(request.PageSize ?? 50, 1, 100);
            if (!String.IsNullOrEmpty(request.PageToken) && Int32.TryParse(request.PageToken, out int skip)) filter.Skip = skip;
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            ListTasksResponse response = new ListTasksResponse();
            response.Tasks = page.Objects.Select(r => A2AMapper.Task(r, request.IncludeArtifacts ?? false)).ToList();
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

        private async Task RequireAsync(RequestContext ctx, string tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, HttpContextBase context)
        {
            AuthorizationDecision decision = await _Context.Authorization.AuthorizeAsync(ctx, tenantId, resourceType, operation, resourceId, context.Token).ConfigureAwait(false);
            if (!decision.Permitted) throw new A2AAccessException(-32007, "Not permitted: " + decision.Reason);
        }

        private async Task<AgentCard> BuildCardAsync(HttpContextBase context, string tenantId, Agent agent)
        {
            string skillDescription = agent.Description ?? agent.Name;
            PromptTemplate? template = null;
            if (!String.IsNullOrEmpty(agent.SkillDescriptionTemplateId)) template = await _Context.Database.PromptTemplates.ReadAsync(tenantId, agent.SkillDescriptionTemplateId, context.Token).ConfigureAwait(false);
            if (template != null) skillDescription = template.Content.Replace("{{agent.name}}", agent.Name).Replace("{{agent.description}}", agent.Description ?? String.Empty);
            return A2AMapper.Card(agent, BaseUrl(context) + "/v1.0/a2a/" + tenantId + "/" + agent.Name, skillDescription);
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
        }

        #endregion
    }
}
