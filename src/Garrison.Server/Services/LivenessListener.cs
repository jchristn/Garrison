namespace Garrison.Server.Services
{
    using System;
    using System.IO;
    using System.Net;
    using System.Net.Sockets;
    using System.Text;
    using System.Threading;
    using Garrison.Core;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Answers liveness probes (GET /v1.0/api/health/live) on a port of its own, from one dedicated thread with
    /// blocking sockets (G-24). It never touches the database, the REST listener's request queue, or the thread pool,
    /// so a replica whose API is saturated (every request slot held, the database pool exhausted, the thread pool
    /// starved) still answers its liveness probe and is not restarted; readiness on the REST port stays the signal
    /// that sheds traffic. Every other path answers 404. Each connection gets one response and is closed; slow clients
    /// are cut off after <see cref="IoTimeoutMs"/>. Thread-safe.
    /// </summary>
    public class LivenessListener : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// Port this listener binds. 1 to 65535.
        /// </summary>
        public int Port
        {
            get
            {
                return _Port;
            }
        }

        /// <summary>
        /// Whether the listener is accepting connections.
        /// </summary>
        public bool Listening
        {
            get
            {
                return Volatile.Read(ref _Listening) == 1;
            }
        }

        /// <summary>
        /// Status reported in the body: starting until set, then usually alive or draining. Read on every probe; must be
        /// cheap and must not block. Null is treated as returning alive.
        /// </summary>
        public Func<string> Status
        {
            get
            {
                return _Status;
            }
            set
            {
                _Status = value ?? (() => "alive");
            }
        }

        /// <summary>
        /// Read and write timeout for one probe connection in milliseconds. Minimum 100, maximum 30000, default 2000.
        /// </summary>
        public int IoTimeoutMs
        {
            get
            {
                return _IoTimeoutMs;
            }
            set
            {
                _IoTimeoutMs = Math.Clamp(value, 100, 30000);
            }
        }

        /// <summary>
        /// Probes answered since the listener started.
        /// </summary>
        public long Answered
        {
            get
            {
                return Interlocked.Read(ref _Answered);
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _LivePath = "/v1.0/api/health/live";

        private readonly string _Hostname;
        private readonly int _Port;
        private readonly string _NodeId;
        private readonly object _Lock = new object();
        private Func<string> _Status = () => "starting";
        private int _IoTimeoutMs = 2000;
        private TcpListener? _Listener = null;
        private Thread? _Thread = null;
        private int _Listening = 0;
        private long _Answered = 0;
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate. Call <see cref="Start"/> to bind.
        /// </summary>
        /// <param name="hostname">Bind hostname: * or + for every interface, an IP address, or a host name that resolves
        /// to one.</param>
        /// <param name="port">Port, 1 to 65535.</param>
        /// <param name="nodeId">Node identifier reported in answers.</param>
        /// <exception cref="ArgumentNullException">Thrown when hostname is null or empty.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when port is outside 1 to 65535.</exception>
        public LivenessListener(string hostname, int port, string nodeId)
        {
            if (String.IsNullOrEmpty(hostname)) throw new ArgumentNullException(nameof(hostname));
            if (port < 1 || port > 65535) throw new ArgumentOutOfRangeException(nameof(port), "Port must be between 1 and 65535.");
            _Hostname = hostname;
            _Port = port;
            _NodeId = nodeId ?? String.Empty;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Bind and start answering on a dedicated background thread.
        /// </summary>
        /// <returns>True when listening; false when the port could not be bound.</returns>
        /// <exception cref="ObjectDisposedException">Thrown after disposal.</exception>
        public bool Start()
        {
            lock (_Lock)
            {
                if (_Disposed) throw new ObjectDisposedException(nameof(LivenessListener));
                if (_Listener != null) return Listening;
                TcpListener listener = new TcpListener(BindAddress(), _Port);
                try
                {
                    if (listener.LocalEndpoint is IPEndPoint endpoint && endpoint.AddressFamily == AddressFamily.InterNetworkV6) listener.Server.DualMode = true;
                    listener.Start(64);
                }
                catch (SocketException)
                {
                    return false;
                }
                _Listener = listener;
                Volatile.Write(ref _Listening, 1);
                _Thread = new Thread(() => AcceptLoop(listener));
                _Thread.IsBackground = true;
                _Thread.Name = "garrison-liveness";
                _Thread.Start();
                return true;
            }
        }

        /// <summary>
        /// Stop answering and release the port.
        /// </summary>
        public void Stop()
        {
            Thread? thread;
            lock (_Lock)
            {
                if (_Listener == null) return;
                Volatile.Write(ref _Listening, 0);
                try
                {
                    _Listener.Stop();
                }
                catch (SocketException)
                {
                }
                _Listener = null;
                thread = _Thread;
                _Thread = null;
            }
            thread?.Join(TimeSpan.FromSeconds(5));
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) Stop();
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private IPAddress BindAddress()
        {
            if (_Hostname == "*" || _Hostname == "+" || _Hostname == "0.0.0.0") return IPAddress.Any;
            if (IPAddress.TryParse(_Hostname, out IPAddress? parsed)) return parsed;
            try
            {
                foreach (IPAddress address in Dns.GetHostAddresses(_Hostname))
                {
                    if (address.AddressFamily == AddressFamily.InterNetwork) return address;
                }
            }
            catch (SocketException)
            {
            }
            return IPAddress.Loopback;
        }

        private void AcceptLoop(TcpListener listener)
        {
            while (Volatile.Read(ref _Listening) == 1)
            {
                TcpClient client;
                try
                {
                    client = listener.AcceptTcpClient();
                }
                catch (SocketException)
                {
                    return;
                }
                catch (ObjectDisposedException)
                {
                    return;
                }
                catch (InvalidOperationException)
                {
                    return;
                }

                try
                {
                    using (client)
                    {
                        Answer(client);
                    }
                }
                catch (Exception e) when (e is IOException || e is SocketException || e is ObjectDisposedException)
                {
                    // One bad probe connection never stops the listener.
                }
            }
        }

        private void Answer(TcpClient client)
        {
            client.ReceiveTimeout = _IoTimeoutMs;
            client.SendTimeout = _IoTimeoutMs;
            client.NoDelay = true;
            NetworkStream stream = client.GetStream();

            byte[] buffer = new byte[4096];
            int total = 0;
            while (total < buffer.Length)
            {
                int read = stream.Read(buffer, total, buffer.Length - total);
                if (read <= 0) break;
                total += read;
                if (HeadersComplete(buffer, total)) break;
            }

            string head = Encoding.ASCII.GetString(buffer, 0, total);
            int lineEnd = head.IndexOf("\r\n", StringComparison.Ordinal);
            string requestLine = lineEnd >= 0 ? head.Substring(0, lineEnd) : head;
            string[] parts = requestLine.Split(' ');
            string method = parts.Length > 0 ? parts[0] : String.Empty;
            string target = parts.Length > 1 ? parts[1] : String.Empty;
            int query = target.IndexOf('?');
            string path = (query >= 0 ? target.Substring(0, query) : target).TrimEnd('/');

            bool known = String.Equals(path, _LivePath, StringComparison.OrdinalIgnoreCase) || path.Length == 0;
            bool allowed = String.Equals(method, "GET", StringComparison.OrdinalIgnoreCase) || String.Equals(method, "HEAD", StringComparison.OrdinalIgnoreCase);
            int status = known && allowed ? 200 : (known ? 405 : 404);

            string body;
            if (status == 200)
            {
                HealthResponse health = new HealthResponse();
                health.Node = _NodeId;
                health.Version = Constants.ProductVersion;
                string state;
                try
                {
                    state = _Status() ?? "alive";
                }
                catch (Exception)
                {
                    state = "alive";
                }
                health.Status = state;
                health.Database = "unchecked";
                body = Serializer.Serialize(health);
            }
            else
            {
                body = status == 404
                    ? "{\"error\":\"NotFound\",\"code\":\"RouteNotFound\",\"message\":\"The liveness port answers GET /v1.0/api/health/live only.\"}"
                    : "{\"error\":\"MethodNotAllowed\",\"code\":\"MethodNotAllowed\",\"message\":\"Use GET or HEAD.\"}";
            }

            byte[] payload = Encoding.UTF8.GetBytes(body);
            string reason = status == 200 ? "OK" : (status == 404 ? "Not Found" : "Method Not Allowed");
            string headers = "HTTP/1.1 " + status + " " + reason + "\r\nContent-Type: application/json\r\nContent-Length: " + payload.Length + "\r\nConnection: close\r\nCache-Control: no-store\r\n\r\n";
            stream.Write(Encoding.ASCII.GetBytes(headers));
            if (!String.Equals(method, "HEAD", StringComparison.OrdinalIgnoreCase)) stream.Write(payload);
            stream.Flush();
            Interlocked.Increment(ref _Answered);
        }

        private static bool HeadersComplete(byte[] buffer, int length)
        {
            for (int i = 3; i < length; i++)
            {
                if (buffer[i - 3] == '\r' && buffer[i - 2] == '\n' && buffer[i - 1] == '\r' && buffer[i] == '\n') return true;
            }
            return false;
        }

        #endregion
    }
}
