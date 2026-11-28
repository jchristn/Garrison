namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// A problem the organization validation dry run found in a working tree (LP3.7a). Problems of severity Error are the
    /// ones publishing refuses; Warning problems publish but leave the organization incomplete.
    /// </summary>
    public enum OrganizationValidationProblemCodeEnum
    {
        /// <summary>
        /// Warning: a unit has no lead agent, so it has no manager for its members.
        /// </summary>
        UnitWithoutLead,

        /// <summary>
        /// Error: an agent holds two positions (leads two units, or leads one and is a member of another, or is a member
        /// twice). Publishing refuses this as LeadsTwoUnits or PositionTaken.
        /// </summary>
        AgentInTwoUnits,

        /// <summary>
        /// Error: a peer line points at itself or at a unit that is not in this organization (PeerNotFound).
        /// </summary>
        PeerLineToMissingUnit,

        /// <summary>
        /// Error: a unit budget is above its nearest ancestor's budget for the same period (BudgetExceedsParent).
        /// </summary>
        BudgetOverParent,

        /// <summary>
        /// Warning: a keeper mandate held in a unit names a deployment that is missing, inactive, or belongs to another
        /// agent, so its ticks cannot start.
        /// </summary>
        KeeperDeploymentMissing,

        /// <summary>
        /// Error: a unit's parent is not a unit of this organization, so it has no path to the root (ParentNotFound).
        /// </summary>
        UnitDetachedFromRoot,

        /// <summary>
        /// Error: the tree has more than one root unit (OneRoot). An empty tree or one with no root is NoRootUnit.
        /// </summary>
        OneRoot,

        /// <summary>
        /// Error: a unit would sit below itself (Cycle).
        /// </summary>
        Cycle,

        /// <summary>
        /// Error: two units have the same name (UnitNameTaken).
        /// </summary>
        UnitNameTaken,

        /// <summary>
        /// Error: the organization has more units than the server allows (TooManyUnits).
        /// </summary>
        TooManyUnits,

        /// <summary>
        /// Error: a unit has more members than the server allows (TooManyMembers).
        /// </summary>
        TooManyMembers,

        /// <summary>
        /// Error: a unit has more peer lines than the server allows (TooManyPeerLines).
        /// </summary>
        TooManyPeerLines,

        /// <summary>
        /// Error: a unit has two budgets for the same period (BudgetPeriodTaken).
        /// </summary>
        BudgetPeriodTaken,

        /// <summary>
        /// Error: a budget is not more than 0 or is above the largest budget allowed (BudgetInvalid).
        /// </summary>
        BudgetInvalid,

        /// <summary>
        /// Error: a lead or member agent no longer exists or is not active (AgentInactive).
        /// </summary>
        AgentInactive,

        /// <summary>
        /// Error: a mandate held in a unit is missing or belongs to another agent (MandateMismatch).
        /// </summary>
        MandateMismatch,

        /// <summary>
        /// Error: the tree has no root unit, because it is empty or every unit has a parent (NoRootUnit). The
        /// problem names no unit.
        /// </summary>
        NoRootUnit
    }
}
