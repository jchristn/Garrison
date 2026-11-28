namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One step of an activity trail (LP1.3). It carries identifiers, kinds, states, times, the names people gave agents,
    /// units, and callers, and totals, never text an agent wrote (LP-002). Properties that are null are left out of the
    /// JSON. Not thread-safe; build it on one thread.
    /// </summary>
    public class RunTrailNode
    {
        #region Public-Members

        /// <summary>
        /// Identifier of the record this step shows (run, message, report, and so on). For a Caller node it is the
        /// caller's principal identifier; for a Reply node it is rep_ followed by the root run's identifier; for a Redacted
        /// node it is a placeholder (red_1, red_2, ...) that reveals nothing. Never null or empty.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when set to null or empty.</exception>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                if (String.IsNullOrEmpty(value)) throw new ArgumentNullException(nameof(Id));
                _Id = value;
            }
        }

        /// <summary>
        /// What the step is. Default Run.
        /// </summary>
        public RunTrailNodeKindEnum Kind { get; set; } = RunTrailNodeKindEnum.Run;

        /// <summary>
        /// The record's state as its own enumeration names it (a run's status, a message's status, Filed for a report),
        /// or null when the kind has none.
        /// </summary>
        public string? State { get; set; } = null;

        /// <summary>
        /// Agent the step belongs to (the run's agent, a message's sender, a report's author), or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Name of that agent, as a person named it, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Unit of the agent in a live organization, from the published revision in force now, or null.
        /// </summary>
        public string? UnitId { get; set; } = null;

        /// <summary>
        /// Name of that unit, or null.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Deployment of a run or approval, or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// When the step started (UTC), or null when unknown.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// When the step ended (UTC), or null while it is still open or when the kind has no end.
        /// </summary>
        public DateTime? EndedUtc { get; set; } = null;

        /// <summary>
        /// Milliseconds from start to end, or null when either is unknown. Never negative.
        /// </summary>
        public long? DurationMs
        {
            get
            {
                return _DurationMs;
            }
            set
            {
                _DurationMs = value.HasValue ? Math.Max(0, value.Value) : null;
            }
        }

        /// <summary>
        /// Input tokens of a run, or null for other kinds.
        /// </summary>
        public long? InputTokens { get; set; } = null;

        /// <summary>
        /// Output tokens of a run, or null for other kinds.
        /// </summary>
        public long? OutputTokens { get; set; } = null;

        /// <summary>
        /// Cost of a run in US dollars, or null when unknown or for other kinds.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Kind of a run (Invoke, Delegated, Message, Keeper, and so on), or null for other kinds.
        /// </summary>
        public RunKindEnum? RunKind { get; set; } = null;

        /// <summary>
        /// True for the run the trail was requested for. Default false.
        /// </summary>
        public bool IsFocus { get; set; } = false;

        /// <summary>
        /// Lane of the sequence view: the agent identifier, or caller for steps of the caller (Caller, Trigger,
        /// KeeperTick, PipelineRun, Reply, and messages a person sent). Never null; default caller.
        /// </summary>
        public string Lane
        {
            get
            {
                return _Lane;
            }
            set
            {
                _Lane = String.IsNullOrEmpty(value) ? CallerLane : value;
            }
        }

        /// <summary>
        /// Principal type of the caller on Caller and Reply nodes, or null.
        /// </summary>
        public PrincipalTypeEnum? CallerType { get; set; } = null;

        /// <summary>
        /// Name of the caller (a user's email, a credential's or trigger's name) on Caller and Reply nodes, or null.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Tool name of an Effect node, never its arguments, or null.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// The kind a Redacted node stands for, or null on every other node.
        /// </summary>
        public RunTrailNodeKindEnum? RedactedKind { get; set; } = null;

        /// <summary>
        /// How the work came in (LP-013): on a Caller node, the entry surface of the run the caller started; on a Run node
        /// that starts a leg of the work (no parent and not a retry), its own entry surface. Null elsewhere, and on runs
        /// created before the entry surface was recorded.
        /// </summary>
        public EntrySurfaceEnum? EntrySurface { get; set; } = null;

        /// <summary>
        /// The lane name used for the caller's steps: caller.
        /// </summary>
        public static string CallerLane
        {
            get
            {
                return _CallerLane;
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _CallerLane = "caller";
        private string _Id = "unknown";
        private long? _DurationMs = null;
        private string _Lane = _CallerLane;

        #endregion
    }
}
