namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// The lease long polls waiting on this replica, and targeted queue wakeups (P10.24). A queued run wakes one poll that
    /// could take it (by harness, node pool, and child reserve), the one asleep longest, instead of every poll. A poll
    /// that was woken for a run and did not take it hands the run's notice to the next matching poll that has not had
    /// it, until the run is taken or every matching poll here had one chance; then, if other replicas were told to hold
    /// their wakeup, they are told to wake theirs at once. A notice that arrives while every matching poll is looking for
    /// work is kept, and the first of them to finish looks again instead of sleeping, so a run queued during a claim pass
    /// is never slept through. Notices from other replicas whose origin already woke a poll are held for
    /// <see cref="RemoteDelayMs"/> and dropped when the run is claimed in the meantime. Every poll still re-checks the
    /// queue on its fallback interval, which bounds the cost of any lost notice. Thread-safe.
    /// </summary>
    public class LeaseWaiters : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Waiting polls woken on this replica for each queued run. Minimum 0, maximum 64, default 1. 0 wakes every
        /// matching poll on every replica at once, which is the behavior before targeted wakeups.
        /// </summary>
        public int Fanout
        {
            get
            {
                return Volatile.Read(ref _Fanout);
            }
            set
            {
                Volatile.Write(ref _Fanout, Math.Clamp(value, 0, 64));
            }
        }

        /// <summary>
        /// Milliseconds this replica holds a notice from another replica that already woke one of its own polls for the
        /// run, before waking one here. The hold ends early when the run is claimed (it is then dropped) or when the
        /// origin runs out of polls that could take the run (it is then delivered at once). Minimum 0, maximum 10000,
        /// default 250. 0 wakes one poll on every replica at once.
        /// </summary>
        public int RemoteDelayMs
        {
            get
            {
                return Volatile.Read(ref _RemoteDelayMs);
            }
            set
            {
                Volatile.Write(ref _RemoteDelayMs, Math.Clamp(value, 0, 10000));
            }
        }

        /// <summary>
        /// Most notices kept for polls that are looking for work; the oldest are dropped beyond it. Minimum 16, maximum
        /// 100000, default 4096. A dropped notice costs latency only: every poll re-checks the queue on its fallback
        /// interval.
        /// </summary>
        public int MaxPending
        {
            get
            {
                return Volatile.Read(ref _MaxPending);
            }
            set
            {
                Volatile.Write(ref _MaxPending, Math.Clamp(value, 16, 100000));
            }
        }

        /// <summary>
        /// Milliseconds a kept notice stays valid. Minimum 1000, maximum 600000, default 60000. Polls that were looking
        /// for work when it arrived have finished long before.
        /// </summary>
        public int PendingMaxAgeMs
        {
            get
            {
                return Volatile.Read(ref _PendingMaxAgeMs);
            }
            set
            {
                Volatile.Write(ref _PendingMaxAgeMs, Math.Clamp(value, 1000, 600000));
            }
        }

        /// <summary>
        /// Called (outside the lock) when a run queued on this replica, whose wakeup other replicas were told to hold, had
        /// every matching poll here try it without taking it. The caller tells the other replicas to wake theirs at once.
        /// Null (the default) does nothing.
        /// </summary>
        public Action<QueueNotice>? Republish { get; set; } = null;

        /// <summary>
        /// Sleeping polls woken so far by notices, handoffs, and broadcasts (not by their fallback interval, and not
        /// counting polls that looked again because a notice arrived during their claim pass).
        /// </summary>
        public long Wakeups
        {
            get
            {
                return Interlocked.Read(ref _Wakeups);
            }
        }

        /// <summary>
        /// Registered polls.
        /// </summary>
        public int Count
        {
            get
            {
                lock (_Lock)
                {
                    return _Waiters.Count;
                }
            }
        }

        /// <summary>
        /// Registered polls that are asleep.
        /// </summary>
        public int SleepingCount
        {
            get
            {
                lock (_Lock)
                {
                    return _Waiters.Values.Count(w => w.Sleeping);
                }
            }
        }

        /// <summary>
        /// Notices kept for polls that are looking for work.
        /// </summary>
        public int PendingCount
        {
            get
            {
                lock (_Lock)
                {
                    return _Pending.Count;
                }
            }
        }

        /// <summary>
        /// Notices from other replicas being held.
        /// </summary>
        public int DeferredCount
        {
            get
            {
                lock (_Lock)
                {
                    return _Deferred.Count;
                }
            }
        }

        #endregion

        #region Private-Members

        private readonly object _Lock = new object();
        private readonly Dictionary<string, LeaseWaiter> _Waiters = new Dictionary<string, LeaseWaiter>(StringComparer.Ordinal);
        private readonly List<QueueNotice> _Pending = new List<QueueNotice>();
        private readonly Dictionary<string, QueueNotice> _Deferred = new Dictionary<string, QueueNotice>(StringComparer.Ordinal);
        private readonly Dictionary<string, Timer> _DeferredTimers = new Dictionary<string, Timer>(StringComparer.Ordinal);
        private int _Fanout = 1;
        private int _RemoteDelayMs = 250;
        private int _MaxPending = 4096;
        private int _PendingMaxAgeMs = 60000;
        private long _SleepSequence = 0;
        private long _Broadcast = 0;
        private long _Wakeups = 0;
        private bool _Disposed = false;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register a lease long poll before its first claim pass, so a run queued from then on is never slept through.
        /// Unregister it when the request ends.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="nodePoolId">Node pool of the node, or null.</param>
        /// <param name="harnessTypes">Harnesses the node can run.</param>
        /// <param name="childReserve">Whether this is a child reserve poll.</param>
        /// <returns>Registration.</returns>
        /// <exception cref="ArgumentNullException">Thrown when nodeId is null or empty, or harnessTypes is null.</exception>
        public LeaseWaiter Register(string nodeId, string? nodePoolId, IEnumerable<HarnessTypeEnum> harnessTypes, bool childReserve)
        {
            if (harnessTypes == null) throw new ArgumentNullException(nameof(harnessTypes));
            LeaseWaiter waiter = new LeaseWaiter(nodeId, childReserve);
            waiter.NodePoolId = String.IsNullOrEmpty(nodePoolId) ? null : nodePoolId;
            foreach (HarnessTypeEnum harness in harnessTypes) waiter.HarnessTypes.Add(harness);
            lock (_Lock)
            {
                waiter.BroadcastSeen = _Broadcast;
                _Waiters[waiter.Id] = waiter;
            }
            return waiter;
        }

        /// <summary>
        /// Refresh what a registered poll can take (its node was re-read).
        /// </summary>
        /// <param name="waiter">Registration.</param>
        /// <param name="nodePoolId">Node pool of the node, or null.</param>
        /// <param name="harnessTypes">Harnesses the node can run.</param>
        /// <exception cref="ArgumentNullException">Thrown when waiter or harnessTypes is null.</exception>
        public void Update(LeaseWaiter waiter, string? nodePoolId, IEnumerable<HarnessTypeEnum> harnessTypes)
        {
            if (waiter == null) throw new ArgumentNullException(nameof(waiter));
            if (harnessTypes == null) throw new ArgumentNullException(nameof(harnessTypes));
            lock (_Lock)
            {
                waiter.NodePoolId = String.IsNullOrEmpty(nodePoolId) ? null : nodePoolId;
                waiter.HarnessTypes.Clear();
                foreach (HarnessTypeEnum harness in harnessTypes) waiter.HarnessTypes.Add(harness);
            }
        }

        /// <summary>
        /// Remove a poll whose request ended. A notice it was handed and did not handle is handed to the next matching
        /// poll.
        /// </summary>
        /// <param name="waiter">Registration; null is ignored.</param>
        public void Unregister(LeaseWaiter? waiter)
        {
            if (waiter == null) return;
            QueueNotice? current;
            TaskCompletionSource<bool>? wake;
            lock (_Lock)
            {
                _Waiters.Remove(waiter.Id);
                current = waiter.Current;
                waiter.Current = null;
                wake = waiter.Wake;
                waiter.Wake = null;
                waiter.Sleeping = false;
            }
            wake?.TrySetResult(false);
            if (current != null) Redeliver(current, waiter);
        }

        /// <summary>
        /// Wake polls for a queued run: up to <see cref="Fanout"/> sleeping polls that could take it, the affinity node's
        /// first, then regular polls before child reserve polls, asleep longest first; or, when every matching poll is looking for work, keep the
        /// notice so the first of them looks again.
        /// </summary>
        /// <param name="notice">Notice.</param>
        /// <returns>True when a poll here was woken or will look again; false when no poll here could take the run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when notice is null.</exception>
        public bool Deliver(QueueNotice notice)
        {
            if (notice == null) throw new ArgumentNullException(nameof(notice));
            List<TaskCompletionSource<bool>> wake = new List<TaskCompletionSource<bool>>();
            bool handled;
            lock (_Lock)
            {
                handled = DeliverLocked(notice, wake);
            }
            foreach (TaskCompletionSource<bool> source in wake) source.TrySetResult(true);
            return handled;
        }

        /// <summary>
        /// Hand a notice on from a poll that had it and did not take its run, while the run is still queued. When no
        /// other poll here could take it and other replicas were told to hold their wakeup, <see cref="Republish"/> is
        /// called so they wake theirs at once.
        /// </summary>
        /// <param name="notice">Notice.</param>
        /// <param name="from">Poll that had it.</param>
        /// <exception cref="ArgumentNullException">Thrown when notice or from is null.</exception>
        public void Redeliver(QueueNotice notice, LeaseWaiter from)
        {
            if (notice == null) throw new ArgumentNullException(nameof(notice));
            if (from == null) throw new ArgumentNullException(nameof(from));
            List<TaskCompletionSource<bool>> wake = new List<TaskCompletionSource<bool>>();
            bool exhausted = false;
            lock (_Lock)
            {
                notice.Tried.Add(from.Id);
                bool handled = DeliverLocked(notice, wake);
                if (!handled && notice.LocalOrigin && notice.RemoteDeferred)
                {
                    notice.RemoteDeferred = false;
                    exhausted = true;
                }
            }
            foreach (TaskCompletionSource<bool> source in wake) source.TrySetResult(true);
            if (exhausted)
            {
                Action<QueueNotice>? republish = Republish;
                if (republish != null)
                {
                    try
                    {
                        republish(notice);
                    }
                    catch (Exception)
                    {
                        // Notices are hints; the other replicas' fallback poll still finds the run.
                    }
                }
            }
        }

        /// <summary>
        /// Hold a notice from another replica for <see cref="RemoteDelayMs"/>, then deliver it here unless the run was
        /// claimed meanwhile (<see cref="Settle"/>). With no delay, or <see cref="Fanout"/> 0, it is delivered at once.
        /// </summary>
        /// <param name="notice">Notice.</param>
        /// <exception cref="ArgumentNullException">Thrown when notice is null.</exception>
        public void Defer(QueueNotice notice)
        {
            if (notice == null) throw new ArgumentNullException(nameof(notice));
            int delay = RemoteDelayMs;
            if (delay <= 0 || Fanout == 0)
            {
                Deliver(notice);
                return;
            }
            lock (_Lock)
            {
                if (_Disposed) return;
                RemoveDeferredLocked(notice.RunId);
                _Deferred[notice.RunId] = notice;
                _DeferredTimers[notice.RunId] = new Timer(OnDeferredElapsed, notice, delay, Timeout.Infinite);
            }
        }

        /// <summary>
        /// A run changed (it was claimed, cancelled, or finished): drop the notices held or kept for it.
        /// </summary>
        /// <param name="runId">Run identifier; null or empty is ignored.</param>
        public void Settle(string? runId)
        {
            if (String.IsNullOrEmpty(runId)) return;
            lock (_Lock)
            {
                RemoveDeferredLocked(runId);
                _Pending.RemoveAll(n => String.Equals(n.RunId, runId, StringComparison.Ordinal));
            }
        }

        /// <summary>
        /// Wake every sleeping poll, and make every poll looking for work look again (the backplane may have dropped
        /// messages, or a notice carried no run).
        /// </summary>
        public void WakeAll()
        {
            List<TaskCompletionSource<bool>> wake = new List<TaskCompletionSource<bool>>();
            lock (_Lock)
            {
                _Broadcast++;
                foreach (LeaseWaiter waiter in _Waiters.Values)
                {
                    if (!waiter.Sleeping) continue;
                    waiter.Sleeping = false;
                    waiter.Reason = LeaseWakeEnum.Broadcast;
                    waiter.BroadcastSeen = _Broadcast;
                    if (waiter.Wake != null) wake.Add(waiter.Wake);
                    waiter.Wake = null;
                    Interlocked.Increment(ref _Wakeups);
                }
            }
            foreach (TaskCompletionSource<bool> source in wake) source.TrySetResult(true);
        }

        /// <summary>
        /// Take the notice that made a poll look for work, if any. The poll must hand it on with
        /// <see cref="Redeliver"/> when it did not take the run and the run is still queued.
        /// </summary>
        /// <param name="waiter">Registration.</param>
        /// <returns>Notice, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when waiter is null.</exception>
        public QueueNotice? TakeCurrent(LeaseWaiter waiter)
        {
            if (waiter == null) throw new ArgumentNullException(nameof(waiter));
            lock (_Lock)
            {
                QueueNotice? current = waiter.Current;
                waiter.Current = null;
                return current;
            }
        }

        /// <summary>
        /// Sleep until a notice wakes this poll or the timeout passes. Returns at once when a notice for a run this poll
        /// could take arrived while it was looking for work, or every poll was woken since it last looked.
        /// </summary>
        /// <param name="waiter">Registration.</param>
        /// <param name="timeoutMs">Timeout in milliseconds; 0 or less returns at once.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Why the poll should look for work again.</returns>
        /// <exception cref="ArgumentNullException">Thrown when waiter is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled while sleeping.</exception>
        public async Task<LeaseWakeEnum> WaitAsync(LeaseWaiter waiter, int timeoutMs, CancellationToken token = default)
        {
            if (waiter == null) throw new ArgumentNullException(nameof(waiter));
            TaskCompletionSource<bool> source;
            lock (_Lock)
            {
                if (waiter.Current != null) return waiter.Reason;
                if (waiter.BroadcastSeen != _Broadcast)
                {
                    waiter.BroadcastSeen = _Broadcast;
                    waiter.Reason = LeaseWakeEnum.Broadcast;
                    return LeaseWakeEnum.Broadcast;
                }
                QueueNotice? pending = TakePendingLocked(waiter);
                if (pending != null)
                {
                    pending.Tried.Add(waiter.Id);
                    pending.Deliveries++;
                    waiter.Current = pending;
                    waiter.Reason = LeaseWakeEnum.Pending;
                    return LeaseWakeEnum.Pending;
                }
                if (timeoutMs <= 0) return LeaseWakeEnum.Poll;
                source = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                waiter.Sleeping = true;
                waiter.SleepSequence = ++_SleepSequence;
                waiter.Reason = LeaseWakeEnum.Poll;
                waiter.Wake = source;
            }

            bool woke = false;
            try
            {
                await source.Task.WaitAsync(TimeSpan.FromMilliseconds(timeoutMs), token).ConfigureAwait(false);
                woke = true;
            }
            catch (TimeoutException)
            {
            }
            finally
            {
                lock (_Lock)
                {
                    if (ReferenceEquals(waiter.Wake, source)) waiter.Wake = null;
                    waiter.Sleeping = false;
                }
            }

            lock (_Lock)
            {
                if (waiter.Current != null) return waiter.Reason;
                if (woke && waiter.Reason == LeaseWakeEnum.Broadcast) return LeaseWakeEnum.Broadcast;
                return LeaseWakeEnum.Poll;
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation: stops the timers of held notices.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                lock (_Lock)
                {
                    foreach (Timer timer in _DeferredTimers.Values) timer.Dispose();
                    _DeferredTimers.Clear();
                    _Deferred.Clear();
                    _Pending.Clear();
                    _Disposed = true;
                }
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private bool DeliverLocked(QueueNotice notice, List<TaskCompletionSource<bool>> wake)
        {
            if (_Disposed) return false;
            List<LeaseWaiter> matching = _Waiters.Values.Where(w => !notice.Tried.Contains(w.Id) && w.Matches(notice)).ToList();
            if (matching.Count == 0) return false;

            int fanout = Fanout;
            int limit = fanout == 0 ? Int32.MaxValue : fanout;
            int woken = 0;
            foreach (LeaseWaiter waiter in matching.Where(w => w.Sleeping && w.Current == null).OrderBy(w => String.Equals(w.NodeId, notice.AffinityNodeId, StringComparison.Ordinal) ? 0 : 1).ThenBy(w => w.ChildReserve ? 1 : 0).ThenBy(w => w.SleepSequence))
            {
                if (woken >= limit) break;
                waiter.Current = notice;
                waiter.Reason = notice.Deliveries > 0 ? LeaseWakeEnum.Handoff : LeaseWakeEnum.Notify;
                waiter.Sleeping = false;
                notice.Tried.Add(waiter.Id);
                notice.Deliveries++;
                if (waiter.Wake != null) wake.Add(waiter.Wake);
                waiter.Wake = null;
                woken++;
                Interlocked.Increment(ref _Wakeups);
            }

            // Matching polls that are looking for work right now may have read the queue before the run was committed;
            // keep the notice so the first of them looks again instead of sleeping.
            if (woken == 0 || (fanout == 0 && matching.Count > woken)) AddPendingLocked(notice);
            return true;
        }

        private void AddPendingLocked(QueueNotice notice)
        {
            _Pending.RemoveAll(n => String.Equals(n.RunId, notice.RunId, StringComparison.Ordinal));
            _Pending.Add(notice);
            int max = MaxPending;
            if (_Pending.Count > max) _Pending.RemoveRange(0, _Pending.Count - max);
        }

        private QueueNotice? TakePendingLocked(LeaseWaiter waiter)
        {
            if (_Pending.Count == 0) return null;
            DateTime cutoff = DateTime.UtcNow.AddMilliseconds(-PendingMaxAgeMs);
            _Pending.RemoveAll(n => n.CreatedUtc < cutoff);
            for (int i = 0; i < _Pending.Count; i++)
            {
                QueueNotice notice = _Pending[i];
                if (notice.Tried.Contains(waiter.Id) || !waiter.Matches(notice)) continue;
                _Pending.RemoveAt(i);
                return notice;
            }
            return null;
        }

        private void RemoveDeferredLocked(string runId)
        {
            _Deferred.Remove(runId);
            if (_DeferredTimers.Remove(runId, out Timer? timer)) timer.Dispose();
        }

        private void OnDeferredElapsed(object? state)
        {
            QueueNotice? notice = state as QueueNotice;
            if (notice == null) return;
            lock (_Lock)
            {
                if (_Disposed) return;
                if (!_Deferred.TryGetValue(notice.RunId, out QueueNotice? held) || !ReferenceEquals(held, notice)) return;
                RemoveDeferredLocked(notice.RunId);
            }
            Deliver(notice);
        }

        #endregion
    }
}
