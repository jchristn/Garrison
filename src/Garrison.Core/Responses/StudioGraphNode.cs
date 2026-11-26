namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One node of a draft graph: an agent or an app.
    /// </summary>
    public class StudioGraphNode
    {
        /// <summary>
        /// Key: "Agent/{name}" or "AgenticApp/{name}".
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Kind: Agent or AgenticApp.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Whether the draft holds a document for this node (false means the node is live configuration the draft refers to).
        /// </summary>
        public bool InDraft { get; set; } = false;

        /// <summary>
        /// Whether the draft deletes this node.
        /// </summary>
        public bool Deleted { get; set; } = false;

        /// <summary>
        /// Apps that have this agent as their entry agent.
        /// </summary>
        public List<string> EntryOf { get; set; } = new List<string>();

        /// <summary>
        /// Apps this agent is a member of.
        /// </summary>
        public List<string> MemberOf { get; set; } = new List<string>();

        /// <summary>
        /// For an agent the draft holds: the capabilities its document names (host tools such as pandoc, AD7.8).
        /// </summary>
        public List<string> Capabilities { get; set; } = new List<string>();

        /// <summary>
        /// Canvas X, or null when the node has not been placed.
        /// </summary>
        public double? X { get; set; } = null;

        /// <summary>
        /// Canvas Y, or null when the node has not been placed.
        /// </summary>
        public double? Y { get; set; } = null;

        /// <summary>
        /// For an OrgUnit node, its organization; otherwise null (AA7.10).
        /// </summary>
        public string? Organization { get; set; } = null;

        /// <summary>
        /// For an OrgUnit node, its parent unit's name, or null for the root.
        /// </summary>
        public string? ParentUnit { get; set; } = null;

        /// <summary>
        /// For an OrgUnit node, its lead agent's name, or null.
        /// </summary>
        public string? Lead { get; set; } = null;

        /// <summary>
        /// For an Agent node, the units it leads or works in, as organization/unit.
        /// </summary>
        public List<string> UnitOf { get; set; } = new List<string>();
    }
}
