namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Security;

    /// <summary>
    /// Asset content for manifests (AD2.6), on top of <see cref="AgentAssetService"/>: the same limits, hashing, and
    /// storage as the REST upload. Thread-safe.
    /// </summary>
    public class ManifestAssetContentStore : IAssetContentStore
    {
        #region Private-Members

        private readonly AgentAssetService _Assets;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="assets">Asset service.</param>
        /// <exception cref="ArgumentNullException">Thrown when assets is null.</exception>
        public ManifestAssetContentStore(AgentAssetService assets)
        {
            _Assets = assets ?? throw new ArgumentNullException(nameof(assets));
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AgentAssetVersion> UploadAsync(string tenantId, AgentAsset asset, List<AgentAssetFile> files, string? changeNote, CancellationToken token)
        {
            RequestContext ctx = new RequestContext();
            ctx.IsAuthenticated = true;
            ctx.TenantId = tenantId;
            ctx.PrincipalType = PrincipalTypeEnum.User;
            ctx.PrincipalName = "manifest";
            AgentAssetUploadResult result = await _Assets.UploadVersionAsync(ctx, tenantId, asset, files, null, changeNote, token).ConfigureAwait(false);
            return result.Version;
        }

        /// <inheritdoc />
        public Task<byte[]> ReadAsync(string tenantId, AgentAsset asset, AgentAssetFile file, CancellationToken token)
        {
            return _Assets.ReadFileAsync(tenantId, asset, file, token);
        }

        #endregion
    }
}
