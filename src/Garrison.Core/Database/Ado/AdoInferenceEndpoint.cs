namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Structured endpoint and credential child rows of a tenant deployment. Thread-safe.</summary>
    public static class AdoInferenceEndpoint
    {
        /// <summary>Read a deployment's endpoint in its tenant.</summary>
        /// <param name="driver">Database.</param><param name="deployment">Tenant-scoped parent.</param><param name="token">Cancellation.</param>
        /// <returns>Endpoint or null.</returns>
        public static async Task<InferenceEndpoint?> ReadAsync(AdoDatabaseDriver driver, Deployment deployment, CancellationToken token)
        {
            InferenceEndpoint? endpoint = await driver.QuerySingleAsync("SELECT * FROM " + driver.Table("deployment_inference_endpoints") + " WHERE deploymentid=@id AND tenantid=@tenant;", c => { AdoDatabaseDriver.Add(c, "id", deployment.Id); AdoDatabaseDriver.Add(c, "tenant", deployment.TenantId); }, r => new InferenceEndpoint { Protocol = Enum.Parse<InferenceProtocolEnum>(AdoConverters.Str(r, "protocol")), BaseUrl = AdoConverters.Str(r, "baseurl"), AuthenticationType = Enum.Parse<InferenceAuthenticationTypeEnum>(AdoConverters.Str(r, "authenticationtype")) }, token).ConfigureAwait(false);
            if (endpoint != null) endpoint.Credentials = await driver.QueryAsync("SELECT * FROM " + driver.Table("deployment_inference_credentials") + " WHERE deploymentid=@id AND tenantid=@tenant ORDER BY position;", c => { AdoDatabaseDriver.Add(c, "id", deployment.Id); AdoDatabaseDriver.Add(c, "tenant", deployment.TenantId); }, r => new InferenceCredential { Name = AdoConverters.Str(r, "name"), Location = Enum.Parse<InferenceCredentialLocationEnum>(AdoConverters.Str(r, "location")), SecretId = AdoConverters.Str(r, "secretid") }, token).ConfigureAwait(false);
            return endpoint;
        }

        /// <summary>Insert endpoint rows in the parent's transaction.</summary>
        /// <param name="driver">Database.</param><param name="connection">Connection.</param><param name="transaction">Parent transaction.</param><param name="deployment">Parent.</param><param name="token">Cancellation.</param>
        /// <returns>Completion.</returns>
        public static async Task InsertAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, Deployment deployment, CancellationToken token)
        {
            InferenceEndpoint? endpoint = deployment.InferenceEndpoint;
            if (endpoint == null) return;
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + driver.Table("deployment_inference_endpoints") + " (deploymentid,tenantid,protocol,baseurl,authenticationtype) VALUES (@id,@tenant,@protocol,@url,@auth);", c => { AdoDatabaseDriver.Add(c, "id", deployment.Id); AdoDatabaseDriver.Add(c, "tenant", deployment.TenantId); AdoDatabaseDriver.Add(c, "protocol", endpoint.Protocol.ToString()); AdoDatabaseDriver.Add(c, "url", endpoint.BaseUrl); AdoDatabaseDriver.Add(c, "auth", endpoint.AuthenticationType.ToString()); }, token).ConfigureAwait(false);
            for (int i = 0; i < endpoint.Credentials.Count; i++)
            {
                InferenceCredential credential = endpoint.Credentials[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + driver.Table("deployment_inference_credentials") + " (deploymentid,tenantid,position,name,location,secretid) VALUES (@id,@tenant,@position,@name,@location,@secret);", c => { AdoDatabaseDriver.Add(c, "id", deployment.Id); AdoDatabaseDriver.Add(c, "tenant", deployment.TenantId); AdoDatabaseDriver.Add(c, "position", i); AdoDatabaseDriver.Add(c, "name", credential.Name); AdoDatabaseDriver.Add(c, "location", credential.Location.ToString()); AdoDatabaseDriver.Add(c, "secret", credential.SecretId); }, token).ConfigureAwait(false);
            }
        }

        /// <summary>Delete endpoint rows in the parent's transaction.</summary>
        /// <param name="driver">Database.</param><param name="connection">Connection.</param><param name="transaction">Parent transaction.</param><param name="id">Parent identifier.</param><param name="token">Cancellation.</param>
        /// <returns>Completion.</returns>
        public static async Task DeleteAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, string id, CancellationToken token)
        {
            foreach (string table in new string[] { "deployment_inference_credentials", "deployment_inference_endpoints" })
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + driver.Table(table) + " WHERE deploymentid=@id;", c => AdoDatabaseDriver.Add(c, "id", id), token).ConfigureAwait(false);
        }
    }
}
