namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;

    /// <summary>
    /// Fan-out groups: child runs a run started with the garrison_fan_out MCP tool. Groups are only created by runs, so
    /// this client reads and cancels them. A group that does not exist or belongs to another tenant is a 404.
    /// Thread-safe.
    /// </summary>
    public class FanOutGroupsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public FanOutGroupsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List the fan-out groups a run started, oldest first.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Groups; empty when the run started none.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runId is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 when the run does not exist.</exception>
        public async Task<List<FanOutGroup>> ListByRunAsync(string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            return await Transport.SendAsync<List<FanOutGroup>>(HttpMethod.Get, TenantPath("/runs/" + Segment(runId) + "/fan-out-groups"), token: token).ConfigureAwait(false) ?? new List<FanOutGroup>();
        }

        /// <summary>
        /// Read a fan-out group with its members' state and results.
        /// </summary>
        /// <param name="groupId">Group identifier (fog_...).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The group.</returns>
        /// <exception cref="ArgumentNullException">Thrown when groupId is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<FanOutGroup> GetAsync(string groupId, CancellationToken token = default)
        {
            return await Transport.SendAsync<FanOutGroup>(HttpMethod.Get, Item(groupId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Cancel a fan-out group: members still running are cancelled.
        /// </summary>
        /// <param name="groupId">Group identifier (fog_...).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The group as it stands after the cancel.</returns>
        /// <exception cref="ArgumentNullException">Thrown when groupId is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<FanOutGroup> CancelAsync(string groupId, CancellationToken token = default)
        {
            return await Transport.SendAsync<FanOutGroup>(HttpMethod.Post, Item(groupId) + "/cancel", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private string Item(string groupId)
        {
            if (String.IsNullOrEmpty(groupId)) throw new ArgumentNullException(nameof(groupId));
            return TenantPath("/fan-out-groups/" + Segment(groupId));
        }

        #endregion
    }
}
