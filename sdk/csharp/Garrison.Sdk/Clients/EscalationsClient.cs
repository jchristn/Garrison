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
    /// Escalations (AA2): list, read, answer, and cancel the questions runs raise. Runs raise and withdraw them through
    /// MCP. Reading needs Read on Escalation; answering and cancelling need Update on Escalation.
    /// </summary>
    public class EscalationsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public EscalationsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List escalations, open first and then newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Escalation>> ListAsync(EscalationFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["status"] = filter.Status?.ToString();
                query["severity"] = filter.Severity?.ToString();
                query["targetKind"] = filter.TargetKind?.ToString();
                query["targetId"] = filter.TargetId;
                query["agentId"] = filter.AgentId;
                query["mandateId"] = filter.MandateId;
                query["raisingRunId"] = filter.RaisingRunId;
                query["search"] = filter.Search;
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<Escalation>>(HttpMethod.Get, TenantPath("/escalations"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Escalation>();
        }

        /// <summary>
        /// Read an escalation with its options and answer.
        /// </summary>
        /// <param name="id">Escalation identifier (esc_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Escalation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Escalation> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Escalation>(HttpMethod.Get, TenantPath("/escalations/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Answer an open escalation. A run blocked on it resumes; a keeper that raised it wakes. The server answers 409
        /// EscalationNotOpen when it was already resolved and EscalatedUp when it was passed up to another escalation.
        /// </summary>
        /// <param name="id">Escalation identifier (esc_).</param>
        /// <param name="request">Choice and text.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Answered escalation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Escalation> AnswerAsync(string id, EscalationAnswerRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Escalation>(HttpMethod.Post, TenantPath("/escalations/" + Segment(id) + "/answer"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Cancel an open escalation. A run blocked on it is cancelled too.
        /// </summary>
        /// <param name="id">Escalation identifier (esc_).</param>
        /// <param name="request">Optional reason.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cancelled escalation.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Escalation> CancelAsync(string id, EscalationCancelRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<Escalation>(HttpMethod.Post, TenantPath("/escalations/" + Segment(id) + "/cancel"), request ?? new EscalationCancelRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
