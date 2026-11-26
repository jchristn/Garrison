namespace Garrison.Core.Evaluation
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;

    /// <summary>
    /// Authorship separation for gates (AA9.5, AA-024): a set may gate a change only when a person approved it, or when an
    /// evaluator agent wrote it from outside the proposer's subtree. An executive must not mark its own homework.
    /// Thread-safe.
    /// </summary>
    public static class EvalGatePolicy
    {
        #region Public-Members

        /// <summary>
        /// Refusal code: the set is a draft that no person approved and no outside evaluator wrote.
        /// </summary>
        public static readonly string NotApproved = "EvalSetNotApproved";

        /// <summary>
        /// Refusal code: the proposer, or an agent or unit inside its subtree, wrote the set.
        /// </summary>
        public static readonly string SelfAuthored = "EvalSetSelfAuthored";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Why a set cannot gate a proposer's change, or null when it can.
        /// </summary>
        /// <param name="set">Eval set version.</param>
        /// <param name="proposerTree">Live organization of the proposing executive, or null for a person.</param>
        /// <param name="proposerUnitId">Unit the proposer leads, or null for a person.</param>
        /// <param name="proposerAgentId">Proposing agent, or null for a person.</param>
        /// <returns>A refusal code (<see cref="NotApproved"/> or <see cref="SelfAuthored"/>), or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when set is null.</exception>
        public static string? Refusal(EvalSet set, OrgTree? proposerTree, string? proposerUnitId, string? proposerAgentId)
        {
            if (set == null) throw new ArgumentNullException(nameof(set));
            if (set.State == EvalSetStateEnum.Approved && set.ApprovedUtc.HasValue) return null;
            if (set.Origin != EvalSetOriginEnum.Evaluator) return NotApproved;
            if (String.IsNullOrEmpty(set.AuthoredByAgentId) && String.IsNullOrEmpty(set.AuthoringOrgUnitId)) return NotApproved;
            if (!String.IsNullOrEmpty(proposerAgentId) && String.Equals(set.AuthoredByAgentId, proposerAgentId, StringComparison.Ordinal)) return SelfAuthored;
            if (proposerTree != null && !String.IsNullOrEmpty(proposerUnitId))
            {
                if (!String.IsNullOrEmpty(set.AuthoringOrgUnitId) && proposerTree.Unit(set.AuthoringOrgUnitId) != null && proposerTree.InSubtree(set.AuthoringOrgUnitId, proposerUnitId)) return SelfAuthored;
                if (!String.IsNullOrEmpty(set.AuthoredByAgentId) && proposerTree.SubtreeAgentIds(proposerUnitId).Contains(set.AuthoredByAgentId)) return SelfAuthored;
            }
            return null;
        }

        #endregion
    }
}
