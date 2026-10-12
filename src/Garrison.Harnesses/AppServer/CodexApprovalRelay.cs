namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Approvals;
    using Garrison.Core.Compilation;
    using Garrison.Core.Serialization;
    using Voltaic.Mcp;

    /// <summary>
    /// Relays Codex app-server approval requests to Garrison (P12.3). Command approvals are asked as tool Bash with the
    /// command and working directory, file change approvals as tool Edit with the changed paths (taken from the
    /// item/started notification of the same item), so one set of deployment rules covers Claude Code and Codex. The
    /// relay calls garrison_permission_prompt over MCP with the run token, the same path Claude Code takes, and answers
    /// accept or decline. Anything that goes wrong (Garrison unreachable, timeout, a malformed answer) declines.
    /// Requests other than the two approvals get the headless answer. Thread-safe.
    /// </summary>
    public class CodexApprovalRelay
    {
        #region Public-Members

        /// <summary>
        /// Relay settings from the execution spec.
        /// </summary>
        public ExecutionApprovalRelay Settings { get; }

        /// <summary>
        /// Asks Garrison: tool name, input JSON, tool call ID, kind (Command or FileChange). Replaceable for tests; the
        /// default calls garrison_permission_prompt over MCP.
        /// </summary>
        public Func<string, string, string?, string, CancellationToken, Task<PermissionPromptReply>> Ask { get; set; }

        /// <summary>
        /// Called with a line describing each relayed decision, or null.
        /// </summary>
        public Action<string>? Log { get; set; } = null;

        /// <summary>
        /// Maximum file change items remembered while waiting for their approval request. Minimum 1, maximum 100000,
        /// default 1000.
        /// </summary>
        public int MaxTrackedItems
        {
            get
            {
                return _MaxTrackedItems;
            }
            set
            {
                _MaxTrackedItems = Math.Clamp(value, 1, 100000);
            }
        }

        #endregion

        #region Private-Members

        private readonly object _Lock = new object();
        private readonly Dictionary<string, List<string>> _Paths = new Dictionary<string, List<string>>(StringComparer.Ordinal);
        private readonly Queue<string> _Order = new Queue<string>();
        private int _MaxTrackedItems = 1000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="settings">Relay settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when settings is null.</exception>
        public CodexApprovalRelay(ExecutionApprovalRelay settings)
        {
            Settings = settings ?? throw new ArgumentNullException(nameof(settings));
            Ask = AskGarrisonAsync;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Attach to a driver: track file change items from its notifications and answer its server requests.
        /// </summary>
        /// <param name="driver">Driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public void Attach(CodexAppServerDriver driver)
        {
            if (driver == null) throw new ArgumentNullException(nameof(driver));
            driver.Connection.NotificationReceived += Observe;
            driver.ServerRequestHandler = HandleAsync;
        }

        /// <summary>
        /// Observe an app-server notification; remembers the paths of file change items.
        /// </summary>
        /// <param name="message">Notification.</param>
        public void Observe(JsonRpcMessage message)
        {
            if (message == null || message.Method != "item/started" || !message.Params.HasValue) return;
            CodexItemNotification? notification;
            try
            {
                notification = message.Params.Value.Deserialize<CodexItemNotification>(Serializer.Options);
            }
            catch (JsonException)
            {
                return;
            }
            CodexItem? item = notification?.Item;
            if (item == null || item.Type != "fileChange" || String.IsNullOrEmpty(item.Id)) return;
            List<string> paths = (item.Changes ?? new List<CodexFileChange>()).Where(c => !String.IsNullOrWhiteSpace(c.Path)).Select(c => c.Path!).ToList();
            lock (_Lock)
            {
                if (!_Paths.ContainsKey(item.Id)) _Order.Enqueue(item.Id);
                _Paths[item.Id] = paths;
                while (_Order.Count > _MaxTrackedItems) _Paths.Remove(_Order.Dequeue());
            }
        }

        /// <summary>
        /// Answer an app-server request: relay command and file change approvals, and give everything else the headless
        /// answer (<see cref="CodexAppServerDriver.HeadlessRequestAsync"/>).
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result to send.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="JsonRpcException">Thrown to answer with an error.</exception>
        public async Task<object?> HandleAsync(JsonRpcMessage request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            bool command = request.Method == "item/commandExecution/requestApproval";
            bool fileChange = request.Method == "item/fileChange/requestApproval";
            if (!command && !fileChange) return await CodexAppServerDriver.HeadlessRequestAsync(request, token).ConfigureAwait(false);

            CodexApprovalRequestParams parameters = new CodexApprovalRequestParams();
            if (request.Params.HasValue)
            {
                try
                {
                    parameters = request.Params.Value.Deserialize<CodexApprovalRequestParams>(Serializer.Options) ?? parameters;
                }
                catch (JsonException)
                {
                }
            }

            ApprovalToolInput input = new ApprovalToolInput();
            string toolName;
            string kind;
            if (command)
            {
                toolName = "Bash";
                kind = "Command";
                input.Command = parameters.Command ?? String.Empty;
                input.Cwd = parameters.Cwd;
            }
            else
            {
                toolName = "Edit";
                kind = "FileChange";
                lock (_Lock)
                {
                    if (!String.IsNullOrEmpty(parameters.ItemId) && _Paths.TryGetValue(parameters.ItemId, out List<string>? paths)) input.Paths = new List<string>(paths);
                }
                if ((input.Paths == null || input.Paths.Count == 0) && !String.IsNullOrEmpty(parameters.GrantRoot)) input.Paths = new List<string> { parameters.GrantRoot! };
            }

            PermissionPromptReply reply;
            try
            {
                reply = await Ask(toolName, Serializer.Serialize(input), parameters.ItemId, kind, token).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (token.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception e)
            {
                reply = new PermissionPromptReply();
                reply.Behavior = "deny";
                reply.Message = "Garrison could not be asked: " + e.Message;
            }

            Log?.Invoke("codex " + kind.ToLowerInvariant() + " approval " + (reply.ApprovalId ?? String.Empty) + " " + (reply.Allowed ? "accepted" : "declined") + (reply.Allowed || String.IsNullOrEmpty(reply.Message) ? String.Empty : ": " + reply.Message));
            CodexApprovalResponse response = new CodexApprovalResponse();
            response.Decision = reply.Allowed ? "accept" : "decline";
            return response;
        }

        #endregion

        #region Private-Methods

        private async Task<PermissionPromptReply> AskGarrisonAsync(string toolName, string inputJson, string? toolCallId, string kind, CancellationToken token)
        {
            int timeoutMs = Settings.TimeoutSeconds * 1000;
            using (CancellationTokenSource timeout = new CancellationTokenSource(timeoutMs))
            using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token))
            using (McpHttpClient client = new McpHttpClient())
            using (JsonDocument input = JsonDocument.Parse(String.IsNullOrWhiteSpace(inputJson) ? "{}" : inputJson))
            {
                client.SetRequestHeader("Authorization", "Bearer " + Settings.BearerToken);
                bool connected = await client.ConnectStreamableAsync(Settings.McpUrl.TrimEnd('/'), String.IsNullOrEmpty(Settings.McpPath) ? "/mcp" : Settings.McpPath, linked.Token).ConfigureAwait(false);
                if (!connected) throw new InvalidOperationException("could not connect to " + Settings.McpUrl);
                Dictionary<string, object?> arguments = new Dictionary<string, object?>(StringComparer.Ordinal);
                arguments["tool_name"] = toolName;
                arguments["input"] = input.RootElement.Clone();
                arguments["tool_use_id"] = toolCallId;
                arguments["garrison_kind"] = kind;
                Dictionary<string, object?> call = new Dictionary<string, object?>(StringComparer.Ordinal);
                call["name"] = Settings.ToolName;
                call["arguments"] = arguments;
                McpToolCallReply? result = await client.CallAsync<McpToolCallReply>("tools/call", call, timeoutMs, linked.Token).ConfigureAwait(false);
                string? text = result?.Content?.FirstOrDefault(c => c.Type == "text")?.Text;
                if (result == null || String.IsNullOrEmpty(text)) throw new InvalidOperationException("garrison_permission_prompt returned no answer");
                if (result.IsError) throw new InvalidOperationException(text);
                return Serializer.Deserialize<PermissionPromptReply>(text) ?? throw new InvalidOperationException("garrison_permission_prompt returned an unreadable answer");
            }
        }

        #endregion
    }
}
