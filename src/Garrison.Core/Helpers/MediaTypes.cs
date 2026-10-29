namespace Garrison.Core.Helpers
{
    using System;
    using System.IO;

    /// <summary>
    /// Media type guesses from file extensions, for asset and file space uploads that do not give one (AD2, AD3).
    /// Stateless and thread-safe.
    /// </summary>
    public static class MediaTypes
    {
        #region Public-Methods

        /// <summary>
        /// Guess a media type from a path's extension.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>Media type; application/octet-stream when the extension is unknown.</returns>
        public static string ForPath(string? path)
        {
            string extension = Path.GetExtension(path ?? String.Empty).ToLowerInvariant();
            switch (extension)
            {
                case ".md": return "text/markdown";
                case ".txt": return "text/plain";
                case ".json": return "application/json";
                case ".yaml":
                case ".yml": return "application/yaml";
                case ".html": return "text/html";
                case ".csv": return "text/csv";
                case ".py": return "text/x-python";
                case ".sh": return "text/x-shellscript";
                case ".docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                case ".dotx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.template";
                case ".pdf": return "application/pdf";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                default: return "application/octet-stream";
            }
        }

        /// <summary>
        /// Whether a media type is text that can be shown as a preview.
        /// </summary>
        /// <param name="mediaType">Media type.</param>
        /// <returns>True for text/*, JSON, and YAML.</returns>
        public static bool IsText(string? mediaType)
        {
            if (String.IsNullOrEmpty(mediaType)) return false;
            return mediaType.StartsWith("text/", StringComparison.OrdinalIgnoreCase) || mediaType == "application/json" || mediaType == "application/yaml";
        }

        #endregion
    }
}
