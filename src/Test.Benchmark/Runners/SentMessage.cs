namespace Garrison.Benchmark.Runners
{
    using System;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// One message the messaging command sent, with what the send answered.
    /// </summary>
    public class SentMessage
    {
        /// <summary>
        /// Recipient agent name.
        /// </summary>
        public string Recipient { get; set; } = String.Empty;

        /// <summary>
        /// Normal or Urgent.
        /// </summary>
        public string Urgency { get; set; } = String.Empty;

        /// <summary>
        /// Round, from 0.
        /// </summary>
        public int Round { get; set; }

        /// <summary>
        /// Client latency of the send (ms).
        /// </summary>
        public double LatencyMs { get; set; }

        /// <summary>
        /// True when the send answered 201 with a Queued message.
        /// </summary>
        public bool Accepted { get; set; }

        /// <summary>
        /// The stored message, or null when the send failed without one.
        /// </summary>
        public AgentMessage? Message { get; set; }

        /// <summary>
        /// Why the send was not accepted, or null.
        /// </summary>
        public string? Problem { get; set; }
    }
}
