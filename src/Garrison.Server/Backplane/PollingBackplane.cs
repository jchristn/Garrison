namespace Garrison.Server.Backplane
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Backplane over the backplane_messages table: replicas append rows and every replica polls for rows above its
    /// high-water mark. One poll per replica replaces per-subscriber polling, and it works on Sqlite and Postgresql.
    /// Sequences can commit out of order on Postgresql, so a gap below a newer row is re-read until it fills or
    /// <see cref="GapTimeoutMs"/> passes (a rolled-back insert leaves a permanent gap). The leader deletes rows older than
    /// a few minutes. Thread-safe.
    /// </summary>
    public class PollingBackplane : BackplaneBase
    {
        #region Public-Members

        /// <inheritdoc />
        public override string Name
        {
            get
            {
                return "Polling";
            }
        }

        /// <summary>
        /// Poll interval in milliseconds. Minimum 50, maximum 10000, default 250.
        /// </summary>
        public int PollMs
        {
            get
            {
                return _PollMs;
            }
            set
            {
                _PollMs = Math.Clamp(value, 50, 10000);
            }
        }

        /// <summary>
        /// Milliseconds a sequence gap is re-read before it is skipped. Minimum 100, maximum 60000, default 5000.
        /// </summary>
        public int GapTimeoutMs
        {
            get
            {
                return _GapTimeoutMs;
            }
            set
            {
                _GapTimeoutMs = Math.Clamp(value, 100, 60000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SortedSet<long> _SeenAboveWatermark = new SortedSet<long>();
        private int _PollMs = 250;
        private int _GapTimeoutMs = 5000;
        private long _Watermark = 0;
        private DateTime? _GapSinceUtc = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="instanceId">Identifier of this replica instance.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or instanceId is null.</exception>
        public PollingBackplane(DatabaseDriverBase database, string instanceId, LoggingModule? logging)
            : base(instanceId, logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Protected-Methods

        /// <inheritdoc />
        protected override async Task OnStartAsync(CancellationToken token)
        {
            // Start from now: history is irrelevant to a replica that was not running.
            _Watermark = await _Database.BackplaneMessages.MaxSequenceAsync(token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        protected override async Task SendAsync(List<BackplaneMessage> messages, CancellationToken token)
        {
            await _Database.BackplaneMessages.InsertAsync(messages, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        protected override async Task ReceiveLoopAsync(CancellationToken token)
        {
            bool failing = false;
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await GarrisonTracing.BackgroundAsync("backplane", "poll", PollOnceAsync, token).ConfigureAwait(false);
                    if (failing)
                    {
                        failing = false;
                        RaiseResynchronized();
                    }
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    if (!failing) Warn("poll failed: " + e.Message);
                    failing = true;
                }

                try
                {
                    await Task.Delay(_PollMs, token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
            }
        }

        #endregion

        #region Private-Methods

        private async Task<bool> PollOnceAsync(CancellationToken token)
        {
            List<BackplaneMessage> rows = await _Database.BackplaneMessages.ListAfterAsync(_Watermark, 1000, token).ConfigureAwait(false);
            PollRows(rows);
            return rows.Count > 0;
        }

        private void PollRows(List<BackplaneMessage> rows)
        {
            foreach (BackplaneMessage row in rows)
            {
                if (row.Sequence <= _Watermark || !_SeenAboveWatermark.Add(row.Sequence)) continue;
                Deliver(row);
            }

            while (_SeenAboveWatermark.Count > 0 && _SeenAboveWatermark.Min == _Watermark + 1)
            {
                _Watermark++;
                _SeenAboveWatermark.Remove(_Watermark);
            }

            if (_SeenAboveWatermark.Count == 0)
            {
                _GapSinceUtc = null;
                return;
            }

            // A gap: a lower sequence has not committed yet, or never will.
            if (_GapSinceUtc == null) _GapSinceUtc = DateTime.UtcNow;
            if ((DateTime.UtcNow - _GapSinceUtc.Value).TotalMilliseconds < _GapTimeoutMs) return;

            _Watermark = _SeenAboveWatermark.Min;
            _SeenAboveWatermark.Remove(_Watermark);
            while (_SeenAboveWatermark.Count > 0 && _SeenAboveWatermark.Min == _Watermark + 1)
            {
                _Watermark++;
                _SeenAboveWatermark.Remove(_Watermark);
            }
            _GapSinceUtc = _SeenAboveWatermark.Count > 0 ? DateTime.UtcNow : null;
        }

        #endregion
    }
}
