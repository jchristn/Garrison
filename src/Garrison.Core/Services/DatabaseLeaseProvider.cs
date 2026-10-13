namespace Garrison.Core.Services
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;

    /// <summary>Default coordination provider over structured, epoch-fenced database leases. Does not own the database.</summary>
    public class DatabaseLeaseProvider : ILeaseProvider
    {
        private readonly ICoordinationLeaseMethods _Leases;

        /// <summary>Construct the default provider.</summary>
        /// <param name="leases">Owning database's lease methods.</param>
        /// <exception cref="ArgumentNullException">Thrown when leases is null.</exception>
        public DatabaseLeaseProvider(ICoordinationLeaseMethods leases) { _Leases = leases ?? throw new ArgumentNullException(nameof(leases)); }

        /// <inheritdoc />
        public Task<long?> TryAcquireAsync(string name, string holder, int leaseMs, CancellationToken token = default)
        {
            return _Leases.TryAcquireAsync(name, holder, leaseMs, token);
        }

        /// <inheritdoc />
        public Task<bool> ReleaseAsync(string name, string holder, CancellationToken token = default)
        {
            return _Leases.ReleaseAsync(name, holder, token);
        }
    }
}
