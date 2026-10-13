namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Ordered executor isolation levels; higher levels satisfy lower requirements.
    /// </summary>
    public enum ExecutorIsolationEnum
    {
        /// <summary>Process.</summary>
        Process = 0,
        /// <summary>Container.</summary>
        Container = 1,
        /// <summary>SandboxedRuntime.</summary>
        SandboxedRuntime = 2
    }
}
