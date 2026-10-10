namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Machine-readable payload stored in the raw JSON of the Warning run event that explains a blocked run. Lets a new
    /// leader see which reasons were already explained.
    /// </summary>
    public class BlockedRunNotice
    {
        #region Public-Members

        /// <summary>
        /// Notice kind written by Garrison.
        /// </summary>
        public static string KindName
        {
            get
            {
                return "RunBlocked";
            }
        }

        /// <summary>
        /// Notice kind. Garrison writes <see cref="KindName"/>; empty when the property is absent.
        /// </summary>
        public string Notice
        {
            get
            {
                return _Notice;
            }
            set
            {
                _Notice = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The reason the run was blocked.
        /// </summary>
        public RunBlockedReasonEnum? BlockedReason { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Notice = String.Empty;

        #endregion
    }
}
