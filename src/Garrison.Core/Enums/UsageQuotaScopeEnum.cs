namespace Garrison.Core.Enums
{
    /// <summary>The resource whose runs share a usage quota.</summary>
    public enum UsageQuotaScopeEnum
    {
        /// <summary>Every run admitted to the tenant.</summary>
        Tenant,
        /// <summary>Every run for one agent, across its deployments.</summary>
        Agent,
        /// <summary>Every run for one deployment.</summary>
        Deployment
    }
}
