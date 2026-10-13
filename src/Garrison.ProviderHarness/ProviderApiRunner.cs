namespace Garrison.ProviderHarness
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;
    using Garrison.Harnesses.Provider;
    using PolyPrompt.Clients;
    using PolyPrompt.Models;
    using SyslogLogging;

    /// <summary>Optional provider agent loop. Emits only the typed harness protocol, never raw HTTP errors or credentials.</summary>
    public class ProviderApiRunner
    {
        private readonly ProviderApiConfig _Config;
        private readonly TextWriter _Output;
        private readonly string? _SessionHome;
        /// <summary>Construct a runner. Each instance executes one run.</summary>
        /// <param name="config">Resolved configuration.</param>
        /// <param name="output">Protocol output.</param>
        /// <param name="sessionHome">Optional isolated session home for embedding/testing. Null uses HOME or USERPROFILE.</param>
        public ProviderApiRunner(ProviderApiConfig config, TextWriter output, string? sessionHome = null)
        {
            _Config = config ?? throw new ArgumentNullException(nameof(config));
            _Output = output ?? throw new ArgumentNullException(nameof(output));
            _SessionHome = sessionHome;
        }

        /// <summary>Stream a bounded model/tool loop and persist a successful conversation turn.</summary>
        /// <param name="prompt">Task prompt compiled from Garrison templates.</param>
        /// <param name="token">Run cancellation.</param>
        /// <returns>Zero for a final successful answer, one for a reported failure.</returns>
        public async Task<int> RunAsync(string prompt, CancellationToken token)
        {
            _Config.Validate();
            token.ThrowIfCancellationRequested();
            if (String.IsNullOrWhiteSpace(prompt)) throw new ArgumentException("A provider task prompt is required.", nameof(prompt));
            string? apiKey = Environment.GetEnvironmentVariable(_Config.ApiKeyVariable);
            if (!_Config.AllowAnonymous && String.IsNullOrEmpty(apiKey)) return Fail("NotCredentialed", "The configured provider API credential is missing.");
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = false;
            using (ProviderMcpBridge tools = new ProviderMcpBridge(_Config))
            using (CompletionClientBase client = new OpenAiClient(_Config.Endpoint, apiKey, logging))
            {
                client.Model = _Config.Model;
                client.MaxTokens = _Config.MaxTokens;
                client.TimeoutMs = _Config.TimeoutMs;
                client.MaxCallDetails = 0;
                await tools.ConnectAsync(token).ConfigureAwait(false);
                ProviderSession session = await LoadSessionAsync(token).ConfigureAwait(false);
                if (session.Messages.Count == 0 && !String.IsNullOrEmpty(_Config.SystemPrompt)) session.Messages.Add(ChatMessage.System(_Config.SystemPrompt));
                session.Messages.Add(ChatMessage.User(prompt));
                ToolChatRequest chat = new ToolChatRequest { Messages = session.Messages, Tools = tools.Definitions };
                Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.Lifecycle, SessionId = _Config.SessionId, Model = _Config.Model });
                foreach (string warning in tools.Warnings) Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.Warning, Text = warning });
                for (int turn = 0; turn < _Config.MaxTurns; turn++)
                {
                    token.ThrowIfCancellationRequested();
                    if (System.Text.Encoding.UTF8.GetByteCount(Serializer.Serialize(session)) > _Config.MaxSessionBytes) return Fail("ProviderHistoryLimit", "Provider conversation history exceeds the configured limit.");
                    ToolChatStreamingResponse response = await RequestAsync(client, chat, token).ConfigureAwait(false);
                    if (!response.Success)
                    {
                        bool credential = response.StatusCode == 401 || response.StatusCode == 403;
                        return Fail(credential ? "NotCredentialed" : "ProviderRequestFailed", credential ? "Provider authentication was rejected." : "Provider request failed after bounded retries.");
                    }
                    // Never retry an interrupted stream: content or tools may already have been delivered.
                    await foreach (ToolChatStreamingChunk chunk in response.Chunks.WithCancellation(token).ConfigureAwait(false))
                    {
                        if (!String.IsNullOrEmpty(chunk.Text)) Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.AssistantText, Text = chunk.Text, Model = chunk.Model });
                        if (!String.IsNullOrEmpty(chunk.ReasoningText)) Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.Thinking, Text = chunk.ReasoningText, Model = chunk.Model });
                    }
                    ChatStreamingUsage? usage = response.Usage;
                    if (usage != null) Emit(new ProviderApiEvent
                    {
                        EventType = RunEventTypeEnum.Usage, Model = response.Model,
                        InputTokens = usage.PromptTokens, OutputTokens = usage.CompletionTokens,
                        CachedTokens = usage.CachedPromptTokens, ReasoningTokens = usage.ReasoningTokens
                    });
                    if (!response.Success || (response.FinishReason != "stop" && response.FinishReason != "tool_calls")) return Fail("ProviderIncomplete", "Provider generation ended without a complete answer.");
                    chat.Messages.Add(response.ToAssistantMessage());
                    if (response.ToolCalls.Count == 0)
                    {
                        string text = response.Text ?? String.Empty;
                        if (String.IsNullOrWhiteSpace(text)) return Fail("ProviderEmptyResult", "Provider returned no final answer.");
                        await SaveSessionAsync(session, token).ConfigureAwait(false);
                        Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.Result, Text = text, Success = true, Model = response.Model });
                        return 0;
                    }
                    foreach (ToolCall call in response.ToolCalls)
                    {
                        string toolName = tools.DisplayName(call.Name);
                        Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.ToolCall, ToolName = toolName, ToolCallId = call.Id, Text = call.ArgumentsJson });
                        ProviderToolResult result = await tools.InvokeAsync(call, token).ConfigureAwait(false);
                        string text = ProviderMcpBridge.Text(result);
                        Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.ToolResult, ToolName = toolName, ToolCallId = call.Id, Text = text, Success = !result.IsError });
                        chat.Messages.Add(ChatMessage.ToolResult(call.Id, call.Name, text));
                    }
                }
                return Fail("ProviderTurnLimit", "Provider execution reached its configured turn limit without a final answer.");
            }
        }

        private async Task<ToolChatStreamingResponse> RequestAsync(CompletionClientBase client, ToolChatRequest chat, CancellationToken token)
        {
            for (int attempt = 0; ; attempt++)
            {
                ToolChatStreamingResponse response = await client.ToolChatStreamingAsync(chat, token).ConfigureAwait(false);
                int status = response.StatusCode ?? 0;
                if (response.Success || attempt >= _Config.MaxRetries || !(status == 429 || status >= 500)) return response;
                Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.Warning, Text = "Provider request is being retried after a transient response." });
                await Task.Delay(Math.Min(10000, 500 * (1 << attempt)), token).ConfigureAwait(false);
            }
        }
        private async Task<ProviderSession> LoadSessionAsync(CancellationToken token)
        {
            ProviderSession session = new ProviderSession { Provider = _Config.Provider, Endpoint = _Config.Endpoint, Model = _Config.Model };
            if (!_Config.Resume) return session;
            string path = SessionPath();
            if (!File.Exists(path) || new FileInfo(path).Length > _Config.MaxSessionBytes) throw new InvalidOperationException("Provider session is missing or exceeds its configured size limit.");
            session = Serializer.Deserialize<ProviderSession>(await File.ReadAllTextAsync(path, token).ConfigureAwait(false)) ?? throw new InvalidOperationException("Provider session is invalid.");
            if (session.Provider != _Config.Provider || session.Endpoint != _Config.Endpoint || session.Model != _Config.Model || session.Messages.Any(m => m == null)) throw new InvalidOperationException("Provider session configuration does not match this run.");
            return session;
        }
        private async Task SaveSessionAsync(ProviderSession session, CancellationToken token)
        {
            if (_Config.SessionId == null) return;
            string json = Serializer.Serialize(session);
            if (System.Text.Encoding.UTF8.GetByteCount(json) > _Config.MaxSessionBytes) throw new InvalidOperationException("Provider session exceeds its configured size limit.");
            string path = SessionPath();
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                await File.WriteAllTextAsync(temporary, json, token).ConfigureAwait(false);
                if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(temporary, UnixFileMode.UserRead | UnixFileMode.UserWrite);
                File.Move(temporary, path, true);
            }
            finally { if (File.Exists(temporary)) File.Delete(temporary); }
        }
        private string SessionPath()
        {
            string home = _SessionHome ?? Environment.GetEnvironmentVariable("HOME") ?? Environment.GetEnvironmentVariable("USERPROFILE") ?? throw new InvalidOperationException("Provider execution requires an isolated HOME.");
            return Path.Combine(home, ".garrison-provider-api", "sessions", _Config.SessionId + ".json");
        }
        private void Emit(ProviderApiEvent item) { _Output.WriteLine(Serializer.Serialize(item)); _Output.Flush(); }
        private int Fail(string code, string text) { Emit(new ProviderApiEvent { EventType = RunEventTypeEnum.Error, Code = code, Text = text }); return 1; }
    }
}
