namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Fields carried by FreezeApplied notifications (AA3.6).
    /// </summary>
    public class NotificationFreezeSummary
    {
        #region Public-Members

        /// <summary>
        /// Freeze identifier (mfz_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// What the freeze stops. TenantAutonomy is the autonomy kill switch.
        /// </summary>
        public FreezeTargetKindEnum TargetKind { get; set; } = FreezeTargetKindEnum.Agent;

        /// <summary>
        /// Target identifier.
        /// </summary>
        public string TargetId { get; set; } = String.Empty;

        /// <summary>
        /// Target name when the freeze was applied, or null.
        /// </summary>
        public string? TargetName { get; set; } = null;

        /// <summary>
        /// Why it was applied, cut to 2000 characters, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Whether applying it cancelled the runs in its scope.
        /// </summary>
        public bool CancelActiveRuns { get; set; } = false;

        /// <summary>
        /// Who applied it, or null.
        /// </summary>
        public string? CreatedByName { get; set; } = null;

        /// <summary>
        /// When it was applied (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationFreezeSummary()
        {
        }

        #endregion
    }
}
