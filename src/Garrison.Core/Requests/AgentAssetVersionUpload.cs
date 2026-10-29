namespace Garrison.Core.Requests
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// A JSON asset version upload (AD2.5): every file of the new version, with its content as base64.
    /// </summary>
    public class AgentAssetVersionUpload
    {
        #region Public-Members

        /// <summary>
        /// Optional change note, at most 2000 characters.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Files: path, optional mediaType (guessed from the extension when omitted), and contentBase64.
        /// </summary>
        public List<AgentAssetFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<AgentAssetFile>();
            }
        }

        #endregion

        #region Private-Members

        private List<AgentAssetFile> _Files = new List<AgentAssetFile>();

        #endregion
    }
}
