namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Eval sets and their cases (AA9.12, AA9.5): create, read, edit, approve, and delete sets; add, change, and remove
    /// cases. An approved version never changes: editing it, or its cases, creates the next version as a draft through
    /// <see cref="EvalSetVersioning"/> and returns that version. Only people approve (AA-024). A run token's set is
    /// authored as origin Evaluator with its agent and unit, and run tokens see hidden cases redacted. Every read filters
    /// by tenant; another tenant's set answers 404. Thread-safe.
    /// </summary>
    public class EvalSetService
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly EvaluationOptions _Options;
        private readonly EvalSetVersioning _Versioning;
        private readonly ChainOfCommand _Chain;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="options">Evaluation options (MaxCasesPerSet).</param>
        /// <param name="versioning">Eval set versioning.</param>
        /// <param name="chain">Chain of command, for a run author's unit.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvalSetService(ServerContext server, EvaluationOptions options, EvalSetVersioning versioning, ChainOfCommand chain)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Versioning = versioning ?? throw new ArgumentNullException(nameof(versioning));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List sets, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="state">State filter, or null.</param>
        /// <param name="origin">Origin filter, or null.</param>
        /// <param name="tag">Tag filter, or null.</param>
        /// <param name="latestOnly">Only the newest version of each name.</param>
        /// <param name="query">Paging and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of sets.</returns>
        public async Task<EnumerationResult<EvalSet>> EnumerateAsync(string tenantId, EvalSetStateEnum? state, EvalSetOriginEnum? origin, string? tag, bool latestOnly, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return await _Server.Database.EvalSets.EnumerateAsync(tenantId, state, origin, tag, latestOnly, query ?? new EnumerationQuery(), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a set version by identifier, or the newest version of a name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Set identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The set.</returns>
        /// <exception cref="NotFoundException">Thrown when no such set exists in the tenant.</exception>
        public async Task<EvalSet> ReadAsync(string tenantId, string? idOrName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(idOrName)) throw new NotFoundException("An eval set identifier or name is required.");
            string key = idOrName.Trim();
            EvalSet? set = await _Server.Database.EvalSets.ReadAsync(tenantId, key, token).ConfigureAwait(false)
                ?? await _Server.Database.EvalSets.ReadLatestAsync(tenantId, key, token).ConfigureAwait(false);
            return set ?? throw new NotFoundException("Eval set " + key + " not found.");
        }

        /// <summary>
        /// Create version 1 of a set, with its cases.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="body">Set and cases.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored set.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid, or with TooManyCases past Evaluation.MaxCasesPerSet.</exception>
        /// <exception cref="ConflictException">Thrown with EvalSetExists when the name is taken.</exception>
        public async Task<EvalSet> CreateAsync(RequestContext ctx, string tenantId, EvalSetRequest body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (body == null) throw new ArgumentNullException(nameof(body));
            string name = body.Name?.Trim() ?? String.Empty;
            if (name.Length < 1 || name.Length > 128) throw Invalid("name", "OutOfRange", "Give the set a name of 1 to 128 characters.");
            if (await _Server.Database.EvalSets.ReadLatestAsync(tenantId, name, token).ConfigureAwait(false) != null)
                throw new ConflictException("EvalSetExists", "Eval set " + name + " already exists. Edit it to make its next version.");
            List<EvalCase> cases = body.Cases ?? new List<EvalCase>();
            if (cases.Count > _Options.MaxCasesPerSet) throw Invalid("cases", "TooManyCases", "A set holds at most " + _Options.MaxCasesPerSet + " cases (Evaluation.MaxCasesPerSet).");

            EvalSet set = new EvalSet();
            set.TenantId = tenantId;
            set.Name = name;
            set.Version = 1;
            set.State = EvalSetStateEnum.Draft;
            Fill(set, body, true);
            await AuthorAsync(ctx, tenantId, set, body.Origin, token).ConfigureAwait(false);
            for (int i = 0; i < cases.Count; i++)
            {
                EvalCase item = Clean(cases[i], "cases[" + i + "].");
                item.TenantId = tenantId;
                item.Order = i;
                cases[i] = item;
            }
            EvalSet created = await _Server.Database.EvalSets.CreateWithCasesAsync(set, cases, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", created.Id, "Created eval set " + created.Name + " version 1 with " + cases.Count + " case(s).", tenantId, token).ConfigureAwait(false);
            return await ReadAsync(tenantId, created.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Edit a set's description, judge agent, and tags. An approved version is not changed: the edit lands on its next
        /// version (created as a draft when needed), which is returned.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Update).</param>
        /// <param name="set">Set being edited.</param>
        /// <param name="body">Changes.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The edited draft version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        public async Task<EvalSet> UpdateAsync(RequestContext ctx, EvalSet set, EvalSetRequest body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            if (body == null) throw new ArgumentNullException(nameof(body));
            EvalSet draft = await DraftOfAsync(ctx, set, token).ConfigureAwait(false);
            Fill(draft, body, false);
            EvalSet stored = await _Server.Database.EvalSets.UpdateAsync(draft, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", stored.Id, "Edited eval set " + stored.Name + " version " + stored.Version + ".", stored.TenantId, token).ConfigureAwait(false);
            return stored;
        }

        /// <summary>
        /// Approve a draft version (people only, AA-024). An approved version is immutable and may gate promotions.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Update).</param>
        /// <param name="set">Draft version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The approved set.</returns>
        /// <exception cref="AppAccessException">Thrown with 403 ApprovalIsPeopleOnly for a run token.</exception>
        /// <exception cref="ConflictException">Thrown with AlreadyApproved, or EvalSetEmpty for a set without cases.</exception>
        public async Task<EvalSet> ApproveAsync(RequestContext ctx, EvalSet set, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw new AppAccessException(403, "ApprovalIsPeopleOnly", "Only a person approves an eval set; an agent cannot approve the set that grades it.");
            if (set.State == EvalSetStateEnum.Approved) throw new ConflictException("AlreadyApproved", "Eval set " + set.Name + " version " + set.Version + " is already approved.");
            if (await _Server.Database.EvalCases.CountBySetAsync(set.TenantId, set.Id, token).ConfigureAwait(false) == 0)
                throw new ConflictException("EvalSetEmpty", "Eval set " + set.Name + " version " + set.Version + " has no cases to approve.");
            if (!await _Server.Database.EvalSets.ApproveAsync(set.TenantId, set.Id, ctx.UserId ?? ctx.CredentialId, ctx.PrincipalName ?? ctx.PrincipalType.ToString(), DateTime.UtcNow, token).ConfigureAwait(false))
                throw new ConflictException("AlreadyApproved", "Eval set " + set.Name + " version " + set.Version + " was approved meanwhile.");
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", set.Id, "Approved eval set " + set.Name + " version " + set.Version + ".", set.TenantId, token).ConfigureAwait(false);
            return await ReadAsync(set.TenantId, set.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete a draft version. Approved versions are kept: they are the record that gated promotions.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Delete).</param>
        /// <param name="set">Set version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ConflictException">Thrown with EvalSetImmutable for an approved version.</exception>
        public async Task<bool> DeleteAsync(RequestContext ctx, EvalSet set, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            if (set.State == EvalSetStateEnum.Approved) throw new ConflictException("EvalSetImmutable", "Eval set " + set.Name + " version " + set.Version + " is approved and is kept; delete its draft versions only.");
            bool deleted = await _Server.Database.EvalSets.DeleteAsync(set.TenantId, set.Id, token).ConfigureAwait(false);
            if (deleted) await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", set.Id, "Deleted eval set " + set.Name + " version " + set.Version + ".", set.TenantId, token).ConfigureAwait(false);
            return deleted;
        }

        /// <summary>
        /// A set's cases in order. Run tokens see hidden cases redacted (AA-024).
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="set">Set version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cases.</returns>
        public async Task<List<EvalCase>> ListCasesAsync(RequestContext ctx, EvalSet set, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            List<EvalCase> cases = await _Server.Database.EvalCases.ListBySetAsync(set.TenantId, set.Id, token).ConfigureAwait(false);
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) foreach (EvalCase item in cases) EvalRedaction.Case(item);
            return cases;
        }

        /// <summary>
        /// Read one case of a set. Run tokens see a hidden case redacted (AA-024).
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="set">Set version.</param>
        /// <param name="caseId">Case identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The case.</returns>
        /// <exception cref="NotFoundException">Thrown when the case is not in the set.</exception>
        public async Task<EvalCase> ReadCaseAsync(RequestContext ctx, EvalSet set, string? caseId, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            EvalCase item = await CaseOfAsync(set, caseId, token).ConfigureAwait(false);
            return ctx.PrincipalType == PrincipalTypeEnum.Run ? EvalRedaction.Case(item) : item;
        }

        /// <summary>
        /// Add a case at the end of a set. On an approved version the case is added to its next version.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Update).</param>
        /// <param name="set">Set version.</param>
        /// <param name="body">Case.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored case; its SetId names the version it landed on.</returns>
        /// <exception cref="ValidationException">Thrown when a field is invalid, or with TooManyCases.</exception>
        public async Task<EvalCase> CreateCaseAsync(RequestContext ctx, EvalSet set, EvalCase body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            if (body == null) throw new ArgumentNullException(nameof(body));
            EvalCase item = Clean(body, String.Empty);
            EvalSet draft = await DraftOfAsync(ctx, set, token).ConfigureAwait(false);
            List<EvalCase> existing = await _Server.Database.EvalCases.ListBySetAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false);
            if (existing.Count + 1 > _Options.MaxCasesPerSet) throw Invalid("cases", "TooManyCases", "A set holds at most " + _Options.MaxCasesPerSet + " cases (Evaluation.MaxCasesPerSet).");
            item.TenantId = draft.TenantId;
            item.SetId = draft.Id;
            item.Order = existing.Count == 0 ? 0 : existing.Max(c => c.Order) + 1;
            EvalCase created = await _Server.Database.EvalCases.CreateAsync(item, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", draft.Id, "Added case " + created.Order + " to eval set " + draft.Name + " version " + draft.Version + ".", draft.TenantId, token).ConfigureAwait(false);
            return await CaseOfAsync(draft, created.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Replace a case's name, input, hidden flag, expected text, checks, and files. On an approved version the case at
        /// the same order in its next version is changed instead.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Update).</param>
        /// <param name="set">Set version.</param>
        /// <param name="caseId">Case identifier.</param>
        /// <param name="body">Replacement.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored case.</returns>
        /// <exception cref="NotFoundException">Thrown when the case is not in the set.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        public async Task<EvalCase> UpdateCaseAsync(RequestContext ctx, EvalSet set, string? caseId, EvalCase body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            if (body == null) throw new ArgumentNullException(nameof(body));
            EvalCase current = await CaseOfAsync(set, caseId, token).ConfigureAwait(false);
            EvalCase item = Clean(body, String.Empty);
            EvalSet draft = await DraftOfAsync(ctx, set, token).ConfigureAwait(false);
            EvalCase target = draft.Id == set.Id ? current : (await _Server.Database.EvalCases.ListBySetAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false)).FirstOrDefault(c => c.Order == current.Order)
                ?? throw new NotFoundException("Case " + current.Order + " is not in eval set " + draft.Name + " version " + draft.Version + ".");
            item.Id = target.Id;
            item.TenantId = draft.TenantId;
            item.SetId = draft.Id;
            item.Order = target.Order;
            item.CreatedUtc = target.CreatedUtc;
            await _Server.Database.EvalCases.UpdateAsync(item, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", draft.Id, "Changed case " + item.Order + " of eval set " + draft.Name + " version " + draft.Version + ".", draft.TenantId, token).ConfigureAwait(false);
            return await CaseOfAsync(draft, item.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Remove a case. On an approved version the case at the same order is removed from its next version.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalSet Update).</param>
        /// <param name="set">Set version.</param>
        /// <param name="caseId">Case identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft version the case was removed from.</returns>
        /// <exception cref="NotFoundException">Thrown when the case is not in the set.</exception>
        public async Task<EvalSet> DeleteCaseAsync(RequestContext ctx, EvalSet set, string? caseId, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (set == null) throw new ArgumentNullException(nameof(set));
            EvalCase current = await CaseOfAsync(set, caseId, token).ConfigureAwait(false);
            EvalSet draft = await DraftOfAsync(ctx, set, token).ConfigureAwait(false);
            EvalCase? target = draft.Id == set.Id ? current : (await _Server.Database.EvalCases.ListBySetAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false)).FirstOrDefault(c => c.Order == current.Order);
            if (target != null) await _Server.Database.EvalCases.DeleteAsync(draft.TenantId, target.Id, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalSet", draft.Id, "Removed case " + current.Order + " from eval set " + draft.Name + " version " + draft.Version + ".", draft.TenantId, token).ConfigureAwait(false);
            return await ReadAsync(draft.TenantId, draft.Id, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task<EvalSet> DraftOfAsync(RequestContext ctx, EvalSet set, CancellationToken token)
        {
            if (set.State == EvalSetStateEnum.Draft) return set;
            PrincipalTypeEnum type = ctx.PrincipalType;
            string? id = type == PrincipalTypeEnum.Run ? ctx.RunId : ctx.UserId ?? ctx.CredentialId;
            return await _Versioning.OpenDraftAsync(set.TenantId, set.Id, type, id, ctx.PrincipalName, token).ConfigureAwait(false);
        }

        private async Task<EvalCase> CaseOfAsync(EvalSet set, string? caseId, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(caseId)) throw new NotFoundException("A case identifier is required.");
            EvalCase? item = await _Server.Database.EvalCases.ReadAsync(set.TenantId, caseId.Trim(), token).ConfigureAwait(false);
            if (item == null || item.SetId != set.Id) throw new NotFoundException("Case " + caseId + " is not in eval set " + set.Name + " version " + set.Version + ".");
            return item;
        }

        private async Task AuthorAsync(RequestContext ctx, string tenantId, EvalSet set, EvalSetOriginEnum? origin, CancellationToken token)
        {
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                // AA-024: an agent's set is an evaluator's set, attributed to the agent and the unit it sits in.
                Run run = (String.IsNullOrEmpty(ctx.RunId) ? null : await _Server.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false))
                    ?? throw new AppAccessException(403, "Forbidden", "The calling run no longer exists.");
                List<OrgPosition> positions = await _Chain.PositionsAsync(tenantId, run.AgentId, token).ConfigureAwait(false);
                OrgPosition? position = positions.FirstOrDefault(p => p.IsLead) ?? positions.FirstOrDefault();
                set.Origin = EvalSetOriginEnum.Evaluator;
                set.AuthoredByType = PrincipalTypeEnum.Run;
                set.AuthoredById = run.Id;
                set.AuthoredByName = "agent " + run.AgentName;
                set.AuthoredByAgentId = run.AgentId;
                set.AuthoringOrgUnitId = position?.UnitId;
                return;
            }
            if (origin == EvalSetOriginEnum.Evaluator) throw Invalid("origin", "EvaluatorIsForAgents", "Origin Evaluator marks a set an agent wrote; a person's set is Human or Playground.");
            set.Origin = origin ?? EvalSetOriginEnum.Human;
            set.AuthoredByType = ctx.PrincipalType;
            set.AuthoredById = ctx.UserId ?? ctx.CredentialId;
            set.AuthoredByName = ctx.PrincipalName;
        }

        private static void Fill(EvalSet set, EvalSetRequest body, bool create)
        {
            if (body.Description != null && body.Description.Length > 2000) throw Invalid("description", "OutOfRange", "At most 2000 characters.");
            if (body.JudgeAgent != null && body.JudgeAgent.Trim().Length > 128) throw Invalid("judgeAgent", "OutOfRange", "At most 128 characters.");
            if (create || body.Description != null) set.Description = body.Description;
            if (create || body.JudgeAgent != null) set.JudgeAgent = String.IsNullOrWhiteSpace(body.JudgeAgent) ? null : body.JudgeAgent.Trim();
            if (body.Tags != null)
            {
                List<string> tags = body.Tags.Where(t => !String.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct(StringComparer.Ordinal).ToList();
                if (tags.Any(t => t.Length > 64)) throw Invalid("tags", "OutOfRange", "Tags are at most 64 characters.");
                set.Tags = tags;
            }
        }

        private static EvalCase Clean(EvalCase body, string prefix)
        {
            if (String.IsNullOrWhiteSpace(body.InputText)) throw Invalid(prefix + "inputText", "InputRequired", "A case needs input text.");
            if (body.Name != null && body.Name.Length > 256) throw Invalid(prefix + "name", "OutOfRange", "At most 256 characters.");
            for (int i = 0; i < body.Checks.Count; i++)
            {
                EvalCaseCheck check = body.Checks[i];
                if (!Enum.IsDefined(check.Scorer)) throw Invalid(prefix + "checks[" + i + "].scorer", "UnknownScorer", "Use ExactMatch, Contains, JsonSchemaValid, or Judge.");
                if (check.Scorer == EvalScorerEnum.JsonSchemaValid)
                {
                    string? problem = String.IsNullOrWhiteSpace(check.Argument) ? "Put the JSON Schema in the check's argument." : InputSchemaValidator.CheckSchema(check.Argument);
                    if (problem != null) throw Invalid(prefix + "checks[" + i + "].argument", InputSchemaValidator.InvalidSchemaCode, problem);
                }
                if (check.Scorer == EvalScorerEnum.Contains && String.IsNullOrEmpty(check.Argument) && String.IsNullOrEmpty(body.ExpectedText))
                    throw Invalid(prefix + "checks[" + i + "].argument", "ArgumentRequired", "A Contains check needs an argument or the case's expected text.");
                if (check.Scorer == EvalScorerEnum.ExactMatch && check.Argument == null && body.ExpectedText == null)
                    throw Invalid(prefix + "checks[" + i + "].argument", "ArgumentRequired", "An ExactMatch check needs an argument or the case's expected text.");
            }
            EvalCase item = new EvalCase();
            item.Name = body.Name;
            item.InputText = body.InputText;
            item.Hidden = body.Hidden;
            item.ExpectedText = body.ExpectedText;
            item.SourceRunId = body.SourceRunId;
            item.Checks = body.Checks.Select(c => new EvalCaseCheck { Scorer = c.Scorer, Argument = c.Argument, Weight = c.Weight }).ToList();
            item.Files = body.Files.Select(f => new EvalCaseFile { Path = f.Path, MediaType = f.MediaType, ContentText = f.ContentText, AssetId = f.AssetId, AssetPath = f.AssetPath }).ToList();
            return item;
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            ValidationException error = new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
            error.Code = code;
            return error;
        }

        #endregion
    }
}
