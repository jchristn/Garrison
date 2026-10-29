namespace Garrison.Server.Settings
{
    using System;

    /// <summary>
    /// Conversation file space limits (AD3.2). A write over a limit is refused with 413 naming the setting.
    /// </summary>
    public class FileSpaceSettings
    {
        #region Public-Members

        /// <summary>
        /// Largest single file, in bytes. Default 33554432 (32 MiB); minimum 1024; maximum 268435456 (256 MiB). Files in an
        /// external store are also bounded by Artifacts.MaxFileBytes when read. Environment: GARRISON_FILESPACES_MAX_FILE_BYTES.
        /// </summary>
        public long MaxFileBytes
        {
            get
            {
                return _MaxFileBytes;
            }
            set
            {
                _MaxFileBytes = Math.Clamp(value, 1024L, 268435456L);
            }
        }

        /// <summary>
        /// Largest total of the current versions of all files in one space, in bytes. Default 268435456 (256 MiB);
        /// minimum 1048576; maximum 10737418240 (10 GiB). Environment: GARRISON_FILESPACES_MAX_TOTAL_BYTES.
        /// </summary>
        public long MaxTotalBytes
        {
            get
            {
                return _MaxTotalBytes;
            }
            set
            {
                _MaxTotalBytes = Math.Clamp(value, 1048576L, 10737418240L);
            }
        }

        /// <summary>
        /// Most files in one space (deleted files do not count). Default 1000; minimum 1; maximum 100000. Environment:
        /// GARRISON_FILESPACES_MAX_FILES.
        /// </summary>
        public int MaxFiles
        {
            get
            {
                return _MaxFiles;
            }
            set
            {
                _MaxFiles = Math.Clamp(value, 1, 100000);
            }
        }

        #endregion

        #region Private-Members

        private long _MaxFileBytes = 33554432L;
        private long _MaxTotalBytes = 268435456L;
        private int _MaxFiles = 1000;

        #endregion
    }
}
