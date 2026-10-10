namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Voltaic.A2A;

    /// <summary>
    /// Maps between Garrison runs and A2A tasks, messages, and cards. A task identifier is the run identifier; the
    /// context identifier is the root run identifier until conversations arrive in Phase 12. Thread-safe.
    /// </summary>
    public static class A2AMapper
    {
        /// <summary>
        /// Extract the input text from an A2A message: text parts joined by blank lines, data parts as JSON.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <returns>Input text.</returns>
        public static string InputText(Message? message)
        {
            if (message == null) return String.Empty;
            StringBuilder sb = new StringBuilder();
            foreach (Part part in message.Parts)
            {
                string? text = part.Text;
                if (text == null && part.Data != null) text = JsonSerializer.Serialize(part.Data, A2AJson.DefaultOptions);
                if (text == null && part.Url != null) text = part.Url;
                if (String.IsNullOrEmpty(text)) continue;
                if (sb.Length > 0) sb.Append("\n\n");
                sb.Append(text);
            }
            return sb.ToString();
        }

        /// <summary>
        /// Map a run status to an A2A task state.
        /// </summary>
        /// <param name="status">Run status.</param>
        /// <returns>Task state.</returns>
        public static TaskState State(RunStatusEnum status)
        {
            switch (status)
            {
                case RunStatusEnum.Pending:
                case RunStatusEnum.Queued:
                    return TaskState.Submitted;
                case RunStatusEnum.Leased:
                case RunStatusEnum.Running:
                case RunStatusEnum.Cancelling:
                    return TaskState.Working;
                case RunStatusEnum.Succeeded:
                    return TaskState.Completed;
                case RunStatusEnum.Cancelled:
                    return TaskState.Canceled;
                case RunStatusEnum.Rejected:
                    return TaskState.Rejected;
                default:
                    return TaskState.Failed;
            }
        }

        /// <summary>
        /// Map a run to an A2A task.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="includeArtifacts">Whether to include the result artifact.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static AgentTask Task(Run run, bool includeArtifacts = true)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            AgentTask task = new AgentTask();
            task.Id = run.Id;
            task.ContextId = String.IsNullOrEmpty(run.RootRunId) ? run.Id : run.RootRunId;
            task.Status = Status(run);
            if (includeArtifacts && run.Status == RunStatusEnum.Succeeded) task.Artifacts = new List<Artifact> { ResultArtifact(run) };
            task.Metadata = new Dictionary<string, object?>
            {
                { "garrison.agent", run.AgentName },
                { "garrison.outcome", run.Outcome.ToString() },
                { "garrison.inputTokens", run.InputTokens },
                { "garrison.outputTokens", run.OutputTokens },
                { "garrison.cachedTokens", run.CachedTokens },
                { "garrison.reasoningTokens", run.ReasoningTokens },
                { "garrison.toolCallCount", run.ToolCallCount }
            };
            if (run.TimeToFirstTokenMs.HasValue) task.Metadata["garrison.timeToFirstTokenMs"] = run.TimeToFirstTokenMs.Value;
            if (run.StreamingMs.HasValue) task.Metadata["garrison.streamingMs"] = run.StreamingMs.Value;
            if (run.ExecutionMs.HasValue) task.Metadata["garrison.executionMs"] = run.ExecutionMs.Value;
            if (run.QueueMs.HasValue) task.Metadata["garrison.queueMs"] = run.QueueMs.Value;
            if (run.TotalMs.HasValue) task.Metadata["garrison.totalMs"] = run.TotalMs.Value;
            double? rate = run.OutputTokensPerSecond;
            if (rate.HasValue) task.Metadata["garrison.outputTokensPerSecond"] = rate.Value;
            return task;
        }

        /// <summary>
        /// Task status for a run, including an agent message carrying the error when it failed.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <returns>Status.</returns>
        public static TaskStatus Status(Run run)
        {
            TaskStatus status = new TaskStatus();
            status.State = State(run.Status);
            status.Timestamp = new DateTimeOffset(run.CompletedUtc ?? run.StartedUtc ?? run.CreatedUtc, TimeSpan.Zero);
            if (status.State == TaskState.Failed || status.State == TaskState.Rejected)
            {
                Message message = new Message();
                message.Role = Voltaic.A2A.Role.Agent;
                message.MessageId = run.Id + "-status";
                message.TaskId = run.Id;
                message.Parts.Add(Part.FromText(run.Outcome + ": " + (run.ErrorMessage ?? "The run failed.")));
                status.Message = message;
            }
            return status;
        }

        /// <summary>
        /// Result artifact: the result text, plus a data part with structured output when present.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <returns>Artifact.</returns>
        public static Artifact ResultArtifact(Run run)
        {
            Artifact artifact = new Artifact();
            artifact.ArtifactId = run.Id + "-result";
            artifact.Name = "result";
            artifact.Parts.Add(Part.FromText(run.ResultText ?? String.Empty));
            if (!String.IsNullOrEmpty(run.StructuredOutputJson))
            {
                try
                {
                    using (JsonDocument document = JsonDocument.Parse(run.StructuredOutputJson))
                    {
                        Part data = new Part();
                        data.Data = document.RootElement.Clone();
                        data.MediaType = "application/json";
                        artifact.Parts.Add(data);
                    }
                }
                catch (JsonException)
                {
                }
            }
            return artifact;
        }

        /// <summary>
        /// Build an agent card.
        /// </summary>
        /// <param name="agent">Agent.</param>
        /// <param name="url">JSON-RPC endpoint URL for the agent.</param>
        /// <param name="skillDescription">Rendered skill description fallback.</param>
        /// <returns>Card.</returns>
        public static AgentCard Card(Agent agent, string url, string skillDescription)
        {
            AgentCard card = new AgentCard();
            card.Name = agent.DisplayName ?? agent.Name;
            card.Description = agent.Description ?? skillDescription;
            card.Version = agent.AgentVersion ?? Garrison.Core.Constants.ProductVersion;
            card.SupportedInterfaces.Add(new AgentInterface { Url = url, ProtocolBinding = "JSONRPC" });
            card.Capabilities.Streaming = true;
            card.Capabilities.PushNotifications = false;
            card.Capabilities.StateTransitionHistory = false;
            card.Provider = new AgentProvider { Organization = "Garrison", Url = Garrison.Core.Constants.RepositoryUrl };
            card.DefaultInputModes = new List<string> { agent.InputMode == AgentInputModeEnum.Structured ? "application/json" : "text/plain" };
            card.DefaultOutputModes = new List<string> { "text/plain", "application/json" };
            if (agent.Skills.Count > 0)
            {
                card.Skills = agent.Skills.Select(s => new AgentSkill { Id = s.SkillId, Name = s.Name, Description = s.Description ?? skillDescription, Tags = agent.Tags.ToList() }).ToList();
            }
            else
            {
                card.Skills.Add(new AgentSkill { Id = agent.Name, Name = agent.DisplayName ?? agent.Name, Description = skillDescription, Tags = agent.Tags.ToList() });
            }
            HttpAuthSecurityScheme bearer = new HttpAuthSecurityScheme();
            bearer.Scheme = "bearer";
            bearer.Description = "Garrison session token from POST /v1.0/token, or a run token issued to a Garrison agent.";
            card.SecuritySchemes = new Dictionary<string, SecurityScheme> { { "garrison", new SecurityScheme { HttpAuthSecurityScheme = bearer } } };
            card.SecurityRequirements = new List<SecurityRequirement> { new SecurityRequirement { Schemes = new Dictionary<string, List<string>> { { "garrison", new List<string>() } } } };
            return card;
        }
    }
}
