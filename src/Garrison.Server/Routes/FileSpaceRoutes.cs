namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Conversation file space routes (AD3.6): list, read, version history, upload, delete, and download URLs, for a
    /// conversation's space and for a run's space (trees without a conversation). Permission follows the owner: Read or
    /// Update on the Conversation or Run.
    /// </summary>
    public class FileSpaceRoutes
    {
        #region Private-Members

        private static readonly string _Tag = "File spaces";

        private readonly ServerContext _Server;
        private readonly FileSpaceService _Files;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="files">File space service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public FileSpaceRoutes(ServerContext server, FileSpaceService files)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Files = files ?? throw new ArgumentNullException(nameof(files));
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
            foreach (bool conversation in new[] { true, false })
            {
                string owner = conversation ? "conversations" : "runs";
                string what = conversation ? "conversation" : "run";
                ResourceTypeEnum type = conversation ? ResourceTypeEnum.Conversation : ResourceTypeEnum.Run;
                string b = "/v1.0/api/tenants/{tenantId}/" + owner + "/{id}/files";
                List<OpenApiParameterMetadata> pathQuery = new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("path", "File path inside the space.", true, OpenApiSchemaMetadata.String()) };
                List<OpenApiParameterMetadata> versionQuery = new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("path", "File path inside the space.", true, OpenApiSchemaMetadata.String()), OpenApiParameterMetadata.Query("version", "Version number. Default the current version.", false, OpenApiSchemaMetadata.Integer()) };
                routes.Scoped(HttpMethod.GET, b, type, OperationTypeEnum.Read, http => ListAsync(http, conversation), "List the files of the " + what + "'s file space (?includeDeleted=true for deleted ones)", _Tag, null, typeof(FileSpaceListing),
                    "id", new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("includeDeleted", "Also list deleted files.", false, OpenApiSchemaMetadata.Boolean()) });
                routes.Scoped(HttpMethod.GET, b + "/content", type, OperationTypeEnum.Read, http => ContentAsync(http, conversation), "Read a file of the " + what + "'s file space", _Tag, null, null, "id", versionQuery);
                routes.Scoped(HttpMethod.GET, b + "/versions", type, OperationTypeEnum.Read, http => VersionsAsync(http, conversation), "List a file's versions, newest first", _Tag, null, typeof(List<ConversationFileVersion>), "id", pathQuery);
                routes.Scoped(HttpMethod.POST, b, type, OperationTypeEnum.Update, http => WriteAsync(http, conversation), "Upload a file to the " + what + "'s file space: JSON, or raw bytes with ?path=", _Tag, typeof(FileSpaceWriteRequest), typeof(FileSpaceUploadResult));
                routes.Scoped(HttpMethod.DELETE, b, type, OperationTypeEnum.Update, http => DeleteAsync(http, conversation), "Delete a file (its versions are kept)", _Tag, null, null, "id", pathQuery);
                routes.Scoped(HttpMethod.POST, b + "/download-url", type, OperationTypeEnum.Read, http => DownloadUrlAsync(http, conversation), "Issue a short-lived download-only URL for a file version", _Tag, null, typeof(FileDownloadUrl), "id", versionQuery);
            }
            routes.Anonymous(HttpMethod.GET, "/v1.0/file-download/{fileSpaceId}", TicketAsync, "Download one file version with a download-only ticket", _Tag);
        }

        #endregion

        #region Private-Methods

        private async Task<ConversationFileSpace?> SpaceAsync(HttpContextBase http, bool conversation, bool create)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            if (conversation)
            {
                Conversation found = await _Server.Database.Conversations.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("Conversation " + id + " not found.");
                if (create) return await _Files.ForConversationAsync(tenantId, found, http.Token).ConfigureAwait(false);
                return await _Server.Database.FileSpaces.ReadByOwnerAsync(tenantId, "cnv:" + found.Id, http.Token).ConfigureAwait(false);
            }
            Run run = await _Server.Database.Runs.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("Run " + id + " not found.");
            if (!create && String.IsNullOrEmpty(run.FileSpaceId)) return null;
            return await _Files.ForRunAsync(run, http.Token).ConfigureAwait(false);
        }

        private async Task<ConversationFile> FileAsync(HttpContextBase http, ConversationFileSpace? space)
        {
            string path = RouteHelpers.Query(http, "path") ?? String.Empty;
            ConversationFile? file = space == null || String.IsNullOrEmpty(path) ? null : await _Server.Database.FileSpaces.ReadFileAsync(space.TenantId, space.Id, path, http.Token).ConfigureAwait(false);
            return file ?? throw new NotFoundException("File " + path + " not found.");
        }

        private async Task ListAsync(HttpContextBase http, bool conversation)
        {
            ConversationFileSpace? space = await SpaceAsync(http, conversation, false).ConfigureAwait(false);
            FileSpaceListing listing = new FileSpaceListing();
            if (space != null)
            {
                listing.FileSpaceId = space.Id;
                listing.FileCount = space.FileCount;
                listing.TotalBytes = space.TotalBytes;
                listing.Files = await _Server.Database.FileSpaces.ListFilesAsync(space.TenantId, space.Id, RouteHelpers.QueryBool(http, "includeDeleted") == true, http.Token).ConfigureAwait(false);
            }
            await RouteHelpers.JsonAsync(http, 200, listing).ConfigureAwait(false);
        }

        private async Task ContentAsync(HttpContextBase http, bool conversation)
        {
            ConversationFileSpace? space = await SpaceAsync(http, conversation, false).ConfigureAwait(false);
            ConversationFile file = await FileAsync(http, space).ConfigureAwait(false);
            FileSpaceContent content = await _Files.ReadAsync(space!, file, RouteHelpers.QueryInt(http, "version"), http.Token).ConfigureAwait(false);
            await SendAsync(http, content).ConfigureAwait(false);
        }

        private async Task VersionsAsync(HttpContextBase http, bool conversation)
        {
            ConversationFileSpace? space = await SpaceAsync(http, conversation, false).ConfigureAwait(false);
            ConversationFile file = await FileAsync(http, space).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.FileSpaces.ListVersionsAsync(file.TenantId, file.Id, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task WriteAsync(HttpContextBase http, bool conversation)
        {
            ConversationFileSpace space = (await SpaceAsync(http, conversation, true).ConfigureAwait(false))!;
            string path;
            byte[] content;
            string? mediaType;
            int? baseVersion;
            if ((http.Request.ContentType ?? String.Empty).StartsWith("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                path = RouteHelpers.Query(http, "path") ?? String.Empty;
                content = http.Request.DataAsBytes ?? Array.Empty<byte>();
                mediaType = RouteHelpers.Query(http, "mediaType");
                baseVersion = RouteHelpers.QueryInt(http, "baseVersion");
            }
            else
            {
                FileSpaceWriteRequest request = RouteHelpers.RequiredBody<FileSpaceWriteRequest>(http);
                path = request.Path;
                mediaType = request.MediaType;
                baseVersion = request.BaseVersion;
                if (request.ContentBase64 != null)
                {
                    try
                    {
                        content = Convert.FromBase64String(request.ContentBase64);
                    }
                    catch (FormatException)
                    {
                        throw new ValidationException("contentBase64 is not valid base64.", new Dictionary<string, string> { ["contentBase64"] = "Not valid base64." });
                    }
                }
                else if (request.Content != null) content = Encoding.UTF8.GetBytes(request.Content);
                else throw new ValidationException("Give contentBase64 or content.", new Dictionary<string, string> { ["contentBase64"] = "Required." });
            }
            FileSpaceUploadResult result = await _Files.WriteAsync(space, path, content, mediaType, baseVersion, null, null, RouteHelpers.Context(http).PrincipalName, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, result).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http, bool conversation)
        {
            ConversationFileSpace? space = await SpaceAsync(http, conversation, false).ConfigureAwait(false);
            if (space == null || !await _Files.DeleteAsync(space, RouteHelpers.Query(http, "path") ?? String.Empty, http.Token).ConfigureAwait(false))
            {
                throw new NotFoundException("File " + RouteHelpers.Query(http, "path") + " not found.");
            }
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task DownloadUrlAsync(HttpContextBase http, bool conversation)
        {
            ConversationFileSpace? space = await SpaceAsync(http, conversation, false).ConfigureAwait(false);
            ConversationFile file = await FileAsync(http, space).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, _Files.DownloadUrl(space!, file, RouteHelpers.QueryInt(http, "version"), ExternalUrls.RestBaseUrl(_Server, http))).ConfigureAwait(false);
        }

        private async Task TicketAsync(HttpContextBase http)
        {
            FileSpaceContent? content = await _Files.ResolveDownloadAsync(RouteHelpers.Param(http, "fileSpaceId") ?? String.Empty, RouteHelpers.Query(http, "ticket") ?? String.Empty, http.Token).ConfigureAwait(false);
            if (content == null) throw new NotFoundException("File download not found or expired.");
            await SendAsync(http, content).ConfigureAwait(false);
        }

        private static async Task SendAsync(HttpContextBase http, FileSpaceContent content)
        {
            http.Response.StatusCode = 200;
            http.Response.ContentType = content.Version.MediaType;
            http.Response.Headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + Uri.EscapeDataString(Path.GetFileName(content.Path));
            http.Response.Headers["Cache-Control"] = "private, no-store";
            http.Response.Headers["X-Content-Type-Options"] = "nosniff";
            http.Response.Headers["ETag"] = "\"" + content.Version.Sha256 + "\"";
            http.Response.Headers["X-Garrison-File-Version"] = content.Version.Number.ToString(System.Globalization.CultureInfo.InvariantCulture);
            await http.Response.Send(content.Content, http.Token).ConfigureAwait(false);
        }

        #endregion
    }
}
