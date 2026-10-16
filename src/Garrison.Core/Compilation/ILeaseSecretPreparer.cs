namespace Garrison.Core.Compilation
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>Resolve a revocable provider credential for one fenced run epoch, never for a preview.</summary>
    public interface ILeaseSecretPreparer
    {
        /// <summary>Return an in-memory secret containing the ephemeral value; never update stored secret values.</summary>
        Task<Secret> PrepareAsync(Secret secret, Run run, CancellationToken token = default);
    }
}
