namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;

    /// <summary>Copies one named endpoint from worker-owned Mux configuration into the run's private configuration.</summary>
    public static class MuxEndpointPreparer
    {
        /// <summary>Prepare named endpoints; legacy deployments with an explicitly rendered endpoint are unchanged.</summary>
        /// <param name="spec">Compiled execution.</param>
        /// <param name="configDirectory">Worker-owned Mux directory, or null for GARRISON_WORKER_MUX_CONFIG_DIRECTORY, MUX_CONFIG_DIR, then ~/.mux.</param>
        /// <param name="environment">Run environment; receives variables referenced by the selected endpoint only.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Worker-local credentials to add to output redaction.</returns>
        /// <exception cref="InvalidOperationException">The selected endpoint or a referenced variable is missing.</exception>
        /// <exception cref="IOException">The worker's configuration cannot be read.</exception>
        public static async Task<List<string>> PrepareAsync(ExecutionSpec spec, string? configDirectory, Dictionary<string, string> environment, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            List<string> secrets = new List<string>();
            if (spec.HarnessType != HarnessTypeEnum.Mux || spec.Files.Any(f => f.Path == "mux/endpoints.json")) return secrets;
            int index = spec.Arguments.FindIndex(a => a == "-e" || a == "--endpoint");
            if (index < 0 || index + 1 >= spec.Arguments.Count) return secrets;
            string name = spec.Arguments[index + 1];
            string root = configDirectory ?? Environment.GetEnvironmentVariable("GARRISON_WORKER_MUX_CONFIG_DIRECTORY")
                ?? Environment.GetEnvironmentVariable("MUX_CONFIG_DIR") ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".mux");
            string path = Path.Combine(root, "endpoints.json");
            if (!File.Exists(path)) throw new InvalidOperationException("Mux endpoint '" + name + "' cannot be loaded: configure endpoints.json on this execution worker (MUX_CONFIG_DIR or GARRISON_WORKER_MUX_CONFIG_DIRECTORY).");
            JsonSerializerOptions options = new JsonSerializerOptions(Serializer.Options) { AllowTrailingCommas = true, ReadCommentHandling = JsonCommentHandling.Skip };
            MuxEndpointCatalog? catalog = JsonSerializer.Deserialize<MuxEndpointCatalog>(await File.ReadAllTextAsync(path, token).ConfigureAwait(false), options);
            MuxEndpointDefinition? endpoint = catalog?.Endpoints.FirstOrDefault(e => String.Equals(e.Name, name, StringComparison.OrdinalIgnoreCase));
            if (endpoint == null) throw new InvalidOperationException("Mux endpoint '" + name + "' is not configured on this execution worker. Add that named endpoint to its endpoints.json or choose a configured endpoint name.");
            if (!String.IsNullOrEmpty(endpoint.ApiKey)) secrets.Add(endpoint.ApiKey);
            if (endpoint.Headers != null) secrets.AddRange(endpoint.Headers.Values);
            string content = Serializer.Serialize(new MuxEndpointCatalog { Endpoints = new List<MuxEndpointDefinition> { endpoint } });
            foreach (Match reference in Regex.Matches(content, @"\$\{([A-Za-z_][A-Za-z0-9_]*)\}"))
            {
                string variable = reference.Groups[1].Value;
                string? value = environment.TryGetValue(variable, out string? bound) ? bound : Environment.GetEnvironmentVariable(variable);
                if (String.IsNullOrEmpty(value)) throw new InvalidOperationException("Mux endpoint '" + name + "' requires environment variable " + variable + " on the execution worker.");
                environment[variable] = value;
                secrets.Add(value);
            }
            spec.Files.Add(new ExecutionFile { BaseDirectory = FileBaseDirectoryEnum.Config, Path = "mux/endpoints.json", Content = content, IsSecret = true, Mode = "600" });
            return secrets;
        }
    }
}
