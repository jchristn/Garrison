namespace Garrison.Core.Serialization
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reflection;
    using System.Text.Json;
    using System.Text.RegularExpressions;

    /// <summary>
    /// Turns a System.Text.Json deserialization error into a message a caller can act on: the field path in the request
    /// body, a plain type name such as "a whole number", and for enums the allowed values. The .NET type name and the
    /// parser's byte positions never reach the caller for a value of the wrong type. Thread-safe.
    /// </summary>
    public static class JsonErrorDescriber
    {
        #region Private-Members

        private static readonly Regex _ConvertedTo = new Regex(@"could not be converted to (?<type>[^\s]+?)\.\s+Path:", RegexOptions.Compiled);

        #endregion

        #region Public-Methods

        /// <summary>
        /// The field path the error is about, without the leading "$." (for example minIntervalSeconds or
        /// signals[0].name), or null when the error is about the body as a whole or carries no path.
        /// </summary>
        /// <param name="error">Deserialization error.</param>
        /// <returns>Field path, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when error is null.</exception>
        public static string? FieldPath(JsonException error)
        {
            if (error == null) throw new ArgumentNullException(nameof(error));
            string? path = error.Path;
            if (String.IsNullOrEmpty(path) || path == "$") return null;
            if (path.StartsWith("$.", StringComparison.Ordinal)) return path.Substring(2);
            if (path.StartsWith("$", StringComparison.Ordinal)) return path.Substring(1);
            return path;
        }

        /// <summary>
        /// Whether the error is a value of the wrong type (as opposed to JSON that does not parse at all).
        /// </summary>
        /// <param name="error">Deserialization error.</param>
        /// <returns>True for a type mismatch.</returns>
        /// <exception cref="ArgumentNullException">Thrown when error is null.</exception>
        public static bool IsTypeMismatch(JsonException error)
        {
            if (error == null) throw new ArgumentNullException(nameof(error));
            return _ConvertedTo.IsMatch(error.Message ?? String.Empty);
        }

        /// <summary>
        /// A message for the caller when the target type is not known. Same as <see cref="Describe(Type, JsonException)"/>
        /// but the expected type is read from the error alone.
        /// </summary>
        /// <param name="error">Deserialization error.</param>
        /// <returns>Message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when error is null.</exception>
        public static string Describe(JsonException error)
        {
            if (error == null) throw new ArgumentNullException(nameof(error));
            return Describe(null, error);
        }

        /// <summary>
        /// A message for the caller. A value of the wrong type reads "minIntervalSeconds must be a whole number." or
        /// "wakeMode must be one of Fixed, Backoff."; JSON that does not parse reads "The request body is not valid JSON: "
        /// followed by the parser's description, which names the line and position.
        /// </summary>
        /// <param name="target">Type the body was read into, or null when unknown; used to find the field's type.</param>
        /// <param name="error">Deserialization error.</param>
        /// <returns>Message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when error is null.</exception>
        public static string Describe(Type? target, JsonException error)
        {
            if (error == null) throw new ArgumentNullException(nameof(error));
            string message = error.Message ?? String.Empty;
            Match match = _ConvertedTo.Match(message);
            if (!match.Success) return "The request body is not valid JSON: " + message;
            string? field = FieldPath(error);
            Type? fieldType = target != null ? ResolveType(target, ParsePath(error.Path)) : null;
            if (fieldType == null) fieldType = ResolveName(match.Groups["type"].Value);
            string expected = fieldType != null ? Expected(fieldType) : "a different kind of value";
            return (field != null ? field : "The request body") + " must be " + expected + ".";
        }

        #endregion

        #region Private-Methods

        private static List<string> ParsePath(string? path)
        {
            // Paths look like $.kind, $.signals[0].name, or $['odd key'].value.
            List<string> segments = new List<string>();
            if (String.IsNullOrEmpty(path)) return segments;
            int i = path.StartsWith("$", StringComparison.Ordinal) ? 1 : 0;
            while (i < path.Length)
            {
                char c = path[i];
                if (c == '.')
                {
                    int start = ++i;
                    while (i < path.Length && path[i] != '.' && path[i] != '[') i++;
                    if (i > start) segments.Add(path.Substring(start, i - start));
                }
                else if (c == '[')
                {
                    int end = path.IndexOf(']', i);
                    if (end < 0) break;
                    string inner = path.Substring(i + 1, end - i - 1);
                    if (inner.Length >= 2 && inner[0] == '\'' && inner[inner.Length - 1] == '\'') segments.Add(inner.Substring(1, inner.Length - 2));
                    else segments.Add("[" + inner + "]");
                    i = end + 1;
                }
                else
                {
                    i++;
                }
            }
            return segments;
        }

        private static Type? ResolveType(Type target, List<string> segments)
        {
            Type? current = target;
            foreach (string segment in segments)
            {
                if (current == null) return null;
                current = Nullable.GetUnderlyingType(current) ?? current;
                if (segment.StartsWith("[", StringComparison.Ordinal))
                {
                    current = ElementType(current);
                    continue;
                }
                Type? dictionaryValue = DictionaryValueType(current);
                if (dictionaryValue != null)
                {
                    current = dictionaryValue;
                    continue;
                }
                PropertyInfo? property = current.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .FirstOrDefault(p => String.Equals(p.Name, segment, StringComparison.OrdinalIgnoreCase));
                current = property?.PropertyType;
            }
            return current;
        }

        private static Type? ResolveName(string name)
        {
            string inner = name;
            if (inner.StartsWith("System.Nullable`1[", StringComparison.Ordinal) && inner.EndsWith("]", StringComparison.Ordinal))
            {
                inner = inner.Substring("System.Nullable`1[".Length, inner.Length - "System.Nullable`1[".Length - 1);
            }
            if (inner.IndexOf('`') >= 0 || inner.IndexOf('[') >= 0) return null;
            Type? type = Type.GetType(inner, false);
            if (type != null) return type;
            return AppDomain.CurrentDomain.GetAssemblies()
                .Select(a => a.GetType(inner, false))
                .FirstOrDefault(t => t != null);
        }

        private static Type? ElementType(Type type)
        {
            if (type.IsArray) return type.GetElementType();
            Type? enumerable = type.GetInterfaces().Concat(new[] { type })
                .FirstOrDefault(t => t.IsGenericType && t.GetGenericTypeDefinition() == typeof(IEnumerable<>));
            return enumerable?.GetGenericArguments()[0];
        }

        private static Type? DictionaryValueType(Type type)
        {
            Type? dictionary = type.GetInterfaces().Concat(new[] { type })
                .FirstOrDefault(t => t.IsGenericType && t.GetGenericTypeDefinition() == typeof(IDictionary<,>));
            return dictionary?.GetGenericArguments()[1];
        }

        private static string Expected(Type type)
        {
            Type t = Nullable.GetUnderlyingType(type) ?? type;
            if (t.IsEnum) return "one of " + String.Join(", ", Enum.GetNames(t));
            if (t == typeof(string)) return "text";
            if (t == typeof(bool)) return "true or false";
            if (t == typeof(int) || t == typeof(long) || t == typeof(short) || t == typeof(byte) || t == typeof(uint) || t == typeof(ulong) || t == typeof(ushort) || t == typeof(sbyte)) return "a whole number";
            if (t == typeof(double) || t == typeof(decimal) || t == typeof(float)) return "a number";
            if (t == typeof(DateTime) || t == typeof(DateTimeOffset)) return "a date and time such as 2026-12-31T00:00:00Z";
            if (t == typeof(TimeSpan)) return "a duration such as 00:05:00";
            if (DictionaryValueType(t) != null) return "an object of names to values";
            if (ElementType(t) != null) return "a list";
            return "an object";
        }

        #endregion
    }
}
