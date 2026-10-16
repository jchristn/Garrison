namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Data.Common;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;

    internal static class QueueAdmissionSql
    {
        internal static async Task CheckAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, Run run, QueueDepthLimits? limits, CancellationToken token)
        {
            if (limits == null || (limits.Cluster <= 0 && limits.Tenant <= 0 && limits.Agent <= 0)) return;
            string? lockSql = driver.Dialect.TransactionLockStatement();
            if (lockSql != null)
            {
                // One cluster lock gives a consistent ordering for cluster, tenant and agent limits. SQLite serializes writers.
                long key = AdoDatabaseDriver.LockKey("queue-admission:" + driver.Table("runs"));
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, lockSql, c => AdoDatabaseDriver.Add(c, "key", key), token).ConfigureAwait(false);
            }
            string[] scopes = new string[] { "Cluster", "Tenant", "Agent" };
            int[] maxima = new int[] { limits.Cluster, limits.Tenant, limits.Agent };
            for (int index = 0; index < scopes.Length; index++)
            {
                if (maxima[index] <= 0) continue;
                string where = "status = 'Queued'";
                if (index > 0) where += " AND tenantid = @tenantid";
                if (index > 1) where += " AND agentid = @agentid";
                int scope = index;
                List<long> values = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT COUNT(*) FROM " + driver.Table("runs") + " WHERE " + where + ";", c =>
                {
                    if (scope > 0) AdoDatabaseDriver.Add(c, "tenantid", run.TenantId);
                    if (scope > 1) AdoDatabaseDriver.Add(c, "agentid", run.AgentId);
                }, r => r.GetInt64(0), token).ConfigureAwait(false);
                if (values[0] >= maxima[index]) throw new QueueFullException(scopes[index], maxima[index], limits.RetryAfterSeconds);
            }
        }
    }
}
