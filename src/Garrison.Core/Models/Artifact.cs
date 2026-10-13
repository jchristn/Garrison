namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>Tenant-scoped metadata for one collected run file. Content is accessed separately from metadata.</summary>
    public class Artifact
    {
        /// <summary>Artifact identifier.</summary>
        public string Id
        {
            get { return _Id; }
            set { _Id = value ?? String.Empty; }
        }

        /// <summary>Owning tenant.</summary>
        public string TenantId
        {
            get { return _TenantId; }
            set { _TenantId = value ?? String.Empty; }
        }

        /// <summary>Producing run.</summary>
        public string RunId
        {
            get { return _RunId; }
            set { _RunId = value ?? String.Empty; }
        }

        /// <summary>Bound artifact store.</summary>
        public string ArtifactStoreId
        {
            get { return _ArtifactStoreId; }
            set { _ArtifactStoreId = value ?? String.Empty; }
        }

        /// <summary>Workspace-relative name.</summary>
        public string Name
        {
            get { return _Name; }
            set { _Name = value ?? String.Empty; }
        }

        /// <summary>Media type.</summary>
        public string MediaType
        {
            get { return _MediaType; }
            set { _MediaType = value ?? String.Empty; }
        }

        /// <summary>Content length in bytes.</summary>
        public long SizeBytes
        {
            get { return _SizeBytes; }
            set { _SizeBytes = value; }
        }

        /// <summary>Lowercase hexadecimal content SHA-256.</summary>
        public string Sha256
        {
            get { return _Sha256; }
            set { _Sha256 = value ?? String.Empty; }
        }

        /// <summary>Store-relative object location; never a public credential-bearing URL.</summary>
        public string Location
        {
            get { return _Location; }
            set { _Location = value ?? String.Empty; }
        }

        /// <summary>Producing run lease epoch.</summary>
        public long LeaseEpoch
        {
            get { return _LeaseEpoch; }
            set { _LeaseEpoch = value; }
        }

        /// <summary>Producing execution repair attempt.</summary>
        public int RepairAttempt
        {
            get { return _RepairAttempt; }
            set { _RepairAttempt = value; }
        }

        /// <summary>Creation time, UTC.</summary>
        public DateTime CreatedUtc
        {
            get { return _CreatedUtc; }
            set { _CreatedUtc = TimestampHelper.Normalize(value); }
        }

        /// <summary>Last update time, UTC.</summary>
        public DateTime LastUpdateUtc
        {
            get { return _LastUpdateUtc; }
            set { _LastUpdateUtc = TimestampHelper.Normalize(value); }
        }

        private string _Id = IdGenerator.NewArtifactId();
        private string _TenantId = String.Empty;
        private string _RunId = String.Empty;
        private string _ArtifactStoreId = String.Empty;
        private string _Name = String.Empty;
        private string _MediaType = "application/octet-stream";
        private long _SizeBytes = 0;
        private string _Sha256 = String.Empty;
        private string _Location = String.Empty;
        private long _LeaseEpoch = 1;
        private int _RepairAttempt = 0;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
    }
}
