namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Tenant-scoped, epoch-fenced effect journal persistence.</summary>
    public interface IEffectOperationMethods
    {
        /// <summary>Atomically persist intent only while its run holds the matching unexpired active lease.</summary>
        Task<bool> AuthorizeAsync(EffectOperation operation, CancellationToken token = default);
        /// <summary>Transition an operation, with a fresh lease check before dispatch. Completed operations are immutable.</summary>
        Task<bool> TransitionAsync(string tenantId, string runId, string operationId, long epoch, EffectOperationStateEnum expected, EffectOperationStateEnum next, string? resultReference = null, CancellationToken token = default);
        /// <summary>List operation intents for a tenant and run, oldest first.</summary>
        Task<List<EffectOperation>> ListAsync(string tenantId, string runId, CancellationToken token = default);
        /// <summary>Whether any dispatch has an unresolved outcome for this epoch.</summary>
        Task<bool> HasUncertainAsync(string tenantId, string runId, long epoch, CancellationToken token = default);
        /// <summary>Persist a checkpoint. Gateway-only coverage must be established by a trusted executor, never inferred from an empty journal.</summary>
        Task<bool> CheckpointAsync(string tenantId, string runId, long epoch, bool gatewayOnlyCoverage, CancellationToken token = default);
        /// <summary>Whether the current attempt has a known-coverage checkpoint and no dispatched, unknown, or completed operations after it. Completed effects require continuation rather than rerunning the prompt.</summary>
        Task<bool> RecoverySafeAsync(string tenantId, string runId, long epoch, CancellationToken token = default);
    }
}
