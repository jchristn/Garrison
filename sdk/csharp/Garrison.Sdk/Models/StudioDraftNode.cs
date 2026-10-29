namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// Canvas position of one graph node in a studio draft. Not thread-safe.
    /// </summary>
    public class StudioDraftNode
    {
        #region Public-Members

        /// <summary>
        /// Node key, kind and name joined by a slash (for example Agent/researcher). Never null.
        /// </summary>
        public string NodeKey
        {
            get
            {
                return _NodeKey;
            }
            set
            {
                _NodeKey = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Horizontal position.
        /// </summary>
        public double X { get; set; } = 0;

        /// <summary>
        /// Vertical position.
        /// </summary>
        public double Y { get; set; } = 0;

        #endregion

        #region Private-Members

        private string _NodeKey = String.Empty;

        #endregion
    }
}
