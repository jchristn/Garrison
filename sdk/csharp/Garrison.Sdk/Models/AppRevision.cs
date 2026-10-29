namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An app revision: every member's published agent revision pinned, with a copy of the edges. Draft until published;
    /// a published app revision can be promoted between environments. Not thread-safe.
    /// </summary>
    public class AppRevision
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix apv_). Never null.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier. Never null.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// App identifier (prefix app_). Never null.
        /// </summary>
        public string AppId
        {
            get
            {
                return _AppId;
            }
            set
            {
                _AppId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Revision number, starting at 1 for each app.
        /// </summary>
        public int Number { get; set; } = 0;

        /// <summary>
        /// Draft or Published. Default Draft.
        /// </summary>
        public AgentRevisionStateEnum State { get; set; } = AgentRevisionStateEnum.Draft;

        /// <summary>
        /// Pinned members. Never null; assigning null stores an empty list.
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
        /// The app's edges when the revision was taken. Never null; assigning null stores an empty list.
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
        /// Name of the principal that took the revision, or null.
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Change note, or null.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Name of the principal that published the revision, or null while it is a draft.
        /// </summary>
        public string? PublishedByName { get; set; } = null;

        /// <summary>
        /// Publication time, UTC, or null while it is a draft.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        /// <summary>
        /// Creation time, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _AppId = String.Empty;
        private List<AppRevisionMember> _Members = new List<AppRevisionMember>();
        private List<AgenticAppEdge> _Edges = new List<AgenticAppEdge>();

        #endregion
    }
}
