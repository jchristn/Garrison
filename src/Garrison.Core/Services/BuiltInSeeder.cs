namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Reflection;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;
    using Garrison.Core.Templates;

    /// <summary>
    /// Seeds and refreshes built-in prompt templates and harness profiles from embedded resources on every start.
    /// Built-ins have a null tenant, stable identifiers (tpl_builtin_*, hrn_builtin_*), and are protected. A changed
    /// built-in template gets a new version so history stays intact. Thread-safe for a single caller at startup.
    /// </summary>
    public class BuiltInSeeder
    {
        #region Private-Members

        private static readonly string _PromptPrefix = "Garrison.Core.Seed.Prompts.";
        private static readonly string _ProfilePrefix = "Garrison.Core.Seed.HarnessProfiles.";

        private readonly DatabaseDriverBase _Database;
        private readonly Action<string>? _Log;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="log">Optional log callback.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public BuiltInSeeder(DatabaseDriverBase database, Action<string>? log = null)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Log = log;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Built-in prompt catalog.
        /// </summary>
        /// <returns>Definitions.</returns>
        public static List<BuiltInPromptDefinition> PromptCatalog()
        {
            string json = ReadResource(_PromptPrefix + "catalog.json") ?? "[]";
            return Serializer.Deserialize<List<BuiltInPromptDefinition>>(json) ?? new List<BuiltInPromptDefinition>();
        }

        /// <summary>
        /// Default content of a built-in prompt template.
        /// </summary>
        /// <param name="key">Built-in key (without the builtin/ prefix).</param>
        /// <returns>Content or null.</returns>
        public static string? PromptDefault(string? key)
        {
            if (String.IsNullOrEmpty(key)) return null;
            return ReadResource(_PromptPrefix + key + ".md");
        }

        /// <summary>
        /// Built-in harness profiles as defined in the embedded seeds (identifiers assigned, not persisted).
        /// </summary>
        /// <returns>Profiles.</returns>
        public static List<HarnessProfile> HarnessProfileDefaults()
        {
            List<HarnessProfile> profiles = new List<HarnessProfile>();
            Assembly assembly = typeof(BuiltInSeeder).Assembly;
            foreach (string resource in assembly.GetManifestResourceNames().Where(r => r.StartsWith(_ProfilePrefix, StringComparison.Ordinal) && r.EndsWith(".json", StringComparison.Ordinal)).OrderBy(r => r, StringComparer.Ordinal))
            {
                string key = resource.Substring(_ProfilePrefix.Length, resource.Length - _ProfilePrefix.Length - 5);
                HarnessProfile? profile = Serializer.Deserialize<HarnessProfile>(ReadResource(resource));
                if (profile == null) continue;
                profile.Id = "hrn_builtin_" + key.Replace("-", "_");
                profile.TenantId = null;
                profile.IsBuiltIn = true;
                profile.IsProtected = true;
                profile.BuiltInKey = key;
                profile.Active = true;
                profiles.Add(profile);
            }
            return profiles;
        }

        /// <summary>
        /// Identifier of a built-in prompt template.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Identifier.</returns>
        public static string PromptId(string key)
        {
            return "tpl_builtin_" + key.Replace("-", "_");
        }

        /// <summary>
        /// Seed or refresh every built-in.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task SeedAsync(CancellationToken token = default)
        {
            // Replicas starting together seed one at a time, so creating a built-in twice cannot race (P10.9).
            await using (DatabaseLockHandle startupLock = await _Database.AcquireStartupLockAsync(token).ConfigureAwait(false))
            {
                await SeedLockedAsync(token).ConfigureAwait(false);
            }
        }

        #endregion

        #region Private-Methods

        private async Task SeedLockedAsync(CancellationToken token)
        {
            foreach (BuiltInPromptDefinition definition in PromptCatalog())
            {
                await SeedPromptAsync(definition, token).ConfigureAwait(false);
            }

            foreach (HarnessProfile profile in HarnessProfileDefaults())
            {
                HarnessProfile? existing = await _Database.HarnessProfiles.ReadAsync(profile.Id, token).ConfigureAwait(false);
                if (existing == null)
                {
                    await _Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
                    _Log?.Invoke("seeded harness profile " + profile.Name);
                }
                else
                {
                    profile.CreatedUtc = existing.CreatedUtc;
                    await _Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                }
            }
        }

        private async Task SeedPromptAsync(BuiltInPromptDefinition definition, CancellationToken token)
        {
            string content = PromptDefault(definition.Key) ?? throw new InvalidOperationException("Embedded prompt '" + definition.Key + "' is missing.");
            string id = PromptId(definition.Key);
            PromptTemplate? existing = await _Database.PromptTemplates.ReadAsync(id, token).ConfigureAwait(false);

            PromptTemplate template = existing ?? new PromptTemplate();
            bool changed = existing == null || existing.Content != content;
            template.Id = id;
            template.TenantId = null;
            template.Name = Constants.BuiltInPrefix + definition.Key;
            template.Description = definition.Description;
            template.Kind = definition.Kind;
            template.Content = content;
            template.IsBuiltIn = true;
            template.IsProtected = true;
            template.BuiltInKey = definition.Key;
            template.Active = true;
            template.Variables = Variables(content, template.Name);
            if (existing != null && changed) template.CurrentVersion = existing.CurrentVersion + 1;
            if (existing == null) template.CurrentVersion = 1;

            if (existing == null) await _Database.PromptTemplates.CreateAsync(template, token).ConfigureAwait(false);
            else await _Database.PromptTemplates.UpdateAsync(template, token).ConfigureAwait(false);

            if (changed)
            {
                PromptTemplateVersion version = new PromptTemplateVersion();
                version.TenantId = null;
                version.TemplateId = template.Id;
                version.Version = template.CurrentVersion;
                version.Content = content;
                version.ChangeNote = existing == null ? "Seeded built-in." : "Built-in refreshed from the release.";
                version.CreatedBy = "garrison";
                await _Database.PromptTemplateVersions.CreateAsync(version, token).ConfigureAwait(false);
                _Log?.Invoke((existing == null ? "seeded" : "refreshed") + " prompt template " + template.Name + " v" + template.CurrentVersion);
            }
        }

        private static List<PromptTemplateVariable> Variables(string content, string name)
        {
            List<PromptTemplateVariable> variables = new List<PromptTemplateVariable>();
            TemplateAnalysis analysis = TemplateAnalyzer.Analyze(content, name, true);
            foreach (string path in analysis.Variables.OrderBy(v => v, StringComparer.Ordinal))
            {
                PromptTemplateVariable variable = new PromptTemplateVariable();
                variable.Name = path;
                variable.Required = false;
                variables.Add(variable);
            }
            return variables;
        }

        private static string? ReadResource(string name)
        {
            using (Stream? stream = typeof(BuiltInSeeder).Assembly.GetManifestResourceStream(name))
            {
                if (stream == null) return null;
                using (StreamReader reader = new StreamReader(stream))
                {
                    return reader.ReadToEnd();
                }
            }
        }

        #endregion
    }
}
