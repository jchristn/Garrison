namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Writes runs and events that retention removes to JSON Lines files before deleting them (P10.12). Runs go to
    /// garrison-runs-yyyyMMdd.jsonl (one <see cref="ArchivedRun"/> per line, with its events); events of runs that are
    /// still retained go to garrison-events-yyyyMMdd.jsonl (one run event per line). Dates are UTC archive dates. A
    /// record is deleted only after its line was written and flushed, so a failed write leaves the data in the
    /// database for the next pass. Only the maintenance leader calls this. Thread-safe for one caller at a time.
    /// </summary>
    public class RunArchiver
    {
        #region Public-Members

        /// <summary>
        /// Archive directory.
        /// </summary>
        public string Directory { get; }

        /// <summary>
        /// Runs archived per batch. Minimum 1, maximum 1000, default 100.
        /// </summary>
        public int RunBatchSize
        {
            get
            {
                return _RunBatchSize;
            }
            set
            {
                _RunBatchSize = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Events archived per batch. Minimum 1, maximum 10000, default 2000.
        /// </summary>
        public int EventBatchSize
        {
            get
            {
                return _EventBatchSize;
            }
            set
            {
                _EventBatchSize = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Batches per pass, so one pass cannot run for hours. Minimum 1, maximum 10000, default 50.
        /// </summary>
        public int MaxBatchesPerPass
        {
            get
            {
                return _MaxBatchesPerPass;
            }
            set
            {
                _MaxBatchesPerPass = Math.Clamp(value, 1, 10000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly LoggingModule? _Logging;
        private int _RunBatchSize = 100;
        private int _EventBatchSize = 2000;
        private int _MaxBatchesPerPass = 50;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="directory">Archive directory; created when missing.</param>
        /// <param name="logging">Logging, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when database or directory is null or empty.</exception>
        public RunArchiver(DatabaseDriverBase database, string directory, LoggingModule? logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            if (String.IsNullOrWhiteSpace(directory)) throw new ArgumentNullException(nameof(directory));
            Directory = directory;
            _Logging = logging;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Archive and delete finished runs completed before a cutoff, with their events.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs archived and deleted.</returns>
        /// <exception cref="IOException">Thrown when the archive cannot be written; nothing unwritten is deleted.</exception>
        public async Task<int> ArchiveRunsAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            int total = 0;
            for (int batch = 0; batch < _MaxBatchesPerPass; batch++)
            {
                token.ThrowIfCancellationRequested();
                List<Run> runs = await _Database.Runs.ListFinishedBeforeAsync(olderThanUtc, _RunBatchSize, token).ConfigureAwait(false);
                if (runs.Count == 0) break;

                List<string> lines = new List<string>();
                foreach (Run run in runs)
                {
                    ArchivedRun archived = new ArchivedRun();
                    archived.Run = run;
                    archived.Events = await ReadAllEventsAsync(run.Id, token).ConfigureAwait(false);
                    lines.Add(Serializer.Serialize(archived));
                }
                await AppendAsync("garrison-runs-", lines, token).ConfigureAwait(false);

                foreach (Run run in runs) await _Database.Runs.PurgeAsync(run.Id, token).ConfigureAwait(false);
                total += runs.Count;
                if (runs.Count < _RunBatchSize) break;
            }
            return total;
        }

        /// <summary>
        /// Archive and delete events recorded before a cutoff.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events archived and deleted.</returns>
        /// <exception cref="IOException">Thrown when the archive cannot be written; nothing unwritten is deleted.</exception>
        public async Task<int> ArchiveEventsAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            int total = 0;
            for (int batch = 0; batch < _MaxBatchesPerPass; batch++)
            {
                token.ThrowIfCancellationRequested();
                List<RunEvent> events = await _Database.RunEvents.ListOlderThanAsync(olderThanUtc, _EventBatchSize, token).ConfigureAwait(false);
                if (events.Count == 0) break;

                await AppendAsync("garrison-events-", events.Select(e => Serializer.Serialize(e)).ToList(), token).ConfigureAwait(false);
                total += await _Database.RunEvents.DeleteManyAsync(events.Select(e => e.Id).ToList(), token).ConfigureAwait(false);
                if (events.Count < _EventBatchSize) break;
            }
            return total;
        }

        #endregion

        #region Private-Methods

        private async Task<List<RunEvent>> ReadAllEventsAsync(string runId, CancellationToken token)
        {
            List<RunEvent> all = new List<RunEvent>();
            long after = 0;
            while (true)
            {
                List<RunEvent> page = await _Database.RunEvents.ListAfterAsync(runId, after, 5000, token).ConfigureAwait(false);
                all.AddRange(page);
                if (page.Count < 5000) break;
                after = page[page.Count - 1].Sequence;
            }
            return all;
        }

        private async Task AppendAsync(string prefix, List<string> lines, CancellationToken token)
        {
            if (lines.Count == 0) return;
            System.IO.Directory.CreateDirectory(Directory);
            string path = Path.Combine(Directory, prefix + DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + ".jsonl");
            StringBuilder text = new StringBuilder();
            foreach (string line in lines) text.Append(line).Append('\n');
            byte[] bytes = Encoding.UTF8.GetBytes(text.ToString());

            // FileShare.Read: a second writer (a replica that briefly overlapped as leader) fails to open the file
            // instead of interleaving lines, and its records stay in the database for the next pass.
            try
            {
                using (FileStream stream = new FileStream(path, FileMode.Append, FileAccess.Write, FileShare.Read))
                {
                    await stream.WriteAsync(bytes, token).ConfigureAwait(false);
                    await stream.FlushAsync(token).ConfigureAwait(false);
                    stream.Flush(true);
                }
                GarrisonMetrics.Count(GarrisonMetricCatalog.ArchiveRuns, lines.Count, GarrisonMetrics.Tags("kind", prefix.Contains("events", StringComparison.Ordinal) ? "events" : "runs", "result", "ok"));
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.ArchiveRuns, lines.Count, GarrisonMetrics.Tags("kind", prefix.Contains("events", StringComparison.Ordinal) ? "events" : "runs", "result", "error"));
                throw;
            }
            _Logging?.Debug("[Archive] appended " + lines.Count + " records to " + path);
        }

        #endregion
    }
}
