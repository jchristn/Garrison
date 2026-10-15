namespace Garrison.Core.Security
{
    using System;
    using System.Security.Cryptography;
    using System.Text;

    /// <summary>
    /// Generates access keys, secret keys, and random tokens from a cryptographic RNG. Thread-safe. Fingerprints of secret
    /// values are keyed with the master key: see <see cref="SecretCipher.Fingerprint"/>.
    /// </summary>
    public static class SecretGenerator
    {
        #region Private-Members

        private static readonly string _Alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        private static int _Last4MinimumLength = 12;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Random alphanumeric string.
        /// </summary>
        /// <param name="length">Length. Minimum 1, maximum 4096.</param>
        /// <returns>Random string.</returns>
        public static string Alphanumeric(int length)
        {
            length = Math.Clamp(length, 1, 4096);
            StringBuilder sb = new StringBuilder(length);
            for (int i = 0; i < length; i++) sb.Append(_Alphanumeric[RandomNumberGenerator.GetInt32(_Alphanumeric.Length)]);
            return sb.ToString();
        }

        /// <summary>
        /// New access key: access_ followed by 32 alphanumeric characters.
        /// </summary>
        /// <returns>Access key.</returns>
        public static string NewAccessKey()
        {
            return "access_" + Alphanumeric(32);
        }

        /// <summary>
        /// New secret key: secret_ followed by 48 alphanumeric characters.
        /// </summary>
        /// <returns>Secret key.</returns>
        public static string NewSecretKey()
        {
            return "secret_" + Alphanumeric(48);
        }

        /// <summary>
        /// Shortest value whose last four characters are shown. Shorter values return an empty string, because four
        /// characters of a short secret give most of it away. Minimum 5, maximum 256, default 12.
        /// </summary>
        public static int Last4MinimumLength
        {
            get
            {
                return _Last4MinimumLength;
            }
            set
            {
                _Last4MinimumLength = Math.Clamp(value, 5, 256);
            }
        }

        /// <summary>
        /// Last four characters of a value, for redacted display.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>Last four characters, or an empty string when the value is shorter than <see cref="Last4MinimumLength"/>.</returns>
        public static string Last4(string? value)
        {
            if (String.IsNullOrEmpty(value) || value.Length < _Last4MinimumLength) return String.Empty;
            return value.Substring(value.Length - 4);
        }

        #endregion
    }
}
