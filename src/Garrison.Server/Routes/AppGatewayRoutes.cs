namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// The app gateway (AD6.6): routes under /v1.0/apps/{slug}/ for an app's chat UI. They are outside the management
    /// API and authenticate with app sessions (Authorization: Bearer gas_..., or session= on event streams), never with
    /// management tokens, except to start a session for a signed-in user.
    /// </summary>
    public class AppGatewayRoutes
    {
        #region Private-Members

        private static readonly string _Base = "/v1.0/apps/{slug}";
        private static readonly string _Tag = "App gateway";
        private readonly ServerContext _Server;
        private readonly AppGatewayService _Gateway;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="gateway">Gateway service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AppGatewayRoutes(ServerContext server, AppGatewayService gateway)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
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
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            routes.Anonymous(HttpMethod.GET, _Base, InfoAsync, "App branding and how to sign in", _Tag, null, typeof(AppInfo));
            routes.Anonymous(HttpMethod.GET, _Base + "/logo", LogoAsync, "The app's logo image", _Tag);
            routes.Anonymous(HttpMethod.GET, _Base + "/favicon", FaviconAsync, "The app's browser tab icon: its favicon asset, else its logo", _Tag);
            routes.Anonymous(HttpMethod.POST, _Base + "/session", StartSessionAsync, "Start an app session: email and password, a management bearer token, or anonymous when the app allows it", _Tag, typeof(AppSessionRequest), typeof(AppSessionResponse));
            routes.Anonymous(HttpMethod.DELETE, _Base + "/session", EndSessionAsync, "End the app session", _Tag);
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations", ConversationsAsync, "The session owner's conversations in the app", _Tag, null, typeof(List<AppConversationView>));
            routes.Anonymous(HttpMethod.POST, _Base + "/conversations", StartConversationAsync, "Start a conversation with the app's entry agent", _Tag, typeof(AppMessageRequest), typeof(AppTurnView));
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations/{id}", ConversationAsync, "One of the session owner's conversations with its turns", _Tag, null, typeof(AppConversationView));
            routes.Anonymous(HttpMethod.POST, _Base + "/conversations/{id}/messages", SendAsync, "Send the next message in a conversation", _Tag, typeof(AppMessageRequest), typeof(AppTurnView));
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations/{id}/turns/{runId}/stream", TurnStreamAsync, "Stream a turn's visible events (server-sent events; resumes after Last-Event-ID)", _Tag);
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations/{id}/files", FilesAsync, "List the conversation's files", _Tag, null, typeof(FileSpaceListing));
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations/{id}/files/content", FileContentAsync, "Read a file of the conversation (?path=, optional version=)", _Tag);
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations/{id}/files/versions", FileVersionsAsync, "A file's versions, newest first (?path=)", _Tag, null, typeof(List<ConversationFileVersion>));
            routes.Anonymous(HttpMethod.POST, _Base + "/conversations/{id}/files/download-url", DownloadUrlAsync, "A short-lived download URL for a file (?path=, optional version=)", _Tag, null, typeof(FileDownloadUrl));
            routes.Anonymous(HttpMethod.GET, _Base + "/conversations/{id}/files/stream", FileStreamAsync, "Stream files.changed events for the conversation (server-sent events)", _Tag);
        }

        #endregion

        #region Private-Methods

        private Task<AgenticApp> AppAsync(HttpContextBase http)
        {
            return _Gateway.AppAsync(RouteHelpers.Param(http, "slug"), http.Token);
        }

        private async Task<AppSession> SessionAsync(HttpContextBase http, AgenticApp app)
        {
            string? header = http.Request.Headers["Authorization"];
            string? sessionToken = header != null && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? header.Substring(7).Trim() : RouteHelpers.Query(http, "session");
            return await _Gateway.AuthenticateAsync(app, sessionToken, http.Token).ConfigureAwait(false);
        }

        private async Task InfoAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, _Gateway.Info(await AppAsync(http).ConfigureAwait(false))).ConfigureAwait(false);
        }

        private async Task LogoAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            await SendImageAsync(http, app, app.LogoAssetId, "The app has no logo.").ConfigureAwait(false);
        }

        private async Task FaviconAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            await SendImageAsync(http, app, app.FaviconAssetId ?? app.LogoAssetId, "The app has no favicon or logo.").ConfigureAwait(false);
        }

        private async Task SendImageAsync(HttpContextBase http, AgenticApp app, string? assetId, string missing)
        {
            AgentAsset? asset = assetId == null ? null : await _Server.Database.AgentAssets.ReadAsync(app.TenantId, assetId, http.Token).ConfigureAwait(false);
            AgentAssetVersion? version = asset == null || asset.CurrentVersion < 1 ? null : await _Server.Database.AgentAssets.ReadVersionAsync(app.TenantId, asset.Id, asset.CurrentVersion, http.Token).ConfigureAwait(false);
            AgentAssetFile? file = version?.Files.FirstOrDefault(f => f.MediaType.StartsWith("image/", StringComparison.OrdinalIgnoreCase));
            if (asset == null || file == null) throw new NotFoundException(missing);
            byte[] content = await _Server.Get<AgentAssetService>().ReadFileAsync(app.TenantId, asset, file, http.Token).ConfigureAwait(false);
            http.Response.StatusCode = 200;
            http.Response.ContentType = file.MediaType;
            http.Response.Headers["Cache-Control"] = "public, max-age=300";
            http.Response.Headers["X-Content-Type-Options"] = "nosniff";
            http.Response.Headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
            await http.Response.Send(content, http.Token).ConfigureAwait(false);
        }

        private async Task StartSessionAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            RequestContext? bearer = null;
            string? header = http.Request.Headers["Authorization"];
            if (header != null && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) && !header.Substring(7).Trim().StartsWith(Garrison.Core.Constants.AppSessionTokenPrefix, StringComparison.Ordinal))
            {
                bearer = await _Server.Authentication.ResolveAsync(http.Request.Headers, http.Request.Method.ToString(), http.Request.Url.RawWithoutQuery, http.Request.Query.Querystring, http.Request.DataAsBytes, http.Request.Source.IpAddress, http.Token).ConfigureAwait(false);
                if (!bearer.IsAuthenticated) throw new AppAccessException(401, "InvalidCredentials", "The token is not valid.");
            }
            AppSessionRequest? request = http.Request.ContentLength > 0 ? RouteHelpers.Body<AppSessionRequest>(http) : null;
            await RouteHelpers.JsonAsync(http, 201, await _Gateway.StartSessionAsync(app, request, bearer, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task EndSessionAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            await _Gateway.EndSessionAsync(session, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ConversationsAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Gateway.ConversationsAsync(app, session, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task StartConversationAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            AppTurnView turn = await _Gateway.StartAsync(app, session, RouteHelpers.Body<AppMessageRequest>(http), http.Token).ConfigureAwait(false);
            Run run = await _Server.Database.Runs.ReadAsync(app.TenantId, turn.RunId, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("Turn not found.");
            await RouteHelpers.JsonAsync(http, 201, new { conversationId = run.ConversationId, turn }).ConfigureAwait(false);
        }

        private async Task ConversationAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Gateway.ConversationAsync(app, session, RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task SendAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            AppTurnView turn = await _Gateway.SendAsync(app, session, RouteHelpers.Param(http, "id"), RouteHelpers.Body<AppMessageRequest>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, turn).ConfigureAwait(false);
        }

        private async Task TurnStreamAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            Run run = await _Gateway.TurnRunAsync(app, session, RouteHelpers.Param(http, "id"), RouteHelpers.Param(http, "runId"), http.Token).ConfigureAwait(false);
            long after = RouteHelpers.QueryLong(http, "afterSequence") ?? 0;
            string? lastEventId = http.Request.Headers["Last-Event-ID"];
            if (!String.IsNullOrEmpty(lastEventId) && Int64.TryParse(lastEventId, out long resumeAfter) && resumeAfter > after) after = resumeAfter;
            BeginStream(http);
            RunEventService events = _Server.Get<RunEventService>();
            RunSignals signals = _Server.Get<RunSignals>();
            string lastStatus = String.Empty;
            using (RunSignalSubscription signal = signals.Subscribe(run.Id))
            {
                while (!http.Token.IsCancellationRequested && !_Server.IsDraining)
                {
                    Run? current = await _Server.Database.Runs.ReadAsync(app.TenantId, run.Id, http.Token).ConfigureAwait(false);
                    if (current == null) break;
                    RunEventsResponse batch = await events.ReadAsync(current, after, 500, http.Token).ConfigureAwait(false);
                    foreach (RunEvent evt in batch.Events)
                    {
                        after = evt.Sequence;
                        if (!AppGatewayService.Visible(app, evt)) continue;
                        evt.RawEventJson = null;
                        await http.Response.SendEvent(new ServerSentEvent { Id = evt.Sequence.ToString(System.Globalization.CultureInfo.InvariantCulture), Event = "turn.event", Data = Serializer.Serialize(evt) }, false, http.Token).ConfigureAwait(false);
                    }
                    AppTurnView turn = AppGatewayService.Turn(current, app.ShowOperatorDetail);
                    string status = turn.Status + ":" + turn.AwaitingApproval;
                    if (status != lastStatus)
                    {
                        lastStatus = status;
                        await http.Response.SendEvent(new ServerSentEvent { Event = "turn.status", Data = Serializer.Serialize(turn) }, false, http.Token).ConfigureAwait(false);
                    }
                    if (RunService.IsTerminal(current.Status) && !batch.HasMore)
                    {
                        await http.Response.SendEvent(new ServerSentEvent { Event = "turn.completed", Data = Serializer.Serialize(turn) }, true, http.Token).ConfigureAwait(false);
                        return;
                    }
                    if (!batch.HasMore)
                    {
                        try
                        {
                            await signal.WaitAsync(1000, http.Token).ConfigureAwait(false);
                        }
                        catch (OperationCanceledException)
                        {
                            return;
                        }
                    }
                }
            }
        }

        private async Task<ConversationFileSpace> SpaceAsync(HttpContextBase http, AgenticApp app)
        {
            AppSession session = await SessionAsync(http, app).ConfigureAwait(false);
            return await _Gateway.FileSpaceAsync(app, session, RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false);
        }

        private async Task<ConversationFile> FileAsync(HttpContextBase http, ConversationFileSpace space)
        {
            string path = RouteHelpers.Query(http, "path") ?? String.Empty;
            return await _Server.Database.FileSpaces.ReadFileAsync(space.TenantId, space.Id, path, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("File " + path + " not found.");
        }

        private async Task FilesAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            ConversationFileSpace space = await SpaceAsync(http, app).ConfigureAwait(false);
            List<ConversationFile> files = await _Server.Database.FileSpaces.ListFilesAsync(space.TenantId, space.Id, false, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, new FileSpaceListing { FileSpaceId = space.Id, FileCount = files.Count, TotalBytes = files.Sum(f => f.SizeBytes), Files = files }).ConfigureAwait(false);
        }

        private async Task FileContentAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            ConversationFileSpace space = await SpaceAsync(http, app).ConfigureAwait(false);
            ConversationFile file = await FileAsync(http, space).ConfigureAwait(false);
            FileSpaceContent content = await _Server.Get<FileSpaceService>().ReadAsync(space, file, RouteHelpers.QueryInt(http, "version"), http.Token).ConfigureAwait(false);
            http.Response.StatusCode = 200;
            http.Response.ContentType = content.Version.MediaType;
            http.Response.Headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + Uri.EscapeDataString(Path.GetFileName(content.Path));
            http.Response.Headers["Cache-Control"] = "private, no-store";
            http.Response.Headers["X-Content-Type-Options"] = "nosniff";
            http.Response.Headers["ETag"] = "\"" + content.Version.Sha256 + "\"";
            http.Response.Headers["X-Garrison-File-Version"] = content.Version.Number.ToString(System.Globalization.CultureInfo.InvariantCulture);
            await http.Response.Send(content.Content, http.Token).ConfigureAwait(false);
        }

        private async Task FileVersionsAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            ConversationFileSpace space = await SpaceAsync(http, app).ConfigureAwait(false);
            ConversationFile file = await FileAsync(http, space).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.FileSpaces.ListVersionsAsync(file.TenantId, file.Id, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DownloadUrlAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            ConversationFileSpace space = await SpaceAsync(http, app).ConfigureAwait(false);
            ConversationFile file = await FileAsync(http, space).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, _Server.Get<FileSpaceService>().DownloadUrl(space, file, RouteHelpers.QueryInt(http, "version"), ExternalUrls.RestBaseUrl(_Server, http))).ConfigureAwait(false);
        }

        private async Task FileStreamAsync(HttpContextBase http)
        {
            AgenticApp app = await AppAsync(http).ConfigureAwait(false);
            ConversationFileSpace space = await SpaceAsync(http, app).ConfigureAwait(false);
            BeginStream(http);
            Dictionary<string, string> before = new Dictionary<string, string>(StringComparer.Ordinal);
            bool first = true;
            while (!http.Token.IsCancellationRequested && !_Server.IsDraining)
            {
                List<ConversationFile> files = await _Server.Database.FileSpaces.ListFilesAsync(space.TenantId, space.Id, true, http.Token).ConfigureAwait(false);
                List<object> changed = new List<object>();
                foreach (ConversationFile file in files)
                {
                    string stamp = file.CurrentVersion + (file.Deleted ? "d" : String.Empty);
                    if (!first && before.TryGetValue(file.Path, out string? seen) && seen == stamp) continue;
                    before[file.Path] = stamp;
                    if (first && file.Deleted) continue;
                    changed.Add(new { path = file.Path, version = file.CurrentVersion, deleted = file.Deleted, sha256 = file.Sha256, sizeBytes = file.SizeBytes });
                }
                if (first || changed.Count > 0)
                {
                    await http.Response.SendEvent(new ServerSentEvent { Event = "files.changed", Data = Serializer.Serialize(new { conversationId = RouteHelpers.Param(http, "id"), changed }) }, false, http.Token).ConfigureAwait(false);
                }
                first = false;
                try
                {
                    await Task.Delay(1000, http.Token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
            }
        }

        private static void BeginStream(HttpContextBase http)
        {
            http.Response.StatusCode = 200;
            http.Response.ContentType = "text/event-stream";
            http.Response.Headers.Add("Cache-Control", "no-cache");
            http.Response.Headers.Add("X-Accel-Buffering", "no");
            http.Response.ServerSentEvents = true;
        }

        #endregion
    }
}
