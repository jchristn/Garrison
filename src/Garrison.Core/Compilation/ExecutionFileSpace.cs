namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The run's conversation file space (AD3.3, AD-015): the worker syncs its files into the mount path before launch
    /// and writes new and changed files back after the harness exits, before the workspace is cleaned up.
    /// </summary>
    public class ExecutionFileSpace
    {
        /// <summary>
        /// Space identifier, or null in compile previews.
        /// </summary>
        public string? FileSpaceId { get; set; } = null;

        /// <summary>
        /// Workspace-relative mount path. Default files.
        /// </summary>
        public string MountPath { get; set; } = "files";

        /// <summary>
        /// Largest file the worker writes back, in bytes (FileSpaces.MaxFileBytes).
        /// </summary>
        public long MaxFileBytes { get; set; } = 33554432L;

        /// <summary>
        /// Most files the worker writes back in one run.
        /// </summary>
        public int MaxFiles { get; set; } = 1000;

        /// <summary>
        /// Files the run starts with.
        /// </summary>
        public List<ExecutionFileSpaceFile> Files { get; set; } = new List<ExecutionFileSpaceFile>();
    }
}
