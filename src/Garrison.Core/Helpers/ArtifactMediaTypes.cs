namespace Garrison.Core.Helpers
{
    using System.IO;

    /// <summary>Conservative media types for collected file names. Unknown extensions download as binary.</summary>
    public static class ArtifactMediaTypes
    {
        /// <summary>Resolve a file extension to a media type.</summary>
        /// <param name="name">Relative artifact name.</param>
        /// <returns>Media type.</returns>
        public static string Of(string name)
        {
            return Path.GetExtension(name).ToLowerInvariant() switch
            {
                ".txt" or ".log" => "text/plain", ".md" => "text/markdown", ".csv" => "text/csv", ".json" => "application/json",
                ".yaml" or ".yml" => "application/yaml", ".xml" => "application/xml", ".html" => "text/html", ".pdf" => "application/pdf",
                ".png" => "image/png", ".jpg" or ".jpeg" => "image/jpeg", ".gif" => "image/gif", ".svg" => "image/svg+xml", ".zip" => "application/zip",
                _ => "application/octet-stream"
            };
        }
    }
}
