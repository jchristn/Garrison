namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One entry of a deployment's egress allowlist (P11.15, D-035, D-052): a destination CIDR block, an optional port,
    /// and a protocol. When a deployment has any egress rules, its run pods may reach only DNS, the Garrison server MCP
    /// port, and these rules; the default HTTPS-to-anywhere rule does not apply to them. Host names are not accepted:
    /// operators resolve them to CIDR blocks. Validation (ConfigurationValidator) rejects an invalid CIDR (field code
    /// InvalidCidr) or a port outside 1 to 65535 (PortOutOfRange). Not thread-safe; treat as a value object.
    /// </summary>
    public class DeploymentEgressRule
    {
        #region Public-Members

        /// <summary>
        /// Destination block in CIDR notation, IPv4 (for example <c>203.0.113.0/24</c> or <c>198.51.100.7/32</c>) or IPv6
        /// (for example <c>2001:db8::/32</c>). Required. The address must be the network address of the block (no bits
        /// set after the prefix length), IPv4 octets must not have leading zeros, and IPv4-mapped IPv6 addresses are
        /// rejected; Kubernetes applies the same rules. Never null; null is stored as an empty string and fails
        /// validation. Surrounding white space is removed.
        /// </summary>
        public string Cidr
        {
            get
            {
                return _Cidr;
            }
            set
            {
                _Cidr = value == null ? String.Empty : value.Trim();
            }
        }

        /// <summary>
        /// Destination port, 1 to 65535. Null allows every port of the block for the protocol. Values outside the range
        /// are kept as given and rejected by validation (field code PortOutOfRange) rather than clamped, because a
        /// clamped port would allow a different destination than the one asked for.
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

        #region Public-Methods

        /// <summary>
        /// An independent copy.
        /// </summary>
        /// <returns>Copy.</returns>
        public DeploymentEgressRule Clone()
        {
            DeploymentEgressRule copy = new DeploymentEgressRule();
            copy.Cidr = Cidr;
            copy.Port = Port;
            copy.Protocol = Protocol;
            return copy;
        }

        #endregion
    }
}
