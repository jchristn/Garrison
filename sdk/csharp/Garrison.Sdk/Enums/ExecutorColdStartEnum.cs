namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Executor startup class. Requirements match a class exactly.
    /// </summary>
    public enum ExecutorColdStartEnum
    {
        /// <summary>Immediate.</summary>
        Immediate = 0,
        /// <summary>Cold.</summary>
        Cold = 1,
        /// <summary>Warm.</summary>
        Warm = 2
    }
}
