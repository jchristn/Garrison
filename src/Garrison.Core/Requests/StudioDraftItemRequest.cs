namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Body of PUT .../studio/drafts/{id}/items/{kind}/{name} (AD7.2).
    /// </summary>
    public class StudioDraftItemRequest
    {
        /// <summary>
        /// The draft version the caller read. Required; a stale version answers 409 DraftVersionConflict.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Upsert (default) or Delete.
        /// </summary>
        public string? Operation { get; set; } = null;

        /// <summary>
        /// One manifest document (YAML or JSON) whose kind and name match the path. Required for Upsert.
        /// </summary>
        public string Document { get; set; } = String.Empty;
    }
}
