namespace Garrison.Worker.Kubernetes
{
    using System;

    /// <summary>
    /// A file a run pod relays to its worker for the conversation file space (AD3.4).
    /// </summary>
    public class PodFileChange
    {
        /// <summary>
        /// Path relative to the mount path.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Version the run started from, 0 for a new file.
        /// </summary>
        public int BaseVersion { get; set; } = 0;

        /// <summary>
        /// Content as base64.
        /// </summary>
        public string ContentBase64 { get; set; } = String.Empty;
    }
}
