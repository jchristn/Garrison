namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Collections.Concurrent;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Serialization;

    /// <summary>
    /// A line-delimited JSON-RPC peer over a harness's stdin and stdout (one JSON object per line, as
    /// <c>codex app-server</c> speaks it). Requests and notifications are written to the attached writer; every stdout
    /// line is passed to <see cref="HandleLine"/>, which completes pending requests, raises
    /// <see cref="NotificationReceived"/>, and answers the peer's own requests through <see cref="RequestHandler"/>
    /// without blocking the caller. Thread-safe: writes are serialized, and <see cref="HandleLine"/> may run on the
    /// stdout reader thread while requests are sent from another.
    /// </summary>
    public class JsonRpcConnection : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// JSON-RPC error code for a method the receiver does not support.
        /// </summary>
        public static readonly long MethodNotFound = -32601;

        /// <summary>
        /// JSON-RPC error code for an internal error.
        /// </summary>
        public static readonly long InternalError = -32603;

        /// <summary>
        /// Answers requests the peer sends (for example approval prompts). Returns the result object to send, or throws
        /// <see cref="JsonRpcException"/> to answer with an error. Null answers every request with
        /// <see cref="MethodNotFound"/>. Called on a thread-pool thread, never on the thread that calls
        /// <see cref="HandleLine"/>.
        /// </summary>
        public Func<JsonRpcMessage, CancellationToken, Task<object?>>? RequestHandler { get; set; } = null;

        /// <summary>
        /// Raised for each notification, on the thread that calls <see cref="HandleLine"/>, in stdout order. Handlers
        /// must not block.
        /// </summary>
        public event Action<JsonRpcMessage>? NotificationReceived;

        /// <summary>
        /// Whether a writer is attached and the connection is not closed.
        /// </summary>
        public bool IsOpen
        {
            get
            {
                return _Writer != null && !_Closed.IsCancellationRequested;
            }
        }

        #endregion

        #region Private-Members

        private readonly ConcurrentDictionary<long, JsonRpcPendingRequest> _Pending = new ConcurrentDictionary<long, JsonRpcPendingRequest>();
        private readonly SemaphoreSlim _WriteLock = new SemaphoreSlim(1, 1);
        private readonly CancellationTokenSource _Closed = new CancellationTokenSource();
        private TextWriter? _Writer = null;
        private long _NextId = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate. Attach a writer before sending.
        /// </summary>
        public JsonRpcConnection()
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Attach the writer that reaches the peer (the harness's stdin). Replaces any earlier writer.
        /// </summary>
        /// <param name="writer">Writer.</param>
        /// <exception cref="ArgumentNullException">Thrown when writer is null.</exception>
        public void Attach(TextWriter writer)
        {
            _Writer = writer ?? throw new ArgumentNullException(nameof(writer));
        }

        /// <summary>
        /// Send a request and wait for its result.
        /// </summary>
        /// <param name="method">Method.</param>
        /// <param name="parameters">Typed parameters, or null to omit them.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Raw result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when method is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when no writer is attached.</exception>
        /// <exception cref="JsonRpcException">Thrown when the peer answers with an error.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled or when the connection closes first.</exception>
        public async Task<JsonElement> SendRequestAsync(string method, object? parameters, CancellationToken token)
        {
            if (String.IsNullOrEmpty(method)) throw new ArgumentNullException(nameof(method));
            long id = Interlocked.Increment(ref _NextId);
            JsonRpcPendingRequest pending = new JsonRpcPendingRequest(method);
            _Pending[id] = pending;
            try
            {
                JsonRpcRequest request = new JsonRpcRequest();
                request.Id = id;
                request.Method = method;
                request.Params = parameters;
                await WriteAsync(request, token).ConfigureAwait(false);

                using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, _Closed.Token))
                {
                    return await pending.Completion.Task.WaitAsync(linked.Token).ConfigureAwait(false);
                }
            }
            finally
            {
                _Pending.TryRemove(id, out JsonRpcPendingRequest? _);
            }
        }

        /// <summary>
        /// Send a request and deserialize its result.
        /// </summary>
        /// <typeparam name="T">Result type.</typeparam>
        /// <param name="method">Method.</param>
        /// <param name="parameters">Typed parameters, or null to omit them.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result, or null when the result is JSON null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when method is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when no writer is attached.</exception>
        /// <exception cref="JsonRpcException">Thrown when the peer answers with an error or a result of the wrong shape.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled or when the connection closes first.</exception>
        public async Task<T?> SendRequestAsync<T>(string method, object? parameters, CancellationToken token) where T : class
        {
            JsonElement result = await SendRequestAsync(method, parameters, token).ConfigureAwait(false);
            try
            {
                return result.Deserialize<T>(Serializer.Options);
            }
            catch (JsonException e)
            {
                throw new JsonRpcException(InternalError, "The result of " + method + " could not be read: " + e.Message, method);
            }
        }

        /// <summary>
        /// Send a notification (no answer expected).
        /// </summary>
        /// <param name="method">Method.</param>
        /// <param name="parameters">Typed parameters, or null to omit them.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when method is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when no writer is attached.</exception>
        public Task SendNotificationAsync(string method, object? parameters, CancellationToken token)
        {
            if (String.IsNullOrEmpty(method)) throw new ArgumentNullException(nameof(method));
            JsonRpcRequest notification = new JsonRpcRequest();
            notification.Method = method;
            notification.Params = parameters;
            return WriteAsync(notification, token);
        }

        /// <summary>
        /// Handle one line read from the peer. Lines that are not JSON-RPC messages are ignored.
        /// </summary>
        /// <param name="line">Line without the trailing newline; null is ignored.</param>
        /// <returns>The message, or null when the line is not a JSON-RPC message.</returns>
        public JsonRpcMessage? HandleLine(string? line)
        {
            if (String.IsNullOrWhiteSpace(line)) return null;
            string trimmed = line.Trim();
            if (!trimmed.StartsWith("{", StringComparison.Ordinal)) return null;

            JsonRpcMessage? message;
            try
            {
                message = JsonSerializer.Deserialize<JsonRpcMessage>(trimmed, Serializer.Options);
            }
            catch (JsonException)
            {
                return null;
            }
            if (message == null) return null;

            if (message.IsResponse)
            {
                long? id = NumericId(message.Id!.Value);
                if (id.HasValue && _Pending.TryGetValue(id.Value, out JsonRpcPendingRequest? pending))
                {
                    if (message.Error != null) pending.Completion.TrySetException(new JsonRpcException(message.Error.Code, message.Error.Message, pending.Method));
                    else pending.Completion.TrySetResult(message.Result.HasValue ? message.Result.Value.Clone() : default);
                }
            }
            else if (message.IsRequest)
            {
                _ = Task.Run(() => AnswerAsync(message));
            }
            else if (message.IsNotification)
            {
                NotificationReceived?.Invoke(message);
            }
            return message;
        }

        /// <summary>
        /// Close the connection: pending and later requests end with <see cref="OperationCanceledException"/>. Does not
        /// close the writer; the owner of the process closes stdin.
        /// </summary>
        public void Close()
        {
            if (_Disposed) return;
            try
            {
                _Closed.Cancel();
            }
            catch (ObjectDisposedException)
            {
            }
            foreach (JsonRpcPendingRequest pending in _Pending.Values.ToList()) pending.Completion.TrySetCanceled();
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
                Close();
                _Closed.Dispose();
                _WriteLock.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task WriteAsync(object message, CancellationToken token)
        {
            TextWriter writer = _Writer ?? throw new InvalidOperationException("No writer is attached to the JSON-RPC connection.");
            string json = JsonSerializer.Serialize(message, message.GetType(), Serializer.Options);
            using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, _Closed.Token))
            {
                await _WriteLock.WaitAsync(linked.Token).ConfigureAwait(false);
                try
                {
                    await writer.WriteAsync(json + "\n").ConfigureAwait(false);
                    await writer.FlushAsync(linked.Token).ConfigureAwait(false);
                }
                finally
                {
                    _WriteLock.Release();
                }
            }
        }

        private async Task AnswerAsync(JsonRpcMessage request)
        {
            JsonRpcResponse response = new JsonRpcResponse();
            response.Id = request.Id!.Value.Clone();
            try
            {
                Func<JsonRpcMessage, CancellationToken, Task<object?>>? handler = RequestHandler;
                if (handler == null) throw new JsonRpcException(MethodNotFound, "Method " + request.Method + " is not supported.", request.Method);
                response.Result = await handler(request, _Closed.Token).ConfigureAwait(false) ?? new object();
            }
            catch (JsonRpcException e)
            {
                response.Error = new JsonRpcError();
                response.Error.Code = e.Code;
                response.Error.Message = e.Message;
            }
            catch (OperationCanceledException)
            {
                return;
            }

            try
            {
                await WriteAsync(response, _Closed.Token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is IOException || e is ObjectDisposedException || e is OperationCanceledException || e is InvalidOperationException)
            {
                // The harness went away before it could be answered; nothing is waiting for the reply.
            }
        }

        private static long? NumericId(JsonElement id)
        {
            if (id.ValueKind == JsonValueKind.Number && id.TryGetInt64(out long number)) return number;
            if (id.ValueKind == JsonValueKind.String && Int64.TryParse(id.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long parsed)) return parsed;
            return null;
        }

        #endregion
    }
}
