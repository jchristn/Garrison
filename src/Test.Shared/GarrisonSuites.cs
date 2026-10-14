namespace Test.Shared
{
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Test.Shared.Infrastructure;
    using Test.Shared.Suites;
    using Touchstone.Core;

    /// <summary>
    /// Registry of every Garrison test suite consumed by the console, xUnit, and NUnit runners.
    /// </summary>
    public static class GarrisonSuites
    {
        /// <summary>
        /// All suites for the selected providers.
        /// </summary>
        public static IReadOnlyList<TestSuiteDescriptor> All
        {
            get
            {
                List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
                foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
                {
                    suites.Add(DatabaseContractSuite.Build(provider));
                }
                suites.AddRange(TemplateSuite.Build());
                suites.AddRange(CompilerSuite.Build());
                suites.AddRange(ParserSuite.Build());
                suites.AddRange(AppServerSuite.Build());
                suites.AddRange(IdentitySuite.Build());
                suites.AddRange(ConfigurationSuite.Build());
                suites.AddRange(RuntimeSuite.Build());
                suites.AddRange(PauseToleranceSuite.Build());
                suites.AddRange(WorkerSuite.Build());
                suites.AddRange(EventCoalescingSuite.Build());
                suites.AddRange(RunGuardSuite.Build());
                suites.AddRange(ProtocolSuite.Build());
                suites.AddRange(CancellationSuite.Build());
                suites.AddRange(AnalyticsSuite.Build());
                suites.AddRange(StructuredOutputSuite.Build());
                suites.AddRange(FindingsSuite.Build());
                suites.AddRange(ObservabilitySuite.Build());
                suites.AddRange(TelemetryCoverageSuite.Build());
                suites.AddRange(ScaleOutSuite.Build());
                suites.AddRange(MultiReplicaSuite.Build());
                suites.AddRange(KubernetesExecutorSuite.Build());
                suites.AddRange(ExecutorConformanceSuite.Build());
                suites.AddRange(CodexCredentialSuite.Build());
                suites.AddRange(CorrectnessSuite.Build());
                suites.AddRange(ConversationSuite.Build());
                suites.AddRange(ApprovalSuite.Build());
                suites.AddRange(PricingSuite.Build());
                suites.AddRange(QuotaSuite.Build());
                suites.AddRange(ArtifactSuite.Build());
                suites.AddRange(McpStdioSuite.Build());
                suites.AddRange(ProviderApiSuite.Build());
                suites.AddRange(ManagementMcpSuite.Build());
                suites.AddRange(PipelineSuite.Build());
                suites.AddRange(DelegationCapacitySuite.Build());
                suites.AddRange(TrustLevelSuite.Build());
                suites.AddRange(EffectPolicySuite.Build());
                suites.AddRange(ControlPlaneTuningSuite.Build());
                return suites;
            }
        }
    }
}
