namespace Garrison.Core.Helpers
{
    using System;
    using System.Globalization;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Validation of Kubernetes names and resource quantities used in deployment and workspace settings. Stateless and thread-safe.
    /// </summary>
    public static class KubernetesNames
    {
        #region Private-Members

        private static readonly Regex _Quantity = new Regex("^[+]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)(m|k|M|G|T|P|E|Ki|Mi|Gi|Ti|Pi|Ei|[eE][+-]?[0-9]+)?$", RegexOptions.CultureInvariant);
        private static readonly Regex _Subdomain = new Regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$", RegexOptions.CultureInvariant);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a value is a Kubernetes resource quantity (for example 500m, 2, 1.5, 512Mi, 4Gi, 1e3).
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>True when valid; false for null or empty.</returns>
        public static bool IsQuantity(string? value)
        {
            if (String.IsNullOrWhiteSpace(value)) return false;
            return value.Length <= 64 && _Quantity.IsMatch(value);
        }

        /// <summary>
        /// Parse a Kubernetes quantity into its value (500m is 0.5, 1Ki is 1024, 1M is 1000000, 1e3 is 1000).
        /// </summary>
        /// <param name="value">Quantity.</param>
        /// <param name="parsed">Value, or 0 when invalid.</param>
        /// <returns>True when valid.</returns>
        public static bool TryParseQuantity(string? value, out decimal parsed)
        {
            parsed = 0;
            if (!IsQuantity(value)) return false;
            string text = value!.TrimStart('+');
            decimal multiplier = 1;
            string[] binary = { "Ki", "Mi", "Gi", "Ti", "Pi", "Ei" };
            string[] metric = { "k", "M", "G", "T", "P", "E" };
            bool matched = false;
            for (int i = 0; i < binary.Length && !matched; i++)
            {
                if (!text.EndsWith(binary[i], StringComparison.Ordinal)) continue;
                multiplier = 1;
                for (int j = 0; j <= i; j++) multiplier *= 1024m;
                text = text.Substring(0, text.Length - 2);
                matched = true;
            }
            for (int i = 0; i < metric.Length && !matched; i++)
            {
                if (!text.EndsWith(metric[i], StringComparison.Ordinal)) continue;
                multiplier = 1;
                for (int j = 0; j <= i; j++) multiplier *= 1000m;
                text = text.Substring(0, text.Length - 1);
                matched = true;
            }
            if (!matched && text.EndsWith("m", StringComparison.Ordinal))
            {
                multiplier = 0.001m;
                text = text.Substring(0, text.Length - 1);
            }
            try
            {
                parsed = Decimal.Parse(text, NumberStyles.Float, CultureInfo.InvariantCulture) * multiplier;
                return true;
            }
            catch (Exception e) when (e is FormatException || e is OverflowException)
            {
                parsed = 0;
                return false;
            }
        }

        /// <summary>
        /// Whether a value is a DNS-1123 subdomain, the format of PersistentVolumeClaim, Secret, and namespace names
        /// (lowercase letters, digits, '-' and '.', starting and ending with a letter or digit, at most 253 characters).
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>True when valid; false for null or empty.</returns>
        public static bool IsSubdomain(string? value)
        {
            if (String.IsNullOrEmpty(value)) return false;
            return value.Length <= 253 && _Subdomain.IsMatch(value);
        }

        #endregion
    }
}
