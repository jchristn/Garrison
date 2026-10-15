namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why an outbound notification destination is refused (P12.14 SSRF protection).
    /// </summary>
    public enum DestinationBlockReasonEnum
    {
        /// <summary>
        /// The destination is allowed.
        /// </summary>
        None,

        /// <summary>
        /// The URL is not an absolute http or https URL with a host, or it carries user information.
        /// </summary>
        InvalidUrl,

        /// <summary>
        /// The scheme is not http or https.
        /// </summary>
        Scheme,

        /// <summary>
        /// The address is loopback (127.0.0.0/8, ::1) or the host is localhost. Allowed only with Notifications.AllowPrivateDestinations.
        /// </summary>
        Loopback,

        /// <summary>
        /// The address is private (10/8, 172.16/12, 192.168/16, 100.64/10, fc00::/7, fec0::/10). Allowed only with Notifications.AllowPrivateDestinations.
        /// </summary>
        Private,

        /// <summary>
        /// The address is link-local (169.254.0.0/16 including 169.254.169.254, fe80::/10). Always refused.
        /// </summary>
        LinkLocal,

        /// <summary>
        /// The address is unspecified, multicast, broadcast, or reserved. Always refused.
        /// </summary>
        Reserved,

        /// <summary>
        /// The host name did not resolve to any address.
        /// </summary>
        Unresolved
    }
}
