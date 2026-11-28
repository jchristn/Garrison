namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.ProviderHarness;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// The activity trail (LEARNABILITY_PLAN.md phase LP1) and the organization validation dry run (LP3.7a): the JSON shape
    /// fixed by the dashboard fixture, the batched data-layer reads with tenant isolation, the trail of a plain invoke, a
    /// fan-out with a retry, a message chain, a message loop at the hop cap, an answered escalation, a keeper tick origin,
    /// an approval, effects on and off, the node cap, redaction, cross-tenant 404, the run-token 403, the management MCP
    /// tool, and the validate route.
    /// </summary>
    public static class RunTrailSuite
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
            unit.Add(new TestCaseDescriptor("run-trail-unit", "fixture-shape", "A serialized RunTrail has exactly the property names of dashboard/src/tests/fixtures/runTrail.json, camelCase with enums as strings", FixtureShapeAsync));
            unit.Add(new TestCaseDescriptor("run-trail-unit", "settings", "RunTrailSettings clamp MaxNodes 10 to 5000, MaxMessageHops 0 to 50, MaxSpanHours 1 to 720", SettingsAsync));
            unit.Add(new TestCaseDescriptor("run-trail-unit", "entry-surface-map", "Every run creation surface label maps to its EntrySurfaceEnum value (rest and playground are Rest, pipeline and unknown labels are Internal)", EntrySurfaceMapAsync));
            unit.Add(new TestCaseDescriptor("run-trail-unit", "org-inspect", "OrgTreeValidator.Inspect lists every tree problem Validate refuses, with codes, and nothing for a valid tree", InspectAsync));
            suites.Add(new TestSuiteDescriptor("run-trail-unit", "Activity trail: shape, settings, and organization inspection", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "run-trail-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "batched-reads", "The trail's batched reads return rows by identifier set, chunked, capped by limit, and only from the tenant asked (" + provider + ")", ct => BatchedReadsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "plain-invoke", "A plain invoke is caller, run, and reply over REST, with the run as focus and origin the caller (" + provider + ")", ct => PlainInvokeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "fan-out-retry", "A fan-out with three children and a retry of one: FannedOut, Spawned, and Retried edges, one node per record (" + provider + ")", ct => FanOutAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "message-chain", "A message chain three hops deep resolves to the caller from the middle and the end, with hopCount 3, Sent and Woke edges, and a reply (" + provider + ")", ct => MessageChainAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "message-loop", "Two agents messaging each other show each record once and stop at RunTrail.MaxMessageHops with HopCap (" + provider + ")", ct => LoopAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "escalation", "A blocking escalation answered by a person: Raised and Answered edges, no question or answer text (" + provider + ")", ct => EscalationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "keeper-tick", "A keeper tick run has the KeeperTick as its origin and no reply; unit names come from the live organization (" + provider + ")", ct => KeeperTickAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "approval", "An approval shows as Requested and Decided (" + provider + ")", ct => ApprovalAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "effects", "Effect journal entries appear with their tool name only, and includeEffects=false leaves them out (" + provider + ")", ct => EffectsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "node-cap", "A trail over RunTrail.MaxNodes stops at the cap with NodeCap and still holds the focus run (" + provider + ")", ct => NodeCapAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "redaction", "A person with Run read but no AgentMessage read sees messages as Redacted placeholders that name only the kind and time (" + provider + ")", ct => RedactionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes", "GET /runs/{id}/trail answers 404 for a missing or cross-tenant run, 400 for a bad includeEffects, 403 to a run token, and is in the scope map (" + provider + ")", ct => RoutesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "garrison_get_run_trail is listed for a person and returns the trail as structured content; it is absent and refused for a run token (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "entry-surface", "Runs record how they came in: REST invoke Rest, MCP start Mcp, a manual trigger fire Trigger, and a person's urgent message Message; the trail's Caller node and leg-starting Run nodes carry it (" + provider + ")", ct => EntrySurfaceAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "org-validate", "POST /organizations/{id}/validate lists warnings and errors with codes and unit identifiers, writes nothing, and answers 404 across tenants (" + provider + ")", ct => OrgValidateAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Activity trail (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task FixtureShapeAsync(CancellationToken token)
        {
            string path = Path.Combine(TelemetryCoverageDocument.RepositoryRoot(), "dashboard", "src", "tests", "fixtures", "runTrail.json");
            Dictionary<string, object?> fixture = Serializer.Deserialize<Dictionary<string, object?>>(File.ReadAllText(path)) ?? throw new TestAssertionException("The fixture did not parse.");
            HashSet<string> fixtureTop = new HashSet<string>(fixture.Keys, StringComparer.Ordinal);
            HashSet<string> fixtureNode = KeysOf(fixture["nodes"]);
            HashSet<string> fixtureEdge = KeysOf(fixture["edges"]);

            RunTrailNode full = new RunTrailNode
            {
                Id = "run_x", Kind = RunTrailNodeKindEnum.Run, State = "Succeeded", AgentId = "agt_x", AgentName = "x", UnitId = "unt_x", UnitName = "x", DeploymentId = "dep_x",
                StartedUtc = DateTime.UtcNow, EndedUtc = DateTime.UtcNow, DurationMs = 1, InputTokens = 1, OutputTokens = 1, CostUsd = 0.1, RunKind = RunKindEnum.Invoke,
                IsFocus = true, Lane = "agt_x", CallerType = PrincipalTypeEnum.User, CallerName = "x", ToolName = "t", RedactedKind = RunTrailNodeKindEnum.Message,
                EntrySurface = EntrySurfaceEnum.Rest
            };
            RunTrail trail = new RunTrail { OriginId = "usr_x", FocusRunId = "run_x", Nodes = new List<RunTrailNode> { full }, Edges = new List<RunTrailEdge> { new RunTrailEdge { FromId = "usr_x", ToId = "run_x", Kind = RunTrailEdgeKindEnum.Started } }, NodeCount = 1 };
            string json = Serializer.Serialize(trail);
            Dictionary<string, object?> ours = Serializer.Deserialize<Dictionary<string, object?>>(json)!;
            Assert.True(fixtureTop.SetEquals(ours.Keys), "Top-level properties match the fixture: ours " + String.Join(",", ours.Keys.OrderBy(k => k)) + " fixture " + String.Join(",", fixtureTop.OrderBy(k => k)));
            HashSet<string> nodeKeys = KeysOf(ours["nodes"]);
            Assert.True(fixtureNode.SetEquals(nodeKeys), "Node properties match the fixture: ours " + String.Join(",", nodeKeys.OrderBy(k => k)) + " fixture " + String.Join(",", fixtureNode.OrderBy(k => k)));
            Assert.True(fixtureEdge.SetEquals(KeysOf(ours["edges"])), "Edge properties match the fixture");
            Assert.True(json.Contains("\"kind\":\"Run\"", StringComparison.Ordinal) && json.Contains("\"truncation\":\"None\"", StringComparison.Ordinal) && json.Contains("\"callerType\":\"User\"", StringComparison.Ordinal), "Enums serialize as strings: " + json);

            // The fixture's enum values exist in the C# enums.
            foreach (Dictionary<string, object?> node in Objects(fixture["nodes"]))
            {
                Assert.True(Enum.TryParse(Convert.ToString(node["kind"]), out RunTrailNodeKindEnum _), "Node kind " + node["kind"] + " is a RunTrailNodeKindEnum value");
                if (node.TryGetValue("entrySurface", out object? surface) && surface != null)
                {
                    Assert.True(Enum.TryParse(Convert.ToString(surface), out EntrySurfaceEnum _), "Entry surface " + surface + " is an EntrySurfaceEnum value");
                }
            }
            foreach (Dictionary<string, object?> edge in Objects(fixture["edges"]))
            {
                Assert.True(Enum.TryParse(Convert.ToString(edge["kind"]), out RunTrailEdgeKindEnum _), "Edge kind " + edge["kind"] + " is a RunTrailEdgeKindEnum value");
            }
            RunTrail parsed = Serializer.Deserialize<RunTrail>(File.ReadAllText(path)) ?? throw new TestAssertionException("The fixture does not deserialize as RunTrail.");
            Assert.True(parsed.Nodes.Count == 15 && parsed.Edges.Count == 15 && parsed.Nodes.Single(n => n.IsFocus).Id == "run_b2", "The fixture deserializes as a RunTrail");
            Assert.True(parsed.Nodes.Single(n => n.Id == "usr_operator1").EntrySurface == EntrySurfaceEnum.Rest && parsed.Nodes.Single(n => n.Id == "run_b2").EntrySurface == EntrySurfaceEnum.Message, "The fixture's entry surfaces deserialize");
            return Task.CompletedTask;
        }

        private static Task EntrySurfaceMapAsync(CancellationToken token)
        {
            Dictionary<string, EntrySurfaceEnum> expected = new Dictionary<string, EntrySurfaceEnum>
            {
                { "rest", EntrySurfaceEnum.Rest }, { "playground", EntrySurfaceEnum.Rest }, { "mcp", EntrySurfaceEnum.Mcp }, { "a2a", EntrySurfaceEnum.A2a },
                { "app", EntrySurfaceEnum.App }, { "trigger", EntrySurfaceEnum.Trigger }, { "keeper", EntrySurfaceEnum.Keeper }, { "message", EntrySurfaceEnum.Message },
                { "escalation", EntrySurfaceEnum.Escalation }, { "eval", EntrySurfaceEnum.Eval }, { "shadow", EntrySurfaceEnum.Shadow }, { "pipeline", EntrySurfaceEnum.Internal },
                { "MCP", EntrySurfaceEnum.Mcp }, { "", EntrySurfaceEnum.Internal }, { "carrier-pigeon", EntrySurfaceEnum.Internal }
            };
            foreach (KeyValuePair<string, EntrySurfaceEnum> pair in expected)
            {
                Assert.Equal(pair.Value, EntrySurfaces.FromSurface(pair.Key), "Surface label '" + pair.Key + "'");
            }
            Assert.Equal(EntrySurfaceEnum.Internal, EntrySurfaces.FromSurface(null), "No label");
            Assert.Equal(EntrySurfaceEnum.Rest, EntrySurfaces.FromSurface(new RunCreateContext().Surface), "The creation default is Rest");
            return Task.CompletedTask;
        }

        private static async Task EntrySurfaceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-entry", token).ConfigureAwait(false);
                await OrganizationSuite.DeploymentAsync(host, agent, token).ConfigureAwait(false);

                Run rest = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "entry over rest", Wait = false }, 202, token).ConfigureAwait(false);
                Run restStored = Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, rest.Id, token).ConfigureAwait(false), "The REST run");
                Assert.Equal(EntrySurfaceEnum.Rest, restStored.EntrySurface, "A REST invoke is Rest");

                using (TestMcpClient person = new TestMcpClient())
                {
                    await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ProviderToolResult started = await person.CallResultAsync("garrison_start_run", new { agent = agent.Name, input = "entry over mcp" }, token).ConfigureAwait(false);
                    Assert.True(!started.IsError, "garrison_start_run starts a run");
                }
                EnumerationResult<Run> page = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(host.AdminClient, HttpMethod.Get, T(host) + "/runs?agentId=" + agent.Id + "&maxResults=50", null, 200, token).ConfigureAwait(false);
                List<Run> mcpRuns = new List<Run>();
                foreach (Run listed in page.Objects)
                {
                    Run? stored = await db.Runs.ReadAsync(host.TenantId, listed.Id, token).ConfigureAwait(false);
                    if (stored != null && stored.InputText == "entry over mcp") mcpRuns.Add(stored);
                }
                Assert.True(mcpRuns.Count == 1 && mcpRuns[0].EntrySurface == EntrySurfaceEnum.Mcp, "An MCP start is Mcp");

                Trigger hook = await HttpTestHelpers.SendAsync<Trigger>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers", new Trigger { Name = "trail-entry-hook", Type = TriggerTypeEnum.Webhook, AgentId = agent.Id }, 201, token).ConfigureAwait(false);
                TriggerFire fire = await HttpTestHelpers.SendAsync<TriggerFire>(host.AdminClient, HttpMethod.Post, T(host) + "/triggers/" + hook.Id + "/fire", new TriggerFireRequest { Body = "{}", ContentType = "application/json" }, 201, token).ConfigureAwait(false);
                Run fired = Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, Assert.NotNull(fire.RunId, "The fire's run"), token).ConfigureAwait(false), "The trigger run");
                Assert.Equal(EntrySurfaceEnum.Trigger, fired.EntrySurface, "A trigger fire is Trigger");

                AgentMessageSendRequest urgent = new AgentMessageSendRequest { Recipient = agent.Name, Subject = "Entry", Body = "Wake up", Urgency = MessageUrgencyEnum.Urgent, IdempotencyKey = "trail-entry-" + provider };
                AgentMessage sent = await HttpTestHelpers.SendAsync<AgentMessage>(host.AdminClient, HttpMethod.Post, T(host) + "/messages", urgent, 201, token).ConfigureAwait(false);
                Run woken = Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, Assert.NotNull(sent.DeliveredRunId, "Urgent mail woke a run: " + Serializer.Serialize(sent)), token).ConfigureAwait(false), "The woken run");
                Assert.True(woken.Kind == RunKindEnum.Message && woken.EntrySurface == EntrySurfaceEnum.Message, "A message wake is Message");

                RunTrailService service = host.Server.Context.Get<RunTrailService>();
                RunTrail restTrail = await service.BuildAsync(OrganizationSuite.Admin(host), host.TenantId, rest.Id, null, token).ConfigureAwait(false);
                RunTrailNode caller = restTrail.Nodes.Single(n => n.Id == restTrail.OriginId);
                Assert.True(caller.Kind == RunTrailNodeKindEnum.Caller && caller.EntrySurface == EntrySurfaceEnum.Rest, "The Caller node says Rest: " + Serializer.Serialize(restTrail));
                Assert.Equal(EntrySurfaceEnum.Rest, restTrail.Nodes.Single(n => n.Id == rest.Id).EntrySurface, "The root Run node says Rest");
                RunTrail triggerTrail = await service.BuildAsync(OrganizationSuite.Admin(host), host.TenantId, fired.Id, null, token).ConfigureAwait(false);
                Assert.True(triggerTrail.Nodes.Single(n => n.Id == triggerTrail.OriginId).Kind == RunTrailNodeKindEnum.Trigger && triggerTrail.Nodes.Single(n => n.Id == fired.Id).EntrySurface == EntrySurfaceEnum.Trigger, "A trigger trail: Trigger origin, run says Trigger");
                RunTrail messageTrail = await service.BuildAsync(OrganizationSuite.Admin(host), host.TenantId, woken.Id, null, token).ConfigureAwait(false);
                Assert.Equal(EntrySurfaceEnum.Message, messageTrail.Nodes.Single(n => n.Id == woken.Id).EntrySurface, "The woken Run node says Message");
                string json = Serializer.Serialize(restTrail);
                Assert.True(json.Contains("\"entrySurface\":\"Rest\"", StringComparison.Ordinal), "The entry surface serializes as a string: " + json);

                // A child run follows its parent: only runs that start a leg of the work carry the surface.
                Run child = OrganizationSuite.RunOf(host, agent);
                child.ParentRunId = rest.Id;
                child.RootRunId = rest.Id;
                child.Kind = RunKindEnum.Delegated;
                child.EntrySurface = EntrySurfaceEnum.Mcp;
                await db.Runs.CreateAsync(child, token).ConfigureAwait(false);
                RunTrail withChild = await service.BuildAsync(OrganizationSuite.Admin(host), host.TenantId, child.Id, null, token).ConfigureAwait(false);
                Assert.True(withChild.Nodes.Single(n => n.Id == child.Id).EntrySurface == null && Run(withChild, rest.Id).EntrySurface == EntrySurfaceEnum.Rest, "A child run node leaves the surface out");
                Run reread = Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, child.Id, token).ConfigureAwait(false), "The child run");
                Assert.Equal(EntrySurfaceEnum.Mcp, reread.EntrySurface, "The column round-trips");
            }
        }

        private static RunTrailNode Run(RunTrail trail, string id)
        {
            return trail.Nodes.Single(n => n.Id == id);
        }

        private static Task SettingsAsync(CancellationToken token)
        {
            RunTrailSettings settings = new RunTrailSettings();
            Assert.True(settings.MaxNodes == 500 && settings.MaxMessageHops == 12 && settings.MaxSpanHours == 72 && settings.IncludeEffects, "Defaults");
            settings.MaxNodes = 1;
            settings.MaxMessageHops = -3;
            settings.MaxSpanHours = 0;
            Assert.True(settings.MaxNodes == 10 && settings.MaxMessageHops == 0 && settings.MaxSpanHours == 1, "Minimums");
            settings.MaxNodes = 100000;
            settings.MaxMessageHops = 1000;
            settings.MaxSpanHours = 100000;
            Assert.True(settings.MaxNodes == 5000 && settings.MaxMessageHops == 50 && settings.MaxSpanHours == 720, "Maximums");
            return Task.CompletedTask;
        }

        private static Task InspectAsync(CancellationToken token)
        {
            OrgTreeValidator validator = new OrgTreeValidator();
            OrgUnit root = Unit("unt_root", "Root", null, "agt_a");
            OrgUnit child = Unit("unt_child", "Child", "unt_root", "agt_b");
            Assert.Equal(0, validator.Inspect(new List<OrgUnit> { root, child }, true).Count, "A valid tree has no problems");

            OrgUnit twoUnits = Unit("unt_two", "Two", "unt_root", "agt_a");
            OrgUnit detached = Unit("unt_lost", "Lost", "unt_gone", null);
            OrgUnit peer = Unit("unt_peer", "Peer", "unt_root", null);
            peer.PeerLines.Add(new OrgUnitPeerLine { PeerUnitId = "unt_nowhere" });
            root.Budgets.Add(new OrgUnitBudget { Period = BudgetPeriodEnum.Month, AmountUsd = 100 });
            child.Budgets.Add(new OrgUnitBudget { Period = BudgetPeriodEnum.Month, AmountUsd = 500 });
            OrgUnit secondRoot = Unit("unt_root2", "Root 2", null, null);
            List<OrgUnit> broken = new List<OrgUnit> { root, child, twoUnits, detached, peer, secondRoot };
            List<OrganizationValidationProblem> problems = validator.Inspect(broken, true);
            HashSet<OrganizationValidationProblemCodeEnum> codes = new HashSet<OrganizationValidationProblemCodeEnum>(problems.Select(p => p.Code));
            Assert.True(codes.SetEquals(new[] { OrganizationValidationProblemCodeEnum.AgentInTwoUnits, OrganizationValidationProblemCodeEnum.UnitDetachedFromRoot, OrganizationValidationProblemCodeEnum.PeerLineToMissingUnit, OrganizationValidationProblemCodeEnum.BudgetOverParent, OrganizationValidationProblemCodeEnum.OneRoot }), "Every problem is listed: " + Serializer.Serialize(problems));
            Assert.True(problems.All(p => p.Severity == OrganizationValidationSeverityEnum.Error && p.Message.Length > 0), "Tree problems are errors with a message");
            Assert.True(problems.Single(p => p.Code == OrganizationValidationProblemCodeEnum.AgentInTwoUnits).UnitId == "unt_two" && problems.Single(p => p.Code == OrganizationValidationProblemCodeEnum.AgentInTwoUnits).AgentId == "agt_a", "The problem names the unit and agent");
            Assert.Equal("unt_lost", problems.Single(p => p.Code == OrganizationValidationProblemCodeEnum.UnitDetachedFromRoot).UnitId, "Detached unit");
            Assert.Equal("unt_child", problems.Single(p => p.Code == OrganizationValidationProblemCodeEnum.BudgetOverParent).UnitId, "Budget over the parent's");
            bool refused = false;
            try
            {
                validator.Validate(broken, true);
            }
            catch (Garrison.Core.Services.ConflictException)
            {
                refused = true;
            }
            Assert.True(refused, "Validate refuses the same tree");
            Assert.True(validator.Inspect(new List<OrgUnit>(), true).Single().Code == OrganizationValidationProblemCodeEnum.OneRoot, "An empty tree needs its root");

            OrganizationValidationResult result = new OrganizationValidationResult();
            result.Problems.Add(new OrganizationValidationProblem { Code = OrganizationValidationProblemCodeEnum.UnitWithoutLead, Severity = OrganizationValidationSeverityEnum.Warning });
            Assert.True(result.Valid, "Warnings alone leave the tree valid");
            result.Problems.Add(problems[0]);
            Assert.True(!result.Valid, "An error makes it invalid");
            return Task.CompletedTask;
        }

        private static async Task BatchedReadsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-batch", token).ConfigureAwait(false);
                Run parent = await RunAsync(host, agent, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                List<Run> children = new List<Run>();
                for (int i = 0; i < 5; i++) children.Add(await RunAsync(host, agent, parent, RunKindEnum.Delegated, RunStatusEnum.Succeeded, token).ConfigureAwait(false));
                Run foreign = OrganizationSuite.RunOf(host, agent);
                foreign.TenantId = "ten_elsewhere";
                foreign.ParentRunId = parent.Id;
                await db.Runs.CreateAsync(foreign, token).ConfigureAwait(false);

                int chunk = AdoIdSetQuery.ChunkSize;
                try
                {
                    AdoIdSetQuery.ChunkSize = 2;
                    List<string> ids = children.Select(c => c.Id).Concat(new[] { foreign.Id, "run_missing", children[0].Id, "" }).ToList();
                    List<Run> byId = await db.Runs.ListByIdsAsync(host.TenantId, ids, token).ConfigureAwait(false);
                    Assert.True(byId.Count == 5 && byId.All(r => r.TenantId == host.TenantId), "By identifier, chunked, deduplicated, own tenant only: " + byId.Count);
                    Assert.Equal(5, (await db.Runs.ListByParentsAsync(host.TenantId, new List<string> { parent.Id }, 100, token).ConfigureAwait(false)).Count, "Children of the parent in this tenant only");
                    Assert.Equal(3, (await db.Runs.ListByParentsAsync(host.TenantId, new List<string> { parent.Id }, 3, token).ConfigureAwait(false)).Count, "The limit caps the rows");
                    Assert.Equal(0, (await db.Runs.ListByParentsAsync("ten_elsewhere", new List<string> { children[0].Id }, 100, token).ConfigureAwait(false)).Count, "Another tenant reads nothing of this one");
                }
                finally
                {
                    AdoIdSetQuery.ChunkSize = chunk;
                }
                Assert.Equal(0, (await db.Runs.ListByIdsAsync(host.TenantId, new List<string>(), token).ConfigureAwait(false)).Count, "An empty set reads nothing");

                Run retry = OrganizationSuite.RunOf(host, agent);
                retry.RetryOfRunId = children[1].Id;
                await db.Runs.CreateAsync(retry, token).ConfigureAwait(false);
                Assert.Equal(retry.Id, (await db.Runs.ListRetriesOfAsync(host.TenantId, new List<string> { children[1].Id }, 10, token).ConfigureAwait(false)).Single().Id, "Retries of a run");

                AgentMessage message = await MessageAsync(host, agent, parent, agent, children[0], true, token).ConfigureAwait(false);
                Assert.Equal(message.Id, (await db.AgentMessages.ListBySenderRunsAsync(host.TenantId, new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Single().Id, "Messages by sender run");
                Assert.Equal(message.Id, (await db.AgentMessages.ListByDeliveredRunsAsync(host.TenantId, new List<string> { children[0].Id }, 10, token).ConfigureAwait(false)).Single().Id, "Messages by delivered run");
                Assert.Equal(0, (await db.AgentMessages.ListBySenderRunsAsync("ten_elsewhere", new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Count, "Messages stay in their tenant");

                Report report = await db.Reports.CreateAsync(new Report { TenantId = host.TenantId, AuthorAgentId = agent.Id, RunId = parent.Id, Title = "Batch" }, token).ConfigureAwait(false);
                Assert.Equal(report.Id, (await db.Reports.ListByRunsAsync(host.TenantId, new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Single().Id, "Reports by run");
                Escalation escalation = await db.Escalations.CreateAsync(new Escalation { TenantId = host.TenantId, RaisingRunId = parent.Id, AgentId = agent.Id, Question = "Which way?", RoutedRunId = children[2].Id }, token).ConfigureAwait(false);
                Assert.Equal(escalation.Id, (await db.Escalations.ListByRaisingRunsAsync(host.TenantId, new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Single().Id, "Escalations by raising run");
                Assert.Equal(escalation.Id, (await db.Escalations.ListByRoutedRunsAsync(host.TenantId, new List<string> { children[2].Id }, 10, token).ConfigureAwait(false)).Single().Id, "Escalations by routed run");
                Approval approval = await db.Approvals.CreateAsync(NewApproval(host, agent, parent), token).ConfigureAwait(false);
                Assert.Equal(approval.Id, (await db.Approvals.ListByRunsAsync(host.TenantId, new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Single().Id, "Approvals by run in a tenant");
                Assert.Equal(0, (await db.Approvals.ListByRunsAsync("ten_elsewhere", new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Count, "Approvals stay in their tenant");
                FanOutGroup group = await db.FanOuts.CreateAsync(new FanOutGroup { TenantId = host.TenantId, ParentRunId = parent.Id, RootRunId = parent.Id, RequestDigest = "batch" }, token).ConfigureAwait(false);
                Assert.Equal(group.Id, (await db.FanOuts.ListByParentsAsync(host.TenantId, new List<string> { parent.Id }, 10, token).ConfigureAwait(false)).Single().Id, "Fan-out groups by parent");
                MandateTick tick = await db.MandateTicks.CreateAsync(new MandateTick { TenantId = host.TenantId, MandateId = "mdt_batch" }, token).ConfigureAwait(false);
                Assert.Equal(tick.Id, (await db.MandateTicks.ListByIdsAsync(host.TenantId, new List<string> { tick.Id }, token).ConfigureAwait(false)).Single().Id, "Ticks by identifier");
                Assert.Equal(0, (await db.MandateTicks.ListByIdsAsync("ten_elsewhere", new List<string> { tick.Id }, token).ConfigureAwait(false)).Count, "Ticks stay in their tenant");
                Run leased = await LeasedRunAsync(host, agent, token).ConfigureAwait(false);
                Assert.True(await db.EffectOperations.AuthorizeAsync(new EffectOperation { TenantId = host.TenantId, RunId = leased.Id, LeaseEpoch = leased.LeaseEpoch, Tool = "garrison_send_message", ArgumentDigest = "d" }, token).ConfigureAwait(false), "Effect recorded");
                Assert.Equal("garrison_send_message", (await db.EffectOperations.ListByRunsAsync(host.TenantId, new List<string> { leased.Id }, 10, token).ConfigureAwait(false)).Single().Tool, "Effects by run");
                Assert.Equal(0, (await db.EffectOperations.ListByRunsAsync("ten_elsewhere", new List<string> { leased.Id }, 10, token).ConfigureAwait(false)).Count, "Effects stay in their tenant");
            }
        }

        private static async Task PlainInvokeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-plain", token).ConfigureAwait(false);
                Run run = OrganizationSuite.RunOf(host, agent);
                run.CallerType = PrincipalTypeEnum.User;
                run.CallerId = "usr_trail";
                run.CallerName = "trail@example.com";
                run.Status = RunStatusEnum.Succeeded;
                run.StartedUtc = DateTime.UtcNow;
                run.CompletedUtc = DateTime.UtcNow.AddSeconds(2);
                run.InputText = "SECRET-PROMPT-TEXT";
                run.ResultText = "SECRET-RESULT-TEXT";
                run.InputTokens = 10;
                run.OutputTokens = 4;
                run.CostUsd = 0.01;
                await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
                TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/trail", null, token).ConfigureAwait(false);
                Assert.Equal(200, response.StatusCode, "Trail read: " + response.Body);
                Assert.True(!response.Body.Contains("SECRET-PROMPT-TEXT", StringComparison.Ordinal) && !response.Body.Contains("SECRET-RESULT-TEXT", StringComparison.Ordinal), "No prompt or output text in the trail");
                RunTrail trail = Serializer.Deserialize<RunTrail>(response.Body)!;
                Assert.True(trail.OriginId == "usr_trail" && trail.FocusRunId == run.Id && trail.Truncation == RunTrailTruncationEnum.None && trail.HopCount == 0, "Origin is the caller: " + response.Body);
                Assert.True(trail.Nodes.Select(n => n.Kind).SequenceEqual(new[] { RunTrailNodeKindEnum.Caller, RunTrailNodeKindEnum.Run, RunTrailNodeKindEnum.Reply }), "Caller, run, reply: " + response.Body);
                RunTrailNode node = trail.Nodes[1];
                Assert.True(node.IsFocus && node.AgentName == agent.Name && node.Lane == agent.Id && node.InputTokens == 10 && node.OutputTokens == 4 && node.DurationMs >= 1000 && node.RunKind == RunKindEnum.Invoke, "Run node: " + response.Body);
                Assert.True(trail.Nodes[0].CallerName == "trail@example.com" && trail.Nodes[0].CallerType == PrincipalTypeEnum.User && trail.Nodes[0].Lane == "caller", "Caller node");
                Assert.True(trail.Nodes[2].Id == "rep_" + run.Id && trail.Nodes[2].State == "Succeeded" && trail.Nodes[2].Lane == "caller", "Reply node");
                Assert.True(Kinds(trail).SequenceEqual(new[] { RunTrailEdgeKindEnum.Started, RunTrailEdgeKindEnum.Replied }) && trail.NodeCount == 3, "Started and Replied edges");
            }
        }

        private static async Task FanOutAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent lead = await OrganizationSuite.AgentAsync(host, "trail-fan-lead", token).ConfigureAwait(false);
                Agent worker = await OrganizationSuite.AgentAsync(host, "trail-fan-worker", token).ConfigureAwait(false);
                Run parent = await RunAsync(host, lead, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                FanOutGroup group = await db.FanOuts.CreateAsync(new FanOutGroup { TenantId = host.TenantId, ParentRunId = parent.Id, RootRunId = parent.Id, RequestDigest = "fan", Status = FanOutGroupStatusEnum.Joined }, token).ConfigureAwait(false);
                List<Run> members = new List<Run>();
                for (int i = 0; i < 3; i++)
                {
                    Run member = ChildOf(host, worker, parent);
                    member.FanOutGroupId = group.Id;
                    member.Status = i == 1 ? RunStatusEnum.Failed : RunStatusEnum.Succeeded;
                    members.Add(await db.Runs.CreateAsync(member, token).ConfigureAwait(false));
                }
                Run retry = OrganizationSuite.RunOf(host, worker);
                retry.Kind = RunKindEnum.Retry;
                retry.RetryOfRunId = members[1].Id;
                retry.Status = RunStatusEnum.Succeeded;
                retry.StartedUtc = DateTime.UtcNow;
                await db.Runs.CreateAsync(retry, token).ConfigureAwait(false);

                RunTrail trail = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, retry.Id, null, token).ConfigureAwait(false);
                Assert.True(trail.OriginId == trail.Nodes[0].Id && trail.Nodes[0].Kind == RunTrailNodeKindEnum.Caller, "The retry walks back through the member and the parent to the caller: " + Serializer.Serialize(trail));
                Assert.True(trail.Nodes.Count(n => n.Kind == RunTrailNodeKindEnum.Run) == 5 && trail.Nodes.Count(n => n.Kind == RunTrailNodeKindEnum.FanOutGroup) == 1, "Parent, three members, and the retry, once each");
                Assert.True(trail.Nodes.Select(n => n.Id).Distinct().Count() == trail.Nodes.Count, "No duplicate nodes");
                Assert.True(Has(trail, parent.Id, group.Id, RunTrailEdgeKindEnum.FannedOut) && members.All(m => Has(trail, group.Id, m.Id, RunTrailEdgeKindEnum.Spawned)) && Has(trail, members[1].Id, retry.Id, RunTrailEdgeKindEnum.Retried), "FannedOut, Spawned, Retried: " + Serializer.Serialize(trail.Edges));
                Assert.True(trail.Nodes.Single(n => n.Id == retry.Id).IsFocus && trail.Nodes.Single(n => n.Id == group.Id).State == "Joined" && trail.Nodes.Single(n => n.Id == group.Id).Lane == lead.Id, "Focus and group state and lane");
            }
        }

        private static async Task MessageChainAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent a = await OrganizationSuite.AgentAsync(host, "trail-chain-a", token).ConfigureAwait(false);
                Agent b = await OrganizationSuite.AgentAsync(host, "trail-chain-b", token).ConfigureAwait(false);
                Agent c = await OrganizationSuite.AgentAsync(host, "trail-chain-c", token).ConfigureAwait(false);
                Agent d = await OrganizationSuite.AgentAsync(host, "trail-chain-d", token).ConfigureAwait(false);
                Run runA = await RunAsync(host, a, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Run runB = await RunAsync(host, b, null, RunKindEnum.Message, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Run runC = await RunAsync(host, c, null, RunKindEnum.Message, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Run runD = await RunAsync(host, d, null, RunKindEnum.Message, RunStatusEnum.Running, token).ConfigureAwait(false);
                AgentMessage m1 = await MessageAsync(host, a, runA, b, runB, true, token).ConfigureAwait(false);
                AgentMessage m2 = await MessageAsync(host, b, runB, c, runC, true, token).ConfigureAwait(false);
                AgentMessage m3 = await MessageAsync(host, c, runC, d, runD, true, token).ConfigureAwait(false);
                RunTrailService service = host.Server.Context.Get<RunTrailService>();

                RunTrail fromEnd = await service.BuildAsync(OrganizationSuite.Admin(host), host.TenantId, runD.Id, null, token).ConfigureAwait(false);
                Assert.True(fromEnd.OriginId == runA.CallerId || fromEnd.Nodes[0].Kind == RunTrailNodeKindEnum.Caller, "The end of the chain resolves to the caller: " + Serializer.Serialize(fromEnd));
                Assert.Equal(3, fromEnd.HopCount, "Three message hops");
                Assert.True(Has(fromEnd, runA.Id, m1.Id, RunTrailEdgeKindEnum.Sent) && Has(fromEnd, m1.Id, runB.Id, RunTrailEdgeKindEnum.Woke) && Has(fromEnd, m3.Id, runD.Id, RunTrailEdgeKindEnum.Woke), "Sent and Woke edges: " + Serializer.Serialize(fromEnd.Edges));
                Assert.True(fromEnd.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Reply) && Has(fromEnd, runA.Id, "rep_" + runA.Id, RunTrailEdgeKindEnum.Replied), "The root run finished, so the reply is shown");
                Assert.True(fromEnd.Nodes.Single(n => n.IsFocus).Id == runD.Id && fromEnd.Nodes.Single(n => n.Id == m2.Id).Lane == b.Id, "Focus is the last run; a message sits in its sender's lane");

                RunTrail fromMiddle = await service.BuildAsync(OrganizationSuite.Admin(host), host.TenantId, runB.Id, null, token).ConfigureAwait(false);
                Assert.True(fromMiddle.OriginId == fromEnd.OriginId && fromMiddle.FocusRunId == runB.Id && fromMiddle.Nodes.Single(n => n.IsFocus).Id == runB.Id, "Focus in the middle resolves to the same origin");
                Assert.True(fromMiddle.Nodes.Select(n => n.Id).OrderBy(i => i).SequenceEqual(fromEnd.Nodes.Select(n => n.Id).OrderBy(i => i)), "The same trail from the middle");
            }
        }

        private static async Task LoopAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<RunTrailSettings>().MaxMessageHops = 3;
                Agent x = await OrganizationSuite.AgentAsync(host, "trail-loop-x", token).ConfigureAwait(false);
                Agent y = await OrganizationSuite.AgentAsync(host, "trail-loop-y", token).ConfigureAwait(false);
                List<Run> runs = new List<Run> { await RunAsync(host, x, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false) };
                List<AgentMessage> messages = new List<AgentMessage>();
                for (int i = 1; i <= 6; i++)
                {
                    Agent recipient = i % 2 == 1 ? y : x;
                    Agent sender = i % 2 == 1 ? x : y;
                    Run woke = await RunAsync(host, recipient, null, RunKindEnum.Message, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                    messages.Add(await MessageAsync(host, sender, runs[i - 1], recipient, woke, true, token).ConfigureAwait(false));
                    runs.Add(woke);
                }
                RunTrail trail = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, runs[1].Id, null, token).ConfigureAwait(false);
                Assert.Equal(RunTrailTruncationEnum.HopCap, trail.Truncation, "The loop stops at the hop cap: " + Serializer.Serialize(trail));
                Assert.Equal(3, trail.HopCount, "Hops stop at RunTrail.MaxMessageHops");
                Assert.True(trail.Nodes.Select(n => n.Id).Distinct().Count() == trail.Nodes.Count, "Each record once");
                Assert.True(trail.Nodes.Any(n => n.Id == runs[3].Id) && !trail.Nodes.Any(n => n.Id == runs[4].Id), "Runs past the cap are left out");
                Assert.True(trail.Nodes.Count(n => n.Lane == x.Id) > 0 && trail.Nodes.Count(n => n.Lane == y.Id) > 0, "Two lanes");

                RunTrail fromEnd = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, runs[6].Id, null, token).ConfigureAwait(false);
                Assert.True(fromEnd.Truncation == RunTrailTruncationEnum.HopCap && fromEnd.Nodes.Any(n => n.IsFocus && n.Id == runs[6].Id), "Walking back from the far end stops at the hop cap and keeps the focus: " + Serializer.Serialize(fromEnd));
            }
        }

        private static async Task EscalationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-esc", token).ConfigureAwait(false);
                Run run = await RunAsync(host, agent, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Escalation escalation = new Escalation
                {
                    TenantId = host.TenantId, RaisingRunId = run.Id, AgentId = agent.Id, AgentName = agent.Name, Mode = EscalationModeEnum.Blocking,
                    Question = "SECRET-QUESTION", Status = EscalationStatusEnum.Answered, AnswerText = "SECRET-ANSWER", ResolvedBy = "ops@example.com",
                    ResolutionSource = EscalationResolutionSourceEnum.User, ResolvedUtc = DateTime.UtcNow.AddSeconds(5)
                };
                await host.Server.Context.Database.Escalations.CreateAsync(escalation, token).ConfigureAwait(false);
                RunTrail trail = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, run.Id, null, token).ConfigureAwait(false);
                string json = Serializer.Serialize(trail);
                RunTrailNode node = trail.Nodes.Single(n => n.Kind == RunTrailNodeKindEnum.Escalation);
                Assert.True(node.Id == escalation.Id && node.State == "Answered" && node.EndedUtc.HasValue && node.Lane == agent.Id, "Escalation node: " + json);
                Assert.True(Has(trail, run.Id, escalation.Id, RunTrailEdgeKindEnum.Raised) && Has(trail, escalation.Id, run.Id, RunTrailEdgeKindEnum.Answered), "Raised and Answered: " + json);
                Assert.True(!json.Contains("SECRET-", StringComparison.Ordinal), "No question or answer text");
            }
        }

        private static async Task KeeperTickAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "trail-keep", token).ConfigureAwait(false);
                MandateTick tick = await host.Server.Context.Database.MandateTicks.CreateAsync(new MandateTick { TenantId = host.TenantId, MandateId = "mdt_trail", Summary = "SECRET-SUMMARY", Outcome = TickOutcomeEnum.Acted, FinishedUtc = DateTime.UtcNow.AddSeconds(3) }, token).ConfigureAwait(false);
                Run run = OrganizationSuite.RunOf(host, f.Worker);
                run.Kind = RunKindEnum.Keeper;
                run.MandateId = "mdt_trail";
                run.MandateTickId = tick.Id;
                run.Status = RunStatusEnum.Succeeded;
                run.StartedUtc = DateTime.UtcNow;
                await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
                RunTrail trail = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, run.Id, null, token).ConfigureAwait(false);
                string json = Serializer.Serialize(trail);
                Assert.True(trail.OriginId == tick.Id && trail.Nodes[0].Kind == RunTrailNodeKindEnum.KeeperTick && trail.Nodes[0].State == "Acted", "The keeper tick is the origin: " + json);
                Assert.True(Has(trail, tick.Id, run.Id, RunTrailEdgeKindEnum.Started) && !trail.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Reply), "Started by the tick, no reply to a caller");
                RunTrailNode node = trail.Nodes.Single(n => n.Id == run.Id);
                Assert.True(node.UnitId == f.Ops.Id && node.UnitName == f.Ops.Name && node.RunKind == RunKindEnum.Keeper, "Unit from the live organization: " + json);
                Assert.True(!json.Contains("SECRET-SUMMARY", StringComparison.Ordinal), "No tick summary text");
            }
        }

        private static async Task ApprovalAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-approval", token).ConfigureAwait(false);
                Run run = await RunAsync(host, agent, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Approval approval = NewApproval(host, agent, run);
                approval.Status = ApprovalStatusEnum.Approved;
                approval.Decision = ApprovalDecisionEnum.Allow;
                approval.DecidedUtc = DateTime.UtcNow.AddSeconds(4);
                approval.InputPreview = "SECRET-ARGUMENTS";
                await host.Server.Context.Database.Approvals.CreateAsync(approval, token).ConfigureAwait(false);
                RunTrail trail = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, run.Id, null, token).ConfigureAwait(false);
                string json = Serializer.Serialize(trail);
                RunTrailNode node = trail.Nodes.Single(n => n.Kind == RunTrailNodeKindEnum.Approval);
                Assert.True(node.Id == approval.Id && node.State == "Approved" && node.DurationMs >= 3000, "Approval node: " + json);
                Assert.True(Has(trail, run.Id, approval.Id, RunTrailEdgeKindEnum.Requested) && Has(trail, approval.Id, run.Id, RunTrailEdgeKindEnum.Decided), "Requested and Decided: " + json);
                Assert.True(!json.Contains("SECRET-ARGUMENTS", StringComparison.Ordinal), "No tool arguments");
            }
        }

        private static async Task EffectsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-effects", token).ConfigureAwait(false);
                Run run = await LeasedRunAsync(host, agent, token).ConfigureAwait(false);
                EffectOperation effect = new EffectOperation { TenantId = host.TenantId, RunId = run.Id, LeaseEpoch = run.LeaseEpoch, Tool = "garrison_file_report", ArgumentDigest = "SECRETDIGEST" };
                Assert.True(await host.Server.Context.Database.EffectOperations.AuthorizeAsync(effect, token).ConfigureAwait(false), "Effect recorded");
                TestResponse with = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/trail", null, token).ConfigureAwait(false);
                RunTrail on = Serializer.Deserialize<RunTrail>(with.Body)!;
                RunTrailNode node = on.Nodes.Single(n => n.Kind == RunTrailNodeKindEnum.Effect);
                Assert.True(node.Id == effect.Id && node.ToolName == "garrison_file_report" && node.State == "Authorized" && node.Lane == agent.Id && Has(on, run.Id, effect.Id, RunTrailEdgeKindEnum.Performed), "Effect node: " + with.Body);
                Assert.True(!with.Body.Contains("SECRETDIGEST", StringComparison.Ordinal), "No argument digest");
                Assert.True(!on.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Reply), "A running run has no reply yet");
                RunTrail off = await HttpTestHelpers.SendAsync<RunTrail>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/trail?includeEffects=false", null, 200, token).ConfigureAwait(false);
                Assert.True(!off.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Effect), "includeEffects=false leaves effects out");
                host.Server.Context.Get<RunTrailSettings>().IncludeEffects = false;
                RunTrail byDefault = await HttpTestHelpers.SendAsync<RunTrail>(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/trail", null, 200, token).ConfigureAwait(false);
                Assert.True(!byDefault.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Effect), "RunTrail.IncludeEffects false is the default when the request does not say");
            }
        }

        private static async Task NodeCapAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                host.Server.Context.Get<RunTrailSettings>().MaxNodes = 10;
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-cap", token).ConfigureAwait(false);
                Run parent = await RunAsync(host, agent, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Run last = parent;
                for (int i = 0; i < 15; i++) last = await RunAsync(host, agent, parent, RunKindEnum.Delegated, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                RunTrail trail = await host.Server.Context.Get<RunTrailService>().BuildAsync(OrganizationSuite.Admin(host), host.TenantId, last.Id, null, token).ConfigureAwait(false);
                Assert.Equal(RunTrailTruncationEnum.NodeCap, trail.Truncation, "Truncated at the node cap");
                Assert.True(trail.NodeCount <= 11 && trail.NodeCount == trail.Nodes.Count, "At most the cap plus the focus: " + trail.NodeCount);
                Assert.True(trail.Nodes.Any(n => n.IsFocus && n.Id == last.Id), "The focus run is always shown");
                Assert.True(trail.Edges.All(e => trail.Nodes.Any(n => n.Id == e.FromId) && trail.Nodes.Any(n => n.Id == e.ToId)), "Every edge names two nodes");
            }
        }

        private static async Task RedactionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = T(host);
                Agent a = await OrganizationSuite.AgentAsync(host, "trail-red-a", token).ConfigureAwait(false);
                Agent b = await OrganizationSuite.AgentAsync(host, "trail-red-b", token).ConfigureAwait(false);
                Run runA = await RunAsync(host, a, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Run runB = await RunAsync(host, b, null, RunKindEnum.Message, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                AgentMessage message = await MessageAsync(host, a, runA, b, runB, true, token).ConfigureAwait(false);

                Permission readRuns = await HttpTestHelpers.SendAsync<Permission>(host.AdminClient, HttpMethod.Post, t + "/permissions", new PermissionRequest { Name = "Trail run reader", ResourceTypes = new List<string> { "Run" }, OperationTypes = new List<string> { "Read" } }, 201, token).ConfigureAwait(false);
                Role role = await HttpTestHelpers.SendAsync<Role>(host.AdminClient, HttpMethod.Post, t + "/roles", new RoleRequest { Name = "TrailRunReader" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<RolePermissionMap>(host.AdminClient, HttpMethod.Post, t + "/role-permissions", new RolePermissionRequest { RoleId = role.Id, PermissionId = readRuns.Id }, 201, token).ConfigureAwait(false);
                await KeeperSuite.UserAsync(host, "trail-reader@example.com", "TrailRunReader", token).ConfigureAwait(false);
                using (HttpClient reader = await host.UserClientAsync("trail-reader@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    TestResponse response = await HttpTestHelpers.SendAsync(reader, HttpMethod.Get, t + "/runs/" + runB.Id + "/trail", null, token).ConfigureAwait(false);
                    Assert.Equal(200, response.StatusCode, "A run reader reads the trail: " + response.Body);
                    RunTrail trail = Serializer.Deserialize<RunTrail>(response.Body)!;
                    Assert.True(!response.Body.Contains(message.Id, StringComparison.Ordinal), "The message identifier is not revealed: " + response.Body);
                    RunTrailNode hidden = trail.Nodes.Single(n => n.Kind == RunTrailNodeKindEnum.Redacted);
                    Assert.True(hidden.RedactedKind == RunTrailNodeKindEnum.Message && hidden.Id.StartsWith("red_", StringComparison.Ordinal) && hidden.StartedUtc.HasValue && hidden.AgentId == null && hidden.State == null, "A placeholder with kind and time only: " + response.Body);
                    Assert.True(Has(trail, runA.Id, hidden.Id, RunTrailEdgeKindEnum.Sent) && Has(trail, hidden.Id, runB.Id, RunTrailEdgeKindEnum.Woke), "The chain keeps its shape through the placeholder");
                    Assert.True(trail.Nodes.Any(n => n.Id == runA.Id && n.Kind == RunTrailNodeKindEnum.Run), "Runs the reader may read stay");
                }
                RunTrail admin = await HttpTestHelpers.SendAsync<RunTrail>(host.AdminClient, HttpMethod.Get, t + "/runs/" + runB.Id + "/trail", null, 200, token).ConfigureAwait(false);
                Assert.True(admin.Nodes.Any(n => n.Id == message.Id) && !admin.Nodes.Any(n => n.Kind == RunTrailNodeKindEnum.Redacted), "An administrator sees the message");
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-routes", token).ConfigureAwait(false);
                Run run = await RunAsync(host, agent, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/run_missing/trail", null, token).ConfigureAwait(false)).StatusCode, "A missing run answers 404");
                Run foreign = OrganizationSuite.RunOf(host, agent);
                foreign.TenantId = "ten_elsewhere";
                await host.Server.Context.Database.Runs.CreateAsync(foreign, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + foreign.Id + "/trail", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's run answers 404");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/trail?includeEffects=maybe", null, token).ConfigureAwait(false)).StatusCode, "A bad includeEffects answers 400");

                Run live = await LeasedRunAsync(host, agent, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(live, live.LeaseEpoch, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (HttpClient runClient = new HttpClient { BaseAddress = new Uri(host.BaseUrl) })
                {
                    runClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
                    TestResponse own = await HttpTestHelpers.SendAsync(runClient, HttpMethod.Get, T(host) + "/runs/" + live.Id + "/trail", null, token).ConfigureAwait(false);
                    Assert.True(own.StatusCode == 403 && own.Body.Contains("RunTokenTrailNotAllowed", StringComparison.Ordinal), "A run token gets 403 even for its own run: " + own.StatusCode + " " + own.Body);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(runClient, HttpMethod.Get, T(host) + "/runs/" + run.Id + "/trail", null, token).ConfigureAwait(false)).StatusCode, "And for another run");
                }
                Garrison.Server.Routes.OperationScope? scope = host.Server.Context.Scopes.Find("GET", "/v1.0/api/tenants/{tenantId}/runs/{id}/trail");
                Assert.True(scope != null && scope.ResourceType == ResourceTypeEnum.Run && scope.Operation == OperationTypeEnum.Read, "The trail route is in the scope map as Run Read");
                Garrison.Server.Routes.OperationScope? validate = host.Server.Context.Scopes.Find("POST", "/v1.0/api/tenants/{tenantId}/organizations/{id}/validate");
                Assert.True(validate != null && validate.ResourceType == ResourceTypeEnum.Organization && validate.Operation == OperationTypeEnum.Read, "The validate route is in the scope map as Organization Read");
                string? code = null;
                try
                {
                    await host.Server.Context.Get<RunTrailService>().BuildAsync(new RequestContext { TenantId = host.TenantId, PrincipalType = PrincipalTypeEnum.Run, RunId = live.Id }, host.TenantId, live.Id, null, token).ConfigureAwait(false);
                }
                catch (Garrison.Core.Services.AppAccessException e)
                {
                    code = e.Code;
                }
                Assert.Equal("RunTokenTrailNotAllowed", code, "The service refuses a run past the route");
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await OrganizationSuite.AgentAsync(host, "trail-mcp", token).ConfigureAwait(false);
                Run run = await RunAsync(host, agent, null, RunKindEnum.Invoke, RunStatusEnum.Succeeded, token).ConfigureAwait(false);
                Assert.True(host.Server.Context.Scopes.Find("MCP", "garrison_get_run_trail") != null, "The tool scope is registered");
                using (TestMcpClient person = new TestMcpClient())
                {
                    await person.ConnectAsync(host, null, token).ConfigureAwait(false);
                    ProviderToolPage tools = await person.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(tools.Tools.Any(t => t.Name == "garrison_get_run_trail"), "Listed for a person");
                    ProviderToolResult result = await person.CallResultAsync("garrison_get_run_trail", new { runId = run.Id, includeEffects = false }, token).ConfigureAwait(false);
                    Assert.True(!result.IsError && result.StructuredContent != null && result.StructuredContent.ContainsKey("nodes"), "The trail comes back as structured content");
                    RunTrail trail = await person.CallAsync<RunTrail>("garrison_get_run_trail", new { runId = run.Id }, token).ConfigureAwait(false);
                    Assert.True(trail.FocusRunId == run.Id && trail.Nodes.Any(n => n.Id == run.Id && n.IsFocus), "The tool returns the trail");
                    await person.ExpectErrorAsync("garrison_get_run_trail", new { runId = "run_missing" }, "NotFound", token).ConfigureAwait(false);
                }
                Run live = await LeasedRunAsync(host, agent, token).ConfigureAwait(false);
                using (TestMcpClient runClient = await OrganizationSuite.RunClientAsync(host, live, token).ConfigureAwait(false))
                {
                    ProviderToolPage tools = await runClient.ToolsAsync(token).ConfigureAwait(false);
                    Assert.True(!tools.Tools.Any(t => t.Name == "garrison_get_run_trail"), "Hidden from a run token");
                    await runClient.ExpectErrorAsync("garrison_get_run_trail", new { runId = live.Id }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task OrgValidateAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OrgFixture f = await OrganizationSuite.FixtureAsync(host, "trail-val", token).ConfigureAwait(false);
                string path = T(host) + "/organizations/" + f.Org.Id + "/validate";
                OrganizationValidationResult clean = await HttpTestHelpers.SendAsync<OrganizationValidationResult>(host.AdminClient, HttpMethod.Post, path, null, 200, token).ConfigureAwait(false);
                Assert.True(clean.Valid && clean.Problems.Count == 0, "The published fixture validates clean: " + Serializer.Serialize(clean));

                OrganizationService service = host.Server.Context.Get<OrganizationService>();
                RequestContext admin = OrganizationSuite.Admin(host);
                OrgUnit empty = await service.CreateUnitAsync(admin, f.Org, new OrgUnit { Name = "trail-val-empty", ParentUnitId = f.Root.Id }, token).ConfigureAwait(false);
                Deployment deployment = await OrganizationSuite.DeploymentAsync(host, f.Stranger, token).ConfigureAwait(false);
                Mandate mandate = await OrganizationSuite.MandateAsync(host, "trail-val-keeper", f.Stranger, deployment, "Watch the queue.", token).ConfigureAwait(false);
                OrgUnit keepers = await service.CreateUnitAsync(admin, f.Org, new OrgUnit { Name = "trail-val-keepers", ParentUnitId = f.Root.Id, LeadAgentId = f.Stranger.Id, LeadMandateId = mandate.Id }, token).ConfigureAwait(false);
                deployment.Active = false;
                await host.Server.Context.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);

                OrganizationValidationResult warned = await HttpTestHelpers.SendAsync<OrganizationValidationResult>(host.AdminClient, HttpMethod.Post, path, null, 200, token).ConfigureAwait(false);
                string json = Serializer.Serialize(warned);
                Assert.True(warned.Valid, "Warnings alone keep the tree valid: " + json);
                Assert.True(warned.Problems.Any(p => p.Code == OrganizationValidationProblemCodeEnum.UnitWithoutLead && p.UnitId == empty.Id && p.Severity == OrganizationValidationSeverityEnum.Warning), "Unit without a lead: " + json);
                Assert.True(warned.Problems.Any(p => p.Code == OrganizationValidationProblemCodeEnum.KeeperDeploymentMissing && p.UnitId == keepers.Id && p.MandateId == mandate.Id && p.AgentId == f.Stranger.Id), "Keeper whose deployment is inactive: " + json);
                TestResponse raw = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, path, null, token).ConfigureAwait(false);
                Assert.True(raw.Body.Contains("\"valid\":true", StringComparison.Ordinal) && raw.Body.Contains("\"code\":\"UnitWithoutLead\"", StringComparison.Ordinal) && raw.Body.Contains("\"severity\":\"Warning\"", StringComparison.Ordinal), "The JSON carries valid, code, and severity as strings: " + raw.Body);

                f.Seller.Active = false;
                await host.Server.Context.Database.Agents.UpdateAsync(f.Seller, token).ConfigureAwait(false);
                OrganizationValidationResult broken = await HttpTestHelpers.SendAsync<OrganizationValidationResult>(host.AdminClient, HttpMethod.Post, path, null, 200, token).ConfigureAwait(false);
                Assert.True(!broken.Valid && broken.Problems.Any(p => p.Code == OrganizationValidationProblemCodeEnum.AgentInactive && p.AgentId == f.Seller.Id && p.UnitId == f.Sales.Id && p.Severity == OrganizationValidationSeverityEnum.Error), "An inactive lead is an error: " + Serializer.Serialize(broken));
                Assert.Equal(f.Org.CurrentRevisionId, (await host.Server.Context.Database.Organizations.ReadAsync(host.TenantId, f.Org.Id, token).ConfigureAwait(false))!.CurrentRevisionId, "Validation publishes nothing");

                await KeeperSuite.UserAsync(host, "trail-val-viewer@example.com", "Viewer", token).ConfigureAwait(false);
                using (HttpClient viewer = await host.UserClientAsync("trail-val-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(viewer, HttpMethod.Post, path, null, token).ConfigureAwait(false)).StatusCode, "A viewer may validate (Organization Read)");
                }
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/ten_elsewhere/organizations/" + f.Org.Id + "/validate", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's path does not reach the organization");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/organizations/org_missing/validate", null, token).ConfigureAwait(false)).StatusCode, "A missing organization answers 404");
            }
        }

        private static async Task<Run> RunAsync(TestServerHost host, Agent agent, Run? parent, RunKindEnum kind, RunStatusEnum status, CancellationToken token)
        {
            Run run = parent == null ? OrganizationSuite.RunOf(host, agent) : ChildOf(host, agent, parent);
            run.Kind = kind;
            run.Status = status;
            run.CallerType = parent == null ? PrincipalTypeEnum.User : PrincipalTypeEnum.Run;
            run.CallerId = parent == null ? "usr_trail" : parent.Id;
            run.CallerName = parent == null ? "trail@example.com" : parent.AgentName;
            run.StartedUtc = DateTime.UtcNow;
            if (status != RunStatusEnum.Running) run.CompletedUtc = DateTime.UtcNow.AddMilliseconds(500);
            await Task.Delay(5, token).ConfigureAwait(false);
            return await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
        }

        private static Run ChildOf(TestServerHost host, Agent agent, Run parent)
        {
            Run run = OrganizationSuite.RunOf(host, agent);
            run.Kind = RunKindEnum.Delegated;
            run.ParentRunId = parent.Id;
            run.RootRunId = parent.RootRunId ?? parent.Id;
            run.Depth = parent.Depth + 1;
            run.StartedUtc = DateTime.UtcNow;
            return run;
        }

        private static async Task<Run> LeasedRunAsync(TestServerHost host, Agent agent, CancellationToken token)
        {
            Deployment deployment = await OrganizationSuite.DeploymentAsync(host, agent, token).ConfigureAwait(false);
            Run run = OrganizationSuite.RunOf(host, agent);
            run.DeploymentId = deployment.Id;
            run.CallerType = PrincipalTypeEnum.User;
            run.CallerId = "usr_trail";
            run.LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5);
            run.StartedUtc = DateTime.UtcNow;
            return await host.Server.Context.Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
        }

        private static async Task<AgentMessage> MessageAsync(TestServerHost host, Agent sender, Run senderRun, Agent recipient, Run delivered, bool woke, CancellationToken token)
        {
            AgentMessage message = new AgentMessage();
            message.TenantId = host.TenantId;
            message.SenderAgentId = sender.Id;
            message.SenderAgentName = sender.Name;
            message.SenderRunId = senderRun.Id;
            message.SenderPrincipalType = PrincipalTypeEnum.Run;
            message.SenderPrincipalId = senderRun.Id;
            message.RecipientAgentId = recipient.Id;
            message.RecipientAgentName = recipient.Name;
            message.Subject = "Hand-off";
            message.Body = "SECRET-BODY";
            message.Status = MessageStatusEnum.Delivered;
            message.WokeRecipient = woke;
            message.DeliveredRunId = delivered.Id;
            message.DeliveredUtc = DateTime.UtcNow;
            return await host.Server.Context.Database.AgentMessages.CreateAsync(message, token).ConfigureAwait(false);
        }

        private static Approval NewApproval(TestServerHost host, Agent agent, Run run)
        {
            Approval approval = new Approval();
            approval.TenantId = host.TenantId;
            approval.RunId = run.Id;
            approval.RootRunId = run.RootRunId ?? run.Id;
            approval.AgentId = agent.Id;
            approval.AgentName = agent.Name;
            approval.DeploymentId = "dep_trail";
            approval.ToolName = "Bash";
            approval.RequestedUtc = DateTime.UtcNow;
            return approval;
        }

        private static OrgUnit Unit(string id, string name, string? parentId, string? leadAgentId)
        {
            return new OrgUnit { Id = id, TenantId = "ten_inspect", OrganizationId = "org_inspect", Name = name, ParentUnitId = parentId, LeadAgentId = leadAgentId };
        }

        private static bool Has(RunTrail trail, string fromId, string toId, RunTrailEdgeKindEnum kind)
        {
            return trail.Edges.Any(e => e.FromId == fromId && e.ToId == toId && e.Kind == kind);
        }

        private static List<RunTrailEdgeKindEnum> Kinds(RunTrail trail)
        {
            return trail.Edges.Select(e => e.Kind).ToList();
        }

        private static List<Dictionary<string, object?>> Objects(object? list)
        {
            List<Dictionary<string, object?>> result = new List<Dictionary<string, object?>>();
            if (list is not List<object?> items) return result;
            foreach (object? item in items)
            {
                if (item is Dictionary<string, object?> map) result.Add(map);
            }
            return result;
        }

        private static HashSet<string> KeysOf(object? list)
        {
            HashSet<string> keys = new HashSet<string>(StringComparer.Ordinal);
            foreach (Dictionary<string, object?> map in Objects(list))
            {
                foreach (string key in map.Keys) keys.Add(key);
            }
            return keys;
        }

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        #endregion
    }
}
