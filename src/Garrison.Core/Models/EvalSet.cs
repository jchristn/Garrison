namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One version of a named set of eval cases (AA9.1). Versions of a set share its name and are numbered from 1; the
    /// pair (name, version) is unique in a tenant. A Draft version is edited in place; an Approved version is immutable,
    /// and an edit to it creates the next version as a Draft through <see cref="Garrison.Core.Evaluation.EvalSetVersioning"/>
    /// (AA9.2). Cases live in their own table (<see cref="EvalCase"/>). Not thread-safe.
    /// </summary>
    public class EvalSet
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix evs_). Each version has its own identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewEvalSetId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
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
        /// Name shared by every version of the set, 1 to 128 characters.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// What the set checks, at most 2000 characters, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Version number, 1 for the first version. Minimum 1, maximum 1000000; values outside are clamped.
        /// </summary>
        public int Version
        {
            get
            {
                return _Version;
            }
            set
            {
                _Version = Math.Clamp(value, 1, 1000000);
            }
        }

        /// <summary>
        /// The version this one was copied from when an approved version was edited, or null for a first version.
        /// </summary>
        public string? PreviousVersionId { get; set; } = null;

        /// <summary>
        /// State. Default Draft. Only Draft versions change in place (AA9.2).
        /// </summary>
        public EvalSetStateEnum State { get; set; } = EvalSetStateEnum.Draft;

        /// <summary>
        /// Who wrote the set. Default Human (AA-024).
        /// </summary>
        public EvalSetOriginEnum Origin { get; set; } = EvalSetOriginEnum.Human;

        /// <summary>
        /// Identifier of the person who approved the version, or null while it is a Draft or when a system administrator
        /// approved it.
        /// </summary>
        public string? ApprovedById { get; set; } = null;

        /// <summary>
        /// Name of the person who approved the version, or null while it is a Draft.
        /// </summary>
        public string? ApprovedByName { get; set; } = null;

        /// <summary>
        /// When the version was approved (UTC), or null while it is a Draft.
        /// </summary>
        public DateTime? ApprovedUtc { get; set; } = null;

        /// <summary>
        /// Org unit of the executive or evaluator agent that wrote the set, or null for a set written by a person. A set
        /// gates an executive's change only when this unit lies outside that executive's subtree (AA-024).
        /// </summary>
        public string? AuthoringOrgUnitId { get; set; } = null;

        /// <summary>
        /// Principal type of the author (User, Credential, or Run). Default User.
        /// </summary>
        public PrincipalTypeEnum AuthoredByType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Identifier of the author (a user, credential, or run), or null for a system administrator.
        /// </summary>
        public string? AuthoredById { get; set; } = null;

        /// <summary>
        /// Display name of the author.
        /// </summary>
        public string? AuthoredByName { get; set; } = null;

        /// <summary>
        /// Agent whose run wrote the set (origin Evaluator, or an executive's draft), or null.
        /// </summary>
        public string? AuthoredByAgentId { get; set; } = null;

        /// <summary>
        /// Agent (identifier or name, at most 128 characters) that grades this set's Judge checks, or null. Required when a
        /// case has a Judge check, a case has no checks and no expected text, or the set runs in RecentInputs mode; such
        /// checks score 0 with a note when it is missing (AA9.4).
        /// </summary>
        public string? JudgeAgent { get; set; } = null;

        /// <summary>
        /// Free-form tags, each at most 64 characters, in the order given.
        /// </summary>
        public List<string> Tags
        {
            get
            {
                return _Tags;
            }
            set
            {
                _Tags = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Number of cases in this version (computed on read; ignored on write).
        /// </summary>
        public int CaseCount { get; set; } = 0;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last change time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewEvalSetId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private int _Version = 1;
        private List<string> _Tags = new List<string>();

        #endregion
    }
}
