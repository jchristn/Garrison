namespace Garrison.Core.Templates
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using Garrison.Core.Compilation;

    /// <summary>
    /// Sample render context for template previews, with optional caller-supplied overrides. Thread-safe.
    /// </summary>
    public static class TemplateSampleContext
    {
        #region Public-Methods

        /// <summary>
        /// Build a sample context covering every documented root.
        /// </summary>
        /// <param name="overrides">Optional JSON object merged over the sample (schemaless user data).</param>
        /// <returns>Context.</returns>
        public static TemplateContext Build(JsonElement? overrides = null)
        {
            TemplateContext context = new TemplateContext();
            context.Set("tenant.id", "ten_sample");
            context.Set("tenant.name", "Sample Tenant");
            context.Set("agent.name", "sample-agent");
            context.Set("agent.displayName", "Sample Agent");
            context.Set("agent.description", "Answers questions about the sample project.");
            context.Set("agent.outputSchema", null);
            context.Set("agent.skills", new List<object?>());
            context.Set("agent.delegation.mode", "None");
            context.Set("agent.delegation.maxDepth", 2);
            context.Set("agent.delegation.allowList", new List<object?>());
            context.Set("assets.listed", new List<object?>());
            context.Set("assets.count", 0);
            context.Set("tool.name", "garrison_invoke_agent");
            context.Set("tool.defaultDescription", "Ask another Garrison agent to do work and wait for its answer.");
            context.Set("deployment.name", "sample-agent-default");
            context.Set("deployment.model", "sample-model");
            context.Set("deployment.maxTurns", 20);
            context.Set("deployment.parameters", TemplateContext.NewMap());
            context.Set("run.id", "run_sample");
            context.Set("run.depth", 0);
            context.Set("run.attempt", 1);
            context.Set("run.configDir", ExecutionPlaceholders.ConfigDir);
            context.Set("run.workspaceDir", ExecutionPlaceholders.WorkspaceDir);
            context.Set("run.homeDir", ExecutionPlaceholders.HomeDir);
            context.Set("run.callChain", new List<object?> { "sample-agent" });
            context.Set("run.resumeSessionId", null);
            context.Set("run.conversationId", "cnv_sample");
            context.Set("run.persistSession", true);
            context.Set("conversation.id", "cnv_sample");
            context.Set("conversation.turn", 3);
            context.Set("conversation.resumed", false);
            context.Set("conversation.fallback", true);
            context.Set("conversation.fallbackReason", "AffinityNodeLost");
            Dictionary<string, object?> firstTurn = TemplateContext.NewMap();
            firstTurn["turn"] = 1;
            firstTurn["input"] = "Summarize the README in three bullet points.";
            firstTurn["output"] = "- Garrison runs agent harnesses.\n- Workers pull runs.\n- Everything is configurable.";
            Dictionary<string, object?> secondTurn = TemplateContext.NewMap();
            secondTurn["turn"] = 2;
            secondTurn["input"] = "Make the second bullet more specific.";
            secondTurn["output"] = "- Worker nodes lease runs from the control plane over HTTPS.";
            context.Set("conversation.turns", new List<object?> { firstTurn, secondTurn });
            context.Set("conversation.omittedTurns", 0);
            context.Set("conversation.task", "Now add a fourth bullet about security.");
            context.Set("trigger.id", "trg_sample");
            context.Set("trigger.name", "nightly-report");
            context.Set("trigger.description", "Summarize yesterday's failed runs.");
            context.Set("trigger.type", "Cron");
            context.Set("trigger.source", "Cron");
            context.Set("trigger.isCron", true);
            context.Set("trigger.isWebhook", false);
            context.Set("trigger.isManual", false);
            context.Set("trigger.fireId", "tfr_sample");
            context.Set("trigger.scheduledUtc", "2026-01-01T09:00:00.0000000Z");
            context.Set("trigger.firedUtc", "2026-01-01T09:00:01.0000000Z");
            context.Set("trigger.cron", "0 9 * * *");
            context.Set("trigger.timeZone", "UTC");
            context.Set("webhook.body", "{\"action\":\"opened\",\"number\":42}");
            Dictionary<string, object?> webhookJson = TemplateContext.NewMap();
            webhookJson["action"] = "opened";
            webhookJson["number"] = 42L;
            context.Set("webhook.json", webhookJson);
            context.Set("webhook.contentType", "application/json");
            context.Set("webhook.deliveryId", "delivery-sample");
            context.Set("pipeline.id", "ppl_sample");
            context.Set("pipeline.name", "sample-pipeline");
            context.Set("pipeline.runId", "plr_sample");
            context.Set("pipeline.position", 2);
            context.Set("pipeline.stageName", "review");
            context.Set("pipeline.stageCount", 3);
            context.Set("pipeline.task", "Summarize the README in three bullet points.");
            context.Set("pipeline.hasPrevious", true);
            Dictionary<string, object?> previousStage = TemplateContext.NewMap();
            previousStage["position"] = 1;
            previousStage["stageName"] = "draft";
            previousStage["agentName"] = "sample-writer";
            previousStage["status"] = "Succeeded";
            previousStage["outcome"] = "Succeeded";
            previousStage["output"] = "- Garrison runs agent harnesses.\n- Workers pull runs.\n- Everything is configurable.";
            previousStage["outputTruncated"] = false;
            previousStage["structured"] = null;
            previousStage["hasArtifacts"] = false;
            previousStage["artifacts"] = new List<object?>();
            context.Set("pipeline.previous", previousStage);
            context.Set("pipeline.stages", new List<object?> { previousStage });
            context.Set("pipeline.hasReviewNotes", true);
            context.Set("pipeline.reviewNotes", "Keep it under 50 words.");
            context.Set("pipeline.isRevision", false);
            context.Set("pipeline.revision", null);
            context.Set("input.message", "Summarize the README in three bullet points.");
            context.Set("input.contentType", "text/plain");
            context.Set("input.parameters", TemplateContext.NewMap());
            context.Set("input.parameterList", new List<object?>());
            context.Set("caller.type", "User");
            context.Set("caller.name", "admin@garrison");
            context.Set("resources.mcpServers", new List<object?>());
            context.Set("resources.httpMcpServers", new List<object?>());
            context.Set("resources.stdioMcpServers", new List<object?>());
            context.Set("resources.hasMcpServers", false);
            context.Set("garrison.mcpServerName", Constants.McpServerName);
            context.Set("garrison.version", Constants.ProductVersion);
            context.Set("garrison.delegationEnabled", false);
            context.Set("harness.type", "ClaudeCode");
            context.Set("harness.nativeSchema", true);
            context.Set("executor.type", "Process");
            context.Set("executor.containerized", false);
            context.Set("prompts.system", "Sample system prompt.");
            context.Set("prompts.task", "Sample task prompt.");
            context.Set("repair.error", "(root): Required properties [\"answer\"] are not present (required)");
            context.Set("repair.schema", "{\"type\":\"object\",\"properties\":{\"answer\":{\"type\":\"string\"}},\"required\":[\"answer\"]}");
            context.Set("repair.attempt", 1);
            context.Set("repair.sessionId", "sample-session");
            context.Set("repair.previousOutput", "{\"reply\":\"Three bullet points.\"}");
            context.Set("now", DateTime.UtcNow);
            if (overrides.HasValue && overrides.Value.ValueKind == JsonValueKind.Object) Merge(context.Root, overrides.Value);
            return context;
        }

        /// <summary>
        /// Convert a JSON element into a context value tree.
        /// </summary>
        /// <param name="element">Element.</param>
        /// <returns>Value.</returns>
        public static object? FromJson(JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    Dictionary<string, object?> map = TemplateContext.NewMap();
                    foreach (JsonProperty property in element.EnumerateObject()) map[property.Name] = FromJson(property.Value);
                    return map;
                case JsonValueKind.Array:
                    List<object?> list = new List<object?>();
                    foreach (JsonElement item in element.EnumerateArray()) list.Add(FromJson(item));
                    return list;
                case JsonValueKind.String:
                    return element.GetString();
                case JsonValueKind.Number:
                    if (element.TryGetInt64(out long l)) return l;
                    return element.GetDouble();
                case JsonValueKind.True:
                    return true;
                case JsonValueKind.False:
                    return false;
                default:
                    return null;
            }
        }

        #endregion

        #region Private-Methods

        private static void Merge(Dictionary<string, object?> target, JsonElement source)
        {
            foreach (JsonProperty property in source.EnumerateObject())
            {
                if (property.Value.ValueKind == JsonValueKind.Object && target.TryGetValue(property.Name, out object? existing) && existing is Dictionary<string, object?> child)
                {
                    Merge(child, property.Value);
                }
                else
                {
                    target[property.Name] = FromJson(property.Value);
                }
            }
        }

        #endregion
    }
}
