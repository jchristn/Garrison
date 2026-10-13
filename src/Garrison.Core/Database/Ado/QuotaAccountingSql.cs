namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    // Shared SQL keeps admission, claim, configuration, and reads on the same accounting convention.
    internal static class QuotaAccountingSql
    {
        internal static async Task LockTenantAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, string tenantId, CancellationToken token)
        {
            string? sql = driver.Dialect.TransactionLockStatement();
            if (sql == null) return; // SQLite already serializes writers.
            long key = AdoDatabaseDriver.LockKey("quota:" + driver.Table("usage_quotas") + ":" + tenantId);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, c => AdoDatabaseDriver.Add(c, "key", key), token).ConfigureAwait(false);
        }

        internal static string MatchingQuery(AdoDatabaseDriver driver)
        {
            return "SELECT * FROM " + driver.Table("usage_quotas") + " WHERE tenantid = @tenantid AND enforcementenabled = " + driver.Dialect.BooleanLiteral(true) + " AND active = " + driver.Dialect.BooleanLiteral(true)
                + " AND ((scope = 'Tenant' AND resourceid = @tenantid) OR (scope = 'Agent' AND resourceid = @agentid) OR (scope = 'Deployment' AND resourceid = @deploymentid));";
        }

        internal static void BindMatching(DbCommand command, Run run)
        {
            AdoDatabaseDriver.Add(command, "tenantid", run.TenantId);
            AdoDatabaseDriver.Add(command, "agentid", run.AgentId);
            AdoDatabaseDriver.Add(command, "deploymentid", run.DeploymentId);
        }

        internal static string UsageQuery(AdoDatabaseDriver driver, UsageQuota quota)
        {
            string column = quota.Scope switch
            {
                UsageQuotaScopeEnum.Tenant => "tenantid",
                UsageQuotaScopeEnum.Agent => "agentid",
                UsageQuotaScopeEnum.Deployment => "deploymentid",
                _ => throw new ArgumentOutOfRangeException(nameof(quota), "Unsupported quota scope.")
            };
            string completed = Live("completedutc");
            string inWindow = completed + " >= @start AND " + completed + " < @end";
            string tokens = Positive(driver, "inputtokens") + " + " + Positive(driver, "outputtokens")
                + " + CASE WHEN " + Live("harnesstype") + " = 'ClaudeCode' THEN " + Positive(driver, "cachedtokens") + " ELSE 0 END";
            string cost = Live("costusd");
            return "SELECT COUNT(CASE WHEN u.admittedutc >= @start AND u.admittedutc < @end THEN 1 END) AS runsused, "
                + "COALESCE(SUM(CASE WHEN " + inWindow + " THEN " + tokens + " ELSE 0 END), 0) AS tokensused, "
                + "COALESCE(SUM(CASE WHEN " + inWindow + " AND " + cost + " > 0 THEN " + cost + " ELSE 0 END), 0) AS costusd, "
                + "COUNT(CASE WHEN " + inWindow + " AND " + cost + " IS NULL THEN 1 END) AS unknowncostruns, "
                + "(SELECT COUNT(*) FROM " + driver.Table("runs") + " a WHERE a.tenantid = @tenantid AND a." + column + " = @resourceid AND a.status IN ('Leased', 'Running', 'Cancelling')) AS activeruns "
                + "FROM " + driver.Table("quota_usage_source") + " u LEFT JOIN " + driver.Table("runs") + " r ON r.id = u.runid AND r.tenantid = u.tenantid "
                + "WHERE u.tenantid = @tenantid AND u." + column + " = @resourceid;";
        }

        internal static void BindUsage(DbCommand command, UsageQuota quota, DateTime utc)
        {
            AdoDatabaseDriver.Add(command, "tenantid", quota.TenantId);
            AdoDatabaseDriver.Add(command, "resourceid", quota.ResourceId);
            AdoDatabaseDriver.Add(command, "start", DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc));
            AdoDatabaseDriver.Add(command, "end", DateTime.SpecifyKind(utc.Date.AddDays(1), DateTimeKind.Utc));
        }

        internal static UsageQuotaUsage MapUsage(DbDataReader reader, UsageQuota quota, DateTime utc)
        {
            double tokens = AdoConverters.Double(reader, "tokensused");
            UsageQuotaUsage usage = new UsageQuotaUsage();
            usage.QuotaId = quota.Id;
            usage.WindowStartUtc = DateTime.SpecifyKind(utc.Date, DateTimeKind.Utc);
            usage.WindowEndUtc = usage.WindowStartUtc.AddDays(1);
            usage.RunsUsed = AdoConverters.Long(reader, "runsused");
            usage.TokensUsed = tokens >= Int64.MaxValue ? Int64.MaxValue : (long)Math.Max(0, tokens);
            usage.CostUsd = AdoConverters.Double(reader, "costusd");
            usage.UnknownCostRuns = AdoConverters.Long(reader, "unknowncostruns");
            usage.ActiveRuns = AdoConverters.Long(reader, "activeruns");
            return usage;
        }

        internal static async Task<QuotaExceededException?> CheckAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, Run run, bool admission, CancellationToken token, DateTime? accountingUtc = null)
        {
            DateTime now = accountingUtc ?? DateTime.UtcNow;
            List<UsageQuota> quotas = await AdoDatabaseDriver.QueryAsync(connection, transaction, MatchingQuery(driver), c => BindMatching(c, run), AdoUsageQuotaMethods.Map, token).ConfigureAwait(false);
            foreach (UsageQuota quota in quotas)
            {
                List<UsageQuotaUsage> rows = await AdoDatabaseDriver.QueryAsync(connection, transaction, UsageQuery(driver, quota), c => BindUsage(c, quota, now), r => MapUsage(r, quota, now), token).ConfigureAwait(false);
                UsageQuotaUsage usage = rows[0];
                if (admission && quota.DailyRunLimit.HasValue && usage.RunsUsed >= quota.DailyRunLimit.Value) return Exceeded(quota, "dailyRunLimit", usage.RunsUsed, quota.DailyRunLimit.Value, now.Date.AddDays(1));
                if (quota.DailyTokenLimit.HasValue && usage.TokensUsed >= quota.DailyTokenLimit.Value) return Exceeded(quota, "dailyTokenLimit", usage.TokensUsed, quota.DailyTokenLimit.Value, now.Date.AddDays(1));
                if (quota.DailyCostUsdLimit.HasValue && usage.CostUsd >= quota.DailyCostUsdLimit.Value) return Exceeded(quota, "dailyCostUsdLimit", usage.CostUsd, quota.DailyCostUsdLimit.Value, now.Date.AddDays(1));
                if (quota.MaxConcurrentRuns.HasValue && usage.ActiveRuns >= quota.MaxConcurrentRuns.Value) return Exceeded(quota, "maxConcurrentRuns", usage.ActiveRuns, quota.MaxConcurrentRuns.Value, now.AddSeconds(1));
            }
            return null;
        }

        internal static async Task InsertLedgerAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, string runId, CancellationToken token, bool deduplicate = false, DateTime? admittedUtc = null)
        {
            string sql = "INSERT INTO " + driver.Table("run_usage") + " (runid, tenantid, agentid, deploymentid, harnesstype, admittedutc, completedutc, inputtokens, outputtokens, cachedtokens, costusd) "
                + "SELECT id, tenantid, agentid, deploymentid, harnesstype, " + (admittedUtc.HasValue ? "@admittedutc" : "COALESCE(queuedutc, createdutc)") + ", completedutc, inputtokens, outputtokens, cachedtokens, costusd FROM " + driver.Table("runs") + " WHERE id = @id" + (deduplicate ? " ON CONFLICT (runid) DO NOTHING" : String.Empty) + ";";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, c =>
            {
                AdoDatabaseDriver.Add(c, "id", runId);
                if (admittedUtc.HasValue) AdoDatabaseDriver.Add(c, "admittedutc", admittedUtc.Value);
            }, token).ConfigureAwait(false);
        }

        internal static async Task SnapshotBeforeDeleteAsync(AdoDatabaseDriver driver, DbConnection connection, DbTransaction transaction, string runId, CancellationToken token)
        {
            // Lock the run row before reading it, so a completion racing retention is captured or fenced out.
            await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT id FROM " + driver.Table("runs") + " WHERE id = @id" + (driver.Dialect.DatabaseType == DatabaseTypeEnum.Postgresql ? " FOR UPDATE" : String.Empty) + ";", c => AdoDatabaseDriver.Add(c, "id", runId), r => AdoConverters.Str(r, "id"), token).ConfigureAwait(false);
            await InsertLedgerAsync(driver, connection, transaction, runId, token, true).ConfigureAwait(false);
            string assignments = String.Join(", ", new[] { "completedutc", "inputtokens", "outputtokens", "cachedtokens", "costusd", "harnesstype" }.Select(column => column + " = (SELECT " + column + " FROM " + driver.Table("runs") + " WHERE id = @id)"));
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + driver.Table("run_usage") + " SET " + assignments + " WHERE runid = @id AND EXISTS (SELECT 1 FROM " + driver.Table("runs") + " WHERE id = @id);", c => AdoDatabaseDriver.Add(c, "id", runId), token).ConfigureAwait(false);
        }

        private static string Live(string column)
        {
            return "(CASE WHEN r.id IS NOT NULL THEN r." + column + " ELSE u." + column + " END)";
        }

        private static string Positive(AdoDatabaseDriver driver, string column)
        {
            string value = Live(column);
            return "CASE WHEN " + value + " > 0 THEN CAST(" + value + " AS " + driver.Dialect.TypeDouble + ") ELSE 0 END";
        }

        private static QuotaExceededException Exceeded(UsageQuota quota, string limit, double used, double maximum, DateTime retryUtc)
        {
            return new QuotaExceededException(quota.Id, quota.Scope, quota.ResourceId, limit, used, maximum, DateTime.SpecifyKind(retryUtc, DateTimeKind.Utc));
        }
    }
}
