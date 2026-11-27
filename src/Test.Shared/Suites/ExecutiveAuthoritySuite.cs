namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Notifications;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Executive authority and pre-authorized change (AUTONOMOUS_AGENTS_PLAN.md phase AA8): the subtree an executive may
    /// change, the hard limits on its drafts, change classes and rule matching, OrgSubtree deployment validation, change
    /// rule routes that only people may write, rule-applied drafts recorded as org revisions that rollback undoes, the
    /// executive system prompt, the proposal channel event, and the OrgProposalApplied notification.
    /// </summary>
    public static class ExecutiveAuthoritySuite
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
            unit.Add(new TestCaseDescriptor("executives-unit", "subtree", "An executive's scope: units, agents, deployments, and mandates below it; its own records apart; templates and assets exclusive or shared", SubtreeAsync));
            unit.Add(new TestCaseDescriptor("executives-unit", "limits", "A valid draft passes; one refusal each for OutsideSubtree, SelfModification, ForbiddenKind, BudgetIncrease, and AuthorityChange", LimitsAsync));
            unit.Add(new TestCaseDescriptor("executives-unit", "classes", "Every change class from its fields, values for limits, and unclassified fields", ClassesAsync));
            unit.Add(new TestCaseDescriptor("executives-unit", "by-name", "Organization items are read by unit name: a reorder is no change and no refusal, a removed unit is one removal, and a budget raise in a reordered tree is still BudgetIncrease", ByNameAsync));
            unit.Add(new TestCaseDescriptor("executives-unit", "matching", "Rules cover changes in their unit subtree within value and count limits; expired, inactive, and unclassified never match", MatchingAsync));
            unit.Add(new TestCaseDescriptor("executives-unit", "gate-matching", "A rule with an eval gate covers ModelChange only once the draft passed it (EvalGatePending otherwise), still covers WakeTuning at once, and an ungated rule may cover what it holds back", GateMatchingAsync));
            suites.Add(new TestSuiteDescriptor("executives-unit", "Executives: scope, limits, classes, rules", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "executives-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "deployments", "managementAccess OrgSubtree needs an agent that leads one unit: NotAUnitLead, LeadsSeveralUnits, a lead passes, and a bundle that creates the unit passes (" + provider + ")", ct => DeploymentsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "rules", "Change rules round-trip with classes and limits, validate, read by role, survive another migration, and refuse a run token on every mutation (" + provider + ")", ct => RulesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "apply", "A covered draft applies at once with source Rule and an org revision; an uncovered one waits for a person; executive mandate revisions say Executive; rollback undoes both (" + provider + ")", ct => ApplyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "prompt", "builtin/executive-system renders the unit, units below, hard limits, and rules into an executive's compile preview and nobody else's (" + provider + ")", ct => PromptAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "events", "proposal.changed on the organization channel, and a signed OrgProposalApplied notification when rules apply a proposal (" + provider + ")", ct => EventsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Executives (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task SubtreeAsync(CancellationToken token)
        {
            ExecutiveScope scope = Scope();
            Assert.True(scope.UnitId == "oun_ops" && scope.UnitName == "ops" && scope.AgentName == "lead", "The executive leads ops");
            Assert.True(Same(scope.UnitNames, "qa") && Same(scope.AgentNames, "tester") && Same(scope.AncestorUnitNames, "root"), "Only qa and its tester lie below; root is above: " + Serializer.Serialize(scope.UnitNames));
            Assert.True(Same(scope.DeploymentNames, "tester-d") && Same(scope.OwnDeploymentNames, "lead-d"), "The tester's deployment is inside, the executive's own is apart");
            Assert.True(Same(scope.MandateNames, "tester-m") && Same(scope.OwnMandateNames, "lead-m"), "Mandates follow their deployments");
            Assert.True(Same(scope.ExclusiveTemplateNames, "tQa") && Same(scope.SharedTemplateNames, "tShared"), "tQa is used only below; tShared also outside; tLead (own) is neither: " + Serializer.Serialize(scope.SharedTemplateNames));
            Assert.True(Same(scope.ExclusiveAssetNames, "aQa") && Same(scope.SharedAssetNames, "aMixed"), "aQa is pinned only below; aMixed also by an outsider");
            Assert.True(scope.IsLive("Agent", "stranger") && !scope.IsLive("Agent", "helper"), "Live names tell new records from outside ones");
            return Task.CompletedTask;
        }

        private static Task LimitsAsync(CancellationToken token)
        {
            ExecutiveScope scope = Scope();
            List<ExecutiveDraftItem> valid = new List<ExecutiveDraftItem>
            {
                Item("Deployment", "tester-d", Deployment("tester-d", "tester", "large"), Deployment("tester-d", "tester", "small")),
                Item("PromptTemplate", "tQa", Template("tQa", "Test harder."), Template("tQa", "Test.")),
                Item("Agent", "helper", Agent("helper"), null),
                Item("Deployment", "helper-d", Deployment("helper-d", "helper", "small"), null),
                Item("Mandate", "helper-m", Mandate("helper-m", "helper", "helper-d", 60, 120, 1), null),
                Item("Organization", "acme", Org(qaMembers: new[] { "tester", "helper" }), Org())
            };
            List<ExecutiveRefusal> none = ExecutiveDraftValidator.Validate(new ExecutiveDraftContext(scope, valid));
            Assert.True(none.Count == 0, "A draft inside the subtree passes: " + Serializer.Serialize(none));

            Expect(scope, ExecutiveDraftValidator.OutsideSubtree, Item("Deployment", "seller-d", Deployment("seller-d", "seller", "large"), Deployment("seller-d", "seller", "small")));
            Expect(scope, ExecutiveDraftValidator.OutsideSubtree, Item("PromptTemplate", "tShared", Template("tShared", "Changed."), Template("tShared", "Shared.")));
            Expect(scope, ExecutiveDraftValidator.OutsideSubtree, Item("Agent", "loner", Agent("loner"), null));
            Expect(scope, ExecutiveDraftValidator.OutsideSubtree, Item("Organization", "acme", Org(salesTitle: "Head of sales"), Org()));
            Expect(scope, ExecutiveDraftValidator.SelfModification, Item("Deployment", "lead-d", Deployment("lead-d", "lead", "large"), Deployment("lead-d", "lead", "small")));
            Expect(scope, ExecutiveDraftValidator.SelfModification, Item("Organization", "acme", Org(opsTitle: "Chief"), Org()));
            Expect(scope, ExecutiveDraftValidator.SelfModification, Item("Mandate", "lead-m", Mandate("lead-m", "lead", "lead-d", 60, 600, 1), Mandate("lead-m", "lead", "lead-d", 60, 120, 1)));
            Expect(scope, ExecutiveDraftValidator.ForbiddenKind, Item("HarnessProfile", "fake", Doc("apiVersion: garrison/v1\nkind: HarnessProfile\nmetadata:\n  name: fake\nspec:\n  harnessType: Generic\n"), null));
            Expect(scope, ExecutiveDraftValidator.ForbiddenKind, new ExecutiveDraftItem { Kind = "Agent", Name = "tester", Operation = StudioDraftOperationEnum.Delete, Live = Agent("tester") });
            Expect(scope, ExecutiveDraftValidator.BudgetIncrease, Item("Mandate", "tester-m", Mandate("tester-m", "tester", "tester-d", 60, 120, 5), Mandate("tester-m", "tester", "tester-d", 60, 120, 1)));
            Expect(scope, ExecutiveDraftValidator.BudgetIncrease, Item("Organization", "acme", Org(qaBudget: 10), Org()));
            Expect(scope, ExecutiveDraftValidator.AuthorityChange, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "small", access: "Drafts"), Deployment("tester-d", "tester", "small")));
            Assert.True(ExecutiveDraftValidator.IsRefusalCode("AuthorityChange") && !ExecutiveDraftValidator.IsRefusalCode("DraftInvalid"), "Refusal codes are recognized");
            return Task.CompletedTask;
        }

        private static Task ClassesAsync(CancellationToken token)
        {
            ExecutiveScope scope = Scope();
            ChangeClassification template = Single(scope, Item("PromptTemplate", "tQa", Template("tQa", "New."), Template("tQa", "Old.")));
            Assert.True(Only(template, ChangeClassEnum.PromptRetune) && template.UnitId == "oun_ops", "A template edit is PromptRetune at the executive's unit");
            ChangeClassification prompts = Single(scope, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "small", prompt: "tQa"), Deployment("tester-d", "tester", "small")));
            Assert.True(Only(prompts, ChangeClassEnum.PromptRetune) && prompts.UnitId == "oun_qa", "A prompt binding is PromptRetune in the tester's unit");
            ChangeClassification model = Single(scope, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "large"), Deployment("tester-d", "tester", "small")));
            Assert.True(Only(model, ChangeClassEnum.ModelChange), "A model is ModelChange");
            ChangeClassification weight = Single(scope, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "small", weight: 40), Deployment("tester-d", "tester", "small")));
            Assert.True(Only(weight, ChangeClassEnum.DeploymentWeight) && weight.Values["weight"] == 40, "A weight is DeploymentWeight with its value");
            ChangeClassification wake = Single(scope, Item("Mandate", "tester-m", Mandate("tester-m", "tester", "tester-d", 300, 900, 1), Mandate("tester-m", "tester", "tester-d", 60, 120, 1)));
            Assert.True(Only(wake, ChangeClassEnum.WakeTuning) && wake.Values["minIntervalSeconds"] == 300 && wake.Values["maxIntervalSeconds"] == 900, "Wake bounds are WakeTuning with values: " + Serializer.Serialize(wake));
            ChangeClassification text = Single(scope, Item("Mandate", "tester-m", Mandate("tester-m", "tester", "tester-d", 60, 120, 1, "Test everything twice."), Mandate("tester-m", "tester", "tester-d", 60, 120, 1)));
            Assert.True(Only(text, ChangeClassEnum.MandateTextEdit), "An objective is MandateTextEdit");
            ChangeClassification agent = Single(scope, Item("Agent", "tester", Agent("tester", "Tests the build."), Agent("tester")));
            Assert.True(Only(agent, ChangeClassEnum.PromptRetune), "An agent's description is PromptRetune");
            ChangeClassification added = Single(scope, Item("Organization", "acme", Org(qaMembers: new[] { "tester", "helper" }), Org()));
            Assert.True(Only(added, ChangeClassEnum.AddWorker) && added.UnitId == "oun_qa" && added.Detail!.Contains("helper", StringComparison.Ordinal), "Joining a unit is AddWorker");
            ChangeClassification removed = Single(scope, Item("Organization", "acme", Org(qaMembers: new string[0]), Org()));
            Assert.True(Only(removed, ChangeClassEnum.RemoveWorker), "Leaving a unit is RemoveWorker");
            ChangeClassification created = Single(scope, Item("Agent", "helper", Agent("helper"), null));
            Assert.True(Only(created, ChangeClassEnum.AddWorker), "A new agent is AddWorker");
            ChangeClassification other = Single(scope, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "small", timeout: 900), Deployment("tester-d", "tester", "small")));
            Assert.True(other.Classes.Count == 0 && other.Unclassified.Contains("timeoutSeconds"), "A timeout has no class: " + Serializer.Serialize(other));
            ChangeClassification budget = Single(scope, Item("Organization", "acme", Org(qaBudget: 2), Org()));
            Assert.True(budget.Unclassified.Any(f => f.EndsWith(".budgets", StringComparison.Ordinal)), "A budget cut waits for a person");
            return Task.CompletedTask;
        }

        private static Task ByNameAsync(CancellationToken token)
        {
            ExecutiveScope scope = Scope();
            ExecutiveDraftItem reorder = Item("Organization", "acme", Reordered(true, 5), Org());
            List<ExecutiveRefusal> none = ExecutiveDraftValidator.Validate(new ExecutiveDraftContext(scope, new List<ExecutiveDraftItem> { reorder }));
            Assert.True(none.Count == 0 && Classify(scope, reorder).Count == 0, "Listing sales before ops changes nothing: " + Serializer.Serialize(none));
            ExecutiveDraftItem removal = Item("Organization", "acme", Reordered(false, 5), Org());
            Assert.True(ExecutiveDraftValidator.Validate(new ExecutiveDraftContext(scope, new List<ExecutiveDraftItem> { removal })).Count == 0, "Removing qa below ops is inside the subtree");
            ChangeClassification removed = Single(scope, removal);
            Assert.True(removed.Detail == "removes unit qa" && removed.Unclassified.Single() == "units.qa", "Removing qa is one removal: " + Serializer.Serialize(removed));
            Expect(scope, ExecutiveDraftValidator.BudgetIncrease, Item("Organization", "acme", Reordered(true, 10), Org()));
            return Task.CompletedTask;
        }

        private static ManifestDocument Reordered(bool withQa, int qaBudget)
        {
            StringBuilder yaml = new StringBuilder("apiVersion: garrison/v1\nkind: Organization\nmetadata:\n  name: acme\nspec:\n  mission: Ship.\n  units:\n");
            yaml.Append("    - name: root\n      lead: ceo\n      units:\n");
            yaml.Append("        - name: sales\n          lead: seller\n");
            yaml.Append("        - name: ops\n          lead: lead\n          members:\n            - agent: worker\n");
            if (withQa) yaml.Append("          units:\n            - name: qa\n              members:\n                - agent: tester\n              budgets:\n                - period: Day\n                  amountUsd: " + qaBudget + "\n");
            return Doc(yaml.ToString());
        }

        private static Task MatchingAsync(CancellationToken token)
        {
            ExecutiveScope scope = Scope();
            DateTime now = DateTime.UtcNow;
            ChangeRule wake = Rule("cru_wake", "oun_qa", now.AddMinutes(-3), ChangeClassEnum.WakeTuning);
            wake.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.WakeTuning, Name = "minIntervalSeconds", Minimum = 120, Maximum = 3600 });
            List<ChangeClassification> slow = Classify(scope, Item("Mandate", "tester-m", Mandate("tester-m", "tester", "tester-d", 300, 900, 1), Mandate("tester-m", "tester", "tester-d", 60, 120, 1)));
            ChangeRuleMatch covered = ChangeRuleMatcher.Match(slow, new List<ChangeRule> { wake }, scope.Tree, now);
            Assert.True(covered.AllMatched && covered.RuleIds.Single() == "cru_wake", "Within limits the rule covers it: " + Serializer.Serialize(covered));
            List<ChangeClassification> fast = Classify(scope, Item("Mandate", "tester-m", Mandate("tester-m", "tester", "tester-d", 30, 900, 1), Mandate("tester-m", "tester", "tester-d", 60, 120, 1)));
            ChangeRuleMatch outside = ChangeRuleMatcher.Match(fast, new List<ChangeRule> { wake }, scope.Tree, now);
            Assert.True(!outside.AllMatched && outside.Items.Single().Reason!.Contains("minIntervalSeconds", StringComparison.Ordinal), "Below the minimum it needs a person: " + outside.Items.Single().Reason);

            ChangeRule sales = Rule("cru_sales", "oun_sales", now.AddMinutes(-2), ChangeClassEnum.WakeTuning);
            Assert.True(!ChangeRuleMatcher.Match(slow, new List<ChangeRule> { sales }, scope.Tree, now).AllMatched, "A rule on another unit does not cover qa");
            ChangeRule root = Rule("cru_root", "oun_root", now.AddMinutes(-1), ChangeClassEnum.WakeTuning);
            Assert.True(ChangeRuleMatcher.Match(slow, new List<ChangeRule> { root }, scope.Tree, now).AllMatched, "A rule on an ancestor covers its whole subtree");
            ChangeRule expired = Rule("cru_old", "oun_root", now.AddMinutes(-1), ChangeClassEnum.WakeTuning);
            expired.ExpiresUtc = now.AddMinutes(-1);
            ChangeRule inactive = Rule("cru_off", "oun_root", now.AddMinutes(-1), ChangeClassEnum.WakeTuning);
            inactive.Active = false;
            Assert.True(!ChangeRuleMatcher.Match(slow, new List<ChangeRule> { expired, inactive }, scope.Tree, now).AllMatched, "Expired and inactive rules never match");
            ChangeRule wrongClass = Rule("cru_prompt", "oun_root", now.AddMinutes(-1), ChangeClassEnum.PromptRetune);
            Assert.True(!ChangeRuleMatcher.Match(slow, new List<ChangeRule> { wrongClass }, scope.Tree, now).AllMatched, "A rule must list the change's class");

            ChangeRule hire = Rule("cru_hire", "oun_ops", now.AddMinutes(-1), ChangeClassEnum.AddWorker);
            hire.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.AddWorker, Name = ChangeRuleMatcher.CountLimit, Maximum = 1 });
            List<ChangeClassification> one = Classify(scope, Item("Organization", "acme", Org(qaMembers: new[] { "tester", "helper" }), Org()));
            Assert.True(ChangeRuleMatcher.Match(one, new List<ChangeRule> { hire }, scope.Tree, now).AllMatched, "One added worker is within count");
            List<ChangeClassification> worker = Classify(scope, Item("Agent", "helper", Agent("helper"), null), Item("Deployment", "helper-d", Deployment("helper-d", "helper", "small"), null), Item("Organization", "acme", Org(qaMembers: new[] { "tester", "helper" }), Org()));
            ChangeRuleMatch oneWorker = ChangeRuleMatcher.Match(worker, new List<ChangeRule> { hire }, scope.Tree, now);
            Assert.True(worker.Count == 3 && oneWorker.AllMatched, "An agent, its deployment, and its unit place are one worker for count: " + Serializer.Serialize(oneWorker));
            List<ChangeClassification> two = Classify(scope, Item("Organization", "acme", Org(qaMembers: new[] { "tester", "helper", "helper2" }), Org()));
            ChangeRuleMatch tooMany = ChangeRuleMatcher.Match(two, new List<ChangeRule> { hire }, scope.Tree, now);
            Assert.True(!tooMany.AllMatched && tooMany.Items.All(i => i.Reason != null && i.Reason.Contains("at most 1", StringComparison.Ordinal)), "Two added workers exceed count: " + Serializer.Serialize(tooMany));

            List<ChangeClassification> unclassified = Classify(scope, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "small", timeout: 900), Deployment("tester-d", "tester", "small")));
            ChangeRule everything = Rule("cru_all", "oun_root", now.AddMinutes(-1), Enum.GetValues<ChangeClassEnum>());
            Assert.True(!ChangeRuleMatcher.Match(unclassified, new List<ChangeRule> { everything }, scope.Tree, now).AllMatched, "An unclassified field is never covered");
            Assert.True(!ChangeRuleMatcher.Match(new List<ChangeClassification>(), new List<ChangeRule> { everything }, scope.Tree, now).AllMatched, "An empty draft is not auto-applied");
            Assert.True(ChangeRuleMatcher.KnownLimitNames(ChangeClassEnum.WakeTuning).Contains("jitterPercent") && ChangeRuleMatcher.KnownLimitNames(ChangeClassEnum.DeploymentWeight).Contains("weight") && ChangeRuleMatcher.KnownLimitNames(ChangeClassEnum.ModelChange).Single() == "count", "Known limit names per class");
            return Task.CompletedTask;
        }

        private static Task GateMatchingAsync(CancellationToken token)
        {
            // AA9.10: a rule with an eval gate covers AddWorker and ModelChange only once the draft passed the gate.
            ExecutiveScope scope = Scope();
            DateTime now = DateTime.UtcNow;
            ChangeRule models = Rule("cru_models", "oun_root", now.AddMinutes(-2), ChangeClassEnum.ModelChange, ChangeClassEnum.WakeTuning);
            models.GateEvalSet = "quality";
            models.GateThreshold = 0.8;
            List<ChangeClassification> bigger = Classify(scope, Item("Deployment", "tester-d", Deployment("tester-d", "tester", "large"), Deployment("tester-d", "tester", "small")));
            Assert.True(bigger.Single().Classes.Contains(ChangeClassEnum.ModelChange), "A model change");
            ChangeRuleMatch noStatus = ChangeRuleMatcher.Match(bigger, new List<ChangeRule> { models }, scope.Tree, now);
            Assert.True(!noStatus.AllMatched && noStatus.Items.Single().Code == ChangeRuleMatcher.EvalGatePending && noStatus.Items.Single().Reason!.StartsWith("Needs a person: ", StringComparison.Ordinal), "Without a gate status the change waits with EvalGatePending: " + Serializer.Serialize(noStatus));
            Dictionary<string, ChangeRuleGateStatus> pending = new Dictionary<string, ChangeRuleGateStatus> { ["cru_models"] = new ChangeRuleGateStatus { RuleId = "cru_models", Reason = "rule models requires eval set quality version 1 at score 0.8; the draft's latest eval run against it, evr_x, scored 0.5." } };
            ChangeRuleMatch failing = ChangeRuleMatcher.Match(bigger, new List<ChangeRule> { models }, scope.Tree, now, pending);
            Assert.True(!failing.AllMatched && failing.Items.Single().Code == ChangeRuleMatcher.EvalGatePending && failing.Items.Single().Reason!.Contains("scored 0.5", StringComparison.Ordinal), "A failing gate keeps it waiting with the gate's reason: " + Serializer.Serialize(failing));
            Dictionary<string, ChangeRuleGateStatus> passed = new Dictionary<string, ChangeRuleGateStatus> { ["cru_models"] = new ChangeRuleGateStatus { RuleId = "cru_models", Satisfied = true, EvalRunId = "evr_pass" } };
            ChangeRuleMatch covered = ChangeRuleMatcher.Match(bigger, new List<ChangeRule> { models }, scope.Tree, now, passed);
            Assert.True(covered.AllMatched && covered.Items.Single().GateEvalRunId == "evr_pass" && covered.Items.Single().Code == null, "A passed gate covers it and names the eval run: " + Serializer.Serialize(covered));

            // The gate holds back only AddWorker and ModelChange; the same rule covers a wake change without any eval.
            List<ChangeClassification> slow = Classify(scope, Item("Mandate", "tester-m", Mandate("tester-m", "tester", "tester-d", 300, 900, 1), Mandate("tester-m", "tester", "tester-d", 60, 120, 1)));
            Assert.True(ChangeRuleMatcher.Match(slow, new List<ChangeRule> { models }, scope.Tree, now).AllMatched, "A gated rule still covers WakeTuning at once");

            // A later rule without a gate may still cover the change.
            ChangeRule open = Rule("cru_open", "oun_root", now.AddMinutes(-1), ChangeClassEnum.ModelChange);
            ChangeRuleMatch fallback = ChangeRuleMatcher.Match(bigger, new List<ChangeRule> { models, open }, scope.Tree, now, pending);
            Assert.True(fallback.AllMatched && fallback.RuleIds.Single() == "cru_open" && fallback.Items.Single().GateEvalRunId == null, "An ungated rule covers what the gated one holds back: " + Serializer.Serialize(fallback));
            return Task.CompletedTask;
        }

        private static async Task DeploymentsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "exd", token).ConfigureAwait(false);
                TestResponse stranger = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exd-stranger-exec", AgentId = f.Stranger.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, token).ConfigureAwait(false);
                Assert.True(stranger.StatusCode == 400 && stranger.Body.Contains("NotAUnitLead", StringComparison.Ordinal), "An agent that leads no unit cannot be an executive: " + stranger.Body);
                Deployment ceo = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exd-ceo-exec", AgentId = f.Ceo.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, 201, token).ConfigureAwait(false);
                Assert.True(ceo.ManagementAccess == ManagementAccessEnum.OrgSubtree, "A unit lead may be an executive");
                ExecutivePosition position = Assert.NotNull(await host.Server.Context.Get<ExecutiveAuthority>().ResolveAsync(host.TenantId, ceo, token).ConfigureAwait(false), "The position resolves from the live chart");
                Assert.True(position.UnitId == f.Root.Id && position.OrganizationId == f.Org.Id, "The executive leads the root");

                OrganizationService organizations = host.Server.Context.Get<OrganizationService>();
                Organization second = await organizations.CreateAsync(OrganizationSuite.Admin(host), host.TenantId, new Organization { Name = "exd-second" }, token).ConfigureAwait(false);
                await organizations.CreateUnitAsync(OrganizationSuite.Admin(host), second, new OrgUnit { Name = "exd-second-root", LeadAgentId = f.Lead.Id }, token).ConfigureAwait(false);
                TestResponse twice = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exd-lead-exec", AgentId = f.Lead.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, token).ConfigureAwait(false);
                Assert.True(twice.StatusCode == 400 && twice.Body.Contains("LeadsSeveralUnits", StringComparison.Ordinal), "Leading units in two organizations is ambiguous: " + twice.Body);

                HarnessProfile fake = Assert.NotNull(await host.Server.Context.Database.HarnessProfiles.ReadAsync(host.TenantId, "hrn_builtin_fake", token).ConfigureAwait(false), "The fake harness profile");
                string bundle = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: exd-boss\nspec: {}\n---\n"
                    + "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: exd-boss-exec\nspec:\n  agent: exd-boss\n  harnessProfile: " + fake.Name + "\n  managementAccess: OrgSubtree\n---\n"
                    + "apiVersion: garrison/v1\nkind: Organization\nmetadata:\n  name: exd-bundle-org\nspec:\n  units:\n    - name: exd-hq\n      lead: exd-boss\n";
                ManifestApply applied = await host.Server.Context.Get<ManifestService>().ApplyAsync(host.TenantId, bundle, new ManifestApplyOptions { PrincipalName = "admin", PrincipalType = PrincipalTypeEnum.Administrator }, token).ConfigureAwait(false);
                Assert.True(applied.FailedCount == 0, "A bundle that creates the unit its executive leads applies: " + Serializer.Serialize(applied.Items.Where(i => i.Result == ManifestApplyResultEnum.Failed)));
            }
        }

        private static async Task RulesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "exr", token).ConfigureAwait(false);
                ChangeRule body = new ChangeRule { OrganizationId = f.Org.Name, UnitId = f.Ops.Name, Name = "Ops wake tuning", Description = "Keepers may slow down.", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.WakeTuning }, new ChangeRuleClass { Class = ChangeClassEnum.AddWorker } } };
                body.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.WakeTuning, Name = "MININTERVALSECONDS", Minimum = 120, Maximum = 3600 });
                body.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.AddWorker, Name = "count", Maximum = 1 });
                ChangeRule created = await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", body, 201, token).ConfigureAwait(false);
                Assert.True(created.Id.StartsWith("cru_", StringComparison.Ordinal) && created.OrganizationId == f.Org.Id && created.UnitId == f.Ops.Id && created.UnitName == f.Ops.Name && created.Active && created.CreatedByType == PrincipalTypeEnum.Administrator, "Created with resolved names: " + Serializer.Serialize(created));
                Assert.True(created.Classes.Count == 2 && created.Limits.Any(l => l.Name == "minIntervalSeconds" && l.Minimum == 120 && l.Maximum == 3600), "Classes and limits round-trip, limit names canonical");

                Assert.True((await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Ops.Id, Name = "Bad", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.ModelChange } }, Limits = new List<ChangeRuleLimit> { new ChangeRuleLimit { Class = ChangeClassEnum.ModelChange, Name = "weight", Maximum = 3 } } }, token).ConfigureAwait(false)).Body.Contains("UnknownLimit", StringComparison.Ordinal), "A limit name must fit its class");
                Assert.True((await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Ops.Id, Name = "Bad", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.ModelChange } }, Limits = new List<ChangeRuleLimit> { new ChangeRuleLimit { Class = ChangeClassEnum.WakeTuning, Name = "count", Maximum = 3 } } }, token).ConfigureAwait(false)).Body.Contains("ClassNotInRule", StringComparison.Ordinal), "A limit's class must be listed");
                Assert.True((await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", new ChangeRule { OrganizationId = f.Org.Id, UnitId = "nowhere", Name = "Bad", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.ModelChange } } }, token).ConfigureAwait(false)).Body.Contains("UnitNotFound", StringComparison.Ordinal), "The unit must be in the organization");
                Assert.True((await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Ops.Id, Name = "Bad", Classes = new List<ChangeRuleClass>() }, token).ConfigureAwait(false)).StatusCode == 400, "At least one class");

                created.Active = false;
                created.ExpiresUtc = DateTime.UtcNow.AddDays(7);
                ChangeRule updated = await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Put, T(host) + "/change-rules/" + created.Id, created, 200, token).ConfigureAwait(false);
                Assert.True(!updated.Active && updated.ExpiresUtc.HasValue, "Update changes active and expiry");
                EnumerationResult<ChangeRule> listed = await HttpTestHelpers.SendAsync<EnumerationResult<ChangeRule>>(host.AdminClient, HttpMethod.Get, T(host) + "/change-rules?organization=" + f.Org.Name, null, 200, token).ConfigureAwait(false);
                Assert.True(listed.Objects.Single().Id == created.Id, "Listed by organization");
                Assert.True((await host.Server.Context.Database.ChangeRules.ReadAsync("ten_elsewhere", created.Id, token).ConfigureAwait(false)) == null, "Another tenant cannot read the rule");

                await KeeperSuite.UserAsync(host, "exr-dev@example.com", BuiltInRoles.AgentDeveloper, token).ConfigureAwait(false);
                using (HttpClient developer = await host.UserClientAsync("exr-dev@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(developer, HttpMethod.Get, T(host) + "/change-rules/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "AgentDeveloper reads rules");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(developer, HttpMethod.Post, T(host) + "/change-rules", body, token).ConfigureAwait(false)).StatusCode, "AgentDeveloper does not write them");
                }

                Deployment exec = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exr-ceo-exec", AgentId = f.Ceo.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, 201, token).ConfigureAwait(false);
                Run run = await ExecutiveRunAsync(host, f.Ceo, exec, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (HttpClient agent = new HttpClient { BaseAddress = new Uri(host.BaseUrl) })
                {
                    agent.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(agent, HttpMethod.Post, T(host) + "/change-rules", body, token).ConfigureAwait(false)).StatusCode, "A run token cannot create a rule");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(agent, HttpMethod.Put, T(host) + "/change-rules/" + created.Id, created, token).ConfigureAwait(false)).StatusCode, "A run token cannot change a rule");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(agent, HttpMethod.Delete, T(host) + "/change-rules/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "A run token cannot delete a rule");
                }
                RequestContext runContext = new RequestContext { TenantId = host.TenantId, PrincipalType = PrincipalTypeEnum.Run, RunId = run.Id, IsAuthenticated = true };
                Assert.Equal("RulesArePeopleOnly", await CodeAsync(() => host.Server.Context.Get<ChangeRuleService>().CreateAsync(runContext, host.TenantId, body, token)).ConfigureAwait(false), "The service refuses a run even past the routes");
                using (TestMcpClient client = await OrganizationSuite.RunClientAsync(host, run, token).ConfigureAwait(false))
                {
                    await client.ExpectErrorAsync("garrison_create_change_rule", new { organization = f.Org.Name, unit = f.Ops.Name, name = "Mine", classes = new[] { "ModelChange" } }, "Forbidden", token).ConfigureAwait(false);
                }

                // Migrating again leaves the rule and its children in place.
                await host.Server.Context.Database.InitializeAsync(token).ConfigureAwait(false);
                ChangeRule again = Assert.NotNull(await host.Server.Context.Database.ChangeRules.ReadAsync(host.TenantId, created.Id, token).ConfigureAwait(false), "The rule survives a second migration");
                Assert.True(again.Classes.Count == 2 && again.Limits.Count == 2, "Children survive too");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/change-rules/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "A person deletes the rule");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/change-rules/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Gone");
            }
        }

        private static async Task ApplyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "exa", token).ConfigureAwait(false);
                Deployment exec = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exa-ceo-exec", AgentId = f.Ceo.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, 201, token).ConfigureAwait(false);
                Deployment worker = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                Mandate keeper = await OrganizationSuite.MandateAsync(host, "exa-worker-keeper", f.Worker, worker, "Keep the queue drained.", token).ConfigureAwait(false);
                ChangeRule rule = new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Ops.Id, Name = "Ops wake tuning", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.WakeTuning } } };
                rule.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.WakeTuning, Name = "minIntervalSeconds", Minimum = 120, Maximum = 3600 });
                rule = await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", rule, 201, token).ConfigureAwait(false);
                List<OrgRevision> founding = await host.Server.Context.Database.Organizations.ListRevisionsAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false);

                Run run = await ExecutiveRunAsync(host, f.Ceo, exec, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                StudioDraft covered;
                StudioDraft uncovered;
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    List<string> tools = (await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Select(t => t.Name).ToList();
                    Assert.True(tools.Contains("garrison_list_change_rules") && tools.Contains("garrison_studio_put_item") && !tools.Contains("garrison_create_change_rule"), "An executive sees the studio and rule list tools, not rule writing");
                    List<ChangeRule> visible = await client.CallAsync<List<ChangeRule>>("garrison_list_change_rules", new { }, token).ConfigureAwait(false);
                    Assert.True(visible.Single().Id == rule.Id, "The executive reads the rule on its subtree");

                    covered = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Slow the worker keeper" }, token).ConfigureAwait(false);
                    Assert.True(covered.ExecutiveUnitId == f.Root.Id && covered.OrganizationId == f.Org.Id && covered.ExecutiveAgentId == f.Ceo.Id && covered.OriginRunId == run.Id, "The draft is bound to the executive's unit: " + Serializer.Serialize(covered));
                    ManifestDocument mandate = await LiveAsync(host, "Mandate", keeper.Name, token).ConfigureAwait(false);
                    Dictionary<string, object?> revision = (Dictionary<string, object?>)mandate.Spec["revision"]!;
                    revision["minIntervalSeconds"] = 300L;
                    revision["maxIntervalSeconds"] = 600L;
                    covered = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = covered.Id, version = covered.Version, kind = "Mandate", name = keeper.Name, document = Yaml(mandate) }, token).ConfigureAwait(false);
                    StudioDraftDiff diff = await client.CallAsync<StudioDraftDiff>("garrison_studio_validate", new { draftId = covered.Id }, token).ConfigureAwait(false);
                    Assert.True(diff.Valid && diff.Refusals.Count == 0 && diff.AppliesByRule && diff.RuleMatches.Single().RuleId == rule.Id, "Covered by the rule: " + Serializer.Serialize(diff));
                    Approval byRule = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId = covered.Id, version = covered.Version }, token).ConfigureAwait(false);
                    Assert.True(byRule.Status == ApprovalStatusEnum.Approved && byRule.DecisionSource == ApprovalSourceEnum.Rule && byRule.RuleId == rule.Id && (byRule.RulePattern ?? String.Empty).Contains(rule.Id, StringComparison.Ordinal), "Applied at once with source Rule: " + Serializer.Serialize(byRule));

                    uncovered = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Bigger model for the worker" }, token).ConfigureAwait(false);
                    ManifestDocument deployment = await LiveAsync(host, "Deployment", worker.Name, token).ConfigureAwait(false);
                    deployment.Spec["model"] = "exa-large-model";
                    uncovered = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = uncovered.Id, version = uncovered.Version, kind = "Deployment", name = worker.Name, document = Yaml(deployment) }, token).ConfigureAwait(false);
                    Approval waiting = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId = uncovered.Id, version = uncovered.Version }, token).ConfigureAwait(false);
                    Assert.True(waiting.Status == ApprovalStatusEnum.Pending && waiting.DecisionSource == null, "No rule covers ModelChange, so it waits for a person");

                    StudioDraft outside = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Change my own deployment" }, token).ConfigureAwait(false);
                    ManifestDocument own = await LiveAsync(host, "Deployment", exec.Name, token).ConfigureAwait(false);
                    own.Spec["model"] = "exa-huge-model";
                    outside = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = outside.Id, version = outside.Version, kind = "Deployment", name = exec.Name, document = Yaml(own) }, token).ConfigureAwait(false);
                    StudioDraftDiff refused = await client.CallAsync<StudioDraftDiff>("garrison_studio_validate", new { draftId = outside.Id }, token).ConfigureAwait(false);
                    Assert.True(!refused.Valid && refused.Refusals.Single().Code == "SelfModification" && refused.Items.Single().ErrorCode == "SelfModification", "Its own deployment is refused: " + Serializer.Serialize(refused));
                    await client.ExpectErrorAsync("garrison_studio_request_apply", new { draftId = outside.Id, version = outside.Version }, "DraftInvalid", token).ConfigureAwait(false);
                }

                StudioDraft applied = Assert.NotNull(await host.Server.Context.Database.StudioDrafts.ReadAsync(host.TenantId, covered.Id, token).ConfigureAwait(false), "Read the covered draft");
                Assert.True(applied.Status == StudioDraftStatusEnum.Applied, "The covered draft is applied");
                Mandate slowed = Assert.NotNull(await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, keeper.Id, token).ConfigureAwait(false), "Read the mandate");
                MandateRevision current = Assert.NotNull(await host.Server.Context.Database.MandateRevisions.ReadAsync(host.TenantId, slowed.CurrentRevisionId!, token).ConfigureAwait(false), "Read its revision");
                Assert.True(current.MinIntervalSeconds == 300 && current.MaxIntervalSeconds == 600 && current.Source == MandateRevisionSourceEnum.Executive, "The executive's mandate revision is live with source Executive: " + Serializer.Serialize(current));
                List<OrgRevision> revisions = await host.Server.Context.Database.Organizations.ListRevisionsAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false);
                OrgRevision recorded = revisions.First();
                Assert.True(revisions.Count == founding.Count + 1 && recorded.DraftId == covered.Id && recorded.RevertDraftId != null && recorded.State == OrgRevisionStateEnum.Published, "The rule apply is a published org revision: " + Serializer.Serialize(recorded));

                // AA8.7: a run token never publishes a mandate revision directly.
                using (HttpClient agent = new HttpClient { BaseAddress = new Uri(host.BaseUrl) })
                {
                    agent.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
                    TestResponse direct = await HttpTestHelpers.SendAsync(agent, HttpMethod.Post, T(host) + "/mandates/" + keeper.Id + "/revisions/" + current.Id + "/publish", null, token).ConfigureAwait(false);
                    Assert.Equal(403, direct.StatusCode, "Direct publish by a run token is refused: " + direct.Body);
                }

                string proposals = T(host) + "/organizations/" + f.Org.Id + "/proposals";
                EnumerationResult<OrgProposal> listed = await HttpTestHelpers.SendAsync<EnumerationResult<OrgProposal>>(host.AdminClient, HttpMethod.Get, proposals, null, 200, token).ConfigureAwait(false);
                Assert.True(listed.Objects.Count == 3 && listed.Objects.Any(p => p.DraftId == covered.Id && p.DecisionSource == ApprovalSourceEnum.Rule && p.RuleIds.Contains(rule.Id)) && listed.Objects.Any(p => p.DraftId == uncovered.Id && p.ApprovalStatus == ApprovalStatusEnum.Pending && p.UnitName == f.Root.Name && p.AgentName == f.Ceo.Name), "Proposals list both outcomes: " + Serializer.Serialize(listed.Objects));
                OrgProposal detail = await HttpTestHelpers.SendAsync<OrgProposal>(host.AdminClient, HttpMethod.Get, proposals + "/" + uncovered.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(detail.Diff != null && detail.Diff.RuleMatches.Single().RuleId == null && detail.Diff.RuleMatches.Single().Classes.Contains(ChangeClassEnum.ModelChange), "The waiting proposal shows why it needs a person");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, proposals + "/sdr_nothing", null, token).ConfigureAwait(false)).StatusCode, "Unknown proposal");
                OrgProposal decided = await HttpTestHelpers.SendAsync<OrgProposal>(host.AdminClient, HttpMethod.Post, proposals + "/" + uncovered.Id + "/decide", new OrgProposalDecisionRequest { Allow = true, Reason = "Fine." }, 200, token).ConfigureAwait(false);
                Assert.True(decided.Status == StudioDraftStatusEnum.Applied && decided.DecisionSource == ApprovalSourceEnum.User, "A person applies the waiting proposal: " + Serializer.Serialize(decided));
                Deployment bigger = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, worker.Id, token).ConfigureAwait(false), "Read the deployment");
                Assert.Equal("exa-large-model", bigger.Model ?? String.Empty, "The model changed");
                Assert.Equal(409, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, proposals + "/" + uncovered.Id + "/decide", new OrgProposalDecisionRequest { Allow = true }, token).ConfigureAwait(false)).StatusCode, "An applied proposal is not pending");

                // AddWorker under a rule: a new agent joins ops through the organization item, and one revision records it.
                ChangeRule hire = new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Ops.Id, Name = "Ops hiring", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.AddWorker } } };
                hire.Limits.Add(new ChangeRuleLimit { Class = ChangeClassEnum.AddWorker, Name = "count", Maximum = 1 });
                await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", hire, 201, token).ConfigureAwait(false);
                int beforeHire = (await host.Server.Context.Database.Organizations.ListRevisionsAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false)).Count;
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    StudioDraft hiring = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Hire a helper for ops" }, token).ConfigureAwait(false);
                    hiring = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = hiring.Id, version = hiring.Version, kind = "Agent", name = "exa-helper", document = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: exa-helper\nspec:\n  description: Helps the operator.\n" }, token).ConfigureAwait(false);
                    ManifestDocument organization = await LiveAsync(host, "Organization", f.Org.Name, token).ConfigureAwait(false);
                    Dictionary<string, object?> ops = FindUnit(organization.Spec["units"], f.Ops.Name) ?? throw new TestAssertionException("The exported organization names " + f.Ops.Name);
                    List<object?> members = ops.TryGetValue("members", out object? existing) && existing is List<object?> list ? list : new List<object?>();
                    members.Add(new Dictionary<string, object?> { ["agent"] = "exa-helper", ["title"] = "Helper" });
                    ops["members"] = members;
                    hiring = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = hiring.Id, version = hiring.Version, kind = "Organization", name = f.Org.Name, document = Yaml(organization) }, token).ConfigureAwait(false);
                    StudioDraftDiff hireDiff = await client.CallAsync<StudioDraftDiff>("garrison_studio_validate", new { draftId = hiring.Id }, token).ConfigureAwait(false);
                    Assert.True(hireDiff.Valid && hireDiff.AppliesByRule && hireDiff.RuleMatches.Count == 2, "The new agent and its place in ops are one covered worker: " + Serializer.Serialize(hireDiff));
                    Approval hired = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId = hiring.Id, version = hiring.Version }, token).ConfigureAwait(false);
                    Assert.True(hired.DecisionSource == ApprovalSourceEnum.Rule, "Hiring applies under the rule");
                }
                Assert.Equal(beforeHire + 1, (await host.Server.Context.Database.Organizations.ListRevisionsAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false)).Count, "One org revision records the hire, not two");
                Agent helper = Assert.NotNull(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "exa-helper", token).ConfigureAwait(false), "The helper agent exists");
                OrgTree hiredTree = Assert.NotNull(await host.Server.Context.Get<ChainOfCommand>().LiveTreeAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false), "Live tree");
                Assert.True(hiredTree.PositionOf(helper.Id)?.UnitId == f.Ops.Id, "The helper sits in ops in the live chart");

                // Rolling back to the founding revision undoes every apply.
                OrgRevision first = founding.Single();
                await HttpTestHelpers.SendAsync<OrgRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/organizations/" + f.Org.Id + "/rollback", new OrgRollbackRequest { RevisionId = first.Id }, 200, token).ConfigureAwait(false);
                Deployment restored = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadAsync(host.TenantId, worker.Id, token).ConfigureAwait(false), "Read the deployment again");
                Assert.True(restored.Model != "exa-large-model", "Rollback restores the deployment: " + restored.Model);
                Mandate back = Assert.NotNull(await host.Server.Context.Database.Mandates.ReadAsync(host.TenantId, keeper.Id, token).ConfigureAwait(false), "Read the mandate again");
                MandateRevision backRevision = Assert.NotNull(await host.Server.Context.Database.MandateRevisions.ReadAsync(host.TenantId, back.CurrentRevisionId!, token).ConfigureAwait(false), "Read its revision again");
                Assert.True(backRevision.MinIntervalSeconds == 60 && backRevision.MaxIntervalSeconds == 120, "Rollback restores the mandate's wake bounds: " + Serializer.Serialize(backRevision));
                Assert.True(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "exa-helper", token).ConfigureAwait(false) == null, "Rollback deletes the agent the hire created");
                StudioDraft revert = Assert.NotNull(await host.Server.Context.Database.StudioDrafts.ReadAsync(host.TenantId, recorded.RevertDraftId!, token).ConfigureAwait(false), "Read the revert draft");
                Assert.True(revert.Status == StudioDraftStatusEnum.Applied, "The revert draft is used once");
            }
        }

        private static async Task PromptAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "exp", token).ConfigureAwait(false);
                Deployment exec = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exp-ceo-exec", AgentId = f.Ceo.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, 201, token).ConfigureAwait(false);
                Deployment worker = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Sales.Id, Name = "Sales prompts", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.PromptRetune } } }, 201, token).ConfigureAwait(false);
                CompilePreviewResponse preview = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + exec.Id + "/compile-preview", new CompilePreviewRequest { Input = "Plan the quarter." }, 200, token).ConfigureAwait(false);
                string text = Serializer.Serialize(preview);
                Assert.True(text.Contains("You are an executive", StringComparison.Ordinal) && text.Contains(f.Root.Name, StringComparison.Ordinal) && text.Contains(f.Ops.Name, StringComparison.Ordinal) && text.Contains("Sales prompts", StringComparison.Ordinal) && text.Contains("BudgetIncrease", StringComparison.Ordinal), "The executive's compile preview carries its authority, units below, rules, and limits: " + (text.Length > 6000 ? text.Substring(0, 6000) : text));
                Assert.True(preview.TemplateVersions.Any(v => v.TemplateName.Contains("executive-system", StringComparison.Ordinal)), "The fragment is reported among the template versions");
                CompilePreviewResponse plain = await HttpTestHelpers.SendAsync<CompilePreviewResponse>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments/" + worker.Id + "/compile-preview", new CompilePreviewRequest { Input = "Work." }, 200, token).ConfigureAwait(false);
                Assert.True(!Serializer.Serialize(plain).Contains("You are an executive", StringComparison.Ordinal), "A worker gets no executive prompt");
            }
        }

        private static async Task EventsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                NotificationService notifications = host.Server.Context.Get<NotificationService>();
                await notifications.StopAsync().ConfigureAwait(false);
                notifications.Options.AllowPrivateDestinations = true;
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "exe", token).ConfigureAwait(false);
                Deployment exec = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, T(host) + "/deployments", new Deployment { Name = "exe-ceo-exec", AgentId = f.Ceo.Id, HarnessProfileId = "hrn_builtin_fake", ManagementAccess = ManagementAccessEnum.OrgSubtree }, 201, token).ConfigureAwait(false);
                Deployment worker = await OrganizationSuite.DeploymentAsync(host, f.Worker, token).ConfigureAwait(false);
                Mandate keeper = await OrganizationSuite.MandateAsync(host, "exe-worker-keeper", f.Worker, worker, "Keep the queue drained.", token).ConfigureAwait(false);
                ChangeRule rule = await HttpTestHelpers.SendAsync<ChangeRule>(host.AdminClient, HttpMethod.Post, T(host) + "/change-rules", new ChangeRule { OrganizationId = f.Org.Id, UnitId = f.Root.Id, Name = "Text edits", Classes = new List<ChangeRuleClass> { new ChangeRuleClass { Class = ChangeClassEnum.MandateTextEdit } } }, 201, token).ConfigureAwait(false);
                NotificationEndpoint board = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", new NotificationEndpoint { Name = "exe-board", Url = receiver.BaseUrl + "/board", Events = new List<NotificationEventEnum> { NotificationEventEnum.OrgProposalApplied } }, 201, token).ConfigureAwait(false);
                await notifications.SweepAsync(token).ConfigureAwait(false);

                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string adminBearer;
                    using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                    {
                        adminBearer = login.DefaultRequestHeaders.Authorization!.Parameter!;
                    }
                    await socket.ConnectAsync(new Uri(host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(adminBearer)), token).ConfigureAwait(false);
                    await socket.SendAsync(Encoding.UTF8.GetBytes("{\"type\":\"subscribe\",\"channel\":\"organization:" + f.Org.Id + "\"}"), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
                    await KeeperSuite.ReceiveUntilAsync(socket, "organization.subscribed", f.Org.Id, token).ConfigureAwait(false);
                    await Task.Delay(1200, token).ConfigureAwait(false);

                    Run run = await ExecutiveRunAsync(host, f.Ceo, exec, token).ConfigureAwait(false);
                    using (TestMcpClient client = await OrganizationSuite.RunClientAsync(host, run, token).ConfigureAwait(false))
                    {
                        StudioDraft draft = await client.CallAsync<StudioDraft>("garrison_studio_create_draft", new { title = "Sharper objective" }, token).ConfigureAwait(false);
                        string created = await KeeperSuite.ReceiveUntilAsync(socket, "proposal.changed", draft.Id, token).ConfigureAwait(false);
                        Assert.True(created.Contains("\"Open\"", StringComparison.Ordinal), "proposal.changed carries the open proposal: " + created);
                        ManifestDocument mandate = await LiveAsync(host, "Mandate", keeper.Name, token).ConfigureAwait(false);
                        ((Dictionary<string, object?>)mandate.Spec["revision"]!)["objective"] = "Keep the queue drained within five minutes.";
                        draft = await client.CallAsync<StudioDraft>("garrison_studio_put_item", new { draftId = draft.Id, version = draft.Version, kind = "Mandate", name = keeper.Name, document = Yaml(mandate) }, token).ConfigureAwait(false);
                        Approval approval = await client.CallAsync<Approval>("garrison_studio_request_apply", new { draftId = draft.Id, version = draft.Version }, token).ConfigureAwait(false);
                        Assert.True(approval.DecisionSource == ApprovalSourceEnum.Rule, "The text edit applies under the rule");
                        string appliedEvent = await KeeperSuite.ReceiveUntilAsync(socket, "proposal.changed", "Applied", token).ConfigureAwait(false);
                        Assert.True(appliedEvent.Contains(draft.Id, StringComparison.Ordinal) && appliedEvent.Contains("Rule", StringComparison.Ordinal), "proposal.changed reports the rule apply: " + appliedEvent);

                        DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                        while (receiver.For("/board").Count < 1)
                        {
                            if (DateTime.UtcNow > deadline) throw new TestAssertionException("The OrgProposalApplied notification did not arrive.");
                            await notifications.SweepAsync(token).ConfigureAwait(false);
                            await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
                            await Task.Delay(200, token).ConfigureAwait(false);
                        }
                        WebhookReceipt receipt = receiver.For("/board").Single();
                        Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(receipt.Signature, board.SigningSecret, receipt.Body, DateTime.UtcNow, 300), "Signed with the endpoint secret");
                        NotificationPayload payload = Assert.NotNull(Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(receipt.Body)), "Payload parses");
                        Assert.True(payload.Event == NotificationEventEnum.OrgProposalApplied && payload.Proposal != null && payload.Proposal.DraftId == draft.Id && payload.Proposal.RuleIds.Contains(rule.Id) && payload.Proposal.UnitName == f.Root.Name && payload.Link != null && payload.Link.Contains("/proposals/" + draft.Id, StringComparison.Ordinal), "The payload names the proposal and its rules: " + Serializer.Serialize(payload));
                    }
                }
            }
        }

        private static async Task<Run> ExecutiveRunAsync(TestServerHost host, Agent agent, Deployment deployment, CancellationToken token)
        {
            Run run = OrganizationSuite.RunOf(host, agent);
            run.DeploymentId = deployment.Id;
            run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
            return await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
        }

        internal static Dictionary<string, object?>? FindUnit(object? units, string name)
        {
            if (units is not List<object?> list) return null;
            foreach (object? entry in list)
            {
                if (entry is not Dictionary<string, object?> unit) continue;
                if (unit.TryGetValue("name", out object? value) && String.Equals(Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture), name, StringComparison.Ordinal)) return unit;
                if (unit.TryGetValue("units", out object? children))
                {
                    Dictionary<string, object?>? found = FindUnit(children, name);
                    if (found != null) return found;
                }
            }
            return null;
        }

        internal static async Task<ManifestDocument> LiveAsync(TestServerHost host, string kind, string name, CancellationToken token)
        {
            ManifestExportOptions options = new ManifestExportOptions();
            options.Resources.Add(new ManifestResourceReference { Kind = kind, Name = name });
            ManifestExportResult export = await host.Server.Context.Get<ManifestService>().ExportAsync(host.TenantId, options, token).ConfigureAwait(false);
            return ManifestParser.Parse(export.Yaml).Single(d => d.Kind == kind && d.Metadata.Name == name);
        }

        internal static string Yaml(ManifestDocument document)
        {
            Dictionary<string, object?> wrapped = new Dictionary<string, object?>
            {
                ["apiVersion"] = "garrison/v1", ["kind"] = document.Kind, ["metadata"] = new Dictionary<string, object?> { ["name"] = document.Metadata.Name }, ["spec"] = document.Spec
            };
            return ManifestParser.ToYaml(new[] { wrapped });
        }

        private static async Task<string> CodeAsync<TResult>(Func<Task<TResult>> action)
        {
            try
            {
                await action().ConfigureAwait(false);
            }
            catch (AppAccessException e)
            {
                return e.Code;
            }
            return "none";
        }

        private static ExecutiveScope Scope()
        {
            // root (ceo) > ops (lead, member worker) > qa (member tester); root > sales (seller). The executive is lead.
            Organization organization = new Organization { Id = "org_acme", TenantId = "ten_x", Name = "acme" };
            OrgUnit root = new OrgUnit { Id = "oun_root", OrganizationId = organization.Id, Name = "root", LeadAgentId = "agt_ceo" };
            OrgUnit ops = new OrgUnit { Id = "oun_ops", OrganizationId = organization.Id, ParentUnitId = root.Id, Name = "ops", LeadAgentId = "agt_lead" };
            ops.Members.Add(new OrgUnitMember { AgentId = "agt_worker" });
            OrgUnit qa = new OrgUnit { Id = "oun_qa", OrganizationId = organization.Id, ParentUnitId = ops.Id, Name = "qa" };
            qa.Members.Add(new OrgUnitMember { AgentId = "agt_tester" });
            OrgUnit sales = new OrgUnit { Id = "oun_sales", OrganizationId = organization.Id, ParentUnitId = root.Id, Name = "sales", LeadAgentId = "agt_seller" };
            OrgTree tree = new OrgTree(organization, new List<OrgUnit> { root, ops, qa, sales }, "orv_1");

            SubtreeInventory inventory = new SubtreeInventory();
            foreach (string name in new[] { "ceo", "lead", "worker", "seller", "tester", "stranger" }) inventory.Resources.Add(new InventoryResource { Kind = "Agent", Id = "agt_" + name, Name = name });
            inventory.Resources.Single(r => r.Name == "tester").AssetIds.AddRange(new[] { "ast_qa", "ast_mixed" });
            inventory.Resources.Single(r => r.Name == "stranger").AssetIds.Add("ast_mixed");
            inventory.Resources.Add(new InventoryResource { Kind = "Deployment", Id = "dpl_ceo", Name = "ceo-d", AgentId = "agt_ceo", TemplateIds = new List<string> { "tpl_shared" } });
            inventory.Resources.Add(new InventoryResource { Kind = "Deployment", Id = "dpl_lead", Name = "lead-d", AgentId = "agt_lead", TemplateIds = new List<string> { "tpl_lead" } });
            inventory.Resources.Add(new InventoryResource { Kind = "Deployment", Id = "dpl_worker", Name = "worker-d", AgentId = "agt_worker", TemplateIds = new List<string> { "tpl_shared" } });
            inventory.Resources.Add(new InventoryResource { Kind = "Deployment", Id = "dpl_seller", Name = "seller-d", AgentId = "agt_seller" });
            inventory.Resources.Add(new InventoryResource { Kind = "Deployment", Id = "dpl_tester", Name = "tester-d", AgentId = "agt_tester", TemplateIds = new List<string> { "tpl_qa", "tpl_shared" } });
            inventory.Resources.Add(new InventoryResource { Kind = "Mandate", Id = "mdt_tester", Name = "tester-m", AgentId = "agt_tester", DeploymentId = "dpl_tester" });
            inventory.Resources.Add(new InventoryResource { Kind = "Mandate", Id = "mdt_lead", Name = "lead-m", AgentId = "agt_lead", DeploymentId = "dpl_lead" });
            inventory.Resources.Add(new InventoryResource { Kind = "PromptTemplate", Id = "tpl_shared", Name = "tShared" });
            inventory.Resources.Add(new InventoryResource { Kind = "PromptTemplate", Id = "tpl_qa", Name = "tQa" });
            inventory.Resources.Add(new InventoryResource { Kind = "PromptTemplate", Id = "tpl_lead", Name = "tLead" });
            inventory.Resources.Add(new InventoryResource { Kind = "AgentAsset", Id = "ast_qa", Name = "aQa" });
            inventory.Resources.Add(new InventoryResource { Kind = "AgentAsset", Id = "ast_mixed", Name = "aMixed" });
            return SubtreeAuthority.Compute(tree, "oun_ops", "agt_lead", inventory);
        }

        private static ChangeRule Rule(string id, string unitId, DateTime createdUtc, params ChangeClassEnum[] classes)
        {
            ChangeRule rule = new ChangeRule { Id = id, TenantId = "ten_x", OrganizationId = "org_acme", UnitId = unitId, Name = id, CreatedUtc = createdUtc };
            foreach (ChangeClassEnum cls in classes) rule.Classes.Add(new ChangeRuleClass { Class = cls });
            return rule;
        }

        private static void Expect(ExecutiveScope scope, string code, ExecutiveDraftItem item)
        {
            List<ExecutiveRefusal> refusals = ExecutiveDraftValidator.Validate(new ExecutiveDraftContext(scope, new List<ExecutiveDraftItem> { item }));
            Assert.True(refusals.Count == 1 && refusals[0].Code == code && refusals[0].Message.Length > 0, item.Kind + "/" + item.Name + " is refused with " + code + ": " + Serializer.Serialize(refusals));
        }

        private static List<ChangeClassification> Classify(ExecutiveScope scope, params ExecutiveDraftItem[] items)
        {
            return ChangeClassifier.Classify(new ExecutiveDraftContext(scope, items.ToList()));
        }

        private static ChangeClassification Single(ExecutiveScope scope, ExecutiveDraftItem item)
        {
            List<ChangeClassification> changes = Classify(scope, item);
            Assert.True(changes.Count == 1, item.Kind + "/" + item.Name + " is one change: " + Serializer.Serialize(changes));
            return changes[0];
        }

        private static bool Only(ChangeClassification change, ChangeClassEnum cls)
        {
            return change.Classes.Count == 1 && change.Classes[0] == cls && change.Unclassified.Count == 0;
        }

        private static bool Same(HashSet<string> set, params string[] expected)
        {
            return set.Count == expected.Length && expected.All(set.Contains);
        }

        private static ExecutiveDraftItem Item(string kind, string name, ManifestDocument? draft, ManifestDocument? live)
        {
            return new ExecutiveDraftItem { Kind = kind, Name = name, Operation = StudioDraftOperationEnum.Upsert, Document = draft, Live = live };
        }

        private static ManifestDocument Doc(string yaml)
        {
            return ManifestParser.Parse(yaml)[0];
        }

        private static ManifestDocument Agent(string name, string? description = null)
        {
            return Doc("apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: " + name + "\nspec:\n  description: " + (description ?? "Works.") + "\n");
        }

        private static ManifestDocument Template(string name, string content)
        {
            return Doc("apiVersion: garrison/v1\nkind: PromptTemplate\nmetadata:\n  name: " + name + "\nspec:\n  kind: System\n  content: " + content + "\n");
        }

        private static ManifestDocument Deployment(string name, string agent, string model, string? access = null, string? prompt = null, int? weight = null, int? timeout = null)
        {
            StringBuilder yaml = new StringBuilder("apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: " + name + "\nspec:\n  agent: " + agent + "\n  harnessProfile: fake\n  model: " + model + "\n");
            if (access != null) yaml.Append("  managementAccess: " + access + "\n");
            if (prompt != null) yaml.Append("  prompts:\n    System: " + prompt + "\n");
            if (weight.HasValue) yaml.Append("  weight: " + weight.Value + "\n");
            if (timeout.HasValue) yaml.Append("  timeoutSeconds: " + timeout.Value + "\n");
            return Doc(yaml.ToString());
        }

        private static ManifestDocument Mandate(string name, string agent, string deployment, int min, int max, double budgetPerDay, string objective = "Test the build.")
        {
            return Doc("apiVersion: garrison/v1\nkind: Mandate\nmetadata:\n  name: " + name + "\nspec:\n  agent: " + agent + "\n  deployment: " + deployment + "\n  revision:\n    objective: " + objective + "\n    wakeMode: Fixed\n    minIntervalSeconds: " + min + "\n    maxIntervalSeconds: " + max + "\n    budgetPerDayUsd: " + budgetPerDay.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\n");
        }

        private static ManifestDocument Org(string[]? qaMembers = null, string? opsTitle = null, string? salesTitle = null, int qaBudget = 5)
        {
            StringBuilder yaml = new StringBuilder("apiVersion: garrison/v1\nkind: Organization\nmetadata:\n  name: acme\nspec:\n  mission: Ship.\n  units:\n");
            yaml.Append("    - name: root\n      lead: ceo\n      units:\n");
            yaml.Append("        - name: ops\n          lead: lead\n" + (opsTitle != null ? "          leadTitle: " + opsTitle + "\n" : String.Empty) + "          members:\n            - agent: worker\n          units:\n");
            yaml.Append("            - name: qa\n");
            string[] members = qaMembers ?? new[] { "tester" };
            if (members.Length > 0)
            {
                yaml.Append("              members:\n");
                foreach (string member in members) yaml.Append("                - agent: " + member + "\n");
            }
            yaml.Append("              budgets:\n                - period: Day\n                  amountUsd: " + qaBudget + "\n");
            yaml.Append("        - name: sales\n          lead: seller\n" + (salesTitle != null ? "          leadTitle: " + salesTitle + "\n" : String.Empty));
            return Doc(yaml.ToString());
        }

        private static string T(TestServerHost host)
        {
            return OrganizationSuite.T(host);
        }

        #endregion
    }
}
