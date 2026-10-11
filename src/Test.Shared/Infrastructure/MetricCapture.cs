namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics.Metrics;
    using System.Linq;

    /// <summary>
    /// Captures measurements from the Garrison meter in process (a <see cref="MeterListener"/>), so tests can assert that
    /// code paths record telemetry without a Prometheus listener. Thread-safe.
    /// </summary>
    public sealed class MetricCapture : IDisposable
    {
        #region Private-Members

        private readonly MeterListener _Listener = new MeterListener();
        private readonly ConcurrentQueue<CapturedMeasurement> _Measurements = new ConcurrentQueue<CapturedMeasurement>();
        private readonly string _MeterName;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Start capturing.
        /// </summary>
        /// <param name="meterName">Meter to listen to. Default Garrison.</param>
        public MetricCapture(string meterName = "Garrison")
        {
            _MeterName = meterName;
            _Listener.InstrumentPublished = (instrument, listener) =>
            {
                if (String.Equals(instrument.Meter.Name, _MeterName, StringComparison.Ordinal)) listener.EnableMeasurementEvents(instrument);
            };
            _Listener.SetMeasurementEventCallback<double>((instrument, value, tags, state) =>
            {
                CapturedMeasurement measurement = new CapturedMeasurement();
                measurement.Name = instrument.Name;
                measurement.Value = value;
                foreach (KeyValuePair<string, object?> tag in tags) measurement.Tags[tag.Key] = tag.Value?.ToString() ?? String.Empty;
                _Measurements.Enqueue(measurement);
            });
            _Listener.Start();
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Measurements of an instrument captured so far.
        /// </summary>
        /// <param name="name">Instrument name.</param>
        /// <returns>Measurements.</returns>
        public List<CapturedMeasurement> Of(string name)
        {
            return _Measurements.Where(m => String.Equals(m.Name, name, StringComparison.Ordinal)).ToList();
        }

        /// <summary>
        /// Read observable instruments (gauges) now.
        /// </summary>
        public void Observe()
        {
            _Listener.RecordObservableInstruments();
        }

        /// <summary>
        /// Stop capturing.
        /// </summary>
        public void Dispose()
        {
            _Listener.Dispose();
        }

        #endregion
    }
}
