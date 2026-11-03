namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Structured persistence for reusable connection settings. Thread-safe.</summary>
    public static class AdoHarnessRuntimeConfiguration
    {
        /// <summary>Load connection settings and ordered credential references.</summary>
        /// <param name="driver">Database.</param><param name="profile">Profile.</param><param name="token">Cancellation.</param><returns>Completion.</returns>
        public static async Task ReadAsync(AdoDatabaseDriver driver, HarnessProfile profile, CancellationToken token)
        {
            HarnessRuntimeConfiguration? runtime = await driver.QuerySingleAsync("SELECT * FROM " + driver.Table("harness_runtime_settings") + " WHERE profileid=@id AND tenantid=@tenant;", c => { AdoDatabaseDriver.Add(c, "id", profile.Id); AdoDatabaseDriver.Add(c, "tenant", profile.TenantId); }, r =>
            {
                HarnessRuntimeConfiguration settings = new HarnessRuntimeConfiguration { Model = AdoConverters.NullableStr(r, "model"), EndpointName = AdoConverters.NullableStr(r, "endpointname"), CredentialSecretId = AdoConverters.NullableStr(r, "credentialsecretid") };
                string? protocol = AdoConverters.NullableStr(r, "protocol");
                if (protocol != null) settings.InferenceEndpoint = new InferenceEndpoint { Protocol = Enum.Parse<InferenceProtocolEnum>(protocol), BaseUrl = AdoConverters.Str(r, "baseurl"), AuthenticationType = Enum.Parse<InferenceAuthenticationTypeEnum>(AdoConverters.Str(r, "authenticationtype")) };
                return settings;
            }, token).ConfigureAwait(false);
            if (runtime?.InferenceEndpoint != null) runtime.InferenceEndpoint.Credentials = await driver.QueryAsync("SELECT * FROM " + driver.Table("harness_runtime_credentials") + " WHERE profileid=@id AND tenantid=@tenant ORDER BY position;", c => { AdoDatabaseDriver.Add(c, "id", profile.Id); AdoDatabaseDriver.Add(c, "tenant", profile.TenantId); }, r => new InferenceCredential { Name = AdoConverters.Str(r, "name"), Location = Enum.Parse<InferenceCredentialLocationEnum>(AdoConverters.Str(r, "location")), SecretId = AdoConverters.Str(r, "secretid") }, token).ConfigureAwait(false);
            profile.RuntimeConfiguration = runtime;
        }

        /// <summary>Insert connection rows in the profile transaction.</summary>
        /// <param name="driver">Database.</param><param name="connection">Connection.</param><param name="transaction">Transaction.</param><param name="profile">Profile.</param><param name="token">Cancellation.</param><returns>Completion.</returns>
        public static async Task InsertAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, HarnessProfile profile, CancellationToken token)
        {
            HarnessRuntimeConfiguration? runtime = profile.RuntimeConfiguration;
            if (runtime == null) return;
            InferenceEndpoint? endpoint = runtime.InferenceEndpoint;
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + driver.Table("harness_runtime_settings") + " (profileid,tenantid,model,endpointname,credentialsecretid,protocol,baseurl,authenticationtype) VALUES (@id,@tenant,@model,@endpoint,@credential,@protocol,@url,@auth);", c => { AdoDatabaseDriver.Add(c, "id", profile.Id); AdoDatabaseDriver.Add(c, "tenant", profile.TenantId); AdoDatabaseDriver.Add(c, "model", runtime.Model); AdoDatabaseDriver.Add(c, "endpoint", runtime.EndpointName); AdoDatabaseDriver.Add(c, "credential", runtime.CredentialSecretId); AdoDatabaseDriver.Add(c, "protocol", endpoint?.Protocol.ToString()); AdoDatabaseDriver.Add(c, "url", endpoint?.BaseUrl); AdoDatabaseDriver.Add(c, "auth", endpoint?.AuthenticationType.ToString()); }, token).ConfigureAwait(false);
            if (endpoint == null) return;
            for (int i = 0; i < endpoint.Credentials.Count; i++)
            {
                InferenceCredential credential = endpoint.Credentials[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + driver.Table("harness_runtime_credentials") + " (profileid,tenantid,position,name,location,secretid) VALUES (@id,@tenant,@position,@name,@location,@secret);", c => { AdoDatabaseDriver.Add(c, "id", profile.Id); AdoDatabaseDriver.Add(c, "tenant", profile.TenantId); AdoDatabaseDriver.Add(c, "position", i); AdoDatabaseDriver.Add(c, "name", credential.Name); AdoDatabaseDriver.Add(c, "location", credential.Location.ToString()); AdoDatabaseDriver.Add(c, "secret", credential.SecretId); }, token).ConfigureAwait(false);
            }
        }

        /// <summary>Remove connection rows in the profile transaction.</summary>
        /// <param name="driver">Database.</param><param name="connection">Connection.</param><param name="transaction">Transaction.</param><param name="id">Profile ID.</param><param name="token">Cancellation.</param><returns>Completion.</returns>
        public static async Task DeleteAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, string id, CancellationToken token)
        {
            foreach (string table in new string[] { "harness_runtime_credentials", "harness_runtime_settings" })
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + driver.Table(table) + " WHERE profileid=@id;", c => AdoDatabaseDriver.Add(c, "id", id), token).ConfigureAwait(false);
        }
    }
}
