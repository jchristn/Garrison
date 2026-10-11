namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Execution;

    /// <summary>
    /// Reporter used inside a run pod by run-one: writes the start notification, every event, and finally the
    /// completion as nonce-prefixed protocol lines to stdout (plan D-033), where the worker reads them from the pod log.
    /// Thread-safe; lines are written whole and flushed one at a time.
    /// </summary>
    public class PodLineReporter : IRunReporter
    {
        #region Public-Members

        /// <summary>
        /// Longest raw event JSON relayed, in characters. Longer raw payloads are dropped from the event (its text is
        /// kept). Minimum 1024, maximum 16777216, default 262144.
        /// </summary>
        public int MaxRawEventChars
        {
            get
            {
                return _MaxRawEventChars;
            }
            set
            {
                _MaxRawEventChars = Math.Clamp(value, 1024, 16777216);
            }
        }

        /// <summary>
        /// Lines written so far.
        /// </summary>
        public long Written
        {
            get
            {
                return Interlocked.Read(ref _Sequence);
            }
        }

        #endregion

        #region Private-Members

        private readonly TextWriter _Writer;
        private readonly string _Nonce;
        private readonly object _Lock = new object();
        private long _Sequence = 0;
        private int _MaxRawEventChars = 262144;
        private int _Completed = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="writer">Destination (stdout).</param>
        /// <param name="nonce">The run's protocol nonce.</param>
        /// <exception cref="ArgumentNullException">Thrown when writer is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the nonce is invalid.</exception>
        public PodLineReporter(TextWriter writer, string nonce)
        {
            _Writer = writer ?? throw new ArgumentNullException(nameof(writer));
            PodLineProtocol.ValidateNonce(nonce);
            _Nonce = nonce;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task StartedAsync(int? processId, CancellationToken token)
        {
            PodLine line = new PodLine();
            line.Type = PodLineTypeEnum.Started;
            line.ProcessId = processId;
            Write(line);
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public void Emit(RunEventReport report)
        {
            if (report == null) return;
            if (report.RawEventJson != null && report.RawEventJson.Length > _MaxRawEventChars) report.RawEventJson = null;
            PodLine line = new PodLine();
            line.Type = PodLineTypeEnum.Event;
            line.Event = report;
            Write(line);
        }

        /// <inheritdoc />
        public Task FlushAsync(CancellationToken token)
        {
            lock (_Lock)
            {
                _Writer.Flush();
            }
            return Task.CompletedTask;
        }

        /// <summary>
        /// Write the completion line. Only the first call writes; later calls are ignored.
        /// </summary>
        /// <param name="complete">Completion.</param>
        /// <exception cref="ArgumentNullException">Thrown when complete is null.</exception>
        public void Complete(RunCompleteRequest complete)
        {
            if (complete == null) throw new ArgumentNullException(nameof(complete));
            if (Interlocked.Exchange(ref _Completed, 1) == 1) return;
            PodLine line = new PodLine();
            line.Type = PodLineTypeEnum.Complete;
            line.Complete = complete;
            Write(line);
        }

        #endregion

        #region Private-Methods

        private void Write(PodLine line)
        {
            lock (_Lock)
            {
                if (Volatile.Read(ref _Completed) == 1 && line.Type != PodLineTypeEnum.Complete) return;
                long sequence = ++_Sequence;
                _Writer.Write(PodLineProtocol.Format(_Nonce, sequence, line));
                _Writer.Write('\n');
                _Writer.Flush();
            }
        }

        #endregion
    }
}
