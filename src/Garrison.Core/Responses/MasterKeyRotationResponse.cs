namespace Garrison.Core.Responses
{
    /// <summary>
    /// Counts for a resumable master-key re-encryption pass. No key material is returned.
    /// </summary>
    public class MasterKeyRotationResponse
    {
        /// <summary>Active key version used for all new ciphertext.</summary>
        public int KeyVersion { get; set; }
        /// <summary>Encrypted records inspected in this pass.</summary>
        public int Scanned { get; set; }
        /// <summary>Records atomically re-encrypted.</summary>
        public int Rotated { get; set; }
        /// <summary>Records changed concurrently; run another pass before retiring old keys.</summary>
        public int Conflicts { get; set; }
        /// <summary>Records that could not be decrypted; retain old keys and investigate.</summary>
        public int Failed { get; set; }
    }
}
