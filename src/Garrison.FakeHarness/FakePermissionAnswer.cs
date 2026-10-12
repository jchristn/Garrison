namespace Garrison.FakeHarness
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The answer of a permission prompt tool, in the shape Claude Code reads: behavior allow or deny, and a message
    /// when denied.
    /// </summary>
    public class FakePermissionAnswer
    {
        #region Public-Members

        /// <summary>
        /// allow or deny.
        /// </summary>
        [JsonPropertyName("behavior")]
        public string Behavior { get; set; } = "deny";

        /// <summary>
        /// Denial message.
        /// </summary>
        [JsonPropertyName("message")]
        public string? Message { get; set; } = null;

        /// <summary>
        /// Whether the call may run.
        /// </summary>
        [JsonIgnore]
        public bool Allowed
        {
            get
            {
                return String.Equals(Behavior, "allow", StringComparison.Ordinal);
            }
        }

        #endregion
    }
}
