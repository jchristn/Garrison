namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Manages organizations (AA7.3, AA7.4): create, update, and delete; the working tree of units with validation;
    /// revisions that snapshot the tree and the mandate revisions it pins; publish, which makes a snapshot live; rollback,
    /// which publishes a copy of an earlier snapshot and restores its tree and mandates; charts; and spend against unit
    /// budgets. Every mutation is audited. Thread-safe.
    /// </summary>
    public class OrganizationService
    {
        #region Public-Members

        /// <summary>
        /// Called after an organization changes, with the tenant, the organization, and what happened (Created, Updated,
        /// Deleted, UnitChanged, RevisionCreated, Published, RolledBack). Used by the organization channel and the freeze
        /// cache. Null to skip.
        /// </summary>
        public Func<string, string, string, CancellationToken, Task>? ChangedAsync { get; set; } = null;

        /// <summary>
        /// Deletes the memory of an OrgUnit or Organization scope when its unit or organization is deleted (AA4.9). Null to
        /// skip.
        /// </summary>
        public Func<string, MemoryScopeKindEnum, string, CancellationToken, Task>? DeleteMemoryScopeAsync { get; set; } = null;

        /// <summary>
        /// Applies a revert draft recorded with an executive's apply (AA8.6) when a rollback goes past it, with the caller,
        /// the tenant, and the draft. Returns false when the draft was already applied or is gone. Null to skip.
        /// </summary>
        public Func<RequestContext, string, string, CancellationToken, Task<bool>>? ApplyRevertAsync { get; set; } = null;

        /// <summary>
        /// Cancels the run of a keeper tick in flight and finishes the tick (AA11.6, rollback with activeTicks Cancel), with
        /// the tenant and the run. Returns true when a cancellation was requested. Null leaves ticks to finish.
        /// </summary>
        public Func<string, string, CancellationToken, Task<bool>>? CancelTickRunAsync { get; set; } = null;

        /// <summary>
        /// Tree validator with the configured limits.
        /// </summary>
        public OrgTreeValidator Validator
        {
            get
            {
                return _Validator;
            }
        }

        /// <summary>
        /// The chain of command over live revisions.
        /// </summary>
        public ChainOfCommand Chain
        {
            get
            {
                return _Chain;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly MandateService _Mandates;
        private readonly ChainOfCommand _Chain;
        private readonly OrgTreeValidator _Validator = new OrgTreeValidator();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="mandates">Mandate service, used to restore pinned mandate revisions.</param>
        /// <param name="chain">Chain of command.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public OrganizationService(DatabaseDriverBase database, AuditService audit, MandateService mandates, ChainOfCommand chain)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Mandates = mandates ?? throw new ArgumentNullException(nameof(mandates));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read an organization by identifier or name, without its units.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Organization or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<Organization?> FindAsync(string tenantId, string? idOrName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(idOrName)) return null;
            return await _Database.Organizations.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false)
                ?? await _Database.Organizations.ReadByNameAsync(tenantId, idOrName.Trim(), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Enumerate a tenant's organizations.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Paging and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or query is null.</exception>
        public Task<EnumerationResult<Organization>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            return _Database.Organizations.EnumerateAsync(tenantId, query, token);
        }

        /// <summary>
        /// Fill in an organization's working tree, root first, then breadth first.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<Organization> AttachUnitsAsync(Organization organization, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            List<OrgUnit> units = await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            organization.Units = TreeOrder(organization, units);
            return organization;
        }

        /// <summary>
        /// Create an organization. It starts as Draft with no units.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="body">Name, description, and mission.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or tenantId is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict when the name is taken.</exception>
        public async Task<Organization> CreateAsync(RequestContext ctx, string tenantId, Organization body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (body == null) throw new ValidationException("An organization is required.");
            Organization organization = new Organization();
            organization.TenantId = tenantId;
            ApplyFields(organization, body);
            await EnsureNameFreeAsync(tenantId, organization.Name, null, token).ConfigureAwait(false);
            organization.CreatedBy = ctx.PrincipalName;
            await _Database.Organizations.CreateAsync(organization, token).ConfigureAwait(false);
            await AuditAsync(ctx, organization, "Created organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "Created", token).ConfigureAwait(false);
            return organization;
        }

        /// <summary>
        /// Update an organization's name, description, and mission, and retire or reactivate it. Draft and Frozen are set
        /// by the server, not by callers.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="existing">Stored organization.</param>
        /// <param name="body">New values.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The organization.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or existing is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict or StatusNotSettable.</exception>
        public async Task<Organization> UpdateAsync(RequestContext ctx, Organization existing, Organization body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (body == null) throw new ValidationException("An organization is required.");
            ApplyFields(existing, body);
            await EnsureNameFreeAsync(existing.TenantId, existing.Name, existing.Id, token).ConfigureAwait(false);
            // Draft is never set by a caller, so a body without a status (the Draft default) leaves the status alone.
            if (body.Status != existing.Status && body.Status != OrganizationStatusEnum.Draft)
            {
                if (body.Status == OrganizationStatusEnum.Retired && existing.Status != OrganizationStatusEnum.Frozen)
                {
                    existing.Status = OrganizationStatusEnum.Retired;
                }
                else if (body.Status == OrganizationStatusEnum.Active && existing.Status == OrganizationStatusEnum.Retired)
                {
                    existing.Status = String.IsNullOrEmpty(existing.CurrentRevisionId) ? OrganizationStatusEnum.Draft : OrganizationStatusEnum.Active;
                }
                else
                {
                    throw new ConflictException("StatusNotSettable", "An organization's status moves to Retired, or from Retired back to Active; publishing and freezes set the rest.");
                }
            }
            await _Database.Organizations.UpdateAsync(existing, token).ConfigureAwait(false);
            await AuditAsync(ctx, existing, "Updated organization " + existing.Name + " (" + existing.Status + ").", token).ConfigureAwait(false);
            await NotifyAsync(existing, "Updated", token).ConfigureAwait(false);
            return existing;
        }

        /// <summary>
        /// Delete an organization with its units, revisions, and the memory of its unit and organization scopes.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Delete).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when it was deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        public async Task<bool> DeleteAsync(RequestContext ctx, Organization organization, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            HashSet<string> unitIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false)) unitIds.Add(unit.Id);
            foreach (OrgRevision revision in await _Database.Organizations.ListRevisionsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false))
            {
                OrgRevision? full = await _Database.Organizations.ReadRevisionAsync(organization.TenantId, revision.Id, token).ConfigureAwait(false);
                if (full != null) foreach (OrgUnit unit in full.Units) unitIds.Add(unit.Id);
            }
            await _Database.ChangeRules.DeleteForOrganizationAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            bool deleted = await _Database.Organizations.DeleteAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            if (!deleted) return false;
            if (DeleteMemoryScopeAsync != null)
            {
                foreach (string unitId in unitIds) await DeleteMemoryScopeAsync(organization.TenantId, MemoryScopeKindEnum.OrgUnit, unitId, token).ConfigureAwait(false);
                await DeleteMemoryScopeAsync(organization.TenantId, MemoryScopeKindEnum.Organization, organization.Id, token).ConfigureAwait(false);
            }
            await AuditAsync(ctx, organization, "Deleted organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "Deleted", token).ConfigureAwait(false);
            return true;
        }

        /// <summary>
        /// Read a unit of an organization's working tree by identifier or name.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="idOrName">Unit identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Unit, or null when the organization has no such unit.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<OrgUnit?> FindUnitAsync(Organization organization, string? idOrName, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (String.IsNullOrWhiteSpace(idOrName)) return null;
            OrgUnit? unit = await _Database.Organizations.ReadUnitAsync(organization.TenantId, idOrName, token).ConfigureAwait(false);
            if (unit != null) return unit.OrganizationId == organization.Id ? unit : null;
            List<OrgUnit> units = await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            return units.FirstOrDefault(u => String.Equals(u.Name, idOrName.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Add a unit to an organization's working tree. A unit without a parent becomes the root; an organization has
        /// one. The change is live only after a revision with it is published.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="body">Unit; agents, mandates, apps, parent, and peers may be named.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored unit with names filled in.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid or a reference does not resolve.</exception>
        /// <exception cref="ConflictException">Thrown with a tree rule code (see <see cref="OrgTreeValidator"/>), AgentInactive, MandateMismatch, or OrganizationRetired.</exception>
        public async Task<OrgUnit> CreateUnitAsync(RequestContext ctx, Organization organization, OrgUnit body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (body == null) throw new ValidationException("A unit is required.");
            EnsureEditable(organization);
            List<OrgUnit> units = await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            OrgUnit unit = new OrgUnit();
            unit.TenantId = organization.TenantId;
            unit.OrganizationId = organization.Id;
            await NormalizeUnitAsync(organization, unit, body, units, token).ConfigureAwait(false);
            List<OrgUnit> next = new List<OrgUnit>(units) { unit };
            _Validator.Validate(next, false);
            await _Database.Organizations.CreateUnitAsync(unit, token).ConfigureAwait(false);
            if (String.IsNullOrEmpty(unit.ParentUnitId))
            {
                organization.RootUnitId = unit.Id;
                await _Database.Organizations.UpdateAsync(organization, token).ConfigureAwait(false);
            }
            await AuditAsync(ctx, organization, "Added unit " + unit.Name + " to organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "UnitChanged", token).ConfigureAwait(false);
            return await _Database.Organizations.ReadUnitAsync(organization.TenantId, unit.Id, token).ConfigureAwait(false) ?? unit;
        }

        /// <summary>
        /// Replace a unit of an organization's working tree.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="existing">Stored unit.</param>
        /// <param name="body">New values; agents, mandates, apps, parent, and peers may be named.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored unit with names filled in.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx, organization, or existing is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid or a reference does not resolve.</exception>
        /// <exception cref="ConflictException">Thrown with a tree rule code, AgentInactive, MandateMismatch, or OrganizationRetired.</exception>
        public async Task<OrgUnit> UpdateUnitAsync(RequestContext ctx, Organization organization, OrgUnit existing, OrgUnit body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (body == null) throw new ValidationException("A unit is required.");
            EnsureEditable(organization);
            List<OrgUnit> units = await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            List<OrgUnit> others = units.Where(u => u.Id != existing.Id).ToList();
            await NormalizeUnitAsync(organization, existing, body, others, token).ConfigureAwait(false);
            List<OrgUnit> next = new List<OrgUnit>(others) { existing };
            _Validator.Validate(next, false);
            await _Database.Organizations.UpdateUnitAsync(existing, token).ConfigureAwait(false);
            string? root = next.Where(u => String.IsNullOrEmpty(u.ParentUnitId)).Select(u => u.Id).FirstOrDefault();
            if (root != organization.RootUnitId)
            {
                organization.RootUnitId = root;
                await _Database.Organizations.UpdateAsync(organization, token).ConfigureAwait(false);
            }
            await AuditAsync(ctx, organization, "Updated unit " + existing.Name + " of organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "UnitChanged", token).ConfigureAwait(false);
            return await _Database.Organizations.ReadUnitAsync(organization.TenantId, existing.Id, token).ConfigureAwait(false) ?? existing;
        }

        /// <summary>
        /// Remove a unit from an organization's working tree, with every peer line that points at it. A unit with child
        /// units cannot be removed. The unit's memory scope is kept while a revision still holds the unit.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="unit">Unit.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when it was removed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with UnitHasChildren or OrganizationRetired.</exception>
        public async Task<bool> DeleteUnitAsync(RequestContext ctx, Organization organization, OrgUnit unit, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            EnsureEditable(organization);
            List<OrgUnit> units = await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            if (units.Any(u => u.ParentUnitId == unit.Id))
            {
                throw new ConflictException("UnitHasChildren", "Unit " + unit.Name + " has units below it; move or remove them first.");
            }
            bool deleted = await _Database.Organizations.DeleteUnitAsync(organization.TenantId, unit.Id, token).ConfigureAwait(false);
            if (!deleted) return false;
            if (organization.RootUnitId == unit.Id)
            {
                organization.RootUnitId = null;
                await _Database.Organizations.UpdateAsync(organization, token).ConfigureAwait(false);
            }
            await AuditAsync(ctx, organization, "Removed unit " + unit.Name + " from organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "UnitChanged", token).ConfigureAwait(false);
            return true;
        }

        /// <summary>
        /// Replace an organization's whole working tree (manifest apply, AA7.9). Units name their parents, peers, agents,
        /// mandates, and apps; a unit keeps its identifier when one with the same name already exists.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="bodies">Units of the new tree; ParentUnitId and PeerUnitId may hold unit names.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored units.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid or a reference does not resolve.</exception>
        /// <exception cref="ConflictException">Thrown with a tree rule code, AgentInactive, MandateMismatch, or OrganizationRetired.</exception>
        public async Task<List<OrgUnit>> ReplaceTreeAsync(RequestContext ctx, Organization organization, List<OrgUnit> bodies, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (bodies == null) throw new ArgumentNullException(nameof(bodies));
            EnsureEditable(organization);
            List<OrgUnit> existing = await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);

            // Give every unit its identifier first so parents and peers can be named in any order.
            List<OrgUnit> shells = new List<OrgUnit>();
            foreach (OrgUnit body in bodies)
            {
                OrgUnit shell = new OrgUnit();
                string name = (body.Name ?? String.Empty).Trim();
                OrgUnit? previous = existing.FirstOrDefault(u => String.Equals(u.Name, name, StringComparison.OrdinalIgnoreCase));
                if (previous != null) shell.Id = previous.Id;
                else if (!String.IsNullOrEmpty(body.Id) && body.Id.StartsWith(Garrison.Core.Constants.OrgUnitIdPrefix, StringComparison.Ordinal)) shell.Id = body.Id;
                shell.Name = name;
                shell.TenantId = organization.TenantId;
                shell.OrganizationId = organization.Id;
                if (previous != null) shell.CreatedUtc = previous.CreatedUtc;
                shells.Add(shell);
            }
            for (int i = 0; i < bodies.Count; i++)
            {
                List<OrgUnit> others = shells.Where((u, index) => index != i).ToList();
                await NormalizeUnitAsync(organization, shells[i], bodies[i], others, token).ConfigureAwait(false);
            }
            _Validator.Validate(shells, false);
            organization.RootUnitId = shells.Where(u => String.IsNullOrEmpty(u.ParentUnitId)).Select(u => u.Id).FirstOrDefault();
            await _Database.Organizations.ReplaceTreeAsync(organization, shells, token).ConfigureAwait(false);
            await AuditAsync(ctx, organization, "Replaced the units of organization " + organization.Name + " (" + shells.Count + " units).", token).ConfigureAwait(false);
            await NotifyAsync(organization, "UnitChanged", token).ConfigureAwait(false);
            return await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The organization's chart: the live revision, or the working tree before the first publish.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Chart.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<OrgChart> ChartAsync(Organization organization, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            using (System.Diagnostics.Activity? span = Garrison.Core.Telemetry.GarrisonTracing.Start("org chart", System.Diagnostics.ActivityKind.Internal))
            {
                OrgChart chart = await BuildChartAsync(organization, token).ConfigureAwait(false);
                span?.SetTag("garrison.org.units", chart.Units.Count);
                Garrison.Core.Telemetry.GarrisonTracing.Ok(span);
                return chart;
            }
        }

        private async Task<OrgChart> BuildChartAsync(Organization organization, CancellationToken token)
        {
            OrgTree? live = await _Chain.TreeAsync(organization, token).ConfigureAwait(false);
            OrgTree tree = live ?? new OrgTree(organization, await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false), null);
            OrgChart chart = new OrgChart();
            chart.OrganizationId = organization.Id;
            chart.Name = organization.Name;
            chart.Mission = organization.Mission;
            chart.RevisionId = live?.RevisionId;
            chart.RevisionNumber = live != null ? organization.CurrentRevisionNumber : 0;
            chart.Source = live != null ? "Live" : "Working";
            ChartLookups lookups = new ChartLookups();
            List<OrgUnit> ordered = TreeOrder(organization, tree.Units.ToList());
            foreach (OrgUnit unit in ordered)
            {
                OrgChartUnit node = new OrgChartUnit();
                node.Id = unit.Id;
                node.Name = unit.Name;
                node.Description = unit.Description;
                node.ParentUnitId = unit.ParentUnitId;
                node.Depth = tree.Ancestors(unit.Id).Count;
                node.AppId = unit.AppId;
                node.Budgets = unit.Budgets.Select(b => new OrgUnitBudget { Period = b.Period, AmountUsd = b.AmountUsd }).ToList();
                if (!String.IsNullOrEmpty(unit.LeadAgentId)) node.Lead = await ChartMemberAsync(organization.TenantId, unit, unit.LeadAgentId, unit.LeadTitle, unit.LeadMandateId, lookups, token).ConfigureAwait(false);
                foreach (OrgUnitMember member in unit.Members)
                {
                    node.Members.Add(await ChartMemberAsync(organization.TenantId, unit, member.AgentId, member.Title, member.MandateId, lookups, token).ConfigureAwait(false));
                }
                node.PeerUnitIds = tree.PeersOf(unit.Id).Select(u => u.Id).ToList();
                node.ChildUnitIds = tree.Children(unit.Id).Select(u => u.Id).ToList();
                chart.Units.Add(node);
            }
            return chart;
        }

        /// <summary>
        /// Where an agent sits in a live organization: its unit, manager, direct reports, and peer units.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="organizationId">Organization, or null for the agent's first live organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The answer, or null when the agent holds no position there.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or agentId is null or empty.</exception>
        public async Task<OrgWhoAmI?> WhoAmIAsync(string tenantId, string agentId, string? organizationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            foreach (OrgTree tree in await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                if (!String.IsNullOrEmpty(organizationId) && tree.Organization.Id != organizationId) continue;
                OrgPosition? position = tree.PositionOf(agentId);
                if (position == null) continue;
                ChartLookups lookups = new ChartLookups();
                OrgWhoAmI answer = new OrgWhoAmI();
                answer.OrganizationId = tree.Organization.Id;
                answer.OrganizationName = tree.Organization.Name;
                answer.IsLead = position.IsLead;
                answer.ManagerIsBoard = position.ManagerIsBoard;
                answer.Me = await MemberOfAsync(tenantId, tree, agentId, lookups, token).ConfigureAwait(false);
                if (!position.ManagerIsBoard) answer.Manager = await MemberOfAsync(tenantId, tree, position.ManagerAgentId!, lookups, token).ConfigureAwait(false);
                foreach (string report in tree.DirectReports(agentId))
                {
                    answer.DirectReports.Add(await MemberOfAsync(tenantId, tree, report, lookups, token).ConfigureAwait(false));
                }
                answer.PeerUnitNames = tree.PeersOf(position.UnitId).Select(u => u.Name).ToList();
                return answer;
            }
            return null;
        }

        /// <summary>
        /// Validate an organization's working tree without publishing it (LP3.7a): the tree rules publishing applies
        /// (<see cref="OrgTreeValidator"/>), active lead and member agents, and, as warnings that do not block publishing,
        /// units without a lead, mandates that are missing or belong to another agent, and keeper mandates whose deployment
        /// is missing, inactive, or another agent's. Nothing is written.
        /// </summary>
        /// <param name="organization">Organization (tenant-scoped by the caller).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The result: valid when no problem has severity Error.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the token is cancelled.</exception>
        public async Task<OrganizationValidationResult> ValidateWorkingTreeAsync(Organization organization, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            string tenantId = organization.TenantId;
            List<OrgUnit> units = TreeOrder(organization, await _Database.Organizations.ListUnitsAsync(tenantId, organization.Id, token).ConfigureAwait(false));
            List<OrganizationValidationProblem> errors = _Validator.Inspect(units, true);
            List<OrganizationValidationProblem> warnings = new List<OrganizationValidationProblem>();
            Dictionary<string, Agent?> agents = new Dictionary<string, Agent?>(StringComparer.Ordinal);
            Dictionary<string, Mandate?> mandates = new Dictionary<string, Mandate?>(StringComparer.Ordinal);
            Dictionary<string, Deployment?> deployments = new Dictionary<string, Deployment?>(StringComparer.Ordinal);
            HashSet<string> inactiveReported = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units)
            {
                token.ThrowIfCancellationRequested();
                if (String.IsNullOrEmpty(unit.LeadAgentId))
                {
                    warnings.Add(ValidationProblem(OrganizationValidationProblemCodeEnum.UnitWithoutLead, OrganizationValidationSeverityEnum.Warning, unit.Id, null, null, "Unit " + unit.Name + " has no lead, so its members have no manager. Set a lead agent."));
                }
                List<OrgUnitMember> holders = new List<OrgUnitMember>();
                if (!String.IsNullOrEmpty(unit.LeadAgentId)) holders.Add(new OrgUnitMember { AgentId = unit.LeadAgentId, AgentName = unit.LeadAgentName, MandateId = unit.LeadMandateId });
                holders.AddRange(unit.Members);
                foreach (OrgUnitMember holder in holders)
                {
                    Agent? agent = await CachedAsync(agents, holder.AgentId, id => _Database.Agents.ReadAsync(tenantId, id, token)).ConfigureAwait(false);
                    string agentName = agent?.Name ?? holder.AgentName ?? holder.AgentId;
                    if ((agent == null || !agent.Active) && inactiveReported.Add(holder.AgentId))
                    {
                        errors.Add(ValidationProblem(OrganizationValidationProblemCodeEnum.AgentInactive, OrganizationValidationSeverityEnum.Error, unit.Id, holder.AgentId, null, "Agent " + agentName + " in unit " + unit.Name + " no longer exists or is not active; replace it or make it active."));
                    }
                    if (String.IsNullOrEmpty(holder.MandateId)) continue;
                    Mandate? mandate = await CachedAsync(mandates, holder.MandateId, id => _Database.Mandates.ReadAsync(tenantId, id, token)).ConfigureAwait(false);
                    if (mandate == null)
                    {
                        warnings.Add(ValidationProblem(OrganizationValidationProblemCodeEnum.MandateMismatch, OrganizationValidationSeverityEnum.Warning, unit.Id, holder.AgentId, holder.MandateId, "The mandate of " + agentName + " in unit " + unit.Name + " no longer exists; attach another mandate or clear it."));
                        continue;
                    }
                    if (mandate.AgentId != holder.AgentId)
                    {
                        warnings.Add(ValidationProblem(OrganizationValidationProblemCodeEnum.MandateMismatch, OrganizationValidationSeverityEnum.Warning, unit.Id, holder.AgentId, mandate.Id, "Mandate " + mandate.Name + " in unit " + unit.Name + " belongs to another agent, not " + agentName + "."));
                        continue;
                    }
                    Deployment? deployment = String.IsNullOrEmpty(mandate.DeploymentId) ? null : await CachedAsync(deployments, mandate.DeploymentId, id => _Database.Deployments.ReadAsync(tenantId, id, token)).ConfigureAwait(false);
                    if (deployment == null || !deployment.Active || deployment.AgentId != mandate.AgentId)
                    {
                        warnings.Add(ValidationProblem(OrganizationValidationProblemCodeEnum.KeeperDeploymentMissing, OrganizationValidationSeverityEnum.Warning, unit.Id, holder.AgentId, mandate.Id, "Keeper mandate " + mandate.Name + " of " + agentName + " in unit " + unit.Name + " names a deployment that is missing, inactive, or another agent's, so its ticks cannot start. Pick an active deployment of " + agentName + "."));
                    }
                }
            }
            OrganizationValidationResult result = new OrganizationValidationResult();
            result.Problems = errors.Concat(warnings).ToList();
            return result;
        }

        /// <summary>
        /// Snapshot the working tree as a new Draft revision, pinning the current revision of every mandate it names.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="note">Why, at most 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The revision with its snapshot.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the note is too long.</exception>
        /// <exception cref="ConflictException">Thrown with a tree rule code (an empty tree or no root is NoRootUnit, two roots OneRoot) or OrganizationRetired.</exception>
        public async Task<OrgRevision> CreateRevisionAsync(RequestContext ctx, Organization organization, string? note, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            EnsureEditable(organization);
            CheckLength(note, 2000, "note");
            List<OrgUnit> units = TreeOrder(organization, await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false));
            _Validator.Validate(units, true);
            OrgRevision revision = new OrgRevision();
            revision.TenantId = organization.TenantId;
            revision.OrganizationId = organization.Id;
            revision.Note = String.IsNullOrWhiteSpace(note) ? null : note.Trim();
            Author(ctx, revision);
            revision.Units = units;
            revision.Mandates = await PinMandatesAsync(organization.TenantId, units, token).ConfigureAwait(false);
            await _Database.Organizations.CreateRevisionAsync(revision, token).ConfigureAwait(false);
            await AuditAsync(ctx, organization, "Drafted revision " + revision.Number + " of organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "RevisionCreated", token).ConfigureAwait(false);
            return await _Database.Organizations.ReadRevisionAsync(organization.TenantId, revision.Id, token).ConfigureAwait(false) ?? revision;
        }

        /// <summary>
        /// Make a Draft revision live: the chain of command, lines, and budgets follow it from now on, the mandate
        /// revisions it pins become current, and a promotion record with subject Organization is written.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="revision">Draft revision of the organization.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with RevisionMismatch, RevisionPublished, OrganizationRetired, AgentInactive, or a tree rule code.</exception>
        public async Task<OrgRevision> PublishAsync(RequestContext ctx, Organization organization, OrgRevision revision, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            EnsureEditable(organization);
            if (revision.OrganizationId != organization.Id) throw new ConflictException("RevisionMismatch", "Revision " + revision.Id + " does not belong to organization " + organization.Name + ".");
            if (revision.State != OrgRevisionStateEnum.Draft) throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of organization " + organization.Name + " was already published; draft a new revision instead.");
            await GoLiveAsync(ctx, organization, revision, PromotionKindEnum.Promote, null, token).ConfigureAwait(false);
            await AuditAsync(ctx, organization, "Published revision " + revision.Number + " of organization " + organization.Name + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "Published", token).ConfigureAwait(false);
            return revision;
        }

        /// <summary>
        /// Record an executive's applied draft (AA8.6): snapshot the working tree the apply left as a new revision that names
        /// the draft and its revert draft, and publish it, so a rollback past it undoes the change.
        /// </summary>
        /// <param name="ctx">The principal the apply ran as.</param>
        /// <param name="organization">Organization.</param>
        /// <param name="draftId">Applied draft.</param>
        /// <param name="revertDraftId">Draft holding the records as they were before, or null.</param>
        /// <param name="note">Why, at most 2000 characters.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ConflictException">Thrown with a tree rule code or OrganizationRetired.</exception>
        public async Task<OrgRevision> RecordExecutiveApplyAsync(RequestContext ctx, Organization organization, string draftId, string? revertDraftId, string note, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            EnsureEditable(organization);
            List<OrgUnit> units = TreeOrder(organization, await _Database.Organizations.ListUnitsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false));
            _Validator.Validate(units, true);
            OrgRevision revision = new OrgRevision();
            revision.TenantId = organization.TenantId;
            revision.OrganizationId = organization.Id;
            revision.Note = note.Length > 2000 ? note.Substring(0, 2000) : note;
            revision.DraftId = draftId;
            revision.RevertDraftId = revertDraftId;
            Author(ctx, revision);
            revision.Units = units;
            revision.Mandates = await PinMandatesAsync(organization.TenantId, units, token).ConfigureAwait(false);
            await _Database.Organizations.CreateRevisionAsync(revision, token).ConfigureAwait(false);
            await GoLiveAsync(ctx, organization, revision, PromotionKindEnum.Promote, null, token).ConfigureAwait(false);
            await AuditAsync(ctx, organization, "Published revision " + revision.Number + " of organization " + organization.Name + " for applied executive draft " + draftId + ".", token).ConfigureAwait(false);
            await NotifyAsync(organization, "Published", token).ConfigureAwait(false);
            return await _Database.Organizations.ReadRevisionAsync(organization.TenantId, revision.Id, token).ConfigureAwait(false) ?? revision;
        }

        /// <summary>
        /// Roll an organization back to an earlier published revision: a new revision copying its snapshot is published,
        /// the working tree is replaced with it, the mandate revisions it pinned become current again, and a rollback
        /// promotion record is written.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="targetRevisionId">Revision to return to, or null for the one live before the current one.</param>
        /// <param name="note">Why, at most 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new live revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the note is too long.</exception>
        /// <exception cref="NotFoundException">Thrown when the target revision is not a revision of this organization.</exception>
        /// <exception cref="ConflictException">Thrown with NothingToRollBack, RevisionNeverPublished, AlreadyLive, OrganizationRetired, or AgentInactive.</exception>
        public async Task<OrgRevision> RollbackAsync(RequestContext ctx, Organization organization, string? targetRevisionId, string? note, CancellationToken token = default)
        {
            return await RollbackAsync(ctx, organization, targetRevisionId, note, RollbackActiveTicksEnum.Finish, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Roll an organization back to an earlier published revision (AA7.4, AA11.6), choosing what happens to keeper ticks
        /// in flight. Finish lets them complete; Cancel cancels their runs before the snapshot is restored. Either way, every
        /// mandate the restored snapshot pins is moved to its pinned revision (again after any executive revert), and a
        /// mandate of the organization left outside the snapshot (no longer in it, named by it without a pin, or pinned to a
        /// revision that no longer exists) is paused with the reason recorded, so no mandate of the organization stays on a
        /// revision outside the restored snapshot. A tick that finishes later never moves a mandate's current revision.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="organization">Organization.</param>
        /// <param name="targetRevisionId">Revision to return to, or null for the one live before the current one.</param>
        /// <param name="note">Why, at most 2000 characters, or null.</param>
        /// <param name="activeTicks">Finish (the default) or Cancel.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new live revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or organization is null.</exception>
        /// <exception cref="ValidationException">Thrown when the note is too long or activeTicks is not a known value.</exception>
        /// <exception cref="NotFoundException">Thrown when the target revision is not a revision of this organization.</exception>
        /// <exception cref="ConflictException">Thrown with NothingToRollBack, RevisionNeverPublished, AlreadyLive, OrganizationRetired, or AgentInactive.</exception>
        public async Task<OrgRevision> RollbackAsync(RequestContext ctx, Organization organization, string? targetRevisionId, string? note, RollbackActiveTicksEnum activeTicks, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (!Enum.IsDefined(activeTicks)) throw new ValidationException("The request is invalid.", new Dictionary<string, string> { { "activeTicks", "activeTicks is Finish or Cancel." } });
            EnsureEditable(organization);
            CheckLength(note, 2000, "note");
            OrgRevision? target;
            if (!String.IsNullOrWhiteSpace(targetRevisionId))
            {
                target = await _Database.Organizations.ReadRevisionAsync(organization.TenantId, targetRevisionId.Trim(), token).ConfigureAwait(false);
                if (target == null || target.OrganizationId != organization.Id) throw new NotFoundException("Revision " + targetRevisionId + " is not a revision of organization " + organization.Name + ".");
                if (!target.PublishedUtc.HasValue) throw new ConflictException("RevisionNeverPublished", "Revision " + target.Number + " was never live; publish it instead of rolling back to it.");
                if (target.Id == organization.CurrentRevisionId) throw new ConflictException("AlreadyLive", "Revision " + target.Number + " is already live.");
            }
            else
            {
                List<OrgRevision> revisions = await _Database.Organizations.ListRevisionsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
                OrgRevision? previous = revisions
                    .Where(r => r.PublishedUtc.HasValue && r.Id != organization.CurrentRevisionId)
                    .OrderByDescending(r => r.PublishedUtc!.Value).ThenByDescending(r => r.Number).FirstOrDefault();
                if (previous == null) throw new ConflictException("NothingToRollBack", "Organization " + organization.Name + " has no earlier live revision to return to.");
                target = await _Database.Organizations.ReadRevisionAsync(organization.TenantId, previous.Id, token).ConfigureAwait(false);
                if (target == null) throw new ConflictException("NothingToRollBack", "The earlier live revision of organization " + organization.Name + " could not be read.");
            }

            // AA11.6: the mandates of the live snapshot and of the restored one; with Cancel, their ticks in flight stop first.
            OrgRevision? live = String.IsNullOrEmpty(organization.CurrentRevisionId) ? null : await _Database.Organizations.ReadRevisionAsync(organization.TenantId, organization.CurrentRevisionId, token).ConfigureAwait(false);
            HashSet<string> involved = MandatesOf(live);
            involved.UnionWith(MandatesOf(target));
            int cancelledTicks = 0;
            if (activeTicks == RollbackActiveTicksEnum.Cancel && CancelTickRunAsync != null)
            {
                foreach (string mandateId in involved)
                {
                    token.ThrowIfCancellationRequested();
                    Mandate? ticking = await _Database.Mandates.ReadAsync(organization.TenantId, mandateId, token).ConfigureAwait(false);
                    if (ticking == null || String.IsNullOrEmpty(ticking.ActiveTickId) || String.IsNullOrEmpty(ticking.ActiveRunId)) continue;
                    if (await CancelTickRunAsync(organization.TenantId, ticking.ActiveRunId, token).ConfigureAwait(false)) cancelledTicks++;
                }
            }

            OrgRevision copy = new OrgRevision();
            copy.TenantId = organization.TenantId;
            copy.OrganizationId = organization.Id;
            copy.RollbackOfRevisionId = target.Id;
            copy.Note = String.IsNullOrWhiteSpace(note) ? "Rollback to revision " + target.Number + "." : note.Trim();
            Author(ctx, copy);
            copy.Units = target.Units;
            copy.Mandates = target.Mandates;
            await _Database.Organizations.CreateRevisionAsync(copy, token).ConfigureAwait(false);

            string? previousLive = organization.CurrentRevisionId;
            await GoLiveAsync(ctx, organization, copy, PromotionKindEnum.Rollback, previousLive, token).ConfigureAwait(false);

            List<OrgUnit> tree = target.Units.Select(Clone).ToList();
            organization.RootUnitId = tree.Where(u => String.IsNullOrEmpty(u.ParentUnitId)).Select(u => u.Id).FirstOrDefault();
            await _Database.Organizations.ReplaceTreeAsync(organization, tree, token).ConfigureAwait(false);

            // AA8.6: revisions recorded for executive applies after the target carry the records as they were before; apply
            // them newest first so agents, deployments, mandates, templates, and assets go back too.
            int reverted = 0;
            if (ApplyRevertAsync != null && target.PublishedUtc.HasValue)
            {
                List<OrgRevision> later = (await _Database.Organizations.ListRevisionsAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false))
                    .Where(r => r.PublishedUtc.HasValue && r.PublishedUtc.Value > target.PublishedUtc.Value && !String.IsNullOrEmpty(r.RevertDraftId))
                    .OrderByDescending(r => r.PublishedUtc!.Value).ThenByDescending(r => r.Number).ToList();
                foreach (OrgRevision revision in later)
                {
                    if (await ApplyRevertAsync(ctx, organization.TenantId, revision.RevertDraftId!, token).ConfigureAwait(false)) reverted++;
                }
            }
            // AA11.6: the pins win over anything a revert published, and a mandate outside the snapshot stops ticking.
            int paused = await EnforceSnapshotAsync(ctx, organization, target, copy.Number, involved, token).ConfigureAwait(false);
            string ticks = activeTicks == RollbackActiveTicksEnum.Cancel
                ? " In-flight ticks: Cancel (" + cancelledTicks + " tick run" + (cancelledTicks == 1 ? String.Empty : "s") + " cancelled)."
                : " In-flight ticks: Finish.";
            string pausedText = paused > 0 ? " Paused " + paused + " mandate" + (paused == 1 ? String.Empty : "s") + " outside the restored snapshot." : String.Empty;
            await AuditAsync(ctx, organization, "Rolled organization " + organization.Name + " back to revision " + target.Number + " as revision " + copy.Number + (reverted > 0 ? ", undoing " + reverted + " executive apply" + (reverted == 1 ? String.Empty : "s") : String.Empty) + "." + ticks + pausedText, token).ConfigureAwait(false);
            await NotifyAsync(organization, "RolledBack", token).ConfigureAwait(false);
            return await _Database.Organizations.ReadRevisionAsync(organization.TenantId, copy.Id, token).ConfigureAwait(false) ?? copy;
        }

        /// <summary>
        /// Spend of every unit's subtree against its budgets in the current windows, from the live revision. A unit without
        /// a budget reports its day spend with no amount.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="utc">Time that selects the windows.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>One entry per unit budget, or one day entry for a unit without budgets; empty before the first publish.</returns>
        /// <exception cref="ArgumentNullException">Thrown when organization is null.</exception>
        public async Task<List<OrgUnitSpend>> SpendAsync(Organization organization, DateTime utc, CancellationToken token = default)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            List<OrgUnitSpend> result = new List<OrgUnitSpend>();
            OrgTree? tree = await _Chain.TreeAsync(organization, token).ConfigureAwait(false);
            if (tree == null) return result;
            foreach (OrgUnit unit in TreeOrder(organization, tree.Units.ToList()))
            {
                HashSet<string> agents = tree.SubtreeAgentIds(unit.Id);
                if (unit.Budgets.Count == 0)
                {
                    result.Add(await SpendOfAsync(organization.TenantId, unit, BudgetPeriodEnum.Day, null, agents, utc, token).ConfigureAwait(false));
                    continue;
                }
                foreach (OrgUnitBudget budget in unit.Budgets)
                {
                    result.Add(await SpendOfAsync(organization.TenantId, unit, budget.Period, budget.AmountUsd, agents, utc, token).ConfigureAwait(false));
                }
            }
            return result;
        }

        /// <summary>
        /// Spend of a unit's subtree in one budget window.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="unit">Unit.</param>
        /// <param name="period">Budget period.</param>
        /// <param name="amountUsd">Budget, or null.</param>
        /// <param name="agents">Agents of the unit's subtree.</param>
        /// <param name="utc">Time that selects the window.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Spend.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, unit, or agents is null.</exception>
        public async Task<OrgUnitSpend> SpendOfAsync(string tenantId, OrgUnit unit, BudgetPeriodEnum period, double? amountUsd, IReadOnlyCollection<string> agents, DateTime utc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (unit == null) throw new ArgumentNullException(nameof(unit));
            if (agents == null) throw new ArgumentNullException(nameof(agents));
            OrgUnitSpend spend = new OrgUnitSpend();
            spend.UnitId = unit.Id;
            spend.UnitName = unit.Name;
            spend.Period = period;
            spend.AmountUsd = amountUsd;
            spend.WindowStartUtc = WindowStart(period, utc);
            spend.WindowEndUtc = period == BudgetPeriodEnum.Month ? spend.WindowStartUtc.AddMonths(1) : spend.WindowStartUtc.AddDays(1);
            spend.SpentUsd = await _Database.UsageQuotas.ReadAgentSpendAsync(tenantId, agents, spend.WindowStartUtc, spend.WindowEndUtc, token).ConfigureAwait(false);
            return spend;
        }

        /// <summary>
        /// Start of a budget window: the UTC day or the first of the UTC month.
        /// </summary>
        /// <param name="period">Period.</param>
        /// <param name="utc">Time inside the window.</param>
        /// <returns>Window start (UTC).</returns>
        public static DateTime WindowStart(BudgetPeriodEnum period, DateTime utc)
        {
            DateTime day = DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc);
            return period == BudgetPeriodEnum.Month ? new DateTime(day.Year, day.Month, 1, 0, 0, 0, DateTimeKind.Utc) : day;
        }

        /// <summary>
        /// Order units root first, then breadth first; units outside the tree (an invalid working tree) come last.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="units">Units.</param>
        /// <returns>Ordered units.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static List<OrgUnit> TreeOrder(Organization organization, List<OrgUnit> units)
        {
            if (organization == null) throw new ArgumentNullException(nameof(organization));
            if (units == null) throw new ArgumentNullException(nameof(units));
            OrgTree tree = new OrgTree(organization, units, null);
            List<OrgUnit> ordered = new List<OrgUnit>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit root in units.Where(u => String.IsNullOrEmpty(u.ParentUnitId)))
            {
                foreach (OrgUnit unit in tree.Subtree(root.Id))
                {
                    if (seen.Add(unit.Id)) ordered.Add(unit);
                }
            }
            foreach (OrgUnit unit in units)
            {
                if (seen.Add(unit.Id)) ordered.Add(unit);
            }
            return ordered;
        }

        #endregion

        #region Private-Methods

        private static HashSet<string> MandatesOf(OrgRevision? revision)
        {
            HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
            if (revision == null) return ids;
            foreach (OrgRevisionMandate pin in revision.Mandates) if (!String.IsNullOrEmpty(pin.MandateId)) ids.Add(pin.MandateId);
            foreach (OrgUnit unit in revision.Units)
            {
                if (!String.IsNullOrEmpty(unit.LeadMandateId)) ids.Add(unit.LeadMandateId);
                foreach (OrgUnitMember member in unit.Members) if (!String.IsNullOrEmpty(member.MandateId)) ids.Add(member.MandateId);
            }
            return ids;
        }

        private async Task<int> EnforceSnapshotAsync(RequestContext ctx, Organization organization, OrgRevision target, int copyNumber, HashSet<string> involved, CancellationToken token)
        {
            Dictionary<string, OrgRevisionMandate> pins = new Dictionary<string, OrgRevisionMandate>(StringComparer.Ordinal);
            foreach (OrgRevisionMandate pin in target.Mandates) if (!String.IsNullOrEmpty(pin.MandateId)) pins[pin.MandateId] = pin;
            int paused = 0;
            foreach (string mandateId in involved.OrderBy(m => m, StringComparer.Ordinal))
            {
                token.ThrowIfCancellationRequested();
                Mandate? mandate = await _Database.Mandates.ReadAsync(organization.TenantId, mandateId, token).ConfigureAwait(false);
                if (mandate == null) continue;
                string why;
                if (pins.TryGetValue(mandateId, out OrgRevisionMandate? pin))
                {
                    if (mandate.CurrentRevisionId == pin.MandateRevisionId) continue;
                    MandateRevision? pinned = await _Database.MandateRevisions.ReadAsync(organization.TenantId, pin.MandateRevisionId, token).ConfigureAwait(false);
                    if (pinned != null && pinned.MandateId == mandate.Id && pinned.State != MandateRevisionStateEnum.Draft)
                    {
                        await _Mandates.RestoreRevisionAsync(ctx, mandate, pinned, "organization " + organization.Name + " rollback to revision " + target.Number, token).ConfigureAwait(false);
                        continue;
                    }
                    why = "organization " + organization.Name + " rolled back to revision " + target.Number + " (as revision " + copyNumber + "), which pins revision " + pin.MandateRevisionNumber + " of this mandate; that revision no longer exists";
                }
                else
                {
                    // Named by the restored tree without a pin (it had no published revision then), or no longer in it.
                    if (String.IsNullOrEmpty(mandate.CurrentRevisionId)) continue;
                    why = "organization " + organization.Name + " rolled back to revision " + target.Number + " (as revision " + copyNumber + "), whose snapshot does not pin this mandate";
                }
                if (await PauseOutsideAsync(ctx, mandate, why, token).ConfigureAwait(false)) paused++;
            }
            return paused;
        }

        private async Task<bool> PauseOutsideAsync(RequestContext ctx, Mandate mandate, string why, CancellationToken token)
        {
            if (mandate.Status == MandateStatusEnum.Active || mandate.Status == MandateStatusEnum.CapReached)
            {
                try
                {
                    await _Mandates.PauseAsync(ctx, mandate, why, token).ConfigureAwait(false);
                    return true;
                }
                catch (ConflictException)
                {
                    // Its status changed meanwhile; read it again below.
                    Mandate? again = await _Database.Mandates.ReadAsync(mandate.TenantId, mandate.Id, token).ConfigureAwait(false);
                    if (again == null || again.Status != MandateStatusEnum.Frozen) return false;
                    mandate = again;
                }
            }
            if (mandate.Status != MandateStatusEnum.Frozen) return false;
            // A frozen mandate would return to Active when its freeze is lifted; it goes to Paused instead.
            if (!await _Database.Mandates.TrySetStatusAsync(mandate.TenantId, mandate.Id, MandateStatusEnum.Frozen, MandateStatusEnum.Paused, null, token).ConfigureAwait(false)) return false;
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Mandate", mandate.Id, "Paused frozen mandate " + mandate.Name + ": " + why, mandate.TenantId, token).ConfigureAwait(false);
            return true;
        }

        private async Task GoLiveAsync(RequestContext ctx, Organization organization, OrgRevision revision, PromotionKindEnum kind, string? previousLiveRevisionId, CancellationToken token)
        {
            OrgRevision full = revision.Units.Count > 0 ? revision : (await _Database.Organizations.ReadRevisionAsync(organization.TenantId, revision.Id, token).ConfigureAwait(false) ?? revision);
            _Validator.Validate(full.Units, true);
            await EnsureAgentsActiveAsync(organization.TenantId, full.Units, token).ConfigureAwait(false);
            if (!await _Database.Organizations.PublishRevisionAsync(organization, revision, token).ConfigureAwait(false))
            {
                throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of organization " + organization.Name + " was published by another request.");
            }
            foreach (OrgRevisionMandate pin in full.Mandates)
            {
                Mandate? mandate = await _Database.Mandates.ReadAsync(organization.TenantId, pin.MandateId, token).ConfigureAwait(false);
                MandateRevision? pinned = await _Database.MandateRevisions.ReadAsync(organization.TenantId, pin.MandateRevisionId, token).ConfigureAwait(false);
                if (mandate == null || pinned == null || pinned.State == MandateRevisionStateEnum.Draft) continue;
                await _Mandates.RestoreRevisionAsync(ctx, mandate, pinned, "organization " + organization.Name + " revision " + revision.Number, token).ConfigureAwait(false);
            }
            PromotionRecord record = new PromotionRecord();
            record.TenantId = organization.TenantId;
            record.Kind = kind;
            record.OrganizationId = organization.Id;
            record.OrgRevisionId = revision.Id;
            record.SourceEnvironment = kind == PromotionKindEnum.Rollback ? "live" : "draft";
            record.TargetEnvironment = "live";
            record.ActorType = ctx.PrincipalType;
            record.ActorId = ctx.UserId ?? ctx.CredentialId;
            record.ActorName = ctx.PrincipalName;
            record.Note = revision.Note;
            if (kind == PromotionKindEnum.Rollback && !String.IsNullOrEmpty(previousLiveRevisionId))
            {
                PromotionRecord? previous = await _Database.Promotions.ReadLatestForOrgRevisionAsync(organization.TenantId, previousLiveRevisionId, token).ConfigureAwait(false);
                if (previous != null && String.IsNullOrEmpty(previous.RolledBackById)) record.RollbackOfId = previous.Id;
            }
            await _Database.Promotions.ApplyAsync(record, token).ConfigureAwait(false);
        }

        private async Task<List<OrgRevisionMandate>> PinMandatesAsync(string tenantId, List<OrgUnit> units, CancellationToken token)
        {
            List<OrgRevisionMandate> pins = new List<OrgRevisionMandate>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            List<string> mandateIds = new List<string>();
            foreach (OrgUnit unit in units)
            {
                if (!String.IsNullOrEmpty(unit.LeadMandateId)) mandateIds.Add(unit.LeadMandateId);
                foreach (OrgUnitMember member in unit.Members)
                {
                    if (!String.IsNullOrEmpty(member.MandateId)) mandateIds.Add(member.MandateId);
                }
            }
            foreach (string mandateId in mandateIds)
            {
                if (!seen.Add(mandateId)) continue;
                Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, mandateId, token).ConfigureAwait(false);
                if (mandate == null || String.IsNullOrEmpty(mandate.CurrentRevisionId)) continue;
                pins.Add(new OrgRevisionMandate { MandateId = mandate.Id, MandateName = mandate.Name, MandateRevisionId = mandate.CurrentRevisionId, MandateRevisionNumber = mandate.CurrentRevisionNumber });
            }
            return pins;
        }

        private async Task NormalizeUnitAsync(Organization organization, OrgUnit target, OrgUnit body, List<OrgUnit> others, CancellationToken token)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            string name = (body.Name ?? String.Empty).Trim();
            if (name.Length < 1 || name.Length > 128 || name.Any(Char.IsControl)) errors["name"] = "A unit name has 1 to 128 characters and no control characters.";
            if (body.Description != null && body.Description.Length > 2000) errors["description"] = "At most 2000 characters.";
            if (body.LeadTitle != null && body.LeadTitle.Trim().Length > 128) errors["leadTitle"] = "At most 128 characters.";
            if (body.Members.Count > _Validator.MaxMembersPerUnit) errors["members"] = "At most " + _Validator.MaxMembersPerUnit + " members.";
            if (errors.Count > 0) throw new ValidationException("The unit is invalid.", errors);

            target.Name = name;
            target.Description = String.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim();

            target.ParentUnitId = null;
            if (!String.IsNullOrWhiteSpace(body.ParentUnitId))
            {
                OrgUnit? parent = ResolveUnit(others, body.ParentUnitId);
                if (parent == null)
                {
                    if (String.Equals(body.ParentUnitId.Trim(), target.Id, StringComparison.Ordinal) || String.Equals(body.ParentUnitId.Trim(), name, StringComparison.OrdinalIgnoreCase))
                    {
                        throw new ConflictException("Cycle", "Unit " + name + " cannot be its own parent.");
                    }
                    throw new ConflictException("ParentNotFound", "Parent unit " + body.ParentUnitId + " is not a unit of organization " + organization.Name + ".");
                }
                target.ParentUnitId = parent.Id;
            }

            target.LeadAgentId = null;
            target.LeadAgentName = null;
            target.LeadTitle = String.IsNullOrWhiteSpace(body.LeadTitle) ? null : body.LeadTitle.Trim();
            target.LeadMandateId = null;
            if (!String.IsNullOrWhiteSpace(body.LeadAgentId))
            {
                Agent lead = await ResolveAgentAsync(organization.TenantId, body.LeadAgentId, "leadAgentId", token).ConfigureAwait(false);
                target.LeadAgentId = lead.Id;
                target.LeadAgentName = lead.Name;
                if (!String.IsNullOrWhiteSpace(body.LeadMandateId)) target.LeadMandateId = (await ResolveMandateAsync(organization.TenantId, body.LeadMandateId, lead, "leadMandateId", token).ConfigureAwait(false)).Id;
            }
            else if (!String.IsNullOrWhiteSpace(body.LeadMandateId))
            {
                throw new ValidationException("The unit is invalid.", new Dictionary<string, string> { { "leadMandateId", "A lead mandate needs a lead agent." } });
            }

            target.AppId = null;
            if (!String.IsNullOrWhiteSpace(body.AppId))
            {
                AgenticApp? app = await _Database.Apps.ReadAsync(organization.TenantId, body.AppId.Trim(), token).ConfigureAwait(false)
                    ?? await _Database.Apps.ReadByNameAsync(organization.TenantId, body.AppId.Trim(), token).ConfigureAwait(false);
                if (app == null) throw new ValidationException("The unit is invalid.", new Dictionary<string, string> { { "appId", "App " + body.AppId + " was not found in this tenant." } });
                target.AppId = app.Id;
            }

            List<OrgUnitMember> members = new List<OrgUnitMember>();
            for (int i = 0; i < body.Members.Count; i++)
            {
                OrgUnitMember source = body.Members[i] ?? new OrgUnitMember();
                string path = "members[" + i + "]";
                if (source.Title != null && source.Title.Trim().Length > 128) throw new ValidationException("The unit is invalid.", new Dictionary<string, string> { { path + ".title", "At most 128 characters." } });
                Agent agent = await ResolveAgentAsync(organization.TenantId, source.AgentId, path + ".agentId", token).ConfigureAwait(false);
                OrgUnitMember member = new OrgUnitMember();
                member.AgentId = agent.Id;
                member.AgentName = agent.Name;
                member.Title = String.IsNullOrWhiteSpace(source.Title) ? null : source.Title.Trim();
                if (!String.IsNullOrWhiteSpace(source.MandateId)) member.MandateId = (await ResolveMandateAsync(organization.TenantId, source.MandateId, agent, path + ".mandateId", token).ConfigureAwait(false)).Id;
                members.Add(member);
            }
            target.Members = members;

            List<OrgUnitPeerLine> lines = new List<OrgUnitPeerLine>();
            foreach (OrgUnitPeerLine source in body.PeerLines)
            {
                if (source == null || String.IsNullOrWhiteSpace(source.PeerUnitId)) continue;
                OrgUnit? peer = ResolveUnit(others, source.PeerUnitId);
                if (peer == null) throw new ConflictException("PeerNotFound", "Peer unit " + source.PeerUnitId + " is not another unit of organization " + organization.Name + ".");
                if (lines.Any(l => l.PeerUnitId == peer.Id)) continue;
                lines.Add(new OrgUnitPeerLine { PeerUnitId = peer.Id, PeerUnitName = peer.Name });
            }
            target.PeerLines = lines;
            target.Budgets = body.Budgets.Where(b => b != null).Select(b => new OrgUnitBudget { Period = b.Period, AmountUsd = b.AmountUsd }).ToList();
        }

        private async Task<Agent> ResolveAgentAsync(string tenantId, string? reference, string field, CancellationToken token)
        {
            string value = (reference ?? String.Empty).Trim();
            Agent? agent = String.IsNullOrEmpty(value) ? null
                : await _Database.Agents.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Agents.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
            if (agent == null) throw new ValidationException("The unit is invalid.", new Dictionary<string, string> { { field, "Agent " + value + " was not found in this tenant." } });
            if (!agent.Active) throw new ConflictException("AgentInactive", "Agent " + agent.Name + " is not active; only active agents hold positions in an organization.");
            return agent;
        }

        private async Task<Mandate> ResolveMandateAsync(string tenantId, string reference, Agent agent, string field, CancellationToken token)
        {
            string value = reference.Trim();
            Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, value, token).ConfigureAwait(false) ?? await _Database.Mandates.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
            if (mandate == null) throw new ValidationException("The unit is invalid.", new Dictionary<string, string> { { field, "Mandate " + value + " was not found in this tenant." } });
            if (mandate.AgentId != agent.Id) throw new ConflictException("MandateMismatch", "Mandate " + mandate.Name + " belongs to another agent, not " + agent.Name + ".");
            return mandate;
        }

        private static OrganizationValidationProblem ValidationProblem(OrganizationValidationProblemCodeEnum code, OrganizationValidationSeverityEnum severity, string? unitId, string? agentId, string? mandateId, string message)
        {
            OrganizationValidationProblem problem = new OrganizationValidationProblem();
            problem.Code = code;
            problem.Severity = severity;
            problem.UnitId = unitId;
            problem.AgentId = agentId;
            problem.MandateId = mandateId;
            problem.Message = message;
            return problem;
        }

        private static async Task<T?> CachedAsync<T>(Dictionary<string, T?> cache, string id, Func<string, Task<T?>> read) where T : class
        {
            if (cache.TryGetValue(id, out T? known)) return known;
            T? value = await read(id).ConfigureAwait(false);
            cache[id] = value;
            return value;
        }

        private async Task EnsureAgentsActiveAsync(string tenantId, List<OrgUnit> units, CancellationToken token)
        {
            HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units)
            {
                if (!String.IsNullOrEmpty(unit.LeadAgentId)) ids.Add(unit.LeadAgentId);
                foreach (OrgUnitMember member in unit.Members) ids.Add(member.AgentId);
            }
            foreach (string id in ids)
            {
                Agent? agent = await _Database.Agents.ReadAsync(tenantId, id, token).ConfigureAwait(false);
                if (agent == null || !agent.Active) throw new ConflictException("AgentInactive", "Agent " + (agent?.Name ?? id) + " no longer exists or is not active; change the unit that holds it first.");
            }
        }

        private static OrgUnit? ResolveUnit(List<OrgUnit> units, string reference)
        {
            string value = reference.Trim();
            return units.FirstOrDefault(u => u.Id == value) ?? units.FirstOrDefault(u => String.Equals(u.Name, value, StringComparison.OrdinalIgnoreCase));
        }

        private async Task<OrgChartMember> ChartMemberAsync(string tenantId, OrgUnit unit, string agentId, string? title, string? mandateId, ChartLookups lookups, CancellationToken token)
        {
            OrgChartMember member = new OrgChartMember();
            member.AgentId = agentId;
            member.Title = title;
            member.UnitId = unit.Id;
            member.UnitName = unit.Name;
            if (!lookups.AgentNames.TryGetValue(agentId, out string? agentName))
            {
                Agent? agent = await _Database.Agents.ReadAsync(tenantId, agentId, token).ConfigureAwait(false);
                agentName = agent?.Name;
                lookups.AgentNames[agentId] = agentName;
            }
            member.AgentName = agentName;
            if (!String.IsNullOrEmpty(mandateId))
            {
                if (!lookups.Mandates.TryGetValue(mandateId, out OrgChartMember? cached))
                {
                    cached = new OrgChartMember();
                    Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, mandateId, token).ConfigureAwait(false);
                    if (mandate != null)
                    {
                        cached.MandateName = mandate.Name;
                        MandateRevision? revision = String.IsNullOrEmpty(mandate.CurrentRevisionId) ? null : await _Database.MandateRevisions.ReadAsync(tenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
                        cached.MandateSummary = Summary(revision?.Objective ?? mandate.Description);
                    }
                    lookups.Mandates[mandateId] = cached;
                }
                member.MandateId = mandateId;
                member.MandateName = cached.MandateName;
                member.MandateSummary = cached.MandateSummary;
            }
            return member;
        }

        private async Task<OrgChartMember> MemberOfAsync(string tenantId, OrgTree tree, string agentId, ChartLookups lookups, CancellationToken token)
        {
            OrgPosition? position = tree.PositionOf(agentId);
            OrgUnit? unit = position == null ? null : tree.Unit(position.UnitId);
            if (position == null || unit == null) return new OrgChartMember { AgentId = agentId };
            return await ChartMemberAsync(tenantId, unit, agentId, position.Title, position.MandateId, lookups, token).ConfigureAwait(false);
        }

        private static string? Summary(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return null;
            string line = text.Trim().Split('\n')[0].Trim();
            return line.Length > 200 ? line.Substring(0, 197) + "..." : line;
        }

        private static OrgUnit Clone(OrgUnit source)
        {
            OrgUnit unit = new OrgUnit();
            unit.Id = source.Id;
            unit.TenantId = source.TenantId;
            unit.OrganizationId = source.OrganizationId;
            unit.ParentUnitId = source.ParentUnitId;
            unit.Name = source.Name;
            unit.Description = source.Description;
            unit.LeadAgentId = source.LeadAgentId;
            unit.LeadTitle = source.LeadTitle;
            unit.LeadMandateId = source.LeadMandateId;
            unit.AppId = source.AppId;
            unit.Members = source.Members.Select(m => new OrgUnitMember { AgentId = m.AgentId, Title = m.Title, MandateId = m.MandateId }).ToList();
            unit.PeerLines = source.PeerLines.Select(l => new OrgUnitPeerLine { PeerUnitId = l.PeerUnitId }).ToList();
            unit.Budgets = source.Budgets.Select(b => new OrgUnitBudget { Period = b.Period, AmountUsd = b.AmountUsd }).ToList();
            unit.CreatedUtc = DateTime.UtcNow;
            return unit;
        }

        private static void ApplyFields(Organization target, Organization body)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            string name = (body.Name ?? String.Empty).Trim();
            if (name.Length < 1 || name.Length > 128 || name.Any(Char.IsControl)) errors["name"] = "An organization name has 1 to 128 characters and no control characters.";
            if (body.Description != null && body.Description.Length > 2000) errors["description"] = "At most 2000 characters.";
            if (body.Mission != null && body.Mission.Length > 8000) errors["mission"] = "At most 8000 characters.";
            if (body.BudgetFreezeMarginPercent < 0 || body.BudgetFreezeMarginPercent > 100) errors["budgetFreezeMarginPercent"] = "0 to 100 percent past the budget; 0 freezes at the budget.";
            if (errors.Count > 0) throw new ValidationException("The organization is invalid.", errors);
            target.BudgetFreezeMarginPercent = body.BudgetFreezeMarginPercent;
            target.Name = name;
            target.Description = String.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim();
            target.Mission = String.IsNullOrWhiteSpace(body.Mission) ? null : body.Mission.Trim();
        }

        private async Task EnsureNameFreeAsync(string tenantId, string name, string? exceptId, CancellationToken token)
        {
            Organization? named = await _Database.Organizations.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
            if (named != null && named.Id != exceptId) throw new ConflictException("NameConflict", "An organization named " + name + " already exists.");
        }

        private static void EnsureEditable(Organization organization)
        {
            if (organization.Status == OrganizationStatusEnum.Retired) throw new ConflictException("OrganizationRetired", "Organization " + organization.Name + " is retired; set it Active before changing it.");
        }

        private static void CheckLength(string? value, int max, string field)
        {
            if (value != null && value.Length > max) throw new ValidationException("The request is invalid.", new Dictionary<string, string> { { field, "At most " + max + " characters." } });
        }

        private static void Author(RequestContext ctx, OrgRevision revision)
        {
            revision.AuthorType = ctx.PrincipalType;
            revision.AuthorId = ctx.UserId ?? ctx.CredentialId;
            revision.AuthorName = ctx.PrincipalName;
        }

        private async Task AuditAsync(RequestContext ctx, Organization organization, string description, CancellationToken token)
        {
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Organization", organization.Id, description, organization.TenantId, token).ConfigureAwait(false);
        }

        private async Task NotifyAsync(Organization organization, string change, CancellationToken token)
        {
            if (change == "UnitChanged" || change == "RevisionCreated") await _Database.Organizations.TouchAsync(organization.TenantId, organization.Id, token).ConfigureAwait(false);
            if (ChangedAsync == null) return;
            await ChangedAsync(organization.TenantId, organization.Id, change, token).ConfigureAwait(false);
        }

        #endregion
    }
}
