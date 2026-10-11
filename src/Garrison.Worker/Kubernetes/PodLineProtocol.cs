namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Globalization;
    using System.Security.Cryptography;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Wire format of the run pod's stdout protocol (plan D-033). Each message is one line:
    /// <c>@@garrison:&lt;nonce&gt;:&lt;sequence&gt; &lt;json&gt;</c>, where the nonce is a random value the worker
    /// generates per run and passes to the pod only inside the spec Secret, the sequence increases from 1, and the JSON
    /// is a <see cref="PodLine"/>. JSON never contains a raw newline, so text inside an event cannot start a line of
    /// its own, and a line without the run's exact nonce is ignored. Stateless and thread-safe.
    /// </summary>
    public static class PodLineProtocol
    {
        #region Public-Members

        /// <summary>
        /// Marker every protocol line starts with, before the nonce.
        /// </summary>
        public static readonly string Marker = "@@garrison:";

        /// <summary>
        /// Length of a generated nonce in bytes (hex encoded to twice as many characters).
        /// </summary>
        public static readonly int NonceBytes = 32;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Generate a random nonce (64 lowercase hex characters).
        /// </summary>
        /// <returns>Nonce.</returns>
        public static string NewNonce()
        {
            return Convert.ToHexString(RandomNumberGenerator.GetBytes(NonceBytes)).ToLowerInvariant();
        }

        /// <summary>
        /// The line prefix for a nonce, up to the sequence number.
        /// </summary>
        /// <param name="nonce">Nonce.</param>
        /// <returns>Prefix.</returns>
        /// <exception cref="ArgumentException">Thrown when the nonce is empty or contains characters other than letters and digits.</exception>
        public static string Prefix(string nonce)
        {
            ValidateNonce(nonce);
            return Marker + nonce + ":";
        }

        /// <summary>
        /// Format one protocol line (without the trailing newline).
        /// </summary>
        /// <param name="nonce">Nonce.</param>
        /// <param name="sequence">Sequence number, at least 1.</param>
        /// <param name="line">Message.</param>
        /// <returns>Line.</returns>
        /// <exception cref="ArgumentNullException">Thrown when line is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the sequence is below 1.</exception>
        public static string Format(string nonce, long sequence, PodLine line)
        {
            if (line == null) throw new ArgumentNullException(nameof(line));
            if (sequence < 1) throw new ArgumentOutOfRangeException(nameof(sequence), "Sequence numbers start at 1.");
            return Prefix(nonce) + sequence.ToString(CultureInfo.InvariantCulture) + " " + Serializer.Serialize(line);
        }

        /// <summary>
        /// Validate a nonce: 16 to 256 ASCII letters and digits.
        /// </summary>
        /// <param name="nonce">Nonce.</param>
        /// <exception cref="ArgumentException">Thrown when invalid.</exception>
        public static void ValidateNonce(string nonce)
        {
            if (String.IsNullOrEmpty(nonce) || nonce.Length < 16 || nonce.Length > 256) throw new ArgumentException("The run pod nonce must be 16 to 256 letters and digits.", nameof(nonce));
            foreach (char c in nonce)
            {
                if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))) throw new ArgumentException("The run pod nonce must contain only letters and digits.", nameof(nonce));
            }
        }

        #endregion
    }
}
