namespace Garrison.Sdk.Requests
{
    using System;
    using System.Text;

    /// <summary>
    /// One file to upload in a new agent asset version.
    /// </summary>
    public class AgentAssetUploadFile
    {
        #region Public-Members

        /// <summary>
        /// Relative path of the file within the asset, for example SKILL.md.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null.</exception>
        public string Path
        {
            get
            {
                return _Path;
            }
            set
            {
                _Path = value ?? throw new ArgumentNullException(nameof(Path));
            }
        }

        /// <summary>
        /// Media type, or null to let the server infer it.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Base64 file content. Use <see cref="FromBytes"/> or <see cref="FromText"/> to encode raw content.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null.</exception>
        public string ContentBase64
        {
            get
            {
                return _ContentBase64;
            }
            set
            {
                _ContentBase64 = value ?? throw new ArgumentNullException(nameof(ContentBase64));
            }
        }

        #endregion

        #region Private-Members

        private string _Path = String.Empty;
        private string _ContentBase64 = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public AgentAssetUploadFile()
        {
        }

        /// <summary>
        /// Build an upload file from raw bytes.
        /// </summary>
        /// <param name="path">Relative path within the asset.</param>
        /// <param name="content">File bytes.</param>
        /// <param name="mediaType">Optional media type.</param>
        /// <returns>Upload file.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path or content is null.</exception>
        public static AgentAssetUploadFile FromBytes(string path, byte[] content, string? mediaType = null)
        {
            if (path == null) throw new ArgumentNullException(nameof(path));
            if (content == null) throw new ArgumentNullException(nameof(content));
            return new AgentAssetUploadFile { Path = path, MediaType = mediaType, ContentBase64 = Convert.ToBase64String(content) };
        }

        /// <summary>
        /// Build an upload file from UTF-8 text.
        /// </summary>
        /// <param name="path">Relative path within the asset.</param>
        /// <param name="text">File text, encoded as UTF-8 without a byte order mark.</param>
        /// <param name="mediaType">Optional media type.</param>
        /// <returns>Upload file.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path or text is null.</exception>
        public static AgentAssetUploadFile FromText(string path, string text, string? mediaType = null)
        {
            if (text == null) throw new ArgumentNullException(nameof(text));
            return FromBytes(path, Encoding.UTF8.GetBytes(text), mediaType);
        }

        #endregion
    }
}
