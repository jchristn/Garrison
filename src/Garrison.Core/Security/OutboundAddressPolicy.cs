namespace Garrison.Core.Security
{
    using System;
    using System.Net;
    using System.Net.Sockets;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Addresses the control plane never contacts on a tenant's behalf: unspecified (0.0.0.0/8, ::), link-local
    /// (169.254.0.0/16, fe80::/10), which includes the cloud instance metadata services (169.254.169.254 and
    /// fd00:ec2::254), multicast, and broadcast. IPv4-mapped IPv6 addresses are checked as IPv4. Loopback and private
    /// ranges are allowed because MCP servers and object stores commonly run on them inside a cluster. Thread-safe.
    /// </summary>
    public static class OutboundAddressPolicy
    {
        #region Public-Methods

        /// <summary>
        /// Whether an address is always refused.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <returns>True when refused.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        public static bool IsAlwaysBlocked(IPAddress address)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();

            if (address.AddressFamily == AddressFamily.InterNetwork)
            {
                byte[] b = address.GetAddressBytes();
                if (b[0] == 0) return true;
                if (b[0] == 169 && b[1] == 254) return true;
                if (b[0] >= 224) return true;
                return false;
            }

            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                if (address.Equals(IPAddress.IPv6None) || address.Equals(IPAddress.IPv6Any)) return true;
                if (address.IsIPv6LinkLocal || address.IsIPv6Multicast) return true;
                if (address.Equals(IPAddress.Parse("fd00:ec2::254"))) return true;
                return false;
            }

            return true;
        }

        /// <summary>
        /// Why a URL's host is refused when it is an IP literal, without resolving names.
        /// </summary>
        /// <param name="uri">Absolute URL.</param>
        /// <returns>The reason, or null when the host is a name or an allowed address.</returns>
        /// <exception cref="ArgumentNullException">Thrown when uri is null.</exception>
        public static string? LiteralBlockedReason(Uri uri)
        {
            if (uri == null) throw new ArgumentNullException(nameof(uri));
            if (!IPAddress.TryParse(HostOf(uri), out IPAddress? literal)) return null;
            return IsAlwaysBlocked(literal) ? Reason(uri.Host, literal) : null;
        }

        /// <summary>
        /// Why a URL's host is refused: an IP literal or any address its name resolves to is always blocked. A name that
        /// does not resolve is not refused here; the connection attempt reports that failure. The check happens before
        /// connecting, so it does not stop a name whose answer changes between this lookup and the connection.
        /// </summary>
        /// <param name="uri">Absolute URL.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The reason, or null when the destination is allowed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when uri is null.</exception>
        public static async Task<string?> BlockedReasonAsync(Uri uri, CancellationToken token = default)
        {
            if (uri == null) throw new ArgumentNullException(nameof(uri));
            string? literal = LiteralBlockedReason(uri);
            if (literal != null) return literal;
            if (IPAddress.TryParse(HostOf(uri), out IPAddress? _)) return null;

            IPAddress[] addresses;
            try
            {
                addresses = await Dns.GetHostAddressesAsync(HostOf(uri), token).ConfigureAwait(false);
            }
            catch (SocketException)
            {
                return null;
            }
            foreach (IPAddress address in addresses)
            {
                if (IsAlwaysBlocked(address)) return Reason(uri.Host, address);
            }
            return null;
        }

        #endregion

        #region Private-Methods

        private static string HostOf(Uri uri)
        {
            if (uri.HostNameType == UriHostNameType.IPv6) return uri.Host.Trim('[', ']');
            return uri.IdnHost;
        }

        private static string Reason(string host, IPAddress address)
        {
            return "Host " + host + " resolves to " + address + ", a link-local, unspecified, or multicast address (such as a cloud metadata service) that Garrison does not contact.";
        }

        #endregion
    }
}
