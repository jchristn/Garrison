namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;

    /// <summary>
    /// Applies and exports declarative manifests (plan section 8.5). Apply validates every document first, resolving
    /// name references against existing records and documents earlier in the same body, and writes nothing when any
    /// document fails; then it writes in dependency order (Secret, PromptTemplate, HarnessProfile, McpServer,
    /// WorkspaceTemplate, Agent, Deployment). Thread-safe.
    /// </summary>
    public class ManifestService
    {
        #region Public-Members

        /// <summary>
        /// Supported API version.
        /// </summary>
        public static readonly string ApiVersion = "garrison/v1";

        /// <summary>
        /// Supported kinds in apply order.
        /// </summary>
        public static readonly IReadOnlyList<string> Kinds = new List<string> { "Secret", "PromptTemplate", "HarnessProfile", "McpServer", "WorkspaceTemplate", "Agent", "Deployment", "Pipeline", "Trigger", "NotificationEndpoint", "Bundle" };

        /// <summary>
        /// Kinds an export can select (P12.21), in apply order. Secrets are never exported as documents (only as bundle
        /// requirements), and the Bundle document is written by every export.
        /// </summary>
        public static readonly IReadOnlyList<string> ExportableKinds = new List<string> { "PromptTemplate", "HarnessProfile", "McpServer", "WorkspaceTemplate", "Agent", "Deployment", "Pipeline", "Trigger", "NotificationEndpoint" };

        /// <summary>
        /// Name written to the Bundle document of an export.
        /// </summary>
        public static readonly string BundleName = "garrison-bundle";

        /// <summary>
        /// Most stages a Pipeline document may have (P12.9). Minimum 1, maximum 100, default 20. The control plane sets it
        /// from the cluster setting Runtime.PipelineMaxStages.
        /// </summary>
        public int MaxPipelineStages
        {
            get
            {
                return _MaxPipelineStages;
            }
            set
            {
                _MaxPipelineStages = Math.Clamp(value, 1, 100);
            }
        }

        /// <summary>
        /// Whether NotificationEndpoint documents may name loopback and private destinations (P12.14). Default false. The
        /// control plane sets it from the cluster setting Notifications.AllowPrivateDestinations.
        /// </summary>
        public bool AllowPrivateNotificationDestinations { get; set; } = false;

        #endregion

        #region Private-Members

        private static readonly HashSet<string> _StripKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "id", "tenantId", "createdUtc", "lastUpdateUtc", "warnings", "isProtected", "isBuiltIn", "builtInKey", "position", "harnessProfileId", "mcpServerId", "agentId", "deploymentId", "workspaceTemplateId", "lastRegisteredUtc", "configVersion"
        };

        private readonly DatabaseDriverBase _Database;
        private readonly SecretCipher _Cipher;
        private int _MaxPipelineStages = 20;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="cipher">Secret cipher.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ManifestService(DatabaseDriverBase database, SecretCipher cipher)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Cipher = cipher ?? throw new ArgumentNullException(nameof(cipher));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Apply manifest text to a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="text">YAML or JSON manifest text.</param>
        /// <param name="options">Options.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Persisted apply record with per-document results.</returns>
        /// <exception cref="ValidationException">Thrown when the text cannot be parsed.</exception>
        public async Task<ManifestApply> ApplyAsync(string tenantId, string text, ManifestApplyOptions options, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            options ??= new ManifestApplyOptions();
            List<ManifestDocument> documents = ManifestParser.Parse(text);

            ManifestApply apply = new ManifestApply();
            apply.TenantId = tenantId;
            apply.DryRun = options.DryRun;
            apply.PrincipalName = options.PrincipalName;
            apply.DocumentCount = documents.Count;

            // One reference cache for the whole apply (I-06): each referenced record is read once for planning, diffing,
            // and the deployment validation at write time, instead of once per document that names it.
            ConfigurationReferenceCache cache = new ConfigurationReferenceCache(_Database, tenantId);
            Resolver resolver = new Resolver(_Database, tenantId, cache);
            List<Planned> plan = new List<Planned>();
            foreach (ManifestDocument document in documents.OrderBy(d => KindOrder(d.Kind)).ThenBy(d => d.Index))
            {
                Planned planned = new Planned();
                planned.Document = document;
                try
                {
                    await PlanAsync(tenantId, document, options, resolver, planned, token).ConfigureAwait(false);
                    if (options.SecretUse != null && (planned.Result == ManifestApplyResultEnum.Created || planned.Result == ManifestApplyResultEnum.Updated))
                    {
                        await options.SecretUse.RequireForModelAsync(tenantId, planned.Model, token).ConfigureAwait(false);
                    }
                }
                catch (ValidationException e)
                {
                    planned.Result = ManifestApplyResultEnum.Failed;
                    List<KeyValuePair<string, string>> extra = e.Fields.Where(f => !String.Equals(f.Value, e.Message, StringComparison.Ordinal)).ToList();
                    planned.Message = e.Code == ManifestSpecError.Code ? e.Message : e.Message + (extra.Count > 0 ? " " + String.Join("; ", extra.Select(f => f.Key + ": " + f.Value)) : String.Empty);
                    planned.ErrorField = e.Fields.Keys.FirstOrDefault();

                    // A field with its own code (for example MissingSecret on a secret reference, or SecretUseDenied for a
                    // secret the caller may not use) reports that code; other plan errors keep theirs.
                    bool fieldCoded = planned.ErrorField != null && e.Codes.ContainsKey(planned.ErrorField)
                        && (e.Code != ManifestSpecError.Code || e.CodeFor(planned.ErrorField) == SecretUseChecker.DeniedCode);
                    planned.ErrorCode = fieldCoded ? e.CodeFor(planned.ErrorField!) : e.Code;
                }
                catch (CompilationException e)
                {
                    planned.Result = ManifestApplyResultEnum.Failed;
                    planned.Message = e.Message;
                    planned.ErrorCode = e.Code;
                }
                if (planned.Result == ManifestApplyResultEnum.Failed) Placeholder(resolver, document);
                plan.Add(planned);
            }

            bool failed = plan.Any(p => p.Result == ManifestApplyResultEnum.Failed);
            if (!options.DryRun && !failed)
            {
                foreach (Planned planned in plan)
                {
                    if (planned.Result == ManifestApplyResultEnum.Unchanged) continue;
                    try
                    {
                        await WriteAsync(tenantId, planned, cache, token).ConfigureAwait(false);
                    }
                    catch (ValidationException e)
                    {
                        planned.Result = ManifestApplyResultEnum.Failed;
                        planned.Message = e.Message + (e.Fields.Count > 0 ? " " + String.Join("; ", e.Fields.Select(f => f.Key + ": " + f.Value)) : String.Empty);
                        planned.ErrorField = e.Fields.Keys.FirstOrDefault();
                        // A field with its own code (for example trustLevel TenantRequiresUntrusted) reports that code.
                        planned.ErrorCode = planned.ErrorField != null && e.Codes.ContainsKey(planned.ErrorField) ? e.CodeFor(planned.ErrorField) : e.Code;
                    }
                }
            }

            foreach (Planned planned in plan.OrderBy(p => p.Document.Index))
            {
                ManifestApplyItem item = new ManifestApplyItem();
                item.Kind = planned.Document.Kind;
                item.Name = planned.Document.Metadata.Name;
                item.ResourceId = planned.ResourceId;
                item.PlannedResult = planned.Result;
                if (planned.Result == ManifestApplyResultEnum.Updated) item.Changes = planned.Changes;
                item.Warnings = Warnings(planned.Model);
                if (planned.Result == ManifestApplyResultEnum.Failed)
                {
                    item.Result = ManifestApplyResultEnum.Failed;
                }
                else if (options.DryRun)
                {
                    item.Result = ManifestApplyResultEnum.Validated;
                    planned.Message = planned.Message ?? DryRunMessage(planned);

                    // Nothing was written, so a document that would be created has no resource yet.
                    if (planned.Result == ManifestApplyResultEnum.Created) item.ResourceId = null;
                }
                else if (failed)
                {
                    item.Result = ManifestApplyResultEnum.Validated;
                    planned.Message = "Not applied because another document failed validation.";
                }
                else
                {
                    item.Result = planned.Result;
                }
                item.Message = planned.Message;
                if (planned.Result == ManifestApplyResultEnum.Failed)
                {
                    item.ErrorCode = planned.ErrorCode;
                    item.ErrorField = planned.ErrorField;
                }
                apply.Items.Add(item);
            }

            // A dry run counts what would happen; a real apply counts what happened.
            Func<ManifestApplyItem, ManifestApplyResultEnum?> outcome = i => options.DryRun && i.Result == ManifestApplyResultEnum.Validated ? i.PlannedResult : i.Result;
            apply.CreatedCount = apply.Items.Count(i => outcome(i) == ManifestApplyResultEnum.Created);
            apply.UpdatedCount = apply.Items.Count(i => outcome(i) == ManifestApplyResultEnum.Updated);
            apply.UnchangedCount = apply.Items.Count(i => outcome(i) == ManifestApplyResultEnum.Unchanged);
            apply.FailedCount = apply.Items.Count(i => i.Result == ManifestApplyResultEnum.Failed);
            return await _Database.ManifestApplies.CreateAsync(apply, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Export every tenant-owned resource as a manifest bundle (multi-document YAML). Secrets are requirements only.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>YAML text.</returns>
        public async Task<string> ExportAsync(string tenantId, CancellationToken token = default)
        {
            return (await ExportAsync(tenantId, new ManifestExportOptions(), token).ConfigureAwait(false)).Yaml;
        }

        /// <summary>
        /// Export a manifest bundle (P12.21): header comments, a Bundle document listing what the target tenant needs
        /// (secrets, artifact stores, built-ins), then the selected resources in apply order. The text applies unchanged
        /// with <see cref="ApplyAsync"/>; secret values are never exported.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="options">Selection; null exports every tenant-owned resource.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Bundle.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        /// <exception cref="ValidationException">Thrown with the field code UnknownKind when a kind cannot be exported.</exception>
        /// <exception cref="NotFoundException">Thrown when a selected resource does not exist in the tenant.</exception>
        public async Task<ManifestExportResult> ExportAsync(string tenantId, ManifestExportOptions? options, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            options ??= new ManifestExportOptions();
            ManifestExportPlan plan = await ManifestExportPlan.LoadAsync(_Database, tenantId, token).ConfigureAwait(false);
            plan.IncludeBuiltIn = options.IncludeBuiltIn;
            plan.FollowReferences = options.FollowReferences;

            List<string> kinds = new List<string>();
            foreach (string kind in options.Kinds) kinds.Add(ExportKind(kind, "kinds"));
            List<ManifestResourceReference> resources = new List<ManifestResourceReference>();
            foreach (ManifestResourceReference reference in options.Resources) resources.Add(new ManifestResourceReference(ExportKind(reference.Kind, "resources"), reference.Name));

            if (kinds.Count == 0 && resources.Count == 0) kinds.AddRange(ExportableKinds);
            foreach (string kind in kinds) plan.SelectKind(kind);
            foreach (ManifestResourceReference reference in resources)
            {
                if (!await plan.SelectAsync(reference.Kind, reference.Name, token).ConfigureAwait(false)) throw new NotFoundException(reference.Kind + " " + reference.Name + " not found.");
            }
            await plan.ExpandAsync(token).ConfigureAwait(false);

            Resolver resolver = new Resolver(_Database, tenantId);
            List<Dictionary<string, object?>> documents = new List<Dictionary<string, object?>>();
            foreach (PromptTemplate template in plan.Selected<PromptTemplate>()) documents.Add(Wrap("PromptTemplate", template.Name, PromptTree(template)));
            foreach (HarnessProfile profile in plan.Selected<HarnessProfile>()) documents.Add(Wrap("HarnessProfile", profile.Name, Tree(profile)));
            foreach (McpServer server in plan.Selected<McpServer>()) documents.Add(Wrap("McpServer", server.Name, Tree(server)));
            foreach (WorkspaceTemplate workspace in plan.Selected<WorkspaceTemplate>()) documents.Add(Wrap("WorkspaceTemplate", workspace.Name, await WorkspaceTreeAsync(workspace, resolver, token).ConfigureAwait(false)));
            foreach (Agent agent in plan.Selected<Agent>()) documents.Add(Wrap("Agent", agent.Name, await AgentTreeAsync(agent, resolver, token).ConfigureAwait(false)));
            foreach (Deployment deployment in plan.Selected<Deployment>()) documents.Add(Wrap("Deployment", deployment.Name, await DeploymentTreeAsync(deployment, resolver, token).ConfigureAwait(false)));
            foreach (Pipeline pipeline in plan.Selected<Pipeline>()) documents.Add(Wrap("Pipeline", pipeline.Name, await PipelineTreeAsync(pipeline, resolver, token).ConfigureAwait(false)));
            foreach (Trigger trigger in plan.Selected<Trigger>()) documents.Add(Wrap("Trigger", trigger.Name, await TriggerTreeAsync(trigger, resolver, token).ConfigureAwait(false)));
            foreach (NotificationEndpoint endpoint in plan.Selected<NotificationEndpoint>()) documents.Add(Wrap("NotificationEndpoint", endpoint.Name, await NotificationEndpointTreeAsync(endpoint, resolver, token).ConfigureAwait(false)));

            ManifestExportResult result = new ManifestExportResult();
            result.Bundle = await plan.RequirementsAsync(token).ConfigureAwait(false);
            result.Bundle.ExportedUtc = DateTime.UtcNow;
            result.DocumentCount = documents.Count;
            documents.Insert(0, Wrap("Bundle", BundleName, BundleTree(result.Bundle)));
            result.Yaml = BundleHeader(tenantId, result.Bundle) + ManifestParser.ToYaml(documents);
            return result;
        }

        #endregion

        #region Private-Methods

        private static void Placeholder(Resolver resolver, ManifestDocument document)
        {
            // A failed document still answers references from later documents, so each failure is reported once, on the
            // document that caused it, instead of again on everything that names it. Nothing is written after a failure.
            string? kind = Kinds.FirstOrDefault(k => String.Equals(k, document.Kind, StringComparison.OrdinalIgnoreCase));
            if (kind == null || String.IsNullOrWhiteSpace(document.Metadata.Name)) return;
            resolver.Add(kind, document.Metadata.Name, "unresolved_" + kind.ToLowerInvariant() + "_" + document.Index.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        private static int KindOrder(string kind)
        {
            for (int i = 0; i < Kinds.Count; i++)
            {
                if (String.Equals(Kinds[i], kind, StringComparison.OrdinalIgnoreCase)) return i;
            }
            return Kinds.Count;
        }

        private async Task PlanAsync(string tenantId, ManifestDocument document, ManifestApplyOptions options, Resolver resolver, Planned planned, CancellationToken token)
        {
            if (document.ApiVersion != ApiVersion) throw new ValidationException("Document " + document.Index + " has apiVersion '" + document.ApiVersion + "'; expected " + ApiVersion + ".");
            if (KindOrder(document.Kind) >= Kinds.Count) throw new ValidationException("Document " + document.Index + " has unknown kind '" + document.Kind + "'. Supported: " + String.Join(", ", Kinds) + ".");
            string name = document.Metadata.Name;
            if (String.IsNullOrWhiteSpace(name)) throw new ValidationException("Document " + document.Index + " (" + document.Kind + ") needs metadata.name.");
            if (name.StartsWith(Constants.BuiltInPrefix, StringComparison.OrdinalIgnoreCase))
            {
                // P12.21: a bundle exported with includeBuiltIn carries the built-ins it uses; applying one only checks it.
                if (String.Equals(document.Kind, "PromptTemplate", StringComparison.OrdinalIgnoreCase) || String.Equals(document.Kind, "HarnessProfile", StringComparison.OrdinalIgnoreCase))
                {
                    await PlanBuiltInAsync(tenantId, document, planned, token).ConfigureAwait(false);
                    return;
                }
                throw new ValidationException(document.Kind + " " + name + ": names starting with " + Constants.BuiltInPrefix + " are reserved for built-ins.");
            }
            if (document.Metadata.Description != null) document.Spec["description"] = document.Metadata.Description;

            switch (document.Kind.ToLowerInvariant())
            {
                case "secret":
                    await PlanSecretAsync(tenantId, document, options, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "prompttemplate":
                    await PlanPromptAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "harnessprofile":
                    await PlanProfileAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "mcpserver":
                    await PlanMcpServerAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "workspacetemplate":
                    await PlanWorkspaceAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "agent":
                    await PlanAgentAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "deployment":
                    await PlanDeploymentAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "pipeline":
                    await PlanPipelineAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "trigger":
                    await PlanTriggerAsync(tenantId, document, options, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "notificationendpoint":
                    await PlanNotificationEndpointAsync(tenantId, document, options, resolver, planned, token).ConfigureAwait(false);
                    break;
                case "bundle":
                    await PlanBundleAsync(tenantId, document, resolver, planned, token).ConfigureAwait(false);
                    break;
            }
        }

        private async Task PlanBuiltInAsync(string tenantId, ManifestDocument document, Planned planned, CancellationToken token)
        {
            string name = document.Metadata.Name;
            Dictionary<string, string> fields = new Dictionary<string, string> { { "metadata.name", "Built-in " + document.Kind + " " + name + " does not exist on this server." } };
            Dictionary<string, string> codes = new Dictionary<string, string> { { "metadata.name", "MissingBuiltIn" } };
            bool same;
            if (String.Equals(document.Kind, "PromptTemplate", StringComparison.OrdinalIgnoreCase))
            {
                PromptTemplate? builtIn = await _Database.PromptTemplates.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
                if (builtIn == null || !builtIn.IsBuiltIn) throw new ValidationException("Built-in prompt template " + name + " does not exist on this server.", fields, codes);
                PromptTemplateSpec spec = Deserialize<PromptTemplateSpec>(document);
                same = String.Equals(builtIn.Content, spec.Content, StringComparison.Ordinal);
                planned.ResourceId = builtIn.Id;
            }
            else
            {
                HarnessProfile? builtIn = await _Database.HarnessProfiles.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
                if (builtIn == null || !builtIn.IsBuiltIn) throw new ValidationException("Built-in harness profile " + name + " does not exist on this server.", fields, codes);
                HarnessProfile profile = Deserialize<HarnessProfile>(document);
                profile.Name = builtIn.Name;
                same = Same(Tree(builtIn), Tree(profile));
                planned.ResourceId = builtIn.Id;
            }
            planned.Result = ManifestApplyResultEnum.Unchanged;
            planned.Message = same
                ? "Built-in; built-ins are managed by the server and left unchanged."
                : "Built-in; this server's version differs from the document. Built-ins are managed by the server and left unchanged.";
        }

        private async Task PlanBundleAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            BundleSpec spec = Deserialize<BundleSpec>(document);
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            List<string> missing = new List<string>();
            for (int i = 0; i < spec.RequiredSecrets.Count; i++)
            {
                string secret = spec.RequiredSecrets[i].Name;
                if (await resolver.TryResolveAsync("Secret", secret, token).ConfigureAwait(false) != null) continue;
                string field = "spec.requiredSecrets[" + i.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                errors[field] = "Secret '" + secret + "' does not exist in this tenant. Secret values are never exported; create it, then apply again.";
                codes[field] = "MissingSecret";
                missing.Add("secret " + secret);
            }
            for (int i = 0; i < spec.RequiredArtifactStores.Count; i++)
            {
                string store = spec.RequiredArtifactStores[i];
                if (!String.IsNullOrWhiteSpace(store) && await _Database.ArtifactStores.ReadByNameAsync(tenantId, store, token).ConfigureAwait(false) != null) continue;
                string field = "spec.requiredArtifactStores[" + i.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                errors[field] = "Artifact store '" + store + "' does not exist in this tenant.";
                codes[field] = "MissingArtifactStore";
                missing.Add("artifact store " + store);
            }
            for (int i = 0; i < spec.RequiredBuiltIns.Count; i++)
            {
                ManifestResourceReference reference = spec.RequiredBuiltIns[i];
                bool exists = false;
                if (String.Equals(reference.Kind, "PromptTemplate", StringComparison.OrdinalIgnoreCase))
                {
                    PromptTemplate? template = await _Database.PromptTemplates.ReadByNameAsync(tenantId, reference.Name, token).ConfigureAwait(false);
                    exists = template != null && template.IsBuiltIn;
                }
                else if (String.Equals(reference.Kind, "HarnessProfile", StringComparison.OrdinalIgnoreCase))
                {
                    HarnessProfile? profile = await _Database.HarnessProfiles.ReadByNameAsync(tenantId, reference.Name, token).ConfigureAwait(false);
                    exists = profile != null && profile.IsBuiltIn;
                }
                if (exists) continue;
                string field = "spec.requiredBuiltIns[" + i.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                errors[field] = "Built-in " + reference + " does not exist on this server.";
                codes[field] = "MissingBuiltIn";
                missing.Add("built-in " + reference);
            }
            if (errors.Count > 0)
            {
                throw new ValidationException("Bundle " + document.Metadata.Name + " needs what this tenant does not have: " + String.Join(", ", missing) + ".", errors, codes);
            }
            planned.Result = ManifestApplyResultEnum.Unchanged;
            planned.Message = "Bundle requirements are met (" + spec.RequiredSecrets.Count + " secret(s), " + spec.RequiredArtifactStores.Count + " artifact store(s), " + spec.RequiredBuiltIns.Count + " built-in(s)).";
        }

        private async Task PlanSecretAsync(string tenantId, ManifestDocument document, ManifestApplyOptions options, Resolver resolver, Planned planned, CancellationToken token)
        {
            SecretSpec spec = Deserialize<SecretSpec>(document);
            if (spec.Kind == SecretKindEnum.LeaseBroker && (String.IsNullOrWhiteSpace(spec.BrokerResource) || spec.BrokerResource.Length > 512 || spec.BrokerAudience?.Length > 512 || spec.Value != null))
                throw new ValidationException("LeaseBroker secrets require resource metadata and reject reusable static values.");
            if (spec.Kind != SecretKindEnum.LeaseBroker && (spec.BrokerResource != null || spec.BrokerAudience != null))
                throw new ValidationException("Broker metadata requires kind LeaseBroker.");
            Dictionary<string, string> expiryErrors = new Dictionary<string, string>();
            if (!ConfigurationValidator.SecretExpiry(spec.ExpiresUtc, DateTime.UtcNow, expiryErrors, "spec.expiresUtc"))
            {
                throw new ValidationException("Secret " + document.Metadata.Name + " has an invalid expiry.", expiryErrors, new Dictionary<string, string> { { "spec.expiresUtc", "ExpiryInPast" } });
            }
            Secret? existing = await _Database.Secrets.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            Dictionary<string, object?>? beforeTree = existing == null ? null : SecretTree(existing);
            Secret secret = existing ?? new Secret();
            secret.TenantId = tenantId;
            secret.Name = document.Metadata.Name;
            secret.Kind = spec.Kind;
            secret.BrokerResource = spec.BrokerResource;
            secret.BrokerAudience = spec.BrokerAudience;
            if (spec.Kind == SecretKindEnum.LeaseBroker) { secret.ValueEncrypted = null; secret.ValueLast4 = null; secret.Fingerprint = null; }
            secret.Description = spec.Description;
            secret.ExpiresUtc = spec.ExpiresUtc;
            bool valueChanged = false;
            if (!String.IsNullOrEmpty(spec.Value))
            {
                if (!options.AllowSecretValues) throw new ValidationException("Secret " + secret.Name + " carries a value but this apply does not allow secret values.");
                string fingerprint = _Cipher.Fingerprint(spec.Value);
                valueChanged = existing == null || existing.Fingerprint != fingerprint;
                secret.ValueEncrypted = _Cipher.Encrypt(spec.Value, secret.Id);
                secret.ValueLast4 = SecretGenerator.Last4(spec.Value);
                secret.Fingerprint = fingerprint;
                secret.KeyVersion = _Cipher.KeyVersion;
                if (valueChanged)
                {
                    secret.RotatedUtc = DateTime.UtcNow;
                    SecretValueState.Reset(secret, spec.Value);
                }
            }
            Dictionary<string, string> errors = new Dictionary<string, string>();
            ConfigurationValidator.Name(secret.Name, errors);
            if (errors.Count > 0) throw new ValidationException("Secret " + secret.Name + " is invalid.", errors);

            planned.Model = secret;
            planned.ResourceId = secret.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (valueChanged || !Same(beforeTree!, SecretTree(secret)) ? ManifestApplyResultEnum.Updated : ManifestApplyResultEnum.Unchanged);
            if (planned.Result == ManifestApplyResultEnum.Updated)
            {
                planned.Changes = Diff(beforeTree!, SecretTree(secret));
                if (valueChanged) planned.Changes.Add(new ManifestFieldChange("value", "(hidden)", "(hidden, changed)"));
            }
            resolver.Add("Secret", secret.Name, secret.Id);
        }

        private async Task PlanPromptAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            PromptTemplateSpec spec = Deserialize<PromptTemplateSpec>(document);
            ConfigurationValidator.PromptTemplate(document.Metadata.Name, spec.Content);
            PromptTemplate? existing = await _Database.PromptTemplates.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            if (existing != null && existing.TenantId != tenantId) existing = null;
            PromptTemplate template = existing ?? new PromptTemplate();
            bool contentChanged = existing == null || existing.Content != spec.Content;
            PromptTemplate before = existing == null ? new PromptTemplate() : Copy(existing);
            template.TenantId = tenantId;
            template.Name = document.Metadata.Name;
            template.Kind = spec.Kind;
            template.Description = spec.Description;
            template.Content = spec.Content;
            if (existing == null) template.CurrentVersion = 1;
            else if (contentChanged) template.CurrentVersion = existing.CurrentVersion + 1;
            template.Variables = TemplateAnalyzer.Analyze(spec.Content, template.Name, false).Variables.Select(v => new PromptTemplateVariable { Name = v }).ToList();

            planned.Model = template;
            planned.ResourceId = template.Id;
            planned.ContentChanged = contentChanged;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (!Same(PromptTree(before), PromptTree(template)) ? ManifestApplyResultEnum.Updated : ManifestApplyResultEnum.Unchanged);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(PromptTree(before), PromptTree(template));
            resolver.Add("PromptTemplate", template.Name, template.Id);
        }

        private async Task PlanProfileAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            HarnessProfile profile = Deserialize<HarnessProfile>(document);
            HarnessProfile? existing = await _Database.HarnessProfiles.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            if (existing != null && existing.TenantId != tenantId) existing = null;
            profile.Name = document.Metadata.Name;
            profile.TenantId = tenantId;
            profile.IsBuiltIn = false;
            if (existing != null)
            {
                profile.Id = existing.Id;
                profile.CreatedUtc = existing.CreatedUtc;
                profile.IsProtected = existing.IsProtected;
                profile.BuiltInKey = existing.BuiltInKey;
            }
            ConfigurationValidator.HarnessProfile(profile);
            planned.Model = profile;
            planned.ResourceId = profile.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (Same(Tree(existing), Tree(profile)) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(Tree(existing!), Tree(profile));
            resolver.Add("HarnessProfile", profile.Name, profile.Id);
        }

        private async Task PlanMcpServerAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            McpServer server = Deserialize<McpServer>(document);
            McpServer? existing = await _Database.McpServers.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            server.Name = document.Metadata.Name;
            server.TenantId = tenantId;
            if (existing != null)
            {
                server.Id = existing.Id;
                server.CreatedUtc = existing.CreatedUtc;
            }
            ConfigurationValidator.McpServer(server);
            planned.Model = server;
            planned.ResourceId = server.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (Same(Tree(existing), Tree(server)) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(Tree(existing!), Tree(server));
            resolver.Add("McpServer", server.Name, server.Id);
        }

        private async Task PlanWorkspaceAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            string? secretName = Take(document.Spec, "gitCredentialSecret");
            WorkspaceTemplate workspace = Deserialize<WorkspaceTemplate>(document);
            WorkspaceTemplate? existing = await _Database.WorkspaceTemplates.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            workspace.Name = document.Metadata.Name;
            workspace.TenantId = tenantId;
            if (!String.IsNullOrEmpty(secretName)) workspace.GitCredentialSecretId = await resolver.RequireAsync("Secret", secretName, "gitCredentialSecret", token).ConfigureAwait(false);
            if (existing != null)
            {
                workspace.Id = existing.Id;
                workspace.CreatedUtc = existing.CreatedUtc;
            }
            ConfigurationValidator.Workspace(workspace);
            planned.Model = workspace;
            planned.ResourceId = workspace.Id;
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (Same(Tree(existing), Tree(workspace)) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(Tree(existing!), Tree(workspace));
            resolver.Add("WorkspaceTemplate", workspace.Name, workspace.Id);
        }

        private async Task PlanAgentAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            Dictionary<string, object?> spec = document.Spec;
            if (spec.TryGetValue("exposure", out object? exposureValue) && exposureValue is Dictionary<string, object?> exposure)
            {
                if (exposure.TryGetValue("a2a", out object? a2a)) spec["exposeA2A"] = a2a;
                if (exposure.TryGetValue("mcpTool", out object? mcpTool)) spec["exposeMcpTool"] = mcpTool;
                if (exposure.TryGetValue("toolName", out object? toolName)) spec["mcpToolName"] = toolName;
                spec.Remove("exposure");
            }
            if (spec.TryGetValue("delegation", out object? delegationValue) && delegationValue is Dictionary<string, object?> delegation)
            {
                if (delegation.TryGetValue("maxDepth", out object? maxDepth)) spec["delegationMaxDepth"] = maxDepth;
                if (delegation.TryGetValue("allowRecursion", out object? recursion)) spec["delegationAllowRecursion"] = recursion;
                if (delegation.TryGetValue("allow", out object? allow)) spec["delegationAllowList"] = allow;
                if (delegation.TryGetValue("mode", out object? mode)) spec["delegationMode"] = mode;
                else spec["delegationMode"] = allow is List<object?> list && list.Count > 0 ? "AllowList" : "None";
                spec.Remove("delegation");
            }
            if (spec.TryGetValue("inputSchema", out object? input) && input is Dictionary<string, object?>)
            {
                spec["inputSchemaJson"] = TemplateValues.ToJson(input);
                spec.Remove("inputSchema");
            }
            if (spec.TryGetValue("outputSchema", out object? output) && output is Dictionary<string, object?>)
            {
                spec["outputSchemaJson"] = TemplateValues.ToJson(output);
                spec.Remove("outputSchema");
            }
            string? toolTemplate = Take(spec, "toolDescriptionTemplate");
            string? skillTemplate = Take(spec, "skillDescriptionTemplate");
            string? remoteSecret = Take(spec, "remoteCredentialSecret");

            Agent agent = Deserialize<Agent>(document);
            Agent? existing = await _Database.Agents.ReadByNameAsync(tenantId, document.Metadata.Name, token).ConfigureAwait(false);
            agent.Name = document.Metadata.Name;
            agent.TenantId = tenantId;
            if (!String.IsNullOrEmpty(toolTemplate)) agent.ToolDescriptionTemplateId = await resolver.RequireAsync("PromptTemplate", toolTemplate, "toolDescriptionTemplate", token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(skillTemplate)) agent.SkillDescriptionTemplateId = await resolver.RequireAsync("PromptTemplate", skillTemplate, "skillDescriptionTemplate", token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(remoteSecret)) agent.RemoteCredentialSecretId = await resolver.RequireAsync("Secret", remoteSecret, "remoteCredentialSecret", token).ConfigureAwait(false);
            if (existing != null)
            {
                agent.Id = existing.Id;
                agent.CreatedUtc = existing.CreatedUtc;
                agent.LastRegisteredUtc = existing.LastRegisteredUtc;
            }
            ConfigurationValidator.Agent(agent);
            planned.Model = agent;
            planned.ResourceId = agent.Id;
            if (existing == null)
            {
                planned.Result = ManifestApplyResultEnum.Created;
            }
            else
            {
                Dictionary<string, object?> agentBefore = await AgentTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> agentAfter = await AgentTreeAsync(agent, resolver, token).ConfigureAwait(false);
                planned.Result = Same(agentBefore, agentAfter) ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated;
                if (planned.Result == ManifestApplyResultEnum.Updated) planned.Changes = Diff(agentBefore, agentAfter);
            }
            resolver.Add("Agent", agent.Name, agent.Id);
        }

        private async Task PlanDeploymentAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            foreach (string mapKey in new string[] { "parameters", "nodeSelector", "prompts" })
            {
                if (document.Spec.TryGetValue(mapKey, out object? mapValue) && mapValue is Dictionary<string, object?> stringMap)
                {
                    foreach (string key in stringMap.Keys.ToList()) stringMap[key] = TemplateValues.ToText(stringMap[key]);
                }
            }
            DeploymentSpec spec = Deserialize<DeploymentSpec>(document);
            Deployment deployment = new Deployment();
            deployment.TenantId = tenantId;
            deployment.Name = document.Metadata.Name;
            deployment.Description = spec.Description;
            deployment.AgentId = await resolver.RequireAsync("Agent", spec.Agent, "agent", token).ConfigureAwait(false);
            deployment.HarnessProfileId = await resolver.RequireAsync("HarnessProfile", spec.HarnessProfile, "harnessProfile", token).ConfigureAwait(false);
            deployment.Model = spec.Model;
            deployment.FallbackModel = spec.FallbackModel;
            deployment.Effort = spec.Effort;
            deployment.MaxTurns = spec.MaxTurns;
            deployment.MaxBudgetUsd = spec.MaxBudgetUsd;
            deployment.MaxConcurrentRuns = spec.MaxConcurrentRuns;
            deployment.TimeoutSeconds = spec.TimeoutSeconds;
            deployment.RepetitionGuard = spec.RepetitionGuard;
            deployment.MaxAssistantChars = spec.MaxAssistantChars;
            deployment.NoProgressSeconds = spec.NoProgressSeconds;
            deployment.MaxAttempts = spec.MaxAttempts;
            if (spec.RetryOnNodeLoss.HasValue) deployment.RetryOnNodeLoss = spec.RetryOnNodeLoss.Value;
            if (spec.EffectPolicy.HasValue) deployment.EffectPolicy = spec.EffectPolicy.Value;
            deployment.Executor = spec.Executor;
            deployment.TrustLevel = spec.TrustLevel ?? DeploymentTrustLevelEnum.Trusted;
            deployment.RequiredCapabilities = spec.RequiredCapabilities?.Clone() ?? new ExecutorRequirements();
            deployment.PodResources = spec.PodResources == null ? new RunPodResources() : spec.PodResources.Clone();
            deployment.Weight = spec.Weight;
            if (!String.IsNullOrEmpty(spec.Workspace)) deployment.WorkspaceTemplateId = await resolver.RequireAsync("WorkspaceTemplate", spec.Workspace, "workspace", token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(spec.ArtifactStore))
            {
                ArtifactStore? store = await _Database.ArtifactStores.ReadByNameAsync(tenantId, spec.ArtifactStore, token).ConfigureAwait(false);
                if (store == null) throw new ValidationException("Deployment " + deployment.Name + ": artifact store '" + spec.ArtifactStore + "' was not found.", new Dictionary<string, string> { { "artifactStore", "Artifact store '" + spec.ArtifactStore + "' does not exist in this tenant." } }, new Dictionary<string, string> { { "artifactStore", "MissingArtifactStore" } });
                deployment.ArtifactStoreId = store.Id;
            }

            deployment.ArtifactGlobs = spec.ArtifactGlobs == null ? new List<string>() : new List<string>(spec.ArtifactGlobs);
            deployment.EgressRules = spec.EgressRules == null ? new List<DeploymentEgressRule>() : spec.EgressRules.Select(r => r == null ? new DeploymentEgressRule() : r.Clone()).ToList();

            foreach (KeyValuePair<string, string> prompt in spec.Prompts)
            {
                string templateName = prompt.Value;
                int? version = null;
                int at = templateName.LastIndexOf('@');
                if (at > 0 && Int32.TryParse(templateName.Substring(at + 1), out int parsed))
                {
                    version = parsed;
                    templateName = templateName.Substring(0, at);
                }
                DeploymentPromptBinding binding = new DeploymentPromptBinding();
                binding.Role = prompt.Key;
                binding.TemplateId = await resolver.RequireAsync("PromptTemplate", templateName, "prompts." + prompt.Key, token).ConfigureAwait(false);
                binding.PinnedVersion = version;
                deployment.PromptBindings.Add(binding);
            }
            DefaultPromptBindings.Apply(deployment);
            foreach (AliasReferenceSpec reference in spec.Resources.Secrets)
            {
                DeploymentResourceBinding binding = new DeploymentResourceBinding();
                binding.Kind = ResourceBindingKindEnum.Secret;
                binding.Alias = reference.Alias;
                binding.ResourceId = await resolver.RequireAsync("Secret", reference.Secret ?? String.Empty, "resources.secrets." + reference.Alias, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(binding);
            }
            foreach (AliasReferenceSpec reference in spec.Resources.McpServers)
            {
                DeploymentResourceBinding binding = new DeploymentResourceBinding();
                binding.Kind = ResourceBindingKindEnum.McpServer;
                binding.Alias = String.IsNullOrEmpty(reference.Alias) ? reference.Server ?? String.Empty : reference.Alias;
                binding.ResourceId = await resolver.RequireAsync("McpServer", reference.Server ?? String.Empty, "resources.mcpServers." + binding.Alias, token).ConfigureAwait(false);
                deployment.ResourceBindings.Add(binding);
            }
            foreach (KeyValuePair<string, string> parameter in spec.Parameters) deployment.Parameters.Add(new DeploymentParameter { Name = parameter.Key, Value = parameter.Value });
            foreach (KeyValuePair<string, string> selector in spec.NodeSelector) deployment.NodeSelector.Add(new DeploymentNodeSelector { Key = selector.Key, Value = selector.Value });
            deployment.AllowedRunOverrides = spec.AllowedRunOverrides;
            deployment.ApprovalsEnabled = spec.ApprovalsEnabled;
            deployment.ApprovalDefaultAction = spec.ApprovalDefaultAction;
            deployment.ApprovalTimeoutSeconds = spec.ApprovalTimeoutSeconds;
            deployment.ApprovalTimeoutDecision = spec.ApprovalTimeoutDecision;
            deployment.ApprovalRules = spec.ApprovalRules;
            deployment.ArgumentOverrides = spec.ArgumentOverrides;
            deployment.EnvironmentOverrides = spec.EnvironmentOverrides;
            deployment.FileOverrides = spec.FileOverrides;

            Deployment? existing = await _Database.Deployments.ReadByNameAsync(tenantId, deployment.Name, token).ConfigureAwait(false);
            if (existing != null)
            {
                deployment.Id = existing.Id;
                deployment.CreatedUtc = existing.CreatedUtc;
                deployment.ConfigVersion = existing.ConfigVersion;
                // Keep approval rule identifiers for unchanged rules: approvals record the rule that decided them.
                foreach (DeploymentApprovalRule rule in deployment.ApprovalRules)
                {
                    DeploymentApprovalRule? same = existing.ApprovalRules.FirstOrDefault(r => r.Action == rule.Action && r.Pattern == rule.Pattern && r.InputPattern == rule.InputPattern);
                    if (same != null && !deployment.ApprovalRules.Any(r => r.Id == same.Id)) rule.Id = same.Id;
                }
            }
            Dictionary<string, string> errors = new Dictionary<string, string>();
            ConfigurationValidator.Name(deployment.Name, errors);
            if (errors.Count > 0) throw new ValidationException("Deployment " + deployment.Name + " is invalid.", errors);
            if (deployment.EffectPolicyConflict)
            {
                // P12.29: reported at plan time, so a dry run shows it too, with the conflict as the item's error code.
                Dictionary<string, string> conflict = new Dictionary<string, string>();
                conflict["effectPolicy"] = "effectPolicy " + deployment.EffectPolicy + " disagrees with the deprecated retryOnNodeLoss value. Keep only effectPolicy (retryOnNodeLoss true means AtLeastOnce, false means AtMostOnce).";
                Dictionary<string, string> codes = new Dictionary<string, string>();
                codes["effectPolicy"] = "EffectPolicyConflict";
                ValidationException rejected = new ValidationException("Deployment " + deployment.Name + " is invalid.", conflict, codes);
                rejected.Code = "EffectPolicyConflict";
                throw rejected;
            }

            planned.Model = deployment;
            planned.ResourceId = deployment.Id;
            bool unchanged = false;
            if (existing != null)
            {
                Dictionary<string, object?> deploymentBefore = await DeploymentTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> deploymentAfter = await DeploymentTreeAsync(deployment, resolver, token).ConfigureAwait(false);
                unchanged = Same(deploymentBefore, deploymentAfter);
                if (!unchanged) planned.Changes = Diff(deploymentBefore, deploymentAfter);
            }
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (unchanged ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (existing != null && !unchanged) deployment.ConfigVersion = existing.ConfigVersion + 1;
            resolver.Add("Deployment", deployment.Name, deployment.Id);
        }

        private async Task PlanPipelineAsync(string tenantId, ManifestDocument document, Resolver resolver, Planned planned, CancellationToken token)
        {
            if (document.Spec.TryGetValue("stages", out object? stagesValue) && stagesValue is List<object?> stageList)
            {
                foreach (object? item in stageList)
                {
                    if (item is Dictionary<string, object?> stageMap && stageMap.TryGetValue("parameters", out object? mapValue) && mapValue is Dictionary<string, object?> stringMap)
                    {
                        foreach (string key in stringMap.Keys.ToList()) stringMap[key] = TemplateValues.ToText(stringMap[key]);
                    }
                }
            }
            PipelineSpec spec = Deserialize<PipelineSpec>(document);
            Pipeline pipeline = new Pipeline();
            pipeline.TenantId = tenantId;
            pipeline.Name = document.Metadata.Name;
            pipeline.Description = spec.Description;
            pipeline.MaxDurationSeconds = spec.MaxDurationSeconds ?? 0;
            pipeline.Active = spec.Active ?? true;
            for (int i = 0; i < spec.Stages.Count; i++)
            {
                PipelineStageSpec stageSpec = spec.Stages[i];
                string field = "stages[" + i + "]";
                PipelineStage stage = new PipelineStage();
                stage.Name = stageSpec.Name;
                stage.Description = stageSpec.Description;
                stage.AgentId = await resolver.RequireAsync("Agent", stageSpec.Agent, field + ".agent", token).ConfigureAwait(false);
                if (!String.IsNullOrWhiteSpace(stageSpec.Deployment)) stage.DeploymentId = await resolver.RequireAsync("Deployment", stageSpec.Deployment, field + ".deployment", token).ConfigureAwait(false);
                if (!String.IsNullOrWhiteSpace(stageSpec.HandoffTemplate))
                {
                    string templateName = stageSpec.HandoffTemplate.Trim();
                    int at = templateName.LastIndexOf('@');
                    if (at > 0 && Int32.TryParse(templateName.Substring(at + 1), System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out int pinned))
                    {
                        stage.HandoffTemplateVersion = pinned;
                        templateName = templateName.Substring(0, at);
                    }
                    stage.HandoffTemplateId = await resolver.RequireAsync("PromptTemplate", templateName, field + ".handoffTemplate", token).ConfigureAwait(false);
                }
                stage.OutputCharLimit = stageSpec.OutputCharLimit ?? 16000;
                stage.MaxAttempts = stageSpec.MaxAttempts ?? 1;
                stage.ContinueOnFailure = stageSpec.ContinueOnFailure ?? false;
                stage.RequiresReview = stageSpec.RequiresReview ?? false;
                stage.ReviewTimeoutSeconds = stageSpec.ReviewTimeoutSeconds ?? 0;
                stage.ReviewTimeoutAction = stageSpec.ReviewTimeoutAction ?? PipelineReviewDecisionEnum.Reject;
                stage.MaxRevisions = stageSpec.MaxRevisions ?? 3;
                foreach (KeyValuePair<string, string> parameter in stageSpec.Parameters.OrderBy(p => p.Key, StringComparer.Ordinal))
                {
                    stage.Parameters.Add(new PipelineStageParameter { Name = parameter.Key, Value = parameter.Value ?? String.Empty });
                }
                pipeline.Stages.Add(stage);
            }

            Pipeline? existing = await _Database.Pipelines.ReadByNameAsync(tenantId, pipeline.Name, token).ConfigureAwait(false);
            if (existing != null)
            {
                if (existing.IsProtected) throw new ValidationException("Pipeline " + existing.Name + " is protected and cannot be changed by a manifest.");
                pipeline.Id = existing.Id;
                pipeline.CreatedUtc = existing.CreatedUtc;
                pipeline.Version = existing.Version;
            }
            planned.Model = pipeline;
            planned.ResourceId = pipeline.Id;
            bool unchanged = false;
            if (existing != null)
            {
                Dictionary<string, object?> before = await PipelineTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> after = await PipelineTreeAsync(pipeline, resolver, token).ConfigureAwait(false);
                unchanged = Same(before, after);
                if (!unchanged) planned.Changes = Diff(before, after);
            }
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (unchanged ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (existing != null && !unchanged) pipeline.Version = existing.Version + 1;
            resolver.Add("Pipeline", pipeline.Name, pipeline.Id);
        }

        private async Task<Dictionary<string, object?>> PipelineTreeAsync(Pipeline pipeline, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            if (pipeline.Description != null) tree["description"] = pipeline.Description;
            if (pipeline.MaxDurationSeconds > 0) tree["maxDurationSeconds"] = (long)pipeline.MaxDurationSeconds;
            if (!pipeline.Active) tree["active"] = false;
            List<object?> stages = new List<object?>();
            foreach (PipelineStage stage in pipeline.Stages)
            {
                Dictionary<string, object?> item = new Dictionary<string, object?>();
                item["name"] = stage.Name;
                if (stage.Description != null) item["description"] = stage.Description;
                item["agent"] = await resolver.NameAsync("Agent", stage.AgentId, token).ConfigureAwait(false) ?? stage.AgentId;
                if (!String.IsNullOrEmpty(stage.DeploymentId)) item["deployment"] = await resolver.NameAsync("Deployment", stage.DeploymentId, token).ConfigureAwait(false) ?? stage.DeploymentId;
                if (!String.IsNullOrEmpty(stage.HandoffTemplateId))
                {
                    string name = await resolver.NameAsync("PromptTemplate", stage.HandoffTemplateId, token).ConfigureAwait(false) ?? stage.HandoffTemplateId;
                    item["handoffTemplate"] = stage.HandoffTemplateVersion.HasValue ? name + "@" + stage.HandoffTemplateVersion.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : name;
                }
                if (stage.OutputCharLimit != 16000) item["outputCharLimit"] = (long)stage.OutputCharLimit;
                if (stage.MaxAttempts != 1) item["maxAttempts"] = (long)stage.MaxAttempts;
                if (stage.ContinueOnFailure) item["continueOnFailure"] = true;
                if (stage.RequiresReview) item["requiresReview"] = true;
                if (stage.ReviewTimeoutSeconds > 0) item["reviewTimeoutSeconds"] = (long)stage.ReviewTimeoutSeconds;
                if (stage.ReviewTimeoutAction != PipelineReviewDecisionEnum.Reject) item["reviewTimeoutAction"] = stage.ReviewTimeoutAction.ToString();
                if (stage.MaxRevisions != 3) item["maxRevisions"] = (long)stage.MaxRevisions;
                if (stage.Parameters.Count > 0)
                {
                    Dictionary<string, object?> parameters = new Dictionary<string, object?>();
                    foreach (PipelineStageParameter parameter in stage.Parameters.OrderBy(p => p.Name, StringComparer.Ordinal)) parameters[parameter.Name] = parameter.Value;
                    item["parameters"] = parameters;
                }
                stages.Add(item);
            }
            tree["stages"] = stages;
            return tree;
        }

        private async Task PlanTriggerAsync(string tenantId, ManifestDocument document, ManifestApplyOptions options, Resolver resolver, Planned planned, CancellationToken token)
        {
            TriggerSpec spec = Deserialize<TriggerSpec>(document);
            Trigger trigger = new Trigger();
            trigger.TenantId = tenantId;
            trigger.Name = document.Metadata.Name;
            trigger.Description = spec.Description;
            trigger.Type = spec.Type ?? TriggerTypeEnum.Cron;
            if (!String.IsNullOrWhiteSpace(spec.Pipeline))
            {
                trigger.TargetType = TriggerTargetTypeEnum.Pipeline;
                trigger.PipelineId = await resolver.RequireAsync("Pipeline", spec.Pipeline, "spec.pipeline", token).ConfigureAwait(false);
                if (!String.IsNullOrWhiteSpace(spec.Agent)) throw new ValidationException("Trigger " + trigger.Name + " names both an agent and a pipeline; give one.");
            }
            else
            {
                trigger.TargetType = TriggerTargetTypeEnum.Agent;
                trigger.AgentId = String.IsNullOrWhiteSpace(spec.Agent) ? null : await resolver.RequireAsync("Agent", spec.Agent, "spec.agent", token).ConfigureAwait(false);
            }
            if (!String.IsNullOrWhiteSpace(spec.Deployment)) trigger.DeploymentId = await resolver.RequireAsync("Deployment", spec.Deployment, "spec.deployment", token).ConfigureAwait(false);
            if (!String.IsNullOrWhiteSpace(spec.InputTemplate)) trigger.InputTemplateId = await resolver.RequireAsync("PromptTemplate", spec.InputTemplate, "spec.inputTemplate", token).ConfigureAwait(false);
            trigger.Priority = spec.Priority ?? 0;
            trigger.CronExpression = String.IsNullOrWhiteSpace(spec.Cron) ? null : spec.Cron.Trim();
            trigger.TimeZone = spec.TimeZone ?? "UTC";
            trigger.Active = spec.Active ?? true;

            Trigger? existing = await _Database.Triggers.ReadByNameAsync(tenantId, trigger.Name, token).ConfigureAwait(false);
            if (existing != null)
            {
                if (existing.Type != trigger.Type) throw new ValidationException("Trigger " + existing.Name + " is a " + existing.Type + " trigger; the type cannot change. Delete it and apply it again to change the type.", new Dictionary<string, string> { { "spec.type", "The type cannot change." } }, new Dictionary<string, string> { { "spec.type", "TypeImmutable" } });
                trigger.Id = existing.Id;
                trigger.CreatedUtc = existing.CreatedUtc;
                trigger.SecretEncrypted = existing.SecretEncrypted;
                trigger.SecretKeyVersion = existing.SecretKeyVersion;
                trigger.SigningSecretLast4 = existing.SigningSecretLast4;
                trigger.SigningSecretRotatedUtc = existing.SigningSecretRotatedUtc;
                trigger.RunAsType = existing.RunAsType;
                trigger.RunAsId = existing.RunAsId;
                trigger.RunAsName = existing.RunAsName;
                trigger.LastFireUtc = existing.LastFireUtc;
                trigger.LastFireOutcome = existing.LastFireOutcome;
                trigger.FireCount = existing.FireCount;
            }
            // References may be defined earlier in this manifest, so the full validation runs when the trigger is written;
            // the schedule is checked now so a dry run reports it.
            if (trigger.Type == TriggerTypeEnum.Cron && !CronSchedule.Validate(trigger.CronExpression, trigger.TimeZone, out string? cronError, out string? zoneError))
            {
                Dictionary<string, string> errors = new Dictionary<string, string>();
                Dictionary<string, string> codes = new Dictionary<string, string>();
                if (cronError != null)
                {
                    errors["spec.cron"] = cronError;
                    codes["spec.cron"] = "InvalidCron";
                }
                if (zoneError != null)
                {
                    errors["spec.timeZone"] = zoneError;
                    codes["spec.timeZone"] = "InvalidTimeZone";
                }
                throw new ValidationException("Trigger " + trigger.Name + " has an invalid schedule.", errors, codes);
            }

            bool secretChanged = false;
            if (!String.IsNullOrEmpty(spec.SigningSecret))
            {
                if (!options.AllowSecretValues) throw new ValidationException("Trigger " + trigger.Name + " carries a signing secret but this apply does not allow secret values.");
                if (trigger.Type != TriggerTypeEnum.Webhook) throw new ValidationException("Trigger " + trigger.Name + " is a Cron trigger; only Webhook triggers have a signing secret.");
                string? invalid = SigningSecrets.Validate(spec.SigningSecret);
                if (invalid != null) throw new ValidationException("Trigger " + trigger.Name + ": " + invalid, new Dictionary<string, string> { { "spec.signingSecret", invalid } });
                string? current = existing == null ? null : SigningSecrets.Read(existing, _Cipher);
                if (!String.Equals(current, spec.SigningSecret, StringComparison.Ordinal))
                {
                    SigningSecrets.Apply(trigger, spec.SigningSecret, _Cipher);
                    secretChanged = true;
                }
            }
            else if (trigger.Type == TriggerTypeEnum.Webhook && String.IsNullOrEmpty(trigger.SecretEncrypted))
            {
                SigningSecrets.Apply(trigger, WebhookSigner.NewSecret(), _Cipher);
                secretChanged = existing != null;
                planned.Message = "A signing secret was generated; rotate it (POST .../triggers/{id}/rotate-secret) to read it.";
            }

            planned.Model = trigger;
            planned.ResourceId = trigger.Id;
            bool unchanged = false;
            if (existing != null)
            {
                Dictionary<string, object?> before = await TriggerTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> after = await TriggerTreeAsync(trigger, resolver, token).ConfigureAwait(false);
                unchanged = Same(before, after) && !secretChanged;
                if (!unchanged)
                {
                    planned.Changes = Diff(before, after);
                    if (secretChanged) planned.Changes.Add(new ManifestFieldChange("signingSecret", "(hidden)", "(hidden, changed)"));
                }
            }
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (unchanged ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            if (planned.Result != ManifestApplyResultEnum.Unchanged)
            {
                // A written trigger runs as the principal that applied the manifest.
                trigger.RunAsType = options.PrincipalType;
                trigger.RunAsId = options.PrincipalId;
                trigger.RunAsName = options.PrincipalName;
            }
            planned.Previous = existing;
            resolver.Add("Trigger", trigger.Name, trigger.Id);
        }

        private async Task<Dictionary<string, object?>> TriggerTreeAsync(Trigger trigger, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            if (trigger.Description != null) tree["description"] = trigger.Description;
            tree["type"] = trigger.Type.ToString();
            if (trigger.TargetType == TriggerTargetTypeEnum.Pipeline)
            {
                tree["pipeline"] = await resolver.NameAsync("Pipeline", trigger.PipelineId, token).ConfigureAwait(false) ?? trigger.PipelineId;
            }
            else
            {
                tree["agent"] = await resolver.NameAsync("Agent", trigger.AgentId, token).ConfigureAwait(false) ?? trigger.AgentId;
                if (!String.IsNullOrEmpty(trigger.DeploymentId)) tree["deployment"] = await resolver.NameAsync("Deployment", trigger.DeploymentId, token).ConfigureAwait(false) ?? trigger.DeploymentId;
            }
            if (!String.IsNullOrEmpty(trigger.InputTemplateId)) tree["inputTemplate"] = await resolver.NameAsync("PromptTemplate", trigger.InputTemplateId, token).ConfigureAwait(false) ?? trigger.InputTemplateId;
            if (trigger.Priority != 0) tree["priority"] = (long)trigger.Priority;
            if (!String.IsNullOrEmpty(trigger.CronExpression)) tree["cron"] = trigger.CronExpression;
            if (trigger.Type == TriggerTypeEnum.Cron && !String.Equals(trigger.TimeZone, "UTC", StringComparison.Ordinal)) tree["timeZone"] = trigger.TimeZone;
            if (!trigger.Active) tree["active"] = false;
            return tree;
        }

        private async Task PlanNotificationEndpointAsync(string tenantId, ManifestDocument document, ManifestApplyOptions options, Resolver resolver, Planned planned, CancellationToken token)
        {
            NotificationEndpointSpec spec = Deserialize<NotificationEndpointSpec>(document);
            NotificationEndpoint endpoint = new NotificationEndpoint();
            endpoint.TenantId = tenantId;
            endpoint.Name = document.Metadata.Name;
            endpoint.Description = spec.Description;
            endpoint.Url = spec.Url ?? String.Empty;
            endpoint.Events = spec.Events ?? new List<NotificationEventEnum>();
            if (!String.IsNullOrWhiteSpace(spec.Agent)) endpoint.AgentId = await resolver.RequireAsync("Agent", spec.Agent, "spec.agent", token).ConfigureAwait(false);
            if (!String.IsNullOrWhiteSpace(spec.Deployment)) endpoint.DeploymentId = await resolver.RequireAsync("Deployment", spec.Deployment, "spec.deployment", token).ConfigureAwait(false);
            endpoint.IncludeResultText = spec.IncludeResultText ?? false;
            endpoint.ResultTextMaxChars = spec.ResultTextMaxChars ?? 1000;
            endpoint.Active = spec.Active ?? true;

            NotificationEndpoint? existing = await _Database.NotificationEndpoints.ReadByNameAsync(tenantId, endpoint.Name, token).ConfigureAwait(false);
            if (existing != null)
            {
                endpoint.Id = existing.Id;
                endpoint.CreatedUtc = existing.CreatedUtc;
                endpoint.SecretEncrypted = existing.SecretEncrypted;
                endpoint.SecretKeyVersion = existing.SecretKeyVersion;
                endpoint.SigningSecretLast4 = existing.SigningSecretLast4;
                endpoint.SigningSecretRotatedUtc = existing.SigningSecretRotatedUtc;
            }
            DestinationBlockReasonEnum blocked = DestinationGuard.CheckUrl(endpoint.Url, AllowPrivateNotificationDestinations, out Uri? _);
            if (blocked != DestinationBlockReasonEnum.None)
            {
                string code = blocked == DestinationBlockReasonEnum.InvalidUrl || blocked == DestinationBlockReasonEnum.Scheme ? "InvalidUrl" : "DestinationBlocked";
                throw new ValidationException("Notification endpoint " + endpoint.Name + " has a refused URL (" + blocked + ").", new Dictionary<string, string> { { "spec.url", "The destination is refused (" + blocked + ")." } }, new Dictionary<string, string> { { "spec.url", code } });
            }

            bool secretChanged = false;
            if (!String.IsNullOrEmpty(spec.SigningSecret))
            {
                if (!options.AllowSecretValues) throw new ValidationException("Notification endpoint " + endpoint.Name + " carries a signing secret but this apply does not allow secret values.");
                string? invalid = SigningSecrets.Validate(spec.SigningSecret);
                if (invalid != null) throw new ValidationException("Notification endpoint " + endpoint.Name + ": " + invalid, new Dictionary<string, string> { { "spec.signingSecret", invalid } });
                string? current = existing == null ? null : SigningSecrets.Read(existing, _Cipher);
                if (!String.Equals(current, spec.SigningSecret, StringComparison.Ordinal))
                {
                    SigningSecrets.Apply(endpoint, spec.SigningSecret, _Cipher);
                    secretChanged = true;
                }
            }
            else if (String.IsNullOrEmpty(endpoint.SecretEncrypted))
            {
                SigningSecrets.Apply(endpoint, WebhookSigner.NewSecret(), _Cipher);
                secretChanged = existing != null;
                planned.Message = "A signing secret was generated; rotate it (POST .../notification-endpoints/{id}/rotate-secret) to read it.";
            }

            planned.Model = endpoint;
            planned.ResourceId = endpoint.Id;
            bool unchanged = false;
            if (existing != null)
            {
                Dictionary<string, object?> before = await NotificationEndpointTreeAsync(existing, resolver, token).ConfigureAwait(false);
                Dictionary<string, object?> after = await NotificationEndpointTreeAsync(endpoint, resolver, token).ConfigureAwait(false);
                unchanged = Same(before, after) && !secretChanged;
                if (!unchanged)
                {
                    planned.Changes = Diff(before, after);
                    if (secretChanged) planned.Changes.Add(new ManifestFieldChange("signingSecret", "(hidden)", "(hidden, changed)"));
                }
            }
            planned.Result = existing == null ? ManifestApplyResultEnum.Created : (unchanged ? ManifestApplyResultEnum.Unchanged : ManifestApplyResultEnum.Updated);
            resolver.Add("NotificationEndpoint", endpoint.Name, endpoint.Id);
        }

        private async Task<Dictionary<string, object?>> NotificationEndpointTreeAsync(NotificationEndpoint endpoint, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            if (endpoint.Description != null) tree["description"] = endpoint.Description;
            tree["url"] = endpoint.Url;
            tree["events"] = endpoint.Events.Select(e => (object?)e.ToString()).ToList();
            if (!String.IsNullOrEmpty(endpoint.AgentId)) tree["agent"] = await resolver.NameAsync("Agent", endpoint.AgentId, token).ConfigureAwait(false) ?? endpoint.AgentId;
            if (!String.IsNullOrEmpty(endpoint.DeploymentId)) tree["deployment"] = await resolver.NameAsync("Deployment", endpoint.DeploymentId, token).ConfigureAwait(false) ?? endpoint.DeploymentId;
            if (endpoint.IncludeResultText) tree["includeResultText"] = true;
            if (endpoint.ResultTextMaxChars != 1000) tree["resultTextMaxChars"] = (long)endpoint.ResultTextMaxChars;
            if (!endpoint.Active) tree["active"] = false;
            return tree;
        }

        private async Task WriteAsync(string tenantId, Planned planned, ConfigurationReferenceCache cache, CancellationToken token)
        {
            bool create = planned.Result == ManifestApplyResultEnum.Created;

            // A written record must be read fresh by later documents in the same apply.
            string? kind = Kinds.FirstOrDefault(k => k.Equals(planned.Document.Kind, StringComparison.OrdinalIgnoreCase));
            if (kind != null) cache.Forget(kind);
            switch (planned.Model)
            {
                case Secret secret:
                    if (create) await _Database.Secrets.CreateAsync(secret, token).ConfigureAwait(false);
                    else await _Database.Secrets.UpdateAsync(secret, token).ConfigureAwait(false);
                    break;
                case PromptTemplate template:
                    if (create) await _Database.PromptTemplates.CreateAsync(template, token).ConfigureAwait(false);
                    else await _Database.PromptTemplates.UpdateAsync(template, token).ConfigureAwait(false);
                    if (planned.ContentChanged)
                    {
                        PromptTemplateVersion version = new PromptTemplateVersion();
                        version.TenantId = tenantId;
                        version.TemplateId = template.Id;
                        version.Version = template.CurrentVersion;
                        version.Content = template.Content;
                        version.ChangeNote = "Applied from a manifest.";
                        await _Database.PromptTemplateVersions.CreateAsync(version, token).ConfigureAwait(false);
                    }
                    break;
                case HarnessProfile profile:
                    if (create) await _Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
                    else await _Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                    break;
                case McpServer server:
                    if (create) await _Database.McpServers.CreateAsync(server, token).ConfigureAwait(false);
                    else await _Database.McpServers.UpdateAsync(server, token).ConfigureAwait(false);
                    break;
                case WorkspaceTemplate workspace:
                    if (create) await _Database.WorkspaceTemplates.CreateAsync(workspace, token).ConfigureAwait(false);
                    else await _Database.WorkspaceTemplates.UpdateAsync(workspace, token).ConfigureAwait(false);
                    break;
                case Agent agent:
                    if (create) await _Database.Agents.CreateAsync(agent, token).ConfigureAwait(false);
                    else await _Database.Agents.UpdateAsync(agent, token).ConfigureAwait(false);
                    break;
                case Deployment deployment:
                    await ConfigurationValidator.DeploymentAsync(_Database, tenantId, deployment, cache, token).ConfigureAwait(false);
                    if (create) await _Database.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                    else await _Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                    break;
                case Pipeline pipeline:
                    await ConfigurationValidator.PipelineAsync(_Database, tenantId, pipeline, _MaxPipelineStages, token).ConfigureAwait(false);
                    if (create) await _Database.Pipelines.CreateAsync(pipeline, token).ConfigureAwait(false);
                    else await _Database.Pipelines.UpdateAsync(pipeline, token).ConfigureAwait(false);
                    break;
                case Trigger trigger:
                    await ConfigurationValidator.TriggerAsync(_Database, tenantId, trigger, token).ConfigureAwait(false);
                    trigger.NextFireUtc = CronSchedule.NextFireFor(trigger, planned.Previous as Trigger, DateTime.UtcNow);
                    if (create) await _Database.Triggers.CreateAsync(trigger, token).ConfigureAwait(false);
                    else await _Database.Triggers.UpdateAsync(trigger, token).ConfigureAwait(false);
                    break;
                case NotificationEndpoint endpoint:
                    await ConfigurationValidator.NotificationEndpointAsync(_Database, tenantId, endpoint, AllowPrivateNotificationDestinations, token).ConfigureAwait(false);
                    if (create) await _Database.NotificationEndpoints.CreateAsync(endpoint, token).ConfigureAwait(false);
                    else await _Database.NotificationEndpoints.UpdateAsync(endpoint, token).ConfigureAwait(false);
                    break;
            }
        }

        private static List<FieldWarning> Warnings(object? model)
        {
            // I-08: values the model clamped while the document was read (for example maxAttempts 99 stored as 10).
            List<FieldWarning>? warnings = model switch
            {
                Deployment deployment => deployment.Warnings,
                Agent agent => agent.Warnings,
                HarnessProfile profile => profile.Warnings,
                McpServer server => server.Warnings,
                WorkspaceTemplate workspace => workspace.Warnings,
                _ => null
            };
            return warnings == null ? new List<FieldWarning>() : new List<FieldWarning>(warnings);
        }

        private static T Deserialize<T>(ManifestDocument document) where T : class
        {
            try
            {
                return Serializer.Deserialize<T>(TemplateValues.ToJson(document.Spec)) ?? throw new ValidationException(document.Kind + " " + document.Metadata.Name + " has an empty spec.");
            }
            catch (System.Text.Json.JsonException e)
            {
                // Name the field and what it accepts; never pass the serializer's type names and positions through (G-26).
                throw ManifestSpecError.From(document, typeof(T), e);
            }
        }

        private static string? Take(Dictionary<string, object?> map, string key)
        {
            if (!map.TryGetValue(key, out object? value)) return null;
            map.Remove(key);
            return value == null ? null : TemplateValues.ToText(value);
        }

        private static T Copy<T>(T value) where T : class
        {
            return Serializer.Copy(value) ?? throw new InvalidOperationException("Copy failed.");
        }

        private static Dictionary<string, object?> Wrap(string kind, string name, Dictionary<string, object?> spec)
        {
            Dictionary<string, object?> metadata = new Dictionary<string, object?>();
            metadata["name"] = name;
            Dictionary<string, object?> document = new Dictionary<string, object?>();
            document["apiVersion"] = ApiVersion;
            document["kind"] = kind;
            document["metadata"] = metadata;
            document["spec"] = spec;
            return document;
        }

        private static Dictionary<string, object?> Tree(object model)
        {
            object? tree = TemplateSampleContext.FromJson(System.Text.Json.JsonDocument.Parse(Serializer.Serialize(model)).RootElement);
            Dictionary<string, object?> stripped = Strip(tree) as Dictionary<string, object?> ?? new Dictionary<string, object?>();
            stripped.Remove("name");
            return stripped;
        }

        private static object? Strip(object? value)
        {
            if (value is Dictionary<string, object?> map)
            {
                Dictionary<string, object?> result = new Dictionary<string, object?>(StringComparer.Ordinal);
                foreach (KeyValuePair<string, object?> entry in map.OrderBy(e => e.Key, StringComparer.Ordinal))
                {
                    if (_StripKeys.Contains(entry.Key) || entry.Value == null) continue;
                    if (entry.Key == "active" && entry.Value is bool active && active) continue;
                    result[entry.Key] = Strip(entry.Value);
                }
                return result;
            }
            if (value is List<object?> list) return list.Select(Strip).ToList();
            return value;
        }

        private static bool Same(Dictionary<string, object?> a, Dictionary<string, object?> b)
        {
            return TemplateValues.ToJson(a) == TemplateValues.ToJson(b);
        }

        private static string DryRunMessage(Planned planned)
        {
            switch (planned.Result)
            {
                case ManifestApplyResultEnum.Created:
                    return "Would be created.";
                case ManifestApplyResultEnum.Unchanged:
                    return "Already up to date; would be left unchanged.";
                case ManifestApplyResultEnum.Updated:
                    return "Would be updated: " + (planned.Changes.Count == 0 ? "no field differences recorded." : String.Join(", ", planned.Changes.Select(c => c.Field)) + ".");
                default:
                    return "Would be " + planned.Result.ToString().ToLowerInvariant() + ".";
            }
        }

        private static List<ManifestFieldChange> Diff(Dictionary<string, object?> before, Dictionary<string, object?> after)
        {
            Dictionary<string, string?> left = new Dictionary<string, string?>(StringComparer.Ordinal);
            Dictionary<string, string?> right = new Dictionary<string, string?>(StringComparer.Ordinal);
            Flatten(before, String.Empty, left);
            Flatten(after, String.Empty, right);
            List<ManifestFieldChange> changes = new List<ManifestFieldChange>();
            foreach (string field in left.Keys.Union(right.Keys).OrderBy(k => k, StringComparer.Ordinal))
            {
                left.TryGetValue(field, out string? was);
                right.TryGetValue(field, out string? now);
                if (!String.Equals(was, now, StringComparison.Ordinal)) changes.Add(new ManifestFieldChange(field, was, now));
            }
            return changes;
        }

        private static void Flatten(object? value, string path, Dictionary<string, string?> output)
        {
            if (value is Dictionary<string, object?> map)
            {
                foreach (KeyValuePair<string, object?> entry in map) Flatten(entry.Value, path.Length == 0 ? entry.Key : path + "." + entry.Key, output);
                return;
            }
            if (value is List<object?> list)
            {
                if (list.Count == 0 && path.Length > 0) output[path] = "[]";
                for (int i = 0; i < list.Count; i++) Flatten(list[i], path + "[" + i + "]", output);
                return;
            }
            if (path.Length == 0) return;
            output[path] = value == null ? null : TemplateValues.ToText(value);
        }

        private static Dictionary<string, object?> SecretTree(Secret secret)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            tree["kind"] = secret.Kind.ToString();
            if (secret.BrokerResource != null) tree["brokerResource"] = secret.BrokerResource;
            if (secret.BrokerAudience != null) tree["brokerAudience"] = secret.BrokerAudience;
            if (secret.Description != null) tree["description"] = secret.Description;
            if (secret.ExpiresUtc.HasValue) tree["expiresUtc"] = secret.ExpiresUtc.Value;
            return tree;
        }

        private static string ExportKind(string? kind, string field)
        {
            string? match = ExportableKinds.FirstOrDefault(k => String.Equals(k, kind?.Trim(), StringComparison.OrdinalIgnoreCase));
            if (match != null) return match;
            string message = String.Equals(kind?.Trim(), "Secret", StringComparison.OrdinalIgnoreCase)
                ? "Secrets are never exported; a bundle lists the secrets it needs in its Bundle document."
                : "'" + kind + "' cannot be exported. Kinds: " + String.Join(", ", ExportableKinds) + ".";
            throw new ValidationException(message, new Dictionary<string, string> { { field, message } }, new Dictionary<string, string> { { field, "UnknownKind" } });
        }

        private static Dictionary<string, object?> BundleTree(BundleSpec bundle)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            if (bundle.ExportedUtc.HasValue) tree["exportedUtc"] = bundle.ExportedUtc.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ", System.Globalization.CultureInfo.InvariantCulture);
            List<object?> secrets = new List<object?>();
            foreach (BundleSecretRequirement secret in bundle.RequiredSecrets)
            {
                Dictionary<string, object?> item = new Dictionary<string, object?>();
                item["name"] = secret.Name;
                if (secret.Kind.HasValue) item["kind"] = secret.Kind.Value.ToString();
                secrets.Add(item);
            }
            tree["requiredSecrets"] = secrets;
            tree["requiredArtifactStores"] = bundle.RequiredArtifactStores.Select(s => (object?)s).ToList();
            List<object?> builtIns = new List<object?>();
            foreach (ManifestResourceReference reference in bundle.RequiredBuiltIns)
            {
                Dictionary<string, object?> item = new Dictionary<string, object?>();
                item["kind"] = reference.Kind;
                item["name"] = reference.Name;
                builtIns.Add(item);
            }
            tree["requiredBuiltIns"] = builtIns;
            return tree;
        }

        private static string BundleHeader(string tenantId, BundleSpec bundle)
        {
            System.Text.StringBuilder header = new System.Text.StringBuilder();
            string exported = (bundle.ExportedUtc ?? DateTime.UtcNow).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ", System.Globalization.CultureInfo.InvariantCulture);
            header.Append("# Garrison manifest bundle (").Append(ApiVersion).Append(") exported ").Append(exported).Append(" from tenant ").Append(tenantId).Append('.').Append(Environment.NewLine);
            header.Append("# Apply it with POST /v1.0/api/tenants/{tenantId}/manifests/apply (add ?dryRun=true to check it first).").Append(Environment.NewLine);
            if (bundle.RequiredSecrets.Count == 0)
            {
                header.Append("# This bundle needs no secrets.").Append(Environment.NewLine);
            }
            else
            {
                header.Append("# Secret values are never exported. Create these secrets in the target tenant before applying:").Append(Environment.NewLine);
                foreach (BundleSecretRequirement secret in bundle.RequiredSecrets)
                {
                    header.Append("#   - ").Append(secret.Name).Append(secret.Kind.HasValue ? " (" + secret.Kind.Value + ")" : String.Empty).Append(Environment.NewLine);
                }
            }
            if (bundle.RequiredArtifactStores.Count > 0)
            {
                header.Append("# Artifact stores the target tenant needs: ").Append(String.Join(", ", bundle.RequiredArtifactStores)).Append('.').Append(Environment.NewLine);
            }
            return header.ToString();
        }

        private static Dictionary<string, object?> PromptTree(PromptTemplate template)
        {
            Dictionary<string, object?> tree = new Dictionary<string, object?>();
            tree["kind"] = template.Kind.ToString();
            if (template.Description != null) tree["description"] = template.Description;
            tree["content"] = template.Content;
            return tree;
        }

        private async Task<Dictionary<string, object?>> WorkspaceTreeAsync(WorkspaceTemplate workspace, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = Tree(workspace);
            tree.Remove("gitCredentialSecretId");
            if (!String.IsNullOrEmpty(workspace.GitCredentialSecretId)) tree["gitCredentialSecret"] = await resolver.NameAsync("Secret", workspace.GitCredentialSecretId, token).ConfigureAwait(false);
            return tree;
        }

        private async Task<Dictionary<string, object?>> AgentTreeAsync(Agent agent, Resolver resolver, CancellationToken token)
        {
            Dictionary<string, object?> tree = Tree(agent);
            tree.Remove("toolDescriptionTemplateId");
            tree.Remove("skillDescriptionTemplateId");
            tree.Remove("remoteCredentialSecretId");
            if (!String.IsNullOrEmpty(agent.RemoteCredentialSecretId)) tree["remoteCredentialSecret"] = await resolver.NameAsync("Secret", agent.RemoteCredentialSecretId, token).ConfigureAwait(false) ?? agent.RemoteCredentialSecretId;
            if (!String.IsNullOrEmpty(agent.ToolDescriptionTemplateId)) tree["toolDescriptionTemplate"] = await resolver.NameAsync("PromptTemplate", agent.ToolDescriptionTemplateId, token).ConfigureAwait(false);
            if (!String.IsNullOrEmpty(agent.SkillDescriptionTemplateId)) tree["skillDescriptionTemplate"] = await resolver.NameAsync("PromptTemplate", agent.SkillDescriptionTemplateId, token).ConfigureAwait(false);
            return tree;
        }

        private async Task<Dictionary<string, object?>> DeploymentTreeAsync(Deployment deployment, Resolver resolver, CancellationToken token)
        {
            DeploymentSpec spec = new DeploymentSpec();
            spec.Agent = await resolver.NameAsync("Agent", deployment.AgentId, token).ConfigureAwait(false) ?? deployment.AgentId;
            spec.HarnessProfile = await resolver.NameAsync("HarnessProfile", deployment.HarnessProfileId, token).ConfigureAwait(false) ?? deployment.HarnessProfileId;
            spec.Description = deployment.Description;
            spec.Model = deployment.Model;
            spec.FallbackModel = deployment.FallbackModel;
            spec.Effort = deployment.Effort;
            spec.MaxTurns = deployment.MaxTurns;
            spec.MaxBudgetUsd = deployment.MaxBudgetUsd;
            spec.MaxConcurrentRuns = deployment.MaxConcurrentRuns;
            spec.TimeoutSeconds = deployment.TimeoutSeconds;
            spec.RepetitionGuard = deployment.RepetitionGuard;
            spec.MaxAssistantChars = deployment.MaxAssistantChars;
            spec.NoProgressSeconds = deployment.NoProgressSeconds;
            spec.MaxAttempts = deployment.MaxAttempts;
            spec.EffectPolicy = deployment.EffectPolicy;
            spec.Executor = deployment.Executor;
            spec.TrustLevel = deployment.TrustLevel == DeploymentTrustLevelEnum.Trusted ? null : deployment.TrustLevel;
            spec.RequiredCapabilities = ExecutorCapabilityRules.RequiresReport(deployment.RequiredCapabilities) ? deployment.RequiredCapabilities.Clone() : null;
            spec.PodResources = deployment.PodResources.IsEmpty ? null : deployment.PodResources.Clone();
            spec.Weight = deployment.Weight;
            if (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId)) spec.Workspace = await resolver.NameAsync("WorkspaceTemplate", deployment.WorkspaceTemplateId, token).ConfigureAwait(false);
            spec.ArtifactGlobs = deployment.ArtifactGlobs.Count == 0 ? null : new List<string>(deployment.ArtifactGlobs);
            spec.EgressRules = deployment.EgressRules.Count == 0 ? null : deployment.EgressRules.Select(r => r.Clone()).ToList();
            if (!String.IsNullOrEmpty(deployment.ArtifactStoreId))
            {
                ArtifactStore? store = await _Database.ArtifactStores.ReadAsync(deployment.ArtifactStoreId, token).ConfigureAwait(false);
                spec.ArtifactStore = store?.Name;
            }
            foreach (DeploymentPromptBinding binding in deployment.PromptBindings.OrderBy(b => b.Role, StringComparer.Ordinal))
            {
                string name = await resolver.NameAsync("PromptTemplate", binding.TemplateId, token).ConfigureAwait(false) ?? binding.TemplateId;
                spec.Prompts[binding.Role] = binding.PinnedVersion.HasValue ? name + "@" + binding.PinnedVersion.Value : name;
            }
            foreach (DeploymentResourceBinding binding in deployment.ResourceBindings.OrderBy(b => b.Alias, StringComparer.Ordinal))
            {
                AliasReferenceSpec reference = new AliasReferenceSpec();
                reference.Alias = binding.Alias;
                if (binding.Kind == ResourceBindingKindEnum.Secret)
                {
                    reference.Secret = await resolver.NameAsync("Secret", binding.ResourceId, token).ConfigureAwait(false) ?? binding.ResourceId;
                    spec.Resources.Secrets.Add(reference);
                }
                else
                {
                    reference.Server = await resolver.NameAsync("McpServer", binding.ResourceId, token).ConfigureAwait(false) ?? binding.ResourceId;
                    spec.Resources.McpServers.Add(reference);
                }
            }
            foreach (DeploymentParameter parameter in deployment.Parameters) spec.Parameters[parameter.Name] = parameter.Value;
            foreach (DeploymentNodeSelector selector in deployment.NodeSelector) spec.NodeSelector[selector.Key] = selector.Value;
            spec.AllowedRunOverrides = deployment.AllowedRunOverrides;
            spec.ApprovalsEnabled = deployment.ApprovalsEnabled;
            spec.ApprovalDefaultAction = deployment.ApprovalDefaultAction;
            spec.ApprovalTimeoutSeconds = deployment.ApprovalTimeoutSeconds;
            spec.ApprovalTimeoutDecision = deployment.ApprovalTimeoutDecision;
            spec.ApprovalRules = deployment.ApprovalRules;
            spec.ArgumentOverrides = deployment.ArgumentOverrides;
            spec.EnvironmentOverrides = deployment.EnvironmentOverrides;
            spec.FileOverrides = deployment.FileOverrides;
            return Tree(spec);
        }

        #endregion
    }
}
