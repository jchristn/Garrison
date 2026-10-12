namespace Garrison.Harnesses.AppServer
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The fields of an app-server thread item the approval relay needs (P12.3): command items carry the command and its
    /// working directory, file change items the changed paths.
    /// </summary>
    public class CodexItem
    {
        #region Public-Members

        /// <summary>
        /// Item type, for example commandExecution or fileChange.
        /// </summary>
        [JsonPropertyName("type")]
        public string? Type { get; set; } = null;

        /// <summary>
        /// Item identifier.
        /// </summary>
        [JsonPropertyName("id")]
        public string? Id { get; set; } = null;

        /// <summary>
        /// Command line of a command item.
        /// </summary>
        [JsonPropertyName("command")]
        public string? Command { get; set; } = null;

        /// <summary>
        /// Working directory of a command item.
        /// </summary>
        [JsonPropertyName("cwd")]
        public string? Cwd { get; set; } = null;

        /// <summary>
        /// Changes of a file change item.
        /// </summary>
        [JsonPropertyName("changes")]
        public List<CodexFileChange>? Changes { get; set; } = null;

        #endregion
    }
}
