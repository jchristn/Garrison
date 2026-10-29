namespace Garrison.Core.Compilation
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One agent asset file the worker places before launch (AD2.4). The worker downloads it from DownloadUrl, checks
    /// its SHA-256, and writes it to Path in the workspace; a mismatch fails the run before launch with
    /// AssetIntegrityFailed. Run pods receive the bytes, never the URL.
    /// </summary>
    public class ExecutionAssetFile
    {
        /// <summary>
        /// Asset identifier.
        /// </summary>
        public string AssetId { get; set; } = String.Empty;

        /// <summary>
        /// Asset name.
        /// </summary>
        public string AssetName { get; set; } = String.Empty;

        /// <summary>
        /// Asset kind.
        /// </summary>
        public AgentAssetKindEnum Kind { get; set; } = AgentAssetKindEnum.ReferenceFile;

        /// <summary>
        /// Asset version number.
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Workspace-relative target path, for example .claude/skills/citation-style/SKILL.md.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Media type.
        /// </summary>
        public string MediaType { get; set; } = "application/octet-stream";

        /// <summary>
        /// Size in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// Expected SHA-256, lowercase hex.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>
        /// Download-only URL with a short-lived ticket, added when the run is leased; null in compile previews.
        /// </summary>
        public string? DownloadUrl { get; set; } = null;
    }
}
