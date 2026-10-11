namespace Garrison.Core.Compilation
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Prepares a bound secret before a run is compiled with it, for example by refreshing a CodexAuthJson login that
    /// is about to expire (G-22). Called for run and repair compiles, never for previews. Implementations are
    /// thread-safe.
    /// </summary>
    public interface ISecretPreparer
    {
        /// <summary>
        /// Return the secret to compile with: the same instance when nothing changed, or a fresh copy read back from
        /// the database after a refresh.
        /// </summary>
        /// <param name="secret">Secret as loaded for the run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The secret to use.</returns>
        /// <exception cref="CredentialUnavailableException">Thrown when the secret cannot be used for this run.</exception>
        Task<Secret> PrepareAsync(Secret secret, CancellationToken token = default);
    }
}
