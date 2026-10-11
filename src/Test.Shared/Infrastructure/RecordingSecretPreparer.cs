namespace Test.Shared.Infrastructure
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Models;

    /// <summary>
    /// Secret preparer that counts calls and returns secrets unchanged. Thread-safe.
    /// </summary>
    public sealed class RecordingSecretPreparer : ISecretPreparer
    {
        #region Public-Members

        /// <summary>
        /// Calls received.
        /// </summary>
        public int Calls
        {
            get
            {
                return Volatile.Read(ref _Calls);
            }
        }

        #endregion

        #region Private-Members

        private int _Calls = 0;

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<Secret> PrepareAsync(Secret secret, CancellationToken token = default)
        {
            Interlocked.Increment(ref _Calls);
            return Task.FromResult(secret);
        }

        #endregion
    }
}
