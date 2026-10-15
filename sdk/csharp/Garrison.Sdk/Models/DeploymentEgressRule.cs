namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One entry of a deployment's egress allowlist: a destination CIDR block, an optional port, and a protocol. Host
    /// names are not accepted; resolve them to CIDR blocks first. The server rejects an invalid CIDR (field code
    /// InvalidCidr) or a port outside 1 to 65535 (field code PortOutOfRange).
    /// </summary>
    public class DeploymentEgressRule
    {
        #region Public-Members

        /// <summary>
        /// Destination block in CIDR notation, IPv4 (for example 203.0.113.0/24) or IPv6 (for example 2001:db8::/32). The
        /// address must be the network address of the block. Required; never null (null is stored as an empty string).
        /// </summary>
        public string Cidr
        {
            get { return _Cidr; }
            set { _Cidr = value ?? String.Empty; }
        }

        /// <summary>
        /// Destination port, 1 to 65535. Null allows every port of the block for the protocol.
        /// </summary>
        public int? Port { get; set; } = null;

        /// <summary>
        /// Protocol, TCP (the default) or UDP.
        /// </summary>
        public EgressProtocolEnum Protocol { get; set; } = EgressProtocolEnum.TCP;

        #endregion

        #region Private-Members

        private string _Cidr = String.Empty;

        #endregion
    }
}
