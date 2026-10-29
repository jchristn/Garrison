namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;

    /// <summary>
    /// The app gateway (AD6.5, AD6.6): app sessions for end users, and conversations with an app's entry agent that
    /// belong to the session's user. App sessions only work on /v1.0/apps/{slug}/ for their own app; the management API
    /// never accepts them. Runs started through an app are authorized as the app (AD-035): the end user cannot reach the
    /// management API through them, and the entry agent's delegation policy (derived from the app graph) bounds what the
    /// run may call. Thread-safe.
    /// </summary>
    public class AppGatewayService
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ConcurrentDictionary<string, Queue<DateTime>> _Messages = new ConcurrentDictionary<string, Queue<DateTime>>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public AppGatewayService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Find an active app by slug.
        /// </summary>
        /// <param name="slug">Slug.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App.</returns>
        /// <exception cref="NotFoundException">Thrown when there is no active app with the slug.</exception>
        public async Task<AgenticApp> AppAsync(string? slug, CancellationToken token)
        {
            AgenticApp? app = String.IsNullOrWhiteSpace(slug) ? null : await _Server.Database.Apps.ReadBySlugAsync(slug, token).ConfigureAwait(false);
            if (app == null || !app.Active) throw new NotFoundException("App not found.");
            return app;
        }

        /// <summary>
        /// Branding and sign-in information for the app UI.
        /// </summary>
        /// <param name="app">App.</param>
        /// <returns>Info.</returns>
        public AppInfo Info(AgenticApp app)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            return new AppInfo
            {
                Slug = app.Slug, DisplayName = app.DisplayName ?? app.Name, Description = app.Description, WelcomeText = app.WelcomeText,
                PrimaryColor = app.PrimaryColor, AccentColor = app.AccentColor, LogoUrl = app.LogoAssetId == null ? null : "/v1.0/apps/" + app.Slug + "/logo",
                AuthMode = app.AuthMode, AnonymousAllowed = AnonymousAllowed(app), ShowOperatorDetail = app.ShowOperatorDetail
            };
        }

        /// <summary>
        /// Start an app session: for a tenant user signing in with email and password, for the caller of a management
        /// bearer token, or anonymously when the app allows it.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="request">Email and password, or null.</param>
        /// <param name="bearer">The caller resolved from a management token in the Authorization header, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The session, with its token shown once.</returns>
        /// <exception cref="AppAccessException">Thrown with 401 AppSignInRequired or InvalidCredentials, or 403 AppAccessDenied.</exception>
        public async Task<AppSessionResponse> StartSessionAsync(AgenticApp app, AppSessionRequest? request, RequestContext? bearer, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            User? user = null;
            if (bearer != null && bearer.IsAuthenticated && bearer.TenantId == app.TenantId && !String.IsNullOrEmpty(bearer.UserId) && bearer.PrincipalType != PrincipalTypeEnum.Run)
            {
                user = await _Server.Database.Users.ReadAsync(app.TenantId, bearer.UserId, token).ConfigureAwait(false);
            }
            else if (!String.IsNullOrWhiteSpace(request?.Email))
            {
                user = await _Server.Authentication.AuthenticateUserAsync(app.TenantId, request.Email, request.Password, token).ConfigureAwait(false);
                if (user == null) throw new AppAccessException(401, "InvalidCredentials", "The email or password is not correct.");
            }

            AppSession session = new AppSession { TenantId = app.TenantId, AppId = app.Id };
            if (user != null)
            {
                if (!user.Active) throw new AppAccessException(403, "AppAccessDenied", "This account cannot use the app.");
                if (app.AuthMode == AppAuthModeEnum.AppUsers && !await IsAppUserAsync(app, user, token).ConfigureAwait(false))
                    throw new AppAccessException(403, "AppAccessDenied", "This account has not been given access to the app. Ask its owner for the AppUser role on it.");
                session.UserId = user.Id;
                session.PrincipalName = user.Email;
                session.ExpiresUtc = DateTime.UtcNow.AddMinutes(_Server.Settings.Apps.SessionMinutes);
            }
            else if (AnonymousAllowed(app))
            {
                session.PrincipalName = "anonymous";
                session.ExpiresUtc = DateTime.UtcNow.AddMinutes(_Server.Settings.Apps.AnonymousSessionMinutes);
            }
            else
            {
                throw new AppAccessException(401, app.AuthMode == AppAuthModeEnum.Anonymous ? "AnonymousDisabled" : "AppSignInRequired",
                    app.AuthMode == AppAuthModeEnum.Anonymous ? "Anonymous use of this app is turned off. Sign in instead." : "Sign in to use this app.");
            }

            byte[] secret = RandomNumberGenerator.GetBytes(32);
            string sessionToken = Garrison.Core.Constants.AppSessionTokenPrefix + Convert.ToBase64String(secret).TrimEnd('=').Replace('+', '-').Replace('/', '_');
            session.TokenHash = Hash(sessionToken);
            await _Server.Database.Apps.CreateSessionAsync(session, token).ConfigureAwait(false);
            return new AppSessionResponse { Token = sessionToken, ExpiresUtc = session.ExpiresUtc, PrincipalName = session.PrincipalName, Anonymous = session.UserId == null };
        }

        /// <summary>
        /// Authenticate a gateway request by its app session token ("Authorization: Bearer gas_...", or the session query
        /// parameter for event streams).
        /// </summary>
        /// <param name="app">App the request is for.</param>
        /// <param name="sessionToken">Token, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The session.</returns>
        /// <exception cref="AppAccessException">Thrown with 401 AppSessionRequired when the token is missing, unknown, expired, revoked, or for another app.</exception>
        public async Task<AppSession> AuthenticateAsync(AgenticApp app, string? sessionToken, CancellationToken token)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (String.IsNullOrEmpty(sessionToken) || !sessionToken.StartsWith(Garrison.Core.Constants.AppSessionTokenPrefix, StringComparison.Ordinal))
                throw new AppAccessException(401, "AppSessionRequired", "Start an app session first.");
            AppSession? session = await _Server.Database.Apps.ReadSessionByHashAsync(Hash(sessionToken), token).ConfigureAwait(false);
            if (session == null || session.AppId != app.Id || session.RevokedUtc.HasValue || session.ExpiresUtc <= DateTime.UtcNow)
                throw new AppAccessException(401, "AppSessionRequired", "The app session ended. Start a new one.");
            if (session.UserId != null)
            {
                User? user = await _Server.Database.Users.ReadAsync(app.TenantId, session.UserId, token).ConfigureAwait(false);
                if (user == null || !user.Active || (app.AuthMode == AppAuthModeEnum.AppUsers && !await IsAppUserAsync(app, user, token).ConfigureAwait(false)))
                    throw new AppAccessException(401, "AppSessionRequired", "This account can no longer use the app.");
            }
            else if (!AnonymousAllowed(app))
            {
                throw new AppAccessException(401, "AppSessionRequired", "Anonymous use of this app was turned off. Sign in instead.");
            }
            return session;
        }

        /// <summary>
        /// End a session.
        /// </summary>
        /// <param name="session">Session.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public Task EndSessionAsync(AppSession session, CancellationToken token)
        {
            if (session == null) throw new ArgumentNullException(nameof(session));
            return _Server.Database.Apps.RevokeSessionAsync(session.Id, token);
        }

        /// <summary>
        /// The session owner's conversations in the app, newest first, without turns.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="session">Session.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Conversations.</returns>
        public async Task<List<AppConversationView>> ConversationsAsync(AgenticApp app, AppSession session, CancellationToken token)
        {
            ConversationFilter filter = new ConversationFilter { TenantId = app.TenantId, AppId = app.Id, CallerId = session.OwnerId, MaxResults = 100 };
            EnumerationResult<Conversation> page = await _Server.Database.Conversations.EnumerateAsync(filter, token).ConfigureAwait(false);
            return page.Objects.Select(c => View(c)).ToList();
        }

        /// <summary>
        /// One of the session owner's conversations, with its turns.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="session">Session.</param>
        /// <param name="conversationId">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Conversation with turns.</returns>
        /// <exception cref="NotFoundException">Thrown when the conversation is not the session owner's in this app.</exception>
        public async Task<AppConversationView> ConversationAsync(AgenticApp app, AppSession session, string? conversationId, CancellationToken token)
        {
            Conversation conversation = await OwnedAsync(app, session, conversationId, token).ConfigureAwait(false);
            AppConversationView view = View(conversation);
            RunFilter filter = new RunFilter { TenantId = app.TenantId, ConversationId = conversation.Id, MaxResults = 1000, Ordering = EnumerationOrderEnum.CreatedAscending };
            EnumerationResult<Run> runs = await _Server.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            foreach (Run run in runs.Objects) view.Turns.Add(Turn(run));
            return view;
        }

        /// <summary>
        /// Start a conversation with the app's entry agent on its live environment's deployment.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="session">Session.</param>
        /// <param name="message">The user's first message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The first turn.</returns>
        /// <exception cref="ConflictException">Thrown with AppNotDeployed when the entry agent has no deployment in the live environment.</exception>
        public async Task<AppTurnView> StartAsync(AgenticApp app, AppSession session, AppMessageRequest? message, CancellationToken token)
        {
            return await SendCoreAsync(app, session, null, message, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Send the next message in one of the session owner's conversations.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="session">Session.</param>
        /// <param name="conversationId">Conversation identifier.</param>
        /// <param name="message">Message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new turn.</returns>
        /// <exception cref="NotFoundException">Thrown when the conversation is not the session owner's in this app.</exception>
        /// <exception cref="ConflictException">Thrown with ConversationBusy while the previous turn runs.</exception>
        public async Task<AppTurnView> SendAsync(AgenticApp app, AppSession session, string? conversationId, AppMessageRequest? message, CancellationToken token)
        {
            Conversation conversation = await OwnedAsync(app, session, conversationId, token).ConfigureAwait(false);
            return await SendCoreAsync(app, session, conversation, message, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The run of a turn in one of the session owner's conversations.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="session">Session.</param>
        /// <param name="conversationId">Conversation identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run.</returns>
        /// <exception cref="NotFoundException">Thrown when the run is not a turn of that conversation.</exception>
        public async Task<Run> TurnRunAsync(AgenticApp app, AppSession session, string? conversationId, string? runId, CancellationToken token)
        {
            Conversation conversation = await OwnedAsync(app, session, conversationId, token).ConfigureAwait(false);
            Run? run = String.IsNullOrEmpty(runId) ? null : await _Server.Database.Runs.ReadAsync(app.TenantId, runId, token).ConfigureAwait(false);
            if (run == null || run.ConversationId != conversation.Id) throw new NotFoundException("Turn not found.");
            return run;
        }

        /// <summary>
        /// The file space of one of the session owner's conversations.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="session">Session.</param>
        /// <param name="conversationId">Conversation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File space.</returns>
        public async Task<ConversationFileSpace> FileSpaceAsync(AgenticApp app, AppSession session, string? conversationId, CancellationToken token)
        {
            Conversation conversation = await OwnedAsync(app, session, conversationId, token).ConfigureAwait(false);
            return await _Server.Get<FileSpaceService>().ForConversationAsync(app.TenantId, conversation, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Whether an end user of the app sees a run event: the answer, results, errors, and lifecycle changes always;
        /// thinking, tool calls, progress, and warnings only when the app shows operator detail. Process output never.
        /// </summary>
        /// <param name="app">App.</param>
        /// <param name="evt">Event.</param>
        /// <returns>True when visible.</returns>
        public static bool Visible(AgenticApp app, RunEvent evt)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (evt == null) throw new ArgumentNullException(nameof(evt));
            switch (evt.EventType)
            {
                case RunEventTypeEnum.AssistantText:
                case RunEventTypeEnum.Result:
                case RunEventTypeEnum.Error:
                case RunEventTypeEnum.Lifecycle:
                    return true;
                case RunEventTypeEnum.Thinking:
                case RunEventTypeEnum.ToolCall:
                case RunEventTypeEnum.ToolResult:
                case RunEventTypeEnum.Progress:
                case RunEventTypeEnum.Warning:
                    return app.ShowOperatorDetail;
                default:
                    return false;
            }
        }

        /// <summary>
        /// A turn as the end user sees it.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <returns>Turn.</returns>
        public static AppTurnView Turn(Run run)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            bool failed = RunService.IsTerminal(run.Status) && run.Status != RunStatusEnum.Succeeded;
            return new AppTurnView
            {
                RunId = run.Id, Turn = run.ConversationTurn, Message = run.InputText ?? String.Empty, Status = run.Status,
                Answer = run.Status == RunStatusEnum.Succeeded ? run.ResultText : null,
                Error = failed ? "The agent could not finish this turn (" + run.Status + ")." : null,
                AwaitingApproval = run.AwaitingApproval, CreatedUtc = run.CreatedUtc, CompletedUtc = run.CompletedUtc
            };
        }

        #endregion

        #region Private-Methods

        private static bool AnonymousAllowed(AgenticApp app)
        {
            return app.AuthMode == AppAuthModeEnum.Anonymous && app.AnonymousEnabled;
        }

        private static string Hash(string value)
        {
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
        }

        private async Task<bool> IsAppUserAsync(AgenticApp app, User user, CancellationToken token)
        {
            RequestContext ctx = new RequestContext { IsAuthenticated = true, PrincipalType = PrincipalTypeEnum.User, TenantId = app.TenantId, UserId = user.Id, PrincipalName = user.Email, IsAdmin = user.IsAdmin, IsTenantAdmin = user.IsTenantAdmin, User = user };
            AuthorizationDecision decision = await _Server.Authorization.AuthorizeAsync(ctx, app.TenantId, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Execute, app.Id, token).ConfigureAwait(false);
            return decision.Permitted;
        }

        private async Task<Conversation> OwnedAsync(AgenticApp app, AppSession session, string? conversationId, CancellationToken token)
        {
            Conversation? conversation = String.IsNullOrEmpty(conversationId) ? null : await _Server.Database.Conversations.ReadAsync(app.TenantId, conversationId, token).ConfigureAwait(false);
            if (conversation == null || conversation.AppId != app.Id || conversation.CallerId != session.OwnerId) throw new NotFoundException("Conversation not found.");
            return conversation;
        }

        private async Task<AppTurnView> SendCoreAsync(AgenticApp app, AppSession session, Conversation? conversation, AppMessageRequest? message, CancellationToken token)
        {
            string text = message?.Message ?? String.Empty;
            if (String.IsNullOrWhiteSpace(text)) throw new ValidationException("Write a message.", new Dictionary<string, string> { ["message"] = "Required." }, new Dictionary<string, string> { ["message"] = "Required" });
            Throttle(session);
            Agent entry = await _Server.Database.Agents.ReadAsync(app.TenantId, app.EntryAgentId, token).ConfigureAwait(false) ?? throw new ConflictException("AppNotDeployed", "The app's entry agent no longer exists.");
            Deployment? deployment = conversation == null ? await _Server.Get<AgenticAppService>().LiveDeploymentAsync(app, token).ConfigureAwait(false) : null;
            if (conversation == null && deployment == null) throw new ConflictException("AppNotDeployed", "The app has no entry deployment in environment " + app.LiveEnvironment + " yet.");

            // Runs started through an app run as the app (AD-035); the end user is recorded as the caller.
            RequestContext ctx = new RequestContext
            {
                IsAuthenticated = true, PrincipalType = PrincipalTypeEnum.Administrator, TenantId = app.TenantId, UserId = session.OwnerId,
                PrincipalName = "app " + app.Name + " for " + session.PrincipalName
            };
            InvocationOptions options = new InvocationOptions();
            options.Input = text;
            options.DeploymentId = deployment?.Id;
            options.ConversationId = conversation?.Id;
            options.StartConversation = conversation == null;
            options.AppId = app.Id;
            options.Wait = false;
            options.Surface = "app";
            Run run = await _Server.Get<AgentInvoker>().InvokeAsync(ctx, app.TenantId, entry, options, token).ConfigureAwait(false);
            return Turn(run);
        }

        private void Throttle(AppSession session)
        {
            int limit = _Server.Settings.Apps.MessagesPerMinute;
            Queue<DateTime> times = _Messages.GetOrAdd(session.Id, _ => new Queue<DateTime>());
            lock (times)
            {
                DateTime cutoff = DateTime.UtcNow.AddMinutes(-1);
                while (times.Count > 0 && times.Peek() < cutoff) times.Dequeue();
                if (times.Count >= limit) throw new ConflictException("AppRateLimited", "Too many messages; wait a minute and try again.");
                times.Enqueue(DateTime.UtcNow);
            }
        }

        private static AppConversationView View(Conversation conversation)
        {
            return new AppConversationView
            {
                Id = conversation.Id, Title = conversation.Title, TurnCount = conversation.TurnCount, Busy = conversation.Busy || !String.IsNullOrEmpty(conversation.ActiveRunId),
                LastRunId = conversation.LastRunId, CreatedUtc = conversation.CreatedUtc, LastActivityUtc = conversation.LastActivityUtc
            };
        }

        #endregion
    }
}
