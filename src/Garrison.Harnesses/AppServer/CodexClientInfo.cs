namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Client identity sent in <c>initialize</c> (<c>ClientInfo</c> in the Codex app-server protocol).
    /// </summary>
    public class CodexClientInfo
    {
        #region Public-Members

        /// <summary>
        /// Client name. Default garrison.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? "garrison";
            }
        }

        /// <summary>
        /// Display title, or null.
        /// </summary>
        [JsonPropertyName("title")]
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? Title { get; set; } = null;

        /// <summary>
        /// Client version.
        /// </summary>
        [JsonPropertyName("version")]
        public string Version
        {
            get
            {
                return _Version;
            }
            set
            {
                _Version = value ?? "0.0.0";
            }
        }

        #endregion

        #region Private-Members

        private string _Name = "garrison";
        private string _Version = "0.0.0";

        #endregion
    }
}
