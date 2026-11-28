namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Checks the shape of an organization's units (AA7.3): one root, parents inside the organization, no cycles, unique
    /// unit names, one position per agent (so an agent leads at most one unit), peer lines to other units of the same
    /// organization, at most one budget per period, and no child budget above its nearest ancestor's budget for the same
    /// period. Whether agents are active and mandates belong to them needs the database and is checked by the service.
    /// Thread-safe.
    /// </summary>
    public class OrgTreeValidator
    {
        #region Public-Members

        /// <summary>
        /// Most units in one organization. Default 500, minimum 1.
        /// </summary>
        public int MaxUnits
        {
            get
            {
                return _MaxUnits;
            }
            set
            {
                _MaxUnits = Math.Max(1, value);
            }
        }

        /// <summary>
        /// Most members in one unit. Default 200, minimum 1.
        /// </summary>
        public int MaxMembersPerUnit
        {
            get
            {
                return _MaxMembersPerUnit;
            }
            set
            {
                _MaxMembersPerUnit = Math.Max(1, value);
            }
        }

        /// <summary>
        /// Most peer lines from one unit. Default 50, minimum 0.
        /// </summary>
        public int MaxPeerLinesPerUnit
        {
            get
            {
                return _MaxPeerLinesPerUnit;
            }
            set
            {
                _MaxPeerLinesPerUnit = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Largest budget in US dollars. Default 10,000,000.
        /// </summary>
        public double MaxBudgetUsd
        {
            get
            {
                return _MaxBudgetUsd;
            }
            set
            {
                _MaxBudgetUsd = Math.Max(0.01, value);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxUnits = 500;
        private int _MaxMembersPerUnit = 200;
        private int _MaxPeerLinesPerUnit = 50;
        private double _MaxBudgetUsd = 10000000;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Validate a set of units as one organization's tree.
        /// </summary>
        /// <param name="units">Units of one organization.</param>
        /// <param name="requireRoot">True to require exactly one root (publishing); false allows an empty tree.</param>
        /// <exception cref="ArgumentNullException">Thrown when units is null.</exception>
        /// <exception cref="ConflictException">Thrown with TooManyUnits, OneRoot, ParentNotFound, Cycle, UnitNameTaken,
        /// LeadsTwoUnits, PositionTaken, TooManyMembers, PeerNotFound, TooManyPeerLines, BudgetPeriodTaken, BudgetInvalid, or
        /// BudgetExceedsParent.</exception>
        public void Validate(List<OrgUnit> units, bool requireRoot)
        {
            if (units == null) throw new ArgumentNullException(nameof(units));
            if (units.Count > _MaxUnits) throw new ConflictException("TooManyUnits", "An organization holds at most " + _MaxUnits + " units.");
            Dictionary<string, OrgUnit> byId = new Dictionary<string, OrgUnit>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units) byId[unit.Id] = unit;

            List<OrgUnit> roots = units.Where(u => String.IsNullOrEmpty(u.ParentUnitId)).ToList();
            if (roots.Count > 1) throw new ConflictException("OneRoot", "An organization has one root unit; " + String.Join(" and ", roots.Select(r => r.Name)) + " have no parent.");
            if (requireRoot && units.Count > 0 && roots.Count == 0) throw new ConflictException("OneRoot", "An organization needs one root unit without a parent.");
            if (requireRoot && units.Count == 0) throw new ConflictException("OneRoot", "An organization needs at least its root unit.");

            HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (OrgUnit unit in units)
            {
                if (!names.Add(unit.Name)) throw new ConflictException("UnitNameTaken", "Two units are named " + unit.Name + ".");
                if (!String.IsNullOrEmpty(unit.ParentUnitId) && !byId.ContainsKey(unit.ParentUnitId))
                {
                    throw new ConflictException("ParentNotFound", "The parent of unit " + unit.Name + " is not a unit of this organization.");
                }
            }

            foreach (OrgUnit unit in units)
            {
                HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal) { unit.Id };
                OrgUnit current = unit;
                while (!String.IsNullOrEmpty(current.ParentUnitId) && byId.TryGetValue(current.ParentUnitId, out OrgUnit? parent))
                {
                    if (!seen.Add(parent.Id)) throw new ConflictException("Cycle", "Unit " + unit.Name + " would sit below itself.");
                    current = parent;
                }
            }

            Dictionary<string, string> leads = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> positions = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units)
            {
                if (String.IsNullOrEmpty(unit.LeadAgentId)) continue;
                if (leads.TryGetValue(unit.LeadAgentId, out string? other))
                {
                    throw new ConflictException("LeadsTwoUnits", "An agent leads at most one unit of an organization; " + Agent(unit.LeadAgentName, unit.LeadAgentId) + " already leads " + other + ".");
                }
                leads[unit.LeadAgentId] = unit.Name;
                positions[unit.LeadAgentId] = "lead of " + unit.Name;
            }
            foreach (OrgUnit unit in units)
            {
                if (unit.Members.Count > _MaxMembersPerUnit) throw new ConflictException("TooManyMembers", "Unit " + unit.Name + " has more than " + _MaxMembersPerUnit + " members.");
                foreach (OrgUnitMember member in unit.Members)
                {
                    if (positions.TryGetValue(member.AgentId, out string? held))
                    {
                        throw new ConflictException("PositionTaken", "An agent holds one position in an organization; " + Agent(member.AgentName, member.AgentId) + " is already " + held + ".");
                    }
                    positions[member.AgentId] = "a member of " + unit.Name;
                }
            }

            foreach (OrgUnit unit in units)
            {
                if (unit.PeerLines.Count > _MaxPeerLinesPerUnit) throw new ConflictException("TooManyPeerLines", "Unit " + unit.Name + " has more than " + _MaxPeerLinesPerUnit + " peer lines.");
                foreach (OrgUnitPeerLine line in unit.PeerLines)
                {
                    if (line.PeerUnitId == unit.Id || !byId.ContainsKey(line.PeerUnitId))
                    {
                        throw new ConflictException("PeerNotFound", "A peer line of unit " + unit.Name + " must point at another unit of this organization.");
                    }
                }
            }

            foreach (OrgUnit unit in units)
            {
                HashSet<string> periods = new HashSet<string>(StringComparer.Ordinal);
                foreach (OrgUnitBudget budget in unit.Budgets)
                {
                    if (!periods.Add(budget.Period.ToString())) throw new ConflictException("BudgetPeriodTaken", "Unit " + unit.Name + " has two " + budget.Period + " budgets.");
                    if (budget.AmountUsd <= 0 || budget.AmountUsd > _MaxBudgetUsd)
                    {
                        throw new ConflictException("BudgetInvalid", "A budget of unit " + unit.Name + " must be more than 0 and at most " + _MaxBudgetUsd.ToString(CultureInfo.InvariantCulture) + " USD.");
                    }
                    OrgUnit current = unit;
                    HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal) { unit.Id };
                    while (!String.IsNullOrEmpty(current.ParentUnitId) && byId.TryGetValue(current.ParentUnitId, out OrgUnit? parent) && seen.Add(parent.Id))
                    {
                        OrgUnitBudget? above = parent.Budgets.FirstOrDefault(b => b.Period == budget.Period);
                        if (above != null)
                        {
                            if (budget.AmountUsd > above.AmountUsd)
                            {
                                throw new ConflictException("BudgetExceedsParent", "The " + budget.Period + " budget of unit " + unit.Name + " (" + budget.AmountUsd.ToString(CultureInfo.InvariantCulture) + " USD) exceeds the " + budget.Period + " budget of " + parent.Name + " (" + above.AmountUsd.ToString(CultureInfo.InvariantCulture) + " USD).");
                            }
                            break;
                        }
                        current = parent;
                    }
                }
            }
        }

        /// <summary>
        /// Check the same tree rules as <see cref="Validate"/> without throwing, and return every problem found instead of
        /// the first (LP3.7a, the organization validation dry run). Each problem has severity Error because publishing
        /// refuses it. Checks that need the database (active agents, mandates, keeper deployments) and the Warning
        /// problems are added by the organization service.
        /// </summary>
        /// <param name="units">Units of one organization, in tree order.</param>
        /// <param name="requireRoot">True to require exactly one root (publishing); false allows an empty tree.</param>
        /// <returns>Problems in tree order; empty when <see cref="Validate"/> would pass.</returns>
        /// <exception cref="ArgumentNullException">Thrown when units is null.</exception>
        public List<OrganizationValidationProblem> Inspect(List<OrgUnit> units, bool requireRoot)
        {
            if (units == null) throw new ArgumentNullException(nameof(units));
            List<OrganizationValidationProblem> problems = new List<OrganizationValidationProblem>();
            if (units.Count > _MaxUnits) problems.Add(Problem(OrganizationValidationProblemCodeEnum.TooManyUnits, null, null, "An organization holds at most " + _MaxUnits + " units."));
            Dictionary<string, OrgUnit> byId = new Dictionary<string, OrgUnit>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units) byId[unit.Id] = unit;

            List<OrgUnit> roots = units.Where(u => String.IsNullOrEmpty(u.ParentUnitId)).ToList();
            if (roots.Count > 1)
            {
                foreach (OrgUnit extra in roots.Skip(1))
                {
                    problems.Add(Problem(OrganizationValidationProblemCodeEnum.OneRoot, extra.Id, null, "An organization has one root unit; " + extra.Name + " has no parent besides " + roots[0].Name + ". Give it a parent unit."));
                }
            }
            if (requireRoot && units.Count > 0 && roots.Count == 0) problems.Add(Problem(OrganizationValidationProblemCodeEnum.OneRoot, null, null, "An organization needs one root unit without a parent."));
            if (requireRoot && units.Count == 0) problems.Add(Problem(OrganizationValidationProblemCodeEnum.OneRoot, null, null, "An organization needs at least its root unit."));

            HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (OrgUnit unit in units)
            {
                if (!names.Add(unit.Name)) problems.Add(Problem(OrganizationValidationProblemCodeEnum.UnitNameTaken, unit.Id, null, "Two units are named " + unit.Name + "; rename one of them."));
                if (!String.IsNullOrEmpty(unit.ParentUnitId) && !byId.ContainsKey(unit.ParentUnitId))
                {
                    problems.Add(Problem(OrganizationValidationProblemCodeEnum.UnitDetachedFromRoot, unit.Id, null, "The parent of unit " + unit.Name + " is not a unit of this organization, so the unit has no path to the root. Move it under another unit."));
                }
            }

            foreach (OrgUnit unit in units)
            {
                HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal) { unit.Id };
                OrgUnit current = unit;
                while (!String.IsNullOrEmpty(current.ParentUnitId) && byId.TryGetValue(current.ParentUnitId, out OrgUnit? parent))
                {
                    if (!seen.Add(parent.Id))
                    {
                        problems.Add(Problem(OrganizationValidationProblemCodeEnum.Cycle, unit.Id, null, "Unit " + unit.Name + " would sit below itself. Move it under a unit outside its own subtree."));
                        break;
                    }
                    current = parent;
                }
            }

            Dictionary<string, string> positions = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in units)
            {
                if (String.IsNullOrEmpty(unit.LeadAgentId)) continue;
                if (positions.TryGetValue(unit.LeadAgentId, out string? other))
                {
                    problems.Add(Problem(OrganizationValidationProblemCodeEnum.AgentInTwoUnits, unit.Id, unit.LeadAgentId, "An agent holds one position in an organization; " + Agent(unit.LeadAgentName, unit.LeadAgentId) + " already is " + other + " and cannot also lead " + unit.Name + "."));
                    continue;
                }
                positions[unit.LeadAgentId] = "lead of " + unit.Name;
            }
            foreach (OrgUnit unit in units)
            {
                if (unit.Members.Count > _MaxMembersPerUnit) problems.Add(Problem(OrganizationValidationProblemCodeEnum.TooManyMembers, unit.Id, null, "Unit " + unit.Name + " has more than " + _MaxMembersPerUnit + " members."));
                foreach (OrgUnitMember member in unit.Members)
                {
                    if (positions.TryGetValue(member.AgentId, out string? held))
                    {
                        problems.Add(Problem(OrganizationValidationProblemCodeEnum.AgentInTwoUnits, unit.Id, member.AgentId, "An agent holds one position in an organization; " + Agent(member.AgentName, member.AgentId) + " already is " + held + " and cannot also be a member of " + unit.Name + "."));
                        continue;
                    }
                    positions[member.AgentId] = "a member of " + unit.Name;
                }
            }

            foreach (OrgUnit unit in units)
            {
                if (unit.PeerLines.Count > _MaxPeerLinesPerUnit) problems.Add(Problem(OrganizationValidationProblemCodeEnum.TooManyPeerLines, unit.Id, null, "Unit " + unit.Name + " has more than " + _MaxPeerLinesPerUnit + " peer lines."));
                foreach (OrgUnitPeerLine line in unit.PeerLines)
                {
                    if (line.PeerUnitId == unit.Id || !byId.ContainsKey(line.PeerUnitId))
                    {
                        problems.Add(Problem(OrganizationValidationProblemCodeEnum.PeerLineToMissingUnit, unit.Id, null, "A peer line of unit " + unit.Name + " must point at another unit of this organization; remove the line or point it at an existing unit."));
                    }
                }
            }

            foreach (OrgUnit unit in units)
            {
                HashSet<string> periods = new HashSet<string>(StringComparer.Ordinal);
                foreach (OrgUnitBudget budget in unit.Budgets)
                {
                    if (!periods.Add(budget.Period.ToString())) problems.Add(Problem(OrganizationValidationProblemCodeEnum.BudgetPeriodTaken, unit.Id, null, "Unit " + unit.Name + " has two " + budget.Period + " budgets."));
                    if (budget.AmountUsd <= 0 || budget.AmountUsd > _MaxBudgetUsd)
                    {
                        problems.Add(Problem(OrganizationValidationProblemCodeEnum.BudgetInvalid, unit.Id, null, "A budget of unit " + unit.Name + " must be more than 0 and at most " + _MaxBudgetUsd.ToString(CultureInfo.InvariantCulture) + " USD."));
                    }
                    OrgUnit current = unit;
                    HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal) { unit.Id };
                    while (!String.IsNullOrEmpty(current.ParentUnitId) && byId.TryGetValue(current.ParentUnitId, out OrgUnit? parent) && seen.Add(parent.Id))
                    {
                        OrgUnitBudget? above = parent.Budgets.FirstOrDefault(b => b.Period == budget.Period);
                        if (above != null)
                        {
                            if (budget.AmountUsd > above.AmountUsd)
                            {
                                problems.Add(Problem(OrganizationValidationProblemCodeEnum.BudgetOverParent, unit.Id, null, "The " + budget.Period + " budget of unit " + unit.Name + " (" + budget.AmountUsd.ToString(CultureInfo.InvariantCulture) + " USD) exceeds the " + budget.Period + " budget of " + parent.Name + " (" + above.AmountUsd.ToString(CultureInfo.InvariantCulture) + " USD)."));
                            }
                            break;
                        }
                        current = parent;
                    }
                }
            }
            return problems;
        }

        #endregion

        #region Private-Methods

        private static OrganizationValidationProblem Problem(OrganizationValidationProblemCodeEnum code, string? unitId, string? agentId, string message)
        {
            OrganizationValidationProblem problem = new OrganizationValidationProblem();
            problem.Code = code;
            problem.Severity = OrganizationValidationSeverityEnum.Error;
            problem.UnitId = unitId;
            problem.AgentId = agentId;
            problem.Message = message;
            return problem;
        }

        private static string Agent(string? name, string id)
        {
            return String.IsNullOrEmpty(name) ? id : name;
        }

        #endregion
    }
}
