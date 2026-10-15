namespace Garrison.Core.Helpers
{
    using System;
    using System.Net;
    using System.Net.Sockets;
    using Garrison.Core.Enums;

    /// <summary>
    /// SSRF rules for outbound notification destinations (P12.14). A URL must be absolute http or https with a host and
    /// no user information. An address is refused when it is loopback or private (unless private destinations are
    /// allowed), or link-local (169.254.0.0/16, which holds cloud metadata services, and fe80::/10), unspecified,
    /// multicast, broadcast, or reserved (always). IPv4-mapped, IPv4-compatible, and NAT64 (64:ff9b::/96) IPv6 addresses
    /// are judged by the IPv4 address they carry. The URL check runs when an endpoint is saved; the address check runs
    /// again on every connection, after DNS resolution, so a host that later resolves to a refused address (DNS
    /// rebinding) is still refused. Thread-safe.
    /// </summary>
    public static class DestinationGuard
    {
        #region Private-Members

        private static readonly IPAddress AwsMetadataV6 = IPAddress.Parse("fd00:ec2::254");

        #endregion

        #region Public-Methods

        /// <summary>
        /// Check a destination URL without resolving its host: syntax, scheme, user information, the host localhost, and
        /// IP literals.
        /// </summary>
        /// <param name="url">URL.</param>
        /// <param name="allowPrivate">Whether loopback and private destinations are allowed.</param>
        /// <param name="uri">Parsed URL when the syntax is valid, otherwise null.</param>
        /// <returns>None when allowed, otherwise the reason.</returns>
        public static DestinationBlockReasonEnum CheckUrl(string? url, bool allowPrivate, out Uri? uri)
        {
            uri = null;
            if (String.IsNullOrWhiteSpace(url) || url.Length > 2048) return DestinationBlockReasonEnum.InvalidUrl;
            // A string without a scheme is not a URL (on Unix, Uri would read "/path" as a file URL).
            if (!url.Contains("://", StringComparison.Ordinal)) return DestinationBlockReasonEnum.InvalidUrl;
            if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out Uri? parsed)) return DestinationBlockReasonEnum.InvalidUrl;
            if (!String.Equals(parsed.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) && !String.Equals(parsed.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                return DestinationBlockReasonEnum.Scheme;
            }
            if (String.IsNullOrEmpty(parsed.Host) || !String.IsNullOrEmpty(parsed.UserInfo)) return DestinationBlockReasonEnum.InvalidUrl;
            uri = parsed;

            string host = parsed.DnsSafeHost.TrimEnd('.');
            if (String.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase) || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
            {
                return allowPrivate ? DestinationBlockReasonEnum.None : DestinationBlockReasonEnum.Loopback;
            }
            if (IPAddress.TryParse(host, out IPAddress? literal)) return CheckAddress(literal, allowPrivate);
            return DestinationBlockReasonEnum.None;
        }

        /// <summary>
        /// Check one resolved address.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <param name="allowPrivate">Whether loopback and private destinations are allowed.</param>
        /// <returns>None when allowed, otherwise the reason.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        public static DestinationBlockReasonEnum CheckAddress(IPAddress address, bool allowPrivate)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            DestinationBlockReasonEnum reason = Classify(address);
            if (reason == DestinationBlockReasonEnum.Loopback || reason == DestinationBlockReasonEnum.Private) return allowPrivate ? DestinationBlockReasonEnum.None : reason;
            return reason;
        }

        /// <summary>
        /// Classify one address regardless of policy: Loopback, Private (RFC 1918, 100.64.0.0/10, fc00::/7), LinkLocal
        /// (169.254.0.0/16, fe80::/10, and the AWS IPv6 metadata address fd00:ec2::254), Reserved (unspecified, multicast,
        /// and other special-purpose ranges), or None for a public address. IPv4-mapped, IPv4-compatible, and NAT64
        /// (64:ff9b::/96) IPv6 addresses are classified by their embedded IPv4 address. This is the single address
        /// classification for every outbound check, including <see cref="Garrison.Core.Security.OutboundAddressPolicy"/>.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <returns>Classification.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        public static DestinationBlockReasonEnum Classify(IPAddress address)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                IPAddress? embedded = EmbeddedIPv4(address);
                if (embedded != null) return ClassifyV4(embedded.GetAddressBytes());
                return ClassifyV6(address);
            }
            if (address.AddressFamily == AddressFamily.InterNetwork) return ClassifyV4(address.GetAddressBytes());
            return DestinationBlockReasonEnum.Reserved;
        }

        #endregion

        #region Private-Methods

        private static IPAddress? EmbeddedIPv4(IPAddress address)
        {
            if (address.IsIPv4MappedToIPv6) return address.MapToIPv4();
            byte[] b = address.GetAddressBytes();
            bool zeroPrefix = true;
            for (int i = 0; i < 12; i++)
            {
                if (b[i] != 0) zeroPrefix = false;
            }

            // IPv4-compatible (::a.b.c.d, deprecated); :: and ::1 themselves are handled as IPv6.
            if (zeroPrefix && !(b[12] == 0 && b[13] == 0 && b[14] == 0 && b[15] <= 1)) return new IPAddress(new byte[] { b[12], b[13], b[14], b[15] });

            // NAT64 well-known prefix 64:ff9b::/96.
            if (b[0] == 0x00 && b[1] == 0x64 && b[2] == 0xff && b[3] == 0x9b)
            {
                bool middleZero = true;
                for (int i = 4; i < 12; i++)
                {
                    if (b[i] != 0) middleZero = false;
                }
                if (middleZero) return new IPAddress(new byte[] { b[12], b[13], b[14], b[15] });
            }
            return null;
        }

        private static DestinationBlockReasonEnum ClassifyV4(byte[] b)
        {
            if (b[0] == 127) return DestinationBlockReasonEnum.Loopback;
            if (b[0] == 169 && b[1] == 254) return DestinationBlockReasonEnum.LinkLocal;
            if (b[0] == 10) return DestinationBlockReasonEnum.Private;
            if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return DestinationBlockReasonEnum.Private;
            if (b[0] == 192 && b[1] == 168) return DestinationBlockReasonEnum.Private;
            if (b[0] == 100 && b[1] >= 64 && b[1] <= 127) return DestinationBlockReasonEnum.Private;
            if (b[0] == 0) return DestinationBlockReasonEnum.Reserved;
            if (b[0] >= 224) return DestinationBlockReasonEnum.Reserved;
            if (b[0] == 192 && b[1] == 0 && b[2] == 0) return DestinationBlockReasonEnum.Reserved;
            if (b[0] == 198 && (b[1] == 18 || b[1] == 19)) return DestinationBlockReasonEnum.Reserved;
            return DestinationBlockReasonEnum.None;
        }

        private static DestinationBlockReasonEnum ClassifyV6(IPAddress address)
        {
            if (address.Equals(IPAddress.IPv6Loopback)) return DestinationBlockReasonEnum.Loopback;
            if (address.Equals(IPAddress.IPv6Any) || address.Equals(IPAddress.IPv6None)) return DestinationBlockReasonEnum.Reserved;
            if (address.IsIPv6LinkLocal || address.Equals(AwsMetadataV6)) return DestinationBlockReasonEnum.LinkLocal;
            if (address.IsIPv6Multicast) return DestinationBlockReasonEnum.Reserved;
            if (address.IsIPv6SiteLocal) return DestinationBlockReasonEnum.Private;
            byte[] b = address.GetAddressBytes();
            if ((b[0] & 0xfe) == 0xfc) return DestinationBlockReasonEnum.Private;
            return DestinationBlockReasonEnum.None;
        }

        #endregion
    }
}
