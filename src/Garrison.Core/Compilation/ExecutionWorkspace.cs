namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Workspace preparation instructions.
    /// </summary>
    public class ExecutionWorkspace
    {
        /// <summary>
        /// Kind.
        /// </summary>
        public WorkspaceKindEnum Kind { get; set; } = WorkspaceKindEnum.Empty;

        /// <summary>
        /// Repository URL for GitRepository workspaces.
        /// </summary>
        public string? GitUrl { get; set; } = null;

        /// <summary>
        /// Branch, tag, or commit.
        /// </summary>
        public string? GitRef { get; set; } = null;

        /// <summary>
        /// Clone depth; 0 means full history.
        /// </summary>
        public int GitDepth { get; set; } = 1;

        /// <summary>
        /// Git username when credentials are bound.
        /// </summary>
        public string? GitUsername { get; set; } = null;

        /// <summary>
        /// Git password or token when credentials are bound (secret).
        /// </summary>
        public string? GitPassword { get; set; } = null;

        /// <summary>
        /// Seeded files.
        /// </summary>
        public List<ExecutionWorkspaceFile> Files { get; set; } = new List<ExecutionWorkspaceFile>();

        /// <summary>
        /// Retention policy.
        /// </summary>
        public WorkspaceRetentionEnum Retention { get; set; } = WorkspaceRetentionEnum.Delete;
    }
}
