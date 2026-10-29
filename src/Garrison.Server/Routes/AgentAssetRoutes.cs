namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Agent asset routes (AD2.5): assets, versions with uploads, file content, and the download-only route workers use
    /// to fetch asset files for a run. Assets in the path may be given by identifier or name.
    /// </summary>
    public class AgentAssetRoutes
    {
        #region Private-Members

        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/agent-assets";
        private static readonly string _Tag = "Agent assets";

        private readonly ServerContext _Server;
        private readonly AgentAssetService _Assets;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="assets">Asset service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AgentAssetRoutes(ServerContext server, AgentAssetService assets)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Assets = assets ?? throw new ArgumentNullException(nameof(assets));
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.AgentAsset, OperationTypeEnum.Read, ListAsync, "List agent assets", _Tag, null, typeof(EnumerationResult<AgentAsset>),
                "id", new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("kind", "Only assets of this kind: SystemPrompt, Skill, ReferenceFile, or DocumentTemplate.", false, OpenApiSchemaMetadata.String()) });
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.AgentAsset, OperationTypeEnum.Create, CreateAsync, "Create an agent asset", _Tag, typeof(AgentAsset), typeof(AgentAsset));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Read, ReadAsync, "Read an agent asset by identifier or name", _Tag, null, typeof(AgentAsset));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Update, UpdateAsync, "Update an agent asset", _Tag, typeof(AgentAsset), typeof(AgentAsset));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Delete, DeleteAsync, "Delete an agent asset and its versions (409 AssetInUse while a revision pins it)", _Tag);
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/versions", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Read, VersionsAsync, "List an asset's versions, newest first", _Tag, null, typeof(List<AgentAssetVersion>));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/versions", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Create, UploadAsync, "Upload a new version: a JSON body with base64 files, or one file as application/octet-stream with ?path=", _Tag, typeof(AgentAssetVersionUpload), typeof(AgentAssetVersion),
                "id", new List<OpenApiParameterMetadata>
                {
                    OpenApiParameterMetadata.Query("path", "For an application/octet-stream body: the file's path inside the asset.", false, OpenApiSchemaMetadata.String()),
                    OpenApiParameterMetadata.Query("mediaType", "For an application/octet-stream body: the file's media type. Default: guessed from the extension.", false, OpenApiSchemaMetadata.String()),
                    OpenApiParameterMetadata.Query("changeNote", "For an application/octet-stream body: the change note.", false, OpenApiSchemaMetadata.String())
                });
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/versions/{number}", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Read, VersionAsync, "Read one asset version with its files", _Tag, null, typeof(AgentAssetVersion));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/versions/{number}/files", ResourceTypeEnum.AgentAsset, OperationTypeEnum.Read, FileAsync, "Read one file of an asset version (?path=); text files serve as a read-only preview", _Tag, null, null,
                "id", new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("path", "File path inside the asset.", true, OpenApiSchemaMetadata.String()) });
            routes.Anonymous(HttpMethod.GET, "/v1.0/asset-download/{assetId}", DownloadAsync, "Download one asset file with the download-only ticket a leased run carries", _Tag);
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            AgentAssetKindEnum? kind = RouteHelpers.QueryEnum<AgentAssetKindEnum>(http, "kind");
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.AgentAssets.EnumerateAsync(RouteHelpers.Tenant(http), kind, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            AgentAsset created = await _Assets.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<AgentAsset>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            AgentAsset? asset = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (asset == null) return;
            await RouteHelpers.JsonAsync(http, 200, asset).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            AgentAsset? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            AgentAsset saved = await _Assets.UpdateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, RouteHelpers.RequiredBody<AgentAsset>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, saved).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            AgentAsset? existing = await LoadAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (existing == null) return;
            await _Assets.DeleteAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task VersionsAsync(HttpContextBase http)
        {
            AgentAsset? asset = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (asset == null) return;
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.AgentAssets.ListVersionsAsync(RouteHelpers.Tenant(http), asset.Id, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UploadAsync(HttpContextBase http)
        {
            AgentAsset? asset = await LoadAsync(http, OperationTypeEnum.Create).ConfigureAwait(false);
            if (asset == null) return;
            string contentType = http.Request.ContentType ?? String.Empty;
            AgentAssetUploadResult result;
            if (contentType.StartsWith("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                string path = RouteHelpers.Query(http, "path") ?? String.Empty;
                AgentAssetFile file = new AgentAssetFile { Path = path, MediaType = RouteHelpers.Query(http, "mediaType") ?? String.Empty };
                Dictionary<string, byte[]> contents = new Dictionary<string, byte[]>(StringComparer.Ordinal) { [path] = http.Request.DataAsBytes ?? Array.Empty<byte>() };
                result = await _Assets.UploadVersionAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), asset, new List<AgentAssetFile> { file }, contents, RouteHelpers.Query(http, "changeNote"), http.Token).ConfigureAwait(false);
            }
            else
            {
                AgentAssetVersionUpload upload = RouteHelpers.RequiredBody<AgentAssetVersionUpload>(http);
                result = await _Assets.UploadVersionAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), asset, upload.Files, null, upload.ChangeNote, http.Token).ConfigureAwait(false);
            }
            await RouteHelpers.JsonAsync(http, result.Created ? 201 : 200, result.Version).ConfigureAwait(false);
        }

        private async Task VersionAsync(HttpContextBase http)
        {
            AgentAsset? asset = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (asset == null) return;
            AgentAssetVersion version = await LoadVersionAsync(http, asset).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, version).ConfigureAwait(false);
        }

        private async Task FileAsync(HttpContextBase http)
        {
            AgentAsset? asset = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (asset == null) return;
            AgentAssetVersion version = await LoadVersionAsync(http, asset).ConfigureAwait(false);
            string path = RouteHelpers.Query(http, "path") ?? String.Empty;
            AgentAssetFile file = version.Files.FirstOrDefault(f => f.Path == path) ?? throw new NotFoundException("File " + path + " is not part of version " + version.Number + " of asset " + asset.Name + ".");
            byte[] content = await _Assets.ReadFileAsync(RouteHelpers.Tenant(http), asset, file, http.Token).ConfigureAwait(false);
            await SendAsync(http, file, content).ConfigureAwait(false);
        }

        private async Task DownloadAsync(HttpContextBase http)
        {
            AgentAssetDownload? download = await _Assets.ResolveDownloadAsync(RouteHelpers.Param(http, "assetId") ?? String.Empty, RouteHelpers.Query(http, "ticket") ?? String.Empty, http.Token).ConfigureAwait(false);
            if (download == null) throw new NotFoundException("Asset download not found or expired.");
            await SendAsync(http, download.File, download.Content).ConfigureAwait(false);
        }

        private static async Task SendAsync(HttpContextBase http, AgentAssetFile file, byte[] content)
        {
            http.Response.StatusCode = 200;
            http.Response.ContentType = file.MediaType;
            http.Response.Headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + Uri.EscapeDataString(Path.GetFileName(file.Path));
            http.Response.Headers["Cache-Control"] = "private, no-store";
            http.Response.Headers["X-Content-Type-Options"] = "nosniff";
            http.Response.Headers["ETag"] = "\"" + file.Sha256 + "\"";
            await http.Response.Send(content, http.Token).ConfigureAwait(false);
        }

        private async Task<AgentAssetVersion> LoadVersionAsync(HttpContextBase http, AgentAsset asset)
        {
            string raw = RouteHelpers.Param(http, "number") ?? String.Empty;
            if (!Int32.TryParse(raw, out int number)) throw new NotFoundException("Version " + raw + " of asset " + asset.Name + " not found.");
            return await _Server.Database.AgentAssets.ReadVersionAsync(RouteHelpers.Tenant(http), asset.Id, number, http.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Version " + number + " of asset " + asset.Name + " not found.");
        }

        private async Task<AgentAsset?> LoadAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            AgentAsset? asset = await _Server.Database.AgentAssets.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (asset == null && !String.IsNullOrEmpty(idOrName)) asset = await _Server.Database.AgentAssets.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (asset == null) throw new NotFoundException("Asset " + idOrName + " not found.");
            if (asset.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.AgentAsset, operation, asset.Id).ConfigureAwait(false)) return null;
            return asset;
        }

        #endregion
    }
}
