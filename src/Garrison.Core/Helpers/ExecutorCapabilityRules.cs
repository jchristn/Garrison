namespace Garrison.Core.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Executor capability validation and placement matching.</summary>
    public static class ExecutorCapabilityRules
    {
        /// <summary>Validate enum values in a capability requirement.</summary>
        /// <param name="value">Requirements.</param>
        /// <exception cref="ArgumentException">Thrown for unknown capability values.</exception>
        public static void Validate(ExecutorRequirements value)
        {
            if (value == null) throw new ArgumentNullException(nameof(value));
            if (!Enum.IsDefined(value.Isolation)) throw new ArgumentException("Unknown executor isolation level.");
            if (value.ColdStartClass.HasValue && !Enum.IsDefined(value.ColdStartClass.Value)) throw new ArgumentException("Unknown executor startup class.");
        }

        /// <summary>True when a requirement asks for more than legacy Process placement.</summary>
        /// <param name="value">Requirements.</param>
        /// <returns>Whether capabilities must be reported.</returns>
        public static bool RequiresReport(ExecutorRequirements value)
        {
            return value.Isolation != ExecutorIsolationEnum.Process || value.EgressControl || value.FilesystemSnapshot
                || value.SessionContinuation || value.CrossNodeRestore || value.ColdStartClass.HasValue;
        }

        /// <summary>Reports for a node, with conservative legacy defaults for unreported executor names.</summary>
        /// <param name="node">Node.</param>
        /// <returns>Capability records.</returns>
        public static List<ExecutorCapabilities> Of(Node node)
        {
            return RunExecutors.Of(node).Select(e => node.ExecutorCapabilities.FirstOrDefault(c => c.Executor == e)
                ?? new ExecutorCapabilities { Executor = e }).ToList();
        }

        /// <summary>Whether a node can satisfy this admitted run's executor and capability requirements.</summary>
        /// <param name="node">Node.</param>
        /// <param name="run">Run.</param>
        /// <returns>Whether the run can execute.</returns>
        public static bool Supports(Node node, Run run)
        {
            return Of(node).Any(c => c.Executor == run.Executor && Matches(c, run.RequiredCapabilities));
        }

        /// <summary>Match ordered isolation, required flags, and optional exact startup class.</summary>
        /// <param name="capability">Capability record.</param>
        /// <param name="required">Required capabilities.</param>
        /// <returns>True when every requirement is satisfied.</returns>
        public static bool Matches(ExecutorCapabilities capability, ExecutorRequirements required)
        {
            return capability.Isolation >= required.Isolation
                && (!required.EgressControl || capability.EgressControl)
                && (!required.FilesystemSnapshot || capability.FilesystemSnapshot)
                && (!required.SessionContinuation || capability.SessionContinuation)
                && (!required.CrossNodeRestore || capability.CrossNodeRestore)
                && (!required.ColdStartClass.HasValue || required.ColdStartClass == capability.ColdStartClass);
        }
    }
}
