namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics.Metrics;
    using System.Runtime.CompilerServices;
    using System.Threading;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Server-sent event and WebSocket stream telemetry (P13.23): open streams per kind (garrison.sse.streams.active,
    /// garrison.websocket.sessions.active) and messages written (garrison.sse.events, garrison.websocket.messages).
    /// Process-wide, so every replica in a test process shares the counts. Thread-safe.
    /// </summary>
    public static class StreamTelemetry
    {
        #region Private-Members

        private static readonly ConcurrentDictionary<string, StrongBox<long>> _Open = new ConcurrentDictionary<string, StrongBox<long>>(StringComparer.Ordinal);
        private static long _WebSockets = 0;
        private static readonly GaugeRegistration _SseGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.SseStreamsActive, ObserveStreams);
        private static readonly GaugeRegistration _WebSocketGauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.WebSocketSessions, () => Interlocked.Read(ref _WebSockets));

        #endregion

        #region Public-Methods

        /// <summary>
        /// A server-sent event stream opened.
        /// </summary>
        /// <param name="stream">Stream kind, for example run_events or a2a.</param>
        public static void Opened(string stream)
        {
            StrongBox<long> box = _Open.GetOrAdd(stream, s => new StrongBox<long>(0));
            Interlocked.Increment(ref box.Value);
        }

        /// <summary>
        /// A server-sent event stream closed.
        /// </summary>
        /// <param name="stream">Stream kind.</param>
        public static void Closed(string stream)
        {
            if (_Open.TryGetValue(stream, out StrongBox<long>? box)) Interlocked.Decrement(ref box.Value);
        }

        /// <summary>
        /// A server-sent event was written.
        /// </summary>
        /// <param name="stream">Stream kind.</param>
        public static void Sent(string stream)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.SseEvents, "stream", stream);
        }

        /// <summary>
        /// A WebSocket session opened.
        /// </summary>
        public static void WebSocketOpened()
        {
            Interlocked.Increment(ref _WebSockets);
        }

        /// <summary>
        /// A WebSocket session closed.
        /// </summary>
        public static void WebSocketClosed()
        {
            Interlocked.Decrement(ref _WebSockets);
        }

        /// <summary>
        /// A WebSocket message was received or sent.
        /// </summary>
        /// <param name="direction">received or sent.</param>
        public static void WebSocketMessage(string direction)
        {
            GarrisonMetrics.Count(GarrisonMetricCatalog.WebSocketMessages, "direction", direction);
        }

        /// <summary>
        /// Whether the gauges are registered (forces static initialization).
        /// </summary>
        /// <returns>True.</returns>
        public static bool Registered()
        {
            return _SseGauge != null && _WebSocketGauge != null;
        }

        #endregion

        #region Private-Methods

        private static IEnumerable<Measurement<double>> ObserveStreams()
        {
            List<Measurement<double>> measurements = new List<Measurement<double>>();
            foreach (KeyValuePair<string, StrongBox<long>> pair in _Open) measurements.Add(GarrisonMetrics.Measure(Interlocked.Read(ref pair.Value.Value), "stream", pair.Key));
            return measurements;
        }

        #endregion
    }
}
