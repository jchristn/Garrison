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
    /// Canary releases (AA9): an agent's traffic moves from a baseline deployment to a candidate in steps of deployment
    /// weight while the candidate's error rate and optional eval score stay within thresholds; crossing one rolls the
    /// weights back and notifies CanaryRolledBack. Only people start and abort releases.
    /// </summary>
    public class CanaryReleasesClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public CanaryReleasesClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List canary releases, newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<CanaryRelease>> ListAsync(CanaryReleaseFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["agent"] = filter.Agent;
                query["status"] = filter.Status?.ToString();
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<CanaryRelease>>(HttpMethod.Get, TenantPath("/canary-releases"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<CanaryRelease>();
        }

        /// <summary>
        /// Start a canary release. AgentId, CandidateDeploymentId, and BaselineDeploymentId take identifiers or names; Steps
        /// rise to a last WeightPercent of 100; MinEvalScore and EvalSetId go together. People only; needs Update on both
        /// deployments. The first step's weights apply at once. A busy deployment answers 409 CanaryAlreadyRunning.
        /// </summary>
        /// <param name="release">The release.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The running release.</returns>
        /// <exception cref="ArgumentNullException">Thrown when release is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<CanaryRelease> CreateAsync(CanaryRelease release, CancellationToken token = default)
        {
            if (release == null) throw new ArgumentNullException(nameof(release));
            return await Transport.SendAsync<CanaryRelease>(HttpMethod.Post, TenantPath("/canary-releases"), release, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read a canary release with its current step and rollback reason.
        /// </summary>
        /// <param name="id">Release identifier (cnr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The release.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<CanaryRelease> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<CanaryRelease>(HttpMethod.Get, TenantPath("/canary-releases/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Abort a running canary release (people only). Both deployments go back to their weights from before the release.
        /// A release that is not Running answers 409 CanaryNotRunning.
        /// </summary>
        /// <param name="id">Release identifier (cnr_).</param>
        /// <param name="reason">Why, at most 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The aborted release.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<CanaryRelease> AbortAsync(string id, string? reason = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<CanaryRelease>(HttpMethod.Post, TenantPath("/canary-releases/" + Segment(id) + "/abort"), new CanaryAbortRequest { Reason = reason }, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
