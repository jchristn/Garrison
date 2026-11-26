namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Keeps approved eval sets immutable (AA9.2). Before any edit, a caller asks <see cref="OpenDraftAsync"/> for the
    /// version it may change: a Draft is returned as is; for an Approved version the open Draft of the same name is
    /// returned when one exists, otherwise the next version is created as a Draft that copies the approved version's
    /// description, tags, cases, checks, and files. The data layer refuses edits to Approved versions with
    /// EvalSetImmutable, so this is the only way to change an approved set. Thread-safe.
    /// </summary>
    public class EvalSetVersioning
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
        public EvalSetVersioning(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The version of a set an edit applies to: the set itself when it is a Draft; for an Approved set, the newest
        /// version of its name when that is a Draft, or else a new Draft numbered one above the newest version that copies
        /// the approved set.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setId">Identifier of the set being edited.</param>
        /// <param name="authorType">Principal type of the editor, recorded as the new version's author.</param>
        /// <param name="authorId">Editor identifier, or null.</param>
        /// <param name="authorName">Editor display name, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The editable Draft version, with its tags.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or setId is null or empty.</exception>
        /// <exception cref="NotFoundException">Thrown when the set does not exist in the tenant.</exception>
        /// <exception cref="ConflictException">Thrown with code EvalSetVersionExists when another editor created the same version at the same time.</exception>
        public async Task<EvalSet> OpenDraftAsync(string tenantId, string setId, PrincipalTypeEnum authorType, string? authorId, string? authorName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(setId)) throw new ArgumentNullException(nameof(setId));
            token.ThrowIfCancellationRequested();
            EvalSet? source = await _Database.EvalSets.ReadAsync(tenantId, setId, token).ConfigureAwait(false);
            if (source == null) throw new NotFoundException("Eval set " + setId + " was not found.");
            if (source.State == EvalSetStateEnum.Draft) return source;

            EvalSet? latest = await _Database.EvalSets.ReadLatestAsync(tenantId, source.Name, token).ConfigureAwait(false);
            if (latest != null && latest.State == EvalSetStateEnum.Draft) return latest;

            int version = Math.Max(source.Version, latest != null ? latest.Version : source.Version) + 1;
            EvalSet next = NextVersion(source, version, authorType, authorId, authorName);
            List<EvalCase> cases = CopyCases(await _Database.EvalCases.ListBySetAsync(tenantId, source.Id, token).ConfigureAwait(false));
            token.ThrowIfCancellationRequested();
            return await _Database.EvalSets.CreateWithCasesAsync(next, cases, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Build the Draft that follows a set version: same tenant, name, description, origin, authoring unit, and tags;
        /// the given version number; no approval; the editor as author; PreviousVersionId pointing at the source.
        /// </summary>
        /// <param name="source">Version copied.</param>
        /// <param name="version">New version number, at least 1.</param>
        /// <param name="authorType">Editor principal type.</param>
        /// <param name="authorId">Editor identifier, or null.</param>
        /// <param name="authorName">Editor display name, or null.</param>
        /// <returns>The new, unsaved Draft.</returns>
        /// <exception cref="ArgumentNullException">Thrown when source is null.</exception>
        public static EvalSet NextVersion(EvalSet source, int version, PrincipalTypeEnum authorType, string? authorId, string? authorName)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            EvalSet next = new EvalSet();
            next.TenantId = source.TenantId;
            next.Name = source.Name;
            next.Description = source.Description;
            next.Version = version;
            next.PreviousVersionId = source.Id;
            next.State = EvalSetStateEnum.Draft;
            next.Origin = source.Origin;
            next.AuthoringOrgUnitId = source.AuthoringOrgUnitId;
            next.AuthoredByType = authorType;
            next.AuthoredById = authorId;
            next.AuthoredByName = authorName;
            next.AuthoredByAgentId = authorType == PrincipalTypeEnum.Run ? source.AuthoredByAgentId : null;
            next.Tags = new List<string>(source.Tags);
            return next;
        }

        /// <summary>
        /// Deep copies of cases with new identifiers, keeping order, name, input, hidden flag, expected text, source run,
        /// checks, and files. SetId is left for the caller (the data layer sets it when the new version is created).
        /// </summary>
        /// <param name="cases">Cases to copy.</param>
        /// <returns>Copies, in the same order.</returns>
        /// <exception cref="ArgumentNullException">Thrown when cases is null.</exception>
        public static List<EvalCase> CopyCases(List<EvalCase> cases)
        {
            if (cases == null) throw new ArgumentNullException(nameof(cases));
            List<EvalCase> copies = new List<EvalCase>();
            foreach (EvalCase item in cases)
            {
                EvalCase copy = new EvalCase();
                copy.TenantId = item.TenantId;
                copy.Order = item.Order;
                copy.Name = item.Name;
                copy.InputText = item.InputText;
                copy.Hidden = item.Hidden;
                copy.ExpectedText = item.ExpectedText;
                copy.SourceRunId = item.SourceRunId;
                copy.Checks = item.Checks.Select(c => new EvalCaseCheck { Scorer = c.Scorer, Argument = c.Argument, Weight = c.Weight }).ToList();
                copy.Files = item.Files.Select(f => new EvalCaseFile { Path = f.Path, MediaType = f.MediaType, ContentText = f.ContentText, AssetId = f.AssetId, AssetPath = f.AssetPath }).ToList();
                copies.Add(copy);
            }
            return copies;
        }

        #endregion
    }
}
