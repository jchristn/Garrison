namespace Garrison.Server.Services
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// One asset file resolved from a download ticket (AD2.4).
    /// </summary>
    public class AgentAssetDownload
    {
        /// <summary>
        /// File metadata.
        /// </summary>
        public AgentAssetFile File { get; set; } = new AgentAssetFile();

        /// <summary>
        /// Verified content.
        /// </summary>
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }
}
