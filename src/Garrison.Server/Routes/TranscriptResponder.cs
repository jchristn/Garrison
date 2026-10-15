namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Transcripts;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Format negotiation and the download response for run and conversation transcripts (P12.27). Thread-safe.
    /// </summary>
    public static class TranscriptResponder
    {
        #region Public-Methods

        /// <summary>
        /// Read the requested format: the format query parameter (markdown or json, any case) when present, otherwise
        /// json when the Accept header names application/json, otherwise markdown.
        /// </summary>
        /// <param name="context">HTTP context.</param>
        /// <returns>Format.</returns>
        /// <exception cref="ValidationException">Thrown with the field code InvalidFormat on format for any other value.</exception>
        public static TranscriptFormatEnum Format(HttpContextBase context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            string? format = RouteHelpers.Query(context, "format");
            if (!String.IsNullOrWhiteSpace(format)) return Parse(format);
            string? accept = context.Request.Headers["Accept"];
            if (!String.IsNullOrEmpty(accept) && accept.Contains("application/json", StringComparison.OrdinalIgnoreCase)) return TranscriptFormatEnum.Json;
            return TranscriptFormatEnum.Markdown;
        }

        /// <summary>
        /// Parse a format name.
        /// </summary>
        /// <param name="format">markdown, md, or json (any case); null or empty means markdown.</param>
        /// <returns>Format.</returns>
        /// <exception cref="ValidationException">Thrown with the field code InvalidFormat on format for any other value.</exception>
        public static TranscriptFormatEnum Parse(string? format)
        {
            if (String.IsNullOrWhiteSpace(format)) return TranscriptFormatEnum.Markdown;
            string value = format.Trim();
            if (value.Equals("markdown", StringComparison.OrdinalIgnoreCase) || value.Equals("md", StringComparison.OrdinalIgnoreCase)) return TranscriptFormatEnum.Markdown;
            if (value.Equals("json", StringComparison.OrdinalIgnoreCase)) return TranscriptFormatEnum.Json;
            throw new ValidationException("Unknown transcript format '" + value + "'. Use markdown or json.",
                new Dictionary<string, string> { { "format", "Use markdown or json." } },
                new Dictionary<string, string> { { "format", "InvalidFormat" } });
        }

        /// <summary>
        /// Media type of a format.
        /// </summary>
        /// <param name="format">Format.</param>
        /// <returns>Media type with charset.</returns>
        public static string MediaType(TranscriptFormatEnum format)
        {
            return format == TranscriptFormatEnum.Json ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8";
        }

        /// <summary>
        /// Render a transcript in a format.
        /// </summary>
        /// <param name="transcript">Transcript.</param>
        /// <param name="format">Format.</param>
        /// <returns>Text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when transcript is null.</exception>
        public static string Render(Transcript transcript, TranscriptFormatEnum format)
        {
            if (transcript == null) throw new ArgumentNullException(nameof(transcript));
            return format == TranscriptFormatEnum.Json ? Serializer.Serialize(transcript) : TranscriptMarkdownWriter.Write(transcript);
        }

        /// <summary>
        /// Send a transcript as a download.
        /// </summary>
        /// <param name="context">HTTP context.</param>
        /// <param name="transcript">Transcript.</param>
        /// <param name="format">Format.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task SendAsync(HttpContextBase context, Transcript transcript, TranscriptFormatEnum format)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (transcript == null) throw new ArgumentNullException(nameof(transcript));
            string body = Render(transcript, format);
            context.Response.StatusCode = 200;
            context.Response.ContentType = MediaType(format);
            context.Response.Headers["Content-Disposition"] = "attachment; filename=\"" + TranscriptService.FileName(transcript, format) + "\"";
            context.Response.Headers["Cache-Control"] = "private, no-store";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Garrison-Transcript-Truncated"] = transcript.Truncated ? "true" : "false";
            await context.Response.Send(body, context.Token).ConfigureAwait(false);
        }

        #endregion
    }
}
