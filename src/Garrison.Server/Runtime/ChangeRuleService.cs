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
    using Garrison.Core.Organizations;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Services;

    /// <summary>
    /// Change rules (AA8.4, AA-023): people write them, executives read the ones that bear on their subtree, and the studio
    /// consults them when an executive asks to apply a draft. A run token can never create, change, or delete a rule.
    /// Thread-safe.
    /// </summary>
    public class ChangeRuleService
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly OrganizationService _Organizations;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="organizations">Organization service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ChangeRuleService(ServerContext server, OrganizationService organizations)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Organizations = organizations ?? throw new ArgumentNullException(nameof(organizations));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Enumerate rules with organization and unit names filled in.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organization">Organization identifier or name, or null for all.</param>
        /// <param name="unit">Unit identifier or name within the organization, or null.</param>
        /// <param name="query">Paging; ActiveOnly limits to active rules.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="NotFoundException">Thrown when the organization or unit is unknown.</exception>
        public async Task<EnumerationResult<ChangeRule>> EnumerateAsync(string tenantId, string? organization, string? unit, EnumerationQuery query, CancellationToken token = default)
        {
            string? organizationId = null;
            string? unitId = null;
            if (!String.IsNullOrWhiteSpace(organization))
            {
                Organization found = await _Organizations.FindAsync(tenantId, organization, token).ConfigureAwait(false) ?? throw new NotFoundException("Organization not found.");
                organizationId = found.Id;
                if (!String.IsNullOrWhiteSpace(unit)) unitId = (await _Organizations.FindUnitAsync(found, unit, token).ConfigureAwait(false) ?? throw new NotFoundException("Unit not found.")).Id;
            }
            EnumerationResult<ChangeRule> page = await _Server.Database.ChangeRules.EnumerateAsync(tenantId, organizationId, unitId, query, token).ConfigureAwait(false);
            await NameAsync(tenantId, page.Objects, token).ConfigureAwait(false);
            return page;
        }

        /// <summary>
        /// Read a rule with names filled in.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Rule identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rule.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant has no such rule.</exception>
        public async Task<ChangeRule> ReadAsync(string tenantId, string? id, CancellationToken token = default)
        {
            ChangeRule rule = (String.IsNullOrWhiteSpace(id) ? null : await _Server.Database.ChangeRules.ReadAsync(tenantId, id.Trim(), token).ConfigureAwait(false))
                ?? throw new NotFoundException("Change rule not found.");
            await NameAsync(tenantId, new List<ChangeRule> { rule }, token).ConfigureAwait(false);
            return rule;
        }

        /// <summary>
        /// Create a rule. Only people create rules.
        /// </summary>
        /// <param name="ctx">Authorized caller (ChangeRule Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="body">Rule; organizationId and unitId take identifiers or names.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored rule.</returns>
        /// <exception cref="AppAccessException">Thrown with 403 RulesArePeopleOnly for a run token.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        /// <exception cref="NotFoundException">Thrown when the organization or unit is unknown.</exception>
        public async Task<ChangeRule> CreateAsync(RequestContext ctx, string tenantId, ChangeRule body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (body == null) throw new ArgumentNullException(nameof(body));
            PeopleOnly(ctx);
            Organization organization = await _Organizations.FindAsync(tenantId, body.OrganizationId, token).ConfigureAwait(false)
                ?? throw Invalid("organizationId", "OrganizationNotFound", "organizationId names no organization in this tenant.");
            ChangeRule rule = new ChangeRule();
            rule.TenantId = tenantId;
            rule.OrganizationId = organization.Id;
            await FillAsync(organization, rule, body, token).ConfigureAwait(false);
            rule.CreatedByType = ctx.PrincipalType;
            rule.CreatedById = ctx.UserId ?? ctx.CredentialId;
            rule.CreatedByName = ctx.PrincipalName;
            rule.UpdatedByName = ctx.PrincipalName;
            await _Server.Database.ChangeRules.CreateAsync(rule, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "ChangeRule", rule.Id, "Created change rule " + rule.Name + " for unit " + rule.UnitName + " of organization " + organization.Name + " (" + Describe(rule) + ").", tenantId, token).ConfigureAwait(false);
            return await ReadAsync(tenantId, rule.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Replace a rule's unit, name, description, active flag, expiry, classes, and limits. Its organization does not
        /// change. Only people change rules.
        /// </summary>
        /// <param name="ctx">Authorized caller (ChangeRule Update).</param>
        /// <param name="existing">Rule.</param>
        /// <param name="body">Replacement.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored rule.</returns>
        /// <exception cref="AppAccessException">Thrown with 403 RulesArePeopleOnly for a run token.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid or the body names another organization.</exception>
        public async Task<ChangeRule> UpdateAsync(RequestContext ctx, ChangeRule existing, ChangeRule body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (body == null) throw new ArgumentNullException(nameof(body));
            PeopleOnly(ctx);
            Organization organization = await _Server.Database.Organizations.ReadAsync(existing.TenantId, existing.OrganizationId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("The rule's organization no longer exists.");
            if (!String.IsNullOrWhiteSpace(body.OrganizationId) && body.OrganizationId != organization.Id && !String.Equals(body.OrganizationId, organization.Name, StringComparison.OrdinalIgnoreCase))
            {
                throw Invalid("organizationId", "OrganizationNotSettable", "A rule stays with its organization; create a new rule for another one.");
            }
            await FillAsync(organization, existing, body, token).ConfigureAwait(false);
            existing.UpdatedByName = ctx.PrincipalName;
            await _Server.Database.ChangeRules.UpdateAsync(existing, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "ChangeRule", existing.Id, "Updated change rule " + existing.Name + " (" + Describe(existing) + ").", existing.TenantId, token).ConfigureAwait(false);
            return await ReadAsync(existing.TenantId, existing.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete a rule. Only people delete rules.
        /// </summary>
        /// <param name="ctx">Authorized caller (ChangeRule Delete).</param>
        /// <param name="rule">Rule.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="AppAccessException">Thrown with 403 RulesArePeopleOnly for a run token.</exception>
        public async Task<bool> DeleteAsync(RequestContext ctx, ChangeRule rule, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (rule == null) throw new ArgumentNullException(nameof(rule));
            PeopleOnly(ctx);
            bool deleted = await _Server.Database.ChangeRules.DeleteAsync(rule.TenantId, rule.Id, token).ConfigureAwait(false);
            if (deleted) await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "ChangeRule", rule.Id, "Deleted change rule " + rule.Name + ".", rule.TenantId, token).ConfigureAwait(false);
            return deleted;
        }

        /// <summary>
        /// The in-force rules that bear on an executive's subtree: rules on its unit or above it, which cover changes below
        /// it, and rules on units below it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="position">Executive position.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rules, oldest first, with names filled in.</returns>
        /// <exception cref="ArgumentNullException">Thrown when position is null.</exception>
        public async Task<List<ChangeRule>> ForExecutiveAsync(string tenantId, ExecutivePosition position, CancellationToken token = default)
        {
            if (position == null) throw new ArgumentNullException(nameof(position));
            OrgTree? tree = await _Organizations.Chain.LiveTreeAsync(tenantId, position.OrganizationId, token).ConfigureAwait(false);
            if (tree == null) return new List<ChangeRule>();
            List<ChangeRule> rules = (await _Server.Database.ChangeRules.ListInForceAsync(tenantId, position.OrganizationId, DateTime.UtcNow, token).ConfigureAwait(false))
                .Where(r => tree.InSubtree(position.UnitId, r.UnitId) || tree.InSubtree(r.UnitId, position.UnitId)).ToList();
            await NameAsync(tenantId, rules, token).ConfigureAwait(false);
            return rules;
        }

        #endregion

        #region Private-Methods

        private static void PeopleOnly(RequestContext ctx)
        {
            // AA-023: graduated autonomy is granted by people; an agent never writes the rules that let it act alone.
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw new AppAccessException(403, "RulesArePeopleOnly", "Change rules are written only by people; an agent cannot create, change, or delete one.");
        }

        private async Task FillAsync(Organization organization, ChangeRule target, ChangeRule body, CancellationToken token)
        {
            string name = body.Name?.Trim() ?? String.Empty;
            if (name.Length < 1 || name.Length > 128) throw Invalid("name", "Required", "name is required, 1 to 128 characters.");
            if (body.Description != null && body.Description.Length > 2000) throw Invalid("description", "TooLong", "description is at most 2000 characters.");
            OrgUnit unit = await _Organizations.FindUnitAsync(organization, body.UnitId, token).ConfigureAwait(false)
                ?? throw Invalid("unitId", "UnitNotFound", "unitId names no unit of organization " + organization.Name + ".");
            // An expiry already stored may stay as it is, so an expired rule can still be renamed or turned off.
            bool unchangedExpiry = body.ExpiresUtc.HasValue && target.ExpiresUtc.HasValue && body.ExpiresUtc.Value == target.ExpiresUtc.Value;
            if (body.ExpiresUtc.HasValue && body.ExpiresUtc.Value <= DateTime.UtcNow && !unchangedExpiry) throw Invalid("expiresUtc", "ExpiryInPast", "expiresUtc must be in the future, or left out for no expiry.");
            if (body.Classes.Count == 0) throw Invalid("classes", "Required", "List at least one change class: " + String.Join(", ", Enum.GetNames(typeof(ChangeClassEnum))) + ".");
            List<ChangeClassEnum> classes = body.Classes.Select(c => c.Class).ToList();
            if (classes.Distinct().Count() != classes.Count) throw Invalid("classes", "Duplicate", "Each class appears once.");
            if (body.Limits.Count > 32) throw Invalid("limits", "TooMany", "A rule has at most 32 limits.");
            HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < body.Limits.Count; i++)
            {
                ChangeRuleLimit limit = body.Limits[i];
                string field = "limits[" + i.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                if (!classes.Contains(limit.Class)) throw Invalid(field + ".class", "ClassNotInRule", "Limit " + limit.Name + " is for " + limit.Class + ", which the rule does not list.");
                string? known = ChangeRuleMatcher.KnownLimitNames(limit.Class).FirstOrDefault(n => String.Equals(n, limit.Name?.Trim(), StringComparison.OrdinalIgnoreCase));
                if (known == null) throw Invalid(field + ".name", "UnknownLimit", "A " + limit.Class + " limit is one of " + String.Join(", ", ChangeRuleMatcher.KnownLimitNames(limit.Class)) + ".");
                limit.Name = known;
                if (!seen.Add(limit.Class + "/" + known)) throw Invalid(field + ".name", "Duplicate", "Each class and limit name appears once.");
                if (!limit.Minimum.HasValue && !limit.Maximum.HasValue) throw Invalid(field, "BoundRequired", "Give a minimum, a maximum, or both.");
                if (limit.Minimum.HasValue && limit.Maximum.HasValue && limit.Minimum.Value > limit.Maximum.Value) throw Invalid(field, "MinimumAboveMaximum", "minimum must not exceed maximum.");
                if ((limit.Minimum.HasValue && (Double.IsNaN(limit.Minimum.Value) || limit.Minimum.Value < 0)) || (limit.Maximum.HasValue && (Double.IsNaN(limit.Maximum.Value) || limit.Maximum.Value < 0))) throw Invalid(field, "NegativeBound", "Bounds are zero or more.");
            }
            target.Name = name;
            target.Description = String.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim();
            target.UnitId = unit.Id;
            target.UnitName = unit.Name;
            target.Active = body.Active;
            target.ExpiresUtc = body.ExpiresUtc;
            target.Classes = classes.Select(c => new ChangeRuleClass { Class = c }).ToList();
            target.Limits = body.Limits.Select(l => new ChangeRuleLimit { Class = l.Class, Name = l.Name, Minimum = l.Minimum, Maximum = l.Maximum }).ToList();
        }

        private async Task NameAsync(string tenantId, List<ChangeRule> rules, CancellationToken token)
        {
            Dictionary<string, Organization?> organizations = new Dictionary<string, Organization?>(StringComparer.Ordinal);
            foreach (ChangeRule rule in rules)
            {
                if (!organizations.TryGetValue(rule.OrganizationId, out Organization? organization))
                {
                    organization = await _Server.Database.Organizations.ReadAsync(tenantId, rule.OrganizationId, token).ConfigureAwait(false);
                    organizations[rule.OrganizationId] = organization;
                }
                rule.OrganizationName = organization?.Name;
                OrgUnit? unit = await _Server.Database.Organizations.ReadUnitAsync(tenantId, rule.UnitId, token).ConfigureAwait(false);
                rule.UnitName = unit?.Name;
            }
        }

        private static string Describe(ChangeRule rule)
        {
            string classes = String.Join(", ", rule.Classes.Select(c => c.Class));
            string limits = rule.Limits.Count == 0 ? String.Empty : "; limits " + String.Join(", ", rule.Limits.Select(l => l.Class + "." + l.Name + " " + (l.Minimum?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "*") + ".." + (l.Maximum?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "*")));
            return (rule.Active ? "active" : "inactive") + "; " + classes + limits + (rule.ExpiresUtc.HasValue ? "; expires " + rule.ExpiresUtc.Value.ToString("u", System.Globalization.CultureInfo.InvariantCulture) : String.Empty);
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            return new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
        }

        #endregion
    }
}
