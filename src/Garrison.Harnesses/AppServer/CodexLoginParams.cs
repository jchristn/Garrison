namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of <c>account/login/start</c> for an API key (<c>LoginAccountParams</c>, type <c>apiKey</c>). The key is a secret: never log this object.
    /// </summary>
    public class CodexLoginParams
    {
        #region Public-Members

        /// <summary>
        /// Login type. Always apiKey here.
        /// </summary>
        [JsonPropertyName("type")]
        public string Type
        {
            get
            {
                return _Type;
            }
            set
            {
                _Type = value ?? "apiKey";
            }
        }

        /// <summary>
        /// OpenAI API key.
        /// </summary>
        [JsonPropertyName("apiKey")]
        public string ApiKey
        {
            get
            {
                return _ApiKey;
            }
            set
            {
                _ApiKey = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Type = "apiKey";
        private string _ApiKey = String.Empty;

        #endregion
    }
}
