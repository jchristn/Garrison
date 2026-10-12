namespace Garrison.Core.Protocol
{
    using System;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;

    /// <summary>
    /// A permission approval of a run the worker holds, delivered by the watch long poll (P12.3) so the worker records it
    /// in the run's event stream. The worker is the only writer of a leased run's events, so approval events come
    /// through it instead of being inserted by the control plane.
    /// </summary>
    public class NodeApprovalNotice
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Approval identifier.
        /// </summary>
        public string ApprovalId { get; set; } = String.Empty;

        /// <summary>
        /// Status.
        /// </summary>
        public ApprovalStatusEnum Status { get; set; } = ApprovalStatusEnum.Pending;

        /// <summary>
        /// Decision, or null while Pending.
        /// </summary>
        public ApprovalDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Who or what decided, or null while Pending.
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Tool name.
        /// </summary>
        public string ToolName { get; set; } = String.Empty;

        /// <summary>
        /// Redacted one-line summary, or null.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// Rule pattern that matched, or null.
        /// </summary>
        public string? RulePattern { get; set; } = null;

        /// <summary>
        /// Who decided, or null.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// Reason, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// When the harness asked (UTC), or null.
        /// </summary>
        public DateTime? RequestedUtc { get; set; } = null;

        /// <summary>
        /// When the approval was decided (UTC), or null while Pending.
        /// </summary>
        public DateTime? DecidedUtc { get; set; } = null;

        /// <summary>
        /// When a pending approval expires (UTC), or null.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Key the worker reports back in <see cref="NodeWatchRequest.KnownApprovals"/>: approval ID and status.
        /// </summary>
        [JsonIgnore]
        public string Key
        {
            get
            {
                return KeyOf(ApprovalId, Status);
            }
        }

        /// <summary>
        /// Run event code for this notice: ApprovalRequested while Pending, otherwise ApprovalDecided.
        /// </summary>
        [JsonIgnore]
        public string EventCode
        {
            get
            {
                return Status == ApprovalStatusEnum.Pending ? "ApprovalRequested" : "ApprovalDecided";
            }
        }

        /// <summary>
        /// One-line description for the run's event stream.
        /// </summary>
        /// <returns>Text.</returns>
        public string Describe()
        {
            string subject = ToolName + (String.IsNullOrWhiteSpace(Summary) ? String.Empty : " (" + Summary + ")");
            if (Status == ApprovalStatusEnum.Pending)
            {
                return "Waiting for a person to approve " + subject + "; approval " + ApprovalId + (ExpiresUtc.HasValue ? " expires at " + ExpiresUtc.Value.ToString("u") : String.Empty) + ".";
            }
            string verdict = Decision == ApprovalDecisionEnum.Allow ? "allowed" : "denied";
            string by;
            switch (DecisionSource)
            {
                case ApprovalSourceEnum.Rule:
                    by = "by rule " + (RulePattern ?? String.Empty);
                    break;
                case ApprovalSourceEnum.Default:
                    by = "by the deployment default";
                    break;
                case ApprovalSourceEnum.User:
                    by = "by " + (DecidedBy ?? "a person");
                    break;
                case ApprovalSourceEnum.Timeout:
                    by = "after the approval expired";
                    break;
                default:
                    by = "because the run is stopping";
                    break;
            }
            return subject + " " + verdict + " " + by + " (approval " + ApprovalId + ")" + (String.IsNullOrWhiteSpace(Reason) || DecisionSource == ApprovalSourceEnum.Timeout ? "." : ": " + Reason);
        }

        /// <summary>
        /// Build a notice key.
        /// </summary>
        /// <param name="approvalId">Approval identifier.</param>
        /// <param name="status">Status.</param>
        /// <returns>Key in the form approvalId:Status.</returns>
        public static string KeyOf(string approvalId, ApprovalStatusEnum status)
        {
            return approvalId + ":" + status;
        }
    }
}
