namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text.RegularExpressions;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;
    using YamlDotNet.Core;
    using YamlDotNet.RepresentationModel;
    using YamlDotNet.Serialization;

    /// <summary>
    /// Parses multi-document YAML (or JSON, a YAML subset) into manifest documents and writes value trees back as YAML.
    /// Plain YAML scalars are typed (booleans, integers, decimals, null); quoted scalars stay strings. Thread-safe.
    /// </summary>
    public static class ManifestParser
    {
        #region Private-Members

        private static readonly Regex _Integer = new Regex("^[-+]?[0-9]+$", RegexOptions.Compiled);
        private static readonly Regex _Decimal = new Regex("^[-+]?([0-9]*\\.[0-9]+|[0-9]+\\.[0-9]*)([eE][-+]?[0-9]+)?$", RegexOptions.Compiled);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse manifest text.
        /// </summary>
        /// <param name="text">YAML or JSON text; YAML may contain several documents separated by ---, and a JSON or YAML list at the root is treated as several documents.</param>
        /// <returns>Documents.</returns>
        /// <exception cref="ValidationException">Thrown when the text is not valid YAML or a document is malformed.</exception>
        public static List<ManifestDocument> Parse(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) throw new ValidationException("The manifest body is empty.");

            YamlStream stream = new YamlStream();
            try
            {
                stream.Load(new StringReader(text));
            }
            catch (YamlException e)
            {
                throw new ValidationException("The manifest is not valid YAML or JSON at line " + e.Start.Line + ", column " + e.Start.Column + ": " + e.Message);
            }

            List<object?> roots = new List<object?>();
            foreach (YamlDocument document in stream.Documents)
            {
                object? root = Convert(document.RootNode);
                if (root is List<object?> list) roots.AddRange(list);
                else if (root != null) roots.Add(root);
            }

            List<ManifestDocument> documents = new List<ManifestDocument>();
            Dictionary<string, string> errors = new Dictionary<string, string>();
            for (int i = 0; i < roots.Count; i++)
            {
                if (roots[i] is not Dictionary<string, object?> map)
                {
                    errors["documents[" + i + "]"] = "Each document must be a mapping with apiVersion, kind, metadata, and spec.";
                    continue;
                }
                ManifestDocument doc = new ManifestDocument();
                doc.Index = i;
                doc.ApiVersion = TemplateValues.ToText(Get(map, "apiVersion"));
                doc.Kind = TemplateValues.ToText(Get(map, "kind"));
                if (Get(map, "metadata") is Dictionary<string, object?> metadata)
                {
                    doc.Metadata.Name = TemplateValues.ToText(Get(metadata, "name"));
                    object? description = Get(metadata, "description");
                    doc.Metadata.Description = description == null ? null : TemplateValues.ToText(description);
                }
                if (Get(map, "spec") is Dictionary<string, object?> spec) doc.Spec = spec;
                documents.Add(doc);
            }
            if (errors.Count > 0) throw new ValidationException("The manifest contains malformed documents.", errors);
            return documents;
        }

        /// <summary>
        /// Write documents as multi-document YAML.
        /// </summary>
        /// <param name="documents">Documents as value trees (apiVersion, kind, metadata, spec).</param>
        /// <returns>YAML text.</returns>
        public static string ToYaml(IEnumerable<Dictionary<string, object?>> documents)
        {
            ISerializer serializer = new SerializerBuilder().DisableAliases().Build();
            List<string> parts = new List<string>();
            foreach (Dictionary<string, object?> document in documents) parts.Add(serializer.Serialize(document).TrimEnd());
            return String.Join(Environment.NewLine + "---" + Environment.NewLine, parts) + Environment.NewLine;
        }

        #endregion

        #region Private-Methods

        private static object? Get(Dictionary<string, object?> map, string key)
        {
            return map.TryGetValue(key, out object? value) ? value : null;
        }

        private static object? Convert(YamlNode? node)
        {
            switch (node)
            {
                case null:
                    return null;
                case YamlMappingNode mapping:
                    Dictionary<string, object?> map = TemplateContext.NewMap();
                    foreach (KeyValuePair<YamlNode, YamlNode> entry in mapping.Children)
                    {
                        string key = entry.Key is YamlScalarNode scalarKey ? scalarKey.Value ?? String.Empty : entry.Key.ToString();
                        map[key] = Convert(entry.Value);
                    }
                    return map;
                case YamlSequenceNode sequence:
                    return sequence.Children.Select(Convert).ToList();
                case YamlScalarNode scalar:
                    return Scalar(scalar);
                default:
                    return node.ToString();
            }
        }

        private static object? Scalar(YamlScalarNode scalar)
        {
            string value = scalar.Value ?? String.Empty;
            if (scalar.Style != ScalarStyle.Plain) return value;
            if (value.Length == 0 || value == "~" || value.Equals("null", StringComparison.OrdinalIgnoreCase)) return null;
            if (value.Equals("true", StringComparison.OrdinalIgnoreCase)) return true;
            if (value.Equals("false", StringComparison.OrdinalIgnoreCase)) return false;
            if (_Integer.IsMatch(value) && Int64.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out long l)) return l;
            if (_Decimal.IsMatch(value) && Double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out double d)) return d;
            return value;
        }

        #endregion
    }
}
