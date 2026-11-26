namespace Garrison.Core.Services
{
    using System;

    /// <summary>
    /// A promotion refused by an environment's eval gate (AA9.6, AD11.4): code EvalGateFailed (HTTP 409). The message
    /// names the gate set, the threshold, and the eval run that decided it, which <see cref="EvalRunId"/> also carries.
    /// </summary>
    public class EvalGateFailedException : ConflictException
    {
        #region Public-Members

        /// <summary>
        /// Error code.
        /// </summary>
        public static readonly string ErrorCode = "EvalGateFailed";

        /// <summary>
        /// The most recent eval run of the candidate against the gate set, or null when there is none.
        /// </summary>
        public string? EvalRunId { get; }

        /// <summary>
        /// Name of the gate's eval set.
        /// </summary>
        public string SetName { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="setName">Gate set name.</param>
        /// <param name="evalRunId">Deciding eval run, or null.</param>
        /// <param name="message">Message for the caller.</param>
        public EvalGateFailedException(string setName, string? evalRunId, string message) : base(ErrorCode, message)
        {
            SetName = setName ?? String.Empty;
            EvalRunId = evalRunId;
        }

        #endregion
    }
}
