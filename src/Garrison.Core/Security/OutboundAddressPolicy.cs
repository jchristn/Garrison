namespace Garrison.Core.Security
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Net;
    using System.Net.Http;
    using System.Net.Sockets;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Addresses Garrison never contacts on a tenant's behalf: unspecified (0.0.0.0/8, ::), link-local (169.254.0.0/16,
    /// fe80::/10), which includes the cloud instance metadata services (169.254.169.254 and fd00:ec2::254), multicast, and
    /// broadcast. IPv4-mapped IPv6 addresses are checked as IPv4. Loopback and private ranges are allowed by default
    /// because MCP servers and object stores commonly run on them inside a cluster; a caller that sends to destinations a
    /// tenant chooses on the open internet (for example webhooks) can refuse them as well with allowPrivateNetworks false.
    /// <para>
    /// Use <see cref="CreateHandler"/> for any HttpClient that reaches a tenant-chosen URL. Its connect callback resolves
    /// the host itself and connects only to an address that passes the policy, so the check cannot be bypassed by a DNS
    /// answer that changes between check and connect (DNS rebinding), and it never follows redirects. Thread-safe.
    /// </para>
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
        /// Whether an address is loopback (127.0.0.0/8, ::1) or private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, the
        /// shared address space 100.64.0.0/10, and unique local IPv6 fc00::/7. IPv4-mapped IPv6 addresses are checked as IPv4.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <returns>True for loopback and private addresses.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        public static bool IsLoopbackOrPrivate(IPAddress address)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
            if (IPAddress.IsLoopback(address)) return true;
            if (address.AddressFamily == AddressFamily.InterNetwork)
            {
                byte[] b = address.GetAddressBytes();
                if (b[0] == 10) return true;
                if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true;
                if (b[0] == 192 && b[1] == 168) return true;
                if (b[0] == 100 && b[1] >= 64 && b[1] <= 127) return true;
                return false;
            }
            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                byte first = address.GetAddressBytes()[0];
                return (first & 0xFE) == 0xFC;
            }
            return false;
        }

        /// <summary>
        /// Whether an address is refused: always for <see cref="IsAlwaysBlocked"/> addresses, and also for loopback and
        /// private addresses when allowPrivateNetworks is false.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <param name="allowPrivateNetworks">Whether loopback and private ranges are allowed.</param>
        /// <returns>True when refused.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        public static bool IsBlocked(IPAddress address, bool allowPrivateNetworks)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            if (IsAlwaysBlocked(address)) return true;
            return !allowPrivateNetworks && IsLoopbackOrPrivate(address);
        }

        /// <summary>
        /// An HTTP handler for requests to tenant-chosen URLs. It never follows redirects, never uses a proxy (a proxy would
        /// make the connect-time check apply to the proxy instead of the destination), and its connect callback resolves the
        /// host and connects only to an address <see cref="IsBlocked"/> allows, failing with
        /// <see cref="OutboundAddressBlockedException"/> (inside an HttpRequestException) otherwise. The caller owns the
        /// handler; pass it to an HttpClient with disposeHandler true, or to any library that accepts a handler.
        /// </summary>
        /// <param name="allowPrivateNetworks">Whether loopback and private ranges are allowed. Default true, for MCP servers
        /// and object stores inside a cluster; pass false for destinations that should only be on the public internet.</param>
        /// <returns>Handler.</returns>
        public static SocketsHttpHandler CreateHandler(bool allowPrivateNetworks = true)
        {
            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.AllowAutoRedirect = false;
            handler.UseProxy = false;
            handler.ConnectCallback = (context, token) => new ValueTask<Stream>(ConnectAsync(context.DnsEndPoint, allowPrivateNetworks, token));
            return handler;
        }

        /// <summary>
        /// Open a TCP connection to an endpoint after resolving its host and refusing blocked addresses. Each allowed address
        /// is tried in the order DNS returned them; blocked addresses are skipped. Used by <see cref="CreateHandler"/>, and
        /// usable directly by any client that accepts a connect callback.
        /// </summary>
        /// <param name="endpoint">Host and port.</param>
        /// <param name="allowPrivateNetworks">Whether loopback and private ranges are allowed.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Connected stream that owns its socket.</returns>
        /// <exception cref="ArgumentNullException">Thrown when endpoint is null.</exception>
        /// <exception cref="OutboundAddressBlockedException">Thrown when every resolved address is blocked.</exception>
        /// <exception cref="SocketException">Thrown when the host does not resolve or no allowed address accepts the connection.</exception>
        public static async Task<Stream> ConnectAsync(DnsEndPoint endpoint, bool allowPrivateNetworks, CancellationToken token)
        {
            if (endpoint == null) throw new ArgumentNullException(nameof(endpoint));
            string host = endpoint.Host.Trim('[', ']');
            IPAddress[] resolved = IPAddress.TryParse(host, out IPAddress? literal)
                ? new IPAddress[] { literal }
                : await Dns.GetHostAddressesAsync(host, token).ConfigureAwait(false);

            List<IPAddress> allowed = new List<IPAddress>();
            IPAddress? firstBlocked = null;
            foreach (IPAddress address in resolved)
            {
                if (IsBlocked(address, allowPrivateNetworks))
                {
                    if (firstBlocked == null) firstBlocked = address;
                    continue;
                }
                allowed.Add(address);
            }
            if (allowed.Count == 0)
            {
                string why = firstBlocked == null
                    ? "Host " + host + " did not resolve to any address."
                    : (IsAlwaysBlocked(firstBlocked) ? Reason(host, firstBlocked) : "Host " + host + " resolves to " + firstBlocked + ", a loopback or private address, which this destination may not use.");
                throw new OutboundAddressBlockedException(host, firstBlocked, why);
            }

            SocketException? last = null;
            foreach (IPAddress address in allowed)
            {
                token.ThrowIfCancellationRequested();
                Socket socket = new Socket(address.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
                socket.NoDelay = true;
                try
                {
                    await socket.ConnectAsync(new IPEndPoint(address, endpoint.Port), token).ConfigureAwait(false);
                    return new NetworkStream(socket, true);
                }
                catch (SocketException e)
                {
                    socket.Dispose();
                    last = e;
                }
                catch
                {
                    socket.Dispose();
                    throw;
                }
            }
            throw last ?? new SocketException((int)SocketError.HostUnreachable);
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
        /// connecting, so it does not stop a name whose answer changes between this lookup and the connection: use it to
        /// fail fast with a clear message, and <see cref="CreateHandler"/> for the connection itself.
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
