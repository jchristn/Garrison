namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Gives an eval case run its case's files (AA9.3): when a lease's execution spec is decorated, a run of kind Eval whose
    /// idempotency key is exactly eval:{evalRunId}:{order} (a case run, not a judge run) of an eval run in Cases mode gets
    /// each file of the case at that order placed in its workspace before launch. Inline text goes in the spec as bytes
    /// (placeholders are never resolved in it); an asset file becomes an asset file of the spec from the asset's latest
    /// version, which the worker downloads and checks against its SHA-256 like any asset. A file whose asset or asset file
    /// no longer exists is skipped. The workspace is not written back anywhere (AA-074). Thread-safe.
    /// </summary>
    public class EvalCaseFileDelivery
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public EvalCaseFileDelivery(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Add the case's files to a case run's execution spec. Does nothing for any other run.
        /// </summary>
        /// <param name="run">Run being leased.</param>
        /// <param name="spec">Its execution spec; changed in place.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The number of files added.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or spec is null.</exception>
        public async Task<int> ApplyAsync(Run run, ExecutionSpec spec, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (run.Kind != RunKindEnum.Eval || String.IsNullOrEmpty(run.EvalRunId) || String.IsNullOrEmpty(run.IdempotencyKey)) return 0;
            int? order = HiddenEvalRunPolicy.CaseOrder(run.EvalRunId, run.IdempotencyKey);
            if (!order.HasValue) return 0;
            if (!String.Equals(run.IdempotencyKey, "eval:" + run.EvalRunId + ":" + order.Value.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal)) return 0;
            EvalRun? evalRun = await _Database.EvalRuns.ReadAsync(run.TenantId, run.EvalRunId, token).ConfigureAwait(false);
            if (evalRun == null || evalRun.InputMode != EvalRunInputModeEnum.Cases) return 0;
            List<EvalCase> cases = await _Database.EvalCases.ListBySetAsync(run.TenantId, evalRun.SetId, token).ConfigureAwait(false);
            if (order.Value < 0 || order.Value >= cases.Count) return 0;
            EvalCase item = cases[order.Value];
            int added = 0;
            Dictionary<string, AgentAssetVersion?> versions = new Dictionary<string, AgentAssetVersion?>(StringComparer.Ordinal);
            Dictionary<string, AgentAsset?> assets = new Dictionary<string, AgentAsset?>(StringComparer.Ordinal);
            foreach (EvalCaseFile file in item.Files)
            {
                token.ThrowIfCancellationRequested();
                if (String.IsNullOrEmpty(file.Path)) continue;
                if (file.ContentText != null)
                {
                    ExecutionFile placed = new ExecutionFile();
                    placed.BaseDirectory = FileBaseDirectoryEnum.Workspace;
                    placed.Path = file.Path;
                    placed.ContentBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(file.ContentText));
                    spec.Files.Add(placed);
                    added++;
                    continue;
                }
                if (String.IsNullOrEmpty(file.AssetId) || String.IsNullOrEmpty(file.AssetPath)) continue;
                if (!assets.TryGetValue(file.AssetId, out AgentAsset? asset))
                {
                    asset = await _Database.AgentAssets.ReadAsync(run.TenantId, file.AssetId, token).ConfigureAwait(false);
                    assets[file.AssetId] = asset;
                    versions[file.AssetId] = asset == null || asset.CurrentVersion < 1 ? null : await _Database.AgentAssets.ReadVersionAsync(run.TenantId, asset.Id, asset.CurrentVersion, token).ConfigureAwait(false);
                }
                AgentAssetVersion? version = versions[file.AssetId];
                AgentAssetFile? source = version?.Files.FirstOrDefault(f => String.Equals(f.Path, file.AssetPath, StringComparison.Ordinal));
                if (asset == null || version == null || source == null) continue;
                ExecutionAssetFile target = new ExecutionAssetFile();
                target.AssetId = asset.Id;
                target.AssetName = asset.Name;
                target.Kind = asset.Kind;
                target.Version = version.Number;
                target.Path = file.Path;
                target.MediaType = file.MediaType ?? source.MediaType;
                target.SizeBytes = source.SizeBytes;
                target.Sha256 = source.Sha256;
                spec.AssetFiles.Add(target);
                added++;
            }
            if (added > 0 && spec.Artifacts != null)
            {
                // Case files are inputs, not outputs: they are never collected as artifacts.
                foreach (EvalCaseFile file in item.Files)
                {
                    if (!spec.Artifacts.ExcludedPaths.Contains(file.Path)) spec.Artifacts.ExcludedPaths.Add(file.Path);
                }
            }
            return added;
        }

        #endregion
    }
}
