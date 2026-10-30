namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Settings;

    /// <summary>
    /// The capability catalog (AD4, AD-022): keeps derived descriptors in step with their sources (published agent
    /// revisions, MCP server tool lists, harness tool probes), computes cost and latency hints, manages manual
    /// descriptors, and filters the catalog for run tokens. Thread-safe.
    /// </summary>
    public class CapabilityService
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly ConcurrentDictionary<string, DateTime> _McpAttempts = new ConcurrentDictionary<string, DateTime>(StringComparer.Ordinal);
        private DateTime _LastSweepUtc = DateTime.MinValue;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public CapabilityService(ServerContext context)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The catalog a tenant sees, after bringing Agent descriptors up to date with published revisions. Filters are
        /// applied in memory: kind, tag (exact), and search (case-insensitive, in name and summary).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="kind">Kind filter, or null.</param>
        /// <param name="tag">Tag filter, or null.</param>
        /// <param name="search">Search text, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors ordered by kind and name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<List<CapabilityDescriptor>> ListAsync(string tenantId, CapabilityKindEnum? kind, string? tag, string? search, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            await SyncAgentsAsync(tenantId, token).ConfigureAwait(false);
            List<CapabilityDescriptor> list = await _Context.Database.Capabilities.ListAsync(tenantId, kind, token).ConfigureAwait(false);
            if (!String.IsNullOrWhiteSpace(tag)) list = list.Where(d => d.Tags.Contains(tag, StringComparer.Ordinal)).ToList();
            if (!String.IsNullOrWhiteSpace(search))
            {
                string text = search.Trim();
                list = list.Where(d => d.Name.Contains(text, StringComparison.OrdinalIgnoreCase) || (d.Summary ?? String.Empty).Contains(text, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            return list;
        }

        /// <summary>
        /// Resolve one descriptor visible to a tenant by identifier, or by name (first match in kind order: Agent, McpTool,
        /// HarnessBuiltIn; the tenant's own before shared ones).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Identifier (cap_) or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptor.</returns>
        /// <exception cref="NotFoundException">Thrown when no descriptor matches.</exception>
        public async Task<CapabilityDescriptor> ResolveAsync(string tenantId, string? idOrName, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(idOrName)) throw new NotFoundException("Capability not found.");
            if (idOrName.StartsWith(Garrison.Core.Constants.CapabilityIdPrefix, StringComparison.Ordinal))
            {
                CapabilityDescriptor? byId = await _Context.Database.Capabilities.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false);
                if (byId != null) return byId;
            }
            List<CapabilityDescriptor> all = await ListAsync(tenantId, null, null, null, token).ConfigureAwait(false);
            return all.Where(d => String.Equals(d.Name, idOrName, StringComparison.Ordinal))
                .OrderBy(d => d.Kind).ThenBy(d => d.TenantId == null ? 1 : 0).FirstOrDefault()
                ?? throw new NotFoundException("Capability " + idOrName + " not found.");
        }

        /// <summary>
        /// Create a manual descriptor. Manual names are unique per tenant among manual descriptors.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Descriptor content: name, kind, summary, schemas, tags, requirements, optional sources.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Stored descriptor.</returns>
        /// <exception cref="ValidationException">Thrown when a field is invalid, including schemas that are not JSON Schema (field code InvalidJsonSchema).</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict when a manual descriptor with the name exists.</exception>
        public async Task<CapabilityDescriptor> CreateManualAsync(string tenantId, CapabilityDescriptor request, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            CapabilityDescriptor descriptor = new CapabilityDescriptor();
            descriptor.TenantId = tenantId;
            descriptor.Origin = CapabilityOriginEnum.Manual;
            descriptor.SourceKey = "manual:" + descriptor.Id;
            CopyManual(request, descriptor);
            Validate(descriptor);
            await RequireUniqueManualNameAsync(tenantId, descriptor.Name, null, token).ConfigureAwait(false);
            return await _Context.Database.Capabilities.CreateAsync(descriptor, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Replace a manual descriptor's content. Derived descriptors follow their source and cannot be changed.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="request">New content.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Stored descriptor.</returns>
        /// <exception cref="NotFoundException">Thrown when the descriptor is not the tenant's.</exception>
        /// <exception cref="ConflictException">Thrown with CapabilityDerived for a derived descriptor, NameConflict for a duplicate name.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        public async Task<CapabilityDescriptor> UpdateManualAsync(string tenantId, string id, CapabilityDescriptor request, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            CapabilityDescriptor existing = await OwnAsync(tenantId, id, token).ConfigureAwait(false);
            if (existing.Origin != CapabilityOriginEnum.Manual) throw new ConflictException("CapabilityDerived", "Capability " + existing.Name + " is derived from its source and follows it; change the source instead.");
            CopyManual(request, existing);
            Validate(existing);
            await RequireUniqueManualNameAsync(tenantId, existing.Name, existing.Id, token).ConfigureAwait(false);
            return await _Context.Database.Capabilities.UpdateAsync(existing, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete a manual descriptor.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="NotFoundException">Thrown when the descriptor is not the tenant's.</exception>
        /// <exception cref="ConflictException">Thrown with CapabilityDerived for a derived descriptor.</exception>
        public async Task DeleteManualAsync(string tenantId, string id, CancellationToken token)
        {
            CapabilityDescriptor existing = await OwnAsync(tenantId, id, token).ConfigureAwait(false);
            if (existing.Origin != CapabilityOriginEnum.Manual) throw new ConflictException("CapabilityDerived", "Capability " + existing.Name + " is derived from its source and disappears with it; it cannot be deleted directly.");
            await _Context.Database.Capabilities.DeleteAsync(tenantId, existing.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Refresh a tenant's derived descriptors now: agents, harness built-ins, every active MCP server (stdio ones too,
        /// through a worker with diagnostics enabled, when the caller may use their secrets), and hints.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mayUseSecrets">Decides whether the caller may use the secrets an MCP server's templates name; a server the caller may not use is skipped with a warning.</param>
        /// <param name="mcpServerId">Refresh only this MCP server (and skip the rest), or null for all.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>What was refreshed.</returns>
        public async Task<CapabilityRefreshResult> RefreshAsync(string tenantId, Func<McpServer, List<Secret>, CancellationToken, Task<bool>> mayUseSecrets, string? mcpServerId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (mayUseSecrets == null) throw new ArgumentNullException(nameof(mayUseSecrets));
            CapabilityRefreshResult result = new CapabilityRefreshResult();
            result.Agents = await SyncAgentsAsync(tenantId, token).ConfigureAwait(false);
            result.HarnessBuiltIns = await SyncHarnessBuiltInsAsync(token).ConfigureAwait(false);
            List<McpServer> servers = await ActiveServersAsync(tenantId, token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(mcpServerId))
            {
                servers = servers.Where(s => s.Id == mcpServerId).ToList();
                if (servers.Count == 0) throw new NotFoundException("MCP server " + mcpServerId + " not found or not active.");
            }
            else
            {
                await RemoveGoneServersAsync(tenantId, servers, token).ConfigureAwait(false);
            }
            foreach (McpServer server in servers)
            {
                token.ThrowIfCancellationRequested();
                List<Secret> referenced = await _Context.Get<WorkerMcpTestService>().ReferencedSecretsAsync(tenantId, server, token).ConfigureAwait(false);
                CapabilityServerRefresh outcome = new CapabilityServerRefresh { McpServerId = server.Id, McpServerName = server.Name };
                if (!await mayUseSecrets(server, referenced, token).ConfigureAwait(false))
                {
                    outcome.Error = "You may not use the secrets MCP server " + server.Name + " sends, so its tools were not listed.";
                }
                else
                {
                    McpServerTestResponse listed = await ListServerAsync(server, referenced, true, token).ConfigureAwait(false);
                    outcome = await ApplyServerAsync(tenantId, server, listed, token).ConfigureAwait(false);
                }
                result.McpServers.Add(outcome);
            }
            result.Hints = await RefreshHintsAsync(tenantId, token).ConfigureAwait(false);
            return result;
        }

        /// <summary>
        /// Leader maintenance step: at most once per Capabilities.SweepSeconds, refresh harness built-ins and, for every
        /// tenant, Agent descriptors, HTTP MCP servers whose tool list is older than Capabilities.McpRefreshSeconds, and
        /// hints. Stdio MCP servers are never listed here, because listing runs their command on a worker host.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the sweep ran.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            CapabilitySettings settings = _Context.Settings.Capabilities;
            if ((DateTime.UtcNow - _LastSweepUtc).TotalSeconds < settings.SweepSeconds) return false;
            _LastSweepUtc = DateTime.UtcNow;
            await SyncHarnessBuiltInsAsync(token).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000 };
            EnumerationResult<Tenant> tenants = await _Context.Database.Tenants.EnumerateAsync(query, token).ConfigureAwait(false);
            foreach (Tenant tenant in tenants.Objects)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    await SyncAgentsAsync(tenant.Id, token).ConfigureAwait(false);
                    List<McpServer> servers = await ActiveServersAsync(tenant.Id, token).ConfigureAwait(false);
                    await RemoveGoneServersAsync(tenant.Id, servers, token).ConfigureAwait(false);
                    foreach (McpServer server in servers.Where(s => s.Transport == McpTransportEnum.Http))
                    {
                        if (_McpAttempts.TryGetValue(server.Id + "@" + server.LastUpdateUtc.Ticks, out DateTime last) && (DateTime.UtcNow - last).TotalSeconds < settings.McpRefreshSeconds) continue;
                        List<Secret> referenced = await _Context.Get<WorkerMcpTestService>().ReferencedSecretsAsync(tenant.Id, server, token).ConfigureAwait(false);
                        // Saving the server required permission to use these secrets, and a run that binds it sends them
                        // the same way, so the sweep may list it without a caller.
                        McpServerTestResponse listed = await ListServerAsync(server, referenced, false, token).ConfigureAwait(false);
                        await ApplyServerAsync(tenant.Id, server, listed, token).ConfigureAwait(false);
                    }
                    await RefreshHintsAsync(tenant.Id, token).ConfigureAwait(false);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Context.Logging.Warn("[CapabilityService] sweep of tenant " + tenant.Id + " failed: " + e.Message);
                }
            }
            return true;
        }

        /// <summary>
        /// Bring a tenant's Agent descriptors in step with its agents' latest published revisions: create or refresh one
        /// per active agent with a published revision, and remove those whose agent is gone, inactive, or unpublished.
        /// Drafts never appear.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors created, refreshed, or removed.</returns>
        public async Task<int> SyncAgentsAsync(string tenantId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<Agent> agents = await AllAgentsAsync(tenantId, token).ConfigureAwait(false);
            List<CapabilityDescriptor> existing = await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.Agent, CapabilityOriginEnum.Derived, token).ConfigureAwait(false);
            Dictionary<string, CapabilityDescriptor> bySource = existing.ToDictionary(d => d.SourceKey, StringComparer.Ordinal);
            HashSet<string> keep = new HashSet<string>(StringComparer.Ordinal);
            int changes = 0;
            foreach (Agent agent in agents.Where(a => a.Active && !String.IsNullOrEmpty(a.LatestPublishedRevisionId)))
            {
                string key = "agent:" + agent.Id;
                keep.Add(key);
                bySource.TryGetValue(key, out CapabilityDescriptor? current);
                if (current != null && current.SourceRevisionId == agent.LatestPublishedRevisionId && current.Name == agent.Name) continue;
                AgentRevision? revision = await _Context.Database.AgentRevisions.ReadAsync(tenantId, agent.LatestPublishedRevisionId!, token).ConfigureAwait(false);
                if (revision == null || revision.State != AgentRevisionStateEnum.Published) continue;
                CapabilityDescriptor descriptor = current != null ? await _Context.Database.Capabilities.ReadBySourceAsync(tenantId, key, token).ConfigureAwait(false) ?? current : new CapabilityDescriptor();
                descriptor.TenantId = tenantId;
                descriptor.Kind = CapabilityKindEnum.Agent;
                descriptor.Origin = CapabilityOriginEnum.Derived;
                descriptor.SourceKey = key;
                descriptor.SourceAgentId = agent.Id;
                descriptor.SourceRevisionId = revision.Id;
                descriptor.Name = agent.Name;
                descriptor.Summary = AgentSummary(agent, revision);
                descriptor.InputSchemaJson = String.IsNullOrWhiteSpace(revision.InputSchemaJson) ? null : revision.InputSchemaJson;
                descriptor.OutputSchemaJson = String.IsNullOrWhiteSpace(revision.OutputSchemaJson) ? null : revision.OutputSchemaJson;
                descriptor.Tags = revision.Tags.Where(t => !String.IsNullOrWhiteSpace(t) && t.Length <= 64).Take(32).ToList();
                descriptor.Requirements = new List<CapabilityRequirement>();
                descriptor.RefreshWarning = null;
                descriptor.LastRefreshedUtc = DateTime.UtcNow;
                if (current == null) await _Context.Database.Capabilities.CreateAsync(descriptor, token).ConfigureAwait(false);
                else await _Context.Database.Capabilities.UpdateAsync(descriptor, token).ConfigureAwait(false);
                changes++;
            }
            foreach (CapabilityDescriptor stale in existing.Where(d => !keep.Contains(d.SourceKey)))
            {
                if (await _Context.Database.Capabilities.DeleteAsync(tenantId, stale.Id, token).ConfigureAwait(false)) changes++;
            }
            return changes;
        }

        /// <summary>
        /// Bring HarnessBuiltIn descriptors in step with the tool probes of every harness profile: one per tool name per
        /// scope (shared for built-in profiles, the tenant's for tenant profiles). A descriptor whose probe differs from the
        /// definition workers actually run (the first one, AD-033) carries a warning.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors created, refreshed, or removed.</returns>
        public async Task<int> SyncHarnessBuiltInsAsync(CancellationToken token)
        {
            List<HarnessToolProbeSource> sources = (await _Context.Database.HarnessProfiles.ListToolProbesAsync(token).ConfigureAwait(false)).Where(s => s.Active).ToList();
            ToolProbeSet effective = ToolProbeCatalog.Build(sources);
            int changes = 0;
            foreach (IGrouping<string, HarnessToolProbeSource> scope in sources.GroupBy(s => s.TenantId ?? String.Empty))
            {
                string? tenantId = scope.Key.Length == 0 ? null : scope.Key;
                changes += await SyncBuiltInScopeAsync(tenantId, scope.ToList(), effective, token).ConfigureAwait(false);
            }
            // Scopes whose profiles no longer declare any probe: the shared scope and any tenant with leftover descriptors.
            HashSet<string> scopes = new HashSet<string>(sources.Select(s => s.TenantId ?? String.Empty), StringComparer.Ordinal);
            if (!scopes.Contains(String.Empty)) changes += await SyncBuiltInScopeAsync(null, new List<HarnessToolProbeSource>(), effective, token).ConfigureAwait(false);
            EnumerationResult<Tenant> tenants = await _Context.Database.Tenants.EnumerateAsync(new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
            foreach (Tenant tenant in tenants.Objects.Where(t => !scopes.Contains(t.Id)))
            {
                changes += await SyncBuiltInScopeAsync(tenant.Id, new List<HarnessToolProbeSource>(), effective, token).ConfigureAwait(false);
            }
            return changes;
        }

        /// <summary>
        /// List one MCP server's tools now and apply them to its descriptors. On failure the descriptors keep their last
        /// good content and record the error as their refresh warning.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="server">MCP server.</param>
        /// <param name="referenced">Secrets the server's templates name; the caller decided it may use them.</param>
        /// <param name="allowStdio">Whether a stdio server may be listed through a worker diagnostic.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The outcome.</returns>
        public async Task<CapabilityServerRefresh> RefreshServerAsync(string tenantId, McpServer server, List<Secret> referenced, bool allowStdio, CancellationToken token)
        {
            if (server == null) throw new ArgumentNullException(nameof(server));
            McpServerTestResponse listed = await ListServerAsync(server, referenced, allowStdio, token).ConfigureAwait(false);
            return await ApplyServerAsync(tenantId, server, listed, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Recompute cost and latency hints for a tenant's Agent descriptors from its finished runs (AD4.5). Fewer runs
        /// than Capabilities.HintMinimumSamples give Unknown hints with null values.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors whose hints were written.</returns>
        public async Task<int> RefreshHintsAsync(string tenantId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            CapabilitySettings settings = _Context.Settings.Capabilities;
            DateTime since = DateTime.UtcNow.AddDays(-settings.HintWindowDays);
            List<CapabilityDescriptor> descriptors = await _Context.Database.Capabilities.ListAsync(tenantId, CapabilityKindEnum.Agent, token).ConfigureAwait(false);
            int written = 0;
            foreach (CapabilityDescriptor descriptor in descriptors.Where(d => d.TenantId == tenantId && !String.IsNullOrEmpty(d.SourceAgentId)))
            {
                token.ThrowIfCancellationRequested();
                List<CapabilityRunSample> samples = await _Context.Database.Capabilities.RunSamplesAsync(tenantId, descriptor.SourceAgentId!, since, settings.HintMaxSamples, token).ConfigureAwait(false);
                await _Context.Database.Capabilities.UpdateHintsAsync(descriptor.Id, ComputeHints(samples, settings.HintMinimumSamples, settings.HintWindowDays), token).ConfigureAwait(false);
                written++;
            }
            return written;
        }

        /// <summary>
        /// Summarize run samples as hints. Below the minimum sample count every value is null and the status Unknown.
        /// </summary>
        /// <param name="samples">Finished runs.</param>
        /// <param name="minimumSamples">Fewest runs for known hints.</param>
        /// <param name="windowDays">Window the samples cover, in days.</param>
        /// <returns>Hints.</returns>
        /// <exception cref="ArgumentNullException">Thrown when samples is null.</exception>
        public static CapabilityHints ComputeHints(List<CapabilityRunSample> samples, int minimumSamples, int windowDays)
        {
            if (samples == null) throw new ArgumentNullException(nameof(samples));
            CapabilityHints hints = new CapabilityHints();
            hints.SampleSize = samples.Count;
            hints.WindowDays = windowDays;
            hints.ComputedUtc = DateTime.UtcNow;
            if (samples.Count < Math.Max(1, minimumSamples)) return hints;
            List<long> durations = samples.Select(s => s.DurationMs).ToList();
            hints.MedianDurationMs = (long?)RunAnalyticsAccumulator.Percentile(durations, 50);
            hints.P90DurationMs = (long?)RunAnalyticsAccumulator.Percentile(durations, 90);
            List<double> costs = samples.Where(s => s.CostUsd.HasValue).Select(s => s.CostUsd!.Value).ToList();
            hints.MeanCostUsd = costs.Count > 0 ? Math.Round(costs.Average(), 6) : null;
            hints.Status = CapabilityHintStatusEnum.Known;
            return hints;
        }

        /// <summary>
        /// Filter descriptors to those a run may use (AD4.6): agents its agent may delegate to, tools of MCP servers bound
        /// to its deployment, and built-ins its harness profile declares. Manual descriptors follow the same rule when they
        /// name a source, and are visible otherwise.
        /// </summary>
        /// <param name="run">Calling run.</param>
        /// <param name="descriptors">Tenant catalog.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Visible descriptors.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or descriptors is null.</exception>
        public async Task<List<CapabilityDescriptor>> VisibleToRunAsync(Run run, List<CapabilityDescriptor> descriptors, CancellationToken token)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (descriptors == null) throw new ArgumentNullException(nameof(descriptors));
            Agent? caller = await EffectiveAgent.ForRunAsync(_Context.Database, run, token).ConfigureAwait(false);
            Deployment? deployment = await _Context.Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            HashSet<string> boundServers = new HashSet<string>(
                (deployment?.ResourceBindings ?? new List<DeploymentResourceBinding>()).Where(b => b.Kind == ResourceBindingKindEnum.McpServer).Select(b => b.ResourceId), StringComparer.Ordinal);
            HashSet<string> harnessTools = new HashSet<string>(StringComparer.Ordinal);
            if (deployment != null)
            {
                HarnessProfile? profile = await _Context.Database.HarnessProfiles.ReadAsync(deployment.HarnessProfileId, token).ConfigureAwait(false);
                if (profile != null) foreach (HarnessToolProbe probe in profile.ToolProbes) harnessTools.Add(probe.Name);
            }
            List<Agent> agents = await AllAgentsAsync(run.TenantId, token).ConfigureAwait(false);
            HashSet<string> delegable = new HashSet<string>(StringComparer.Ordinal);
            if (caller != null && caller.DelegationMode != DelegationModeEnum.None)
            {
                foreach (Agent agent in agents.Where(a => a.Active))
                {
                    if (caller.DelegationMode == DelegationModeEnum.AllowList && !caller.DelegationAllowList.Contains(agent.Name)) continue;
                    if (agent.Id == caller.Id && !caller.DelegationAllowRecursion) continue;
                    delegable.Add(agent.Id);
                }
            }
            List<CapabilityDescriptor> visible = new List<CapabilityDescriptor>();
            foreach (CapabilityDescriptor descriptor in descriptors)
            {
                bool allowed;
                if (descriptor.Kind == CapabilityKindEnum.Agent) allowed = descriptor.SourceAgentId == null ? descriptor.Origin == CapabilityOriginEnum.Manual : delegable.Contains(descriptor.SourceAgentId);
                else if (descriptor.Kind == CapabilityKindEnum.McpTool) allowed = descriptor.SourceMcpServerId == null ? descriptor.Origin == CapabilityOriginEnum.Manual : boundServers.Contains(descriptor.SourceMcpServerId);
                else allowed = descriptor.Origin == CapabilityOriginEnum.Manual || harnessTools.Contains(descriptor.Name);
                if (allowed) visible.Add(descriptor);
            }
            return visible;
        }

        #endregion

        #region Private-Methods

        private async Task<CapabilityDescriptor> OwnAsync(string tenantId, string id, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            CapabilityDescriptor? existing = String.IsNullOrEmpty(id) ? null : await _Context.Database.Capabilities.ReadAsync(tenantId, id, token).ConfigureAwait(false);
            if (existing == null) throw new NotFoundException("Capability not found.");
            if (existing.TenantId == null) throw new ConflictException("CapabilityDerived", "Capability " + existing.Name + " is shared by every tenant and derived from a built-in harness profile; it cannot be changed.");
            return existing;
        }

        private async Task RequireUniqueManualNameAsync(string tenantId, string name, string? exceptId, CancellationToken token)
        {
            List<CapabilityDescriptor> manual = await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.Agent, CapabilityOriginEnum.Manual, token).ConfigureAwait(false);
            manual.AddRange(await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.McpTool, CapabilityOriginEnum.Manual, token).ConfigureAwait(false));
            manual.AddRange(await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.HarnessBuiltIn, CapabilityOriginEnum.Manual, token).ConfigureAwait(false));
            if (manual.Any(d => d.Id != exceptId && String.Equals(d.Name, name, StringComparison.Ordinal))) throw new ConflictException("NameConflict", "A manual capability named " + name + " already exists.");
        }

        private static void CopyManual(CapabilityDescriptor from, CapabilityDescriptor to)
        {
            to.Name = from.Name;
            to.Kind = from.Kind;
            to.Summary = from.Summary;
            to.InputSchemaJson = String.IsNullOrWhiteSpace(from.InputSchemaJson) ? null : from.InputSchemaJson;
            to.OutputSchemaJson = String.IsNullOrWhiteSpace(from.OutputSchemaJson) ? null : from.OutputSchemaJson;
            to.Tags = from.Tags.Select(t => (t ?? String.Empty).Trim()).ToList();
            to.Requirements = from.Requirements;
            to.SourceAgentId = String.IsNullOrWhiteSpace(from.SourceAgentId) ? null : from.SourceAgentId;
            to.SourceMcpServerId = String.IsNullOrWhiteSpace(from.SourceMcpServerId) ? null : from.SourceMcpServerId;
            to.SourceToolName = String.IsNullOrWhiteSpace(from.SourceToolName) ? null : from.SourceToolName;
            to.SourceRevisionId = null;
            to.SourceHarnessProfileId = null;
            to.SourceHarnessType = from.SourceHarnessType;
        }

        private static void Validate(CapabilityDescriptor descriptor)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, string> codes = new Dictionary<string, string>(StringComparer.Ordinal);
            string? input = InputSchemaValidator.CheckSchema(descriptor.InputSchemaJson);
            if (input != null)
            {
                errors["inputSchema"] = input;
                codes["inputSchema"] = InputSchemaValidator.InvalidSchemaCode;
            }
            string? output = InputSchemaValidator.CheckSchema(descriptor.OutputSchemaJson);
            if (output != null)
            {
                errors["outputSchema"] = output;
                codes["outputSchema"] = InputSchemaValidator.InvalidSchemaCode;
            }
            if (descriptor.Tags.Count > 32 || descriptor.Tags.Any(t => t.Length == 0 || t.Length > 64))
            {
                errors["tags"] = "At most 32 tags, each 1 to 64 characters.";
                codes["tags"] = "InvalidTags";
            }
            if (descriptor.Requirements.Count > 16)
            {
                errors["requirements"] = "At most 16 requirements.";
                codes["requirements"] = "TooManyRequirements";
            }
            if (errors.Count > 0)
            {
                ValidationException error = new ValidationException("The capability is not valid: " + String.Join(" ", errors.Values), errors, codes);
                if (codes.Values.All(c => c == InputSchemaValidator.InvalidSchemaCode)) error.Code = InputSchemaValidator.InvalidSchemaCode;
                throw error;
            }
        }

        private static string? AgentSummary(Agent agent, AgentRevision revision)
        {
            List<string> parts = new List<string>();
            string? description = revision.Description ?? revision.DisplayName;
            if (!String.IsNullOrWhiteSpace(description)) parts.Add(description.Trim());
            List<string> skills = agent.Skills.Select(s => s.Name + (String.IsNullOrWhiteSpace(s.Description) ? String.Empty : ": " + s.Description)).ToList();
            if (skills.Count > 0) parts.Add("Skills: " + String.Join("; ", skills));
            string summary = String.Join("\n", parts);
            if (summary.Length > 4000) summary = summary.Substring(0, 4000);
            return summary.Length == 0 ? null : summary;
        }

        private async Task<List<Agent>> AllAgentsAsync(string tenantId, CancellationToken token)
        {
            List<Agent> agents = new List<Agent>();
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000, Ordering = EnumerationOrderEnum.CreatedAscending };
            while (true)
            {
                EnumerationResult<Agent> page = await _Context.Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                agents.AddRange(page.Objects);
                if (page.EndOfResults || page.Objects.Count == 0 || agents.Count >= 10000) break;
                query.Skip += page.Objects.Count;
            }
            return agents;
        }

        private async Task<List<McpServer>> ActiveServersAsync(string tenantId, CancellationToken token)
        {
            EnumerationResult<McpServer> page = await _Context.Database.McpServers.EnumerateAsync(tenantId, new EnumerationQuery { MaxResults = 1000, IncludeBuiltIn = false }, token).ConfigureAwait(false);
            return page.Objects.Where(s => s.Active && s.TenantId == tenantId).ToList();
        }

        private async Task RemoveGoneServersAsync(string tenantId, List<McpServer> active, CancellationToken token)
        {
            HashSet<string> ids = new HashSet<string>(active.Select(s => s.Id), StringComparer.Ordinal);
            List<CapabilityDescriptor> existing = await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.McpTool, CapabilityOriginEnum.Derived, token).ConfigureAwait(false);
            foreach (CapabilityDescriptor stale in existing.Where(d => d.SourceMcpServerId == null || !ids.Contains(d.SourceMcpServerId)))
            {
                await _Context.Database.Capabilities.DeleteAsync(tenantId, stale.Id, token).ConfigureAwait(false);
            }
        }

        private async Task<McpServerTestResponse> ListServerAsync(McpServer server, List<Secret> referenced, bool allowStdio, CancellationToken token)
        {
            _McpAttempts[server.Id + "@" + server.LastUpdateUtc.Ticks] = DateTime.UtcNow;
            int timeout = _Context.Settings.Capabilities.McpTimeoutMs;
            if (server.Transport == McpTransportEnum.Http) return await _Context.Get<McpToolListingService>().ListHttpAsync(server, referenced, timeout, token).ConfigureAwait(false);
            if (!allowStdio) return new McpServerTestResponse { Error = "Stdio MCP servers are listed only on request (POST .../capabilities/refresh)." };
            WorkerMcpTestService tests = _Context.Get<WorkerMcpTestService>();
            EnumerationResult<Node> nodes = await _Context.Database.Nodes.EnumerateAsync(new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false);
            Node? worker = nodes.Objects.FirstOrDefault(n => n.Active && n.SupportsMcpTests && n.Status == NodeStatusEnum.Ready && n.RegisteredUtc.HasValue
                && n.LastHeartbeatUtc.HasValue && n.LastHeartbeatUtc.Value >= DateTime.UtcNow.AddSeconds(-tests.HeartbeatFreshnessSeconds));
            if (worker == null) return new McpServerTestResponse { Error = "No Ready worker has stdio MCP diagnostics turned on (GARRISON_WORKER_MCP_TESTS_ENABLED), so the stdio server's tools could not be listed." };
            try
            {
                return await tests.TestAsync(server, worker.Id, timeout, token).ConfigureAwait(false);
            }
            catch (Exception e) when (e is ValidationException || e is ConflictException || e is NotFoundException)
            {
                return new McpServerTestResponse { NodeId = worker.Id, Error = e.Message };
            }
        }

        private async Task<CapabilityServerRefresh> ApplyServerAsync(string tenantId, McpServer server, McpServerTestResponse listed, CancellationToken token)
        {
            CapabilityServerRefresh outcome = new CapabilityServerRefresh { McpServerId = server.Id, McpServerName = server.Name };
            bool listedAll = listed.Error == null || listed.MissingRequiredTools.Count > 0 && listed.Tools.Count > 0;
            if (!listedAll)
            {
                // Keep the last good list (AD4.3) and say why it could not be refreshed.
                outcome.Error = listed.Error;
                outcome.Warned = await _Context.Database.Capabilities.SetServerWarningAsync(tenantId, server.Id, "Refresh failed " + DateTime.UtcNow.ToString("u", System.Globalization.CultureInfo.InvariantCulture) + ": " + listed.Error, token).ConfigureAwait(false);
                _Context.Logging.Debug("[CapabilityService] MCP server " + server.Id + " refresh failed: " + listed.Error);
                return outcome;
            }
            List<CapabilityDescriptor> existing = (await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.McpTool, CapabilityOriginEnum.Derived, token).ConfigureAwait(false))
                .Where(d => d.SourceMcpServerId == server.Id).ToList();
            HashSet<string> keep = new HashSet<string>(StringComparer.Ordinal);
            List<McpToolDetail> details = listed.ToolDetails.Count > 0 ? listed.ToolDetails : listed.Tools.Select(name => new McpToolDetail { Name = name }).ToList();
            foreach (McpToolDetail tool in details)
            {
                string key = "mcp:" + server.Id + ":" + tool.Name;
                keep.Add(key);
                CapabilityDescriptor? current = existing.FirstOrDefault(d => d.SourceKey == key);
                CapabilityDescriptor descriptor = current != null ? await _Context.Database.Capabilities.ReadBySourceAsync(tenantId, key, token).ConfigureAwait(false) ?? current : new CapabilityDescriptor();
                descriptor.TenantId = tenantId;
                descriptor.Kind = CapabilityKindEnum.McpTool;
                descriptor.Origin = CapabilityOriginEnum.Derived;
                descriptor.SourceKey = key;
                descriptor.SourceMcpServerId = server.Id;
                descriptor.SourceToolName = tool.Name;
                descriptor.Name = (server.Name + "/" + tool.Name).Length > 256 ? (server.Name + "/" + tool.Name).Substring(0, 256) : server.Name + "/" + tool.Name;
                descriptor.Summary = tool.Description;
                descriptor.InputSchemaJson = tool.InputSchemaJson != null && InputSchemaValidator.CheckSchema(tool.InputSchemaJson) == null ? tool.InputSchemaJson : null;
                descriptor.OutputSchemaJson = null;
                descriptor.Tags = new List<string> { "mcp", server.Name.Length <= 64 ? server.Name : server.Name.Substring(0, 64) };
                descriptor.RefreshWarning = listed.MissingRequiredTools.Count > 0 ? "Required tools are missing: " + String.Join(", ", listed.MissingRequiredTools) + "." : null;
                descriptor.LastRefreshedUtc = DateTime.UtcNow;
                if (current == null) await _Context.Database.Capabilities.CreateAsync(descriptor, token).ConfigureAwait(false);
                else await _Context.Database.Capabilities.UpdateAsync(descriptor, token).ConfigureAwait(false);
                outcome.Tools++;
            }
            foreach (CapabilityDescriptor removed in existing.Where(d => !keep.Contains(d.SourceKey)))
            {
                if (await _Context.Database.Capabilities.DeleteAsync(tenantId, removed.Id, token).ConfigureAwait(false)) outcome.Removed++;
            }
            return outcome;
        }

        private async Task<int> SyncBuiltInScopeAsync(string? tenantId, List<HarnessToolProbeSource> sources, ToolProbeSet effective, CancellationToken token)
        {
            List<CapabilityDescriptor> existing = await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.HarnessBuiltIn, CapabilityOriginEnum.Derived, token).ConfigureAwait(false);
            HashSet<string> keep = new HashSet<string>(StringComparer.Ordinal);
            int changes = 0;
            foreach (HarnessToolProbeSource source in sources)
            {
                string key = "tool:" + source.Probe.Name;
                if (!keep.Add(key)) continue;
                CapabilityDescriptor? current = existing.FirstOrDefault(d => d.SourceKey == key);
                CapabilityDescriptor descriptor = current != null ? await _Context.Database.Capabilities.ReadBySourceAsync(tenantId, key, token).ConfigureAwait(false) ?? current : new CapabilityDescriptor();
                Garrison.Core.Protocol.NodeToolProbe? probed = effective.Probes.FirstOrDefault(p => p.Name == source.Probe.Name);
                string? warning = probed != null && (probed.Executable != source.Probe.Executable || !probed.Arguments.SequenceEqual(source.Probe.Arguments))
                    ? "Workers probe " + source.Probe.Name + " as " + probed.Executable + " " + String.Join(" ", probed.Arguments) + ", defined by another harness profile first; this profile's definition is not probed."
                    : null;
                string summary = source.Probe.Description ?? ("The " + source.Probe.Name + " tool (" + source.Probe.Executable + ") on the worker host.");
                bool same = current != null && current.Summary == summary && current.RefreshWarning == warning && current.SourceHarnessProfileId == source.HarnessProfileId;
                if (same) continue;
                descriptor.TenantId = tenantId;
                descriptor.Kind = CapabilityKindEnum.HarnessBuiltIn;
                descriptor.Origin = CapabilityOriginEnum.Derived;
                descriptor.SourceKey = key;
                descriptor.SourceHarnessProfileId = source.HarnessProfileId;
                descriptor.SourceHarnessType = source.HarnessType;
                descriptor.Name = source.Probe.Name;
                descriptor.Summary = summary;
                descriptor.Tags = new List<string> { "tool" };
                descriptor.Requirements = new List<CapabilityRequirement> { new CapabilityRequirement { Key = Garrison.Core.Constants.ToolLabelPrefix + source.Probe.Name, Value = "true" } };
                descriptor.RefreshWarning = warning;
                descriptor.LastRefreshedUtc = DateTime.UtcNow;
                if (current == null) await _Context.Database.Capabilities.CreateAsync(descriptor, token).ConfigureAwait(false);
                else await _Context.Database.Capabilities.UpdateAsync(descriptor, token).ConfigureAwait(false);
                changes++;
            }
            foreach (CapabilityDescriptor stale in existing.Where(d => !keep.Contains(d.SourceKey)))
            {
                if (await _Context.Database.Capabilities.DeleteAsync(tenantId, stale.Id, token).ConfigureAwait(false)) changes++;
            }
            return changes;
        }

        #endregion
    }
}
