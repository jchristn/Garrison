namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>Structured credential lifecycle metadata; all writes are tenant and epoch scoped.</summary>
    public interface ICredentialLeaseMethods
    {
        /// <summary>Reserve an idempotent lease under an active matching run lock, or return the existing attempt lease. Null when fenced.</summary>
        Task<CredentialLease?> ReserveAsync(CredentialLease lease, CancellationToken token = default);
        /// <summary>List outstanding leases for maintenance and prior-epoch revocation.</summary>
        Task<List<CredentialLease>> ListOutstandingAsync(string? tenantId = null, string? runId = null, CancellationToken token = default);
        /// <summary>List stale, expired, deleted-resource, or terminal-run leases, excluding healthy live credentials.</summary>
        Task<List<CredentialLease>> ListRevocationCandidatesAsync(CancellationToken token = default);
        /// <summary>Remove confirmed-revoked metadata whose tenant was deleted, preserving all pending obligations.</summary>
        Task PurgeRevokedOrphansAsync(CancellationToken token = default);
        /// <summary>Mark issued only while the corresponding run still holds its active lease.</summary>
        Task<bool> MarkIssuedAsync(CredentialLease lease, CancellationToken token = default);
        /// <summary>Record one provider revocation attempt, marking confirmed successful revocations.</summary>
        Task RecordRevocationAsync(CredentialLease lease, bool confirmed, CancellationToken token = default);
    }
}
