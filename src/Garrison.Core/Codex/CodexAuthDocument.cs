namespace Garrison.Core.Codex
{
    using System;
    using System.Globalization;
    using System.Text;
    using System.Text.Encodings.Web;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Reads and writes Codex CLI <c>auth.json</c> documents (G-22). Parsing never throws on bad input: a value that is
    /// not a JSON object reads as null, so callers treat it as an opaque secret. Thread-safe.
    /// </summary>
    public static class CodexAuthDocument
    {
        #region Private-Members

        private static readonly JsonSerializerOptions _Options = BuildOptions();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse an auth.json document.
        /// </summary>
        /// <param name="json">Document text, or null.</param>
        /// <returns>The document, or null when the text is empty or not a JSON object.</returns>
        public static CodexAuthFile? TryParse(string? json)
        {
            if (String.IsNullOrWhiteSpace(json)) return null;
            string trimmed = json.TrimStart();
            if (!trimmed.StartsWith("{", StringComparison.Ordinal)) return null;
            try
            {
                return JsonSerializer.Deserialize<CodexAuthFile>(json, _Options);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// Write an auth.json document, indented as Codex writes it.
        /// </summary>
        /// <param name="file">Document.</param>
        /// <returns>JSON text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when file is null.</exception>
        public static string Serialize(CodexAuthFile file)
        {
            if (file == null) throw new ArgumentNullException(nameof(file));
            return JsonSerializer.Serialize(file, _Options);
        }

        /// <summary>
        /// Read the registered claims of a JWT without checking its signature.
        /// </summary>
        /// <param name="jwt">Token, or null.</param>
        /// <returns>Claims, or null when the text is not a JWT with a JSON payload.</returns>
        public static CodexJwtClaims? ReadClaims(string? jwt)
        {
            if (String.IsNullOrWhiteSpace(jwt)) return null;
            string[] parts = jwt.Split('.');
            if (parts.Length != 3 || parts[1].Length == 0) return null;
            byte[]? payload = DecodeBase64Url(parts[1]);
            if (payload == null) return null;
            try
            {
                return JsonSerializer.Deserialize<CodexJwtClaims>(payload, _Options);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// Expiry (UTC) of the access token in an auth.json document.
        /// </summary>
        /// <param name="json">Document text, or null.</param>
        /// <returns>Expiry, or null when the document holds no access token with an exp claim.</returns>
        public static DateTime? AccessTokenExpiresUtc(string? json)
        {
            CodexAuthFile? file = TryParse(json);
            return ReadClaims(file?.Tokens?.AccessToken)?.ExpiresUtc;
        }

        /// <summary>
        /// The copy of an auth.json document handed to a run: the refresh token is removed, so a run can use the
        /// current access token but can never consume, rotate, or leak the stored refresh token. Documents without a
        /// refresh token, and text that is not an auth.json document, are returned unchanged.
        /// </summary>
        /// <param name="json">Document text, or null.</param>
        /// <returns>Run copy, or an empty string when the input is null.</returns>
        public static string ForRun(string? json)
        {
            if (json == null) return String.Empty;
            CodexAuthFile? file = TryParse(json);
            if (file == null || file.Tokens == null || String.IsNullOrEmpty(file.Tokens.RefreshToken)) return json;
            file.Tokens.RefreshToken = String.Empty;
            return Serialize(file);
        }

        /// <summary>
        /// Format a time as the RFC 3339 text Codex writes in <c>last_refresh</c>.
        /// </summary>
        /// <param name="utc">Time (UTC).</param>
        /// <returns>Text such as <c>2026-10-11T08:00:00.1234567Z</c>.</returns>
        public static string FormatTimestamp(DateTime utc)
        {
            return DateTime.SpecifyKind(utc.ToUniversalTime(), DateTimeKind.Utc).ToString("yyyy-MM-dd'T'HH:mm:ss.fffffff'Z'", CultureInfo.InvariantCulture);
        }

        #endregion

        #region Private-Methods

        private static JsonSerializerOptions BuildOptions()
        {
            JsonSerializerOptions options = new JsonSerializerOptions();
            options.WriteIndented = true;
            options.PropertyNamingPolicy = null;
            options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
            options.ReadCommentHandling = JsonCommentHandling.Skip;
            options.AllowTrailingCommas = true;
            return options;
        }

        private static byte[]? DecodeBase64Url(string text)
        {
            StringBuilder builder = new StringBuilder(text.Length + 3);
            builder.Append(text.Replace('-', '+').Replace('_', '/'));
            while (builder.Length % 4 != 0) builder.Append('=');
            try
            {
                return Convert.FromBase64String(builder.ToString());
            }
            catch (FormatException)
            {
                return null;
            }
        }

        #endregion
    }
}
