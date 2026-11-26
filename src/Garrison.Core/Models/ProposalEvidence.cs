namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What an executive's proposal has been tested against (AA9.10): the eval runs of the draft, and the shadow trials and
    /// canary releases whose candidate is a deployment the draft changes or one of its eval copies, started after the draft
    /// was created. Computed on read; nothing is stored apart from the records it names. Not thread-safe.
    /// </summary>
    public class ProposalEvidence
    {
        #region Public-Members

        /// <summary>
        /// When the draft's items last changed (UTC). An eval run counts toward a change rule's gate only when it was
        /// created after this time.
        /// </summary>
        public DateTime ContentChangedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Eval runs of the draft, newest first.
        /// </summary>
        public List<ProposalEvalEvidence> EvalRuns
        {
            get
            {
                return _EvalRuns;
            }
            set
            {
                _EvalRuns = value ?? new List<ProposalEvalEvidence>();
            }
        }

        /// <summary>
        /// Shadow trials of the draft's candidate deployments, newest first.
        /// </summary>
        public List<ProposalShadowEvidence> ShadowTrials
        {
            get
            {
                return _ShadowTrials;
            }
            set
            {
                _ShadowTrials = value ?? new List<ProposalShadowEvidence>();
            }
        }

        /// <summary>
        /// Canary releases of the draft's candidate deployments, newest first.
        /// </summary>
        public List<ProposalCanaryEvidence> CanaryReleases
        {
            get
            {
                return _CanaryReleases;
            }
            set
            {
                _CanaryReleases = value ?? new List<ProposalCanaryEvidence>();
            }
        }

        #endregion

        #region Private-Members

        private List<ProposalEvalEvidence> _EvalRuns = new List<ProposalEvalEvidence>();
        private List<ProposalShadowEvidence> _ShadowTrials = new List<ProposalShadowEvidence>();
        private List<ProposalCanaryEvidence> _CanaryReleases = new List<ProposalCanaryEvidence>();

        #endregion
    }
}
