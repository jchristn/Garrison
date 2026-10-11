namespace Garrison.Core.Security
{
    using System;
    using System.Security.Cryptography;
    using System.Text;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Encrypts secret values at rest with AES-256-GCM, a random 12-byte nonce per value, and caller-supplied
    /// associated data (normally the record identifier). Output format: base64(version(1) | nonce(12) | tag(16) | ciphertext).
    /// Thread-safe.
    /// </summary>
    public class SecretCipher
    {
        #region Public-Members

        /// <summary>
        /// Key version written with each value.
        /// </summary>
        public int KeyVersion
        {
            get
            {
                return _KeyVersion;
            }
        }

        #endregion

        #region Private-Members

        private readonly byte[] _Key;
        private readonly int _KeyVersion;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="masterKey">Master key: base64 of 32 bytes, or any passphrase (derived with SHA-256).</param>
        /// <param name="keyVersion">Key version. Minimum 1, maximum 255.</param>
        /// <exception cref="ArgumentNullException">Thrown when masterKey is null or empty.</exception>
        public SecretCipher(string masterKey, int keyVersion = 1)
        {
            if (String.IsNullOrEmpty(masterKey)) throw new ArgumentNullException(nameof(masterKey));
            _Key = DeriveKey(masterKey);
            _KeyVersion = Math.Clamp(keyVersion, 1, 255);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Encrypt a value.
        /// </summary>
        /// <param name="plaintext">Plaintext.</param>
        /// <param name="associatedData">Associated data bound to the ciphertext.</param>
        /// <returns>Encoded ciphertext.</returns>
        /// <exception cref="ArgumentNullException">Thrown when plaintext is null.</exception>
        public string Encrypt(string plaintext, string associatedData)
        {
            if (plaintext == null) throw new ArgumentNullException(nameof(plaintext));
            byte[] data = Encoding.UTF8.GetBytes(plaintext);
            byte[] nonce = RandomNumberGenerator.GetBytes(12);
            byte[] tag = new byte[16];
            byte[] cipher = new byte[data.Length];
            using (AesGcm gcm = new AesGcm(_Key, 16))
            {
                gcm.Encrypt(nonce, data, cipher, tag, Encoding.UTF8.GetBytes(associatedData ?? String.Empty));
            }
            byte[] output = new byte[1 + 12 + 16 + cipher.Length];
            output[0] = (byte)_KeyVersion;
            Buffer.BlockCopy(nonce, 0, output, 1, 12);
            Buffer.BlockCopy(tag, 0, output, 13, 16);
            Buffer.BlockCopy(cipher, 0, output, 29, cipher.Length);
            return Convert.ToBase64String(output);
        }

        /// <summary>
        /// Decrypt a value.
        /// </summary>
        /// <param name="encoded">Encoded ciphertext.</param>
        /// <param name="associatedData">Associated data used at encryption.</param>
        /// <returns>Plaintext.</returns>
        /// <exception cref="ArgumentNullException">Thrown when encoded is null or empty.</exception>
        /// <exception cref="CryptographicException">Thrown when the value was tampered with or the key is wrong.</exception>
        public string Decrypt(string encoded, string associatedData)
        {
            if (String.IsNullOrEmpty(encoded)) throw new ArgumentNullException(nameof(encoded));
            try
            {
                string plaintext = DecryptCore(encoded, associatedData);
                GarrisonMetrics.Count(GarrisonMetricCatalog.SecretDecrypts, "result", "ok");
                return plaintext;
            }
            catch (Exception e) when (e is CryptographicException || e is FormatException)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.SecretDecrypts, "result", "error");
                throw;
            }
        }

        #endregion

        #region Private-Methods

        private string DecryptCore(string encoded, string associatedData)
        {
            byte[] raw = Convert.FromBase64String(encoded);
            if (raw.Length < 29) throw new CryptographicException("Encrypted value is truncated.");
            byte[] nonce = new byte[12];
            byte[] tag = new byte[16];
            byte[] cipher = new byte[raw.Length - 29];
            Buffer.BlockCopy(raw, 1, nonce, 0, 12);
            Buffer.BlockCopy(raw, 13, tag, 0, 16);
            Buffer.BlockCopy(raw, 29, cipher, 0, cipher.Length);
            byte[] data = new byte[cipher.Length];
            using (AesGcm gcm = new AesGcm(_Key, 16))
            {
                gcm.Decrypt(nonce, cipher, tag, data, Encoding.UTF8.GetBytes(associatedData ?? String.Empty));
            }
            return Encoding.UTF8.GetString(data);
        }

        private static byte[] DeriveKey(string masterKey)
        {
            try
            {
                byte[] decoded = Convert.FromBase64String(masterKey);
                if (decoded.Length == 32) return decoded;
            }
            catch (FormatException)
            {
            }
            return SHA256.HashData(Encoding.UTF8.GetBytes(masterKey));
        }

        #endregion
    }
}
