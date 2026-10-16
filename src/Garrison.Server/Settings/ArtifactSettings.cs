namespace Garrison.Server.Settings
{
    using System;
    using Garrison.Core.Compilation;

    /// <summary>Node-local artifact storage and transfer limits. Filesystem replicas must share the same root.</summary>
    public class ArtifactSettings
    {
        /// <summary>Filesystem root, relative to the server working directory or absolute. Default data/artifacts.</summary>
        public string RootDirectory
        {
            get { return _RootDirectory; }
            set { _RootDirectory = String.IsNullOrWhiteSpace(value) ? "data/artifacts" : value; }
        }
        /// <summary>Maximum file or compressed checkpoint bytes. Default 16 MiB; range 1024 to 256 MiB. Raising this requires matching REST/proxy limits and available memory.</summary>
        public int MaxFileBytes { get { return _Collection.MaxFileBytes; } set { _Collection.MaxFileBytes = value; } }
        /// <summary>Maximum collected bytes per execution. Default 64 MiB; range 1024 to 1 GiB.</summary>
        public long MaxTotalBytes { get { return _Collection.MaxTotalBytes; } set { _Collection.MaxTotalBytes = value; } }
        /// <summary>Maximum collected files. Default 100; range 1 to 10000.</summary>
        public int MaxFiles { get { return _Collection.MaxFiles; } set { _Collection.MaxFiles = value; } }
        /// <summary>Maximum scanned workspace entries. Default 100000; range 1 to 1000000.</summary>
        public int MaxScanEntries { get { return _Collection.MaxScanEntries; } set { _Collection.MaxScanEntries = value; } }
        /// <summary>Collection/upload timeout. Default 30 seconds; range 1 to 300.</summary>
        public int CollectionTimeoutSeconds { get { return _Collection.TimeoutSeconds; } set { _Collection.TimeoutSeconds = value; } }
        /// <summary>Signed download URL lifetime. Default 900 seconds; range 30 to 3600.</summary>
        public int DownloadLifetimeSeconds { get { return _DownloadLifetimeSeconds; } set { _DownloadLifetimeSeconds = Math.Clamp(value, 30, 3600); } }
        /// <summary>
        /// Whether an S3 artifact store with a custom endpoint may omit its credential secret and sign with the server's
        /// ambient cloud identity (IRSA, an instance role, or AWS environment variables). Default false: a tenant chooses the
        /// endpoint, so the signed requests, which carry the access key identifier and session token, would go to a host the
        /// tenant controls. Turn it on only when every tenant is trusted and the endpoint is, for example, an S3 VPC endpoint
        /// (SR-21). Override with GARRISON_ARTIFACT_ALLOW_AMBIENT_CUSTOM_ENDPOINT.
        /// </summary>
        public bool AllowAmbientCredentialsWithCustomEndpoint { get; set; } = false;

        private string _RootDirectory = "data/artifacts";
        private readonly ExecutionArtifacts _Collection = new ExecutionArtifacts();
        private int _DownloadLifetimeSeconds = 900;
    }
}
