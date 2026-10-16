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
    /// Server and cluster settings (system administrators).
    /// </summary>
    public class SettingsClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public SettingsClient(GarrisonTransport transport) : base(transport)
        {
        }

        /// <summary>
        /// Read settings with metadata.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Settings view.</returns>
        public async Task<SettingsView> GetAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<SettingsView>(HttpMethod.Get, "/v1.0/api/settings", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Update settings.
        /// </summary>
        /// <param name="request">Values to change.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Save result.</returns>
        public async Task<SettingsSaveResponse> UpdateAsync(SettingsUpdateRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<SettingsSaveResponse>(HttpMethod.Put, "/v1.0/api/settings", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Restart the server process.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Restart response.</returns>
        public async Task<RestartResponse> RestartAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<RestartResponse>(HttpMethod.Post, "/v1.0/api/settings/restart", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>Re-encrypt stored credentials and secrets with the configured active master key. Requires system administration.</summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pass counts without key material.</returns>
        public async Task<MasterKeyRotationResponse> RotateMasterKeyAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<MasterKeyRotationResponse>(HttpMethod.Post, "/v1.0/api/settings/keys/rotate", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Test database connectivity.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Test result.</returns>
        public async Task<DatabaseTestResponse> TestDatabaseAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<DatabaseTestResponse>(HttpMethod.Post, "/v1.0/api/settings/database/test", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
