namespace Garrison.Core.Services
{
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>Named, exclusive coordination leases. Run assignment leases remain managed by atomic database claims.</summary>
    public interface ILeaseProvider
    {
        /// <summary>Acquire or explicitly renew a lease, returning its durable Garrison epoch, or null if unavailable.</summary>
        /// <param name="name">Named singleton work.</param>
        /// <param name="holder">Caller identity.</param>
        /// <param name="leaseMs">Requested lease duration in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Fencing epoch, or null when another holder owns the lease.</returns>
        Task<long?> TryAcquireAsync(string name, string holder, int leaseMs, CancellationToken token = default);

        /// <summary>Release only a lease held by the named caller.</summary>
        /// <param name="name">Lease name.</param>
        /// <param name="holder">Caller identity.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Whether this holder released the lease.</returns>
        Task<bool> ReleaseAsync(string name, string holder, CancellationToken token = default);
    }
}
