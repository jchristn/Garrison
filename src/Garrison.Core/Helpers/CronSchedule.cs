namespace Garrison.Core.Helpers
{
    using System;
    using Cronos;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Cron schedules of triggers (P12.5): five-field expressions (minute, hour, day of month, month, day of week, with
    /// the Cronos syntax: lists, ranges, steps, names such as MON and JAN, L, W, #, and macros such as @daily) evaluated
    /// in an IANA time zone. Thread-safe.
    /// </summary>
    public static class CronSchedule
    {
        #region Public-Methods

        /// <summary>
        /// Validate an expression and a time zone.
        /// </summary>
        /// <param name="expression">Cron expression.</param>
        /// <param name="timeZone">IANA (or Windows) time zone identifier; null or empty means UTC.</param>
        /// <param name="expressionError">Error for the expression, or null when valid.</param>
        /// <param name="timeZoneError">Error for the time zone, or null when valid.</param>
        /// <returns>True when both are valid.</returns>
        public static bool Validate(string? expression, string? timeZone, out string? expressionError, out string? timeZoneError)
        {
            expressionError = null;
            timeZoneError = null;
            if (String.IsNullOrWhiteSpace(expression))
            {
                expressionError = "A cron expression is required for Cron triggers.";
            }
            else if (expression.Trim().Length > 256)
            {
                expressionError = "Cron expressions are limited to 256 characters.";
            }
            else
            {
                string trimmed = expression.Trim();
                if (!trimmed.StartsWith("@", StringComparison.Ordinal) && trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length != 5)
                {
                    expressionError = "Cron expressions have five fields: minute, hour, day of month, month, and day of week.";
                }
                else
                {
                    try
                    {
                        CronExpression.Parse(trimmed, CronFormat.Standard);
                    }
                    catch (CronFormatException e)
                    {
                        expressionError = "The cron expression is invalid: " + e.Message;
                    }
                }
            }
            if (ResolveZone(timeZone) == null) timeZoneError = "Time zone " + timeZone + " is not known. Use an IANA name such as UTC or America/New_York.";
            return expressionError == null && timeZoneError == null;
        }

        /// <summary>
        /// Next occurrence strictly after a time.
        /// </summary>
        /// <param name="expression">Valid cron expression.</param>
        /// <param name="timeZone">Time zone identifier; null or empty means UTC.</param>
        /// <param name="afterUtc">Time (UTC).</param>
        /// <returns>Next occurrence (UTC), or null when the expression never fires again.</returns>
        /// <exception cref="ArgumentException">Thrown when the expression or time zone is invalid.</exception>
        public static DateTime? Next(string expression, string? timeZone, DateTime afterUtc)
        {
            CronExpression cron = Parse(expression);
            TimeZoneInfo zone = ResolveZone(timeZone) ?? throw new ArgumentException("Time zone " + timeZone + " is not known.", nameof(timeZone));
            return cron.GetNextOccurrence(DateTime.SpecifyKind(afterUtc, DateTimeKind.Utc), zone, false);
        }

        /// <summary>
        /// Latest occurrence at or before a time, searching forward from a known occurrence. Used to collapse missed
        /// occurrences into one fire.
        /// </summary>
        /// <param name="expression">Valid cron expression.</param>
        /// <param name="timeZone">Time zone identifier; null or empty means UTC.</param>
        /// <param name="fromUtc">A known occurrence (UTC) at or before nowUtc.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <returns>The latest occurrence in [fromUtc, nowUtc] (fromUtc itself when no later one is due).</returns>
        /// <exception cref="ArgumentException">Thrown when the expression or time zone is invalid.</exception>
        public static DateTime LatestDue(string expression, string? timeZone, DateTime fromUtc, DateTime nowUtc)
        {
            CronExpression cron = Parse(expression);
            TimeZoneInfo zone = ResolveZone(timeZone) ?? throw new ArgumentException("Time zone " + timeZone + " is not known.", nameof(timeZone));
            DateTime latest = DateTime.SpecifyKind(fromUtc, DateTimeKind.Utc);
            DateTime now = DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc);

            // Bounded walk: a schedule that fires every minute and was down for a year still finishes quickly.
            for (int i = 0; i < 600000; i++)
            {
                DateTime? next = cron.GetNextOccurrence(latest, zone, false);
                if (!next.HasValue || next.Value > now) break;
                latest = next.Value;
            }
            return latest;
        }

        /// <summary>
        /// The next fire time to store for a trigger being saved: null unless it is an active Cron trigger; the stored
        /// value when the schedule, time zone, and active state did not change (so an edit never skips or repeats an
        /// occurrence); otherwise the first occurrence after now. Activating a trigger again never catches up on the time
        /// it was inactive.
        /// </summary>
        /// <param name="trigger">Trigger being saved (valid cron expression and time zone when it is a Cron trigger).</param>
        /// <param name="existing">Stored trigger, or null on create.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <returns>Next fire time (UTC), or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when trigger is null.</exception>
        public static DateTime? NextFireFor(Trigger trigger, Trigger? existing, DateTime nowUtc)
        {
            if (trigger == null) throw new ArgumentNullException(nameof(trigger));
            if (trigger.Type != TriggerTypeEnum.Cron || !trigger.Active || String.IsNullOrWhiteSpace(trigger.CronExpression)) return null;
            if (existing != null
                && existing.Type == trigger.Type
                && existing.Active
                && existing.NextFireUtc.HasValue
                && String.Equals(existing.CronExpression, trigger.CronExpression, StringComparison.Ordinal)
                && String.Equals(existing.TimeZone, trigger.TimeZone, StringComparison.Ordinal))
            {
                return existing.NextFireUtc;
            }
            return Next(trigger.CronExpression, trigger.TimeZone, nowUtc);
        }

        /// <summary>
        /// Resolve a time zone identifier.
        /// </summary>
        /// <param name="timeZone">Identifier; null or empty means UTC.</param>
        /// <returns>Time zone, or null when unknown.</returns>
        public static TimeZoneInfo? ResolveZone(string? timeZone)
        {
            if (String.IsNullOrWhiteSpace(timeZone) || String.Equals(timeZone.Trim(), "UTC", StringComparison.OrdinalIgnoreCase)) return TimeZoneInfo.Utc;
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZone.Trim());
            }
            catch (TimeZoneNotFoundException)
            {
                return null;
            }
            catch (InvalidTimeZoneException)
            {
                return null;
            }
        }

        #endregion

        #region Private-Methods

        private static CronExpression Parse(string expression)
        {
            if (String.IsNullOrWhiteSpace(expression)) throw new ArgumentException("A cron expression is required.", nameof(expression));
            try
            {
                return CronExpression.Parse(expression.Trim(), CronFormat.Standard);
            }
            catch (CronFormatException e)
            {
                throw new ArgumentException("The cron expression is invalid: " + e.Message, nameof(expression), e);
            }
        }

        #endregion
    }
}
