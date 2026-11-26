namespace Test.Shared.Suites
{
    using Garrison.Core.Models;

    /// <summary>
    /// A published organization for tests: root (CEO) with ops (lead and worker) and sales (seller), ops and sales joined
    /// by a peer line, and a stranger outside it.
    /// </summary>
    public class OrgFixture
    {
        /// <summary>Organization.</summary>
        public Organization Org { get; set; } = new Organization();

        /// <summary>Root unit.</summary>
        public OrgUnit Root { get; set; } = new OrgUnit();

        /// <summary>Ops unit.</summary>
        public OrgUnit Ops { get; set; } = new OrgUnit();

        /// <summary>Sales unit.</summary>
        public OrgUnit Sales { get; set; } = new OrgUnit();

        /// <summary>Lead of the root unit.</summary>
        public Agent Ceo { get; set; } = new Agent();

        /// <summary>Lead of ops.</summary>
        public Agent Lead { get; set; } = new Agent();

        /// <summary>Member of ops.</summary>
        public Agent Worker { get; set; } = new Agent();

        /// <summary>Lead of sales.</summary>
        public Agent Seller { get; set; } = new Agent();

        /// <summary>An agent outside the organization.</summary>
        public Agent Stranger { get; set; } = new Agent();
    }
}
