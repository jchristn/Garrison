namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;

    /// <summary>
    /// The tool probes workers run (AD4.4): one per tool name across every active harness profile. Built-in profiles
    /// come first, then tenant profiles by creation time; when two profiles define the same name differently, the first
    /// definition is the one probed (AD-033). Cached briefly, because registration and every heartbeat read it.
    /// Thread-safe.
    /// </summary>
    public class ToolProbeCatalog
    {
        #region Public-Members

        /// <summary>
        /// How long the probe list is cached, in seconds. Default 30; range 1 to 600.
        /// </summary>
        public int CacheSeconds
        {
            get
            {
                return _CacheSeconds;
            }
            set
            {
                _CacheSeconds = Math.Clamp(value, 1, 600);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly SemaphoreSlim _Lock = new SemaphoreSlim(1, 1);
        private int _CacheSeconds = 30;
        private ToolProbeSet? _Cached = null;
        private DateTime _CachedUtc = DateTime.MinValue;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public ToolProbeCatalog(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The current probes and their hash, from the cache when it is fresh.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Probe set.</returns>
        public async Task<ToolProbeSet> CurrentAsync(CancellationToken token = default)
        {
            ToolProbeSet? cached = Volatile.Read(ref _Cached);
            if (cached != null && (DateTime.UtcNow - _CachedUtc).TotalSeconds < _CacheSeconds) return cached;
            await _Lock.WaitAsync(token).ConfigureAwait(false);
            try
            {
                cached = _Cached;
                if (cached != null && (DateTime.UtcNow - _CachedUtc).TotalSeconds < _CacheSeconds) return cached;
                ToolProbeSet fresh = Build(await _Database.HarnessProfiles.ListToolProbesAsync(token).ConfigureAwait(false));
                _CachedUtc = DateTime.UtcNow;
                Volatile.Write(ref _Cached, fresh);
                return fresh;
            }
            finally
            {
                _Lock.Release();
            }
        }

        /// <summary>
        /// Forget the cached list, so the next read sees a harness profile change at once.
        /// </summary>
        public void Invalidate()
        {
            Volatile.Write(ref _Cached, null);
        }

        /// <summary>
        /// Reduce probe sources to one probe per tool name, keeping the first definition, and hash the result.
        /// </summary>
        /// <param name="sources">Probes in priority order (built-ins first, then by profile creation time).</param>
        /// <returns>Probe set.</returns>
        /// <exception cref="ArgumentNullException">Thrown when sources is null.</exception>
        public static ToolProbeSet Build(List<HarnessToolProbeSource> sources)
        {
            if (sources == null) throw new ArgumentNullException(nameof(sources));
            ToolProbeSet set = new ToolProbeSet();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            StringBuilder canonical = new StringBuilder();
            foreach (HarnessToolProbeSource source in sources.Where(s => s.Active))
            {
                if (!seen.Add(source.Probe.Name)) continue;
                NodeToolProbe probe = new NodeToolProbe { Name = source.Probe.Name, Executable = source.Probe.Executable, Arguments = new List<string>(source.Probe.Arguments) };
                set.Probes.Add(probe);
                canonical.Append(probe.Name).Append('\u001f').Append(probe.Executable).Append('\u001f').Append(String.Join("\u001e", probe.Arguments)).Append('\n');
            }
            set.Hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString()))).ToLowerInvariant().Substring(0, 16);
            return set;
        }

        #endregion
    }
}
