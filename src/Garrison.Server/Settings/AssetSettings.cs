namespace Garrison.Server.Settings
{
    using System;

    /// <summary>
    /// Agent asset limits (AD2.2). Each upload is checked against them and refused with 413 naming the setting.
    /// </summary>
    public class AssetSettings
    {
        #region Public-Members

        /// <summary>
        /// Largest single asset file, in bytes. Default 16777216 (16 MiB); minimum 1024; maximum 268435456 (256 MiB).
        /// Files kept in an external artifact store are also bounded by Artifacts.MaxFileBytes when they are read.
        /// Environment: GARRISON_ASSETS_MAX_FILE_BYTES.
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
        /// Largest total of all files in one asset version, in bytes. Default 67108864 (64 MiB); minimum 1024; maximum
        /// 1073741824 (1 GiB). Environment: GARRISON_ASSETS_MAX_VERSION_BYTES.
        /// </summary>
        public long MaxVersionBytes
        {
            get
            {
                return _MaxVersionBytes;
            }
            set
            {
                _MaxVersionBytes = Math.Clamp(value, 1024L, 1073741824L);
            }
        }

        /// <summary>
        /// Most files in one asset version. Default 200; minimum 1; maximum 1000. Environment:
        /// GARRISON_ASSETS_MAX_FILES_PER_VERSION.
        /// </summary>
        public int MaxFilesPerVersion
        {
            get
            {
                return _MaxFilesPerVersion;
            }
            set
            {
                _MaxFilesPerVersion = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Whether macro-enabled Office files (.dotm, .docm, .xlsm, .pptm) may be uploaded as assets. Default false: such
        /// uploads are refused with MacroFormatRefused. Environment: GARRISON_ASSETS_ALLOW_MACRO_FORMATS.
        /// </summary>
        public bool AllowMacroFormats { get; set; } = false;

        #endregion

        #region Private-Members

        private long _MaxFileBytes = 16777216L;
        private long _MaxVersionBytes = 67108864L;
        private int _MaxFilesPerVersion = 200;

        #endregion
    }
}
