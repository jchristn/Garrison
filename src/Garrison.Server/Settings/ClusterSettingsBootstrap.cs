namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;

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

        #endregion

        #region Private-Members

        private int _ExpectedReplicas = 1;

        #endregion
    }
}
