namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Transcript export limits (P12.27), refreshed from the Transcripts.* cluster settings. Thread-safe for reads.
    /// </summary>
    public class TranscriptOptions
    {
        #region Public-Members

        /// <summary>
        /// Largest transcript in bytes of event text. Events past the limit are left out and the transcript says so.
        /// Minimum 65536, maximum 67108864, default 4194304 (4 MiB). Cluster setting Transcripts.MaxBytes.
        /// </summary>
        public int MaxBytes
        {
            get
            {
                return _MaxBytes;
            }
            set
            {
                _MaxBytes = Math.Clamp(value, 65536, 67108864);
            }
        }

        /// <summary>
        /// Longest tool call argument or tool result text kept per event, in characters; longer text is cut and marked.
        /// Minimum 100, maximum 100000, default 2000. Cluster setting Transcripts.ToolTextMaxChars.
        /// </summary>
        public int ToolTextMaxChars
        {
            get
            {
                return _ToolTextMaxChars;
            }
            set
            {
                _ToolTextMaxChars = Math.Clamp(value, 100, 100000);
            }
        }

        /// <summary>
        /// Most turns in a conversation transcript (the oldest are kept). Minimum 1, maximum 1000, default 200. Cluster
        /// setting Transcripts.MaxTurns.
        /// </summary>
        public int MaxTurns
        {
            get
            {
                return _MaxTurns;
            }
            set
            {
                _MaxTurns = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Events read from the database per page while a transcript is built. Minimum 50, maximum 5000, default 500.
        /// </summary>
        public int EventPageSize
        {
            get
            {
                return _EventPageSize;
            }
            set
            {
                _EventPageSize = Math.Clamp(value, 50, 5000);
            }
        }

        #endregion

        #region Private-Members

        private int _MaxBytes = 4194304;
        private int _ToolTextMaxChars = 2000;
        private int _MaxTurns = 200;
        private int _EventPageSize = 500;

        #endregion
    }
}
