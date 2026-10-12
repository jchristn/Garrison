namespace Garrison.FakeHarness
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.IO;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// A scripted stand-in for <c>codex app-server</c> (format <c>codex-app-server</c>): reads JSON-RPC requests from
    /// stdin one line at a time and answers <c>initialize</c>, <c>account/login/start</c>, <c>thread/start</c>,
    /// <c>thread/resume</c>, and <c>turn/start</c> the way Codex 0.159.3 does, streaming the answer as
    /// <c>item/agentMessage/delta</c> notifications. Exits when stdin closes, like the real app-server.
    /// </summary>
    public class FakeAppServer
    {
        #region Private-Members

        private static readonly string _FakeModel = "fake-app-server-model";

        private readonly FakeOptions _Options;
        private readonly object _WriteLock = new object();
        private readonly ConcurrentDictionary<string, TaskCompletionSource<JsonElement>> _Answers = new ConcurrentDictionary<string, TaskCompletionSource<JsonElement>>(StringComparer.Ordinal);
        private readonly List<Task> _Turns = new List<Task>();
        private bool _Resumed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Options.</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public FakeAppServer(FakeOptions options)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Serve until stdin closes.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Exit code.</returns>
        public async Task<int> RunAsync(CancellationToken token = default)
        {
            while (!token.IsCancellationRequested)
            {
                string? line = await Console.In.ReadLineAsync(token).ConfigureAwait(false);
                if (line == null) break;
                if (String.IsNullOrWhiteSpace(line)) continue;
                using (JsonDocument document = JsonDocument.Parse(line))
                {
                    Handle(document.RootElement.Clone());
                }
            }

            // Stdin closed: like the real app-server, stop at once; a turn still running is abandoned.
            if (!String.IsNullOrEmpty(_Options.Stderr)) Console.Error.WriteLine(_Options.Stderr);
            if (_Options.ExitCode.HasValue) return _Options.ExitCode.Value;
            return 0;
        }

        #endregion

        #region Private-Methods

        private void Handle(JsonElement message)
        {
            bool hasId = message.TryGetProperty("id", out JsonElement id);
            string? method = message.TryGetProperty("method", out JsonElement m) ? m.GetString() : null;
            JsonElement parameters = message.TryGetProperty("params", out JsonElement p) ? p : default;

            if (method == null)
            {
                if (hasId && _Answers.TryRemove(IdText(id), out TaskCompletionSource<JsonElement>? waiter))
                {
                    waiter.TrySetResult(message.TryGetProperty("result", out JsonElement result) ? result : message);
                }
                return;
            }
            if (!hasId) return;

            switch (method)
            {
                case "initialize":
                    Respond(id, new { userAgent = "garrison-fake-harness/" + Program.FakeVersion, codexHome = Environment.GetEnvironmentVariable("CODEX_HOME") ?? String.Empty, platformFamily = "unix", platformOs = "linux" });
                    break;
                case "account/login/start":
                    Console.Error.WriteLine("fake app-server: api key login");
                    Respond(id, new { type = "apiKey" });
                    Notify("account/login/completed", new { loginId = (string?)null, success = true, error = (string?)null });
                    break;
                case "thread/start":
                    StartThread(id, Guid.NewGuid().ToString(), parameters);
                    break;
                case "thread/resume":
                    string threadId = parameters.TryGetProperty("threadId", out JsonElement t) ? t.GetString() ?? String.Empty : String.Empty;
                    string? file = SessionFile(threadId);
                    if (file == null || !File.Exists(file))
                    {
                        RespondError(id, -32600, "no rollout found for thread id " + threadId);
                        return;
                    }
                    _Resumed = true;
                    StartThread(id, threadId, parameters);
                    break;
                case "turn/start":
                    StartTurn(id, parameters);
                    break;
                default:
                    RespondError(id, -32601, "method not found: " + method);
                    break;
            }
        }

        private void StartThread(JsonElement id, string threadId, JsonElement parameters)
        {
            string cwd = parameters.ValueKind == JsonValueKind.Object && parameters.TryGetProperty("cwd", out JsonElement c) && c.ValueKind == JsonValueKind.String ? c.GetString() ?? String.Empty : Directory.GetCurrentDirectory();
            if (parameters.ValueKind == JsonValueKind.Object && parameters.TryGetProperty("approvalPolicy", out JsonElement policy)) Console.Error.WriteLine("fake app-server: approval policy " + policy.GetRawText());
            object thread = new { id = threadId, model = _FakeModel, cwd = cwd, status = new { type = "idle" } };
            Respond(id, new { thread = thread, model = _FakeModel, modelProvider = "fake", cwd = cwd, approvalPolicy = "never" });
            Notify("thread/started", new { thread = thread });
        }

        private void StartTurn(JsonElement id, JsonElement parameters)
        {
            string threadId = parameters.TryGetProperty("threadId", out JsonElement t) ? t.GetString() ?? String.Empty : String.Empty;
            string prompt = String.Empty;
            if (parameters.TryGetProperty("input", out JsonElement input) && input.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in input.EnumerateArray())
                {
                    if (item.TryGetProperty("text", out JsonElement text)) prompt += text.GetString();
                }
            }
            if (parameters.TryGetProperty("outputSchema", out JsonElement schema) && schema.ValueKind == JsonValueKind.Object) Console.Error.WriteLine("fake app-server: output schema received");

            string turnId = Guid.NewGuid().ToString();
            Respond(id, new { turn = new { id = turnId, items = Array.Empty<object>(), status = "inProgress", error = (object?)null } });
            SaveTurn(threadId, prompt);
            lock (_Turns)
            {
                _Turns.Add(Task.Run(() => RunTurnAsync(threadId, turnId, prompt)));
            }
        }

        private async Task RunTurnAsync(string threadId, string turnId, string prompt)
        {
            Notify("turn/started", new { threadId = threadId, turn = new { id = turnId, items = Array.Empty<object>(), status = "inProgress", error = (object?)null } });
            if (_Options.Hang)
            {
                await Task.Delay(Timeout.Infinite).ConfigureAwait(false);
            }

            string answer = "Echo: " + (prompt.Length > 200 ? prompt.Substring(0, 200) : prompt).Trim();
            if (!String.IsNullOrEmpty(_Options.ScenarioFile) && File.Exists(_Options.ScenarioFile)) answer = File.ReadAllText(_Options.ScenarioFile).Trim();
            if (_Options.Answer != null) answer = _Options.Answer;
            if (_Resumed && _Options.ResumeAnswer != null) answer = _Options.ResumeAnswer;

            for (int i = 0; i < _Options.ToolCalls; i++)
            {
                string itemId = "call_" + (i + 1);
                Notify("item/started", new { threadId = threadId, turnId = turnId, item = new { type = "commandExecution", id = itemId, command = "echo ok " + (i + 1), status = "inProgress" } });
                if (_Options.ToolSleepMs > 0) await Task.Delay(_Options.ToolSleepMs).ConfigureAwait(false);
                Notify("item/completed", new { threadId = threadId, turnId = turnId, item = new { type = "commandExecution", id = itemId, command = "echo ok " + (i + 1), status = "completed", exitCode = 0, aggregatedOutput = "ok " + (i + 1) } });
            }

            if (_Options.RequestApproval)
            {
                JsonElement decision = await AskAsync("approval-1", "item/commandExecution/requestApproval", new { threadId = threadId, turnId = turnId, itemId = "call_approval", command = "rm -rf build" }).ConfigureAwait(false);
                string verdict = decision.ValueKind == JsonValueKind.Object && decision.TryGetProperty("decision", out JsonElement d) ? d.GetRawText() : decision.GetRawText();
                Console.Error.WriteLine("fake app-server: approval answered " + verdict);
                bool accepted = verdict == "\"accept\"" || verdict == "\"acceptForSession\"";
                Notify("item/completed", new { threadId = threadId, turnId = turnId, item = new { type = "commandExecution", id = "call_approval", command = "rm -rf build", status = accepted ? "completed" : "declined", exitCode = accepted ? 0 : (int?)null, aggregatedOutput = (string?)null } });
            }

            string reasoningId = "rs_" + turnId;
            Notify("item/started", new { threadId = threadId, turnId = turnId, item = new { type = "reasoning", id = reasoningId, summary = Array.Empty<string>(), content = Array.Empty<string>() } });
            Notify("item/reasoning/summaryTextDelta", new { threadId = threadId, turnId = turnId, itemId = reasoningId, delta = "Thinking about the prompt.", summaryIndex = 0 });
            Notify("item/completed", new { threadId = threadId, turnId = turnId, item = new { type = "reasoning", id = reasoningId, summary = new[] { "Thinking about the prompt." }, content = Array.Empty<string>() } });
            if (_Options.ThinkMs > 0) await Task.Delay(_Options.ThinkMs).ConfigureAwait(false);

            string messageId = "msg_" + turnId;
            Notify("item/started", new { threadId = threadId, turnId = turnId, item = new { type = "agentMessage", id = messageId, text = String.Empty, phase = "final_answer" } });
            List<string> chunks = Chunks(answer);
            for (int i = 0; i < chunks.Count; i++)
            {
                if (i > 0 && _Options.DelayMs > 0) await Task.Delay(_Options.DelayMs).ConfigureAwait(false);
                Notify("item/agentMessage/delta", new { threadId = threadId, turnId = turnId, itemId = messageId, delta = chunks[i] });
            }
            Notify("item/completed", new { threadId = threadId, turnId = turnId, item = new { type = "agentMessage", id = messageId, text = answer, phase = "final_answer" } });

            // Totals are per thread: a resumed thread already carries the earlier turn's usage.
            long earlier = _Resumed ? 1000 : 0;
            object last = new { totalTokens = 100 + chunks.Count, inputTokens = 100, cachedInputTokens = 40, cacheWriteInputTokens = 0, outputTokens = chunks.Count, reasoningOutputTokens = 2 };
            object total = new { totalTokens = earlier + 100 + chunks.Count, inputTokens = earlier + 100, cachedInputTokens = earlier + 40, cacheWriteInputTokens = 0, outputTokens = earlier + chunks.Count, reasoningOutputTokens = (_Resumed ? 10 : 0) + 2 };
            Notify("thread/tokenUsage/updated", new { threadId = threadId, turnId = turnId, tokenUsage = new { total = total, last = last, modelContextWindow = 200000 } });

            if (_Options.Fail)
            {
                object error = new { message = "Fake failure.", codexErrorInfo = "other", additionalDetails = (string?)null };
                Notify("error", new { error = error, willRetry = false, threadId = threadId, turnId = turnId });
                Notify("turn/completed", new { threadId = threadId, turn = new { id = turnId, items = Array.Empty<object>(), status = "failed", error = error } });
            }
            else
            {
                Notify("turn/completed", new { threadId = threadId, turn = new { id = turnId, items = Array.Empty<object>(), status = "completed", error = (object?)null } });
            }
        }

        private async Task<JsonElement> AskAsync(string id, string method, object parameters)
        {
            TaskCompletionSource<JsonElement> answer = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            _Answers[id] = answer;
            Write(new { id = id, method = method, @params = parameters });
            Task done = await Task.WhenAny(answer.Task, Task.Delay(10000)).ConfigureAwait(false);
            if (done != answer.Task)
            {
                _Answers.TryRemove(id, out TaskCompletionSource<JsonElement>? _);
                return JsonDocument.Parse("\"timeout\"").RootElement.Clone();
            }
            return await answer.Task.ConfigureAwait(false);
        }

        private static List<string> Chunks(string answer)
        {
            List<string> chunks = new List<string>();
            int start = 0;
            for (int i = 0; i < answer.Length; i++)
            {
                if (answer[i] == ' ' || i == answer.Length - 1)
                {
                    chunks.Add(answer.Substring(start, i - start + 1));
                    start = i + 1;
                }
            }
            if (chunks.Count == 0) chunks.Add(answer);
            return chunks;
        }

        private void Respond(JsonElement id, object result)
        {
            Write(new { id = id, result = result });
        }

        private void RespondError(JsonElement id, long code, string message)
        {
            Write(new { id = id, error = new { code = code, message = message } });
        }

        private void Notify(string method, object parameters)
        {
            Write(new { method = method, @params = parameters });
        }

        private void Write(object message)
        {
            string json = JsonSerializer.Serialize(message);
            lock (_WriteLock)
            {
                Console.Out.WriteLine(json);
                Console.Out.Flush();
            }
        }

        private static string IdText(JsonElement id)
        {
            return id.ValueKind == JsonValueKind.String ? id.GetString() ?? String.Empty : id.GetRawText();
        }

        private static string? SessionFile(string threadId)
        {
            string? home = Environment.GetEnvironmentVariable("HOME");
            if (String.IsNullOrEmpty(home)) home = Environment.GetEnvironmentVariable("USERPROFILE");
            if (String.IsNullOrEmpty(home) || String.IsNullOrEmpty(threadId)) return null;
            if (threadId.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 || threadId.Contains("..", StringComparison.Ordinal)) return null;
            return Path.Combine(home, ".garrison-fake", "sessions", threadId + ".txt");
        }

        private static void SaveTurn(string threadId, string prompt)
        {
            string? file = SessionFile(threadId);
            if (file == null) return;
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(file)!);
                File.AppendAllText(file, "--- turn " + DateTime.UtcNow.ToString("o") + Environment.NewLine + prompt + Environment.NewLine);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                Console.Error.WriteLine("Could not record the session: " + e.Message);
            }
        }

        #endregion
    }
}
