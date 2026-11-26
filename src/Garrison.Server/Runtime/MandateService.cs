namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Manages mandates and their revisions (AA1.4): create, update, delete, revision drafts and publishing, pause, resume,
    /// and manual wakes. The caller of create and update becomes the mandate's run-as principal and must be allowed to run
    /// its agent. Every mutation is audited. Scheduling itself is done by <see cref="KeeperScheduler"/>. Thread-safe.
    /// </summary>
    public class MandateService
    {
        #region Public-Members

        /// <summary>
        /// Options, refreshed from the Autonomy.* cluster settings.
        /// </summary>
        public KeeperOptions Options
        {
            get
            {
                return _Options;
            }
        }

        /// <summary>
        /// Cancels the run of a tick when a mandate is deleted with force, or null to leave it running.
        /// </summary>
        public Func<string, string, CancellationToken, Task>? CancelRunAsync { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly KeeperOptions _Options;
        private readonly KeeperIntervalCalculator _Intervals = new KeeperIntervalCalculator();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="options">Keeper options.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public MandateService(DatabaseDriverBase database, AuditService audit, KeeperOptions options)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Read a mandate by identifier or name, with its current revision.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Mandate or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        public async Task<Mandate?> FindAsync(string tenantId, string? idOrName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrWhiteSpace(idOrName)) return null;
            Mandate? mandate = await _Database.Mandates.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false)
                ?? await _Database.Mandates.ReadByNameAsync(tenantId, idOrName, token).ConfigureAwait(false);
            if (mandate != null) await AttachRevisionAsync(mandate, token).ConfigureAwait(false);
            return mandate;
        }

        /// <summary>
        /// Fill in a mandate's current revision.
        /// </summary>
        /// <param name="mandate">Mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when mandate is null.</exception>
        public async Task AttachRevisionAsync(Mandate mandate, CancellationToken token = default)
        {
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            mandate.CurrentRevision = String.IsNullOrEmpty(mandate.CurrentRevisionId) ? null
                : await _Database.MandateRevisions.ReadAsync(mandate.TenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Create a mandate. With a <see cref="Mandate.CurrentRevision"/>, that revision is published as revision 1 and the
        /// mandate becomes Active (or Paused when status Paused is given) with its first wake now; without one it stays
        /// Draft.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="body">Mandate.</param>
        /// <param name="authorizeAgent">Checks that the caller may run the agent (Agent Execute); returns false after
        /// answering the caller (REST) or throws (MCP).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Created mandate, or null when the agent check denied the caller.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx, tenantId, or authorizeAgent is null.</exception>
        /// <exception cref="ValidationException">Thrown when the mandate or revision is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict when the name is taken.</exception>
        public async Task<Mandate?> CreateAsync(RequestContext ctx, string tenantId, Mandate body, Func<string, Task<bool>> authorizeAgent, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (authorizeAgent == null) throw new ArgumentNullException(nameof(authorizeAgent));
            if (body == null) throw new ValidationException("A mandate is required.");
            token.ThrowIfCancellationRequested();

            Mandate mandate = new Mandate();
            mandate.TenantId = tenantId;
            mandate.Name = (body.Name ?? String.Empty).Trim();
            mandate.Description = body.Description;
            mandate.AgentId = (body.AgentId ?? String.Empty).Trim();
            mandate.DeploymentId = (body.DeploymentId ?? String.Empty).Trim();
            mandate.CreatedBy = ctx.PrincipalName;
            await ValidateAsync(tenantId, mandate, token).ConfigureAwait(false);
            Mandate? taken = await _Database.Mandates.ReadByNameAsync(tenantId, mandate.Name, token).ConfigureAwait(false);
            if (taken != null) throw new ConflictException("NameConflict", "A mandate named " + mandate.Name + " already exists.");
            if (!await authorizeAgent(mandate.AgentId).ConfigureAwait(false)) return null;
            RunAs(ctx, mandate);

            MandateRevision? first = null;
            if (body.CurrentRevision != null)
            {
                first = body.CurrentRevision;
                PrepareRevision(first, tenantId, mandate.Id, 1, ctx);
                ValidateRevision(first);
            }

            mandate.Status = MandateStatusEnum.Draft;
            await _Database.Mandates.CreateAsync(mandate, token).ConfigureAwait(false);
            if (first != null)
            {
                first.State = MandateRevisionStateEnum.Published;
                first.PublishedUtc = DateTime.UtcNow;
                await _Database.MandateRevisions.CreateAsync(first, token).ConfigureAwait(false);
                bool paused = body.Status == MandateStatusEnum.Paused;
                StartSchedule(mandate, first, paused ? MandateStatusEnum.Paused : MandateStatusEnum.Active);
                await _Database.Mandates.UpdateScheduleAsync(mandate, token).ConfigureAwait(false);
                mandate.CurrentRevision = first;
            }

            await AuditAsync(ctx, tenantId, mandate.Id, "Created mandate " + mandate.Name + " for agent " + mandate.AgentId + " on deployment " + mandate.DeploymentId + " (" + mandate.Status + ", runs as " + (mandate.RunAsName ?? mandate.RunAsType.ToString()) + ").", token).ConfigureAwait(false);
            return mandate;
        }

        /// <summary>
        /// Update a mandate's name, description, and deployment. The caller becomes its run-as principal. The agent cannot
        /// change.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Update).</param>
        /// <param name="existing">Existing mandate.</param>
        /// <param name="body">Replacement fields.</param>
        /// <param name="authorizeAgent">Agent Execute check (see <see cref="CreateAsync"/>).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Updated mandate, or null when the agent check denied the caller.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx, existing, or authorizeAgent is null.</exception>
        /// <exception cref="ValidationException">Thrown when the fields are invalid or the agent changes.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict when the new name is taken.</exception>
        public async Task<Mandate?> UpdateAsync(RequestContext ctx, Mandate existing, Mandate body, Func<string, Task<bool>> authorizeAgent, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (authorizeAgent == null) throw new ArgumentNullException(nameof(authorizeAgent));
            if (body == null) throw new ValidationException("A mandate is required.");
            if (!String.IsNullOrWhiteSpace(body.AgentId) && body.AgentId.Trim() != existing.AgentId)
            {
                throw new ValidationException("The agent of a mandate cannot change. Create a new mandate instead.", new Dictionary<string, string> { { "agentId", "The agent cannot change." } }, new Dictionary<string, string> { { "agentId", "Immutable" } });
            }
            string name = String.IsNullOrWhiteSpace(body.Name) ? existing.Name : body.Name.Trim();
            string deploymentId = String.IsNullOrWhiteSpace(body.DeploymentId) ? existing.DeploymentId : body.DeploymentId.Trim();
            Mandate candidate = new Mandate { Id = existing.Id, TenantId = existing.TenantId, Name = name, AgentId = existing.AgentId, DeploymentId = deploymentId, Description = body.Description };
            await ValidateAsync(existing.TenantId, candidate, token).ConfigureAwait(false);
            if (name != existing.Name)
            {
                Mandate? taken = await _Database.Mandates.ReadByNameAsync(existing.TenantId, name, token).ConfigureAwait(false);
                if (taken != null && taken.Id != existing.Id) throw new ConflictException("NameConflict", "A mandate named " + name + " already exists.");
            }
            if (!await authorizeAgent(existing.AgentId).ConfigureAwait(false)) return null;
            existing.Name = name;
            existing.Description = body.Description;
            existing.DeploymentId = deploymentId;
            RunAs(ctx, existing);
            await _Database.Mandates.UpdateAsync(existing, token).ConfigureAwait(false);
            await AuditAsync(ctx, existing.TenantId, existing.Id, "Updated mandate " + existing.Name + " (deployment " + existing.DeploymentId + ", runs as " + (existing.RunAsName ?? existing.RunAsType.ToString()) + ").", token).ConfigureAwait(false);
            await AttachRevisionAsync(existing, token).ConfigureAwait(false);
            return existing;
        }

        /// <summary>
        /// Delete a mandate with its revisions and tick history. Refused while a tick runs unless forced; a forced delete
        /// cancels the tick's run when <see cref="CancelRunAsync"/> is set.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Delete).</param>
        /// <param name="existing">Existing mandate.</param>
        /// <param name="force">Delete even while a tick runs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or existing is null.</exception>
        /// <exception cref="ConflictException">Thrown with MandateActive when a tick runs and force is false.</exception>
        public async Task<bool> DeleteAsync(RequestContext ctx, Mandate existing, bool force, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (!String.IsNullOrEmpty(existing.ActiveTickId) && !force)
            {
                throw new ConflictException("MandateActive", "Mandate " + existing.Name + " has a tick in progress" + (existing.ActiveRunId != null ? " (run " + existing.ActiveRunId + ")" : String.Empty) + ". Wait for it to finish, pause the mandate, or delete with force=true.");
            }
            if (force && !String.IsNullOrEmpty(existing.ActiveRunId) && CancelRunAsync != null) await CancelRunAsync(existing.TenantId, existing.ActiveRunId, token).ConfigureAwait(false);
            bool deleted = await _Database.Mandates.DeleteAsync(existing.TenantId, existing.Id, token).ConfigureAwait(false);
            await AuditAsync(ctx, existing.TenantId, existing.Id, "Deleted mandate " + existing.Name + (force ? " with force" : String.Empty) + ".", token).ConfigureAwait(false);
            return deleted;
        }

        /// <summary>
        /// Create a draft revision with the next number.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Update).</param>
        /// <param name="mandate">Mandate.</param>
        /// <param name="body">Revision fields.</param>
        /// <param name="source">Who authored it (Human for people).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The draft, with warnings for clamped values.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or mandate is null.</exception>
        /// <exception cref="ValidationException">Thrown when the revision is invalid.</exception>
        public async Task<MandateRevision> CreateRevisionAsync(RequestContext ctx, Mandate mandate, MandateRevision body, MandateRevisionSourceEnum source, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (body == null) throw new ValidationException("A revision is required.");
            int number = await _Database.MandateRevisions.NextNumberAsync(mandate.Id, token).ConfigureAwait(false);
            PrepareRevision(body, mandate.TenantId, mandate.Id, number, ctx);
            body.Source = source;
            ValidateRevision(body);
            body.State = MandateRevisionStateEnum.Draft;
            body.PublishedUtc = null;
            await _Database.MandateRevisions.CreateAsync(body, token).ConfigureAwait(false);
            await AuditAsync(ctx, mandate.TenantId, mandate.Id, "Drafted revision " + body.Number + " of mandate " + mandate.Name + " (" + source + ").", token).ConfigureAwait(false);
            return body;
        }

        /// <summary>
        /// Publish a draft revision: it becomes immutable and current, backoff resets to its minimum interval, a Draft
        /// mandate becomes Active, and an Active mandate wakes now under the new revision.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Update).</param>
        /// <param name="mandate">Mandate.</param>
        /// <param name="revision">Draft revision of this mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate with its new current revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with RevisionPublished when the revision is not a draft, or RevisionMismatch when it belongs to another mandate.</exception>
        public async Task<Mandate> PublishRevisionAsync(RequestContext ctx, Mandate mandate, MandateRevision revision, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (revision.MandateId != mandate.Id) throw new ConflictException("RevisionMismatch", "Revision " + revision.Id + " does not belong to mandate " + mandate.Name + ".");
            if (revision.State != MandateRevisionStateEnum.Draft) throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of mandate " + mandate.Name + " is already published; draft a new revision instead.");
            DateTime now = DateTime.UtcNow;
            if (!await _Database.MandateRevisions.PublishAsync(mandate.TenantId, revision.Id, now, token).ConfigureAwait(false))
            {
                throw new ConflictException("RevisionPublished", "Revision " + revision.Number + " of mandate " + mandate.Name + " was published by another request.");
            }
            revision.State = MandateRevisionStateEnum.Published;
            revision.PublishedUtc = now;

            // A mandate whose current revision is newer keeps it: publishing an older draft never moves backwards.
            if (revision.Number >= mandate.CurrentRevisionNumber)
            {
                MandateStatusEnum status = mandate.Status == MandateStatusEnum.Draft ? MandateStatusEnum.Active : mandate.Status;
                StartSchedule(mandate, revision, status);
                await _Database.Mandates.UpdateScheduleAsync(mandate, token).ConfigureAwait(false);
            }
            await AuditAsync(ctx, mandate.TenantId, mandate.Id, "Published revision " + revision.Number + " of mandate " + mandate.Name + " (" + mandate.Status + ").", token).ConfigureAwait(false);
            await AttachRevisionAsync(mandate, token).ConfigureAwait(false);
            return mandate;
        }

        /// <summary>
        /// Make an already published revision the mandate's current one again (AA7.4): an organization publish or rollback
        /// restores the mandate revisions it pins. A Draft mandate becomes Active; an Active one wakes under the restored
        /// revision with its interval reset. Does nothing when the revision is already current.
        /// </summary>
        /// <param name="ctx">Authorized caller (Organization Update).</param>
        /// <param name="mandate">Mandate.</param>
        /// <param name="revision">Published or superseded revision of this mandate.</param>
        /// <param name="reason">What caused the restore, for the audit record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the current revision changed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with RevisionMismatch when the revision belongs to another mandate, or RevisionNotPublished when it is still a draft.</exception>
        public async Task<bool> RestoreRevisionAsync(RequestContext ctx, Mandate mandate, MandateRevision revision, string reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            if (revision.MandateId != mandate.Id) throw new ConflictException("RevisionMismatch", "Revision " + revision.Id + " does not belong to mandate " + mandate.Name + ".");
            if (revision.State == MandateRevisionStateEnum.Draft) throw new ConflictException("RevisionNotPublished", "Revision " + revision.Number + " of mandate " + mandate.Name + " is a draft and cannot be restored.");
            if (mandate.CurrentRevisionId == revision.Id) return false;
            MandateStatusEnum status = mandate.Status == MandateStatusEnum.Draft ? MandateStatusEnum.Active : mandate.Status;
            StartSchedule(mandate, revision, status);
            await _Database.Mandates.UpdateScheduleAsync(mandate, token).ConfigureAwait(false);
            await AuditAsync(ctx, mandate.TenantId, mandate.Id, "Restored revision " + revision.Number + " of mandate " + mandate.Name + " (" + (reason ?? String.Empty) + ").", token).ConfigureAwait(false);
            await AttachRevisionAsync(mandate, token).ConfigureAwait(false);
            return true;
        }

        /// <summary>
        /// Pause a mandate: no further wakes are scheduled. A tick in flight finishes.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Execute).</param>
        /// <param name="mandate">Mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or mandate is null.</exception>
        /// <exception cref="ConflictException">Thrown with MandateNotActive when it is not Active or CapReached.</exception>
        public async Task<Mandate> PauseAsync(RequestContext ctx, Mandate mandate, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (mandate.Status == MandateStatusEnum.Paused) return mandate;
            if (mandate.Status != MandateStatusEnum.Active && mandate.Status != MandateStatusEnum.CapReached)
                throw new ConflictException("MandateNotActive", "Mandate " + mandate.Name + " is " + mandate.Status + "; only an Active mandate can be paused.");
            mandate.Status = MandateStatusEnum.Paused;
            mandate.NextWakeUtc = null;
            mandate.PendingWakeSource = null;
            await _Database.Mandates.UpdateScheduleAsync(mandate, token).ConfigureAwait(false);
            await AuditAsync(ctx, mandate.TenantId, mandate.Id, "Paused mandate " + mandate.Name + ".", token).ConfigureAwait(false);
            await AttachRevisionAsync(mandate, token).ConfigureAwait(false);
            return mandate;
        }

        /// <summary>
        /// Resume a paused mandate: it becomes Active and wakes now with its interval reset to the minimum.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Execute).</param>
        /// <param name="mandate">Mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or mandate is null.</exception>
        /// <exception cref="ConflictException">Thrown with MandateNotPaused when it is not Paused, or NoPublishedRevision.</exception>
        public async Task<Mandate> ResumeAsync(RequestContext ctx, Mandate mandate, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (mandate.Status == MandateStatusEnum.Active) return mandate;
            if (mandate.Status != MandateStatusEnum.Paused) throw new ConflictException("MandateNotPaused", "Mandate " + mandate.Name + " is " + mandate.Status + "; only a Paused mandate can be resumed.");
            MandateRevision revision = await CurrentRevisionAsync(mandate, token).ConfigureAwait(false);
            StartSchedule(mandate, revision, MandateStatusEnum.Active);
            await _Database.Mandates.UpdateScheduleAsync(mandate, token).ConfigureAwait(false);
            await AuditAsync(ctx, mandate.TenantId, mandate.Id, "Resumed mandate " + mandate.Name + ".", token).ConfigureAwait(false);
            mandate.CurrentRevision = revision;
            return mandate;
        }

        /// <summary>
        /// Ask an Active mandate to wake now. When a tick is in flight, the wake starts after it.
        /// </summary>
        /// <param name="ctx">Authorized caller (Mandate Execute).</param>
        /// <param name="mandate">Mandate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The mandate as stored after the request.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or mandate is null.</exception>
        /// <exception cref="ConflictException">Thrown with MandateNotActive when it is not Active.</exception>
        public async Task<Mandate> WakeAsync(RequestContext ctx, Mandate mandate, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (mandate == null) throw new ArgumentNullException(nameof(mandate));
            if (!await _Database.Mandates.RequestWakeAsync(mandate.TenantId, mandate.Id, WakeSourceEnum.Manual, DateTime.UtcNow, token).ConfigureAwait(false))
            {
                throw new ConflictException("MandateNotActive", "Mandate " + mandate.Name + " is " + mandate.Status + "; only an Active mandate can be woken.");
            }
            await AuditAsync(ctx, mandate.TenantId, mandate.Id, "Requested a wake of mandate " + mandate.Name + ".", token).ConfigureAwait(false);
            return await FindAsync(mandate.TenantId, mandate.Id, token).ConfigureAwait(false) ?? mandate;
        }

        /// <summary>
        /// Apply the cluster interval bounds to a revision: a minimum below Autonomy.MinIntervalSeconds is raised, a
        /// maximum above Autonomy.MaxIntervalSeconds is lowered, and a maximum below the minimum is raised to it. Each
        /// change adds a ValueClamped warning.
        /// </summary>
        /// <param name="revision">Revision.</param>
        /// <exception cref="ArgumentNullException">Thrown when revision is null.</exception>
        public void ApplyBounds(MandateRevision revision)
        {
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            MandateValidator.ApplyBounds(revision, _Options.MinIntervalSeconds, _Options.MaxIntervalSeconds);
        }

        #endregion

        #region Private-Methods

        private async Task ValidateAsync(string tenantId, Mandate mandate, CancellationToken token)
        {
            await MandateValidator.ValidateAsync(_Database, tenantId, mandate, token).ConfigureAwait(false);
        }

        private void PrepareRevision(MandateRevision revision, string tenantId, string mandateId, int number, RequestContext ctx)
        {
            revision.Id = String.Empty;
            revision.TenantId = tenantId;
            revision.MandateId = mandateId;
            revision.Number = number;
            revision.Author = ctx.PrincipalName;
            revision.Objective = (revision.Objective ?? String.Empty).Trim();
            revision.Signals = revision.Signals ?? new List<MandateRevisionSignal>();
            ApplyBounds(revision);
        }

        private static void ValidateRevision(MandateRevision revision)
        {
            MandateValidator.ValidateRevision(revision);
        }

        private void StartSchedule(Mandate mandate, MandateRevision revision, MandateStatusEnum status)
        {
            KeeperIntervalResult start = _Intervals.Start(revision, DateTime.UtcNow);
            mandate.Status = status;
            mandate.CurrentRevisionId = revision.Id;
            mandate.CurrentRevisionNumber = revision.Number;
            mandate.CurrentIntervalSeconds = start.IntervalSeconds;
            mandate.ConsecutiveQuietTicks = 0;
            mandate.NextWakeUtc = status == MandateStatusEnum.Active ? start.NextWakeUtc : null;
            mandate.PendingWakeSource = null;
        }

        private async Task<MandateRevision> CurrentRevisionAsync(Mandate mandate, CancellationToken token)
        {
            MandateRevision? revision = String.IsNullOrEmpty(mandate.CurrentRevisionId) ? null
                : await _Database.MandateRevisions.ReadAsync(mandate.TenantId, mandate.CurrentRevisionId, token).ConfigureAwait(false);
            if (revision == null) throw new ConflictException("NoPublishedRevision", "Mandate " + mandate.Name + " has no published revision. Publish one first.");
            return revision;
        }

        private static void RunAs(RequestContext ctx, Mandate mandate)
        {
            mandate.RunAsType = ctx.PrincipalType;
            mandate.RunAsId = ctx.PrincipalType == PrincipalTypeEnum.Administrator ? null : ctx.PrincipalId;
            mandate.RunAsName = ctx.PrincipalName;
        }

        private async Task AuditAsync(RequestContext ctx, string tenantId, string mandateId, string description, CancellationToken token)
        {
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Mandate", mandateId, description, tenantId, token).ConfigureAwait(false);
        }

        #endregion
    }
}
