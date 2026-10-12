namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// One change of an app-server file change item.
    /// </summary>
    public class CodexFileChange
    {
        #region Public-Members

        /// <summary>
        /// Path of the changed file.
        /// </summary>
        [JsonPropertyName("path")]
        public string? Path { get; set; } = null;

        #endregion
    }
}
