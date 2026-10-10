namespace Garrison.Core.Security
{
    using System;
    using System.Security.Cryptography;
    using System.Text;

    /// <summary>
    /// Password hashing (SHA-256, lowercase hex, per AUTHENTICATION.md) and constant-time comparison. Thread-safe.
    /// </summary>
    public static class PasswordHasher
    {
        /// <summary>
        /// Hash a password.
        /// </summary>
        /// <param name="password">Password.</param>
        /// <returns>Lowercase hex SHA-256.</returns>
        /// <exception cref="ArgumentNullException">Thrown when password is null.</exception>
        public static string Hash(string password)
        {
            if (password == null) throw new ArgumentNullException(nameof(password));
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password))).ToLowerInvariant();
        }

        /// <summary>
        /// Verify a password against a stored hash in constant time.
        /// </summary>
        /// <param name="password">Candidate password.</param>
        /// <param name="hash">Stored hash.</param>
        /// <returns>True when they match.</returns>
        public static bool Verify(string? password, string? hash)
        {
            if (password == null || String.IsNullOrEmpty(hash)) return false;
            return FixedTimeEquals(Hash(password), hash.ToLowerInvariant());
        }

        /// <summary>
        /// Constant-time string comparison.
        /// </summary>
        /// <param name="a">First value.</param>
        /// <param name="b">Second value.</param>
        /// <returns>True when equal.</returns>
        public static bool FixedTimeEquals(string? a, string? b)
        {
            if (a == null || b == null) return false;
            return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));
        }
    }
}
