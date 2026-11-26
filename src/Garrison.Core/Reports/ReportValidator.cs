namespace Garrison.Core.Reports
{
    using System;
    using System.Collections.Generic;
    using System.Text;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Bounds of a report being filed (AA5.1). Field shapes (title length, metric names, issue and decision text) are
    /// checked by the model setters; this checks the body size, the list sizes, and the period. Thread-safe.
    /// </summary>
    public static class ReportValidator
    {
        #region Public-Members

        /// <summary>
        /// Most metrics, issues, or decisions in one report: 50.
        /// </summary>
        public static readonly int MaxListItems = 50;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a report before it is filed.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <param name="maxBodyBytes">Most UTF-8 bytes in the body (Reports.MaxBodyBytes).</param>
        /// <exception cref="ArgumentNullException">Thrown when report is null.</exception>
        /// <exception cref="ValidationException">Thrown with field errors when the report is out of bounds.</exception>
        public static void Validate(Report report, int maxBodyBytes)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            Dictionary<string, string> errors = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> codes = new Dictionary<string, string>(StringComparer.Ordinal);
            int bodyBytes = Encoding.UTF8.GetByteCount(report.Body);
            if (bodyBytes > maxBodyBytes)
            {
                errors["body"] = "The body holds at most " + maxBodyBytes + " UTF-8 bytes; it has " + bodyBytes + ".";
                codes["body"] = "TooLarge";
            }
            if (report.Metrics.Count > MaxListItems) errors["metrics"] = "A report lists at most " + MaxListItems + " metrics.";
            if (report.Issues.Count > MaxListItems) errors["issues"] = "A report lists at most " + MaxListItems + " issues.";
            if (report.Decisions.Count > MaxListItems) errors["decisions"] = "A report lists at most " + MaxListItems + " decisions.";
            if (report.Metrics.Exists(m => m == null)) errors["metrics"] = "A metric cannot be null.";
            if (report.Issues.Exists(i => i == null)) errors["issues"] = "An issue cannot be null.";
            if (report.Decisions.Exists(d => d == null)) errors["decisions"] = "A decision cannot be null.";
            if (report.PeriodStartUtc.HasValue && report.PeriodEndUtc.HasValue && report.PeriodEndUtc.Value < report.PeriodStartUtc.Value)
                errors["periodEndUtc"] = "The period ends before it starts.";
            if (errors.Count > 0) throw new ValidationException("The report is invalid.", errors, codes.Count > 0 ? codes : null);
        }

        #endregion
    }
}
