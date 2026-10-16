namespace Garrison.Worker.Execution
{
    using System;

    /// <summary>Paths and format recorded alongside a stopped harness session, without credentials.</summary>
    public class SessionSnapshotManifest
    {
        /// <summary>Workspace path used by the recording worker.</summary>
        public string WorkspacePath { get; set; } = String.Empty;
        /// <summary>Pinned session format.</summary>
        public string SessionFormat { get; set; } = String.Empty;
        /// <summary>Recorded session identifier.</summary>
        public string SessionId { get; set; } = String.Empty;
    }
}
