namespace Garrison.Core.Enums
{
    /// <summary>Tool effect classification. Only trusted read-only gateway tools may bypass intent journaling.</summary>
    public enum EffectOperationClassificationEnum
    {
        /// <summary>Trusted read-only tool with no destructive hint.</summary>
        ReadOnly,
        /// <summary>Idempotent mutation; still journal dispatch and uncertain outcomes.</summary>
        Idempotent,
        /// <summary>Effectful or unclassified operation.</summary>
        Effectful,
        /// <summary>Shell, direct network, or unstructured harness output cannot establish complete gateway coverage.</summary>
        UnknownCoverage
    }
}
