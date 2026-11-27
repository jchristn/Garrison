namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// The board of an organization (AA10): one aggregate read of everything its people need (chart and unit health, open
    /// escalations, pending proposals, spend, briefs, unhealthy reports, freezes, the kill switch), direction to the top
    /// agent as a published revision of its mandate, and conversations with the top agent. Callers authorize on the
    /// organization; every read filters by the organization's tenant. Thread-safe.
    /// </summary>
    public class BoardService
    {
        #region Public-Members

        /// <summary>
        /// Default number of escalations, proposals, and unhealthy reports on the board: 20.
        /// </summary>
        public int DefaultLimit
        {
            get
            {
                return _DefaultLimit;
            }
            set
            {
                _DefaultLimit = Math.Clamp(value, 1, MaxLimit);
            }
        }

        /// <summary>
        /// Most escalations, proposals, and unhealthy reports a caller may ask for: 100.
        /// </summary>
        public static int MaxLimit
        {
            get
            {
                return 100;
            }
        }

        /// <summary>
        /// Days of Degraded and Unhealthy reports the board shows. Minimum 1, maximum 90, default 7.
        /// </summary>
        public int UnhealthyReportDays
        {
            get
            {
                return _UnhealthyReportDays;
            }
            set
            {
                _UnhealthyReportDays = Math.Clamp(value, 1, 90);
            }
        }

        /// <summary>
        /// Most open escalations read to count and list a board's escalations. Minimum 50, maximum 5000, default 1000.
        /// </summary>
        public int EscalationScanLimit
        {
            get
            {
                return _EscalationScanLimit;
            }
            set
            {
                _EscalationScanLimit = Math.Clamp(value, 50, 5000);
            }
        }

        /// <summary>
        /// Longest direction, in characters: 4000.
        /// </summary>
        public static int MaxDirectionLength
        {
            get
            {
                return 4000;
            }
        }

        /// <summary>
        /// Longest change note of a direction, in characters: 1024 (the mandate revision change note limit).
        /// </summary>
        public static int MaxChangeNoteLength
        {
            get
            {
                return 1024;
            }
        }

        /// <summary>
        /// Longest message to the top agent, in characters: 32000.
        /// </summary>
        public static int MaxMessageLength
        {
            get
            {
                return 32000;
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private int _DefaultLimit = 20;
        private int _UnhealthyReportDays = 7;
        private int _EscalationScanLimit = 1000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context with the organization, mandate, report, freeze, proposal, conversation, and invoker services registered.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public BoardService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the board of an organization.
        /// </summary>
        /// <param name="organization">Organization, already loaded from the caller's tenant.</param>
        /// <param name="limit">Most escalations, proposals, and unhealthy reports, clamped to 1 to 100, or null for the default.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The board. Before the first publish the chart has no units, the CEO is null, and the lists are empty.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<Board> GetAsync(Organization organization, int? limit, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            int max = limit.HasValue ? Math.Clamp(limit.Value, 1, MaxLimit) : _DefaultLimit;
            string tenantId = organization.TenantId;
            DateTime now = DateTime.UtcNow;
            OrganizationService organizations = _Server.Get<OrganizationService>();
            ChainOfCommand chain = _Server.Get<ChainOfCommand>();

            Board board = new Board();
            board.OrganizationId = organization.Id;
            board.Name = organization.Name;
            board.Mission = organization.Mission;
            board.Status = organization.Status;
            board.GeneratedUtc = now;
            // The board shows the live revision only: before the first publish the chart is empty and there is no CEO.
            OrgTree? live = await chain.TreeAsync(organization, token).ConfigureAwait(false);
            OrgTree tree = live ?? new OrgTree(organization, new List<OrgUnit>(), null);
            if (live != null)
            {
                board.Chart = await organizations.ChartAsync(organization, token).ConfigureAwait(false);
            }
            else
            {
                board.Chart = new OrgChart { OrganizationId = organization.Id, Name = organization.Name, Mission = organization.Mission, Source = "Live" };
            }
            HashSet<string> agentIds = tree.AgentIds();
            HashSet<string> unitIds = new HashSet<string>(tree.Units.Select(u => u.Id), StringComparer.Ordinal);
            HashSet<string> mandateIds = MandatesOf(tree);

            board.Ceo = await CeoAsync(tenantId, tree, token).ConfigureAwait(false);

            // Open escalations from the organization's agents, newest first.
            List<Escalation> open = await OpenEscalationsAsync(tenantId, agentIds, token).ConfigureAwait(false);
            board.Escalations = open.Take(max).ToList();

            board.Proposals = await PendingProposalsAsync(organization, max, token).ConfigureAwait(false);
            board.Spend = await organizations.SpendAsync(organization, now, token).ConfigureAwait(false);

            List<string> authors = agentIds.ToList();
            if (authors.Count > 0)
            {
                ReportFilter briefs = new ReportFilter { TenantId = tenantId, AuthorAgentIds = authors, Kind = ReportKindEnum.Brief, MaxResults = 1 };
                board.LatestBrief = (await _Server.Database.Reports.EnumerateAsync(briefs, token).ConfigureAwait(false)).Objects.FirstOrDefault();
                List<Report> unhealthy = new List<Report>();
                foreach (ReportHealthEnum health in new[] { ReportHealthEnum.Degraded, ReportHealthEnum.Unhealthy })
                {
                    ReportFilter filter = new ReportFilter { TenantId = tenantId, AuthorAgentIds = authors, Health = health, FromUtc = now.AddDays(-_UnhealthyReportDays), MaxResults = 1000 };
                    unhealthy.AddRange((await _Server.Database.Reports.EnumerateAsync(filter, token).ConfigureAwait(false)).Objects);
                }

                // Needs attention shows each author once, at its newest unhealthy report, so a degraded keeper that files
                // the same report every tick does not fill the list (UT-10). Its earlier ones are counted.
                Dictionary<string, Report> newestByAuthor = new Dictionary<string, Report>(StringComparer.Ordinal);
                List<Report> newest = new List<Report>();
                Dictionary<string, int> earlier = new Dictionary<string, int>(StringComparer.Ordinal);
                foreach (Report report in unhealthy.OrderByDescending(r => r.CreatedUtc).ThenByDescending(r => r.Id, StringComparer.Ordinal))
                {
                    string key = String.IsNullOrEmpty(report.AuthorAgentId) ? report.Id : report.AuthorAgentId;
                    if (newestByAuthor.TryGetValue(key, out Report? first))
                    {
                        earlier[first.Id] = (earlier.TryGetValue(first.Id, out int count) ? count : 0) + 1;
                        continue;
                    }
                    newestByAuthor[key] = report;
                    newest.Add(report);
                }
                board.UnhealthyReports = newest.Take(max).ToList();
                board.UnhealthyEarlierCounts = board.UnhealthyReports.Where(r => earlier.ContainsKey(r.Id)).ToDictionary(r => r.Id, r => earlier[r.Id], StringComparer.Ordinal);
            }

            // Freezes over the organization, its units, agents, and mandates, and the kill switch.
            List<Freeze> active = await _Server.Database.Freezes.ListActiveAsync(tenantId, token).ConfigureAwait(false);
            board.Freezes = active.Where(f => Covers(f, organization.Id, unitIds, agentIds, mandateIds)).OrderByDescending(f => f.CreatedUtc).ToList();
            board.KillSwitch = await _Server.Get<FreezeService>().ReadKillSwitchAsync(tenantId, token).ConfigureAwait(false);

            bool organizationFrozen = organization.Status == OrganizationStatusEnum.Frozen
                || active.Any(f => f.TargetKind == FreezeTargetKindEnum.Organization && f.TargetId == organization.Id);
            HashSet<string> frozenUnits = new HashSet<string>(active.Where(f => f.TargetKind == FreezeTargetKindEnum.OrgUnit && unitIds.Contains(f.TargetId)).Select(f => f.TargetId), StringComparer.Ordinal);
            foreach (OrgChartUnit unit in board.Chart.Units)
            {
                BoardUnitHealth health = new BoardUnitHealth();
                health.UnitId = unit.Id;
                health.UnitName = unit.Name;
                List<string> unitAgents = new List<string>();
                if (unit.Lead != null) unitAgents.Add(unit.Lead.AgentId);
                unitAgents.AddRange(unit.Members.Select(m => m.AgentId));
                unitAgents = unitAgents.Where(a => !String.IsNullOrEmpty(a)).Distinct(StringComparer.Ordinal).ToList();
                if (unitAgents.Count > 0)
                {
                    ReportFilter latest = new ReportFilter { TenantId = tenantId, AuthorAgentIds = unitAgents, MaxResults = 1 };
                    Report? last = (await _Server.Database.Reports.EnumerateAsync(latest, token).ConfigureAwait(false)).Objects.FirstOrDefault();
                    if (last != null)
                    {
                        health.Health = last.Health;
                        health.LastReportId = last.Id;
                        health.LastReportUtc = last.CreatedUtc;
                    }
                }
                HashSet<string> members = new HashSet<string>(unitAgents, StringComparer.Ordinal);
                health.OpenEscalations = open.Count(e => !String.IsNullOrEmpty(e.AgentId) && members.Contains(e.AgentId));
                health.Frozen = organizationFrozen || frozenUnits.Contains(unit.Id) || (unitIds.Contains(unit.Id) && tree.Ancestors(unit.Id).Any(a => frozenUnits.Contains(a.Id)));
                health.OverBudget = board.Spend.Any(s => s.UnitId == unit.Id && s.AmountUsd.HasValue && s.SpentUsd >= s.AmountUsd.Value);
                board.UnitHealth.Add(health);
            }
            return board;
        }

        /// <summary>
        /// What the top agent's brief must agree with (AA10.3, AA12.7): the board as the board view shows it, plus the
        /// organization revisions published and the executives' proposals decided since a point in time. The board-brief
        /// template renders these into the tick that asks for a brief.
        /// </summary>
        /// <param name="organization">Organization, already loaded from the caller's tenant.</param>
        /// <param name="sinceUtc">Start of the period the brief covers (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The facts. Lists are bounded by <see cref="DefaultLimit"/>.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<BoardBriefFacts> BriefFactsAsync(Organization organization, DateTime sinceUtc, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            BoardBriefFacts facts = new BoardBriefFacts();
            facts.SinceUtc = sinceUtc;
            facts.Board = await GetAsync(organization, null, token).ConfigureAwait(false);

            List<OrgRevision> revisions = await _Server.Database.Organizations.ListRevisionsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            facts.Revisions = revisions
                .Where(r => r.PublishedUtc.HasValue && r.PublishedUtc.Value > sinceUtc)
                .OrderBy(r => r.PublishedUtc!.Value).ThenBy(r => r.Number)
                .TakeLast(_DefaultLimit)
                .ToList();

            OrgProposalService proposals = _Server.Get<OrgProposalService>();
            EnumerationQuery query = new EnumerationQuery { Skip = 0, MaxResults = MaxLimit };
            EnumerationResult<StudioDraft> drafts = await _Server.Database.StudioDrafts.EnumerateProposalsAsync(organization.TenantId, organization.Id, query, null, token).ConfigureAwait(false);
            List<OrgProposal> decided = new List<OrgProposal>();
            foreach (StudioDraft draft in drafts.Objects)
            {
                token.ThrowIfCancellationRequested();
                if (draft.LastUpdateUtc <= sinceUtc || draft.Status == StudioDraftStatusEnum.Open) continue;
                OrgProposal proposal = await proposals.SummaryAsync(draft, token).ConfigureAwait(false);
                bool settled = draft.Status == StudioDraftStatusEnum.Applied || draft.Status == StudioDraftStatusEnum.Discarded
                    || (proposal.ApprovalStatus.HasValue && proposal.ApprovalStatus.Value != ApprovalStatusEnum.Pending);
                if (!settled) continue;
                proposal.Diff = null;
                proposal.Evidence = null;
                decided.Add(proposal);
            }
            facts.Decided = decided.OrderBy(p => p.LastUpdateUtc).TakeLast(_DefaultLimit).ToList();
            return facts;
        }

        /// <summary>
        /// Give direction to the organization's top agent (AA10.5): copy the current published revision of the root lead's
        /// mandate into a new revision with this direction, source Board, the person as author, and publish it. Allowed
        /// while the organization is frozen. Audited as BoardDirectionGiven.
        /// </summary>
        /// <param name="ctx">The person (Update on Organization).</param>
        /// <param name="organization">Organization, already loaded from the caller's tenant.</param>
        /// <param name="request">Direction and change note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the direction is missing or too long, or the change note is too long.</exception>
        /// <exception cref="ConflictException">Thrown with BoardCeoMissing when the root unit has no lead or the lead has no mandate with a published revision in the live revision, or RevisionUnchanged when the direction is already the current one (nothing is published).</exception>
        public async Task<MandateRevision> DirectAsync(RequestContext ctx, Organization organization, BoardDirectionRequest? request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            string direction = request?.Direction ?? String.Empty;
            if (String.IsNullOrWhiteSpace(direction))
            {
                errors["direction"] = "direction is required.";
                codes["direction"] = "Required";
            }
            else if (direction.Length > MaxDirectionLength)
            {
                errors["direction"] = "direction is limited to " + MaxDirectionLength + " characters.";
                codes["direction"] = "TooLong";
            }
            if (request?.ChangeNote != null && request.ChangeNote.Length > MaxChangeNoteLength)
            {
                errors["changeNote"] = "changeNote is limited to " + MaxChangeNoteLength + " characters.";
                codes["changeNote"] = "TooLong";
            }
            if (errors.Count > 0) throw new ValidationException("The direction is invalid.", errors, codes);

            Mandate mandate = await CeoMandateAsync(organization, token).ConfigureAwait(false);
            MandateRevision current = await _Server.Database.MandateRevisions.ReadAsync(organization.TenantId, mandate.CurrentRevisionId!, token).ConfigureAwait(false)
                ?? throw new ConflictException("BoardCeoMissing", "The current revision of mandate " + mandate.Name + " was not found.");
            MandateRevision next = Copy(current);
            next.Direction = direction.Trim();
            next.ChangeNote = String.IsNullOrWhiteSpace(request!.ChangeNote) ? "Board direction" : request.ChangeNote.Trim();
            if (MandateValidator.SameContent(current, next))
            {
                throw new ConflictException("RevisionUnchanged", "Mandate " + mandate.Name + " already has this direction in its current revision " + current.Number + ". Nothing was published and the keeper was not woken.");
            }

            MandateService mandates = _Server.Get<MandateService>();
            MandateRevision draft = await mandates.CreateRevisionAsync(ctx, mandate, next, MandateRevisionSourceEnum.Board, token).ConfigureAwait(false);
            await mandates.PublishRevisionAsync(ctx, mandate, draft, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.BoardDirectionGiven, "Mandate", mandate.Id,
                "Board direction for organization " + organization.Name + " published as revision " + draft.Number + " of mandate " + mandate.Name + " by " + (ctx.PrincipalName ?? ctx.PrincipalId ?? "unknown") + ".", organization.TenantId, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.BoardDirections, "organization", organization.Name);
            return draft;
        }

        /// <summary>
        /// Send the board's message to the top agent (AA10.6): a run on the CEO mandate's deployment as the caller, in a new
        /// board conversation or the one named, whose turns carry the builtin/board-conversation fragment.
        /// </summary>
        /// <param name="ctx">The person (Update on Organization).</param>
        /// <param name="organization">Organization, already loaded from the caller's tenant.</param>
        /// <param name="request">Input and conversation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the input is missing or too long.</exception>
        /// <exception cref="NotFoundException">Thrown when the conversation is not a board conversation of this organization.</exception>
        /// <exception cref="ConflictException">Thrown with BoardCeoMissing, BoardCeoUnavailable, or a conversation code such as ConversationBusy.</exception>
        public async Task<Run> SendMessageAsync(RequestContext ctx, Organization organization, BoardMessageRequest? request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            string input = request?.Input ?? String.Empty;
            if (String.IsNullOrWhiteSpace(input))
            {
                throw new ValidationException("The message is invalid.", new Dictionary<string, string> { ["input"] = "input is required." }, new Dictionary<string, string> { ["input"] = "InputRequired" });
            }
            if (input.Length > MaxMessageLength)
            {
                throw new ValidationException("The message is invalid.", new Dictionary<string, string> { ["input"] = "input is limited to " + MaxMessageLength + " characters." }, new Dictionary<string, string> { ["input"] = "TooLong" });
            }

            string? conversationId = String.IsNullOrWhiteSpace(request!.ConversationId) ? null : request.ConversationId.Trim();
            if (conversationId != null)
            {
                Conversation? conversation = await _Server.Database.Conversations.ReadAsync(organization.TenantId, conversationId, token).ConfigureAwait(false);
                if (conversation == null || conversation.OrganizationId != organization.Id) throw new NotFoundException("Conversation " + conversationId + " not found.");
            }

            Mandate mandate = await CeoMandateAsync(organization, token).ConfigureAwait(false);
            Deployment? deployment = String.IsNullOrEmpty(mandate.DeploymentId) ? null : await _Server.Database.Deployments.ReadAsync(organization.TenantId, mandate.DeploymentId, token).ConfigureAwait(false);
            if (deployment == null || deployment.AgentId != mandate.AgentId)
            {
                throw new ConflictException("BoardCeoUnavailable", "Mandate " + mandate.Name + " of the organization's top agent has no deployment to talk to.");
            }
            AgentInvoker invoker = _Server.Get<AgentInvoker>();
            Agent agent = await invoker.ResolveAgentAsync(organization.TenantId, mandate.AgentId, token).ConfigureAwait(false);

            InvocationOptions options = new InvocationOptions();
            options.Input = input;
            options.InputContentType = "text/plain";
            options.Kind = RunKindEnum.Invoke;
            options.OrganizationId = organization.Id;
            if (conversationId != null)
            {
                options.ConversationId = conversationId;
            }
            else
            {
                options.DeploymentId = deployment.Id;
                options.StartConversation = true;
            }
            options.Surface = "rest";
            return await invoker.InvokeAsync(ctx, organization.TenantId, agent, options, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Enumerate the conversations the board of an organization started with its top agent, newest first.
        /// </summary>
        /// <param name="organization">Organization, already loaded from the caller's tenant.</param>
        /// <param name="query">Paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization or query is null.</exception>
        public async Task<EnumerationResult<Conversation>> ListConversationsAsync(Organization organization, EnumerationQuery query, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (query == null) throw new ArgumentNullException(nameof(query));
            ConversationFilter filter = new ConversationFilter();
            filter.TenantId = organization.TenantId;
            filter.OrganizationId = organization.Id;
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = EnumerationOrderEnum.CreatedDescending;
            EnumerationResult<Conversation> page = await _Server.Database.Conversations.EnumerateAsync(filter, token).ConfigureAwait(false);
            ConversationService conversations = _Server.Get<ConversationService>();
            foreach (Conversation conversation in page.Objects) await conversations.AnnotateAsync(conversation, token).ConfigureAwait(false);
            return page;
        }

        /// <summary>
        /// The mandate of the organization's top agent: the root unit's lead mandate in the live revision.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate, with a published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        /// <exception cref="ConflictException">Thrown with BoardCeoMissing when there is no live root lead, it has no mandate, or the mandate has no published revision.</exception>
        public async Task<Mandate> CeoMandateAsync(Organization organization, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            OrgTree? live = await _Server.Get<ChainOfCommand>().TreeAsync(organization, token).ConfigureAwait(false);
            OrgUnit? root = live?.Root;
            if (root == null || String.IsNullOrEmpty(root.LeadAgentId))
            {
                throw new ConflictException("BoardCeoMissing", "Organization " + organization.Name + " has no live root unit with a lead.");
            }
            if (String.IsNullOrEmpty(root.LeadMandateId))
            {
                throw new ConflictException("BoardCeoMissing", "The lead of the root unit of organization " + organization.Name + " has no mandate in the live revision.");
            }
            Mandate? mandate = await _Server.Database.Mandates.ReadAsync(organization.TenantId, root.LeadMandateId, token).ConfigureAwait(false);
            if (mandate == null || mandate.AgentId != root.LeadAgentId)
            {
                throw new ConflictException("BoardCeoMissing", "The mandate of the root unit's lead of organization " + organization.Name + " was not found.");
            }
            if (String.IsNullOrEmpty(mandate.CurrentRevisionId))
            {
                throw new ConflictException("BoardCeoMissing", "Mandate " + mandate.Name + " of the organization's top agent has no published revision.");
            }
            return mandate;
        }

        #endregion

        #region Private-Methods

        private async Task<BoardCeo?> CeoAsync(string tenantId, OrgTree tree, CancellationToken token)
        {
            OrgUnit? root = tree.Root;
            if (root == null || String.IsNullOrEmpty(root.LeadAgentId)) return null;
            BoardCeo ceo = new BoardCeo();
            ceo.AgentId = root.LeadAgentId;
            ceo.AgentName = (await _Server.Database.Agents.ReadAsync(tenantId, root.LeadAgentId, token).ConfigureAwait(false))?.Name;
            ceo.UnitId = root.Id;
            ceo.UnitName = root.Name;
            if (!String.IsNullOrEmpty(root.LeadMandateId))
            {
                Mandate? mandate = await _Server.Database.Mandates.ReadAsync(tenantId, root.LeadMandateId, token).ConfigureAwait(false);
                if (mandate != null && mandate.AgentId == root.LeadAgentId)
                {
                    ceo.MandateId = mandate.Id;
                    ceo.MandateName = mandate.Name;
                    ceo.DeploymentId = String.IsNullOrEmpty(mandate.DeploymentId) ? null : mandate.DeploymentId;
                    if (!String.IsNullOrEmpty(mandate.CurrentRevisionId))
                    {
                        MandateRevision? revision = await _Server.Database.MandateRevisions.ReadAsync(tenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
                        ceo.BriefIntervalHours = revision?.BriefIntervalHours;
                    }
                }
            }
            Report? brief = await _Server.Get<ReportService>().LastBriefAsync(tenantId, root.LeadAgentId, token).ConfigureAwait(false);
            ceo.LastBriefUtc = brief?.CreatedUtc;
            return ceo;
        }

        private async Task<List<Escalation>> OpenEscalationsAsync(string tenantId, HashSet<string> agentIds, CancellationToken token)
        {
            if (agentIds.Count == 0) return new List<Escalation>();
            EscalationFilter filter = new EscalationFilter { TenantId = tenantId, Status = EscalationStatusEnum.Open, MaxResults = _EscalationScanLimit };
            EnumerationResult<Escalation> page = await _Server.Database.Escalations.EnumerateAsync(filter, token).ConfigureAwait(false);
            return page.Objects
                .Where(e => !String.IsNullOrEmpty(e.AgentId) && agentIds.Contains(e.AgentId))
                .OrderByDescending(e => e.CreatedUtc).ThenByDescending(e => e.Id, StringComparer.Ordinal)
                .ToList();
        }

        private async Task<List<OrgProposal>> PendingProposalsAsync(Organization organization, int max, CancellationToken token)
        {
            OrgProposalService proposals = _Server.Get<OrgProposalService>();
            List<OrgProposal> pending = new List<OrgProposal>();
            EnumerationQuery query = new EnumerationQuery { Skip = 0, MaxResults = Math.Max(max, 1) };
            EnumerationResult<StudioDraft> drafts = await _Server.Database.StudioDrafts.EnumerateProposalsAsync(organization.TenantId, organization.Id, query, StudioDraftStatusEnum.PendingApproval, token).ConfigureAwait(false);
            foreach (StudioDraft draft in drafts.Objects)
            {
                OrgProposal proposal = await proposals.SummaryAsync(draft, token).ConfigureAwait(false);
                if (proposal.ApprovalStatus != ApprovalStatusEnum.Pending) continue;
                pending.Add(proposal);
            }
            return pending.OrderByDescending(p => p.LastUpdateUtc).Take(max).ToList();
        }

        private static HashSet<string> MandatesOf(OrgTree tree)
        {
            HashSet<string> mandates = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in tree.Units)
            {
                if (!String.IsNullOrEmpty(unit.LeadMandateId)) mandates.Add(unit.LeadMandateId);
                foreach (OrgUnitMember member in unit.Members)
                {
                    if (!String.IsNullOrEmpty(member.MandateId)) mandates.Add(member.MandateId);
                }
            }
            return mandates;
        }

        private static bool Covers(Freeze freeze, string organizationId, HashSet<string> unitIds, HashSet<string> agentIds, HashSet<string> mandateIds)
        {
            switch (freeze.TargetKind)
            {
                case FreezeTargetKindEnum.TenantAutonomy:
                    return true;
                case FreezeTargetKindEnum.Organization:
                    return freeze.TargetId == organizationId;
                case FreezeTargetKindEnum.OrgUnit:
                    return unitIds.Contains(freeze.TargetId);
                case FreezeTargetKindEnum.Agent:
                    return agentIds.Contains(freeze.TargetId);
                case FreezeTargetKindEnum.Mandate:
                    return mandateIds.Contains(freeze.TargetId);
                default:
                    return false;
            }
        }

        private static MandateRevision Copy(MandateRevision current)
        {
            MandateRevision next = new MandateRevision();
            next.Objective = current.Objective;
            next.HealthyDefinition = current.HealthyDefinition;
            next.Autonomy = current.Autonomy;
            next.EscalationPolicy = current.EscalationPolicy;
            next.Direction = current.Direction;
            next.EscalationTargetKind = current.EscalationTargetKind;
            next.EscalationTargetId = current.EscalationTargetId;
            next.Signals = current.Signals.Select(s => new MandateRevisionSignal { Name = s.Name, Description = s.Description }).ToList();
            next.WakeMode = current.WakeMode;
            next.MinIntervalSeconds = current.MinIntervalSeconds;
            next.MaxIntervalSeconds = current.MaxIntervalSeconds;
            next.BackoffFactor = current.BackoffFactor;
            next.JitterPercent = current.JitterPercent;
            next.BudgetPerTickUsd = current.BudgetPerTickUsd;
            next.BudgetPerDayUsd = current.BudgetPerDayUsd;
            next.MaxTokensPerTick = current.MaxTokensPerTick;
            next.BriefIntervalHours = current.BriefIntervalHours;
            return next;
        }

        #endregion
    }
}
