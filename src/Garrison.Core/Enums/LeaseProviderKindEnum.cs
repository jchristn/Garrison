namespace Garrison.Core.Enums
{
    /// <summary>Coordination backend; run leases and durable fencing remain in the database.</summary>
    public enum LeaseProviderKindEnum
    {
        /// <summary>Existing database coordination, with no external service.</summary>
        Database,
        /// <summary>Clutch exclusive locks plus durable database epochs.</summary>
        Clutch
    }
}
