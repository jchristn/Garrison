namespace Garrison.Core.Database.Interfaces
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>Tenant-scoped run artifact metadata and separate database content access.</summary>
    public interface IArtifactMethods
    {
        /// <summary>Create metadata and optional database content.</summary>
        Task<Artifact> CreateAsync(Artifact artifact, byte[]? content, CancellationToken token = default);
        /// <summary>Create only while the matching run epoch and repair phase remain active.</summary>
        Task<Artifact?> CreateForExecutionAsync(Artifact artifact, byte[]? content, CancellationToken token = default, string? nodeId = null);
        /// <summary>Read metadata within one tenant.</summary>
        Task<Artifact?> ReadAsync(string tenantId, string id, CancellationToken token = default);
        /// <summary>Read the artifact for one idempotent execution/name upload.</summary>
        Task<Artifact?> ReadUploadAsync(string tenantId, string runId, long epoch, int repairAttempt, string name, CancellationToken token = default);
        /// <summary>Read database content separately; metadata lists never load file bytes.</summary>
        Task<byte[]?> ReadContentAsync(string tenantId, string id, CancellationToken token = default);
        /// <summary>Delete an artifact within a tenant.</summary>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
        /// <summary>Enumerate metadata, optionally restricted to a run or store.</summary>
        Task<EnumerationResult<Artifact>> EnumerateAsync(string tenantId, EnumerationQuery query, string? runId = null, string? storeId = null, CancellationToken token = default, bool includeInternal = false);
    }
}
