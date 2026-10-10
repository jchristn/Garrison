namespace Garrison.Core.Responses
{
    using System;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

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

        #region Public-Methods

        /// <summary>
        /// Copy a page into a response.
        /// </summary>
        /// <param name="page">Page.</param>
        /// <param name="respondingNodeId">Node ID of the answering replica.</param>
        /// <returns>Response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when page is null.</exception>
        public static ControlNodeListResponse From(EnumerationResult<ControlNode> page, string respondingNodeId)
        {
            if (page == null) throw new ArgumentNullException(nameof(page));
            ControlNodeListResponse response = new ControlNodeListResponse();
            response.Success = page.Success;
            response.MaxResults = page.MaxResults;
            response.Skip = page.Skip;
            response.TotalRecords = page.TotalRecords;
            response.RecordsRemaining = page.RecordsRemaining;
            response.EndOfResults = page.EndOfResults;
            response.TimestampUtc = page.TimestampUtc;
            response.Objects = page.Objects;
            response.RespondingNodeId = respondingNodeId;
            return response;
        }

        #endregion
    }
}
