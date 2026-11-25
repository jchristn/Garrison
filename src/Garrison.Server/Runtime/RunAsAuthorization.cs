namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Server.Services;

    /// <summary>
    /// Checks that a stored run-as principal (a user, a credential, or an administrator) may still run an agent before a
    /// background start such as a keeper tick (AA1.5). A deactivated or deleted principal, or one that lost Agent Execute,
    /// is refused with a message that says how to fix it. Thread-safe.
    /// </summary>
    public class RunAsAuthorization
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly AuthorizationService _Authorization;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="authorization">Authorization service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public RunAsAuthorization(DatabaseDriverBase database, AuthorizationService authorization)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Authorization = authorization ?? throw new ArgumentNullException(nameof(authorization));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Check a principal against an agent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runAsType">Principal type.</param>
        /// <param name="runAsId">User or credential identifier, or null for an administrator.</param>
        /// <param name="runAsName">Display name for messages, or null.</param>
        /// <param name="agentId">Agent to run.</param>
        /// <param name="what">Owner description for messages, for example "Mandate gerbil-keeper".</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Null when permitted, otherwise the reason.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, agentId, or what is null or empty.</exception>
        public async Task<string?> DeniedAsync(string tenantId, PrincipalTypeEnum runAsType, string? runAsId, string? runAsName, string agentId, string what, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            if (String.IsNullOrEmpty(what)) throw new ArgumentNullException(nameof(what));
            if (runAsType == PrincipalTypeEnum.Administrator) return null;
            if (String.IsNullOrEmpty(runAsId)) return what + " has no run-as principal. Save it again to run as yourself.";

            RequestContext origin = new RequestContext();
            origin.IsAuthenticated = true;
            origin.TenantId = tenantId;
            if (runAsType == PrincipalTypeEnum.Credential)
            {
                Credential? credential = await _Database.Credentials.ReadAsync(tenantId, runAsId, token).ConfigureAwait(false);
                if (credential == null || !credential.Active) return "The credential " + what + " runs as is missing or inactive. Save it again to run as yourself.";
                User? owner = await _Database.Users.ReadAsync(tenantId, credential.UserId, token).ConfigureAwait(false);
                origin.PrincipalType = PrincipalTypeEnum.Credential;
                origin.CredentialId = credential.Id;
                origin.UserId = credential.UserId;
                origin.IsAdmin = owner != null && owner.IsAdmin;
                origin.IsTenantAdmin = owner != null && owner.IsTenantAdmin;
            }
            else
            {
                User? user = await _Database.Users.ReadAsync(tenantId, runAsId, token).ConfigureAwait(false);
                if (user == null || !user.Active) return "The user " + what + " runs as is missing or inactive. Save it again to run as yourself.";
                origin.PrincipalType = PrincipalTypeEnum.User;
                origin.UserId = user.Id;
                origin.IsAdmin = user.IsAdmin;
                origin.IsTenantAdmin = user.IsTenantAdmin;
            }

            AuthorizationDecision decision = await _Authorization.EvaluateAsync(origin, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agentId, token).ConfigureAwait(false);
            if (!decision.Permitted) return what + " runs as " + (runAsName ?? runAsId) + ", who may no longer run agent " + agentId + ": " + decision.Reason;
            return null;
        }

        #endregion
    }
}
