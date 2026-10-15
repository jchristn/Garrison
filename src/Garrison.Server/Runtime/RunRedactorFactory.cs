namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Approvals;
    using Garrison.Core.Codex;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;

    /// <summary>
    /// Builds the redactor for text that leaves the control plane about a run (approval previews, P12.3, and transcripts,
    /// P12.27): the literal values of the secrets the run's deployment binds (and the tokens inside a Codex login), then
    /// common credential shapes. Thread-safe.
    /// </summary>
    public class RunRedactorFactory
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RunRedactorFactory(DatabaseDriverBase database, SecretCipher cipher)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build a redactor for a deployment's bound secrets.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deployment">Deployment, or null when it no longer exists (only credential shapes are redacted then).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Redactor. Never null.</returns>
        public async Task<ApprovalRedactor> ForDeploymentAsync(string tenantId, Deployment? deployment, CancellationToken token = default)
        {
            List<string> values = new List<string>();
            if (deployment != null)
            {
                foreach (DeploymentResourceBinding binding in deployment.ResourceBindings.Where(b => b.Kind == ResourceBindingKindEnum.Secret))
                {
                    token.ThrowIfCancellationRequested();
                    Secret? secret = await _Database.Secrets.ReadAsync(tenantId, binding.ResourceId, token).ConfigureAwait(false);
                    if (secret == null || String.IsNullOrEmpty(secret.ValueEncrypted)) continue;
                    try
                    {
                        string value = _Cipher.Decrypt(secret.ValueEncrypted, secret.Id);
                        values.Add(value);
                        CodexAuthFile? file = secret.Kind == SecretKindEnum.CodexAuthJson ? CodexAuthDocument.TryParse(value) : null;
                        if (file?.Tokens != null)
                        {
                            foreach (string? item in new string?[] { file.Tokens.AccessToken, file.Tokens.RefreshToken, file.Tokens.IdToken, file.OpenAiApiKey })
                            {
                                if (!String.IsNullOrEmpty(item)) values.Add(item);
                            }
                        }
                    }
                    catch (Exception e) when (e is CryptographicException || e is FormatException)
                    {
                        // A secret that cannot be decrypted cannot leak through redacted text either.
                    }
                }
            }
            return new ApprovalRedactor(values);
        }

        #endregion
    }
}
