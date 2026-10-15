namespace Garrison.Core.Enums
{
    /// <summary>
    /// Transport protocol of a deployment egress rule (P11.15). The names match the Kubernetes NetworkPolicy protocol
    /// values, so manifests and the run pod's NetworkPolicy use the same spelling.
    /// </summary>
    public enum EgressProtocolEnum
    {
        /// <summary>
        /// TCP. The default.
        /// </summary>
        TCP = 0,

        /// <summary>
        /// UDP.
        /// </summary>
        UDP = 1
    }
}
