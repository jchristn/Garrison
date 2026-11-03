namespace Garrison.Core.Services
{
    using System;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;

    /// <summary>Idempotently lifts legacy deployment connection settings into reusable tenant profiles. Thread-safe across replicas through deterministic profile IDs.</summary>
    public static class HarnessRuntimeMigration
    {
        /// <summary>Migrate one tenant. Existing profiles and partially completed migrations are reused.</summary>
        /// <param name="database">Database.</param><param name="tenantId">Tenant.</param><param name="token">Cancellation.</param><returns>Completion.</returns>
        public static async Task TenantAsync(DatabaseDriverBase database, string tenantId, CancellationToken token)
        {
            foreach (Deployment deployment in await database.Deployments.ListByTenantAsync(tenantId, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                HarnessProfile? source = await database.HarnessProfiles.ReadAsync(tenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
                if (source == null || source.RuntimeConfiguration != null) continue;
                DeploymentResourceBinding? credential = deployment.ResourceBindings.FirstOrDefault(b => b.Kind == ResourceBindingKindEnum.Secret && b.Alias == "credential");
                string? endpointName = source.HarnessType == HarnessTypeEnum.Mux ? deployment.Parameters.FirstOrDefault(p => p.Name == "endpoint")?.Value : null;
                InferenceEndpoint? endpoint = deployment.InferenceEndpoint;
                string? baseUrl = deployment.Parameters.FirstOrDefault(p => p.Name == "baseUrl")?.Value;
                if (endpoint == null && source.HarnessType == HarnessTypeEnum.ProviderApi && !String.IsNullOrWhiteSpace(baseUrl))
                {
                    bool anonymous = deployment.Parameters.Any(p => p.Name == "allowAnonymous" && String.Equals(p.Value, "true", StringComparison.OrdinalIgnoreCase));
                    endpoint = new InferenceEndpoint { BaseUrl = baseUrl, Protocol = deployment.Parameters.Any(p => p.Name == "provider" && p.Value == "Ollama") ? InferenceProtocolEnum.Ollama : InferenceProtocolEnum.OpenAiCompatible, AuthenticationType = anonymous ? InferenceAuthenticationTypeEnum.None : InferenceAuthenticationTypeEnum.BearerToken };
                    if (!anonymous && credential != null) endpoint.Credentials.Add(new InferenceCredential { SecretId = credential.ResourceId });
                }
                if (endpoint == null && endpointName == null && credential == null && String.IsNullOrEmpty(deployment.Model)) continue;
                string profileId = "hrn_runtime_" + deployment.Id;
                HarnessProfile? connection = await database.HarnessProfiles.ReadAsync(tenantId, profileId, token).ConfigureAwait(false);
                if (connection == null)
                {
                    connection = Serializer.Copy<HarnessProfile>(source)!;
                    connection.Id = profileId;
                    connection.Name = deployment.Name.Substring(0, Math.Min(200, deployment.Name.Length)) + " connection";
                    HarnessProfile? named = await database.HarnessProfiles.ReadByNameAsync(tenantId, connection.Name, token).ConfigureAwait(false);
                    if (named != null && named.Id != profileId) connection.Name += " " + deployment.Id.Substring(Math.Max(0, deployment.Id.Length - 8));
                    connection.TenantId = tenantId;
                    connection.IsBuiltIn = false;
                    connection.IsProtected = false;
                    connection.BuiltInKey = null;
                    connection.RuntimeConfiguration = new HarnessRuntimeConfiguration { Model = source.HarnessType == HarnessTypeEnum.Mux ? null : deployment.Model, EndpointName = endpointName, CredentialSecretId = endpoint == null && source.HarnessType != HarnessTypeEnum.Mux ? credential?.ResourceId : null, InferenceEndpoint = endpoint };
                    try { await database.HarnessProfiles.CreateAsync(connection, token).ConfigureAwait(false); }
                    catch (DbException) when (!token.IsCancellationRequested)
                    {
                        connection = await database.HarnessProfiles.ReadAsync(tenantId, profileId, token).ConfigureAwait(false);
                        if (connection == null) throw;
                    }
                }
                deployment.ConfigVersion++;
                deployment.HarnessProfileId = connection.Id;
                deployment.Model = null;
                deployment.InferenceEndpoint = null;
                deployment.ResourceBindings.RemoveAll(b => b.Kind == ResourceBindingKindEnum.Secret && b.Alias == "credential");
                deployment.Parameters.RemoveAll(p => new string[] { "endpoint", "baseUrl", "allowAnonymous", "provider" }.Contains(p.Name));
                await database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
            }
        }

        /// <summary>Migrate all tenants during configuration startup, after built-ins exist.</summary>
        /// <param name="database">Database.</param><param name="token">Cancellation.</param><returns>Completion.</returns>
        public static async Task AllAsync(DatabaseDriverBase database, CancellationToken token)
        {
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000 };
            while (true)
            {
                EnumerationResult<Tenant> tenants = await database.Tenants.EnumerateAsync(query, token).ConfigureAwait(false);
                foreach (Tenant tenant in tenants.Objects) await TenantAsync(database, tenant.Id, token).ConfigureAwait(false);
                if (tenants.EndOfResults) break;
                query.Skip += tenants.Objects.Count;
            }
        }
    }
}
