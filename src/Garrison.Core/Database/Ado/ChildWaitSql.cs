namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    // Delegation wait records (P12.38). A wait is live while its parent run is active and its child run is active or not
    // created yet, so a wait whose child finished stops counting even when the replica that recorded it died before
    // removing it. The leader prunes dead and orphaned rows.
    internal static class ChildWaitSql
    {
        internal const string ActiveStatuses = "'Leased', 'Running', 'Cancelling'";

        internal static string Table(AdoDatabaseDriver driver)
        {
            return driver.Table("run_child_waits");
        }

        internal static string ChildLive(AdoDatabaseDriver driver, string waitAlias)
        {
            string runs = driver.Table("runs");
            return "(NOT EXISTS (SELECT 1 FROM " + runs + " c0 WHERE c0.id = " + waitAlias + ".childrunid) OR EXISTS (SELECT 1 FROM " + runs
                + " c1 WHERE c1.id = " + waitAlias + ".childrunid AND c1.status IN ('Queued', " + ActiveStatuses + ")))";
        }

        internal static string RunIsWaiting(AdoDatabaseDriver driver, string runColumn)
        {
            return "EXISTS (SELECT 1 FROM " + Table(driver) + " wq WHERE wq.parentrunid = " + runColumn + " AND " + ChildLive(driver, "wq") + ")";
        }

        internal static string RunIsWaitedOn(AdoDatabaseDriver driver, string runColumn)
        {
            return "EXISTS (SELECT 1 FROM " + Table(driver) + " wc JOIN " + driver.Table("runs") + " wp ON wp.id = wc.parentrunid WHERE wc.childrunid = " + runColumn
                + " AND wp.status IN (" + ActiveStatuses + "))";
        }

        internal static string WaitingOnNodeQuery(AdoDatabaseDriver driver)
        {
            return "SELECT COUNT(DISTINCT w.parentrunid) FROM " + Table(driver) + " w JOIN " + driver.Table("runs") + " p ON p.id = w.parentrunid"
                + " WHERE p.leasenodeid = @node AND p.status IN (" + ActiveStatuses + ") AND " + ChildLive(driver, "w") + ";";
        }

        internal static string QueuedWaitedChildrenQuery(AdoDatabaseDriver driver)
        {
            string runs = driver.Table("runs");
            return "SELECT COUNT(DISTINCT c.id) FROM " + Table(driver) + " w JOIN " + runs + " c ON c.id = w.childrunid JOIN " + runs + " p ON p.id = w.parentrunid"
                + " WHERE c.status = 'Queued' AND p.status IN (" + ActiveStatuses + ");";
        }

        internal static string ExcludeWaitingAncestors(AdoDatabaseDriver driver, string runAlias, int count)
        {
            if (count <= 0) return String.Empty;
            List<string> names = new List<string>();
            for (int i = 0; i < count; i++) names.Add("@wa" + i);
            return " AND NOT (" + runAlias + ".id IN (" + String.Join(", ", names) + ") AND " + RunIsWaiting(driver, runAlias + ".id") + ")";
        }

        internal static void BindAncestors(DbCommand command, IReadOnlyList<string> ancestors)
        {
            for (int i = 0; i < ancestors.Count; i++) AdoDatabaseDriver.Add(command, "wa" + i, ancestors[i]);
        }

        internal static List<string> Distinct(IReadOnlyCollection<string>? ids)
        {
            if (ids == null) return new List<string>();
            return ids.Where(i => !String.IsNullOrEmpty(i)).Distinct(StringComparer.Ordinal).Take(64).ToList();
        }

        internal static async Task<long> ScalarLongAsync(DbConnection connection, DbTransaction transaction, string sql, Action<DbCommand>? bind, CancellationToken token)
        {
            List<long> rows = await AdoDatabaseDriver.QueryAsync(connection, transaction, sql, bind, reader => reader.IsDBNull(0) ? 0L : Convert.ToInt64(reader.GetValue(0)), token).ConfigureAwait(false);
            return rows.Count > 0 ? rows[0] : 0;
        }

        internal static async Task<ChildWaitAdmission> BeginAsync(AdoDatabaseDriver driver, ChildWaitRequest request, CancellationToken token)
        {
            string runs = driver.Table("runs");
            string? lockSql = driver.Dialect.TransactionLockStatement();
            ChildWaitAdmission admission = new ChildWaitAdmission();
            await driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                admission = new ChildWaitAdmission();

                // Serialize handshakes so two parents on one node cannot both take its last waiter place. Sqlite already
                // has a single writer.
                if (lockSql != null)
                {
                    long key = AdoDatabaseDriver.LockKey("child-waits:" + Table(driver));
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, lockSql, c => AdoDatabaseDriver.Add(c, "key", key), ct).ConfigureAwait(false);
                }

                List<string?> nodeIds = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT leasenodeid FROM " + runs + " WHERE id = @parent AND status IN (" + ActiveStatuses + ");",
                    c => AdoDatabaseDriver.Add(c, "parent", request.ParentRunId),
                    reader => AdoConverters.NullableStr(reader, "leasenodeid"), ct).ConfigureAwait(false);
                string? nodeId = nodeIds.FirstOrDefault();
                List<Node> nodes = String.IsNullOrEmpty(nodeId) ? new List<Node>() : await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT * FROM " + driver.Table("nodes") + " WHERE id = @node;", c => AdoDatabaseDriver.Add(c, "node", nodeId), AdoNodeMethods.Map, ct).ConfigureAwait(false);

                if (nodes.Count > 0)
                {
                    Node node = nodes[0];
                    admission.NodeId = node.Id;
                    int cap = DelegationCapacity.MaxWaiters(node);
                    long waiting = await ScalarLongAsync(connection, transaction, WaitingOnNodeQuery(driver), c => AdoDatabaseDriver.Add(c, "node", node.Id), ct).ConfigureAwait(false);
                    long already = await ScalarLongAsync(connection, transaction,
                        "SELECT COUNT(*) FROM " + Table(driver) + " w WHERE w.parentrunid = @parent AND " + ChildLive(driver, "w") + ";",
                        c => AdoDatabaseDriver.Add(c, "parent", request.ParentRunId), ct).ConfigureAwait(false);
                    admission.Maximum = cap;
                    admission.Used = waiting;
                    // A parent that already waits (parallel delegations) is resident already and takes no new place.
                    if (!request.Durable && already == 0 && waiting + 1 > cap)
                    {
                        admission.Limit = DelegationCapacityLimitEnum.ResidentWaiters;
                        return;
                    }
                }

                long queued = await ScalarLongAsync(connection, transaction, QueuedWaitedChildrenQuery(driver), null, ct).ConfigureAwait(false);
                if (queued >= request.ChildQueueDepth)
                {
                    admission.Limit = DelegationCapacityLimitEnum.ChildQueueDepth;
                    admission.Used = queued;
                    admission.Maximum = request.ChildQueueDepth;
                    return;
                }

                string id = IdGenerator.NewRunChildWaitId();
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + Table(driver) + " (id, tenantid, parentrunid, childrunid, createdutc) VALUES (@id, @tenantid, @parent, @child, @now);",
                    c =>
                    {
                        AdoDatabaseDriver.Add(c, "id", id);
                        AdoDatabaseDriver.Add(c, "tenantid", request.TenantId);
                        AdoDatabaseDriver.Add(c, "parent", request.ParentRunId);
                        AdoDatabaseDriver.Add(c, "child", request.ChildRunId);
                        AdoDatabaseDriver.Add(c, "now", DateTime.UtcNow);
                    }, ct).ConfigureAwait(false);
                admission.WaitId = id;
            }, token).ConfigureAwait(false);
            return admission;
        }

        internal static string PruneStatement(AdoDatabaseDriver driver)
        {
            string runs = driver.Table("runs");
            return "DELETE FROM " + Table(driver) + " WHERE NOT EXISTS (SELECT 1 FROM " + runs + " p WHERE p.id = " + Table(driver) + ".parentrunid AND p.status IN ('Suspended', " + ActiveStatuses + "))"
                + " OR (EXISTS (SELECT 1 FROM " + runs + " c WHERE c.id = " + Table(driver) + ".childrunid AND c.status NOT IN ('Queued', " + ActiveStatuses + ")) AND NOT EXISTS (SELECT 1 FROM " + runs + " p JOIN " + driver.Table("deployments") + " d ON d.id=p.deploymentid AND d.tenantid=p.tenantid WHERE p.id=" + Table(driver) + ".parentrunid AND p.tenantid=" + Table(driver) + ".tenantid AND d.suspensionenabled=" + driver.Dialect.BooleanLiteral(true) + " AND p.status IN ('Suspended', " + ActiveStatuses + ")))"
                + " OR (createdutc < @cutoff AND NOT EXISTS (SELECT 1 FROM " + runs + " c2 WHERE c2.id = " + Table(driver) + ".childrunid));";
        }
    }
}
