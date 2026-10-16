namespace Garrison.Core.Helpers
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Effect hints never replace epoch fencing or prove complete harness coverage. Stateless and thread-safe.</summary>
    public static class EffectClassificationRules
    {
        /// <summary>Classify trusted hosted tool annotations. Destructive or missing metadata fails closed.</summary>
        public static EffectOperationClassificationEnum Classify(EffectToolMetadata? metadata)
        {
            if (metadata == null || metadata.DestructiveHint == true) return EffectOperationClassificationEnum.Effectful;
            if (metadata.ReadOnlyHint == true) return EffectOperationClassificationEnum.ReadOnly;
            if (metadata.IdempotentHint == true) return EffectOperationClassificationEnum.Idempotent;
            return EffectOperationClassificationEnum.Effectful;
        }

        /// <summary>Classify observed harness operations without trusting optimistic hints for shell/network or unstructured output. This does not establish whole-session coverage.</summary>
        /// <exception cref="ArgumentNullException">Profile or operation name is null.</exception>
        public static EffectOperationClassificationEnum ClassifyHarnessOperation(HarnessProfile profile, string operation, EffectToolMetadata? metadata = null)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            if (operation == null) throw new ArgumentNullException(nameof(operation));
            string name = operation.ToLowerInvariant();
            if (profile.OutputParser == OutputParserEnum.PlainText || name == "bash" || name == "webfetch" || name == "fetch" || name == "curl" || name == "wget"
                || name.Contains("shell", StringComparison.Ordinal) || name.Contains("exec_command", StringComparison.Ordinal)
                || name.Contains("http_request", StringComparison.Ordinal) || name.Contains("network", StringComparison.Ordinal))
                return EffectOperationClassificationEnum.UnknownCoverage;
            return Classify(metadata);
        }

        /// <summary>Whether a hosted tool needs an intent. Execute/mutation scopes and agent calls always do, even with optimistic metadata.</summary>
        public static bool RequiresJournal(OperationTypeEnum operation, bool agentTool, EffectToolMetadata? metadata)
        {
            return agentTool || operation != OperationTypeEnum.Read || Classify(metadata) != EffectOperationClassificationEnum.ReadOnly;
        }
    }
}
