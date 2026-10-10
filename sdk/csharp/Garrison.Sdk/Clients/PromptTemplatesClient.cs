namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Prompt templates with versions and rendering.
    /// </summary>
    public class PromptTemplatesClient : ResourceClient<PromptTemplate, PromptTemplateRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public PromptTemplatesClient(GarrisonTransport transport) : base(transport, "prompt-templates")
        {
        }

        /// <summary>
        /// List versions, newest first.
        /// </summary>
        /// <param name="id">Template identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        public async Task<List<PromptTemplateVersion>> ListVersionsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<PromptTemplateVersion>>(HttpMethod.Get, Collection() + "/" + Segment(id) + "/versions", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Read one version.
        /// </summary>
        /// <param name="id">Template identifier.</param>
        /// <param name="version">Version number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Version.</returns>
        public async Task<PromptTemplateVersion> GetVersionAsync(string id, int version, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromptTemplateVersion>(HttpMethod.Get, Collection() + "/" + Segment(id) + "/versions/" + version, null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Restore a version as a new version.
        /// </summary>
        /// <param name="id">Template identifier.</param>
        /// <param name="version">Version number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Template.</returns>
        public async Task<PromptTemplate> RestoreAsync(string id, int version, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromptTemplate>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/restore/" + version, null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Clone a template.
        /// </summary>
        /// <param name="id">Template identifier.</param>
        /// <param name="name">New name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>New template.</returns>
        public async Task<PromptTemplate> CloneAsync(string id, string name, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromptTemplate>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/clone", new CloneRequest { Name = name }, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Reset a cloned built-in template to the shipped default.
        /// </summary>
        /// <param name="id">Template identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Template.</returns>
        public async Task<PromptTemplate> ResetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromptTemplate>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/reset", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Render a stored template.
        /// </summary>
        /// <param name="id">Template identifier.</param>
        /// <param name="request">Render context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Render result.</returns>
        public async Task<PromptRenderResponse> RenderAsync(string id, PromptRenderRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromptRenderResponse>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/render", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Render ad hoc template content.
        /// </summary>
        /// <param name="request">Content and render context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Render result.</returns>
        public async Task<PromptRenderResponse> RenderContentAsync(PromptRenderRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<PromptRenderResponse>(HttpMethod.Post, Collection() + "/render", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
