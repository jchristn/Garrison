namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>Configuration deletion outcome.</summary>
    public class McpConfigurationDeletion
    {
        /// <summary>Deleted record identifier.</summary>
        public string Id { get; set; } = String.Empty;
        /// <summary>Whether the record row was deleted.</summary>
        public bool Deleted { get; set; } = false;
    }
}
