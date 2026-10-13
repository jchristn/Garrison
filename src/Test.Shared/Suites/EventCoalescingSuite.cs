namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Worker.Protocol;
    using Garrison.Worker.Reporting;
    using Garrison.Worker.Settings;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Text storage reduction, ordering boundaries, and immutable worker retries.</summary>
    public static class EventCoalescingSuite
    {
        /// <summary>Build worker and provider-backed coalescing checks.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("event-coalescing", "Worker event coalescing", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor("event-coalescing", "barriers", "Type, metadata, cap, flush, and sequence barriers preserve ordering", BarriersAsync),
                    new TestCaseDescriptor("event-coalescing", "retry", "Failed batches retain original sequences and payloads while new text arrives", RetryAsync),
                    new TestCaseDescriptor("event-coalescing", "window-settings", "Expired windows do not merge and the worker setting clamps and overrides", WindowAsync)
                })
            };
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "event-coalescing-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Stored text coalescing (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "stored-transcript", "Token fixture stores at least 10x fewer rows with identical text and raw lines", ct => StoredAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static RunEventReport Text(string text, RunEventTypeEnum type = RunEventTypeEnum.AssistantText, string? code = null)
        {
            return new RunEventReport { EventType = type, Text = text, RawEventJson = "{\"text\":\"" + text + "\"}", Code = code };
        }

        private static async Task BarriersAsync(CancellationToken token)
        {
            using FakeNodeServer server = new FakeNodeServer();
            using NodeProtocolClient client = new NodeProtocolClient(server.BaseUrl, "test", "test");
            await using RunEventShipper shipper = new RunEventShipper(client, "node", "run", 1, 100, 1000, 10000, null, null, 0, 4);
            shipper.Emit(Text("ab")); shipper.Emit(Text("cd")); shipper.Emit(Text("e"));
            shipper.Emit(Text("f", RunEventTypeEnum.Thinking)); shipper.Emit(Text("g", RunEventTypeEnum.Thinking));
            shipper.Emit(Text("tool", RunEventTypeEnum.ToolCall));
            RunEventReport callerOwned = Text("h");
            shipper.Emit(callerOwned); callerOwned.Text = "mutated";
            shipper.Emit(Text("i")); shipper.Emit(Text("j", code: "different"));
            shipper.AdvanceSequence(100); shipper.Emit(Text("k", code: "different"));
            await shipper.FlushAsync(token).ConfigureAwait(false);
            shipper.Emit(Text("l", code: "different"));
            await shipper.FlushAsync(token).ConfigureAwait(false);
            RunEventReport[] rows = server.Events.ToArray();
            Assert.Equal("abcd|e|fg|tool|hi|j|k|l", String.Join("|", rows.Select(e => e.Text)), "Text and barriers");
            Assert.Equal("{\"text\":\"ab\"}\n{\"text\":\"cd\"}", rows[0].RawEventJson, "Raw lines retained verbatim");
            Assert.Equal(101L, rows[6].Sequence, "Advance sequence barrier");
            Assert.True(rows.Zip(rows.Skip(1), (a, b) => a.Sequence < b.Sequence).All(v => v), "Monotonic sequences");
        }

        private static async Task RetryAsync(CancellationToken token)
        {
            using FakeNodeServer server = new FakeNodeServer();
            using NodeProtocolClient client = new NodeProtocolClient(server.BaseUrl, "test", "test");
            await using RunEventShipper shipper = new RunEventShipper(client, "node", "run", 1, 1, 1000, 10000, null, null);
            server.FailNextEventCalls(1);
            shipper.Emit(Text("first"));
            Task flushing = shipper.FlushAsync(token);
            DateTime deadline = DateTime.UtcNow.AddSeconds(5);
            while (server.EventAttempts.IsEmpty && DateTime.UtcNow < deadline) await Task.Delay(10, token).ConfigureAwait(false);
            Assert.True(!server.EventAttempts.IsEmpty, "Failed request observed");
            shipper.Emit(Text("second")); shipper.Emit(Text("third"));
            await flushing.ConfigureAwait(false);
            RunEventsRequest[] attempts = server.EventAttempts.ToArray();
            Assert.Equal(3, attempts.Length, "Failed batch replayed before later batch");
            Assert.Equal(attempts[0].Events[0].Sequence, attempts[1].Events[0].Sequence, "Replay sequence unchanged");
            Assert.Equal(attempts[0].Events[0].Text, attempts[1].Events[0].Text, "Replay text unchanged");
            Assert.Equal(attempts[0].Events[0].RawEventJson, attempts[1].Events[0].RawEventJson, "Replay raw data unchanged");
            Assert.Equal("first|secondthird", String.Join("|", server.Events.Select(e => e.Text)), "New text stays outside retried batch");
        }

        private static async Task WindowAsync(CancellationToken token)
        {
            using FakeNodeServer server = new FakeNodeServer();
            using NodeProtocolClient client = new NodeProtocolClient(server.BaseUrl, "test", "test");
            await using RunEventShipper shipper = new RunEventShipper(client, "node", "run", 1, 100, 1000, 20, null, null);
            shipper.Emit(Text("a"));
            await Task.Delay(80, token).ConfigureAwait(false);
            shipper.Emit(Text("b"));
            await shipper.FlushAsync(token).ConfigureAwait(false);
            Assert.Equal(2, server.Events.Count, "Separate flush windows");
            WorkerSettings settings = new WorkerSettings();
            Assert.Equal(2048, settings.EventTextCoalesceMaxChars, "Default cap");
            settings.EventTextCoalesceMaxChars = -1; Assert.Equal(0, settings.EventTextCoalesceMaxChars, "Disable clamp");
            settings.EventTextCoalesceMaxChars = Int32.MaxValue; Assert.Equal(1048576, settings.EventTextCoalesceMaxChars, "Upper clamp");
            const string name = "GARRISON_WORKER_EVENT_TEXT_COALESCE_MAX_CHARS";
            string? previous = Environment.GetEnvironmentVariable(name);
            try
            {
                Environment.SetEnvironmentVariable(name, "32"); settings.ApplyEnvironment();
                Assert.Equal(32, settings.EventTextCoalesceMaxChars, "Environment override");
            }
            finally { Environment.SetEnvironmentVariable(name, previous); }
        }

        private static async Task StoredAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false);
            List<List<RunEvent>> stored = new List<List<RunEvent>>();
            foreach (int cap in new[] { 0, 2048 })
            {
                Run run = await db.Runs.CreateAsync(new Run { TenantId = "tenant", AgentId = "agent", DeploymentId = "deployment" }, token).ConfigureAwait(false);
                using FakeNodeServer server = new FakeNodeServer();
                using NodeProtocolClient client = new NodeProtocolClient(server.BaseUrl, "test", "test");
                await using RunEventShipper shipper = new RunEventShipper(client, "node", run.Id, 1, 1000, 2000, 10000, null, null, 0, cap);
                for (int i = 0; i < 1000; i++) shipper.Emit(Text("word"));
                await shipper.FlushAsync(token).ConfigureAwait(false);
                List<RunEvent> rows = server.Events.Select(e => new RunEvent { TenantId = run.TenantId, RunId = run.Id, Sequence = e.Sequence,
                    EventType = e.EventType, TimestampUtc = e.TimestampUtc, Text = e.Text, RawEventJson = e.RawEventJson }).ToList();
                Assert.Equal(rows.Count, await db.RunEvents.InsertBatchAsync(rows, token).ConfigureAwait(false), "Stored rows");
                Assert.Equal(0, await db.RunEvents.InsertBatchAsync(rows, token).ConfigureAwait(false), "Replay deduplicates");
                stored.Add(await db.RunEvents.ListAfterAsync(run.Id, 0, 5000, token).ConfigureAwait(false));
            }
            Assert.Equal(1000, stored[0].Count, "Disabled baseline stores each token");
            Assert.Equal(2, stored[1].Count, "Default cap stores two rows, a 500x reduction");
            Assert.True(stored[1].All(e => e.Text!.Length <= 2048), "Merged size cap");
            Assert.Equal(String.Concat(stored[0].Select(e => e.Text)), String.Concat(stored[1].Select(e => e.Text)), "Identical reconstructed transcript");
            Assert.Equal(String.Join("\n", stored[0].Select(e => e.RawEventJson)), String.Join("\n", stored[1].Select(e => e.RawEventJson)), "Identical raw harness lines");
        }
    }
}
