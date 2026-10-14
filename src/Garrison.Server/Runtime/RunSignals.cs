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
    /// signal costs latency, never correctness. A run's signal exists only while someone waits on it. A queued run wakes
    /// one matching lease long poll through <see cref="Waiters"/> instead of every poll (P10.24). Thread-safe.
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
        /// Lease long polls waiting on this replica, woken by targeted queue notices (P10.24).
        /// </summary>
        public LeaseWaiters Waiters { get; } = new LeaseWaiters();

        /// <summary>
        /// Raised on this replica after <see cref="Complete"/> is called here, with the completed identifier (a run, or a
        /// pipeline run when a pipeline run ends or waits for a review). Not raised for completions received from other
        /// replicas through the backplane, so each completion is handled once, by the replica that recorded it (P12.9).
        /// Handlers run on the caller's thread, must return quickly, and must not throw; exceptions are swallowed.
        /// </summary>
        public event EventHandler<string>? LocalCompleted;

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

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public RunSignals()
        {
            Waiters.Republish = PublishNotice;
        }

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
        /// Start waiting for a run to finish. Unlike <see cref="Subscribe"/>, the subscription wakes only on
        /// <see cref="Complete"/> (here or on another replica), never on event batches, so a synchronous invocation
        /// waiter does not re-read its run for every event. Dispose the subscription when done.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <returns>Subscription.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runId is null or empty.</exception>
        public RunSignalSubscription SubscribeCompletion(string runId)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            return Subscribe(CompletionSubject(runId));
        }

        /// <summary>
        /// A run changed (events, status, cancellation): wake its waiters here and on other replicas.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Notify(string runId)
        {
            if (String.IsNullOrEmpty(runId)) return;
            SignalLocal(runId);
            Waiters.Settle(runId);
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.RunChanged, runId));
        }

        /// <summary>
        /// Start waiting for cancellations of runs held by a worker node (the node's cancellation watch). Dispose the
        /// subscription when done.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <returns>Subscription.</returns>
        /// <exception cref="ArgumentNullException">Thrown when nodeId is null or empty.</exception>
        public RunSignalSubscription SubscribeNode(string nodeId)
        {
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));
            return Subscribe(NodeSubject(nodeId));
        }

        /// <summary>
        /// A run held by a worker node was cancelled: wake that node's cancellation watch here and on other replicas.
        /// The signal travels as a RunChanged backplane message whose subject is "node:" plus the node identifier, which
        /// can never collide with a run identifier.
        /// </summary>
        /// <param name="nodeId">Node identifier; null or empty is ignored.</param>
        public void NotifyNode(string? nodeId)
        {
            if (String.IsNullOrEmpty(nodeId)) return;
            Notify(NodeSubject(nodeId));
        }

        /// <summary>
        /// Subscribe to changes of a permission approval (P12.3).
        /// </summary>
        /// <param name="approvalId">Approval identifier.</param>
        /// <returns>Subscription; dispose to release.</returns>
        /// <exception cref="ArgumentNullException">Thrown when approvalId is null or empty.</exception>
        public RunSignalSubscription SubscribeApproval(string approvalId)
        {
            if (String.IsNullOrEmpty(approvalId)) throw new ArgumentNullException(nameof(approvalId));
            return Subscribe(ApprovalSubject(approvalId));
        }

        /// <summary>
        /// Signal that a permission approval was created or decided, here and on every other replica.
        /// </summary>
        /// <param name="approvalId">Approval identifier; null or empty is ignored.</param>
        public void NotifyApproval(string? approvalId)
        {
            if (String.IsNullOrEmpty(approvalId)) return;
            SignalLocal(ApprovalSubject(approvalId));
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.ApprovalChanged, approvalId));
        }

        /// <summary>
        /// A run finished: wake its waiters here and on other replicas.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        public void Complete(string runId)
        {
            if (String.IsNullOrEmpty(runId)) return;
            SignalLocal(runId);
            SignalLocal(CompletionSubject(runId));
            Waiters.Settle(runId);
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.RunCompleted, runId));
            EventHandler<string>? handler = LocalCompleted;
            if (handler != null)
            {
                try
                {
                    handler(this, runId);
                }
                catch (Exception)
                {
                    // A completion hook must never break the path that finished the run; the pipeline sweep repairs it.
                }
            }
        }

        /// <summary>
        /// Runs were queued or requeued without a known run: wake every lease long-poll here and on other replicas.
        /// </summary>
        public void NotifyQueue()
        {
            QueueChanged.Signal();
            Waiters.WakeAll();
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, null));
        }

        /// <summary>
        /// A run was queued or requeued: wake one lease long poll here that could take it (P10.24), and tell the other
        /// replicas. When a poll here was woken, the other replicas hold their own wakeup for
        /// <see cref="LeaseWaiters.RemoteDelayMs"/> and drop it once the run is claimed; otherwise they wake one of
        /// theirs at once.
        /// </summary>
        /// <param name="run">Run; null wakes every poll, like <see cref="NotifyQueue()"/>.</param>
        public void NotifyQueue(Run? run)
        {
            if (run == null || String.IsNullOrEmpty(run.Id))
            {
                NotifyQueue();
                return;
            }
            QueueChanged.Signal();
            QueueNotice notice = QueueNotice.For(run);
            notice.LocalOrigin = true;
            bool handled = Waiters.Deliver(notice);
            notice.RemoteDeferred = handled && Waiters.Fanout > 0 && Waiters.RemoteDelayMs > 0;
            PublishNotice(notice);
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
                    if (!String.IsNullOrEmpty(message.Subject))
                    {
                        SignalLocal(message.Subject!);
                        Waiters.Settle(message.Subject);
                    }
                    break;
                case BackplaneMessageKindEnum.RunCompleted:
                    if (!String.IsNullOrEmpty(message.Subject))
                    {
                        SignalLocal(message.Subject!);
                        SignalLocal(CompletionSubject(message.Subject!));
                        Waiters.Settle(message.Subject);
                    }
                    break;
                case BackplaneMessageKindEnum.QueueChanged:
                    QueueChanged.Signal();
                    ApplyRemoteNotice(message.Subject);
                    break;
                case BackplaneMessageKindEnum.ApprovalChanged:
                    if (!String.IsNullOrEmpty(message.Subject)) SignalLocal(ApprovalSubject(message.Subject!));
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
            Waiters.WakeAll();
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

        private static string ApprovalSubject(string approvalId)
        {
            return "approval:" + approvalId;
        }

        private static string CompletionSubject(string runId)
        {
            return "done:" + runId;
        }

        private static string NodeSubject(string nodeId)
        {
            return "node:" + nodeId;
        }

        private void ApplyRemoteNotice(string? subject)
        {
            // A message without a run (or from a replica that predates targeted wakeups) wakes every poll here.
            QueueNotice? notice = QueueNotice.FromSubject(subject);
            if (notice == null)
            {
                Waiters.WakeAll();
                return;
            }
            if (notice.RemoteDeferred)
            {
                Waiters.Defer(notice);
                return;
            }
            // Delivered at once: the origin had no poll for the run, or every poll there tried it. A hold for the same run
            // is dropped so the run is not delivered twice.
            Waiters.Settle(notice.RunId);
            Waiters.Deliver(notice);
        }

        private void PublishNotice(QueueNotice notice)
        {
            Backplane?.Publish(new BackplaneMessage(BackplaneMessageKindEnum.QueueChanged, notice.ToSubject()));
        }

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
