namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A brake a person applies (AA3, AA-017): while it is active, new runs in its scope are refused with 409 Frozen and
    /// keepers in its scope do not tick. Lifting it ends it; a lifted freeze is kept as history. The autonomy kill switch is
    /// a freeze with target kind TenantAutonomy. Not thread-safe.
    /// </summary>
    public class Freeze
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix mfz_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewFreezeId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// What the freeze stops. Default Agent.
        /// </summary>
        public FreezeTargetKindEnum TargetKind { get; set; } = FreezeTargetKindEnum.Agent;

        /// <summary>
        /// Identifier of the frozen agent, deployment, mandate, or app. A request may name the agent, deployment, mandate,
        /// or app instead; the server stores the identifier. For TenantAutonomy it is the tenant identifier.
        /// </summary>
        public string TargetId
        {
            get
            {
                return _TargetId;
            }
            set
            {
                _TargetId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name of the target when the freeze was applied, for display. Set by the server.
        /// </summary>
        public string? TargetName { get; set; } = null;

        /// <summary>
        /// Why the freeze was applied. Optional, at most 2000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Whether applying the freeze also cancelled the runs already in its scope. Default false: runs in flight finish.
        /// </summary>
        public bool CancelActiveRuns { get; set; } = false;

        /// <summary>
        /// How many runs applying the freeze cancelled. Set by the server.
        /// </summary>
        public int CancelledRunCount { get; set; } = 0;

        /// <summary>
        /// Identifier of the person or credential that applied it.
        /// </summary>
        public string? CreatedById { get; set; } = null;

        /// <summary>
        /// Name of the person or credential that applied it.
        /// </summary>
        public string? CreatedByName { get; set; } = null;

        /// <summary>
        /// Identifier of the person or credential that lifted it, or null while active.
        /// </summary>
        public string? LiftedById { get; set; } = null;

        /// <summary>
        /// Name of the person or credential that lifted it, or null while active.
        /// </summary>
        public string? LiftedByName { get; set; } = null;

        /// <summary>
        /// Why it was lifted. Optional, at most 2000 characters.
        /// </summary>
        public string? LiftReason { get; set; } = null;

        /// <summary>
        /// When it was lifted (UTC), or null while active.
        /// </summary>
        public DateTime? LiftedUtc { get; set; } = null;

        /// <summary>
        /// True while the freeze has not been lifted. Read-only.
        /// </summary>
        public bool Active
        {
            get
            {
                return !LiftedUtc.HasValue;
            }
        }

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewFreezeId();
        private string _TenantId = String.Empty;
        private string _TargetId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Freeze()
        {
        }

        #endregion
    }
}
