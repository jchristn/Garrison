namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Serialization;
    using Garrison.Harnesses.Execution;

    /// <summary>
    /// Drives <c>codex app-server</c> over JSON-RPC on its stdin and stdout (P12.2a). The protocol steps are separate
    /// methods so a multi-turn conversation can reuse them: <see cref="InitializeAsync"/> (handshake and optional API
    /// key login), <see cref="StartThreadAsync"/> or <see cref="ResumeThreadAsync"/>, then <see cref="StartTurnAsync"/>
    /// and <see cref="WaitForTurnAsync"/> once per turn. As an <see cref="IStdinDriver"/>, <see cref="DriveAsync"/>
    /// runs the single turn a Garrison run needs and returns, and the process runner then closes stdin, which ends the
    /// app-server. The caller passes every stdout line to <see cref="HandleLine"/>; the output parser reads the same
    /// lines for events, so this class only tracks what the protocol needs (responses and turn completion). Requests
    /// the app-server sends are answered by <see cref="ServerRequestHandler"/>, which declines approvals by default
    /// because a headless run has nobody to ask. Thread-safe.
    /// </summary>
    public class CodexAppServerDriver : IStdinDriver, IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Session settings.
        /// </summary>
        public CodexAppServerOptions Options { get; }

        /// <summary>
        /// The JSON-RPC connection to the app-server.
        /// </summary>
        public JsonRpcConnection Connection { get; }

        /// <summary>
        /// Answers requests the app-server sends (approvals, elicitations, token refresh). Default
        /// <see cref="HeadlessRequestAsync"/>. Setting null answers every request with "method not found".
        /// </summary>
        public Func<JsonRpcMessage, CancellationToken, Task<object?>>? ServerRequestHandler
        {
            get
            {
                return Connection.RequestHandler;
            }
            set
            {
                Connection.RequestHandler = value;
            }
        }

        /// <summary>
        /// Identifier of the thread started or resumed last, or null.
        /// </summary>
        public string? ThreadId
        {
            get
            {
                lock (_Lock)
                {
                    return _ThreadId;
                }
            }
        }

        /// <summary>
        /// Model the app-server reported for the thread, or null.
        /// </summary>
        public string? Model
        {
            get
            {
                lock (_Lock)
                {
                    return _Model;
                }
            }
        }

        #endregion

        #region Private-Members

        private readonly object _Lock = new object();
        private readonly Dictionary<string, TaskCompletionSource<CodexTurn>> _Turns = new Dictionary<string, TaskCompletionSource<CodexTurn>>(StringComparer.Ordinal);
        private string? _ThreadId = null;
        private string? _Model = null;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Session settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public CodexAppServerDriver(CodexAppServerOptions options)
        {
            Options = options ?? throw new ArgumentNullException(nameof(options));
            Connection = new JsonRpcConnection();
            Connection.RequestHandler = HeadlessRequestAsync;
            Connection.NotificationReceived += OnNotification;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Answer an app-server request the way a headless run must: decline command and file change approvals,
        /// decline MCP elicitations, and refuse everything else (including ChatGPT token refresh, which the Garrison
        /// control plane owns) with a JSON-RPC error.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result object to send.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="JsonRpcException">Thrown to answer with an error.</exception>
        public static Task<object?> HeadlessRequestAsync(JsonRpcMessage request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            token.ThrowIfCancellationRequested();
            switch (request.Method)
            {
                case "item/commandExecution/requestApproval":
                case "item/fileChange/requestApproval":
                    CodexApprovalResponse approval = new CodexApprovalResponse();
                    approval.Decision = "decline";
                    return Task.FromResult<object?>(approval);
                case "mcpServer/elicitation/request":
                    CodexElicitationResponse elicitation = new CodexElicitationResponse();
                    elicitation.Action = "decline";
                    return Task.FromResult<object?>(elicitation);
                case "account/chatgptAuthTokens/refresh":
                    throw new JsonRpcException(JsonRpcConnection.InternalError, "Token refresh is not available to this run.", request.Method);
                default:
                    throw new JsonRpcException(JsonRpcConnection.MethodNotFound, "Method " + request.Method + " is not supported by this client.", request.Method);
            }
        }

        /// <summary>
        /// Attach the app-server's stdin.
        /// </summary>
        /// <param name="stdin">Writer.</param>
        /// <exception cref="ArgumentNullException">Thrown when stdin is null.</exception>
        public void Attach(TextWriter stdin)
        {
            Connection.Attach(stdin);
        }

        /// <summary>
        /// Handle one stdout line from the app-server. Call for every line, in order.
        /// </summary>
        /// <param name="line">Line.</param>
        /// <returns>The JSON-RPC message, or null when the line is not one.</returns>
        public JsonRpcMessage? HandleLine(string? line)
        {
            return Connection.HandleLine(line);
        }

        /// <summary>
        /// Handshake: <c>initialize</c>, the <c>initialized</c> notification, then <c>account/login/start</c> with
        /// <see cref="CodexAppServerOptions.ApiKey"/> when one is set.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="JsonRpcException">Thrown when the app-server rejects a step.</exception>
        /// <exception cref="InvalidOperationException">Thrown when no writer is attached.</exception>
        public async Task InitializeAsync(CancellationToken token)
        {
            CodexInitializeParams initialize = new CodexInitializeParams();
            initialize.ClientInfo.Name = Options.ClientName;
            initialize.ClientInfo.Version = Options.ClientVersion;
            await Connection.SendRequestAsync("initialize", initialize, token).ConfigureAwait(false);
            await Connection.SendNotificationAsync("initialized", null, token).ConfigureAwait(false);

            if (!String.IsNullOrEmpty(Options.ApiKey))
            {
                CodexLoginParams login = new CodexLoginParams();
                login.ApiKey = Options.ApiKey;
                await Connection.SendRequestAsync("account/login/start", login, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Start a new thread (<c>thread/start</c>) in <see cref="CodexAppServerOptions.Cwd"/>.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Thread identifier.</returns>
        /// <exception cref="JsonRpcException">Thrown when the app-server rejects the request or returns no thread.</exception>
        public async Task<string> StartThreadAsync(CancellationToken token)
        {
            CodexThreadStartParams parameters = new CodexThreadStartParams();
            parameters.Cwd = Options.Cwd;
            parameters.ApprovalPolicy = String.IsNullOrEmpty(Options.ApprovalPolicy) ? null : Options.ApprovalPolicy;
            CodexThreadResult? result = await Connection.SendRequestAsync<CodexThreadResult>("thread/start", parameters, token).ConfigureAwait(false);
            return Remember(result, "thread/start");
        }

        /// <summary>
        /// Resume a saved thread (<c>thread/resume</c>).
        /// </summary>
        /// <param name="threadId">Thread identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Thread identifier.</returns>
        /// <exception cref="ArgumentNullException">Thrown when threadId is null or empty.</exception>
        /// <exception cref="JsonRpcException">Thrown when the app-server rejects the request or returns no thread.</exception>
        public async Task<string> ResumeThreadAsync(string threadId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(threadId)) throw new ArgumentNullException(nameof(threadId));
            CodexThreadResumeParams parameters = new CodexThreadResumeParams();
            parameters.ThreadId = threadId;
            parameters.Cwd = Options.Cwd;
            parameters.ApprovalPolicy = String.IsNullOrEmpty(Options.ApprovalPolicy) ? null : Options.ApprovalPolicy;
            CodexThreadResult? result = await Connection.SendRequestAsync<CodexThreadResult>("thread/resume", parameters, token).ConfigureAwait(false);
            return Remember(result, "thread/resume");
        }

        /// <summary>
        /// Start a turn (<c>turn/start</c>) with one text input.
        /// </summary>
        /// <param name="threadId">Thread identifier.</param>
        /// <param name="prompt">Prompt text.</param>
        /// <param name="outputSchemaJson">JSON Schema for the final assistant message, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Turn identifier.</returns>
        /// <exception cref="ArgumentNullException">Thrown when threadId is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when outputSchemaJson is not valid JSON.</exception>
        /// <exception cref="JsonRpcException">Thrown when the app-server rejects the request or returns no turn.</exception>
        public async Task<string> StartTurnAsync(string threadId, string? prompt, string? outputSchemaJson, CancellationToken token)
        {
            if (String.IsNullOrEmpty(threadId)) throw new ArgumentNullException(nameof(threadId));
            CodexTurnStartParams parameters = new CodexTurnStartParams();
            parameters.ThreadId = threadId;
            CodexUserInput input = new CodexUserInput();
            input.Text = prompt ?? String.Empty;
            parameters.Input.Add(input);
            if (!String.IsNullOrWhiteSpace(outputSchemaJson))
            {
                try
                {
                    using (JsonDocument schema = JsonDocument.Parse(outputSchemaJson))
                    {
                        parameters.OutputSchema = schema.RootElement.Clone();
                    }
                }
                catch (JsonException e)
                {
                    throw new ArgumentException("The output schema is not valid JSON: " + e.Message, nameof(outputSchemaJson), e);
                }
            }

            CodexTurnResult? result = await Connection.SendRequestAsync<CodexTurnResult>("turn/start", parameters, token).ConfigureAwait(false);
            string? turnId = result?.Turn?.Id;
            if (String.IsNullOrEmpty(turnId)) throw new JsonRpcException(JsonRpcConnection.InternalError, "turn/start returned no turn.", "turn/start");
            return turnId;
        }

        /// <summary>
        /// Wait for a turn to finish (<c>turn/completed</c>), including a completion that arrived before this call.
        /// </summary>
        /// <param name="turnId">Turn identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The finished turn (status completed, failed, or interrupted).</returns>
        /// <exception cref="ArgumentNullException">Thrown when turnId is null or empty.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled first.</exception>
        public async Task<CodexTurn> WaitForTurnAsync(string turnId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(turnId)) throw new ArgumentNullException(nameof(turnId));
            TaskCompletionSource<CodexTurn> completion = TurnCompletion(turnId);
            try
            {
                return await completion.Task.WaitAsync(token).ConfigureAwait(false);
            }
            finally
            {
                lock (_Lock)
                {
                    if (completion.Task.IsCompleted) _Turns.Remove(turnId);
                }
            }
        }

        /// <summary>
        /// Start a turn and wait for it to finish.
        /// </summary>
        /// <param name="threadId">Thread identifier.</param>
        /// <param name="prompt">Prompt text.</param>
        /// <param name="outputSchemaJson">JSON Schema for the final assistant message, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The finished turn.</returns>
        /// <exception cref="ArgumentNullException">Thrown when threadId is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when outputSchemaJson is not valid JSON.</exception>
        /// <exception cref="JsonRpcException">Thrown when the app-server rejects the turn.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled first.</exception>
        public async Task<CodexTurn> RunTurnAsync(string threadId, string? prompt, string? outputSchemaJson, CancellationToken token)
        {
            string turnId = await StartTurnAsync(threadId, prompt, outputSchemaJson, token).ConfigureAwait(false);
            return await WaitForTurnAsync(turnId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Run one Garrison turn: handshake, start or resume the thread, run the turn with
        /// <see cref="CodexAppServerOptions.Prompt"/>, and return so stdin is closed. A request the app-server rejects
        /// ends the session early; the output parser reports the error from the response line.
        /// </summary>
        /// <param name="stdin">App-server stdin.</param>
        /// <param name="token">Cancelled when the process exits or is stopped.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when stdin is null.</exception>
        public async Task DriveAsync(TextWriter stdin, CancellationToken token)
        {
            if (stdin == null) throw new ArgumentNullException(nameof(stdin));
            Attach(stdin);
            try
            {
                await InitializeAsync(token).ConfigureAwait(false);
                string threadId = String.IsNullOrEmpty(Options.ResumeThreadId)
                    ? await StartThreadAsync(token).ConfigureAwait(false)
                    : await ResumeThreadAsync(Options.ResumeThreadId, token).ConfigureAwait(false);
                await RunTurnAsync(threadId, Options.Prompt, Options.OutputSchemaJson, token).ConfigureAwait(false);
            }
            catch (JsonRpcException)
            {
                // The rejected request's error response is on stdout, where the parser turns it into the run's failure.
            }
            catch (ArgumentException)
            {
                // An unusable output schema; the compiler validates schemas, so this only guards hand-built specs.
            }
            finally
            {
                Connection.Close();
            }
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
        /// Dispose.
        /// </summary>
        /// <param name="disposing">Whether called from <see cref="Dispose()"/>.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                Connection.NotificationReceived -= OnNotification;
                Connection.Dispose();
                lock (_Lock)
                {
                    foreach (TaskCompletionSource<CodexTurn> pending in _Turns.Values) pending.TrySetCanceled();
                    _Turns.Clear();
                }
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private string Remember(CodexThreadResult? result, string method)
        {
            string? threadId = result?.Thread?.Id;
            if (String.IsNullOrEmpty(threadId)) throw new JsonRpcException(JsonRpcConnection.InternalError, method + " returned no thread.", method);
            lock (_Lock)
            {
                _ThreadId = threadId;
                if (!String.IsNullOrEmpty(result!.Model)) _Model = result.Model;
            }
            return threadId;
        }

        private TaskCompletionSource<CodexTurn> TurnCompletion(string turnId)
        {
            lock (_Lock)
            {
                if (!_Turns.TryGetValue(turnId, out TaskCompletionSource<CodexTurn>? completion))
                {
                    completion = new TaskCompletionSource<CodexTurn>(TaskCreationOptions.RunContinuationsAsynchronously);
                    _Turns[turnId] = completion;
                }
                return completion;
            }
        }

        private void OnNotification(JsonRpcMessage message)
        {
            if (message.Method != "turn/completed" || !message.Params.HasValue) return;
            CodexTurnCompletedNotification? completed;
            try
            {
                completed = message.Params.Value.Deserialize<CodexTurnCompletedNotification>(Serializer.Options);
            }
            catch (JsonException)
            {
                return;
            }
            CodexTurn? turn = completed?.Turn;
            if (turn == null || String.IsNullOrEmpty(turn.Id)) return;
            TurnCompletion(turn.Id).TrySetResult(turn);
        }

        #endregion
    }
}
