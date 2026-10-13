namespace Garrison.Server.Leases
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.WebSockets;
    using System.Threading;
    using System.Threading.Tasks;
    using Clutch.Sdk;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Services;
    using Garrison.Server.Settings;

    /// <summary>
    /// Optional Clutch coordination gate with durable database fencing. Database leases prevent early remote
    /// disconnect/regrant from overlapping a previous caller's validity window. No fallback when Clutch is unavailable.
    /// Automatic SDK heartbeats never extend the explicit Garrison lifetime. Thread-safe; owns its SDK connections.
    /// </summary>
    public class ClutchLeaseProvider : ILeaseProvider, IDisposable
    {
        private readonly ICoordinationLeaseMethods _Database;
        private readonly LeaseSettings _Settings;
        private readonly SemaphoreSlim _Gate = new SemaphoreSlim(1, 1);
        private readonly Dictionary<string, ClutchLeaseHold> _Held = new Dictionary<string, ClutchLeaseHold>(StringComparer.Ordinal);
        private readonly CancellationTokenSource _Stop = new CancellationTokenSource();
        private readonly Task _Sweep;
        private bool _Disposed;

        /// <summary>Construct an opt-in provider without opening a connection until a lease is requested.</summary>
        /// <param name="database">Durable fencing and observability rows.</param>
        /// <param name="settings">Consistent replica connection settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or settings is null.</exception>
        /// <exception cref="ArgumentException">Thrown when endpoint, access key, or namespace is invalid.</exception>
        public ClutchLeaseProvider(ICoordinationLeaseMethods database, LeaseSettings settings)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            if (!Uri.TryCreate(settings.ClutchEndpoint, UriKind.Absolute, out Uri? endpoint) || (endpoint.Scheme != "http" && endpoint.Scheme != "https" && endpoint.Scheme != "ws" && endpoint.Scheme != "wss")
                || endpoint.UserInfo.Length > 0 || endpoint.Query.Length > 0 || endpoint.Fragment.Length > 0) throw new ArgumentException("Configure a Clutch endpoint without embedded credentials or query parameters.", nameof(settings));
            if (String.IsNullOrWhiteSpace(settings.ClutchAccessKey)) throw new ArgumentException("A Clutch access key is required when Clutch coordination is selected.", nameof(settings));
            if (settings.KeyPrefix.Length == 0 || settings.KeyPrefix.Length > 128 || settings.KeyPrefix.Any(c => !Char.IsAsciiLetterOrDigit(c) && c != '-' && c != '_' && c != '/' && c != '.')) throw new ArgumentException("Use a bounded deployment namespace for Clutch keys.", nameof(settings));
            _Sweep = Task.Run(() => SweepAsync(_Stop.Token));
        }

        /// <inheritdoc />
        public async Task<long?> TryAcquireAsync(string name, string holder, int leaseMs, CancellationToken token = default)
        {
            if (String.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));
            if (String.IsNullOrWhiteSpace(holder)) throw new ArgumentNullException(nameof(holder));
            if (leaseMs < 1) throw new ArgumentOutOfRangeException(nameof(leaseMs));
            ObjectDisposedException.ThrowIf(_Disposed, this);
            DateTime attempted = DateTime.UtcNow;
            await _Gate.WaitAsync(token).ConfigureAwait(false);
            try
            {
                using (CancellationTokenSource call = CancellationTokenSource.CreateLinkedTokenSource(token, _Stop.Token))
                {
                    call.CancelAfter(_Settings.RequestTimeoutMs);
                    if (_Held.TryGetValue(name, out ClutchLeaseHold? existing))
                    {
                        if (!existing.Unavailable && existing.ExplicitUntilUtc > attempted)
                        {
                            if (existing.Holder != holder) return null;
                            bool renewed;
                            try { renewed = await existing.RenewAsync(leaseMs, call.Token).ConfigureAwait(false); }
                            catch (Exception ex) when (ex is ClutchException || ex is WebSocketException || ex is OperationCanceledException) { renewed = false; }
                            token.ThrowIfCancellationRequested();
                            if (!renewed) { await RetireAsync(existing, false).ConfigureAwait(false); return null; }
                            long? epoch = await _Database.TryAcquireAsync(name, holder, leaseMs, token).ConfigureAwait(false);
                            if (!epoch.HasValue || attempted.AddMilliseconds(leaseMs) <= DateTime.UtcNow)
                            {
                                await RetireAsync(existing, false).ConfigureAwait(false);
                                return null;
                            }
                            existing.Epoch = epoch.Value;
                            existing.SetDeadline(attempted.AddMilliseconds(leaseMs));
                            return epoch;
                        }
                        await RetireAsync(existing, existing.ExplicitUntilUtc <= attempted).ConfigureAwait(false);
                    }
                    ClutchLockClient client = new ClutchLockClient(_Settings.ClutchEndpoint!, _Settings.ClutchAccessKey!);
                    ClutchLeaseHold? acquired = null;
                    try
                    {
                        await client.ConnectAsync(call.Token).ConfigureAwait(false);
                        AcquiredLock remote = await client.AcquireAsync(_Settings.KeyPrefix + "/" + name, LockMode.Write, new AcquireOptions
                        {
                            Behavior = LockBehavior.FailFast, LeaseMs = leaseMs,
                            Policy = new LockPolicy { DefaultLeaseMs = leaseMs, MaxLeaseMs = Math.Max(_Settings.MaxLeaseMs, leaseMs), MaxHoldMs = Math.Max(_Settings.MaxHoldMs, leaseMs) }
                        }, call.Token).ConfigureAwait(false);
                        if (remote.LeaseExpiresUtc < DateTime.UtcNow.AddMilliseconds(leaseMs * 0.8)) return null;
                        acquired = new ClutchLeaseHold(name, holder, client, remote);
                        long? epoch = await _Database.TryAcquireAsync(name, holder, leaseMs, token).ConfigureAwait(false);
                        if (!epoch.HasValue || attempted.AddMilliseconds(leaseMs) <= DateTime.UtcNow) return null;
                        acquired.Epoch = epoch.Value;
                        acquired.SetDeadline(attempted.AddMilliseconds(leaseMs));
                        _Held[name] = acquired;
                        return epoch;
                    }
                    catch (LockDeniedException) { return null; }
                    catch (Exception ex) when ((ex is ClutchException || ex is WebSocketException || ex is IOException || ex is OperationCanceledException) && !token.IsCancellationRequested)
                    {
                        // The SDK endpoint may contain an access-key query. Never surface its exception payload.
                        return null;
                    }
                    finally
                    {
                        if (acquired == null || !_Held.TryGetValue(name, out ClutchLeaseHold? owned) || !ReferenceEquals(owned, acquired))
                        {
                            using (CancellationTokenSource close = new CancellationTokenSource(_Settings.RequestTimeoutMs))
                            {
                                try { await client.CloseAsync(close.Token).ConfigureAwait(false); }
                                catch (Exception ex) when (ex is ClutchException || ex is WebSocketException || ex is OperationCanceledException) { }
                            }
                            acquired?.Dispose();
                            client.Dispose();
                        }
                    }
                }
            }
            finally { _Gate.Release(); }
        }

        /// <inheritdoc />
        public async Task<bool> ReleaseAsync(string name, string holder, CancellationToken token = default)
        {
            ObjectDisposedException.ThrowIf(_Disposed, this);
            await _Gate.WaitAsync(token).ConfigureAwait(false);
            try
            {
                if (!_Held.TryGetValue(name, out ClutchLeaseHold? owned) || owned.Holder != holder) return false;
                await RetireAsync(owned, true).ConfigureAwait(false);
                return true;
            }
            finally { _Gate.Release(); }
        }

        /// <summary>Stop sweeps and release owned holds after callers have stopped their work.</summary>
        /// <param name="token">Shutdown cancellation.</param>
        /// <returns>Task.</returns>
        public async Task StopAsync(CancellationToken token = default)
        {
            _Stop.Cancel();
            try { await _Sweep.ConfigureAwait(false); } catch (OperationCanceledException) { }
            await _Gate.WaitAsync(token).ConfigureAwait(false);
            try
            {
                foreach (ClutchLeaseHold held in _Held.Values.ToList()) await RetireAsync(held, true).ConfigureAwait(false);
            }
            finally { _Gate.Release(); }
        }

        /// <inheritdoc />
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
        /// <summary>Release owned connections. Durable guards expire if shutdown could not release them.</summary>
        /// <param name="disposing">Whether managed resources should be released.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Stop.Cancel();
                try { _Sweep.GetAwaiter().GetResult(); } catch (OperationCanceledException) { }
                _Gate.Wait();
                try { foreach (ClutchLeaseHold held in _Held.Values) held.Dispose(); _Held.Clear(); }
                finally { _Gate.Release(); }
                _Stop.Dispose();
                _Gate.Dispose();
            }
            _Disposed = true;
        }

        private async Task RetireAsync(ClutchLeaseHold held, bool releaseGuard)
        {
            _Held.Remove(held.Name);
            using (CancellationTokenSource close = new CancellationTokenSource(_Settings.RequestTimeoutMs))
            {
                try { await held.CloseAsync(close.Token).ConfigureAwait(false); }
                catch (Exception ex) when (ex is ClutchException || ex is WebSocketException || ex is OperationCanceledException) { held.Dispose(); }
                // On failed renewal, retain the guard until expiry so an old caller's validity window cannot overlap a successor.
                if (releaseGuard) await _Database.ReleaseAsync(held.Name, held.Holder, close.Token).ConfigureAwait(false);
            }
        }

        private async Task SweepAsync(CancellationToken token)
        {
            try
            {
                while (true)
                {
                    await Task.Delay(_Settings.SweepIntervalMs, token).ConfigureAwait(false);
                    await _Gate.WaitAsync(token).ConfigureAwait(false);
                    try
                    {
                        DateTime now = DateTime.UtcNow;
                        foreach (ClutchLeaseHold held in _Held.Values.Where(h => h.Unavailable || h.ExplicitUntilUtc <= now).ToList())
                        {
                            try { await RetireAsync(held, held.ExplicitUntilUtc <= now).ConfigureAwait(false); }
                            catch (Exception ex) when (ex is System.Data.Common.DbException || ex is OperationCanceledException) { }
                        }
                    }
                    finally { _Gate.Release(); }
                }
            }
            catch (OperationCanceledException) when (token.IsCancellationRequested) { }
        }
    }
}
