namespace Garrison.Core.Services
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A run was refused because an active freeze covers its agent, deployment, mandate, or app, or because the autonomy
    /// kill switch is on and the run is a keeper tick (AA3.2). REST maps it to 409 with code Frozen; the message names the
    /// freeze.
    /// </summary>
    public class FrozenException : ConflictException
    {
        /// <summary>
        /// The freeze that refused the run (mfz_).
        /// </summary>
        public string FreezeId { get; }

        /// <summary>
        /// What the freeze stops.
        /// </summary>
        public FreezeTargetKindEnum TargetKind { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="freezeId">Freeze identifier.</param>
        /// <param name="targetKind">Target kind.</param>
        /// <param name="message">Message that names the freeze.</param>
        /// <exception cref="ArgumentNullException">Thrown when freezeId is null.</exception>
        public FrozenException(string freezeId, FreezeTargetKindEnum targetKind, string message) : base("Frozen", message)
        {
            FreezeId = freezeId ?? throw new ArgumentNullException(nameof(freezeId));
            TargetKind = targetKind;
        }
    }
}
