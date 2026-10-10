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
        /// Public base URL advertised to clients and harnesses, for example https://garrison.example.com. Null derives it from the bind address.
        /// </summary>
        public string? PublicBaseUrl { get; set; } = null;

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
