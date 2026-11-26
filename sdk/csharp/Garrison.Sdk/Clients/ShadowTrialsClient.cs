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
    /// Shadow trials (AA9): a sampled share of a source deployment's inputs is copied to a candidate deployment as runs of
    /// kind Shadow, which cannot cause effects, and the two outputs are compared. Only people start and stop trials.
    /// </summary>
    public class ShadowTrialsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ShadowTrialsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List shadow trials, newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<ShadowTrial>> ListAsync(ShadowTrialFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["source"] = filter.Source;
                query["candidate"] = filter.Candidate;
                query["status"] = filter.Status?.ToString();
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<ShadowTrial>>(HttpMethod.Get, TenantPath("/shadow-trials"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<ShadowTrial>();
        }

        /// <summary>
        /// Start a shadow trial. SourceDeploymentId and CandidateDeploymentId (identifiers or names) must be different
        /// deployments of the same agent; SamplePercent, Name, EndsUtc, ComparisonEvalSetId, and UseJudge are optional. People
        /// only; needs Execute on the agent. A pair that is already running answers 409 ShadowTrialAlreadyRunning.
        /// </summary>
        /// <param name="trial">The trial.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The running trial.</returns>
        /// <exception cref="ArgumentNullException">Thrown when trial is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ShadowTrial> CreateAsync(ShadowTrial trial, CancellationToken token = default)
        {
            if (trial == null) throw new ArgumentNullException(nameof(trial));
            return await Transport.SendAsync<ShadowTrial>(HttpMethod.Post, TenantPath("/shadow-trials"), trial, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read a shadow trial with its compared, agreed, diverged, and candidate failure counts.
        /// </summary>
        /// <param name="id">Trial identifier (shd_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The trial.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ShadowTrial> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<ShadowTrial>(HttpMethod.Get, TenantPath("/shadow-trials/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Stop a running shadow trial (people only). Shadow runs already started finish and are still compared. A trial
        /// that is not Running answers 409 ShadowTrialNotRunning.
        /// </summary>
        /// <param name="id">Trial identifier (shd_).</param>
        /// <param name="reason">Why, at most 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stopped trial.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ShadowTrial> StopAsync(string id, string? reason = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<ShadowTrial>(HttpMethod.Post, TenantPath("/shadow-trials/" + Segment(id) + "/stop"), new ShadowTrialStopRequest { Reason = reason }, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
