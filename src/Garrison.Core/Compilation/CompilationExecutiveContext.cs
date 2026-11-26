namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// An executive's authority (AA8.8), rendered into the system prompt through builtin/executive-system as executive.*:
    /// its unit, the units below it, and the change rules that bear on its subtree. Not thread-safe.
    /// </summary>
    public class CompilationExecutiveContext
    {
        /// <summary>
        /// Organization name.
        /// </summary>
        public string OrganizationName { get; set; } = String.Empty;

        /// <summary>
        /// The unit the executive leads.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Units strictly below the executive's unit, breadth first.
        /// </summary>
        public List<CompilationExecutiveUnit> Units { get; set; } = new List<CompilationExecutiveUnit>();

        /// <summary>
        /// Agents holding a position below the executive's unit.
        /// </summary>
        public long AgentCount { get; set; } = 0;

        /// <summary>
        /// In-force change rules that bear on the subtree.
        /// </summary>
        public List<CompilationExecutiveRule> Rules { get; set; } = new List<CompilationExecutiveRule>();
    }
}
