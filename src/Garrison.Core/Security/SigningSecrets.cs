namespace Garrison.Core.Security
{
    using System;
    using System.Security.Cryptography;
    using Garrison.Core.Models;

    /// <summary>
    /// Stores and reads the signing secrets of webhook triggers (P12.5) and notification endpoints (P12.14). Secrets are
    /// encrypted with the cluster secret cipher, bound to the record identifier as associated data, exactly like secret
    /// values. Thread-safe.
    /// </summary>
    public static class SigningSecrets
    {
        #region Public-Methods

        /// <summary>
        /// Encrypt and store a signing secret on a trigger and record its last four characters and rotation time.
        /// </summary>
        /// <param name="trigger">Trigger (its identifier must be final).</param>
        /// <param name="secret">Plaintext secret.</param>
        /// <param name="cipher">Cipher.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        public static void Apply(Trigger trigger, string secret, SecretCipher cipher)
        {
            if (trigger == null) throw new ArgumentNullException(nameof(trigger));
            if (String.IsNullOrEmpty(secret)) throw new ArgumentNullException(nameof(secret));
            if (cipher == null) throw new ArgumentNullException(nameof(cipher));
            trigger.SecretEncrypted = cipher.Encrypt(secret, trigger.Id);
            trigger.SecretKeyVersion = cipher.KeyVersion;
            trigger.SigningSecretLast4 = SecretGenerator.Last4(secret);
            trigger.SigningSecretRotatedUtc = DateTime.UtcNow;
        }

        /// <summary>
        /// Encrypt and store a signing secret on a notification endpoint and record its last four characters and rotation
        /// time.
        /// </summary>
        /// <param name="endpoint">Endpoint (its identifier must be final).</param>
        /// <param name="secret">Plaintext secret.</param>
        /// <param name="cipher">Cipher.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        public static void Apply(NotificationEndpoint endpoint, string secret, SecretCipher cipher)
        {
            if (endpoint == null) throw new ArgumentNullException(nameof(endpoint));
            if (String.IsNullOrEmpty(secret)) throw new ArgumentNullException(nameof(secret));
            if (cipher == null) throw new ArgumentNullException(nameof(cipher));
            endpoint.SecretEncrypted = cipher.Encrypt(secret, endpoint.Id);
            endpoint.SecretKeyVersion = cipher.KeyVersion;
            endpoint.SigningSecretLast4 = SecretGenerator.Last4(secret);
            endpoint.SigningSecretRotatedUtc = DateTime.UtcNow;
        }

        /// <summary>
        /// Decrypt a trigger's signing secret.
        /// </summary>
        /// <param name="trigger">Trigger.</param>
        /// <param name="cipher">Cipher.</param>
        /// <returns>Plaintext, or null when the trigger has no secret or it cannot be decrypted (a changed master key).</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static string? Read(Trigger trigger, SecretCipher cipher)
        {
            if (trigger == null) throw new ArgumentNullException(nameof(trigger));
            return Decrypt(trigger.SecretEncrypted, trigger.Id, cipher);
        }

        /// <summary>
        /// Decrypt a notification endpoint's signing secret.
        /// </summary>
        /// <param name="endpoint">Endpoint.</param>
        /// <param name="cipher">Cipher.</param>
        /// <returns>Plaintext, or null when the endpoint has no secret or it cannot be decrypted (a changed master key).</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static string? Read(NotificationEndpoint endpoint, SecretCipher cipher)
        {
            if (endpoint == null) throw new ArgumentNullException(nameof(endpoint));
            return Decrypt(endpoint.SecretEncrypted, endpoint.Id, cipher);
        }

        /// <summary>
        /// Validate a caller-supplied signing secret: 16 to 256 characters, no leading or trailing whitespace.
        /// </summary>
        /// <param name="secret">Secret.</param>
        /// <returns>Error text, or null when acceptable.</returns>
        public static string? Validate(string? secret)
        {
            if (String.IsNullOrEmpty(secret)) return "A signing secret is required.";
            if (secret.Length < 16 || secret.Length > 256) return "Signing secrets are 16 to 256 characters.";
            if (secret.Trim().Length != secret.Length) return "Signing secrets cannot start or end with whitespace.";
            return null;
        }

        #endregion

        #region Private-Methods

        private static string? Decrypt(string? encrypted, string id, SecretCipher cipher)
        {
            if (cipher == null) throw new ArgumentNullException(nameof(cipher));
            if (String.IsNullOrEmpty(encrypted)) return null;
            try
            {
                return cipher.Decrypt(encrypted, id);
            }
            catch (CryptographicException)
            {
                return null;
            }
            catch (FormatException)
            {
                return null;
            }
        }

        #endregion
    }
}
