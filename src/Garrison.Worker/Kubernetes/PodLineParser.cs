namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Text;
    using System.Text.Json;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Accepts protocol lines from one run pod's log (plan D-033). A line counts only when it starts with the run's
    /// exact nonce prefix, carries a sequence number above every one accepted so far, is within the size limit, and
    /// holds a well-formed message of its declared type. Everything else is ignored and counted: lines without the
    /// marker (diagnostics from run-one), lines with the marker and a different nonce (impersonation attempts), stale
    /// or repeated sequences (log stream reconnects), and malformed lines. Only the first completion is accepted. Not
    /// thread-safe: feed one log stream at a time.
    /// </summary>
    public class PodLineParser
    {
        #region Public-Members

        /// <summary>
        /// Lines without the protocol marker.
        /// </summary>
        public long Ignored { get; private set; } = 0;

        /// <summary>
        /// Lines with the marker but not the run's nonce, or a nonce prefix that is not at the start of the line.
        /// </summary>
        public long Rejected { get; private set; } = 0;

        /// <summary>
        /// Lines whose sequence was already accepted (seen again after a reconnect).
        /// </summary>
        public long Duplicates { get; private set; } = 0;

        /// <summary>
        /// Lines with the run's nonce that could not be parsed, exceeded the size limit, or came after the completion.
        /// </summary>
        public long Malformed { get; private set; } = 0;

        /// <summary>
        /// Lines accepted.
        /// </summary>
        public long Accepted { get; private set; } = 0;

        /// <summary>
        /// Highest accepted sequence number, 0 before the first.
        /// </summary>
        public long LastSequence { get; private set; } = 0;

        /// <summary>
        /// The accepted completion, or null.
        /// </summary>
        public PodLine? Completion { get; private set; } = null;

        /// <summary>
        /// The most recent ignored (non-protocol) lines, oldest first, for diagnostics when a pod fails. At most
        /// <see cref="MaxDiagnosticLines"/>, each truncated to 500 characters.
        /// </summary>
        public List<string> RecentDiagnostics
        {
            get
            {
                return new List<string>(_Diagnostics);
            }
        }

        /// <summary>
        /// How many non-protocol lines to keep for diagnostics. Minimum 0, maximum 100, default 10.
        /// </summary>
        public int MaxDiagnosticLines
        {
            get
            {
                return _MaxDiagnosticLines;
            }
            set
            {
                _MaxDiagnosticLines = Math.Clamp(value, 0, 100);
            }
        }

        #endregion

        #region Private-Members

        private readonly string _Prefix;
        private readonly int _MaxLineBytes;
        private readonly Queue<string> _Diagnostics = new Queue<string>();
        private int _MaxDiagnosticLines = 10;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="nonce">The run's nonce.</param>
        /// <param name="maxLineBytes">Longest accepted line in UTF-8 bytes. Minimum 1024, default 8388608.</param>
        /// <exception cref="ArgumentException">Thrown when the nonce is invalid.</exception>
        public PodLineParser(string nonce, int maxLineBytes = 8388608)
        {
            _Prefix = PodLineProtocol.Prefix(nonce);
            _MaxLineBytes = Math.Max(1024, maxLineBytes);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Offer one log line.
        /// </summary>
        /// <param name="line">Line without its newline. Null is ignored.</param>
        /// <returns>The accepted message, or null when the line is not accepted.</returns>
        public PodLine? Accept(string? line)
        {
            if (line == null) return null;
            if (line.Length > 0 && line[line.Length - 1] == '\r') line = line.Substring(0, line.Length - 1);

            if (!line.StartsWith(_Prefix, StringComparison.Ordinal))
            {
                if (line.Contains(PodLineProtocol.Marker, StringComparison.Ordinal))
                {
                    Rejected++;
                }
                else
                {
                    Ignored++;
                    Remember(line);
                }
                return null;
            }

            if (line.Length > _MaxLineBytes || Encoding.UTF8.GetByteCount(line) > _MaxLineBytes)
            {
                Malformed++;
                return null;
            }

            int space = line.IndexOf(' ', _Prefix.Length);
            if (space <= _Prefix.Length || space - _Prefix.Length > 19)
            {
                Malformed++;
                return null;
            }
            long sequence = 0;
            for (int i = _Prefix.Length; i < space; i++)
            {
                char c = line[i];
                if (c < '0' || c > '9')
                {
                    Malformed++;
                    return null;
                }
                sequence = sequence * 10 + (c - '0');
            }
            if (sequence < 1)
            {
                Malformed++;
                return null;
            }
            if (sequence <= LastSequence)
            {
                Duplicates++;
                return null;
            }
            if (Completion != null)
            {
                Malformed++;
                return null;
            }

            PodLine? parsed;
            try
            {
                parsed = Serializer.Deserialize<PodLine>(line.Substring(space + 1));
            }
            catch (Exception e) when (e is JsonException || e is NotSupportedException || e is ArgumentException)
            {
                parsed = null;
            }
            if (parsed == null || !WellFormed(parsed))
            {
                Malformed++;
                return null;
            }

            parsed.Sequence = sequence;
            LastSequence = sequence;
            Accepted++;
            if (parsed.Type == PodLineTypeEnum.Complete) Completion = parsed;
            return parsed;
        }

        #endregion

        #region Private-Methods

        private static bool WellFormed(PodLine line)
        {
            switch (line.Type)
            {
                case PodLineTypeEnum.Started:
                    return true;
                case PodLineTypeEnum.Event:
                    return line.Event != null;
                case PodLineTypeEnum.Complete:
                    return line.Complete != null;
                default:
                    return false;
            }
        }

        private void Remember(string line)
        {
            if (_MaxDiagnosticLines == 0 || line.Length == 0) return;
            _Diagnostics.Enqueue(line.Length > 500 ? line.Substring(0, 500) : line);
            while (_Diagnostics.Count > _MaxDiagnosticLines) _Diagnostics.Dequeue();
        }

        #endregion
    }
}
