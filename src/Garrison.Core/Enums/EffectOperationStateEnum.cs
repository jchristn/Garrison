namespace Garrison.Core.Enums
{
    /// <summary>Durable gateway operation state. Dispatched and Unknown both forbid automatic replay.</summary>
    public enum EffectOperationStateEnum
    {
        /// <summary>Intent persisted before dispatch. No destination has been contacted.</summary>
        Authorized,
        /// <summary>Dispatch may have reached the destination.</summary>
        Dispatched,
        /// <summary>Destination returned and its result reference was committed.</summary>
        Completed,
        /// <summary>Dispatch outcome is uncertain.</summary>
        Unknown
    }
}
