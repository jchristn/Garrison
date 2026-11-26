namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// The principal a Message run started by an urgent message runs as (AA6.5): the person who started the sending run,
    /// the person who sent the message, or the escalation's caller. Immutable and thread-safe.
    /// </summary>
    public class WakeCaller
    {
        /// <summary>
        /// Principal type.
        /// </summary>
        public PrincipalTypeEnum Type { get; }

        /// <summary>
        /// Principal identifier, or null.
        /// </summary>
        public string? Id { get; }

        /// <summary>
        /// Display name, or null.
        /// </summary>
        public string? Name { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="type">Principal type.</param>
        /// <param name="id">Principal identifier, or null.</param>
        /// <param name="name">Display name, or null.</param>
        public WakeCaller(PrincipalTypeEnum type, string? id, string? name)
        {
            Type = type;
            Id = id;
            Name = name;
        }
    }
}
