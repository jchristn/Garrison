namespace Garrison.Core.Helpers
{
    using System;
    using Garrison.Core.Codex;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Keeps the credential state of a secret consistent with its value (G-22). Thread-safe (stateless).
    /// </summary>
    public static class SecretValueState
    {
        #region Public-Methods

        /// <summary>
        /// Reset the credential state after an operator sets a new value: the status returns to Ok, the status message
        /// and refresh time are cleared, and the access token expiry is read from the new value (CodexAuthJson only).
        /// </summary>
        /// <param name="secret">Secret whose value was just set.</param>
        /// <param name="value">The new plaintext value.</param>
        /// <exception cref="ArgumentNullException">Thrown when secret is null.</exception>
        public static void Reset(Secret secret, string? value)
        {
            if (secret == null) throw new ArgumentNullException(nameof(secret));
            secret.Status = SecretStatusEnum.Ok;
            secret.StatusMessage = null;
            secret.StatusUtc = null;
            secret.RefreshedUtc = null;
            secret.AccessTokenExpiresUtc = secret.Kind == SecretKindEnum.CodexAuthJson ? CodexAuthDocument.AccessTokenExpiresUtc(value) : null;
        }

        #endregion
    }
}
