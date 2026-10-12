namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of the app-server <c>item/started</c> and <c>item/completed</c> notifications.
    /// </summary>
    public class CodexItemNotification
    {
        #region Public-Members

        /// <summary>
        /// The item.
        /// </summary>
        [JsonPropertyName("item")]
        public CodexItem? Item { get; set; } = null;

        #endregion
    }
}
