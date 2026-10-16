namespace Garrison.Core.Telemetry
{
    using System;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Nested application stage metrics and traces. Callers supply fixed component and operation names, never input,
    /// identifiers or URLs. Outcomes and durations include cancellation and failure. Thread-safe and best-effort.
    /// </summary>
    public static class ApplicationOperation
    {
        /// <summary>Measure asynchronous work without changing its result or exception.</summary>
        /// <typeparam name="T">Result type.</typeparam>
        /// <param name="component">Fixed component name.</param>
        /// <param name="operation">Fixed operation name.</param>
        /// <param name="work">Work to measure.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Work result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when work is null.</exception>
        public static async Task<T> MeasureAsync<T>(string component, string operation, Func<CancellationToken, Task<T>> work, CancellationToken token = default)
        {
            if (work == null) throw new ArgumentNullException(nameof(work));
            long started = Stopwatch.GetTimestamp();
            Activity? previous = Activity.Current;
            Activity? activity = GarrisonTracing.Start("stage:" + component + ":" + operation);
            activity?.SetTag("garrison.component", component);
            activity?.SetTag("garrison.operation", operation);
            string result = "ok";
            try
            {
                T value = await work(token).ConfigureAwait(false);
                GarrisonTracing.Ok(activity);
                return value;
            }
            catch (OperationCanceledException)
            {
                result = "cancelled";
                activity?.SetStatus(ActivityStatusCode.Error, "cancelled");
                throw;
            }
            catch (Exception exception)
            {
                result = "error";
                // Exception messages may contain provider credentials, SQL values or user input.
                activity?.SetTag("error.type", exception.GetType().Name);
                activity?.SetStatus(ActivityStatusCode.Error, exception.GetType().Name);
                throw;
            }
            finally
            {
                try
                {
                    activity?.SetTag("garrison.result", result);
                    TagList tags = GarrisonMetrics.Tags("component", component, "operation", operation, "result", result);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.ApplicationOperations, 1, tags);
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.ApplicationOperationDuration, GarrisonMetrics.SecondsSince(started), tags);
                }
                catch (Exception) { }
                finally
                {
                    try { activity?.Dispose(); }
                    catch (Exception) { }
                    try { Activity.Current = previous; }
                    catch (Exception) { }
                }
            }
        }

        /// <summary>Measure asynchronous work without changing its exception.</summary>
        /// <param name="component">Fixed component name.</param>
        /// <param name="operation">Fixed operation name.</param>
        /// <param name="work">Work to measure.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Completion task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when work is null.</exception>
        public static async Task MeasureAsync(string component, string operation, Func<CancellationToken, Task> work, CancellationToken token = default)
        {
            if (work == null) throw new ArgumentNullException(nameof(work));
            await MeasureAsync(component, operation, async ct =>
            {
                await work(ct).ConfigureAwait(false);
                return true;
            }, token).ConfigureAwait(false);
        }
    }
}
