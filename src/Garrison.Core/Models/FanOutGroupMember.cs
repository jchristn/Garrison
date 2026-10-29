namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One child run of a fan-out group (AD5). Its status, result, and usage are read from the run itself.
    /// </summary>
    public class FanOutGroupMember
    {
        /// <summary>
        /// Identifier (prefix fom_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewFanOutMemberId() : value;
            }
        }

        /// <summary>
        /// Position in the group, from 0, in the order the members were given.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Label the caller gave the member, or the agent name. Up to 128 characters.
        /// </summary>
        public string Label { get; set; } = String.Empty;

        /// <summary>
        /// Agent the member runs.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// The member's child run.
        /// </summary>
        public string ChildRunId { get; set; } = String.Empty;

        private string _Id = IdGenerator.NewFanOutMemberId();
    }
}
