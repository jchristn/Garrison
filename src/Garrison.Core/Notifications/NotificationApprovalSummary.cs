namespace Garrison.Core.Notifications
{
    using System;

    /// <summary>
    /// Fields carried by an ApprovalRequested notification (P12.14): a permission approval (kind Permission) or a pipeline
    /// stage review (kind StageReview). The tool input is never included.
    /// </summary>
    public class NotificationApprovalSummary
    {
        #region Public-Members

        /// <summary>
        /// Permission or StageReview.
        /// </summary>
        public string Kind { get; set; } = "Permission";

        /// <summary>
        /// Approval identifier (apr_) or review identifier (prv_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Run the approval or review belongs to.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier (permission approvals), or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agent name (permission approvals), or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Deployment identifier (permission approvals), or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Tool the harness asked to use (permission approvals), or null.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// Pipeline run identifier (stage reviews), or null.
        /// </summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Pipeline name (stage reviews), or null.
        /// </summary>
        public string? PipelineName { get; set; } = null;

        /// <summary>
        /// Stage name (stage reviews), or null.
        /// </summary>
        public string? StageName { get; set; } = null;

        /// <summary>
        /// When the decision was requested (UTC).
        /// </summary>
        public DateTime RequestedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the request expires (UTC), or null when it waits indefinitely.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationApprovalSummary()
        {
        }

        #endregion
    }
}
