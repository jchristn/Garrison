namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One measurement in a report (AA5), such as "open tickets" = 12 "count". Metrics with the same name from the same
    /// author form a series over time. Not thread-safe.
    /// </summary>
    public class ReportMetric
    {
        #region Public-Members

        /// <summary>
        /// Metric name, 1 to 64 characters, trimmed. Series are matched by exact name.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is empty or longer than 64 characters.</exception>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                string trimmed = (value ?? String.Empty).Trim();
                if (trimmed.Length < 1 || trimmed.Length > 64) throw new ArgumentException("A metric name holds 1 to 64 characters.", nameof(Name));
                _Name = trimmed;
            }
        }

        /// <summary>
        /// Value. Must be a finite number.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is NaN or infinite.</exception>
        public double Value
        {
            get
            {
                return _Value;
            }
            set
            {
                if (Double.IsNaN(value) || Double.IsInfinity(value)) throw new ArgumentException("A metric value must be a finite number.", nameof(Value));
                _Value = value;
            }
        }

        /// <summary>
        /// Optional unit, at most 32 characters, such as "count", "ms", or "USD". Null when not set.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is longer than 32 characters.</exception>
        public string? Unit
        {
            get
            {
                return _Unit;
            }
            set
            {
                if (value != null && value.Trim().Length > 32) throw new ArgumentException("A metric unit holds at most 32 characters.", nameof(Unit));
                _Unit = String.IsNullOrWhiteSpace(value) ? null : value.Trim();
            }
        }

        #endregion

        #region Private-Members

        private string _Name = "metric";
        private double _Value = 0;
        private string? _Unit = null;

        #endregion
    }
}
