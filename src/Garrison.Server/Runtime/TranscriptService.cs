namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Approvals;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Transcripts;

    /// <summary>
    /// Builds run and conversation transcripts for export (P12.27). Events are read page by page and the transcript
    /// stops growing at <see cref="TranscriptOptions.MaxBytes"/>, so memory is bounded however many events a run has;
    /// a cut transcript says what was left out. Stdout, stderr, progress, usage, and result events are not entries (the
    /// result and usage are on the turn), and thinking is included only on request. Every text is redacted with the
    /// same redactor as approval previews: the literal values of the secrets the run's deployment binds, then common
    /// credential shapes (workers already scrub bound secret values from events before they are stored). Callers
    /// authorize and scope the run or conversation to the tenant. Thread-safe.
    /// </summary>
    public class TranscriptService
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunRedactorFactory _Redactors;
        private readonly TranscriptOptions _Options;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="redactors">Redactor factory.</param>
        /// <param name="options">Limits.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public TranscriptService(DatabaseDriverBase database, RunRedactorFactory redactors, TranscriptOptions options)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Redactors = redactors ?? throw new ArgumentNullException(nameof(redactors));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the transcript of one run.
        /// </summary>
        /// <param name="run">Run, already read within the caller's tenant and authorized.</param>
        /// <param name="includeThinking">Whether thinking events are included.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Transcript.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<Transcript> BuildRunAsync(Run run, bool includeThinking, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            Transcript transcript = new Transcript();
            transcript.Kind = TranscriptKindEnum.Run;
            transcript.TenantId = run.TenantId;
            transcript.RunId = run.Id;
            transcript.ConversationId = run.ConversationId;
            transcript.AgentName = run.AgentName;
            transcript.IncludesThinking = includeThinking;
            TranscriptBudget budget = new TranscriptBudget(_Options.MaxBytes);
            Dictionary<string, ApprovalRedactor> redactors = new Dictionary<string, ApprovalRedactor>(StringComparer.Ordinal);
            await AddTurnAsync(transcript, run, 1, includeThinking, budget, redactors, token).ConfigureAwait(false);
            Finish(transcript);
            return transcript;
        }

        /// <summary>
        /// Build the transcript of a conversation: every turn, oldest first, up to <see cref="TranscriptOptions.MaxTurns"/>.
        /// </summary>
        /// <param name="conversation">Conversation, already read within the caller's tenant and authorized.</param>
        /// <param name="includeThinking">Whether thinking events are included.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Transcript.</returns>
        /// <exception cref="ArgumentNullException">Thrown when conversation is null.</exception>
        public async Task<Transcript> BuildConversationAsync(Conversation conversation, bool includeThinking, CancellationToken token = default)
        {
            if (conversation == null) throw new ArgumentNullException(nameof(conversation));
            Transcript transcript = new Transcript();
            transcript.Kind = TranscriptKindEnum.Conversation;
            transcript.TenantId = conversation.TenantId;
            transcript.ConversationId = conversation.Id;
            transcript.AgentName = conversation.AgentName;
            transcript.Title = conversation.Title;
            transcript.IncludesThinking = includeThinking;

            RunFilter filter = new RunFilter();
            filter.TenantId = conversation.TenantId;
            filter.ConversationId = conversation.Id;
            filter.Ordering = EnumerationOrderEnum.CreatedAscending;
            filter.MaxResults = Math.Min(1000, _Options.MaxTurns + 1);
            List<Run> runs = (await _Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).Objects;
            bool tooManyTurns = runs.Count > _Options.MaxTurns;

            TranscriptBudget budget = new TranscriptBudget(_Options.MaxBytes);
            Dictionary<string, ApprovalRedactor> redactors = new Dictionary<string, ApprovalRedactor>(StringComparer.Ordinal);
            int number = 0;
            foreach (Run run in runs.Take(_Options.MaxTurns))
            {
                token.ThrowIfCancellationRequested();
                if (budget.Exhausted)
                {
                    transcript.Truncated = true;
                    transcript.TruncationNote = "The transcript reached the Transcripts.MaxBytes limit (" + _Options.MaxBytes.ToString(CultureInfo.InvariantCulture)
                        + " bytes); turns from run " + run.Id + " on are left out. Export those runs one at a time, or read their events with GET /v1.0/api/tenants/" + run.TenantId + "/runs/{runId}/events.";
                    break;
                }
                number++;
                await AddTurnAsync(transcript, run, number, includeThinking, budget, redactors, token).ConfigureAwait(false);
            }
            if (tooManyTurns && !transcript.Truncated)
            {
                transcript.Truncated = true;
                transcript.TruncationNote = "The conversation has more than " + _Options.MaxTurns.ToString(CultureInfo.InvariantCulture)
                    + " turns (Transcripts.MaxTurns); the oldest are included. List the rest with GET /v1.0/api/tenants/" + conversation.TenantId + "/conversations/" + conversation.Id + "/runs and export them one at a time.";
            }
            Finish(transcript);
            return transcript;
        }

        /// <summary>
        /// File name for a transcript download.
        /// </summary>
        /// <param name="transcript">Transcript.</param>
        /// <param name="format">Format.</param>
        /// <returns>File name such as run_x-transcript.md.</returns>
        /// <exception cref="ArgumentNullException">Thrown when transcript is null.</exception>
        public static string FileName(Transcript transcript, TranscriptFormatEnum format)
        {
            if (transcript == null) throw new ArgumentNullException(nameof(transcript));
            string id = transcript.Kind == TranscriptKindEnum.Conversation ? transcript.ConversationId ?? "conversation" : transcript.RunId ?? "run";
            StringBuilder safe = new StringBuilder();
            foreach (char c in id) safe.Append(Char.IsLetterOrDigit(c) || c == '_' || c == '-' ? c : '_');
            return safe + "-transcript" + (format == TranscriptFormatEnum.Json ? ".json" : ".md");
        }

        #endregion

        #region Private-Methods

        private async Task AddTurnAsync(Transcript transcript, Run run, int number, bool includeThinking, TranscriptBudget budget, Dictionary<string, ApprovalRedactor> redactors, CancellationToken token)
        {
            ApprovalRedactor redactor = await RedactorAsync(run, redactors, token).ConfigureAwait(false);
            TranscriptTurn turn = new TranscriptTurn();
            turn.Turn = number;
            turn.RunId = run.Id;
            turn.AgentName = run.AgentName;
            turn.DeploymentId = run.DeploymentId;
            turn.Kind = run.Kind;
            turn.Status = run.Status;
            turn.Outcome = run.Outcome;
            turn.CallerName = run.CallerName;
            turn.Model = run.ServedModel;
            turn.Input = redactor.Redact(run.InputText);
            turn.InputContentType = run.InputContentType;
            turn.CreatedUtc = run.CreatedUtc;
            turn.StartedUtc = run.StartedUtc;
            turn.CompletedUtc = run.CompletedUtc;
            turn.Result = redactor.Redact(run.ResultText);
            turn.ErrorMessage = redactor.Redact(run.ErrorMessage);
            turn.Usage.InputTokens = run.InputTokens;
            turn.Usage.OutputTokens = run.OutputTokens;
            turn.Usage.CachedTokens = run.CachedTokens;
            turn.Usage.ReasoningTokens = run.ReasoningTokens;
            turn.Usage.ToolCallCount = run.ToolCallCount;
            turn.Usage.CostUsd = run.CostUsd;
            turn.Usage.CostEstimated = run.CostEstimated;
            turn.Usage.DurationMs = run.TotalMs ?? Run.ElapsedMs(run.CreatedUtc, run.CompletedUtc);
            budget.Spend(turn.Input);
            budget.Spend(turn.Result);
            budget.Spend(turn.ErrorMessage);
            transcript.Turns.Add(turn);

            foreach (Approval approval in (await _Database.Approvals.ListByRunAsync(run.Id, 500, token).ConfigureAwait(false)).OrderBy(a => a.RequestedUtc))
            {
                TranscriptApproval item = new TranscriptApproval();
                item.Id = approval.Id;
                item.Kind = approval.Kind;
                item.ToolName = approval.ToolName;
                item.Summary = redactor.Redact(approval.Summary);
                item.InputPreview = redactor.Redact(approval.InputPreview);
                item.Status = approval.Status;
                item.Decision = approval.Decision;
                item.DecisionSource = approval.DecisionSource;
                item.DecidedBy = approval.DecidedBy;
                item.Reason = redactor.Redact(approval.Reason);
                item.RequestedUtc = approval.RequestedUtc;
                item.DecidedUtc = approval.DecidedUtc;
                budget.Spend(item.InputPreview);
                turn.Approvals.Add(item);
            }

            long after = 0;
            long seen = 0;
            while (true)
            {
                token.ThrowIfCancellationRequested();
                List<RunEvent> page = await _Database.RunEvents.ListAfterAsync(run.Id, after, _Options.EventPageSize, token).ConfigureAwait(false);
                foreach (RunEvent evt in page)
                {
                    after = evt.Sequence;
                    seen++;
                    TranscriptEntry? entry = Entry(evt, includeThinking, redactor);
                    if (entry == null) continue;
                    if (!budget.TrySpend(entry.Text))
                    {
                        turn.Truncated = true;
                        transcript.Truncated = true;
                        transcript.TruncationNote = "The transcript reached the Transcripts.MaxBytes limit (" + _Options.MaxBytes.ToString(CultureInfo.InvariantCulture)
                            + " bytes); events of run " + run.Id + " after sequence " + (evt.Sequence - 1).ToString(CultureInfo.InvariantCulture)
                            + " are left out. Read them with GET /v1.0/api/tenants/" + run.TenantId + "/runs/" + run.Id + "/events?afterSequence=" + (evt.Sequence - 1).ToString(CultureInfo.InvariantCulture) + ".";
                        return;
                    }
                    turn.Entries.Add(entry);
                }
                if (page.Count < _Options.EventPageSize) break;
            }
            turn.OmittedEvents = Math.Max(0, run.LastEventSequence - seen);
        }

        private TranscriptEntry? Entry(RunEvent evt, bool includeThinking, ApprovalRedactor redactor)
        {
            switch (evt.EventType)
            {
                case RunEventTypeEnum.AssistantText:
                case RunEventTypeEnum.ToolCall:
                case RunEventTypeEnum.ToolResult:
                case RunEventTypeEnum.Warning:
                case RunEventTypeEnum.Error:
                case RunEventTypeEnum.Lifecycle:
                    break;
                case RunEventTypeEnum.Thinking:
                    if (!includeThinking) return null;
                    break;
                default:
                    return null;
            }
            TranscriptEntry entry = new TranscriptEntry();
            entry.Sequence = evt.Sequence;
            entry.TimestampUtc = evt.TimestampUtc;
            entry.Type = evt.EventType;
            entry.ToolName = evt.ToolName;
            entry.ToolCallId = evt.ToolCallId;
            entry.Success = evt.Success;
            entry.Code = evt.Code;
            string? text = redactor.Redact(evt.Text);
            if ((evt.EventType == RunEventTypeEnum.ToolCall || evt.EventType == RunEventTypeEnum.ToolResult) && text != null && text.Length > _Options.ToolTextMaxChars)
            {
                text = text.Substring(0, _Options.ToolTextMaxChars);
                entry.TextTruncated = true;
            }
            entry.Text = text;
            return entry;
        }

        private async Task<ApprovalRedactor> RedactorAsync(Run run, Dictionary<string, ApprovalRedactor> redactors, CancellationToken token)
        {
            string key = run.DeploymentId ?? String.Empty;
            if (redactors.TryGetValue(key, out ApprovalRedactor? cached)) return cached;
            Deployment? deployment = String.IsNullOrEmpty(run.DeploymentId) ? null : await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            ApprovalRedactor redactor = await _Redactors.ForDeploymentAsync(run.TenantId, deployment, token).ConfigureAwait(false);
            redactors[key] = redactor;
            return redactor;
        }

        private static void Finish(Transcript transcript)
        {
            transcript.TurnCount = transcript.Turns.Count;
            TranscriptUsage total = new TranscriptUsage();
            foreach (TranscriptTurn turn in transcript.Turns) total.Add(turn.Usage);
            transcript.Usage = total;
            transcript.GeneratedUtc = DateTime.UtcNow;
        }

        #endregion
    }
}
