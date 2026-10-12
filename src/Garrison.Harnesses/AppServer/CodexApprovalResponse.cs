namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Answer to <c>item/commandExecution/requestApproval</c> and <c>item/fileChange/requestApproval</c>.
    /// </summary>
    public class CodexApprovalResponse
    {
        #region Public-Members

        /// <summary>
        /// Decision: accept, acceptForSession, decline, or cancel. Default decline.
        /// </summary>
        [JsonPropertyName("decision")]
        public string Decision
        {
            get
            {
                return _Decision;
            }
            set
            {
                _Decision = value ?? "decline";
            }
        }

        #endregion

        #region Private-Members

        private string _Decision = "decline";

        #endregion
    }
}
