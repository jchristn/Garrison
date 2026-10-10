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
    /// Harness profiles describing how harnesses run headless.
    /// </summary>
    public class HarnessProfilesClient : ResourceClient<HarnessProfile, HarnessProfile>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public HarnessProfilesClient(GarrisonTransport transport) : base(transport, "harness-profiles")
        {
        }

        /// <summary>
        /// List built-in harness profiles.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Profiles.</returns>
        public async Task<List<HarnessProfile>> ListBuiltInAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<List<HarnessProfile>>(HttpMethod.Get, "/v1.0/api/harness-profiles/builtin", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Clone a profile into a new tenant profile.
        /// </summary>
        /// <param name="id">Profile identifier.</param>
        /// <param name="name">New name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>New profile.</returns>
        public async Task<HarnessProfile> CloneAsync(string id, string name, CancellationToken token = default)
        {
            return await Transport.SendAsync<HarnessProfile>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/clone", new CloneRequest { Name = name }, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
