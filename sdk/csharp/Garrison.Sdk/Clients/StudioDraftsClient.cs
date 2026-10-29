namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Studio drafts (AD7): manifest bundles designed before a person approves applying them, their app graph, and the
    /// architect prompt of architect deployments. Every change names the draft version the caller read and fails with 409
    /// DraftVersionConflict when the draft moved on, or 409 DraftNotOpen when it is not Open. Reading needs Read on
    /// StudioDraft, creating needs Create, editing and requesting an apply need Update, and discarding needs Delete. An
    /// apply request creates a DraftApply approval; decide it with <see cref="ApprovalsClient.DecideAsync"/>, which needs
    /// Create on Manifest. Thread-safe.
    /// </summary>
    public class StudioDraftsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public StudioDraftsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List drafts, newest change first.
        /// </summary>
        /// <param name="mine">True for only the caller's own drafts. Default false.</param>
        /// <param name="query">Optional paging and search (title), or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page of drafts.</returns>
        public async Task<EnumerationResult<StudioDraft>> ListAsync(bool mine = false, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            if (mine) parameters["mine"] = "true";
            return await Transport.SendAsync<EnumerationResult<StudioDraft>>(HttpMethod.Get, Base(), null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<StudioDraft>();
        }

        /// <summary>
        /// Start a draft, empty or from an existing app with everything it references.
        /// </summary>
        /// <param name="request">Title and optional app; null starts an empty draft with a generated title.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft, at version 1.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 for an unknown app.</exception>
        public async Task<StudioDraft> CreateAsync(StudioDraftCreateRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<StudioDraft>(HttpMethod.Post, Base(), request ?? new StudioDraftCreateRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read a draft with its items and layout.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<StudioDraft> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<StudioDraft>(HttpMethod.Get, DraftItem(id), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Discard a draft. A pending DraftApply approval is cancelled.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, DraftItem(id), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// Create or replace one item at the version the caller read.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="kind">Manifest kind, for example Agent or AgenticApp.</param>
        /// <param name="name">Resource name; must match the document's metadata.name.</param>
        /// <param name="version">The draft version the caller read. Minimum 1.</param>
        /// <param name="document">One manifest document (YAML or JSON); ignored for Delete.</param>
        /// <param name="operation">Upsert or Delete, or null for Upsert.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft after the change.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id, kind, or name is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when version is below 1.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 (UnsupportedKind, InvalidDocument, DocumentMismatch, DeleteNotSupported) or 409 (DraftVersionConflict, DraftNotOpen).</exception>
        public async Task<StudioDraft> PutItemAsync(string id, string kind, string name, int version, string? document, StudioDraftOperationEnum? operation = null, CancellationToken token = default)
        {
            StudioDraftItemRequest request = new StudioDraftItemRequest();
            request.Version = version;
            request.Document = document ?? String.Empty;
            request.Operation = operation;
            return await Transport.SendAsync<StudioDraft>(HttpMethod.Put, ItemPath(id, kind, name), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Remove one item at the version the caller read.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="kind">Manifest kind.</param>
        /// <param name="name">Resource name.</param>
        /// <param name="version">The draft version the caller read. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft after the change.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id, kind, or name is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when version is below 1.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404 for an unknown item and 409 DraftVersionConflict.</exception>
        public async Task<StudioDraft> RemoveItemAsync(string id, string kind, string name, int version, CancellationToken token = default)
        {
            if (version < 1) throw new ArgumentOutOfRangeException(nameof(version), "version is 1 or more.");
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["version"] = version.ToString(CultureInfo.InvariantCulture);
            return await Transport.SendAsync<StudioDraft>(HttpMethod.Delete, ItemPath(id, kind, name), null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Compare each item with live configuration.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The diff.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<StudioDraftDiff> DiffAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<StudioDraftDiff>(HttpMethod.Get, DraftItem(id) + "/diff", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Validate a draft by manifest dry run. Returns the same comparison as <see cref="DiffAsync"/>.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The diff; Valid is true when nothing failed and nothing is stale.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<StudioDraftDiff> ValidateAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<StudioDraftDiff>(HttpMethod.Post, DraftItem(id) + "/validate", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Ask a person to approve applying the draft. Validates it, creates a DraftApply approval whose summary counts the
        /// creates, updates, and deletes, and moves the draft to PendingApproval. Nothing changes in live configuration until
        /// the approval is decided Allow.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="version">The draft version the caller read. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The pending approval.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when version is below 1.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 (DraftStale, DraftInvalid, DraftEmpty) or 409 (DraftVersionConflict, DraftNotOpen).</exception>
        public async Task<Approval> RequestApplyAsync(string id, int version, CancellationToken token = default)
        {
            StudioDraftVersionRequest request = new StudioDraftVersionRequest();
            request.Version = version;
            return await Transport.SendAsync<Approval>(HttpMethod.Post, DraftItem(id) + "/request-apply", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read the draft's apps as a graph of apps, agents, and call edges.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The graph.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 404.</exception>
        public async Task<StudioGraph> GetGraphAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<StudioGraph>(HttpMethod.Get, DraftItem(id) + "/graph", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Apply one graph operation. Member and edge operations rewrite the draft's AgenticApp item; MoveNode changes only the
        /// layout.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="request">Operation, the version read, and its fields.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The graph after the change.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty, or request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 (Required, NotAMember, SelfEdge, NoSuchEdge, AppDeleted) or 409 (DraftVersionConflict, DraftNotOpen).</exception>
        public async Task<StudioGraph> ApplyGraphOperationAsync(string id, StudioGraphOperationRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<StudioGraph>(HttpMethod.Post, DraftItem(id) + "/graph-operations", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Try a draft in the studio playground (AD9.1): the draft's document for the agent (default: the target app's entry
        /// agent) is written as that agent's draft revision, then run on an ephemeral deployment in the reserved draft
        /// environment. Live configuration does not change. Needs Update on StudioDraft and on AgentRevision.
        /// </summary>
        /// <param name="id">Draft identifier.</param>
        /// <param name="request">Input, optional agent, conversation, and wait settings.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The playground run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty, or request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 400 AgentNotLive for an agent the draft creates.</exception>
        public async Task<Run> PlaygroundInvokeAsync(string id, PlaygroundInvokeRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Run>(HttpMethod.Post, DraftItem(id) + "/playground/invoke", request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List architect prompts: the built-in ones first, then the tenant's clones of them, then the tenant's other System
        /// templates, each with the architect deployments that bind it. Needs Read on PromptTemplate.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries; never null.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status.</exception>
        public async Task<List<ArchitectPromptEntry>> ListArchitectPromptsAsync(CancellationToken token = default)
        {
            return await Transport.SendAsync<List<ArchitectPromptEntry>>(HttpMethod.Get, TenantPath("/studio/architect-prompts"), token: token).ConfigureAwait(false) ?? new List<ArchitectPromptEntry>();
        }

        /// <summary>
        /// Read the prompt an architect deployment uses. Needs Read on Deployment.
        /// </summary>
        /// <param name="deploymentId">Deployment identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The selection.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deploymentId is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 NotAnArchitectDeployment or 404.</exception>
        public async Task<ArchitectPromptSelection> GetArchitectPromptAsync(string deploymentId, CancellationToken token = default)
        {
            return await Transport.SendAsync<ArchitectPromptSelection>(HttpMethod.Get, ArchitectPath(deploymentId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Choose the prompt an architect deployment uses. It takes effect on the architect's next turn. Needs Update on
        /// Deployment; runs can never change it.
        /// </summary>
        /// <param name="deploymentId">Deployment identifier or name.</param>
        /// <param name="templateId">Identifier or name of a System template the tenant can read.</param>
        /// <param name="version">Version to pin, or null to follow the template's current version. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The selection.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deploymentId or templateId is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when version is below 1.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 400 (NotAnArchitectDeployment, InvalidArchitectPrompt) or 404.</exception>
        public async Task<ArchitectPromptSelection> SetArchitectPromptAsync(string deploymentId, string templateId, int? version = null, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(templateId)) throw new ArgumentNullException(nameof(templateId));
            ArchitectPromptRequest request = new ArchitectPromptRequest();
            request.ArchitectPromptTemplateId = templateId;
            request.ArchitectPromptVersion = version;
            return await Transport.SendAsync<ArchitectPromptSelection>(HttpMethod.Put, ArchitectPath(deploymentId), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion

        #region Private-Methods

        private string Base()
        {
            return TenantPath("/studio/drafts");
        }

        private string DraftItem(string id)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return Base() + "/" + Segment(id);
        }

        private string ItemPath(string id, string kind, string name)
        {
            if (String.IsNullOrEmpty(kind)) throw new ArgumentNullException(nameof(kind));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            return DraftItem(id) + "/items/" + Segment(kind) + "/" + Segment(name);
        }

        private string ArchitectPath(string deploymentId)
        {
            if (String.IsNullOrEmpty(deploymentId)) throw new ArgumentNullException(nameof(deploymentId));
            return TenantPath("/studio/architects/" + Segment(deploymentId) + "/prompt");
        }

        #endregion
    }
}
