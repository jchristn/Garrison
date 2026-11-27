namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// A minimal MCP client for Garrison's management endpoint (streamable HTTP, JSON responses): initialize opens a
    /// session, and tools/call sends one JSON-RPC request per call with the session header. It authenticates with the
    /// system administrator key and a tenant header, as a person would. One session per instance; calls on one
    /// instance may run concurrently.
    /// </summary>
    public class McpClient : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// MCP endpoint URL, for example http://127.0.0.1:37801/mcp.
        /// </summary>
        public string Url
        {
            get
            {
                return _Url;
            }
        }

        /// <summary>
        /// Session identifier after ConnectAsync, or null.
        /// </summary>
        public string? SessionId
        {
            get
            {
                return _SessionId;
            }
        }

        #endregion

        #region Private-Members

        private readonly string _Url;
        private readonly string _AdminApiKey;
        private readonly string _TenantId;
        private readonly HttpClient _Http;
        private string? _SessionId = null;
        private long _NextId = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="url">MCP endpoint URL.</param>
        /// <param name="adminApiKey">System administrator API key.</param>
        /// <param name="tenantId">Tenant the calls act in.</param>
        /// <param name="requestTimeoutSeconds">Request timeout in seconds, 1 to 3600.</param>
        /// <exception cref="ArgumentNullException">Thrown when a string argument is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the timeout is out of range.</exception>
        public McpClient(string url, string adminApiKey, string tenantId, int requestTimeoutSeconds)
        {
            if (String.IsNullOrEmpty(url)) throw new ArgumentNullException(nameof(url));
            if (String.IsNullOrEmpty(adminApiKey)) throw new ArgumentNullException(nameof(adminApiKey));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (requestTimeoutSeconds < 1 || requestTimeoutSeconds > 3600) throw new ArgumentOutOfRangeException(nameof(requestTimeoutSeconds));
            _Url = url;
            _AdminApiKey = adminApiKey;
            _TenantId = tenantId;
            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.ConnectTimeout = TimeSpan.FromSeconds(10);
            _Http = new HttpClient(handler);
            _Http.Timeout = TimeSpan.FromSeconds(requestTimeoutSeconds);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Open a session: initialize, then notifications/initialized.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Null on success, otherwise why the session could not be opened.</returns>
        public async Task<string?> ConnectAsync(CancellationToken token)
        {
            McpRequest initialize = new McpRequest();
            initialize.Id = Interlocked.Increment(ref _NextId);
            initialize.Method = "initialize";
            initialize.Params = new McpInitializeParams();
            McpCallResult opened = await SendAsync(initialize, token).ConfigureAwait(false);
            if (opened.StatusCode != 200 || _SessionId == null) return "initialize answered " + opened.StatusCode.ToString(CultureInfo.InvariantCulture) + " " + opened.Text;
            McpRequest initialized = new McpRequest();
            initialized.Method = "notifications/initialized";
            McpCallResult notified = await SendAsync(initialized, token).ConfigureAwait(false);
            if (notified.StatusCode < 200 || notified.StatusCode >= 300) return "notifications/initialized answered " + notified.StatusCode.ToString(CultureInfo.InvariantCulture);
            return null;
        }

        /// <summary>
        /// Call a tool.
        /// </summary>
        /// <param name="name">Tool name.</param>
        /// <param name="arguments">Typed arguments.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Outcome. Only cancellation through the token throws.</returns>
        /// <exception cref="ArgumentNullException">Thrown when name or arguments is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when no session is open.</exception>
        public Task<McpCallResult> CallToolAsync(string name, object arguments, CancellationToken token)
        {
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            if (arguments == null) throw new ArgumentNullException(nameof(arguments));
            if (_SessionId == null) throw new InvalidOperationException("Call ConnectAsync before calling tools.");
            McpToolCall call = new McpToolCall();
            call.Name = name;
            call.Arguments = arguments;
            McpRequest request = new McpRequest();
            request.Id = Interlocked.Increment(ref _NextId);
            request.Method = "tools/call";
            request.Params = call;
            return SendAsync(request, token);
        }

        /// <summary>
        /// Deserialize a tool's text into a typed record.
        /// </summary>
        /// <typeparam name="T">Record type.</typeparam>
        /// <param name="result">Call outcome.</param>
        /// <returns>The record, or null when the call failed or the text is not that record.</returns>
        public static T? Parse<T>(McpCallResult result) where T : class
        {
            if (result == null || !result.Success || String.IsNullOrEmpty(result.Text)) return null;
            try
            {
                return JsonSerializer.Deserialize<T>(result.Text, JsonDefaults.Compact);
            }
            catch (JsonException)
            {
                return null;
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
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) _Http.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task<McpCallResult> SendAsync(McpRequest rpc, CancellationToken token)
        {
            McpCallResult result = new McpCallResult();
            Stopwatch watch = Stopwatch.StartNew();
            string body = JsonSerializer.Serialize(rpc, JsonDefaults.Compact);
            string raw = String.Empty;
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, _Url))
            {
                request.Headers.Add("x-api-key", _AdminApiKey);
                request.Headers.Add("x-tenant-id", _TenantId);
                request.Headers.TryAddWithoutValidation("Accept", "application/json, text/event-stream");
                if (_SessionId != null) request.Headers.TryAddWithoutValidation("MCP-Session-Id", _SessionId);
                request.Content = new StringContent(body, Encoding.UTF8);
                request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                try
                {
                    using (HttpResponseMessage response = await _Http.SendAsync(request, HttpCompletionOption.ResponseContentRead, token).ConfigureAwait(false))
                    {
                        result.StatusCode = (int)response.StatusCode;
                        if (response.Headers.TryGetValues("MCP-Session-Id", out IEnumerable<string>? values))
                        {
                            string? session = values.FirstOrDefault();
                            if (!String.IsNullOrEmpty(session)) _SessionId = session;
                        }
                        raw = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    }
                }
                catch (OperationCanceledException) when (token.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception e) when (e is TaskCanceledException || e is HttpRequestException || e is IOException)
                {
                    result.StatusCode = 0;
                    result.Text = "transport: " + e.Message;
                }
            }
            watch.Stop();
            result.ElapsedMs = watch.Elapsed.TotalMilliseconds;
            if (result.StatusCode == 0 || rpc.Id == null) return result;

            McpResponse? parsed = null;
            try
            {
                parsed = JsonSerializer.Deserialize<McpResponse>(DataLine(raw), JsonDefaults.Compact);
            }
            catch (JsonException)
            {
                parsed = null;
            }
            if (parsed == null)
            {
                result.Text = "unreadable response (" + result.StatusCode.ToString(CultureInfo.InvariantCulture) + "): " + (raw.Length > 200 ? raw.Substring(0, 200) : raw);
                return result;
            }
            if (parsed.Error != null)
            {
                result.Text = "JSON-RPC " + parsed.Error.Code.ToString(CultureInfo.InvariantCulture) + ": " + parsed.Error.Message;
                return result;
            }
            McpContent? text = parsed.Result?.Content.FirstOrDefault(c => c.Type == "text");
            result.Text = text?.Text ?? String.Empty;
            result.ToolError = parsed.Result != null && parsed.Result.IsError;
            result.Success = result.StatusCode == 200 && parsed.Result != null && !parsed.Result.IsError;
            return result;
        }

        private static string DataLine(string raw)
        {
            // A JSON answer is used as is; a server-sent-event answer carries the response on its data line.
            string trimmed = raw.TrimStart();
            if (trimmed.StartsWith("{", StringComparison.Ordinal)) return trimmed;
            foreach (string line in raw.Split('\n'))
            {
                if (line.StartsWith("data:", StringComparison.Ordinal)) return line.Substring(5).Trim();
            }
            return trimmed;
        }

        #endregion
    }
}
