namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One tag of a scoped memory entry, as stored in memory_entry_tags (AA4). MemoryEntry.Tags carries the tags of an
    /// entry; this type is the row. Not thread-safe.
    /// </summary>
    public class MemoryEntryTag
    {
        #region Public-Members

        /// <summary>
        /// Memory entry identifier (prefix mem_).
        /// </summary>
        public string EntryId
        {
            get
            {
                return _EntryId;
            }
            set
            {
                _EntryId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tag text, 1 to 64 characters, stored lowercase.
        /// </summary>
        public string Tag
        {
            get
            {
                return _Tag;
            }
            set
            {
                _Tag = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _EntryId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Tag = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryEntryTag()
        {
        }

        #endregion
    }
}
