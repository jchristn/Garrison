namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A freeze (AA3): while it is active, new runs in its scope are refused with 409 Frozen and keepers in its scope stop
    /// ticking. Lifting it is the only way to undo it. Not thread-safe.
    /// </summary>
    public class Freeze
    {
        #region Public-Members

        /// <summary>
        /// Freeze identifier (mfz_). Assigned by the server.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier. Assigned by the server.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// What the freeze stops. Default Agent.
        /// </summary>
        public FreezeTargetKindEnum TargetKind { get; set; } = FreezeTargetKindEnum.Agent;

        /// <summary>
        /// The frozen resource. On create it takes an identifier or a name; the server stores the identifier.
        /// </summary>
        public string TargetId { get; set; } = String.Empty;

        /// <summary>
        /// Name of the frozen resource when it was frozen, or null. Assigned by the server.
        /// </summary>
        public string? TargetName { get; set; } = null;

        /// <summary>
        /// Why it was frozen, or null. At most 2000 characters.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// True to also cancel the runs already in scope when the freeze is applied. Default false.
        /// </summary>
        public bool CancelActiveRuns { get; set; } = false;

        /// <summary>
        /// How many runs applying the freeze cancelled. Assigned by the server.
        /// </summary>
        public int CancelledRunCount { get; set; } = 0;

        /// <summary>
        /// Who applied it, or null. Assigned by the server.
        /// </summary>
        public string? CreatedById { get; set; } = null;

        /// <summary>
        /// Display name of who applied it, or null. Assigned by the server.
        /// </summary>
        public string? CreatedByName { get; set; } = null;

        /// <summary>
        /// Who lifted it, or null while it is active.
        /// </summary>
        public string? LiftedById { get; set; } = null;

        /// <summary>
        /// Display name of who lifted it, or null while it is active.
        /// </summary>
        public string? LiftedByName { get; set; } = null;

        /// <summary>
        /// Why it was lifted, or null.
        /// </summary>
        public string? LiftReason { get; set; } = null;

        /// <summary>
        /// When it was lifted (UTC), or null while it is active.
        /// </summary>
        public DateTime? LiftedUtc { get; set; } = null;

        /// <summary>
        /// True until the freeze is lifted.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// When it was applied (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When it last changed (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion
    }
}
