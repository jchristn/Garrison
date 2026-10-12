namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net.Http;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Approvals;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Backplane;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Garrison.Worker.Settings;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Permission approvals (P12.3): the rule matcher and redaction, Claude Code permission prompts through
    /// garrison_permission_prompt (fake harness in Claude format), Codex app-server approvals relayed by the worker,
    /// allow, deny, and ask rules, approve and deny decisions with remember, timeouts, cancellation while pending,
    /// a decision on one replica waking a wait on another, tenant isolation, and RBAC.
    /// </summary>
    public static class ApprovalSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();

            string rulesId = "approval-rules";
            List<TestCaseDescriptor> rules = new List<TestCaseDescriptor>();
            rules.Add(new TestCaseDescriptor(rulesId, "parser", "Rule patterns parse in Claude Code syntax and invalid ones are rejected with a reason", ct => ParserAsync(ct)));
            rules.Add(new TestCaseDescriptor(rulesId, "shell", "Bash rules: prefix, exact, and glob specifiers; every subcommand must be allowed; substitution is never allowed; deny beats ask beats allow", ct => ShellAsync(ct)));
            rules.Add(new TestCaseDescriptor(rulesId, "tools", "MCP server wildcards, Edit and Read families, WebFetch domains, workspace-relative paths, and input patterns", ct => ToolsAsync(ct)));
            rules.Add(new TestCaseDescriptor(rulesId, "suggest-redact", "Suggested rules and secret redaction of previews", ct => SuggestRedactAsync(ct)));
            rules.Add(new TestCaseDescriptor(rulesId, "codex-relay-unit", "The Codex approval relay asks as Bash and Edit with the item's paths, answers accept or decline, and declines when Garrison cannot be reached", ct => RelayUnitAsync(ct)));
            rules.Add(new TestCaseDescriptor(rulesId, "compile", "Approvals add --permission-prompt-tool, the Garrison MCP server, and the Codex relay; disabled deployments compile as before", ct => CompileAsync(ct)));
            suites.Add(new TestSuiteDescriptor(rulesId, "Approval rules (P12.3)", rules));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "approvals-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "store", "Approvals persist, enumerate by tenant, and a decision is a compare-and-set from Pending (" + provider + ")", ct => StoreAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "claude-rules", "A Claude permission prompt is allowed and denied by deployment rules, recorded, and shown in the run's events (" + provider + ")", ct => ClaudeRulesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "ask-approve", "An Ask request waits with the run awaiting approval until a person approves it over REST (" + provider + ")", ct => AskApproveAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "ask-deny-remember", "A person denies over MCP with remember; the next identical request is denied by the remembered rule (" + provider + ")", ct => DenyRememberAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "timeout", "Pending approvals expire with the deployment's timeout decision (Deny and Allow) (" + provider + ")", ct => TimeoutAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "cancel-pending", "Cancelling a run cancels its pending approval and answers the harness with a denial (" + provider + ")", ct => CancelPendingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "codex-relay", "Codex app-server command and file change approvals are relayed by the worker and decided by rules and a person (" + provider + ")", ct => CodexRelayAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "rbac-tenants", "Viewers read but cannot decide, other tenants get 404, run tokens cannot read or decide, and only run tokens may prompt (" + provider + ")", ct => RbacAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sweep-validation", "The leader sweep cancels approvals of stopped runs; invalid rules and unsupported harnesses are rejected (" + provider + ")", ct => SweepValidationAsync(provider, ct)));
                if (provider == DatabaseTypeEnum.Postgresql)
                {
                    cases.Add(new TestCaseDescriptor(id, "cross-replica", "A decision on replica B wakes the harness call waiting on replica A through the backplane (" + provider + ")", ct => CrossReplicaAsync(provider, ct)));
                }
                suites.Add(new TestSuiteDescriptor(id, "Approvals (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static DeploymentApprovalRule Rule(ApprovalRuleActionEnum action, string pattern, string? inputPattern = null)
        {
            DeploymentApprovalRule rule = new DeploymentApprovalRule();
            rule.Action = action;
            rule.Pattern = pattern;
            rule.InputPattern = inputPattern;
            return rule;
        }

        private static ApprovalRuleActionEnum? Bash(List<DeploymentApprovalRule> rules, string command)
        {
            ApprovalToolInput input = new ApprovalToolInput();
            input.Command = command;
            return ApprovalRuleMatcher.Evaluate(rules, "Bash", input, "{\"command\":" + JsonSerializer.Serialize(command) + "}", null).Action;
        }

        private static Task ParserAsync(CancellationToken token)
        {
            Assert.True(ApprovalRuleParser.TryParse("Bash(git status:*)", out ParsedApprovalRule? bash, out string? _), "Bash prefix rule parses");
            Assert.Equal("Bash", bash!.Tool, "Tool part");
            Assert.Equal("git status:*", bash.Specifier, "Specifier");
            Assert.True(ApprovalRuleParser.TryParse("mcp__github__*", out ParsedApprovalRule? wildcard, out string? _) && wildcard!.Specifier == null, "MCP server wildcard parses");
            Assert.True(ApprovalRuleParser.TryParse("Bash(*)", out ParsedApprovalRule? any, out string? _) && any!.Specifier == null && any.Raw == "Bash", "Tool(*) is the bare tool");
            Assert.True(!ApprovalRuleParser.TryParse("Bash(", out ParsedApprovalRule? _, out string? openError) && openError != null, "Unclosed specifier is rejected");
            Assert.True(!ApprovalRuleParser.TryParse("Bash()", out ParsedApprovalRule? _, out string? _), "Empty specifier is rejected");
            Assert.True(!ApprovalRuleParser.TryParse("Edit__*", out ParsedApprovalRule? _, out string? _), "__* only for MCP tools");
            Assert.True(!ApprovalRuleParser.TryParse("mcp__x__*(foo)", out ParsedApprovalRule? _, out string? _), "MCP wildcard with a specifier is rejected");
            Assert.True(!ApprovalRuleParser.TryParse("1bad", out ParsedApprovalRule? _, out string? _), "Tool names start with a letter");
            Assert.True(!ApprovalRuleParser.TryParse("Bash(a\nb)", out ParsedApprovalRule? _, out string? _), "Multi-line patterns are rejected");
            Assert.True(ApprovalRuleMatcher.IsUnrestrictedShellRule("Bash") && ApprovalRuleMatcher.IsUnrestrictedShellRule("Bash(:*)") && !ApprovalRuleMatcher.IsUnrestrictedShellRule("Bash(git:*)"), "Unrestricted shell rules are recognized");
            return Task.CompletedTask;
        }

        private static Task ShellAsync(CancellationToken token)
        {
            List<DeploymentApprovalRule> rules = new List<DeploymentApprovalRule>
            {
                Rule(ApprovalRuleActionEnum.Allow, "Bash(git status:*)"),
                Rule(ApprovalRuleActionEnum.Allow, "Bash(ls)"),
                Rule(ApprovalRuleActionEnum.Allow, "Bash(npm run *)"),
                Rule(ApprovalRuleActionEnum.Deny, "Bash(rm:*)"),
                Rule(ApprovalRuleActionEnum.Ask, "Bash(git push:*)"),
                Rule(ApprovalRuleActionEnum.Allow, "Bash(git push --dry-run)")
            };
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "git status"), "Prefix rule covers the bare command");
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "git status --short"), "Prefix rule covers more arguments");
            Assert.Equal((ApprovalRuleActionEnum?)null, Bash(rules, "git statusx"), "Allow prefixes need a word boundary");
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "ls"), "Exact rule");
            Assert.Equal((ApprovalRuleActionEnum?)null, Bash(rules, "ls -la"), "An exact allow does not cover more arguments");
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "npm run build"), "Glob rule");
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "git status && ls"), "Every subcommand allowed");
            Assert.Equal((ApprovalRuleActionEnum?)null, Bash(rules, "git status && curl x"), "One uncovered subcommand leaves the decision to the default");
            Assert.Equal((ApprovalRuleActionEnum?)null, Bash(rules, "git status $(curl x)"), "Command substitution is never allowed by a rule");
            Assert.Equal((ApprovalRuleActionEnum?)null, Bash(rules, "ls `id`"), "Backticks are never allowed");
            Assert.Equal((ApprovalRuleActionEnum?)null, Bash(rules, "git status 'open"), "An open quote is never allowed");
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "git status 'a;b'"), "Operators inside quotes do not split");
            Assert.Equal(ApprovalRuleActionEnum.Deny, Bash(rules, "ls; rm -rf /"), "A denied subcommand denies the line");
            Assert.Equal(ApprovalRuleActionEnum.Deny, Bash(rules, "git status | rmdir x"), "Deny prefixes match without a word boundary");
            Assert.Equal(ApprovalRuleActionEnum.Ask, Bash(rules, "git push origin main"), "Ask rule");
            Assert.Equal(ApprovalRuleActionEnum.Ask, Bash(rules, "git push --dry-run"), "Ask beats Allow");
            Assert.Equal(ApprovalRuleActionEnum.Deny, Bash(rules, "git push && rm x"), "Deny beats Ask");
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(rules, "git status 2>&1"), "Redirections are not command separators");

            ShellSplitResult split = ShellCommandSplitter.Split("a && b || c | d ; e & f\ng");
            Assert.Equal(7, split.Commands.Count, "Every operator splits");
            Assert.True(ShellCommandSplitter.Split("diff <(a) b").HasSubstitution, "Process substitution is noted");
            Assert.True(!ShellCommandSplitter.Split("echo '$(x)'").HasSubstitution, "Single quotes hide substitution");
            Assert.True(ShellCommandSplitter.Split("echo \"$(x)\"").HasSubstitution, "Double quotes do not");

            List<DeploymentApprovalRule> bare = new List<DeploymentApprovalRule> { Rule(ApprovalRuleActionEnum.Allow, "Bash") };
            Assert.Equal(ApprovalRuleActionEnum.Allow, Bash(bare, "anything $(at all)"), "A bare Bash allow covers everything");
            return Task.CompletedTask;
        }

        private static Task ToolsAsync(CancellationToken token)
        {
            List<DeploymentApprovalRule> rules = new List<DeploymentApprovalRule>
            {
                Rule(ApprovalRuleActionEnum.Allow, "mcp__github__*"),
                Rule(ApprovalRuleActionEnum.Deny, "mcp__github__delete_repo"),
                Rule(ApprovalRuleActionEnum.Allow, "mcp__docs"),
                Rule(ApprovalRuleActionEnum.Allow, "Edit(src/**)"),
                Rule(ApprovalRuleActionEnum.Deny, "Edit(**/.env)"),
                Rule(ApprovalRuleActionEnum.Allow, "Read"),
                Rule(ApprovalRuleActionEnum.Allow, "WebFetch(domain:example.com)"),
                Rule(ApprovalRuleActionEnum.Allow, "WebFetch(domain:*.docs.dev)"),
                Rule(ApprovalRuleActionEnum.Deny, "Write", "secret")
            };
            Assert.Equal(ApprovalRuleActionEnum.Allow, ApprovalRuleMatcher.Evaluate(rules, "mcp__github__create_issue", null, "{}", null).Action, "Server wildcard");
            Assert.Equal(ApprovalRuleActionEnum.Deny, ApprovalRuleMatcher.Evaluate(rules, "mcp__github__delete_repo", null, "{}", null).Action, "Deny beats the wildcard");
            Assert.Equal(ApprovalRuleActionEnum.Allow, ApprovalRuleMatcher.Evaluate(rules, "mcp__docs__search", null, "{}", null).Action, "Bare server name");
            Assert.Equal((ApprovalRuleActionEnum?)null, ApprovalRuleMatcher.Evaluate(rules, "mcp__gitlab__x", null, "{}", null).Action, "Other servers are not covered");

            string cwd = "/var/garrison/work/run_x/work";
            ApprovalToolInput inside = new ApprovalToolInput { FilePath = cwd + "/src/a/b.cs" };
            ApprovalToolInput outside = new ApprovalToolInput { FilePath = "/etc/src/b.cs" };
            ApprovalToolInput env = new ApprovalToolInput { FilePath = cwd + "/src/.env" };
            Assert.Equal(ApprovalRuleActionEnum.Allow, ApprovalRuleMatcher.Evaluate(rules, "Write", inside, "{}", cwd).Action, "Edit(src/**) covers Write inside the workspace");
            Assert.Equal((ApprovalRuleActionEnum?)null, ApprovalRuleMatcher.Evaluate(rules, "Edit", outside, "{}", cwd).Action, "Paths outside the workspace are not covered");
            Assert.Equal((ApprovalRuleActionEnum?)null, ApprovalRuleMatcher.Evaluate(rules, "Edit", inside, "{}", null).Action, "Relative allow rules need a working directory");
            Assert.Equal(ApprovalRuleActionEnum.Deny, ApprovalRuleMatcher.Evaluate(rules, "Edit", env, "{}", null).Action, "Relative deny rules match path suffixes without one");
            Assert.Equal(ApprovalRuleActionEnum.Allow, ApprovalRuleMatcher.Evaluate(rules, "Grep", new ApprovalToolInput { Path = "/x" }, "{}", null).Action, "Read covers Grep");
            Assert.Equal(ApprovalRuleActionEnum.Allow, ApprovalRuleMatcher.Evaluate(rules, "WebFetch", new ApprovalToolInput { Url = "https://Example.com/a" }, "{}", null).Action, "Domain match ignores case");
            Assert.Equal((ApprovalRuleActionEnum?)null, ApprovalRuleMatcher.Evaluate(rules, "WebFetch", new ApprovalToolInput { Url = "https://evil.com/?example.com" }, "{}", null).Action, "Other hosts are not covered");
            Assert.Equal(ApprovalRuleActionEnum.Allow, ApprovalRuleMatcher.Evaluate(rules, "WebFetch", new ApprovalToolInput { Url = "https://api.docs.dev/x" }, "{}", null).Action, "Subdomain wildcard");
            Assert.Equal((ApprovalRuleActionEnum?)null, ApprovalRuleMatcher.Evaluate(rules, "WebFetch", new ApprovalToolInput { Url = "https://docs.dev/x" }, "{}", null).Action, "Subdomain wildcard excludes the parent");
            Assert.Equal(ApprovalRuleActionEnum.Deny, ApprovalRuleMatcher.Evaluate(rules, "Write", inside, "{\"content\":\"my secret\"}", cwd).Action, "Input pattern narrows a rule");
            ApprovalToolInput codexPaths = new ApprovalToolInput { Paths = new List<string> { "src/x.cs", "README.md" }, Cwd = cwd };
            Assert.Equal((ApprovalRuleActionEnum?)null, ApprovalRuleMatcher.Evaluate(rules, "Edit", codexPaths, "{}", cwd).Action, "Every path of a multi-file change must be allowed");
            return Task.CompletedTask;
        }

        private static Task SuggestRedactAsync(CancellationToken token)
        {
            Assert.Equal("Bash(git push:*)", ApprovalRuleMatcher.SuggestRule("Bash", new ApprovalToolInput { Command = "git push origin main && ls" }, null), "Shell suggestion uses the first two words");
            Assert.Equal("Bash(ls:*)", ApprovalRuleMatcher.SuggestRule("Bash", new ApprovalToolInput { Command = "ls -la" }, null), "Flags are not part of the suggestion");
            Assert.Equal("WebFetch(domain:example.com)", ApprovalRuleMatcher.SuggestRule("WebFetch", new ApprovalToolInput { Url = "https://example.com/x" }, null), "WebFetch suggestion");
            Assert.Equal("Edit(src/a.cs)", ApprovalRuleMatcher.SuggestRule("Write", new ApprovalToolInput { FilePath = "/w/run_1/work/src/a.cs" }, "/w/run_1/work"), "Workspace-relative edit suggestion");
            Assert.Equal("Edit(//etc/hosts)", ApprovalRuleMatcher.SuggestRule("Edit", new ApprovalToolInput { FilePath = "/etc/hosts" }, "/w/run_1/work"), "Absolute edit suggestion");
            Assert.Equal("mcp__x__y", ApprovalRuleMatcher.SuggestRule("mcp__x__y", null, null), "Other tools suggest their name");

            ApprovalRedactor redactor = new ApprovalRedactor(new[] { "hunter2-literal-secret" });
            string text = redactor.Redact("curl -H 'Authorization: Bearer abcdefghijklmnop' -d password=hunter3 sk-ant-0123456789abcdefghij ghp_0123456789abcdefghijABCD AKIAABCDEFGHIJKLMNOP hunter2-literal-secret {\"api_key\":\"zzzzzzzz\"}") ?? String.Empty;
            foreach (string leaked in new[] { "abcdefghijklmnop", "hunter3", "sk-ant-0123456789", "ghp_0123456789", "AKIAABCDEFGHIJKLMNOP", "hunter2-literal-secret", "zzzzzzzz" })
            {
                Assert.True(!text.Contains(leaked, StringComparison.Ordinal), "Redacted " + leaked + ": " + text);
            }
            Assert.True(text.Contains("[REDACTED]", StringComparison.Ordinal), "Redaction marker present");
            string clipped = redactor.RedactAndClip(new string('a', 1000), 100) ?? String.Empty;
            Assert.True(clipped.Length <= 100 && clipped.EndsWith("[truncated]", StringComparison.Ordinal), "Previews are clipped");
            return Task.CompletedTask;
        }

        private static async Task RelayUnitAsync(CancellationToken token)
        {
            ExecutionApprovalRelay settings = new ExecutionApprovalRelay { McpUrl = "http://127.0.0.1:1", BearerToken = "t" };
            Garrison.Harnesses.AppServer.CodexApprovalRelay relay = new Garrison.Harnesses.AppServer.CodexApprovalRelay(settings);
            List<string> asked = new List<string>();
            relay.Ask = (tool, input, id, kind, ct) =>
            {
                asked.Add(tool + "|" + kind + "|" + id + "|" + input);
                Garrison.Harnesses.AppServer.PermissionPromptReply reply = new Garrison.Harnesses.AppServer.PermissionPromptReply();
                reply.Behavior = tool == "Bash" ? "allow" : "deny";
                return Task.FromResult(reply);
            };
            relay.Observe(Message(null, "item/started", "{\"item\":{\"type\":\"fileChange\",\"id\":\"fc1\",\"changes\":[{\"path\":\"src/a.cs\",\"kind\":{\"type\":\"update\"}}]}}"));
            object? command = await relay.HandleAsync(Message("1", "item/commandExecution/requestApproval", "{\"itemId\":\"c1\",\"command\":\"git status\",\"cwd\":\"/w\"}"), token).ConfigureAwait(false);
            object? file = await relay.HandleAsync(Message("2", "item/fileChange/requestApproval", "{\"itemId\":\"fc1\"}"), token).ConfigureAwait(false);
            Assert.Equal("accept", ((Garrison.Harnesses.AppServer.CodexApprovalResponse)command!).Decision, "Allowed command is accepted");
            Assert.Equal("decline", ((Garrison.Harnesses.AppServer.CodexApprovalResponse)file!).Decision, "Denied file change is declined");
            Assert.True(asked[0].StartsWith("Bash|Command|c1|", StringComparison.Ordinal) && asked[0].Contains("git status", StringComparison.Ordinal) && asked[0].Contains("\"/w\"", StringComparison.Ordinal), "Command asked as Bash with cwd: " + asked[0]);
            Assert.True(asked[1].StartsWith("Edit|FileChange|fc1|", StringComparison.Ordinal) && asked[1].Contains("src/a.cs", StringComparison.Ordinal), "File change asked as Edit with its paths: " + asked[1]);

            Garrison.Harnesses.AppServer.CodexApprovalRelay unreachable = new Garrison.Harnesses.AppServer.CodexApprovalRelay(settings);
            unreachable.Ask = (tool, input, id, kind, ct) => throw new InvalidOperationException("connection refused");
            object? declined = await unreachable.HandleAsync(Message("3", "item/commandExecution/requestApproval", "{\"itemId\":\"c2\",\"command\":\"ls\"}"), token).ConfigureAwait(false);
            Assert.Equal("decline", ((Garrison.Harnesses.AppServer.CodexApprovalResponse)declined!).Decision, "Failures decline");
            object? elicitation = await relay.HandleAsync(Message("4", "mcpServer/elicitation/request", "{}"), token).ConfigureAwait(false);
            Assert.Equal("decline", ((Garrison.Harnesses.AppServer.CodexElicitationResponse)elicitation!).Action, "Elicitations keep the headless answer");
        }

        private static Garrison.Harnesses.AppServer.JsonRpcMessage Message(string? id, string method, string parametersJson)
        {
            Garrison.Harnesses.AppServer.JsonRpcMessage message = new Garrison.Harnesses.AppServer.JsonRpcMessage();
            if (id != null)
            {
                using (JsonDocument idDocument = JsonDocument.Parse(id))
                {
                    message.Id = idDocument.RootElement.Clone();
                }
            }
            message.Method = method;
            using (JsonDocument document = JsonDocument.Parse(parametersJson))
            {
                message.Params = document.RootElement.Clone();
            }
            return message;
        }

        private static async Task CompileAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                HarnessProfile claude = (await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/claude-code", token).ConfigureAwait(false))!;
                HarnessProfile codex = (await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/codex-app-server", token).ConfigureAwait(false))!;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents", new Agent { Name = "compile-approvals" }, 201, token).ConfigureAwait(false);
                Deployment off = await CreateDeploymentAsync(host, agent, claude, "claude-off", d => { }, token).ConfigureAwait(false);
                Deployment on = await CreateDeploymentAsync(host, agent, claude, "claude-on", d => { d.ApprovalsEnabled = true; d.ApprovalTimeoutSeconds = 900; }, token).ConfigureAwait(false);
                Deployment codexOn = await CreateDeploymentAsync(host, agent, codex, "codex-on", d => { d.ApprovalsEnabled = true; }, token).ConfigureAwait(false);

                InvocationCompiler compiler = host.Server.Context.Get<InvocationCompiler>();
                ExecutionSpec offSpec = (await compiler.PreviewAsync(host.TenantId, off.Id, "hi", null, token).ConfigureAwait(false)).Spec;
                Assert.True(!offSpec.Arguments.Contains("--permission-prompt-tool"), "Disabled: no prompt tool");
                Assert.True(offSpec.Arguments.Contains("acceptEdits"), "Disabled: permission mode unchanged");
                Assert.True(offSpec.Arguments.Contains("Bash,Read,Edit,Write,Glob,Grep,WebFetch,WebSearch,mcp__garrison"), "Disabled: allowed tools unchanged");
                Assert.True(offSpec.Environment.Any(e => e.Name == "MCP_TOOL_TIMEOUT" && e.Value == "600000"), "Disabled: MCP tool timeout unchanged");
                Assert.True(!offSpec.Files.Any(f => f.Path == "mcp.json"), "Disabled without delegation: no MCP config");

                ExecutionSpec onSpec = (await compiler.PreviewAsync(host.TenantId, on.Id, "hi", null, token).ConfigureAwait(false)).Spec;
                int prompt = onSpec.Arguments.IndexOf("--permission-prompt-tool");
                Assert.True(prompt >= 0 && onSpec.Arguments[prompt + 1] == "mcp__garrison__garrison_permission_prompt", "Enabled: prompt tool argument");
                Assert.True(onSpec.Arguments.Contains("default") && !onSpec.Arguments.Contains("acceptEdits"), "Enabled: default permission mode");
                int allowed = onSpec.Arguments.IndexOf("--allowedTools");
                Assert.Equal("mcp__garrison", onSpec.Arguments[allowed + 1], "Enabled: only Garrison's tools are pre-allowed");
                Assert.True(onSpec.Environment.Any(e => e.Name == "MCP_TOOL_TIMEOUT" && e.Value == "1020000"), "Enabled: MCP tool timeout covers the approval timeout");
                Assert.True(onSpec.Files.Any(f => f.Path == "mcp.json"), "Enabled: the Garrison MCP server is configured");
                Assert.True(onSpec.McpPreflight.Any(c => c.RequiredTools.Contains("garrison_permission_prompt")), "Enabled: preflight requires the prompt tool");

                ExecutionSpec codexSpec = (await compiler.PreviewAsync(host.TenantId, codexOn.Id, "hi", null, token).ConfigureAwait(false)).Spec;
                Assert.NotNull(codexSpec.ApprovalRelay, "Codex app-server: approval relay");
                Assert.Equal("untrusted", codexSpec.AppServer!.ApprovalPolicy, "Codex app-server: untrusted approval policy");
                Assert.True(codexSpec.ParserOptions.ApprovalsRelayed, "Codex app-server: parser knows approvals are relayed");
                Assert.True(codexSpec.ApprovalRelay!.BearerToken != "preview-run-token", "Preview redacts the relay token");
            }
        }

        private static async Task StoreAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false);
            try
            {
                Approval a = new Approval { TenantId = "ten_a", RunId = "run_1", AgentId = "agt_1", AgentName = "a", DeploymentId = "dep_1", ToolName = "Bash", Status = ApprovalStatusEnum.Pending, ExpiresUtc = DateTime.UtcNow.AddMinutes(5), InputPreview = "{\"command\":\"ls\"}" };
                Approval b = new Approval { TenantId = "ten_b", RunId = "run_2", AgentId = "agt_2", AgentName = "b", DeploymentId = "dep_2", ToolName = "Edit", Status = ApprovalStatusEnum.Approved, Decision = ApprovalDecisionEnum.Allow, DecisionSource = ApprovalSourceEnum.Rule };
                await db.Approvals.CreateAsync(a, token).ConfigureAwait(false);
                await db.Approvals.CreateAsync(b, token).ConfigureAwait(false);

                Approval read = Assert.NotNull(await db.Approvals.ReadAsync("ten_a", a.Id, token).ConfigureAwait(false), "Read in tenant");
                Assert.Equal("{\"command\":\"ls\"}", read.InputPreview, "Preview round-trips");
                Assert.True(await db.Approvals.ReadAsync("ten_b", a.Id, token).ConfigureAwait(false) == null, "Other tenant cannot read");
                EnumerationResult<Approval> pending = await db.Approvals.EnumerateAsync(new ApprovalFilter { TenantId = "ten_a", Status = ApprovalStatusEnum.Pending }, token).ConfigureAwait(false);
                Assert.Equal(1L, pending.TotalRecords, "Pending in tenant a");
                Assert.Equal(1L, await db.Approvals.CountPendingAsync(null, token).ConfigureAwait(false), "Pending everywhere");

                ApprovalResolution first = new ApprovalResolution { ApprovalId = a.Id, Status = ApprovalStatusEnum.Approved, Decision = ApprovalDecisionEnum.Allow, Source = ApprovalSourceEnum.User, DecidedBy = "alice" };
                ApprovalResolution second = new ApprovalResolution { ApprovalId = a.Id, Status = ApprovalStatusEnum.Expired, Decision = ApprovalDecisionEnum.Deny, Source = ApprovalSourceEnum.Timeout };
                Assert.True(await db.Approvals.ResolveAsync(first, token).ConfigureAwait(false), "First decision wins");
                Assert.True(!await db.Approvals.ResolveAsync(second, token).ConfigureAwait(false), "Second decision loses");
                Approval decided = Assert.NotNull(await db.Approvals.ReadAsync(a.Id, token).ConfigureAwait(false), "Decided");
                Assert.Equal(ApprovalStatusEnum.Approved, decided.Status, "Status kept");
                Assert.Equal("alice", decided.DecidedBy, "Decider kept");
                Assert.True(decided.WaitMs.HasValue, "Wait computed");
                Assert.Equal(2, (await db.Approvals.ListByRunsAsync(new List<string> { "run_1", "run_2" }, 10, token).ConfigureAwait(false)).Count, "List by runs");
            }
            finally
            {
                db.Dispose();
            }
        }

        private static async Task ClaudeRulesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ClaudeProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("approve-rules", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.ApprovalDefaultAction = ApprovalRuleActionEnum.Deny;
                    d.ApprovalRules.Add(Rule(ApprovalRuleActionEnum.Allow, "Bash(git status:*)"));
                    d.ApprovalRules.Add(Rule(ApprovalRuleActionEnum.Deny, "Bash(rm:*)"));
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"git status --short\"}" });
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest2", Value = "Bash={\"command\":\"rm -rf /tmp/x\",\"token\":\"tok-1234567890\"}" });
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest3", Value = "WebFetch={\"url\":\"https://example.com\"}" });
                }).ConfigureAwait(false);

                Run run = await InvokeAndWaitAsync(host, agent, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Run succeeded: " + run.ErrorMessage + " " + run.StderrTail);
                string result = run.ResultText ?? String.Empty;
                Assert.True(result.Contains("permission Bash: allow", StringComparison.Ordinal), "git status allowed: " + result);
                Assert.True(result.Contains("permission Bash: deny", StringComparison.Ordinal), "rm denied: " + result);
                Assert.True(result.Contains("permission WebFetch: deny", StringComparison.Ordinal), "Default Deny: " + result);
                Assert.True(!run.AwaitingApproval && run.PendingApprovals == 0, "Nothing pending");

                List<Approval> approvals = await ListAsync(host.AdminClient, host.TenantId, "runId=" + run.Id, token).ConfigureAwait(false);
                Assert.Equal(3, approvals.Count, "Three approvals recorded");
                Approval allowed = approvals.Single(a => a.Summary == "git status --short");
                Assert.Equal(ApprovalStatusEnum.Approved, allowed.Status, "Allowed by rule");
                Assert.Equal(ApprovalSourceEnum.Rule, allowed.DecisionSource, "Rule source");
                Assert.Equal("Bash(git status:*)", allowed.RulePattern, "Rule recorded");
                Approval denied = approvals.Single(a => (a.Summary ?? String.Empty).StartsWith("rm", StringComparison.Ordinal));
                Assert.Equal(ApprovalStatusEnum.Denied, denied.Status, "Denied by rule");
                Assert.True(!(denied.InputPreview ?? String.Empty).Contains("tok-1234567890", StringComparison.Ordinal), "Token-like values are redacted: " + denied.InputPreview);
                Approval fallback = approvals.Single(a => a.ToolName == "WebFetch");
                Assert.Equal(ApprovalSourceEnum.Default, fallback.DecisionSource, "Deployment default");
                Assert.Equal("WebFetch(domain:example.com)", fallback.SuggestedRule, "Suggested rule");

                RunEventsResponse events = await EventsAsync(host, run.Id, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && e.Success == false && (e.Text ?? String.Empty).Contains("Bash(rm:*)", StringComparison.Ordinal)), "The denial message names the rule (approval-denied template)");
                Assert.True(events.Events.Count(e => e.Code == "ApprovalDecided") == 3, "The worker recorded each decision in the run's events: " + String.Join(" | ", events.Events.Select(e => e.Code + ":" + e.Text)));

                ApprovalCheckResponse check = await HttpTestHelpers.SendAsync<ApprovalCheckResponse>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/deployments/" + allowed.DeploymentId + "/approval-check", new ApprovalCheckRequest { ToolName = "Bash", Input = new ApprovalToolInput { Command = "git status && rm x" } }, 200, token).ConfigureAwait(false);
                Assert.Equal(ApprovalRuleActionEnum.Deny, check.Action, "Check endpoint evaluates rules");
                Assert.Equal("Bash(rm:*)", check.RulePattern, "Check reports the rule");
            }
        }

        private static async Task AskApproveAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ClaudeProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("approve-ask", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"git push origin main\"}" });
                }).ConfigureAwait(false);

                Run started = await InvokeAsync(host, agent, token).ConfigureAwait(false);
                Approval pending = await WaitForPendingAsync(host.AdminClient, host.TenantId, started.Id, token).ConfigureAwait(false);
                Assert.Equal("git push origin main", pending.Summary, "Summary");
                Assert.Equal("Bash(git push:*)", pending.SuggestedRule, "Suggested rule");
                Assert.True(pending.ExpiresUtc.HasValue, "Pending approvals expire");
                Run waiting = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + started.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(waiting.AwaitingApproval && waiting.PendingApprovals == 1 && waiting.Status == RunStatusEnum.Running, "The run is Running and awaiting approval");
                await WaitForEventAsync(host, started.Id, "ApprovalRequested", token).ConfigureAwait(false);
                await Task.Delay(300, token).ConfigureAwait(false);

                Approval decided = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/approvals/" + pending.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow, Reason = "looks fine" }, 200, token).ConfigureAwait(false);
                Assert.Equal(ApprovalStatusEnum.Approved, decided.Status, "Approved");
                Assert.Equal(ApprovalSourceEnum.User, decided.DecisionSource, "By a person");
                Assert.Equal("looks fine", decided.Reason, "Reason kept");
                Assert.True(!String.IsNullOrEmpty(decided.DecidedBy), "Decider recorded");
                Assert.Equal(409, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/approvals/" + pending.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Deny }, token).ConfigureAwait(false)).StatusCode, "A decided approval cannot be decided again");

                Run done = Assert.NotNull(await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, started.Id, 60, token).ConfigureAwait(false), "Run");
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "Run succeeded");
                Assert.True((done.ResultText ?? String.Empty).Contains("permission Bash: allow", StringComparison.Ordinal), "The harness was allowed: " + done.ResultText);
                Assert.True(!done.AwaitingApproval && done.ApprovalWaitMs.HasValue && done.ApprovalWaitMs.Value > 0, "Approval wait recorded: " + done.ApprovalWaitMs);
                RunEventsResponse events = await EventsAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(e => e.Code == "ApprovalDecided" && (e.Text ?? String.Empty).Contains("looks fine", StringComparison.Ordinal)), "Decision recorded in the run's events");

                EnumerationResult<AuditRecord> audit = await HttpTestHelpers.SendAsync<EnumerationResult<AuditRecord>>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/audit?maxResults=100", null, 200, token).ConfigureAwait(false);
                Assert.True(audit.Objects.Any(r => r.EventType == AuditEventTypeEnum.ApprovalDecided && r.ResourceId == pending.Id), "The decision is audited");
            }
        }

        private static async Task DenyRememberAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ClaudeProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("approve-remember", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"curl https://example.com\"}" });
                }).ConfigureAwait(false);

                Run started = await InvokeAsync(host, agent, token).ConfigureAwait(false);
                Approval pending = await WaitForPendingAsync(host.AdminClient, host.TenantId, started.Id, token).ConfigureAwait(false);
                string text = await McpCallAsync(host, null, "garrison_decide_approval", new { approvalId = pending.Id, decision = "Deny", reason = "no network", remember = true }, token).ConfigureAwait(false);
                Approval decided = Assert.NotNull(JsonSerializer.Deserialize<Approval>(text, Garrison.Core.Serialization.Serializer.Options), "MCP decide result");
                Assert.Equal(ApprovalStatusEnum.Denied, decided.Status, "Denied over MCP");
                Assert.True(!String.IsNullOrEmpty(decided.RememberedRuleId), "A rule was remembered");

                Run done = Assert.NotNull(await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, started.Id, 60, token).ConfigureAwait(false), "Run");
                Assert.True((done.ResultText ?? String.Empty).Contains("permission Bash: deny", StringComparison.Ordinal), "The harness was denied");
                RunEventsResponse events = await EventsAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && (e.Text ?? String.Empty).Contains("no network", StringComparison.Ordinal)), "The harness saw the reason");

                Deployment deployment = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, pending.DeploymentId, token).ConfigureAwait(false), "Deployment");
                DeploymentApprovalRule remembered = deployment.ApprovalRules.Single(r => r.Id == decided.RememberedRuleId);
                Assert.Equal(ApprovalRuleActionEnum.Deny, remembered.Action, "Deny rule");
                Assert.Equal("Bash(curl:*)", remembered.Pattern, "Suggested pattern remembered");

                Run second = await InvokeAndWaitAsync(host, agent, token).ConfigureAwait(false);
                Assert.True((second.ResultText ?? String.Empty).Contains("permission Bash: deny", StringComparison.Ordinal), "Second run denied without asking");
                List<Approval> secondApprovals = await ListAsync(host.AdminClient, host.TenantId, "runId=" + second.Id, token).ConfigureAwait(false);
                Assert.True(secondApprovals.Count == 1 && secondApprovals[0].DecisionSource == ApprovalSourceEnum.Rule && secondApprovals[0].RuleId == remembered.Id, "Decided by the remembered rule");
            }
        }

        private static async Task TimeoutAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ClaudeProfileAsync(host, token).ConfigureAwait(false);
                Agent denyAgent = await cluster.CreateAgentAsync("approve-timeout-deny", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.ApprovalTimeoutSeconds = 10;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"make deploy\"}" });
                }).ConfigureAwait(false);
                Agent allowAgent = await cluster.CreateAgentAsync("approve-timeout-allow", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.ApprovalTimeoutSeconds = 10;
                    d.ApprovalTimeoutDecision = ApprovalDecisionEnum.Allow;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"make test\"}" });
                }).ConfigureAwait(false);

                Run deny = await InvokeAsync(host, denyAgent, token).ConfigureAwait(false);
                Run allow = await InvokeAsync(host, allowAgent, token).ConfigureAwait(false);
                RunService runs = host.Server.Context.Get<RunService>();
                Run deniedRun = Assert.NotNull(await runs.WaitAsync(host.TenantId, deny.Id, 90, token).ConfigureAwait(false), "Deny run");
                Run allowedRun = Assert.NotNull(await runs.WaitAsync(host.TenantId, allow.Id, 90, token).ConfigureAwait(false), "Allow run");
                Assert.True((deniedRun.ResultText ?? String.Empty).Contains("permission Bash: deny", StringComparison.Ordinal), "Timeout denies by default: " + deniedRun.ResultText);
                Assert.True((allowedRun.ResultText ?? String.Empty).Contains("permission Bash: allow", StringComparison.Ordinal), "Timeout decision Allow allows: " + allowedRun.ResultText);
                Approval expired = (await ListAsync(host.AdminClient, host.TenantId, "runId=" + deny.Id, token).ConfigureAwait(false)).Single();
                Assert.Equal(ApprovalStatusEnum.Expired, expired.Status, "Expired");
                Assert.Equal(ApprovalSourceEnum.Timeout, expired.DecisionSource, "Timeout source");
                Assert.True(expired.WaitMs.HasValue && expired.WaitMs.Value >= 9000, "Waited for the timeout: " + expired.WaitMs);
                Approval expiredAllow = (await ListAsync(host.AdminClient, host.TenantId, "runId=" + allow.Id, token).ConfigureAwait(false)).Single();
                Assert.True(expiredAllow.Status == ApprovalStatusEnum.Expired && expiredAllow.Decision == ApprovalDecisionEnum.Allow, "Expired with Allow");
                RunEventsResponse events = await EventsAsync(host, deny.Id, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(e => e.EventType == RunEventTypeEnum.ToolResult && (e.Text ?? String.Empty).Contains("within 10 seconds", StringComparison.Ordinal)), "The harness was told it timed out");
            }
        }

        private static async Task CancelPendingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ClaudeProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("approve-cancel", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"terraform apply\"}" });
                }).ConfigureAwait(false);

                Run started = await InvokeAsync(host, agent, token).ConfigureAwait(false);
                Approval pending = await WaitForPendingAsync(host.AdminClient, host.TenantId, started.Id, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + started.Id + "/cancel", null, 200, token).ConfigureAwait(false);
                Approval cancelled = await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/approvals/" + pending.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(ApprovalStatusEnum.Cancelled, cancelled.Status, "Cancelling the run cancels the approval at once");
                Assert.Equal(ApprovalDecisionEnum.Deny, cancelled.Decision, "Cancelled approvals deny");
                Run done = Assert.NotNull(await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, started.Id, 60, token).ConfigureAwait(false), "Run");
                Assert.Equal(RunStatusEnum.Cancelled, done.Status, "Run cancelled");
                Assert.True(!done.AwaitingApproval, "No longer awaiting approval");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/approvals/apr_missing/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false)).StatusCode, "Unknown approvals are 404");
            }
        }

        private static async Task CodexRelayAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await CodexProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("approve-codex", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.ApprovalRules.Add(Rule(ApprovalRuleActionEnum.Allow, "Bash(git status:*)"));
                    d.Parameters.Add(new DeploymentParameter { Name = "approvalCommand", Value = "git status" });
                    d.Parameters.Add(new DeploymentParameter { Name = "fileApproval", Value = "src/app.cs" });
                }).ConfigureAwait(false);

                Run started = await InvokeAsync(host, agent, token).ConfigureAwait(false);
                Approval pending = await WaitForPendingAsync(host.AdminClient, host.TenantId, started.Id, token).ConfigureAwait(false);
                Assert.Equal(ApprovalKindEnum.FileChange, pending.Kind, "The file change waits for a person");
                Assert.Equal("Edit", pending.ToolName, "File changes are evaluated as Edit");
                Assert.True((pending.Summary ?? String.Empty).Contains("src/app.cs", StringComparison.Ordinal), "Changed path from the item: " + pending.Summary);
                await HttpTestHelpers.SendAsync<Approval>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/approvals/" + pending.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);

                Run done = Assert.NotNull(await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, started.Id, 60, token).ConfigureAwait(false), "Run");
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "Run succeeded: " + done.ErrorMessage + " " + done.StderrTail);
                string result = done.ResultText ?? String.Empty;
                Assert.True(result.Contains("command approval: accept", StringComparison.Ordinal), "The command was accepted by the rule: " + result);
                Assert.True(result.Contains("file approval: accept", StringComparison.Ordinal), "The file change was accepted by a person: " + result);
                List<Approval> approvals = await ListAsync(host.AdminClient, host.TenantId, "runId=" + started.Id, token).ConfigureAwait(false);
                Approval command = approvals.Single(a => a.Kind == ApprovalKindEnum.Command);
                Assert.True(command.ToolName == "Bash" && command.DecisionSource == ApprovalSourceEnum.Rule, "Commands are evaluated as Bash by rules");
                RunEventsResponse events = await EventsAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.True(!events.Events.Any(e => e.EventType == RunEventTypeEnum.Warning && (e.Text ?? String.Empty).Contains("decline approval", StringComparison.Ordinal)), "No headless-decline warning when relayed");
                Assert.True(events.Events.Any(e => e.Code == "ApprovalRequested"), "Pending approval recorded in the events");
            }
        }

        private static async Task RbacAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await StartAsync(provider, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                HarnessProfile profile = await ClaudeProfileAsync(host, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("approve-rbac", profile.Name, null, token, d =>
                {
                    d.ApprovalsEnabled = true;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"kubectl delete ns prod\"}" });
                }).ConfigureAwait(false);
                Run started = await InvokeAsync(host, agent, token).ConfigureAwait(false);
                Approval pending = await WaitForPendingAsync(host.AdminClient, host.TenantId, started.Id, token).ConfigureAwait(false);
                string decidePath = "/v1.0/api/tenants/" + host.TenantId + "/approvals/" + pending.Id + "/decide";

                User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "approval-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                User operatorUser = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "approval-operator@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/user-role-assignments", new AssignmentRequest { UserId = operatorUser.Id, RoleName = "AgentOperator" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/users", new UserRequest { Email = "approval-none@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Approvals Other" }, 201, token).ConfigureAwait(false);
                User outsider = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);

                using (HttpClient noRole = await host.UserClientAsync("approval-none@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(noRole, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/approvals", null, token).ConfigureAwait(false)).StatusCode, "Approval Read is required");
                }
                using (HttpClient client = await host.UserClientAsync("approval-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    List<Approval> visible = await ListAsync(client, host.TenantId, "status=Pending", token).ConfigureAwait(false);
                    Assert.True(visible.Any(a => a.Id == pending.Id), "Viewers read approvals");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, decidePath, new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false)).StatusCode, "Viewers cannot decide");
                }
                using (HttpClient client = await host.UserClientAsync("outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/approvals/" + pending.Id, null, token).ConfigureAwait(false)).StatusCode, "Other tenants get 404 on read");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, decidePath, new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, token).ConfigureAwait(false)).StatusCode, "Other tenants get 404 on decide");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/approvals/" + pending.Id, null, token).ConfigureAwait(false)).StatusCode, "Not visible through their own tenant");
                    Assert.Equal(0, (await ListAsync(client, other.Id, "status=Pending", token).ConfigureAwait(false)).Count, "Their list is empty");
                }

                Run running = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, started.Id, token).ConfigureAwait(false), "Running run");
                string runToken = await host.Server.Context.Authentication.IssueForRunAsync(running, running.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                string asRun = await McpCallAsync(host, runToken, "garrison_decide_approval", new { approvalId = pending.Id, decision = "Allow" }, token).ConfigureAwait(false);
                Assert.True(asRun.Contains("Forbidden", StringComparison.Ordinal), "A run cannot approve itself: " + asRun);
                Assert.True((await McpCallAsync(host, runToken, "garrison_list_approvals", new { }, token).ConfigureAwait(false)).Contains("Forbidden", StringComparison.Ordinal), "A run cannot list approvals");
                Assert.True((await McpCallAsync(host, null, "garrison_permission_prompt", new { tool_name = "Bash", input = new { command = "ls" } }, token).ConfigureAwait(false)).Contains("Forbidden", StringComparison.Ordinal), "Only run tokens may prompt");

                using (HttpClient client = await host.UserClientAsync("approval-operator@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, decidePath, new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow, Remember = true }, token).ConfigureAwait(false)).StatusCode, "Remember needs Deployment Update");
                    Approval decided = await HttpTestHelpers.SendAsync<Approval>(client, HttpMethod.Post, decidePath, new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Deny, Reason = "not in prod" }, 200, token).ConfigureAwait(false);
                    Assert.Equal(ApprovalStatusEnum.Denied, decided.Status, "Operators decide");
                }
                Run done = Assert.NotNull(await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, started.Id, 60, token).ConfigureAwait(false), "Run");
                Assert.True((done.ResultText ?? String.Empty).Contains("permission Bash: deny", StringComparison.Ordinal), "The operator's denial reached the harness");
            }
        }

        private static async Task SweepValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents", new Agent { Name = "approve-sweep" }, 201, token).ConfigureAwait(false);
                HarnessProfile fake = (await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false))!;
                HarnessProfile codexExec = (await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/codex", token).ConfigureAwait(false))!;
                HarnessProfile claude = (await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/claude-code", token).ConfigureAwait(false))!;
                foreach (HarnessProfile unsupported in new[] { fake, codexExec })
                {
                    Deployment bad = new Deployment { AgentId = agent.Id, Name = "bad-" + Guid.NewGuid().ToString("N").Substring(0, 6), HarnessProfileId = unsupported.Id, ApprovalsEnabled = true };
                    TestResponse rejected = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/deployments", bad, token).ConfigureAwait(false);
                    Assert.True(rejected.StatusCode == 400 && rejected.Body.Contains("approvalsEnabled", StringComparison.Ordinal), unsupported.Name + " cannot enable approvals: " + rejected.Body);
                }
                Deployment invalid = new Deployment { AgentId = agent.Id, Name = "bad-rules", HarnessProfileId = claude.Id };
                invalid.ApprovalRules.Add(Rule(ApprovalRuleActionEnum.Allow, "Bash("));
                invalid.ApprovalRules.Add(Rule(ApprovalRuleActionEnum.Deny, "Edit", "(unclosed"));
                TestResponse invalidResponse = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/deployments", invalid, token).ConfigureAwait(false);
                Assert.True(invalidResponse.StatusCode == 400 && invalidResponse.Body.Contains("approvalRules[0].pattern", StringComparison.Ordinal) && invalidResponse.Body.Contains("approvalRules[1].inputPattern", StringComparison.Ordinal), "Invalid rules are rejected per field: " + invalidResponse.Body);

                Deployment good = await CreateDeploymentAsync(host, agent, claude, "good-rules", d => { d.ApprovalsEnabled = true; d.ApprovalRules.Add(Rule(ApprovalRuleActionEnum.Allow, "Read")); }, token).ConfigureAwait(false);
                string ruleId = good.ApprovalRules[0].Id;
                Assert.True(ruleId.StartsWith("dar_", StringComparison.Ordinal), "Rules get dar_ identifiers");
                good.Description = "updated";
                Deployment updated = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, "/v1.0/api/tenants/" + host.TenantId + "/deployments/" + good.Id, good, 200, token).ConfigureAwait(false);
                Assert.Equal(ruleId, updated.ApprovalRules[0].Id, "Rule identifiers survive updates");

                Run finished = new Run { TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = good.Id, Status = RunStatusEnum.Succeeded };
                await db.Runs.CreateAsync(finished, token).ConfigureAwait(false);
                Approval orphan = new Approval { TenantId = host.TenantId, RunId = finished.Id, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = good.Id, ToolName = "Bash", Status = ApprovalStatusEnum.Pending, ExpiresUtc = DateTime.UtcNow.AddMinutes(5) };
                await db.Approvals.CreateAsync(orphan, token).ConfigureAwait(false);
                Assert.True(await host.Server.Context.Get<ApprovalService>().SweepAsync(token).ConfigureAwait(false), "The sweep resolved something");
                Approval swept = Assert.NotNull(await db.Approvals.ReadAsync(orphan.Id, token).ConfigureAwait(false), "Swept");
                Assert.Equal(ApprovalStatusEnum.Cancelled, swept.Status, "Approvals of finished runs are cancelled");
                Assert.True((swept.Reason ?? String.Empty).Contains("finished", StringComparison.Ordinal), "Reason: " + swept.Reason);

                Assert.True(await db.Runs.PurgeAsync(finished.Id, token).ConfigureAwait(false), "Run purged");
                Assert.True(await db.Approvals.ReadAsync(orphan.Id, token).ConfigureAwait(false) == null, "Purging a run removes its approvals");
            }
        }

        private static async Task CrossReplicaAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, BackplaneModeEnum.PostgresNotify, null, token).ConfigureAwait(false))
            {
                TestServerHost a = cluster.Replicas[0];
                TestServerHost b = cluster.Replicas[1];
                // Only the backplane may wake the waiting call promptly: the database recheck is pushed far out.
                a.Server.Context.Get<ApprovalService>().RecheckMs = 30000;
                b.Server.Context.Get<ApprovalService>().RecheckMs = 30000;
                HarnessProfile profile = await ClaudeProfileAsync(a, token).ConfigureAwait(false);
                await cluster.AddWorkerAsync(0, ConfigureWorker, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync(0, "approve-replicas", d =>
                {
                    d.HarnessProfileId = profile.Id;
                    d.ApprovalsEnabled = true;
                    d.Parameters.Add(new DeploymentParameter { Name = "permissionRequest1", Value = "Bash={\"command\":\"helm upgrade app\"}" });
                }, token).ConfigureAwait(false);

                Run started = await InvokeAsync(a, agent, token).ConfigureAwait(false);
                Approval pending = await WaitForPendingAsync(b.AdminClient, cluster.TenantId, started.Id, token).ConfigureAwait(false);
                await Task.Delay(500, token).ConfigureAwait(false);
                Stopwatch watch = Stopwatch.StartNew();
                await HttpTestHelpers.SendAsync<Approval>(b.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + cluster.TenantId + "/approvals/" + pending.Id + "/decide", new ApprovalDecideRequest { Decision = ApprovalDecisionEnum.Allow }, 200, token).ConfigureAwait(false);
                Run done = Assert.NotNull(await a.Server.Context.Get<RunService>().WaitAsync(cluster.TenantId, started.Id, 60, token).ConfigureAwait(false), "Run");
                watch.Stop();
                Assert.Equal(RunStatusEnum.Succeeded, done.Status, "Run succeeded");
                Assert.True((done.ResultText ?? String.Empty).Contains("permission Bash: allow", StringComparison.Ordinal), "Allowed");
                Assert.True(watch.Elapsed.TotalSeconds < 15, "The decision on B woke the wait on A well before the 30 s recheck: " + watch.Elapsed.TotalSeconds + " s");
            }
        }

        private static async Task<TestCluster> StartAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false);
            cluster.Workers.Add(await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "approvals-" + Guid.NewGuid().ToString("N").Substring(0, 6), ConfigureWorker, token).ConfigureAwait(false));
            return cluster;
        }

        private static void ConfigureWorker(WorkerSettings settings)
        {
            // The fake harness stands in for Claude Code and Codex, so the worker reports both harness types.
            settings.Probes.Add(new HarnessProbeSettings { HarnessType = HarnessTypeEnum.ClaudeCode, Executable = "garrison-fake-harness", Label = "fake-claude" });
            settings.Probes.Add(new HarnessProbeSettings { HarnessType = HarnessTypeEnum.Codex, Executable = "garrison-fake-harness", Label = "fake-codex" });
        }

        private static async Task<HarnessProfile> ClaudeProfileAsync(TestServerHost host, CancellationToken token)
        {
            // builtin/claude-code with the fake harness as the executable: the fake reads --permission-prompt-tool and
            // --mcp-config like Claude Code and asks for each --permission-request.
            HarnessProfile profile = BuiltInSeeder.HarnessProfileDefaults().Single(p => p.Name == "builtin/claude-code");
            profile.Id = IdGenerator.NewHarnessProfileId();
            profile.TenantId = host.TenantId;
            profile.Name = "test-fake-claude-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            profile.Executable = "garrison-fake-harness";
            profile.IsBuiltIn = false;
            profile.BuiltInKey = null;
            profile.IsProtected = false;
            profile.Arguments.Insert(0, new HarnessArgument { Template = "claude" });
            profile.Arguments.Insert(0, new HarnessArgument { Template = "--format" });
            for (int i = 1; i <= 3; i++)
            {
                string condition = "{{deployment.parameters.permissionRequest" + i + "}}";
                profile.Arguments.Add(new HarnessArgument { Template = "--permission-request", Condition = condition });
                profile.Arguments.Add(new HarnessArgument { Template = condition, Condition = condition });
            }
            return await PersistAsync(host, profile, token).ConfigureAwait(false);
        }

        private static async Task<HarnessProfile> CodexProfileAsync(TestServerHost host, CancellationToken token)
        {
            HarnessProfile profile = BuiltInSeeder.HarnessProfileDefaults().Single(p => p.Name == "builtin/codex-app-server");
            profile.Id = IdGenerator.NewHarnessProfileId();
            profile.TenantId = host.TenantId;
            profile.Name = "test-fake-codex-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            profile.Executable = "garrison-fake-harness";
            profile.IsBuiltIn = false;
            profile.BuiltInKey = null;
            profile.IsProtected = false;
            profile.Arguments.Insert(0, new HarnessArgument { Template = "codex-app-server" });
            profile.Arguments.Insert(0, new HarnessArgument { Template = "--format" });
            profile.Arguments.Add(new HarnessArgument { Template = "--request-approval", Condition = "{{deployment.parameters.approvalCommand}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "--approval-command", Condition = "{{deployment.parameters.approvalCommand}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "{{deployment.parameters.approvalCommand}}", Condition = "{{deployment.parameters.approvalCommand}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "--request-file-approval", Condition = "{{deployment.parameters.fileApproval}}" });
            profile.Arguments.Add(new HarnessArgument { Template = "{{deployment.parameters.fileApproval}}", Condition = "{{deployment.parameters.fileApproval}}" });
            return await PersistAsync(host, profile, token).ConfigureAwait(false);
        }

        private static async Task<HarnessProfile> PersistAsync(TestServerHost host, HarnessProfile profile, CancellationToken token)
        {
            for (int i = 0; i < profile.Arguments.Count; i++)
            {
                profile.Arguments[i].Id = String.Empty;
                profile.Arguments[i].Position = i;
            }
            return await host.Server.Context.Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
        }

        private static async Task<Deployment> CreateDeploymentAsync(TestServerHost host, Agent agent, HarnessProfile profile, string name, Action<Deployment> configure, CancellationToken token)
        {
            Deployment deployment = new Deployment();
            deployment.AgentId = agent.Id;
            deployment.Name = name;
            deployment.HarnessProfileId = profile.Id;
            configure(deployment);
            return await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/deployments", deployment, 201, token).ConfigureAwait(false);
        }

        private static async Task<Run> InvokeAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = "do the thing";
            request.Wait = false;
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents/" + agent.Id + "/invoke", request, token).ConfigureAwait(false);
            Assert.True(response.StatusCode == 202 || response.StatusCode == 200, "Invoke accepted: " + response.Body);
            return Assert.NotNull(JsonSerializer.Deserialize<Run>(response.Body, Garrison.Core.Serialization.Serializer.Options), "Run");
        }

        private static async Task<Run> InvokeAndWaitAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            Run started = await InvokeAsync(host, agent, token).ConfigureAwait(false);
            return Assert.NotNull(await host.Server.Context.Get<RunService>().WaitAsync(host.TenantId, started.Id, 90, token).ConfigureAwait(false), "Run " + started.Id);
        }

        private static async Task<List<Approval>> ListAsync(HttpClient client, string tenantId, string query, CancellationToken token)
        {
            EnumerationResult<Approval> page = await HttpTestHelpers.SendAsync<EnumerationResult<Approval>>(client, HttpMethod.Get, "/v1.0/api/tenants/" + tenantId + "/approvals?maxResults=100&" + query, null, 200, token).ConfigureAwait(false);
            return page.Objects;
        }

        private static async Task<Approval> WaitForPendingAsync(HttpClient client, string tenantId, string runId, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(45);
            while (DateTime.UtcNow < deadline)
            {
                List<Approval> pending = await ListAsync(client, tenantId, "status=Pending&runId=" + runId, token).ConfigureAwait(false);
                if (pending.Count > 0) return pending[0];
                await Task.Delay(200, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("No pending approval appeared for run " + runId + ".");
        }

        private static async Task<RunEventsResponse> EventsAsync(TestServerHost host, string runId, CancellationToken token)
        {
            return await HttpTestHelpers.SendAsync<RunEventsResponse>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + runId + "/events?afterSequence=0&limit=500", null, 200, token).ConfigureAwait(false);
        }

        private static async Task WaitForEventAsync(TestServerHost host, string runId, string code, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(20);
            while (DateTime.UtcNow < deadline)
            {
                RunEventsResponse events = await EventsAsync(host, runId, token).ConfigureAwait(false);
                if (events.Events.Any(e => e.Code == code)) return;
                await Task.Delay(200, token).ConfigureAwait(false);
            }
            throw new TestAssertionException("Run " + runId + " recorded no " + code + " event.");
        }

        private static async Task<string> McpCallAsync(TestServerHost host, string? bearer, string tool, object arguments, CancellationToken token)
        {
            using (McpHttpClient client = new McpHttpClient())
            {
                if (bearer == null)
                {
                    client.SetRequestHeader("x-api-key", host.Settings.Auth.AdminApiKey);
                    client.SetRequestHeader("x-tenant-id", host.TenantId);
                }
                else
                {
                    client.SetRequestHeader("Authorization", "Bearer " + bearer);
                }
                await client.ConnectStreamableAsync(host.McpUrl, "/mcp", token).ConfigureAwait(false);
                try
                {
                    JsonElement result = await client.CallAsync<JsonElement>("tools/call", new { name = tool, arguments }, 60000, token).ConfigureAwait(false);
                    if (result.ValueKind == JsonValueKind.Object && result.TryGetProperty("content", out JsonElement content) && content.ValueKind == JsonValueKind.Array)
                    {
                        foreach (JsonElement part in content.EnumerateArray())
                        {
                            if (part.TryGetProperty("text", out JsonElement text) && text.ValueKind == JsonValueKind.String) return text.GetString() ?? String.Empty;
                        }
                    }
                    return result.GetRawText();
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    return "error: " + e.Message;
                }
            }
        }

        #endregion
    }
}
