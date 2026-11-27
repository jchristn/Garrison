namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using Garrison.Server.Runtime;

    /// <summary>
    /// Studio drafts (AD7.2, AD7.3, AD-002): manifest bundles designed by a person or by the agent architect, compared with
    /// live configuration by a manifest dry run, and applied only after a person approves a DraftApply approval. Items
    /// are manifest documents keyed by kind and name (AD-018). Thread-safe.
    /// </summary>
    public class StudioService
    {
        #region Public-Members

        /// <summary>
        /// Kinds a draft may hold. Secrets are left out: drafts never carry secret values.
        /// </summary>
        public static readonly IReadOnlyList<string> DraftKinds = new List<string> { "PromptTemplate", "HarnessProfile", "McpServer", "WorkspaceTemplate", "AgentAsset", "Agent", "Deployment", "Pipeline", "AgenticApp", "Trigger", "Mandate", "Organization", "NotificationEndpoint" };

        /// <summary>
        /// Kinds a draft may delete.
        /// </summary>
        public static readonly IReadOnlyList<string> DeletableKinds = new List<string> { "Agent", "Deployment", "Pipeline", "AgenticApp", "Organization" };

        /// <summary>
        /// How long a DraftApply approval waits for a decision, in hours. Default 168; minimum 1; maximum 720.
        /// </summary>
        public int ApprovalHours
        {
            get
            {
                return _ApprovalHours;
            }
            set
            {
                _ApprovalHours = Math.Clamp(value, 1, 720);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private int _ApprovalHours = 168;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public StudioService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start a draft, empty or from an export of an existing app with everything it references.
        /// </summary>
        /// <param name="ctx">Caller; the draft belongs to them (or, for a run token, to the person who started the run).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Title, optional app, optional conversation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft.</returns>
        /// <exception cref="NotFoundException">Thrown when fromApp names no app.</exception>
        public async Task<StudioDraft> CreateAsync(RequestContext ctx, string tenantId, StudioDraftCreateRequest request, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (request == null) throw new ArgumentNullException(nameof(request));
            StudioDraft draft = new StudioDraft { TenantId = tenantId, ConversationId = String.IsNullOrWhiteSpace(request.ConversationId) ? null : request.ConversationId };
            Owner(ctx, out string? ownerId, out string? ownerName);
            draft.OwnerUserId = ownerId;
            draft.OwnerName = ownerName;
            ExecutivePosition? executive = null;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                draft.OriginRunId = ctx.RunId;
                Deployment? deployment = await RunDeploymentAsync(ctx, tenantId, token).ConfigureAwait(false);
                if (deployment != null && deployment.ManagementAccess == ManagementAccessEnum.OrgSubtree)
                {
                    // AA8.3: an executive's draft is bound to the unit it leads now; every item is checked against that subtree.
                    executive = await _Server.Get<ExecutiveAuthority>().ResolveAsync(tenantId, deployment, token).ConfigureAwait(false)
                        ?? throw new AppAccessException(403, "NotAnExecutive", "This run's deployment has managementAccess OrgSubtree, but its agent leads no unit in a live organization, so it has no subtree to propose changes to.");
                    draft.OrganizationId = executive.OrganizationId;
                    draft.ExecutiveUnitId = executive.UnitId;
                    draft.ExecutiveAgentId = executive.AgentId;
                }
            }
            if (!String.IsNullOrWhiteSpace(request.FromApp))
            {
                AuthorizationDecision mayRead = await _Server.Authorization.AuthorizeAsync(ctx, tenantId, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                if (!mayRead.Permitted) throw new AppAccessException(403, "Forbidden", "Starting a draft from an app needs Read on AgenticApp.");
                AgenticApp app = await _Server.Get<AgenticAppService>().ResolveAsync(tenantId, request.FromApp, token).ConfigureAwait(false);
                draft.TargetApp = app.Name;
                ManifestExportOptions options = new ManifestExportOptions { FollowReferences = true };
                options.Resources.Add(new ManifestResourceReference { Kind = "AgenticApp", Name = app.Name });
                ManifestExportResult export = await _Server.Get<ManifestService>().ExportAsync(tenantId, options, token).ConfigureAwait(false);
                foreach (ManifestDocument document in ManifestParser.Parse(export.Yaml).Where(d => DraftKinds.Contains(d.Kind)))
                {
                    string text = Normalize(document);
                    draft.Items.Add(new StudioDraftItem { Kind = document.Kind, Name = document.Metadata.Name, Document = text, BaseHash = Hash(text) });
                }
            }
            string title = String.IsNullOrWhiteSpace(request.Title) ? (draft.TargetApp ?? (executive != null ? "Proposal for " + executive.UnitName : "Untitled draft")) : request.Title.Trim();
            draft.Title = title.Length > 256 ? title.Substring(0, 256) : title;
            await _Server.Database.StudioDrafts.CreateAsync(draft, token).ConfigureAwait(false);
            return await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a draft. A draft whose apply approval was denied, expired, or cancelled is returned to Open first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Draft.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant has no such draft.</exception>
        public async Task<StudioDraft> ReadAsync(string tenantId, string? id, CancellationToken token)
        {
            StudioDraft draft = (String.IsNullOrEmpty(id) ? null : await _Server.Database.StudioDrafts.ReadAsync(tenantId, id, token).ConfigureAwait(false))
                ?? throw new NotFoundException("Draft not found.");
            if (draft.Status == StudioDraftStatusEnum.PendingApproval && !String.IsNullOrEmpty(draft.ApprovalId))
            {
                Approval? approval = await _Server.Database.Approvals.ReadAsync(tenantId, draft.ApprovalId, token).ConfigureAwait(false);
                if (approval == null || (approval.Status != ApprovalStatusEnum.Pending && approval.Status != ApprovalStatusEnum.Approved))
                {
                    await _Server.Database.StudioDrafts.TransitionAsync(tenantId, draft.Id, draft.Version, StudioDraftStatusEnum.PendingApproval, StudioDraftStatusEnum.Open, null, null, token).ConfigureAwait(false);
                    draft = await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft;
                }
            }
            return draft;
        }

        /// <summary>
        /// Create or replace one item at the version the caller read.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="kind">Item kind.</param>
        /// <param name="name">Item name.</param>
        /// <param name="request">Version, operation, and document.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft after the change.</returns>
        /// <exception cref="ValidationException">Thrown when the kind is not allowed, the document does not parse, or its kind and name differ from the path.</exception>
        /// <exception cref="ConflictException">Thrown with DraftVersionConflict, or DraftNotOpen.</exception>
        public async Task<StudioDraft> PutItemAsync(string tenantId, string draftId, string kind, string name, StudioDraftItemRequest request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            StudioDraft draft = await OpenAsync(tenantId, draftId, request.Version, token).ConfigureAwait(false);
            string canonicalKind = DraftKinds.FirstOrDefault(k => String.Equals(k, kind, StringComparison.OrdinalIgnoreCase))
                ?? throw Invalid("kind", "UnsupportedKind", "Drafts hold " + String.Join(", ", DraftKinds) + ".");
            StudioDraftOperationEnum operation = StudioDraftOperationEnum.Upsert;
            if (!String.IsNullOrWhiteSpace(request.Operation) && !Enum.TryParse(request.Operation, true, out operation)) throw Invalid("operation", "InvalidOperation", "operation is Upsert or Delete.");
            StudioDraftItem item = new StudioDraftItem { Kind = canonicalKind, Name = name, Operation = operation };
            if (operation == StudioDraftOperationEnum.Delete)
            {
                if (!DeletableKinds.Contains(canonicalKind)) throw Invalid("operation", "DeleteNotSupported", "Drafts can delete " + String.Join(", ", DeletableKinds) + ".");
            }
            else
            {
                List<ManifestDocument> documents;
                try
                {
                    documents = ManifestParser.Parse(request.Document);
                }
                catch (Exception e) when (e is ValidationException || e is FormatException || e is InvalidOperationException || e is ArgumentException)
                {
                    throw Invalid("document", "InvalidDocument", "The document does not parse: " + e.Message);
                }
                if (documents.Count != 1) throw Invalid("document", "InvalidDocument", "Send exactly one manifest document.");
                ManifestDocument document = documents[0];
                if (!String.Equals(document.Kind, canonicalKind, StringComparison.OrdinalIgnoreCase) || !String.Equals(document.Metadata.Name, name, StringComparison.Ordinal))
                    throw Invalid("document", "DocumentMismatch", "The document is " + document.Kind + "/" + document.Metadata.Name + ", not " + canonicalKind + "/" + name + ".");
                item.Document = Normalize(document);
            }
            StudioDraftItem? existing = draft.Items.FirstOrDefault(i => i.Kind == canonicalKind && i.Name == name);
            item.BaseHash = existing != null ? existing.BaseHash : await LiveHashAsync(tenantId, canonicalKind, name, token).ConfigureAwait(false);
            if (!await _Server.Database.StudioDrafts.PutItemAsync(tenantId, draft.Id, request.Version, item, token).ConfigureAwait(false)) throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
            return await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Remove one item at the version the caller read.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="kind">Item kind.</param>
        /// <param name="name">Item name.</param>
        /// <param name="version">Version the caller read.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft after the change.</returns>
        /// <exception cref="ConflictException">Thrown with DraftVersionConflict, or DraftNotOpen.</exception>
        public async Task<StudioDraft> RemoveItemAsync(string tenantId, string draftId, string kind, string name, int version, CancellationToken token)
        {
            StudioDraft draft = await OpenAsync(tenantId, draftId, version, token).ConfigureAwait(false);
            StudioDraftItem item = draft.Items.FirstOrDefault(i => String.Equals(i.Kind, kind, StringComparison.OrdinalIgnoreCase) && i.Name == name) ?? throw new NotFoundException("The draft has no item " + kind + "/" + name + ".");
            if (!await _Server.Database.StudioDrafts.RemoveItemAsync(tenantId, draft.Id, version, item.Kind, item.Name, token).ConfigureAwait(false)) throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
            return await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Replace the graph layout at the version the caller read.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="version">Version the caller read.</param>
        /// <param name="nodes">Node positions.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft after the change.</returns>
        public async Task<StudioDraft> SetLayoutAsync(string tenantId, string draftId, int version, List<StudioDraftNode> nodes, CancellationToken token)
        {
            if (nodes == null) throw new ArgumentNullException(nameof(nodes));
            if (nodes.Count > 1000) throw Invalid("nodes", "TooMany", "At most 1000 nodes.");
            StudioDraft draft = await OpenAsync(tenantId, draftId, version, token).ConfigureAwait(false);
            if (!await _Server.Database.StudioDrafts.SetLayoutAsync(tenantId, draft.Id, version, nodes, token).ConfigureAwait(false)) throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
            return await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Draw a draft as a graph (AD7.5): a node per agent and app the draft holds or its apps refer to, the call edges of
        /// every app in the draft, and the saved positions.
        /// </summary>
        /// <param name="draft">Draft.</param>
        /// <returns>Graph.</returns>
        public static StudioGraph Graph(StudioDraft draft)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            StudioGraph graph = new StudioGraph { DraftId = draft.Id, Version = draft.Version };
            Dictionary<string, StudioGraphNode> nodes = new Dictionary<string, StudioGraphNode>(StringComparer.Ordinal);
            StudioGraphNode NodeFor(string kind, string name)
            {
                string key = kind + "/" + name;
                if (!nodes.TryGetValue(key, out StudioGraphNode? node))
                {
                    node = new StudioGraphNode { Key = key, Kind = kind, Name = name };
                    nodes[key] = node;
                }
                return node;
            }
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Kind == "Agent" || i.Kind == "AgenticApp"))
            {
                StudioGraphNode node = NodeFor(item.Kind, item.Name);
                node.InDraft = true;
                node.Deleted = item.Operation == StudioDraftOperationEnum.Delete;
            }
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Kind == "AgenticApp" && i.Operation == StudioDraftOperationEnum.Upsert))
            {
                AgenticAppSpec spec = AppSpec(item.Document);
                foreach (AppMemberSpec member in spec.Members.Where(m => !String.IsNullOrEmpty(m.Agent)))
                {
                    StudioGraphNode node = NodeFor("Agent", member.Agent);
                    if (!node.MemberOf.Contains(item.Name)) node.MemberOf.Add(item.Name);
                    if (member.Agent == spec.Entry && !node.EntryOf.Contains(item.Name)) node.EntryOf.Add(item.Name);
                }
                foreach (AppEdgeSpec edge in spec.Edges) graph.Edges.Add(new StudioGraphEdge { App = item.Name, From = edge.From, To = edge.To, FanOut = edge.FanOut ?? true, Depth = 1 + Below(spec, edge.To, new HashSet<string>(StringComparer.Ordinal)) });
            }
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Kind == "Agent" && i.Operation == StudioDraftOperationEnum.Upsert))
            {
                List<ManifestDocument> parsed = ManifestParser.Parse(item.Document);
                if (parsed.Count == 1 && parsed[0].Spec.TryGetValue("capabilities", out object? capabilities) && capabilities is List<object?> names)
                    nodes["Agent/" + item.Name].Capabilities = names.Where(n => n != null).Select(n => TemplateValues.ToText(n)).ToList();
            }
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Kind == "Organization"))
            {
                StudioGraphNode organizationNode = NodeFor("Organization", item.Name);
                organizationNode.InDraft = true;
                organizationNode.Deleted = item.Operation == StudioDraftOperationEnum.Delete;
                if (item.Operation != StudioDraftOperationEnum.Upsert) continue;
                OrganizationSpec spec = OrgSpec(item.Document);
                // Unit names match without regard to case, so peer lines are drawn to each unit's own spelling.
                Dictionary<string, string> canonical = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (OrgUnitSpec named in AllUnits(spec.Units).Where(u => !String.IsNullOrWhiteSpace(u.Name))) canonical[named.Name!.Trim()] = named.Name!.Trim();
                void Walk(List<OrgUnitSpec> level, string? parent)
                {
                    foreach (OrgUnitSpec unit in level.Where(u => !String.IsNullOrWhiteSpace(u.Name)))
                    {
                        string unitName = unit.Name!.Trim();
                        StudioGraphNode unitNode = NodeFor("OrgUnit", item.Name + "/" + unitName);
                        unitNode.InDraft = true;
                        unitNode.Organization = item.Name;
                        unitNode.ParentUnit = parent;
                        unitNode.Lead = String.IsNullOrWhiteSpace(unit.Lead) ? null : unit.Lead.Trim();
                        List<string> agents = new List<string>();
                        if (unitNode.Lead != null) agents.Add(unitNode.Lead);
                        agents.AddRange((unit.Members ?? new List<OrgUnitMemberSpec>()).Where(m => !String.IsNullOrWhiteSpace(m.Agent)).Select(m => m.Agent!.Trim()));
                        foreach (string agent in agents)
                        {
                            StudioGraphNode agentNode = NodeFor("Agent", agent);
                            string position = item.Name + "/" + unitName;
                            if (!agentNode.UnitOf.Contains(position)) agentNode.UnitOf.Add(position);
                        }
                        foreach (string peer in (unit.Peers ?? new List<string>()).Where(p => !String.IsNullOrWhiteSpace(p)))
                        {
                            graph.Edges.Add(new StudioGraphEdge { Kind = "Peer", Organization = item.Name, From = unitName, To = canonical.TryGetValue(peer.Trim(), out string? peerName) ? peerName : peer.Trim(), FanOut = false, Depth = 0 });
                        }
                        Walk(unit.Units ?? new List<OrgUnitSpec>(), unitName);
                    }
                }
                Walk(spec.Units ?? new List<OrgUnitSpec>(), null);
            }
            foreach (StudioDraftNode position in draft.Layout)
            {
                if (nodes.TryGetValue(position.NodeKey, out StudioGraphNode? node))
                {
                    node.X = position.X;
                    node.Y = position.Y;
                }
            }
            graph.Nodes = nodes.Values.OrderBy(n => n.Kind == "Organization" ? 0 : n.Kind == "OrgUnit" ? 1 : n.Kind == "AgenticApp" ? 2 : 3).ThenBy(n => n.Name, StringComparer.Ordinal).ToList();
            return graph;
        }

        /// <summary>
        /// Apply one graph operation at the version the caller read (AD7.5). Member and edge operations rewrite the app's
        /// draft item, starting from the live app when the draft does not hold it yet, or from a new app.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="request">Operation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The graph after the change.</returns>
        /// <exception cref="ValidationException">Thrown when a required field is missing or names nothing in the app.</exception>
        /// <exception cref="ConflictException">Thrown with DraftVersionConflict, or DraftNotOpen.</exception>
        public async Task<StudioGraph> ApplyGraphOperationAsync(string tenantId, string draftId, StudioGraphOperationRequest request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            StudioDraft draft = await OpenAsync(tenantId, draftId, request.Version, token).ConfigureAwait(false);
            if (request.Operation == StudioGraphOperationEnum.MoveNode)
            {
                if (String.IsNullOrWhiteSpace(request.NodeKey)) throw Invalid("nodeKey", "Required", "nodeKey is required.");
                List<StudioDraftNode> layout = draft.Layout.Where(n => n.NodeKey != request.NodeKey).ToList();
                layout.Add(new StudioDraftNode { NodeKey = request.NodeKey, X = request.X, Y = request.Y });
                if (!await _Server.Database.StudioDrafts.SetLayoutAsync(tenantId, draft.Id, request.Version, layout, token).ConfigureAwait(false)) throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
                return Graph(await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false));
            }

            if (request.Operation == StudioGraphOperationEnum.AddUnit || request.Operation == StudioGraphOperationEnum.RemoveUnit
                || request.Operation == StudioGraphOperationEnum.AddUnitMember || request.Operation == StudioGraphOperationEnum.RemoveUnitMember
                || request.Operation == StudioGraphOperationEnum.ConnectUnits || request.Operation == StudioGraphOperationEnum.DisconnectUnits)
            {
                return await ApplyUnitOperationAsync(tenantId, draft, request, token).ConfigureAwait(false);
            }

            string appName = !String.IsNullOrWhiteSpace(request.App) ? request.App.Trim() : draft.TargetApp ?? throw Invalid("app", "Required", "app is required when the draft has no target app.");
            StudioDraftItem? existing = draft.Items.FirstOrDefault(i => i.Kind == "AgenticApp" && i.Name == appName);
            if (existing != null && existing.Operation == StudioDraftOperationEnum.Delete) throw Invalid("app", "AppDeleted", "The draft deletes app " + appName + "; put it back first.");
            ManifestDocument document;
            if (existing != null)
            {
                document = ManifestParser.Parse(existing.Document)[0];
            }
            else
            {
                document = await LiveDocumentAsync(tenantId, "AgenticApp", appName, token).ConfigureAwait(false)
                    ?? new ManifestDocument { ApiVersion = "garrison/v1", Kind = "AgenticApp", Metadata = new ManifestMetadata { Name = appName } };
            }
            AgenticAppSpec spec = AppSpec(document);
            string Need(string? value, string field)
            {
                if (String.IsNullOrWhiteSpace(value)) throw Invalid(field, "Required", field + " is required for " + request.Operation + ".");
                return value.Trim();
            }
            void Member(string agent, string field)
            {
                if (!spec.Members.Any(m => m.Agent == agent)) throw Invalid(field, "NotAMember", agent + " is not a member of app " + appName + ".");
            }
            switch (request.Operation)
            {
                case StudioGraphOperationEnum.AddMember:
                    string added = Need(request.Agent, "agent");
                    if (!spec.Members.Any(m => m.Agent == added)) spec.Members.Add(new AppMemberSpec { Agent = added, Role = String.IsNullOrWhiteSpace(request.Role) ? null : request.Role.Trim() });
                    if (String.IsNullOrEmpty(spec.Entry)) spec.Entry = added;
                    break;
                case StudioGraphOperationEnum.RemoveMember:
                    string removed = Need(request.Agent, "agent");
                    Member(removed, "agent");
                    spec.Members.RemoveAll(m => m.Agent == removed);
                    spec.Edges.RemoveAll(e => e.From == removed || e.To == removed);
                    if (spec.Entry == removed) spec.Entry = spec.Members.Select(m => m.Agent).FirstOrDefault();
                    break;
                case StudioGraphOperationEnum.Connect:
                    string from = Need(request.From, "from");
                    string to = Need(request.To, "to");
                    Member(from, "from");
                    Member(to, "to");
                    if (from == to) throw Invalid("to", "SelfEdge", "A member cannot call itself.");
                    AppEdgeSpec? edge = spec.Edges.FirstOrDefault(e => e.From == from && e.To == to);
                    if (edge == null) spec.Edges.Add(new AppEdgeSpec { From = from, To = to, FanOut = request.FanOut });
                    else edge.FanOut = request.FanOut;
                    break;
                case StudioGraphOperationEnum.Disconnect:
                    string dFrom = Need(request.From, "from");
                    string dTo = Need(request.To, "to");
                    if (spec.Edges.RemoveAll(e => e.From == dFrom && e.To == dTo) == 0) throw Invalid("to", "NoSuchEdge", "App " + appName + " has no edge from " + dFrom + " to " + dTo + ".");
                    break;
                case StudioGraphOperationEnum.SetEntry:
                    string entry = Need(request.Agent, "agent");
                    Member(entry, "agent");
                    spec.Entry = entry;
                    break;
            }
            WriteAppSpec(document, spec);
            string text = Normalize(document);
            StudioDraftItem item = new StudioDraftItem { Kind = "AgenticApp", Name = appName, Document = text, Operation = StudioDraftOperationEnum.Upsert };
            item.BaseHash = existing != null ? existing.BaseHash : await LiveHashAsync(tenantId, "AgenticApp", appName, token).ConfigureAwait(false);
            if (!await _Server.Database.StudioDrafts.PutItemAsync(tenantId, draft.Id, request.Version, item, token).ConfigureAwait(false)) throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
            return Graph(await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false));
        }

        /// <summary>
        /// Compare a draft with live configuration and validate it (AD7.2): a manifest dry run of its upserts, plus a check of
        /// each delete and of every item's base against the live record.
        /// </summary>
        /// <param name="ctx">Caller, for the dry run's secret checks.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draft">Draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The diff.</returns>
        public async Task<StudioDraftDiff> DiffAsync(RequestContext ctx, string tenantId, StudioDraft draft, CancellationToken token)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            StudioDraftDiff diff = new StudioDraftDiff { DraftId = draft.Id, Version = draft.Version };
            List<StudioDraftItem> upserts = draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Upsert).ToList();
            Dictionary<string, ManifestApplyItem> planned = new Dictionary<string, ManifestApplyItem>(StringComparer.Ordinal);
            if (upserts.Count > 0)
            {
                ManifestApplyOptions options = new ManifestApplyOptions { DryRun = true, PrincipalName = ctx?.PrincipalName, PrincipalType = ctx?.PrincipalType ?? PrincipalTypeEnum.User, PrincipalId = ctx?.PrincipalId };
                // The architect's run validates as the person it acts for: a run never holds Execute on Secret itself.
                if (ctx != null) options.SecretUse = _Server.Authorization.SecretUseForDryRun(ctx, tenantId);
                ManifestApply dryRun = await _Server.Get<ManifestService>().ApplyAsync(tenantId, Bundle(upserts), options, token).ConfigureAwait(false);
                foreach (ManifestApplyItem item in dryRun.Items) planned[item.Kind + "/" + item.Name] = item;
            }
            foreach (StudioDraftItem item in OrderForApply(draft.Items))
            {
                StudioDraftDiffItem entry = new StudioDraftDiffItem { Kind = item.Kind, Name = item.Name };
                string? live = await LiveHashAsync(tenantId, item.Kind, item.Name, token).ConfigureAwait(false);
                entry.Stale = item.BaseHash != null && live != null && item.BaseHash != live;
                if (item.Operation == StudioDraftOperationEnum.Delete)
                {
                    entry.Change = live == null ? "Unchanged" : "Delete";
                    if (live == null) entry.Message = "Nothing to delete.";
                }
                else if (planned.TryGetValue(item.Kind + "/" + item.Name, out ManifestApplyItem? result))
                {
                    ManifestApplyResultEnum outcome = result.Result == ManifestApplyResultEnum.Validated && result.PlannedResult.HasValue ? result.PlannedResult.Value : result.Result;
                    entry.Change = outcome == ManifestApplyResultEnum.Created ? "Create" : outcome == ManifestApplyResultEnum.Updated ? "Update" : outcome == ManifestApplyResultEnum.Failed ? "Failed" : "Unchanged";
                    entry.Changes = result.Changes;
                    entry.Message = result.Result == ManifestApplyResultEnum.Failed ? result.Message : null;
                    entry.ErrorCode = result.ErrorCode;
                }
                if (entry.Stale && entry.Message == null) entry.Message = "The live record changed since the draft was based on it.";
                diff.Items.Add(entry);
            }
            diff.Valid = diff.Items.All(i => i.Change != "Failed" && !i.Stale);
            if (!String.IsNullOrEmpty(draft.ExecutiveUnitId))
            {
                ChangeRuleMatch? match = await ExecutiveReviewAsync(draft, diff, token).ConfigureAwait(false);
                diff.Valid = diff.Items.All(i => i.Change != "Failed" && !i.Stale) && diff.Refusals.Count == 0;
                diff.AppliesByRule = diff.Valid && match != null && match.AllMatched && diff.Items.Any(i => i.Change != "Unchanged");
            }
            return diff;
        }

        /// <summary>
        /// Whether a run may use a draft (AD-017, AA8.3): only drafts of the person it acts for; an executive (OrgSubtree)
        /// only its own proposals for the unit it leads now, and any other run never an executive's proposal. People pass.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="draft">Draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the caller may use the draft.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<bool> RunMayUseAsync(RequestContext ctx, StudioDraft draft, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            if (ctx.PrincipalType != PrincipalTypeEnum.Run) return true;
            Owner(ctx, out string? owner, out string? _);
            if (draft.OwnerUserId != owner) return false;
            // A revert draft (organization set, no executive) belongs to rollback; no run reads or edits it (AA-073).
            if (!String.IsNullOrEmpty(draft.OrganizationId) && String.IsNullOrEmpty(draft.ExecutiveUnitId)) return false;
            Deployment? deployment = await RunDeploymentAsync(ctx, draft.TenantId, token).ConfigureAwait(false);
            if (deployment == null) return false;
            if (deployment.ManagementAccess != ManagementAccessEnum.OrgSubtree) return String.IsNullOrEmpty(draft.ExecutiveUnitId);
            ExecutivePosition? executive = await _Server.Get<ExecutiveAuthority>().ResolveAsync(draft.TenantId, deployment, token).ConfigureAwait(false);
            return executive != null && draft.ExecutiveUnitId == executive.UnitId && draft.ExecutiveAgentId == executive.AgentId;
        }

        /// <summary>
        /// Apply a revert draft recorded with an executive's apply (AA8.6), as part of an organization rollback: its records
        /// return to how they were before, and records the apply created are deleted. Nothing happens when the draft is gone
        /// or no longer open.
        /// </summary>
        /// <param name="ctx">The person rolling back.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Revert draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when applied.</returns>
        /// <exception cref="ConflictException">Thrown with RevertFailed when the manifest apply fails (nothing changed).</exception>
        public async Task<bool> ApplyRevertAsync(RequestContext ctx, string tenantId, string draftId, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            StudioDraft? draft = await _Server.Database.StudioDrafts.ReadAsync(tenantId, draftId, token).ConfigureAwait(false);
            if (draft == null || draft.Status != StudioDraftStatusEnum.Open) return false;
            List<StudioDraftItem> upserts = draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Upsert).ToList();
            string? applyId = null;
            if (upserts.Count > 0)
            {
                // A rollback restores pins as they were, so it is not eval gated (the emergency path, like a promotion rollback).
                ManifestApplyOptions options = new ManifestApplyOptions { PrincipalName = ctx.PrincipalName, PrincipalType = ctx.PrincipalType, PrincipalId = ctx.PrincipalId, SecretUse = _Server.Authorization.SecretUse(ctx, tenantId), MandateRevisionSource = MandateRevisionSourceEnum.Human, SkipEvalGates = true, Force = true };
                ManifestApply applied = await _Server.Get<ManifestService>().ApplyAsync(tenantId, Bundle(upserts), options, token).ConfigureAwait(false);
                if (applied.FailedCount > 0) throw new ConflictException("RevertFailed", "Undoing " + draft.Title + " failed, and nothing was changed: " + String.Join("; ", applied.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Kind + "/" + i.Name + ": " + i.Message)));
                applyId = applied.Id;
                if (draft.PublishOnApply)
                {
                    foreach (StudioDraftItem agent in upserts.Where(i => i.Kind == "Agent"))
                    {
                        await PublishAgentAsync(ctx, tenantId, agent.Name, draft.Title, token).ConfigureAwait(false);
                        await RepinDevAsync(ctx, tenantId, agent.Name, token).ConfigureAwait(false);
                    }
                }
            }
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Delete).OrderBy(i => i.Kind == "Agent" ? 1 : 0)) await DeleteLiveAsync(ctx, tenantId, item, token).ConfigureAwait(false);
            await _Server.Database.StudioDrafts.TransitionAsync(tenantId, draft.Id, draft.Version, StudioDraftStatusEnum.Open, StudioDraftStatusEnum.Applied, null, applyId, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "StudioDraft", draft.Id, "Applied " + draft.Title + " during an organization rollback.", tenantId, token).ConfigureAwait(false);
            return true;
        }

        /// <summary>
        /// Ask a person to approve applying the draft (AD7.3): validate it, then create a DraftApply approval holding the
        /// diff and move the draft to PendingApproval. Nothing changes live until a person approves. An executive's draft
        /// whose every change a change rule covers applies at once (AA8.6). An executive may ask again for a draft that is
        /// waiting (AA9.10): while it is still uncovered the waiting approval comes back unchanged; once covered, for example
        /// after an eval run passed a rule's gate, the waiting approval is cancelled and the draft applies under the rules.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="version">Version the caller read.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The approval.</returns>
        /// <exception cref="ValidationException">Thrown with DraftInvalid when an item fails validation, DraftStale when a live record moved, DraftEmpty without changes.</exception>
        public async Task<Approval> RequestApplyAsync(RequestContext ctx, string tenantId, string draftId, int version, CancellationToken token)
        {
            StudioDraft current = await ReadAsync(tenantId, draftId, token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(current.ExecutiveUnitId) && current.Status == StudioDraftStatusEnum.PendingApproval && current.Version == version && !String.IsNullOrEmpty(current.ApprovalId))
            {
                // AA9.10: an executive asks again for a proposal that waits, for example after its eval passed a rule's gate.
                // Still uncovered, it keeps waiting with the same approval; covered now, the waiting approval is cancelled
                // and the draft applies under the rules below.
                Approval? pendingApproval = await _Server.Database.Approvals.ReadAsync(tenantId, current.ApprovalId, token).ConfigureAwait(false);
                if (pendingApproval != null && pendingApproval.Status == ApprovalStatusEnum.Pending)
                {
                    StudioDraftDiff recheck = await DiffAsync(ctx, tenantId, current, token).ConfigureAwait(false);
                    bool coveredNow = recheck.AppliesByRule && !recheck.Items.Any(i => i.Stale)
                        && (await _Server.Authorization.AuthorizeOriginAsync(ctx, tenantId, ResourceTypeEnum.Manifest, OperationTypeEnum.Create, token).ConfigureAwait(false)).Permitted;
                    if (!coveredNow) return pendingApproval;
                    await _Server.Get<Garrison.Server.Runtime.ApprovalService>().CancelDraftAsync(pendingApproval, "Superseded: change rules now cover every change, so the draft applies under them.", token).ConfigureAwait(false);
                    if (!await _Server.Database.StudioDrafts.TransitionAsync(tenantId, current.Id, current.Version, StudioDraftStatusEnum.PendingApproval, StudioDraftStatusEnum.Open, null, null, token).ConfigureAwait(false))
                    {
                        throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, current.Id, token).ConfigureAwait(false) ?? current);
                    }
                    StudioDraft reopened = await _Server.Database.StudioDrafts.ReadAsync(tenantId, current.Id, token).ConfigureAwait(false) ?? current;
                    version = reopened.Version;
                }
            }
            StudioDraft draft = await OpenAsync(tenantId, draftId, version, token).ConfigureAwait(false);
            StudioDraftDiff diff = await DiffAsync(ctx, tenantId, draft, token).ConfigureAwait(false);
            if (diff.Items.Any(i => i.Stale)) throw Invalid("items", "DraftStale", "Live configuration changed since the draft was based on it: " + String.Join(", ", diff.Items.Where(i => i.Stale).Select(i => i.Kind + "/" + i.Name)) + ". Rebase those items and try again.");
            bool executive = !String.IsNullOrEmpty(draft.ExecutiveUnitId);
            if (!diff.Valid)
            {
                if (executive) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", "rule", "outcome", "refused");
                string problems = String.Join("; ", diff.Items.Where(i => i.Change == "Failed").Select(i => i.Kind + "/" + i.Name + ": " + (i.ErrorCode != null && executive ? i.ErrorCode + ": " : String.Empty) + i.Message));
                throw Invalid("items", "DraftInvalid", "The draft does not validate: " + problems);
            }
            if (diff.Items.All(i => i.Change == "Unchanged")) throw Invalid("items", "DraftEmpty", "The draft changes nothing.");
            // AA8.6: an executive's draft whose every change a change rule covers applies at once, for the person who started
            // the run, when that person may apply manifests; otherwise it waits for a person as any draft does.
            bool byRule = executive && diff.AppliesByRule
                && (await _Server.Authorization.AuthorizeOriginAsync(ctx, tenantId, ResourceTypeEnum.Manifest, OperationTypeEnum.Create, token).ConfigureAwait(false)).Permitted;
            List<string> ruleIds = diff.RuleMatches.Where(m => m.RuleId != null).Select(m => m.RuleId!).Distinct(StringComparer.Ordinal).ToList();
            Approval approval = new Approval
            {
                TenantId = tenantId, RunId = String.Empty, AgentId = String.Empty, AgentName = "studio", DeploymentId = String.Empty, Kind = ApprovalKindEnum.DraftApply,
                ToolName = "Apply draft " + draft.Title, DraftId = draft.Id, Status = ApprovalStatusEnum.Pending, TimeoutDecision = ApprovalDecisionEnum.Deny,
                Summary = "Apply draft " + draft.Title + ": " + Summarize(diff), InputPreview = Serializer.Serialize(diff),
                RequestedUtc = DateTime.UtcNow, ExpiresUtc = DateTime.UtcNow.AddHours(_ApprovalHours),
                RuleId = byRule ? ruleIds.FirstOrDefault() : null, RulePattern = byRule ? String.Join(", ", ruleIds) : null
            };
            if (executive && !String.IsNullOrEmpty(draft.OriginRunId))
            {
                Run? origin = await _Server.Database.Runs.ReadAsync(tenantId, draft.OriginRunId, token).ConfigureAwait(false);
                if (origin != null)
                {
                    approval.RootRunId = origin.Id;
                    approval.AgentId = origin.AgentId;
                    approval.AgentName = origin.AgentName ?? approval.AgentName;
                }
            }
            await _Server.Database.Approvals.CreateAsync(approval, token).ConfigureAwait(false);
            if (!await _Server.Database.StudioDrafts.TransitionAsync(tenantId, draft.Id, version, StudioDraftStatusEnum.Open, StudioDraftStatusEnum.PendingApproval, approval.Id, null, token).ConfigureAwait(false))
            {
                await _Server.Get<Garrison.Server.Runtime.ApprovalService>().CancelDraftAsync(approval, "The draft changed before the request was recorded.", token).ConfigureAwait(false);
                throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
            }
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "StudioDraft", draft.Id, "Requested approval to apply draft " + draft.Title + " (" + Summarize(diff) + ").", tenantId, token).ConfigureAwait(false);
            if (!byRule)
            {
                if (executive) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", "user", "outcome", "waiting");
                return approval;
            }
            StudioDraft pending = await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft;
            string reason = "Applied under change rules " + String.Join(", ", ruleIds) + ": every change is covered (" + String.Join("; ", diff.RuleMatches.Select(m => m.Kind + "/" + m.Name + (m.Detail == null ? String.Empty : " " + m.Detail) + " by " + m.RuleName)) + ").";
            return await ApplyApprovedAsync(ctx, approval, pending, reason, true, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Decide a DraftApply approval (AD7.3). Allowing it checks the decider may apply manifests, re-validates the draft,
        /// refuses with DraftStale when live configuration moved since validation, and then applies the draft. Denying it
        /// returns the draft to Open.
        /// </summary>
        /// <param name="ctx">Decider.</param>
        /// <param name="approval">Pending DraftApply approval.</param>
        /// <param name="allow">Whether to apply.</param>
        /// <param name="reason">Reason, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The approval as decided.</returns>
        /// <exception cref="ConflictException">Thrown with ApprovalNotPending, DraftStale, or DraftInvalid.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 ApproverIsAgent for a run token, or ApproverLacksPermission.</exception>
        public async Task<Approval> DecideAsync(RequestContext ctx, Approval approval, bool allow, string? reason, CancellationToken token)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (approval == null) throw new ArgumentNullException(nameof(approval));
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw new AppAccessException(403, "ApproverIsAgent", "An agent cannot decide a draft approval; a person must.");
            if (approval.Status != ApprovalStatusEnum.Pending) throw new ConflictException("ApprovalNotPending", "Approval " + approval.Id + " is no longer pending; it is " + approval.Status + ".");
            Garrison.Server.Runtime.ApprovalService approvals = _Server.Get<Garrison.Server.Runtime.ApprovalService>();
            StudioDraft draft = await _Server.Database.StudioDrafts.ReadAsync(approval.TenantId, approval.DraftId ?? String.Empty, token).ConfigureAwait(false) ?? throw new NotFoundException("The draft no longer exists.");
            if (!allow)
            {
                if (!String.IsNullOrEmpty(draft.ExecutiveUnitId)) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", "user", "outcome", "denied");
                await approvals.ResolveDraftAsync(ctx, approval, false, reason, token).ConfigureAwait(false);
                await _Server.Database.StudioDrafts.TransitionAsync(draft.TenantId, draft.Id, draft.Version, StudioDraftStatusEnum.PendingApproval, StudioDraftStatusEnum.Open, null, null, token).ConfigureAwait(false);
                return await _Server.Database.Approvals.ReadAsync(approval.TenantId, approval.Id, token).ConfigureAwait(false) ?? approval;
            }
            AuthorizationDecision mayApply = await _Server.Authorization.AuthorizeAsync(ctx, approval.TenantId, ResourceTypeEnum.Manifest, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
            if (!mayApply.Permitted) throw new AppAccessException(403, "ApproverLacksPermission", "Applying a draft needs Create on Manifest, which you do not hold. Ask someone who can apply manifests.");
            if (draft.Items.Any(i => i.Operation == StudioDraftOperationEnum.Delete))
            {
                foreach (StudioDraftItem item in draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Delete))
                {
                    AuthorizationDecision mayDelete = await _Server.Authorization.AuthorizeAsync(ctx, approval.TenantId, Enum.Parse<ResourceTypeEnum>(item.Kind), OperationTypeEnum.Delete, null, token).ConfigureAwait(false);
                    if (!mayDelete.Permitted) throw new AppAccessException(403, "ApproverLacksPermission", "The draft deletes " + item.Kind + "/" + item.Name + ", which needs Delete on " + item.Kind + ".");
                }
            }
            return await ApplyApprovedAsync(ctx, approval, draft, reason, false, token).ConfigureAwait(false);
        }

        /// <summary>
        /// A draft that cannot be applied: cancel its approval with the reason, open the draft again so it can be fixed, and
        /// throw DraftInvalid naming what failed.
        /// </summary>
        /// <param name="ctx">Deciding principal.</param>
        /// <param name="approvals">Approval service.</param>
        /// <param name="approval">The pending DraftApply approval.</param>
        /// <param name="draft">The draft.</param>
        /// <param name="problem">What failed.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Never returns normally.</returns>
        /// <exception cref="ConflictException">Always thrown, with DraftInvalid.</exception>
        private async Task ReopenInvalidAsync(RequestContext ctx, Garrison.Server.Runtime.ApprovalService approvals, Approval approval, StudioDraft draft, string problem, CancellationToken token)
        {
            string reason = problem.Length > 3500 ? problem.Substring(0, 3500) + "..." : problem;
            // Cancelled rather than denied: the person allowed it, and the draft could not be applied.
            await approvals.CancelDraftAsync(approval, reason, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ApprovalDecided, "Approval", approval.Id, "Allowed " + approval.ToolName + ", but it could not be applied: " + reason, approval.TenantId, token).ConfigureAwait(false);
            await _Server.Database.StudioDrafts.TransitionAsync(draft.TenantId, draft.Id, draft.Version, StudioDraftStatusEnum.PendingApproval, StudioDraftStatusEnum.Open, null, null, token).ConfigureAwait(false);
            throw new ConflictException("DraftInvalid", problem + " The approval was cancelled and the draft is open again; fix it and request approval again.");
        }

        /// <summary>
        /// Discard a draft that is not applied. Its eval copies (AA9.10) are deleted too; its eval runs and results stay.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string tenantId, string draftId, CancellationToken token)
        {
            StudioDraft draft = await ReadAsync(tenantId, draftId, token).ConfigureAwait(false);
            if (draft.Status == StudioDraftStatusEnum.PendingApproval && !String.IsNullOrEmpty(draft.ApprovalId))
            {
                Approval? approval = await _Server.Database.Approvals.ReadAsync(tenantId, draft.ApprovalId, token).ConfigureAwait(false);
                if (approval != null && approval.Status == ApprovalStatusEnum.Pending) await _Server.Get<Garrison.Server.Runtime.ApprovalService>().CancelDraftAsync(approval, "The draft was deleted.", token).ConfigureAwait(false);
            }
            await _Server.Database.StudioDrafts.DeleteAsync(tenantId, draft.Id, token).ConfigureAwait(false);
            await DeleteEvalCopiesAsync(tenantId, draft.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The person a caller acts for: the user, or for a run token the run's originating principal.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="ownerId">Owner user or credential identifier.</param>
        /// <param name="ownerName">Owner name.</param>
        public static void Owner(RequestContext ctx, out string? ownerId, out string? ownerName)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                ownerId = ctx.OriginPrincipalId;
                ownerName = ctx.PrincipalName;
                return;
            }
            ownerId = ctx.UserId ?? ctx.CredentialId;
            ownerName = ctx.PrincipalName;
        }

        #endregion

        #region Private-Methods

        private async Task<Approval> ApplyApprovedAsync(RequestContext ctx, Approval approval, StudioDraft draft, string? reason, bool byRule, CancellationToken token)
        {
            // Shared by a person's allow (AD7.3) and a change rule's (AA8.6): validate again, apply, record, and resolve.
            Garrison.Server.Runtime.ApprovalService approvals = _Server.Get<Garrison.Server.Runtime.ApprovalService>();
            bool executive = !String.IsNullOrEmpty(draft.ExecutiveUnitId);
            string source = byRule ? "rule" : "user";
            StudioDraftDiff diff = await DiffAsync(ctx, approval.TenantId, draft, token).ConfigureAwait(false);
            if (diff.Items.Any(i => i.Stale))
            {
                if (byRule) await approvals.CancelDraftAsync(approval, "Live configuration changed since the draft was validated; validate it again.", token).ConfigureAwait(false);
                else await approvals.ResolveDraftAsync(ctx, approval, false, "Live configuration changed since the draft was validated; validate it again.", token).ConfigureAwait(false);
                await _Server.Database.StudioDrafts.TransitionAsync(draft.TenantId, draft.Id, draft.Version, StudioDraftStatusEnum.PendingApproval, StudioDraftStatusEnum.Open, null, null, token).ConfigureAwait(false);
                if (executive) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", source, "outcome", "failed");
                throw new ConflictException("DraftStale", "Live configuration changed since the draft was validated: " + String.Join(", ", diff.Items.Where(i => i.Stale).Select(i => i.Kind + "/" + i.Name)) + ". The draft is open again; validate it and request approval again.");
            }
            if (!diff.Valid)
            {
                if (executive) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", source, "outcome", "refused");
                await ReopenInvalidAsync(ctx, approvals, approval, draft, "The draft no longer validates: " + String.Join("; ", diff.Items.Where(i => i.Change == "Failed").Select(i => i.Kind + "/" + i.Name + ": " + i.Message)), token).ConfigureAwait(false);
            }

            // A run acts with the secrets of the person who started it; executive mandate revisions say so (AA8.7).
            ManifestApplyOptions options = new ManifestApplyOptions
            {
                PrincipalName = ctx.PrincipalName, PrincipalType = ctx.PrincipalType, PrincipalId = ctx.PrincipalId,
                SecretUse = ctx.PrincipalType == PrincipalTypeEnum.Run ? _Server.Authorization.SecretUseForDryRun(ctx, approval.TenantId) : _Server.Authorization.SecretUse(ctx, approval.TenantId),
                MandateRevisionSource = executive ? MandateRevisionSourceEnum.Executive : MandateRevisionSourceEnum.Architect
            };
            string? revertId = executive ? await CreateRevertDraftAsync(draft, token).ConfigureAwait(false) : null;
            List<StudioDraftItem> upserts = draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Upsert).ToList();
            string? applyId = null;
            if (upserts.Count > 0)
            {
                ManifestApply applied = await _Server.Get<ManifestService>().ApplyAsync(approval.TenantId, executive ? ExecutiveBundle(upserts) : Bundle(upserts), options, token).ConfigureAwait(false);
                applyId = applied.Id;
                // A failed apply was rolled back, so nothing changed live.
                if (applied.FailedCount > 0)
                {
                    if (revertId != null) await _Server.Database.StudioDrafts.DeleteAsync(approval.TenantId, revertId, token).ConfigureAwait(false);
                    if (executive) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", source, "outcome", "failed");
                    await ReopenInvalidAsync(ctx, approvals, approval, draft, "Applying the draft failed, and nothing was changed: " + String.Join("; ", applied.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed).Select(i => i.Kind + "/" + i.Name + ": " + i.Message)), token).ConfigureAwait(false);
                }
            }
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Delete)) await DeleteLiveAsync(ctx, approval.TenantId, item, token).ConfigureAwait(false);
            if (draft.PublishOnApply)
            {
                foreach (StudioDraftDiffItem changed in diff.Items.Where(i => i.Kind == "Agent" && (i.Change == "Create" || i.Change == "Update")))
                {
                    await PublishAgentAsync(ctx, approval.TenantId, changed.Name, "Studio draft " + draft.Title, token).ConfigureAwait(false);
                    await RepinDevAsync(ctx, approval.TenantId, changed.Name, token).ConfigureAwait(false);
                }
            }
            if (executive) await RecordExecutiveApplyAsync(ctx, approval, draft, revertId, byRule, token).ConfigureAwait(false);
            if (byRule) await approvals.ResolveDraftByRuleAsync(approval, reason ?? "Applied under change rules.", token).ConfigureAwait(false);
            else await approvals.ResolveDraftAsync(ctx, approval, true, reason, token).ConfigureAwait(false);
            await _Server.Database.StudioDrafts.TransitionAsync(draft.TenantId, draft.Id, draft.Version, StudioDraftStatusEnum.PendingApproval, StudioDraftStatusEnum.Applied, approval.Id, applyId, token).ConfigureAwait(false);
            await DeleteEvalCopiesAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "StudioDraft", draft.Id, "Applied draft " + draft.Title + " (" + Summarize(diff) + ")" + (byRule ? " under change rules " + approval.RulePattern : String.Empty) + (applyId == null ? "." : " as manifest apply " + applyId + "."), approval.TenantId, token).ConfigureAwait(false);
            if (executive) GarrisonMetrics.Count(GarrisonMetricCatalog.OrgProposals, "source", source, "outcome", "applied");
            return await _Server.Database.Approvals.ReadAsync(approval.TenantId, approval.Id, token).ConfigureAwait(false) ?? approval;
        }

        private async Task DeleteEvalCopiesAsync(string tenantId, string draftId, CancellationToken token)
        {
            // AA9.10: a draft's eval copies go with it; eval runs and results stay. A failure here never fails the apply or
            // delete: the leader's sweep removes what is left once it is idle.
            EvalCopyJanitor? janitor = _Server.TryGet<EvalCopyJanitor>();
            if (janitor == null) return;
            try
            {
                await janitor.DeleteDraftCopiesAsync(tenantId, draftId, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Server.Logging.Warn("[Studio] could not delete the eval copies of draft " + draftId + "; the sweep removes them later: " + e.Message);
            }
        }

        private async Task RecordExecutiveApplyAsync(RequestContext ctx, Approval approval, StudioDraft draft, string? revertId, bool byRule, CancellationToken token)
        {
            // AA8.6: every executive apply becomes an org revision, so the organization's rollback undoes it.
            Organization? organization = await _Server.Database.Organizations.ReadAsync(draft.TenantId, draft.OrganizationId ?? String.Empty, token).ConfigureAwait(false);
            if (organization == null) return;
            string note = (byRule ? "Applied under change rules " + approval.RulePattern : "Applied with approval by " + (ctx.PrincipalName ?? "a person")) + ": " + draft.Title + ".";
            try
            {
                await _Server.Get<OrganizationService>().RecordExecutiveApplyAsync(ctx, organization, draft.Id, revertId, note, token).ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                // The change is live already; say why no revision recorded it rather than failing the apply.
                await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Organization", organization.Id, "Executive draft " + draft.Title + " was applied, but no revision of organization " + organization.Name + " could record it: " + e.Message, draft.TenantId, token).ConfigureAwait(false);
            }
        }

        private async Task<ChangeRuleMatch?> ExecutiveReviewAsync(StudioDraft draft, StudioDraftDiff diff, CancellationToken token)
        {
            using (System.Diagnostics.Activity? span = GarrisonTracing.Start("org proposal validate", System.Diagnostics.ActivityKind.Internal))
            {
                ExecutiveDraftContext? context = await _Server.Get<ExecutiveAuthority>().ContextAsync(draft, token).ConfigureAwait(false);
                if (context == null)
                {
                    // The executive no longer leads the unit in a live organization: its authority is gone with the position.
                    foreach (StudioDraftDiffItem entry in diff.Items)
                    {
                        ExecutiveRefusal gone = new ExecutiveRefusal { Kind = entry.Kind, Name = entry.Name, Code = ExecutiveDraftValidator.OutsideSubtree, Message = "The executive that wrote this draft no longer leads its unit in a live organization, so it has no subtree to change." };
                        diff.Refusals.Add(gone);
                        Refuse(entry, gone);
                    }
                    span?.SetTag("garrison.result", "no_authority");
                    return null;
                }
                diff.Refusals = ExecutiveDraftValidator.Validate(context);
                foreach (ExecutiveRefusal refusal in diff.Refusals)
                {
                    StudioDraftDiffItem? entry = diff.Items.FirstOrDefault(i => i.Kind == refusal.Kind && (i.Name == refusal.Name || refusal.Name.StartsWith(i.Name + "/", StringComparison.Ordinal)));
                    if (entry != null) Refuse(entry, refusal);
                }
                List<ChangeClassification> changes = ChangeClassifier.Classify(context);
                List<ChangeRule> rules = await _Server.Database.ChangeRules.ListInForceAsync(draft.TenantId, context.Scope.OrganizationId, DateTime.UtcNow, token).ConfigureAwait(false);
                // AA9.10: a rule's eval gate is read here, because matching itself reads nothing.
                Dictionary<string, ChangeRuleGateStatus> gates = new Dictionary<string, ChangeRuleGateStatus>(StringComparer.Ordinal);
                if (rules.Any(r => !String.IsNullOrWhiteSpace(r.GateEvalSet)) && changes.Any(c => c.Classes.Any(k => ChangeRuleMatcher.GatedClasses.Contains(k))))
                {
                    ExecutivePosition proposer = new ExecutivePosition { OrganizationId = context.Scope.OrganizationId, OrganizationName = context.Scope.OrganizationName, UnitId = context.Scope.UnitId, UnitName = context.Scope.UnitName, AgentId = context.Scope.AgentId };
                    EvalGateService evalGates = _Server.Get<EvalGateService>();
                    foreach (ChangeRule gated in rules.Where(r => !String.IsNullOrWhiteSpace(r.GateEvalSet)))
                    {
                        gates[gated.Id] = await evalGates.DraftGateAsync(draft, gated, proposer, token).ConfigureAwait(false);
                    }
                }
                ChangeRuleMatch match = ChangeRuleMatcher.Match(changes, rules, context.Scope.Tree, DateTime.UtcNow, gates);
                diff.RuleMatches = match.Items;
                span?.SetTag("garrison.result", diff.Refusals.Count > 0 ? "refused" : match.AllMatched ? "covered" : "needs_person");
                return match;
            }
        }

        private static void Refuse(StudioDraftDiffItem entry, ExecutiveRefusal refusal)
        {
            // A dry-run failure message is replaced; a second refusal of the same item adds to the first.
            bool refusedBefore = entry.Change == "Failed" && entry.ErrorCode != null && ExecutiveDraftValidator.IsRefusalCode(entry.ErrorCode);
            entry.Message = refusedBefore ? entry.Message + " " + refusal.Message : refusal.Message;
            entry.Change = "Failed";
            entry.ErrorCode = refusal.Code;
        }

        private async Task<string?> CreateRevertDraftAsync(StudioDraft draft, CancellationToken token)
        {
            // AA8.6: the records an executive's apply changes, as they are now, so a rollback past its revision puts them back.
            // The organization itself comes back through the revision snapshot; records the apply creates are deleted.
            StudioDraft revert = new StudioDraft { TenantId = draft.TenantId, OwnerUserId = draft.OwnerUserId, OwnerName = draft.OwnerName, PublishOnApply = draft.PublishOnApply, OrganizationId = draft.OrganizationId };
            string title = "Undo: " + draft.Title;
            revert.Title = title.Length > 256 ? title.Substring(0, 256) : title;
            foreach (StudioDraftItem item in draft.Items.Where(i => i.Operation == StudioDraftOperationEnum.Upsert && i.Kind != "Organization"))
            {
                ManifestDocument? live = await LiveDocumentAsync(draft.TenantId, item.Kind, item.Name, token).ConfigureAwait(false);
                if (live != null) revert.Items.Add(new StudioDraftItem { Kind = item.Kind, Name = item.Name, Operation = StudioDraftOperationEnum.Upsert, Document = Normalize(live) });
                else if (DeletableKinds.Contains(item.Kind)) revert.Items.Add(new StudioDraftItem { Kind = item.Kind, Name = item.Name, Operation = StudioDraftOperationEnum.Delete });
            }
            if (revert.Items.Count == 0) return null;
            await _Server.Database.StudioDrafts.CreateAsync(revert, token).ConfigureAwait(false);
            return revert.Id;
        }

        private static string ExecutiveBundle(List<StudioDraftItem> items)
        {
            // The organization's revision is recorded after the apply (AA8.6), so the document only writes the working tree.
            List<string> documents = new List<string>();
            foreach (StudioDraftItem item in OrderForApply(items))
            {
                string text = item.Document;
                if (item.Kind == "Organization")
                {
                    ManifestDocument document = ManifestParser.Parse(item.Document)[0];
                    document.Spec["publish"] = false;
                    text = Normalize(document);
                }
                documents.Add(text.EndsWith("\n", StringComparison.Ordinal) ? text : text + "\n");
            }
            return String.Join("---\n", documents);
        }

        private async Task<Deployment?> RunDeploymentAsync(RequestContext ctx, string tenantId, CancellationToken token)
        {
            if (ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.RunId)) return null;
            Run? run = await _Server.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
            return run == null ? null : await _Server.Database.Deployments.ReadAsync(tenantId, run.DeploymentId, token).ConfigureAwait(false);
        }

        private async Task<StudioDraft> OpenAsync(string tenantId, string draftId, int version, CancellationToken token)
        {
            StudioDraft draft = await ReadAsync(tenantId, draftId, token).ConfigureAwait(false);
            if (draft.Status != StudioDraftStatusEnum.Open) throw new ConflictException("DraftNotOpen", "Draft " + draft.Title + " is " + draft.Status + "; only an open draft changes.");
            if (draft.Version != version) throw Moved(draft);
            return draft;
        }

        private static ConflictException Moved(StudioDraft draft)
        {
            return new ConflictException("DraftVersionConflict", "Draft " + draft.Title + " is at version " + draft.Version + ", not the version you read; read it again and retry.");
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            ValidationException error = new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
            error.Code = code == "DraftStale" || code == "DraftInvalid" || code == "DraftEmpty" ? code : error.Code;
            return error;
        }

        private static string Normalize(ManifestDocument document)
        {
            Dictionary<string, object?> metadata = new Dictionary<string, object?> { ["name"] = document.Metadata.Name };
            if (document.Metadata.Description != null) metadata["description"] = document.Metadata.Description;
            Dictionary<string, object?> wrapped = new Dictionary<string, object?>
            {
                ["apiVersion"] = String.IsNullOrEmpty(document.ApiVersion) ? "garrison/v1" : document.ApiVersion, ["kind"] = document.Kind, ["metadata"] = metadata, ["spec"] = document.Spec
            };
            return ManifestParser.ToYaml(new[] { wrapped });
        }

        private static int Below(AgenticAppSpec spec, string member, HashSet<string> seen)
        {
            if (!seen.Add(member)) return 0;
            int deepest = 0;
            foreach (AppEdgeSpec edge in spec.Edges.Where(e => e.From == member)) deepest = Math.Max(deepest, 1 + Below(spec, edge.To, seen));
            seen.Remove(member);
            return deepest;
        }

        private async Task<StudioGraph> ApplyUnitOperationAsync(string tenantId, StudioDraft draft, StudioGraphOperationRequest request, CancellationToken token)
        {
            // AA7.10: unit operations rewrite the organization's draft item, starting from the live organization when the
            // draft does not hold it yet, or from a new one. The manifest dry run validates the result.
            if (String.IsNullOrWhiteSpace(request.Organization)) throw Invalid("organization", "Required", "organization is required for " + request.Operation + ".");
            string organizationName = request.Organization.Trim();
            StudioDraftItem? existing = draft.Items.FirstOrDefault(i => i.Kind == "Organization" && i.Name == organizationName);
            if (existing != null && existing.Operation == StudioDraftOperationEnum.Delete) throw Invalid("organization", "OrganizationDeleted", "The draft deletes organization " + organizationName + "; put it back first.");
            ManifestDocument document = existing != null
                ? ManifestParser.Parse(existing.Document)[0]
                : await LiveDocumentAsync(tenantId, "Organization", organizationName, token).ConfigureAwait(false)
                    ?? new ManifestDocument { ApiVersion = "garrison/v1", Kind = "Organization", Metadata = new ManifestMetadata { Name = organizationName } };
            OrganizationSpec spec = OrgSpec(document);
            spec.Units ??= new List<OrgUnitSpec>();
            string Need(string? value, string field)
            {
                if (String.IsNullOrWhiteSpace(value)) throw Invalid(field, "Required", field + " is required for " + request.Operation + ".");
                return value.Trim();
            }
            OrgUnitSpec Unit(string name, string field)
            {
                return FindUnit(spec.Units, name) ?? throw Invalid(field, "UnitNotFound", "Organization " + organizationName + " has no unit " + name + ".");
            }
            switch (request.Operation)
            {
                case StudioGraphOperationEnum.AddUnit:
                    string added = Need(request.Unit, "unit");
                    if (FindUnit(spec.Units, added) != null) throw Invalid("unit", "UnitNameTaken", "Organization " + organizationName + " already has a unit " + added + ".");
                    OrgUnitSpec unit = new OrgUnitSpec { Name = added };
                    if (!String.IsNullOrWhiteSpace(request.Agent)) unit.Lead = request.Agent.Trim();
                    if (!String.IsNullOrWhiteSpace(request.Role)) unit.LeadTitle = request.Role.Trim();
                    if (String.IsNullOrWhiteSpace(request.Parent))
                    {
                        if (spec.Units.Count > 0) throw Invalid("parent", "OneRoot", "Organization " + organizationName + " already has a root unit; name a parent.");
                        spec.Units.Add(unit);
                    }
                    else
                    {
                        OrgUnitSpec parent = Unit(request.Parent.Trim(), "parent");
                        parent.Units ??= new List<OrgUnitSpec>();
                        parent.Units.Add(unit);
                    }
                    break;
                case StudioGraphOperationEnum.RemoveUnit:
                    string removed = Need(request.Unit, "unit");
                    OrgUnitSpec target = Unit(removed, "unit");
                    if (target.Units != null && target.Units.Count > 0) throw Invalid("unit", "UnitHasChildren", "Unit " + removed + " has units below it; remove them first.");
                    RemoveUnit(spec.Units, removed);
                    foreach (OrgUnitSpec other in AllUnits(spec.Units)) other.Peers?.RemoveAll(p => String.Equals(p?.Trim(), removed, StringComparison.OrdinalIgnoreCase));
                    break;
                case StudioGraphOperationEnum.AddUnitMember:
                    OrgUnitSpec joined = Unit(Need(request.Unit, "unit"), "unit");
                    string member = Need(request.Agent, "agent");
                    joined.Members ??= new List<OrgUnitMemberSpec>();
                    if (!joined.Members.Any(m => m.Agent == member)) joined.Members.Add(new OrgUnitMemberSpec { Agent = member, Title = String.IsNullOrWhiteSpace(request.Role) ? null : request.Role.Trim() });
                    break;
                case StudioGraphOperationEnum.RemoveUnitMember:
                    OrgUnitSpec left = Unit(Need(request.Unit, "unit"), "unit");
                    string leaving = Need(request.Agent, "agent");
                    if ((left.Members?.RemoveAll(m => m.Agent == leaving) ?? 0) == 0) throw Invalid("agent", "NotAMember", leaving + " is not a member of unit " + left.Name + ".");
                    break;
                case StudioGraphOperationEnum.ConnectUnits:
                    OrgUnitSpec from = Unit(Need(request.From, "from"), "from");
                    OrgUnitSpec to = Unit(Need(request.To, "to"), "to");
                    if (from == to) throw Invalid("to", "PeerNotFound", "A unit has no peer line to itself.");
                    from.Peers ??= new List<string>();
                    if (!from.Peers.Contains(to.Name!) && !(to.Peers ?? new List<string>()).Contains(from.Name!)) from.Peers.Add(to.Name!);
                    break;
                case StudioGraphOperationEnum.DisconnectUnits:
                    OrgUnitSpec a = Unit(Need(request.From, "from"), "from");
                    OrgUnitSpec b = Unit(Need(request.To, "to"), "to");
                    int dropped = (a.Peers?.RemoveAll(p => p == b.Name) ?? 0) + (b.Peers?.RemoveAll(p => p == a.Name) ?? 0);
                    if (dropped == 0) throw Invalid("to", "NoSuchPeerLine", "Units " + a.Name + " and " + b.Name + " have no peer line.");
                    break;
            }
            WriteOrgSpec(document, spec);
            string text = Normalize(document);
            StudioDraftItem item = new StudioDraftItem { Kind = "Organization", Name = organizationName, Document = text, Operation = StudioDraftOperationEnum.Upsert };
            item.BaseHash = existing != null ? existing.BaseHash : await LiveHashAsync(tenantId, "Organization", organizationName, token).ConfigureAwait(false);
            if (!await _Server.Database.StudioDrafts.PutItemAsync(tenantId, draft.Id, request.Version, item, token).ConfigureAwait(false)) throw Moved(await _Server.Database.StudioDrafts.ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false) ?? draft);
            return Graph(await ReadAsync(tenantId, draft.Id, token).ConfigureAwait(false));
        }

        private static OrganizationSpec OrgSpec(string documentText)
        {
            List<ManifestDocument> documents = ManifestParser.Parse(documentText);
            return documents.Count == 0 ? new OrganizationSpec() : OrgSpec(documents[0]);
        }

        private static OrganizationSpec OrgSpec(ManifestDocument document)
        {
            return Serializer.Deserialize<OrganizationSpec>(TemplateValues.ToJson(document.Spec)) ?? new OrganizationSpec();
        }

        private static OrgUnitSpec? FindUnit(List<OrgUnitSpec>? units, string name)
        {
            return AllUnits(units).FirstOrDefault(u => String.Equals(u.Name?.Trim(), name, StringComparison.OrdinalIgnoreCase));
        }

        private static List<OrgUnitSpec> AllUnits(List<OrgUnitSpec>? units)
        {
            List<OrgUnitSpec> all = new List<OrgUnitSpec>();
            foreach (OrgUnitSpec unit in units ?? new List<OrgUnitSpec>())
            {
                all.Add(unit);
                all.AddRange(AllUnits(unit.Units));
            }
            return all;
        }

        private static bool RemoveUnit(List<OrgUnitSpec>? units, string name)
        {
            if (units == null) return false;
            if (units.RemoveAll(u => String.Equals(u.Name?.Trim(), name, StringComparison.OrdinalIgnoreCase)) > 0) return true;
            return units.Any(u => RemoveUnit(u.Units, name));
        }

        private static void WriteOrgSpec(ManifestDocument document, OrganizationSpec spec)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (KeyValuePair<string, object?> pair in document.Spec)
            {
                if (String.Equals(pair.Key, "units", StringComparison.OrdinalIgnoreCase)) continue;
                tree[pair.Key] = pair.Value;
            }
            if (spec.Units != null && spec.Units.Count > 0) tree["units"] = spec.Units.Select(u => (object?)UnitTree(u)).ToList();
            document.Spec = tree;
        }

        private static Dictionary<string, object?> UnitTree(OrgUnitSpec unit)
        {
            Dictionary<string, object?> row = new Dictionary<string, object?> { ["name"] = unit.Name };
            if (!String.IsNullOrEmpty(unit.Description)) row["description"] = unit.Description;
            if (!String.IsNullOrEmpty(unit.Lead)) row["lead"] = unit.Lead;
            if (!String.IsNullOrEmpty(unit.LeadTitle)) row["leadTitle"] = unit.LeadTitle;
            if (!String.IsNullOrEmpty(unit.LeadMandate)) row["leadMandate"] = unit.LeadMandate;
            if (!String.IsNullOrEmpty(unit.App)) row["app"] = unit.App;
            if (unit.Members != null && unit.Members.Count > 0)
            {
                row["members"] = unit.Members.Select(m =>
                {
                    Dictionary<string, object?> entry = new Dictionary<string, object?> { ["agent"] = m.Agent };
                    if (!String.IsNullOrEmpty(m.Title)) entry["title"] = m.Title;
                    if (!String.IsNullOrEmpty(m.Mandate)) entry["mandate"] = m.Mandate;
                    return (object?)entry;
                }).ToList();
            }
            if (unit.Peers != null && unit.Peers.Count > 0) row["peers"] = unit.Peers.Select(p => (object?)p).ToList();
            if (unit.Budgets != null && unit.Budgets.Count > 0)
            {
                row["budgets"] = unit.Budgets.Select(b => (object?)new Dictionary<string, object?> { ["period"] = String.IsNullOrEmpty(b.Period) ? "Day" : b.Period, ["amountUsd"] = b.AmountUsd }).ToList();
            }
            if (unit.Units != null && unit.Units.Count > 0) row["units"] = unit.Units.Select(c => (object?)UnitTree(c)).ToList();
            return row;
        }

        private static AgenticAppSpec AppSpec(string documentText)
        {
            List<ManifestDocument> documents = ManifestParser.Parse(documentText);
            return documents.Count == 0 ? new AgenticAppSpec() : AppSpec(documents[0]);
        }

        private static AgenticAppSpec AppSpec(ManifestDocument document)
        {
            return Serializer.Deserialize<AgenticAppSpec>(TemplateValues.ToJson(document.Spec)) ?? new AgenticAppSpec();
        }

        private static void WriteAppSpec(ManifestDocument document, AgenticAppSpec spec)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (KeyValuePair<string, object?> pair in document.Spec)
            {
                if (String.Equals(pair.Key, "entry", StringComparison.OrdinalIgnoreCase) || String.Equals(pair.Key, "members", StringComparison.OrdinalIgnoreCase) || String.Equals(pair.Key, "edges", StringComparison.OrdinalIgnoreCase)) continue;
                tree[pair.Key] = pair.Value;
            }
            if (!String.IsNullOrEmpty(spec.Entry)) tree["entry"] = spec.Entry;
            List<object?> members = new List<object?>();
            foreach (AppMemberSpec member in spec.Members)
            {
                Dictionary<string, object?> row = new Dictionary<string, object?> { ["agent"] = member.Agent };
                if (!String.IsNullOrEmpty(member.Role)) row["role"] = member.Role;
                members.Add(row);
            }
            tree["members"] = members;
            List<object?> edges = new List<object?>();
            foreach (AppEdgeSpec edge in spec.Edges)
            {
                Dictionary<string, object?> row = new Dictionary<string, object?> { ["from"] = edge.From, ["to"] = edge.To };
                if (edge.FanOut.HasValue) row["fanOut"] = edge.FanOut.Value;
                edges.Add(row);
            }
            if (edges.Count > 0) tree["edges"] = edges;
            document.Spec = tree;
        }

        private async Task<ManifestDocument?> LiveDocumentAsync(string tenantId, string kind, string name, CancellationToken token)
        {
            ManifestExportOptions options = new ManifestExportOptions();
            options.Resources.Add(new ManifestResourceReference { Kind = kind, Name = name });
            try
            {
                ManifestExportResult export = await _Server.Get<ManifestService>().ExportAsync(tenantId, options, token).ConfigureAwait(false);
                return ManifestParser.Parse(export.Yaml).FirstOrDefault(d => d.Kind == kind && d.Metadata.Name == name);
            }
            catch (NotFoundException)
            {
                return null;
            }
        }

        private static string Hash(string text)
        {
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();
        }

        private async Task<string?> LiveHashAsync(string tenantId, string kind, string name, CancellationToken token)
        {
            ManifestDocument? document = await LiveDocumentAsync(tenantId, kind, name, token).ConfigureAwait(false);
            return document == null ? null : Hash(Normalize(document));
        }

        private static IEnumerable<StudioDraftItem> OrderForApply(List<StudioDraftItem> items)
        {
            List<string> order = ManifestService.Kinds.ToList();
            return items.OrderBy(i => order.IndexOf(i.Kind)).ThenBy(i => i.Name, StringComparer.Ordinal);
        }

        private static string Bundle(List<StudioDraftItem> items)
        {
            return String.Join("---\n", OrderForApply(items).Select(i => i.Document.EndsWith("\n", StringComparison.Ordinal) ? i.Document : i.Document + "\n"));
        }

        private static string Summarize(StudioDraftDiff diff)
        {
            int create = diff.Items.Count(i => i.Change == "Create");
            int update = diff.Items.Count(i => i.Change == "Update");
            int delete = diff.Items.Count(i => i.Change == "Delete");
            return create + " to create, " + update + " to update, " + delete + " to delete";
        }

        private async Task PublishAgentAsync(RequestContext ctx, string tenantId, string name, string changeNote, CancellationToken token)
        {
            Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
            if (agent == null || agent.IsProtected) return;
            AgentRevision? latest = String.IsNullOrEmpty(agent.LatestPublishedRevisionId) ? null : await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
            AgentRevision content = AgentRevisionContent.FromAgent(agent);
            if (latest != null)
            {
                content.AssetPins = latest.AssetPins;
                content.Capabilities = latest.Capabilities;
                content.PromptPins = latest.PromptPins;
                if (String.Equals(latest.ContentHash, AgentRevisionContent.ComputeHash(content), StringComparison.Ordinal)) return;
            }
            content.ChangeNote = changeNote.Length > 2000 ? changeNote.Substring(0, 2000) : changeNote;
            content.AuthorUserId = ctx.UserId;
            content.AuthorName = ctx.PrincipalName;
            AgentRevision saved = await _Server.Database.AgentRevisions.SaveDraftAsync(content, token).ConfigureAwait(false);
            await _Server.Database.AgentRevisions.PublishAsync(tenantId, saved.Id, ctx.UserId, ctx.PrincipalName, token).ConfigureAwait(false);
        }

        private async Task RepinDevAsync(RequestContext ctx, string tenantId, string name, CancellationToken token)
        {
            // AD9.4: applying a draft deploys to dev. Dev deployments pinned to an older revision move to the latest published
            // one; other environments change only through promotion.
            Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
            if (agent == null || String.IsNullOrEmpty(agent.LatestPublishedRevisionId)) return;
            AgentRevision? published = await _Server.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId, token).ConfigureAwait(false);
            if (published == null) return;
            Garrison.Server.Runtime.EvalGateService? gates = _Server.TryGet<Garrison.Server.Runtime.EvalGateService>();
            foreach (Deployment deployment in await _Server.Database.Deployments.ListByAgentAsync(tenantId, agent.Id, token).ConfigureAwait(false))
            {
                if (deployment.Environment != "dev" || String.IsNullOrEmpty(deployment.AgentRevisionId) || deployment.AgentRevisionId == published.Id) continue;
                if (gates != null)
                {
                    // AA9.6: a gated dev environment keeps its pin until the new revision passes the gate.
                    Deployment repinned = new Deployment { Id = deployment.Id, Name = deployment.Name, Environment = deployment.Environment, AgentRevisionId = published.Id };
                    try
                    {
                        await gates.RequirePinAsync(tenantId, repinned, deployment, token).ConfigureAwait(false);
                    }
                    catch (EvalGateFailedException e)
                    {
                        await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Deployment", deployment.Id, "Kept dev deployment " + deployment.Name + " on its pinned revision after the studio draft apply: " + e.Message, tenantId, token).ConfigureAwait(false);
                        continue;
                    }
                }
                deployment.AgentRevisionId = published.Id;
                deployment.ConfigVersion = deployment.ConfigVersion + 1;
                deployment.LastUpdateUtc = DateTime.UtcNow;
                await _Server.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Deployment", deployment.Id, "Repinned dev deployment " + deployment.Name + " to revision " + published.Number + " of agent " + agent.Name + " (studio draft apply).", tenantId, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteLiveAsync(RequestContext ctx, string tenantId, StudioDraftItem item, CancellationToken token)
        {
            switch (item.Kind)
            {
                case "AgenticApp":
                    AgenticApp? app = await _Server.Database.Apps.ReadByNameAsync(tenantId, item.Name, token).ConfigureAwait(false);
                    if (app != null) await _Server.Get<AgenticAppService>().DeleteAsync(ctx, tenantId, app, token).ConfigureAwait(false);
                    break;
                case "Agent":
                    Agent? agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, item.Name, token).ConfigureAwait(false);
                    if (agent != null) await new TenantConfigurationService(_Server).DeleteAgentAsync(ctx, tenantId, agent, token).ConfigureAwait(false);
                    break;
                case "Deployment":
                    Deployment? deployment = (await _Server.Database.Deployments.EnumerateAsync(tenantId, new EnumerationQuery { Search = item.Name, MaxResults = 1000 }, token).ConfigureAwait(false)).Objects.FirstOrDefault(d => d.Name == item.Name);
                    if (deployment != null) await new TenantConfigurationService(_Server).DeleteDeploymentAsync(ctx, tenantId, deployment, token).ConfigureAwait(false);
                    break;
                case "Pipeline":
                    Pipeline? pipeline = await _Server.Database.Pipelines.ReadByNameAsync(tenantId, item.Name, token).ConfigureAwait(false);
                    if (pipeline != null) await _Server.Database.Pipelines.DeleteAsync(tenantId, pipeline.Id, token).ConfigureAwait(false);
                    break;
                case "Organization":
                    Organization? organization = await _Server.Database.Organizations.ReadByNameAsync(tenantId, item.Name, token).ConfigureAwait(false);
                    if (organization != null) await _Server.Get<Garrison.Server.Runtime.OrganizationService>().DeleteAsync(ctx, organization, token).ConfigureAwait(false);
                    break;
            }
        }

        #endregion
    }
}
