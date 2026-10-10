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

        #endregion

        #region Private-Members

        private string _Hostname = "*";
        private int _Port = 8700;

        #endregion
    }
}
