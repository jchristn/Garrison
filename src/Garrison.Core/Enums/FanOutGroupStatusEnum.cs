namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of a fan-out group (AD5). Every state other than Running is final.
    /// </summary>
    public enum FanOutGroupStatusEnum
    {
        /// <summary>
        /// Members are still running and the join policy is not met.
        /// </summary>
        Running,

        /// <summary>
        /// The join policy is met, or can no longer be met because the members that could meet it finished.
        /// </summary>
        Joined,

        /// <summary>
        /// The group's timeout passed first; members still running were cancelled.
        /// </summary>
        TimedOut,

        /// <summary>
        /// The members' cost or tokens went over the group's budget; members still running were cancelled.
        /// </summary>
        BudgetExceeded,

        /// <summary>
        /// The group was cancelled, or its parent run finished or was cancelled; members still running were cancelled.
        /// </summary>
        Cancelled
    }
}
