namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The parts of a Codex <c>Thread</c> the driver reads.
    /// </summary>
    public class CodexThread
    {
        #region Public-Members

        /// <summary>
        /// Thread identifier (the session identifier Garrison records and resumes).
        /// </summary>
        [JsonPropertyName("id")]
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;

        #endregion
    }
}
