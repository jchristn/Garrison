namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Why a conversation turn started a fresh harness session seeded with the transcript of the earlier turns instead of
    /// resuming the conversation's session on its affinity node.
    /// </summary>
    public enum ConversationFallbackReasonEnum
    {
        /// <summary>
        /// The affinity node is no longer Ready (Lost, Draining, Cordoned, or deleted), so another node took the turn.
        /// </summary>
        AffinityNodeLost,

        /// <summary>
        /// The affinity node stayed Ready but did not claim the turn within the affinity wait
        /// (Runtime.ConversationAffinityWaitMs), so another node took it.
        /// </summary>
        AffinityWaitExpired,

        /// <summary>
        /// The affinity node claimed the turn but the conversation's workspace and home directories were gone there (for
        /// example after the worker's work root was emptied or the conversation's directories were swept).
        /// </summary>
        WorkspaceLost,

        /// <summary>
        /// Earlier turns exist but none reported a harness session to resume (for example every earlier turn failed
        /// before the harness reported its session).
        /// </summary>
        SessionMissing,

        /// <summary>
        /// The deployment's harness profile changed since the session was recorded, so the recorded session cannot be
        /// resumed by the new profile.
        /// </summary>
        HarnessChanged,

        /// <summary>
        /// The deployment's harness profile does not support resume (supportsResume is false).
        /// </summary>
        ResumeUnsupported,

        /// <summary>
        /// The run uses an executor that keeps no state between runs (KubernetesJob runs get a new pod with an empty home
        /// directory every time), so every turn after the first starts from the transcript.
        /// </summary>
        ExecutorWithoutState
    }
}
