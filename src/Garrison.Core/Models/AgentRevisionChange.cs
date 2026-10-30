namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;

    /// <summary>
    /// One field-level difference between two agent revisions (AD1.2).
    /// </summary>
    public class AgentRevisionChange
    {
        #region Public-Members

        /// <summary>
        /// Field name in camelCase, for example description, outputSchemaJson, delegationAllowList, or promptPins.
        /// </summary>
        public string Field
        {
            get
            {
                return _Field;
            }
            set
            {
                _Field = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Kind of change: Changed for a scalar field, Added or Removed for a list entry.
        /// </summary>
        public RevisionChangeTypeEnum ChangeType { get; set; } = RevisionChangeTypeEnum.Changed;

        /// <summary>
        /// Value in the older revision (null when absent or for Added).
        /// </summary>
        [JsonIgnore]
        public string? From { get; set; } = null;

        /// <summary>
        /// The value before the change: a JSON Schema as an object, any other field as a string; null when unset.
        /// </summary>
        [JsonPropertyName("from")]
        public JsonElement? FromValue
        {
            get
            {
                return JsonText.ValueOrString(From);
            }
            set
            {
                From = JsonText.Text(value);
            }
        }

        /// <summary>
        /// Value in the newer revision (null when absent or for Removed).
        /// </summary>
        [JsonIgnore]
        public string? To { get; set; } = null;

        /// <summary>
        /// The value after the change: a JSON Schema as an object, any other field as a string; null when removed.
        /// </summary>
        [JsonPropertyName("to")]
        public JsonElement? ToValue
        {
            get
            {
                return JsonText.ValueOrString(To);
            }
            set
            {
                To = JsonText.Text(value);
            }
        }

        #endregion

        #region Private-Members

        private string _Field = String.Empty;

        #endregion
    }
}
