namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;

    /// <summary>
    /// Workspace preparation instructions.
    /// </summary>
    public class ExecutionWorkspace
    {
        /// <summary>Worker-local diagnostic indicating that an existing mirror was used; excluded from the wire contract.</summary>
        [JsonIgnore]
        public bool MirrorCacheHit { get; set; } = false;
        /// <summary>Prepared workspace cache key when a full immutable git commit and artifact store are configured.</summary>
        public string? CacheKey { get; set; } = null;
        /// <summary>Signed prepared workspace archive download URL, or null on a cache miss.</summary>
        public string? DownloadUrl { get; set; } = null;
        /// <summary>Expected archive SHA-256 on a prepared cache hit.</summary>
        public string? Sha256 { get; set; } = null;

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

        /// <summary>
        /// PersistentVolumeClaim mounted at the workspace path, for PersistentVolume workspaces (KubernetesJob runs only).
        /// </summary>
        public string? PersistentVolumeClaim { get; set; } = null;
    }
}
