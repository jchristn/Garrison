namespace Garrison.Server.Settings
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>Optional external coordination. Configure every replica consistently; changes require restart.</summary>
    public class LeaseSettings
    {
        /// <summary>Coordination provider. Default Database.</summary>
        public LeaseProviderKindEnum Provider { get; set; } = LeaseProviderKindEnum.Database;
        /// <summary>Clutch HTTP(S) or WebSocket endpoint, required only when Clutch is selected.</summary>
        public string? ClutchEndpoint { get; set; } = null;
        /// <summary>Clutch access key; preferably supplied through GARRISON_CLUTCH_ACCESS_KEY. Never log it.</summary>
        public string? ClutchAccessKey { get; set; } = null;
        /// <summary>Unique deployment namespace for Clutch keys. Default garrison; nonempty, maximum 128 characters.</summary>
        public string KeyPrefix { get { return _KeyPrefix; } set { _KeyPrefix = String.IsNullOrWhiteSpace(value) ? "garrison" : value.Trim('/'); } }
        /// <summary>Bounded Clutch request/ack wait. Default 5000 ms; range 250 to 120000.</summary>
        public int RequestTimeoutMs { get { return _RequestTimeoutMs; } set { _RequestTimeoutMs = Math.Clamp(value, 250, 120000); } }
        /// <summary>Expired explicit-hold sweep interval. Default 250 ms; range 50 to 5000.</summary>
        public int SweepIntervalMs { get { return _SweepIntervalMs; } set { _SweepIntervalMs = Math.Clamp(value, 50, 5000); } }
        /// <summary>Maximum lease requested in first-acquirer key policy. Default 300000 ms; range 3000 to 3600000.</summary>
        public int MaxLeaseMs { get { return _MaxLeaseMs; } set { _MaxLeaseMs = Math.Clamp(value, 3000, 3600000); } }
        /// <summary>Maximum continuous remote hold before reacquisition. Default 3600000 ms; range 3000 to 86400000.</summary>
        public int MaxHoldMs { get { return _MaxHoldMs; } set { _MaxHoldMs = Math.Clamp(value, 3000, 86400000); } }
        private string _KeyPrefix = "garrison";
        private int _RequestTimeoutMs = 5000;
        private int _SweepIntervalMs = 250;
        private int _MaxLeaseMs = 300000;
        private int _MaxHoldMs = 3600000;
    }
}
