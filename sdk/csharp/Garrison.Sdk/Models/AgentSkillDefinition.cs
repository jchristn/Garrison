namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Agent: a2A skills.
    /// </summary>
    public class AgentSkillDefinition
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
            }
        }

        /// <summary>
        /// Parent Agent identifier.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Skill identifier.
        /// </summary>
        public string SkillId
        {
            get
            {
                return _SkillId;
            }
            set
            {
                _SkillId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Skill name.
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
        /// Skill description.
        /// </summary>
        public string? Description { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _AgentId = String.Empty;
        private string _SkillId = String.Empty;
        private string _Name = String.Empty;

        #endregion
    }
}
