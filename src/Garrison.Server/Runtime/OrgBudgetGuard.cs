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
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Org unit budgets at admission (AA7.6, scope OrgUnit): a run of an agent whose unit, or any unit above it, has spent
    /// its budget for the current day or month is refused with 409 BudgetExhausted, and the capped unit's manager (the
    /// lead above it, or the person behind the run when the board is above) is told once per budget window. Spend is the
    /// known cost of the subtree's agents' runs completed in the window, read from the usage ledger and cached briefly.
    /// Thread-safe.
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
            if (disposing) _Gauge.Dispose();
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
