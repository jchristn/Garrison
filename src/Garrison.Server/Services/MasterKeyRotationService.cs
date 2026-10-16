namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;

    /// <summary>
    /// Re-encrypts persisted secret material using the configured active key. Pages are bounded and writes compare
    /// ciphertext before replacing it, so parallel passes and credential refreshes cannot overwrite each other.
    /// All replicas must first be configured with the active key and the previous read keys. Thread-safe.
    /// </summary>
    public class MasterKeyRotationService
    {
        private readonly AdoDatabaseDriver _Database;
        private readonly SecretCipher _Cipher;

        /// <summary>Instantiate.</summary>
        /// <param name="database">Supported SQL database driver.</param>
        /// <param name="cipher">Configured rotation key ring.</param>
        /// <exception cref="ArgumentException">Thrown for an unsupported driver.</exception>
        /// <exception cref="ArgumentNullException">Thrown when cipher is null.</exception>
        public MasterKeyRotationService(DatabaseDriverBase database, SecretCipher cipher)
        {
            _Database = database as AdoDatabaseDriver ?? throw new ArgumentException("Key rotation requires a SQL driver.", nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
        }

        /// <summary>Run a repeatable pass over credentials, harness secrets, trigger and notification signing secrets.</summary>
        /// <param name="token">Cancellation token; committed records remain rotated if cancelled.</param>
        /// <returns>Counts, including conflicts and unreadable records. Retire keys only after a clean pass.</returns>
        public async Task<MasterKeyRotationResponse> RotateAsync(CancellationToken token = default)
        {
            MasterKeyRotationResponse result = new MasterKeyRotationResponse { KeyVersion = _Cipher.KeyVersion };
            await RotateTableAsync("credentials", "secretkeyencrypted", null, false, result, token).ConfigureAwait(false);
            await RotateTableAsync("secrets", "valueencrypted", "keyversion", true, result, token).ConfigureAwait(false);
            await RotateTableAsync("triggers", "secretencrypted", "secretkeyversion", false, result, token).ConfigureAwait(false);
            await RotateTableAsync("notification_endpoints", "secretencrypted", "secretkeyversion", false, result, token).ConfigureAwait(false);
            return result;
        }

        private async Task RotateTableAsync(string table, string column, string? versionColumn, bool fingerprint,
            MasterKeyRotationResponse result, CancellationToken token)
        {
            string reference = _Database.Table(table);
            string cursor = String.Empty;
            while (true)
            {
                token.ThrowIfCancellationRequested();
                List<EncryptedValueRow> page = await _Database.QueryAsync(
                    "SELECT id, " + column + " AS encryptedvalue FROM " + reference
                        + " WHERE id > @cursor AND " + column + " IS NOT NULL AND " + column + " <> '' ORDER BY id LIMIT 100;",
                    command => AdoDatabaseDriver.Add(command, "cursor", cursor),
                    reader => new EncryptedValueRow { Id = reader.GetString(0), Value = reader.GetString(1) }, token).ConfigureAwait(false);
                if (page.Count == 0) return;
                foreach (EncryptedValueRow row in page)
                {
                    token.ThrowIfCancellationRequested();
                    result.Scanned++;
                    cursor = row.Id;
                    try
                    {
                        byte[] encoded = Convert.FromBase64String(row.Value);
                        // Authenticate even current-version values so a clean pass proves they are readable.
                        string plain = _Cipher.Decrypt(row.Value, row.Id);
                        if (encoded[0] == _Cipher.KeyVersion) continue;
                        string encrypted = _Cipher.Encrypt(plain, row.Id);
                        string assignments = column + " = @encrypted";
                        if (versionColumn != null) assignments += ", " + versionColumn + " = @version";
                        if (fingerprint) assignments += ", fingerprint = @fingerprint";
                        int changed = await _Database.NonQueryAsync("UPDATE " + reference + " SET " + assignments
                            + " WHERE id = @id AND " + column + " = @previous;", command =>
                            {
                                AdoDatabaseDriver.Add(command, "encrypted", encrypted);
                                AdoDatabaseDriver.Add(command, "id", row.Id);
                                AdoDatabaseDriver.Add(command, "previous", row.Value);
                                if (versionColumn != null) AdoDatabaseDriver.Add(command, "version", _Cipher.KeyVersion);
                                if (fingerprint) AdoDatabaseDriver.Add(command, "fingerprint", _Cipher.Fingerprint(plain));
                            }, token).ConfigureAwait(false);
                        if (changed == 1) result.Rotated++; else result.Conflicts++;
                    }
                    catch (Exception e) when (e is CryptographicException || e is FormatException)
                    {
                        result.Failed++;
                    }
                }
            }
        }
    }
}
