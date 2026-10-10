namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;
    using Garrison.Server.Backplane;

    /// <summary>
    /// Cluster topology settings read at startup.
    /// </summary>
    public class ClusterSettingsBootstrap
    {
        #region Public-Members

        /// <summary>
        /// Expected number of control-plane replicas. Values above 1 require Postgresql. Minimum 1, maximum 1000, default 1.
        /// </summary>
        public int ExpectedReplicas
        {
            get
            {
                return _ExpectedReplicas;
            }
            set
            {
                _ExpectedReplicas = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Whether the settings file is managed externally (for example a Kubernetes ConfigMap) and must not be written. Default false.
        /// </summary>
        public bool SettingsFileReadOnly { get; set; } = false;

        /// <summary>
        /// Event backplane between replicas (P10.4). Auto (the default) uses PostgresNotify on Postgresql and Local on
        /// Sqlite. Polling works on both providers. Override with GARRISON_BACKPLANE.
        /// </summary>
        public BackplaneModeEnum Backplane { get; set; } = BackplaneModeEnum.Auto;

        /// <summary>
        /// Poll interval of the Polling backplane in milliseconds. Minimum 50, maximum 10000, default 250.
        /// </summary>
        public int BackplanePollMs
        {
            get
            {
                return _BackplanePollMs;
            }
            set
            {
                _BackplanePollMs = Math.Clamp(value, 50, 10000);
            }
        }

        #endregion

        #region Private-Members

        private int _ExpectedReplicas = 1;
        private int _BackplanePollMs = 250;

        #endregion
    }
}
