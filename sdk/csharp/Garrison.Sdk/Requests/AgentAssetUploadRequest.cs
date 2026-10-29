namespace Garrison.Sdk.Requests
{
    using System.Collections.Generic;

    /// <summary>
    /// Body for uploading a new agent asset version. Uploading files identical to the current version returns the
    /// current version instead of creating a new one.
    /// </summary>
    public class AgentAssetUploadRequest
    {
        #region Public-Members

        /// <summary>
        /// Optional change note.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Files in the new version. At least one is required.
        /// </summary>
        public List<AgentAssetUploadFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<AgentAssetUploadFile>();
            }
        }

        #endregion

        #region Private-Members

        private List<AgentAssetUploadFile> _Files = new List<AgentAssetUploadFile>();

        #endregion
    }
}
