namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;

    /// <summary>Short-lived cross-replica diagnostic dispatch. The queue stores references only; credentials are compiled on claim. Thread-safe.</summary>
    public class WorkerMcpTestService
    {
        private readonly ServerContext _Context;
        private int _DispatchTimeoutMs = 30000;
        private int _HeartbeatFreshnessSeconds = 60;
        /// <summary>Worker dispatch wait. Default 30000 ms; range 1000 to 120000.</summary>
        public int DispatchTimeoutMs { get { return _DispatchTimeoutMs; } set { _DispatchTimeoutMs = Math.Clamp(value, 1000, 120000); } }
        /// <summary>Maximum age of a selected worker heartbeat. Default 60 seconds; range 5 to 300.</summary>
        public int HeartbeatFreshnessSeconds { get { return _HeartbeatFreshnessSeconds; } set { _HeartbeatFreshnessSeconds = Math.Clamp(value, 5, 300); } }

        /// <summary>Construct worker test dispatch.</summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public WorkerMcpTestService(ServerContext context) { _Context = context ?? throw new ArgumentNullException(nameof(context)); }

        /// <summary>Queue and wait for a stdio diagnostic on an explicitly selected eligible worker.</summary>
        /// <param name="server">Tenant-scoped MCP configuration.</param>
        /// <param name="nodeId">Worker identifier.</param>
        /// <param name="timeoutMs">Protocol timeout.</param>
        /// <param name="token">Calling request cancellation.</param>
        /// <returns>Worker test outcome.</returns>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        /// <exception cref="ValidationException">Thrown when the tenant requires Untrusted deployments (field code <c>StdioDiagnosticsRequireTrust</c>), no worker is selected, or the worker cannot run diagnostics.</exception>
        /// <exception cref="NotFoundException">Thrown when the worker does not exist.</exception>
        /// <exception cref="ConflictException">Thrown when the worker already has a diagnostic pending.</exception>
        public async Task<McpServerTestResponse> TestAsync(McpServer server, string? nodeId, int timeoutMs, CancellationToken token)
        {
            if (server == null) throw new ArgumentNullException(nameof(server));
            Tenant? tenant = await _Context.Database.Tenants.ReadAsync(server.TenantId, token).ConfigureAwait(false);
            if (tenant != null && tenant.RequireUntrustedDeployments)
            {
                // The diagnostic runs the configured command as a child of the worker process itself, outside any run
                // pod, so it would bypass the isolation this tenant requires for everything it runs.
                Dictionary<string, string> errors = new Dictionary<string, string>();
                errors["transport"] = "Stdio MCP diagnostics run on the worker host, outside run isolation, so tenants that require Untrusted deployments cannot run them.";
                Dictionary<string, string> codes = new Dictionary<string, string>();
                codes["transport"] = "StdioDiagnosticsRequireTrust";
                throw new ValidationException("Stdio MCP diagnostics are not available in this tenant.", errors, codes);
            }
            if (String.IsNullOrEmpty(nodeId)) throw new ValidationException("Select a worker node for a stdio MCP test.");
            Node node = await _Context.Database.Nodes.ReadAsync(nodeId, token).ConfigureAwait(false) ?? throw new NotFoundException("Worker node not found.");
            if (!node.Active || !node.SupportsMcpTests || !node.LastHeartbeatUtc.HasValue || node.Status != NodeStatusEnum.Ready || node.LastHeartbeatUtc < DateTime.UtcNow.AddSeconds(-HeartbeatFreshnessSeconds) || !node.RegisteredUtc.HasValue)
                throw new ValidationException("Select a Ready worker with current heartbeat and stdio diagnostic support.");
            await _Context.Database.McpTests.RemoveExpiredAsync(token).ConfigureAwait(false);
            McpTestQueueEntry entry = new McpTestQueueEntry
            {
                TenantId = server.TenantId, ServerId = server.Id, ServerUpdatedUtc = server.LastUpdateUtc,
                NodeId = node.Id, NodeRegisteredUtc = node.RegisteredUtc.Value, TimeoutMs = Math.Clamp(timeoutMs, 1000, 120000),
                ExpiresUtc = DateTime.UtcNow.AddMilliseconds(DispatchTimeoutMs + Math.Clamp(timeoutMs, 1000, 120000) + 10000)
            };
            try { await _Context.Database.McpTests.CreateAsync(entry, token).ConfigureAwait(false); }
            catch (Exception ex) when (DatabaseFailures.IsUniqueViolation(ex)) { throw new ConflictException("McpDiagnosticBusy", "This worker already has an MCP diagnostic pending."); }
            DateTime dispatchDeadline = DateTime.UtcNow.AddMilliseconds(DispatchTimeoutMs);
            try
            {
                while (DateTime.UtcNow < entry.ExpiresUtc)
                {
                    token.ThrowIfCancellationRequested();
                    McpTestQueueEntry? current = await _Context.Database.McpTests.ReadAsync(entry.TenantId, entry.Id, token).ConfigureAwait(false);
                    if (current == null) break;
                    if (current.Finished) { current.Result.NodeId = node.Id; return current.Result; }
                    if (!current.Started && DateTime.UtcNow >= dispatchDeadline) break;
                    await Task.Delay(200, token).ConfigureAwait(false);
                }
                return new McpServerTestResponse { NodeId = node.Id, Error = "Worker MCP diagnostic timed out or the worker became unavailable." };
            }
            finally
            {
                using (CancellationTokenSource cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(5)))
                {
                    try { await _Context.Database.McpTests.DeleteAsync(entry.TenantId, entry.Id, cleanup.Token).ConfigureAwait(false); }
                    catch (Exception ex) when (ex is System.Data.Common.DbException || ex is OperationCanceledException) { }
                }
            }
        }

        /// <summary>Accept idempotent completions and claim at most one test for a worker heartbeat.</summary>
        /// <param name="node">Authenticated current worker registration.</param>
        /// <param name="request">Heartbeat with safe outcomes and free capacity.</param>
        /// <param name="response">Heartbeat response to enrich.</param>
        /// <param name="token">Request cancellation.</param>
        /// <returns>Task.</returns>
        public async Task HeartbeatAsync(Node node, NodeHeartbeatRequest request, NodeHeartbeatResponse response, CancellationToken token)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (response == null) throw new ArgumentNullException(nameof(response));
            if (!node.RegisteredUtc.HasValue || !node.SupportsMcpTests) return;
            if (request.McpTestResults.Count > 1) throw new ValidationException("A worker may report at most one MCP diagnostic per heartbeat.");
            foreach (McpWorkerTestResult result in request.McpTestResults)
            {
                if (result.Result.Tools.Count > 1000 || result.Result.MissingRequiredTools.Count > 1000 || result.Result.Error?.Length > 2048 || result.Result.DurationMs < 0
                    || result.Result.Tools.Concat(result.Result.MissingRequiredTools).Any(name => String.IsNullOrEmpty(name) || name.Length > 512)) throw new ValidationException("MCP diagnostic outcome exceeds its limits.");
                await _Context.Database.McpTests.CompleteAsync(node.Id, node.RegisteredUtc.Value, result.Id, result.Result, token).ConfigureAwait(false);
            }
            if (node.Status != NodeStatusEnum.Ready || request.Draining || request.FreeCapacity < 1) return;
            McpTestQueueEntry? entry = await _Context.Database.McpTests.ClaimAsync(node.Id, node.RegisteredUtc.Value, token).ConfigureAwait(false);
            if (entry == null) return;
            McpServer? server = await _Context.Database.McpServers.ReadAsync(entry.TenantId, entry.ServerId, token).ConfigureAwait(false);
            if (server == null || server.Transport != McpTransportEnum.Stdio || server.LastUpdateUtc != entry.ServerUpdatedUtc)
            {
                await _Context.Database.McpTests.CompleteAsync(node.Id, node.RegisteredUtc.Value, entry.Id, new McpServerTestResponse { Error = "MCP configuration changed or became unavailable before the test." }, token).ConfigureAwait(false);
                return;
            }
            try
            {
                TemplateContext context = new TemplateContext();
                Dictionary<string, object?> secrets = TemplateContext.NewMap();
                EnumerationResult<Secret> page = await _Context.Database.Secrets.EnumerateAsync(entry.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
                foreach (Secret secret in page.Objects)
                    if (secret.Active && !String.IsNullOrEmpty(secret.ValueEncrypted)) secrets[secret.Name] = _Context.Cipher.Decrypt(secret.ValueEncrypted, secret.Id);
                context.Set("secret", secrets);
                TemplateRenderOptions options = new TemplateRenderOptions { AllowSecrets = true };
                McpWorkerTest assignment = new McpWorkerTest
                {
                    Id = entry.Id, Command = TemplateRenderer.Render(server.Command ?? String.Empty, context, options),
                    Arguments = server.Arguments.Select(arg => TemplateRenderer.Render(arg, context, options)).ToList(),
                    RequiredTools = new List<string>(server.RequiredTools), ExpiresUtc = entry.ExpiresUtc,
                    TimeoutMs = entry.TimeoutMs
                };
                foreach (McpServerVariable variable in server.Environment)
                    assignment.Environment.Add(new ExecutionEnvironmentVariable { Name = variable.Name, Value = TemplateRenderer.Render(variable.ValueTemplate, context, options), IsSecret = true });
                response.McpTest = assignment;
            }
            catch (Exception ex) when (ex is TemplateException || ex is ValidationException || ex is System.Security.Cryptography.CryptographicException || ex is ArgumentException || ex is InvalidOperationException)
            {
                await _Context.Database.McpTests.CompleteAsync(node.Id, node.RegisteredUtc.Value, entry.Id, new McpServerTestResponse { Error = "MCP diagnostic configuration could not be resolved." }, token).ConfigureAwait(false);
            }
        }
    }
}
