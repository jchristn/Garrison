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

    /// <summary>
    /// Freezes and the autonomy kill switch (AA3). Reading needs Read on Freeze; applying needs Create; lifting and setting
    /// the kill switch need Update. Run tokens never hold these permissions.
    /// </summary>
    public class FreezesClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public FreezesClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List freezes, active first and then newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Freeze>> ListAsync(FreezeFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["targetKind"] = filter.TargetKind?.ToString();
                query["targetId"] = filter.TargetId;
                query["active"] = filter.Active.HasValue ? (filter.Active.Value ? "true" : "false") : null;
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<Freeze>>(HttpMethod.Get, TenantPath("/freezes"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Freeze>();
        }

        /// <summary>
        /// Read a freeze.
        /// </summary>
        /// <param name="id">Freeze identifier (mfz_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Freeze.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Freeze> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Freeze>(HttpMethod.Get, TenantPath("/freezes/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Apply a freeze to an agent, deployment, mandate, or app. New runs in scope are refused with 409 Frozen and
        /// keepers in scope stop ticking; CancelActiveRuns also cancels the runs already in scope.
        /// </summary>
        /// <param name="freeze">Target kind, target (identifier or name), reason, and whether to cancel active runs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Applied freeze.</returns>
        /// <exception cref="ArgumentNullException">Thrown when freeze is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Freeze> ApplyAsync(Freeze freeze, CancellationToken token = default)
        {
            if (freeze == null) throw new ArgumentNullException(nameof(freeze));
            return await Transport.SendAsync<Freeze>(HttpMethod.Post, TenantPath("/freezes"), freeze, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Lift an active freeze. A frozen keeper becomes Active again with its next wake spread over a short window.
        /// </summary>
        /// <param name="id">Freeze identifier (mfz_).</param>
        /// <param name="request">Optional reason.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Lifted freeze.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Freeze> LiftAsync(string id, FreezeLiftRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<Freeze>(HttpMethod.Post, TenantPath("/freezes/" + Segment(id) + "/lift"), request ?? new FreezeLiftRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read the autonomy kill switch.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Kill switch state.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<KillSwitchState> GetKillSwitchAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<KillSwitchState>(HttpMethod.Get, TenantPath("/autonomy/kill-switch"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Turn the autonomy kill switch on or off. While it is on, no keeper ticks start and keeper runs are refused;
        /// ordinary invocations keep working.
        /// </summary>
        /// <param name="request">Enabled and an optional reason.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Kill switch state.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<KillSwitchState> SetKillSwitchAsync(KillSwitchRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<KillSwitchState>(HttpMethod.Put, TenantPath("/autonomy/kill-switch"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
