namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// An in-process, scripted Codex app-server for driver tests. It is the <see cref="TextWriter"/> the driver writes
    /// requests to; each complete line is recorded and answered, and the answers (plus scripted notifications) are
    /// delivered in order on a background task to <see cref="Deliver"/>, the way the worker's stdout reader would.
    /// Thread-safe.
    /// </summary>
    public class ScriptedAppServerPeer : TextWriter
    {
        #region Public-Members

        /// <summary>
        /// Receives every line the peer "prints" (normally the driver's HandleLine), in order.
        /// </summary>
        public Action<string>? Deliver { get; set; } = null;

        /// <summary>
        /// Every JSON message the driver wrote, in order (raw JSON).
        /// </summary>
        public ConcurrentQueue<string> Received { get; } = new ConcurrentQueue<string>();

        /// <summary>
        /// Every line delivered to <see cref="Deliver"/>, in order.
        /// </summary>
        public ConcurrentQueue<string> Delivered { get; } = new ConcurrentQueue<string>();

        /// <summary>
        /// Methods to answer with a JSON-RPC error (method to message).
        /// </summary>
        public Dictionary<string, string> Errors { get; } = new Dictionary<string, string>(StringComparer.Ordinal);

        /// <summary>
        /// Raw lines sent right after the thread/start or thread/resume response (for example server requests).
        /// </summary>
        public List<string> AfterThread { get; } = new List<string>();

        /// <summary>
        /// Text streamed as agent message deltas, one delta per element.
        /// </summary>
        public List<string> Deltas { get; } = new List<string> { "Hello", ", ", "world." };

        /// <summary>
        /// Whether turn/completed is delivered before the turn/start response (a reordering the driver must survive).
        /// </summary>
        public bool CompleteBeforeResponse { get; set; } = false;

        /// <summary>
        /// Whether the turn never completes.
        /// </summary>
        public bool NeverComplete { get; set; } = false;

        /// <summary>
        /// Number of answers to server requests the peer waits for (up to 5 seconds) before it completes the turn, the
        /// way Codex waits for an approval. Default 0.
        /// </summary>
        public int AnswersBeforeCompletion { get; set; } = 0;

        /// <summary>
        /// Status reported in turn/completed. Default completed.
        /// </summary>
        public string TurnStatus { get; set; } = "completed";

        /// <summary>
        /// Thread identifier the peer reports.
        /// </summary>
        public string ThreadId { get; set; } = "thr_scripted";

        /// <summary>
        /// Turn identifier the peer reports.
        /// </summary>
        public string TurnId { get; set; } = "turn_scripted";

        /// <summary>
        /// Encoding.
        /// </summary>
        public override Encoding Encoding
        {
            get
            {
                return Encoding.UTF8;
            }
        }

        #endregion

        #region Private-Members

        private readonly object _Lock = new object();
        private readonly StringBuilder _Line = new StringBuilder();
        private Task _Chain = Task.CompletedTask;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Write one character; a newline completes a message.
        /// </summary>
        /// <param name="value">Character.</param>
        public override void Write(char value)
        {
            string? line = null;
            lock (_Lock)
            {
                if (value == '\n')
                {
                    line = _Line.ToString();
                    _Line.Clear();
                }
                else
                {
                    _Line.Append(value);
                }
            }
            if (line != null) OnLine(line);
        }

        /// <summary>
        /// Messages the driver wrote with the given method.
        /// </summary>
        /// <param name="method">Method.</param>
        /// <returns>Raw JSON messages.</returns>
        public List<string> Sent(string method)
        {
            return Received.Where(r => Method(r) == method).ToList();
        }

        /// <summary>
        /// Deliver a raw line as if the app-server printed it.
        /// </summary>
        /// <param name="line">Line.</param>
        public void Send(string line)
        {
            lock (_Lock)
            {
                _Chain = _Chain.ContinueWith(_ =>
                {
                    Delivered.Enqueue(line);
                    Deliver?.Invoke(line);
                }, CancellationToken.None, TaskContinuationOptions.None, TaskScheduler.Default);
            }
        }

        /// <summary>
        /// Wait until every queued line has been delivered.
        /// </summary>
        /// <returns>Task.</returns>
        public Task DrainAsync()
        {
            lock (_Lock)
            {
                return _Chain;
            }
        }

        #endregion

        #region Private-Methods

        private void OnLine(string line)
        {
            Received.Enqueue(line);
            string? method;
            string? id;
            using (JsonDocument document = JsonDocument.Parse(line))
            {
                JsonElement root = document.RootElement;
                method = root.TryGetProperty("method", out JsonElement m) ? m.GetString() : null;
                id = root.TryGetProperty("id", out JsonElement i) ? i.GetRawText() : null;
            }
            if (method == null || id == null) return;

            if (Errors.TryGetValue(method, out string? error))
            {
                Send("{\"id\":" + id + ",\"error\":{\"code\":-32600,\"message\":" + JsonSerializer.Serialize(error) + "}}");
                return;
            }

            switch (method)
            {
                case "initialize":
                    Send("{\"id\":" + id + ",\"result\":{\"userAgent\":\"scripted/1.0\",\"codexHome\":\"/tmp/codex\",\"platformFamily\":\"unix\",\"platformOs\":\"linux\"}}");
                    Send("{\"method\":\"remoteControl/status/changed\",\"params\":{\"status\":\"disabled\"}}");
                    break;
                case "account/login/start":
                    Send("{\"id\":" + id + ",\"result\":{\"type\":\"apiKey\"}}");
                    break;
                case "thread/start":
                case "thread/resume":
                    string thread = "{\"id\":\"" + ThreadId + "\",\"model\":\"scripted-model\"}";
                    Send("{\"id\":" + id + ",\"result\":{\"thread\":" + thread + ",\"model\":\"scripted-model\",\"modelProvider\":\"openai\"}}");
                    Send("{\"method\":\"thread/started\",\"params\":{\"thread\":" + thread + "}}");
                    foreach (string extra in AfterThread) Send(extra);
                    break;
                case "turn/start":
                    string response = "{\"id\":" + id + ",\"result\":{\"turn\":{\"id\":\"" + TurnId + "\",\"items\":[],\"status\":\"inProgress\",\"error\":null}}}";
                    if (!CompleteBeforeResponse) Send(response);
                    Send("{\"method\":\"turn/started\",\"params\":{\"threadId\":\"" + ThreadId + "\",\"turn\":{\"id\":\"" + TurnId + "\",\"status\":\"inProgress\"}}}");
                    foreach (string delta in Deltas)
                    {
                        Send("{\"method\":\"item/agentMessage/delta\",\"params\":{\"threadId\":\"" + ThreadId + "\",\"turnId\":\"" + TurnId + "\",\"itemId\":\"msg_1\",\"delta\":" + JsonSerializer.Serialize(delta) + "}}");
                    }
                    Send("{\"method\":\"item/completed\",\"params\":{\"threadId\":\"" + ThreadId + "\",\"turnId\":\"" + TurnId + "\",\"item\":{\"type\":\"agentMessage\",\"id\":\"msg_1\",\"text\":" + JsonSerializer.Serialize(String.Concat(Deltas)) + "}}}");
                    string turnError = TurnStatus == "completed" ? "null" : "{\"message\":\"scripted failure\",\"codexErrorInfo\":\"other\"}";
                    string completed = "{\"method\":\"turn/completed\",\"params\":{\"threadId\":\"" + ThreadId + "\",\"turn\":{\"id\":\"" + TurnId + "\",\"items\":[],\"status\":\"" + TurnStatus + "\",\"error\":" + turnError + "}}}";
                    if (AnswersBeforeCompletion > 0 && !NeverComplete)
                    {
                        Send(response);
                        _ = Task.Run(async () =>
                        {
                            DateTime deadline = DateTime.UtcNow.AddSeconds(5);
                            while (AnswerCount() < AnswersBeforeCompletion && DateTime.UtcNow < deadline) await Task.Delay(10).ConfigureAwait(false);
                            Send(completed);
                        });
                        break;
                    }
                    if (!NeverComplete) Send(completed);
                    if (CompleteBeforeResponse) Send(response);
                    break;
                default:
                    Send("{\"id\":" + id + ",\"error\":{\"code\":-32601,\"message\":\"method not found\"}}");
                    break;
            }
        }

        private int AnswerCount()
        {
            int count = 0;
            foreach (string raw in Received)
            {
                using (JsonDocument document = JsonDocument.Parse(raw))
                {
                    JsonElement root = document.RootElement;
                    if (!root.TryGetProperty("method", out JsonElement _) && root.TryGetProperty("id", out JsonElement _)) count++;
                }
            }
            return count;
        }

        private static string? Method(string raw)
        {
            using (JsonDocument document = JsonDocument.Parse(raw))
            {
                return document.RootElement.TryGetProperty("method", out JsonElement m) ? m.GetString() : null;
            }
        }

        #endregion
    }
}
