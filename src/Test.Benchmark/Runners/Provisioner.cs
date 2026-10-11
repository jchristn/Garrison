namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Provisions workspaces. Each corpus gets its own tenant, named deterministically from the dataset, the corpus, a
    /// hash of every item (the load-time state), and an optional suffix, so a rerun with the same data reuses the
    /// tenant and a change to any item gets a new one. Items are applied as manifests, which are idempotent, so a reused
    /// tenant is brought back in line with the corpus on every run. Thread-safe for concurrent use with distinct corpora.
    /// </summary>
    public class Provisioner
    {
        #region Private-Members

        private readonly GarrisonClient _Client;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <exception cref="ArgumentNullException">Thrown when client is null.</exception>
        public Provisioner(GarrisonClient client)
        {
            _Client = client ?? throw new ArgumentNullException(nameof(client));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Deterministic workspace name.
        /// </summary>
        /// <param name="dataset">Dataset name.</param>
        /// <param name="corpus">Corpus.</param>
        /// <param name="suffix">Optional suffix.</param>
        /// <returns>Name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when dataset or corpus is null.</exception>
        public static string WorkspaceName(string dataset, BenchmarkCorpus corpus, string? suffix)
        {
            if (dataset == null) throw new ArgumentNullException(nameof(dataset));
            if (corpus == null) throw new ArgumentNullException(nameof(corpus));
            StringBuilder state = new StringBuilder();
            foreach (BenchmarkItem item in corpus.Items) state.Append(item.Kind).Append('\n').Append(item.Name).Append('\n').Append(item.Manifest).Append("\n---\n");
            string name = "bench-" + dataset + "-" + corpus.Id + "-" + StableHash.Hex(state.ToString(), 8);
            if (!String.IsNullOrEmpty(suffix)) name += "-" + suffix;
            return name;
        }

        /// <summary>
        /// Find the workspace tenant by exact name or create it.
        /// </summary>
        /// <param name="name">Tenant name.</param>
        /// <param name="description">Description for a new tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Workspace.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the tenant cannot be listed or created.</exception>
        public async Task<Workspace> EnsureTenantAsync(string name, string description, CancellationToken token)
        {
            ApiResponse<EnumerationResult<Tenant>> search = await _Client.SearchTenantsAsync(name, token).ConfigureAwait(false);
            if (!search.IsSuccess || search.Body == null) throw new InvalidOperationException("Could not list tenants: " + search.Describe() + " " + Excerpt(search.RawBody));
            Tenant? existing = search.Body.Objects.FirstOrDefault(t => String.Equals(t.Name, name, StringComparison.Ordinal));
            Workspace workspace = new Workspace();
            workspace.Name = name;
            if (existing != null)
            {
                workspace.TenantId = existing.Id;
                workspace.Reused = true;
                return workspace;
            }
            TenantRequest request = new TenantRequest();
            request.Name = name;
            request.Description = description;
            ApiResponse<Tenant> created = await _Client.CreateTenantAsync(request, token).ConfigureAwait(false);
            if (!created.IsSuccess || created.Body == null) throw new InvalidOperationException("Could not create tenant " + name + ": " + created.Describe() + " " + Excerpt(created.RawBody));
            workspace.TenantId = created.Body.Id;
            return workspace;
        }

        /// <summary>
        /// Join item manifests into one multi-document manifest.
        /// </summary>
        /// <param name="items">Items.</param>
        /// <returns>Manifest text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when items is null.</exception>
        public static string Join(IEnumerable<BenchmarkItem> items)
        {
            if (items == null) throw new ArgumentNullException(nameof(items));
            return String.Join("\n---\n", items.Select(i => i.Manifest.TrimEnd()));
        }

        /// <summary>
        /// Apply a corpus in one manifest apply.
        /// </summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="corpus">Corpus.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Apply response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when corpus is null.</exception>
        public Task<ApiResponse<ManifestApply>> ApplyCorpusAsync(string tenantId, BenchmarkCorpus corpus, CancellationToken token)
        {
            if (corpus == null) throw new ArgumentNullException(nameof(corpus));
            return _Client.ApplyManifestAsync(tenantId, Join(corpus.Items), false, token);
        }

        /// <summary>
        /// Provision a corpus: ensure its tenant and apply its items. Throws when the apply fails, because probes on a
        /// partly loaded corpus measure the wrong thing.
        /// </summary>
        /// <param name="dataset">Dataset name.</param>
        /// <param name="corpus">Corpus.</param>
        /// <param name="suffix">Workspace suffix, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Workspace.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the tenant or the apply fails.</exception>
        public async Task<Workspace> ProvisionAsync(string dataset, BenchmarkCorpus corpus, string? suffix, CancellationToken token)
        {
            string name = WorkspaceName(dataset, corpus, suffix);
            Workspace workspace = await EnsureTenantAsync(name, "Benchmark workspace for " + dataset + "/" + corpus.Id + " (Garrison.Benchmark).", token).ConfigureAwait(false);
            if (corpus.Items.Count == 0) return workspace;
            ApiResponse<ManifestApply> apply = await ApplyCorpusAsync(workspace.TenantId, corpus, token).ConfigureAwait(false);
            if (!apply.IsSuccess || apply.Body == null || apply.Body.FailedCount > 0)
            {
                string failures = apply.Body == null ? Excerpt(apply.RawBody) : String.Join("; ", apply.Body.Items.Where(i => i.Result == "Failed").Select(i => i.Kind + " " + i.Name + ": " + i.Message));
                throw new InvalidOperationException("Provisioning " + dataset + "/" + corpus.Id + " into " + name + " failed (" + apply.Describe() + "): " + failures);
            }
            return workspace;
        }

        /// <summary>
        /// First 300 characters of a body, for messages.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <returns>Excerpt.</returns>
        public static string Excerpt(string? text)
        {
            if (String.IsNullOrEmpty(text)) return String.Empty;
            string flat = text.Replace('\n', ' ').Replace('\r', ' ');
            return flat.Length > 300 ? flat.Substring(0, 300) + "..." : flat;
        }

        #endregion
    }
}
