namespace Garrison.Sdk.Clients
{
    using System;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;

    /// <summary>
    /// Standard list, get, create, update, and delete operations for a tenant-scoped resource.
    /// </summary>
    /// <typeparam name="TModel">Resource model.</typeparam>
    /// <typeparam name="TRequest">Create and update request type.</typeparam>
    public abstract class ResourceClient<TModel, TRequest> : ClientBase where TModel : class where TRequest : class
    {
        #region Private-Members

        private readonly string _Segment;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        /// <param name="segment">Collection segment, for example agents.</param>
        protected ResourceClient(GarrisonTransport transport, string segment) : base(transport)
        {
            _Segment = segment ?? throw new ArgumentNullException(nameof(segment));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List records.
        /// </summary>
        /// <param name="query">Optional paging, ordering, and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<TModel>> ListAsync(EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<TModel>>(HttpMethod.Get, Collection(), null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<TModel>();
        }

        /// <summary>
        /// Read a record.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record.</returns>
        public async Task<TModel> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<TModel>(HttpMethod.Get, Item(id), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Create a record.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Created record.</returns>
        public virtual async Task<TModel> CreateAsync(TRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<TModel>(HttpMethod.Post, Collection(), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Update a record.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Updated record.</returns>
        public async Task<TModel> UpdateAsync(string id, TRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<TModel>(HttpMethod.Put, Item(id), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete a record.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, Item(id), token: token).ConfigureAwait(false);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Collection path.
        /// </summary>
        /// <returns>Path.</returns>
        protected virtual string Collection()
        {
            return TenantPath("/" + _Segment);
        }

        /// <summary>
        /// Item path.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <returns>Path.</returns>
        protected string Item(string id)
        {
            return Collection() + "/" + Segment(id);
        }

        #endregion
    }
}
