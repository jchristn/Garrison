namespace Garrison.Sdk.Console
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Clients;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;
    using ConsoleIo = System.Console;

    /// <summary>Interactive SDK console; credentials are prompted without echo and are never printed.</summary>
    public static class Program
    {
        /// <summary>Run the console.</summary>
        /// <param name="args">Optional base URL.</param>
        /// <returns>Exit status.</returns>
        public static async Task<int> Main(string[] args)
        {
            using GarrisonClient client = new GarrisonClient(args.Length > 0 ? args[0] : null);
            CancellationTokenSource? active = null;
            ConsoleIo.CancelKeyPress += (_, e) => { if (active != null) { e.Cancel = true; active.Cancel(); } };
            ConsoleIo.WriteLine("Garrison SDK console. Type help; Ctrl+C cancels the active request or stream.");
            while (true)
            {
                if (!ConsoleIo.IsInputRedirected) ConsoleIo.Write("garrison> ");
                string? line = ConsoleIo.ReadLine();
                if (line == null) break;
                string[] parts = line.Split(' ', 3, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 0) continue;
                string command = parts[0].ToLowerInvariant();
                if (command == "exit" || command == "quit") break;
                using CancellationTokenSource request = new CancellationTokenSource();
                active = request;
                try
                {
                    switch (command)
                    {
                        case "help": ConsoleIo.WriteLine("health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | operations <id> | watch <id> | pipelines | pipeline-runs | pipeline-reviews | start-pipeline <pipeline> <input> | triggers | fire-trigger <trigger> | notification-endpoints | apply <file> | apps | studio-draft <app> | architect-prompts | architect [prompt] | chat <slug> <message> | quit"); break;
                        case "health": Print(await client.HealthAsync(request.Token).ConfigureAwait(false)); break;
                        case "login":
                            Require(parts, 3);
                            await client.LoginAsync(parts[2], Secret("Password: "), parts[1], request.Token).ConfigureAwait(false);
                            ConsoleIo.WriteLine("Signed in. Tenant: " + client.TenantId); break;
                        case "keys":
                            await client.LoginWithKeysAsync(Secret("Access key: "), Secret("Secret key: "), request.Token).ConfigureAwait(false);
                            ConsoleIo.WriteLine("Signed in. Tenant: " + client.TenantId); break;
                        case "tenant": Require(parts, 2); client.TenantId = parts[1]; break;
                        case "agents": Print(await client.Agents.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "runs": Print(await client.Runs.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "invoke": Require(parts, 3); Print(await client.Agents.InvokeAsync(parts[1], new InvokeRequest { Input = parts[2], Wait = false }, request.Token).ConfigureAwait(false)); break;
                        case "triggers": Print(await client.Triggers.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "fire-trigger": Require(parts, 2); Print(await client.Triggers.FireAsync(parts[1], null, request.Token).ConfigureAwait(false)); break;
                        case "notification-endpoints": Print(await client.NotificationEndpoints.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "pipelines": Print(await client.Pipelines.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "pipeline-runs": Print(await client.PipelineRuns.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "pipeline-reviews": Print(await client.PipelineReviews.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "start-pipeline": Require(parts, 3); Print(await client.Pipelines.StartAsync(parts[1], new PipelineStartRequest { Input = parts[2] }, null, request.Token).ConfigureAwait(false)); break;
                        case "run": Require(parts, 2); Print(await client.Runs.GetAsync(parts[1], request.Token).ConfigureAwait(false)); break;
                        case "operations": Require(parts, 2); Print(await client.Runs.GetOperationsAsync(parts[1], request.Token).ConfigureAwait(false)); break;
                        case "events": Require(parts, 2); Print(await client.Runs.GetEventsAsync(parts[1], token: request.Token).ConfigureAwait(false)); break;
                        case "apply":
                            Require(parts, 2);
                            Print(Summary(await client.Manifests.ApplyAsync(await File.ReadAllTextAsync(parts[1], request.Token).ConfigureAwait(false), false, false, request.Token).ConfigureAwait(false)));
                            break;
                        case "apps": Print(await client.Apps.ListAsync(token: request.Token).ConfigureAwait(false)); break;
                        case "studio-draft":
                            Require(parts, 2);
                            StudioDraftCreateRequest draft = new StudioDraftCreateRequest();
                            draft.Title = "Console draft of " + parts[1];
                            draft.FromApp = parts[1];
                            Print(await client.StudioDrafts.CreateAsync(draft, request.Token).ConfigureAwait(false));
                            break;
                        case "architect-prompts":
                            foreach (ArchitectPromptEntry entry in await client.StudioDrafts.ListArchitectPromptsAsync(request.Token).ConfigureAwait(false)) Print(entry);
                            break;
                        case "architect": Print(await SelectArchitectPromptAsync(client, parts.Length > 1 ? parts[1] : null, request.Token).ConfigureAwait(false)); break;
                        case "chat":
                            Require(parts, 3);
                            Print(await ChatAsync(client, parts[1], parts[2], request.Token).ConfigureAwait(false));
                            break;
                        case "watch":
                            Require(parts, 2);
                            await foreach (RunStreamEvent frame in client.Runs.StreamAsync(parts[1], token: request.Token).ConfigureAwait(false)) Print(frame);
                            break;
                        default: ConsoleIo.WriteLine("Unknown command. Type help."); break;
                    }
                }
                catch (OperationCanceledException) { ConsoleIo.WriteLine("Cancelled."); }
                catch (Exception e) { ConsoleIo.WriteLine("Error: " + e.Message); }
                finally { active = null; }
            }
            return 0;
        }

        private static readonly string _ArchitectAgent = "agent-architect";
        private static readonly string _ArchitectDeployment = "agent-architect-sdk";
        private static readonly string _FakeHarnessProfile = "hrn_builtin_fake";

        private static object Summary(ManifestApply applied)
        {
            return new { applied.Id, applied.DocumentCount, applied.CreatedCount, applied.UpdatedCount, applied.UnchangedCount, applied.FailedCount };
        }

        private static async Task<ArchitectPromptSelection> SelectArchitectPromptAsync(GarrisonClient client, string? prompt, CancellationToken token)
        {
            List<ArchitectPromptEntry> prompts = await client.StudioDrafts.ListArchitectPromptsAsync(token).ConfigureAwait(false);
            if (prompts.Count < 1) throw new InvalidOperationException("The server lists no architect prompts.");
            string? deploymentId = prompts.SelectMany(p => p.Deployments).FirstOrDefault();
            if (deploymentId == null)
            {
                Agent architect = await client.Agents.GetAsync(_ArchitectAgent, token).ConfigureAwait(false);
                Deployment deployment = new Deployment();
                deployment.Name = _ArchitectDeployment;
                deployment.AgentId = architect.Id;
                deployment.HarnessProfileId = _FakeHarnessProfile;
                deploymentId = (await client.Deployments.CreateAsync(deployment, token).ConfigureAwait(false)).Id;
            }
            return await client.StudioDrafts.SetArchitectPromptAsync(deploymentId, prompt ?? prompts[0].Id, null, token).ConfigureAwait(false);
        }

        private static async Task<AppTurnView> ChatAsync(GarrisonClient client, string slug, string message, CancellationToken token)
        {
            using (AppGatewayClient gateway = client.AppGateway(slug))
            {
                await gateway.StartSessionAsync(null, token).ConfigureAwait(false);
                AppConversationStart started = await gateway.StartConversationAsync(message, token).ConfigureAwait(false);
                await foreach (AppTurnStreamEvent frame in gateway.StreamTurnAsync(started.ConversationId, started.Turn.RunId, 0, token).ConfigureAwait(false))
                {
                    if (frame.Name == "turn.completed") break;
                }
                AppTurnView turn = await gateway.WaitForTurnAsync(started.ConversationId, started.Turn.RunId, TimeSpan.FromSeconds(120), token).ConfigureAwait(false);
                await gateway.EndSessionAsync(token).ConfigureAwait(false);
                return turn;
            }
        }

        private static void Require(string[] parts, int count)
        {
            if (parts.Length < count) throw new ArgumentException("Missing arguments. Type help.");
        }

        private static void Print(object value)
        {
            ConsoleIo.WriteLine(JsonSerializer.Serialize(value, GarrisonTransport.JsonOptions));
        }

        private static string Secret(string prompt)
        {
            if (ConsoleIo.IsInputRedirected) return ConsoleIo.ReadLine() ?? throw new InvalidOperationException("Credential input ended.");
            ConsoleIo.Write(prompt);
            StringBuilder value = new StringBuilder();
            while (true)
            {
                ConsoleKeyInfo key = ConsoleIo.ReadKey(true);
                if (key.Key == ConsoleKey.Enter) { ConsoleIo.WriteLine(); return value.ToString(); }
                if (key.Key == ConsoleKey.Backspace && value.Length > 0) value.Length--;
                else if (!Char.IsControl(key.KeyChar)) value.Append(key.KeyChar);
            }
        }
    }
}
