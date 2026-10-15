namespace Garrison.Core.Helpers
{
    using System;
    using System.Net;
    using System.Net.Sockets;

    /// <summary>
    /// Validation of CIDR blocks used in deployment egress rules (P11.15). Accepts what a Kubernetes NetworkPolicy
    /// ipBlock accepts under strict validation: an IPv4 or IPv6 network address followed by a prefix length, with no
    /// bits set after the prefix, no leading zeros in IPv4 octets, and no IPv4-mapped IPv6 addresses. Stateless and
    /// thread-safe.
    /// </summary>
    public static class CidrNotation
    {
        #region Public-Methods

        /// <summary>
        /// Whether a value is a valid CIDR block.
        /// </summary>
        /// <param name="value">Value, for example 203.0.113.0/24 or 2001:db8::/32.</param>
        /// <param name="error">Why the value is invalid, or null when it is valid.</param>
        /// <returns>True when valid.</returns>
        public static bool IsValid(string? value, out string? error)
        {
            error = null;
            if (String.IsNullOrWhiteSpace(value))
            {
                error = "A CIDR block is required, for example 203.0.113.0/24 or 2001:db8::/32.";
                return false;
            }
            string text = value.Trim();
            int slash = text.IndexOf('/');
            if (slash <= 0 || slash != text.LastIndexOf('/') || slash == text.Length - 1)
            {
                error = "Use CIDR notation with a prefix length, for example 203.0.113.0/24 or 198.51.100.7/32. Host names are not accepted; resolve them to addresses first.";
                return false;
            }
            string addressText = text.Substring(0, slash);
            string prefixText = text.Substring(slash + 1);
            if (addressText.Contains('%'))
            {
                error = "IPv6 zone identifiers are not allowed in a CIDR block.";
                return false;
            }
            if (!IPAddress.TryParse(addressText, out IPAddress? address) || address == null)
            {
                error = "'" + addressText + "' is not an IPv4 or IPv6 address. Host names are not accepted; resolve them to addresses first.";
                return false;
            }
            int maxPrefix = address.AddressFamily == AddressFamily.InterNetwork ? 32 : 128;
            if (prefixText.Length == 0 || prefixText.Length > 3 || !Int32.TryParse(prefixText, System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out int prefix) || prefix > maxPrefix || (prefixText.Length > 1 && prefixText[0] == '0'))
            {
                error = "The prefix length must be a number from 0 to " + maxPrefix + ".";
                return false;
            }
            if (address.AddressFamily == AddressFamily.InterNetwork)
            {
                if (!String.Equals(address.ToString(), addressText, StringComparison.Ordinal))
                {
                    error = "Write the IPv4 address as four decimal numbers without leading zeros, for example 10.0.0.0/8.";
                    return false;
                }
            }
            else if (address.IsIPv4MappedToIPv6)
            {
                error = "IPv4-mapped IPv6 addresses are not allowed; write the IPv4 block instead.";
                return false;
            }
            byte[] bytes = address.GetAddressBytes();
            for (int bit = prefix; bit < bytes.Length * 8; bit++)
            {
                if ((bytes[bit / 8] & (0x80 >> (bit % 8))) != 0)
                {
                    error = "The address has bits set after the /" + prefix + " prefix; use the network address " + Network(bytes, prefix) + "/" + prefix + ".";
                    return false;
                }
            }
            return true;
        }

        #endregion

        #region Private-Methods

        private static string Network(byte[] bytes, int prefix)
        {
            byte[] masked = (byte[])bytes.Clone();
            for (int bit = prefix; bit < masked.Length * 8; bit++) masked[bit / 8] = (byte)(masked[bit / 8] & ~(0x80 >> (bit % 8)));
            return new IPAddress(masked).ToString();
        }

        #endregion
    }
}
