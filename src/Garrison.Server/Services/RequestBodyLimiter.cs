namespace Garrison.Server.Services
{
    using System;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using WatsonWebserver.Core;

    /// <summary>
    /// Enforces a request body size limit on bodies sent with chunked transfer encoding (SR-03). Watson checks
    /// Content-Length against <c>IO.MaxRequestBodySize</c> before reading, but a chunked body has no length, so this
    /// reads it chunk by chunk, stops with 413 as soon as the total passes the limit, and otherwise replaces the request
    /// body with the buffered copy so handlers read it as usual. Thread-safe (no shared state).
    /// </summary>
    public static class RequestBodyLimiter
    {
        #region Public-Methods

        /// <summary>
        /// Buffer a chunked request body up to a limit. Requests without chunked transfer encoding, and a limit of 0 or
        /// less, pass through untouched.
        /// </summary>
        /// <param name="context">HTTP context.</param>
        /// <param name="maxBytes">Largest body accepted, in bytes; 0 or less turns the check off.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the request may continue; false when the body was too large and 413 has been sent.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<bool> BufferChunkedAsync(HttpContextBase context, long maxBytes, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            if (maxBytes <= 0 || !context.Request.ChunkedTransfer) return true;

            MemoryStream buffer = new MemoryStream();
            while (true)
            {
                token.ThrowIfCancellationRequested();
                Chunk? chunk = await context.Request.ReadChunk(token).ConfigureAwait(false);
                if (chunk == null) break;
                if (chunk.Data != null && chunk.Length > 0)
                {
                    if (buffer.Length + chunk.Length > maxBytes)
                    {
                        buffer.Dispose();
                        await TooLargeAsync(context, maxBytes).ConfigureAwait(false);
                        return false;
                    }
                    buffer.Write(chunk.Data, 0, chunk.Length);
                }
                if (chunk.IsFinal) break;
            }

            buffer.Position = 0;
            context.Request.Data = buffer;
            context.Request.ChunkedTransfer = false;
            context.Request.ContentLength = buffer.Length;
            return true;
        }

        #endregion

        #region Private-Methods

        private static async Task TooLargeAsync(HttpContextBase context, long maxBytes)
        {
            context.Response.StatusCode = 413;
            context.Response.ContentType = "application/json";
            ErrorResponse error = new ErrorResponse("Payload Too Large", "RequestTooLarge", "The request body is larger than the limit of " + maxBytes + " bytes.");
            await context.Response.Send(Serializer.Serialize(error)).ConfigureAwait(false);
        }

        #endregion
    }
}
