namespace Garrison.Sdk.Responses
{
    using System;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Models;

    /// <summary>
    /// A page of control-plane replicas (P10.19), with the node ID of the replica that answered.
    /// </summary>
    public class ControlNodeListResponse : EnumerationResult<ControlNode>
    {
        #region Public-Members

        /// <summary>
        /// Node ID of the replica that answered the request.
        /// </summary>
        public string RespondingNodeId
        {
            get
            {
                return _RespondingNodeId;
            }
            set
            {
                _RespondingNodeId = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _RespondingNodeId = String.Empty;

        #endregion
    }
}
