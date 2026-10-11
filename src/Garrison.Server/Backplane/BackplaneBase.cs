namespace Garrison.Server.Backplane
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Channels;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Shared backplane plumbing: a non-blocking publish queue flushed in coalesced batches (one message per kind and
    /// subject per flush), origin filtering, and event dispatch. Subclasses send batches and run a receive loop.
    /// Thread-safe.
    /// </summary>
    public abstract class BackplaneBase : IEventBackplane
    {
        #region Public-Members

        /// <inheritdoc />
        public abstract string Name { get; }

        /// <inheritdoc />
        public string InstanceId { get; }

        /// <inheritdoc />
        public long Published
        {
            get
            {
                return Interlocked.Read(ref _Published);
            }
        }

        /// <inheritdoc />
        public long Received
        {
            get
            {
                return Interlocked.Read(ref _Received);
            }
        }

        /// <summary>
        /// Milliseconds a published message may wait so that others can share its batch. Minimum 0, maximum 1000,
        /// default 10.
        /// </summary>
        public int FlushDelayMs
        {
            get
            {
                return _FlushDelayMs;
            }
            set
            {
                _FlushDelayMs = Math.Clamp(value, 0, 1000);
            }
        }

        /// <inheritdoc />
        public event EventHandler<BackplaneMessage>? MessageReceived;

        /// <inheritdoc />
        public event EventHandler? Resynchronized;

        #endregion

        #region Private-Members

        private readonly Channel<BackplaneMessage> _Outbox = Channel.CreateUnbounded<BackplaneMessage>(new UnboundedChannelOptions { SingleReader = true });
        private readonly LoggingModule? _Logging;
        private CancellationTokenSource? _Cts = null;
        private Task? _FlushLoop = null;
        private Task? _ReceiveLoop = null;
        private long _Published = 0;
        private long _Received = 0;
        private int _FlushDelayMs = 10;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="instanceId">Identifier of this replica instance.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when instanceId is null or empty.</exception>
        protected BackplaneBase(string instanceId, LoggingModule? logging)
        {
            if (String.IsNullOrEmpty(instanceId)) throw new ArgumentNullException(nameof(instanceId));
            InstanceId = instanceId;
            _Logging = logging;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public void Publish(BackplaneMessage message)
        {
            if (message == null) throw new ArgumentNullException(nameof(message));
            if (!SendsMessages) return;
            message.Origin = InstanceId;
            _Outbox.Writer.TryWrite(message);
        }

        /// <inheritdoc />
        public async Task StartAsync(CancellationToken token)
        {
            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            await OnStartAsync(token).ConfigureAwait(false);
            CancellationToken loopToken = _Cts.Token;
            if (SendsMessages) _FlushLoop = Task.Run(() => FlushLoopAsync(loopToken));
            _ReceiveLoop = Task.Run(() => ReceiveLoopAsync(loopToken));
        }

        /// <inheritdoc />
        public async Task StopAsync(CancellationToken token)
        {
            _Outbox.Writer.TryComplete();
            if (_FlushLoop != null)
            {
                try
                {
                    await _FlushLoop.WaitAsync(TimeSpan.FromSeconds(2), token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is TimeoutException || e is OperationCanceledException)
                {
                }
            }
            _Cts?.Cancel();
            if (_ReceiveLoop != null)
            {
                try
                {
                    await _ReceiveLoop.ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
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
        /// Whether this backplane sends messages at all. False for the local backplane. Default true.
        /// </summary>
        protected virtual bool SendsMessages
        {
            get
            {
                return true;
            }
        }

        /// <summary>
        /// Work before the loops start (for example reading the current high-water mark). Default does nothing.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        protected virtual Task OnStartAsync(CancellationToken token)
        {
            return Task.CompletedTask;
        }

        /// <summary>
        /// Send one coalesced batch.
        /// </summary>
        /// <param name="messages">Messages, oldest first.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        protected abstract Task SendAsync(List<BackplaneMessage> messages, CancellationToken token);

        /// <summary>
        /// Receive until cancelled, calling <see cref="Deliver"/> for each message.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        protected abstract Task ReceiveLoopAsync(CancellationToken token);

        /// <summary>
        /// Hand a received message to subscribers unless this replica sent it.
        /// </summary>
        /// <param name="message">Message.</param>
        protected void Deliver(BackplaneMessage message)
        {
            if (message == null || String.Equals(message.Origin, InstanceId, StringComparison.Ordinal)) return;
            Interlocked.Increment(ref _Received);
            GarrisonMetrics.Count(GarrisonMetricCatalog.BackplaneReceived, "backplane", Name, "kind", message.Kind.ToString());
            double lag = (DateTime.UtcNow - message.CreatedUtc).TotalSeconds;
            if (lag >= 0) GarrisonMetrics.Observe(GarrisonMetricCatalog.BackplaneLag, lag, "backplane", Name);
            EventHandler<BackplaneMessage>? handler = MessageReceived;
            if (handler == null) return;
            try
            {
                handler(this, message);
            }
            catch (Exception e)
            {
                _Logging?.Warn("[Backplane] handler failed for " + message.Kind + ": " + e.Message);
            }
        }

        /// <summary>
        /// Tell subscribers that messages may have been missed.
        /// </summary>
        protected void RaiseResynchronized()
        {
            EventHandler? handler = Resynchronized;
            if (handler == null) return;
            try
            {
                handler(this, EventArgs.Empty);
            }
            catch (Exception e)
            {
                _Logging?.Warn("[Backplane] resynchronize handler failed: " + e.Message);
            }
        }

        /// <summary>
        /// Log at debug severity.
        /// </summary>
        /// <param name="message">Message.</param>
        protected void Debug(string message)
        {
            _Logging?.Debug("[Backplane] " + message);
        }

        /// <summary>
        /// Log at warning severity.
        /// </summary>
        /// <param name="message">Message.</param>
        protected void Warn(string message)
        {
            _Logging?.Warn("[Backplane] " + message);
        }

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Outbox.Writer.TryComplete();
                _Cts?.Cancel();
                _Cts?.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task FlushLoopAsync(CancellationToken token)
        {
            ChannelReader<BackplaneMessage> reader = _Outbox.Reader;
            while (true)
            {
                bool more;
                try
                {
                    more = await reader.WaitToReadAsync(token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                if (!more) return;

                if (_FlushDelayMs > 0 && !reader.Completion.IsCompleted)
                {
                    try
                    {
                        await Task.Delay(_FlushDelayMs, token).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        return;
                    }
                }

                List<BackplaneMessage> batch = new List<BackplaneMessage>();
                HashSet<string> keys = new HashSet<string>(StringComparer.Ordinal);
                while (batch.Count < 500 && reader.TryRead(out BackplaneMessage? message))
                {
                    if (keys.Add(message.Kind + "|" + (message.Subject ?? String.Empty))) batch.Add(message);
                }
                if (batch.Count == 0) continue;

                try
                {
                    await GarrisonTracing.BackgroundAsync("backplane", "publish", ct => SendAsync(batch, ct), token).ConfigureAwait(false);
                    Interlocked.Add(ref _Published, batch.Count);
                    foreach (BackplaneMessage sent in batch) GarrisonMetrics.Count(GarrisonMetricCatalog.BackplanePublished, "backplane", Name, "kind", sent.Kind.ToString());
                }
                catch (OperationCanceledException)
                {
                    return;
                }
                catch (Exception e)
                {
                    // Messages are hints; dropping a batch only delays other replicas until their next poll.
                    Debug("send failed (" + batch.Count + " messages dropped): " + e.Message);
                }
            }
        }

        #endregion
    }
}
