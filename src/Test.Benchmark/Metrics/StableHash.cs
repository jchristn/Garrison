namespace Garrison.Benchmark.Metrics
{
    using System;
    using System.Globalization;
    using System.Text;

    /// <summary>
    /// FNV-1a 64-bit hash of UTF-8 text. Used for anything derived from strings (workspace names, seeds), because
    /// string.GetHashCode is randomized per process. Stateless and thread-safe.
    /// </summary>
    public static class StableHash
    {
        /// <summary>
        /// FNV-1a 64 of text.
        /// </summary>
        /// <param name="text">Text (null hashes as empty).</param>
        /// <returns>Hash.</returns>
        public static ulong Fnv1a64(string? text)
        {
            ulong hash = 14695981039346656037UL;
            byte[] bytes = Encoding.UTF8.GetBytes(text ?? String.Empty);
            for (int i = 0; i < bytes.Length; i++)
            {
                hash ^= bytes[i];
                hash *= 1099511628211UL;
            }
            return hash;
        }

        /// <summary>
        /// The first <paramref name="length"/> lowercase hex characters of the FNV-1a 64 hash.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <param name="length">Characters, 1 to 16. Default 8.</param>
        /// <returns>Hex text.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when length is outside 1 to 16.</exception>
        public static string Hex(string? text, int length = 8)
        {
            if (length < 1 || length > 16) throw new ArgumentOutOfRangeException(nameof(length));
            return Fnv1a64(text).ToString("x16", CultureInfo.InvariantCulture).Substring(0, length);
        }

        /// <summary>
        /// A non-negative 31-bit seed derived from text and a base seed.
        /// </summary>
        /// <param name="baseSeed">Base seed.</param>
        /// <param name="text">Text.</param>
        /// <returns>Seed.</returns>
        public static int Seed(int baseSeed, string? text)
        {
            ulong hash = Fnv1a64(baseSeed.ToString(CultureInfo.InvariantCulture) + "/" + (text ?? String.Empty));
            return (int)(hash & 0x7FFFFFFF);
        }
    }
}
