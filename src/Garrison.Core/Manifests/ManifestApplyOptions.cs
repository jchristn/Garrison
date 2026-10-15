namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Services;

    /// <summary>
    /// Options for a manifest apply.
    /// </summary>
    public class ManifestApplyOptions
    {
        /// <summary>
        /// Validate and report without writing.
        /// </summary>
        public bool DryRun { get; set; } = false;

        /// <summary>
        /// Accept secret values in Secret documents.
        /// </summary>
        public bool AllowSecretValues { get; set; } = false;

        /// <summary>
        /// Principal recorded on the apply.
        /// </summary>
        public string? PrincipalName { get; set; } = null;

        /// <summary>
        /// The caller's permission to use secrets (SR-10). When set, every document that would be created or updated is
        /// checked for the secrets it uses, and fails with field code SecretUseDenied when the caller may not use one.
        /// Null skips the check, for trusted in-process callers such as tests.
        /// </summary>
        public SecretUseChecker? SecretUse { get; set; } = null;
    }
}
