namespace Garrison.FakeHarness
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Net.Security;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Runs isolation probes (P11.17): each attempt to read a file, list a directory, find a variable, open a TCP
    /// connection, or call an HTTP endpoint is made once with a timeout and reported as one
    /// <see cref="FakeProbeResult"/>. Probes only read and connect; the one write is the marker probe, which writes a
    /// plainly named file into the working directory (the run's workspace) and nowhere else. Results never carry file
    /// contents, variable values, or tokens. Not thread-safe; use one instance per run.
    /// </summary>
    public class FakeProber
    {
        #region Public-Members

        /// <summary>
        /// Timeout of each connect and HTTP probe in milliseconds. Minimum 100, maximum 60,000, default 3,000.
        /// </summary>
        public int TimeoutMs
        {
            get
            {
                return _TimeoutMs;
            }
            set
            {
                _TimeoutMs = Math.Clamp(value, 100, 60000);
            }
        }

        /// <summary>
        /// Longest hold probe in milliseconds. Minimum 0, maximum 3,600,000, default 600,000. Note that the worker's
        /// no-progress guard (300 seconds by default) stops a run that holds longer without output.
        /// </summary>
        public int MaxHoldMs
        {
            get
            {
                return _MaxHoldMs;
            }
            set
            {
                _MaxHoldMs = Math.Clamp(value, 0, 3600000);
            }
        }

        /// <summary>
        /// Path of the Kubernetes service account token that the http probe sends when it can read it. Default
        /// /var/run/secrets/kubernetes.io/serviceaccount/token.
        /// </summary>
        public string ServiceAccountTokenPath
        {
            get
            {
                return _ServiceAccountTokenPath;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value)) throw new ArgumentNullException(nameof(ServiceAccountTokenPath));
                _ServiceAccountTokenPath = value;
            }
        }

        /// <summary>
        /// Most glob matches a read probe tries. Minimum 1, maximum 10,000, default 200.
        /// </summary>
        public int MaxGlobMatches
        {
            get
            {
                return _MaxGlobMatches;
            }
            set
            {
                _MaxGlobMatches = Math.Clamp(value, 1, 10000);
            }
        }

        #endregion

        #region Private-Members

        private int _TimeoutMs = 3000;
        private int _MaxHoldMs = 600000;
        private int _MaxGlobMatches = 200;
        private string _ServiceAccountTokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public FakeProber()
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse and run probe texts in order (see <see cref="FakeProbe.TryParse"/>). A text that does not parse gives
        /// an Error result with the parse error and the run continues.
        /// </summary>
        /// <param name="texts">Probe texts.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>One result per text, in order.</returns>
        /// <exception cref="ArgumentNullException">Thrown when texts is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled.</exception>
        public async Task<List<FakeProbeResult>> RunAsync(IEnumerable<string> texts, CancellationToken token)
        {
            if (texts == null) throw new ArgumentNullException(nameof(texts));
            List<FakeProbeResult> results = new List<FakeProbeResult>();
            foreach (string text in texts)
            {
                results.Add(await RunTextAsync(text, token).ConfigureAwait(false));
            }
            return results;
        }

        /// <summary>
        /// Parse and run one probe text (see <see cref="FakeProbe.TryParse"/>). A text that does not parse gives an
        /// Error result with the parse error.
        /// </summary>
        /// <param name="text">Probe text, with or without the "probe " prefix.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="OperationCanceledException">Thrown when cancelled.</exception>
        public async Task<FakeProbeResult> RunTextAsync(string? text, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            if (!FakeProbe.TryParse(text, out FakeProbe? probe, out string? error) || probe == null)
            {
                string raw = (text ?? String.Empty).Trim();
                if (raw.StartsWith(FakeProbe.PromptPrefix, StringComparison.OrdinalIgnoreCase)) raw = raw.Substring(FakeProbe.PromptPrefix.Length).Trim();
                int space = raw.IndexOf(' ');
                return new FakeProbeResult(space < 0 ? raw : raw.Substring(0, space), space < 0 ? String.Empty : raw.Substring(space + 1), FakeProbeOutcomeEnum.Error, error ?? "Not a probe.");
            }
            return await RunAsync(probe, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Run one probe.
        /// </summary>
        /// <param name="probe">Probe.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when probe is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled.</exception>
        public async Task<FakeProbeResult> RunAsync(FakeProbe probe, CancellationToken token)
        {
            if (probe == null) throw new ArgumentNullException(nameof(probe));
            token.ThrowIfCancellationRequested();
            switch (probe.Kind)
            {
                case "read":
                    return Read(probe);
                case "list":
                    return List(probe);
                case "env":
                    return Env(probe);
                case "proc-env":
                    return ProcEnv(probe);
                case "connect":
                    return await ConnectAsync(probe, token).ConfigureAwait(false);
                case "http":
                    return await HttpAsync(probe, token).ConfigureAwait(false);
                case "marker":
                    return Marker(probe);
                case "hold":
                    return await HoldAsync(probe, token).ConfigureAwait(false);
                default:
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Error, "Unknown probe kind.");
            }
        }

        #endregion

        #region Private-Methods

        private FakeProbeResult Read(FakeProbe probe)
        {
            List<string> paths;
            if (probe.Target.IndexOfAny(new[] { '*', '?' }) >= 0)
            {
                paths = Glob(probe.Target);
                if (paths.Count == 0) return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "no match");
            }
            else
            {
                paths = new List<string> { probe.Target };
            }

            string? firstError = null;
            foreach (string path in paths)
            {
                try
                {
                    long bytes = 0;
                    byte[] buffer = new byte[8192];
                    using (FileStream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    {
                        int read;
                        while ((read = stream.Read(buffer, 0, buffer.Length)) > 0 && bytes < 1024 * 1024) bytes += read;
                    }
                    string where = paths.Count > 1 ? " (" + paths.Count.ToString(CultureInfo.InvariantCulture) + " matches)" : String.Empty;
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Allowed, "read " + bytes.ToString(CultureInfo.InvariantCulture) + " bytes from " + path + where);
                }
                catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is ArgumentException || e is NotSupportedException)
                {
                    if (firstError == null) firstError = e.GetType().Name + ": " + e.Message;
                }
            }
            return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, firstError ?? "not readable");
        }

        private FakeProbeResult List(FakeProbe probe)
        {
            try
            {
                List<string> names = Directory.EnumerateFileSystemEntries(probe.Target).Select(p => Path.GetFileName(p)).OrderBy(n => n, StringComparer.Ordinal).ToList();
                string shown = String.Join(", ", names.Take(10));
                if (names.Count > 10) shown += ", ...";
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Allowed, names.Count.ToString(CultureInfo.InvariantCulture) + " entries" + (names.Count > 0 ? ": " + shown : String.Empty));
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is ArgumentException || e is NotSupportedException || e is System.Security.SecurityException)
            {
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, e.GetType().Name + ": " + e.Message);
            }
        }

        private static FakeProbeResult Env(FakeProbe probe)
        {
            List<string> found = new List<string>();
            bool prefix = probe.Target.EndsWith("*", StringComparison.Ordinal);
            string name = prefix ? probe.Target.Substring(0, probe.Target.Length - 1) : probe.Target;
            foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables())
            {
                string key = entry.Key?.ToString() ?? String.Empty;
                if (prefix ? key.StartsWith(name, StringComparison.Ordinal) : String.Equals(key, name, StringComparison.Ordinal)) found.Add(key);
            }
            if (found.Count == 0) return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "not set");
            found.Sort(StringComparer.Ordinal);
            return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Allowed, "set: " + String.Join(", ", found) + " (values not shown)");
        }

        private static FakeProbeResult ProcEnv(FakeProbe probe)
        {
            if (!Directory.Exists("/proc")) return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "no /proc on this system");
            byte[] needle = Encoding.UTF8.GetBytes(probe.Target + "=");
            int processes = 0;
            int readable = 0;
            foreach (string directory in Directory.EnumerateDirectories("/proc"))
            {
                string pid = Path.GetFileName(directory);
                if (pid.Length == 0 || !pid.All(Char.IsDigit)) continue;
                processes++;
                byte[] environ;
                try
                {
                    environ = File.ReadAllBytes(Path.Combine(directory, "environ"));
                }
                catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
                {
                    continue;
                }
                readable++;
                if (StartsAnEntry(environ, needle))
                {
                    string command = String.Empty;
                    try
                    {
                        command = File.ReadAllText(Path.Combine(directory, "comm")).Trim();
                    }
                    catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
                    {
                        command = "?";
                    }
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Allowed, "set in pid " + pid + " (" + command + "), value not shown");
                }
            }
            return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "not found in " + readable.ToString(CultureInfo.InvariantCulture) + " readable of " + processes.ToString(CultureInfo.InvariantCulture) + " processes");
        }

        private async Task<FakeProbeResult> ConnectAsync(FakeProbe probe, CancellationToken token)
        {
            if (!TrySplitHostPort(probe.Target, out string host, out int port)) return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Error, "expected host:port");
            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            using (TcpClient client = IPAddress.TryParse(host, out IPAddress? address) ? new TcpClient(address.AddressFamily) : new TcpClient())
            {
                timeout.CancelAfter(_TimeoutMs);
                try
                {
                    await client.ConnectAsync(host, port, timeout.Token).ConfigureAwait(false);
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Allowed, "connected to " + (client.Client.RemoteEndPoint?.ToString() ?? probe.Target));
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "timed out after " + _TimeoutMs.ToString(CultureInfo.InvariantCulture) + " ms");
                }
                catch (SocketException e)
                {
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "SocketException " + e.SocketErrorCode + ": " + e.Message);
                }
            }
        }

        private async Task<FakeProbeResult> HttpAsync(FakeProbe probe, CancellationToken token)
        {
            if (!Uri.TryCreate(probe.Target, UriKind.Absolute, out Uri? uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Error, "expected an http or https URL");

            string? bearer = null;
            try
            {
                if (File.Exists(_ServiceAccountTokenPath)) bearer = File.ReadAllText(_ServiceAccountTokenPath).Trim();
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                bearer = null;
            }

            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.UseProxy = false;
            handler.AllowAutoRedirect = false;
            handler.ConnectTimeout = TimeSpan.FromMilliseconds(_TimeoutMs);
            // The probe asks whether the endpoint answers at all, so a self-signed API server certificate must not stop it.
            handler.SslOptions = new SslClientAuthenticationOptions { RemoteCertificateValidationCallback = (sender, certificate, chain, errors) => true };
            using (HttpClient client = new HttpClient(handler, true))
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, uri))
            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                client.Timeout = System.Threading.Timeout.InfiniteTimeSpan;
                timeout.CancelAfter(_TimeoutMs);
                if (!String.IsNullOrEmpty(bearer)) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
                string credential = String.IsNullOrEmpty(bearer) ? "anonymous" : "with the service account token";
                try
                {
                    using (HttpResponseMessage response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token).ConfigureAwait(false))
                    {
                        int status = (int)response.StatusCode;
                        FakeProbeOutcomeEnum outcome = status >= 200 && status < 300 ? FakeProbeOutcomeEnum.Allowed : FakeProbeOutcomeEnum.Blocked;
                        return new FakeProbeResult(probe.Kind, probe.Target, outcome, "HTTP " + status.ToString(CultureInfo.InvariantCulture) + " " + credential);
                    }
                }
                catch (OperationCanceledException) when (!token.IsCancellationRequested)
                {
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "timed out after " + _TimeoutMs.ToString(CultureInfo.InvariantCulture) + " ms (" + credential + ")");
                }
                catch (HttpRequestException e)
                {
                    return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Blocked, "HttpRequestException: " + e.Message + " (" + credential + ")");
                }
            }
        }

        private static FakeProbeResult Marker(FakeProbe probe)
        {
            string name = probe.Target;
            if (name.Length == 0 || name == "." || name == ".." || name.IndexOfAny(new[] { '/', '\\' }) >= 0 || name.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Error, "a marker name is a plain file name in the working directory");
            string path = Path.Combine(Directory.GetCurrentDirectory(), name);
            try
            {
                string text = (probe.Argument ?? String.Empty) + Environment.NewLine;
                File.WriteAllText(path, text);
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Done, "wrote " + Encoding.UTF8.GetByteCount(text).ToString(CultureInfo.InvariantCulture) + " bytes to " + path);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Error, e.GetType().Name + ": " + e.Message);
            }
        }

        private async Task<FakeProbeResult> HoldAsync(FakeProbe probe, CancellationToken token)
        {
            if (!Int32.TryParse(probe.Target, NumberStyles.Integer, CultureInfo.InvariantCulture, out int ms) || ms < 0)
                return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Error, "expected milliseconds");
            ms = Math.Min(ms, _MaxHoldMs);
            await Task.Delay(ms, token).ConfigureAwait(false);
            return new FakeProbeResult(probe.Kind, probe.Target, FakeProbeOutcomeEnum.Done, "held " + ms.ToString(CultureInfo.InvariantCulture) + " ms");
        }

        private List<string> Glob(string pattern)
        {
            bool rooted = Path.IsPathRooted(pattern);
            string[] segments = pattern.Split(new[] { '/', '\\' }, StringSplitOptions.RemoveEmptyEntries);
            List<string> current = new List<string> { rooted ? Path.GetPathRoot(Path.GetFullPath(pattern)) ?? "/" : Directory.GetCurrentDirectory() };
            for (int i = 0; i < segments.Length; i++)
            {
                string segment = segments[i];
                bool last = i == segments.Length - 1;
                List<string> next = new List<string>();
                foreach (string directory in current)
                {
                    if (segment.IndexOfAny(new[] { '*', '?' }) < 0)
                    {
                        string path = Path.Combine(directory, segment);
                        if (last ? File.Exists(path) || Directory.Exists(path) : Directory.Exists(path)) next.Add(path);
                        continue;
                    }
                    try
                    {
                        IEnumerable<string> entries = last ? Directory.EnumerateFileSystemEntries(directory, segment) : Directory.EnumerateDirectories(directory, segment);
                        foreach (string entry in entries)
                        {
                            next.Add(entry);
                            if (next.Count >= _MaxGlobMatches) break;
                        }
                    }
                    catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is System.Security.SecurityException)
                    {
                        continue;
                    }
                    if (next.Count >= _MaxGlobMatches) break;
                }
                current = next;
                if (current.Count == 0) break;
            }
            current.Sort(StringComparer.Ordinal);
            return current;
        }

        private static bool TrySplitHostPort(string target, out string host, out int port)
        {
            host = String.Empty;
            port = 0;
            string value = target.Trim();
            int colon;
            if (value.StartsWith("[", StringComparison.Ordinal))
            {
                int close = value.IndexOf(']');
                if (close < 0 || close + 1 >= value.Length || value[close + 1] != ':') return false;
                host = value.Substring(1, close - 1);
                colon = close + 1;
            }
            else
            {
                colon = value.LastIndexOf(':');
                if (colon <= 0) return false;
                host = value.Substring(0, colon);
                if (host.Contains(':')) return false;
            }
            return Int32.TryParse(value.Substring(colon + 1), NumberStyles.None, CultureInfo.InvariantCulture, out port) && port >= 1 && port <= 65535 && host.Length > 0;
        }

        private static bool StartsAnEntry(byte[] environ, byte[] needle)
        {
            int start = 0;
            while (start < environ.Length)
            {
                int end = Array.IndexOf(environ, (byte)0, start);
                if (end < 0) end = environ.Length;
                if (end - start >= needle.Length)
                {
                    bool match = true;
                    for (int i = 0; i < needle.Length; i++)
                    {
                        if (environ[start + i] != needle[i])
                        {
                            match = false;
                            break;
                        }
                    }
                    if (match) return true;
                }
                start = end + 1;
            }
            return false;
        }

        #endregion
    }
}
