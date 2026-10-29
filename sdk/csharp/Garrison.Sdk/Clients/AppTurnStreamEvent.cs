namespace Garrison.Sdk.Clients
{
    using System;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// One item from an app turn stream: a visible run event, a turn status change, or the completed turn. Not thread-safe.
    /// </summary>
    public class AppTurnStreamEvent
    {
        /// <summary>
        /// SSE event name: turn.event, turn.status, or turn.completed. Never null.
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
        /// SSE event identifier (the run event sequence for turn.event items), or null.
        /// </summary>
        public string? Id { get; set; } = null;

        /// <summary>
        /// Run event for turn.event items, otherwise null.
        /// </summary>
        public RunEvent? Event { get; set; } = null;

        /// <summary>
        /// Turn for turn.status and turn.completed items, otherwise null.
        /// </summary>
        public AppTurnView? Turn { get; set; } = null;

        /// <summary>
        /// Raw data. Never null.
        /// </summary>
        public string Data
        {
            get
            {
                return _Data;
            }
            set
            {
                _Data = value ?? String.Empty;
            }
        }

        private string _Name = String.Empty;
        private string _Data = String.Empty;
    }
}
