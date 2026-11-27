namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;
    using Garrison.Core.Templates;

    /// <summary>
    /// Field-level differences between two Organization specs, matched by identity rather than by position. Units are
    /// matched by name wherever they sit in the tree, members by agent, budgets by period, and peers as a set, so a reorder
    /// is no change, a removed unit is one change (<c>units.uptime</c>), and a moved unit is one <c>parent</c> change.
    /// Paths read <c>units.{unit}.{field}</c>, <c>units.{unit}.members.{agent}</c>, <c>units.{unit}.peers.{peer}</c>, and
    /// <c>units.{unit}.budgets.{period}</c>; organization fields keep their own names (<c>mission</c>). Unit, agent, and
    /// period names compare without case, as they do everywhere else. Stateless and thread-safe.
    /// </summary>
    public static class OrgTreeDiff
    {
        #region Public-Methods

        /// <summary>
        /// Compare two Organization specs in the shape a manifest document or export uses (<c>units</c> nested under
        /// their parents in <c>units</c>).
        /// </summary>
        /// <param name="before">Spec before, or null for a new organization.</param>
        /// <param name="after">Spec after, or null.</param>
        /// <returns>Changed fields in path order; empty when the two trees are the same chart.</returns>
        public static List<ManifestFieldChange> Compare(Dictionary<string, object?>? before, Dictionary<string, object?>? after)
        {
            List<ManifestFieldChange> changes = new List<ManifestFieldChange>();
            Dictionary<string, object?> left = before ?? new Dictionary<string, object?>();
            Dictionary<string, object?> right = after ?? new Dictionary<string, object?>();

            // Organization fields other than the tree (description, mission, budgetFreezeMarginPercent, publish).
            Dictionary<string, object?> leftTop = left.Where(e => e.Key != "units").ToDictionary(e => e.Key, e => e.Value, StringComparer.Ordinal);
            Dictionary<string, object?> rightTop = right.Where(e => e.Key != "units").ToDictionary(e => e.Key, e => e.Value, StringComparer.Ordinal);
            changes.AddRange(SpecDiff.Compare(leftTop, rightTop));

            Dictionary<string, Dictionary<string, object?>> leftUnits = new Dictionary<string, Dictionary<string, object?>>(StringComparer.OrdinalIgnoreCase);
            Dictionary<string, string?> leftParents = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            Dictionary<string, Dictionary<string, object?>> rightUnits = new Dictionary<string, Dictionary<string, object?>>(StringComparer.OrdinalIgnoreCase);
            Dictionary<string, string?> rightParents = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            Collect(left.TryGetValue("units", out object? lu) ? lu : null, null, leftUnits, leftParents);
            Collect(right.TryGetValue("units", out object? ru) ? ru : null, null, rightUnits, rightParents);

            foreach (string name in leftUnits.Keys.Union(rightUnits.Keys, StringComparer.OrdinalIgnoreCase).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                leftUnits.TryGetValue(name, out Dictionary<string, object?>? was);
                rightUnits.TryGetValue(name, out Dictionary<string, object?>? now);
                string display = now != null ? Name(now) : Name(was!);
                string path = "units." + display;
                if (was == null || now == null)
                {
                    // One entry for a unit that appears or disappears, with what it held, instead of one per field.
                    changes.Add(new ManifestFieldChange(path, was == null ? null : Summary(was, leftParents[name]), now == null ? null : Summary(now, rightParents[name])));
                    continue;
                }
                string? wasParent = leftParents[name];
                string? nowParent = rightParents[name];
                if (!String.Equals(wasParent ?? String.Empty, nowParent ?? String.Empty, StringComparison.OrdinalIgnoreCase)) changes.Add(new ManifestFieldChange(path + ".parent", wasParent, nowParent));
                CompareUnit(path, was, now, changes);
            }
            return changes.OrderBy(c => c.Field, StringComparer.Ordinal).ToList();
        }

        #endregion

        #region Private-Methods

        private static void Collect(object? units, string? parent, Dictionary<string, Dictionary<string, object?>> output, Dictionary<string, string?> parents)
        {
            if (units is not List<object?> list) return;
            foreach (object? entry in list)
            {
                if (entry is not Dictionary<string, object?> unit) continue;
                string name = Name(unit);
                if (name.Length == 0 || output.ContainsKey(name)) continue;
                output[name] = unit;
                parents[name] = parent;
                Collect(unit.TryGetValue("units", out object? children) ? children : null, name, output, parents);
            }
        }

        private static void CompareUnit(string path, Dictionary<string, object?> was, Dictionary<string, object?> now, List<ManifestFieldChange> changes)
        {
            foreach (string key in was.Keys.Union(now.Keys, StringComparer.Ordinal).Distinct(StringComparer.Ordinal))
            {
                if (key == "name" || key == "units") continue;
                was.TryGetValue(key, out object? a);
                now.TryGetValue(key, out object? b);
                string field = path + "." + key;
                switch (key)
                {
                    case "members":
                        CompareKeyed(field, a, b, "agent", changes);
                        break;
                    case "budgets":
                        CompareKeyed(field, a, b, "period", changes);
                        break;
                    case "peers":
                        CompareSet(field, a, b, changes);
                        break;
                    default:
                        Dictionary<string, object?> x = new Dictionary<string, object?>(StringComparer.Ordinal);
                        Dictionary<string, object?> y = new Dictionary<string, object?>(StringComparer.Ordinal);
                        if (a != null) x[key] = a;
                        if (b != null) y[key] = b;
                        foreach (ManifestFieldChange change in SpecDiff.Compare(x, y)) changes.Add(new ManifestFieldChange(path + "." + change.Field, change.Before, change.After));
                        break;
                }
            }
        }

        private static void CompareKeyed(string path, object? before, object? after, string keyField, List<ManifestFieldChange> changes)
        {
            Dictionary<string, Dictionary<string, object?>> left = Keyed(before, keyField);
            Dictionary<string, Dictionary<string, object?>> right = Keyed(after, keyField);
            foreach (string key in left.Keys.Union(right.Keys, StringComparer.OrdinalIgnoreCase).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                left.TryGetValue(key, out Dictionary<string, object?>? was);
                right.TryGetValue(key, out Dictionary<string, object?>? now);
                string display = Text(now != null ? now[keyField] : was![keyField]);
                string field = path + "." + display;
                if (was == null || now == null)
                {
                    changes.Add(new ManifestFieldChange(field, was == null ? null : Entry(was, keyField), now == null ? null : Entry(now, keyField)));
                    continue;
                }
                Dictionary<string, object?> x = was.Where(e => e.Key != keyField).ToDictionary(e => e.Key, e => e.Value, StringComparer.Ordinal);
                Dictionary<string, object?> y = now.Where(e => e.Key != keyField).ToDictionary(e => e.Key, e => e.Value, StringComparer.Ordinal);
                foreach (ManifestFieldChange change in SpecDiff.Compare(x, y)) changes.Add(new ManifestFieldChange(field + "." + change.Field, change.Before, change.After));
            }
        }

        private static void CompareSet(string path, object? before, object? after, List<ManifestFieldChange> changes)
        {
            List<string> left = Values(before);
            List<string> right = Values(after);
            foreach (string removed in left.Where(v => !right.Contains(v, StringComparer.OrdinalIgnoreCase))) changes.Add(new ManifestFieldChange(path + "." + removed, removed, null));
            foreach (string added in right.Where(v => !left.Contains(v, StringComparer.OrdinalIgnoreCase))) changes.Add(new ManifestFieldChange(path + "." + added, null, added));
        }

        private static Dictionary<string, Dictionary<string, object?>> Keyed(object? value, string keyField)
        {
            Dictionary<string, Dictionary<string, object?>> result = new Dictionary<string, Dictionary<string, object?>>(StringComparer.OrdinalIgnoreCase);
            if (value is not List<object?> list) return result;
            foreach (object? entry in list)
            {
                if (entry is not Dictionary<string, object?> map) continue;
                string key = map.TryGetValue(keyField, out object? k) ? Text(k) : String.Empty;
                if (key.Length == 0 || result.ContainsKey(key)) continue;
                result[key] = map;
            }
            return result;
        }

        private static List<string> Values(object? value)
        {
            List<string> result = new List<string>();
            if (value is not List<object?> list) return result;
            foreach (object? entry in list)
            {
                string text = Text(entry);
                if (text.Length > 0 && !result.Contains(text, StringComparer.OrdinalIgnoreCase)) result.Add(text);
            }
            return result;
        }

        private static string Name(Dictionary<string, object?> unit)
        {
            return unit.TryGetValue("name", out object? name) ? Text(name) : String.Empty;
        }

        private static string Text(object? value)
        {
            return value == null ? String.Empty : TemplateValues.ToText(value).Trim();
        }

        private static string Entry(Dictionary<string, object?> entry, string keyField)
        {
            List<string> parts = entry.Where(e => e.Key != keyField && e.Value != null).Select(e => e.Key + " " + Text(e.Value)).ToList();
            string key = Text(entry.TryGetValue(keyField, out object? k) ? k : null);
            return parts.Count == 0 ? key : key + " (" + String.Join(", ", parts) + ")";
        }

        private static string Summary(Dictionary<string, object?> unit, string? parent)
        {
            List<string> parts = new List<string>();
            if (unit.TryGetValue("lead", out object? lead) && lead != null) parts.Add("lead " + Text(lead));
            List<string> members = Keyed(unit.TryGetValue("members", out object? m) ? m : null, "agent").Keys.ToList();
            if (members.Count > 0) parts.Add("members " + String.Join(", ", members));
            List<string> peers = Values(unit.TryGetValue("peers", out object? p) ? p : null);
            if (peers.Count > 0) parts.Add("peers " + String.Join(", ", peers));
            List<string> budgets = Keyed(unit.TryGetValue("budgets", out object? b) ? b : null, "period").Values.Select(e => Entry(e, "period")).ToList();
            if (budgets.Count > 0) parts.Add("budgets " + String.Join(", ", budgets));
            if (parent != null) parts.Add("under " + parent);
            return "unit " + Name(unit) + (parts.Count > 0 ? " (" + String.Join("; ", parts) + ")" : String.Empty);
        }

        #endregion
    }
}
