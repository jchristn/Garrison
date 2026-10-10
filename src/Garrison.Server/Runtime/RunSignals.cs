namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Server.Backplane;

    /// <summary>
    /// Per-run and queue signals that wake waiters early: SSE, WebSocket, and A2A tails, synchronous invokes, and lease
    /// long-polls. Local changes signal local waiters directly and are published on the backplane; messages from other
    /// replicas signal local waiters through <see cref="ApplyRemote"/>. Waiters always re-read the database, so a missed
    /// signal costs latency, never correctness. A run's signal exists only while someone waits on it. Thread-safe.
    /// </summary>
    public class RunSignals
    {
        #region Public-Members

        /// <summary>
        /// Signaled when runs are queued or requeued on any replica.
        /// </summary>
        public AsyncSignal QueueChanged { get; } = new AsyncSignal();

        /// <summary>
        /// Backplane that carries signals to other replicas. Null (the default) keeps signals in this process.
        /// </summary>
        public IEventBackplane? Backplane { get; set; } = null;

        /// <summary>
        /// Runs that currently have at least one waiter on this replica.
        /// </summary>
        public int WatchedRuns
        {
            get
            {
                lock (_Lock)
                {
                    return _Runs.Count;
                }
            }
        }

        #endregion

        #region Private-Members

        private readonly Dictionary<string, RunSignalEntry> _Runs = new Dictionary<string, RunSignalEntry>(StringComparer.Ordinal);
        private readonly object _Lock = new object();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start waiting on a run. Dispose the subscription when done so the signal can be forgotten.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <returns>Subscription.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runId is null or empty.</exception>
        public RunSignalSubscription Subscribe(string runId)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            AsyncSignal signal;
            lock (_Lock)
            {
                if (!_Runs.TryGetValue(runId, out RunSignalEntry? entry))
                {
                    entry = new RunSignalEntry();
                    _Runs[runId] = entry;
                }
                entry.Subscribers++;
                signal = entry.Signal;
            }
            return new RunSignalSubscription(this, runId, signal);
        }

        /// <summary>
        /// A run changed (events, status, cancellation): wake its waiters here and on other replicas.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Notify(string runId)
        {
            if (String.IsNullOrEmpty(runId)) return;
            SignalLocal(runId);
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.RunChanged, runId));
        }

        /// <summary>
        /// A run finished: wake its waiters here and on other replicas.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Complete(string runId)
        {
            if (String.IsNullOrEmpty(runId)) return;
            SignalLocal(runId);
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.RunCompleted, runId));
        }

        /// <summary>
        /// Runs were queued or requeued: wake lease long-polls here and on other replicas.
        /// </summary>
        public void NotifyQueue()
        {
            QueueChanged.Signal();
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, null));
        }

        /// <summary>
        /// Apply a message from another replica to local waiters. Messages of other kinds are ignored.
        /// </summary>
        /// <param name="message">Message.</param>
        public void ApplyRemote(BackplaneMessage message)
        {
            if (message == null) return;
            switch (message.Kind)
            {
                case BackplaneMessageKindEnum.RunChanged:
                case BackplaneMessageKindEnum.RunCompleted:
                    if (!String.IsNullOrEmpty(message.Subject)) SignalLocal(message.Subject!);
                    break;
                case BackplaneMessageKindEnum.QueueChanged:
                    QueueChanged.Signal();
                    break;
            }
        }

        /// <summary>
        /// Wake every local waiter (after the backplane may have dropped messages).
        /// </summary>
        public void SignalAll()
        {
            List<AsyncSignal> signals = new List<AsyncSignal>();
            lock (_Lock)
            {
                foreach (RunSignalEntry entry in _Runs.Values) signals.Add(entry.Signal);
            }
            foreach (AsyncSignal signal in signals) signal.Signal();
            QueueChanged.Signal();
        }

        /// <summary>
        /// Release one waiter on a run. Called by <see cref="RunSignalSubscription"/>.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Release(string runId)
        {
            if (String.IsNullOrEmpty(runId)) return;
            lock (_Lock)
            {
                if (!_Runs.TryGetValue(runId, out RunSignalEntry? entry)) return;
                entry.Subscribers--;
                if (entry.Subscribers <= 0) _Runs.Remove(runId);
            }
        }

        #endregion

        #region Private-Methods

        private void SignalLocal(string runId)
        {
            AsyncSignal? signal = null;
            lock (_Lock)
            {
                if (_Runs.TryGetValue(runId, out RunSignalEntry? entry)) signal = entry.Signal;
            }
            signal?.Signal();
        }

        #endregion
    }
}
