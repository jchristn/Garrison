namespace Garrison.Benchmark
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;

    /// <summary>
    /// Command-line arguments: a command word, then --name value pairs, with a bare --flag meaning true. Typed getters
    /// record every option the run used, including defaults, so the report can reproduce the run. Options named in
    /// <see cref="SecretOptions"/> are never recorded. Not thread-safe; read options on one thread.
    /// </summary>
    public class BenchmarkArguments
    {
        #region Public-Members

        /// <summary>
        /// Options whose values are credentials and are never written into a report.
        /// </summary>
        public static readonly IReadOnlyList<string> SecretOptions = new List<string> { "admin-key" };

        /// <summary>
        /// Options that describe the stack rather than the command; scripts pass them to every measuring command, so
        /// a command that does not need one does not warn about it.
        /// </summary>
        public static readonly IReadOnlyList<string> AmbientOptions = new List<string> { "url", "stack", "stack-details", "kubeconfig", "context", "namespace", "fake-harness", "shared-note", "results-dir" };

        /// <summary>
        /// The command word, lowercased; empty when none was given.
        /// </summary>
        public string Command { get; }

        /// <summary>
        /// The command line as given, with secret option values masked.
        /// </summary>
        public string CommandLine { get; }

        /// <summary>
        /// Every option read so far with the value used (default or given), secrets excluded.
        /// </summary>
        public SortedDictionary<string, string> Used
        {
            get
            {
                return new SortedDictionary<string, string>(_Used, StringComparer.Ordinal);
            }
        }

        #endregion

        #region Private-Members

        private readonly Dictionary<string, string> _Values = new Dictionary<string, string>(StringComparer.Ordinal);
        private readonly SortedDictionary<string, string> _Used = new SortedDictionary<string, string>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Parse arguments.
        /// </summary>
        /// <param name="args">Arguments as given to Main.</param>
        /// <exception cref="ArgumentNullException">Thrown when args is null.</exception>
        /// <exception cref="ArgumentException">Thrown when an argument is not an option or an option repeats.</exception>
        public BenchmarkArguments(string[] args)
        {
            if (args == null) throw new ArgumentNullException(nameof(args));
            List<string> line = new List<string> { "Garrison.Benchmark" };
            int start = 0;
            if (args.Length > 0 && !args[0].StartsWith("--", StringComparison.Ordinal))
            {
                Command = args[0].ToLowerInvariant();
                line.Add(args[0]);
                start = 1;
            }
            else
            {
                Command = String.Empty;
            }

            for (int i = start; i < args.Length; i++)
            {
                string arg = args[i];
                if (!arg.StartsWith("--", StringComparison.Ordinal) || arg.Length < 3) throw new ArgumentException("Unexpected argument '" + arg + "'. Options look like --name value or --flag.");
                string name = arg.Substring(2).ToLowerInvariant();
                string value = "true";
                if (i + 1 < args.Length && !args[i + 1].StartsWith("--", StringComparison.Ordinal))
                {
                    value = args[i + 1];
                    i++;
                }
                if (_Values.ContainsKey(name)) throw new ArgumentException("Option --" + name + " is given more than once.");
                _Values[name] = value;
                line.Add("--" + name);
                if (value != "true" || (i < args.Length && args[i] == value)) line.Add(SecretOptions.Contains(name) ? "***" : Quote(value));
            }
            CommandLine = String.Join(" ", line);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether an option was given.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <returns>True when given.</returns>
        public bool Has(string name)
        {
            return _Values.ContainsKey(name);
        }

        /// <summary>
        /// String option.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default.</param>
        /// <param name="environmentVariable">Environment variable consulted when the option is absent, or null.</param>
        /// <returns>Value.</returns>
        public string GetString(string name, string defaultValue, string? environmentVariable = null)
        {
            string value = defaultValue;
            if (_Values.TryGetValue(name, out string? given)) value = given;
            else if (environmentVariable != null && !String.IsNullOrEmpty(Environment.GetEnvironmentVariable(environmentVariable))) value = Environment.GetEnvironmentVariable(environmentVariable)!;
            Record(name, value);
            return value;
        }

        /// <summary>
        /// Optional string option; null when absent.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="environmentVariable">Environment variable consulted when the option is absent, or null.</param>
        /// <returns>Value or null.</returns>
        public string? GetOptional(string name, string? environmentVariable = null)
        {
            string? value = null;
            if (_Values.TryGetValue(name, out string? given)) value = given;
            else if (environmentVariable != null && !String.IsNullOrEmpty(Environment.GetEnvironmentVariable(environmentVariable))) value = Environment.GetEnvironmentVariable(environmentVariable);
            Record(name, value ?? "(unset)");
            return value;
        }

        /// <summary>
        /// Integer option.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default.</param>
        /// <param name="minimum">Minimum.</param>
        /// <param name="maximum">Maximum.</param>
        /// <returns>Value.</returns>
        /// <exception cref="ArgumentException">Thrown when the value is not an integer in range.</exception>
        public int GetInt(string name, int defaultValue, int minimum, int maximum)
        {
            int value = defaultValue;
            if (_Values.TryGetValue(name, out string? given))
            {
                if (!Int32.TryParse(given, NumberStyles.Integer, CultureInfo.InvariantCulture, out value)) throw new ArgumentException("--" + name + " must be an integer, not '" + given + "'.");
            }
            if (value < minimum || value > maximum) throw new ArgumentException("--" + name + " must be between " + minimum.ToString(CultureInfo.InvariantCulture) + " and " + maximum.ToString(CultureInfo.InvariantCulture) + ".");
            Record(name, value.ToString(CultureInfo.InvariantCulture));
            return value;
        }

        /// <summary>
        /// Double option.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default.</param>
        /// <param name="minimum">Minimum.</param>
        /// <param name="maximum">Maximum.</param>
        /// <returns>Value.</returns>
        /// <exception cref="ArgumentException">Thrown when the value is not a number in range.</exception>
        public double GetDouble(string name, double defaultValue, double minimum, double maximum)
        {
            double value = defaultValue;
            if (_Values.TryGetValue(name, out string? given))
            {
                if (!Double.TryParse(given, NumberStyles.Float, CultureInfo.InvariantCulture, out value)) throw new ArgumentException("--" + name + " must be a number, not '" + given + "'.");
            }
            if (value < minimum || value > maximum) throw new ArgumentException("--" + name + " must be between " + minimum.ToString(CultureInfo.InvariantCulture) + " and " + maximum.ToString(CultureInfo.InvariantCulture) + ".");
            Record(name, value.ToString("R", CultureInfo.InvariantCulture));
            return value;
        }

        /// <summary>
        /// Boolean flag: a bare --flag or --flag true means true.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default.</param>
        /// <returns>Value.</returns>
        /// <exception cref="ArgumentException">Thrown when the value is not true or false.</exception>
        public bool GetBool(string name, bool defaultValue)
        {
            bool value = defaultValue;
            if (_Values.TryGetValue(name, out string? given))
            {
                if (!Boolean.TryParse(given, out value)) throw new ArgumentException("--" + name + " must be true or false, not '" + given + "'.");
            }
            Record(name, value ? "true" : "false");
            return value;
        }

        /// <summary>
        /// Comma-separated list of integers.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default, comma-separated.</param>
        /// <param name="minimum">Minimum per value.</param>
        /// <param name="maximum">Maximum per value.</param>
        /// <returns>Values.</returns>
        /// <exception cref="ArgumentException">Thrown when a value is not an integer in range.</exception>
        public List<int> GetIntList(string name, string defaultValue, int minimum, int maximum)
        {
            string text = _Values.TryGetValue(name, out string? given) ? given : defaultValue;
            List<int> values = new List<int>();
            foreach (string part in text.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!Int32.TryParse(part, NumberStyles.Integer, CultureInfo.InvariantCulture, out int value) || value < minimum || value > maximum)
                    throw new ArgumentException("--" + name + " takes integers between " + minimum.ToString(CultureInfo.InvariantCulture) + " and " + maximum.ToString(CultureInfo.InvariantCulture) + "; '" + part + "' is not one.");
                values.Add(value);
            }
            Record(name, String.Join(",", values.Select(v => v.ToString(CultureInfo.InvariantCulture))));
            return values;
        }

        /// <summary>
        /// Comma-separated list of numbers.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default, comma-separated.</param>
        /// <param name="minimum">Minimum per value.</param>
        /// <param name="maximum">Maximum per value.</param>
        /// <returns>Values.</returns>
        /// <exception cref="ArgumentException">Thrown when a value is not a number in range.</exception>
        public List<double> GetDoubleList(string name, string defaultValue, double minimum, double maximum)
        {
            string text = _Values.TryGetValue(name, out string? given) ? given : defaultValue;
            List<double> values = new List<double>();
            foreach (string part in text.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!Double.TryParse(part, NumberStyles.Float, CultureInfo.InvariantCulture, out double value) || value < minimum || value > maximum)
                    throw new ArgumentException("--" + name + " takes numbers between " + minimum.ToString(CultureInfo.InvariantCulture) + " and " + maximum.ToString(CultureInfo.InvariantCulture) + "; '" + part + "' is not one.");
                values.Add(value);
            }
            Record(name, String.Join(",", values.Select(v => v.ToString("R", CultureInfo.InvariantCulture))));
            return values;
        }

        /// <summary>
        /// Comma-separated list of strings.
        /// </summary>
        /// <param name="name">Option name without dashes.</param>
        /// <param name="defaultValue">Default, comma-separated.</param>
        /// <returns>Values.</returns>
        public List<string> GetList(string name, string defaultValue)
        {
            string text = _Values.TryGetValue(name, out string? given) ? given : defaultValue;
            List<string> values = text.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
            Record(name, String.Join(",", values));
            return values;
        }

        /// <summary>
        /// Options that were given but never read, which usually means a typo.
        /// </summary>
        /// <returns>Option names.</returns>
        public List<string> Unread()
        {
            return _Values.Keys.Where(k => !_Used.ContainsKey(k) && !SecretOptions.Contains(k) && !AmbientOptions.Contains(k)).OrderBy(k => k, StringComparer.Ordinal).ToList();
        }

        #endregion

        #region Private-Methods

        private void Record(string name, string value)
        {
            if (SecretOptions.Contains(name)) return;
            _Used[name] = value;
        }

        private static string Quote(string value)
        {
            if (value.Length > 0 && value.IndexOfAny(new char[] { ' ', '"', '\'' }) < 0) return value;
            return "\"" + value.Replace("\"", "\\\"", StringComparison.Ordinal) + "\"";
        }

        #endregion
    }
}
