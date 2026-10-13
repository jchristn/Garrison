namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;
    using Garrison.Core.Serialization;
    using Garrison.Core.Telemetry;
    using Garrison.Harnesses;
    using Garrison.Harnesses.AppServer;
    using Garrison.Harnesses.Execution;
    using Garrison.Harnesses.Parsers;
    using Garrison.Harnesses.Preflight;

    /// <summary>
    /// Runs a leased run as a subprocess (plan D-004): creates per-run work, home, and config directories, resolves
    /// worker-side placeholders, prepares the workspace, materializes files, runs MCP pre-flight, launches the harness
    /// with an allowlisted environment, converts stdout into normalized events, enforces the run guards (repetition,
    /// assistant text size, no progress; see <see cref="RunGuard"/>), classifies the outcome, and applies workspace
    /// retention. Thread-safe; each call is independent.
    /// </summary>
    public class ProcessRunExecutor : IRunExecutor
    {
        #region Private-Members

        private readonly ExecutorOptions _Options;
        private readonly ProcessRunner _Runner = new ProcessRunner();
        private readonly WorkspacePreparer _Workspace = new WorkspacePreparer();
        private readonly Action<string>? _Log;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="options">Options.</param>
        /// <param name="log">Optional log callback (never receives secret values).</param>
        /// <exception cref="ArgumentNullException">Thrown when options is null.</exception>
        public ProcessRunExecutor(ExecutorOptions options, Action<string>? log = null)
        {
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Log = log;
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            if (reporter == null) throw new ArgumentNullException(nameof(reporter));

            ExecutionSpec spec = assignment.Spec ?? new ExecutionSpec();
            SecretScrubber scrubber = new SecretScrubber(CollectSecrets(spec));
            RunDirectories directories = RunDirectories.For(_Options.WorkRoot, assignment.RunId, spec);
            RunCompleteRequest complete = new RunCompleteRequest();
            HarnessTiming timing = new HarnessTiming();
            bool succeeded = false;

            try
            {
                ExecutionConversation? conversation = spec.Conversation;
                bool resuming = conversation != null && conversation.Resume && spec.RepairAttempt == 0;
                if (conversation != null && spec.RepairAttempt == 0)
                {
                    if (resuming && !directories.Exists())
                    {
                        // The session this turn resumes lived in directories this node no longer has: report it without
                        // launching, so the control plane requeues the turn as a fresh session seeded with the transcript.
                        string lost = "The directories of conversation " + conversation.ConversationId + " are gone from this node, so turn " + conversation.Turn + " cannot resume its harness session here.";
                        Emit(reporter, scrubber, RunEventTypeEnum.Warning, lost, "ConversationStateLost");
                        _Log?.Invoke("run " + assignment.RunId + ": " + lost + " " + RunTracing.LogFields(assignment.RunId, RunTracing.TraceIdOf(spec.TraceParent)));
                        return Fail(complete, RunOutcomeEnum.ConversationStateLost, lost);
                    }
                    if (!resuming && Directory.Exists(directories.Root))
                    {
                        // A turn that starts a new session (the first turn, or a fallback) starts from fresh directories.
                        Directory.Delete(directories.Root, true);
                    }
                }
                directories.Create();
                if (conversation != null) directories.Touch();
                new PlaceholderResolver(directories).ResolveSpec(spec);
                Dictionary<string, string> environment = BuildEnvironment(spec, directories);

                long workspaceStart = Stopwatch.GetTimestamp();
                using (Activity? workspaceSpan = GarrisonTracing.Start("run:workspace", ActivityKind.Internal, true))
                {
                    try
                    {
                        // A structured output repair, or a conversation turn that resumes, continues the session in the
                        // workspace the earlier execution left.
                        if (spec.RepairAttempt == 0 && !resuming) await _Workspace.PrepareAsync(spec.Workspace, directories, environment, token).ConfigureAwait(false);
                        if (conversation != null) DeleteStaleResult(spec, directories);
                        foreach (ExecutionFile file in spec.Files) await FileMaterializer.WriteAsync(file, directories, token).ConfigureAwait(false);
                        GarrisonTracing.Ok(workspaceSpan);
                    }
                    catch (Exception e) when (e is not OperationCanceledException)
                    {
                        GarrisonTracing.Fail(workspaceSpan, e);
                        return Fail(complete, RunOutcomeEnum.WorkspaceFailed, scrubber.Scrub("Workspace preparation failed: " + e.Message));
                    }
                    finally
                    {
                        GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunStage, GarrisonMetrics.SecondsSince(workspaceStart), "stage", "workspace", "harness", spec.HarnessType.ToString(), "agent", spec.AgentName);
                    }
                }
                if (spec.RepairAttempt > 0) Lifecycle(reporter, "RepairAttemptStarted", "Structured output repair attempt " + spec.RepairAttempt + ": resuming the harness session in " + directories.Workspace + ".");
                else if (resuming) Lifecycle(reporter, "ConversationResumed", "Conversation turn " + conversation!.Turn + ": resuming the harness session in " + directories.Workspace + ".");
                else Lifecycle(reporter, "WorkspacePrepared", "Workspace prepared at " + directories.Workspace + ".");

                if (spec.McpPreflight.Count > 0)
                {
                    McpPreflight preflight = new McpPreflight();
                    preflight.TimeoutMs = _Options.McpPreflightTimeoutMs;
                    McpPreflightResult check;
                    long preflightStart = Stopwatch.GetTimestamp();
                    using (Activity? preflightSpan = GarrisonTracing.Start("run:mcp_preflight", ActivityKind.Internal, true))
                    {
                        check = await preflight.CheckAsync(spec.McpPreflight, token).ConfigureAwait(false);
                        preflightSpan?.SetTag("garrison.mcp_servers", spec.McpPreflight.Count);
                        if (check.Success) GarrisonTracing.Ok(preflightSpan);
                        else GarrisonTracing.Fail(preflightSpan, "MCP pre-flight failed");
                        GarrisonMetrics.Observe(GarrisonMetricCatalog.WorkerRunStage, GarrisonMetrics.SecondsSince(preflightStart), "stage", "preflight", "harness", spec.HarnessType.ToString(), "agent", spec.AgentName);
                    }
                    foreach (string warning in check.Warnings) Emit(reporter, scrubber, RunEventTypeEnum.Warning, warning, "McpPreflightWarning");
                    if (!check.Success) return Fail(complete, RunOutcomeEnum.McpPreflightFailed, scrubber.Scrub(check.Message));
                    Lifecycle(reporter, "McpPreflightPassed", "MCP pre-flight passed for " + spec.McpPreflight.Count + " server(s).");
                }

                HarnessRunState state = new HarnessRunState();
                IHarnessOutputParser parser = ParserFactory.Create(spec.Parser, spec.ParserOptions, spec.McpPreflight.Where(c => c.Required).Select(c => c.Name));

                RunGuardOptions guardOptions = new RunGuardOptions();
                guardOptions.RepetitionGuard = spec.RepetitionGuard;
                guardOptions.MaxAssistantChars = spec.MaxAssistantChars;
                guardOptions.NoProgressSeconds = spec.NoProgressSeconds;
                RunGuard guard = new RunGuard(guardOptions);

                ProcessRunRequest request = new ProcessRunRequest();
                request.Executable = spec.Executable;
                request.Arguments = spec.Arguments;
                request.Environment = environment;
                request.WorkingDirectory = directories.Workspace;
                request.Stdin = spec.Stdin;
                request.TimeoutSeconds = spec.TimeoutSeconds;
                request.KillGraceSeconds = spec.KillGraceSeconds;
                request.MaxOutputBytes = spec.MaxOutputBytes;
                request.StderrTailBytes = spec.StderrTailBytes;
                request.Timing = timing;

                // Codex app-server delivery (P12.2a): the driver holds stdin open, sends the prompt as one turn over
                // JSON-RPC, and returns when the turn completes so stdin closes and the app-server exits.
                CodexAppServerDriver? appServer = spec.AppServer != null ? AppServerDriver(spec, environment, directories, _Log == null ? null : line => _Log("run " + assignment.RunId + " " + line)) : null;
                if (appServer != null)
                {
                    request.Stdin = null;
                    request.StdinDriver = appServer;
                }

                ProcessRunResult process;
                using (appServer)
                using (CancellationTokenSource guardStop = new CancellationTokenSource())
                using (CancellationTokenSource idleLoop = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    int tripped = 0;
                    Action<RunGuardTrip?> onTrip = trip =>
                    {
                        if (trip == null || Interlocked.Exchange(ref tripped, 1) == 1) return;
                        // One Warning event per run, then stop the harness: SIGTERM, SIGKILL after the kill grace.
                        Emit(reporter, scrubber, RunEventTypeEnum.Warning, trip.Reason, RunGuardTrip.EventCode);
                        _Log?.Invoke("run " + assignment.RunId + " stopped by run guard " + trip.Guard + " (" + trip.Outcome + "): " + trip.Reason + " " + RunTracing.LogFields(assignment.RunId, RunTracing.TraceIdOf(spec.TraceParent)));
                        try
                        {
                            guardStop.Cancel();
                        }
                        catch (ObjectDisposedException)
                        {
                        }
                    };
                    request.StopToken = guardStop.Token;
                    Task idle = WatchIdleAsync(guard, onTrip, idleLoop.Token);

                    try
                    {
                        process = await _Runner.RunAsync(
                            request,
                            line =>
                            {
                                appServer?.HandleLine(line);
                                parser.ParseLine(line, state);
                                foreach (RunEventReport report in state.Drain())
                                {
                                    timing.Observe(report);
                                    EmitScrubbed(reporter, scrubber, report);
                                    onTrip(guard.Observe(report));
                                }
                            },
                            pid =>
                            {
                                guard.Start();
                                _Log?.Invoke("run " + assignment.RunId + " started process " + pid + " (" + spec.Executable + ") " + RunTracing.LogFields(assignment.RunId, RunTracing.TraceIdOf(spec.TraceParent)));
                                return reporter.StartedAsync(pid, token);
                            },
                            token).ConfigureAwait(false);
                    }
                    finally
                    {
                        idleLoop.Cancel();
                        try
                        {
                            await idle.ConfigureAwait(false);
                        }
                        catch (OperationCanceledException)
                        {
                        }
                    }
                }
                if (process.StopLatencyMs.HasValue) _Log?.Invoke("run " + assignment.RunId + " harness exited " + process.StopLatencyMs.Value + " ms after the stop request" + (process.Killed ? " (killed after the grace period)" : String.Empty) + " " + RunTracing.LogFields(assignment.RunId, RunTracing.TraceIdOf(spec.TraceParent)));

                parser.Complete(state);
                foreach (RunEventReport report in state.Drain()) EmitScrubbed(reporter, scrubber, report);
                if (String.IsNullOrEmpty(state.ServedModel) && spec.HarnessType == HarnessTypeEnum.Codex && spec.IsolateHome)
                {
                    state.ServedModel = CodexSessionReader.ReadModel(Path.Combine(directories.Home, ".codex"));
                }

                HarnessOutcome outcome = OutcomeClassifier.Classify(spec, process, state, guard.Trip);
                complete.Status = outcome.Status;
                complete.Outcome = outcome.Outcome;
                complete.ErrorMessage = scrubber.Scrub(outcome.ErrorMessage);
                complete.ExitCode = process.ExitCode;
                complete.StderrTail = scrubber.Scrub(process.StderrTail);
                complete.ResultText = scrubber.Scrub(ResultText(spec, state, directories));
                complete.StructuredOutputJson = state.StructuredOutputJson;
                complete.SessionId = state.SessionId;
                complete.ServedModel = state.ServedModel;
                complete.InputTokens = state.InputTokens;
                complete.OutputTokens = state.OutputTokens;
                complete.CachedTokens = state.CachedTokens;
                complete.CostUsd = state.CostUsd;
                complete.ReasoningTokens = state.ReasoningTokens;
                timing.ApplyTo(complete);
                complete.CompletedUtc = DateTime.UtcNow;
                succeeded = complete.Status == RunStatusEnum.Succeeded;

                Lifecycle(reporter, "HarnessExited", "Harness exited" + (process.ExitCode.HasValue ? " with code " + process.ExitCode.Value : String.Empty) + ": " + complete.Status + " (" + complete.Outcome + ").");
                if (spec.Artifacts != null && !token.IsCancellationRequested)
                {
                    int artifacts = await ArtifactUploader.CollectAsync(assignment, directories.Workspace,
                        message => Emit(reporter, scrubber, RunEventTypeEnum.Warning, message, "ArtifactCollectionWarning"), token).ConfigureAwait(false);
                    if (artifacts > 0) Lifecycle(reporter, "ArtifactsCollected", "Collected " + artifacts + " workspace artifact(s).");
                }
                return complete;
            }
            catch (OperationCanceledException) when (token.IsCancellationRequested)
            {
                complete.Status = RunStatusEnum.Cancelled;
                complete.Outcome = RunOutcomeEnum.Cancelled;
                complete.ErrorMessage = "Run was cancelled.";
                timing.ApplyTo(complete);
                complete.CompletedUtc = DateTime.UtcNow;
                return complete;
            }
            catch (Exception e)
            {
                return Fail(complete, RunOutcomeEnum.InternalError, scrubber.Scrub("Worker error: " + e.Message));
            }
            finally
            {
                // Keep the directories when the control plane may ask for a repair in them; the worker host
                // releases them once the run is finally reported. A conversation keeps its directories for the next turn
                // until the conversation sweep removes them.
                bool keepForRepair = (spec.RetainForRepair && succeeded) || spec.RepairAttempt > 0;
                if (spec.Conversation != null) TouchConversation(directories);
                else if (!keepForRepair) Cleanup(directories, spec.Workspace, succeeded, RunTracing.LogFields(assignment.RunId, RunTracing.TraceIdOf(spec.TraceParent)));
            }
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            ExecutionSpec spec = assignment.Spec ?? new ExecutionSpec();
            if (spec.Conversation != null) return;
            Cleanup(new RunDirectories(_Options.WorkRoot, assignment.RunId), spec.Workspace, succeeded, RunTracing.LogFields(assignment.RunId, RunTracing.TraceIdOf(spec.TraceParent)));
        }

        /// <summary>
        /// Delete the directories of conversations that no turn used for longer than the retention, skipping the
        /// conversations of runs still executing on this worker. A later turn of a swept conversation finds its
        /// directories gone and falls back to a fresh session seeded with the transcript.
        /// </summary>
        /// <param name="retention">How long a conversation's directories may sit unused. Zero or less sweeps nothing.</param>
        /// <param name="activeConversationIds">Conversations with a run executing on this worker; never swept.</param>
        /// <returns>Number of conversation directories deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when activeConversationIds is null.</exception>
        public int SweepConversations(TimeSpan retention, ISet<string> activeConversationIds)
        {
            if (activeConversationIds == null) throw new ArgumentNullException(nameof(activeConversationIds));
            if (retention <= TimeSpan.Zero) return 0;
            string root = RunDirectories.ConversationsRoot(_Options.WorkRoot);
            if (!Directory.Exists(root)) return 0;
            int deleted = 0;
            DateTime cutoff = DateTime.UtcNow - retention;
            foreach (string directory in Directory.GetDirectories(root))
            {
                string name = Path.GetFileName(directory);
                if (activeConversationIds.Contains(name)) continue;
                try
                {
                    if (Directory.GetLastWriteTimeUtc(directory) >= cutoff) continue;
                    Directory.Delete(directory, true);
                    deleted++;
                    _Log?.Invoke("removed the directories of conversation " + name + " (unused since before " + cutoff.ToString("o") + ")");
                }
                catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
                {
                    _Log?.Invoke("removing the directories of conversation " + name + " failed: " + e.Message);
                }
            }
            return deleted;
        }

        #endregion

        #region Private-Methods

        private static async Task WatchIdleAsync(RunGuard guard, Action<RunGuardTrip?> onTrip, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                await Task.Delay(1000, token).ConfigureAwait(false);
                RunGuardTrip? trip = guard.CheckIdle();
                if (trip != null)
                {
                    onTrip(trip);
                    return;
                }
            }
        }

        private static CodexAppServerDriver AppServerDriver(ExecutionSpec spec, Dictionary<string, string> environment, RunDirectories directories, Action<string>? log)
        {
            ExecutionAppServer settings = spec.AppServer ?? new ExecutionAppServer();
            CodexAppServerOptions options = new CodexAppServerOptions();
            options.Prompt = spec.Stdin ?? String.Empty;
            options.Cwd = directories.Workspace;
            options.ResumeThreadId = settings.ResumeThreadId;
            options.OutputSchemaJson = settings.OutputSchemaJson;
            options.ApprovalPolicy = settings.ApprovalPolicy;
            options.ClientVersion = typeof(ProcessRunExecutor).Assembly.GetName().Version?.ToString() ?? "0.0.0";
            options.UseApiKeyFrom(environment);
            CodexAppServerDriver driver = new CodexAppServerDriver(options);
            if (spec.ApprovalRelay != null)
            {
                // Permission approvals (P12.3): command and file change requests go to garrison_permission_prompt with the
                // run token; everything else keeps the headless answer.
                CodexApprovalRelay relay = new CodexApprovalRelay(spec.ApprovalRelay);
                relay.Log = log;
                relay.Attach(driver);
            }
            return driver;
        }

        private Dictionary<string, string> BuildEnvironment(ExecutionSpec spec, RunDirectories directories)
        {
            Dictionary<string, string> environment = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (string name in _Options.EnvironmentAllowlist)
            {
                string? value = Environment.GetEnvironmentVariable(name);
                if (!String.IsNullOrEmpty(value)) environment[name] = value;
            }

            if (spec.IsolateHome)
            {
                environment["HOME"] = directories.Home;
                environment["USERPROFILE"] = directories.Home;
                string codexHome = Path.Combine(directories.Home, ".codex");
                Directory.CreateDirectory(codexHome);
                environment["CODEX_HOME"] = codexHome;
            }
            else
            {
                string? home = Environment.GetEnvironmentVariable("HOME");
                if (!String.IsNullOrEmpty(home)) environment["HOME"] = home;
            }

            environment["GARRISON_RUN_ID"] = spec.RunId;
            if (!String.IsNullOrEmpty(spec.TraceParent)) environment["TRACEPARENT"] = spec.TraceParent;
            foreach (ExecutionEnvironmentVariable variable in spec.Environment)
            {
                if (String.IsNullOrEmpty(variable.Name)) continue;
                environment[variable.Name] = variable.Value ?? String.Empty;
            }
            return environment;
        }

        private static string? ResultText(ExecutionSpec spec, HarnessRunState state, RunDirectories directories)
        {
            switch (spec.ResultSource)
            {
                case ResultSourceEnum.LastMessageFile:
                    if (!String.IsNullOrEmpty(spec.ResultFileName))
                    {
                        try
                        {
                            string path = SafePaths.Combine(directories.Config, spec.ResultFileName);
                            if (File.Exists(path)) return File.ReadAllText(path).TrimEnd();
                        }
                        catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
                        {
                        }
                    }
                    return state.BestText();
                case ResultSourceEnum.Stdout:
                    return state.Stdout.ToString().TrimEnd();
                default:
                    return state.BestText();
            }
        }

        private static IEnumerable<string> CollectSecrets(ExecutionSpec spec)
        {
            List<string> values = new List<string>(spec.ScrubValues);
            values.AddRange(spec.Environment.Where(v => v.IsSecret).Select(v => v.Value));
            foreach (ExecutionMcpCheck check in spec.McpPreflight) values.AddRange(check.Headers.Where(h => h.IsSecret).Select(h => h.Value));
            if (!String.IsNullOrEmpty(spec.Workspace.GitPassword)) values.Add(spec.Workspace.GitPassword);
            return values;
        }

        private static void EmitScrubbed(IRunReporter reporter, SecretScrubber scrubber, RunEventReport report)
        {
            report.Text = scrubber.Scrub(report.Text);
            report.RawEventJson = scrubber.Scrub(report.RawEventJson);
            reporter.Emit(report);
        }

        private static void Emit(IRunReporter reporter, SecretScrubber scrubber, RunEventTypeEnum type, string? text, string? code = null)
        {
            RunEventReport report = new RunEventReport();
            report.EventType = type;
            report.Text = text;
            report.Code = code;
            EmitScrubbed(reporter, scrubber, report);
        }

        private static void Lifecycle(IRunReporter reporter, string code, string text)
        {
            RunEventReport report = new RunEventReport();
            report.EventType = RunEventTypeEnum.Lifecycle;
            report.Code = code;
            report.Text = text;
            reporter.Emit(report);
        }

        private static RunCompleteRequest Fail(RunCompleteRequest complete, RunOutcomeEnum outcome, string? message)
        {
            complete.Status = RunStatusEnum.Failed;
            complete.Outcome = outcome;
            complete.ErrorMessage = message;
            complete.CompletedUtc = DateTime.UtcNow;
            return complete;
        }

        private static void DeleteStaleResult(ExecutionSpec spec, RunDirectories directories)
        {
            // A conversation's config directory outlives each turn; a result file left by the previous turn must not be
            // read as this turn's answer.
            if (spec.ResultSource != ResultSourceEnum.LastMessageFile || String.IsNullOrEmpty(spec.ResultFileName)) return;
            string path = SafePaths.Combine(directories.Config, spec.ResultFileName);
            if (File.Exists(path)) File.Delete(path);
        }

        private void TouchConversation(RunDirectories directories)
        {
            try
            {
                directories.Touch();
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                _Log?.Invoke("could not mark " + directories.Root + " as used: " + e.Message);
            }
        }

        private void Cleanup(RunDirectories directories, ExecutionWorkspace workspace, bool succeeded, string logFields)
        {
            WorkspaceRetentionEnum retention = workspace.Retention;
            // A PersistentVolume workspace is a mounted claim whose contents outlive the run: never delete it.
            bool keepWorkspace = workspace.Kind == WorkspaceKindEnum.PersistentVolume || retention == WorkspaceRetentionEnum.Keep || (retention == WorkspaceRetentionEnum.KeepOnFailure && !succeeded);
            try
            {
                if (Directory.Exists(directories.Config)) Directory.Delete(directories.Config, true);
                if (Directory.Exists(directories.Home)) Directory.Delete(directories.Home, true);
                if (!keepWorkspace && Directory.Exists(directories.Root)) Directory.Delete(directories.Root, true);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                _Log?.Invoke("cleanup of " + directories.Root + " failed: " + e.Message + " " + logFields);
            }
        }

        #endregion
    }
}
