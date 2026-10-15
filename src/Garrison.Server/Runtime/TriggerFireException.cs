namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// A trigger fire could not start its run (P12.5): the run-as principal lost its permission, the target or input
    /// template no longer exists, or the input template failed to render. Recorded on the fire as errorCode and
    /// errorMessage; never returned to a webhook sender as an HTTP error.
    /// </summary>
    public class TriggerFireException : Exception
    {
        #region Public-Members

        /// <summary>
        /// Stable error code, for example RunAsNotAuthorized, AgentNotFound, PipelineNotFound, InputTemplateNotFound, or
        /// TemplateRenderFailed.
        /// </summary>
        public string Code { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">Stable error code; null or empty becomes FireFailed.</param>
        /// <param name="message">Message.</param>
        public TriggerFireException(string code, string message) : base(message)
        {
            Code = String.IsNullOrEmpty(code) ? "FireFailed" : code;
        }

        #endregion
    }
}
