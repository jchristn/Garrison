namespace Garrison.Core.Services
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>
    /// Works out which conversation file space a run uses (AD3.1): its conversation's, else its pipeline run's, else its
    /// root run's. Delegated children resolve through their root run, so a whole delegation tree, every turn of a
    /// conversation, and every stage of a pipeline run share one space. Stateless and thread-safe.
    /// </summary>
    public static class FileSpaceResolver
    {
        #region Public-Methods

        /// <summary>
        /// Owner key of the space a run uses: cnv:{conversationId}, plr:{pipelineRunId}, or run:{rootRunId}.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Owner key, and the owner identifiers in a template space.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static async Task<ConversationFileSpace> TemplateAsync(DatabaseDriverBase database, Run run, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (run == null) throw new ArgumentNullException(nameof(run));
            Run owner = run;
            if (!String.IsNullOrEmpty(run.RootRunId) && run.RootRunId != run.Id && String.IsNullOrEmpty(run.ConversationId) && String.IsNullOrEmpty(run.PipelineRunId))
            {
                owner = await database.Runs.ReadAsync(run.TenantId, run.RootRunId, token).ConfigureAwait(false) ?? run;
            }
            ConversationFileSpace template = new ConversationFileSpace();
            template.TenantId = run.TenantId;
            if (!String.IsNullOrEmpty(owner.ConversationId))
            {
                template.OwnerKey = "cnv:" + owner.ConversationId;
                template.ConversationId = owner.ConversationId;
            }
            else if (!String.IsNullOrEmpty(owner.PipelineRunId))
            {
                template.OwnerKey = "plr:" + owner.PipelineRunId;
                template.PipelineRunId = owner.PipelineRunId;
            }
            else
            {
                string root = String.IsNullOrEmpty(owner.RootRunId) ? owner.Id : owner.RootRunId;
                template.OwnerKey = "run:" + root;
                template.RootRunId = root;
            }
            return template;
        }

        /// <summary>
        /// The space a run uses, created on first use with the given artifact store.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="run">Run.</param>
        /// <param name="artifactStoreId">Store for a new space (the run's deployment store), or null for the database.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Space.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<ConversationFileSpace> ResolveAsync(DatabaseDriverBase database, Run run, string? artifactStoreId, CancellationToken token = default)
        {
            ConversationFileSpace template = await TemplateAsync(database, run, token).ConfigureAwait(false);
            template.ArtifactStoreId = artifactStoreId;
            return await database.FileSpaces.GetOrCreateAsync(template, token).ConfigureAwait(false);
        }

        #endregion
    }
}
