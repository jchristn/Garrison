namespace Garrison.Server.Routes
{
    using System;
    using System.Globalization;
    using System.IO;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>Tenant-scoped artifact metadata, run uploads, content, and short-lived download-only links.</summary>
    public class ArtifactRoutes
    {
        private readonly ServerContext _Context;
        private readonly ArtifactService _Artifacts;
        private readonly string _Base = "/v1.0/api/tenants/{tenantId}/artifacts";

        /// <summary>Construct artifact routes.</summary>
        /// <param name="context">Server context.</param>
        /// <param name="artifacts">Artifact service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ArtifactRoutes(ServerContext context, ArtifactService artifacts)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Artifacts = artifacts ?? throw new ArgumentNullException(nameof(artifacts));
        }

        /// <summary>Register transfers and metadata in the operation scope map.</summary>
        /// <param name="routes">Route registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Artifact, OperationTypeEnum.Read, ListAsync, "List artifact metadata (optional runId and storeId filters)", "Artifacts", null, typeof(Garrison.Core.Enumeration.EnumerationResult<Artifact>));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Artifact, OperationTypeEnum.Read, ReadAsync, "Read artifact metadata", "Artifacts", null, typeof(Artifact));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/content", ResourceTypeEnum.Artifact, OperationTypeEnum.Read, ContentAsync, "Download artifact content", "Artifacts");
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/download-url", ResourceTypeEnum.Artifact, OperationTypeEnum.Read, LinkAsync, "Create a short-lived download-only URL", "Artifacts", null, typeof(ArtifactDownloadResponse));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Artifact, OperationTypeEnum.Delete, DeleteAsync, "Delete artifact content and metadata", "Artifacts");
            routes.Scoped(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts", ResourceTypeEnum.Artifact, OperationTypeEnum.Read, ListRunAsync, "List a run's artifact metadata", "Artifacts", null, typeof(Garrison.Core.Enumeration.EnumerationResult<Artifact>));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/tenants/{tenantId}/runs/{runId}/artifacts", ResourceTypeEnum.Artifact, OperationTypeEnum.Create, UploadAsync, "Upload one configured artifact as application/octet-stream (name, storeId, epoch, repairAttempt, mediaType query parameters)", "Artifacts", typeof(byte[]), typeof(Artifact));
            routes.Anonymous(HttpMethod.GET, "/v1.0/artifact-download/{id}", SignedContentAsync, "Download one artifact using its download-only ticket", "Artifacts");
        }

        private async Task ListAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await _Context.Database.Artifacts.EnumerateAsync(RouteHelpers.Tenant(context), RouteHelpers.Enumeration(context),
                RouteHelpers.Query(context, "runId"), RouteHelpers.Query(context, "storeId"), context.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ListRunAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await _Context.Database.Artifacts.EnumerateAsync(RouteHelpers.Tenant(context), RouteHelpers.Enumeration(context),
                RouteHelpers.Param(context, "runId"), token: context.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await LoadAsync(context).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UploadAsync(HttpContextBase context)
        {
            RequestContext principal = RouteHelpers.Context(context);
            string runId = RouteHelpers.Param(context, "runId")!;
            if (principal.PrincipalType == PrincipalTypeEnum.Run && principal.RunId != runId) throw new NotFoundException("Run not found.");
            if (context.Request.ContentLength > _Context.Settings.Artifacts.MaxFileBytes) throw new ValidationException("Artifact exceeds the configured file byte limit.");
            long? epoch = RouteHelpers.QueryLong(context, "epoch");
            int? repair = RouteHelpers.QueryInt(context, "repairAttempt");
            if (!epoch.HasValue || epoch.Value < 1 || !repair.HasValue || repair.Value < 0) throw new ValidationException("Artifact upload requires an epoch and repairAttempt.");
            Artifact artifact = await _Artifacts.UploadAsync(RouteHelpers.Tenant(context), runId, RouteHelpers.Query(context, "storeId") ?? String.Empty,
                RouteHelpers.Query(context, "name") ?? String.Empty, RouteHelpers.Query(context, "mediaType") ?? "application/octet-stream",
                epoch.Value, repair.Value, context.Request.DataAsBytes ?? Array.Empty<byte>(), context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 201, artifact).ConfigureAwait(false);
        }

        private async Task ContentAsync(HttpContextBase context)
        {
            await SendContentAsync(context, await LoadAsync(context).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task LinkAsync(HttpContextBase context)
        {
            Artifact artifact = await LoadAsync(context).ConfigureAwait(false);
            string ticket = _Artifacts.Ticket(artifact, out DateTime expires);
            string url = ExternalUrls.RestBaseUrl(_Context, context) + "/v1.0/artifact-download/" + Uri.EscapeDataString(artifact.Id) + "?ticket=" + Uri.EscapeDataString(ticket);
            await RouteHelpers.JsonAsync(context, 200, new ArtifactDownloadResponse { Url = url, ExpiresUtc = expires }).ConfigureAwait(false);
        }

        private async Task SignedContentAsync(HttpContextBase context)
        {
            Artifact? artifact = await _Artifacts.ResolveTicketAsync(RouteHelpers.Param(context, "id")!, RouteHelpers.Query(context, "ticket") ?? String.Empty, context.Token).ConfigureAwait(false);
            if (artifact == null) throw new NotFoundException("Artifact download not found or expired.");
            await SendContentAsync(context, artifact).ConfigureAwait(false);
        }

        private async Task SendContentAsync(HttpContextBase context, Artifact artifact)
        {
            byte[] bytes = await _Artifacts.ReadAsync(artifact, context.Token).ConfigureAwait(false);
            context.Response.StatusCode = 200;
            context.Response.ContentType = artifact.MediaType;
            context.Response.Headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + Uri.EscapeDataString(Path.GetFileName(artifact.Name));
            context.Response.Headers["Cache-Control"] = "private, no-store";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["ETag"] = "\"" + artifact.Sha256 + "\"";
            await context.Response.Send(bytes, context.Token).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase context)
        {
            await _Artifacts.DeleteAsync(await LoadAsync(context).ConfigureAwait(false), context.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(context).ConfigureAwait(false);
        }

        private async Task<Artifact> LoadAsync(HttpContextBase context)
        {
            return await _Context.Database.Artifacts.ReadAsync(RouteHelpers.Tenant(context), RouteHelpers.Param(context, "id")!, context.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Artifact not found.");
        }
    }
}
