namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Declarative manifests (YAML or JSON, multi-document).
    /// </summary>
    public class ManifestsClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ManifestsClient(GarrisonTransport transport) : base(transport)
        {
        }

        /// <summary>
        /// Apply manifests.
        /// </summary>
        /// <param name="content">YAML or JSON documents.</param>
        /// <param name="dryRun">Validate only.</param>
        /// <param name="allowSecretValues">Whether Secret documents may carry values (requires secret management permission).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Apply record with per-document results.</returns>
        public async Task<ManifestApply> ApplyAsync(string content, bool dryRun = false, bool allowSecretValues = false, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(content)) throw new ArgumentNullException(nameof(content));
            Dictionary<string, string?> query = new Dictionary<string, string?> { { "dryRun", dryRun ? "true" : "false" }, { "allowSecretValues", allowSecretValues ? "true" : null } };
            string contentType = content.TrimStart().StartsWith("{") || content.TrimStart().StartsWith("[") ? "application/json" : "application/yaml";
            return await Transport.SendAsync<ManifestApply>(HttpMethod.Post, TenantPath("/manifests/apply"), content, query, contentType, token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Export the tenant's configuration as YAML manifests (secret values excluded).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Manifest text.</returns>
        public async Task<string> ExportAsync(CancellationToken token = default)
        {
            return await Transport.SendTextAsync(HttpMethod.Post, TenantPath("/manifests/export"), token: token).ConfigureAwait(false);
        }
        /// <summary>
        /// List previous applies.
        /// </summary>
        /// <param name="query">Optional query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<ManifestApply>> ListAppliesAsync(EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<ManifestApply>>(HttpMethod.Get, TenantPath("/manifests/applies"), null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<ManifestApply>();
        }

        /// <summary>
        /// Read one apply with per-document results.
        /// </summary>
        /// <param name="id">Apply identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Apply record.</returns>
        public async Task<ManifestApply> GetApplyAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<ManifestApply>(HttpMethod.Get, TenantPath("/manifests/applies/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
