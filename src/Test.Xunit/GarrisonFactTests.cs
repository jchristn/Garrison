namespace Test.Xunit
{
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Test.Shared;
    using Touchstone.Core;
    using Touchstone.XunitAdapter;
    using global::Xunit;

    /// <summary>
    /// Runs every Garrison suite through xUnit in one fact, preserving suite order and lifecycle hooks.
    /// </summary>
    public sealed class GarrisonFactTests : TouchstoneFactBase
    {
        /// <summary>
        /// Suites to run.
        /// </summary>
        protected override IReadOnlyList<TestSuiteDescriptor> Suites
        {
            get
            {
                return GarrisonSuites.All;
            }
        }

        /// <summary>
        /// Run all suites.
        /// </summary>
        /// <returns>Task.</returns>
        [Fact]
        public async Task RunAll()
        {
            await RunAllAsync();
        }
    }
}
