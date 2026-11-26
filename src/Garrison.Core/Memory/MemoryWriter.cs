namespace Garrison.Core.Memory
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Who writes or deletes a scoped memory entry (AA4), recorded as the entry's provenance. Not thread-safe.
    /// </summary>
    public class MemoryWriter
    {
        #region Public-Members

        /// <summary>
        /// Kind of principal. Default Run.
        /// </summary>
        public PrincipalTypeEnum PrincipalType { get; set; } = PrincipalTypeEnum.Run;

        /// <summary>
        /// Principal identifier: the run, user, or credential identifier. Null when unknown.
        /// </summary>
        public string? PrincipalId { get; set; } = null;

        /// <summary>
        /// Display name: the agent's name for a run, the person's or credential's name otherwise.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Agent of the writing run, or null for people and credentials.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Writing run, or null for people and credentials.
        /// </summary>
        public string? RunId { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryWriter()
        {
        }

        #endregion
    }
}
