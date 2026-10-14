namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// A queued or requeued run, as a wakeup for waiting lease long polls (P10.24). It carries what a waiting poll needs
    /// to decide whether it could take the run (harness, node pool, and whether the run is delegated, which the child
    /// reserve requires), so a replica wakes one matching poll instead of every poll. Travels between replicas as the
    /// subject of a QueueChanged backplane message. The mutable members are guarded by the <see cref="LeaseWaiters"/>
    /// lock of the replica that holds the notice. Not thread-safe on its own.
    /// </summary>
    public class QueueNotice
    {
        #region Public-Members

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; }

        /// <summary>
        /// Harness the run needs.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; }

        /// <summary>
        /// Node pool the run is pinned to, or null when any pool (or no pool) may take it.
        /// </summary>
        public string? NodePoolId { get; }

        /// <summary>
        /// Whether the run is a delegated child run. Only delegated runs can go to a worker's child reserve.
        /// </summary>
        public bool Delegated { get; }

        /// <summary>
        /// Node a conversation turn prefers (it holds the conversation's harness session), or null. That node's poll is
        /// woken first.
        /// </summary>
        public string? AffinityNodeId { get; set; } = null;

        /// <summary>
        /// True when this replica queued the run (the notice was not received from another replica).
        /// </summary>
        public bool LocalOrigin { get; set; } = false;

        /// <summary>
        /// True when other replicas were told to hold their own wakeup for a while because this replica already woke one
        /// of its polls for the run. When this replica runs out of polls that could take the run, it clears the flag and
        /// tells the other replicas to wake theirs at once.
        /// </summary>
        public bool RemoteDeferred { get; set; } = false;

        /// <summary>
        /// When the notice was created or received (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; } = DateTime.UtcNow;

        /// <summary>
        /// Identifiers of the waiting polls on this replica that were already handed this notice. A notice is never
        /// handed to the same poll twice, so a handoff chain ends after every matching poll had one chance.
        /// </summary>
        public HashSet<string> Tried { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Times this notice was handed to a waiting poll on this replica.
        /// </summary>
        public int Deliveries { get; set; } = 0;

        #endregion

        #region Private-Members

        private const string _Prefix = "q1";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="harnessType">Harness the run needs.</param>
        /// <param name="nodePoolId">Node pool the run is pinned to, or null.</param>
        /// <param name="delegated">Whether the run is a delegated child run.</param>
        /// <exception cref="ArgumentNullException">Thrown when runId is null or empty.</exception>
        public QueueNotice(string runId, HarnessTypeEnum harnessType, string? nodePoolId, bool delegated)
        {
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            RunId = runId;
            HarnessType = harnessType;
            NodePoolId = String.IsNullOrEmpty(nodePoolId) ? null : nodePoolId;
            Delegated = delegated;
        }

        /// <summary>
        /// Build the notice for a run.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <returns>Notice.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static QueueNotice For(Run run)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            QueueNotice notice = new QueueNotice(run.Id, run.HarnessType, run.NodePoolId, run.Kind == RunKindEnum.Delegated);
            notice.AffinityNodeId = String.IsNullOrEmpty(run.AffinityNodeId) ? null : run.AffinityNodeId;
            return notice;
        }

        /// <summary>
        /// Read a notice from a QueueChanged backplane subject.
        /// </summary>
        /// <param name="subject">Subject, or null.</param>
        /// <returns>Notice, or null when the subject is empty (a message that wakes every poll) or not understood.</returns>
        public static QueueNotice? FromSubject(string? subject)
        {
            if (String.IsNullOrEmpty(subject)) return null;
            string[] parts = subject.Split('\n');
            if (parts.Length < 5 || !String.Equals(parts[0], _Prefix, StringComparison.Ordinal) || String.IsNullOrEmpty(parts[1])) return null;
            if (!Enum.TryParse(parts[2], false, out HarnessTypeEnum harness)) return null;
            string flags = parts[4];
            QueueNotice notice = new QueueNotice(parts[1], harness, parts[3], flags.Contains('d', StringComparison.Ordinal));
            notice.RemoteDeferred = flags.Contains('r', StringComparison.Ordinal);
            if (parts.Length > 5 && !String.IsNullOrEmpty(parts[5])) notice.AffinityNodeId = parts[5];
            return notice;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The QueueChanged backplane subject for this notice: a format marker, the run identifier, the harness, the node
        /// pool, flags (d delegated, r deferred), and the affinity node, separated by line feeds. Replicas that predate targeted wakeups
        /// ignore the subject and wake every poll.
        /// </summary>
        /// <returns>Subject.</returns>
        public string ToSubject()
        {
            string flags = (Delegated ? "d" : String.Empty) + (RemoteDeferred ? "r" : String.Empty);
            return _Prefix + "\n" + RunId + "\n" + HarnessType + "\n" + (NodePoolId ?? String.Empty) + "\n" + flags + "\n" + (AffinityNodeId ?? String.Empty);
        }

        #endregion
    }
}
