namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Structured output validation against the agent's output schema and the one repair attempt (plan P3.2.7): the
    /// validator itself, repair compilation for the built-in profiles, and end-to-end runs over an in-process control
    /// plane and worker with the fake harness.
    /// </summary>
    public static class StructuredOutputSuite
    {
        #region Private-Members

        private static readonly string _Schema = "{ \"type\": \"object\", \"properties\": { \"answer\": { \"type\": \"string\" } }, \"required\": [\"answer\"], \"additionalProperties\": false }";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();

            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("schema-validator", "valid", "Validator: a matching document validates and prefers structured output", ValidatorValidAsync));
            unit.Add(new TestCaseDescriptor("schema-validator", "errors", "Validator: errors name the location, message, and keyword, capped at MaxErrors", ValidatorErrorsAsync));
            unit.Add(new TestCaseDescriptor("schema-validator", "not-json", "Validator: result text that is not JSON fails with a parse error; a json code fence is unwrapped", ValidatorNotJsonAsync));
            unit.Add(new TestCaseDescriptor("schema-validator", "schema-unusable", "Validator: an unusable schema is reported so no repair is attempted", ValidatorSchemaUnusableAsync));
            suites.Add(new TestSuiteDescriptor("schema-validator", "Structured output validator", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "structured-output-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "repair-compile", "Repair compile: built-in profiles resume the session and render the repair template (" + provider + ")", ct => RepairCompileAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "valid-output", "Valid output passes validation without a repair (" + provider + ")", ct => ValidOutputAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "repair-succeeds", "Invalid output with resume support triggers one repair that succeeds (" + provider + ")", ct => RepairSucceedsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "repair-fails", "Invalid output twice fails with SchemaValidationFailed (" + provider + ")", ct => RepairFailsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "no-resume", "Invalid output on a profile without resume support fails immediately (" + provider + ")", ct => NoResumeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "no-schema", "Agents without an output schema skip validation (" + provider + ")", ct => NoSchemaAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Structured output (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task ValidatorValidAsync(CancellationToken token)
        {
            OutputSchemaValidator validator = new OutputSchemaValidator();
            OutputSchemaValidationResult result = validator.Validate(_Schema, "{ \"answer\": \"ok\" }", "ignored prose");
            Assert.True(result.Valid, "Structured output validates: " + result.Summary());
            Assert.Equal("structuredOutput", result.Source, "Structured output wins over result text");
            Assert.Equal("{\"answer\":\"ok\"}", result.Json, "Compact JSON");

            OutputSchemaValidationResult text = validator.Validate(_Schema, null, "  {\"answer\": \"from text\"}  ");
            Assert.True(text.Valid, "Result text validates");
            Assert.Equal("resultText", text.Source, "Result text source");
            return Task.CompletedTask;
        }

        private static Task ValidatorErrorsAsync(CancellationToken token)
        {
            OutputSchemaValidator validator = new OutputSchemaValidator();
            validator.MaxErrors = 2;
            OutputSchemaValidationResult result = validator.Validate(_Schema, null, "{ \"wrong\": 1, \"other\": 2 }");
            Assert.True(!result.Valid, "Document is invalid");
            Assert.True(!result.SchemaUnusable, "Schema is usable");
            Assert.Equal(2, result.Errors.Count, "Errors capped at MaxErrors");
            Assert.True(result.TotalErrors >= 3, "All errors counted (" + result.TotalErrors + ")");
            string summary = result.Summary();
            Assert.True(summary.Contains("(root): Required properties", StringComparison.Ordinal) && summary.Contains("(required)", StringComparison.Ordinal), "Required error: " + summary);
            Assert.True(summary.Contains("more", StringComparison.Ordinal), "Summary notes the remaining errors: " + summary);

            OutputSchemaValidationResult typed = new OutputSchemaValidator().Validate(_Schema, null, "{ \"answer\": 5 }");
            Assert.True(typed.Errors.Any(e => e.StartsWith("/answer: ", StringComparison.Ordinal) && e.EndsWith("(type)", StringComparison.Ordinal)), "Type error names /answer: " + typed.Summary());
            bool threw = false;
            try
            {
                validator.MaxErrors = 0;
            }
            catch (ArgumentOutOfRangeException)
            {
                threw = true;
            }
            Assert.True(threw, "MaxErrors below 1 is rejected");
            return Task.CompletedTask;
        }

        private static Task ValidatorNotJsonAsync(CancellationToken token)
        {
            OutputSchemaValidator validator = new OutputSchemaValidator();
            OutputSchemaValidationResult prose = validator.Validate(_Schema, null, "Here is the answer: ok");
            Assert.True(!prose.Valid && prose.Json == null, "Prose is not JSON");
            Assert.True(prose.Summary().Contains("not valid JSON", StringComparison.Ordinal), "Parse error: " + prose.Summary());

            OutputSchemaValidationResult fenced = validator.Validate(_Schema, null, "```json\n{\"answer\": \"fenced\"}\n```");
            Assert.True(fenced.Valid, "A json code fence is unwrapped: " + fenced.Summary());

            validator.UnwrapCodeFence = false;
            Assert.True(!validator.Validate(_Schema, null, "```json\n{\"answer\": \"fenced\"}\n```").Valid, "Fences are kept when unwrapping is off");

            OutputSchemaValidationResult empty = validator.Validate(_Schema, null, "   ");
            Assert.True(!empty.Valid && empty.Summary().Contains("no output", StringComparison.Ordinal), "Empty output: " + empty.Summary());
            return Task.CompletedTask;
        }

        private static Task ValidatorSchemaUnusableAsync(CancellationToken token)
        {
            OutputSchemaValidator validator = new OutputSchemaValidator();
            OutputSchemaValidationResult broken = validator.Validate("{ \"type\": 12 }", null, "{}");
            Assert.True(!broken.Valid && broken.SchemaUnusable, "Unusable schema is flagged: " + broken.Summary());
            OutputSchemaValidationResult reused = validator.Validate("{ \"$id\": \"https://example.com/s\", \"type\": \"string\" }", null, "\"a\"");
            OutputSchemaValidationResult again = validator.Validate("{ \"$id\": \"https://example.com/s\", \"type\": \"string\" }", null, "\"b\"");
            Assert.True(reused.Valid && again.Valid, "Schemas that share an $id validate repeatedly");
            return Task.CompletedTask;
        }

        private static async Task RepairCompileAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            foreach (string profile in new[] { "claude-code", "codex", "mux", "gemini-cli" })
            {
                // One fixture per profile: the full deployments of different profiles share MCP server names.
                using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
                {
                    Deployment deployment = await fixture.DeploymentAsync(profile, true, token).ConfigureAwait(false);
                    Run run = CompilerFixture.RunFor(deployment, false);
                    CompilationResult original = await fixture.Compiler.CompileAsync(run, "run-token", token).ConfigureAwait(false);
                    Assert.True(original.Spec.RetainForRepair, profile + ": original execution keeps its directories for a possible repair");
                    Assert.Equal(0, original.Spec.RepairAttempt, profile + ": original repair attempt");
                    Assert.True(!original.Spec.Arguments.Contains("sess-123"), profile + ": no resume on the original execution");
                    if (profile == "mux")
                    {
                        // Mux print mode only persists a session when a session flag is given (G-20).
                        int sessionFlag = original.Spec.Arguments.IndexOf("--session-id");
                        Assert.True(sessionFlag > 0 && original.Spec.Arguments[sessionFlag + 1] == run.Id, "mux: the original execution persists its session under the run id: " + String.Join(" ", original.Spec.Arguments));
                        Assert.True(!original.Spec.Arguments.Contains("--no-session-persistence"), "mux: the session is persisted");
                    }

                    CompilationRepair repair = new CompilationRepair();
                    repair.SessionId = "sess-123";
                    repair.Error = "(root): Required properties [\"answer\"] are not present (required)";
                    repair.PreviousOutput = "{\"reply\":\"x\"}";
                    CompilationResult compiled = await fixture.Compiler.CompileRepairAsync(run, "run-token", repair, token).ConfigureAwait(false);
                    ExecutionSpec spec = compiled.Spec;
                    Assert.Equal(1, spec.RepairAttempt, profile + ": repair attempt");
                    Assert.True(!spec.RetainForRepair, profile + ": the repair does not ask for another repair");
                    int index = spec.Arguments.IndexOf("sess-123");
                    Assert.True(index > 0, profile + ": session id is passed: " + String.Join(" ", spec.Arguments));
                    string flag = spec.Arguments[index - 1];
                    if (profile == "codex")
                    {
                        Assert.Equal("resume", flag, "codex resumes with the exec resume subcommand");
                        Assert.Equal("-", spec.Arguments[spec.Arguments.Count - 1], "codex still reads the prompt from stdin");
                    }
                    else
                    {
                        Assert.Equal("--resume", flag, profile + ": resume flag");
                    }
                    if (profile == "mux") Assert.True(!spec.Arguments.Contains("--session-id"), "mux: the repair resumes instead of naming a new session");

                    string prompt = spec.Stdin ?? String.Empty;
                    Assert.True(prompt.Contains("Required properties", StringComparison.Ordinal), profile + ": repair prompt carries repair.error: " + prompt);
                    Assert.True(prompt.Contains("\"answer\"", StringComparison.Ordinal) && prompt.Contains("Required JSON Schema", StringComparison.Ordinal), profile + ": repair prompt carries the schema: " + prompt);
                    Assert.True(!prompt.Contains("Summarize the repository.", StringComparison.Ordinal), profile + ": repair prompt replaces the task prompt");
                    Assert.True(compiled.TemplateVersions.Any(v => v.TemplateName == InvocationCompiler.RepairTemplateName), profile + ": repair template version recorded");
                }
            }

            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment basic = await fixture.DeploymentAsync("fake", false, token).ConfigureAwait(false);
                CompilationResult noSchema = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(basic, false), null, token).ConfigureAwait(false);
                Assert.True(!noSchema.Spec.RetainForRepair, "Agents without an output schema never keep directories for a repair");
            }
        }

        private static async Task<Agent> SchemaAgentAsync(TestCluster cluster, string name, string profile, string answer, string? resumeAnswer, bool structured, CancellationToken token)
        {
            return await cluster.CreateAgentAsync(name, profile, a => a.OutputSchemaJson = _Schema, token, d =>
            {
                d.Parameters.Add(new DeploymentParameter { Name = "answer", Value = answer });
                if (resumeAnswer != null) d.Parameters.Add(new DeploymentParameter { Name = "resumeAnswer", Value = resumeAnswer });
                if (structured) d.Parameters.Add(new DeploymentParameter { Name = "structuredOutput", Value = "true" });
            }).ConfigureAwait(false);
        }

        private static async Task<Run> InvokeAsync(TestCluster cluster, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "Answer in JSON.";
            request.Wait = true;
            request.WaitSeconds = 90;
            TestResponse response = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
            Run run = Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
            Assert.True(RunService.IsTerminal(run.Status), "Run finished within the wait (" + run.Status + ")");
            return await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
        }

        private static async Task<List<RunEvent>> EventsAsync(TestCluster cluster, Run run, CancellationToken token)
        {
            RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(cluster.Server.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + cluster.Server.TenantId + "/runs/" + run.Id + "/events?limit=5000", null, 200, token).ConfigureAwait(false);
            List<long> sequences = events.Events.Select(e => e.Sequence).ToList();
            Assert.Equal(sequences.Count, sequences.Distinct().Count(), "Event sequences are unique");
            return events.Events;
        }

        private static List<SchemaValidationNotice> Notices(List<RunEvent> events)
        {
            List<SchemaValidationNotice> notices = new List<SchemaValidationNotice>();
            foreach (RunEvent evt in events.Where(e => e.EventType == RunEventTypeEnum.Warning && !String.IsNullOrEmpty(e.RawEventJson)))
            {
                SchemaValidationNotice? notice = Serializer.Deserialize<SchemaValidationNotice>(evt.RawEventJson!);
                if (notice != null && notice.Notice == SchemaValidationNotice.KindName) notices.Add(notice);
            }
            return notices;
        }

        private static async Task ValidOutputAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent structured = await SchemaAgentAsync(cluster, "schema-structured", "builtin/fake", "{\"answer\":\"ok\"}", null, true, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, structured, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                Assert.Equal(RunOutcomeEnum.Succeeded, run.Outcome, "Outcome");
                Assert.True(run.OutputSchemaValid == true, "outputSchemaValid is true");
                Assert.True(run.SchemaValidationErrors == null, "No validation errors");
                Assert.Equal(0, run.RepairAttempts, "No repair");
                Assert.Equal("{\"answer\":\"ok\"}", run.StructuredOutputJson, "Structured output recorded");
                Assert.Equal(0, Notices(await EventsAsync(cluster, run, token).ConfigureAwait(false)).Count, "No validation warnings");

                Agent text = await SchemaAgentAsync(cluster, "schema-text", "builtin/fake", "```json\n{\"answer\":\"from text\"}\n```", null, false, token).ConfigureAwait(false);
                Run fromText = await InvokeAsync(cluster, text, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, fromText.Status, "Result text status (" + fromText.Outcome + ": " + fromText.ErrorMessage + ")");
                Assert.True(fromText.OutputSchemaValid == true, "Result text parsed as JSON validates");
                Assert.Equal("{\"answer\":\"from text\"}", fromText.StructuredOutputJson, "Parsed result text becomes the structured output");
            }
        }

        private static async Task RepairSucceedsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await SchemaAgentAsync(cluster, "schema-repair", "builtin/fake", "{\"wrong\":1}", "{\"answer\":\"fixed\"}", true, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                Assert.Equal(RunOutcomeEnum.Succeeded, run.Outcome, "Outcome");
                Assert.Equal(1, run.RepairAttempts, "Exactly one repair");
                Assert.True(run.OutputSchemaValid == true, "Repaired output validates");
                Assert.True(run.SchemaValidationErrors == null, "Errors cleared after the repair");
                Assert.Equal("{\"answer\":\"fixed\"}", run.ResultText, "The repair's output is the run's result");
                Assert.Equal("{\"answer\":\"fixed\"}", run.StructuredOutputJson, "The repair's structured output");
                Assert.Equal(24L, run.InputTokens, "Usage of both executions is summed");
                Assert.Equal(4L, run.ReasoningTokens, "Reasoning tokens of both executions are summed");
                Assert.True(!String.IsNullOrEmpty(run.SessionId), "Session recorded");
                Assert.True(run.TemplateVersions.Any(v => v.TemplateName == InvocationCompiler.RepairTemplateName), "Repair template version recorded on the run");

                List<RunEvent> events = await EventsAsync(cluster, run, token).ConfigureAwait(false);
                List<SchemaValidationNotice> notices = Notices(events);
                Assert.Equal(1, notices.Count, "One warning for the one failed validation");
                Assert.True(notices[0].RepairStarted && notices[0].RepairAttempt == 0, "The warning announces the repair");
                Assert.True(notices[0].Errors.Any(e => e.Contains("answer", StringComparison.Ordinal)), "The warning names the errors");
                Assert.True(events.Any(e => e.EventType == RunEventTypeEnum.Lifecycle && (e.Text ?? String.Empty).Contains("repair attempt 1", StringComparison.Ordinal)), "The worker logs the repair");
                long warning = events.First(e => e.EventType == RunEventTypeEnum.Warning).Sequence;
                Assert.True(events.Any(e => e.Sequence > warning && e.EventType == RunEventTypeEnum.Lifecycle), "Repair events follow the warning");
            }
        }

        private static async Task RepairFailsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await SchemaAgentAsync(cluster, "schema-twice", "builtin/fake", "{\"wrong\":1}", "{\"answer\":5}", false, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Failed, run.Status, "Status");
                Assert.Equal(RunOutcomeEnum.SchemaValidationFailed, run.Outcome, "Outcome");
                Assert.Equal(1, run.RepairAttempts, "Exactly one repair, never two");
                Assert.True(run.OutputSchemaValid == false, "outputSchemaValid is false");
                string message = run.ErrorMessage ?? String.Empty;
                Assert.True(message.Contains("after one repair attempt", StringComparison.Ordinal) && message.Contains("/answer", StringComparison.Ordinal), "Error names the errors: " + message);
                Assert.True((run.SchemaValidationErrors ?? String.Empty).Contains("/answer", StringComparison.Ordinal), "Errors recorded on the run: " + run.SchemaValidationErrors);
                Assert.Equal("{\"answer\":5}", run.StructuredOutputJson, "The repaired (still invalid) output is recorded");

                List<SchemaValidationNotice> notices = Notices(await EventsAsync(cluster, run, token).ConfigureAwait(false));
                Assert.Equal(2, notices.Count, "One warning per failed validation");
                Assert.True(notices[0].RepairStarted && !notices[1].RepairStarted && notices[1].RepairAttempt == 1, "Second warning is for the repair and starts nothing");
            }
        }

        private static async Task NoResumeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string profiles = "/v1.0/api/tenants/" + cluster.Server.TenantId + "/harness-profiles";
                HarnessProfile builtin = await cluster.Server.Server.Context.Database.HarnessProfiles.ReadByNameAsync(cluster.Server.TenantId, "builtin/fake", token).ConfigureAwait(false)
                    ?? throw new TestAssertionException("builtin/fake not found.");
                CloneRequest clone = new CloneRequest();
                clone.Name = "fake-no-resume";
                HarnessProfile copy = await HttpTestHelpers.SendAsync<HarnessProfile>(cluster.Server.AdminClient, HttpMethod.Post, profiles + "/" + builtin.Id + "/clone", clone, 201, token).ConfigureAwait(false);
                copy.SupportsResume = false;
                await HttpTestHelpers.SendAsync<HarnessProfile>(cluster.Server.AdminClient, HttpMethod.Put, profiles + "/" + copy.Id, copy, 200, token).ConfigureAwait(false);

                Agent agent = await SchemaAgentAsync(cluster, "schema-no-resume", "fake-no-resume", "not json at all", "{\"answer\":\"never used\"}", false, token).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Failed, run.Status, "Status");
                Assert.Equal(RunOutcomeEnum.SchemaValidationFailed, run.Outcome, "Outcome");
                Assert.Equal(0, run.RepairAttempts, "No repair without resume support");
                Assert.True(run.OutputSchemaValid == false, "outputSchemaValid is false");
                string message = run.ErrorMessage ?? String.Empty;
                Assert.True(message.Contains("not valid JSON", StringComparison.Ordinal) && message.Contains("does not support resume", StringComparison.Ordinal), "Error explains the failure and the missing repair: " + message);

                List<SchemaValidationNotice> notices = Notices(await EventsAsync(cluster, run, token).ConfigureAwait(false));
                Assert.Equal(1, notices.Count, "One warning");
                Assert.True(!notices[0].RepairStarted && (notices[0].NoRepairReason ?? String.Empty).Contains("fake-no-resume", StringComparison.Ordinal), "The warning names the profile: " + notices[0].NoRepairReason);
            }
        }

        private static async Task NoSchemaAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                Agent agent = await cluster.CreateAgentAsync("no-schema", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "answer", Value = "plain prose, not JSON" })).ConfigureAwait(false);
                Run run = await InvokeAsync(cluster, agent, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Status (" + run.Outcome + ": " + run.ErrorMessage + ")");
                Assert.Equal("plain prose, not JSON", run.ResultText, "Result kept as is");
                Assert.True(run.OutputSchemaValid == null, "outputSchemaValid is null without a schema");
                Assert.True(run.SchemaValidationErrors == null, "No validation errors");
                Assert.Equal(0, run.RepairAttempts, "No repair");
                Assert.Equal(0, Notices(await EventsAsync(cluster, run, token).ConfigureAwait(false)).Count, "No validation warnings");
            }
        }

        #endregion
    }
}
