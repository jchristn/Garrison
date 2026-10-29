namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Runtime.CompilerServices;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Invocation compiler suites: goldens for every built-in profile, the no-hard-coded-text rule (D-021), secret
    /// allowlists, pinned versions, overrides, run overrides, previews, and missing references. Set
    /// GARRISON_UPDATE_GOLDEN=true to rewrite goldens under src/Test.Shared/Golden.
    /// </summary>
    public static class CompilerSuite
    {
        #region Private-Members

        private static readonly string[] _Profiles = new string[] { "claude-code", "codex", "codex-app-server", "mux", "gemini-cli", "opencode", "pi", "generic-jsonl", "fake" };
        private static readonly string[] _FullProfiles = new string[] { "claude-code", "codex", "codex-app-server", "mux", "gemini-cli", "opencode", "pi" };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string suiteId = "compiler-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                foreach (string profile in _Profiles) cases.Add(new TestCaseDescriptor(suiteId, "golden-" + profile + "-basic", "Golden: " + profile + " basic (" + provider + ")", ct => GoldenAsync(provider, profile, false, ct)));
                foreach (string profile in _FullProfiles) cases.Add(new TestCaseDescriptor(suiteId, "golden-" + profile + "-full", "Golden: " + profile + " with MCP, schema, delegation, workspace (" + provider + ")", ct => GoldenAsync(provider, profile, true, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "no-hardcoded-text", "D-021: prompts contain only template text and caller input (" + provider + ")", ct => NoHardCodedTextAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "secret-allowlist", "Secrets in environment variables outside the credential allowlist are rejected (" + provider + ")", ct => SecretAllowlistAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "pinned-version", "Pinned template versions compile the pinned content and are recorded (" + provider + ")", ct => PinnedVersionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "overrides", "Argument, environment, and file overrides apply to the profile (" + provider + ")", ct => OverridesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "run-overrides", "Run parameters are validated and only allowed overrides apply (" + provider + ")", ct => RunOverridesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "preview-redaction", "Compile previews redact secret values (" + provider + ")", ct => PreviewAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "codex-container-sandbox", "G-29: Codex defaults to danger-full-access in containerized executors, workspace-write on hosts, and an explicit sandbox wins (" + provider + ")", ct => CodexContainerSandboxAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(suiteId, "missing-reference", "Missing references fail compilation with ReferenceNotFound (" + provider + ")", ct => MissingReferenceAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(suiteId, "Invocation compiler (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static async Task GoldenAsync(DatabaseTypeEnum provider, string profile, bool full, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync(profile, full, token).ConfigureAwait(false);
                Run run = CompilerFixture.RunFor(deployment, full);
                CompilationResult result = await fixture.Compiler.CompileAsync(run, full ? "run-token-golden" : null, token).ConfigureAwait(false);
                for (int i = 0; i < result.TemplateVersions.Count; i++) result.TemplateVersions[i].Id = "rtv_golden_" + i;
                string actual = JsonSerializer.Serialize(result, new JsonSerializerOptions(Serializer.Options) { WriteIndented = true });
                string file = Path.Combine(GoldenDirectory(), profile + (full ? "-full" : "-basic") + ".json");

                if (Environment.GetEnvironmentVariable("GARRISON_UPDATE_GOLDEN") == "true")
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(file)!);
                    File.WriteAllText(file, actual + Environment.NewLine);
                    return;
                }
                if (!File.Exists(file)) throw new TestAssertionException("Golden file " + file + " is missing. Run with GARRISON_UPDATE_GOLDEN=true to create it.");
                string expected = File.ReadAllText(file).TrimEnd();
                if (Normalize(expected) != Normalize(actual))
                {
                    throw new TestAssertionException("Compiled spec for " + profile + (full ? " (full)" : " (basic)") + " differs from " + file + ". Actual:" + Environment.NewLine + actual);
                }
            }
        }

        private static async Task NoHardCodedTextAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("claude-code", true, token).ConfigureAwait(false);
                PromptTemplate system = await TemplateAsync(fixture, "marker-system", "<<SYSTEM>>", token).ConfigureAwait(false);
                PromptTemplate task = await TemplateAsync(fixture, "marker-task", "<<TASK>>{{input.message}}<</TASK>>", token).ConfigureAwait(false);
                PromptTemplate delegated = await TemplateAsync(fixture, "marker-delegated", "<<DELEGATED>>{{input.message}}<</DELEGATED>>", token).ConfigureAwait(false);
                deployment.PromptBindings = new List<DeploymentPromptBinding>
                {
                    new DeploymentPromptBinding { Role = "System", TemplateId = system.Id },
                    new DeploymentPromptBinding { Role = "Task", TemplateId = task.Id },
                    new DeploymentPromptBinding { Role = "DelegatedTask", TemplateId = delegated.Id }
                };
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);

                CompilationResult top = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), "run-token", token).ConfigureAwait(false);
                Assert.Equal("<<TASK>>Summarize the repository.<</TASK>>", top.Spec.Stdin, "stdin is template text plus input only");
                ExecutionFile systemFile = top.Spec.Files.First(f => f.Path == "system-prompt.md");
                Assert.Equal("<<SYSTEM>>", systemFile.Content, "system prompt is template text only");

                CompilationResult child = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, true), "run-token", token).ConfigureAwait(false);
                Assert.Equal("<<DELEGATED>>Summarize the repository.<</DELEGATED>>", child.Spec.Stdin, "delegated stdin uses the delegated template");

                foreach (string argument in top.Spec.Arguments)
                {
                    Assert.True(!argument.Contains("Summarize", StringComparison.Ordinal) || argument.Contains("<<", StringComparison.Ordinal), "no prompt text leaks into arguments");
                }

                // P12.9: a pipeline stage run's prompt is the PipelineStage template around the Task template, and the
                // earlier stage's output arrives only through template variables.
                PromptTemplate stageTemplate = await TemplateAsync(fixture, "marker-stage", "<<STAGE>>{{pipeline.previous.output}}|{{pipeline.task}}<</STAGE>>", token).ConfigureAwait(false);
                deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = InvocationCompiler.PipelineStageRole, TemplateId = stageTemplate.Id });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                CompilationPipeline pipeline = new CompilationPipeline { PipelineId = "ppl_marker", PipelineName = "marker", PipelineRunId = "plr_marker", Position = 2, StageName = "second", StageCount = 2 };
                pipeline.Previous = new CompilationPipelineStage { Position = 1, StageName = "first", AgentName = "writer", Status = "Succeeded", Output = "<<PREVIOUS>>" };
                pipeline.Stages.Add(pipeline.Previous);
                Run stageRun = CompilerFixture.RunFor(deployment, false);
                stageRun.Kind = RunKindEnum.Pipeline;
                stageRun.PipelineRunId = "plr_marker";
                stageRun.PipelinePosition = 2;
                stageRun.PipelineExecution = 1;
                CompilationResult stage = await fixture.Compiler.CompileAsync(stageRun, "run-token", null, pipeline, token).ConfigureAwait(false);
                Assert.Equal("<<STAGE>><<PREVIOUS>>|<<TASK>>Summarize the repository.<</TASK>><</STAGE>>", stage.Spec.Stdin, "stage stdin is template text, the earlier output, and input only");
                Assert.True(stage.TemplateVersions.Any(v => v.TemplateId == stageTemplate.Id), "the stage template version is recorded");
                CompilationResult outside = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), "run-token", token).ConfigureAwait(false);
                Assert.Equal("<<TASK>>Summarize the repository.<</TASK>>", outside.Spec.Stdin, "runs outside a pipeline ignore the PipelineStage binding");
            }
        }

        private static async Task SecretAllowlistAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("claude-code", false, token).ConfigureAwait(false);
                deployment.EnvironmentOverrides.Add(new DeploymentEnvironmentOverride { Name = "LEAK", ValueTemplate = "{{secret.credential}}" });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                try
                {
                    await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false);
                    throw new TestAssertionException("Expected SecretNotAllowed.");
                }
                catch (CompilationException e)
                {
                    Assert.Equal("SecretNotAllowed", e.Code, "code");
                }
            }
        }

        private static async Task PinnedVersionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("fake", false, token).ConfigureAwait(false);
                PromptTemplate task = await TemplateAsync(fixture, "pinned-task", "v1 {{input.message}}", token).ConfigureAwait(false);
                task.Content = "v2 {{input.message}}";
                task.CurrentVersion = 2;
                await fixture.Database.PromptTemplates.UpdateAsync(task, token).ConfigureAwait(false);
                await fixture.Database.PromptTemplateVersions.CreateAsync(new PromptTemplateVersion { TenantId = CompilerFixture.TenantId, TemplateId = task.Id, Version = 2, Content = task.Content }, token).ConfigureAwait(false);

                deployment.PromptBindings.RemoveAll(b => b.Role == "Task");
                deployment.PromptBindings.Add(new DeploymentPromptBinding { Role = "Task", TemplateId = task.Id, PinnedVersion = 1 });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                CompilationResult pinned = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false);
                Assert.Equal("v1 Summarize the repository.", pinned.Spec.Stdin, "pinned content");
                Assert.True(pinned.TemplateVersions.Any(v => v.TemplateId == task.Id && v.Version == 1), "pinned version recorded");

                deployment.PromptBindings.First(b => b.Role == "Task").PinnedVersion = null;
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                CompilationResult latest = await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false);
                Assert.Equal("v2 Summarize the repository.", latest.Spec.Stdin, "current content");
            }
        }

        private static async Task OverridesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("claude-code", false, token).ConfigureAwait(false);
                deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Operation = ArgumentOverrideOperationEnum.Remove, Match = "--disable-slash-commands" });
                deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Operation = ArgumentOverrideOperationEnum.Replace, Match = "{{deployment.parameters.permissionMode | default: \"acceptEdits\"}}", Template = "plan" });
                deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Operation = ArgumentOverrideOperationEnum.Append, Template = "--name" });
                deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Operation = ArgumentOverrideOperationEnum.Append, Template = "{{agent.name}}" });
                deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Operation = ArgumentOverrideOperationEnum.Prepend, Template = "--debug", Condition = "{{deployment.parameters.debug}}" });
                deployment.EnvironmentOverrides.Add(new DeploymentEnvironmentOverride { Name = "DISABLE_AUTOUPDATER", ValueTemplate = "0" });
                deployment.FileOverrides.Add(new DeploymentFileOverride { PathTemplate = "notes.md", ContentTemplate = "{{agent.description}}" });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);

                ExecutionSpec spec = (await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false)).Spec;
                Assert.True(!spec.Arguments.Contains("--disable-slash-commands"), "removed");
                int mode = spec.Arguments.IndexOf("--permission-mode");
                Assert.Equal("plan", spec.Arguments[mode + 1], "replaced");
                Assert.Equal("helper-claude-code-basic", spec.Arguments[spec.Arguments.Count - 1], "appended");
                Assert.True(!spec.Arguments.Contains("--debug"), "conditional prepend skipped");
                Assert.Equal("0", spec.Environment.First(e => e.Name == "DISABLE_AUTOUPDATER").Value, "env override");
                Assert.Equal("Answers questions about the repository.", spec.Files.First(f => f.Path == "notes.md").Content, "file override");
            }
        }

        private static async Task RunOverridesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("claude-code", false, token).ConfigureAwait(false);
                deployment.AllowedRunOverrides.Add(new DeploymentRunOverrideRule { Name = "model", Validation = RunOverrideValidationEnum.Enum, Pattern = "sonnet,opus" });
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);

                Run run = CompilerFixture.RunFor(deployment, false);
                run.Parameters.Add(new RunParameter { Name = "model", Value = "opus" });
                RunOverrideValidator.Validate(deployment, run.Parameters);
                ExecutionSpec spec = (await fixture.Compiler.CompileAsync(run, null, token).ConfigureAwait(false)).Spec;
                Assert.Equal("opus", spec.Arguments[spec.Arguments.IndexOf("--model") + 1], "allowed override applied");

                List<RunParameter> bad = new List<RunParameter> { new RunParameter { Name = "model", Value = "gpt" } };
                try
                {
                    RunOverrideValidator.Validate(deployment, bad);
                    throw new TestAssertionException("Expected a validation error for a disallowed value.");
                }
                catch (ValidationException)
                {
                }
                List<RunParameter> unknown = new List<RunParameter> { new RunParameter { Name = "permissionMode", Value = "bypassPermissions" } };
                try
                {
                    RunOverrideValidator.Validate(deployment, unknown);
                    throw new TestAssertionException("Expected a validation error for a parameter the deployment does not allow.");
                }
                catch (ValidationException)
                {
                }
            }
        }

        private static async Task PreviewAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("claude-code", true, token).ConfigureAwait(false);
                CompilationResult preview = await fixture.Compiler.PreviewAsync(CompilerFixture.TenantId, deployment.Id, "Hello", null, token).ConfigureAwait(false);
                string json = Serializer.Serialize(preview.Spec);
                Assert.True(!json.Contains("credential-claude_code_full", StringComparison.Ordinal), "credential redacted");
                Assert.True(!json.Contains("docs-token-claude_code_full", StringComparison.Ordinal), "MCP token redacted");
                Assert.True(!json.Contains("git-token-claude_code_full", StringComparison.Ordinal), "git token redacted");
                Assert.True(json.Contains(InvocationCompiler.Redacted, StringComparison.Ordinal), "redaction marker present");
            }
        }

        private static async Task CodexContainerSandboxAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Node host = new Node { Id = "nod_golden_host", Name = "golden-host", Containerized = false };
                Node container = new Node { Id = "nod_golden_container", Name = "golden-container", Containerized = true };
                await fixture.Database.Nodes.CreateAsync(host, token).ConfigureAwait(false);
                await fixture.Database.Nodes.CreateAsync(container, token).ConfigureAwait(false);
                Node? stored = await fixture.Database.Nodes.ReadAsync(container.Id, token).ConfigureAwait(false);
                Assert.True(stored != null && stored.Containerized, "The containerized flag is stored");

                foreach (string profile in new string[] { "codex", "codex-app-server" })
                {
                    Deployment deployment = await fixture.DeploymentAsync(profile, false, token).ConfigureAwait(false);

                    Assert.Equal("workspace-write", await SandboxAsync(fixture, profile, CompilerFixture.RunFor(deployment, false), host, token).ConfigureAwait(false), profile + ": host node keeps workspace-write");
                    Assert.Equal("danger-full-access", await SandboxAsync(fixture, profile, CompilerFixture.RunFor(deployment, false), container, token).ConfigureAwait(false), profile + ": containerized node gets danger-full-access");

                    Run leased = CompilerFixture.RunFor(deployment, false);
                    leased.LeaseNodeId = container.Id;
                    Assert.Equal("danger-full-access", await SandboxAsync(fixture, profile, leased, null, token).ConfigureAwait(false), profile + ": the lease node is read when no node is passed");
                    Assert.Equal("workspace-write", await SandboxAsync(fixture, profile, CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false), profile + ": no node means not containerized");

                    Run pod = CompilerFixture.RunFor(deployment, false);
                    pod.Executor = RunExecutorEnum.KubernetesJob;
                    Assert.Equal("danger-full-access", await SandboxAsync(fixture, profile, pod, host, token).ConfigureAwait(false), profile + ": KubernetesJob runs are always containerized");

                    deployment.Parameters.Add(new DeploymentParameter { Name = "sandbox", Value = "read-only" });
                    await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
                    Assert.Equal("read-only", await SandboxAsync(fixture, profile, CompilerFixture.RunFor(deployment, false), container, token).ConfigureAwait(false), profile + ": an explicit sandbox parameter wins in a container");
                    Assert.Equal("read-only", await SandboxAsync(fixture, profile, CompilerFixture.RunFor(deployment, false), host, token).ConfigureAwait(false), profile + ": an explicit sandbox parameter wins on a host");
                }
            }
        }

        private static async Task<string> SandboxAsync(CompilerFixture fixture, string profile, Run run, Node? node, CancellationToken token)
        {
            ExecutionSpec spec = (await fixture.Compiler.CompileAsync(run, null, null, null, node, token).ConfigureAwait(false)).Spec;
            if (profile == "codex")
            {
                int index = spec.Arguments.IndexOf("-s");
                Assert.True(index >= 0 && index + 1 < spec.Arguments.Count, "codex has a -s argument");
                return spec.Arguments[index + 1];
            }
            string? mode = spec.Arguments.FirstOrDefault(a => a.StartsWith("sandbox_mode=", StringComparison.Ordinal));
            Assert.True(mode != null, "codex-app-server has a sandbox_mode override");
            return mode!.Substring("sandbox_mode=".Length).Trim('"');
        }

        private static async Task MissingReferenceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("codex", false, token).ConfigureAwait(false);
                await fixture.Database.HarnessProfiles.DeleteAsync("hrn_builtin_codex", token).ConfigureAwait(false);
                try
                {
                    await fixture.Compiler.CompileAsync(CompilerFixture.RunFor(deployment, false), null, token).ConfigureAwait(false);
                    throw new TestAssertionException("Expected ReferenceNotFound.");
                }
                catch (CompilationException e)
                {
                    Assert.Equal("ReferenceNotFound", e.Code, "code");
                }
            }
        }

        private static async Task<PromptTemplate> TemplateAsync(CompilerFixture fixture, string name, string content, CancellationToken token)
        {
            PromptTemplate template = new PromptTemplate();
            template.TenantId = CompilerFixture.TenantId;
            template.Name = name;
            template.Content = content;
            template.Kind = PromptTemplateKindEnum.Task;
            await fixture.Database.PromptTemplates.CreateAsync(template, token).ConfigureAwait(false);
            await fixture.Database.PromptTemplateVersions.CreateAsync(new PromptTemplateVersion { TenantId = CompilerFixture.TenantId, TemplateId = template.Id, Version = 1, Content = content }, token).ConfigureAwait(false);
            return template;
        }

        private static string Normalize(string json)
        {
            using (JsonDocument document = JsonDocument.Parse(json))
            {
                return JsonSerializer.Serialize(document.RootElement);
            }
        }

        private static string GoldenDirectory([CallerFilePath] string source = "")
        {
            string? fromEnvironment = Environment.GetEnvironmentVariable("GARRISON_GOLDEN_DIR");
            if (!String.IsNullOrEmpty(fromEnvironment)) return fromEnvironment;
            string sourceDirectory = Path.GetDirectoryName(source) ?? String.Empty;
            string candidate = Path.GetFullPath(Path.Combine(sourceDirectory, "..", "Golden"));
            if (Directory.Exists(Path.GetDirectoryName(candidate)!)) return candidate;
            return Path.Combine(AppContext.BaseDirectory, "Golden");
        }

        #endregion
    }
}
