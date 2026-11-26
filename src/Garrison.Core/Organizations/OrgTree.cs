namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;

    /// <summary>
    /// Read-only view of one organization's units as a tree (AA7.5): parents, children, ancestors, subtrees, and where each
    /// agent sits. A member's manager is its unit's lead; a lead's manager is the nearest lead above it; with no lead above,
    /// the board (people) is the manager. Built once per revision and safe to share between threads after construction.
    /// </summary>
    public class OrgTree
    {
        #region Public-Members

        /// <summary>
        /// The organization.
        /// </summary>
        public Organization Organization
        {
            get
            {
                return _Organization;
            }
        }

        /// <summary>
        /// Revision the tree was built from, or null for the working tree.
        /// </summary>
        public string? RevisionId
        {
            get
            {
                return _RevisionId;
            }
        }

        /// <summary>
        /// Units in their stored order.
        /// </summary>
        public IReadOnlyList<OrgUnit> Units
        {
            get
            {
                return _Units;
            }
        }

        /// <summary>
        /// The root unit, or null when there is not exactly one.
        /// </summary>
        public OrgUnit? Root
        {
            get
            {
                List<OrgUnit> roots = _Units.Where(u => String.IsNullOrEmpty(u.ParentUnitId)).ToList();
                return roots.Count == 1 ? roots[0] : null;
            }
        }

        #endregion

        #region Private-Members

        private readonly Organization _Organization;
        private readonly string? _RevisionId;
        private readonly List<OrgUnit> _Units;
        private readonly Dictionary<string, OrgUnit> _ById = new Dictionary<string, OrgUnit>(StringComparer.Ordinal);
        private readonly Dictionary<string, List<OrgUnit>> _Children = new Dictionary<string, List<OrgUnit>>(StringComparer.Ordinal);
        private readonly Dictionary<string, OrgPosition> _Positions = new Dictionary<string, OrgPosition>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Build a tree. Units whose parent is missing are treated as roots; validation reports that separately.
        /// </summary>
        /// <param name="organization">Organization.</param>
        /// <param name="units">Units.</param>
        /// <param name="revisionId">Revision the units came from, or null for the working tree.</param>
        /// <exception cref="ArgumentNullException">Thrown when organization or units is null.</exception>
        public OrgTree(Organization organization, List<OrgUnit> units, string? revisionId)
        {
            _Organization = organization ?? throw new ArgumentNullException(nameof(organization));
            if (units == null) throw new ArgumentNullException(nameof(units));
            _Units = new List<OrgUnit>(units);
            _RevisionId = revisionId;
            foreach (OrgUnit unit in _Units) _ById[unit.Id] = unit;
            foreach (OrgUnit unit in _Units)
            {
                if (String.IsNullOrEmpty(unit.ParentUnitId) || !_ById.ContainsKey(unit.ParentUnitId)) continue;
                if (!_Children.TryGetValue(unit.ParentUnitId, out List<OrgUnit>? list))
                {
                    list = new List<OrgUnit>();
                    _Children[unit.ParentUnitId] = list;
                }
                list.Add(unit);
            }
            foreach (OrgUnit unit in _Units)
            {
                if (!String.IsNullOrEmpty(unit.LeadAgentId) && !_Positions.ContainsKey(unit.LeadAgentId))
                {
                    _Positions[unit.LeadAgentId] = NewPosition(unit, unit.LeadAgentId, true, unit.LeadTitle, unit.LeadMandateId, NearestLeadAbove(unit));
                }
            }
            foreach (OrgUnit unit in _Units)
            {
                foreach (OrgUnitMember member in unit.Members)
                {
                    if (String.IsNullOrEmpty(member.AgentId) || _Positions.ContainsKey(member.AgentId)) continue;
                    string? manager = !String.IsNullOrEmpty(unit.LeadAgentId) ? unit.LeadAgentId : NearestLeadAbove(unit);
                    _Positions[member.AgentId] = NewPosition(unit, member.AgentId, false, member.Title, member.MandateId, manager);
                }
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// A unit by identifier.
        /// </summary>
        /// <param name="unitId">Unit identifier.</param>
        /// <returns>The unit, or null.</returns>
        public OrgUnit? Unit(string? unitId)
        {
            if (String.IsNullOrEmpty(unitId)) return null;
            return _ById.TryGetValue(unitId, out OrgUnit? unit) ? unit : null;
        }

        /// <summary>
        /// A unit by name, ignoring case.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <returns>The unit, or null.</returns>
        public OrgUnit? UnitByName(string? name)
        {
            if (String.IsNullOrEmpty(name)) return null;
            return _Units.FirstOrDefault(u => String.Equals(u.Name, name, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Direct children of a unit, in stored order.
        /// </summary>
        /// <param name="unitId">Unit identifier.</param>
        /// <returns>Children.</returns>
        public List<OrgUnit> Children(string unitId)
        {
            if (String.IsNullOrEmpty(unitId)) return new List<OrgUnit>();
            return _Children.TryGetValue(unitId, out List<OrgUnit>? list) ? new List<OrgUnit>(list) : new List<OrgUnit>();
        }

        /// <summary>
        /// Ancestors of a unit, nearest first, stopping at a cycle.
        /// </summary>
        /// <param name="unitId">Unit identifier.</param>
        /// <returns>Ancestors.</returns>
        public List<OrgUnit> Ancestors(string unitId)
        {
            List<OrgUnit> result = new List<OrgUnit>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal) { unitId };
            OrgUnit? current = Unit(unitId);
            while (current != null && !String.IsNullOrEmpty(current.ParentUnitId) && seen.Add(current.ParentUnitId))
            {
                current = Unit(current.ParentUnitId);
                if (current != null) result.Add(current);
            }
            return result;
        }

        /// <summary>
        /// A unit and every unit below it, breadth first.
        /// </summary>
        /// <param name="unitId">Unit identifier.</param>
        /// <returns>Units of the subtree; empty when the unit is unknown.</returns>
        public List<OrgUnit> Subtree(string unitId)
        {
            List<OrgUnit> result = new List<OrgUnit>();
            OrgUnit? start = Unit(unitId);
            if (start == null) return result;
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            Queue<OrgUnit> queue = new Queue<OrgUnit>();
            queue.Enqueue(start);
            while (queue.Count > 0)
            {
                OrgUnit unit = queue.Dequeue();
                if (!seen.Add(unit.Id)) continue;
                result.Add(unit);
                foreach (OrgUnit child in Children(unit.Id)) queue.Enqueue(child);
            }
            return result;
        }

        /// <summary>
        /// Leads and members of a unit's subtree.
        /// </summary>
        /// <param name="unitId">Unit identifier.</param>
        /// <returns>Distinct agent identifiers.</returns>
        public HashSet<string> SubtreeAgentIds(string unitId)
        {
            HashSet<string> agents = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in Subtree(unitId)) AddAgents(unit, agents);
            return agents;
        }

        /// <summary>
        /// Every agent with a position in the organization.
        /// </summary>
        /// <returns>Agent identifiers.</returns>
        public HashSet<string> AgentIds()
        {
            return new HashSet<string>(_Positions.Keys, StringComparer.Ordinal);
        }

        /// <summary>
        /// Where an agent sits, or null when it holds no position. When an invalid tree gives an agent two positions, the
        /// unit it leads wins, then the first unit that lists it.
        /// </summary>
        /// <param name="agentId">Agent identifier.</param>
        /// <returns>Position, or null.</returns>
        public OrgPosition? PositionOf(string? agentId)
        {
            if (String.IsNullOrEmpty(agentId)) return null;
            return _Positions.TryGetValue(agentId, out OrgPosition? position) ? position : null;
        }

        /// <summary>
        /// The agents that report directly to an agent: for a lead, its unit's members and the nearest leads below it (the
        /// members of a child unit without a lead report to it as well). A member has no direct reports.
        /// </summary>
        /// <param name="agentId">Agent identifier.</param>
        /// <returns>Agent identifiers in chart order.</returns>
        public List<string> DirectReports(string? agentId)
        {
            List<string> result = new List<string>();
            OrgPosition? position = PositionOf(agentId);
            if (position == null || !position.IsLead) return result;
            foreach (OrgPosition other in _Positions.Values)
            {
                if (String.Equals(other.ManagerAgentId, agentId, StringComparison.Ordinal)) result.Add(other.AgentId);
            }
            return result;
        }

        /// <summary>
        /// The leads above an agent, nearest first: its manager, its manager's manager, and so on up to the CEO.
        /// </summary>
        /// <param name="agentId">Agent identifier.</param>
        /// <returns>Agent identifiers.</returns>
        public List<string> Chain(string? agentId)
        {
            List<string> result = new List<string>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            OrgPosition? position = PositionOf(agentId);
            while (position != null && !position.ManagerIsBoard && seen.Add(position.ManagerAgentId!))
            {
                result.Add(position.ManagerAgentId!);
                position = PositionOf(position.ManagerAgentId);
            }
            return result;
        }

        /// <summary>
        /// Whether two agents are joined by a reporting line: one is the other's manager.
        /// </summary>
        /// <param name="firstAgentId">First agent.</param>
        /// <param name="secondAgentId">Second agent.</param>
        /// <returns>True for a reporting line in either direction.</returns>
        public bool ReportingLine(string? firstAgentId, string? secondAgentId)
        {
            OrgPosition? first = PositionOf(firstAgentId);
            OrgPosition? second = PositionOf(secondAgentId);
            if (first == null || second == null) return false;
            return String.Equals(first.ManagerAgentId, secondAgentId, StringComparison.Ordinal) || String.Equals(second.ManagerAgentId, firstAgentId, StringComparison.Ordinal);
        }

        /// <summary>
        /// Whether two agents sit in units joined by a peer line (in either direction).
        /// </summary>
        /// <param name="firstAgentId">First agent.</param>
        /// <param name="secondAgentId">Second agent.</param>
        /// <returns>True for a peer line.</returns>
        public bool PeerLine(string? firstAgentId, string? secondAgentId)
        {
            OrgPosition? first = PositionOf(firstAgentId);
            OrgPosition? second = PositionOf(secondAgentId);
            if (first == null || second == null || first.UnitId == second.UnitId) return false;
            return PeerUnits(first.UnitId, second.UnitId);
        }

        /// <summary>
        /// Whether two units are joined by a peer line in either direction.
        /// </summary>
        /// <param name="firstUnitId">First unit.</param>
        /// <param name="secondUnitId">Second unit.</param>
        /// <returns>True for a peer line.</returns>
        public bool PeerUnits(string firstUnitId, string secondUnitId)
        {
            OrgUnit? first = Unit(firstUnitId);
            OrgUnit? second = Unit(secondUnitId);
            if (first == null || second == null) return false;
            return first.PeerLines.Any(l => l.PeerUnitId == second.Id) || second.PeerLines.Any(l => l.PeerUnitId == first.Id);
        }

        /// <summary>
        /// Units joined to a unit by a peer line in either direction.
        /// </summary>
        /// <param name="unitId">Unit identifier.</param>
        /// <returns>Peer units in stored order.</returns>
        public List<OrgUnit> PeersOf(string unitId)
        {
            return _Units.Where(u => u.Id != unitId && PeerUnits(unitId, u.Id)).ToList();
        }

        /// <summary>
        /// Whether a unit lies inside another unit's subtree (a unit is inside its own subtree).
        /// </summary>
        /// <param name="unitId">Unit to test.</param>
        /// <param name="subtreeRootId">Root of the subtree.</param>
        /// <returns>True when inside.</returns>
        public bool InSubtree(string unitId, string subtreeRootId)
        {
            if (unitId == subtreeRootId) return Unit(unitId) != null;
            return Ancestors(unitId).Any(u => u.Id == subtreeRootId);
        }

        #endregion

        #region Private-Methods

        private OrgPosition NewPosition(OrgUnit unit, string agentId, bool isLead, string? title, string? mandateId, string? managerAgentId)
        {
            OrgPosition position = new OrgPosition();
            position.OrganizationId = _Organization.Id;
            position.OrganizationName = _Organization.Name;
            position.RevisionId = _RevisionId ?? String.Empty;
            position.UnitId = unit.Id;
            position.UnitName = unit.Name;
            position.AgentId = agentId;
            position.IsLead = isLead;
            position.Title = title;
            position.MandateId = mandateId;
            position.ManagerAgentId = managerAgentId == agentId ? null : managerAgentId;
            return position;
        }

        private string? NearestLeadAbove(OrgUnit unit)
        {
            foreach (OrgUnit ancestor in Ancestors(unit.Id))
            {
                if (!String.IsNullOrEmpty(ancestor.LeadAgentId)) return ancestor.LeadAgentId;
            }
            return null;
        }

        private static void AddAgents(OrgUnit unit, HashSet<string> agents)
        {
            if (!String.IsNullOrEmpty(unit.LeadAgentId)) agents.Add(unit.LeadAgentId);
            foreach (OrgUnitMember member in unit.Members)
            {
                if (!String.IsNullOrEmpty(member.AgentId)) agents.Add(member.AgentId);
            }
        }

        #endregion
    }
}
