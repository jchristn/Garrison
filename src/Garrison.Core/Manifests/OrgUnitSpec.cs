namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;

    /// <summary>
    /// One unit in an Organization manifest (AA7.9). Agents, mandates, and apps are named; peers name other units of the
    /// same organization; children nest under units.
    /// </summary>
    public class OrgUnitSpec
    {
        /// <summary>
        /// Unit name, unique in the organization.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Lead agent name, or null.
        /// </summary>
        public string? Lead { get; set; } = null;

        /// <summary>
        /// Lead title, or null.
        /// </summary>
        public string? LeadTitle { get; set; } = null;

        /// <summary>
        /// Lead mandate name, or null. It must be a mandate of the lead agent.
        /// </summary>
        public string? LeadMandate { get; set; } = null;

        /// <summary>
        /// Agentic app name, or null.
        /// </summary>
        public string? App { get; set; } = null;

        /// <summary>
        /// Members other than the lead.
        /// </summary>
        public List<OrgUnitMemberSpec>? Members { get; set; } = null;

        /// <summary>
        /// Names of units this unit has peer lines with.
        /// </summary>
        public List<string>? Peers { get; set; } = null;

        /// <summary>
        /// Budgets on the unit's subtree.
        /// </summary>
        public List<OrgUnitBudgetSpec>? Budgets { get; set; } = null;

        /// <summary>
        /// Child units.
        /// </summary>
        public List<OrgUnitSpec>? Units { get; set; } = null;
    }
}
