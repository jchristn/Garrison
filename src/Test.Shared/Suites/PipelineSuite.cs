namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Settings;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Runtime;
    using SyslogLogging;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Pipelines (plan P12.9): ordered agent stages with optional review gates. Covers definition CRUD and validation,
    /// tenant isolation and permissions, handoff through PipelineStage templates (with precedence, pins, and truncation),
    /// reviews (approve with notes, request changes, reject, timeouts), retries, continue on failure, cancellation paths,
    /// resume, deadlines, transient and permanent start failures, idempotent advancement under concurrency, crash repair by
    /// the sweep, and retention. Stages use the fake harness, which echoes its stdin ("Echo: ...") unless a deployment sets
    /// an answer, so a stage's output shows the prompt it received.
    /// </summary>
    public static class PipelineSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("pipeline-unit", "transient-start", "Only a CompileFailed stage run whose error starts with QuotaExceeded: is a transient start failure", TransientStartAsync));
            unit.Add(new TestCaseDescriptor("pipeline-unit", "compile-context", "Compiler: the built-in stage template renders the previous output, structured output, artifacts, review notes, and revision feedback; stage handoff templates win over deployment bindings and respect pins", CompileContextAsync));
            suites.Add(new TestSuiteDescriptor("pipeline-unit", "Pipelines (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "pipelines-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "crud-validation", "Definitions: CRUD by id and name, stage order and parameters, versioning, unique names, validation (empty, too many stages, agent and deployment mismatch, template kind, ranges, parameters), manifest apply and export (" + provider + ")", ct => CrudValidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "handoff", "Four fake stages hand off through templates: built-in wording, truncation, stage template pinned over the deployment binding, deployment binding, recorded template versions (" + provider + ")", ct => HandoffAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "reviews", "Reviews: request changes re-runs the stage with feedback, the revision limit answers 409, approve notes reach the next stage, repeat decisions answer 409, RBAC and tenant isolation (" + provider + ")", ct => ReviewsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "reject-timeouts", "Reviews: reject fails ReviewRejected; timeouts approve or expire (ReviewExpired) through the sweep (" + provider + ")", ct => RejectTimeoutsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "retries-resume", "Failures: retries up to maxAttempts then StageFailed, stage run retry 409 PipelineStageRun, continueOnFailure, resume at the failed stage (" + provider + ")", ct => RetriesResumeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "cancel-deadline", "Cancellation during a stage and during a review, direct stage run cancel, in-use guards, run tokens refused, delete, and the deadline (" + provider + ")", ct => CancelDeadlineAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "start-failures", "Start failures: QuotaExceeded blocks and the sweep retries; an inactive agent fails StageStartFailed (" + provider + ")", ct => StartFailuresAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "concurrency", "Idempotency: 16 parallel advances create one stage run, one Idempotency-Key starts one pipeline run, and the sweep repairs crashes between claim, create, and link (" + provider + ")", ct => ConcurrencyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "retention", "Retention keeps stage runs of active pipeline runs and prunes finished pipeline runs (" + provider + ")", ct => RetentionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sweep-fairness", "The sweep reads only pipeline runs that need work and pages past the batch size: runs parked at reviews do not starve a newer run (" + provider + ")", ct => SweepFairnessAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sweep-budget", "A pipeline sweep longer than the pause grace is not taken for a host pause, and its time budget leaves the rest to the next sweep (" + provider + ")", ct => SweepBudgetAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "repairs", "One run per stage execution without a time window (unique index), a stale timeout that lost its compare-and-set has no side effects, and AwaitingReview without a review is repaired to Running (" + provider + ")", ct => RepairsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "quota-at-compile", "A stage run refused with QuotaExceeded at compile time waits and starts a new execution without using an attempt, then succeeds after the backoff (" + provider + ")", ct => QuotaAtCompileAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "resume-guards", "A resume after a rejection carries the reject comment as revision feedback; resuming after an earlier stage run was pruned answers 409 PipelineHistoryPruned; deleting a reopened pipeline run deletes nothing (" + provider + ")", ct => ResumeGuardsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Pipelines (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static DatabaseDriverBase Db(TestServerHost host)
        {
            return host.Server.Context.Database;
        }

        private static async Task<TestCluster> ClusterAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false);
            // The tests drive the sweep themselves; keep the leader's own pass out of the way.
            cluster.Server.Server.Context.Get<RuntimeOptions>().PipelineSweepIntervalMs = 600000;
            return cluster;
        }

        private static Task<Agent> AgentAsync(TestCluster cluster, string name, CancellationToken token, Action<Deployment>? configure = null)
        {
            // echoChars 0: the fake harness echoes its whole stdin, so a stage's output shows the full prompt it received.
            return cluster.CreateAgentAsync(name, "builtin/fake", null, token, d =>
            {
                d.Parameters.Add(new DeploymentParameter { Name = "echoChars", Value = "0" });
                configure?.Invoke(d);
            });
        }

        private static async Task<Deployment> DeploymentOfAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            return (await Db(host).Deployments.ListByAgentAsync(host.TenantId, agent.Id, token).ConfigureAwait(false)).Single();
        }

        private static PipelineStage Stage(Agent agent, string name, Action<PipelineStage>? configure = null)
        {
            PipelineStage stage = new PipelineStage();
            stage.Name = name;
            stage.AgentId = agent.Id;
            configure?.Invoke(stage);
            return stage;
        }

        private static Pipeline Definition(string name, params PipelineStage[] stages)
        {
            Pipeline pipeline = new Pipeline();
            pipeline.Name = name;
            pipeline.Description = "Test pipeline " + name;
            pipeline.Stages = stages.ToList();
            return pipeline;
        }

        private static Task<Pipeline> CreateAsync(TestServerHost host, Pipeline pipeline, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", pipeline, 201, token);
        }

        private static Task<PipelineRun> StartAsync(TestServerHost host, Pipeline pipeline, string input, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines/" + pipeline.Id + "/start", new PipelineStartRequest { Input = input }, 201, token);
        }

        private static Task<PipelineRun> ReadRunAsync(TestServerHost host, string id, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Get, T(host) + "/pipeline-runs/" + id, null, 200, token);
        }

        private static async Task<PipelineRun> WaitForAsync(TestServerHost host, string id, Func<PipelineRun, bool> done, string what, CancellationToken token, int seconds = 90)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(seconds);
            while (true)
            {
                PipelineRun run = await ReadRunAsync(host, id, token).ConfigureAwait(false);
                if (done(run)) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Pipeline run " + id + " did not reach " + what + " in time (status " + run.Status + ", outcome " + run.Outcome + ", position " + run.CurrentPosition + ": " + run.ErrorMessage + ").");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static Task<PipelineRun> WaitTerminalAsync(TestServerHost host, string id, CancellationToken token)
        {
            return WaitForAsync(host, id, r => PipelineService.IsTerminal(r.Status), "a terminal status", token);
        }

        private static async Task<Run> WaitRunAsync(TestServerHost host, string runId, Func<Run, bool> done, string what, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(90);
            while (true)
            {
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + runId, null, 200, token).ConfigureAwait(false);
                if (done(run)) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Run " + runId + " did not reach " + what + " in time (status " + run.Status + ").");
                await Task.Delay(100, token).ConfigureAwait(false);
            }
        }

        private static async Task<List<Run>> StageRunsAsync(TestServerHost host, string pipelineRunId, CancellationToken token)
        {
            RunFilter filter = new RunFilter();
            filter.TenantId = host.TenantId;
            filter.PipelineRunId = pipelineRunId;
            filter.MaxResults = 1000;
            filter.Ordering = EnumerationOrderEnum.CreatedAscending;
            return (await Db(host).Runs.EnumerateAsync(filter, token).ConfigureAwait(false)).Objects.OrderBy(r => r.PipelinePosition).ThenBy(r => r.PipelineExecution).ToList();
        }

        private static async Task<Run> StageRunAsync(TestServerHost host, string pipelineRunId, int position, int execution, CancellationToken token)
        {
            Run? run = (await StageRunsAsync(host, pipelineRunId, token).ConfigureAwait(false)).FirstOrDefault(r => r.PipelinePosition == position && r.PipelineExecution == execution);
            Run found = Assert.NotNull(run, "Stage run " + position + "." + execution + " of " + pipelineRunId);
            return Assert.NotNull(await Db(host).Runs.ReadAsync(host.TenantId, found.Id, token).ConfigureAwait(false), "Stage run " + found.Id);
        }

        private static async Task<PipelineReview> PendingReviewAsync(TestServerHost host, string pipelineRunId, CancellationToken token)
        {
            EnumerationResult<PipelineReview> page = await HttpTestHelpers.SendAsync<EnumerationResult<PipelineReview>>(host.AdminClient, HttpMethod.Get, T(host) + "/pipeline-reviews?status=Pending&pipelineRunId=" + pipelineRunId, null, 200, token).ConfigureAwait(false);
            Assert.Equal(1, page.Objects.Count, "One pending review of " + pipelineRunId);
            return page.Objects[0];
        }

        private static Task<TestResponse> DecideAsync(HttpClient client, TestServerHost host, string reviewId, PipelineReviewDecisionEnum? decision, string? comment, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/pipeline-reviews/" + reviewId + "/decide", new PipelineReviewDecideRequest { Decision = decision, Comment = comment }, token);
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static async Task<PromptTemplate> TemplateAsync(TestServerHost host, string name, PromptTemplateKindEnum kind, string content, CancellationToken token)
        {
            PromptTemplateRequest request = new PromptTemplateRequest();
            request.Name = name;
            request.Kind = kind;
            request.Content = content;
            return await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", request, 201, token).ConfigureAwait(false);
        }

        private static async Task CompileContextAsync(CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(DatabaseTypeEnum.Sqlite, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("fake", false, token).ConfigureAwait(false);
                Run run = CompilerFixture.RunFor(deployment, false);
                run.Kind = RunKindEnum.Pipeline;
                run.PipelineRunId = "plr_unit";
                run.PipelinePosition = 2;
                run.PipelineExecution = 2;

                CompilationPipeline pipeline = new CompilationPipeline { PipelineId = "ppl_unit", PipelineName = "unit-flow", PipelineRunId = "plr_unit", Position = 2, StageName = "review", StageCount = 3 };
                CompilationPipelineStage previous = new CompilationPipelineStage { Position = 1, StageName = "draft", AgentName = "writer", Status = "Succeeded", Outcome = "Succeeded", Output = "PREVIOUS-OUTPUT", OutputTruncated = true, Structured = "{\"title\":\"STRUCTURED-TITLE\"}" };
                previous.Artifacts.Add(new CompilationPipelineArtifact { Id = "art_unit", Name = "report.md", MediaType = "text/markdown", SizeBytes = 42 });
                pipeline.Previous = previous;
                pipeline.Stages.Add(previous);
                pipeline.ReviewNotes = "REVIEW-NOTES";
                pipeline.Revision = new CompilationPipelineRevision { Number = 1, Feedback = "REVISION-FEEDBACK", Reviewer = "admin@garrison", PreviousOutput = "OLD-OUTPUT" };

                CompilationResult built = await fixture.Compiler.CompileAsync(run, null, null, pipeline, token).ConfigureAwait(false);
                string stdin = built.Spec.Stdin ?? String.Empty;
                foreach (string expected in new[] { "stage 2 of 3", "\"review\"", "unit-flow", "--- Output of draft ---", "PREVIOUS-OUTPUT [cut short]", "STRUCTURED-TITLE", "report.md (text/markdown, 42 bytes, artifact art_unit)", "REVIEW-NOTES", "revision 1", "REVISION-FEEDBACK", "from admin@garrison", "OLD-OUTPUT", "--- Your task ---", "Summarize the repository." })
                {
                    Assert.True(stdin.Contains(expected, StringComparison.Ordinal), "Built-in stage prompt contains '" + expected + "':\n" + stdin);
                }
                Assert.True(built.TemplateVersions.Any(v => v.TemplateName == InvocationCompiler.PipelineStageTemplateName), "builtin/pipeline-stage version recorded");
                Assert.True(built.TemplateVersions.Any(v => v.TemplateName == InvocationCompiler.PipelineRevisionTemplateName), "builtin/pipeline-revision version recorded");

                pipeline.Revision = null;
                pipeline.ReviewNotes = null;
                string plain = (await fixture.Compiler.CompileAsync(run, null, null, pipeline, token).ConfigureAwait(false)).Spec.Stdin ?? String.Empty;
                Assert.True(!plain.Contains("did not accept your previous attempt", StringComparison.Ordinal) && !plain.Contains("approved the previous stage", StringComparison.Ordinal), "No review wording without notes or a revision");

                PromptTemplate bound = new PromptTemplate { TenantId = CompilerFixture.TenantId, Name = "deploy-stage", Kind = PromptTemplateKindEnum.Task, Content = "<<DEPLOY>>{{pipeline.task}}" };
                await fixture.Database.PromptTemplates.CreateAsync(bound, token).ConfigureAwait(false);
                deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = InvocationCompiler.PipelineStageRole, TemplateId = bound.Id });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                Assert.True((await fixture.Compiler.CompileAsync(run, null, null, pipeline, token).ConfigureAwait(false)).Spec.Stdin!.StartsWith("<<DEPLOY>>", StringComparison.Ordinal), "The deployment binding replaces the built-in template");

                PromptTemplate handoff = new PromptTemplate { TenantId = CompilerFixture.TenantId, Name = "stage-handoff", Kind = PromptTemplateKindEnum.Task, Content = "<<V1>>{{pipeline.task}}" };
                await fixture.Database.PromptTemplates.CreateAsync(handoff, token).ConfigureAwait(false);
                await fixture.Database.PromptTemplateVersions.CreateAsync(new PromptTemplateVersion { TenantId = CompilerFixture.TenantId, TemplateId = handoff.Id, Version = 1, Content = handoff.Content }, token).ConfigureAwait(false);
                handoff.Content = "<<V2>>{{pipeline.task}}";
                handoff.CurrentVersion = 2;
                await fixture.Database.PromptTemplates.UpdateAsync(handoff, token).ConfigureAwait(false);
                await fixture.Database.PromptTemplateVersions.CreateAsync(new PromptTemplateVersion { TenantId = CompilerFixture.TenantId, TemplateId = handoff.Id, Version = 2, Content = handoff.Content }, token).ConfigureAwait(false);
                pipeline.HandoffTemplateId = handoff.Id;
                Assert.True((await fixture.Compiler.CompileAsync(run, null, null, pipeline, token).ConfigureAwait(false)).Spec.Stdin!.StartsWith("<<V2>>", StringComparison.Ordinal), "The stage handoff template wins over the deployment binding");
                pipeline.HandoffTemplateVersion = 1;
                CompilationResult pinned = await fixture.Compiler.CompileAsync(run, null, null, pipeline, token).ConfigureAwait(false);
                Assert.True(pinned.Spec.Stdin!.StartsWith("<<V1>>", StringComparison.Ordinal), "A pinned handoff version renders that version");
                Assert.True(pinned.TemplateVersions.Any(v => v.TemplateId == handoff.Id && v.Version == 1), "The pinned version is recorded");

                Run outside = CompilerFixture.RunFor(deployment, false);
                Assert.Equal("Summarize the repository.", ((await fixture.Compiler.CompileAsync(outside, null, token).ConfigureAwait(false)).Spec.Stdin ?? String.Empty).TrimEnd(), "Runs outside a pipeline are not wrapped");
            }
        }

        private static async Task CrudValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent writer = await AgentAsync(cluster, "crud-writer", token, d => d.AllowedRunOverrides.Add(new DeploymentRunOverrideRule { Name = "model", Validation = RunOverrideValidationEnum.Enum, Pattern = "small,large" })).ConfigureAwait(false);
                Agent editor = await AgentAsync(cluster, "crud-editor", token).ConfigureAwait(false);
                Deployment writerDeployment = await DeploymentOfAsync(host, writer, token).ConfigureAwait(false);
                Deployment editorDeployment = await DeploymentOfAsync(host, editor, token).ConfigureAwait(false);
                PromptTemplate system = await TemplateAsync(host, "crud-system", PromptTemplateKindEnum.System, "system", token).ConfigureAwait(false);

                Pipeline definition = Definition("crud-flow",
                    Stage(writer, "draft", s => { s.DeploymentId = writerDeployment.Id; s.Parameters.Add(new PipelineStageParameter { Name = "model", Value = "large" }); s.MaxAttempts = 2; }),
                    Stage(editor, "edit", s => { s.RequiresReview = true; s.ReviewTimeoutSeconds = 30; s.ReviewTimeoutAction = PipelineReviewDecisionEnum.Approve; s.MaxRevisions = 2; }),
                    Stage(writer, "final"));
                Pipeline created = await CreateAsync(host, definition, token).ConfigureAwait(false);
                Assert.True(created.Id.StartsWith(Constants.PipelineIdPrefix, StringComparison.Ordinal), "Pipeline prefix");
                Assert.Equal(1, created.Version, "Version starts at 1");
                Pipeline byName = await HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Get, T(host) + "/pipelines/crud-flow", null, 200, token).ConfigureAwait(false);
                Assert.Equal(created.Id, byName.Id, "Read by name");
                Assert.Equal("draft,edit,final", String.Join(",", byName.Stages.Select(s => s.Name)), "Stage order");
                Assert.True(byName.Stages.All(s => s.Id.StartsWith(Constants.PipelineStageIdPrefix, StringComparison.Ordinal)), "Stage prefix");
                Assert.Equal("model=large", String.Join(",", byName.Stages[0].Parameters.Select(p => p.Name + "=" + p.Value)), "Stage parameters");
                Assert.True(byName.Stages[1].RequiresReview && byName.Stages[1].ReviewTimeoutAction == PipelineReviewDecisionEnum.Approve && byName.Stages[1].MaxRevisions == 2, "Review settings");
                EnumerationResult<Pipeline> list = await HttpTestHelpers.SendAsync<EnumerationResult<Pipeline>>(host.AdminClient, HttpMethod.Get, T(host) + "/pipelines", null, 200, token).ConfigureAwait(false);
                Assert.True(list.Objects.Any(p => p.Id == created.Id), "Listed");

                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-flow", Stage(writer, "only")), token).ConfigureAwait(false), 409, "NameConflict", "Duplicate name");
                created.Stages.RemoveAt(2);
                created.Stages.Reverse();
                Pipeline updated = await HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Put, T(host) + "/pipelines/" + created.Id, created, 200, token).ConfigureAwait(false);
                Assert.Equal(2, updated.Version, "Update increments the version");
                Assert.Equal("edit,draft", String.Join(",", updated.Stages.Select(s => s.Name + "")), "Update replaces stages in the new order");

                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-empty"), token).ConfigureAwait(false), 400, "stages", "No stages");
                RuntimeOptions options = host.Server.Context.Get<RuntimeOptions>();
                options.PipelineMaxStages = 2;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-long", Stage(writer, "a"), Stage(writer, "b"), Stage(writer, "c")), token).ConfigureAwait(false), 400, "Runtime.PipelineMaxStages", "Too many stages");
                options.PipelineMaxStages = 20;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-mismatch", Stage(writer, "a", s => s.DeploymentId = editorDeployment.Id)), token).ConfigureAwait(false), 400, "belongs to another agent", "Deployment of another agent");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-kind", Stage(writer, "a", s => s.HandoffTemplateId = system.Id)), token).ConfigureAwait(false), 400, "must be a Task template", "Wrong template kind");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-range", Stage(writer, "a", s => { s.MaxAttempts = 9; s.OutputCharLimit = 10; })), token).ConfigureAwait(false), 400, "maxAttempts", "Ranges");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-names", Stage(writer, "same"), Stage(editor, "same")), token).ConfigureAwait(false), 400, "used twice", "Duplicate stage names");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-agent", Stage(new Agent { Id = "agt_missing" }, "a")), token).ConfigureAwait(false), 400, "agentId", "Unknown agent");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-params", Stage(editor, "a", s => s.Parameters.Add(new PipelineStageParameter { Name = "model", Value = "x" }))), token).ConfigureAwait(false), 400, "need a deploymentId", "Parameters without a deployment");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("crud-param", Stage(writer, "a", s => { s.DeploymentId = writerDeployment.Id; s.Parameters.Add(new PipelineStageParameter { Name = "model", Value = "huge" }); })), token).ConfigureAwait(false), 400, "ParameterInvalid", "Parameter outside the allowed values");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", Definition("Bad Name", Stage(writer, "a")), token).ConfigureAwait(false), 400, "name", "Name format");

                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + editor.Id, null, token).ConfigureAwait(false), 409, "ReferencedByPipeline", "Agent used by a pipeline");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/deployments/" + writerDeployment.Id, null, token).ConfigureAwait(false), 409, "ReferencedByPipeline", "Deployment pinned by a pipeline");

                string manifest = "apiVersion: garrison/v1\nkind: Pipeline\nmetadata:\n  name: crud-manifest\n  description: From a manifest\nspec:\n  maxDurationSeconds: 600\n  stages:\n    - name: first\n      agent: crud-writer\n      deployment: " + writerDeployment.Name + "\n      maxAttempts: 2\n      parameters:\n        model: small\n    - name: second\n      agent: crud-editor\n      requiresReview: true\n      reviewTimeoutAction: Approve\n";
                using (StringContent content = new StringContent(manifest, Encoding.UTF8, "application/yaml"))
                {
                    HttpResponseMessage applied = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", content, token).ConfigureAwait(false);
                    string body = await applied.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    Assert.Equal(200, (int)applied.StatusCode, "Manifest apply (" + body + ")");
                }
                Pipeline fromManifest = Assert.NotNull(await Db(host).Pipelines.ReadByNameAsync(host.TenantId, "crud-manifest", token).ConfigureAwait(false), "Pipeline from the manifest");
                Assert.True(fromManifest.MaxDurationSeconds == 600 && fromManifest.Stages.Count == 2 && fromManifest.Stages[0].DeploymentId == writerDeployment.Id && fromManifest.Stages[0].MaxAttempts == 2 && fromManifest.Stages[1].RequiresReview && fromManifest.Stages[1].ReviewTimeoutAction == PipelineReviewDecisionEnum.Approve, "Manifest stages resolved by name");
                HttpResponseMessage exported = await host.AdminClient.PostAsync(T(host) + "/manifests/export", null, token).ConfigureAwait(false);
                string yaml = await exported.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.True(yaml.Contains("kind: Pipeline", StringComparison.Ordinal) && yaml.Contains("crud-manifest", StringComparison.Ordinal) && yaml.Contains("agent: crud-writer", StringComparison.Ordinal), "Export includes pipelines by name:\n" + yaml);
                using (StringContent again = new StringContent(manifest, Encoding.UTF8, "application/yaml"))
                {
                    HttpResponseMessage reapplied = await host.AdminClient.PostAsync(T(host) + "/manifests/apply", again, token).ConfigureAwait(false);
                    ManifestApply result = Assert.NotNull(Serializer.Deserialize<ManifestApply>(await reapplied.Content.ReadAsStringAsync(token).ConfigureAwait(false)), "Apply result");
                    Assert.Equal(1, result.UnchangedCount, "Re-applying the same manifest leaves the pipeline unchanged");
                }

                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/pipelines/" + created.Id, null, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/pipelines/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Deleted");
            }
        }

        private static async Task HandoffAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string draft = "DRAFT:" + new string('x', 1500) + ":END";
                Agent writer = await AgentAsync(cluster, "handoff-writer", token, d => d.Parameters.Add(new DeploymentParameter { Name = "answer", Value = draft })).ConfigureAwait(false);
                Agent editor = await AgentAsync(cluster, "handoff-editor", token).ConfigureAwait(false);
                PromptTemplate deployTemplate = await TemplateAsync(host, "handoff-deploy", PromptTemplateKindEnum.Task, "<<DEPLOY>> after {{pipeline.previous.stageName}}\n{{pipeline.task}}", token).ConfigureAwait(false);
                Agent publisher = await AgentAsync(cluster, "handoff-publisher", token, d => d.PromptBindings.Add(new DeploymentPromptBinding { Role = InvocationCompiler.PipelineStageRole, TemplateId = deployTemplate.Id })).ConfigureAwait(false);
                PromptTemplate pinned = await TemplateAsync(host, "handoff-pinned", PromptTemplateKindEnum.Task, "<<PINNED-V1>>{{#each pipeline.stages}}[{{this.stageName}}]{{/each}}\n{{pipeline.task}}", token).ConfigureAwait(false);

                Pipeline pipeline = await CreateAsync(host, Definition("handoff-flow",
                    Stage(writer, "draft"),
                    Stage(editor, "edit", s => s.OutputCharLimit = 1000),
                    Stage(publisher, "publish", s => { s.HandoffTemplateId = pinned.Id; s.HandoffTemplateVersion = 1; }),
                    Stage(publisher, "archive")), token).ConfigureAwait(false);

                PromptTemplateRequest v2 = new PromptTemplateRequest { Name = "handoff-pinned", Kind = PromptTemplateKindEnum.Task, Content = "<<PINNED-V2>>{{pipeline.task}}" };
                await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Put, T(host) + "/prompt-templates/" + pinned.Id, v2, 200, token).ConfigureAwait(false);

                PipelineRun started = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines/" + pipeline.Id + "/start?wait=true&waitSeconds=120", new PipelineStartRequest { Input = "Write the release notes" }, 201, token).ConfigureAwait(false);
                Assert.True(started.Id.StartsWith(Constants.PipelineRunIdPrefix, StringComparison.Ordinal), "Pipeline run prefix");
                PipelineRun done = await WaitTerminalAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, done.Status, "Pipeline status (" + done.ErrorMessage + ")");
                Assert.Equal(PipelineRunOutcomeEnum.Succeeded, done.Outcome, "Outcome");
                Assert.Equal(4, done.Runs.Count, "One run per stage");
                Assert.True(done.Stages.All(s => s.Status == PipelineStageStatusEnum.Succeeded && s.Executions == 1), "Every stage succeeded once");

                Run first = await StageRunAsync(host, done.Id, 1, 1, token).ConfigureAwait(false);
                Run second = await StageRunAsync(host, done.Id, 2, 1, token).ConfigureAwait(false);
                Run third = await StageRunAsync(host, done.Id, 3, 1, token).ConfigureAwait(false);
                Run fourth = await StageRunAsync(host, done.Id, 4, 1, token).ConfigureAwait(false);
                Assert.Equal(fourth.Id, done.FinalRunId, "Final run");
                Assert.True(first.Kind == RunKindEnum.Pipeline && first.InputText == "Write the release notes", "Stage runs receive the caller's input");
                Assert.True((first.ResultText ?? String.Empty).StartsWith("DRAFT:", StringComparison.Ordinal) && (first.ResultText ?? String.Empty).Contains(":END", StringComparison.Ordinal), "Stage 1 answer");

                string edit = second.ResultText ?? String.Empty;
                Assert.True(edit.Contains("stage 2 of 4", StringComparison.Ordinal) && edit.Contains("--- Output of draft ---", StringComparison.Ordinal), "The built-in template introduces the previous stage: " + edit.Substring(0, Math.Min(3000, edit.Length)));
                Assert.True(edit.Contains("DRAFT:xxx", StringComparison.Ordinal) && !edit.Contains(":END", StringComparison.Ordinal) && edit.Contains("[cut short]", StringComparison.Ordinal), "The previous output is cut at outputCharLimit and marked");
                Assert.True(edit.Contains("Write the release notes", StringComparison.Ordinal), "The stage's own task is rendered inside");
                Assert.True(second.TemplateVersions.Any(v => v.TemplateName == InvocationCompiler.PipelineStageTemplateName), "builtin/pipeline-stage recorded on the stage run");

                string publish = third.ResultText ?? String.Empty;
                Assert.True(publish.Contains("<<PINNED-V1>>[draft][edit]", StringComparison.Ordinal) && !publish.Contains("<<DEPLOY>>", StringComparison.Ordinal) && !publish.Contains("PINNED-V2", StringComparison.Ordinal), "The stage template, pinned to version 1, wins over the deployment binding: " + publish.Substring(0, Math.Min(300, publish.Length)));
                Assert.True(third.TemplateVersions.Any(v => v.TemplateId == pinned.Id && v.Version == 1), "The pinned version is recorded");
                Assert.True((fourth.ResultText ?? String.Empty).Contains("<<DEPLOY>> after publish", StringComparison.Ordinal), "Without a stage template the deployment binding renders");

                EnumerationResult<PipelineRun> listed = await HttpTestHelpers.SendAsync<EnumerationResult<PipelineRun>>(host.AdminClient, HttpMethod.Get, T(host) + "/pipeline-runs?pipelineId=" + pipeline.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(1L, listed.TotalRecords, "Pipeline runs of the pipeline");
                EnumerationResult<Run> stageRuns = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?pipelineRunId=" + done.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(4L, stageRuns.TotalRecords, "Runs filter by pipelineRunId");
                PipelinePreviewResponse preview = await HttpTestHelpers.SendAsync<PipelinePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines/" + pipeline.Id + "/preview", new PipelinePreviewRequest { Input = "Preview input", SampleOutputs = new List<string> { "SAMPLE-ONE", "SAMPLE-TWO" } }, 200, token).ConfigureAwait(false);
                Assert.True(preview.Stages.Count == 4 && preview.Stages.All(s => s.Success), "Every stage previews");
                Assert.True((preview.Stages[1].Prompt ?? String.Empty).Contains("SAMPLE-ONE", StringComparison.Ordinal) && (preview.Stages[2].Prompt ?? String.Empty).StartsWith("<<PINNED-V1>>", StringComparison.Ordinal), "Previews render the sample outputs through the same templates");
            }
        }

        private static async Task ReviewsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent author = await AgentAsync(cluster, "review-author", token).ConfigureAwait(false);
                Agent finisher = await AgentAsync(cluster, "review-finisher", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("review-flow", Stage(author, "write", s => { s.RequiresReview = true; s.MaxRevisions = 1; }), Stage(finisher, "finish")), token).ConfigureAwait(false);
                PipelineRun run = await StartAsync(host, pipeline, "Draft the announcement", token).ConfigureAwait(false);
                await WaitForAsync(host, run.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview, "AwaitingReview", token).ConfigureAwait(false);
                PipelineReview first = await PendingReviewAsync(host, run.Id, token).ConfigureAwait(false);
                Assert.True(first.Id.StartsWith(Constants.PipelineReviewIdPrefix, StringComparison.Ordinal) && first.Execution == 1 && first.Position == 1, "Review of the first execution");

                // RBAC and isolation: reviews are Approval Read/Update; starting needs Pipeline Execute.
                User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "pipe-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "pipe-none@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Pipelines Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "pipe-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("pipe-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    EnumerationResult<PipelineReview> seen = await HttpTestHelpers.SendAsync<EnumerationResult<PipelineReview>>(client, HttpMethod.Get, T(host) + "/pipeline-reviews?status=Pending", null, 200, token).ConfigureAwait(false);
                    Assert.True(seen.Objects.Any(r => r.Id == first.Id), "Viewers read reviews");
                    await HttpTestHelpers.SendAsync<PipelineRun>(client, HttpMethod.Get, T(host) + "/pipeline-runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<Pipeline>(client, HttpMethod.Get, T(host) + "/pipelines/" + pipeline.Id, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await DecideAsync(client, host, first.Id, PipelineReviewDecisionEnum.Approve, null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot decide");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/pipelines/" + pipeline.Id + "/start", new PipelineStartRequest { Input = "x" }, token).ConfigureAwait(false)).StatusCode, "Viewers cannot start");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/pipeline-runs/" + run.Id + "/cancel", null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot cancel");
                }
                using (HttpClient client = await host.UserClientAsync("pipe-none@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, T(host) + "/pipelines", null, token).ConfigureAwait(false)).StatusCode, "Pipeline Read is required");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, T(host) + "/pipeline-reviews", null, token).ConfigureAwait(false)).StatusCode, "Approval Read is required");
                }
                using (HttpClient client = await host.UserClientAsync("pipe-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, T(host) + "/pipeline-reviews/" + first.Id, null, token).ConfigureAwait(false)).StatusCode, "Other tenants get 404 on a review");
                    Assert.Equal(404, (await DecideAsync(client, host, first.Id, PipelineReviewDecisionEnum.Reject, null, token).ConfigureAwait(false)).StatusCode, "Other tenants get 404 on decide");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, T(host) + "/pipeline-runs/" + run.Id, null, token).ConfigureAwait(false)).StatusCode, "Other tenants get 404 on a pipeline run");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/pipeline-runs/" + run.Id, null, token).ConfigureAwait(false)).StatusCode, "Not visible through their own tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/pipelines/" + pipeline.Id, null, token).ConfigureAwait(false)).StatusCode, "Pipeline not visible through their own tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/pipelines/" + pipeline.Id + "/start", new PipelineStartRequest { Input = "x" }, token).ConfigureAwait(false)).StatusCode, "Cannot start another tenant's pipeline");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/pipeline-reviews/" + first.Id, null, token).ConfigureAwait(false)).StatusCode, "Review not visible through their own tenant");
                }

                await LiveUpdatesAsync(host, "pipe-viewer@example.com", run.Id, token).ConfigureAwait(false);

                Code(await DecideAsync(host.AdminClient, host, first.Id, PipelineReviewDecisionEnum.RequestChanges, null, token).ConfigureAwait(false), 400, "comment", "RequestChanges without a comment");
                TestResponse changes = await DecideAsync(host.AdminClient, host, first.Id, PipelineReviewDecisionEnum.RequestChanges, "Add a title FEEDBACK-123", token).ConfigureAwait(false);
                Assert.Equal(200, changes.StatusCode, "RequestChanges (" + changes.Body + ")");
                Code(await DecideAsync(host.AdminClient, host, first.Id, PipelineReviewDecisionEnum.Approve, null, token).ConfigureAwait(false), 409, "ReviewNotPending", "A decided review");

                await WaitForAsync(host, run.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview && r.Reviews.Any(v => v.Execution == 2), "the second review", token).ConfigureAwait(false);
                Run revised = await StageRunAsync(host, run.Id, 1, 2, token).ConfigureAwait(false);
                string revisedText = revised.ResultText ?? String.Empty;
                Assert.True(revisedText.Contains("FEEDBACK-123", StringComparison.Ordinal) && revisedText.Contains("revision 1", StringComparison.Ordinal) && revisedText.Contains("--- Your previous output ---", StringComparison.Ordinal), "The revision sees the feedback and its previous output");
                PipelineReview second = await PendingReviewAsync(host, run.Id, token).ConfigureAwait(false);
                Code(await DecideAsync(host.AdminClient, host, second.Id, PipelineReviewDecisionEnum.RequestChanges, "Again", token).ConfigureAwait(false), 409, "RevisionLimitReached", "Revision limit");
                PipelineReview approved = await HttpTestHelpers.SendAsync<PipelineReview>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-reviews/" + second.Id + "/decide", new PipelineReviewDecideRequest { Decision = PipelineReviewDecisionEnum.Approve, Comment = "Ship it NOTES-456" }, 200, token).ConfigureAwait(false);
                Assert.True(approved.Status == PipelineReviewStatusEnum.Approved && approved.DecisionSource == PipelineReviewSourceEnum.User && !String.IsNullOrEmpty(approved.DecidedBy), "Approved by a user");

                PipelineRun done = await WaitTerminalAsync(host, run.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, done.Status, "Pipeline status (" + done.ErrorMessage + ")");
                Assert.True(done.Stages[0].Revisions == 1 && done.Stages[0].Executions == 2, "Stage 1 ran twice with one revision");
                Assert.Equal(2, done.Reviews.Count, "Two reviews");
                Run finish = await StageRunAsync(host, run.Id, 2, 1, token).ConfigureAwait(false);
                Assert.True((finish.ResultText ?? String.Empty).Contains("NOTES-456", StringComparison.Ordinal), "The approval notes reach the next stage");
                AuditPage audit = await HttpTestHelpers.SendAsync<AuditPage>(host.AdminClient, HttpMethod.Get, T(host) + "/audit?eventType=PipelineReviewDecided&pageSize=100", null, 200, token).ConfigureAwait(false);
                Assert.True(audit.Objects.Count(a => a.EventType == AuditEventTypeEnum.PipelineReviewDecided) >= 2, "Decisions are audited");
            }
        }

        private static async Task LiveUpdatesAsync(TestServerHost host, string email, string pipelineRunId, CancellationToken token)
        {
            string accessToken;
            using (HttpClient anonymous = new HttpClient())
            {
                HttpResponseMessage response = await anonymous.PostAsync(host.BaseUrl + "/v1.0/token", new StringContent(Serializer.Serialize(new { tenantId = host.TenantId, email = email, password = "password123" }), Encoding.UTF8, "application/json"), token).ConfigureAwait(false);
                TokenResponse issued = Assert.NotNull(Serializer.Deserialize<TokenResponse>(await response.Content.ReadAsStringAsync(token).ConfigureAwait(false)), "Token");
                accessToken = issued.Token;
            }
            using (ClientWebSocket socket = new ClientWebSocket())
            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                timeout.CancelAfter(TimeSpan.FromSeconds(30));
                await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(accessToken)), timeout.Token).ConfigureAwait(false);
                foreach (string channel in new[] { "approvals", "pipeline-run:" + pipelineRunId })
                {
                    byte[] subscribe = Encoding.UTF8.GetBytes(Serializer.Serialize(new { type = "subscribe", channel = channel }));
                    await socket.SendAsync(new ArraySegment<byte>(subscribe), WebSocketMessageType.Text, true, timeout.Token).ConfigureAwait(false);
                }
                bool reviews = false;
                bool status = false;
                byte[] buffer = new byte[1024 * 1024];
                while (!(reviews && status))
                {
                    StringBuilder text = new StringBuilder();
                    WebSocketReceiveResult received;
                    do
                    {
                        received = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), timeout.Token).ConfigureAwait(false);
                        text.Append(Encoding.UTF8.GetString(buffer, 0, received.Count));
                    }
                    while (!received.EndOfMessage);
                    string message = text.ToString();
                    Assert.True(!message.Contains("SubscriptionDenied", StringComparison.Ordinal), "Subscription accepted: " + message);
                    if (message.Contains("\"approvals.changed\"", StringComparison.Ordinal) && message.Contains("\"reviewsPending\":1", StringComparison.Ordinal)) reviews = true;
                    if (message.Contains("\"pipeline-run.status\"", StringComparison.Ordinal) && message.Contains(pipelineRunId, StringComparison.Ordinal)) status = true;
                }
                await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "done", CancellationToken.None).ConfigureAwait(false);
            }
        }

        private static async Task RejectTimeoutsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                Agent agent = await AgentAsync(cluster, "gate-agent", token).ConfigureAwait(false);
                Pipeline rejectable = await CreateAsync(host, Definition("gate-reject", Stage(agent, "one", s => s.RequiresReview = true), Stage(agent, "two")), token).ConfigureAwait(false);
                Pipeline autoApprove = await CreateAsync(host, Definition("gate-approve", Stage(agent, "one", s => { s.RequiresReview = true; s.ReviewTimeoutSeconds = 1; s.ReviewTimeoutAction = PipelineReviewDecisionEnum.Approve; }), Stage(agent, "two")), token).ConfigureAwait(false);
                Pipeline autoReject = await CreateAsync(host, Definition("gate-expire", Stage(agent, "one", s => { s.RequiresReview = true; s.ReviewTimeoutSeconds = 1; s.ReviewTimeoutAction = PipelineReviewDecisionEnum.Reject; }), Stage(agent, "two")), token).ConfigureAwait(false);

                PipelineRun a = await StartAsync(host, rejectable, "reject me", token).ConfigureAwait(false);
                PipelineRun b = await StartAsync(host, autoApprove, "approve me", token).ConfigureAwait(false);
                PipelineRun c = await StartAsync(host, autoReject, "expire me", token).ConfigureAwait(false);
                foreach (PipelineRun run in new[] { a, b, c }) await WaitForAsync(host, run.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview, "AwaitingReview", token).ConfigureAwait(false);

                PipelineReview review = await PendingReviewAsync(host, a.Id, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<PipelineReview>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-reviews/" + review.Id + "/decide", new PipelineReviewDecideRequest { Decision = PipelineReviewDecisionEnum.Reject, Comment = "nope" }, 200, token).ConfigureAwait(false);
                PipelineRun rejected = await WaitTerminalAsync(host, a.Id, token).ConfigureAwait(false);
                Assert.True(rejected.Status == PipelineRunStatusEnum.Failed && rejected.Outcome == PipelineRunOutcomeEnum.ReviewRejected && (rejected.ErrorMessage ?? String.Empty).Contains("nope", StringComparison.Ordinal), "Rejected: " + rejected.Outcome + " " + rejected.ErrorMessage);
                Assert.Equal(1, rejected.Runs.Count, "The next stage never ran");

                await Task.Delay(1300, token).ConfigureAwait(false);
                await service.SweepAsync(token).ConfigureAwait(false);
                PipelineRun approvedByTimeout = await WaitTerminalAsync(host, b.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, approvedByTimeout.Status, "Timeout Approve continues (" + approvedByTimeout.ErrorMessage + ")");
                Assert.True(approvedByTimeout.Reviews.Single().Status == PipelineReviewStatusEnum.Approved && approvedByTimeout.Reviews.Single().DecisionSource == PipelineReviewSourceEnum.Timeout, "Approved by the timeout");
                PipelineRun expired = await WaitTerminalAsync(host, c.Id, token).ConfigureAwait(false);
                Assert.True(expired.Status == PipelineRunStatusEnum.Failed && expired.Outcome == PipelineRunOutcomeEnum.ReviewExpired, "Timeout Reject: " + expired.Outcome);
                Assert.True(expired.Reviews.Single().Status == PipelineReviewStatusEnum.Expired && expired.Reviews.Single().DecisionSource == PipelineReviewSourceEnum.Timeout, "Expired by the timeout");
            }
        }

        private static async Task RetriesResumeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent flaky = await AgentAsync(cluster, "retry-flaky", token, d => d.Parameters.Add(new DeploymentParameter { Name = "fail", Value = "true" })).ConfigureAwait(false);
                Agent steady = await AgentAsync(cluster, "retry-steady", token).ConfigureAwait(false);
                Pipeline failing = await CreateAsync(host, Definition("retry-fail", Stage(flaky, "flaky", s => s.MaxAttempts = 2), Stage(steady, "after")), token).ConfigureAwait(false);
                Pipeline continuing = await CreateAsync(host, Definition("retry-continue", Stage(flaky, "flaky", s => s.ContinueOnFailure = true), Stage(steady, "after")), token).ConfigureAwait(false);

                PipelineRun failed = await WaitTerminalAsync(host, (await StartAsync(host, failing, "try twice", token).ConfigureAwait(false)).Id, token).ConfigureAwait(false);
                Assert.True(failed.Status == PipelineRunStatusEnum.Failed && failed.Outcome == PipelineRunOutcomeEnum.StageFailed, "Failed after its attempts: " + failed.Outcome + " " + failed.ErrorMessage);
                Assert.True(failed.Stages[0].Attempts == 2 && failed.Stages[0].Executions == 2 && failed.Stages[0].Status == PipelineStageStatusEnum.Failed && failed.Stages[1].Status == PipelineStageStatusEnum.Pending, "Two attempts, then the stage failed");
                Assert.Equal(2, failed.Runs.Count, "Two stage runs");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/runs/" + failed.Runs[0].RunId + "/retry", null, token).ConfigureAwait(false), 409, "PipelineStageRun", "Retrying a stage run directly");

                PipelineRun continued = await WaitTerminalAsync(host, (await StartAsync(host, continuing, "keep going", token).ConfigureAwait(false)).Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, continued.Status, "continueOnFailure finishes (" + continued.ErrorMessage + ")");
                Assert.True(continued.Stages[0].Status == PipelineStageStatusEnum.Failed, "The failed stage is recorded as Failed");
                Run after = await StageRunAsync(host, continued.Id, 2, 1, token).ConfigureAwait(false);
                Assert.True((after.ResultText ?? String.Empty).Contains("finished with status Failed", StringComparison.Ordinal), "The next stage sees previous.status Failed");

                Deployment flakyDeployment = await DeploymentOfAsync(host, flaky, token).ConfigureAwait(false);
                flakyDeployment.Parameters.RemoveAll(p => p.Name == "fail");
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, T(host) + "/deployments/" + flakyDeployment.Id, flakyDeployment, 200, token).ConfigureAwait(false);
                PipelineRun resumed = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + failed.Id + "/retry", null, 200, token).ConfigureAwait(false);
                Assert.True(resumed.Status == PipelineRunStatusEnum.Running || resumed.Status == PipelineRunStatusEnum.Succeeded, "Resumed: " + resumed.Status + " " + resumed.ErrorMessage);
                PipelineRun recovered = await WaitTerminalAsync(host, failed.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, recovered.Status, "The resumed pipeline run finishes (" + recovered.ErrorMessage + ")");
                Assert.True(recovered.Stages[0].Executions == 3 && recovered.Runs.Count == 4, "Resume started a new execution of the failed stage, then the next stage");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + failed.Id + "/retry", null, token).ConfigureAwait(false), 409, "PipelineRunNotRetryable", "Retrying a succeeded pipeline run");
            }
        }

        private static async Task CancelDeadlineAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                Agent slow = await AgentAsync(cluster, "cancel-slow", token, d => d.Parameters.Add(new DeploymentParameter { Name = "delayMs", Value = "3000" })).ConfigureAwait(false);
                Agent quick = await AgentAsync(cluster, "cancel-quick", token).ConfigureAwait(false);
                Pipeline slowFlow = await CreateAsync(host, Definition("cancel-slow-flow", Stage(slow, "slow"), Stage(quick, "after")), token).ConfigureAwait(false);
                Pipeline gated = await CreateAsync(host, Definition("cancel-gated", Stage(quick, "gate", s => s.RequiresReview = true), Stage(quick, "after")), token).ConfigureAwait(false);

                // Cancel during a stage: the stage run is cancelled with its pipeline run.
                PipelineRun during = await StartAsync(host, slowFlow, "cancel during", token).ConfigureAwait(false);
                Run running = await WaitRunAsync(host, (await StageRunAsync(host, during.Id, 1, 1, token).ConfigureAwait(false)).Id, r => r.Status == RunStatusEnum.Running, "Running", token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/pipelines/" + slowFlow.Id, null, token).ConfigureAwait(false), 409, "PipelineInUse", "Deleting a pipeline with an active run");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/pipeline-runs/" + during.Id, null, token).ConfigureAwait(false), 409, "PipelineRunActive", "Deleting an active pipeline run");

                // Run tokens can neither start, list, nor decide.
                Run leased = Assert.NotNull(await Db(host).Runs.ReadAsync(host.TenantId, running.Id, token).ConfigureAwait(false), "Stage run");
                string runToken = await host.Server.Context.Authentication.IssueForRunAsync(leased, leased.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (HttpClient asRun = new HttpClient())
                {
                    asRun.BaseAddress = new Uri(host.BaseUrl);
                    asRun.DefaultRequestHeaders.Add("Authorization", "Bearer " + runToken);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(asRun, HttpMethod.Get, T(host) + "/pipeline-runs", null, token).ConfigureAwait(false)).StatusCode, "Run tokens cannot list pipeline runs");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(asRun, HttpMethod.Get, T(host) + "/pipeline-reviews", null, token).ConfigureAwait(false)).StatusCode, "Run tokens cannot list reviews");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(asRun, HttpMethod.Post, T(host) + "/pipelines/" + slowFlow.Id + "/start", new PipelineStartRequest { Input = "x" }, token).ConfigureAwait(false)).StatusCode, "Run tokens cannot start pipelines");
                }

                PipelineRun cancelled = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + during.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                Assert.True(cancelled.Status == PipelineRunStatusEnum.Cancelled && cancelled.Outcome == PipelineRunOutcomeEnum.Cancelled && cancelled.CancelRequested, "Cancelled: " + cancelled.Status);
                await WaitRunAsync(host, running.Id, r => r.Status == RunStatusEnum.Cancelled, "Cancelled", token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + during.Id + "/cancel", null, token).ConfigureAwait(false), 409, "PipelineRunFinished", "Cancelling twice");
                AuditPage audit = await HttpTestHelpers.SendAsync<AuditPage>(host.AdminClient, HttpMethod.Get, T(host) + "/audit?eventType=PipelineRunCancelled&pageSize=100", null, 200, token).ConfigureAwait(false);
                Assert.True(audit.Objects.Any(a => a.EventType == AuditEventTypeEnum.PipelineRunCancelled && a.ResourceId == during.Id), "Cancellation is audited");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/pipeline-runs/" + during.Id, null, token).ConfigureAwait(false)).StatusCode, "A finished pipeline run can be deleted");

                // Cancel during a review: the pending review is cancelled.
                PipelineRun waiting = await StartAsync(host, gated, "cancel at review", token).ConfigureAwait(false);
                await WaitForAsync(host, waiting.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview, "AwaitingReview", token).ConfigureAwait(false);
                PipelineRun cancelledAtReview = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + waiting.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Cancelled, cancelledAtReview.Status, "Cancelled at the review");
                Assert.True(cancelledAtReview.Reviews.Single().Status == PipelineReviewStatusEnum.Cancelled && cancelledAtReview.Reviews.Single().DecisionSource == PipelineReviewSourceEnum.Cancelled, "The pending review was cancelled");

                // Cancelling the stage run directly cancels the pipeline run.
                PipelineRun direct = await StartAsync(host, slowFlow, "cancel the stage run", token).ConfigureAwait(false);
                Run directRun = await StageRunAsync(host, direct.Id, 1, 1, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/runs/" + directRun.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                PipelineRun directDone = await WaitTerminalAsync(host, direct.Id, token).ConfigureAwait(false);
                Assert.True(directDone.Status == PipelineRunStatusEnum.Cancelled && directDone.Outcome == PipelineRunOutcomeEnum.Cancelled && directDone.Runs.Count == 1, "A cancelled stage run cancels its pipeline run");

                // Deadline: maxDurationSeconds includes everything; the sweep ends the pipeline run TimedOut.
                Pipeline bounded = await CreateAsync(host, Definition("cancel-bounded", Stage(slow, "slow")), token).ConfigureAwait(false);
                bounded.MaxDurationSeconds = 1;
                bounded = await HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Put, T(host) + "/pipelines/" + bounded.Id, bounded, 200, token).ConfigureAwait(false);
                PipelineRun timed = await StartAsync(host, bounded, "too slow", token).ConfigureAwait(false);
                Assert.True(timed.DeadlineUtc.HasValue, "The pipeline run has a deadline");
                await Task.Delay(1300, token).ConfigureAwait(false);
                await service.SweepAsync(token).ConfigureAwait(false);
                PipelineRun timedOut = await WaitTerminalAsync(host, timed.Id, token).ConfigureAwait(false);
                Assert.True(timedOut.Status == PipelineRunStatusEnum.TimedOut && timedOut.Outcome == PipelineRunOutcomeEnum.TimedOut, "TimedOut: " + timedOut.Status);
                await WaitRunAsync(host, timedOut.Runs.Single().RunId, r => RunService.IsTerminal(r.Status), "terminal", token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Cancelled, (await Db(host).Runs.ReadAsync(host.TenantId, timedOut.Runs.Single().RunId, token).ConfigureAwait(false))!.Status, "The stage run was cancelled at the deadline");
            }
        }

        private static async Task StartFailuresAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                service.BlockedRetryMs = 200;
                Agent held = await AgentAsync(cluster, "start-held", token).ConfigureAwait(false);
                Agent inactive = await AgentAsync(cluster, "start-inactive", token).ConfigureAwait(false);
                Pipeline heldFlow = await CreateAsync(host, Definition("start-held-flow", Stage(held, "held")), token).ConfigureAwait(false);
                Pipeline inactiveFlow = await CreateAsync(host, Definition("start-inactive-flow", Stage(inactive, "inactive")), token).ConfigureAwait(false);

                UsageQuota quota = await Db(host).UsageQuotas.CreateAsync(new UsageQuota { TenantId = host.TenantId, Name = "hold-pipeline", Scope = UsageQuotaScopeEnum.Agent, ResourceId = held.Id, DailyRunLimit = 0, EnforcementEnabled = true }, token).ConfigureAwait(false);
                PipelineRun blocked = await StartAsync(host, heldFlow, "wait for quota", token).ConfigureAwait(false);
                Assert.True(blocked.Status == PipelineRunStatusEnum.Running && blocked.Runs.Count == 0, "A transient refusal keeps the pipeline run Running without a stage run");
                Assert.True((blocked.Stages[0].BlockedReason ?? String.Empty).Contains("QuotaExceeded", StringComparison.Ordinal) && blocked.Stages[0].NextAttemptUtc.HasValue, "The stage records why it waits: " + blocked.Stages[0].BlockedReason);
                await Db(host).UsageQuotas.DeleteAsync(quota.Id, token).ConfigureAwait(false);
                await Task.Delay(300, token).ConfigureAwait(false);
                await service.SweepAsync(token).ConfigureAwait(false);
                PipelineRun released = await WaitTerminalAsync(host, blocked.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, released.Status, "The sweep retried the stage start (" + released.ErrorMessage + ")");
                Assert.True(released.Stages[0].BlockedReason == null && released.Stages[0].Executions == 1, "The same execution was created once the refusal cleared");

                Agent current = Assert.NotNull(await Db(host).Agents.ReadAsync(host.TenantId, inactive.Id, token).ConfigureAwait(false), "Agent");
                current.Active = false;
                await Db(host).Agents.UpdateAsync(current, token).ConfigureAwait(false);
                PipelineRun failed = await StartAsync(host, inactiveFlow, "inactive agent", token).ConfigureAwait(false);
                Assert.True(failed.Status == PipelineRunStatusEnum.Failed && failed.Outcome == PipelineRunOutcomeEnum.StageStartFailed && (failed.ErrorMessage ?? String.Empty).Contains("AgentInactive", StringComparison.Ordinal), "A permanent refusal fails StageStartFailed: " + failed.Outcome + " " + failed.ErrorMessage);
            }
        }

        private static PipelineRun Snapshot(TestServerHost host, Pipeline pipeline, Agent agent, string input)
        {
            PipelineRun run = new PipelineRun();
            run.TenantId = host.TenantId;
            run.PipelineId = pipeline.Id;
            run.PipelineName = pipeline.Name;
            run.StageCount = 1;
            run.InputText = input;
            run.StartedUtc = DateTime.UtcNow;
            run.Stages.Add(new PipelineRunStage { Position = 1, Name = "only", AgentId = agent.Id, AgentName = agent.Name });
            return run;
        }

        private static async Task ConcurrencyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<RuntimeOptions>().PipelineSweepIntervalMs = 600000;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                service.HookEnabled = false;
                Agent agent = await AgentAsync(cluster, "race-agent", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("race-flow", Stage(agent, "only")), token).ConfigureAwait(false);

                // Sixteen advancers at once claim, create, and link exactly one stage run.
                PipelineRun parallel = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "parallel"), token).ConfigureAwait(false);
                List<Task<bool>> advancers = new List<Task<bool>>();
                for (int i = 0; i < 16; i++) advancers.Add(Task.Run(() => service.AdvanceAsync(host.TenantId, parallel.Id, "api", token)));
                await Task.WhenAll(advancers).ConfigureAwait(false);
                List<Run> parallelRuns = await StageRunsAsync(host, parallel.Id, token).ConfigureAwait(false);
                Assert.Equal(1, parallelRuns.Count, "One stage run after 16 parallel advances");
                PipelineRunStage parallelStage = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, parallel.Id, token).ConfigureAwait(false))!.Stages[0];
                Assert.True(parallelStage.Executions == 1 && parallelStage.CurrentRunId == parallelRuns[0].Id, "One execution, linked to that run");

                // One Idempotency-Key starts one pipeline run, even when the starts race; other content with the key is refused.
                List<Task<TestResponse>> starts = new List<Task<TestResponse>>();
                for (int i = 0; i < 8; i++)
                {
                    starts.Add(Task.Run(async () =>
                    {
                        using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, T(host) + "/pipelines/" + pipeline.Id + "/start"))
                        {
                            request.Headers.Add(Constants.HeaderIdempotencyKey, "race-key");
                            request.Content = new StringContent(Serializer.Serialize(new PipelineStartRequest { Input = "same input" }), Encoding.UTF8, "application/json");
                            HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false);
                            return new TestResponse { StatusCode = (int)response.StatusCode, Body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false) };
                        }
                    }));
                }
                TestResponse[] responses = await Task.WhenAll(starts).ConfigureAwait(false);
                Assert.True(responses.All(r => r.StatusCode == 201), "Every start answered: " + String.Join(" | ", responses.Select(r => r.StatusCode + " " + r.Body.Substring(0, Math.Min(200, r.Body.Length)))));
                HashSet<string> ids = new HashSet<string>(responses.Select(r => Serializer.Deserialize<PipelineRun>(r.Body)!.Id));
                Assert.Equal(1, ids.Count, "One pipeline run for the key");
                EnumerationResult<PipelineRun> keyed = await Db(host).PipelineRuns.EnumerateAsync(new PipelineRunFilter { TenantId = host.TenantId, PipelineId = pipeline.Id, MaxResults = 100 }, token).ConfigureAwait(false);
                Assert.Equal(1, keyed.Objects.Count(r => r.IdempotencyKey == "race-key"), "One stored pipeline run with the key");
                Assert.Equal(1, (await StageRunsAsync(host, ids.Single(), token).ConfigureAwait(false)).Count, "One stage run for it");
                using (HttpRequestMessage conflict = new HttpRequestMessage(HttpMethod.Post, T(host) + "/pipelines/" + pipeline.Id + "/start"))
                {
                    conflict.Headers.Add(Constants.HeaderIdempotencyKey, "race-key");
                    conflict.Content = new StringContent(Serializer.Serialize(new PipelineStartRequest { Input = "different input" }), Encoding.UTF8, "application/json");
                    HttpResponseMessage response = await host.AdminClient.SendAsync(conflict, token).ConfigureAwait(false);
                    Assert.Equal(409, (int)response.StatusCode, "Different content with the key is refused");
                }

                // A crash between the claim and the run creation: the sweep creates and links the claimed execution.
                PipelineRun claimed = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "claimed"), token).ConfigureAwait(false);
                Assert.True(await Db(host).PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = claimed.Stages[0].Id, ExpectedExecutions = 0, Attempts = 1 }, token).ConfigureAwait(false), "Claim");
                await service.SweepAsync(token).ConfigureAwait(false);
                List<Run> repaired = await StageRunsAsync(host, claimed.Id, token).ConfigureAwait(false);
                PipelineRunStage repairedStage = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, claimed.Id, token).ConfigureAwait(false))!.Stages[0];
                Assert.True(repaired.Count == 1 && repairedStage.Executions == 1 && repairedStage.CurrentRunId == repaired[0].Id, "The sweep created and linked execution 1");

                // A crash between the run creation and the link: the sweep links the existing run instead of creating another.
                PipelineRun created = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "created"), token).ConfigureAwait(false);
                Assert.True(await Db(host).PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = created.Stages[0].Id, ExpectedExecutions = 0, Attempts = 1 }, token).ConfigureAwait(false), "Claim");
                RunCreateContext orphan = new RunCreateContext { TenantId = host.TenantId, Agent = agent, Input = "created", Kind = RunKindEnum.Pipeline, IdempotencyKey = "pipeline:" + created.Id + ":1:1", PipelineRunId = created.Id, PipelinePosition = 1, PipelineExecution = 1 };
                Run unlinked = await host.Server.Context.Get<RunService>().CreateAsync(orphan, token).ConfigureAwait(false);
                await service.SweepAsync(token).ConfigureAwait(false);
                List<Run> linked = await StageRunsAsync(host, created.Id, token).ConfigureAwait(false);
                PipelineRunStage linkedStage = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, created.Id, token).ConfigureAwait(false))!.Stages[0];
                Assert.True(linked.Count == 1 && linkedStage.CurrentRunId == unlinked.Id, "The sweep linked the run created before the crash");

                // A stage run left queued under a finished pipeline run is cancelled by the sweep.
                PipelineRunTransition end = new PipelineRunTransition { PipelineRunId = created.Id, ToStatus = PipelineRunStatusEnum.Failed, Outcome = PipelineRunOutcomeEnum.InternalError, SetCompleted = true };
                end.FromStatuses.Add(PipelineRunStatusEnum.Running);
                Assert.True(await Db(host).PipelineRuns.TransitionAsync(end, token).ConfigureAwait(false), "End the pipeline run behind the stage run's back");
                await service.SweepAsync(token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Cancelled, (await Db(host).Runs.ReadAsync(host.TenantId, unlinked.Id, token).ConfigureAwait(false))!.Status, "Orphaned stage run cancelled");
            }
        }

        private static Task TransientStartAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            Run quota = new Run { Status = RunStatusEnum.Failed, Outcome = RunOutcomeEnum.CompileFailed, ErrorMessage = "QuotaExceeded: Agent agt_x has no known daily cost allowance left (quota uqt_x)." };
            Assert.True(PipelineService.IsTransientStartFailure(quota), "QuotaExceeded at compile time is transient");
            Run compile = new Run { Status = RunStatusEnum.Failed, Outcome = RunOutcomeEnum.CompileFailed, ErrorMessage = "TemplateNotFound: missing." };
            Assert.True(!PipelineService.IsTransientStartFailure(compile), "Other compile failures are permanent");
            Run harness = new Run { Status = RunStatusEnum.Failed, Outcome = RunOutcomeEnum.HarnessFailed, ErrorMessage = "QuotaExceeded: from the harness." };
            Assert.True(!PipelineService.IsTransientStartFailure(harness), "Only compile failures count");
            Run rejected = new Run { Status = RunStatusEnum.Rejected, Outcome = RunOutcomeEnum.Rejected, ErrorMessage = "QuotaExceeded: x" };
            Assert.True(!PipelineService.IsTransientStartFailure(rejected), "Rejected runs are permanent");
            return Task.CompletedTask;
        }

        private static PipelineRun Snapshot(TestServerHost host, Pipeline pipeline, Agent agent, string input, Action<PipelineRun> configure)
        {
            PipelineRun run = Snapshot(host, pipeline, agent, input);
            configure(run);
            return run;
        }

        private static async Task<PipelineRun> ParkAtReviewAsync(TestServerHost host, Pipeline pipeline, Agent agent, string input, CancellationToken token)
        {
            // A pipeline run waiting at an open review of its first stage, with a stage run that finished long ago.
            PipelineRun run = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, input, r => r.Stages[0].RequiresReview = true), token).ConfigureAwait(false);
            PipelineRunStage stage = run.Stages[0];
            Assert.True(await Db(host).PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = stage.Id, ExpectedExecutions = 0, Attempts = 1 }, token).ConfigureAwait(false), "Claim " + input);
            Assert.True(await Db(host).PipelineRuns.LinkRunAsync(stage.Id, 1, "run_parked_" + run.Id, token).ConfigureAwait(false), "Link " + input);
            PipelineReview review = new PipelineReview { TenantId = host.TenantId, PipelineRunId = run.Id, PipelineId = pipeline.Id, PipelineName = pipeline.Name, RunStageId = stage.Id, Position = 1, StageName = stage.Name, RunId = "run_parked_" + run.Id, Execution = 1, Status = PipelineReviewStatusEnum.Pending, RequestedUtc = DateTime.UtcNow };
            Assert.True(await Db(host).PipelineReviews.CreateIfAbsentAsync(review, token).ConfigureAwait(false), "Review " + input);
            PipelineRunTransition awaiting = new PipelineRunTransition { PipelineRunId = run.Id, ToStatus = PipelineRunStatusEnum.AwaitingReview };
            awaiting.FromStatuses.Add(PipelineRunStatusEnum.Running);
            Assert.True(await Db(host).PipelineRuns.TransitionAsync(awaiting, token).ConfigureAwait(false), "AwaitingReview " + input);
            return run;
        }

        private static async Task SweepFairnessAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<RuntimeOptions>().PipelineSweepIntervalMs = 600000;
                host.Server.Context.Get<MaintenanceService>().Pipelines = null;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                service.HookEnabled = false;
                service.SweepBatchSize = 3;
                Agent agent = await AgentAsync(cluster, "fair-agent", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("fair-flow", Stage(agent, "only")), token).ConfigureAwait(false);

                // More parked pipeline runs than one batch, all older than the runs that need work.
                List<PipelineRun> parked = new List<PipelineRun>();
                for (int i = 0; i < 5; i++) parked.Add(await ParkAtReviewAsync(host, pipeline, agent, "parked " + i, token).ConfigureAwait(false));
                List<PipelineRun> fresh = new List<PipelineRun>();
                for (int i = 0; i < 4; i++) fresh.Add(await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "fresh " + i), token).ConfigureAwait(false));

                List<PipelineRun> needing = await Db(host).PipelineRuns.ListNeedingWorkAsync(DateTime.UtcNow, null, 100, token).ConfigureAwait(false);
                Assert.True(needing.All(r => fresh.Any(f => f.Id == r.Id)), "Only the runs that need work are listed: " + String.Join(", ", needing.Select(r => r.Id)));
                Assert.Equal(4, needing.Count(r => fresh.Any(f => f.Id == r.Id)), "Every run that needs work is listed");

                await service.SweepAsync(token).ConfigureAwait(false);
                foreach (PipelineRun run in fresh)
                {
                    List<Run> runs = await StageRunsAsync(host, run.Id, token).ConfigureAwait(false);
                    PipelineRunStage stage = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, run.Id, token).ConfigureAwait(false))!.Stages[0];
                    Assert.True(runs.Count == 1 && stage.Executions == 1 && stage.CurrentRunId == runs[0].Id, "The sweep advanced " + run.InputText + " past the parked runs and the batch size");
                }
                foreach (PipelineRun run in parked)
                {
                    PipelineRun now = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, run.Id, token).ConfigureAwait(false))!;
                    Assert.True(now.Status == PipelineRunStatusEnum.AwaitingReview && now.CasVersion == run.CasVersion + 1, "The sweep left " + run.InputText + " alone");
                }
            }
        }

        private static async Task SweepBudgetAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<RuntimeOptions>().PipelineSweepIntervalMs = 600000;
                host.Server.Context.Get<MaintenanceService>().Pipelines = null;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                service.HookEnabled = false;
                Agent agent = await AgentAsync(cluster, "budget-agent", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("budget-flow", Stage(agent, "only")), token).ConfigureAwait(false);
                PipelineRun first = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "late 1", r => r.DeadlineUtc = DateTime.UtcNow.AddMinutes(-1)), token).ConfigureAwait(false);
                PipelineRun second = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "late 2", r => r.DeadlineUtc = DateTime.UtcNow.AddMinutes(-1)), token).ConfigureAwait(false);
                HashSet<string> ours = new HashSet<string>(new[] { first.Id, second.Id }, StringComparer.Ordinal);

                // Each pipeline run the sweep ends "takes" six seconds on the manual clock, longer than the five-second pause
                // grace, as a slow database would.
                ManualTimeProvider clock = new ManualTimeProvider(DateTime.UtcNow);
                service.Clock = clock;
                service.SweepBudgetMs = 1000;
                RunSignals signals = host.Server.Context.Get<RunSignals>();
                EventHandler<string> slow = (sender, id) =>
                {
                    if (ours.Contains(id)) clock.Advance(TimeSpan.FromSeconds(6));
                };
                signals.LocalCompleted += slow;
                try
                {
                    using (GarrisonTelemetry telemetry = new GarrisonTelemetry(new TelemetrySettings { Enabled = false }, "test", null))
                    using (MaintenanceService maintenance = new MaintenanceService(Db(host), new FixedLeader(), new RunSignals(), new RuntimeOptions(), telemetry, QuietLogging()))
                    {
                        maintenance.Clock = clock;
                        maintenance.Pipelines = service;
                        Assert.True(await maintenance.RunTickAsync(token).ConfigureAwait(false), "The tick evaluates");
                        Assert.Equal(0L, maintenance.PausesDetected, "A long pipeline sweep is not a pause");
                        Assert.True(!maintenance.DeferredUntilUtc.HasValue, "Nothing is deferred");
                    }
                    int timedOut = 0;
                    foreach (string id in ours) if ((await Db(host).PipelineRuns.ReadAsync(host.TenantId, id, token).ConfigureAwait(false))!.Status == PipelineRunStatusEnum.TimedOut) timedOut++;
                    Assert.Equal(1, timedOut, "The budget ran out after the first pipeline run");

                    await service.SweepAsync(token).ConfigureAwait(false);
                    foreach (string id in ours) Assert.Equal(PipelineRunStatusEnum.TimedOut, (await Db(host).PipelineRuns.ReadAsync(host.TenantId, id, token).ConfigureAwait(false))!.Status, "The next sweep finished " + id);
                }
                finally
                {
                    signals.LocalCompleted -= slow;
                    service.Clock = TimeProvider.System;
                }
            }
        }

        private static async Task RepairsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                AdoDatabaseDriver ado = (AdoDatabaseDriver)Db(host);
                host.Server.Context.Get<RuntimeOptions>().PipelineSweepIntervalMs = 600000;
                host.Server.Context.Get<MaintenanceService>().Pipelines = null;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                RunService runs = host.Server.Context.Get<RunService>();
                service.HookEnabled = false;
                Agent agent = await AgentAsync(cluster, "repair-agent", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("repair-flow", Stage(agent, "only")), token).ConfigureAwait(false);

                // A run created for an execution more than a day before the crash is still found and linked: no second run.
                PipelineRun old = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "old"), token).ConfigureAwait(false);
                Assert.True(await Db(host).PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = old.Stages[0].Id, ExpectedExecutions = 0, Attempts = 1 }, token).ConfigureAwait(false), "Claim");
                RunCreateContext before = new RunCreateContext { TenantId = host.TenantId, Agent = agent, Input = "old", Kind = RunKindEnum.Pipeline, IdempotencyKey = "pipeline:" + old.Id + ":1:1", PipelineRunId = old.Id, PipelinePosition = 1, PipelineExecution = 1 };
                Run stale = await runs.CreateAsync(before, token).ConfigureAwait(false);
                await ado.NonQueryAsync("UPDATE " + ado.Table("runs") + " SET createdutc = @old WHERE id = @id;", c => { AdoDatabaseDriver.Add(c, "old", DateTime.UtcNow.AddDays(-2)); AdoDatabaseDriver.Add(c, "id", stale.Id); }, token).ConfigureAwait(false);
                await service.AdvanceAsync(host.TenantId, old.Id, "api", token).ConfigureAwait(false);
                List<Run> oldRuns = await StageRunsAsync(host, old.Id, token).ConfigureAwait(false);
                Assert.True(oldRuns.Count == 1 && (await Db(host).PipelineRuns.ReadAsync(host.TenantId, old.Id, token).ConfigureAwait(false))!.Stages[0].CurrentRunId == stale.Id, "The two-day-old run of the execution was linked; runs: " + oldRuns.Count);
                Run? found = await Db(host).Runs.ReadByPipelineExecutionAsync(host.TenantId, old.Id, 1, 1, token).ConfigureAwait(false);
                Assert.True(found != null && found.Id == stale.Id, "Lookup by pipeline execution");

                // The unique index refuses a second run of one execution, whatever its idempotency key.
                bool refused = false;
                try
                {
                    await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = agent, Input = "old", Kind = RunKindEnum.Pipeline, IdempotencyKey = "another-key", PipelineRunId = old.Id, PipelinePosition = 1, PipelineExecution = 1 }, token).ConfigureAwait(false);
                }
                catch (Exception e) when (DatabaseFailures.IsUniqueViolation(e))
                {
                    refused = true;
                }
                Assert.True(refused, "A second run of one stage execution violates the unique index");
                Run outside = await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = agent, Input = "outside 1" }, token).ConfigureAwait(false);
                Run outside2 = await runs.CreateAsync(new RunCreateContext { TenantId = host.TenantId, Agent = agent, Input = "outside 2" }, token).ConfigureAwait(false);
                Assert.True(outside.Id != outside2.Id, "Runs outside pipelines are not constrained");

                // A timeout decided on a stale copy loses its compare-and-set and must not cancel anything.
                PipelineRun live = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "live"), token).ConfigureAwait(false);
                await service.AdvanceAsync(host.TenantId, live.Id, "api", token).ConfigureAwait(false);
                PipelineRun copy = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, live.Id, token).ConfigureAwait(false))!;
                string liveRunId = Assert.NotNull(copy.Stages[0].CurrentRunId, "Stage run");
                PipelineRunTransition bump = new PipelineRunTransition { PipelineRunId = live.Id, ToStatus = PipelineRunStatusEnum.Running };
                bump.FromStatuses.Add(PipelineRunStatusEnum.Running);
                Assert.True(await Db(host).PipelineRuns.TransitionAsync(bump, token).ConfigureAwait(false), "Another advancer changed the pipeline run");
                copy.DeadlineUtc = DateTime.UtcNow.AddMinutes(-1);
                await service.StepAsync(copy, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Running, (await Db(host).PipelineRuns.ReadAsync(host.TenantId, live.Id, token).ConfigureAwait(false))!.Status, "The stale timeout did not apply");
                Assert.Equal(RunStatusEnum.Queued, (await Db(host).Runs.ReadAsync(host.TenantId, liveRunId, token).ConfigureAwait(false))!.Status, "The losing timeout did not cancel the stage run");

                // AwaitingReview without a review of the current execution (a crash after claiming a revision) is repaired.
                PipelineRun gated = await Db(host).PipelineRuns.CreateAsync(Snapshot(host, pipeline, agent, "gated", r => r.Stages[0].RequiresReview = true), token).ConfigureAwait(false);
                await service.AdvanceAsync(host.TenantId, gated.Id, "api", token).ConfigureAwait(false);
                PipelineRunTransition stuck = new PipelineRunTransition { PipelineRunId = gated.Id, ToStatus = PipelineRunStatusEnum.AwaitingReview };
                stuck.FromStatuses.Add(PipelineRunStatusEnum.Running);
                Assert.True(await Db(host).PipelineRuns.TransitionAsync(stuck, token).ConfigureAwait(false), "AwaitingReview behind the service's back");
                await service.SweepAsync(token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Running, (await Db(host).PipelineRuns.ReadAsync(host.TenantId, gated.Id, token).ConfigureAwait(false))!.Status, "The sweep moved it back to Running");
            }
        }

        private static async Task QuotaAtCompileAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                host.Server.Context.Get<RuntimeOptions>().PipelineSweepIntervalMs = 600000;
                host.Server.Context.Get<MaintenanceService>().Pipelines = null;
                PipelineService service = host.Server.Context.Get<PipelineService>();
                service.HookEnabled = false;
                service.BlockedRetryMs = 200;
                Agent agent = await AgentAsync(cluster, "compile-quota", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("compile-quota-flow", Stage(agent, "only")), token).ConfigureAwait(false);

                // The claim-time quota check normally holds such a run Queued; the compile-time check still refuses one
                // whose daily cost allowance ran out between the claim and the compilation. The scheduler records that
                // exactly as below (CompileFailed, "QuotaExceeded: ..."), so the test applies the same transition.
                PipelineRun run = await StartAsync(host, pipeline, "spend nothing", token).ConfigureAwait(false);
                Assert.Equal(1, run.Runs.Count, "The stage run was admitted");
                RunTransition failed = new RunTransition { RunId = run.Runs[0].RunId, ToStatus = RunStatusEnum.Failed, Outcome = RunOutcomeEnum.CompileFailed, ErrorMessage = "QuotaExceeded: Agent " + agent.Id + " has no known daily cost allowance left (quota uqt_test).", SetCompleted = true };
                failed.FromStatuses.Add(RunStatusEnum.Queued);
                Assert.True(await Db(host).Runs.TransitionAsync(failed, token).ConfigureAwait(false), "Fail the stage run at compile time");
                await service.AdvanceAsync(host.TenantId, run.Id, "hook", token).ConfigureAwait(false);

                PipelineRun waiting = await ReadRunAsync(host, run.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Running, waiting.Status, "A quota refusal at compile time keeps the pipeline run Running (" + waiting.Outcome + ": " + waiting.ErrorMessage + ")");
                Assert.True(waiting.Stages[0].Executions == 2 && waiting.Stages[0].Attempts == 1 && waiting.Stages[0].CurrentRunId == null, "A new execution was claimed without using an attempt: executions " + waiting.Stages[0].Executions + ", attempts " + waiting.Stages[0].Attempts);
                Assert.True((waiting.Stages[0].BlockedReason ?? String.Empty).StartsWith("QuotaExceeded:", StringComparison.Ordinal) && waiting.Stages[0].NextAttemptUtc.HasValue, "The new execution waits with the reason: " + waiting.Stages[0].BlockedReason);
                await service.AdvanceAsync(host.TenantId, run.Id, "api", token).ConfigureAwait(false);
                Assert.Equal(1, (await StageRunsAsync(host, run.Id, token).ConfigureAwait(false)).Count, "No run is created before the backoff ends");

                await Task.Delay(300, token).ConfigureAwait(false);
                await service.SweepAsync(token).ConfigureAwait(false);
                service.HookEnabled = true;
                await cluster.AddWorkerAsync("garrison-worker-quota", token).ConfigureAwait(false);
                PipelineRun done = await WaitTerminalAsync(host, run.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, done.Status, "The pipeline run finishes after the backoff (" + done.ErrorMessage + ")");
                Assert.Equal(2, done.Runs.Count, "One refused and one successful stage run");
            }
        }

        private static async Task ResumeGuardsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent steady = await AgentAsync(cluster, "guard-steady", token).ConfigureAwait(false);
                Agent flaky = await AgentAsync(cluster, "guard-flaky", token, d => d.Parameters.Add(new DeploymentParameter { Name = "fail", Value = "true" })).ConfigureAwait(false);

                // A rejection followed by a resume: the new execution sees the reject comment and the rejected output.
                Pipeline gated = await CreateAsync(host, Definition("guard-gated", Stage(steady, "gate", s => s.RequiresReview = true)), token).ConfigureAwait(false);
                PipelineRun rejectedRun = await StartAsync(host, gated, "write something", token).ConfigureAwait(false);
                await WaitForAsync(host, rejectedRun.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview, "AwaitingReview", token).ConfigureAwait(false);
                PipelineReview review = await PendingReviewAsync(host, rejectedRun.Id, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<PipelineReview>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-reviews/" + review.Id + "/decide", new PipelineReviewDecideRequest { Decision = PipelineReviewDecisionEnum.Reject, Comment = "REJECT-NOTE-42" }, 200, token).ConfigureAwait(false);
                await WaitTerminalAsync(host, rejectedRun.Id, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + rejectedRun.Id + "/retry", null, 200, token).ConfigureAwait(false);
                await WaitForAsync(host, rejectedRun.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview && r.Stages[0].Executions == 2, "the second review", token).ConfigureAwait(false);
                Run second = await StageRunAsync(host, rejectedRun.Id, 1, 2, token).ConfigureAwait(false);
                string echoed = second.ResultText ?? String.Empty;
                Assert.True(echoed.Contains("REJECT-NOTE-42", StringComparison.Ordinal) && echoed.Contains("Your previous output", StringComparison.Ordinal), "The resumed execution received the reject comment and its previous output:\n" + echoed);

                // An earlier stage's run was pruned: resuming would hand the failed stage an empty output.
                Pipeline failing = await CreateAsync(host, Definition("guard-failing", Stage(steady, "first"), Stage(flaky, "second")), token).ConfigureAwait(false);
                PipelineRun failed = await WaitTerminalAsync(host, (await StartAsync(host, failing, "prune me", token).ConfigureAwait(false)).Id, token).ConfigureAwait(false);
                Assert.True(failed.Status == PipelineRunStatusEnum.Failed && failed.CurrentPosition == 2, "Failed at stage 2: " + failed.Status + " " + failed.ErrorMessage);
                Assert.True(await Db(host).Runs.DeleteAsync(failed.Stages[0].CurrentRunId!, token).ConfigureAwait(false), "Prune the run of stage 1");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-runs/" + failed.Id + "/retry", null, token).ConfigureAwait(false), 409, "PipelineHistoryPruned", "Resuming after the earlier stage run was pruned");
                PipelineRun untouched = (await Db(host).PipelineRuns.ReadAsync(host.TenantId, failed.Id, token).ConfigureAwait(false))!;
                Assert.True(untouched.Status == PipelineRunStatusEnum.Failed && untouched.Stages[1].Executions == failed.Stages[1].Executions, "The refused resume changed nothing");

                // A delete that read the pipeline run as finished does not remove it once a retry reopened it.
                PipelineRunTransition reopen = new PipelineRunTransition { PipelineRunId = failed.Id, ToStatus = PipelineRunStatusEnum.Running };
                reopen.FromStatuses.Add(PipelineRunStatusEnum.Failed);
                Assert.True(await Db(host).PipelineRuns.TransitionAsync(reopen, token).ConfigureAwait(false), "Reopen");
                Assert.True(!await Db(host).PipelineRuns.DeleteAsync(host.TenantId, failed.Id, token).ConfigureAwait(false), "The delete is conditional on a finished status");
                PipelineRun kept = Assert.NotNull(await Db(host).PipelineRuns.ReadAsync(host.TenantId, failed.Id, token).ConfigureAwait(false), "The reopened pipeline run is kept");
                Assert.Equal(2, kept.Stages.Count, "Its stages are kept");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/pipeline-runs/" + failed.Id, null, token).ConfigureAwait(false), 409, "PipelineRunActive", "Deleting the reopened pipeline run");
            }
        }

        private static LoggingModule QuietLogging()
        {
            LoggingModule logging = new LoggingModule();
            logging.Settings.EnableConsole = false;
            return logging;
        }

        private static async Task RetentionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                AdoDatabaseDriver ado = (AdoDatabaseDriver)Db(host);
                MaintenanceService maintenance = host.Server.Context.Get<MaintenanceService>();
                Agent agent = await AgentAsync(cluster, "keep-agent", token).ConfigureAwait(false);
                Pipeline pipeline = await CreateAsync(host, Definition("keep-flow", Stage(agent, "gate", s => s.RequiresReview = true)), token).ConfigureAwait(false);
                PipelineRun run = await StartAsync(host, pipeline, "keep my stage run", token).ConfigureAwait(false);
                await WaitForAsync(host, run.Id, r => r.Status == PipelineRunStatusEnum.AwaitingReview, "AwaitingReview", token).ConfigureAwait(false);
                Run stageRun = await StageRunAsync(host, run.Id, 1, 1, token).ConfigureAwait(false);
                DateTime old = DateTime.UtcNow.AddDays(-100);
                await ado.NonQueryAsync("UPDATE " + ado.Table("runs") + " SET completedutc = @old WHERE id = @id;", c => { AdoDatabaseDriver.Add(c, "old", old); AdoDatabaseDriver.Add(c, "id", stageRun.Id); }, token).ConfigureAwait(false);
                await maintenance.ApplyRetentionAsync(token).ConfigureAwait(false);
                Assert.True(await Db(host).Runs.ReadAsync(host.TenantId, stageRun.Id, token).ConfigureAwait(false) != null, "Retention keeps the stage run of an active pipeline run");

                PipelineReview review = await PendingReviewAsync(host, run.Id, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<PipelineReview>(host.AdminClient, HttpMethod.Post, T(host) + "/pipeline-reviews/" + review.Id + "/decide", new PipelineReviewDecideRequest { Decision = PipelineReviewDecisionEnum.Approve }, 200, token).ConfigureAwait(false);
                await WaitTerminalAsync(host, run.Id, token).ConfigureAwait(false);
                await ado.NonQueryAsync("UPDATE " + ado.Table("pipeline_runs") + " SET completedutc = @old WHERE id = @id;", c => { AdoDatabaseDriver.Add(c, "old", old); AdoDatabaseDriver.Add(c, "id", run.Id); }, token).ConfigureAwait(false);
                await ado.NonQueryAsync("UPDATE " + ado.Table("runs") + " SET completedutc = @old WHERE id = @id;", c => { AdoDatabaseDriver.Add(c, "old", old); AdoDatabaseDriver.Add(c, "id", stageRun.Id); }, token).ConfigureAwait(false);
                await maintenance.ApplyRetentionAsync(token).ConfigureAwait(false);
                Assert.True(await Db(host).PipelineRuns.ReadAsync(host.TenantId, run.Id, token).ConfigureAwait(false) == null, "Finished pipeline runs follow run retention");
                Assert.True((await Db(host).PipelineReviews.ListByPipelineRunAsync(run.Id, token).ConfigureAwait(false)).Count == 0, "Their reviews are removed with them");
                Assert.True(await Db(host).Runs.ReadAsync(host.TenantId, stageRun.Id, token).ConfigureAwait(false) == null, "The stage run of a finished pipeline run is pruned");
            }
        }

        #endregion
    }
}
