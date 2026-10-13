namespace Garrison.Worker.Execution
{
    using System;

    /// <summary>One selected workspace file. Selection never traverses filesystem links.</summary>
    public class ArtifactFile
    {
        /// <summary>Workspace-relative display name using forward slashes.</summary>
        public string Name { get; set; } = String.Empty;
        /// <summary>Local full path used only by the worker.</summary>
        public string FullPath { get; set; } = String.Empty;
        /// <summary>Observed file length; upload rechecks the byte bound.</summary>
        public long SizeBytes { get; set; } = 0;
    }
}
