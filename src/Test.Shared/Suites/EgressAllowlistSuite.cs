namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Kubernetes;
    using Garrison.Worker.Settings;
    using k8s.Models;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Per-deployment egress allowlists (P11.15, D-052): validation, persistence, manifests, admission (EgressControl and
    /// Container isolation), claims only by egress-capable workers, the NoIsolatingWorker blocked reason, the worker's
    /// refusal to run an allowlisted spec without enforcement, the per-run NetworkPolicy and labels, the shared policy
    /// audit, and reconciliation of orphaned policies.
    /// </summary>
    public static class EgressAllowlistSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("egress-allowlist", "cidr", "CIDR validation: IPv4 and IPv6 network addresses pass; host names, missing prefixes, host bits, leading zeros, mapped IPv6, zone IDs, and bad prefixes fail", CidrAsync),
                new TestCaseDescriptor("egress-allowlist", "effective-requirement", "Admission: egress rules require EgressControl and at least Container isolation, an unset or Process-pool executor resolves to KubernetesJob, and no rules leave placement unchanged", EffectiveRequirementAsync),
                new TestCaseDescriptor("egress-allowlist", "blocked-reason", "Blocked reason: an allowlisted run with only Process workers, or KubernetesJob workers without egress control, is NoIsolatingWorker and the text names egress control", BlockedReasonAsync),
                new TestCaseDescriptor("egress-allowlist", "network-policy", "NetworkPolicy: name, namespace, owner, labels, pod selector, Egress only, DNS, the server MCP rule (cross-namespace when needed), and each rule with port and protocol, ports serialized as numbers", NetworkPolicyAsync),
                new TestCaseDescriptor("egress-allowlist", "pod-labels", "Labels: allowlisted Jobs and pods carry garrison.io/egress=allowlist, other runs never do, and PodLabels cannot set or clear it", PodLabelsAsync),
                new TestCaseDescriptor("egress-allowlist", "policy-audit", "Audit: the old single garrison-run policy and an allow-all rule widen allowlisted pods; the split policies, worker-owned per-run policies, and other apps' policies do not", PolicyAuditAsync),
                new TestCaseDescriptor("egress-allowlist", "worker-refusal", "Worker: a Process spec with egress rules fails NoCapableWorker without executing, warm pods never take allowlisted runs, and only KubernetesJob reports EgressControl", WorkerRefusalAsync),
                new TestCaseDescriptor("egress-allowlist", "reconcile-policies", "Reconciliation: per-run policies of runs or epochs not held are orphans", ReconcilePoliciesAsync),
                new TestCaseDescriptor("egress-allowlist", "settings", "Settings: EgressAllowlists is off by default and read from GARRISON_WORKER_RUN_EGRESS_ALLOWLISTS with the MCP port and server namespace", SettingsAsync)
            };
            suites.Add(new TestSuiteDescriptor("egress-allowlist", "Deployment egress allowlists", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "egress-allowlist-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "persistence", "Egress rules round-trip in order with optional ports and protocols through create, update, and delete (" + provider + ")", ct => PersistenceAsync(provider, ct)),
                    new TestCaseDescriptor(id, "rest", "REST create, read, and update carry egressRules; bad CIDR, port, rule count, Process executor, and Warm startup are 400 with field codes; changes are audited (" + provider + ")", ct => RestAsync(provider, ct)),
                    new TestCaseDescriptor(id, "manifests", "Manifests apply, export, and re-apply egressRules unchanged; a bad CIDR fails the item with InvalidCidr on its field (" + provider + ")", ct => ManifestsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "mcp-management", "MCP management create, read, and update carry egressRules and reject an invalid rule (" + provider + ")", ct => McpManagementAsync(provider, ct)),
                    new TestCaseDescriptor(id, "claim", "Candidate selection and the atomic claim refuse a KubernetesJob node without egress control and accept one with it (" + provider + ")", ct => ClaimAsync(provider, ct)),
                    new TestCaseDescriptor(id, "late-rules", "A run admitted for Process before its deployment gained egress rules fails at lease with CompileFailed (ExecutorMismatch) instead of running unenforced (" + provider + ")", ct => LateRulesAsync(provider, ct)),
                    new TestCaseDescriptor(id, "queue-until-enforced", "An allowlisted run queues with NoIsolatingWorker on a Process fleet and on a KubernetesJob node without egress control, then is leased to an egress-capable node with the rules in its spec (" + provider + ")", ct => QueueUntilEnforcedAsync(provider, ct))
                };
                suites.Add(new TestSuiteDescriptor(id, "Deployment egress allowlists (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task CidrAsync(CancellationToken token)
        {
            foreach (string good in new[] { "203.0.113.0/24", "198.51.100.7/32", "0.0.0.0/0", "10.0.0.0/8", "2001:db8::/32", "::/0", "2001:db8:0:0::/64", " 192.0.2.0/24 " })
                Assert.True(CidrNotation.IsValid(good, out string? error), good + " is valid: " + error);
            foreach (string bad in new[] { "", "api.openai.com", "203.0.113.0", "203.0.113.5/24", "010.0.0.0/8", "10.0.0/8", "203.0.113.0/33", "203.0.113.0/-1", "203.0.113.0/024", "2001:db8::/129", "::ffff:192.0.2.0/120", "fe80::%eth0/64", "203.0.113.0/24/8", "203.0.113.0/" })
                Assert.True(!CidrNotation.IsValid(bad, out string? _), "'" + bad + "' is invalid");
            CidrNotation.IsValid("203.0.113.5/24", out string? hostBits);
            Assert.True((hostBits ?? String.Empty).Contains("203.0.113.0/24", StringComparison.Ordinal), "The error suggests the network address: " + hostBits);

            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            List<DeploymentEgressRule> rules = new List<DeploymentEgressRule>
            {
                new DeploymentEgressRule { Cidr = "nope" },
                new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 0 },
                new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 65536 },
                new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 65535, Protocol = EgressProtocolEnum.UDP },
                new DeploymentEgressRule { Cidr = "203.0.113.0/24", Protocol = (EgressProtocolEnum)9 }
            };
            ConfigurationValidator.EgressRules(rules, errors, codes);
            Assert.Equal("InvalidCidr", codes["egressRules[0].cidr"], "Bad CIDR code");
            Assert.Equal("PortOutOfRange", codes["egressRules[1].port"], "Port 0 code");
            Assert.Equal("PortOutOfRange", codes["egressRules[2].port"], "Port 65536 code");
            Assert.True(!errors.Keys.Any(k => k.StartsWith("egressRules[3]", StringComparison.Ordinal)), "Port 65535 over UDP is valid");
            Assert.Equal("InvalidProtocol", codes["egressRules[4].protocol"], "Unknown protocol code");

            List<DeploymentEgressRule> many = Enumerable.Range(0, Deployment.MaxEgressRules + 1).Select(i => new DeploymentEgressRule { Cidr = "10." + i + ".0.0/16" }).ToList();
            Dictionary<string, string> manyErrors = new Dictionary<string, string>();
            Dictionary<string, string> manyCodes = new Dictionary<string, string>();
            ConfigurationValidator.EgressRules(many, manyErrors, manyCodes);
            Assert.Equal("TooManyEgressRules", manyCodes["egressRules"], "Rule count code");
            Dictionary<string, string> capErrors = new Dictionary<string, string>();
            ConfigurationValidator.EgressRules(many.Take(Deployment.MaxEgressRules).ToList(), capErrors, new Dictionary<string, string>());
            Assert.Equal(0, capErrors.Count, "Exactly " + Deployment.MaxEgressRules + " rules are accepted");
            return Task.CompletedTask;
        }

        private static Task EffectiveRequirementAsync(CancellationToken token)
        {
            Deployment plain = new Deployment();
            ExecutorRequirements none = ExecutorCapabilityRules.Effective(plain);
            Assert.True(!none.EgressControl && none.Isolation == ExecutorIsolationEnum.Process, "No rules: placement unchanged");
            Assert.Equal(RunExecutorEnum.Process, RunExecutors.Resolve(plain, null), "No rules: Process as before");

            Deployment allowlisted = Allowlisted();
            ExecutorRequirements effective = ExecutorCapabilityRules.Effective(allowlisted);
            Assert.True(effective.EgressControl && effective.Isolation == ExecutorIsolationEnum.Container, "Rules require EgressControl and Container isolation");
            Assert.True(!allowlisted.RequiredCapabilities.EgressControl, "The deployment's stored requirement is not changed");
            allowlisted.RequiredCapabilities.Isolation = ExecutorIsolationEnum.SandboxedRuntime;
            Assert.Equal(ExecutorIsolationEnum.SandboxedRuntime, ExecutorCapabilityRules.Effective(allowlisted).Isolation, "A stronger isolation is kept");

            NodePool processPool = new NodePool { Name = "process-pool", DefaultExecutor = RunExecutorEnum.Process };
            Assert.Equal(RunExecutorEnum.KubernetesJob, RunExecutors.Resolve(Allowlisted(), null), "Unset executor resolves to KubernetesJob");
            Assert.Equal(RunExecutorEnum.KubernetesJob, RunExecutors.Resolve(Allowlisted(), processPool), "A Process pool default is not used");

            Run run = new Run();
            Deployment admitted = Allowlisted();
            ExecutorCapabilityRules.Admit(run, admitted, null);
            Assert.True(run.Executor == RunExecutorEnum.KubernetesJob && run.RequiredCapabilities.EgressControl && run.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Container, "Admission stores the effective requirement");
            Assert.True(ExecutorCapabilityRules.RequiresReport(run.RequiredCapabilities), "The requirement needs a capability report");
            admitted.EgressRules.Clear();
            Assert.True(run.RequiredCapabilities.EgressControl, "Admitted requirements do not follow deployment edits");

            Node egressNode = NewNode("egress", true, RunExecutorEnum.KubernetesJob);
            Node plainK8s = NewNode("plain", false, RunExecutorEnum.KubernetesJob);
            Assert.True(ExecutorCapabilityRules.Isolates(egressNode, run) && ExecutorCapabilityRules.Supports(egressNode, run), "An egress-capable KubernetesJob node isolates and supports the run");
            Assert.True(!ExecutorCapabilityRules.Isolates(plainK8s, run) && !ExecutorCapabilityRules.Supports(plainK8s, run), "Container isolation alone is not enough");
            return Task.CompletedTask;
        }

        private static Task BlockedReasonAsync(CancellationToken token)
        {
            Run run = NewRun("ten_egress", Allowlisted());
            PlacementSnapshot processOnly = new PlacementSnapshot();
            processOnly.ReadyNodes.Add(NewNode("process", false, RunExecutorEnum.Process));
            Assert.Equal(RunBlockedReasonEnum.NoIsolatingWorker, BlockedRunService.Evaluate(processOnly, run), "Process-only fleet");
            string describe = BlockedRunService.Describe(run, RunBlockedReasonEnum.NoIsolatingWorker);
            Assert.True(describe.Contains("egress control", StringComparison.Ordinal) && describe.Contains("egress allowlist", StringComparison.Ordinal) && !describe.Contains("Untrusted", StringComparison.Ordinal), "Description names egress control for a Trusted run: " + describe);
            Assert.True(BlockedRunService.Cause(run, RunBlockedReasonEnum.NoIsolatingWorker).Contains("egress control", StringComparison.Ordinal), "Cause names egress control");

            PlacementSnapshot noEgress = new PlacementSnapshot();
            noEgress.ReadyNodes.Add(NewNode("k8s-plain", false, RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob));
            Assert.Equal(RunBlockedReasonEnum.NoIsolatingWorker, BlockedRunService.Evaluate(noEgress, run), "KubernetesJob without egress control");
            noEgress.ReadyNodes.Add(NewNode("k8s-egress", true, RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob));
            Assert.True(BlockedRunService.Evaluate(noEgress, run) == null, "An egress-capable worker takes the run");

            Deployment both = Allowlisted();
            both.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
            Run untrusted = NewRun("ten_egress", both);
            string text = BlockedRunService.Describe(untrusted, RunBlockedReasonEnum.NoIsolatingWorker);
            Assert.True(text.Contains("Untrusted", StringComparison.Ordinal) && text.Contains("egress control", StringComparison.Ordinal), "Both reasons are named: " + text);
            Run trustedPlain = NewRun("ten_egress", new Deployment { TrustLevel = DeploymentTrustLevelEnum.Untrusted });
            Assert.True(!BlockedRunService.Describe(trustedPlain, RunBlockedReasonEnum.NoIsolatingWorker).Contains("egress", StringComparison.Ordinal), "Untrusted without rules keeps the isolation text");
            return Task.CompletedTask;
        }

        private static Task NetworkPolicyAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            RunPodRequest request = Request(r =>
            {
                r.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
                r.EgressRules.Add(new DeploymentEgressRule { Cidr = "2001:db8::/32", Port = 53, Protocol = EgressProtocolEnum.UDP });
                r.EgressRules.Add(new DeploymentEgressRule { Cidr = "198.51.100.7/32" });
            });
            V1Job job = builder.BuildJob(request);
            job.Metadata.Uid = "uid-job-1";
            V1NetworkPolicy policy = builder.BuildNetworkPolicy(request, job, "garrison");
            string jobName = RunPodNames.JobName("run_ABCdef123_xyz", 7);

            Assert.Equal(jobName + "-egress", policy.Metadata.Name, "Name from the Job");
            Assert.Equal("garrison", policy.Metadata.NamespaceProperty, "Run namespace");
            Assert.True(policy.Metadata.OwnerReferences != null && policy.Metadata.OwnerReferences.Count == 1 && policy.Metadata.OwnerReferences[0].Kind == "Job" && policy.Metadata.OwnerReferences[0].Uid == "uid-job-1" && policy.Metadata.OwnerReferences[0].Name == jobName, "Owned by the Job");
            Assert.Equal("allowlist", policy.Metadata.Labels[RunPodNames.EgressLabel], "Policy carries the run labels");
            Assert.Equal("garrison-worker-0", policy.Metadata.Labels[RunPodNames.WorkerLabel], "Worker label for reconciliation");
            Assert.Equal("run_ABCdef123_xyz", policy.Metadata.Annotations["garrison.io/run-id"], "Run ID annotation");

            IDictionary<string, string> selector = policy.Spec.PodSelector.MatchLabels;
            Assert.Equal(4, selector.Count, "Selector keys: " + String.Join(",", selector.Keys));
            Assert.Equal("garrison-run", selector["app.kubernetes.io/name"], "Selects run pods");
            Assert.Equal("run_ABCdef123_xyz", selector[RunPodNames.RunIdLabel], "Selects this run");
            Assert.Equal("7", selector[RunPodNames.EpochLabel], "Selects this epoch");
            Assert.Equal("allowlist", selector[RunPodNames.EgressLabel], "Selects only allowlisted pods");
            Assert.True(policy.Spec.PodSelector.MatchExpressions == null, "No expressions");
            V1Pod pod = new V1Pod { Metadata = job.Spec.Template.Metadata };
            Assert.True(selector.All(l => pod.Metadata.Labels.TryGetValue(l.Key, out string? v) && v == l.Value), "The selector matches the Job's pod template");
            Assert.Equal("Egress", String.Join(",", policy.Spec.PolicyTypes), "Egress only");
            Assert.True(policy.Spec.Ingress == null, "No ingress rules (garrison-run already denies ingress)");

            IList<V1NetworkPolicyEgressRule> egress = policy.Spec.Egress;
            Assert.Equal(5, egress.Count, "DNS, MCP, and three rules");
            V1NetworkPolicyEgressRule dns = egress[0];
            Assert.True(dns.To.Count == 1 && dns.To[0].NamespaceSelector != null && dns.To[0].IpBlock == null && dns.To[0].PodSelector == null, "DNS to any namespace");
            Assert.Equal("53/UDP,53/TCP", String.Join(",", dns.Ports.Select(p => p.Port.Value + "/" + p.Protocol)), "DNS ports");
            V1NetworkPolicyEgressRule mcp = egress[1];
            Assert.True(mcp.To.Count == 1 && mcp.To[0].PodSelector.MatchLabels["app.kubernetes.io/name"] == "garrison-server" && mcp.To[0].NamespaceSelector == null, "Server pods in the same namespace");
            Assert.Equal("8701/TCP", String.Join(",", mcp.Ports.Select(p => p.Port.Value + "/" + p.Protocol)), "MCP port");
            Assert.True(egress[2].To[0].IpBlock.Cidr == "203.0.113.0/24" && egress[2].Ports[0].Port.Value == "443" && egress[2].Ports[0].Protocol == "TCP", "Rule 1");
            Assert.True(egress[3].To[0].IpBlock.Cidr == "2001:db8::/32" && egress[3].Ports[0].Port.Value == "53" && egress[3].Ports[0].Protocol == "UDP", "Rule 2");
            Assert.True(egress[4].To[0].IpBlock.Cidr == "198.51.100.7/32" && egress[4].Ports[0].Port == null && egress[4].Ports[0].Protocol == "TCP", "Rule 3 has every port");
            Assert.True(egress.Skip(2).All(r => r.To.Count == 1 && r.To[0].IpBlock.Except == null), "No except lists");

            string json = k8s.KubernetesJson.Serialize(policy);
            Assert.True(json.Contains("\"port\":443", StringComparison.Ordinal) && json.Contains("\"port\":8701", StringComparison.Ordinal) && !json.Contains("\"port\":\"443\"", StringComparison.Ordinal), "Ports serialize as numbers: " + json);

            settings.ServerMcpPort = 9701;
            request.Namespace = "garrison-runs";
            V1NetworkPolicy cross = new RunPodManifestBuilder(settings).BuildNetworkPolicy(request, null, "garrison");
            V1NetworkPolicyPeer server = cross.Spec.Egress[1].To[0];
            Assert.True(server.NamespaceSelector != null && server.NamespaceSelector.MatchLabels["kubernetes.io/metadata.name"] == "garrison", "Server namespace selector when runs live elsewhere");
            Assert.Equal("9701", cross.Spec.Egress[1].Ports[0].Port.Value, "Configured MCP port");
            Assert.True(cross.Metadata.OwnerReferences == null, "No owner without a created Job");

            try
            {
                builder.BuildNetworkPolicy(Request(null), job, null);
                throw new TestAssertionException("A run without rules needs no policy.");
            }
            catch (ArgumentException)
            {
            }
            return Task.CompletedTask;
        }

        private static Task PodLabelsAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            settings.PodLabels["team"] = "agents";
            settings.PodLabels[RunPodNames.EgressLabel] = "spoofed";
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            V1Job allowlisted = builder.BuildJob(Request(s => s.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 })));
            Assert.Equal("allowlist", allowlisted.Metadata.Labels[RunPodNames.EgressLabel], "Job label");
            Assert.Equal("allowlist", allowlisted.Spec.Template.Metadata.Labels[RunPodNames.EgressLabel], "Pod label, present from creation");
            Assert.Equal("agents", allowlisted.Spec.Template.Metadata.Labels["team"], "Extra labels kept");
            V1Job plain = builder.BuildJob(Request(null));
            Assert.True(!plain.Spec.Template.Metadata.Labels.ContainsKey(RunPodNames.EgressLabel), "A run without rules never carries the label, even if PodLabels sets it");
            Assert.True(!builder.BuildSecret(Request(null), plain).Metadata.Labels.ContainsKey(RunPodNames.EgressLabel), "Nor its Secret");
            return Task.CompletedTask;
        }

        private static Task PolicyAuditAsync(CancellationToken token)
        {
            Dictionary<string, string> pod = EgressPolicyAudit.AllowlistedPodLabels(new Dictionary<string, string> { { "team", "agents" } });
            Assert.True(pod[RunPodNames.EgressLabel] == "allowlist" && pod["team"] == "agents" && pod["app.kubernetes.io/name"] == "garrison-run", "Probe labels");

            V1NetworkPolicy oldRun = Policy("garrison-run", Selector("app.kubernetes.io/name", "garrison-run"), new[] { "Ingress", "Egress" }, Dns(), IpRule("0.0.0.0/0", 443));
            List<string> widening = EgressPolicyAudit.Widening(new[] { oldRun }, pod);
            Assert.True(widening.Count == 1 && widening[0].StartsWith("garrison-run:", StringComparison.Ordinal) && widening[0].Contains("0.0.0.0/0", StringComparison.Ordinal), "The old single policy widens allowlisted pods: " + String.Join("; ", widening));

            V1NetworkPolicy baseRun = Policy("garrison-run", Selector("app.kubernetes.io/name", "garrison-run"), new[] { "Ingress", "Egress" }, Dns(), ServerRule());
            V1LabelSelector defaultSelector = Selector("app.kubernetes.io/name", "garrison-run");
            defaultSelector.MatchExpressions = new List<V1LabelSelectorRequirement> { new V1LabelSelectorRequirement { Key = RunPodNames.EgressLabel, OperatorProperty = "DoesNotExist" } };
            V1NetworkPolicy defaultEgress = Policy("garrison-run-default-egress", defaultSelector, new[] { "Egress" }, IpRule("0.0.0.0/0", 443));
            V1NetworkPolicy worker = Policy("garrison-worker", Selector("app.kubernetes.io/name", "garrison-worker"), new[] { "Ingress" });
            V1NetworkPolicy other = Policy("other-app", Selector("app", "web"), new[] { "Egress" }, IpRule("0.0.0.0/0", null));
            V1NetworkPolicy perRun = Policy("garrison-run-x-egress", Selector(RunPodNames.RunIdLabel, "run_x"), new[] { "Egress" }, IpRule("203.0.113.0/24", 443));
            perRun.Metadata.Labels = new Dictionary<string, string> { { "app.kubernetes.io/managed-by", "garrison-worker" } };
            Assert.Equal(0, EgressPolicyAudit.Widening(new[] { baseRun, defaultEgress, worker, other, perRun }, pod).Count, "The shipped split policies do not widen allowlisted pods");

            V1NetworkPolicy openAll = Policy("allow-all", new V1LabelSelector(), new[] { "Egress" }, new V1NetworkPolicyEgressRule());
            Assert.Equal(1, EgressPolicyAudit.Widening(new[] { openAll }, pod).Count, "An empty selector with a rule without destinations widens everything");
            V1NetworkPolicy tenantWide = Policy("tenant", Selector(RunPodNames.TenantLabel, "ten_a"), new[] { "Egress" }, IpRule("10.0.0.0/8", null));
            Assert.Equal(1, EgressPolicyAudit.Widening(new[] { tenantWide }, pod).Count, "Selectors on per-run labels are treated as matching");
            V1LabelSelector notIn = new V1LabelSelector { MatchExpressions = new List<V1LabelSelectorRequirement> { new V1LabelSelectorRequirement { Key = RunPodNames.EgressLabel, OperatorProperty = "NotIn", Values = new List<string> { "allowlist" } } } };
            Assert.True(!EgressPolicyAudit.Selects(notIn, pod), "NotIn allowlist excludes allowlisted pods");
            V1NetworkPolicy legacyTypes = Policy("implicit", Selector("app.kubernetes.io/name", "garrison-run"), null, IpRule("0.0.0.0/0", 443));
            Assert.Equal(1, EgressPolicyAudit.Widening(new[] { legacyTypes }, pod).Count, "A policy without policyTypes but with egress rules affects egress");
            return Task.CompletedTask;
        }

        private static async Task WorkerRefusalAsync(CancellationToken token)
        {
            RecordingExecutor process = new RecordingExecutor("process");
            RecordingExecutor kubernetes = new RecordingExecutor("kubernetes");
            RoutingRunExecutor routing = new RoutingRunExecutor(process, kubernetes);
            ExecutionSpec spec = new ExecutionSpec { RunId = "run_p", Executor = RunExecutorEnum.Process };
            spec.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
            Garrison.Worker.Reporting.InMemoryRunReporter reporter = new Garrison.Worker.Reporting.InMemoryRunReporter();
            RunCompleteRequest refused = await routing.ExecuteAsync(new RunAssignment { RunId = "run_p", Spec = spec }, reporter, token).ConfigureAwait(false);
            Assert.True(refused.Status == RunStatusEnum.Failed && refused.Outcome == RunOutcomeEnum.NoCapableWorker && (refused.ErrorMessage ?? String.Empty).Contains("egress allowlist", StringComparison.Ordinal), "Refused: " + refused.ErrorMessage);
            Assert.Equal(0, process.Executed + kubernetes.Executed, "Nothing executed");
            ExecutionSpec k8sSpec = new ExecutionSpec { RunId = "run_k", Executor = RunExecutorEnum.KubernetesJob };
            k8sSpec.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24" });
            Assert.Equal("kubernetes", (await routing.ExecuteAsync(new RunAssignment { RunId = "run_k", Spec = k8sSpec }, reporter, token).ConfigureAwait(false)).ResultText ?? String.Empty, "KubernetesJob specs with rules go to the Job executor");

            Assert.True(!KubernetesWarmPool.Compatible(k8sSpec), "Warm pods never take allowlisted runs");
            Assert.True(KubernetesWarmPool.Compatible(new ExecutionSpec { Executor = RunExecutorEnum.KubernetesJob }), "Warm pods still take ordinary runs");

            Assert.True(!ExecutorCapabilityProfiles.For(RunExecutorEnum.Process, false, true).EgressControl, "Process never reports egress control");
            Assert.True(ExecutorCapabilityProfiles.For(RunExecutorEnum.KubernetesJob, false, true).EgressControl, "KubernetesJob reports it when enforced");
            Assert.True(!ExecutorCapabilityProfiles.For(RunExecutorEnum.KubernetesJob).EgressControl, "Off by default");

            KubernetesRuntime runtime = new KubernetesRuntime(new KubernetesExecutorSettings { EgressAllowlists = true });
            Assert.True(!runtime.EgressAvailable, "An uninitialized runtime does not enforce allowlists");
            KubernetesJobRunExecutor executor = new KubernetesJobRunExecutor(runtime, "worker-0", new List<string>(), 1000);
            RunCompleteRequest unavailable = await executor.ExecuteAsync(new RunAssignment { RunId = "run_k", Spec = k8sSpec }, reporter, token).ConfigureAwait(false);
            Assert.Equal(RunOutcomeEnum.NoCapableWorker, unavailable.Outcome, "The Job executor without a client refuses the run");
        }

        private static Task ReconcilePoliciesAsync(CancellationToken token)
        {
            KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
            RunPodManifestBuilder builder = new RunPodManifestBuilder(settings);
            V1NetworkPolicy policy = builder.BuildNetworkPolicy(Request(s => s.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24" })), null, null);
            HashSet<string> held = new HashSet<string>(StringComparer.Ordinal) { KubernetesJobReconciler.Key("run_ABCdef123_xyz", 7) };
            Assert.True(!KubernetesJobReconciler.IsOrphan(policy, held), "A held run keeps its policy");
            Assert.True(KubernetesJobReconciler.IsOrphan(policy, new HashSet<string>(StringComparer.Ordinal) { KubernetesJobReconciler.Key("run_ABCdef123_xyz", 8) }), "Another epoch makes it an orphan");
            Assert.True(KubernetesJobReconciler.IsOrphan(policy, new HashSet<string>(StringComparer.Ordinal)), "A run no longer held makes it an orphan");
            V1NetworkPolicy unlabeled = new V1NetworkPolicy { Metadata = new V1ObjectMeta { Name = "x" } };
            Assert.True(KubernetesJobReconciler.IsOrphan(unlabeled, held), "A policy without a run is an orphan");
            return Task.CompletedTask;
        }

        private static Task SettingsAsync(CancellationToken token)
        {
            string[] names = { "GARRISON_WORKER_RUN_EGRESS_ALLOWLISTS", "GARRISON_WORKER_RUN_SERVER_MCP_PORT", "GARRISON_WORKER_SERVER_NAMESPACE" };
            Dictionary<string, string?> saved = names.ToDictionary(n => n, n => Environment.GetEnvironmentVariable(n));
            try
            {
                KubernetesExecutorSettings defaults = new KubernetesExecutorSettings();
                Assert.True(!defaults.EgressAllowlists && defaults.ServerMcpPort == 8701 && defaults.ServerNamespace == null, "Defaults");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_EGRESS_ALLOWLISTS", "true");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_RUN_SERVER_MCP_PORT", "9701");
                Environment.SetEnvironmentVariable("GARRISON_WORKER_SERVER_NAMESPACE", "garrison-system");
                KubernetesExecutorSettings settings = new KubernetesExecutorSettings();
                settings.ApplyEnvironment();
                Assert.True(settings.EgressAllowlists && settings.ServerMcpPort == 9701 && settings.ServerNamespace == "garrison-system", "Environment overrides");
                try
                {
                    settings.ServerMcpPort = 0;
                    throw new TestAssertionException("Port 0 accepted.");
                }
                catch (ArgumentOutOfRangeException)
                {
                }
            }
            finally
            {
                foreach (KeyValuePair<string, string?> entry in saved) Environment.SetEnvironmentVariable(entry.Key, entry.Value);
            }
            return Task.CompletedTask;
        }

        private static async Task PersistenceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = new Deployment();
                deployment.TenantId = "ten_egress_" + Guid.NewGuid().ToString("N");
                deployment.AgentId = "agt_egress";
                deployment.HarnessProfileId = "hrn_builtin_fake";
                deployment.Name = "egress-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                deployment.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
                deployment.EgressRules.Add(new DeploymentEgressRule { Cidr = "2001:db8::/32", Port = 53, Protocol = EgressProtocolEnum.UDP });
                deployment.EgressRules.Add(new DeploymentEgressRule { Cidr = "198.51.100.7/32" });
                Deployment created = await db.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                Deployment read = Assert.NotNull(await db.Deployments.ReadAsync(deployment.TenantId, created.Id, token).ConfigureAwait(false), "Read back");
                Assert.Equal("203.0.113.0/24:443/TCP|2001:db8::/32:53/UDP|198.51.100.7/32:/TCP", Describe(read.EgressRules), "Order, ports, and protocols round-trip");

                read.EgressRules.RemoveAt(0);
                read.EgressRules.Add(new DeploymentEgressRule { Cidr = "10.0.0.0/8", Port = 8443 });
                await db.Deployments.UpdateAsync(read, token).ConfigureAwait(false);
                Deployment updated = Assert.NotNull(await db.Deployments.ReadAsync(deployment.TenantId, created.Id, token).ConfigureAwait(false), "Read after update");
                Assert.Equal("2001:db8::/32:53/UDP|198.51.100.7/32:/TCP|10.0.0.0/8:8443/TCP", Describe(updated.EgressRules), "Update replaces the rules in order");
                EnumerationResult<Deployment> page = await db.Deployments.EnumerateAsync(deployment.TenantId, new EnumerationQuery { MaxResults = 10 }, token).ConfigureAwait(false);
                Assert.Equal(3, page.Objects.Single().EgressRules.Count, "Enumeration loads the rules");

                updated.EgressRules.Clear();
                await db.Deployments.UpdateAsync(updated, token).ConfigureAwait(false);
                Assert.Equal(0, Assert.NotNull(await db.Deployments.ReadAsync(deployment.TenantId, created.Id, token).ConfigureAwait(false), "Cleared").EgressRules.Count, "Clearing removes the allowlist");
                Assert.True(await db.Deployments.DeleteAsync(created.Id, token).ConfigureAwait(false), "Deleted");
            }
        }

        private static async Task RestAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, tenantPath + "/agents", new Agent { Name = "egress-agent" }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("No fake profile.");

                await ExpectFieldCodeAsync(host, tenantPath, NewDeployment(agent, profile, "bad-cidr", d => d.EgressRules.Add(new DeploymentEgressRule { Cidr = "api.example.com" })), "egressRules[0].cidr", "InvalidCidr", token).ConfigureAwait(false);
                await ExpectFieldCodeAsync(host, tenantPath, NewDeployment(agent, profile, "bad-port", d => d.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 70000 })), "egressRules[0].port", "PortOutOfRange", token).ConfigureAwait(false);
                await ExpectFieldCodeAsync(host, tenantPath, NewDeployment(agent, profile, "too-many", d => d.EgressRules = Enumerable.Range(0, 65).Select(i => new DeploymentEgressRule { Cidr = "10." + i + ".0.0/16" }).ToList()), "egressRules", "TooManyEgressRules", token).ConfigureAwait(false);
                await ExpectFieldCodeAsync(host, tenantPath, NewDeployment(agent, profile, "on-process", d => { d.Executor = RunExecutorEnum.Process; d.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24" }); }), "executor", "EgressRulesNeedKubernetesJob", token).ConfigureAwait(false);
                await ExpectFieldCodeAsync(host, tenantPath, NewDeployment(agent, profile, "warm", d => { d.RequiredCapabilities.ColdStartClass = ExecutorColdStartEnum.Warm; d.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24" }); }), "requiredCapabilities.coldStartClass", "EgressRulesNeedColdStart", token).ConfigureAwait(false);

                Deployment created = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", NewDeployment(agent, profile, "allowlisted", d =>
                {
                    d.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
                    d.EgressRules.Add(new DeploymentEgressRule { Cidr = "198.51.100.7/32", Protocol = EgressProtocolEnum.UDP });
                }), 201, token).ConfigureAwait(false);
                Assert.Equal("203.0.113.0/24:443/TCP|198.51.100.7/32:/UDP", Describe(created.EgressRules), "Create response");
                Deployment read = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Get, tenantPath + "/deployments/" + created.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal("203.0.113.0/24:443/TCP|198.51.100.7/32:/UDP", Describe(read.EgressRules), "Read");
                TestResponse raw = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, tenantPath + "/deployments/" + created.Id, null, token).ConfigureAwait(false);
                Assert.True(raw.Body.Contains("\"egressRules\"", StringComparison.Ordinal) && raw.Body.Contains("\"protocol\":\"UDP\"", StringComparison.Ordinal), "JSON field names: " + raw.Body);

                read.EgressRules = new List<DeploymentEgressRule> { new DeploymentEgressRule { Cidr = "192.0.2.0/24", Port = 8443 } };
                Deployment updated = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, tenantPath + "/deployments/" + created.Id, read, 200, token).ConfigureAwait(false);
                Assert.Equal("192.0.2.0/24:8443/TCP", Describe(updated.EgressRules), "Update");
                Assert.True(await AuditedAsync(host, "Egress allowlist changed from 203.0.113.0/24:443/TCP", token).ConfigureAwait(false), "Change audited");
                read.EgressRules[0].Cidr = "192.0.2.1/24";
                TestResponse badUpdate = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, tenantPath + "/deployments/" + created.Id, read, token).ConfigureAwait(false);
                Assert.True(badUpdate.StatusCode == 400 && badUpdate.Body.Contains("InvalidCidr", StringComparison.Ordinal), "Update validates too: " + badUpdate.Body);
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                string manifest = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: manifest-egress\nspec:\n  description: Egress manifest.\n---\n"
                    + "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-allowlisted\nspec:\n  agent: manifest-egress\n  harnessProfile: builtin/fake\n  weight: 0\n  egressRules:\n    - cidr: 203.0.113.0/24\n      port: 443\n    - cidr: 2001:db8::/32\n      port: 53\n      protocol: UDP\n---\n"
                    + "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-open\nspec:\n  agent: manifest-egress\n  harnessProfile: builtin/fake\n";
                ManifestApply applied = await ApplyAsync(host, manifest, 200, token).ConfigureAwait(false);
                Assert.Equal(0, applied.FailedCount, "Manifest applies");
                Deployment allowlisted = Assert.NotNull(await host.Server.Context.Database.Deployments.ReadByNameAsync(host.TenantId, "manifest-allowlisted", token).ConfigureAwait(false), "Allowlisted deployment");
                Assert.Equal("203.0.113.0/24:443/TCP|2001:db8::/32:53/UDP", Describe(allowlisted.EgressRules), "Manifest rules applied");

                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.Equal(1, export.Body.Split("egressRules:").Length - 1, "Export writes egressRules only for the allowlisted deployment: " + export.Body);
                Assert.True(export.Body.Contains("203.0.113.0/24", StringComparison.Ordinal) && export.Body.Contains("UDP", StringComparison.Ordinal), "Export carries the rules");
                ManifestApply reapplied = await ApplyAsync(host, export.Body, 200, token).ConfigureAwait(false);
                Assert.True(reapplied.FailedCount == 0 && reapplied.UpdatedCount == 0, "Exported manifest re-applies unchanged");

                string changed = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-allowlisted\nspec:\n  agent: manifest-egress\n  harnessProfile: builtin/fake\n  weight: 0\n  egressRules:\n    - cidr: 203.0.113.0/24\n      port: 8443\n";
                ManifestApplyItem change = (await ApplyAsync(host, changed, 200, token).ConfigureAwait(false)).Items.Single();
                Assert.True(change.Result == ManifestApplyResultEnum.Updated && change.Changes.Any(c => c.Field.Contains("egressRules", StringComparison.Ordinal)), "Diff names egressRules");

                string bad = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-bad\nspec:\n  agent: manifest-egress\n  harnessProfile: builtin/fake\n  egressRules:\n    - cidr: 203.0.113.9/24\n";
                ManifestApplyItem item = (await ApplyAsync(host, bad, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(item.Result == ManifestApplyResultEnum.Failed && item.ErrorCode == "InvalidCidr" && item.ErrorField == "egressRules[0].cidr", "Manifest item: " + item.ErrorCode + " " + item.ErrorField + " " + item.Message);
                string badPort = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-bad-port\nspec:\n  agent: manifest-egress\n  harnessProfile: builtin/fake\n  egressRules:\n    - cidr: 203.0.113.0/24\n      port: 0\n";
                ManifestApplyItem portItem = (await ApplyAsync(host, badPort, 400, token).ConfigureAwait(false)).Items.Single();
                Assert.True(portItem.ErrorCode == "PortOutOfRange" && portItem.ErrorField == "egressRules[0].port", "Manifest port item: " + portItem.ErrorCode + " " + portItem.ErrorField);
            }
        }

        private static async Task McpManagementAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                Agent agent = await client.CallAsync<Agent>("garrison_create_agent", new { configuration = new Agent { Name = "mcp-egress" } }, token).ConfigureAwait(false);
                Deployment configuration = new Deployment { Name = "mcp-allowlisted", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" };
                configuration.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
                Deployment created = await client.CallAsync<Deployment>("garrison_create_deployment", new { configuration = configuration }, token).ConfigureAwait(false);
                Assert.Equal("203.0.113.0/24:443/TCP", Describe(created.EgressRules), "MCP create");
                created.EgressRules.Add(new DeploymentEgressRule { Cidr = "198.51.100.0/24", Protocol = EgressProtocolEnum.UDP });
                Deployment updated = await client.CallAsync<Deployment>("garrison_update_deployment", new { deploymentId = created.Id, configuration = created }, token).ConfigureAwait(false);
                Assert.Equal("203.0.113.0/24:443/TCP|198.51.100.0/24:/UDP", Describe(updated.EgressRules), "MCP update");
                Assert.Equal(2, (await client.CallAsync<Deployment>("garrison_get_deployment", new { deploymentId = created.Id }, token).ConfigureAwait(false)).EgressRules.Count, "MCP read");
                updated.EgressRules[0].Port = 0;
                string error = String.Empty;
                try
                {
                    await client.CallAsync("garrison_update_deployment", new { deploymentId = created.Id, configuration = updated }, token).ConfigureAwait(false);
                }
                catch (TestAssertionException e)
                {
                    error = e.Message;
                }
                Assert.True(error.Contains("ValidationFailed", StringComparison.Ordinal) && error.Contains("egressRules[0].port", StringComparison.Ordinal), "MCP error names the field: " + error);
            }
        }

        private static async Task ClaimAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                string tenant = "ten_egress_" + Guid.NewGuid().ToString("N");
                Run run = await db.Runs.CreateAsync(NewRun(tenant, Allowlisted()), token).ConfigureAwait(false);
                Run stored = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Run read back");
                Assert.True(stored.RequiredCapabilities.EgressControl && stored.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Container && stored.Executor == RunExecutorEnum.KubernetesJob, "Stored effective requirement");

                Node plain = await db.Nodes.CreateAsync(NewNode("k8s-plain", false, RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                Node enforcing = await db.Nodes.CreateAsync(NewNode("k8s-egress", true, RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                Node readBack = Assert.NotNull(await db.Nodes.ReadAsync(enforcing.Id, token).ConfigureAwait(false), "Node read back");
                Assert.True(ExecutorCapabilityRules.Of(readBack).Single(c => c.Executor == RunExecutorEnum.KubernetesJob).EgressControl, "Egress control persists on the node");

                ClaimCandidateFilter refusedFilter = Filter(tenant, plain);
                Assert.True(!(await db.Runs.ListClaimCandidatesAsync(refusedFilter, token).ConfigureAwait(false)).Any(r => r.Id == run.Id), "Candidate selection refuses a node without egress control");
                Assert.True(!(await db.Runs.TryClaimAsync(run.Id, plain.Id, plain.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim refuses a node without egress control");
                Assert.True((await db.Runs.ListClaimCandidatesAsync(Filter(tenant, readBack), token).ConfigureAwait(false)).Any(r => r.Id == run.Id), "Candidate selection accepts an enforcing node");
                Assert.True((await db.Runs.TryClaimAsync(run.Id, enforcing.Id, enforcing.Name, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false)).HasValue, "Atomic claim accepts an enforcing node");
            }
        }

        private static async Task QueueUntilEnforcedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await cluster.CreateAgentAsync("egress-agent", "builtin/fake", null, token, d => d.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 })).ConfigureAwait(false);
                InvokeRequest invoke = new InvokeRequest { Input = "allowlisted input", Wait = false };
                TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents/" + agent.Id + "/invoke", invoke, token).ConfigureAwait(false);
                if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
                Run run = Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
                Assert.True(run.Executor == RunExecutorEnum.KubernetesJob && run.RequiredCapabilities.EgressControl && run.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Container && run.TrustLevel == DeploymentTrustLevelEnum.Trusted, "Admission requires egress control: " + run.Executor + " " + run.RequiredCapabilities.Isolation);

                // The cluster's Process worker long-polls throughout; it must never take the run.
                await Task.Delay(4000, token).ConfigureAwait(false);
                string path = "/v1.0/api/tenants/" + host.TenantId + "/runs/" + run.Id;
                Run waiting = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Queued, waiting.Status, "The Process worker never claims an allowlisted run");
                Assert.Equal(RunBlockedReasonEnum.NoIsolatingWorker, waiting.BlockedReason, "REST blocked reason");
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    McpRunSummary summary = await client.CallAsync<McpRunSummary>("garrison_get_run", new { tenantId = host.TenantId, runId = run.Id }, token).ConfigureAwait(false);
                    Assert.Equal("NoIsolatingWorker", summary.BlockedReason ?? String.Empty, "MCP blocked reason");
                }

                SchedulerService scheduler = host.Server.Context.Get<SchedulerService>();
                BlockedRunService blocked = host.Server.Context.Get<BlockedRunService>();
                Node plain = await db.Nodes.CreateAsync(NewNode("k8s-plain", false, RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                blocked.Invalidate();
                NodeLeaseResponse refused = await scheduler.LeaseAsync(plain, new NodeLeaseRequest { NodeId = plain.Id, MaxRuns = 4, WaitMs = 0 }, token).ConfigureAwait(false);
                Assert.True(!refused.Assignments.Any(a => a.RunId == run.Id), "A KubernetesJob node without egress control is not leased the run");
                Run stillWaiting = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
                Assert.Equal(RunBlockedReasonEnum.NoIsolatingWorker, stillWaiting.BlockedReason, "Still blocked on egress control");

                Node enforcing = await db.Nodes.CreateAsync(NewNode("k8s-egress", true, RunExecutorEnum.Process, RunExecutorEnum.KubernetesJob), token).ConfigureAwait(false);
                blocked.Invalidate();
                RunAssignment? assignment = null;
                DateTime deadline = DateTime.UtcNow.AddSeconds(20);
                while (assignment == null && DateTime.UtcNow < deadline)
                {
                    NodeLeaseResponse leased = await scheduler.LeaseAsync(enforcing, new NodeLeaseRequest { NodeId = enforcing.Id, MaxRuns = 4, WaitMs = 0 }, token).ConfigureAwait(false);
                    assignment = leased.Assignments.FirstOrDefault(a => a.RunId == run.Id);
                    if (assignment == null) await Task.Delay(200, token).ConfigureAwait(false);
                }
                if (assignment == null) throw new TestAssertionException("The egress-capable worker was not leased the run.");
                Assert.Equal(RunExecutorEnum.KubernetesJob, assignment.Spec.Executor, "Spec executor");
                Assert.True(assignment.Spec.RequiredCapabilities != null && assignment.Spec.RequiredCapabilities.EgressControl, "Spec carries the requirement");
                Assert.Equal("203.0.113.0/24:443/TCP", Describe(assignment.Spec.EgressRules), "Spec carries the rules compiled at lease time");
            }
        }

        private static async Task LateRulesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, tenantPath + "/agents", new Agent { Name = "late-egress" }, 201, token).ConfigureAwait(false);
                HarnessProfile profile = await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false) ?? throw new TestAssertionException("No fake profile.");
                Deployment deployment = await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", new Deployment { AgentId = agent.Id, Name = "late-egress", HarnessProfileId = profile.Id }, 201, token).ConfigureAwait(false);
                TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "before the allowlist", Wait = false }, token).ConfigureAwait(false);
                if (response.StatusCode != 200 && response.StatusCode != 202) throw new TestAssertionException("Invoke returned " + response.StatusCode + ": " + response.Body);
                Run run = Serializer.Deserialize<Run>(response.Body) ?? throw new TestAssertionException("Empty run.");
                Assert.True(run.Executor == RunExecutorEnum.Process && !run.RequiredCapabilities.EgressControl, "Admitted for Process");

                deployment.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
                await HttpTestHelpers.SendAsync<Deployment>(host.AdminClient, HttpMethod.Put, tenantPath + "/deployments/" + deployment.Id, deployment, 200, token).ConfigureAwait(false);

                Node process = await db.Nodes.CreateAsync(NewNode("late-process", false, RunExecutorEnum.Process), token).ConfigureAwait(false);
                SchedulerService scheduler = host.Server.Context.Get<SchedulerService>();
                NodeLeaseResponse leased = await scheduler.LeaseAsync(process, new NodeLeaseRequest { NodeId = process.Id, MaxRuns = 4, WaitMs = 0 }, token).ConfigureAwait(false);
                Assert.True(!leased.Assignments.Any(a => a.RunId == run.Id), "No spec is handed to the Process worker");
                Run failed = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, tenantPath + "/runs/" + run.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(failed.Status == RunStatusEnum.Failed && failed.Outcome == RunOutcomeEnum.CompileFailed && (failed.ErrorMessage ?? String.Empty).Contains("ExecutorMismatch", StringComparison.Ordinal), "Failed at compile: " + failed.Status + " " + failed.Outcome + " " + failed.ErrorMessage);
            }
        }

        private static async Task ExpectFieldCodeAsync(TestServerHost host, string tenantPath, Deployment deployment, string field, string code, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/deployments", deployment, token).ConfigureAwait(false);
            Assert.Equal(400, response.StatusCode, deployment.Name + " is rejected: " + response.Body);
            Assert.True(response.Body.Contains("\"" + field + "\"", StringComparison.Ordinal) && response.Body.Contains("\"" + code + "\"", StringComparison.Ordinal), deployment.Name + " names " + field + " and " + code + ": " + response.Body);
        }

        private static Deployment NewDeployment(Agent agent, HarnessProfile profile, string name, Action<Deployment> configure)
        {
            Deployment deployment = new Deployment { AgentId = agent.Id, Name = name, HarnessProfileId = profile.Id };
            configure(deployment);
            return deployment;
        }

        private static async Task<bool> AuditedAsync(TestServerHost host, string fragment, CancellationToken token)
        {
            EnumerationResult<AuditRecord> page = await host.Server.Context.Database.Audit.EnumerateAsync(null, new EnumerationQuery { MaxResults = 500 }, token).ConfigureAwait(false);
            return page.Objects.Any(a => (a.Description ?? String.Empty).Contains(fragment, StringComparison.Ordinal));
        }

        private static async Task<ManifestApply> ApplyAsync(TestServerHost host, string yaml, int expectedStatus, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/manifests/apply"))
            {
                request.Content = new StringContent(yaml, Encoding.UTF8, "application/yaml");
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if ((int)response.StatusCode != expectedStatus) throw new TestAssertionException("Manifest apply returned " + (int)response.StatusCode + " (expected " + expectedStatus + "): " + body);
                    return Serializer.Deserialize<ManifestApply>(body) ?? throw new TestAssertionException("Empty apply response.");
                }
            }
        }

        private static string Describe(List<DeploymentEgressRule> rules)
        {
            return String.Join("|", rules.Select(r => r.Cidr + ":" + (r.Port.HasValue ? r.Port.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : String.Empty) + "/" + r.Protocol));
        }

        private static Deployment Allowlisted()
        {
            Deployment deployment = new Deployment();
            deployment.EgressRules.Add(new DeploymentEgressRule { Cidr = "203.0.113.0/24", Port = 443 });
            return deployment;
        }

        private static RunPodRequest Request(Action<ExecutionSpec>? configure)
        {
            ExecutionSpec spec = new ExecutionSpec();
            spec.RunId = "run_ABCdef123_xyz";
            spec.TenantId = "ten_alpha";
            spec.AgentName = "helper";
            spec.DeploymentId = "dep_one";
            spec.Executor = RunExecutorEnum.KubernetesJob;
            spec.TimeoutSeconds = 600;
            spec.KillGraceSeconds = 5;
            configure?.Invoke(spec);
            RunPodRequest request = new RunPodRequest();
            request.Assignment = new RunAssignment { RunId = spec.RunId, Epoch = 7, Spec = spec };
            request.NodeName = "garrison-worker-0";
            request.Namespace = "garrison";
            request.Image = "jchristn77/garrison-worker:test";
            request.EnvelopeJson = "{\"nonce\":\"x\"}";
            return request;
        }

        private static V1NetworkPolicy Policy(string name, V1LabelSelector selector, string[]? types, params V1NetworkPolicyEgressRule[] egress)
        {
            V1NetworkPolicy policy = new V1NetworkPolicy();
            policy.Metadata = new V1ObjectMeta { Name = name };
            policy.Spec = new V1NetworkPolicySpec();
            policy.Spec.PodSelector = selector;
            if (types != null) policy.Spec.PolicyTypes = types.ToList();
            if (egress.Length > 0) policy.Spec.Egress = egress.ToList();
            return policy;
        }

        private static V1LabelSelector Selector(string key, string value)
        {
            return new V1LabelSelector { MatchLabels = new Dictionary<string, string> { { key, value } } };
        }

        private static V1NetworkPolicyEgressRule Dns()
        {
            return new V1NetworkPolicyEgressRule
            {
                To = new List<V1NetworkPolicyPeer> { new V1NetworkPolicyPeer { NamespaceSelector = new V1LabelSelector() } },
                Ports = new List<V1NetworkPolicyPort> { new V1NetworkPolicyPort { Port = (IntOrString)53, Protocol = "UDP" } }
            };
        }

        private static V1NetworkPolicyEgressRule ServerRule()
        {
            return new V1NetworkPolicyEgressRule
            {
                To = new List<V1NetworkPolicyPeer> { new V1NetworkPolicyPeer { PodSelector = Selector("app.kubernetes.io/name", "garrison-server") } },
                Ports = new List<V1NetworkPolicyPort> { new V1NetworkPolicyPort { Port = (IntOrString)8701 } }
            };
        }

        private static V1NetworkPolicyEgressRule IpRule(string cidr, int? port)
        {
            V1NetworkPolicyEgressRule rule = new V1NetworkPolicyEgressRule();
            rule.To = new List<V1NetworkPolicyPeer> { new V1NetworkPolicyPeer { IpBlock = new V1IPBlock { Cidr = cidr } } };
            if (port.HasValue) rule.Ports = new List<V1NetworkPolicyPort> { new V1NetworkPolicyPort { Port = (IntOrString)port.Value } };
            return rule;
        }

        private static ClaimCandidateFilter Filter(string tenant, Node node)
        {
            return new ClaimCandidateFilter { AllowedTenantIds = new List<string> { tenant }, HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, Executors = RunExecutors.Of(node), ExecutorCapabilities = ExecutorCapabilityRules.Of(node) };
        }

        private static Run NewRun(string tenantId, Deployment deployment)
        {
            Run run = new Run();
            run.TenantId = tenantId;
            run.AgentId = "agt_egress";
            run.AgentName = "egress";
            run.DeploymentId = "dep_egress";
            run.HarnessType = HarnessTypeEnum.Generic;
            run.Status = RunStatusEnum.Queued;
            run.QueuedUtc = DateTime.UtcNow;
            run.InputText = "hello";
            ExecutorCapabilityRules.Admit(run, deployment, null);
            return run;
        }

        private static Node NewNode(string name, bool egressControl, params RunExecutorEnum[] executors)
        {
            Node node = new Node();
            node.Name = name + "-" + Guid.NewGuid().ToString("N").Substring(0, 6);
            node.Status = NodeStatusEnum.Ready;
            node.MaxConcurrentRuns = 8;
            node.LastHeartbeatUtc = DateTime.UtcNow;
            node.Capabilities.Add(new NodeCapability { NodeId = node.Id, HarnessType = HarnessTypeEnum.Generic, Available = true });
            node.Executors = executors.ToList();
            foreach (RunExecutorEnum executor in executors) node.ExecutorCapabilities.Add(ExecutorCapabilityProfiles.For(executor, false, egressControl));
            return node;
        }

        #endregion
    }
}
