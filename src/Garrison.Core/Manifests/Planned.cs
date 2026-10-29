namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Planning state for one manifest document during an apply.
    /// </summary>
    public class Planned
    {
        /// <summary>
        /// Document.
        /// </summary>
        public ManifestDocument Document { get; set; } = new ManifestDocument();

        /// <summary>
        /// Model to write.
        /// </summary>
        public object? Model { get; set; } = null;

        /// <summary>
        /// Resource identifier.
        /// </summary>
        public string? ResourceId { get; set; } = null;

        /// <summary>
        /// Planned or final result.
        /// </summary>
        public ManifestApplyResultEnum Result { get; set; } = ManifestApplyResultEnum.Validated;

        /// <summary>
        /// Message.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Stable error code when the document failed (for example ManifestInvalid, ValidationFailed, or
        /// ReferenceNotFound); null otherwise.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Path of the field that failed, for example documents[2].spec.kind; null when the failure is not about one
        /// field.
        /// </summary>
        public string? ErrorField { get; set; } = null;

        /// <summary>
        /// For prompt templates, whether the content changed (a version is written).
        /// </summary>
        public bool ContentChanged { get; set; } = false;

        /// <summary>
        /// Field changes for an Updated document; empty otherwise.
        /// </summary>
        public List<ManifestFieldChange> Changes { get; set; } = new List<ManifestFieldChange>();

        /// <summary>
        /// The stored record before this apply, for kinds whose write needs it (Trigger keeps its schedule), or null.
        /// </summary>
        public object? Previous { get; set; } = null;

        /// <summary>
        /// For an Agent document with revision.publish false on an existing agent: write the content as the agent's
        /// draft revision instead of updating the agent (AD1.7).
        /// </summary>
        public bool AgentDraftOnly { get; set; } = false;

        /// <summary>
        /// Change note from an Agent document's revision block.
        /// </summary>
        public string? AgentChangeNote { get; set; } = null;

        /// <summary>
        /// For a Deployment document that pins revision 1 of an agent created by the same bundle: the number to resolve
        /// to an identifier after the agent is written.
        /// </summary>
        public int? AgentRevisionNumber { get; set; } = null;

        /// <summary>
        /// For an Agent document with an assets list: the asset pins to publish (or draft), resolved to identifiers.
        /// Null when the document has no assets key, so the agent keeps its current pins (AD2.6).
        /// </summary>
        public List<AgentRevisionAssetPin>? AgentAssetPins { get; set; } = null;

        /// <summary>
        /// For an AgentAsset document: files to upload as a new version, with ContentBase64 set (AD2.6). Null when the
        /// files are unchanged or the document has none.
        /// </summary>
        public List<AgentAssetFile>? AssetUpload { get; set; } = null;

        /// <summary>
        /// For an AgentAsset document: change note of the new version.
        /// </summary>
        public string? AssetChangeNote { get; set; } = null;
    }
}
