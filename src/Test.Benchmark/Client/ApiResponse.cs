namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Outcome of one HTTP call to Garrison as the harness saw it: status, typed body or error, raw body, and the
    /// client-side latency. A transport failure (connection refused, reset, client timeout) has status 0 and a
    /// <see cref="TransportError"/>. Never thrown: callers decide what a failure means for their measurement.
    /// </summary>
    /// <typeparam name="T">Body type on success.</typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// HTTP status code, or 0 when no response arrived.
        /// </summary>
        public int StatusCode { get; set; }

        /// <summary>
        /// Deserialized body on a 2xx response with a JSON body; otherwise null.
        /// </summary>
        public T? Body { get; set; }

        /// <summary>
        /// Deserialized error body on a non-2xx JSON response; otherwise null.
        /// </summary>
        public ApiError? Error { get; set; }

        /// <summary>
        /// Raw response body text (empty when none).
        /// </summary>
        public string RawBody { get; set; } = String.Empty;

        /// <summary>
        /// Response content type, or null.
        /// </summary>
        public string? ContentType { get; set; }

        /// <summary>
        /// Transport failure description when <see cref="StatusCode"/> is 0.
        /// </summary>
        public string? TransportError { get; set; }

        /// <summary>
        /// Client-side latency from sending the request to reading the whole body, in milliseconds.
        /// </summary>
        public double ElapsedMs { get; set; }

        /// <summary>
        /// True for a 2xx status.
        /// </summary>
        public bool IsSuccess
        {
            get
            {
                return StatusCode >= 200 && StatusCode < 300;
            }
        }

        /// <summary>
        /// True when a non-2xx response carried a non-JSON body (an HTML error page, a proxy message, or nothing),
        /// which the resilience command counts as an unclean failure.
        /// </summary>
        public bool IsUncleanError
        {
            get
            {
                if (StatusCode == 0 || IsSuccess) return false;
                return Error == null || String.IsNullOrEmpty(Error.Code);
            }
        }

        /// <summary>
        /// Short description for logs and reports: status and error code, or the transport error.
        /// </summary>
        /// <returns>Description.</returns>
        public string Describe()
        {
            if (StatusCode == 0) return "transport: " + (TransportError ?? "unknown");
            if (IsSuccess) return StatusCode.ToString(System.Globalization.CultureInfo.InvariantCulture);
            return StatusCode.ToString(System.Globalization.CultureInfo.InvariantCulture) + " " + (Error?.Code ?? "(no error code)");
        }
    }
}
