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
    /// Daily UTC quotas and accounting.
    /// </summary>
    public class UsageQuotasClient : ResourceClient<UsageQuota, UsageQuota>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public UsageQuotasClient(GarrisonTransport transport) : base(transport, "usage-quotas")
        {
        }

        /// <summary>Read today's UTC usage and current active concurrency.</summary>
        /// <param name="id">Quota ID.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Usage, including incomplete-cost coverage.</returns>
        public async Task<UsageQuotaUsage> UsageAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<UsageQuotaUsage>(HttpMethod.Get, TenantPath("/usage-quotas/" + Segment(id) + "/usage"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty usage response.");
        }

    }
}
