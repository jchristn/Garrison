namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Runtime.CompilerServices;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Client for an agentic app's end-user gateway at /v1.0/apps/{slug}/. It needs no management credentials: start a
    /// session with an email and password, or anonymously when the app allows it, and the session token (prefix gas_) is
    /// kept and sent as a bearer token. The token works only on this app's gateway and reaches only the conversations its
    /// owner started (anything else is 404). Errors throw <see cref="GarrisonException"/>: 401 InvalidCredentials,
    /// AppSignInRequired, AnonymousDisabled, or an expired session; 403 AppAccessDenied; 409 AppNotDeployed,
    /// ConversationBusy, or AppRateLimited. Thread-safe for concurrent requests once a session is started; start and end
    /// sessions from one thread.
    /// </summary>
    public class AppGatewayClient : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Transport. Its authentication mode is Token while a session is open and None otherwise.
        /// </summary>
        public GarrisonTransport Transport { get; }

        /// <summary>
        /// App URL name. Never null or empty.
        /// </summary>
        public string Slug { get; }

        /// <summary>
        /// Session token sent as a bearer token, or null before a session starts. Setting it uses a token issued elsewhere.
        /// </summary>
        public string? Token
        {
            get
            {
                return Transport.Token;
            }
            set
            {
                Transport.Token = value;
                Transport.AuthMode = String.IsNullOrEmpty(value) ? AuthModeEnum.None : AuthModeEnum.Token;
            }
        }

        /// <summary>
        /// The last session started, or null.
        /// </summary>
        public AppSessionResponse? Session { get; private set; } = null;

        /// <summary>
        /// Interval between polls in <see cref="WaitForTurnAsync"/>, in milliseconds. Default 500, minimum 50, maximum 60000.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the value is outside the range.</exception>
        public int PollIntervalMs
        {
            get
            {
                return _PollIntervalMs;
            }
            set
            {
                if (value < 50 || value > 60000) throw new ArgumentOutOfRangeException(nameof(PollIntervalMs), "PollIntervalMs must be between 50 and 60000.");
                _PollIntervalMs = value;
            }
        }

        #endregion

        #region Private-Members

        private int _PollIntervalMs = 500;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="baseUrl">Server base URL, for example http://127.0.0.1:8700. Null uses http://127.0.0.1:8700.</param>
        /// <param name="slug">App URL name.</param>
        /// <param name="httpClient">Optional HttpClient; when null the client owns one.</param>
        /// <exception cref="ArgumentNullException">Thrown when slug is null or empty.</exception>
        public AppGatewayClient(string? baseUrl, string slug, HttpClient? httpClient = null)
        {
            if (String.IsNullOrEmpty(slug)) throw new ArgumentNullException(nameof(slug));
            Slug = slug;
            Transport = new GarrisonTransport(String.IsNullOrEmpty(baseUrl) ? GarrisonClient.DefaultBaseUrl : baseUrl, httpClient);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Branding and how to sign in. Needs no session.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App information.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 for an unknown slug.</exception>
        public async Task<AppInfo> InfoAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<AppInfo>(HttpMethod.Get, AppPath(String.Empty), token: token).ConfigureAwait(false) ?? new AppInfo();
        }

        /// <summary>
        /// Absolute URL of the app's logo image. The URL answers 404 when the app has none.
        /// </summary>
        /// <returns>Logo URL.</returns>
        public string LogoUrl()
        {
            return Transport.BaseUrl + AppPath("/logo");
        }

        /// <summary>
        /// Download the app's logo image.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Image bytes.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 when the app has no logo.</exception>
        public async Task<byte[]> GetLogoAsync(CancellationToken token = default)
        {
            return await Transport.DownloadAsync(AppPath("/logo"), null, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Start a session. With a null request (or null email and password) the session is anonymous, which works only
        /// when the app's auth mode is Anonymous and anonymous use is enabled. The token is kept for later calls.
        /// </summary>
        /// <param name="request">Email and password, or null for an anonymous session.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Session.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status; the previous token is kept.</exception>
        public async Task<AppSessionResponse> StartSessionAsync(AppSessionRequest? request = null, CancellationToken token = default)
        {
            string? previous = Token;
            Token = null;
            try
            {
                object? body = request == null || (request.Email == null && request.Password == null) ? null : request;
                AppSessionResponse session = await Transport.SendAsync<AppSessionResponse>(HttpMethod.Post, AppPath("/session"), body, token: token).ConfigureAwait(false) ?? new AppSessionResponse();
                Token = session.Token;
                Session = session;
                return session;
            }
            catch (Exception)
            {
                Token = previous;
                throw;
            }
        }

        /// <summary>
        /// Sign out and forget the token.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task EndSessionAsync(CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, AppPath("/session"), token: token).ConfigureAwait(false);
            Token = null;
            Session = null;
        }

        /// <summary>
        /// The session owner's conversations in the app.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Conversations without their turns; empty when there are none.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 401 without a session.</exception>
        public async Task<List<AppConversationView>> ListConversationsAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<List<AppConversationView>>(HttpMethod.Get, AppPath("/conversations"), token: token).ConfigureAwait(false) ?? new List<AppConversationView>();
        }

        /// <summary>
        /// Start a conversation with the app's entry agent on the live environment's entry deployment.
        /// </summary>
        /// <param name="message">First message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The conversation identifier and its first turn.</returns>
        /// <exception cref="ArgumentNullException">Thrown when message is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 409 AppNotDeployed.</exception>
        public async Task<AppConversationStart> StartConversationAsync(string message, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(message)) throw new ArgumentNullException(nameof(message));
            AppMessageRequest body = new AppMessageRequest();
            body.Message = message;
            return await Transport.SendAsync<AppConversationStart>(HttpMethod.Post, AppPath("/conversations"), body, token: token).ConfigureAwait(false) ?? new AppConversationStart();
        }

        /// <summary>
        /// One of the owner's conversations with its turns.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Conversation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 for another owner's conversation.</exception>
        public async Task<AppConversationView> GetConversationAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<AppConversationView>(HttpMethod.Get, ConversationPath(id, String.Empty), token: token).ConfigureAwait(false) ?? new AppConversationView();
        }

        /// <summary>
        /// Send the next message in a conversation.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="message">Message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new turn.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or message is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 409 ConversationBusy while the previous turn runs.</exception>
        public async Task<AppTurnView> SendAsync(string id, string message, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(message)) throw new ArgumentNullException(nameof(message));
            AppMessageRequest body = new AppMessageRequest();
            body.Message = message;
            return await Transport.SendAsync<AppTurnView>(HttpMethod.Post, ConversationPath(id, "/messages"), body, token: token).ConfigureAwait(false) ?? new AppTurnView();
        }

        /// <summary>
        /// Stream a turn's visible events until turn.completed (the last item carries the completed turn).
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="runId">Run identifier of the turn.</param>
        /// <param name="afterSequence">Resume after this run event sequence (a turn.event identifier). Default 0, from the start.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or runId is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async IAsyncEnumerable<AppTurnStreamEvent> StreamTurnAsync(string id, string runId, long afterSequence = 0, [EnumeratorCancellation] CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            Dictionary<string, string?> query = new Dictionary<string, string?> { { "afterSequence", afterSequence.ToString(System.Globalization.CultureInfo.InvariantCulture) } };
            await foreach (SseMessage message in Transport.StreamAsync(ConversationPath(id, "/turns/" + Uri.EscapeDataString(runId) + "/stream"), query, token).ConfigureAwait(false))
            {
                string name = message.Event ?? "message";
                if (name != "turn.event" && name != "turn.status" && name != "turn.completed") continue;
                AppTurnStreamEvent item = new AppTurnStreamEvent();
                item.Name = name;
                item.Id = message.Id;
                item.Data = message.Data;
                if (name == "turn.event") item.Event = JsonSerializer.Deserialize<RunEvent>(message.Data, GarrisonTransport.JsonOptions);
                else item.Turn = JsonSerializer.Deserialize<AppTurnView>(message.Data, GarrisonTransport.JsonOptions);
                yield return item;
                if (name == "turn.completed") yield break;
            }
        }

        /// <summary>
        /// Poll a conversation until the turn with the given run reaches a terminal status or the timeout elapses.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="runId">Run identifier of the turn.</param>
        /// <param name="timeout">Maximum wait.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The turn as it stands when it finished or the timeout elapsed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or runId is null or empty.</exception>
        /// <exception cref="TimeoutException">Thrown when the turn is not listed in the conversation before the timeout.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<AppTurnView> WaitForTurnAsync(string id, string runId, TimeSpan timeout, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            DateTime deadline = DateTime.UtcNow + timeout;
            while (true)
            {
                AppConversationView view = await GetConversationAsync(id, token).ConfigureAwait(false);
                AppTurnView? turn = view.Turns.FirstOrDefault(t => t.RunId == runId);
                if (turn != null && (RunsClient.IsTerminal(turn.Status) || DateTime.UtcNow >= deadline)) return turn;
                if (DateTime.UtcNow >= deadline) throw new TimeoutException("Turn " + runId + " was not listed in conversation " + id + " before the timeout.");
                await Task.Delay(_PollIntervalMs, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// List the conversation's files.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Listing.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<FileSpaceListing> ListFilesAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<FileSpaceListing>(HttpMethod.Get, ConversationPath(id, "/files"), token: token).ConfigureAwait(false) ?? new FileSpaceListing();
        }

        /// <summary>
        /// Read a file of the conversation.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="path">File path inside the space.</param>
        /// <param name="version">Version number, or null for the current version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Content bytes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 for an unknown file.</exception>
        public async Task<byte[]> ReadFileAsync(string id, string path, int? version = null, CancellationToken token = default)
        {
            return await Transport.DownloadAsync(ConversationPath(id, "/files/content"), FileQuery(path, version), token).ConfigureAwait(false);
        }

        /// <summary>
        /// A file's versions, newest first.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="path">File path inside the space.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<List<ConversationFileVersion>> ListFileVersionsAsync(string id, string path, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<ConversationFileVersion>>(HttpMethod.Get, ConversationPath(id, "/files/versions"), query: FileQuery(path, null), token: token).ConfigureAwait(false) ?? new List<ConversationFileVersion>();
        }

        /// <summary>
        /// Issue a short-lived download URL for a file that needs no credentials.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="path">File path inside the space.</param>
        /// <param name="version">Version number, or null for the current version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Download URL.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<FileDownloadUrl> DownloadUrlAsync(string id, string path, int? version = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<FileDownloadUrl>(HttpMethod.Post, ConversationPath(id, "/files/download-url"), query: FileQuery(path, version), token: token).ConfigureAwait(false) ?? new FileDownloadUrl();
        }

        /// <summary>
        /// Stream files.changed events for the conversation. The first event lists every current file. The stream stays
        /// open until the token is cancelled, the caller stops enumerating, or the server closes it.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async IAsyncEnumerable<AppFilesChanged> StreamFilesAsync(string id, [EnumeratorCancellation] CancellationToken token = default)
        {
            await foreach (SseMessage message in Transport.StreamAsync(ConversationPath(id, "/files/stream"), null, token).ConfigureAwait(false))
            {
                if (message.Event != "files.changed" || String.IsNullOrEmpty(message.Data)) continue;
                AppFilesChanged? changed = JsonSerializer.Deserialize<AppFilesChanged>(message.Data, GarrisonTransport.JsonOptions);
                if (changed != null) yield return changed;
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
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) Transport.Dispose();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private string AppPath(string suffix)
        {
            return "/v1.0/apps/" + Uri.EscapeDataString(Slug) + suffix;
        }

        private string ConversationPath(string id, string suffix)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return AppPath("/conversations/" + Uri.EscapeDataString(id) + suffix);
        }

        private static Dictionary<string, string?> FileQuery(string path, int? version)
        {
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            Dictionary<string, string?> query = new Dictionary<string, string?> { { "path", path } };
            if (version != null) query["version"] = version.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
            return query;
        }

        #endregion
    }
}
