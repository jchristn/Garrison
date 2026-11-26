namespace Garrison.Core.Organizations
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;

    /// <summary>
    /// One item of an executive's draft with the live record it would change (AA8.3, AA8.5). Not thread-safe.
    /// </summary>
    public class ExecutiveDraftItem
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Record name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Upsert or Delete.
        /// </summary>
        public StudioDraftOperationEnum Operation { get; set; } = StudioDraftOperationEnum.Upsert;

        /// <summary>
        /// The draft's document, or null for a delete.
        /// </summary>
        public ManifestDocument? Document { get; set; } = null;

        /// <summary>
        /// The live record as a manifest document, or null when it does not exist yet.
        /// </summary>
        public ManifestDocument? Live { get; set; } = null;

        #endregion
    }
}
