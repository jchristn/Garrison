namespace Garrison.Server.Services
{
    using Garrison.Core.Models;

    /// <summary>
    /// Result of an asset version upload (AD2.2).
    /// </summary>
    public class AgentAssetUploadResult
    {
        /// <summary>
        /// The version: new, or the current one when the upload repeated its files exactly.
        /// </summary>
        public AgentAssetVersion Version { get; set; } = new AgentAssetVersion();

        /// <summary>
        /// Whether a new version was created.
        /// </summary>
        public bool Created { get; set; } = false;
    }
}
