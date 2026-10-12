namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One text input item of a turn (<c>UserInput</c>, type <c>text</c>).
    /// </summary>
    public class CodexUserInput
    {
        #region Public-Members

        /// <summary>
        /// Input type. Always text here.
        /// </summary>
        [JsonPropertyName("type")]
        public string Type
        {
            get
            {
                return _Type;
            }
            set
            {
                _Type = value ?? "text";
            }
        }

        /// <summary>
        /// Text.
        /// </summary>
        [JsonPropertyName("text")]
        public string Text
        {
            get
            {
                return _Text;
            }
            set
            {
                _Text = value ?? String.Empty;
            }
        }

        /// <summary>
        /// UI spans within the text; always empty for Garrison.
        /// </summary>
        [JsonPropertyName("text_elements")]
        public List<object> TextElements
        {
            get
            {
                return _TextElements;
            }
            set
            {
                _TextElements = value ?? new List<object>();
            }
        }

        #endregion

        #region Private-Members

        private string _Type = "text";
        private string _Text = String.Empty;
        private List<object> _TextElements = new List<object>();

        #endregion
    }
}
