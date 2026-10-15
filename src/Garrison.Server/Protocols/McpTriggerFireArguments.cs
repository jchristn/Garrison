namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_fire_trigger (P12.5).</summary>
    public class McpTriggerFireArguments
    {
        /// <summary>Trigger identifier or name. Required.</summary>
        public string? Trigger { get; set; } = null;

        /// <summary>Optional payload the input template sees as webhook.body (and webhook.json when it is JSON). Null fires with no payload.</summary>
        public string? Body { get; set; } = null;

        /// <summary>Optional media type of the payload. Null means application/json.</summary>
        public string? ContentType { get; set; } = null;
    }
}
