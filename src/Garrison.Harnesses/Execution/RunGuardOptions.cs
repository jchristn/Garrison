namespace Garrison.Harnesses.Execution
{
    using System;

    /// <summary>
    /// Thresholds for <see cref="RunGuard"/>. The first three come from the execution spec (deployment limits over the
    /// cluster defaults Runtime.RepetitionGuard, Runtime.MaxAssistantChars, and Runtime.NoProgressSeconds); the rest
    /// tune the repetition detector and default to the values in the run guard contract. Not thread-safe; configure
    /// before handing the options to a guard.
    /// </summary>
    public class RunGuardOptions
    {
        #region Public-Members

        /// <summary>
        /// Whether the repetition guard is on (repeated short units and degenerate text). Default true.
        /// </summary>
        public bool RepetitionGuard { get; set; } = true;

        /// <summary>
        /// Most characters of assistant text a run may produce before it stops with OutputLimitExceeded. 0 turns the
        /// limit off. Minimum 0, maximum 100,000,000, default 200,000.
        /// </summary>
        public long MaxAssistantChars
        {
            get
            {
                return _MaxAssistantChars;
            }
            set
            {
                _MaxAssistantChars = Math.Clamp(value, 0, 100000000);
            }
        }

        /// <summary>
        /// Seconds without progress (see <see cref="RunGuard"/>) before a run stops with NoProgress. 0 turns the guard
        /// off. Minimum 0, maximum 86,400, default 300.
        /// </summary>
        public int NoProgressSeconds
        {
            get
            {
                return _NoProgressSeconds;
            }
            set
            {
                _NoProgressSeconds = Math.Clamp(value, 0, 86400);
            }
        }

        /// <summary>
        /// Characters of the most recent assistant text that must all be one repeated unit before the repetition guard
        /// trips. Minimum 64, maximum 100,000, default 2,000.
        /// </summary>
        public int RepetitionWindowChars
        {
            get
            {
                return _RepetitionWindowChars;
            }
            set
            {
                _RepetitionWindowChars = Math.Clamp(value, 64, 100000);
            }
        }

        /// <summary>
        /// Longest repeated unit, in characters, the repetition guard looks for. Minimum 1, maximum 256, default 64.
        /// </summary>
        public int MaxRepeatUnitChars
        {
            get
            {
                return _MaxRepeatUnitChars;
            }
            set
            {
                _MaxRepeatUnitChars = Math.Clamp(value, 1, 256);
            }
        }

        /// <summary>
        /// Fewest times the unit must repeat inside the window. Minimum 2, maximum 10,000, default 30.
        /// </summary>
        public int MinRepeats
        {
            get
            {
                return _MinRepeats;
            }
            set
            {
                _MinRepeats = Math.Clamp(value, 2, 10000);
            }
        }

        /// <summary>
        /// Consecutive characters of assistant text with no letter or digit (only whitespace, punctuation, and
        /// symbols) before the repetition guard trips. 0 turns this check off. Minimum 0, maximum 100,000, default
        /// 1,000.
        /// </summary>
        public int DegenerateChars
        {
            get
            {
                return _DegenerateChars;
            }
            set
            {
                _DegenerateChars = Math.Clamp(value, 0, 100000);
            }
        }

        #endregion

        #region Private-Members

        private long _MaxAssistantChars = 200000;
        private int _NoProgressSeconds = 300;
        private int _RepetitionWindowChars = 2000;
        private int _MaxRepeatUnitChars = 64;
        private int _MinRepeats = 30;
        private int _DegenerateChars = 1000;

        #endregion
    }
}
