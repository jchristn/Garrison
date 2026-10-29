namespace Garrison.Server.Protocols
{
    using Garrison.Core.Enums;

    /// <summary>Typed studio draft tool arguments (AD7.5).</summary>
    public class McpStudioArguments
    {
        /// <summary>Draft identifier (sdr_...), for every tool except create and list.</summary>
        public string? DraftId { get; set; } = null;

        /// <summary>Draft version the caller read, for every change.</summary>
        public int? Version { get; set; } = null;

        /// <summary>Title, for create.</summary>
        public string? Title { get; set; } = null;

        /// <summary>App to start from, for create.</summary>
        public string? FromApp { get; set; } = null;

        /// <summary>Item kind, for put and remove.</summary>
        public string? Kind { get; set; } = null;

        /// <summary>Item name, for put and remove.</summary>
        public string? Name { get; set; } = null;

        /// <summary>One manifest document (YAML), for put.</summary>
        public string? Document { get; set; } = null;

        /// <summary>Upsert (default) or Delete, for put.</summary>
        public string? Operation { get; set; } = null;

        /// <summary>Graph operation, for graph_operation.</summary>
        public StudioGraphOperationEnum? GraphOperation { get; set; } = null;

        /// <summary>App name, for graph_operation.</summary>
        public string? App { get; set; } = null;

        /// <summary>Agent name, for graph_operation.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Member role, for graph_operation AddMember.</summary>
        public string? Role { get; set; } = null;

        /// <summary>Calling member, for graph_operation Connect and Disconnect.</summary>
        public string? From { get; set; } = null;

        /// <summary>Called member, for graph_operation Connect and Disconnect.</summary>
        public string? To { get; set; } = null;

        /// <summary>Whether the edge allows fan-out, for graph_operation Connect.</summary>
        public bool? FanOut { get; set; } = null;

        /// <summary>Node key, for graph_operation MoveNode.</summary>
        public string? NodeKey { get; set; } = null;

        /// <summary>Canvas X, for graph_operation MoveNode.</summary>
        public double? X { get; set; } = null;

        /// <summary>Canvas Y, for graph_operation MoveNode.</summary>
        public double? Y { get; set; } = null;

        /// <summary>Message, for playground_invoke.</summary>
        public string? Input { get; set; } = null;

        /// <summary>Conversation to continue, for playground_invoke.</summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>Most seconds to wait, for playground_invoke.</summary>
        public int? WaitSeconds { get; set; } = null;
    }
}
