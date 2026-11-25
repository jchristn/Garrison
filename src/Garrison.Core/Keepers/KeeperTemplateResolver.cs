namespace Garrison.Core.Keepers
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Resolves the prompt templates keeper ticks use (AA1.9): a tenant template with the override name and the expected
    /// kind replaces the built-in for that tenant; otherwise the stored built-in is used, or its embedded default when the
    /// built-in has not been seeded. Thread-safe.
    /// </summary>
    public class KeeperTemplateResolver
    {
        #region Public-Members

        /// <summary>
        /// Override name of the keeper system fragment: keeper-system (built-in builtin/keeper-system, kind Fragment).
        /// </summary>
        public static readonly string SystemTemplateName = "keeper-system";

        /// <summary>
        /// Override name of the keeper tick input: keeper-tick (built-in builtin/keeper-tick, kind Task).
        /// </summary>
        public static readonly string TickTemplateName = "keeper-tick";

        /// <summary>
        /// Prompt role of the keeper system fragment. A deployment binding for this role replaces the tenant and built-in
        /// templates for that deployment.
        /// </summary>
        public static readonly string SystemRole = "KeeperSystem";

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public KeeperTemplateResolver(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Resolve a keeper template for a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Override name (keeper-system or keeper-tick).</param>
        /// <param name="kind">Kind a tenant override must have.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The template. A built-in that was never seeded is returned unsaved, with its embedded content.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or name is null or empty.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the built-in has no embedded content.</exception>
        public async Task<PromptTemplate> ResolveAsync(string tenantId, string name, PromptTemplateKindEnum kind, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            PromptTemplate? custom = await _Database.PromptTemplates.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
            if (custom != null && custom.TenantId == tenantId && custom.Active && custom.Kind == kind) return custom;

            string builtInName = Constants.BuiltInPrefix + name;
            PromptTemplate? stored = await _Database.PromptTemplates.ReadByNameAsync(null, builtInName, token).ConfigureAwait(false);
            if (stored != null && !String.IsNullOrWhiteSpace(stored.Content)) return stored;

            PromptTemplate fallback = new PromptTemplate();
            fallback.Id = BuiltInSeeder.PromptId(name);
            fallback.Name = builtInName;
            fallback.Kind = kind;
            fallback.Content = BuiltInSeeder.PromptDefault(name) ?? throw new InvalidOperationException("Embedded prompt '" + name + "' is missing.");
            return fallback;
        }

        #endregion
    }
}
