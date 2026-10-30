namespace Garrison.Sdk.Responses
{
    using System;
    using System.Text.Json;

    /// <summary>
    /// One tool an MCP server listed during a connection test.
    /// </summary>
    public class McpToolDetail
    {
        #region Public-Members

        /// <summary>
        /// Tool name.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The server's description of the tool, or null. The server truncates it to 4000 characters.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// The tool's input JSON Schema as a JSON object, or null when the server listed none (or it exceeded 65536
        /// characters and was dropped).
        /// </summary>
        public JsonElement? InputSchema { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Name = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public McpToolDetail()
        {
        }

        #endregion
    }
}
