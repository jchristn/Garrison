namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Pipeline definitions (P12.9): ordered agent stages with optional human review gates. List, get (by identifier or
    /// name), create, update, and delete need Read, Create, Update, and Delete on Pipeline. Starting needs Execute on
    /// Pipeline and Execute on every stage agent. Run tokens cannot use pipelines.
    /// </summary>
    public class PipelinesClient : ResourceClient<Pipeline, Pipeline>
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public PipelinesClient(GarrisonTransport transport) : base(transport, "pipelines")
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start a pipeline. With <see cref="PipelineStartRequest.Wait"/> the call returns when the pipeline run ends, waits
        /// for a review, or WaitSeconds pass.
        /// </summary>
        /// <param name="id">Pipeline identifier or name.</param>
        /// <param name="request">Input, priority, and wait options.</param>
        /// <param name="idempotencyKey">Optional idempotency key sent as the Idempotency-Key header: repeating a start with the same key and content returns the same pipeline run; different content answers 409.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The pipeline run with its stages, stage runs, and reviews.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelineRun> StartAsync(string id, PipelineStartRequest request, string? idempotencyKey = null, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            Dictionary<string, string?> headers = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            headers["Idempotency-Key"] = idempotencyKey;
            return await Transport.SendWithHeadersAsync<PipelineRun>(HttpMethod.Post, Item(id) + "/start", request, null, headers, token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Render every stage prompt from sample input and sample stage outputs, with secrets redacted. Nothing runs.
        /// </summary>
        /// <param name="id">Pipeline identifier or name.</param>
        /// <param name="request">Optional sample data; null previews with empty samples.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rendered prompts per stage.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelinePreviewResponse> PreviewAsync(string id, PipelinePreviewRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<PipelinePreviewResponse>(HttpMethod.Post, Item(id) + "/preview", request ?? new PipelinePreviewRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
