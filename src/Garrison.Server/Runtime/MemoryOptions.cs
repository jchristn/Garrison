namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Scoped memory options (AA4), refreshed from the Memory.Scoped.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class MemoryOptions
    {
        #region Public-Members

        /// <summary>
        /// Whether the shared scopes (App, OrgUnit, Organization) may be used. Default true. When false, only the Agent
        /// scope works. Cluster setting Memory.Scoped.Enabled.
        /// </summary>
        public bool ScopedEnabled { get; set; } = true;

        /// <summary>
        /// Most UTF-8 bytes in one entry. Minimum 1, maximum 1048576, default 65536. Cluster setting
        /// Memory.Scoped.MaxValueBytes.
        /// </summary>
        public int MaxValueBytes
        {
            get
            {
                return _MaxValueBytes;
            }
            set
            {
                _MaxValueBytes = Math.Clamp(value, 1, 1048576);
            }
        }

        /// <summary>
        /// Most entries in one scope. Minimum 10, maximum 1000000, default 10000. Cluster setting
        /// Memory.Scoped.MaxEntriesPerScope.
        /// </summary>
        public int MaxEntriesPerScope
        {
            get
            {
                return _MaxEntriesPerScope;
            }
            set
            {
                _MaxEntriesPerScope = Math.Clamp(value, 10, 1000000);
            }
        }

        /// <summary>
        /// Most entries whose content a search reads when it also matches text inside entries, newest writes first.
        /// Minimum 1, maximum 10000, default 200. Key, category, and tag matches are not limited by this.
        /// </summary>
        public int ContentSearchLimit
        {
            get
            {
                return _ContentSearchLimit;
            }
            set
            {
                _ContentSearchLimit = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Seconds content must be old before the orphan sweep may remove it, so a write in progress is never removed.
        /// Minimum 60, maximum 86400, default 600.
        /// </summary>
        public int OrphanGraceSeconds
        {
            get
            {
                return _OrphanGraceSeconds;
            }
            set
            {
                _OrphanGraceSeconds = Math.Clamp(value, 60, 86400);
            }
        }

        /// <summary>
        /// Seconds between two orphan sweeps of the same tenant. Minimum 60, maximum 604800, default 3600.
        /// </summary>
        public int OrphanSweepIntervalSeconds
        {
            get
            {
                return _OrphanSweepIntervalSeconds;
            }
            set
            {
                _OrphanSweepIntervalSeconds = Math.Clamp(value, 60, 604800);
            }
        }

        /// <summary>
        /// Most expired entries the leader deletes in one sweep. Minimum 1, maximum 10000, default 500.
        /// </summary>
        public int MaxExpiredPerSweep
        {
            get
            {
                return _MaxExpiredPerSweep;
            }
            set
            {
                _MaxExpiredPerSweep = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Most attempts of a write without expectedVersion that keeps losing to concurrent writers of the same key before
        /// it fails with MemoryVersionConflict. Minimum 1, maximum 100, default 10.
        /// </summary>
        public int MaxWriteAttempts
        {
            get
            {
                return _MaxWriteAttempts;
            }
            set
            {
                _MaxWriteAttempts = Math.Clamp(value, 1, 100);
            }
        }

        /// <summary>
        /// Tag that marks an agent's own entries for recall into each of its keeper ticks (AA4.8). Default "recall".
        /// </summary>
        public string RecallTag
        {
            get
            {
                return _RecallTag;
            }
            set
            {
                _RecallTag = String.IsNullOrWhiteSpace(value) ? "recall" : value.Trim().ToLowerInvariant();
            }
        }

        /// <summary>
        /// Most entries recalled into one keeper tick, in key order. Minimum 0 (recall off), maximum 100, default 20.
        /// </summary>
        public int RecallMaxEntries
        {
            get
            {
                return _RecallMaxEntries;
            }
            set
            {
                _RecallMaxEntries = Math.Clamp(value, 0, 100);
            }
        }

        /// <summary>
        /// Most UTF-8 bytes of entry text recalled into one keeper tick; entries past the limit are left out. Minimum 0,
        /// maximum 262144, default 16384.
        /// </summary>
        public int RecallMaxBytes
        {
            get
            {
                return _RecallMaxBytes;
            }
            set
            {
                _RecallMaxBytes = Math.Clamp(value, 0, 262144);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxValueBytes = 65536;
        private int _MaxEntriesPerScope = 10000;
        private int _ContentSearchLimit = 200;
        private int _OrphanGraceSeconds = 600;
        private int _OrphanSweepIntervalSeconds = 3600;
        private int _MaxExpiredPerSweep = 500;
        private int _MaxWriteAttempts = 10;
        private string _RecallTag = "recall";
        private int _RecallMaxEntries = 20;
        private int _RecallMaxBytes = 16384;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryOptions()
        {
        }

        #endregion
    }
}
