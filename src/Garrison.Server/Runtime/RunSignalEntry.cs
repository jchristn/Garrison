namespace Garrison.Server.Runtime
{
    /// <summary>
    /// A run's signal and the number of local waiters on it. Guarded by the owning <see cref="RunSignals"/> lock.
    /// </summary>
    public class RunSignalEntry
    {
        /// <summary>
        /// Signal.
        /// </summary>
        public AsyncSignal Signal { get; } = new AsyncSignal();

        /// <summary>
        /// Local waiters.
        /// </summary>
        public int Subscribers { get; set; } = 0;
    }
}
