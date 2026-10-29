namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Conversation file spaces: versioned files shared by the turns of a conversation and mounted into each run's
    /// workspace. Every method addresses the space by owner (a conversation, or a run whose file space is used) and
    /// identifier. Paths are relative, for example notes/a.md. Thread-safe.
    /// </summary>
    public class FileSpacesClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public FileSpacesClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List the files in a file space.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="includeDeleted">True to include deleted files. Default false.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Listing.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null.</exception>
        public async Task<FileSpaceListing> ListAsync(FileSpaceOwnerEnum owner, string id, bool includeDeleted = false, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["includeDeleted"] = includeDeleted ? "true" : "false";
            return await Transport.SendAsync<FileSpaceListing>(HttpMethod.Get, Files(owner, id), null, parameters, token: token).ConfigureAwait(false) ?? new FileSpaceListing();
        }

        /// <summary>
        /// Read a file's content.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="version">Version number, or null for the current version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File bytes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 InvalidFilePath or 404.</exception>
        public async Task<byte[]> ReadAsync(FileSpaceOwnerEnum owner, string id, string path, int? version = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = PathQuery(path, version);
            return await Transport.DownloadAsync(Files(owner, id) + "/content", parameters, token).ConfigureAwait(false);
        }

        /// <summary>
        /// List a file's versions, newest first.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null.</exception>
        public async Task<List<ConversationFileVersion>> ListVersionsAsync(FileSpaceOwnerEnum owner, string id, string path, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = PathQuery(path, null);
            return await Transport.SendAsync<List<ConversationFileVersion>>(HttpMethod.Get, Files(owner, id) + "/versions", null, parameters, token: token).ConfigureAwait(false) ?? new List<ConversationFileVersion>();
        }

        /// <summary>
        /// Write a file from a JSON request.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="request">Path, content, and optional media type and base version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Upload result; Conflict is true when the base version was stale.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 InvalidFilePath or 413 FileTooLarge, FileSpaceFull, or TooManyFiles.</exception>
        public async Task<FileSpaceUploadResult> WriteAsync(FileSpaceOwnerEnum owner, string id, FileSpaceWriteRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<FileSpaceUploadResult>(HttpMethod.Post, Files(owner, id), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Write a file from raw bytes.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="content">File bytes.</param>
        /// <param name="baseVersion">Optional base version; 0 means the file must not exist yet; null skips the check.</param>
        /// <param name="mediaType">Optional media type.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Upload result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id, path, or content is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 InvalidFilePath or 413 FileTooLarge, FileSpaceFull, or TooManyFiles.</exception>
        public async Task<FileSpaceUploadResult> WriteBytesAsync(FileSpaceOwnerEnum owner, string id, string path, byte[] content, int? baseVersion = null, string? mediaType = null, CancellationToken token = default)
        {
            if (content == null) throw new ArgumentNullException(nameof(content));
            Dictionary<string, string?> parameters = PathQuery(path, null);
            parameters["mediaType"] = mediaType;
            if (baseVersion != null) parameters["baseVersion"] = baseVersion.Value.ToString(CultureInfo.InvariantCulture);
            return await Transport.SendBinaryAsync<FileSpaceUploadResult>(HttpMethod.Post, Files(owner, id), content, parameters, "application/octet-stream", token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Write a text file, encoded as UTF-8.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="text">Text content.</param>
        /// <param name="baseVersion">Optional base version; 0 means the file must not exist yet; null skips the check.</param>
        /// <param name="mediaType">Optional media type.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Upload result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id, path, or text is null.</exception>
        public async Task<FileSpaceUploadResult> WriteTextAsync(FileSpaceOwnerEnum owner, string id, string path, string text, int? baseVersion = null, string? mediaType = null, CancellationToken token = default)
        {
            if (path == null) throw new ArgumentNullException(nameof(path));
            if (text == null) throw new ArgumentNullException(nameof(text));
            FileSpaceWriteRequest request = new FileSpaceWriteRequest { Path = path, Content = text, MediaType = mediaType, BaseVersion = baseVersion };
            return await WriteAsync(owner, id, request, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a file's content as UTF-8 text.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="version">Version number, or null for the current version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null.</exception>
        public async Task<string> ReadTextAsync(FileSpaceOwnerEnum owner, string id, string path, int? version = null, CancellationToken token = default)
        {
            byte[] content = await ReadAsync(owner, id, path, version, token).ConfigureAwait(false);
            return Encoding.UTF8.GetString(content);
        }

        /// <summary>
        /// Delete a file. Its versions remain readable with includeDeleted listings.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task DeleteAsync(FileSpaceOwnerEnum owner, string id, string path, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = PathQuery(path, null);
            await Transport.SendTextAsync(HttpMethod.Delete, Files(owner, id), null, parameters, token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// Issue a short-lived download-only URL for a file version. The URL needs no credentials.
        /// </summary>
        /// <param name="owner">Owner kind.</param>
        /// <param name="id">Conversation or run identifier.</param>
        /// <param name="path">Relative path.</param>
        /// <param name="version">Version number, or null for the current version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>URL and expiry.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id or path is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<FileDownloadUrl> DownloadUrlAsync(FileSpaceOwnerEnum owner, string id, string path, int? version = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = PathQuery(path, version);
            return await Transport.SendAsync<FileDownloadUrl>(HttpMethod.Post, Files(owner, id) + "/download-url", null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private string Files(FileSpaceOwnerEnum owner, string id)
        {
            if (id == null) throw new ArgumentNullException(nameof(id));
            string collection = owner == FileSpaceOwnerEnum.Run ? "/runs/" : "/conversations/";
            return TenantPath(collection + Segment(id) + "/files");
        }

        private static Dictionary<string, string?> PathQuery(string path, int? version)
        {
            if (path == null) throw new ArgumentNullException(nameof(path));
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["path"] = path;
            if (version != null) parameters["version"] = version.Value.ToString(CultureInfo.InvariantCulture);
            return parameters;
        }

        #endregion
    }
}
