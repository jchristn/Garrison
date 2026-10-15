namespace Garrison.Server.Runtime
{
    using System;
    using System.Text;

    /// <summary>
    /// Byte budget of one transcript being built (P12.27): every text added costs its UTF-8 length plus a fixed overhead
    /// per item, so the transcript stops growing at the Transcripts.MaxBytes limit. Not thread-safe; one per transcript.
    /// </summary>
    public class TranscriptBudget
    {
        #region Public-Members

        /// <summary>
        /// Bytes still available. Negative once a mandatory item (input, result, error) went over the limit.
        /// </summary>
        public long Remaining
        {
            get
            {
                return _Remaining;
            }
        }

        /// <summary>
        /// Whether nothing more fits.
        /// </summary>
        public bool Exhausted
        {
            get
            {
                return _Remaining <= 0;
            }
        }

        /// <summary>
        /// Fixed cost of each item on top of its text, for the surrounding markup. Minimum 0, maximum 4096, default 64.
        /// </summary>
        public int OverheadBytes
        {
            get
            {
                return _OverheadBytes;
            }
            set
            {
                _OverheadBytes = Math.Clamp(value, 0, 4096);
            }
        }

        #endregion

        #region Private-Members

        private long _Remaining;
        private int _OverheadBytes = 64;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="limit">Total bytes available. Minimum 0.</param>
        public TranscriptBudget(long limit)
        {
            _Remaining = Math.Max(0, limit);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Spend the cost of a text that is always included.
        /// </summary>
        /// <param name="text">Text, or null.</param>
        public void Spend(string? text)
        {
            _Remaining -= Cost(text);
        }

        /// <summary>
        /// Spend the cost of a text only when it fits.
        /// </summary>
        /// <param name="text">Text, or null.</param>
        /// <returns>True when it fit and was spent.</returns>
        public bool TrySpend(string? text)
        {
            long cost = Cost(text);
            if (cost > _Remaining) return false;
            _Remaining -= cost;
            return true;
        }

        #endregion

        #region Private-Methods

        private long Cost(string? text)
        {
            return _OverheadBytes + (text == null ? 0 : Encoding.UTF8.GetByteCount(text));
        }

        #endregion
    }
}
