namespace Garrison.Server.Settings
{
    using System;

    /// <summary>
    /// Archival of runs and run events removed by retention (P10.12). Node-local and restart-required, because the
    /// directory is a path on the replica's own filesystem.
    /// </summary>
    public class ArchiveSettings
    {
        #region Public-Members

        /// <summary>
        /// Directory that receives JSON Lines archives of pruned runs (with their events) and pruned events before they
        /// are deleted. Null or empty (the default) deletes without archiving. With several replicas, mount the same
        /// volume at this path in each, because whichever replica is the leader writes the archive. Override with
        /// GARRISON_ARCHIVE_DIRECTORY.
        /// </summary>
        public string? Directory { get; set; } = null;

        /// <summary>
        /// Whether archiving is configured.
        /// </summary>
        public bool Enabled
        {
            get
            {
                return !String.IsNullOrWhiteSpace(Directory);
            }
        }

        #endregion
    }
}
