namespace Garrison.Benchmark.Probes
{
    /// <summary>Completed HTTPS request payload accounting, excluding HTTP headers and TCP/TLS overhead.</summary>
    public class CacheNetworkStats
    {
        /// <summary>Requests currently being transferred.</summary>
        public long ActiveRequests { get; set; }
        /// <summary>Completed requests.</summary>
        public long Requests { get; set; }
        /// <summary>HTTP request body bytes.</summary>
        public long RequestBodyBytes { get; set; }
        /// <summary>HTTP response body bytes.</summary>
        public long ResponseBodyBytes { get; set; }
        /// <summary>Completed Git smart HTTP requests.</summary>
        public long GitRequests { get; set; }
        /// <summary>Completed prepared-archive download requests.</summary>
        public long SnapshotRequests { get; set; }
    }
}
