namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Services;

    /// <summary>
    /// Executives' proposals seen from their organization (AA8.9): the drafts OrgSubtree runs wrote, with their approvals,
    /// and a person's decision on one that waits. Thread-safe.
    /// </summary>
    public class OrgProposalService
    {
        #region Private-Members

        private readonly ServerContext _Server;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public OrgProposalService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Enumerate an organization's proposals, newest change first, without diffs.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="query">Paging.</param>
        /// <param name="status">Only proposals in this draft status, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<EnumerationResult<OrgProposal>> EnumerateAsync(Organization organization, EnumerationQuery query, StudioDraftStatusEnum? status, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (query == null) throw new ArgumentNullException(nameof(query));
            EnumerationResult<StudioDraft> drafts = await _Server.Database.StudioDrafts.EnumerateProposalsAsync(organization.TenantId, organization.Id, query, status, token).ConfigureAwait(false);
            List<OrgProposal> proposals = new List<OrgProposal>();
            foreach (StudioDraft draft in drafts.Objects) proposals.Add(await ProposalAsync(draft, token).ConfigureAwait(false));
            return EnumerationResult<OrgProposal>.Build(query, drafts.TotalRecords, proposals);
        }

        /// <summary>
        /// Read one proposal; one that is not applied carries its diff with refusals and rule matches.
        /// </summary>
        /// <param name="ctx">Caller, for the diff's dry run.</param>
        /// <param name="organization">Organization.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The proposal.</returns>
        /// <exception cref="NotFoundException">Thrown when the draft is not a proposal of this organization.</exception>
        public async Task<OrgProposal> ReadAsync(RequestContext ctx, Organization organization, string? draftId, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            StudioDraft draft = await DraftAsync(organization, draftId, token).ConfigureAwait(false);
            OrgProposal proposal = await ProposalAsync(draft, token).ConfigureAwait(false);
            if (draft.Status != StudioDraftStatusEnum.Applied) proposal.Diff = await _Server.Get<StudioService>().DiffAsync(ctx, organization.TenantId, draft, token).ConfigureAwait(false);
            return proposal;
        }

        /// <summary>
        /// A person's decision on a proposal waiting for approval: allowing applies it (and records an org revision),
        /// denying sends it back to the executive.
        /// </summary>
        /// <param name="ctx">Deciding person.</param>
        /// <param name="organization">Organization.</param>
        /// <param name="draftId">Draft identifier.</param>
        /// <param name="allow">Whether to apply.</param>
        /// <param name="reason">Why, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The proposal after the decision.</returns>
        /// <exception cref="NotFoundException">Thrown when the draft is not a proposal of this organization.</exception>
        /// <exception cref="ConflictException">Thrown with ProposalNotPending, or the studio's DraftStale or DraftInvalid.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 ApproverIsAgent or ApproverLacksPermission.</exception>
        public async Task<OrgProposal> DecideAsync(RequestContext ctx, Organization organization, string? draftId, bool allow, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            StudioDraft draft = await DraftAsync(organization, draftId, token).ConfigureAwait(false);
            Approval? approval = String.IsNullOrEmpty(draft.ApprovalId) ? null : await _Server.Database.Approvals.ReadAsync(organization.TenantId, draft.ApprovalId, token).ConfigureAwait(false);
            if (draft.Status != StudioDraftStatusEnum.PendingApproval || approval == null || approval.Status != ApprovalStatusEnum.Pending)
            {
                throw new ConflictException("ProposalNotPending", "Proposal " + draft.Title + " is " + draft.Status + " and is not waiting for a decision.");
            }
            await _Server.Get<StudioService>().DecideAsync(ctx, approval, allow, reason, token).ConfigureAwait(false);
            StudioDraft after = await _Server.Database.StudioDrafts.ReadAsync(organization.TenantId, draft.Id, token).ConfigureAwait(false) ?? draft;
            return await ProposalAsync(after, token).ConfigureAwait(false);
        }

        /// <summary>
        /// A proposal's summary (no diff) from its draft.
        /// </summary>
        /// <param name="draft">Executive draft.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The proposal.</returns>
        /// <exception cref="ArgumentNullException">Thrown when draft is null.</exception>
        public async Task<OrgProposal> SummaryAsync(StudioDraft draft, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            return await ProposalAsync(draft, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task<StudioDraft> DraftAsync(Organization organization, string? draftId, CancellationToken token)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            StudioDraft? draft = String.IsNullOrWhiteSpace(draftId) ? null : await _Server.Get<StudioService>().ReadAsync(organization.TenantId, draftId.Trim(), token).ConfigureAwait(false);
            if (draft == null || draft.OrganizationId != organization.Id || String.IsNullOrEmpty(draft.ExecutiveUnitId)) throw new NotFoundException("Proposal not found.");
            return draft;
        }

        private async Task<OrgProposal> ProposalAsync(StudioDraft draft, CancellationToken token)
        {
            OrgProposal proposal = new OrgProposal
            {
                DraftId = draft.Id, Title = draft.Title, Status = draft.Status, Version = draft.Version, OrganizationId = draft.OrganizationId ?? String.Empty,
                UnitId = draft.ExecutiveUnitId ?? String.Empty, AgentId = draft.ExecutiveAgentId ?? String.Empty, OriginRunId = draft.OriginRunId, OwnerName = draft.OwnerName,
                ApprovalId = draft.ApprovalId, CreatedUtc = draft.CreatedUtc, LastUpdateUtc = draft.LastUpdateUtc
            };
            OrgUnit? unit = String.IsNullOrEmpty(draft.ExecutiveUnitId) ? null : await _Server.Database.Organizations.ReadUnitAsync(draft.TenantId, draft.ExecutiveUnitId, token).ConfigureAwait(false);
            proposal.UnitName = unit?.Name;
            Agent? agent = String.IsNullOrEmpty(draft.ExecutiveAgentId) ? null : await _Server.Database.Agents.ReadAsync(draft.TenantId, draft.ExecutiveAgentId, token).ConfigureAwait(false);
            proposal.AgentName = agent?.Name;
            if (!String.IsNullOrEmpty(draft.ApprovalId))
            {
                Approval? approval = await _Server.Database.Approvals.ReadAsync(draft.TenantId, draft.ApprovalId, token).ConfigureAwait(false);
                if (approval != null)
                {
                    proposal.ApprovalStatus = approval.Status;
                    proposal.DecisionSource = approval.DecisionSource;
                    proposal.DecidedBy = approval.DecidedBy;
                    proposal.Reason = approval.Reason;
                    if (approval.DecisionSource == ApprovalSourceEnum.Rule && !String.IsNullOrEmpty(approval.RulePattern))
                    {
                        proposal.RuleIds = approval.RulePattern.Split(',').Select(r => r.Trim()).Where(r => r.Length > 0).ToList();
                    }
                }
            }
            return proposal;
        }

        #endregion
    }
}
