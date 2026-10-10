namespace Garrison.Sdk.Http
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Runtime.CompilerServices;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// HTTP transport shared by every SDK module: JSON serialization (camelCase, enums as strings, nulls omitted),
    /// authentication headers, signed requests, error mapping, and server-sent event reading. Thread-safe for
    /// concurrent requests; change credentials only between requests.
    /// </summary>
    public class GarrisonTransport : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Base URL without a trailing slash. Default http://127.0.0.1:8700.
        /// </summary>
        public string BaseUrl
        {
            get
            {
                return _BaseUrl;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value)) throw new ArgumentNullException(nameof(BaseUrl));
                _BaseUrl = value.TrimEnd('/');
            }
        }

        /// <summary>
        /// Authentication mode.
        /// </summary>
        public AuthModeEnum AuthMode { get; set; } = AuthModeEnum.None;

        /// <summary>
        /// Bearer session token.
        /// </summary>
        public string? Token { get; set; } = null;

        /// <summary>
        /// Credential access key.
        /// </summary>
        public string? AccessKey { get; set; } = null;

        /// <summary>
        /// Credential secret key.
        /// </summary>
        public string? SecretKey { get; set; } = null;

        /// <summary>
        /// System administrator API key.
        /// </summary>
        public string? AdminApiKey { get; set; } = null;

        /// <summary>
        /// Tenant identifier used for tenant-scoped paths and signed requests.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// JSON serializer options used for requests and responses.
        /// </summary>
        public static JsonSerializerOptions JsonOptions
        {
            get
            {
                return _JsonOptions;
            }
        }

        #endregion

        #region Private-Members

        private static readonly JsonSerializerOptions _JsonOptions = BuildOptions();
        private readonly HttpClient _Http;
        private readonly bool _OwnsHttp;
        private string _BaseUrl = "http://127.0.0.1:8700";
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="baseUrl">Base URL, for example http://127.0.0.1:8700.</param>
        /// <param name="httpClient">Optional HttpClient; when null the transport owns one with a 10 minute timeout.</param>
        public GarrisonTransport(string baseUrl, HttpClient? httpClient = null)
        {
            BaseUrl = baseUrl;
            if (httpClient == null)
            {
                _Http = new HttpClient();
                _Http.Timeout = TimeSpan.FromMinutes(10);
                _OwnsHttp = true;
            }
            else
            {
                _Http = httpClient;
                _OwnsHttp = false;
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Send a request and deserialize the JSON response.
        /// </summary>
        /// <typeparam name="T">Response type.</typeparam>
        /// <param name="method">HTTP method.</param>
        /// <param name="path">Path beginning with a slash, without query.</param>
        /// <param name="body">Optional body; strings are sent verbatim, other objects as JSON.</param>
        /// <param name="query">Optional query parameters; null values are skipped.</param>
        /// <param name="contentType">Content type for string bodies. Default application/json.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Deserialized response, or default for empty bodies.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<T?> SendAsync<T>(HttpMethod method, string path, object? body = null, IDictionary<string, string?>? query = null, string contentType = "application/json", CancellationToken token = default)
        {
            string text = await SendTextAsync(method, path, body, query, contentType, token).ConfigureAwait(false);
            if (String.IsNullOrWhiteSpace(text)) return default;
            return JsonSerializer.Deserialize<T>(text, _JsonOptions);
        }

        /// <summary>
        /// Send a request and return the response text.
        /// </summary>
        /// <param name="method">HTTP method.</param>
        /// <param name="path">Path.</param>
        /// <param name="body">Optional body.</param>
        /// <param name="query">Optional query parameters.</param>
        /// <param name="contentType">Content type for string bodies.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Response text.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<string> SendTextAsync(HttpMethod method, string path, object? body = null, IDictionary<string, string?>? query = null, string contentType = "application/json", CancellationToken token = default)
        {
            using (HttpRequestMessage request = Build(method, path, body, query, contentType))
            {
                using (HttpResponseMessage response = await _Http.SendAsync(request, token).ConfigureAwait(false))
                {
                    string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if (!response.IsSuccessStatusCode) throw Error((int)response.StatusCode, text);
                    return text;
                }
            }
        }

        /// <summary>
        /// Open a server-sent event stream and yield events until the server closes it.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <param name="query">Optional query parameters.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async IAsyncEnumerable<SseMessage> StreamAsync(string path, IDictionary<string, string?>? query = null, [EnumeratorCancellation] CancellationToken token = default)
        {
            using (HttpRequestMessage request = Build(HttpMethod.Get, path, null, query, "application/json"))
            {
                request.Headers.Accept.ParseAdd("text/event-stream");
                using (HttpResponseMessage response = await _Http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
                {
                    if (!response.IsSuccessStatusCode) throw Error((int)response.StatusCode, await response.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                    using (Stream stream = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
                    {
                        using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                        {
                            SseMessage current = new SseMessage();
                            StringBuilder data = new StringBuilder();
                            while (!token.IsCancellationRequested)
                            {
                                string? line = await reader.ReadLineAsync(token).ConfigureAwait(false);
                                if (line == null) break;
                                if (line.Length == 0)
                                {
                                    if (data.Length > 0 || current.Event != null)
                                    {
                                        current.Data = data.ToString();
                                        yield return current;
                                    }
                                    current = new SseMessage();
                                    data.Clear();
                                    continue;
                                }
                                if (line.StartsWith(":", StringComparison.Ordinal)) continue;
                                int colon = line.IndexOf(':');
                                string field = colon < 0 ? line : line.Substring(0, colon);
                                string value = colon < 0 ? String.Empty : line.Substring(colon + 1).TrimStart(' ');
                                if (field == "event") current.Event = value;
                                else if (field == "id") current.Id = value;
                                else if (field == "data")
                                {
                                    if (data.Length > 0) data.Append('\n');
                                    data.Append(value);
                                }
                            }
                            if (data.Length > 0)
                            {
                                current.Data = data.ToString();
                                yield return current;
                            }
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Build the canonical string for a signed request (must match the server's RequestSigner).
        /// </summary>
        /// <param name="method">Method.</param>
        /// <param name="path">Path.</param>
        /// <param name="query">Raw query without the question mark.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="date">x-date value.</param>
        /// <param name="nonce">x-nonce value.</param>
        /// <param name="body">Body bytes.</param>
        /// <returns>Canonical string.</returns>
        public static string Canonicalize(string method, string path, string? query, string? tenantId, string date, string nonce, byte[]? body)
        {
            string bodyHash = Convert.ToHexString(SHA256.HashData(body ?? Array.Empty<byte>())).ToLowerInvariant();
            return method.ToUpperInvariant() + "\n" + path + "\n" + (query ?? String.Empty) + "\n" + (tenantId ?? String.Empty) + "\n" + date + "\n" + nonce + "\n" + bodyHash;
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
            if (disposing && _OwnsHttp) _Http.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private HttpRequestMessage Build(HttpMethod method, string path, object? body, IDictionary<string, string?>? query, string contentType)
        {
            string queryString = BuildQuery(query);
            HttpRequestMessage request = new HttpRequestMessage(method, _BaseUrl + path + (queryString.Length > 0 ? "?" + queryString : String.Empty));
            byte[]? bytes = null;
            if (body != null)
            {
                string text = body is string s ? s : JsonSerializer.Serialize(body, body.GetType(), _JsonOptions);
                bytes = Encoding.UTF8.GetBytes(text);
                ByteArrayContent content = new ByteArrayContent(bytes);
                content.Headers.TryAddWithoutValidation("Content-Type", body is string ? contentType : "application/json");
                request.Content = content;
            }

            switch (AuthMode)
            {
                case AuthModeEnum.Token:
                    if (!String.IsNullOrEmpty(Token)) request.Headers.TryAddWithoutValidation("Authorization", "Bearer " + Token);
                    break;
                case AuthModeEnum.AccessKeySecret:
                    request.Headers.TryAddWithoutValidation("x-access-key", AccessKey);
                    request.Headers.TryAddWithoutValidation("x-secret-key", SecretKey);
                    break;
                case AuthModeEnum.SignedRequest:
                    string date = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
                    string nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
                    string canonical = Canonicalize(method.Method, path, queryString, TenantId, date, nonce, bytes);
                    string signature = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(SecretKey ?? String.Empty), Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
                    request.Headers.TryAddWithoutValidation("x-access-key", AccessKey);
                    request.Headers.TryAddWithoutValidation("x-date", date);
                    request.Headers.TryAddWithoutValidation("x-nonce", nonce);
                    request.Headers.TryAddWithoutValidation("x-signature", signature);
                    if (!String.IsNullOrEmpty(TenantId)) request.Headers.TryAddWithoutValidation("x-tenant-id", TenantId);
                    break;
                case AuthModeEnum.AdminApiKey:
                    request.Headers.TryAddWithoutValidation("x-api-key", AdminApiKey);
                    if (!String.IsNullOrEmpty(TenantId)) request.Headers.TryAddWithoutValidation("x-tenant-id", TenantId);
                    break;
            }
            return request;
        }

        private static string BuildQuery(IDictionary<string, string?>? query)
        {
            if (query == null) return String.Empty;
            return String.Join("&", query.Where(q => !String.IsNullOrEmpty(q.Value)).Select(q => Uri.EscapeDataString(q.Key) + "=" + Uri.EscapeDataString(q.Value!)));
        }

        private static GarrisonException Error(int status, string text)
        {
            ErrorResponse? error = null;
            try
            {
                if (!String.IsNullOrWhiteSpace(text)) error = JsonSerializer.Deserialize<ErrorResponse>(text, _JsonOptions);
            }
            catch (JsonException)
            {
                error = null;
            }
            return new GarrisonException(status, error, text);
        }

        private static JsonSerializerOptions BuildOptions()
        {
            JsonSerializerOptions options = new JsonSerializerOptions();
            options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.PropertyNameCaseInsensitive = true;
            options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.Converters.Add(new JsonStringEnumConverter());
            return options;
        }

        #endregion
    }
}
