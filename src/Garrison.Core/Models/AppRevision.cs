namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A snapshot of an agentic app (AD6.4): the published agent revision of every member and the app's edges. Draft
    /// until published; published revisions never change. Promoting an app promotes every member's pinned revision
    /// together.
    /// </summary>
    public class AppRevision
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix apv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAppRevisionId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// App identifier.
        /// </summary>
        public string AppId { get; set; } = String.Empty;

        /// <summary>
        /// Number, per app, from 1.
        /// </summary>
        public int Number { get; set; } = 0;

        /// <summary>
        /// Draft or Published.
        /// </summary>
        public AgentRevisionStateEnum State { get; set; } = AgentRevisionStateEnum.Draft;

        /// <summary>
        /// Pinned member revisions.
        /// </summary>
        public List<AppRevisionMember> Members
        {
            get
            {
                return _Members;
            }
            set
            {
                _Members = value ?? new List<AppRevisionMember>();
            }
        }

        /// <summary>
        /// The app's edges when the revision was taken.
        /// </summary>
        public List<AgenticAppEdge> Edges
        {
            get
            {
                return _Edges;
            }
            set
            {
                _Edges = value ?? new List<AgenticAppEdge>();
            }
        }

        /// <summary>
        /// Who created the revision, or null.
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Change note, up to 2000 characters, or null.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Who published it, or null.
        /// </summary>
        public string? PublishedByName { get; set; } = null;

        /// <summary>
        /// When it was published (UTC), or null.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewAppRevisionId();
        private List<AppRevisionMember> _Members = new List<AppRevisionMember>();
        private List<AgenticAppEdge> _Edges = new List<AgenticAppEdge>();

        #endregion
    }
}
