namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;

    /// <summary>
    /// Lightweight activity counters for this replica, reported in its control node heartbeat (P10.19): open SSE streams
    /// and WebSocket connections, and worker lease long polls being held. Every opening call must be paired with its
    /// closing call (use try and finally). Thread-safe.
    /// </summary>
    public class ControlNodeActivity
    {
        #region Public-Members

        /// <summary>
        /// Open SSE streams (run events, A2A streaming) and WebSocket connections.
        /// </summary>
        public int OpenStreams
        {
            get
            {
                return Math.Max(0, Interlocked.CompareExchange(ref _OpenStreams, 0, 0));
            }
        }

        /// <summary>
        /// Worker lease long polls currently held open.
        /// </summary>
        public int HeldLongPolls
        {
            get
            {
                return Math.Max(0, Interlocked.CompareExchange(ref _HeldLongPolls, 0, 0));
            }
        }

        #endregion

        #region Private-Members

        private int _OpenStreams = 0;
        private int _HeldLongPolls = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record that a stream opened.
        /// </summary>
        public void StreamOpened()
        {
            Interlocked.Increment(ref _OpenStreams);
        }

        /// <summary>
        /// Record that a stream closed.
        /// </summary>
        public void StreamClosed()
        {
            Interlocked.Decrement(ref _OpenStreams);
        }

        /// <summary>
        /// Record that a lease long poll started waiting.
        /// </summary>
        public void LongPollStarted()
        {
            Interlocked.Increment(ref _HeldLongPolls);
        }

        /// <summary>
        /// Record that a lease long poll ended.
        /// </summary>
        public void LongPollEnded()
        {
            Interlocked.Decrement(ref _HeldLongPolls);
        }

        #endregion
    }
}
