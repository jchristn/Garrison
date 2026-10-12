namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Result of <c>thread/start</c> and <c>thread/resume</c> (the parts the driver reads).
    /// </summary>
    public class CodexThreadResult
    {
        #region Public-Members

        /// <summary>
        /// Thread.
        /// </summary>
        [JsonPropertyName("thread")]
        public CodexThread? Thread { get; set; } = null;

        /// <summary>
        /// Model the thread uses.
        /// </summary>
        [JsonPropertyName("model")]
        public string? Model { get; set; } = null;

        #endregion
    }
}
