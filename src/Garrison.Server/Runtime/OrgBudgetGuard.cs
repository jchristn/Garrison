namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Diagnostics.Metrics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Notifications;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Org unit budgets at admission (AA7.6, scope OrgUnit): a run of an agent whose unit, or any unit above it, has spent
    /// its budget for the current day or month is refused with 409 BudgetExhausted, and the capped unit's manager (the
    /// lead above it, or the person behind the run when the board is above) is told once per budget window. Spend is the
    /// known cost of the subtree's agents' runs completed in the window, read from the usage ledger and cached briefly.
    /// A subtree whose spend reaches its budget plus the organization's freeze margin (AA11.5) is frozen once per unit,
    /// period, and window, from <see cref="SweepAsync(CancellationToken)"/> and from the admission and keeper checks that
    /// see the overrun; the board hears through OrgBudgetFrozen. Thread-safe.
    /// </summary>
    public class OrgBudgetGuard : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Seconds a subtree's spend is reused before it is read again. Default 15, minimum 0, maximum 3600. A run that
        /// finishes inside this window can push a subtree a little past its budget.
        /// </summary>
        public int SpendCacheSeconds
        {
            get
            {
                return _SpendCacheSeconds;
            }
            set
            {
                _SpendCacheSeconds = Math.Clamp(value, 0, 3600);
            }
        }

        /// <summary>
        /// Escalations, used to tell the capped unit's manager. Null to refuse runs without telling anyone.
        /// </summary>
        public EscalationService? Escalations { get; set; } = null;

        /// <summary>
        /// Freezes, used to freeze an overrun unit (AA11.5). Null turns automatic freezes off.
        /// </summary>
        public FreezeService? Freezes { get; set; } = null;

        /// <summary>
        /// Audit, for the OrgBudgetFrozen record. Null to skip the record.
        /// </summary>
        public AuditService? Audit { get; set; } = null;

        /// <summary>
        /// Notifications, for the OrgBudgetFrozen event. Null to skip it.
        /// </summary>
        public NotificationService? Notifications { get; set; } = null;

        /// <summary>
        /// Seconds between the leader's budget freeze sweeps. Default 60, minimum 5, maximum 3600.
        /// </summary>
        public int FreezeSweepSeconds
        {
            get
            {
                return _FreezeSweepSeconds;
            }
            set
            {
                _FreezeSweepSeconds = Math.Clamp(value, 5, 3600);
            }
        }

        /// <summary>
        /// Most live organizations one sweep reads, across tenants. Default 1000, minimum 1, maximum 100000.
        /// </summary>
        public int MaxOrganizationsPerSweep
        {
            get
            {
                return _MaxOrganizationsPerSweep;
            }
            set
            {
                _MaxOrganizationsPerSweep = Math.Clamp(value, 1, 100000);
            }
        }

        /// <summary>
        /// The name automatic freezes are created by. Fixed: "Garrison budget guard".
        /// </summary>
        public static string FreezerName
        {
            get
            {
                return "Garrison budget guard";
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly ChainOfCommand _Chain;
        private readonly OrganizationService _Organizations;
        private readonly LoggingModule _Logging;
        private readonly ConcurrentDictionary<string, OrgSpendCacheEntry> _Spend = new ConcurrentDictionary<string, OrgSpendCacheEntry>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, DateTime> _Notified = new ConcurrentDictionary<string, DateTime>(StringComparer.Ordinal);
        private readonly string _Header = "[Budgets] ";
        private int _SpendCacheSeconds = 15;
        private int _FreezeSweepSeconds = 60;
        private int _MaxOrganizationsPerSweep = 1000;
        private DateTime _LastSweepUtc = DateTime.MinValue;
        private readonly SemaphoreSlim _FreezeLock = new SemaphoreSlim(1, 1);
        private readonly GaugeRegistration _Gauge;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="chain">Chain of command.</param>
        /// <param name="organizations">Organization service, for spend windows.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public OrgBudgetGuard(DatabaseDriverBase database, ChainOfCommand chain, OrganizationService organizations, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Chain = chain ?? throw new ArgumentNullException(nameof(chain));
            _Organizations = organizations ?? throw new ArgumentNullException(nameof(organizations));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
            _Gauge = GarrisonMetrics.RegisterGauge(GarrisonMetricCatalog.OrgBudgetsExhausted, ObserveExhausted);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The first budget an agent's runs are capped by: its own unit's, then each unit above it, in every live
        /// organization it belongs to.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="utc">Time that selects the windows.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The breach, or null when the agent may run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<OrgBudgetBreach?> FindBreachAsync(string tenantId, string? agentId, DateTime utc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) return null;
            using (Activity? span = GarrisonTracing.Start("org budget check", ActivityKind.Internal))
            {
                foreach (OrgTree tree in await _Chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false))
                {
                    OrgPosition? position = tree.PositionOf(agentId);
                    if (position == null) continue;
                    OrgUnit? own = tree.Unit(position.UnitId);
                    if (own == null) continue;
                    List<OrgUnit> path = new List<OrgUnit> { own };
                    path.AddRange(tree.Ancestors(own.Id));
                    foreach (OrgUnit unit in path)
                    {
                        foreach (OrgUnitBudget budget in unit.Budgets)
                        {
                            OrgUnitSpend spend = await SpendAsync(tenantId, tree, unit, budget, utc, token).ConfigureAwait(false);
                            if (!spend.Exhausted) continue;
                            span?.SetTag("garrison.org.budget.outcome", "exhausted");
                            GarrisonTracing.Ok(span);
                            return new OrgBudgetBreach(tree, unit, spend);
                        }
                    }
                }
                span?.SetTag("garrison.org.budget.outcome", "within");
                GarrisonTracing.Ok(span);
                return null;
            }
        }

        /// <summary>
        /// Refuse a run whose agent sits in a capped subtree, telling the capped unit's manager once per window.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="callerType">Principal the run would execute as, used to route the notice.</param>
        /// <param name="callerId">Identifier of that principal, or null.</param>
        /// <param name="callerName">Name of that principal, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ConflictException">Thrown with BudgetExhausted when a budget caps the agent.</exception>
        public async Task RequireWithinBudgetAsync(string tenantId, string? agentId, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token = default)
        {
            OrgBudgetBreach? breach = await FindBreachAsync(tenantId, agentId, DateTime.UtcNow, token).ConfigureAwait(false);
            if (breach == null) return;
            GarrisonMetrics.Count(GarrisonMetricCatalog.SpendCapHits, "scope", breach.Spend.Period == BudgetPeriodEnum.Month ? "org_unit_month" : "org_unit_day");
            await FreezeIfOverrunAsync(breach, token).ConfigureAwait(false);
            await NotifyAsync(tenantId, agentId, breach, callerType, callerId, callerName, token).ConfigureAwait(false);
            throw new ConflictException("BudgetExhausted", Message(breach));
        }

        /// <summary>
        /// Describe a breach for a refusal or a skipped tick.
        /// </summary>
        /// <param name="breach">Breach.</param>
        /// <returns>Sentence.</returns>
        /// <exception cref="ArgumentNullException">Thrown when breach is null.</exception>
        public static string Message(OrgBudgetBreach breach)
        {
            if (breach == null) throw new ArgumentNullException(nameof(breach));
            string period = breach.Spend.Period == BudgetPeriodEnum.Month ? "monthly" : "daily";
            return "Unit " + breach.Unit.Name + " of organization " + breach.Tree.Organization.Name + " has spent " + Usd(breach.Spend.SpentUsd) + " USD of its " + period + " budget of "
                + Usd(breach.Spend.AmountUsd ?? 0) + " USD; runs in its subtree are refused until " + breach.Spend.WindowEndUtc.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture) + ".";
        }

        /// <summary>
        /// True when a subtree's spend has reached its budget plus a freeze margin: amountUsd * (1 + margin / 100), with
        /// some spend. A margin of 0 freezes at the budget.
        /// </summary>
        /// <param name="spend">Spend in one budget window.</param>
        /// <param name="marginPercent">Margin, clamped to 0 to 100.</param>
        /// <returns>True when the unit should be frozen.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spend is null.</exception>
        public static bool Overrun(OrgUnitSpend spend, int marginPercent)
        {
            if (spend == null) throw new ArgumentNullException(nameof(spend));
            if (!spend.AmountUsd.HasValue || spend.SpentUsd <= 0) return false;
            double threshold = spend.AmountUsd.Value * (1 + Math.Clamp(marginPercent, 0, 100) / 100.0);
            return spend.SpentUsd >= threshold;
        }

        /// <summary>
        /// Run one budget freeze sweep when <see cref="FreezeSweepSeconds"/> has passed since the last one (the leader's
        /// maintenance step).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a unit was frozen.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            DateTime now = DateTime.UtcNow;
            if ((now - _LastSweepUtc).TotalSeconds < _FreezeSweepSeconds) return false;
            _LastSweepUtc = now;
            return await SweepAsync(now, token).ConfigureAwait(false) > 0;
        }

        /// <summary>
        /// Freeze every unit of a live organization, in any tenant, whose subtree spend in a budget window has reached its
        /// budget plus the organization's freeze margin. Used by the leader and by tests.
        /// </summary>
        /// <param name="utc">Time that selects the windows.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Units frozen by this sweep.</returns>
        public async Task<int> SweepAsync(DateTime utc, CancellationToken token)
        {
            if (Freezes == null) return 0;
            int frozen = 0;
            foreach (Organization organization in await _Database.Organizations.ListLiveAcrossTenantsAsync(_MaxOrganizationsPerSweep, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    OrgTree? tree = await _Chain.TreeAsync(organization, token).ConfigureAwait(false);
                    if (tree == null) continue;
                    foreach (OrgUnit unit in tree.Units)
                    {
                        foreach (OrgUnitBudget budget in unit.Budgets)
                        {
                            OrgUnitSpend spend = await SpendAsync(organization.TenantId, tree, unit, budget, utc, token).ConfigureAwait(false);
                            if (!Overrun(spend, organization.BudgetFreezeMarginPercent)) continue;
                            if (await FreezeIfOverrunAsync(new OrgBudgetBreach(tree, unit, spend), token).ConfigureAwait(false) != null) frozen++;
                        }
                    }
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "budget freeze sweep failed for organization " + organization.Id + ": " + e.Message);
                }
            }
            return frozen;
        }

        /// <summary>
        /// Freeze a unit whose subtree spend has reached its budget plus the organization's freeze margin (AA11.5): an
        /// OrgUnit freeze by "Garrison budget guard" with cancelActiveRuns, recorded as OrgBudgetFrozen, counted, and sent to
        /// OrgBudgetFrozen endpoints. Nothing happens below the margin, when an active freeze already covers the unit (on
        /// it, a unit above it, or its organization), or when the guard already froze it in this period's window (a person
        /// lifting the freeze keeps it lifted until the window resets).
        /// </summary>
        /// <param name="breach">The exhausted budget.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new freeze, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when breach is null.</exception>
        public async Task<Freeze?> FreezeIfOverrunAsync(OrgBudgetBreach breach, CancellationToken token = default)
        {
            if (breach == null) throw new ArgumentNullException(nameof(breach));
            FreezeService? freezes = Freezes;
            if (freezes == null) return null;
            Organization organization = breach.Tree.Organization;
            if (!Overrun(breach.Spend, organization.BudgetFreezeMarginPercent)) return null;
            await _FreezeLock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                string tenantId = organization.TenantId;
                if (await CoveredAsync(freezes, breach, token).ConfigureAwait(false)) return null;
                if (await FrozenThisWindowAsync(breach, token).ConfigureAwait(false)) return null;

                RequestContext guard = new RequestContext { TenantId = tenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = FreezerName };
                Freeze request = new Freeze();
                request.TargetKind = FreezeTargetKindEnum.OrgUnit;
                request.TargetId = breach.Unit.Id;
                request.Reason = FreezeReason(breach);
                request.CancelActiveRuns = true;
                Freeze freeze;
                try
                {
                    freeze = await freezes.ApplyAsync(guard, tenantId, request, token).ConfigureAwait(false);
                }
                catch (ConflictException e) when (e.Code == "AlreadyFrozen")
                {
                    return null;
                }

                string period = breach.Spend.Period == BudgetPeriodEnum.Month ? "month" : "day";
                GarrisonMetrics.Count(GarrisonMetricCatalog.AutoFreezes, "period", period);
                _Logging.Warn(_Header + "froze unit " + breach.Unit.Id + " (" + breach.Unit.Name + ") of organization " + organization.Name + " as " + freeze.Id + ": " + request.Reason + " " + GarrisonTracing.LogFields("tenant", tenantId));
                if (Audit != null)
                {
                    await Audit.WriteAsync(guard, AuditEventTypeEnum.OrgBudgetFrozen, "Freeze", freeze.Id, "Froze unit " + breach.Unit.Name + " of organization " + organization.Name + " (" + freeze.Id + "): " + request.Reason
                        + (freeze.CancelledRunCount > 0 ? " Cancelled " + freeze.CancelledRunCount + " active run(s)." : String.Empty), tenantId, token).ConfigureAwait(false);
                }
                if (Notifications != null)
                {
                    try
                    {
                        await Notifications.QueueOrgBudgetFrozenAsync(tenantId, Summary(breach, freeze), breach.Tree.SubtreeAgentIds(breach.Unit.Id), token).ConfigureAwait(false);
                    }
                    catch (Exception e) when (e is not OperationCanceledException)
                    {
                        _Logging.Warn(_Header + "could not queue the OrgBudgetFrozen notification for freeze " + freeze.Id + ": " + e.Message);
                    }
                }
                return freeze;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Logging.Warn(_Header + "could not freeze overrun unit " + breach.Unit.Id + ": " + e.Message);
                return null;
            }
            finally
            {
                _FreezeLock.Release();
            }
        }

        /// <summary>
        /// Release the gauge registration.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Drop cached spend, for example after a budget changes.
        /// </summary>
        public void Invalidate()
        {
            _Spend.Clear();
        }

        /// <summary>
        /// Tell the capped unit's manager about a breach, once per budget window on this replica.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">The refused agent, or null.</param>
        /// <param name="breach">Breach.</param>
        /// <param name="callerType">Principal a routed run executes as.</param>
        /// <param name="callerId">Identifier of that principal, or null.</param>
        /// <param name="callerName">Name of that principal, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The notice, or null when it was already sent or nobody can be asked.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or breach is null.</exception>
        public async Task<Escalation?> NotifyAsync(string tenantId, string? agentId, OrgBudgetBreach breach, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (breach == null) throw new ArgumentNullException(nameof(breach));
            if (Escalations == null) return null;
            DateTime now = DateTime.UtcNow;
            foreach (KeyValuePair<string, DateTime> stale in _Notified.Where(e => e.Value <= now).ToList()) _Notified.TryRemove(stale.Key, out DateTime _);
            string key = tenantId + "|" + breach.Unit.Id + "|" + breach.Spend.Period + "|" + breach.Spend.WindowStartUtc.Ticks.ToString(CultureInfo.InvariantCulture);
            if (!_Notified.TryAdd(key, breach.Spend.WindowEndUtc)) return null;

            string? manager = breach.Tree.Ancestors(breach.Unit.Id).Select(u => u.LeadAgentId).FirstOrDefault(l => !String.IsNullOrEmpty(l));
            string? person = callerType == PrincipalTypeEnum.User ? callerId : null;
            Escalation notice = new Escalation();
            notice.Severity = EscalationSeverityEnum.Urgent;
            notice.Question = "Unit " + breach.Unit.Name + " reached its " + (breach.Spend.Period == BudgetPeriodEnum.Month ? "monthly" : "daily") + " budget. Its subtree cannot start runs until the window resets. Raise the budget, or wait?";
            notice.Context = Message(breach);
            notice.Options = new List<EscalationOption>
            {
                new EscalationOption { Key = "wait", Label = "Wait for the window to reset", Order = 0 },
                new EscalationOption { Key = "raise", Label = "A person will raise the budget", Order = 1 }
            };
            notice.DefaultAnswer = "wait";
            notice.TimeoutAction = EscalationTimeoutActionEnum.UseDefaultAnswer;
            try
            {
                Escalation? raised = await Escalations.RaiseNoticeAsync(tenantId, breach.Unit.LeadAgentId ?? agentId, manager, person, notice, callerType, callerId, callerName, token).ConfigureAwait(false);
                if (raised == null) _Notified.TryRemove(key, out DateTime _);
                return raised;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Notified.TryRemove(key, out DateTime _);
                _Logging.Warn(_Header + "could not tell the manager of unit " + breach.Unit.Id + " about its budget: " + e.Message);
                return null;
            }
        }

        #endregion

        #region Private-Methods

        private static async Task<bool> CoveredAsync(FreezeService freezes, OrgBudgetBreach breach, CancellationToken token)
        {
            HashSet<string> units = new HashSet<string>(StringComparer.Ordinal) { breach.Unit.Id };
            foreach (OrgUnit above in breach.Tree.Ancestors(breach.Unit.Id)) units.Add(above.Id);
            foreach (Freeze active in await freezes.ActiveAsync(breach.Tree.Organization.TenantId, token).ConfigureAwait(false))
            {
                if (active.TargetKind == FreezeTargetKindEnum.OrgUnit && units.Contains(active.TargetId)) return true;
                if (active.TargetKind == FreezeTargetKindEnum.Organization && active.TargetId == breach.Tree.Organization.Id) return true;
            }
            return false;
        }

        private async Task<bool> FrozenThisWindowAsync(OrgBudgetBreach breach, CancellationToken token)
        {
            // The guard's freezes name their period and window in the reason; any of them, active or lifted, created inside
            // this window means the unit was already frozen for it.
            string marker = WindowMarker(breach.Spend);
            FreezeFilter filter = new FreezeFilter { TenantId = breach.Tree.Organization.TenantId, TargetKind = FreezeTargetKindEnum.OrgUnit, TargetId = breach.Unit.Id, MaxResults = 100 };
            EnumerationResult<Freeze> page = await _Database.Freezes.EnumerateAsync(filter, token).ConfigureAwait(false);
            return page.Objects.Any(f => f.CreatedByName == FreezerName && f.CreatedUtc >= breach.Spend.WindowStartUtc && (f.Reason ?? String.Empty).Contains(marker, StringComparison.Ordinal));
        }

        private static string WindowMarker(OrgUnitSpend spend)
        {
            return (spend.Period == BudgetPeriodEnum.Month ? "monthly" : "daily") + " budget window starting " + Iso(spend.WindowStartUtc);
        }

        private static string FreezeReason(OrgBudgetBreach breach)
        {
            string period = breach.Spend.Period == BudgetPeriodEnum.Month ? "monthly" : "daily";
            return "Budget guard: unit " + breach.Unit.Name + " of organization " + breach.Tree.Organization.Name + " spent " + Usd(breach.Spend.SpentUsd) + " USD against its " + period + " budget of "
                + Usd(breach.Spend.AmountUsd ?? 0) + " USD, past the freeze margin of " + breach.Tree.Organization.BudgetFreezeMarginPercent + " percent, in the " + WindowMarker(breach.Spend)
                + " (ends " + Iso(breach.Spend.WindowEndUtc) + "). The freeze stays until a person lifts it.";
        }

        private static NotificationBudgetFreezeSummary Summary(OrgBudgetBreach breach, Freeze freeze)
        {
            NotificationBudgetFreezeSummary summary = new NotificationBudgetFreezeSummary();
            summary.FreezeId = freeze.Id;
            summary.OrganizationId = breach.Tree.Organization.Id;
            summary.OrganizationName = breach.Tree.Organization.Name;
            summary.UnitId = breach.Unit.Id;
            summary.UnitName = breach.Unit.Name;
            summary.Period = breach.Spend.Period;
            summary.SpentUsd = breach.Spend.SpentUsd;
            summary.AmountUsd = breach.Spend.AmountUsd ?? 0;
            summary.MarginPercent = breach.Tree.Organization.BudgetFreezeMarginPercent;
            summary.WindowStartUtc = breach.Spend.WindowStartUtc;
            summary.WindowEndUtc = breach.Spend.WindowEndUtc;
            summary.CancelledRunCount = freeze.CancelledRunCount;
            summary.FrozenUtc = freeze.CreatedUtc;
            return summary;
        }

        private static string Iso(DateTime value)
        {
            return value.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture);
        }

        private async Task<OrgUnitSpend> SpendAsync(string tenantId, OrgTree tree, OrgUnit unit, OrgUnitBudget budget, DateTime utc, CancellationToken token)
        {
            DateTime start = OrganizationService.WindowStart(budget.Period, utc);
            string key = tenantId + "|" + tree.RevisionId + "|" + unit.Id + "|" + budget.Period + "|" + start.Ticks.ToString(CultureInfo.InvariantCulture);
            OrgUnitSpend spend = new OrgUnitSpend();
            spend.UnitId = unit.Id;
            spend.UnitName = unit.Name;
            spend.Period = budget.Period;
            spend.AmountUsd = budget.AmountUsd;
            spend.WindowStartUtc = start;
            spend.WindowEndUtc = budget.Period == BudgetPeriodEnum.Month ? start.AddMonths(1) : start.AddDays(1);
            DateTime now = DateTime.UtcNow;
            if (_SpendCacheSeconds > 0 && _Spend.TryGetValue(key, out OrgSpendCacheEntry? cached) && (now - cached.LoadedUtc).TotalSeconds < _SpendCacheSeconds)
            {
                spend.SpentUsd = cached.SpentUsd;
                return spend;
            }
            spend.SpentUsd = await _Database.UsageQuotas.ReadAgentSpendAsync(tenantId, tree.SubtreeAgentIds(unit.Id), spend.WindowStartUtc, spend.WindowEndUtc, token).ConfigureAwait(false);
            if (_Spend.Count > 4096) _Spend.Clear();
            _Spend[key] = new OrgSpendCacheEntry(spend.SpentUsd, now);
            return spend;
        }

        /// <summary>
        /// Release the gauge registration.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                _Gauge.Dispose();
                _FreezeLock.Dispose();
            }
            _Disposed = true;
        }

        private IEnumerable<Measurement<double>> ObserveExhausted()
        {
            DateTime now = DateTime.UtcNow;
            int day = 0;
            int month = 0;
            foreach (KeyValuePair<string, DateTime> entry in _Notified)
            {
                if (entry.Value <= now) continue;
                if (entry.Key.Contains("|" + BudgetPeriodEnum.Month + "|", StringComparison.Ordinal)) month++;
                else day++;
            }
            return new Measurement<double>[] { GarrisonMetrics.Measure(day, "period", "day"), GarrisonMetrics.Measure(month, "period", "month") };
        }

        private static string Usd(double value)
        {
            return value.ToString("0.####", CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
