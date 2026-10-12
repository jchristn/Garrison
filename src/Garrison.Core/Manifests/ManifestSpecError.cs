namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Reflection;
    using System.Text;
    using System.Text.Json;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;

    /// <summary>
    /// Turns a serializer failure on a manifest document's spec into a <see cref="ValidationException"/> with code
    /// ManifestInvalid that names the document, the field, the value given, and what the field accepts (the allowed
    /// values for an enumeration). Type names, line numbers, and byte positions from the serializer never reach the
    /// caller (G-26). Thread-safe (stateless).
    /// </summary>
    public static class ManifestSpecError
    {
        #region Public-Members

        /// <summary>
        /// Error code of the exceptions this class builds.
        /// </summary>
        public static string Code { get; } = "ManifestInvalid";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the validation error for a spec the serializer could not read.
        /// </summary>
        /// <param name="document">Manifest document.</param>
        /// <param name="target">Type the spec was read into.</param>
        /// <param name="error">Serializer error; only its JSON path is used.</param>
        /// <returns>Exception with code ManifestInvalid, one field keyed documents[i].spec.field, and a field code of
        /// NotAllowedValue (enumerations) or WrongType (anything else).</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static ValidationException From(ManifestDocument document, Type target, JsonException error)
        {
            if (document == null) throw new ArgumentNullException(nameof(document));
            if (target == null) throw new ArgumentNullException(nameof(target));
            if (error == null) throw new ArgumentNullException(nameof(error));

            List<string> segments = ParsePath(error.Path);
            string field = FieldName(segments);
            string key = "documents[" + document.Index + "]." + field;
            string subject = document.Kind + " " + document.Metadata.Name + " (documents[" + document.Index + "])";

            Type? fieldType = ResolveType(target, segments);
            bool found;
            object? value = ResolveValue(document.Spec, segments, out found);
            string shown = found ? Describe(value) : String.Empty;

            string detail;
            string fieldCode;
            Type? enumType = fieldType == null ? null : Nullable.GetUnderlyingType(fieldType) ?? fieldType;
            if (enumType != null && enumType.IsEnum)
            {
                fieldCode = "NotAllowedValue";
                detail = field + (found ? " is " + shown + ", which is not an allowed value" : " has a value that is not allowed")
                    + ". Allowed values: " + String.Join(", ", Enum.GetNames(enumType)) + ".";
            }
            else
            {
                fieldCode = "WrongType";
                string expected = fieldType == null ? "a different kind of value" : Expected(fieldType);
                detail = field + (found ? " is " + shown + ", but it" : String.Empty) + " must be " + expected + ".";
            }

            Dictionary<string, string> fields = new Dictionary<string, string>();
            fields[key] = detail;
            Dictionary<string, string> codes = new Dictionary<string, string>();
            codes[key] = fieldCode;
            ValidationException exception = new ValidationException(subject + " has an invalid spec: " + detail, fields, codes);
            exception.Code = Code;
            return exception;
        }

        #endregion

        #region Private-Methods

        private static List<string> ParsePath(string? path)
        {
            // System.Text.Json paths look like $.kind, $.parameters[0].type, or $['odd key'].value.
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

        private static string FieldName(List<string> segments)
        {
            StringBuilder sb = new StringBuilder("spec");
            foreach (string segment in segments)
            {
                if (segment.StartsWith("[", StringComparison.Ordinal)) sb.Append(segment);
                else sb.Append('.').Append(segment);
            }
            return sb.ToString();
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

        private static object? ResolveValue(Dictionary<string, object?> spec, List<string> segments, out bool found)
        {
            object? current = spec;
            found = true;
            foreach (string segment in segments)
            {
                if (segment.StartsWith("[", StringComparison.Ordinal))
                {
                    if (current is IList list && Int32.TryParse(segment.Trim('[', ']'), NumberStyles.Integer, CultureInfo.InvariantCulture, out int index) && index >= 0 && index < list.Count)
                    {
                        current = list[index];
                        continue;
                    }
                    found = false;
                    return null;
                }
                if (current is Dictionary<string, object?> map)
                {
                    KeyValuePair<string, object?> entry = map.FirstOrDefault(e => String.Equals(e.Key, segment, StringComparison.OrdinalIgnoreCase));
                    if (entry.Key != null)
                    {
                        current = entry.Value;
                        continue;
                    }
                }
                found = false;
                return null;
            }
            return current;
        }

        private static string Describe(object? value)
        {
            if (value == null) return "empty";
            if (value is Dictionary<string, object?>) return "a mapping";
            if (value is IList) return "a list";
            string text = TemplateValues.ToText(value);
            if (text.Length > 80) text = text.Substring(0, 80) + "...";
            return "'" + text + "'";
        }

        private static string Expected(Type type)
        {
            Type t = Nullable.GetUnderlyingType(type) ?? type;
            if (t == typeof(string)) return "text";
            if (t == typeof(bool)) return "true or false";
            if (t == typeof(int) || t == typeof(long) || t == typeof(short)) return "a whole number";
            if (t == typeof(double) || t == typeof(decimal) || t == typeof(float)) return "a number";
            if (t == typeof(DateTime) || t == typeof(DateTimeOffset)) return "a date and time such as 2026-12-31T00:00:00Z";
            if (DictionaryValueType(t) != null) return "a mapping of names to values";
            if (t != typeof(string) && ElementType(t) != null) return "a list";
            return "a mapping of fields";
        }

        #endregion
    }
}
