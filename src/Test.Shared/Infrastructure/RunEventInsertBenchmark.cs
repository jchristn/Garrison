namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Direct database event-insert microbenchmark (P10.22), separate from the black-box fleet benchmark.
    /// Fresh isolated databases, preallocated events, and an untimed warmup keep setup out of the measurement.
    /// </summary>
    public static class RunEventInsertBenchmark
    {
        /// <summary>
        /// Measure insertion at batch sizes 1, 10, and 100 for each selected test provider and return CSV.
        /// Includes transaction/connection cost; excludes event allocation, schema initialization, and warmup.
        /// </summary>
        /// <param name="eventsPerRound">Events per round; a positive multiple of 100, at most 100000.</param>
        /// <param name="rounds">Measured rounds; from 1 to 20.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>CSV with provider, batch size, round, count, elapsed milliseconds, and events per second.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when counts are outside their bounds.</exception>
        public static async Task<string> RunAsync(int eventsPerRound, int rounds, CancellationToken token)
        {
            if (eventsPerRound < 100 || eventsPerRound > 100000 || eventsPerRound % 100 != 0) throw new ArgumentOutOfRangeException(nameof(eventsPerRound), "Use a multiple of 100 between 100 and 100000.");
            if (rounds < 1 || rounds > 20) throw new ArgumentOutOfRangeException(nameof(rounds), "Use 1 to 20 measured rounds.");
            StringBuilder csv = new StringBuilder("provider,batchSize,round,events,elapsedMs,eventsPerSecond\n");
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                foreach (int batchSize in new[] { 1, 10, 100 })
                {
                    using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
                    {
                        string runId = "run_event_benchmark_" + Guid.NewGuid().ToString("N");
                        long sequence = 0;
                        await db.RunEvents.InsertBatchAsync(Batch(runId, batchSize, ref sequence), token).ConfigureAwait(false);
                        for (int round = 1; round <= rounds; round++)
                        {
                            List<List<RunEvent>> batches = new List<List<RunEvent>>();
                            for (int count = 0; count < eventsPerRound; count += batchSize) batches.Add(Batch(runId, batchSize, ref sequence));
                            Stopwatch elapsed = Stopwatch.StartNew();
                            int inserted = 0;
                            foreach (List<RunEvent> batch in batches) inserted += await db.RunEvents.InsertBatchAsync(batch, token).ConfigureAwait(false);
                            elapsed.Stop();
                            if (inserted != eventsPerRound) throw new InvalidOperationException("Benchmark did not insert every event.");
                            csv.Append(provider.ToString().ToLowerInvariant()).Append(',').Append(batchSize).Append(',').Append(round).Append(',').Append(inserted).Append(',');
                            csv.Append(elapsed.Elapsed.TotalMilliseconds.ToString("F3", CultureInfo.InvariantCulture)).Append(',');
                            csv.Append((inserted / elapsed.Elapsed.TotalSeconds).ToString("F3", CultureInfo.InvariantCulture)).Append('\n');
                        }
                    }
                }
            }
            return csv.ToString();
        }

        private static List<RunEvent> Batch(string runId, int count, ref long sequence)
        {
            List<RunEvent> events = new List<RunEvent>();
            for (int index = 0; index < count; index++)
            {
                RunEvent evt = new RunEvent();
                evt.TenantId = "ten_event_benchmark";
                evt.RunId = runId;
                evt.Sequence = ++sequence;
                evt.EventType = RunEventTypeEnum.AssistantText;
                evt.Text = new string('x', 128);
                evt.RawEventJson = "{\"type\":\"text_delta\",\"text\":\"" + evt.Text + "\"}";
                events.Add(evt);
            }
            return events;
        }
    }
}
