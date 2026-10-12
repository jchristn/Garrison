namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of <c>initialize</c> (<c>InitializeParams</c>).
    /// </summary>
    public class CodexInitializeParams
    {
        #region Public-Members

        /// <summary>
        /// Client identity.
        /// </summary>
        [JsonPropertyName("clientInfo")]
        public CodexClientInfo ClientInfo
        {
            get
            {
                return _ClientInfo;
            }
            set
            {
                _ClientInfo = value ?? new CodexClientInfo();
            }
        }

        /// <summary>
        /// Capabilities.
        /// </summary>
        [JsonPropertyName("capabilities")]
        public CodexInitializeCapabilities Capabilities
        {
            get
            {
                return _Capabilities;
            }
            set
            {
                _Capabilities = value ?? new CodexInitializeCapabilities();
            }
        }

        #endregion

        #region Private-Members

        private CodexClientInfo _ClientInfo = new CodexClientInfo();
        private CodexInitializeCapabilities _Capabilities = new CodexInitializeCapabilities();

        #endregion
    }
}
