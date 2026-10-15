namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// REST listener settings. Changes require a restart.
    /// </summary>
    public class RestSettings
    {
        #region Public-Members

        /// <summary>
        /// Bind hostname. Use * for all interfaces (0.0.0.0 is not used). Default *.
        /// </summary>
        public string Hostname
        {
            get
            {
                return _Hostname;
            }
            set
            {
                _Hostname = String.IsNullOrWhiteSpace(value) ? "*" : value;
            }
        }

        /// <summary>
        /// Port. Minimum 1, maximum 65535, default 8700.
        /// </summary>
        public int Port
        {
            get
            {
                return _Port;
            }
            set
            {
                _Port = Math.Clamp(value, 1, 65535);
            }
        }

        /// <summary>
        /// Whether TLS is enabled on the listener. Default false (terminate TLS at the ingress).
        /// </summary>
        public bool Ssl { get; set; } = false;

        /// <summary>
        /// Internal REST base URL handed to runs (the garrison.apiUrl template variable) so harnesses on workers can call
        /// back, for example http://garrison-server:8700 inside a cluster or Compose network. Not used in A2A cards or
        /// anything shown to people; see <see cref="ExternalBaseUrl"/>. Null derives it from the bind address
        /// (http://127.0.0.1:Port when bound to all interfaces). Environment: GARRISON_PUBLIC_BASE_URL. The name is kept
        /// for compatibility. Changes require a restart.
        /// </summary>
        public string? PublicBaseUrl { get; set; } = null;

        /// <summary>
        /// External REST base URL that people and clients outside the cluster use, for example
        /// https://garrison.example.com. Used in A2A agent cards and server info. Null uses the scheme
        /// (X-Forwarded-Proto when present) and Host header of each request. Environment: GARRISON_EXTERNAL_BASE_URL.
        /// Applies live.
        /// </summary>
        public string? ExternalBaseUrl { get; set; } = null;

        /// <summary>
        /// Allowed CORS origins. Empty means any origin (development default).
        /// </summary>
        public List<string> CorsOrigins { get; set; } = new List<string>();

        /// <summary>
        /// Port of the separate liveness listener, which answers GET /v1.0/api/health/live on its own thread without
        /// touching the database or waiting behind the REST listener's request queue, so an overloaded replica is not
        /// restarted by its liveness probe. It binds to <see cref="Hostname"/> as soon as the process starts. 0 turns it
        /// off (the REST port still answers /v1.0/api/health/live). Minimum 0, maximum 65535, default 8702. Must differ
        /// from <see cref="Port"/> and the MCP port. Environment: GARRISON_LIVENESS_PORT. Changes require a restart.
        /// </summary>
        public int LivenessPort
        {
            get
            {
                return _LivenessPort;
            }
            set
            {
                _LivenessPort = Math.Clamp(value, 0, 65535);
            }
        }

        /// <summary>
        /// Seconds sent in the Retry-After header of 503 DatabaseBusy and DatabaseUnavailable responses, which answer
        /// requests that fail because the database connection pool is exhausted or the database cannot be reached.
        /// Minimum 1, maximum 300, default 2. Applies live.
        /// </summary>
        public int DatabaseRetryAfterSeconds
        {
            get
            {
                return _DatabaseRetryAfterSeconds;
            }
            set
            {
                _DatabaseRetryAfterSeconds = Math.Clamp(value, 1, 300);
            }
        }

        /// <summary>
        /// Largest request body, in bytes, the REST listener accepts. A request whose Content-Length is larger is refused
        /// before its body is read, ahead of authentication, so one oversized request cannot hold the body in memory.
        /// Default 134217728 (128 MiB), which leaves room for the largest artifact upload (64 MiB). Minimum 0, where 0
        /// turns the check off; maximum 2147483647. Applies when the server starts. Bodies sent with chunked transfer
        /// encoding carry no Content-Length and are not limited by this setting.
        /// </summary>
        public long MaxRequestBodyBytes
        {
            get
            {
                return _MaxRequestBodyBytes;
            }
            set
            {
                _MaxRequestBodyBytes = Math.Clamp(value, 0L, (long)Int32.MaxValue);
            }
        }

        #endregion

        #region Private-Members

        private string _Hostname = "*";
        private int _Port = 8700;
        private int _LivenessPort = 8702;
        private int _DatabaseRetryAfterSeconds = 2;
        private long _MaxRequestBodyBytes = 134217728;

        #endregion
    }
}
