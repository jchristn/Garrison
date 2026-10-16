namespace Garrison.Server.Settings
{
    using System;

    /// <summary>Operator-only HTTP issuer configuration loaded from the settings file. Never tenant-editable.</summary>
    public class CredentialBrokerSettings
    {
        private int _MaxTtlSeconds = 3600;
        private int _TimeoutSeconds = 15;
        private int _MaxConcurrency = 4;
        /// <summary>Enable revocable lease credentials. Default false.</summary>
        public bool Enabled { get; set; }
        /// <summary>Absolute trusted credential issue endpoint. No redirects are followed.</summary>
        public string? IssuerUrl { get; set; }
        /// <summary>Absolute trusted idempotent credential revocation endpoint.</summary>
        public string? RevokerUrl { get; set; }
        /// <summary>Operator provider authorization bearer token, read from the settings file only. Never returned to tenants.</summary>
        public string? AuthorizationToken { get; set; }
        /// <summary>Allow private and loopback provider addresses. Default false; metadata/link-local destinations are always refused.</summary>
        public bool AllowPrivateDestinations { get; set; }
        /// <summary>Maximum requested token TTL, seconds. Default 3600, minimum 30, maximum 86400. Runs with longer remaining deadlines fail closed.</summary>
        public int MaxTtlSeconds { get { return _MaxTtlSeconds; } set { _MaxTtlSeconds = Math.Clamp(value, 30, 86400); } }
        /// <summary>Maximum simultaneous revocation requests. Default 4, minimum 1, maximum 32.</summary>
        public int MaxConcurrency { get { return _MaxConcurrency; } set { _MaxConcurrency = Math.Clamp(value, 1, 32); } }
        /// <summary>Provider request timeout, seconds. Default 15, range 1 to 120.</summary>
        public int TimeoutSeconds { get { return _TimeoutSeconds; } set { _TimeoutSeconds = Math.Clamp(value, 1, 120); } }
    }
}
