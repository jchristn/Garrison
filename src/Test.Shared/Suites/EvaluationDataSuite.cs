namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Evaluation data contract (AUTONOMOUS_AGENTS_PLAN.md AA9.1 and AA9.2): enums, model clamps, identifiers, settings,
    /// schema version 54 on both providers, eval sets with tags, cases with checks and files, approved sets that do not
    /// change (an edit opens the next version as a Draft), eval runs with compare-and-set status and atomic counters, case
    /// results with check results, shadow trials, canary releases with steps, the run columns, and tenant isolation.
    /// </summary>
    public static class EvaluationDataSuite
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
            unit.Add(new TestCaseDescriptor("evaluation-unit", "enums", "Evaluation enums, RunKindEnum.Eval and Shadow appended after Message, resource types, CanaryRolledBack, and the new ID prefixes", EnumsAsync));
            unit.Add(new TestCaseDescriptor("evaluation-unit", "clamps", "Eval, shadow, and canary models clamp their ranges and report ValueClamped warnings", ClampsAsync));
            unit.Add(new TestCaseDescriptor("evaluation-unit", "versioning", "The next version of a set copies its description, tags, and cases with new identifiers, as a Draft without approval", VersioningAsync));
            unit.Add(new TestCaseDescriptor("evaluation-unit", "settings", "Evaluation.MaxConcurrentCases and Evaluation.MaxCasesPerSet: definitions, defaults, and clamps", SettingsAsync));
            suites.Add(new TestSuiteDescriptor("evaluation-unit", "Evaluation: enums, models, versioning, settings", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "evaluation-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "migrate-twice", "Schema 54 migrates twice and keeps an eval set with its cases (" + provider + ")", ct => MigrateTwiceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sets", "Eval sets and cases round-trip with tags, checks, and files; approved sets refuse edits; an edit opens version 2 as a Draft with copied cases; tenants are isolated (" + provider + ")", ct => SetsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "runs", "Eval runs: compare-and-set status, parallel case counters, results with check results once per order, filters, and runs carrying evalRunId and shadowTrialId (" + provider + ")", ct => RunsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "shadow", "Shadow trials: round trip, parallel counter increments, running by source deployment, compare-and-set stop, isolation (" + provider + ")", ct => ShadowAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "canary", "Canary releases: steps in order, one running release per agent, compare-and-set step advance and rollback, running lookups, isolation (" + provider + ")", ct => CanaryAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Evaluation data (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task EnumsAsync(CancellationToken token)
        {
            Assert.Equal(8, (int)RunKindEnum.Message, "Message keeps its position");
            Assert.Equal(9, (int)RunKindEnum.Eval, "Eval follows Message");
            Assert.Equal(10, (int)RunKindEnum.Shadow, "Shadow follows Eval");
            Assert.True(Enum.IsDefined(ResourceTypeEnum.EvalSet) && Enum.IsDefined(ResourceTypeEnum.EvalRun) && Enum.IsDefined(ResourceTypeEnum.ShadowTrial) && Enum.IsDefined(ResourceTypeEnum.CanaryRelease), "Resource types exist");
            Assert.True((int)ResourceTypeEnum.EvalSet == (int)ResourceTypeEnum.ChangeRule + 1, "Resource types are appended");
            Assert.True(Enum.IsDefined(NotificationEventEnum.CanaryRolledBack) && (int)NotificationEventEnum.CanaryRolledBack < (int)NotificationEventEnum.Test, "CanaryRolledBack precedes Test");
            Assert.True(Same(Enum.GetNames(typeof(EvalSetStateEnum)), "Draft", "Approved"), "EvalSetStateEnum");
            Assert.True(Same(Enum.GetNames(typeof(EvalSetOriginEnum)), "Human", "Evaluator", "Playground"), "EvalSetOriginEnum");
            Assert.True(Same(Enum.GetNames(typeof(EvalScorerEnum)), "ExactMatch", "Contains", "JsonSchemaValid", "Judge"), "EvalScorerEnum");
            Assert.True(Same(Enum.GetNames(typeof(EvalRunStatusEnum)), "Pending", "Running", "Completed", "Failed", "Cancelled"), "EvalRunStatusEnum");
            Assert.True(Same(Enum.GetNames(typeof(EvalRunTargetEnum)), "AgentRevision", "Deployment"), "EvalRunTargetEnum");
            Assert.True(Same(Enum.GetNames(typeof(EvalRunInputModeEnum)), "Cases", "RecentInputs"), "EvalRunInputModeEnum");
            Assert.True(Same(Enum.GetNames(typeof(ShadowTrialStatusEnum)), "Running", "Completed", "Stopped", "Failed"), "ShadowTrialStatusEnum");
            Assert.True(Same(Enum.GetNames(typeof(CanaryStatusEnum)), "Running", "Promoted", "RolledBack", "Aborted"), "CanaryStatusEnum");
            Assert.True(new EvalSet().Id.StartsWith("evs_", StringComparison.Ordinal) && new EvalCase().Id.StartsWith("evc_", StringComparison.Ordinal) && new EvalRun().Id.StartsWith("evr_", StringComparison.Ordinal), "Set, case, and run prefixes");
            Assert.True(new EvalCaseResult().Id.StartsWith("evx_", StringComparison.Ordinal) && new ShadowTrial().Id.StartsWith("shd_", StringComparison.Ordinal) && new CanaryRelease().Id.StartsWith("cnr_", StringComparison.Ordinal), "Result, trial, and release prefixes");
            EvalSet blank = new EvalSet { Id = "" };
            Assert.True(blank.Id.StartsWith("evs_", StringComparison.Ordinal), "A blank identifier is replaced");
            return Task.CompletedTask;
        }

        private static Task ClampsAsync(CancellationToken token)
        {
            EvalCaseCheck check = new EvalCaseCheck { Weight = 150 };
            Assert.True(check.Weight == 100 && check.Warnings != null && check.Warnings.Single().Field == "weight", "Check weight clamps to 100 with a warning");
            Assert.True(new EvalCaseCheck().Weight == 1 && new EvalCaseCheck().Warnings == null, "Check weight defaults to 1 without warnings");
            EvalCase item = new EvalCase { Order = -3 };
            Assert.True(item.Order == 0 && item.Warnings != null, "Case order clamps to 0");
            EvalRun run = new EvalRun { Threshold = 1.5, RecentInputCount = 0, BudgetUsd = -2, Score = 3 };
            Assert.True(run.Threshold == 1 && run.RecentInputCount == 1 && run.BudgetUsd == 0 && run.Score == 1, "Eval run clamps: " + Serializer.Serialize(run));
            Assert.True(run.Warnings != null && run.Warnings.Count == 3, "Threshold, recent input count, and budget warn");
            Assert.True(new EvalRun().RecentInputCount == 20 && new EvalRun().Status == EvalRunStatusEnum.Pending && new EvalRun().Threshold == null, "Eval run defaults");
            Assert.True(new EvalSet { Version = 0 }.Version == 1 && new EvalSet().State == EvalSetStateEnum.Draft && new EvalSet().Origin == EvalSetOriginEnum.Human, "Set version floor and defaults");
            EvalCaseResult result = new EvalCaseResult { Score = -1, Order = -1 };
            Assert.True(result.Score == 0 && result.Order == 0, "Result score and order floor at 0");
            Assert.True(new EvalCaseCheckResult { Score = 2, Weight = 500 }.Score == 1 && new EvalCaseCheckResult { Weight = 500 }.Weight == 100, "Check result clamps");
            ShadowTrial low = new ShadowTrial { SamplePercent = 0 };
            ShadowTrial high = new ShadowTrial { SamplePercent = 500 };
            Assert.True(low.SamplePercent == 1 && high.SamplePercent == 100 && low.Warnings != null && new ShadowTrial().SamplePercent == 10, "Sample percent clamps to 1 to 100, default 10");
            CanaryRelease release = new CanaryRelease { MaxErrorRatePercent = 150, MinEvalScore = 2, CurrentStepIndex = -1, BaselineInitialWeight = 5000 };
            Assert.True(release.MaxErrorRatePercent == 100 && release.MinEvalScore == 1 && release.CurrentStepIndex == 0 && release.BaselineInitialWeight == 1000, "Canary clamps: " + Serializer.Serialize(release));
            Assert.True(release.Warnings != null && release.Warnings.Count == 2 && new CanaryRelease().MaxErrorRatePercent == 5, "Thresholds warn; default error rate 5");
            CanaryReleaseStep step = new CanaryReleaseStep { WeightPercent = 0, MinimumRuns = -5, MinimumMinutes = 100000 };
            Assert.True(step.WeightPercent == 1 && step.MinimumRuns == 0 && step.MinimumMinutes == 43200 && step.Warnings != null && step.Warnings.Count == 3, "Step clamps");
            CanaryReleaseStep defaults = new CanaryReleaseStep();
            Assert.True(defaults.WeightPercent == 10 && defaults.MinimumRuns == 20 && defaults.MinimumMinutes == 10, "Step defaults");
            return Task.CompletedTask;
        }

        private static Task VersioningAsync(CancellationToken token)
        {
            EvalSet approved = new EvalSet { TenantId = "ten_v", Name = "triage", Description = "Routing checks", Version = 3, State = EvalSetStateEnum.Approved, Origin = EvalSetOriginEnum.Evaluator, ApprovedById = "usr_a", ApprovedByName = "Ann", ApprovedUtc = DateTime.UtcNow, AuthoringOrgUnitId = "oun_qa", Tags = new List<string> { "routing", "smoke" } };
            EvalSet next = EvalSetVersioning.NextVersion(approved, 4, PrincipalTypeEnum.User, "usr_b", "Bob");
            Assert.True(next.Id != approved.Id && next.Version == 4 && next.State == EvalSetStateEnum.Draft && next.PreviousVersionId == approved.Id, "A new Draft version: " + Serializer.Serialize(next));
            Assert.True(next.ApprovedById == null && next.ApprovedUtc == null && next.AuthoredById == "usr_b" && next.AuthoredByName == "Bob", "No approval; the editor is the author");
            Assert.True(next.Name == "triage" && next.Description == "Routing checks" && next.Origin == EvalSetOriginEnum.Evaluator && next.AuthoringOrgUnitId == "oun_qa" && Same(next.Tags.ToArray(), "routing", "smoke"), "Name, description, origin, unit, and tags carry over");
            next.Tags.Add("changed");
            Assert.True(approved.Tags.Count == 2, "Tags are copied, not shared");

            EvalCase source = Case("ten_v", "evs_old", 2, "Route a refund", true);
            List<EvalCase> copies = EvalSetVersioning.CopyCases(new List<EvalCase> { source });
            EvalCase copy = copies.Single();
            Assert.True(copy.Id != source.Id && copy.Order == 2 && copy.InputText == "Route a refund" && copy.Hidden && copy.ExpectedText == source.ExpectedText && copy.SourceRunId == "run_src", "The copy keeps the case's fields with a new identifier");
            Assert.True(copy.Checks.Count == 2 && copy.Checks[1].Scorer == EvalScorerEnum.JsonSchemaValid && copy.Checks[1].Weight == 2 && copy.Files.Count == 2 && copy.Files[1].AssetId == "aas_data", "Checks and files are copied");
            Assert.True(!ReferenceEquals(copy.Checks[0], source.Checks[0]) && !ReferenceEquals(copy.Files[0], source.Files[0]), "Children are deep copies");
            return Task.CompletedTask;
        }

        private static async Task SettingsAsync(CancellationToken token)
        {
            ClusterSettingsService cluster;
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(DatabaseTypeEnum.Sqlite, token).ConfigureAwait(false))
            {
                cluster = new ClusterSettingsService(db, true, 30, name => null);
            }
            ClusterSettingDefinition concurrent = Assert.NotNull(cluster.Find("Evaluation.MaxConcurrentCases"), "Evaluation.MaxConcurrentCases is defined");
            Assert.True(concurrent.DefaultValue == "4" && concurrent.Minimum == 1 && concurrent.Maximum == 64, "MaxConcurrentCases 4, 1 to 64");
            ClusterSettingDefinition perSet = Assert.NotNull(cluster.Find("Evaluation.MaxCasesPerSet"), "Evaluation.MaxCasesPerSet is defined");
            Assert.True(perSet.DefaultValue == "500" && perSet.Minimum == 1 && perSet.Maximum == 10000, "MaxCasesPerSet 500, 1 to 10000");
            EvaluationOptions options = new EvaluationOptions();
            Assert.True(options.MaxConcurrentCases == 4 && options.MaxCasesPerSet == 500, "Option defaults");
            options.MaxConcurrentCases = 0;
            options.MaxCasesPerSet = 20000;
            Assert.True(options.MaxConcurrentCases == 1 && options.MaxCasesPerSet == 10000, "Options clamp");
            options.MaxConcurrentCases = 100;
            options.MaxCasesPerSet = 0;
            Assert.True(options.MaxConcurrentCases == 64 && options.MaxCasesPerSet == 1, "Options clamp the other way");
        }

        private static async Task MigrateTwiceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            string setId;
            using (DatabaseDriverBase first = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.Equal(54, SchemaBuilder.LatestVersion, "Latest schema version");
                Assert.Equal(54, first.SchemaVersion, "Schema version after the first migration");
                EvalSet set = await first.EvalSets.CreateWithCasesAsync(new EvalSet { TenantId = "ten_m", Name = "kept", Tags = new List<string> { "x" } }, new List<EvalCase> { Case("ten_m", null, 0, "Hello", false) }, token).ConfigureAwait(false);
                setId = set.Id;
            }
            using (DatabaseDriverBase second = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.Equal(54, second.SchemaVersion, "Schema version after the second migration");
                EvalSet kept = Assert.NotNull(await second.EvalSets.ReadAsync("ten_m", setId, token).ConfigureAwait(false), "The set survives a second migration");
                Assert.True(kept.CaseCount == 1 && kept.Tags.Single() == "x", "Its cases and tags survive too");
                List<EvalCase> cases = await second.EvalCases.ListBySetAsync("ten_m", setId, token).ConfigureAwait(false);
                Assert.True(cases.Single().Checks.Count == 2 && cases.Single().Files.Count == 2, "Checks and files survive");
            }
        }

        private static async Task SetsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                EvalSet set = new EvalSet { TenantId = "ten_a", Name = "triage", Description = "Routing", Origin = EvalSetOriginEnum.Playground, AuthoredByType = PrincipalTypeEnum.User, AuthoredById = "usr_a", AuthoredByName = "Ann", Tags = new List<string> { "routing", "smoke" } };
                set = await db.EvalSets.CreateAsync(set, token).ConfigureAwait(false);
                Assert.Equal("EvalSetVersionExists", await CodeAsync(() => db.EvalSets.CreateAsync(new EvalSet { TenantId = "ten_a", Name = "triage" }, token)).ConfigureAwait(false), "Name and version are unique in a tenant");
                await db.EvalSets.CreateAsync(new EvalSet { TenantId = "ten_b", Name = "triage" }, token).ConfigureAwait(false);

                EvalCase second = await db.EvalCases.CreateAsync(Case("ten_a", set.Id, 5, "Second", false), token).ConfigureAwait(false);
                EvalCase first = await db.EvalCases.CreateAsync(Case("ten_a", set.Id, 1, "First", true), token).ConfigureAwait(false);
                List<EvalCase> listed = await db.EvalCases.ListBySetAsync("ten_a", set.Id, token).ConfigureAwait(false);
                Assert.True(listed.Select(c => c.Id).SequenceEqual(new[] { first.Id, second.Id }), "Cases list by order");
                EvalCase read = Assert.NotNull(await db.EvalCases.ReadAsync("ten_a", first.Id, token).ConfigureAwait(false), "Read a case");
                Assert.True(read.Hidden && read.InputText == "First" && read.ExpectedText == "{\"queue\":\"refunds\"}" && read.Name == "case-1" && read.SourceRunId == "run_src", "Case fields round-trip: " + Serializer.Serialize(read));
                Assert.True(read.Checks.Count == 2 && read.Checks[0].Scorer == EvalScorerEnum.Contains && read.Checks[0].Argument == "refunds" && read.Checks[1].Scorer == EvalScorerEnum.JsonSchemaValid && read.Checks[1].Weight == 2, "Checks round-trip in order");
                Assert.True(read.Files.Count == 2 && read.Files[0].Path == "input/ticket.txt" && read.Files[0].ContentText == "Customer wants money back" && read.Files[1].AssetId == "aas_data" && read.Files[1].AssetPath == "rows.csv" && read.Files[1].ContentText == null, "Files round-trip in order");
                Assert.True(await db.EvalCases.ReadAsync("ten_b", first.Id, token).ConfigureAwait(false) == null && (await db.EvalCases.ListBySetAsync("ten_b", set.Id, token).ConfigureAwait(false)).Count == 0, "Another tenant cannot read the cases");
                Assert.True(await db.EvalSets.ReadAsync("ten_b", set.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read the set");
                Assert.Equal("NotFound", await CodeAsync(() => db.EvalCases.CreateAsync(Case("ten_b", set.Id, 0, "Sneaky", false), token)).ConfigureAwait(false), "Another tenant cannot add a case to the set");

                read.Checks.RemoveAt(1);
                read.Files.Clear();
                read.InputText = "First, edited";
                await db.EvalCases.UpdateAsync(read, token).ConfigureAwait(false);
                EvalCase edited = Assert.NotNull(await db.EvalCases.ReadAsync("ten_a", first.Id, token).ConfigureAwait(false), "Edited case");
                Assert.True(edited.InputText == "First, edited" && edited.Checks.Count == 1 && edited.Files.Count == 0, "A Draft set's case updates with its children replaced");
                Assert.Equal(2, await db.EvalCases.CountBySetAsync("ten_a", set.Id, token).ConfigureAwait(false), "Two cases");

                set.Description = "Routing, edited";
                set.Tags = new List<string> { "routing" };
                EvalSet updated = await db.EvalSets.UpdateAsync(set, token).ConfigureAwait(false);
                Assert.True(updated.Description == "Routing, edited" && updated.Tags.Single() == "routing" && updated.CaseCount == 2 && updated.Origin == EvalSetOriginEnum.Playground && updated.AuthoredByName == "Ann", "A Draft set updates: " + Serializer.Serialize(updated));

                Assert.True(await db.EvalSets.ApproveAsync("ten_a", set.Id, "usr_b", "Bob", DateTime.UtcNow, token).ConfigureAwait(false), "A person approves the draft");
                Assert.True(!await db.EvalSets.ApproveAsync("ten_a", set.Id, "usr_b", "Bob", DateTime.UtcNow, token).ConfigureAwait(false), "Approving twice does nothing");
                Assert.True(!await db.EvalSets.ApproveAsync("ten_b", set.Id, "usr_b", "Bob", DateTime.UtcNow, token).ConfigureAwait(false), "Another tenant cannot approve it");
                EvalSet approved = Assert.NotNull(await db.EvalSets.ReadAsync("ten_a", set.Id, token).ConfigureAwait(false), "Approved set");
                Assert.True(approved.State == EvalSetStateEnum.Approved && approved.ApprovedById == "usr_b" && approved.ApprovedByName == "Bob" && approved.ApprovedUtc.HasValue, "Approval is recorded");

                approved.Description = "Sneaky";
                Assert.Equal("EvalSetImmutable", await CodeAsync(() => db.EvalSets.UpdateAsync(approved, token)).ConfigureAwait(false), "An approved set refuses an update");
                Assert.Equal("EvalSetImmutable", await CodeAsync(() => db.EvalCases.CreateAsync(Case("ten_a", set.Id, 9, "Late", false), token)).ConfigureAwait(false), "An approved set refuses a new case");
                Assert.Equal("EvalSetImmutable", await CodeAsync(() => db.EvalCases.UpdateAsync(edited, token)).ConfigureAwait(false), "An approved set refuses a case edit");
                Assert.Equal("EvalSetImmutable", await CodeAsync(() => db.EvalCases.DeleteAsync("ten_a", second.Id, token)).ConfigureAwait(false), "An approved set refuses a case delete");
                EvalSet unchanged = Assert.NotNull(await db.EvalSets.ReadAsync("ten_a", set.Id, token).ConfigureAwait(false), "Still there");
                Assert.True(unchanged.Description == "Routing, edited" && unchanged.CaseCount == 2, "Nothing changed");

                EvalSetVersioning versioning = new EvalSetVersioning(db);
                EvalSet draft = await versioning.OpenDraftAsync("ten_a", set.Id, PrincipalTypeEnum.User, "usr_c", "Cy", token).ConfigureAwait(false);
                Assert.True(draft.Id != set.Id && draft.Version == 2 && draft.State == EvalSetStateEnum.Draft && draft.PreviousVersionId == set.Id && draft.Name == "triage" && draft.AuthoredByName == "Cy" && draft.Tags.Single() == "routing", "Editing an approved set opens version 2 as a Draft: " + Serializer.Serialize(draft));
                List<EvalCase> copied = await db.EvalCases.ListBySetAsync("ten_a", draft.Id, token).ConfigureAwait(false);
                Assert.True(copied.Count == 2 && copied.All(c => c.SetId == draft.Id) && copied.Select(c => c.Id).Intersect(new[] { first.Id, second.Id }).Count() == 0, "Its cases are copies with new identifiers");
                Assert.True(copied[0].InputText == "First, edited" && copied[0].Hidden && copied[0].Checks.Count == 1 && copied[1].Checks.Count == 2 && copied[1].Files.Count == 2, "Copies keep inputs, flags, checks, and files");
                EvalSet again = await versioning.OpenDraftAsync("ten_a", set.Id, PrincipalTypeEnum.User, "usr_d", "Di", token).ConfigureAwait(false);
                Assert.Equal(draft.Id, again.Id, "A second edit of version 1 reuses the open draft");
                Assert.Equal(draft.Id, (await versioning.OpenDraftAsync("ten_a", draft.Id, PrincipalTypeEnum.User, null, null, token).ConfigureAwait(false)).Id, "A draft opens as itself");
                Assert.Equal("NotFound", await CodeAsync(() => versioning.OpenDraftAsync("ten_b", set.Id, PrincipalTypeEnum.User, null, null, token)).ConfigureAwait(false), "Another tenant cannot open a draft of the set");
                await db.EvalCases.CreateAsync(Case("ten_a", draft.Id, 9, "Third", false), token).ConfigureAwait(false);
                Assert.Equal(3, await db.EvalCases.CountBySetAsync("ten_a", draft.Id, token).ConfigureAwait(false), "The draft takes new cases");
                Assert.Equal(2, await db.EvalCases.CountBySetAsync("ten_a", set.Id, token).ConfigureAwait(false), "Version 1 keeps its two");

                Assert.Equal(draft.Id, Assert.NotNull(await db.EvalSets.ReadLatestAsync("ten_a", "triage", token).ConfigureAwait(false), "Latest").Id, "The latest version is the draft");
                Assert.Equal(set.Id, Assert.NotNull(await db.EvalSets.ReadLatestApprovedAsync("ten_a", "triage", token).ConfigureAwait(false), "Latest approved").Id, "The latest approved version is version 1");
                Assert.Equal(set.Id, Assert.NotNull(await db.EvalSets.ReadByNameAsync("ten_a", "triage", 1, token).ConfigureAwait(false), "By name").Id, "Read by name and version");
                Assert.True((await db.EvalSets.ListVersionsAsync("ten_a", "triage", token).ConfigureAwait(false)).Select(s => s.Version).SequenceEqual(new[] { 1, 2 }), "Versions list oldest first");

                await db.EvalSets.CreateAsync(new EvalSet { TenantId = "ten_a", Name = "billing", Origin = EvalSetOriginEnum.Human, Tags = new List<string> { "smoke" } }, token).ConfigureAwait(false);
                EnumerationResult<EvalSet> all = await db.EvalSets.EnumerateAsync("ten_a", null, null, null, false, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.True(all.TotalRecords == 3, "Three versions in the tenant: " + all.TotalRecords);
                EnumerationResult<EvalSet> latest = await db.EvalSets.EnumerateAsync("ten_a", null, null, null, true, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.True(latest.TotalRecords == 2 && latest.Objects.Any(s => s.Id == draft.Id) && latest.Objects.All(s => s.Id != set.Id), "Latest only keeps the newest version of each name");
                EnumerationResult<EvalSet> approvedOnly = await db.EvalSets.EnumerateAsync("ten_a", EvalSetStateEnum.Approved, null, null, true, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.True(approvedOnly.Objects.Single().Id == set.Id, "Latest approved per name");
                EnumerationResult<EvalSet> tagged = await db.EvalSets.EnumerateAsync("ten_a", null, EvalSetOriginEnum.Human, "smoke", false, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.True(tagged.Objects.Single().Name == "billing", "Tag and origin filters");
                EnumerationResult<EvalSet> searched = await db.EvalSets.EnumerateAsync("ten_a", null, null, null, false, new EnumerationQuery { Search = "TRIA" }, token).ConfigureAwait(false);
                Assert.True(searched.TotalRecords == 2, "Search matches the name");

                Assert.True(await db.EvalSets.DeleteAsync("ten_a", draft.Id, token).ConfigureAwait(false), "Delete the draft");
                Assert.True(await db.EvalSets.ReadAsync("ten_a", draft.Id, token).ConfigureAwait(false) == null && (await db.EvalCases.ListBySetAsync("ten_a", draft.Id, token).ConfigureAwait(false)).Count == 0, "Its cases go with it");
                Assert.True(!await db.EvalSets.DeleteAsync("ten_b", set.Id, token).ConfigureAwait(false), "Another tenant cannot delete the set");
            }
        }

        private static async Task RunsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                EvalRun run = new EvalRun { TenantId = "ten_a", SetId = "evs_x", SetName = "triage", SetVersion = 2, TargetType = EvalRunTargetEnum.Deployment, AgentId = "agt_a", DeploymentId = "dep_a", StudioDraftId = "sdr_a", Threshold = 0.8, BudgetUsd = 5, TotalCases = 10, StartedByType = PrincipalTypeEnum.Run, StartedById = "run_exec", StartedByName = "ceo", OriginRunId = "run_exec" };
                run = await db.EvalRuns.CreateAsync(run, token).ConfigureAwait(false);
                EvalRun read = Assert.NotNull(await db.EvalRuns.ReadAsync("ten_a", run.Id, token).ConfigureAwait(false), "Read the eval run");
                Assert.True(read.SetVersion == 2 && read.Threshold == 0.8 && read.BudgetUsd == 5 && read.Status == EvalRunStatusEnum.Pending && read.Score == null && read.Passed == null && read.StartedByType == PrincipalTypeEnum.Run && read.OriginRunId == "run_exec" && read.StudioDraftId == "sdr_a", "Fields round-trip: " + Serializer.Serialize(read));
                Assert.True(await db.EvalRuns.ReadAsync("ten_b", run.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read it");

                Assert.True(await db.EvalRuns.TransitionAsync("ten_a", run.Id, EvalRunStatusEnum.Pending, EvalRunStatusEnum.Running, null, token).ConfigureAwait(false), "Pending to Running");
                Assert.True(!await db.EvalRuns.TransitionAsync("ten_a", run.Id, EvalRunStatusEnum.Pending, EvalRunStatusEnum.Running, null, token).ConfigureAwait(false), "Only once");
                Assert.True(!await db.EvalRuns.TransitionAsync("ten_b", run.Id, EvalRunStatusEnum.Running, EvalRunStatusEnum.Cancelled, "No", token).ConfigureAwait(false), "Another tenant cannot cancel it");
                Assert.True((await db.EvalRuns.ListActiveAsync(100, token).ConfigureAwait(false)).Any(r => r.Id == run.Id), "Running runs are active");

                List<Task<bool>> recorded = new List<Task<bool>>();
                for (int i = 0; i < 10; i++)
                {
                    int index = i;
                    recorded.Add(db.EvalRuns.RecordCaseAsync("ten_a", run.Id, index % 2 == 0, index == 9, 0.25, token));
                }
                await Task.WhenAll(recorded).ConfigureAwait(false);
                EvalRun counted = Assert.NotNull(await db.EvalRuns.ReadAsync("ten_a", run.Id, token).ConfigureAwait(false), "Counted");
                Assert.True(counted.CompletedCases == 10 && counted.PassedCases == 5 && counted.ErroredCases == 1 && Math.Abs(counted.CostUsd - 2.5) < 0.0001 && counted.StartedUtc.HasValue, "Parallel case counts are atomic: " + Serializer.Serialize(counted));

                for (int i = 0; i < 3; i++)
                {
                    EvalCaseResult result = new EvalCaseResult { TenantId = "ten_a", EvalRunId = run.Id, CaseId = "evc_" + i, Order = 2 - i, RunId = "run_case" + i, OutputText = "out " + i, Score = 0.5, Passed = i != 1, CostUsd = 0.1 };
                    result.CheckResults.Add(new EvalCaseCheckResult { Scorer = EvalScorerEnum.Contains, Weight = 1, Score = 1, Passed = true, Note = "found" });
                    result.CheckResults.Add(new EvalCaseCheckResult { Scorer = EvalScorerEnum.Judge, Weight = 2, Score = 0.25, Passed = false, JudgeRunId = "run_judge" + i, Note = "too vague" });
                    await db.EvalCaseResults.CreateAsync(result, token).ConfigureAwait(false);
                }
                Assert.Equal("EvalResultExists", await CodeAsync(() => db.EvalCaseResults.CreateAsync(new EvalCaseResult { TenantId = "ten_a", EvalRunId = run.Id, Order = 0 }, token)).ConfigureAwait(false), "One result per order");
                List<EvalCaseResult> results = await db.EvalCaseResults.ListByEvalRunAsync("ten_a", run.Id, token).ConfigureAwait(false);
                Assert.True(results.Select(r => r.Order).SequenceEqual(new[] { 0, 1, 2 }) && results[0].CaseId == "evc_2", "Results list by order");
                Assert.True(results.All(r => r.CheckResults.Count == 2 && r.CheckResults[0].Scorer == EvalScorerEnum.Contains && r.CheckResults[1].JudgeRunId != null && r.CheckResults[1].Note == "too vague" && r.CheckResults[1].Weight == 2), "Check results round-trip in order");
                EvalCaseResult byOrder = Assert.NotNull(await db.EvalCaseResults.ReadByOrderAsync("ten_a", run.Id, 1, token).ConfigureAwait(false), "Read by order");
                Assert.True(!byOrder.Passed && byOrder.OutputText == "out 1" && byOrder.CheckResults.Count == 2, "The middle result");
                Assert.True(Assert.NotNull(await db.EvalCaseResults.ReadAsync("ten_a", byOrder.Id, token).ConfigureAwait(false), "Read by id").CheckResults.Count == 2, "Read by id carries check results");
                Assert.True(await db.EvalCaseResults.ReadAsync("ten_b", byOrder.Id, token).ConfigureAwait(false) == null && (await db.EvalCaseResults.ListByEvalRunAsync("ten_b", run.Id, token).ConfigureAwait(false)).Count == 0, "Another tenant cannot read results");

                counted.Score = 0.75;
                counted.Passed = false;
                await db.EvalRuns.UpdateAsync(counted, token).ConfigureAwait(false);
                Assert.True(await db.EvalRuns.TransitionAsync("ten_a", run.Id, EvalRunStatusEnum.Running, EvalRunStatusEnum.Completed, null, token).ConfigureAwait(false), "Running to Completed");
                Assert.True(!await db.EvalRuns.TransitionAsync("ten_a", run.Id, EvalRunStatusEnum.Running, EvalRunStatusEnum.Cancelled, "Too late", token).ConfigureAwait(false), "A cancel after completion does nothing");
                EvalRun done = Assert.NotNull(await db.EvalRuns.ReadAsync("ten_a", run.Id, token).ConfigureAwait(false), "Done");
                Assert.True(done.Status == EvalRunStatusEnum.Completed && done.Score == 0.75 && done.Passed == false && done.CompletedUtc.HasValue && done.FailureReason == null && done.CompletedCases == 10, "Completed with its score: " + Serializer.Serialize(done));
                Assert.True((await db.EvalRuns.ListActiveAsync(100, token).ConfigureAwait(false)).All(r => r.Id != run.Id), "Completed runs are not active");

                EvalRun other = await db.EvalRuns.CreateAsync(new EvalRun { TenantId = "ten_a", SetId = "evs_y", SetName = "billing", TargetType = EvalRunTargetEnum.AgentRevision, AgentRevisionId = "arv_a", InputMode = EvalRunInputModeEnum.RecentInputs, RecentInputCount = 7 }, token).ConfigureAwait(false);
                Assert.True(await db.EvalRuns.TransitionAsync("ten_a", other.Id, EvalRunStatusEnum.Pending, EvalRunStatusEnum.Failed, "BudgetExhausted", token).ConfigureAwait(false), "Pending to Failed");
                EvalRun failed = Assert.NotNull(await db.EvalRuns.ReadAsync("ten_a", other.Id, token).ConfigureAwait(false), "Failed");
                Assert.True(failed.FailureReason == "BudgetExhausted" && failed.InputMode == EvalRunInputModeEnum.RecentInputs && failed.RecentInputCount == 7 && failed.TargetType == EvalRunTargetEnum.AgentRevision && failed.StartedUtc == null, "Failure recorded");
                Assert.True((await db.EvalRuns.EnumerateAsync("ten_a", "evs_x", null, null, null, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single().Id == run.Id, "By set");
                Assert.True((await db.EvalRuns.EnumerateAsync("ten_a", null, "dep_a", null, null, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single().Id == run.Id, "By deployment");
                Assert.True((await db.EvalRuns.EnumerateAsync("ten_a", null, null, "arv_a", null, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single().Id == other.Id, "By agent revision");
                Assert.True((await db.EvalRuns.EnumerateAsync("ten_a", null, null, null, EvalRunStatusEnum.Failed, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single().Id == other.Id, "By status");
                Assert.True((await db.EvalRuns.EnumerateAsync("ten_b", null, null, null, null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords == 0, "Another tenant sees none");
                Assert.True((await db.EvalRuns.ListForDraftAsync("ten_a", "sdr_a", token).ConfigureAwait(false)).Single().Id == run.Id, "Evidence for a draft");

                Run evalCase = await db.Runs.CreateAsync(new Run { TenantId = "ten_a", AgentId = "agt_a", AgentName = "alpha", DeploymentId = "dep_a", Kind = RunKindEnum.Eval, Status = RunStatusEnum.Queued, QueuedUtc = DateTime.UtcNow, EvalRunId = run.Id }, token).ConfigureAwait(false);
                Run shadow = await db.Runs.CreateAsync(new Run { TenantId = "ten_a", AgentId = "agt_a", AgentName = "alpha", DeploymentId = "dep_b", Kind = RunKindEnum.Shadow, Status = RunStatusEnum.Queued, QueuedUtc = DateTime.UtcNow, ShadowTrialId = "shd_a" }, token).ConfigureAwait(false);
                Run evalRead = Assert.NotNull(await db.Runs.ReadAsync("ten_a", evalCase.Id, token).ConfigureAwait(false), "Eval case run");
                Run shadowRead = Assert.NotNull(await db.Runs.ReadAsync("ten_a", shadow.Id, token).ConfigureAwait(false), "Shadow run");
                Assert.True(evalRead.Kind == RunKindEnum.Eval && evalRead.EvalRunId == run.Id && evalRead.ShadowTrialId == null, "A run carries its eval run");
                Assert.True(shadowRead.Kind == RunKindEnum.Shadow && shadowRead.ShadowTrialId == "shd_a" && shadowRead.EvalRunId == null, "A run carries its shadow trial");
                Assert.True((await db.Runs.EnumerateAsync(new RunFilter { TenantId = "ten_a", EvalRunId = run.Id }, token).ConfigureAwait(false)).Objects.Single().Id == evalCase.Id, "Runs filter by eval run");
                Assert.True((await db.Runs.EnumerateAsync(new RunFilter { TenantId = "ten_a", ShadowTrialId = "shd_a" }, token).ConfigureAwait(false)).Objects.Single().Id == shadow.Id, "Runs filter by shadow trial");

                Assert.True(!await db.EvalRuns.DeleteAsync("ten_b", run.Id, token).ConfigureAwait(false), "Another tenant cannot delete it");
                Assert.True(await db.EvalRuns.DeleteAsync("ten_a", run.Id, token).ConfigureAwait(false), "Delete the eval run");
                Assert.True((await db.EvalCaseResults.ListByEvalRunAsync("ten_a", run.Id, token).ConfigureAwait(false)).Count == 0, "Its results go with it");
            }
        }

        private static async Task ShadowAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                DateTime ends = DateTime.UtcNow.AddDays(1);
                ShadowTrial trial = await db.ShadowTrials.CreateAsync(new ShadowTrial { TenantId = "ten_a", Name = "new model", AgentId = "agt_a", SourceDeploymentId = "dep_live", CandidateDeploymentId = "dep_next", SamplePercent = 25, EndsUtc = ends, ComparisonEvalSetId = "evs_a", UseJudge = true, CreatedById = "usr_a", CreatedByName = "Ann" }, token).ConfigureAwait(false);
                await db.ShadowTrials.CreateAsync(new ShadowTrial { TenantId = "ten_a", SourceDeploymentId = "dep_other", CandidateDeploymentId = "dep_next" }, token).ConfigureAwait(false);
                ShadowTrial read = Assert.NotNull(await db.ShadowTrials.ReadAsync("ten_a", trial.Id, token).ConfigureAwait(false), "Read the trial");
                Assert.True(read.Name == "new model" && read.SamplePercent == 25 && read.EndsUtc.HasValue && Math.Abs((read.EndsUtc.Value - ends).TotalSeconds) < 1 && read.UseJudge && read.ComparisonEvalSetId == "evs_a" && read.Status == ShadowTrialStatusEnum.Running && read.ComparedCount == 0, "Fields round-trip: " + Serializer.Serialize(read));
                Assert.True(await db.ShadowTrials.ReadAsync("ten_b", trial.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read it");

                List<Task<bool>> increments = new List<Task<bool>>();
                for (int i = 0; i < 12; i++)
                {
                    int index = i;
                    increments.Add(db.ShadowTrials.IncrementCountsAsync("ten_a", trial.Id, 1, index % 3 == 0 ? 0 : 1, index % 3 == 0 ? 1 : 0, index == 0 ? 1 : 0, token));
                }
                await Task.WhenAll(increments).ConfigureAwait(false);
                ShadowTrial counted = Assert.NotNull(await db.ShadowTrials.ReadAsync("ten_a", trial.Id, token).ConfigureAwait(false), "Counted");
                Assert.True(counted.ComparedCount == 12 && counted.AgreedCount == 8 && counted.DivergedCount == 4 && counted.CandidateFailureCount == 1, "Parallel increments are atomic: " + Serializer.Serialize(counted));
                Assert.True(!await db.ShadowTrials.IncrementCountsAsync("ten_b", trial.Id, 1, 1, 0, 0, token).ConfigureAwait(false), "Another tenant cannot count");
                bool refused = false;
                try
                {
                    await db.ShadowTrials.IncrementCountsAsync("ten_a", trial.Id, -1, 0, 0, 0, token).ConfigureAwait(false);
                }
                catch (ArgumentOutOfRangeException)
                {
                    refused = true;
                }
                Assert.True(refused, "A negative delta is refused");

                List<ShadowTrial> running = await db.ShadowTrials.ListRunningBySourceDeploymentAsync("ten_a", "dep_live", token).ConfigureAwait(false);
                Assert.True(running.Single().Id == trial.Id, "Running trials by source deployment");
                Assert.True((await db.ShadowTrials.ListRunningBySourceDeploymentAsync("ten_b", "dep_live", token).ConfigureAwait(false)).Count == 0, "Not across tenants");
                Assert.True((await db.ShadowTrials.EnumerateAsync("ten_a", null, "dep_next", null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords == 2, "By candidate");
                Assert.True((await db.ShadowTrials.ListRunningAsync(100, token).ConfigureAwait(false)).Count(t => t.TenantId == "ten_a") == 2, "Running across tenants for the leader");

                Assert.True(await db.ShadowTrials.TransitionAsync("ten_a", trial.Id, ShadowTrialStatusEnum.Running, ShadowTrialStatusEnum.Stopped, "Enough data", token).ConfigureAwait(false), "Stop the trial");
                Assert.True(!await db.ShadowTrials.TransitionAsync("ten_a", trial.Id, ShadowTrialStatusEnum.Running, ShadowTrialStatusEnum.Completed, null, token).ConfigureAwait(false), "It does not also complete");
                ShadowTrial stopped = Assert.NotNull(await db.ShadowTrials.ReadAsync("ten_a", trial.Id, token).ConfigureAwait(false), "Stopped");
                Assert.True(stopped.Status == ShadowTrialStatusEnum.Stopped && stopped.StopReason == "Enough data" && stopped.CompletedUtc.HasValue && stopped.ComparedCount == 12, "Stopped with its reason and counts");
                Assert.True((await db.ShadowTrials.ListRunningBySourceDeploymentAsync("ten_a", "dep_live", token).ConfigureAwait(false)).Count == 0, "No longer running");
                Assert.True((await db.ShadowTrials.EnumerateAsync("ten_a", "dep_live", null, ShadowTrialStatusEnum.Stopped, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single().Id == trial.Id, "By source and status");

                stopped.Name = "renamed";
                await db.ShadowTrials.UpdateAsync(stopped, token).ConfigureAwait(false);
                Assert.Equal("renamed", Assert.NotNull(await db.ShadowTrials.ReadAsync("ten_a", trial.Id, token).ConfigureAwait(false), "Renamed").Name, "Update writes the name");
                Assert.True(!await db.ShadowTrials.DeleteAsync("ten_b", trial.Id, token).ConfigureAwait(false) && await db.ShadowTrials.DeleteAsync("ten_a", trial.Id, token).ConfigureAwait(false), "Only its tenant deletes it");
            }
        }

        private static async Task CanaryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                CanaryRelease release = new CanaryRelease { TenantId = "ten_a", AgentId = "agt_a", CandidateDeploymentId = "dep_next", BaselineDeploymentId = "dep_live", BaselineInitialWeight = 100, CandidateInitialWeight = 0, MaxErrorRatePercent = 2.5, MinEvalScore = 0.9, EvalSetId = "evs_a", CreatedById = "usr_a", CreatedByName = "Ann" };
                release.Steps.Add(new CanaryReleaseStep { WeightPercent = 10, MinimumRuns = 5, MinimumMinutes = 1 });
                release.Steps.Add(new CanaryReleaseStep { WeightPercent = 50, MinimumRuns = 20, MinimumMinutes = 30 });
                release.Steps.Add(new CanaryReleaseStep { WeightPercent = 100, MinimumRuns = 0, MinimumMinutes = 0 });
                release = await db.CanaryReleases.CreateAsync(release, token).ConfigureAwait(false);
                Assert.Equal("CanaryAlreadyRunning", await CodeAsync(() => db.CanaryReleases.CreateAsync(new CanaryRelease { TenantId = "ten_a", AgentId = "agt_a", CandidateDeploymentId = "dep_x", BaselineDeploymentId = "dep_live" }, token)).ConfigureAwait(false), "One running release per agent");
                CanaryRelease elsewhere = await db.CanaryReleases.CreateAsync(new CanaryRelease { TenantId = "ten_b", AgentId = "agt_a", CandidateDeploymentId = "dep_next", BaselineDeploymentId = "dep_live", Steps = new List<CanaryReleaseStep> { new CanaryReleaseStep { WeightPercent = 100 } } }, token).ConfigureAwait(false);

                CanaryRelease read = Assert.NotNull(await db.CanaryReleases.ReadAsync("ten_a", release.Id, token).ConfigureAwait(false), "Read the release");
                Assert.True(read.Steps.Select(s => s.WeightPercent).SequenceEqual(new[] { 10, 50, 100 }) && read.Steps[1].MinimumRuns == 20 && read.Steps[1].MinimumMinutes == 30, "Steps round-trip in order: " + Serializer.Serialize(read.Steps));
                Assert.True(read.MaxErrorRatePercent == 2.5 && read.MinEvalScore == 0.9 && read.EvalSetId == "evs_a" && read.BaselineInitialWeight == 100 && read.CandidateInitialWeight == 0 && read.CurrentStepIndex == 0 && read.Status == CanaryStatusEnum.Running && read.CreatedByName == "Ann", "Fields round-trip");
                Assert.True(await db.CanaryReleases.ReadAsync("ten_b", release.Id, token).ConfigureAwait(false) == null, "Another tenant cannot read it");

                DateTime stepStart = DateTime.UtcNow;
                Assert.True(await db.CanaryReleases.AdvanceStepAsync("ten_a", release.Id, 0, stepStart, token).ConfigureAwait(false), "Advance to step 1");
                Assert.True(!await db.CanaryReleases.AdvanceStepAsync("ten_a", release.Id, 0, stepStart, token).ConfigureAwait(false), "A stale advance does nothing");
                Assert.True(!await db.CanaryReleases.AdvanceStepAsync("ten_b", release.Id, 1, stepStart, token).ConfigureAwait(false), "Another tenant cannot advance it");
                CanaryRelease advanced = Assert.NotNull(await db.CanaryReleases.ReadAsync("ten_a", release.Id, token).ConfigureAwait(false), "Advanced");
                Assert.True(advanced.CurrentStepIndex == 1 && advanced.StepStartedUtc.HasValue, "On step 1 with its start time");

                Assert.Equal(release.Id, Assert.NotNull(await db.CanaryReleases.ReadRunningForAgentAsync("ten_a", "agt_a", token).ConfigureAwait(false), "Running for agent").Id, "Running release by agent");
                Assert.Equal(release.Id, Assert.NotNull(await db.CanaryReleases.ReadRunningForDeploymentAsync("ten_a", "dep_next", token).ConfigureAwait(false), "Running for candidate").Id, "Running release by candidate");
                Assert.Equal(release.Id, Assert.NotNull(await db.CanaryReleases.ReadRunningForDeploymentAsync("ten_a", "dep_live", token).ConfigureAwait(false), "Running for baseline").Id, "Running release by baseline");
                Assert.Equal(elsewhere.Id, Assert.NotNull(await db.CanaryReleases.ReadRunningForAgentAsync("ten_b", "agt_a", token).ConfigureAwait(false), "Other tenant").Id, "Each tenant sees its own");
                List<CanaryRelease> running = await db.CanaryReleases.ListRunningAsync(100, token).ConfigureAwait(false);
                Assert.True(running.Count(r => r.Id == release.Id || r.Id == elsewhere.Id) == 2 && running.Single(r => r.Id == release.Id).Steps.Count == 3, "Running across tenants for the leader, with steps");

                Assert.True(await db.CanaryReleases.TransitionAsync("ten_a", release.Id, CanaryStatusEnum.Running, CanaryStatusEnum.RolledBack, "ErrorRate 12% above 2.5%", token).ConfigureAwait(false), "Roll back");
                Assert.True(!await db.CanaryReleases.TransitionAsync("ten_a", release.Id, CanaryStatusEnum.Running, CanaryStatusEnum.Promoted, null, token).ConfigureAwait(false), "It does not also promote");
                Assert.True(!await db.CanaryReleases.AdvanceStepAsync("ten_a", release.Id, 1, DateTime.UtcNow, token).ConfigureAwait(false), "A rolled back release does not advance");
                CanaryRelease rolled = Assert.NotNull(await db.CanaryReleases.ReadAsync("ten_a", release.Id, token).ConfigureAwait(false), "Rolled back");
                Assert.True(rolled.Status == CanaryStatusEnum.RolledBack && rolled.RollbackReason == "ErrorRate 12% above 2.5%" && rolled.CompletedUtc.HasValue, "Rollback recorded");
                Assert.True(await db.CanaryReleases.ReadRunningForAgentAsync("ten_a", "agt_a", token).ConfigureAwait(false) == null, "No running release now");
                CanaryRelease retry = await db.CanaryReleases.CreateAsync(new CanaryRelease { TenantId = "ten_a", AgentId = "agt_a", CandidateDeploymentId = "dep_next", BaselineDeploymentId = "dep_live", Steps = new List<CanaryReleaseStep> { new CanaryReleaseStep { WeightPercent = 100 } } }, token).ConfigureAwait(false);
                Assert.True((await db.CanaryReleases.EnumerateAsync("ten_a", "agt_a", null, new EnumerationQuery(), token).ConfigureAwait(false)).TotalRecords == 2, "A new release may start after a rollback");
                Assert.True((await db.CanaryReleases.EnumerateAsync("ten_a", null, CanaryStatusEnum.RolledBack, new EnumerationQuery(), token).ConfigureAwait(false)).Objects.Single().Id == release.Id, "By status");

                retry.Status = CanaryStatusEnum.Aborted;
                retry.RollbackReason = "Aborted by Ann";
                retry.CompletedUtc = DateTime.UtcNow;
                await db.CanaryReleases.UpdateAsync(retry, token).ConfigureAwait(false);
                Assert.Equal(CanaryStatusEnum.Aborted, Assert.NotNull(await db.CanaryReleases.ReadAsync("ten_a", retry.Id, token).ConfigureAwait(false), "Aborted").Status, "Update writes the status");
                Assert.True(!await db.CanaryReleases.DeleteAsync("ten_b", release.Id, token).ConfigureAwait(false) && await db.CanaryReleases.DeleteAsync("ten_a", release.Id, token).ConfigureAwait(false), "Only its tenant deletes it");
                Assert.True(await db.CanaryReleases.ReadAsync("ten_a", release.Id, token).ConfigureAwait(false) == null, "Gone with its steps");
            }
        }

        private static EvalCase Case(string tenantId, string? setId, int order, string input, bool hidden)
        {
            EvalCase item = new EvalCase { TenantId = tenantId, SetId = setId ?? String.Empty, Order = order, Name = "case-" + order, InputText = input, Hidden = hidden, ExpectedText = "{\"queue\":\"refunds\"}", SourceRunId = "run_src" };
            item.Checks.Add(new EvalCaseCheck { Scorer = EvalScorerEnum.Contains, Argument = "refunds" });
            item.Checks.Add(new EvalCaseCheck { Scorer = EvalScorerEnum.JsonSchemaValid, Argument = "{\"type\":\"object\",\"required\":[\"queue\"]}", Weight = 2 });
            item.Files.Add(new EvalCaseFile { Path = "input/ticket.txt", MediaType = "text/plain", ContentText = "Customer wants money back" });
            item.Files.Add(new EvalCaseFile { Path = "data/rows.csv", AssetId = "aas_data", AssetPath = "rows.csv" });
            return item;
        }

        private static async Task<string> CodeAsync(Func<Task> action)
        {
            try
            {
                await action().ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                return e.Code;
            }
            catch (NotFoundException)
            {
                return "NotFound";
            }
            return "None";
        }

        private static bool Same(string[] actual, params string[] expected)
        {
            return actual.SequenceEqual(expected);
        }

        #endregion
    }
}
