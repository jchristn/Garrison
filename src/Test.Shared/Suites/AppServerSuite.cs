namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Harnesses;
    using Garrison.Harnesses.AppServer;
    using Garrison.Harnesses.Parsers;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Codex app-server driver suites (P12.2a): the JSON-RPC connection and the driver's protocol steps against an
    /// in-process scripted app-server (<see cref="ScriptedAppServerPeer"/>), with the parser reading the same stdout.
    /// </summary>
    public static class AppServerSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("app-server-driver", "handshake-and-turn", "Driver: initialize, initialized, thread/start, turn/start in order with typed parameters; deltas stream through the parser", HandshakeAndTurnAsync),
                new TestCaseDescriptor("app-server-driver", "api-key-login", "Driver: an API key logs in with account/login/start before the thread starts", ApiKeyLoginAsync),
                new TestCaseDescriptor("app-server-driver", "resume-and-schema", "Driver: a resume thread id uses thread/resume; the output schema rides on turn/start", ResumeAndSchemaAsync),
                new TestCaseDescriptor("app-server-driver", "completion-before-response", "Driver: turn/completed that arrives before the turn/start response still ends the turn", CompletionBeforeResponseAsync),
                new TestCaseDescriptor("app-server-driver", "rejected-request", "Driver: an error response ends the session without throwing; the parser fails the run with the message", RejectedRequestAsync),
                new TestCaseDescriptor("app-server-driver", "server-requests", "Driver: approvals and elicitations are declined, token refresh and unknown requests get JSON-RPC errors", ServerRequestsAsync),
                new TestCaseDescriptor("app-server-driver", "cancellation", "Driver: a turn that never completes ends when the token is cancelled (process exit)", CancellationAsync),
                new TestCaseDescriptor("app-server-driver", "connection-basics", "Connection: non-JSON lines are ignored, request errors surface as JsonRpcException with code and method", ConnectionBasicsAsync)
            };
            return new List<TestSuiteDescriptor> { new TestSuiteDescriptor("app-server-driver", "Codex app-server driver", cases) };
        }

        #endregion

        #region Private-Methods

        private static CodexAppServerDriver Driver(ScriptedAppServerPeer peer, CodexAppServerOptions options, HarnessRunState? state = null, IHarnessOutputParser? parser = null)
        {
            CodexAppServerDriver driver = new CodexAppServerDriver(options);
            peer.Deliver = line =>
            {
                driver.HandleLine(line);
                if (parser != null && state != null)
                {
                    lock (state)
                    {
                        parser.ParseLine(line, state);
                    }
                }
            };
            return driver;
        }

        private static JsonElement Params(string raw)
        {
            using (JsonDocument document = JsonDocument.Parse(raw))
            {
                return document.RootElement.TryGetProperty("params", out JsonElement p) ? p.Clone() : default;
            }
        }

        private static async Task DriveAsync(CodexAppServerDriver driver, ScriptedAppServerPeer peer, CancellationToken token)
        {
            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                timeout.CancelAfter(TimeSpan.FromSeconds(20));
                await driver.DriveAsync(peer, timeout.Token).ConfigureAwait(false);
                Assert.True(!timeout.IsCancellationRequested, "The driver should finish before the 20 second guard.");
            }
            await peer.DrainAsync().ConfigureAwait(false);
        }

        private static async Task HandshakeAndTurnAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            CodexAppServerOptions options = new CodexAppServerOptions();
            options.Prompt = "Say hello.";
            options.Cwd = "/work/run";
            HarnessRunState state = new HarnessRunState();
            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.CodexAppServer);
            using (CodexAppServerDriver driver = Driver(peer, options, state, parser))
            {
                await DriveAsync(driver, peer, token).ConfigureAwait(false);
                List<string> methods = peer.Received.Select(r => JsonDocument.Parse(r).RootElement.GetProperty("method").GetString() ?? String.Empty).ToList();
                Assert.Equal("initialize,initialized,thread/start,turn/start", String.Join(",", methods), "Request order");

                JsonElement initialize = Params(peer.Sent("initialize")[0]);
                Assert.Equal("garrison", initialize.GetProperty("clientInfo").GetProperty("name").GetString(), "Client name");
                Assert.True(initialize.GetProperty("capabilities").GetProperty("experimentalApi").GetBoolean() == false, "Experimental API is off");
                Assert.True(JsonDocument.Parse(peer.Sent("initialized")[0]).RootElement.TryGetProperty("id", out JsonElement _) == false, "initialized is a notification");

                JsonElement start = Params(peer.Sent("thread/start")[0]);
                Assert.Equal("/work/run", start.GetProperty("cwd").GetString(), "Thread cwd");
                Assert.Equal("never", start.GetProperty("approvalPolicy").GetString(), "Approval policy");

                JsonElement turn = Params(peer.Sent("turn/start")[0]);
                Assert.Equal("thr_scripted", turn.GetProperty("threadId").GetString(), "Turn thread");
                JsonElement input = turn.GetProperty("input")[0];
                Assert.Equal("text", input.GetProperty("type").GetString(), "Input type");
                Assert.Equal("Say hello.", input.GetProperty("text").GetString(), "Prompt");
                Assert.Equal(JsonValueKind.Array, input.GetProperty("text_elements").ValueKind, "text_elements is sent");
                Assert.True(!turn.TryGetProperty("outputSchema", out JsonElement _), "No output schema without one");

                Assert.Equal("thr_scripted", driver.ThreadId, "Driver thread id");
                Assert.Equal("scripted-model", driver.Model, "Driver model");
            }

            parser.Complete(state);
            List<RunEventReport> events = state.Drain();
            List<RunEventReport> text = events.Where(e => e.EventType == RunEventTypeEnum.AssistantText).ToList();
            Assert.Equal(3, text.Count, "One AssistantText event per delta; the completed item is not emitted again");
            Assert.Equal("Hello, world.", String.Concat(text.Select(e => e.Text)), "Streamed text");
            Assert.True(text.All(e => e.RawEventJson == null), "Deltas carry no raw JSON");
            Assert.True(state.SawSuccess && state.SawFinalResult, "Turn completed");
            Assert.Equal("Hello, world.", state.FinalText, "Final text");
            Assert.Equal("thr_scripted", state.SessionId, "Session id");
            Assert.Equal("scripted-model", state.ServedModel, "Served model");
        }

        private static async Task ApiKeyLoginAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            CodexAppServerOptions options = new CodexAppServerOptions();
            Dictionary<string, string> environment = new Dictionary<string, string> { ["PATH"] = "/usr/bin", ["OPENAI_API_KEY"] = "sk-test-openai", ["CODEX_API_KEY"] = "" };
            options.UseApiKeyFrom(environment);
            Assert.Equal("sk-test-openai", options.ApiKey, "Key from the first non-empty variable");
            using (CodexAppServerDriver driver = Driver(peer, options))
            {
                await DriveAsync(driver, peer, token).ConfigureAwait(false);
                List<string> methods = peer.Received.Select(r => JsonDocument.Parse(r).RootElement.GetProperty("method").GetString() ?? String.Empty).ToList();
                Assert.Equal("initialize,initialized,account/login/start,thread/start,turn/start", String.Join(",", methods), "Login comes before the thread");
                JsonElement login = Params(peer.Sent("account/login/start")[0]);
                Assert.Equal("apiKey", login.GetProperty("type").GetString(), "Login type");
                Assert.Equal("sk-test-openai", login.GetProperty("apiKey").GetString(), "API key");
            }

            CodexAppServerOptions none = new CodexAppServerOptions();
            none.UseApiKeyFrom(new Dictionary<string, string> { ["PATH"] = "/usr/bin" });
            Assert.True(none.ApiKey == null, "No key without the variables");
        }

        private static async Task ResumeAndSchemaAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            peer.ThreadId = "thr_saved";
            CodexAppServerOptions options = new CodexAppServerOptions();
            options.ResumeThreadId = "thr_saved";
            options.OutputSchemaJson = "{\"type\":\"object\",\"properties\":{\"answer\":{\"type\":\"string\"}},\"required\":[\"answer\"]}";
            options.ApprovalPolicy = null;
            using (CodexAppServerDriver driver = Driver(peer, options))
            {
                await DriveAsync(driver, peer, token).ConfigureAwait(false);
                Assert.Equal(0, peer.Sent("thread/start").Count, "No thread/start on resume");
                JsonElement resume = Params(Assert.NotNull(peer.Sent("thread/resume").FirstOrDefault(), "thread/resume"));
                Assert.Equal("thr_saved", resume.GetProperty("threadId").GetString(), "Resumed thread");
                Assert.True(!resume.TryGetProperty("approvalPolicy", out JsonElement _), "A null approval policy is omitted");
                JsonElement schema = Params(peer.Sent("turn/start")[0]).GetProperty("outputSchema");
                Assert.Equal("object", schema.GetProperty("type").GetString(), "Schema sent as JSON, not a string");
                Assert.Equal("answer", schema.GetProperty("required")[0].GetString(), "Schema content");
            }
        }

        private static async Task CompletionBeforeResponseAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            peer.CompleteBeforeResponse = true;
            using (CodexAppServerDriver driver = Driver(peer, new CodexAppServerOptions()))
            {
                await DriveAsync(driver, peer, token).ConfigureAwait(false);
            }
        }

        private static async Task RejectedRequestAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            peer.Errors["thread/start"] = "model not available";
            HarnessRunState state = new HarnessRunState();
            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.CodexAppServer);
            using (CodexAppServerDriver driver = Driver(peer, new CodexAppServerOptions(), state, parser))
            {
                await DriveAsync(driver, peer, token).ConfigureAwait(false);
                Assert.Equal(0, peer.Sent("turn/start").Count, "No turn after a rejected thread/start");
                Assert.True(!driver.Connection.IsOpen, "The connection is closed when the session ends");
            }
            parser.Complete(state);
            Assert.True(!state.SawSuccess, "No success");
            Assert.True(state.DetectedFailure != null && state.DetectedFailure.Contains("model not available", StringComparison.Ordinal), "Failure carries the message: " + state.DetectedFailure);
            Assert.True(state.Drain().Any(e => e.EventType == RunEventTypeEnum.Error), "Error event");
        }

        private static async Task ServerRequestsAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            peer.AfterThread.Add("{\"id\":101,\"method\":\"item/commandExecution/requestApproval\",\"params\":{\"threadId\":\"thr_scripted\",\"itemId\":\"c1\",\"command\":\"rm -rf /\"}}");
            peer.AfterThread.Add("{\"id\":\"req-102\",\"method\":\"item/fileChange/requestApproval\",\"params\":{\"threadId\":\"thr_scripted\",\"itemId\":\"f1\"}}");
            peer.AfterThread.Add("{\"id\":103,\"method\":\"mcpServer/elicitation/request\",\"params\":{\"serverName\":\"docs\"}}");
            peer.AfterThread.Add("{\"id\":104,\"method\":\"account/chatgptAuthTokens/refresh\",\"params\":{\"reason\":\"unauthorized\"}}");
            peer.AfterThread.Add("{\"id\":105,\"method\":\"item/tool/requestUserInput\",\"params\":{}}");
            peer.AnswersBeforeCompletion = 5;
            HarnessRunState state = new HarnessRunState();
            IHarnessOutputParser parser = ParserFactory.Create(OutputParserEnum.CodexAppServer);
            using (CodexAppServerDriver driver = Driver(peer, new CodexAppServerOptions(), state, parser))
            {
                await DriveAsync(driver, peer, token).ConfigureAwait(false);
            }

            Dictionary<string, JsonElement> answers = Answers(peer);
            Assert.Equal(5, answers.Count, "Every server request is answered");
            Assert.Equal("decline", answers["101"].GetProperty("result").GetProperty("decision").GetString(), "Command approval declined");
            Assert.Equal("decline", answers["\"req-102\""].GetProperty("result").GetProperty("decision").GetString(), "File change declined; string id echoed");
            JsonElement elicitation = answers["103"].GetProperty("result");
            Assert.Equal("decline", elicitation.GetProperty("action").GetString(), "Elicitation declined");
            Assert.Equal(JsonValueKind.Null, elicitation.GetProperty("content").ValueKind, "content is written as null");
            Assert.Equal(-32603L, answers["104"].GetProperty("error").GetProperty("code").GetInt64(), "Token refresh refused");
            Assert.Equal(-32601L, answers["105"].GetProperty("error").GetProperty("code").GetInt64(), "Unknown request refused");
            List<RunEventReport> events = state.Drain();
            Assert.True(events.Count(e => e.EventType == RunEventTypeEnum.Warning && e.Text != null && e.Text.Contains("approval", StringComparison.Ordinal)) >= 3, "Approval requests are visible as warnings");
        }

        private static Dictionary<string, JsonElement> Answers(ScriptedAppServerPeer peer)
        {
            Dictionary<string, JsonElement> answers = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
            foreach (string raw in peer.Received)
            {
                using (JsonDocument document = JsonDocument.Parse(raw))
                {
                    JsonElement root = document.RootElement;
                    if (root.TryGetProperty("method", out JsonElement _) || !root.TryGetProperty("id", out JsonElement id)) continue;
                    answers[id.GetRawText()] = root.Clone();
                }
            }
            return answers;
        }

        private static async Task CancellationAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            peer.NeverComplete = true;
            using (CodexAppServerDriver driver = Driver(peer, new CodexAppServerOptions()))
            using (CancellationTokenSource exit = new CancellationTokenSource(TimeSpan.FromMilliseconds(500)))
            {
                DateTime started = DateTime.UtcNow;
                bool cancelled = false;
                try
                {
                    await driver.DriveAsync(peer, exit.Token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    cancelled = true;
                }
                Assert.True(cancelled, "Cancellation surfaces as OperationCanceledException (the process runner swallows it)");
                Assert.True(DateTime.UtcNow - started < TimeSpan.FromSeconds(10), "The driver returns promptly");
                Assert.True(!driver.Connection.IsOpen, "Connection closed");
            }
        }

        private static async Task ConnectionBasicsAsync(CancellationToken token)
        {
            ScriptedAppServerPeer peer = new ScriptedAppServerPeer();
            peer.Errors["thread/start"] = "denied";
            using (JsonRpcConnection connection = new JsonRpcConnection())
            {
                peer.Deliver = line => connection.HandleLine(line);
                connection.Attach(peer);
                Assert.True(connection.HandleLine("not json") == null, "Plain text is ignored");
                Assert.True(connection.HandleLine("{ broken") == null, "Broken JSON is ignored");
                Assert.True(connection.HandleLine(null) == null, "Null is ignored");

                JsonElement initialized = await connection.SendRequestAsync("initialize", null, token).ConfigureAwait(false);
                Assert.Equal("scripted/1.0", initialized.GetProperty("userAgent").GetString(), "Result");
                try
                {
                    await connection.SendRequestAsync("thread/start", null, token).ConfigureAwait(false);
                    throw new TestAssertionException("Expected JsonRpcException.");
                }
                catch (JsonRpcException e)
                {
                    Assert.Equal(-32600L, e.Code, "Error code");
                    Assert.Equal("thread/start", e.Method, "Method");
                    Assert.Equal("denied", e.Message, "Message");
                }

                List<string> notifications = new List<string>();
                connection.NotificationReceived += message => notifications.Add(message.Method ?? String.Empty);
                connection.HandleLine("{\"method\":\"warning\",\"params\":{\"message\":\"x\"}}");
                Assert.Equal("warning", notifications.FirstOrDefault(), "Notification raised");

                connection.Close();
                Assert.True(!connection.IsOpen, "Closed");
                try
                {
                    await connection.SendRequestAsync("initialize", null, token).ConfigureAwait(false);
                    throw new TestAssertionException("Expected cancellation after close.");
                }
                catch (OperationCanceledException)
                {
                }
            }
        }

        #endregion
    }
}
