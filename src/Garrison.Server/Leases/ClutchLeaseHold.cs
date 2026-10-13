namespace Garrison.Server.Leases
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Clutch.Sdk;

    /// <summary>One remote exclusive hold; automatic SDK heartbeats never extend its explicit Garrison deadline.</summary>
    public class ClutchLeaseHold : IDisposable
    {
        private readonly ClutchLockClient _Client;
        private readonly AcquiredLock _Lock;
        private TaskCompletionSource<DateTime>? _Renewal;
        private long _ExplicitUntilTicks;
        private int _Unavailable;
        private bool _Disposed;

        /// <summary>Named coordination work.</summary>
        public string Name { get; }
        /// <summary>Garrison caller identity.</summary>
        public string Holder { get; }
        /// <summary>Whether the SDK reported connection/protocol failure.</summary>
        public bool Unavailable { get { return Volatile.Read(ref _Unavailable) != 0; } }
        /// <summary>Explicit caller deadline, independent of automatic SDK renewals.</summary>
        public DateTime ExplicitUntilUtc { get { return new DateTime(Interlocked.Read(ref _ExplicitUntilTicks), DateTimeKind.Utc); } }
        /// <summary>Current durable database epoch.</summary>
        public long Epoch { get; set; } = 0;

        /// <summary>Take ownership of an acquired SDK connection.</summary>
        /// <param name="name">Lease name.</param>
        /// <param name="holder">Caller identity.</param>
        /// <param name="client">Connected SDK client.</param>
        /// <param name="acquired">Remote hold.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ClutchLeaseHold(string name, string holder, ClutchLockClient client, AcquiredLock acquired)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Holder = holder ?? throw new ArgumentNullException(nameof(holder));
            _Client = client ?? throw new ArgumentNullException(nameof(client));
            _Lock = acquired ?? throw new ArgumentNullException(nameof(acquired));
            _Client.HeartbeatReceived += Renewed;
            _Client.Closed += Closed;
            _Client.ErrorReceived += Error;
        }

        /// <summary>Advance the local deadline only after explicit remote acknowledgment and database renewal.</summary>
        /// <param name="until">Explicit deadline.</param>
        public void SetDeadline(DateTime until) { Interlocked.Exchange(ref _ExplicitUntilTicks, until.ToUniversalTime().Ticks); }

        /// <summary>Confirm a remote renewal that covers the caller's validity window.</summary>
        /// <param name="leaseMs">Requested lease duration.</param>
        /// <param name="token">Bounded provider call cancellation.</param>
        /// <returns>Whether the acknowledged remote expiry covers the caller's conservative validity period.</returns>
        public async Task<bool> RenewAsync(int leaseMs, CancellationToken token)
        {
            if (Unavailable) return false;
            DateTime minimum = DateTime.UtcNow.AddMilliseconds(leaseMs * 0.8);
            TaskCompletionSource<DateTime> reply = new TaskCompletionSource<DateTime>(TaskCreationOptions.RunContinuationsAsynchronously);
            Volatile.Write(ref _Renewal, reply);
            try
            {
                await _Client.HeartbeatAsync(new[] { _Lock.HolderId }, token).ConfigureAwait(false);
                DateTime expires = await reply.Task.WaitAsync(token).ConfigureAwait(false);
                return !Unavailable && expires >= minimum;
            }
            finally { Interlocked.CompareExchange(ref _Renewal, null, reply); }
        }

        /// <summary>Close the connection, releasing its remote hold. Idempotent with Dispose.</summary>
        /// <param name="token">Bounded close cancellation.</param>
        /// <returns>Task.</returns>
        public async Task CloseAsync(CancellationToken token)
        {
            Interlocked.Exchange(ref _Unavailable, 1);
            try { await _Client.CloseAsync(token).ConfigureAwait(false); }
            finally { Dispose(); }
        }

        /// <inheritdoc />
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
        /// <summary>Release owned connection resources.</summary>
        /// <param name="disposing">Whether managed resources should be released.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                Interlocked.Exchange(ref _Unavailable, 1);
                _Client.HeartbeatReceived -= Renewed;
                _Client.Closed -= Closed;
                _Client.ErrorReceived -= Error;
                _Client.Dispose();
            }
            _Disposed = true;
        }

        private void Renewed(object? sender, IReadOnlyList<AcquiredLock> renewed)
        {
            foreach (AcquiredLock item in renewed)
                if (item.HolderId == _Lock.HolderId) Volatile.Read(ref _Renewal)?.TrySetResult(item.LeaseExpiresUtc);
        }
        private void Closed(object? sender, string reason) { Interlocked.Exchange(ref _Unavailable, 1); Volatile.Read(ref _Renewal)?.TrySetCanceled(); }
        private void Error(object? sender, string reason) { Interlocked.Exchange(ref _Unavailable, 1); Volatile.Read(ref _Renewal)?.TrySetCanceled(); }
    }
}
