namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One app or agent in a studio draft's graph. Not thread-safe.
    /// </summary>
    public class StudioGraphNode
    {
        #region Public-Members

        /// <summary>
        /// Node key, kind and name joined by a slash (for example AgenticApp/research). Never null.
        /// </summary>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                _Key = value ?? String.Empty;
            }
        }

        /// <summary>
        /// AgenticApp or Agent. Never null.
        /// </summary>
        public string Kind
        {
            get
            {
                return _Kind;
            }
            set
            {
                _Kind = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Resource name. Never null.
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
        /// True when the draft holds an item for the node; false for a live agent an app refers to.
        /// </summary>
        public bool InDraft { get; set; } = false;

        /// <summary>
        /// True when the draft deletes the resource.
        /// </summary>
        public bool Deleted { get; set; } = false;

        /// <summary>
        /// Apps this agent is the entry agent of. Never null.
        /// </summary>
        public List<string> EntryOf
        {
            get
            {
                return _EntryOf;
            }
            set
            {
                _EntryOf = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Apps this agent is a member of. Never null.
        /// </summary>
        public List<string> MemberOf
        {
            get
            {
                return _MemberOf;
            }
            set
            {
                _MemberOf = value ?? new List<string>();
            }
        }

        /// <summary>
        /// For an agent the draft holds: the capabilities its document names (host tools such as pandoc, AD7.8). Never null.
        /// </summary>
        public List<string> Capabilities
        {
            get
            {
                return _Capabilities;
            }
            set
            {
                _Capabilities = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Horizontal canvas position, or null when the node was never placed.
        /// </summary>
        public double? X { get; set; } = null;

        /// <summary>
        /// Vertical canvas position, or null when the node was never placed.
        /// </summary>
        public double? Y { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Key = String.Empty;
        private string _Kind = String.Empty;
        private string _Name = String.Empty;
        private List<string> _EntryOf = new List<string>();
        private List<string> _MemberOf = new List<string>();
        private List<string> _Capabilities = new List<string>();

        #endregion
    }
}
