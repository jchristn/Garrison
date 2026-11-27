namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What Garrison itself knows about an organization when its top agent is asked for a board brief (AA10.3, AA12.7):
    /// the board's own view (unit health, spend, open escalations, pending proposals, recent unhealthy reports) and what
    /// changed since the last brief (published organization revisions and decided proposals). The board-brief template
    /// gives these to the agent so the brief agrees with the board view. Not thread-safe.
    /// </summary>
    public class BoardBriefFacts
    {
        /// <summary>
        /// Start of the period the brief covers (UTC): the last brief, or one brief interval back when there was none.
        /// </summary>
        public DateTime SinceUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The board as the board view shows it now.
        /// </summary>
        public Board Board
        {
            get
            {
                return _Board;
            }
            set
            {
                _Board = value ?? throw new ArgumentNullException(nameof(Board));
            }
        }

        /// <summary>
        /// Organization revisions published since <see cref="SinceUtc"/>, oldest first.
        /// </summary>
        public List<OrgRevision> Revisions
        {
            get
            {
                return _Revisions;
            }
            set
            {
                _Revisions = value ?? new List<OrgRevision>();
            }
        }

        /// <summary>
        /// Executives' proposals decided (approved, denied, applied, or discarded) since <see cref="SinceUtc"/>, oldest first.
        /// </summary>
        public List<OrgProposal> Decided
        {
            get
            {
                return _Decided;
            }
            set
            {
                _Decided = value ?? new List<OrgProposal>();
            }
        }

        private Board _Board = new Board();
        private List<OrgRevision> _Revisions = new List<OrgRevision>();
        private List<OrgProposal> _Decided = new List<OrgProposal>();
    }
}
