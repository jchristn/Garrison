namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Transport protocol of a deployment egress rule. The names match the Kubernetes NetworkPolicy protocol values.
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
