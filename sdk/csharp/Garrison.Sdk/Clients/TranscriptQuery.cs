namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Builds the query string of the transcript routes. Thread-safe.
    /// </summary>
    public static class TranscriptQuery
    {
        #region Public-Methods

        /// <summary>
        /// Build the query.
        /// </summary>
        /// <param name="format">Format.</param>
        /// <param name="includeThinking">Whether to include thinking events.</param>
        /// <returns>Query parameters.</returns>
        public static Dictionary<string, string?> Build(TranscriptFormatEnum format, bool includeThinking)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            query["format"] = format == TranscriptFormatEnum.Json ? "json" : "markdown";
            query["includeThinking"] = includeThinking ? "true" : "false";
            return query;
        }

        #endregion
    }
}
