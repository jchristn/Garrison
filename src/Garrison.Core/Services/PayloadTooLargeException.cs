namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// Raised when an upload exceeds a configured size or count limit; mapped to 413 with the code and the name of the
    /// setting that limits it.
    /// </summary>
    public class PayloadTooLargeException : Exception
    {
        #region Public-Members

        /// <summary>
        /// Stable error code, for example AssetFileTooLarge.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Name of the setting that sets the limit, for example Assets.MaxFileBytes.
        /// </summary>
        public string Setting { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">Stable error code.</param>
        /// <param name="setting">Setting that sets the limit.</param>
        /// <param name="message">Message; it should name the setting and the limit.</param>
        public PayloadTooLargeException(string code, string setting, string message) : base(message)
        {
            Code = String.IsNullOrEmpty(code) ? "PayloadTooLarge" : code;
            Setting = setting ?? String.Empty;
        }

        #endregion
    }
}
